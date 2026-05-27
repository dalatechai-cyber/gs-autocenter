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
  // Hero placeholder data — small strings passed from the Server Component
  // so the placeholder renders immediately without serializing the entire
  // 900 KB manifest into the HTML. The full manifest is fetched client-side
  // when the section enters the viewport.
  heroSrc?: string;
  heroWidth?: number;
  heroHeight?: number;
}

const STAGE_ARIA: Record<Stage, string> = {
  exterior:        'Land Cruiser 300 гадна тал',
  engine_approach: 'Land Cruiser 300 капот руу ойртох',
  engine_bay:      'Land Cruiser 300 хөдөлгүүрийн булан',
  underneath:      'Land Cruiser 300 доод тал',
};

export default function LC300Carousel({ heroSrc, heroWidth, heroHeight }: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
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

  // IntersectionObserver: defer heavy carousel mount until section nears viewport.
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch the full manifest only when the section nears the viewport.
  // This defers ~900 KB of JSON parsing (hotspot projections per frame)
  // until the user actually scrolls toward the LC300 explorer.
  useEffect(() => {
    if (!isVisible || manifest) return;
    fetch(MANIFEST_URL).then((r) => r.json()).then(setManifest);
  }, [isVisible, manifest]);

  useEffect(() => {
    if (manifest) {
      track({ name: 'lc300_first_paint_ms', params: { value: Math.round(performance.now() - mountedAt) } });
    }
  }, [manifest, track, mountedAt]);

  // Render the placeholder until the carousel is both visible AND has the
  // manifest. Both conditions are gated so we don't show the interactive
  // carousel before the manifest fetch resolves.
  const stageData = manifest?.stages[stage];
  const showInteractive = isVisible && manifest && stageData;

  return (
    <div ref={sectionRef} style={{ position: 'relative', width: '100%' }}>
      {showInteractive ? (
        <>
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
        </>
      ) : heroSrc && heroWidth && heroHeight ? (
        // Placeholder shown until the section nears viewport AND the manifest
        // arrives. Same dimensions as StageCarousel to prevent layout shift.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroSrc}
          alt="Land Cruiser 300"
          width={heroWidth}
          height={heroHeight}
          style={{ width: '100%', height: 'auto' }}
          loading="eager"
          fetchPriority="high"
        />
      ) : null}
      {/* HotspotModal is always mounted — hotspot=null renders it invisible.
          Keeping it outside the isVisible branch avoids conditional state issues. */}
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
