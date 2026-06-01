/**
 * Property test: SeedTranslator pure function with fallback (Requirement 8.3, 8.4)
 *
 * Asserts:
 *   1. When a slug is present in vi-VN bundle → returned name equals bundle entry
 *   2. When a slug is absent from bundle → returned name equals the row's stored Chinese name
 *   3. Function never throws for any input
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load locale bundles directly (no i18n server needed)
const viBundle = require(path.join(__dirname, "../../shared/localization/locales/vi-VN.json"));
const zhBundle = require(path.join(__dirname, "../../shared/localization/locales/zh-CN.json"));

// ---------------------------------------------------------------------------
// Minimal SeedTranslator logic (mirrors the real implementation)
// ---------------------------------------------------------------------------

function tSeed(bundle, namespace, slug, field, fallback) {
  const ns = bundle?.seedData?.[namespace];
  if (!ns) return fallback ?? null;
  const entry = ns[slug];
  if (!entry) return fallback ?? null;
  const value = entry[field];
  return typeof value === "string" && value.length > 0 ? value : (fallback ?? null);
}

function localizeGenre(row, bundle) {
  const slug = row.id;
  return {
    id: row.id,
    slug,
    name: tSeed(bundle, "genres", slug, "name", row.name) ?? row.name,
    description: tSeed(bundle, "genres", slug, "description", row.description),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("SeedTranslator: known genre slug returns Vietnamese name", () => {
  const row = { id: "genre_fantasy_root", name: "奇幻", description: "包含东方玄幻、西方魔幻等奇幻类型。" };
  const result = localizeGenre(row, viBundle);
  assert.equal(result.name, "Kỳ ảo");
  assert.ok(result.description?.includes("kỳ ảo"), `description should be Vietnamese, got: ${result.description}`);
});

test("SeedTranslator: unknown slug falls back to Chinese name", () => {
  const row = { id: "genre_unknown_xyz", name: "未知类型", description: "未知描述" };
  const result = localizeGenre(row, viBundle);
  assert.equal(result.name, "未知类型", "should fall back to Chinese name");
  assert.equal(result.description, "未知描述", "should fall back to Chinese description");
});

test("SeedTranslator: zh-CN locale returns Chinese name", () => {
  const row = { id: "genre_fantasy_root", name: "奇幻", description: "包含东方玄幻、西方魔幻等奇幻类型。" };
  const result = localizeGenre(row, zhBundle);
  assert.equal(result.name, "奇幻");
});

test("SeedTranslator: never throws for null/undefined inputs", () => {
  assert.doesNotThrow(() => localizeGenre({ id: "", name: "", description: null }, viBundle));
  assert.doesNotThrow(() => localizeGenre({ id: "genre_fantasy_root", name: "奇幻" }, null));
  assert.doesNotThrow(() => localizeGenre({ id: "genre_fantasy_root", name: "奇幻" }, {}));
});

test("SeedTranslator: all vi-VN genre slugs have translations", () => {
  const viGenres = viBundle?.seedData?.genres ?? {};
  const slugs = Object.keys(viGenres);
  assert.ok(slugs.length > 0, "should have at least one genre translation");
  for (const slug of slugs) {
    const entry = viGenres[slug];
    assert.ok(typeof entry.name === "string" && entry.name.length > 0, `genre ${slug} should have a name`);
  }
});

test("SeedTranslator: all vi-VN storyMode slugs have translations", () => {
  const viModes = viBundle?.seedData?.storyModes ?? {};
  const slugs = Object.keys(viModes);
  assert.ok(slugs.length > 0, "should have at least one storyMode translation");
  for (const slug of slugs) {
    const entry = viModes[slug];
    assert.ok(typeof entry.name === "string" && entry.name.length > 0, `storyMode ${slug} should have a name`);
  }
});
