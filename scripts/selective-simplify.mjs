// Per-mesh selective simplification for the LC300 GLB.
//
// Different parts of a car contribute different amounts to perceived
// quality: the main body sells the shape, wheels read at a glance, and
// internal/structural parts are practically invisible at the production
// camera angle. A flat ratio=0.5 over the whole model nukes hood and
// body silhouettes alongside parts no one will ever see.
//
// This script applies per-node ratios via gltf-transform's
// `simplifyPrimitive`, then welds + prunes + draco-encodes the result.
//
// Usage:
//   node scripts/selective-simplify.mjs <in.glb> <out.glb>
//
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  weld,
  prune,
  dedup,
  draco,
  textureCompress,
  simplifyPrimitive,
  getSceneVertexCount,
  VertexCountMethod,
} from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import draco3d from "draco3dgltf";
import sharp from "sharp";

const [inPath, outPath] = process.argv.slice(2);
if (!inPath || !outPath) {
  console.error("usage: node selective-simplify.mjs <in.glb> <out.glb>");
  process.exit(1);
}

// Per-node simplification ratios. Higher ratio = keep more verts.
// Anything not listed gets DEFAULT_RATIO.
//
// Strategy:
//   exterior body/hood (silhouette-critical) → keep 85%
//   wheels (always visible, but rotational symmetry hides decimation) → 70%
//   lights (complex inner geometry, mostly unseen detail) → 35%
//   engine bay (only visible in hood view) → 45%
//   suspension (hidden behind wheels/body) → 15%
//   interior (visible only through tinted glass at exterior angle) → 50%
//   structural supports → 15%
const RATIOS = {
  // exterior body & hood — silhouette critical
  "Main body": 0.85,
  "Bonnet_Full": 0.85,
  "Door_FL": 0.85,
  "Door_FR": 0.85,
  "Door_RL": 0.85,
  "Door_RR": 0.85,
  // wheels — geometric repetition tolerates simplification
  "Wheel_FL": 0.70,
  "Wheel_FR": 0.70,
  "Wheel_RL": 0.70,
  "Wheel_RR": 0.70,
  // lights — inner reflectors, not the outer lens silhouette
  "Front lights 1": 0.55,
  "Front lights 2": 0.35,
  "Tail lights 1": 0.35,
  "Tail lights 2": 0.55,
  // engine bay — only visible in hood view, mostly hidden parts
  "Engine_Block": 0.45,
  // hidden structural
  "Suspension_FL": 0.15,
  "Other parts": 0.15,
  "Support 1": 0.15,
  "Support 2": 0.15,
  // interior — visible through glass at the production camera angle
  "Seats": 0.50,
  "Dashboard": 0.50,
  "Steeringwheel": 0.50,
  "IntFR_Door": 0.50,
  "IntFL_Door": 0.50,
  "IntRL_Door": 0.50,
  "IntRR_Door": 0.50,
};
const DEFAULT_RATIO = 0.50;
const ERROR = 0.005;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });

console.log(`reading ${inPath}…`);
const doc = await io.read(inPath);

await MeshoptSimplifier.ready;

// Pre-weld so the simplifier has clean topology to work with.
console.log("welding…");
await doc.transform(weld({ tolerance: 0.0001 }));

// Walk every node that has a mesh, apply per-name ratio to every primitive.
console.log("simplifying per-node…");
const before = { v: 0, t: 0 };
const after = { v: 0, t: 0 };
const rows = [];
for (const scene of doc.getRoot().listScenes()) {
  for (const node of scene.listChildren()) walk(node);
}

function countPrim(prim) {
  const pos = prim.getAttribute("POSITION");
  const idx = prim.getIndices();
  const v = pos ? pos.getCount() : 0;
  const t = idx ? idx.getCount() / 3 : (v / 3);
  return { v, t: Math.round(t) };
}

function walk(node) {
  const mesh = node.getMesh();
  if (mesh) {
    const name = node.getName();
    const ratio = RATIOS[name] ?? DEFAULT_RATIO;
    for (const prim of mesh.listPrimitives()) {
      const pre = countPrim(prim);
      before.v += pre.v;
      before.t += pre.t;
      simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio, error: ERROR });
      const post = countPrim(prim);
      after.v += post.v;
      after.t += post.t;
      rows.push({ name, ratio, preV: pre.v, postV: post.v, preT: pre.t, postT: post.t });
    }
  }
  for (const c of node.listChildren()) walk(c);
}

console.log("pruning + deduping…");
await doc.transform(prune(), dedup());

console.log("compressing textures to webp q85 (max 2048)…");
await doc.transform(
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    resize: [2048, 2048],
    quality: 85,
  }),
);

console.log("draco encoding…");
await doc.transform(draco({ method: "edgebreaker" }));

await io.write(outPath, doc);

const renderVerts = getSceneVertexCount(
  doc.getRoot().listScenes()[0],
  VertexCountMethod.RENDER,
);
console.log(`render-verts (Three.js geometry.attributes.position.count sum): ${renderVerts.toLocaleString()}`);

console.log("\nper-mesh result:");
console.log(`${"node".padEnd(22)} ${"ratio".padStart(6)} ${"preV".padStart(8)} ${"postV".padStart(8)} ${"saved".padStart(7)} ${"preT".padStart(8)} ${"postT".padStart(8)}`);
console.log("-".repeat(80));
for (const r of rows) {
  const saved = (((r.preV - r.postV) / Math.max(1, r.preV)) * 100).toFixed(0) + "%";
  console.log(`${r.name.padEnd(22)} ${r.ratio.toFixed(2).padStart(6)} ${String(r.preV).padStart(8)} ${String(r.postV).padStart(8)} ${saved.padStart(7)} ${String(r.preT).padStart(8)} ${String(r.postT).padStart(8)}`);
}
console.log("-".repeat(80));
console.log(`TOTAL verts: ${before.v.toLocaleString()} → ${after.v.toLocaleString()} (${(((before.v - after.v) / before.v) * 100).toFixed(1)}% removed)`);
console.log(`TOTAL tris:  ${before.t.toLocaleString()} → ${after.t.toLocaleString()}`);
console.log(`wrote: ${outPath}`);
