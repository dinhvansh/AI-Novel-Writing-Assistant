#!/usr/bin/env node
/**
 * Classify server-side CJK literals into:
 *   - error: user-facing HTTP error responses (`error: "..."`, `message: "..."`)
 *   - log:   log lines (`console.log/error/warn` with CJK)
 *   - prompt: AI prompt instructions (these stay in Chinese per Phase 5 plan)
 *   - other: anything else (likely internal/dev-only)
 *
 * Output: scripts/i18n/.cache/server-cjk-classified.tsv
 *
 * Usage: node scripts/i18n/classify-server-cjk.mjs
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const CACHE = path.join(REPO_ROOT, "scripts", "i18n", ".cache", "candidates.tsv");
const OUT = path.join(REPO_ROOT, "scripts", "i18n", ".cache", "server-cjk-classified.tsv");

if (!fs.existsSync(CACHE)) {
  console.error(`Missing ${CACHE}. Run extract-cjk-literals.mjs first.`);
  process.exit(1);
}

function classify(filepath, line, literal) {
  if (filepath.includes("/prompting/prompts/") || filepath.includes("\\prompting\\prompts\\")) {
    return "prompt";
  }
  if (filepath.includes("/prompting/") || filepath.includes("\\prompting\\")) {
    return "prompt-other";
  }
  // Read line context.
  const full = path.join(REPO_ROOT, filepath);
  let ctx = "";
  try {
    const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
    ctx = lines.slice(Math.max(0, line - 2), Math.min(lines.length, line + 1)).join(" | ");
  } catch {
    return "other";
  }
  const ctxLower = ctx.toLowerCase();
  if (/console\.(log|warn|error|info|debug)/i.test(ctx)) return "log";
  if (/error\s*[:=]\s*["'`]|message\s*[:=]\s*["'`]|new\s+(httpError|error)\(/i.test(ctx)) return "error";
  if (/throw\s+new\s+/i.test(ctx)) return "error";
  if (/`.*\{.*\}.*`/.test(ctx) && /system|userPrompt|systemPrompt/i.test(ctxLower)) return "prompt-inline";
  return "other";
}

const lines = fs.readFileSync(CACHE, "utf8").split(/\r?\n/).slice(1).filter(Boolean);
const buckets = { error: [], log: [], prompt: [], "prompt-other": [], "prompt-inline": [], other: [] };
for (const row of lines) {
  const parts = row.split("\t");
  if (parts.length < 4) continue;
  const [filepath, lineStr, , literal] = parts;
  if (!filepath.startsWith("server/")) continue;
  const cat = classify(filepath, Number(lineStr), literal);
  buckets[cat].push(`${filepath}\t${lineStr}\t${literal.slice(0, 80)}`);
}

const out = [];
out.push(`category\tfilepath\tline\tliteral_preview`);
for (const cat of Object.keys(buckets)) {
  for (const row of buckets[cat]) {
    out.push(`${cat}\t${row}`);
  }
}
fs.writeFileSync(OUT, out.join("\n"));

console.log("Classification summary:");
for (const cat of Object.keys(buckets)) {
  console.log(`  ${cat.padEnd(15)} ${buckets[cat].length}`);
}
console.log(`Wrote ${OUT}`);
