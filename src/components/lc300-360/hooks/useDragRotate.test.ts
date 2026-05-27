import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragRotate } from './useDragRotate';

describe('useDragRotate', () => {
  it('starts at frame 0', () => {
    const { result } = renderHook(() => useDragRotate({ frameCount: 90, pixelsPerFrame: 4 }));
    expect(result.current.frame).toBe(0);
  });

  it('advances frame on rightward drag', () => {
    const { result } = renderHook(() => useDragRotate({ frameCount: 90, pixelsPerFrame: 4 }));
    act(() => {
      result.current.onPointerDown({ clientX: 100, target: document.body } as unknown as PointerEvent);
      result.current.onPointerMove({ clientX: 140 } as unknown as PointerEvent);
    });
    expect(result.current.frame).toBe(10);
  });

  it('wraps around at boundaries', () => {
    const { result } = renderHook(() => useDragRotate({ frameCount: 8, pixelsPerFrame: 4 }));
    act(() => {
      result.current.onPointerDown({ clientX: 0, target: document.body } as unknown as PointerEvent);
      result.current.onPointerMove({ clientX: -40 } as unknown as PointerEvent);
    });
    expect(result.current.frame).toBe(6);
  });

  it('setFrame jumps directly', () => {
    const { result } = renderHook(() => useDragRotate({ frameCount: 90, pixelsPerFrame: 4 }));
    act(() => result.current.setFrame(45));
    expect(result.current.frame).toBe(45);
  });
});
