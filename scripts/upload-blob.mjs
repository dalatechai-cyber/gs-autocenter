// Upload a file to Vercel Blob and print the public URL.
// Usage: node scripts/upload-blob.mjs <local-path> <blob-pathname>
// Reads BLOB_READ_WRITE_TOKEN from .env.local.
import { put } from "@vercel/blob";
import { readFile } from "node:fs/promises";
// Minimal .env.local parser (no dotenv dependency).
import { readFileSync, existsSync } from "node:fs";
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}

const [src, dst] = process.argv.slice(2);
if (!src || !dst) {
  console.error("usage: node scripts/upload-blob.mjs <local-path> <blob-pathname>");
  process.exit(1);
}

const body = await readFile(src);
const result = await put(dst, body, {
  access: "public",
  allowOverwrite: true,
  contentType: "model/gltf-binary",
});

console.log(`uploaded ${(body.length / 1024 / 1024).toFixed(2)}MB → ${result.url}`);
