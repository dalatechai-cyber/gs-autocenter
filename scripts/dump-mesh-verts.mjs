// Print per-node vertex counts so we can see where the geometry budget is
// spent and decide which meshes to simplify aggressively vs lightly.
// Usage: node scripts/dump-mesh-verts.mjs <glb>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";

const path = process.argv[2];
if (!path) { console.error("usage: node dump-mesh-verts.mjs <glb>"); process.exit(1); }

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });

const doc = await io.read(path);

function meshVerts(mesh) {
  let v = 0, t = 0;
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute("POSITION");
    if (pos) v += pos.getCount();
    const idx = prim.getIndices();
    t += (idx ? idx.getCount() : (pos?.getCount() ?? 0)) / 3;
  }
  return { v, t: Math.round(t) };
}

const rows = [];
function walk(node, parent = "") {
  const mesh = node.getMesh();
  if (mesh) {
    const stats = meshVerts(mesh);
    rows.push({ name: node.getName(), parent, verts: stats.v, tris: stats.t });
  }
  for (const c of node.listChildren()) walk(c, node.getName());
}

for (const scene of doc.getRoot().listScenes()) {
  for (const n of scene.listChildren()) walk(n);
}

rows.sort((a, b) => b.verts - a.verts);

const totalV = rows.reduce((s, r) => s + r.verts, 0);
const totalT = rows.reduce((s, r) => s + r.tris, 0);

console.log(`${"node".padEnd(22)} ${"parent".padEnd(14)} ${"verts".padStart(9)} ${"tris".padStart(9)} ${"% of total".padStart(11)}`);
console.log("-".repeat(70));
for (const r of rows) {
  const pct = ((r.verts / totalV) * 100).toFixed(1);
  console.log(`${r.name.padEnd(22)} ${r.parent.padEnd(14)} ${r.verts.toString().padStart(9)} ${r.tris.toString().padStart(9)} ${pct.padStart(10)}%`);
}
console.log("-".repeat(70));
console.log(`${"TOTAL".padEnd(37)} ${totalV.toString().padStart(9)} ${totalT.toString().padStart(9)}`);
