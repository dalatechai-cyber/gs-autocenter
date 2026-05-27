#!/usr/bin/env node
import { readFileSync, writeFileSync, renameSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const SRC_ROOT = 'tmp/renders';
const OUT_DIR = 'public/models/lc300-360';
const STAGES = ['exterior', 'engine_approach', 'engine_bay', 'underneath'];
const SENTINEL = path.join(OUT_DIR, '.BUDGET_FAIL');

// Refuse to generate a manifest if the encoder left a budget-fail sentinel.
if (existsSync(SENTINEL)) {
  console.error(`ERROR: ${SENTINEL} exists. The previous WebP encode exceeded the 5 MB budget.`);
  console.error('Re-run `npm run encode-webp` with a lower WEBP_QUALITY first.');
  process.exit(1);
}

const manifest = { version: 1, generatedAt: new Date().toISOString(), stages: {} };

for (const stage of STAGES) {
  const projPath = path.join(SRC_ROOT, stage, 'projections.json');
  if (!existsSync(projPath)) {
    console.warn(`skip ${stage}: no projections.json`);
    continue;
  }
  const proj = JSON.parse(readFileSync(projPath, 'utf8'));

  if (proj.complete === false) {
    console.error(`ERROR: ${stage} projections.json has complete=false — render did not finish cleanly.`);
    console.error(`       Re-run bash scripts/blender/render_stage.sh ${stage}`);
    process.exit(1);
  }

  const webpDir = path.join(OUT_DIR, stage);
  if (!existsSync(webpDir)) {
    console.error(`ERROR: ${webpDir} missing. Run npm run encode-webp first.`);
    process.exit(1);
  }
  const webpFrames = readdirSync(webpDir).filter((f) => /^frame_\d+\.webp$/.test(f));
  if (webpFrames.length !== proj.frameCount) {
    console.error(`ERROR: ${stage}: projections.json declares ${proj.frameCount} frames, ${webpFrames.length} webp files on disk.`);
    process.exit(1);
  }

  const totalBytes = webpFrames.reduce(
    (s, f) => s + statSync(path.join(webpDir, f)).size,
    0,
  );

  manifest.stages[stage] = {
    frameCount: proj.frameCount,
    width: proj.width,
    height: proj.height,
    framePathPattern: `/models/lc300-360/${stage}/frame_{NNN}.webp`,
    lqipPath: `/models/lc300-360/${stage}/lqip.webp`,
    heroPath: `/models/lc300-360/${stage}/hero.webp`,
    avgFrameKB: Math.round(totalBytes / proj.frameCount / 1024),
    totalKB: Math.round(totalBytes / 1024),
    // Older projections.json predates the occlusion fix — treat missing field as "not degenerate".
    occlusionDegenerate: proj.occlusionDegenerate ?? false,
    hotspotProjections: proj.perFrame,
  };
}

// Atomic write: stage to .tmp, then rename. Avoids leaving a truncated manifest if
// the process is killed mid-write.
const manifestPath = path.join(OUT_DIR, 'manifest.json');
const tmpPath = manifestPath + '.tmp';
writeFileSync(tmpPath, JSON.stringify(manifest, null, 2));
renameSync(tmpPath, manifestPath);
console.log('manifest written:', manifestPath);
console.log('totals:');
let grandTotalKB = 0;
for (const [s, d] of Object.entries(manifest.stages)) {
  console.log(`  ${s}: ${d.frameCount} frames, ${d.totalKB} KB, ${d.avgFrameKB} KB/frame avg, occlusionDegenerate=${d.occlusionDegenerate}`);
  grandTotalKB += d.totalKB;
}
console.log(`  GRAND TOTAL: ${grandTotalKB} KB across ${Object.keys(manifest.stages).length} stages`);
