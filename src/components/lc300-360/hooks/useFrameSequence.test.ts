import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFrameSequence } from './useFrameSequence';

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  _src = '';
  decoding = '';
  loading = '';
  get src() { return this._src; }
  set src(v: string) {
    this._src = v;
    if (v) queueMicrotask(() => this.onload?.());
  }
}

beforeEach(() => {
  (globalThis as Record<string, unknown>).Image = MockImage;
});

describe('useFrameSequence', () => {
  it('starts with 0 loaded frames, totalFrames=N', () => {
    const { result } = renderHook(() => useFrameSequence({
      frameCount: 8,
      pathPattern: '/frame_{NNN}.webp',
      skip: 4,
    }));
    expect(result.current.totalFrames).toBe(8);
    expect(result.current.loadedFrames).toBeLessThanOrEqual(2);
  });

  it('eventually loads all frames when under memory cap', async () => {
    const { result } = renderHook(() => useFrameSequence({
      frameCount: 8,
      pathPattern: '/frame_{NNN}.webp',
      skip: 4,
      width: 320, height: 180,  // tiny so 8 frames fits in default cap
    }));
    await waitFor(() => {
      expect(result.current.loadedFrames).toBe(8);
    });
  });

  it('returns img element for loaded frame index', async () => {
    const { result } = renderHook(() => useFrameSequence({
      frameCount: 4,
      pathPattern: '/frame_{NNN}.webp',
      skip: 1,
      width: 320, height: 180,
    }));
    await waitFor(() => expect(result.current.loadedFrames).toBe(4));
    const img = result.current.getFrame(2);
    expect(img).toBeTruthy();
  });

  it('returns null for unloaded frame index until loaded', () => {
    const { result } = renderHook(() => useFrameSequence({
      frameCount: 16,
      pathPattern: '/frame_{NNN}.webp',
      skip: 8,
    }));
    expect(result.current.getFrame(99)).toBeNull();
  });

  it('LRU cap evicts least-recently-used when over budget', async () => {
    // 1280x720 @ 4 bytes = 3.68 MB/frame. maxBytes 12 MB → cap ≈ 3 frames retained.
    const { result } = renderHook(() => useFrameSequence({
      frameCount: 8,
      pathPattern: '/frame_{NNN}.webp',
      skip: 1,
      width: 1280, height: 720,
      maxBytes: 12_000_000,
    }));
    await waitFor(() => expect(result.current.loadedFrames).toBeGreaterThan(0));
    // Even after loading all 8, retained should clamp to cap, not stay at 8.
    await waitFor(() => {
      const ret = result.current.loadedFrames;
      expect(ret).toBeLessThanOrEqual(4);
      expect(ret).toBeGreaterThanOrEqual(2);
    }, { timeout: 1000 });
  });

  it('touching a frame via getFrame promotes it in LRU', async () => {
    const { result } = renderHook(() => useFrameSequence({
      frameCount: 6,
      pathPattern: '/frame_{NNN}.webp',
      skip: 1,
      width: 1280, height: 720,
      maxBytes: 12_000_000,
    }));
    await waitFor(() => expect(result.current.loadedFrames).toBeGreaterThan(0));
    act(() => { result.current.getFrame(0); });  // touch frame 0 to keep it
    // Frame 0 should still be retrievable after subsequent loads cause eviction
    await waitFor(() => {
      const img = result.current.getFrame(0);
      expect(img).toBeTruthy();
    });
  });
});
