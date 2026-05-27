export type Stage = 'exterior' | 'engine_approach' | 'engine_bay' | 'underneath';

export interface HotspotProjection {
  id: string;
  x: number;
  y: number;
  /** True if hotspot is inside the camera frustum this frame */
  in_frame?: boolean;
  /** True if hotspot is in-frame AND not occluded by car geometry */
  visible: boolean;
}

export interface StageManifest {
  frameCount: number;
  width: number;
  height: number;
  framePathPattern: string;
  lqipPath: string;
  heroPath: string;
  avgFrameKB: number;
  totalKB: number;
  hotspotProjections: HotspotProjection[][];
  /** True if Blender's --background ray_cast was degenerate; in-frame check is the only gate */
  occlusionDegenerate?: boolean;
}

export interface Manifest {
  version: number;
  generatedAt: string;
  stages: Record<Stage, StageManifest>;
}

export interface Hotspot {
  id: string;
  stage: Stage;
  titleMn: string;
  descriptionMn: string;
}

export const CTA_PHONE_DISPLAY = '+976 77-200-570';
export const CTA_PHONE_TEL = 'tel:+97677200570';

export const STAGE_LABELS: Record<Stage, string> = {
  exterior:        'Гадна тал',
  engine_approach: 'Капот руу',
  engine_bay:      'Хөдөлгүүр',
  underneath:      'Доод тал',
};

export const STAGE_ORDER: Stage[] = [
  'exterior', 'engine_approach', 'engine_bay', 'underneath',
];
