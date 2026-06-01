/**
 * Property 6 — Output Language Directive invariant
 *
 * **Validates: Requirements 4.1, 4.2, 4.4**
 *
 * For every locale in SUPPORTED_LOCALES ('vi-VN', 'zh-CN'), call
 * buildOutputLanguageDirective(locale) and assert:
 *
 *   - When locale is 'vi-VN':
 *       • systemSuffix contains the substring '越南语'
 *       • systemSuffix contains at least 10 glossary pairs (lines matching
 *         the pattern "- <zh> -> <vi>")
 *
 *   - When locale is 'zh-CN':
 *       • systemSuffix is the empty string (no directive appended)
 *
 * These properties guarantee that:
 *   1. The vi-VN directive always instructs the LLM to output Vietnamese.
 *   2. The vi-VN directive always embeds enough glossary context for
 *      consistent craft-term translation.
 *   3. The zh-CN path is a strict no-op so legacy Chinese behaviour is
 *      never regressed by a Phase-5 commit.
 */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");

const {
  buildOutputLanguageDirective,
} = require("../dist/prompting/core/outputLanguage.js");

// ---------------------------------------------------------------------------
// Helpers

/**
 * Count the number of glossary pair lines in a directive systemSuffix.
 * A glossary pair line matches the format produced by formatGlossaryHint():
 *   "- <zh term> -> <vi term>"
 */
function countGlossaryPairs(systemSuffix) {
  return systemSuffix
    .split("\n")
    .filter((line) => /^- .+ -> .+/.test(line))
    .length;
}

// ---------------------------------------------------------------------------
// Property 6a — vi-VN directive contains '越南语' and ≥10 glossary pairs

test("[PBT] Property 6a: vi-VN directive always contains '越南语' and ≥10 glossary pairs", () => {
  /**
   * The locale 'vi-VN' is a constant, not a generated value, so we use
   * fc.constant to express "for all invocations of buildOutputLanguageDirective
   * with locale='vi-VN'". The property-based framing here verifies that the
   * function is deterministic and invariant across repeated calls — i.e. the
   * result never changes regardless of call order or call count.
   *
   * We sample 50 times to confirm determinism.
   */
  fc.assert(
    fc.property(
      fc.constant("vi-VN"),
      (locale) => {
        const directive = buildOutputLanguageDirective(locale);

        // The locale field must round-trip.
        assert.equal(directive.locale, "vi-VN");

        // The systemSuffix must contain the Vietnamese language marker.
        assert.ok(
          directive.systemSuffix.includes("越南语"),
          `vi-VN directive must contain '越南语' but got: ${directive.systemSuffix.slice(0, 120)}`,
        );

        // The systemSuffix must embed at least 10 glossary pairs.
        const pairCount = countGlossaryPairs(directive.systemSuffix);
        assert.ok(
          pairCount >= 10,
          `vi-VN directive must contain ≥10 glossary pairs but found ${pairCount}`,
        );

        // The glossaryHint field must be defined and non-empty.
        assert.ok(
          typeof directive.glossaryHint === "string" && directive.glossaryHint.length > 0,
          "vi-VN directive must have a non-empty glossaryHint",
        );

        return true;
      },
    ),
    { numRuns: 50 },
  );
});

// ---------------------------------------------------------------------------
// Property 6b — zh-CN directive is a strict no-op (empty systemSuffix)

test("[PBT] Property 6b: zh-CN directive always returns empty systemSuffix", () => {
  /**
   * Same determinism check for zh-CN. The property guarantees that no
   * Phase-5 commit can accidentally append a directive to Chinese-locale
   * invocations.
   */
  fc.assert(
    fc.property(
      fc.constant("zh-CN"),
      (locale) => {
        const directive = buildOutputLanguageDirective(locale);

        // The locale field must round-trip.
        assert.equal(directive.locale, "zh-CN");

        // The systemSuffix must be exactly the empty string.
        assert.equal(
          directive.systemSuffix,
          "",
          `zh-CN directive must have empty systemSuffix but got: ${JSON.stringify(directive.systemSuffix)}`,
        );

        // The glossaryHint must be undefined for zh-CN.
        assert.equal(
          directive.glossaryHint,
          undefined,
          "zh-CN directive must have undefined glossaryHint",
        );

        return true;
      },
    ),
    { numRuns: 50 },
  );
});

// ---------------------------------------------------------------------------
// Property 6c — all SUPPORTED_LOCALES are handled without throwing

test("[PBT] Property 6c: buildOutputLanguageDirective never throws for any SUPPORTED_LOCALE", () => {
  /**
   * For every locale in SUPPORTED_LOCALES, the function must return a
   * well-formed OutputLanguageDirective without throwing.
   *
   * Uses fc.constantFrom to enumerate the supported locale set.
   */
  const SUPPORTED_LOCALES = ["vi-VN", "zh-CN"];

  fc.assert(
    fc.property(
      fc.constantFrom(...SUPPORTED_LOCALES),
      (locale) => {
        let directive;
        assert.doesNotThrow(() => {
          directive = buildOutputLanguageDirective(locale);
        }, `buildOutputLanguageDirective must not throw for locale '${locale}'`);

        // The returned object must always have the required shape.
        assert.ok(directive !== undefined, "directive must be defined");
        assert.equal(typeof directive.locale, "string");
        assert.equal(typeof directive.systemSuffix, "string");

        // systemSuffix must be a string (possibly empty).
        assert.ok(
          directive.systemSuffix.length >= 0,
          "systemSuffix must be a string",
        );

        return true;
      },
    ),
    { numRuns: 100 },
  );
});
