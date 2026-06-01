import { SystemMessage, type BaseMessage } from "@langchain/core/messages";

import {
  DEFAULT_LOCALE,
  loadGlossaryByCategory,
  type LocaleCode,
} from "@ai-novel/shared/localization";

/**
 * Output Language Directive
 * =========================
 *
 * Per the Phase 5 spec (`.kiro/specs/vietnamese-localization/design.md`),
 * we deliberately keep every prompt asset in its original Chinese
 * authoring language. Translating prompt instructions to Vietnamese
 * risked subtle semantic drift in the LLMs we use (DeepSeek, Qwen, GLM,
 * Kimi all have stronger Chinese instruction-following) and would force
 * us to maintain N translated copies of every prompt.
 *
 * Instead we ATTACH a per-invocation directive that:
 *
 *   1. Tells the LLM which language to produce reader-visible content in
 *      (chapter prose, character descriptions, world layers, dialogue,
 *      titles).
 *   2. Explicitly preserves structured-output JSON schema field names
 *      (e.g. `chapterTitle`, `characterDynamics`) and any internal IDs.
 *   3. Embeds a glossary excerpt (top 10+ craft terms) so canonical
 *      Vietnamese names for fiction-craft terms are stable across runs.
 *
 * For locale `zh-CN` the directive is a no-op so legacy AI behaviour is
 * untouched and a Phase-5 commit cannot regress the Chinese build.
 */

/** Snapshot of the directive returned by {@link buildOutputLanguageDirective}. */
export interface OutputLanguageDirective {
  /** The locale this directive targets. */
  readonly locale: LocaleCode;
  /**
   * The directive text appended to the system message (or empty string
   * for locales that need no directive).
   */
  readonly systemSuffix: string;
  /** Optional glossary block embedded inside the directive. */
  readonly glossaryHint: string | undefined;
}

/** Number of craft-glossary entries quoted inside the directive. */
const GLOSSARY_HINT_MAX = 16;

function formatGlossaryHint(): string {
  const entries = loadGlossaryByCategory("craft").slice(0, GLOSSARY_HINT_MAX);
  if (entries.length === 0) {
    return "";
  }
  return entries.map((entry) => `- ${entry.zh} -> ${entry.vi}`).join("\n");
}

/**
 * Return the directive snapshot for a locale.
 *
 * Pure function. Safe to call repeatedly; the glossary is read from the
 * eager-loaded JSON bundle in `@ai-novel/shared/localization`.
 */
export function buildOutputLanguageDirective(locale: LocaleCode): OutputLanguageDirective {
  if (locale === "zh-CN") {
    return {
      locale,
      systemSuffix: "",
      glossaryHint: undefined,
    };
  }

  if (locale === "vi-VN") {
    const glossaryHint = formatGlossaryHint();
    const directiveLines = [
      "",
      "【输出语言 / Output language】",
      "请使用越南语 (Tiếng Việt) 输出所有面向读者可见的内容：章节正文、人物描写、世界设定、对话、标题、章节摘要、可读 UI 文本。",
      "结构化输出 JSON 的字段名（schema keys）保持原样，不翻译。",
      "JSON 内部的所有字符串值必须使用越南语，包括：标题、描述、台词、摘要、问题描述（description）、证据（evidence）、修复建议（fixSuggestion）、审校类型（auditType）、问题分类（category）、原因说明（reason）、推荐说明（summary）等所有自然语言字段。",
      "数据 ID、枚举值、内部状态码、内部任务名等机器可读字段保持原样。",
      "",
      "专业术语遵循以下术语表（出现左边的中文，必须使用右边的越南语）：",
      glossaryHint,
    ];
    return {
      locale,
      systemSuffix: directiveLines.filter((line) => line !== undefined).join("\n"),
      glossaryHint,
    };
  }

  // Future locales: silently fall back to no-op rather than crash. This
  // keeps the type system honest without forcing every new locale to
  // ship a directive in the same commit.
  return {
    locale,
    systemSuffix: "",
    glossaryHint: undefined,
  };
}

/**
 * Append the output-language directive to a rendered prompt's system
 * message(s). If the rendered messages already carry one or more
 * `SystemMessage` blocks, append a new `SystemMessage` carrying ONLY the
 * directive — this keeps the surrounding prompt deterministic and easy
 * to diff.
 *
 * If the messages array has no `SystemMessage` (rare; some assets only
 * use `HumanMessage`), prepend a `SystemMessage` so the LLM still sees
 * the directive before any user-facing instruction.
 *
 * For `zh-CN` (or any locale whose directive is empty) the input is
 * returned unchanged.
 */
export function appendOutputLanguageDirective(input: {
  messages: BaseMessage[];
  locale?: LocaleCode;
}): BaseMessage[] {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const directive = buildOutputLanguageDirective(locale);
  if (directive.systemSuffix.length === 0) {
    return input.messages;
  }

  const directiveMessage = new SystemMessage(directive.systemSuffix);
  const hasSystem = input.messages.some((message) => message.getType?.() === "system");
  if (hasSystem) {
    return [...input.messages, directiveMessage];
  }
  return [directiveMessage, ...input.messages];
}
