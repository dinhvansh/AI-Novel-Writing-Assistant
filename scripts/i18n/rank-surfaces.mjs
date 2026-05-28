#!/usr/bin/env node
/**
 * Rank source files in client/src by raw CJK character count to help
 * pick the next batch of surfaces to translate.
 *
 * Usage:
 *   node scripts/i18n/rank-surfaces.mjs [topN]
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const ROOT = path.join(REPO_ROOT, "client", "src");
const CJK = /[\u4e00-\u9fff]/g;
const TOP_N = Number(process.argv[2] ?? "30");

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".next"].includes(entry.name)) continue;
      yield* walk(path.join(dir, entry.name));
    } else if (
      (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) &&
      !entry.name.includes(".test.")
    ) {
      yield path.join(dir, entry.name);
    }
  }
}

const rows = [];
for (const file of walk(ROOT)) {
  const content = fs.readFileSync(file, "utf8");
  const m = content.match(CJK);
  if (!m) continue;
  rows.push({
    rel: path.relative(REPO_ROOT, file).replace(/\\/g, "/"),
    cjk: m.length,
  });
}
rows.sort((a, b) => b.cjk - a.cjk);

const total = rows.reduce((acc, r) => acc + r.cjk, 0);
console.log(`Total files with CJK: ${rows.length}; total CJK chars: ${total}`);
console.log(`Top ${TOP_N}:`);
for (const row of rows.slice(0, TOP_N)) {
  console.log(`  ${String(row.cjk).padStart(5)}  ${row.rel}`);
}
