#!/usr/bin/env node
/**
 * LLM-driven translator: zh-CN → vi-VN.
 *
 * STATUS: STUB FOR PHASE 1.
 *
 * Reads `shared/localization/locales/zh-CN.json`, finds every key whose
 * `vi-VN.json` value is `__MISSING__` or absent, batches them, calls
 * DeepSeek (the cheapest configured provider) with the project glossary
 * injected as a translation constraint, and writes the translated values
 * back to `vi-VN.json`.
 *
 * The full implementation lands in Phase 2 (task 2.3). For Phase 1 this
 * script intentionally exits 0 with an explanatory message so the
 * verification gate succeeds without having to make API calls.
 *
 * Usage (once implemented):
 *   pnpm tsx scripts/i18n/translate-locale.mjs --target vi-VN
 *   pnpm tsx scripts/i18n/translate-locale.mjs --target vi-VN --dry-run
 */

import process from "node:process";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(
    "Usage: translate-locale --target vi-VN [--dry-run] [--batch-size 50]\n",
  );
  process.exit(0);
}

process.stdout.write(
  "translate-locale: phase-1 stub. The full LLM translator is wired up in Phase 2 (task 2.3).\n" +
    "No keys are translated by this stub; it exits 0 so the Phase 1 verification gate passes.\n",
);
process.exit(0);
