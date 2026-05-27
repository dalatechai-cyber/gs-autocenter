#!/usr/bin/env node
// Encode all PNG renders to WebP at quality 78. Generates LQIP + hero WebP per stage.

import { execSync } from 'node:child_process';
import { readdirSync, mkdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const STAGES = ['exterior', 'engine_approach', 'engine_bay', 'underneath'];
const SRC_ROOT = 'tmp/renders';
const OUT_ROOT = 'public/models/lc300-360';

// Note: started at 78 per task brief; 78 produced 5.99 MB and 70 produced 5.11 MB,
// both over the 5 MB budget. q=65 lands at 4.85 MB total for 240 frames.
const WEBP_QUALITY = Number(process.env.WEBP_QUALITY ?? 65);
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
  if (existsSync(heroSrc)) {
    const lqipOut = path.join(outDir, 'lqip.webp');
    execSync(`${QUOTED_CWEBP} -q 30 -resize 320 0 "${heroSrc}" -o "${lqipOut}"`, { stdio: 'pipe' });
    console.log(`  ${stage} lqip: ${(statSync(lqipOut).size / 1024).toFixed(0)} KB`);

    // Hero WebP for SSR fallback (Googlebot understands WebP)
    const heroOut = path.join(outDir, 'hero.webp');
    execSync(`${QUOTED_CWEBP} -q 85 -resize 1280 0 "${heroSrc}" -o "${heroOut}"`, { stdio: 'pipe' });
    console.log(`  ${stage} hero.webp: ${(statSync(heroOut).size / 1024).toFixed(0)} KB`);
  }
}

console.log(`TOTAL WebP bytes: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
if (totalBytes > 5 * 1024 * 1024) {
  console.error(`OVER BUDGET (5 MB limit)`);
  process.exit(1);
}
