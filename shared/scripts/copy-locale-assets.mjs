#!/usr/bin/env node
/**
 * Copy non-TS assets (JSON locale bundles, glossary) from
 * `shared/localization/` into `shared/dist/localization/` after `tsc`.
 *
 * Why: TypeScript's compiler does not copy `.json` files to outDir even
 * with `resolveJsonModule: true`. Downstream consumers (client via Vite,
 * server via ts-node-dev / Node ESM) resolve `@ai-novel/shared/localization`
 * to the dist tree per `package.json` `exports`, so the JSON files MUST
 * be present alongside the compiled JS or the bundle silently loads as
 * empty objects (and i18next then falls back to the missing-key marker).
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const PKG_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const SRC = path.join(PKG_ROOT, "localization");
const DST = path.join(PKG_ROOT, "dist", "localization");

function copyJsonRecursive(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(dstDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const dstPath = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      copyJsonRecursive(srcPath, dstPath);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

copyJsonRecursive(SRC, DST);

const copied = [];
function listJson(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listJson(full);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      copied.push(path.relative(PKG_ROOT, full).replace(/\\/g, "/"));
    }
  }
}
listJson(DST);

process.stdout.write(`Copied ${copied.length} JSON file(s) to dist/localization:\n`);
for (const file of copied) {
  process.stdout.write(`  ${file}\n`);
}
