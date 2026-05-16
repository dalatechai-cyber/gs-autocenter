import { readFileSync } from "node:fs";

function inspect(path) {
  const buf = readFileSync(path);
  const magic = buf.toString("utf8", 0, 4);
  if (magic !== "glTF") throw new Error(`Not GLB: ${path}`);
  let offset = 12;
  const chunkLen = buf.readUInt32LE(offset);
  const chunkType = buf.toString("utf8", offset + 4, offset + 8);
  if (chunkType !== "JSON") throw new Error(`Expected JSON chunk: ${chunkType}`);
  const jsonStr = buf.toString("utf8", offset + 8, offset + 8 + chunkLen);
  const gltf = JSON.parse(jsonStr);

  console.log(`\n=== ${path} ===`);
  console.log(`nodes: ${gltf.nodes?.length ?? 0}, meshes: ${gltf.meshes?.length ?? 0}`);
  console.log(`\n--- node names ---`);
  gltf.nodes?.forEach((n, i) => {
    if (n.name) console.log(`  node[${i}]: ${n.name}`);
  });
  console.log(`\n--- mesh names ---`);
  gltf.meshes?.forEach((m, i) => {
    console.log(`  mesh[${i}]: ${m.name ?? "(unnamed)"}`);
  });
}

for (const p of process.argv.slice(2)) {
  inspect(p);
}
