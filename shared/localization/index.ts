/**
 * Public surface of the `@ai-novel/shared/localization` module.
 *
 * Consumers (client and server i18n bootstraps) import locale codes,
 * namespace identifiers, the glossary, and locale bundles from here.
 *
 * The actual `i18next` runtime is configured independently in each
 * consumer; this module deliberately has no runtime translation library
 * dependency.
 */

export type { LocaleCode, NamespaceKey } from "./types.js";
export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  NAMESPACE_KEYS,
  isLocaleCode,
  isNamespaceKey,
} from "./types.js";

export type { GlossaryCategory, GlossaryEntry, GlossaryFile } from "./glossary.js";
export {
  loadGlossary,
  loadGlossaryByCategory,
  buildGlossaryLookup,
} from "./glossary.js";

import zhCN from "./locales/zh-CN.json" with { type: "json" };
import viVN from "./locales/vi-VN.json" with { type: "json" };

/**
 * Eager-loaded locale bundles. Both client and server can import these
 * directly to seed their `i18next` instance.
 *
 * The `zh-CN` bundle is the canonical source-of-truth (developers add new
 * keys here first); `vi-VN` is translated from it.
 */
export const LOCALE_BUNDLES = {
  "zh-CN": zhCN,
  "vi-VN": viVN,
} as const;
