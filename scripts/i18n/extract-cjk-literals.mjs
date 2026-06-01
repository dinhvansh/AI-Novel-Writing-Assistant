#!/usr/bin/env node
/**
 * Extract CJK string literals from TypeScript source files.
 *
 * Walks `.ts` / `.tsx` under the configured roots, parses each file
 * with the TypeScript compiler API, and emits every string literal
 * (including template literals) that contains at least one CJK Unified
 * Ideograph (Unicode range \u4e00-\u9fff).
 *
 * Output: tab-separated rows under `scripts/i18n/.cache/candidates.tsv`
 *   filepath \t line \t column \t literal \t containing-function
 *
 * Usage:
 *   pnpm tsx scripts/i18n/extract-cjk-literals.mjs
 *   pnpm tsx scripts/i18n/extract-cjk-literals.mjs --filter 'client/src/components/autoDirector/**'
 *
 * Respects `.i18nignore` (gitignore-syntax glob list).
 *
 * The extracted candidates are then reviewed by a human (or the LLM
 * translator), wrapped with `t()` calls, and the new keys flow through
 * `sync-locale-keys.mjs` into the locale bundles.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import url from "node:url";
import ts from "typescript";

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const CACHE_DIR = path.join(REPO_ROOT, "scripts", "i18n", ".cache");
const OUTPUT_PATH = path.join(CACHE_DIR, "candidates.tsv");
const I18NIGNORE_PATH = path.join(REPO_ROOT, ".i18nignore");

const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/;

const DEFAULT_ROOTS = [
  path.join(REPO_ROOT, "client", "src"),
  path.join(REPO_ROOT, "server", "src"),
];

function parseArgs(argv) {
  const out = { filterGlob: null, roots: DEFAULT_ROOTS };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--filter" && argv[i + 1]) {
      out.filterGlob = argv[i + 1];
      i += 1;
    } else if (arg === "--root" && argv[i + 1]) {
      out.roots = [path.resolve(argv[i + 1])];
      i += 1;
    }
  }
  return out;
}

function loadIgnorePatterns() {
  if (!fs.existsSync(I18NIGNORE_PATH)) return [];
  return fs
    .readFileSync(I18NIGNORE_PATH, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function globToRegExp(pattern) {
  // Minimal gitignore-style glob to RegExp conversion. Sufficient for
  // the patterns we use in `.i18nignore`.
  let re = "^";
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === "*") {
      if (pattern[i + 1] === "*") {
        re += ".*";
        i += 2;
        if (pattern[i] === "/") i += 1;
      } else {
        re += "[^/]*";
        i += 1;
      }
    } else if (ch === "?") {
      re += "[^/]";
      i += 1;
    } else if (".+^$()|[]{}".includes(ch)) {
      re += `\\${ch}`;
      i += 1;
    } else if (ch === "/") {
      re += "/";
      i += 1;
    } else {
      re += ch;
      i += 1;
    }
  }
  re += "$";
  return new RegExp(re);
}

function buildIgnoreMatcher(patterns) {
  const compiled = patterns.map((pattern) => globToRegExp(pattern));
  return function isIgnored(relativePath) {
    return compiled.some((rx) => rx.test(relativePath));
  };
}

function isSourceFile(file) {
  return file.endsWith(".ts") || file.endsWith(".tsx");
}

async function* walkDirectory(root) {
  let entries;
  try {
    entries = await fs.promises.readdir(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".next") {
        continue;
      }
      yield* walkDirectory(full);
    } else if (entry.isFile() && isSourceFile(entry.name)) {
      yield full;
    }
  }
}

function literalContainsCJK(text) {
  return CJK_REGEX.test(text);
}

/**
 * Build a set of line numbers (1-based) that are covered by an
 * `// i18n-ignore` annotation.  The rules mirror the P6 check in
 * verify-locale-coverage.mjs:
 *
 *  1. A line that itself contains `i18n-ignore` is ignored.
 *  2. A line whose *previous* line contains `i18n-ignore` is ignored.
 *  3. If a line with `i18n-ignore` is immediately followed by a line
 *     that opens a block (`{` or `[`), every line inside that block
 *     (until the matching close) is ignored.
 *  4. Lines that are already wrapped: `t ? t("key") : "CJK"` pattern.
 *  5. Lines that are already wrapped: `t("key", "fallback")` pattern.
 */
function buildIgnoredLineSet(source) {
  const lines = source.split(/\r?\n/);
  const ignored = new Set();
  let ignoreBlock = false;
  let braceDepth = 0;
  let ignoreBlockStartDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : "";
    const openBraces = (line.match(/[{[]/g) || []).length;
    const closeBraces = (line.match(/[}\]]/g) || []).length;

    // If previous line has i18n-ignore and current line opens a block,
    // OR if current line has both i18n-ignore and opens a block,
    // start ignoring the whole block.
    const lineOpensBlock = line.includes("{") || line.includes("[");
    if (lineOpensBlock && (prevLine.includes("i18n-ignore") || line.includes("i18n-ignore"))) {
      ignoreBlock = true;
      ignoreBlockStartDepth = braceDepth;
    }
    braceDepth += openBraces - closeBraces;
    if (ignoreBlock && braceDepth <= ignoreBlockStartDepth) {
      ignoreBlock = false;
    }

    if (ignoreBlock) {
      ignored.add(i + 1); // 1-based
      continue;
    }
    // Same-line or previous-line annotation
    if (line.includes("i18n-ignore") || prevLine.includes("i18n-ignore")) {
      ignored.add(i + 1);
      continue;
    }
    // JSX option value="CJK" — DB/API values matched against backend enums
    if (/value=["'][^"']*[\u4e00-\u9fff][^"']*["']/.test(line)) {
      ignored.add(i + 1);
      continue;
    }
    // Already wrapped: t ? t("key") : "CJK" or condition ? t("key") : "CJK"
    if (/\?\s*t\s*\(/.test(line) && /:\s*['"`]/.test(line)) {
      ignored.add(i + 1);
      continue;
    }
    // Already wrapped: t("key", "fallback") — second arg is the fallback
    if (/\bt\s*\(\s*['"`][^'"`]*['"`]\s*,\s*['"`]/.test(line)) {
      ignored.add(i + 1);
      continue;
    }
    // Template literal fallback: `${scope}Chinese` after ternary
    if (/\?\s*t\s*\(/.test(line) && /:\s*`/.test(line)) {
      ignored.add(i + 1);
      continue;
    }
  }
  return ignored;
}

function extractLiteralsFromFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const ignoredLines = buildIgnoredLineSet(source);
  const sf = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const hits = [];
  function visit(node) {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node)
    ) {
      const text = node.text;
      if (typeof text === "string" && literalContainsCJK(text)) {
        const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        const lineNumber = line + 1; // 1-based
        if (!ignoredLines.has(lineNumber)) {
          hits.push({
            line: lineNumber,
            column: character + 1,
            literal: text,
          });
        }
      }
    } else if (ts.isTemplateExpression(node)) {
      // Concatenate the static parts to spot CJK in template literals
      // even when interpolations are present.
      const staticParts =
        node.head.text +
        node.templateSpans.map((span) => span.literal.text).join("");
      if (literalContainsCJK(staticParts)) {
        const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        const lineNumber = line + 1; // 1-based
        if (!ignoredLines.has(lineNumber)) {
          hits.push({
            line: lineNumber,
            column: character + 1,
            literal: staticParts,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return hits;
}

function escapeTsv(value) {
  return value.replace(/\\/g, "\\\\").replace(/\t/g, "\\t").replace(/\r?\n/g, "\\n");
}

async function main() {
  const args = parseArgs(process.argv);
  const ignorePatterns = loadIgnorePatterns();
  const isIgnored = buildIgnoreMatcher(ignorePatterns);

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const out = fs.openSync(OUTPUT_PATH, "w");
  fs.writeSync(out, "filepath\tline\tcolumn\tliteral\n");

  let totalFiles = 0;
  let totalHits = 0;

  const filterRegex = args.filterGlob ? globToRegExp(args.filterGlob) : null;

  for (const root of args.roots) {
    for await (const file of walkDirectory(root)) {
      const rel = path.relative(REPO_ROOT, file).replace(/\\/g, "/");
      if (isIgnored(rel)) continue;
      if (filterRegex && !filterRegex.test(rel)) continue;
      totalFiles += 1;
      const hits = extractLiteralsFromFile(file);
      for (const hit of hits) {
        fs.writeSync(
          out,
          `${rel}\t${hit.line}\t${hit.column}\t${escapeTsv(hit.literal)}\n`,
        );
        totalHits += 1;
      }
    }
  }
  fs.closeSync(out);

  process.stdout.write(
    `Scanned ${totalFiles} file(s); wrote ${totalHits} CJK literal(s) to ${OUTPUT_PATH}\n`,
  );
}

await main();
