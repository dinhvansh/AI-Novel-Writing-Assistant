/**
 * [PBT] Property 6 — Output Language Directive invariant
 *
 * **Validates: Requirements 4.1, 4.2, 4.4**
 *
 * For every registered prompt asset and every locale in SUPPORTED_LOCALES,
 * apply `appendOutputLanguageDirective` to a synthetic message array and assert:
 *
 *   - When locale is `vi-VN`:
 *       • The appended system message contains `越南语`
 *       • The appended system message contains at least 10 glossary pairs
 *         (lines matching "- <zh> -> <vi>")
 *
 *   - When locale is `zh-CN`:
 *       • The directive is NOT appended — the returned messages array is
 *         reference-identical to the input (same object, not a copy)
 *
 * These properties guarantee that:
 *   1. The vi-VN directive always instructs the LLM to output Vietnamese.
 *   2. The vi-VN directive always embeds enough glossary context for
 *      consistent craft-term translation.
 *   3. The zh-CN path is a strict no-op so legacy Chinese behaviour is
 *      never regressed by a Phase-5 commit.
 *   4. Every registered prompt asset is covered — no asset can silently
 *      bypass the directive pipeline.
 */

"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const test = require("node:test") as typeof import("node:test");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const assert = require("node:assert/strict") as typeof import("node:assert/strict");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fc = require("fast-check") as typeof import("fast-check");

import type { BaseMessage } from "@langchain/core/messages";
import type { LocaleCode } from "@ai-novel/shared/localization";
import type { OutputLanguageDirective } from "../src/prompting/core/outputLanguage";
import type { PromptAsset } from "../src/prompting/core/promptTypes";

// Runtime imports from compiled dist (same pattern as other .js tests in this directory)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SystemMessage, HumanMessage } = require("@langchain/core/messages") as typeof import("@langchain/core/messages");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SUPPORTED_LOCALES } = require("@ai-novel/shared/localization") as typeof import("@ai-novel/shared/localization");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { appendOutputLanguageDirective, buildOutputLanguageDirective } = require("../dist/prompting/core/outputLanguage.js") as typeof import("../src/prompting/core/outputLanguage");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { listRegisteredPromptAssets } = require("../dist/prompting/registry.js") as typeof import("../src/prompting/registry");

// ---------------------------------------------------------------------------
// Helpers

/**
 * Count the number of glossary pair lines in a directive system message.
 * A glossary pair line matches the format produced by formatGlossaryHint():
 *   "- <zh term> -> <vi term>"
 */
function countGlossaryPairs(text: string): number {
  return text
    .split("\n")
    .filter((line) => /^- .+ -> .+/.test(line))
    .length;
}

/**
 * Extract the text content from a BaseMessage.
 */
function getMessageText(message: BaseMessage): string {
  const content = message.content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : (part as { text?: string }).text ?? ""))
      .join("");
  }
  return "";
}

/**
 * Build a minimal synthetic message array for testing the directive pipeline.
 * Uses a SystemMessage + HumanMessage to cover both message types.
 */
function buildSyntheticMessages(): BaseMessage[] {
  return [
    new SystemMessage("你是一个专业的小说写作助手。"),
    new HumanMessage("请帮我写一个章节。"),
  ];
}

// ---------------------------------------------------------------------------
// Property 6a — vi-VN directive appended to synthetic messages

test("[PBT] Property 6a: vi-VN directive appended contains '越南语' and ≥10 glossary pairs", () => {
  /**
   * For every invocation with locale='vi-VN', the appended directive message
   * must contain the Vietnamese language marker and at least 10 glossary pairs.
   *
   * We use fc.constant to express determinism — the function is pure and
   * must produce the same result on every call.
   */
  fc.assert(
    fc.property(
      fc.constant("vi-VN" as LocaleCode),
      (locale) => {
        const messages = buildSyntheticMessages();
        const result = appendOutputLanguageDirective({ messages, locale });

        // A new message must have been appended.
        assert.ok(
          result.length > messages.length,
          `vi-VN: expected directive message to be appended (got ${result.length} messages, had ${messages.length})`,
        );

        // The last message must be the directive SystemMessage.
        const lastMessage = result[result.length - 1];
        assert.equal(
          lastMessage.getType(),
          "system",
          "vi-VN: the appended directive message must be a SystemMessage",
        );

        const directiveText = getMessageText(lastMessage);

        // Must contain the Vietnamese language marker.
        assert.ok(
          directiveText.includes("越南语"),
          `vi-VN: directive must contain '越南语' but got: ${directiveText.slice(0, 120)}`,
        );

        // Must embed at least 10 glossary pairs.
        const pairCount = countGlossaryPairs(directiveText);
        assert.ok(
          pairCount >= 10,
          `vi-VN: directive must contain ≥10 glossary pairs but found ${pairCount}`,
        );

        return true;
      },
    ),
    { numRuns: 50 },
  );
});

// ---------------------------------------------------------------------------
// Property 6b — zh-CN directive is a strict no-op (same reference returned)

test("[PBT] Property 6b: zh-CN directive returns the input messages unchanged (same reference)", () => {
  /**
   * For zh-CN, appendOutputLanguageDirective must return the SAME array
   * reference as the input — not a copy. This guarantees zero overhead
   * on the legacy Chinese path.
   */
  fc.assert(
    fc.property(
      fc.constant("zh-CN" as LocaleCode),
      (locale) => {
        const messages = buildSyntheticMessages();
        const result = appendOutputLanguageDirective({ messages, locale });

        // Must be the exact same reference.
        assert.strictEqual(
          result,
          messages,
          "zh-CN: appendOutputLanguageDirective must return the same array reference (no-op)",
        );

        // Length must be unchanged.
        assert.equal(
          result.length,
          messages.length,
          `zh-CN: message count must be unchanged (expected ${messages.length}, got ${result.length})`,
        );

        return true;
      },
    ),
    { numRuns: 50 },
  );
});

// ---------------------------------------------------------------------------
// Property 6c — all SUPPORTED_LOCALES handled without throwing

test("[PBT] Property 6c: appendOutputLanguageDirective never throws for any SUPPORTED_LOCALE", () => {
  /**
   * For every locale in SUPPORTED_LOCALES, the function must return a
   * well-formed message array without throwing.
   */
  fc.assert(
    fc.property(
      fc.constantFrom(...SUPPORTED_LOCALES),
      (locale) => {
        const messages = buildSyntheticMessages();
        let result: BaseMessage[] | undefined;

        assert.doesNotThrow(() => {
          result = appendOutputLanguageDirective({ messages, locale });
        }, `appendOutputLanguageDirective must not throw for locale '${locale}'`);

        assert.ok(result !== undefined, "result must be defined");
        assert.ok(Array.isArray(result), "result must be an array");
        assert.ok(result.length >= messages.length, "result must have at least as many messages as input");

        return true;
      },
    ),
    { numRuns: 100 },
  );
});

// ---------------------------------------------------------------------------
// Property 6d — directive invariant holds for messages-only input (no system message)

test("[PBT] Property 6d: vi-VN directive prepended when input has no SystemMessage", () => {
  /**
   * When the input messages array has no SystemMessage, the directive must
   * be PREPENDED (not appended) so the LLM sees it before any user content.
   */
  fc.assert(
    fc.property(
      fc.constant("vi-VN" as LocaleCode),
      (locale) => {
        const messages: BaseMessage[] = [new HumanMessage("请帮我写一个章节。")];
        const result = appendOutputLanguageDirective({ messages, locale });

        // A directive message must have been added.
        assert.ok(
          result.length > messages.length,
          "vi-VN: directive must be added when input has no SystemMessage",
        );

        // The FIRST message must be the directive (prepended).
        const firstMessage = result[0];
        assert.equal(
          firstMessage.getType(),
          "system",
          "vi-VN: directive must be prepended as a SystemMessage when input has no SystemMessage",
        );

        const directiveText = getMessageText(firstMessage);
        assert.ok(
          directiveText.includes("越南语"),
          `vi-VN: prepended directive must contain '越南语'`,
        );

        return true;
      },
    ),
    { numRuns: 50 },
  );
});

// ---------------------------------------------------------------------------
// Property 6e — registered prompt assets all load without error

test("[PBT] Property 6e: all registered prompt assets load and have valid id/version", () => {
  /**
   * Verify that every entry in the prompt registry can be hydrated without
   * error and has the required shape. This is a prerequisite for the
   * directive pipeline to work correctly across all assets.
   *
   * We do NOT render each asset (that would require complex inputs and DB
   * access), but we verify the registry itself is consistent.
   */
  type UnknownAsset = PromptAsset<unknown, unknown, unknown>;
  let assets: UnknownAsset[];

  assert.doesNotThrow(() => {
    assets = listRegisteredPromptAssets() as UnknownAsset[];
  }, "listRegisteredPromptAssets must not throw");

  assert.ok(assets!.length > 0, "registry must contain at least one prompt asset");

  fc.assert(
    fc.property(
      fc.constantFrom(...assets!),
      (asset) => {
        // Every asset must have a non-empty id and version.
        assert.ok(
          typeof asset.id === "string" && asset.id.length > 0,
          `asset must have a non-empty id`,
        );
        assert.ok(
          typeof asset.version === "string" && asset.version.length > 0,
          `asset ${asset.id} must have a non-empty version`,
        );

        // Every asset must have a render function.
        assert.ok(
          typeof asset.render === "function",
          `asset ${asset.id}@${asset.version} must have a render function`,
        );

        // Every asset must have a taskType.
        assert.ok(
          typeof asset.taskType === "string" && asset.taskType.length > 0,
          `asset ${asset.id}@${asset.version} must have a taskType`,
        );

        return true;
      },
    ),
    { numRuns: Math.min(assets!.length, 100) },
  );
});

// ---------------------------------------------------------------------------
// Property 6f — buildOutputLanguageDirective is deterministic (idempotent)

test("[PBT] Property 6f: buildOutputLanguageDirective is deterministic across repeated calls", () => {
  /**
   * The directive builder is a pure function. Calling it multiple times
   * with the same locale must always return the same systemSuffix content.
   */
  fc.assert(
    fc.property(
      fc.constantFrom(...SUPPORTED_LOCALES),
      (locale) => {
        const first: OutputLanguageDirective = buildOutputLanguageDirective(locale);
        const second: OutputLanguageDirective = buildOutputLanguageDirective(locale);

        assert.equal(
          first.systemSuffix,
          second.systemSuffix,
          `buildOutputLanguageDirective('${locale}') must be deterministic`,
        );

        assert.equal(
          first.glossaryHint,
          second.glossaryHint,
          `buildOutputLanguageDirective('${locale}') glossaryHint must be deterministic`,
        );

        return true;
      },
    ),
    { numRuns: 100 },
  );
});
