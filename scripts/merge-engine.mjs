// Merge the standalone V6 engine GLB into the prepped LC300 GLB.
//
// The runtime car model (lc300-hood-fixed.glb) already carries the correct
// node names (Door_FL, Wheel_FL, Bonnet_Full, …) and a low-detail placeholder
// "Engine_Block". This script drops that placeholder and grafts the real V6
// engine parts (Engine_Block, Air_Filter, Battery, Radiator under Engine_Root)
// into the car's scene. Both GLBs were exported from the same .blend with the
// default Y-up conversion, so the engine lands in the bay with no extra
// transform needed.
//
// Usage: node scripts/merge-engine.mjs <car.glb> <engine.glb> <out.glb>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { mergeDocuments } from "@gltf-transform/functions";

const [carPath, engPath, outPath] = process.argv.slice(2);
if (!carPath || !engPath || !outPath) {
  console.error("usage: node merge-engine.mjs <car.glb> <engine.glb> <out.glb>");
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const car = await io.read(carPath);
const eng = await io.read(engPath);

// Drop the placeholder "Engine_Block" node (+ its now-orphaned mesh).
let removed = 0;
for (const n of car.getRoot().listNodes()) {
  if (n.getName() === "Engine_Block") {
    const mesh = n.getMesh();
    n.dispose();
    if (mesh && mesh.listParents().filter((p) => p.propertyType === "Node").length === 0) {
      mesh.dispose();
    }
    removed++;
  }
}
console.log(`removed ${removed} placeholder Engine_Block node(s)`);

const scenesBefore = new Set(car.getRoot().listScenes());
mergeDocuments(car, eng);

const carScene = car.getRoot().getDefaultScene() ?? [...scenesBefore][0];
let moved = 0;
for (const scene of car.getRoot().listScenes()) {
  if (scenesBefore.has(scene)) continue;
  for (const node of scene.listChildren()) {
    carScene.addChild(node);
    moved++;
  }
  scene.dispose();
}
console.log(`grafted ${moved} engine root node(s) into car scene`);

// mergeDocuments brings the engine's own Buffer along; GLB allows only one.
// Reassign every accessor to the car's primary buffer and drop the extras.
const buffers = car.getRoot().listBuffers();
const mainBuffer = buffers[0];
for (const accessor of car.getRoot().listAccessors()) accessor.setBuffer(mainBuffer);
for (const b of buffers.slice(1)) b.dispose();
console.log(`consolidated ${buffers.length} buffer(s) -> 1`);

await io.write(outPath, car);

const names = car.getRoot().listNodes().map((n) => n.getName()).filter(Boolean).sort();
console.log(`wrote: ${outPath}`);
console.log(`nodes (${names.length}): ${names.join(", ")}`);
