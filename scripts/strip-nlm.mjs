// Remove the "Car plates" node (which carries the NLM-branded license-plate
// texture) before the runtime ever sees it. Belt-and-suspenders with a
// runtime hide in case future model revisions rename the node.
// Usage: node scripts/strip-nlm.mjs <in.glb> <out.glb>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

const [inPath, outPath] = process.argv.slice(2);
if (!inPath || !outPath) {
  console.error("usage: node strip-nlm.mjs <in.glb> <out.glb>");
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inPath);

const targets = ["Car plates"];
const NLM_MAT_NAMES = ["NLM GROUP", "NLM"];
const NLM_TEX_NAMES = ["NLM"];

const root = doc.getRoot();

let removedNodes = 0;
for (const scene of root.listScenes()) {
  for (const node of scene.listChildren()) {
    if (targets.includes(node.getName())) {
      node.dispose();
      removedNodes++;
    }
  }
}

let removedMats = 0;
for (const mat of root.listMaterials()) {
  if (NLM_MAT_NAMES.includes(mat.getName())) {
    mat.dispose();
    removedMats++;
  }
}

let removedTex = 0;
for (const tex of root.listTextures()) {
  if (NLM_TEX_NAMES.includes(tex.getName())) {
    tex.dispose();
    removedTex++;
  }
}

await io.write(outPath, doc);

console.log(`stripped: ${removedNodes} node(s), ${removedMats} material(s), ${removedTex} texture(s)`);
console.log(`wrote: ${outPath}`);
