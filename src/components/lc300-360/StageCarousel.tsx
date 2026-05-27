'use client';

import { useEffect, useMemo } from 'react';
import { useFrameSequence } from './hooks/useFrameSequence';
import { useDragRotate } from './hooks/useDragRotate';
import { useBandwidth } from './hooks/useBandwidth';
import { framePath } from './data/paths';
import type { StageManifest } from './data/types';

interface Props {
  stage: StageManifest;
  onFrameChange: (frame: number) => void;
  ariaLabel: string;
}

export function StageCarousel({ stage, onFrameChange, ariaLabel }: Props) {
  const network = useBandwidth();
  // Lower memory cap on data-saver / 2g/3g so the cache doesn't OOM low-end Android.
  const maxBytes = network === 'minimal' ? 60_000_000
                 : network === 'reduced' ? 90_000_000
                                         : 120_000_000;
  const { totalFrames, loadedFrames, getFrame } = useFrameSequence({
    frameCount: stage.frameCount,
    pathPattern: stage.framePathPattern,
    skip: network === 'minimal' ? 8 : network === 'reduced' ? 6 : 4,
    reducePreload: network !== 'full',
    width: stage.width,
    height: stage.height,
    maxBytes,
  });
  const { frame, dragging, onPointerDown, onPointerMove, onPointerUp, setFrame } =
    useDragRotate({ frameCount: stage.frameCount, pixelsPerFrame: 4 });

  useEffect(() => { onFrameChange(frame); }, [frame, onFrameChange]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft')       setFrame(frame - step);
      else if (e.key === 'ArrowRight') setFrame(frame + step);
      else if (e.key === 'Home')       setFrame(0);
      else if (e.key === 'End')        setFrame(stage.frameCount - 1);
      else return;
      e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [frame, stage.frameCount, setFrame]);

  const currentImg = getFrame(frame);
  const nearestLoadedFrame = useMemo(() => {
    if (currentImg) return frame;
    for (let d = 1; d < totalFrames / 2; d++) {
      if (getFrame((frame - d + totalFrames) % totalFrames)) return (frame - d + totalFrames) % totalFrames;
      if (getFrame((frame + d) % totalFrames))               return (frame + d) % totalFrames;
    }
    return -1;
  }, [frame, currentImg, getFrame, totalFrames]);

  const angleDeg = Math.round((frame / totalFrames) * 360);
  const reducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      role="img"
      aria-label={`${ariaLabel} (${angleDeg} градус)`}
      aria-roledescription="drag-to-rotate carousel"
      aria-keyshortcuts="ArrowLeft ArrowRight Home End"
      tabIndex={0}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${stage.width} / ${stage.height}`,
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'grab',
        background: '#0a0a0c',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img
        src={stage.lqipPath}
        alt=""
        aria-hidden
        width={stage.width}
        height={stage.height}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'contain',
          filter: 'blur(8px) saturate(0.9)',
          opacity: loadedFrames === 0 ? 1 : 0,
          transition: reducedMotion ? 'none' : 'opacity 0.4s',
        }}
      />
      {nearestLoadedFrame >= 0 && (
        <img
          src={framePath('', nearestLoadedFrame, stage.framePathPattern)}
          alt=""
          aria-hidden
          draggable={false}
          width={stage.width}
          height={stage.height}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
      )}
      {loadedFrames < totalFrames && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: `${(loadedFrames / totalFrames) * 100}%`,
          height: 2, background: '#ff3a2a',
          transition: reducedMotion ? 'none' : 'width 0.15s',
        }} />
      )}
      <span
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
          overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
        }}
      >
        {ariaLabel} — кадр {frame + 1} / {totalFrames}
      </span>
    </div>
  );
}
