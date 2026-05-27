'use client';

import { useCallback } from 'react';

type GtagEvent =
  | { name: 'lc300_stage_changed';   params: { from: string; to: string } }
  | { name: 'lc300_hotspot_opened';  params: { hotspot_id: string; stage: string } }
  | { name: 'lc300_cta_clicked';     params: { hotspot_id: string; stage: string } }
  | { name: 'lc300_first_paint_ms';  params: { value: number } };

interface GtagWindow extends Window {
  gtag?: (action: 'event', name: string, params: Record<string, unknown>) => void;
}

export function useAnalytics() {
  const track = useCallback(<E extends GtagEvent>(event: E) => {
    if (typeof window === 'undefined') return;
    const w = window as GtagWindow;
    w.gtag?.('event', event.name, event.params);
  }, []);
  return { track };
}
