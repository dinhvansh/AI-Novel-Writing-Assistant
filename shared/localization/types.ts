/**
 * Localization shared types.
 *
 * This file defines the locale codes and namespace identifiers consumed by
 * both the client (`client/src/i18n`) and the server (`server/src/i18n`).
 *
 * The runtime translation library (i18next) is wired up independently in
 * each consumer. This file intentionally has no runtime dependency.
 */

/** IETF BCP-47 tag for a supported locale. v1 supports `vi-VN` and `zh-CN` only. */
export type LocaleCode = "vi-VN" | "zh-CN";

/**
 * The closed allow-list of locales the application accepts.
 *
 * Adding a new locale (e.g. `en-US`) requires:
 *  1. Adding the tag here.
 *  2. Adding `shared/localization/locales/<code>.json`.
 *  3. Updating the `LocaleSwitcher` UI options.
 */
export const SUPPORTED_LOCALES: readonly LocaleCode[] = ["vi-VN", "zh-CN"] as const;

/** The locale used on first launch and when no preference is persisted. */
export const DEFAULT_LOCALE: LocaleCode = "vi-VN";

/**
 * The locale used when a key is missing from the user's chosen locale.
 * Falling back to `zh-CN` keeps the app readable while translation work is
 * in progress and matches the canonical source-of-truth bundle.
 */
export const FALLBACK_LOCALE: LocaleCode = "zh-CN";

/**
 * Top-level namespace identifiers. Every translation key is rooted under
 * exactly one of these. Keep this list in lockstep with the namespace tree
 * present at the top of every `locales/*.json` file.
 */
export type NamespaceKey =
  | "common"
  | "novel"
  | "autoDirector"
  | "creativeHub"
  | "antiAiRules"
  | "knowledge"
  | "bookAnalysis"
  | "settings"
  | "serverErrors"
  | "serverLogs"
  | "seedData"
  | "world"
  | "characters"
  | "genre"
  | "genres"
  | "storyModes"
  | "writingFormula"
  | "chat"
  | "tasks"
  | "promptWorkbench"
  | "autoDirectorFollowUps"
  | "titles"
  | "desktop"
  | "mobile"
  | "workflow";

/** All supported namespaces, in deterministic order. */
export const NAMESPACE_KEYS: readonly NamespaceKey[] = [
  "common",
  "novel",
  "autoDirector",
  "creativeHub",
  "antiAiRules",
  "knowledge",
  "bookAnalysis",
  "settings",
  "serverErrors",
  "serverLogs",
  "seedData",
  "world",
  "characters",
  "genre",
  "genres",
  "storyModes",
  "writingFormula",
  "chat",
  "tasks",
  "promptWorkbench",
  "autoDirectorFollowUps",
  "titles",
  "desktop",
  "mobile",
  "workflow",
] as const;

/**
 * Type guard for `LocaleCode`. Use this when accepting user-supplied locale
 * strings (e.g. from the `Accept-Language` header) before passing them
 * downstream.
 */
export function isLocaleCode(value: unknown): value is LocaleCode {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Type guard for `NamespaceKey`. Mostly useful in test fixtures and the
 * coverage gate script.
 */
export function isNamespaceKey(value: unknown): value is NamespaceKey {
  return typeof value === "string" && (NAMESPACE_KEYS as readonly string[]).includes(value);
}
