/**
 * SeedTranslator — localizes seed-data rows (genres, story modes, anti-AI rules,
 * style templates) using the `seedData.*` namespace in the locale bundles.
 *
 * The slug key for each row is:
 *   - NovelGenre / NovelStoryMode: the row `id` (already slug-like, e.g. `genre_fantasy_root`)
 *   - AntiAiRule / StyleTemplate: the row `key` field
 *
 * If a translation is missing the original Chinese name/description is returned
 * as a fallback — the user sees Chinese rather than a raw key or an error.
 */

import { DEFAULT_LOCALE, type LocaleCode } from "@ai-novel/shared/localization";
import { getI18nServerHandle } from "../../i18n";

// ---------------------------------------------------------------------------
// Types

export interface LocalizedSeedRow {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

// ---------------------------------------------------------------------------
// Internal helpers

function tSeed(
  locale: LocaleCode,
  namespace: string,
  slug: string,
  field: "name" | "description",
  fallback: string | null | undefined,
): string | null {
  const handle = getI18nServerHandle();
  if (!handle) {
    return fallback ?? null;
  }
  const key = `${namespace}.${slug}.${field}`;
  const result = handle.t("seedData", key, { lng: locale });
  // i18next returns the raw key when missing — treat that as a miss
  if (typeof result === "string" && result !== `seedData:${key}` && result !== key) {
    return result;
  }
  return fallback ?? null;
}

// ---------------------------------------------------------------------------
// Public API

export function localizeGenre(
  row: { id: string; name: string; description?: string | null },
  locale: LocaleCode = DEFAULT_LOCALE,
): LocalizedSeedRow {
  const slug = row.id;
  return {
    id: row.id,
    slug,
    name: tSeed(locale, "genres", slug, "name", row.name) ?? row.name,
    description: tSeed(locale, "genres", slug, "description", row.description),
  };
}

export function localizeStoryMode(
  row: { id: string; name: string; description?: string | null },
  locale: LocaleCode = DEFAULT_LOCALE,
): LocalizedSeedRow {
  const slug = row.id;
  return {
    id: row.id,
    slug,
    name: tSeed(locale, "storyModes", slug, "name", row.name) ?? row.name,
    description: tSeed(locale, "storyModes", slug, "description", row.description),
  };
}

export function localizeAntiAiRule(
  row: { id: string; key: string; name: string; description?: string | null },
  locale: LocaleCode = DEFAULT_LOCALE,
): LocalizedSeedRow {
  const slug = row.key;
  return {
    id: row.id,
    slug,
    name: tSeed(locale, "antiAiRules", slug, "name", row.name) ?? row.name,
    description: tSeed(locale, "antiAiRules", slug, "description", row.description),
  };
}

export function localizeStyleTemplate(
  row: { id: string; key?: string | null; name: string; description?: string | null },
  locale: LocaleCode = DEFAULT_LOCALE,
): LocalizedSeedRow {
  const slug = row.key ?? row.id;
  return {
    id: row.id,
    slug,
    name: tSeed(locale, "styleTemplates", slug, "name", row.name) ?? row.name,
    description: tSeed(locale, "styleTemplates", slug, "description", row.description),
  };
}

/**
 * Convenience: localize an array of genre rows.
 */
export function localizeGenres(
  rows: Array<{ id: string; name: string; description?: string | null }>,
  locale: LocaleCode = DEFAULT_LOCALE,
): LocalizedSeedRow[] {
  return rows.map((row) => localizeGenre(row, locale));
}

export function localizeStoryModes(
  rows: Array<{ id: string; name: string; description?: string | null }>,
  locale: LocaleCode = DEFAULT_LOCALE,
): LocalizedSeedRow[] {
  return rows.map((row) => localizeStoryMode(row, locale));
}
