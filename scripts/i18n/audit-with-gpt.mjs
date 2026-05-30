#!/usr/bin/env node
/**
 * Audit existing DeepSeek translations against a stronger LLM (GPT-5 via the
 * configured OPENAI proxy). For each (zh, vi) pair under the given filter,
 * GPT scores 1-5 on accuracy and naturalness, and proposes a rewrite when
 * the score is < 4. Output is printed to stdout and also persisted to
 * scripts/i18n/.cache/audit-<filter>.json so we can review and apply
 * selectively.
 *
 * Usage:
 *   node scripts/i18n/audit-with-gpt.mjs --filter autoDirector
 *   node scripts/i18n/audit-with-gpt.mjs --filter settings.providerDialog --apply
 *
 * Flags:
 *   --filter <prefix>   only audit keys starting with this dotted prefix
 *   --apply             write GPT rewrites back to vi-VN.json (only for keys
 *                       that scored < 4 AND have a non-empty rewrite)
 *   --batch-size <n>    keys per LLM call (default 20)
 *   --threshold <n>     score below which a rewrite is preferred (default 4)
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import url from "node:url";

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const ZH_PATH = path.join(REPO_ROOT, "shared", "localization", "locales", "zh-CN.json");
const VI_PATH = path.join(REPO_ROOT, "shared", "localization", "locales", "vi-VN.json");
const GLOSSARY_PATH = path.join(REPO_ROOT, "shared", "localization", "glossary.json");
const CACHE_DIR = path.join(REPO_ROOT, "scripts", "i18n", ".cache");

function loadEnv(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
  }
}
loadEnv(path.join(REPO_ROOT, "server", ".env"));
loadEnv(path.join(REPO_ROOT, ".env"));

function parseArgs(argv) {
  const out = { filter: null, apply: false, batchSize: 20, threshold: 4 };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--filter" && argv[i + 1]) { out.filter = argv[i + 1]; i += 1; }
    else if (arg === "--apply") { out.apply = true; }
    else if (arg === "--batch-size" && argv[i + 1]) { out.batchSize = Number(argv[i + 1]); i += 1; }
    else if (arg === "--threshold" && argv[i + 1]) { out.threshold = Number(argv[i + 1]); i += 1; }
  }
  return out;
}

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function writeJson(p, data) { fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`); }
function flatten(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix.length === 0 ? k : `${prefix}.${k}`;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) out.push(...flatten(v, full));
    else out.push({ key: full, value: v });
  }
  return out;
}
function getNested(obj, dotted) {
  let n = obj;
  for (const p of dotted.split(".")) {
    if (n && typeof n === "object" && p in n) n = n[p]; else return undefined;
  }
  return n;
}
function setNested(obj, dotted, value) {
  const parts = dotted.split(".");
  let n = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const p = parts[i];
    if (!(p in n) || typeof n[p] !== "object" || n[p] === null) n[p] = {};
    n = n[p];
  }
  n[parts[parts.length - 1]] = value;
}

function buildGlossaryBlock(glossary) {
  const lines = ["Glossary (zh ↔ vi must match — when zh appears, vi MUST be used):"];
  for (const e of glossary.entries) lines.push(`- ${e.zh} -> ${e.vi}`);
  return lines.join("\n");
}

async function callGpt(systemPrompt, userPrompt) {
  const baseURL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const r = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).substring(0, 300)}`);
  const data = await r.json();
  const c = data?.choices?.[0]?.message?.content;
  if (typeof c !== "string") throw new Error("No content in response");
  return c;
}

function tryParseJson(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const f = cleaned.indexOf("{");
  const l = cleaned.lastIndexOf("}");
  if (f === -1 || l === -1) return null;
  try { return JSON.parse(cleaned.slice(f, l + 1)); } catch { return null; }
}

function buildSystemPrompt(glossary) {
  return [
    "You are auditing zh-CN -> vi-VN UI translations for a Vietnamese localization of a novel-writing tool.",
    "For each entry, score the existing Vietnamese translation on accuracy AND naturalness (1-5; 5 = native and accurate).",
    "If score < 4, propose an improved Vietnamese translation. Otherwise, leave rewrite empty.",
    "Hard rules:",
    "- Preserve all ICU placeholders verbatim (e.g. {count}, {count, plural, other {# chương}}). Never translate placeholder names.",
    "- Preserve Markdown / HTML / backtick-wrapped code identifiers verbatim.",
    "- Strictly follow the glossary below.",
    "- Use natural Vietnamese suitable for beginner novel writers. Avoid stiff direct translation.",
    "- Output ONLY a JSON object: { \"<key>\": { \"score\": 1-5, \"rewrite\": \"<vi or empty>\", \"note\": \"<short reason in Vietnamese>\" } }.",
    "",
    buildGlossaryBlock(glossary),
  ].join("\n");
}

function buildUserPrompt(batch) {
  const obj = {};
  for (const e of batch) obj[e.key] = { zh: e.zh, vi: e.vi };
  return [
    "Audit each pair. Return a JSON object keyed by the original key.",
    "Each value must contain: score (1-5), rewrite (improved Vietnamese, or \"\" if score >= 4), note (brief Vietnamese explanation, 0-15 words).",
    "",
    JSON.stringify(obj, null, 2),
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv);
  const zh = readJson(ZH_PATH);
  const vi = readJson(VI_PATH);
  const glossary = readJson(GLOSSARY_PATH);

  const zhFlat = flatten(zh);
  const candidates = [];
  for (const { key, value } of zhFlat) {
    if (typeof value !== "string" || value.length === 0) continue;
    if (args.filter && !key.startsWith(args.filter)) continue;
    const viVal = getNested(vi, key);
    if (typeof viVal !== "string" || viVal.length === 0 || viVal === "__MISSING__") continue;
    candidates.push({ key, zh: value, vi: viVal });
  }
  console.log(`Auditing ${candidates.length} translation(s) (filter=${args.filter ?? "none"})`);
  if (candidates.length === 0) return;

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `audit-${(args.filter ?? "all").replace(/[^a-z0-9_.-]/gi, "_")}.json`);
  const results = {};

  for (let i = 0; i < candidates.length; i += args.batchSize) {
    const batch = candidates.slice(i, i + args.batchSize);
    console.log(`Batch ${Math.floor(i / args.batchSize) + 1}/${Math.ceil(candidates.length / args.batchSize)} (size=${batch.length})...`);
    let parsed;
    try {
      const raw = await callGpt(buildSystemPrompt(glossary), buildUserPrompt(batch));
      parsed = tryParseJson(raw);
    } catch (err) {
      console.error(`  Batch failed: ${err.message}`);
      writeJson(cachePath, results);
      process.exit(1);
    }
    if (!parsed) {
      console.error("  Failed to parse JSON; saving partial cache and exiting.");
      writeJson(cachePath, results);
      process.exit(1);
    }
    for (const e of batch) {
      const r = parsed[e.key];
      if (!r || typeof r !== "object") continue;
      results[e.key] = { ...r, zh: e.zh, vi: e.vi };
    }
    writeJson(cachePath, results);
  }

  // Summary
  const lowScore = [];
  const lowScoreWithRewrite = [];
  for (const [key, r] of Object.entries(results)) {
    const score = Number(r.score);
    if (Number.isFinite(score) && score < args.threshold) {
      lowScore.push({ key, ...r });
      if (typeof r.rewrite === "string" && r.rewrite.trim().length > 0) {
        lowScoreWithRewrite.push({ key, ...r });
      }
    }
  }
  console.log("");
  console.log(`Summary: ${Object.keys(results).length} audited, ${lowScore.length} below threshold ${args.threshold}, ${lowScoreWithRewrite.length} have a rewrite.`);
  for (const item of lowScoreWithRewrite.slice(0, 30)) {
    console.log("");
    console.log(`  [${item.score}/5] ${item.key}`);
    console.log(`    zh:      ${item.zh}`);
    console.log(`    vi old:  ${item.vi}`);
    console.log(`    vi new:  ${item.rewrite}`);
    if (item.note) console.log(`    note:    ${item.note}`);
  }
  if (lowScoreWithRewrite.length > 30) {
    console.log(`  ... ${lowScoreWithRewrite.length - 30} more in ${path.relative(REPO_ROOT, cachePath)}`);
  }

  if (args.apply && lowScoreWithRewrite.length > 0) {
    for (const item of lowScoreWithRewrite) {
      setNested(vi, item.key, item.rewrite.trim());
    }
    writeJson(VI_PATH, vi);
    console.log(`\nApplied ${lowScoreWithRewrite.length} rewrite(s) to ${path.relative(REPO_ROOT, VI_PATH)}.`);
  } else if (lowScoreWithRewrite.length > 0) {
    console.log(`\nDry run. Re-run with --apply to write the ${lowScoreWithRewrite.length} rewrite(s).`);
  }
}

await main();
