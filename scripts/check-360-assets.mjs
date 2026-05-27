#!/usr/bin/env node
// Fail `npm run build` if the LC300 360 assets are missing or out of sync with the manifest.
// Runs as `prebuild` so the failure is loud and early, not at runtime.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const MANIFEST = 'public/models/lc300-360/manifest.json';
const REQUIRED_STAGES = ['exterior', 'engine_approach', 'engine_bay', 'underneath'];
const REQUIRED_PER_STAGE = ['lqip.webp', 'hero.webp'];
const SENTINEL = 'public/models/lc300-360/.BUDGET_FAIL';

function fail(lines) {
  console.error('');
  console.error('================================================================');
  console.error('  LC300 360 assets check — FAIL');
  console.error('================================================================');
  for (const l of lines) console.error('  ' + l);
  console.error('');
  console.error('  To fix: render the Blender pipeline, then run:');
  console.error('    npm run build-360');
  console.error('');
  console.error('  See docs/superpowers/plans/2026-05-26-lc300-360-rendered-approach.md');
  console.error('  Phases 1 + 2 for the full pipeline.');
  console.error('================================================================');
  process.exit(1);
}

if (existsSync(SENTINEL)) {
  fail([
    `Budget-fail sentinel present: ${SENTINEL}`,
    `Last npm run encode-webp exceeded the 5 MB budget.`,
    `Re-encode with lower WEBP_QUALITY before building.`,
  ]);
}

// generate-manifest.mjs writes atomically via .tmp + rename. A stray .tmp means the
// previous generation was interrupted; the current manifest.json (if any) is stale.
if (existsSync(MANIFEST + '.tmp')) {
  fail([
    `Stale ${MANIFEST}.tmp present — previous manifest generation was interrupted.`,
    `Re-run: npm run build-360`,
  ]);
}

if (!existsSync(MANIFEST)) {
  fail([`Missing manifest: ${MANIFEST}`]);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
} catch (e) {
  fail([`Invalid JSON in ${MANIFEST}: ${e.message}`]);
}

const errors = [];

if (!manifest?.stages) {
  errors.push('manifest has no `stages` key');
}

for (const stage of REQUIRED_STAGES) {
  const m = manifest.stages?.[stage];
  if (!m) {
    errors.push(`stage missing in manifest: ${stage}`);
    continue;
  }
  const dir = path.join('public/models/lc300-360', stage);
  if (!existsSync(dir)) {
    errors.push(`stage directory missing: ${dir}`);
    continue;
  }

  const files = readdirSync(dir);
  const webpFrames = files.filter((f) => /^frame_\d+\.webp$/.test(f));
  if (webpFrames.length !== m.frameCount) {
    errors.push(
      `${stage}: manifest declares ${m.frameCount} frames, ${webpFrames.length} found on disk`,
    );
  }

  for (const required of REQUIRED_PER_STAGE) {
    const p = path.join(dir, required);
    if (!existsSync(p)) errors.push(`${stage}: ${required} missing`);
  }

  if (!Array.isArray(m.hotspotProjections) || m.hotspotProjections.length !== m.frameCount) {
    errors.push(`${stage}: hotspotProjections length mismatch`);
  }
}

if (errors.length) fail(errors);

console.log(`[asset-check] OK: ${REQUIRED_STAGES.length} stages valid`);
