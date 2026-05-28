#!/usr/bin/env node
/**
 * One-shot probe to verify the translator wiring:
 *  1. Confirm DEEPSEEK_API_KEY is loaded from server/.env.
 *  2. Translate 5 sample Chinese strings through the same pipeline the
 *     real translator uses (glossary system constraint, ICU preservation,
 *     JSON response format).
 *  3. Print the round-trip result.
 *
 * Usage:
 *   node scripts/i18n/probe-translator.mjs
 *
 * Does NOT modify any locale bundle. Read-only verification.
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2];
    }
  }
}
loadEnvFile(path.join(REPO_ROOT, "server", ".env"));

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey || apiKey.length < 10) {
  console.error("ERROR: DEEPSEEK_API_KEY missing or empty in server/.env");
  process.exit(2);
}
console.log(`Found DEEPSEEK_API_KEY (length=${apiKey.length}).`);

const baseURL = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1";
const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

const glossary = JSON.parse(
  fs.readFileSync(
    path.join(REPO_ROOT, "shared", "localization", "glossary.json"),
    "utf8",
  ),
);

const sampleKeys = {
  "probe.test1.title": "章节执行",
  "probe.test2.subtitle": "你只需要提供一个模糊想法，AI 会先帮你生成方向方案。",
  "probe.test3.cta": "AI 自动导演开书",
  "probe.test4.placeholder": "搜索小说...",
  "probe.test5.plural": "{count, plural, other {# 章}}",
};

const glossaryBlock = [
  "术语表（zh ↔ vi 强制对应，见到左边的中文必须翻译为右边的越南语）：",
  ...glossary.entries.map((e) => `- ${e.zh} -> ${e.vi}`),
].join("\n");

const systemPrompt = [
  "你是一名专业的中越软件本地化译者，专门翻译小说创作工具的界面文本与系统消息。",
  "翻译要求：",
  "1. 准确传达原意，使用越南语 (Tiếng Việt) 输出。",
  "2. 严格遵守术语表：见到左边的中文必须翻译为右边的越南语。",
  "3. 必须保留所有 ICU 占位符。",
  "4. 不添加注释或解释，只返回 JSON。",
  "",
  glossaryBlock,
].join("\n");

const userPrompt = [
  "请把下面这个 JSON 对象翻译成越南语 (Tiếng Việt)。",
  "返回严格的 JSON：每个 key 的值替换为对应的越南语翻译。",
  JSON.stringify(sampleKeys, null, 2),
].join("\n");

console.log("\nProbing DeepSeek with 5 sample keys...");
const start = Date.now();
const response = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.0,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  }),
});

if (!response.ok) {
  const txt = await response.text().catch(() => "");
  console.error(`HTTP ${response.status}: ${txt.slice(0, 400)}`);
  process.exit(1);
}

const data = await response.json();
const content = data?.choices?.[0]?.message?.content;
if (typeof content !== "string") {
  console.error("Missing message.content in response.");
  process.exit(1);
}
const elapsed = Date.now() - start;
console.log(`Got response in ${elapsed}ms (model=${data.model ?? model}).\n`);
console.log("Raw output:\n" + content + "\n");

let parsed;
try {
  parsed = JSON.parse(content);
} catch (e) {
  console.error("Failed to parse JSON response.");
  process.exit(1);
}

console.log("Side-by-side review:");
for (const [key, zh] of Object.entries(sampleKeys)) {
  const vi = parsed[key];
  console.log(`  [${key}]`);
  console.log(`    zh: ${zh}`);
  console.log(`    vi: ${vi ?? "(missing)"}`);
}

console.log("\nProbe complete. If translations look reasonable above, run the full translator.");
