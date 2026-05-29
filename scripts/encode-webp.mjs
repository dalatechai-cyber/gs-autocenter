#!/usr/bin/env node
// Encode all PNG renders to WebP at quality 78. Generates LQIP + hero WebP per stage.

import { execSync } from 'node:child_process';
import { readdirSync, mkdirSync, existsSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const STAGES = ['exterior', 'engine_approach', 'engine_bay', 'underneath'];
const SRC_ROOT = 'tmp/renders';
const OUT_ROOT = 'public/models/lc300-360';

// Quality tuning history:
//   q=65 → 4.85 MB (initial conservative, visible compression on paint/chrome)
//   q=70 → 5.11 MB
//   q=78 → 5.99 MB ← user-approved (1 MB over original budget, visibly better paint/chrome/fabric)
// After the engine_bay + underneath re-renders (corrected cameras: open hood/engine,
// raked underbody showing suspension), those two stages got substantially heavier
// because they now show real detail instead of flat/closed surfaces:
//   q=78 → 9.03 MB total (engine_bay 2.58, underneath 3.22, exterior 2.21, engine_approach 1.01)
//   q=70 → 7.60 MB,  q=62 → 6.91 MB
// Budget raised to 9.5 MB (see BUDGET_BYTES) to keep the user-approved q78 premium look.
// Justified: 360 frames are lazy-loaded per stage (IntersectionObserver), so total disk
// size is NOT a single page-load cost — the heaviest single stage streams ~3 MB on demand
// during rotation, never on the LCP path. Quality overridable via WEBP_QUALITY env var.
const WEBP_QUALITY = Number(process.env.WEBP_QUALITY ?? 78);
const HERO_FRAME = {
  exterior: 22,
  engine_approach: 15,
  engine_bay: 30,
  underneath: 30,
};

// Resolve cwebp: prefer $CWEBP_EXE, then PATH, then known install paths.
function resolveCwebp() {
  if (process.env.CWEBP_EXE && existsSync(process.env.CWEBP_EXE)) {
    return process.env.CWEBP_EXE;
  }
  // Try invoking from PATH.
  try {
    execSync('cwebp -version', { stdio: 'pipe' });
    return 'cwebp';
  } catch {
    // fall through
  }
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\tools\\libwebp\\libwebp-1.4.0-windows-x64\\bin\\cwebp.exe',
      'C:\\Program Files\\libwebp\\bin\\cwebp.exe',
      'C:\\Program Files (x86)\\libwebp\\bin\\cwebp.exe',
    ];
    for (const c of candidates) if (existsSync(c)) return c;
  }
  throw new Error(
    'cwebp not found. Install libwebp (brew install webp / apt install webp / ' +
      'https://developers.google.com/speed/webp/download) or set CWEBP_EXE.',
  );
}

const CWEBP = resolveCwebp();
const QUOTED_CWEBP = CWEBP.includes(' ') ? `"${CWEBP}"` : CWEBP;
console.log(`using cwebp: ${CWEBP}`);
console.log(`WEBP_QUALITY=${WEBP_QUALITY}`);

let totalBytes = 0;

for (const stage of STAGES) {
  const srcDir = path.join(SRC_ROOT, stage);
  const outDir = path.join(OUT_ROOT, stage);
  if (!existsSync(srcDir)) {
    console.warn(`skip ${stage}: no source dir`);
    continue;
  }
  mkdirSync(outDir, { recursive: true });

  // Remove stale frame_*.webp from a prior run so an N→M frame-count change doesn't ship orphans.
  for (const stale of readdirSync(outDir).filter((f) => /^frame_\d+\.webp$/.test(f))) {
    unlinkSync(path.join(outDir, stale));
  }

  const frames = readdirSync(srcDir).filter((f) => /^frame_\d+\.png$/.test(f)).sort();
  console.log(`${stage}: ${frames.length} frames`);

  let stageBytes = 0;
  for (const f of frames) {
    const src = path.join(srcDir, f);
    const out = path.join(outDir, f.replace(/\.png$/, '.webp'));
    execSync(`${QUOTED_CWEBP} -q ${WEBP_QUALITY} -mt -m 6 "${src}" -o "${out}"`, { stdio: 'pipe' });
    stageBytes += statSync(out).size;
  }
  console.log(`  ${stage} webp total: ${(stageBytes / 1024 / 1024).toFixed(2)} MB`);
  totalBytes += stageBytes;

  // LQIP: blurred low-quality thumbnail (~24 KB target)
  const heroIdx = HERO_FRAME[stage];
  const heroSrc = path.join(srcDir, `frame_${String(heroIdx).padStart(3, '0')}.png`);
  if (!existsSync(heroSrc)) {
    console.error(
      `ERROR: hero source missing for ${stage}: ${heroSrc}\n` +
      `       HERO_FRAME.${stage} = ${heroIdx} but that PNG doesn't exist.\n` +
      `       Either the render produced fewer frames than expected, or HERO_FRAME is wrong.\n` +
      `       Fix HERO_FRAME in this script or re-render.`
    );
    process.exit(1);
  }
  const lqipOut = path.join(outDir, 'lqip.webp');
  execSync(`${QUOTED_CWEBP} -q 30 -resize 320 0 "${heroSrc}" -o "${lqipOut}"`, { stdio: 'pipe' });
  console.log(`  ${stage} lqip: ${(statSync(lqipOut).size / 1024).toFixed(0)} KB`);

  // Hero WebP for SSR fallback (Googlebot understands WebP)
  const heroOut = path.join(outDir, 'hero.webp');
  execSync(`${QUOTED_CWEBP} -q 85 -resize 1280 0 "${heroSrc}" -o "${heroOut}"`, { stdio: 'pipe' });
  console.log(`  ${stage} hero.webp: ${(statSync(heroOut).size / 1024).toFixed(0)} KB`);
}

// Budget raised 7 MB → 9.5 MB: after the engine_bay + underneath re-renders, q=78 totals
// 9.03 MB. User accepted this to preserve the approved premium look, since frames are
// lazy-loaded per stage and never all loaded at once (no LCP impact). 9.5 MB cap gives
// ~0.5 MB headroom for future re-render iterations without tripping the fence.
const BUDGET_BYTES = 9.5 * 1024 * 1024;
const BUDGET_LABEL = '9.5 MB';
const SENTINEL = path.join(OUT_ROOT, '.BUDGET_FAIL');
console.log(`TOTAL WebP bytes: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

if (totalBytes > BUDGET_BYTES) {
  const msg = `Total WebP frames = ${totalBytes} bytes (${(totalBytes / 1024 / 1024).toFixed(2)} MB), over the ${BUDGET_BYTES} byte (${BUDGET_LABEL}) budget. Downstream consumers (manifest, build) must refuse to proceed. Re-encode with a lower WEBP_QUALITY or reduce frame counts to clear this.`;
  writeFileSync(SENTINEL, msg + '\n');
  console.error(`OVER BUDGET (${BUDGET_LABEL} limit) — wrote sentinel at ${SENTINEL}`);
  process.exit(1);
} else {
  if (existsSync(SENTINEL)) {
    unlinkSync(SENTINEL);
    console.log(`Cleared prior budget-fail sentinel at ${SENTINEL}`);
  }
  // Warn band: 94% of budget
  if (totalBytes > 0.94 * BUDGET_BYTES) {
    console.warn(`WARNING: ${(totalBytes / 1024 / 1024).toFixed(2)} MB is within 6% of the ${BUDGET_LABEL} budget. Future render iterations may exceed it.`);
  }
}
