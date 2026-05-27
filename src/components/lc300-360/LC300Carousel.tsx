'use client';

import { useEffect, useRef, useState } from 'react';
import { StageCarousel } from './StageCarousel';
import { HotspotOverlay } from './HotspotOverlay';
import { HotspotModal } from './HotspotModal';
import { StageButtons } from './StageButtons';
import { useStage } from './hooks/useStage';
import { useAnalytics } from './hooks/useAnalytics';
import { MANIFEST_URL } from './data/paths';
import type { Hotspot, Manifest, Stage } from './data/types';

interface Props {
  manifest?: Manifest;
}

const STAGE_ARIA: Record<Stage, string> = {
  exterior:        'Land Cruiser 300 гадна тал',
  engine_approach: 'Land Cruiser 300 капот руу ойртох',
  engine_bay:      'Land Cruiser 300 хөдөлгүүрийн булан',
  underneath:      'Land Cruiser 300 доод тал',
};

export default function LC300Carousel({ manifest: ssrManifest }: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(ssrManifest ?? null);
  const { stage, goTo } = useStage();
  const [frame, setFrame] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const firstPaintAt = useRef<number>(performance.now());
  const { track } = useAnalytics();

  useEffect(() => {
    if (manifest) return;
    fetch(MANIFEST_URL).then((r) => r.json()).then(setManifest);
  }, [manifest]);

  useEffect(() => {
    if (manifest) {
      track({ name: 'lc300_first_paint_ms', params: { value: Math.round(performance.now() - firstPaintAt.current) } });
    }
  }, [manifest, track]);

  if (!manifest) return null;

  const stageData = manifest.stages[stage];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <StageCarousel
        key={stage}
        stage={stageData}
        onFrameChange={setFrame}
        ariaLabel={STAGE_ARIA[stage]}
      />
      <HotspotOverlay
        stage={stageData}
        frame={frame}
        onSelect={(h, el) => {
          lastTriggerRef.current = el;
          setActiveHotspot(h);
          track({ name: 'lc300_hotspot_opened', params: { hotspot_id: h.id, stage } });
        }}
      />
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10,
      }}>
        <StageButtons
          stage={stage}
          onChange={(s) => {
            track({ name: 'lc300_stage_changed', params: { from: stage, to: s } });
            goTo(s);
            setFrame(0);
          }}
        />
      </div>
      <HotspotModal
        hotspot={activeHotspot}
        returnFocusTo={lastTriggerRef.current}
        onClose={() => setActiveHotspot(null)}
        onCtaClick={() => activeHotspot && track({
          name: 'lc300_cta_clicked',
          params: { hotspot_id: activeHotspot.id, stage }
        })}
      />
    </div>
  );
}
