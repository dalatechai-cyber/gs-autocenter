import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { framePath } from '../data/paths';

interface Options {
  frameCount: number;
  pathPattern: string;
  skip?: number;
  reducePreload?: boolean;
  /** Image width in px (for memory-cap math). Defaults to 1280. */
  width?: number;
  /** Image height in px. Defaults to 720. */
  height?: number;
  /**
   * Soft cap on retained decoded-image bytes. Once exceeded, least-recently-used
   * frames are evicted by setting `img.src = ''` (releases the decoded bitmap).
   * Default: 120 MB — keeps ~32 frames at 1280x720 RGBA.
   */
  maxBytes?: number;
}

interface Result {
  totalFrames: number;
  /** Currently retained (not evicted) frame count. */
  loadedFrames: number;
  /**
   * Get the image element for a frame. Touching a loaded frame promotes it in
   * the LRU so it survives the next eviction round. If the frame was previously
   * evicted, a background re-fetch is kicked off and `null` is returned until
   * the re-fetch completes.
   */
  getFrame: (i: number) => HTMLImageElement | null;
  isLoaded: (i: number) => boolean;
}

export function useFrameSequence(opts: Options): Result {
  const {
    frameCount, pathPattern, skip = 4, reducePreload = false,
    width = 1280, height = 720, maxBytes = 120_000_000,
  } = opts;

  const framesRef = useRef<(HTMLImageElement | null)[]>(new Array(frameCount).fill(null));
  // LRU order: oldest at front, most-recently-used at back.
  const lruRef = useRef<number[]>([]);
  const evictTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Set<number>>(new Set());
  const cancelledRef = useRef(false);
  const activeLoadsRef = useRef(0);
  const queueRef = useRef<number[]>([]);
  const [retainedCount, setRetainedCount] = useState(0);
  // Stable ref to pump so finish() can call it without creating a forward
  // reference to the const declaration — React Compiler flags const-TDZ issues.
  const pumpRef = useRef<() => void>(() => {});

  // Compute frame cap. Floor of 2 prevents pathological zero-retention on absurdly tiny budgets
  // while still honouring small caps (e.g. 12 MB → ~3 frames at 1280x720) the way callers expect.
  const maxRetained = useMemo(
    () => Math.max(2, Math.floor(maxBytes / (width * height * 4))),
    [maxBytes, width, height],
  );

  const evictIfOverCap = useCallback(() => {
    let evicted = 0;
    while (lruRef.current.length > maxRetained) {
      const oldest = lruRef.current.shift()!;
      const img = framesRef.current[oldest];
      if (img) {
        img.src = '';  // release decoded bitmap
        framesRef.current[oldest] = null;
        evicted += 1;
      }
    }
    if (evicted > 0) {
      setRetainedCount(lruRef.current.length);
    }
  }, [maxRetained]);

  // Schedule eviction as a macrotask so React commits load state and any
  // synchronous `getFrame` touches from consumers get to promote LRU entries
  // *before* we evict. Coalesces multiple loads into one eviction pass.
  const scheduleEviction = useCallback(() => {
    if (evictTimerRef.current != null) return;
    evictTimerRef.current = setTimeout(() => {
      evictTimerRef.current = null;
      evictIfOverCap();
    }, 0);
  }, [evictIfOverCap]);

  const loadOrder = useMemo(() => {
    const order: number[] = [];
    let step = skip;
    const seen = new Set<number>();
    while (step >= 1) {
      for (let i = 0; i < frameCount; i += step) {
        if (!seen.has(i)) { order.push(i); seen.add(i); }
      }
      if (step === 1) break;
      step = Math.max(1, Math.floor(step / 2));
    }
    return order;
  }, [frameCount, skip]);

  const pump = useCallback(() => {
    // Guard against SSR: getFrame on cache miss calls requestLoad → pump,
    // which instantiates `new Image()` (DOM-only). Without this guard every
    // request to a page using this hook returns HTTP 500 from Next.js,
    // hidden behind client-side hydration that re-renders successfully.
    if (typeof window === 'undefined') return;
    const maxConcurrent = reducePreload ? 2 : 6;
    while (
      activeLoadsRef.current < maxConcurrent
      && queueRef.current.length > 0
      && !cancelledRef.current
    ) {
      const idx = queueRef.current.shift()!;
      if (framesRef.current[idx] || inFlightRef.current.has(idx)) continue;
      inFlightRef.current.add(idx);
      activeLoadsRef.current += 1;
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      const finish = (loaded: boolean) => {
        if (cancelledRef.current) return;
        inFlightRef.current.delete(idx);
        if (loaded) {
          framesRef.current[idx] = img;
          lruRef.current.push(idx);
          setRetainedCount(lruRef.current.length);
          scheduleEviction();
        }
        activeLoadsRef.current -= 1;
        // Call via stable ref so there is no forward-reference to the `pump`
        // const — React Compiler treats const-TDZ self-references as errors.
        // pumpRef is kept in sync with the latest pump closure via the effect below.
        pumpRef.current();
      };
      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = framePath('', idx, pathPattern);
    }
  }, [pathPattern, reducePreload, scheduleEviction]);

  // Keep pumpRef in sync in an effect (never during render) so the React
  // Compiler doesn't flag a ref.current write outside of render boundaries.
  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  const requestLoad = useCallback((i: number) => {
    if (i < 0 || i >= frameCount) return;
    if (framesRef.current[i] || inFlightRef.current.has(i)) return;
    // Prioritise this frame: push to the *front* of the queue so the next pump picks it up.
    queueRef.current.unshift(i);
    pump();
  }, [frameCount, pump]);

  useEffect(() => {
    cancelledRef.current = false;
    queueRef.current = [...loadOrder];
    pump();
    return () => {
      cancelledRef.current = true;
      if (evictTimerRef.current != null) {
        clearTimeout(evictTimerRef.current);
        evictTimerRef.current = null;
      }
    };
  }, [loadOrder, pump]);

  const getFrame = useCallback((i: number) => {
    const img = framesRef.current[i];
    if (img) {
      // Promote in LRU.
      const lru = lruRef.current;
      const at = lru.indexOf(i);
      if (at >= 0 && at < lru.length - 1) {
        lru.splice(at, 1);
        lru.push(i);
      }
      return img;
    }
    // Cache miss — kick off a background re-fetch so the next render can show it.
    requestLoad(i);
    return null;
  }, [requestLoad]);

  const isLoaded = useCallback((i: number) => framesRef.current[i] !== null, []);

  return { totalFrames: frameCount, loadedFrames: retainedCount, getFrame, isLoaded };
}
