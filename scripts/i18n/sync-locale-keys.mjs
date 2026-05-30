#!/usr/bin/env node
/**
 * Sync translation keys referenced via `t()` in source code with the
 * canonical zh-CN bundle.
 *
 * Phase 1 implementation: this is a thin wrapper around `i18next-parser`
 * that simply spawns the CLI and reports the exit status.
 *
 * Usage:
 *   pnpm tsx scripts/i18n/sync-locale-keys.mjs
 *   pnpm tsx scripts/i18n/sync-locale-keys.mjs --fail-on-missing
 */

import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import url from "node:url";

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const CONFIG_PATH = path.join(REPO_ROOT, "i18next-parser.config.cjs");

function runI18nextParser() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      ["dlx", "i18next-parser", "--config", CONFIG_PATH],
      { stdio: "inherit", cwd: REPO_ROOT, shell: true },
    );
    child.on("error", reject);
    child.on("exit", (code) => {
      resolve(code ?? 0);
    });
  });
}

async function main() {
  const code = await runI18nextParser();
  if (code !== 0) {
    process.stderr.write(`i18next-parser exited with code ${code}\n`);
    process.exit(code);
  }
  process.stdout.write("sync-locale-keys: OK\n");
}

await main();
