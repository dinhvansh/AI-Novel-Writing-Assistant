#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (["node_modules", "dist", "tests"].includes(entry.name)) continue;
      yield* walk(path.join(dir, entry.name));
    } else if (entry.name.endsWith(".ts") && !entry.name.includes(".test.")) {
      yield path.join(dir, entry.name);
    }
  }
}

const cjk = /[\u4e00-\u9fff]/g;
const errorLitPattern = /error:\s*["'`]([^"'`]*?[\u4e00-\u9fff][^"'`]*?)["'`]/g;
const counts = {};
let totalCjk = 0;
let errorLitCount = 0;
const errorLitSamples = [];

for (const f of walk("server/src")) {
  const c = fs.readFileSync(f, "utf8");
  const matches = c.match(cjk);
  if (!matches) continue;
  totalCjk += matches.length;
  const folder = path.relative("server/src", f).split(path.sep)[0];
  counts[folder] = (counts[folder] || 0) + matches.length;
  let m;
  errorLitPattern.lastIndex = 0;
  while ((m = errorLitPattern.exec(c)) !== null) {
    errorLitCount += 1;
    if (errorLitSamples.length < 12) {
      errorLitSamples.push({ file: f.replace(/\\/g, "/"), text: m[1] });
    }
  }
}

console.log("Total CJK in server/src:", totalCjk);
console.log("error: \"...\" inline literals:", errorLitCount);
console.log("\nTop folders by CJK:");
Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([k, v]) => console.log("  ", String(v).padStart(6), k));
console.log("\nSample error literals:");
for (const s of errorLitSamples) console.log("  ", s.file, "→", s.text);
