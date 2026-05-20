// Dump node hierarchy from a GLB so we can map hotspot ids to mesh/node names.
// Usage: node scripts/dump-nodes.mjs <path-to-glb>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";

const path = process.argv[2];
if (!path) { console.error("usage: node dump-nodes.mjs <glb>"); process.exit(1); }

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });
const doc = await io.read(path);
const root = doc.getRoot();

const scenes = root.listScenes();
console.log(`Scenes: ${scenes.length}`);

function walk(node, depth = 0) {
  const meshName = node.getMesh()?.getName() ?? "";
  const tag = meshName ? `  [mesh:${meshName}]` : "";
  console.log(`${"  ".repeat(depth)}- "${node.getName()}"${tag}`);
  for (const child of node.listChildren()) walk(child, depth + 1);
}

for (const scene of scenes) {
  console.log(`\n== Scene: ${scene.getName()} ==`);
  for (const n of scene.listChildren()) walk(n, 0);
}

console.log(`\nTotal nodes: ${root.listNodes().length}`);
console.log(`Total meshes: ${root.listMeshes().length}`);
