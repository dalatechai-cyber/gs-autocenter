'use client';

import { useEffect, useRef } from 'react';
import { CTA_PHONE_DISPLAY, CTA_PHONE_TEL } from './data/types';
import type { Hotspot } from './data/types';

interface Props {
  hotspot: Hotspot | null;
  returnFocusTo: HTMLElement | null;
  onClose: () => void;
  onCtaClick?: () => void;
}

export function HotspotModal({ hotspot, returnFocusTo, onClose, onCtaClick }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!hotspot) return;
    const previousActive = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      (returnFocusTo ?? previousActive)?.focus?.();
    };
  }, [hotspot, onClose, returnFocusTo]);

  if (!hotspot) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`hotspot-title-${hotspot.id}`}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, 92vw)',
          background: '#121214', borderRadius: 16,
          padding: '24px 24px 20px', color: '#f5f5f5',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h3 id={`hotspot-title-${hotspot.id}`} style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          {hotspot.titleMn}
        </h3>
        <p style={{ margin: '12px 0 20px', fontSize: 14, lineHeight: 1.55, color: '#cdcdd2' }}>
          {hotspot.descriptionMn}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={CTA_PHONE_TEL}
            onClick={onCtaClick}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 999,
              background: '#ff3a2a', color: 'white', textAlign: 'center',
              textDecoration: 'none', fontWeight: 600, fontSize: 14,
            }}
          >
            Цаг захиалах · {CTA_PHONE_DISPLAY}
          </a>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            style={{
              padding: '12px 18px', borderRadius: 999,
              border: '1px solid #2e2e34', background: 'transparent',
              color: '#cdcdd2', cursor: 'pointer', fontSize: 14,
            }}
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
}
