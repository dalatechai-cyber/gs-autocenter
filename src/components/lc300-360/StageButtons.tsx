'use client';

import type { Stage } from './data/types';
import { STAGE_LABELS, STAGE_ORDER } from './data/types';

interface Props {
  stage: Stage;
  onChange: (s: Stage) => void;
}

export function StageButtons({ stage, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Машины үзэх булан"
      style={{
        display: 'flex', gap: 8, padding: 8,
        background: 'rgba(0,0,0,0.55)', borderRadius: 999,
        backdropFilter: 'blur(8px)',
      }}
    >
      {STAGE_ORDER.map((s) => {
        const active = s === stage;
        return (
          <button
            key={s}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s)}
            style={{
              padding: '10px 18px', borderRadius: 999,
              border: 'none', cursor: 'pointer',
              background: active ? '#ff3a2a' : 'transparent',
              color: 'white', fontWeight: 600, fontSize: 14,
              transition: 'background 0.2s',
            }}
          >
            {STAGE_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}
