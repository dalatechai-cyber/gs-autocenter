import { useCallback, useRef, useState } from 'react';

interface Options {
  frameCount: number;
  pixelsPerFrame?: number;
}

interface Result {
  frame: number;
  dragging: boolean;
  setFrame: (f: number) => void;
  onPointerDown: (e: PointerEvent | React.PointerEvent) => void;
  onPointerMove: (e: PointerEvent | React.PointerEvent) => void;
  onPointerUp:   (e: PointerEvent | React.PointerEvent) => void;
}

export function useDragRotate({ frameCount, pixelsPerFrame = 4 }: Options): Result {
  const [frame, setFrameState] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartFrameRef = useRef(0);
  const dragStartXRef = useRef(0);
  const draggingRef = useRef(false);

  const wrap = (n: number) => {
    const r = n % frameCount;
    return r < 0 ? r + frameCount : r;
  };

  const setFrame = useCallback((f: number) => setFrameState(wrap(Math.round(f))), [frameCount]);

  const onPointerDown = useCallback((e: PointerEvent | React.PointerEvent) => {
    draggingRef.current = true;
    setDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartFrameRef.current = frame;
    const target = e.target as Element | null;
    if (target && 'setPointerCapture' in target && 'pointerId' in e) {
      try { (target as Element & { setPointerCapture: (id: number) => void }).setPointerCapture(e.pointerId); } catch {}
    }
  }, [frame]);

  const onPointerMove = useCallback((e: PointerEvent | React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    const deltaFrames = Math.round(dx / pixelsPerFrame);
    setFrameState(wrap(dragStartFrameRef.current + deltaFrames));
  }, [pixelsPerFrame, frameCount]);

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
    setDragging(false);
  }, []);

  return { frame, dragging, setFrame, onPointerDown, onPointerMove, onPointerUp };
}
