/**
 * Glossary loader and types.
 *
 * The glossary is the single source-of-truth for fiction-craft term
 * translations between Chinese and Vietnamese. It is consumed by:
 *
 *  - The translation script (`scripts/i18n/translate-locale.mjs`) — injected
 *    into the LLM prompt so machine translation honours canonical terms.
 *  - The runtime Output Language Directive (server-side) — embedded into
 *    the AI system message so generated novel content follows the same
 *    canonical terms.
 *  - The coverage gate (`scripts/i18n/verify-locale-coverage.mjs`) —
 *    checked for uniqueness invariants.
 */

import glossaryRaw from "./glossary.json" with { type: "json" };

/** Categories tag the entry's intended use. */
export type GlossaryCategory = "craft" | "workflow" | "ui" | "product";

/** A single canonical (Chinese, Vietnamese) translation pair. */
export interface GlossaryEntry {
  /** The Chinese term, exactly as it appears in source-of-truth bundles. */
  zh: string;
  /** The canonical Vietnamese translation. */
  vi: string;
  /** Domain category. */
  category: GlossaryCategory;
  /** Optional notes for translators / future contributors. */
  notes?: string;
}

/** The on-disk shape of `glossary.json`. */
export interface GlossaryFile {
  version: 1;
  generatedAt: string;
  entries: GlossaryEntry[];
}

/**
 * Return the glossary as a defensive copy. Callers must not mutate the
 * returned array; treat it as immutable.
 */
export function loadGlossary(): GlossaryEntry[] {
  const file = glossaryRaw as GlossaryFile;
  return file.entries.slice();
}

/**
 * Filter glossary entries by category. Useful when the Output Language
 * Directive only wants `craft`-category terms in its prompt excerpt.
 */
export function loadGlossaryByCategory(category: GlossaryCategory): GlossaryEntry[] {
  return loadGlossary().filter((entry) => entry.category === category);
}

/**
 * Build a `Map<zh, vi>` lookup. The keys are unique by construction (the
 * coverage gate enforces zh-uniqueness).
 */
export function buildGlossaryLookup(): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of loadGlossary()) {
    map.set(entry.zh, entry.vi);
  }
  return map;
}
