#!/usr/bin/env node
/**
 * LLM-driven translator: zh-CN → vi-VN.
 *
 * Reads `shared/localization/locales/zh-CN.json`, finds every key whose
 * `vi-VN.json` value is `__MISSING__` or absent, batches them, calls the
 * configured LLM provider (DeepSeek by default — cheapest of the
 * configured options) with the project glossary injected as a strict
 * translation constraint, and writes the translated values back to
 * `vi-VN.json`.
 *
 * Usage:
 *   node scripts/i18n/translate-locale.mjs --target vi-VN
 *   node scripts/i18n/translate-locale.mjs --target vi-VN --dry-run
 *   node scripts/i18n/translate-locale.mjs --target vi-VN --batch-size 30
 *   node scripts/i18n/translate-locale.mjs --target vi-VN --filter common
 *
 * Required env (loaded from server/.env):
 *   DEEPSEEK_API_KEY  (or OPENAI_API_KEY if --provider openai)
 *
 * Notes:
 *  - Skips keys whose value already exists and is not `__MISSING__`.
 *  - Skips placeholder TODO entries (e.g. `__TODO_ZH__:...`) so the
 *    developer is forced to fill in the canonical Chinese first.
 *  - Glossary terms are injected as a strict mapping the LLM must follow.
 *  - ICU placeholders ({count}, {name}, {count, plural, ...}) are
 *    explicitly preserved — the translator is told never to translate
 *    placeholder names.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import url from "node:url";

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const ZH_PATH = path.join(REPO_ROOT, "shared", "localization", "locales", "zh-CN.json");
const VI_PATH = path.join(REPO_ROOT, "shared", "localization", "locales", "vi-VN.json");
const GLOSSARY_PATH = path.join(REPO_ROOT, "shared", "localization", "glossary.json");

// ---------------------------------------------------------------------------
// CLI args

function parseArgs(argv) {
  const out = {
    targetLocale: "vi-VN",
    sourceLocale: "zh-CN",
    batchSize: 30,
    dryRun: false,
    filter: null,
    provider: process.env.AI_NOVEL_TRANSLATE_PROVIDER ?? "deepseek",
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--target" && argv[i + 1]) {
      out.targetLocale = argv[i + 1];
      i += 1;
    } else if (arg === "--source" && argv[i + 1]) {
      out.sourceLocale = argv[i + 1];
      i += 1;
    } else if (arg === "--batch-size" && argv[i + 1]) {
      out.batchSize = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--filter" && argv[i + 1]) {
      out.filter = argv[i + 1];
      i += 1;
    } else if (arg === "--provider" && argv[i + 1]) {
      out.provider = argv[i + 1];
      i += 1;
    } else if (arg === "--dry-run") {
      out.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(
        "Usage: translate-locale --target vi-VN [--dry-run] [--batch-size 30] [--filter <ns prefix>]\n",
      );
      process.exit(0);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// .env loader (minimal, no dependency on dotenv to keep this script
// runnable without `pnpm install` of server deps).

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2];
    }
  }
}
loadEnvFile(path.join(REPO_ROOT, "server", ".env"));
loadEnvFile(path.join(REPO_ROOT, ".env"));

// ---------------------------------------------------------------------------
// Provider config (mirrors server/src/llm/providers.ts subset; kept tiny
// so this script has no dependency on the server package).

const PROVIDER_CONFIG = {
  deepseek: {
    baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
    maxTokens: 4096,
    temperature: 0.0,
  },
  openai: {
    baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    apiKeyEnv: "OPENAI_API_KEY",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    maxTokens: 4096,
    temperature: 0.0,
  },
};

// ---------------------------------------------------------------------------
// Bundle helpers

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, data) {
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
}

function flattenKeys(obj, prefix = "") {
  const out = [];
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix.length === 0 ? key : `${prefix}.${key}`;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      out.push(...flattenKeys(value, full));
    } else {
      out.push({ key: full, value });
    }
  }
  return out;
}

function getNested(obj, dottedPath) {
  const parts = dottedPath.split(".");
  let node = obj;
  for (const part of parts) {
    if (node && typeof node === "object" && part in node) {
      node = node[part];
    } else {
      return undefined;
    }
  }
  return node;
}

function setNested(obj, dottedPath, value) {
  const parts = dottedPath.split(".");
  let node = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (!(part in node) || typeof node[part] !== "object" || node[part] === null) {
      node[part] = {};
    }
    node = node[part];
  }
  node[parts[parts.length - 1]] = value;
}

// ---------------------------------------------------------------------------
// Glossary → constraint table for the system prompt.

function buildGlossarySystemBlock(glossary) {
  const lines = ["术语表（zh ↔ vi 强制对应，见到左边的中文必须翻译为右边的越南语）："];
  for (const entry of glossary.entries) {
    lines.push(`- ${entry.zh} -> ${entry.vi}`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// LLM call.

async function callTranslator(provider, systemPrompt, userPrompt) {
  const config = PROVIDER_CONFIG[provider];
  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`${config.apiKeyEnv} is not set in env (server/.env or process env)`);
  }
  const url = `${config.baseURL.replace(/\/$/, "")}/chat/completions`;
  const body = {
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    response_format: { type: "json_object" },
  };
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Translator HTTP ${response.status}: ${text.slice(0, 300)}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Translator response missing message.content");
  }
  return content;
}

// ---------------------------------------------------------------------------
// Translation orchestration.

const TODO_PLACEHOLDER_PREFIX = "__TODO_ZH__:";
const MISSING_PLACEHOLDER = "__MISSING__";

function shouldTranslateZhValue(zhValue) {
  if (typeof zhValue !== "string") return false;
  if (zhValue.length === 0) return false;
  if (zhValue.startsWith(TODO_PLACEHOLDER_PREFIX)) return false;
  return true;
}

function shouldOverwriteViValue(viValue) {
  if (viValue === undefined) return true;
  if (typeof viValue !== "string") return true;
  if (viValue === MISSING_PLACEHOLDER) return true;
  if (viValue.length === 0) return true;
  return false;
}

function buildSystemPrompt(glossary) {
  return [
    "你是一名专业的中越软件本地化译者，专门翻译小说创作工具的界面文本与系统消息。",
    "翻译要求：",
    "1. 准确传达原意，使用越南语 (Tiếng Việt) 输出。",
    "2. 严格遵守术语表：见到左边的中文必须翻译为右边的越南语。",
    "3. 必须保留所有 ICU 占位符。例如 `{count}`、`{count, plural, other {# 章}}` 中的 `count`、`plural` 等关键字以及结构都不可翻译，只能翻译花括号外面的提示文字。",
    "4. 若原文使用 Markdown / HTML 标签或反引号包裹的代码标识（例如 \\`vi-VN\\`），保留原样，不翻译。",
    "5. 输出风格统一、自然、面向初学者用户，避免直译造成的生硬。",
    "6. 不添加注释或解释，只返回 JSON。",
    "",
    buildGlossarySystemBlock(glossary),
  ].join("\n");
}

function buildUserPrompt(batch) {
  const obj = {};
  for (const entry of batch) {
    obj[entry.key] = entry.zhValue;
  }
  return [
    "请把下面这个 JSON 对象翻译成越南语 (Tiếng Việt)。",
    "返回严格的 JSON：每个 key 的值替换为对应的越南语翻译，其他保持一致。",
    "结构必须与输入完全相同。如果一个值含 ICU 占位符，请保留原样，只翻译占位符以外的文字。",
    "",
    JSON.stringify(obj, null, 2),
  ].join("\n");
}

function tryParseJsonObject(text) {
  // The model is asked to return a JSON object. Be tolerant of
  // surrounding code fences or stray prose.
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  const candidate = cleaned.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

async function translateBatch(batch, glossary, provider) {
  const systemPrompt = buildSystemPrompt(glossary);
  const userPrompt = buildUserPrompt(batch);
  const raw = await callTranslator(provider, systemPrompt, userPrompt);
  const parsed = tryParseJsonObject(raw);
  if (!parsed) {
    throw new Error(`Translator returned non-JSON output. First 200 chars: ${raw.slice(0, 200)}`);
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Main.

async function main() {
  const args = parseArgs(process.argv);
  if (args.targetLocale !== "vi-VN") {
    process.stderr.write(`Only vi-VN target is supported in v1, got: ${args.targetLocale}\n`);
    process.exit(2);
  }

  const zh = readJson(ZH_PATH);
  const vi = readJson(VI_PATH);
  const glossary = readJson(GLOSSARY_PATH);

  const zhFlat = flattenKeys(zh);
  let candidates = [];
  for (const { key, value } of zhFlat) {
    if (!shouldTranslateZhValue(value)) continue;
    if (args.filter && !key.startsWith(args.filter)) continue;
    const viValue = getNested(vi, key);
    if (!shouldOverwriteViValue(viValue)) continue;
    candidates.push({ key, zhValue: value });
  }

  process.stdout.write(
    `Found ${candidates.length} key(s) to translate (filter=${args.filter ?? "none"}).\n`,
  );

  if (candidates.length === 0) {
    process.stdout.write("Nothing to do.\n");
    return;
  }

  if (args.dryRun) {
    process.stdout.write("--dry-run: showing first 10 candidates and exiting.\n");
    for (const cand of candidates.slice(0, 10)) {
      process.stdout.write(`  ${cand.key}: ${cand.zhValue}\n`);
    }
    return;
  }

  let processed = 0;
  let updated = 0;
  for (let i = 0; i < candidates.length; i += args.batchSize) {
    const batch = candidates.slice(i, i + args.batchSize);
    process.stdout.write(
      `Batch ${Math.floor(i / args.batchSize) + 1}/${Math.ceil(candidates.length / args.batchSize)} (size=${batch.length})...\n`,
    );
    let translated;
    try {
      translated = await translateBatch(batch, glossary, args.provider);
    } catch (err) {
      process.stderr.write(`Batch failed: ${err.message}\n`);
      // Persist what we have so far before exiting.
      writeJson(VI_PATH, vi);
      process.stdout.write(`Saved ${updated} translation(s) before failure.\n`);
      process.exit(1);
    }
    for (const cand of batch) {
      processed += 1;
      const value = translated[cand.key];
      if (typeof value === "string" && value.length > 0) {
        setNested(vi, cand.key, value);
        updated += 1;
      } else {
        process.stderr.write(`  WARN: missing translation for ${cand.key}\n`);
      }
    }
    // Persist after every batch so partial progress survives crashes.
    writeJson(VI_PATH, vi);
  }

  process.stdout.write(
    `Done. Processed ${processed}, updated ${updated}. Wrote ${path.relative(REPO_ROOT, VI_PATH)}\n`,
  );
}

await main();
