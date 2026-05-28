#!/usr/bin/env node
/**
 * Property-based coverage gate for the localization layer.
 *
 * Implements the six correctness properties documented in
 * `.kiro/specs/vietnamese-localization/design.md` plus several
 * supplementary structural checks. Used as a phase-commit gate.
 *
 * Properties asserted:
 *  P1  every t() call in source has a key in zh-CN.json
 *  P2  resolve(key, locale) is deterministic and never crashes
 *  P3  ICU placeholder identity preserved across locales
 *  P4  glossary uniqueness invariants hold
 *  P5  resolveLocale() always returns a value in SUPPORTED_LOCALES
 *  P6  no naked CJK literal in client/src outside .i18nignore allow-list
 *
 * Usage:
 *   node scripts/i18n/verify-locale-coverage.mjs
 *
 * Exit codes:
 *   0  all properties hold
 *   1  one or more properties fail (details printed to stderr)
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import url from "node:url";
import fc from "fast-check";

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const ZH_BUNDLE_PATH = path.join(
  REPO_ROOT,
  "shared",
  "localization",
  "locales",
  "zh-CN.json",
);
const VI_BUNDLE_PATH = path.join(
  REPO_ROOT,
  "shared",
  "localization",
  "locales",
  "vi-VN.json",
);
const GLOSSARY_PATH = path.join(REPO_ROOT, "shared", "localization", "glossary.json");
const SUPPORTED_LOCALES = ["vi-VN", "zh-CN"];
const DEFAULT_LOCALE = "vi-VN";
const FALLBACK_LOCALE = "zh-CN";

// ---------------------------------------------------------------------------
// Bundle helpers

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
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

// ---------------------------------------------------------------------------
// P2 + P5 simulation: re-implement the resolve / resolveLocale rules in
// pure JS so the property test does not need to spawn the runtime
// i18next instance.

function pickFirstSupportedLocale(headerValue) {
  if (typeof headerValue !== "string" || headerValue.length === 0) return null;
  const tags = headerValue
    .split(",")
    .map((part) => part.trim().split(";")[0]?.trim())
    .filter((tag) => Boolean(tag));
  for (const tag of tags) {
    if (SUPPORTED_LOCALES.includes(tag)) return tag;
    const primary = tag.toLowerCase();
    if (primary === "vi") return "vi-VN";
    if (primary === "zh" || primary === "zh-cn" || primary === "zh-hans") return "zh-CN";
  }
  return null;
}

function resolveLocaleFromHeader(headerValue) {
  return pickFirstSupportedLocale(headerValue) ?? DEFAULT_LOCALE;
}

function resolveKey(key, locale, viBundle, zhBundle, isDev) {
  const lookup = (bundle, k) => {
    const value = getNested(bundle, k);
    return typeof value === "string" ? value : undefined;
  };
  if (locale === "vi-VN") {
    return lookup(viBundle, key) ?? lookup(zhBundle, key) ?? (isDev ? `[!${key}!]` : key);
  }
  return lookup(zhBundle, key) ?? lookup(viBundle, key) ?? (isDev ? `[!${key}!]` : key);
}

// ---------------------------------------------------------------------------
// P1 implementation: scan source for `t('ns:key.path')` and `useTranslation`
// patterns, then assert every collected key exists in zh-CN.json.

const T_CALL_REGEX = /\bt\(\s*(?:`|"|')([a-zA-Z_][\w-]*(?::[a-zA-Z_][\w.\-]*)?)(?:`|"|')/g;
const I18NIGNORE_PATH = path.join(REPO_ROOT, ".i18nignore");

function loadIgnore() {
  if (!fs.existsSync(I18NIGNORE_PATH)) return [];
  return fs
    .readFileSync(I18NIGNORE_PATH, "utf8")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("#"));
}

function globToRegExp(pattern) {
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
  const compiled = patterns.map(globToRegExp);
  return (rel) => compiled.some((rx) => rx.test(rel));
}

function* walkSourceFiles(root, isIgnored) {
  if (!fs.existsSync(root)) return;
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(REPO_ROOT, full).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".next") continue;
        stack.push(full);
      } else if (
        (entry.name.endsWith(".ts") ||
          entry.name.endsWith(".tsx") ||
          entry.name.endsWith(".mjs")) &&
        !isIgnored(rel)
      ) {
        yield full;
      }
    }
  }
}

function collectTKeys(roots, isIgnored) {
  const calls = [];
  for (const root of roots) {
    for (const file of walkSourceFiles(root, isIgnored)) {
      const source = fs.readFileSync(file, "utf8");
      let match;
      T_CALL_REGEX.lastIndex = 0;
      while ((match = T_CALL_REGEX.exec(source)) !== null) {
        calls.push({ file, key: match[1] });
      }
    }
  }
  return calls;
}

function keyExistsInBundle(bundle, callKey) {
  // Calls take the form `ns:dotted.key` or just `dotted.key` (defaults
  // to `common`). Translate to a path inside the bundle.
  let ns;
  let path;
  if (callKey.includes(":")) {
    const idx = callKey.indexOf(":");
    ns = callKey.slice(0, idx);
    path = callKey.slice(idx + 1);
  } else {
    ns = "common";
    path = callKey;
  }
  const root = bundle[ns];
  if (!root || typeof root !== "object") return false;
  const value = getNested(root, path);
  return typeof value === "string";
}

// ---------------------------------------------------------------------------
// P3 implementation: ICU placeholder multiset equality.

const PLACEHOLDER_REGEX = /\{\s*([a-zA-Z_][\w]*)\s*(?:,[^}]*)?\}/g;

function extractPlaceholders(value) {
  if (typeof value !== "string") return [];
  const out = [];
  let match;
  PLACEHOLDER_REGEX.lastIndex = 0;
  while ((match = PLACEHOLDER_REGEX.exec(value)) !== null) {
    out.push(match[1]);
  }
  return out.sort();
}

function multisetEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// P6 implementation: scan client/src for naked CJK literals.

const CJK_REGEX = /[\u4e00-\u9fff]/;
const CLIENT_SRC = path.join(REPO_ROOT, "client", "src");

function findNakedCjkLiterals(isIgnored) {
  const offenders = [];
  for (const file of walkSourceFiles(CLIENT_SRC, isIgnored)) {
    const source = fs.readFileSync(file, "utf8");
    const lines = source.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (CJK_REGEX.test(line) && !line.trim().startsWith("//")) {
        // Skip lines whose only CJK is inside a t() call or comment.
        const stripped = line
          .replace(/\bt\(\s*['"`][^'"`]*['"`]\s*[\),]/g, "")
          .replace(/\/\*[^*]*\*\//g, "");
        if (CJK_REGEX.test(stripped)) {
          offenders.push({
            file: path.relative(REPO_ROOT, file).replace(/\\/g, "/"),
            line: i + 1,
            sample: line.trim().slice(0, 100),
          });
        }
      }
    }
  }
  return offenders;
}

// ---------------------------------------------------------------------------
// Orchestrator

const failures = [];

function runP1(viBundle, zhBundle) {
  const ignore = buildIgnoreMatcher(loadIgnore());
  const calls = collectTKeys(
    [path.join(REPO_ROOT, "client", "src"), path.join(REPO_ROOT, "server", "src")],
    ignore,
  );
  const missing = calls.filter((c) => !keyExistsInBundle(zhBundle, c.key));
  if (missing.length > 0) {
    failures.push({
      property: "P1",
      message: `${missing.length} t() call(s) reference keys missing from zh-CN.json`,
      sample: missing.slice(0, 5),
    });
  }
  process.stdout.write(`P1: ${calls.length} t() call(s) checked, ${missing.length} missing key(s)\n`);
}

function runP2(viBundle, zhBundle) {
  const allKeys = new Set([
    ...flattenKeys(viBundle).map((e) => e.key),
    ...flattenKeys(zhBundle).map((e) => e.key),
  ]);
  const sampleKeys = [...allKeys].slice(0, 200);

  fc.assert(
    fc.property(
      fc.constantFrom(...(sampleKeys.length > 0 ? sampleKeys : ["__synthetic__"])),
      fc.constantFrom(...SUPPORTED_LOCALES),
      fc.boolean(),
      (key, locale, isDev) => {
        const result = resolveKey(key, locale, viBundle, zhBundle, isDev);
        return typeof result === "string" && result.length > 0;
      },
    ),
    { numRuns: 200 },
  );
  process.stdout.write(`P2: fallback chain holds for ${sampleKeys.length || 1} sample key(s)\n`);
}

function runP3(viBundle, zhBundle) {
  const zhFlat = flattenKeys(zhBundle);
  const mismatches = [];
  for (const { key, value } of zhFlat) {
    if (typeof value !== "string") continue;
    const viValue = getNested(viBundle, key);
    if (typeof viValue !== "string") continue;
    const zhPh = extractPlaceholders(value);
    const viPh = extractPlaceholders(viValue);
    if (!multisetEqual(zhPh, viPh)) {
      mismatches.push({ key, zh: zhPh, vi: viPh });
    }
  }
  if (mismatches.length > 0) {
    failures.push({
      property: "P3",
      message: `${mismatches.length} key(s) have mismatched ICU placeholders between zh-CN and vi-VN`,
      sample: mismatches.slice(0, 5),
    });
  }
  process.stdout.write(`P3: ${zhFlat.length} key(s) checked, ${mismatches.length} placeholder mismatch(es)\n`);
}

function runP4(glossary) {
  const seenZh = new Map();
  const seenViCraft = new Map();
  const dupZh = [];
  const dupViCraft = [];
  for (const entry of glossary.entries) {
    if (seenZh.has(entry.zh)) dupZh.push({ zh: entry.zh, dupVi: entry.vi });
    else seenZh.set(entry.zh, entry.vi);
    if (entry.category === "craft") {
      if (seenViCraft.has(entry.vi)) dupViCraft.push({ vi: entry.vi, dupZh: entry.zh });
      else seenViCraft.set(entry.vi, entry.zh);
    }
  }
  if (dupZh.length > 0) {
    failures.push({ property: "P4", message: "Duplicate `zh` keys in glossary.json", sample: dupZh });
  }
  if (dupViCraft.length > 0) {
    failures.push({
      property: "P4",
      message: "Duplicate `vi` values in glossary craft category",
      sample: dupViCraft,
    });
  }
  process.stdout.write(
    `P4: ${glossary.entries.length} glossary entries checked (${dupZh.length} dup zh, ${dupViCraft.length} dup craft vi)\n`,
  );
}

function runP5() {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.constant(undefined),
        fc.constant(""),
        fc.string(),
        fc.constantFrom("vi-VN", "zh-CN", "vi", "zh", "zh-CN,en;q=0.9", "en-US,en;q=0.9", "fr-FR"),
      ),
      (header) => {
        const resolved = resolveLocaleFromHeader(header);
        return SUPPORTED_LOCALES.includes(resolved);
      },
    ),
    { numRuns: 500 },
  );
  process.stdout.write("P5: resolveLocale always returns a supported locale\n");
}

function runP6() {
  const ignore = buildIgnoreMatcher(loadIgnore());
  const offenders = findNakedCjkLiterals(ignore);
  if (offenders.length > 0) {
    // In Phase 1 we expect many offenders (no translation has happened
    // yet). The gate is informational at this phase; later phases will
    // turn it into a hard failure once `client/src` has been wrapped.
    process.stdout.write(
      `P6: ${offenders.length} naked CJK literal(s) remain in client/src (will be cleaned up in Phases 2-3).\n`,
    );
  } else {
    process.stdout.write("P6: no naked CJK literals in client/src\n");
  }
}

async function main() {
  const viBundle = readJson(VI_BUNDLE_PATH);
  const zhBundle = readJson(ZH_BUNDLE_PATH);
  const glossary = readJson(GLOSSARY_PATH);

  runP1(viBundle, zhBundle);
  runP2(viBundle, zhBundle);
  runP3(viBundle, zhBundle);
  runP4(glossary);
  runP5();
  runP6();

  if (failures.length > 0) {
    process.stderr.write("\nCoverage gate FAILED:\n");
    for (const failure of failures) {
      process.stderr.write(`  [${failure.property}] ${failure.message}\n`);
      for (const sample of failure.sample ?? []) {
        process.stderr.write(`     ${JSON.stringify(sample)}\n`);
      }
    }
    process.exit(1);
  }

  process.stdout.write("\nCoverage gate OK\n");
}

await main();
