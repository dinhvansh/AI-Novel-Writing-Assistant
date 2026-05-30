/**
 * i18next-parser configuration.
 *
 * Run via:
 *
 *   pnpm dlx i18next-parser --config i18next-parser.config.cjs
 *
 * or wrapped by `scripts/i18n/sync-locale-keys.mjs`.
 *
 * Output:
 *  - Updates `shared/localization/locales/zh-CN.json` with every key
 *    referenced via `t()` in the source.
 *  - Adds `__MISSING__` placeholders to `shared/localization/locales/vi-VN.json`
 *    for every new key, so the translator pipeline can find them.
 */

/** @type {import('i18next-parser').UserConfig} */
module.exports = {
  // Source files to scan.
  input: [
    "client/src/**/*.{ts,tsx}",
    "server/src/**/*.ts",
    "!**/*.test.ts",
    "!**/*.test.tsx",
    "!**/__fixtures__/**",
    "!**/node_modules/**",
    "!**/dist/**",
  ],

  // Where the locale bundles live.
  output: "shared/localization/locales/$LOCALE.json",

  // The locales we maintain. zh-CN is the canonical source-of-truth;
  // vi-VN is translated from it.
  locales: ["zh-CN", "vi-VN"],

  // Default values for new keys.
  defaultValue: function defaultValue(locale, _ns, key) {
    if (locale === "zh-CN") {
      // The developer should manually fill in the canonical Chinese
      // string after running the parser; this placeholder makes
      // unfilled keys obvious.
      return `__TODO_ZH__:${key}`;
    }
    return "__MISSING__";
  },

  // Namespace separator: we use `:` between namespace and dotted key
  // (e.g. `common:actions.save`).
  namespaceSeparator: ":",
  keySeparator: ".",

  // Preserve existing translations on subsequent runs.
  keepRemoved: false,
  createOldCatalogs: false,

  // Functions / hooks the parser should treat as translation calls.
  lexers: {
    ts: ["JavascriptLexer"],
    tsx: ["JsxLexer"],
    default: ["JavascriptLexer"],
  },

  // The signatures we recognise.
  contextSeparator: "_",
  pluralSeparator: "_",

  // Sort keys alphabetically so diffs are clean.
  sort: true,

  verbose: false,
};
