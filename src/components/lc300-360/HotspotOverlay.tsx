'use client';

import { useMemo } from 'react';
import { hotspotById } from './data/hotspots';
import type { Hotspot, StageManifest } from './data/types';

interface Props {
  stage: StageManifest;
  frame: number;
  onSelect: (h: Hotspot, triggerEl: HTMLElement) => void;
}

export function HotspotOverlay({ stage, frame, onSelect }: Props) {
  const projections = stage.hotspotProjections[frame] ?? [];

  const items = useMemo(() => projections.map((p) => {
    const h = hotspotById(p.id);
    if (!h) return null;
    return { h, p };
  }).filter((x): x is { h: Hotspot; p: typeof projections[number] } => x !== null), [projections]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {items.map(({ h, p }) => (
        <button
          key={h.id}
          aria-label={`${h.titleMn} - үйлчилгээний мэдээлэл`}
          onClick={(e) => onSelect(h, e.currentTarget)}
          tabIndex={p.visible ? 0 : -1}
          style={{
            position: 'absolute',
            left: `${p.x * 100}%`,
            top:  `${p.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            opacity: p.visible ? 1 : 0,
            transition: 'opacity 0.25s',
            pointerEvents: p.visible ? 'auto' : 'none',
            width: 28, height: 28, borderRadius: '50%',
            background: '#ff3a2a',
            border: '2px solid white',
            cursor: 'pointer',
            boxShadow: '0 0 0 4px rgba(255,58,42,0.25), 0 4px 12px rgba(0,0,0,0.3)',
            padding: 0,
          }}
        >
          <span style={{
            position: 'absolute', left: 36, top: '50%', transform: 'translateY(-50%)',
            whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.78)', color: 'white',
            padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
            pointerEvents: 'none',
          }}>
            {h.titleMn}
          </span>
        </button>
      ))}
    </div>
  );
}
