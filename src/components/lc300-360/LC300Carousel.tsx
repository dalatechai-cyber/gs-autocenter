'use client';

import { useEffect, useState } from 'react';
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
  // returnFocusTarget is kept in state (not a ref read during render) so the
  // React Compiler doesn't flag a ref.current access in the render path.
  const [returnFocusTarget, setReturnFocusTarget] = useState<HTMLElement | null>(null);
  // Capture component mount time at first render. useState's lazy initializer
  // runs exactly once, so performance.now() here is deterministic from React's
  // perspective — no re-evaluation on re-render. The React Compiler accepts
  // impure calls inside useState initializers because they have one-shot semantics.
  const [mountedAt] = useState(() => performance.now());
  const { track } = useAnalytics();

  useEffect(() => {
    if (manifest) return;
    fetch(MANIFEST_URL).then((r) => r.json()).then(setManifest);
  }, [manifest]);

  useEffect(() => {
    if (manifest) {
      track({ name: 'lc300_first_paint_ms', params: { value: Math.round(performance.now() - mountedAt) } });
    }
  }, [manifest, track, mountedAt]);

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
          setReturnFocusTarget(el);
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
        returnFocusTo={returnFocusTarget}
        onClose={() => setActiveHotspot(null)}
        onCtaClick={() => activeHotspot && track({
          name: 'lc300_cta_clicked',
          params: { hotspot_id: activeHotspot.id, stage }
        })}
      />
    </div>
  );
}
