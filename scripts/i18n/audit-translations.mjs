#!/usr/bin/env node
/**
 * GPT audit script for vi-VN.json translations.
 * Reads vi-VN.json and zh-CN.json, sends batches to GPT for quality review,
 * outputs a report of issues found.
 *
 * Usage:
 *   node scripts/i18n/audit-translations.mjs
 *   node scripts/i18n/audit-translations.mjs --filter novel.takeover
 *   node scripts/i18n/audit-translations.mjs --batch-size 40
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import process from "node:process";

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const ZH_PATH = path.join(REPO_ROOT, "shared", "localization", "locales", "zh-CN.json");
const VI_PATH = path.join(REPO_ROOT, "shared", "localization", "locales", "vi-VN.json");
const GLOSSARY_PATH = path.join(REPO_ROOT, "shared", "localization", "glossary.json");

// Load env
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
loadEnvFile(path.join(REPO_ROOT, "server", ".env"));
loadEnvFile(path.join(REPO_ROOT, ".env"));

function parseArgs(argv) {
  const out = { filter: null, batchSize: 40, outputFile: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--filter" && argv[i + 1]) { out.filter = argv[i + 1]; i++; }
    else if (argv[i] === "--batch-size" && argv[i + 1]) { out.batchSize = Number(argv[i + 1]); i++; }
    else if (argv[i] === "--output" && argv[i + 1]) { out.outputFile = argv[i + 1]; i++; }
  }
  return out;
}

function flattenKeys(obj, prefix = "") {
  const out = [];
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
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
    if (node && typeof node === "object" && part in node) node = node[part];
    else return undefined;
  }
  return node;
}

async function callGPT(systemPrompt, userPrompt) {
  const baseURL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`GPT HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("GPT response missing content");

  try {
    return JSON.parse(content);
  } catch {
    // Try to extract JSON
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(`GPT returned non-JSON: ${content.slice(0, 200)}`);
  }
}

function buildSystemPrompt(glossary) {
  const glossaryLines = glossary.entries
    .map(e => `  ${e.zh} → ${e.vi} (${e.category})`)
    .join("\n");

  return `Bạn là chuyên gia kiểm tra chất lượng bản dịch Trung-Việt cho phần mềm viết tiểu thuyết AI.

Nhiệm vụ: Kiểm tra từng cặp (zh, vi) và phát hiện các vấn đề sau:
1. **Sai thuật ngữ glossary**: vi không dùng đúng thuật ngữ chuẩn trong glossary
2. **Dịch sai nghĩa**: vi không truyền đạt đúng ý của zh
3. **Không tự nhiên**: vi nghe cứng nhắc, dịch máy, hoặc khó hiểu với người dùng Việt
4. **ICU placeholder bị dịch**: tên placeholder trong {} bị thay đổi (ví dụ {count} → {số})
5. **Thiếu thông tin**: vi bỏ sót thông tin quan trọng từ zh
6. **Quá dài/ngắn**: vi dài hơn zh quá nhiều hoặc quá ngắn mất nghĩa

Glossary bắt buộc:
${glossaryLines}

Quy tắc:
- Tên sản phẩm: "Đạo diễn tự động" (自动导演), "Kho tri thức" (知识库), "Xưởng sáng tạo" (创意工坊), "Công thức viết" (写作公式)
- Giữ nguyên các từ kỹ thuật tiếng Anh: API Key, Token, ICU
- Placeholder {xxx} KHÔNG được dịch tên biến bên trong

Trả về JSON với format:
{
  "issues": [
    {
      "key": "đường dẫn key",
      "zh": "bản gốc",
      "vi": "bản dịch hiện tại",
      "issue": "loại vấn đề",
      "suggestion": "gợi ý sửa (nếu có)"
    }
  ],
  "ok_count": số key không có vấn đề
}

Nếu không có vấn đề gì, trả về {"issues": [], "ok_count": N}.`;
}

async function auditBatch(batch, glossary) {
  const systemPrompt = buildSystemPrompt(glossary);
  const pairs = batch.map(item => ({
    key: item.key,
    zh: item.zh,
    vi: item.vi,
  }));

  const userPrompt = `Kiểm tra ${pairs.length} cặp dịch sau:\n\n${JSON.stringify(pairs, null, 2)}`;

  return await callGPT(systemPrompt, userPrompt);
}

async function main() {
  const args = parseArgs(process.argv);

  function readJson(p) {
    let content = fs.readFileSync(p, "utf8");
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    return JSON.parse(content);
  }

  const zh = readJson(ZH_PATH);
  const vi = readJson(VI_PATH);
  const glossary = readJson(GLOSSARY_PATH);

  const zhFlat = flattenKeys(zh);
  const pairs = [];

  for (const { key, value: zhValue } of zhFlat) {
    if (typeof zhValue !== "string" || !zhValue.trim()) continue;
    if (args.filter && !key.startsWith(args.filter)) continue;

    const viValue = getNested(vi, key);
    if (typeof viValue !== "string" || !viValue.trim() || viValue === "__MISSING__") continue;

    pairs.push({ key, zh: zhValue, vi: viValue });
  }

  console.log(`Auditing ${pairs.length} translated pairs (filter=${args.filter ?? "none"})...`);

  const allIssues = [];
  let totalOk = 0;
  const batchSize = args.batchSize;

  for (let i = 0; i < pairs.length; i += batchSize) {
    const batch = pairs.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(pairs.length / batchSize);
    process.stdout.write(`Batch ${batchNum}/${totalBatches} (${batch.length} pairs)...\n`);

    try {
      const result = await auditBatch(batch, glossary);
      if (Array.isArray(result.issues)) {
        allIssues.push(...result.issues);
      }
      totalOk += result.ok_count ?? (batch.length - (result.issues?.length ?? 0));
    } catch (err) {
      console.error(`  Batch ${batchNum} failed: ${err.message}`);
    }

    // Small delay to avoid rate limiting
    if (i + batchSize < pairs.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Report
  console.log("\n" + "=".repeat(60));
  console.log(`AUDIT REPORT`);
  console.log("=".repeat(60));
  console.log(`Total pairs checked: ${pairs.length}`);
  console.log(`OK: ${totalOk}`);
  console.log(`Issues found: ${allIssues.length}`);

  if (allIssues.length > 0) {
    console.log("\nISSUES:");
    for (const issue of allIssues) {
      console.log(`\n[${issue.issue}] ${issue.key}`);
      console.log(`  ZH: ${issue.zh}`);
      console.log(`  VI: ${issue.vi}`);
      if (issue.suggestion) console.log(`  → ${issue.suggestion}`);
    }
  }

  // Save report
  const reportPath = args.outputFile ?? path.join(REPO_ROOT, "scripts", "i18n", ".cache", "audit-report.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({ total: pairs.length, ok: totalOk, issues: allIssues }, null, 2));
  console.log(`\nFull report saved to: ${path.relative(REPO_ROOT, reportPath)}`);

  if (allIssues.length > 0) process.exit(1);
}

await main();
