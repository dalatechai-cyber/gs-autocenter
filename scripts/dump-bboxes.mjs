// Dump bounding boxes for every named top-level node in a GLB.
// Helps verify hood pivot logic, mesh placement, etc.
// Usage: node scripts/dump-bboxes.mjs <path-to-glb>
import { NodeIO } from "@gltf-transform/core";

const path = process.argv[2];
if (!path) { console.error("usage: node dump-bboxes.mjs <glb>"); process.exit(1); }

const io = new NodeIO();
const doc = await io.read(path);
const root = doc.getRoot();
const scene = root.listScenes()[0];

function meshBox(mesh) {
  // Returns local-space bbox (no node transforms) from POSITION accessors.
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute("POSITION");
    if (!pos) continue;
    const pMin = pos.getMin([0, 0, 0]);
    const pMax = pos.getMax([0, 0, 0]);
    for (let i = 0; i < 3; i++) {
      if (pMin[i] < min[i]) min[i] = pMin[i];
      if (pMax[i] > max[i]) max[i] = pMax[i];
    }
  }
  return { min, max };
}

function fmt3(v) { return v.map(x => x.toFixed(3).padStart(8)).join(" "); }
function center(b) { return [(b.min[0]+b.max[0])/2, (b.min[1]+b.max[1])/2, (b.min[2]+b.max[2])/2]; }
function size(b) { return [b.max[0]-b.min[0], b.max[1]-b.min[1], b.max[2]-b.min[2]]; }

console.log(`Scene: ${scene.getName()}\n`);
console.log(`${"name".padEnd(20)} ${"center xyz".padEnd(28)} ${"size xyz".padEnd(28)} mesh`);
console.log("-".repeat(100));

let sceneMin = [Infinity, Infinity, Infinity];
let sceneMax = [-Infinity, -Infinity, -Infinity];

const top = scene.listChildren();
for (const node of top) {
  const t = node.getTranslation();
  const mesh = node.getMesh();
  const localBox = mesh ? meshBox(mesh) : null;
  const worldBox = localBox ? {
    min: localBox.min.map((v, i) => v + t[i]),
    max: localBox.max.map((v, i) => v + t[i]),
  } : null;
  if (worldBox) {
    for (let i = 0; i < 3; i++) {
      if (worldBox.min[i] < sceneMin[i]) sceneMin[i] = worldBox.min[i];
      if (worldBox.max[i] > sceneMax[i]) sceneMax[i] = worldBox.max[i];
    }
  }
  const c = worldBox ? fmt3(center(worldBox)) : "  -      -      -   ";
  const s = worldBox ? fmt3(size(worldBox)) : "  -      -      -   ";
  console.log(`${node.getName().padEnd(20)} ${c} ${s} ${mesh?.getName() ?? ""}`);
}

console.log("-".repeat(100));
console.log(`Scene bbox  center: ${fmt3(center({min:sceneMin,max:sceneMax}))}  size: ${fmt3(size({min:sceneMin,max:sceneMax}))}`);
