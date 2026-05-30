# Output Language Directive (AI 输出语言指令)

## Background

This project is a single-user internal tool whose UI is in Vietnamese
but whose AI prompts were authored, tuned and tested in Chinese. The
LLMs in use (DeepSeek, Qwen, GLM, Kimi, plus general OpenAI/Anthropic)
all show stronger Chinese instruction-following than Vietnamese. Naively
translating prompt instructions to Vietnamese risked subtle semantic
drift in auto-director planning, structured-output validity, and
acceptance-assessment scoring.

We need the AI to produce **reader-visible content** (chapter prose,
character descriptions, world layers, dialogue, titles) in Vietnamese,
without rewriting every prompt asset.

## Decision

**Keep prompt assets in Chinese. Attach a per-invocation Output Language
Directive at rendering time.**

Implementation: `server/src/prompting/core/outputLanguage.ts` exposes
`buildOutputLanguageDirective(locale)` which returns a snapshot
containing a `systemSuffix` string. The prompt runner appends this
suffix as an extra `SystemMessage` after the asset's own messages, but
before the structured-output hint.

## Current Rule

- For locale `zh-CN` the directive is a no-op (empty suffix). Legacy AI
  behaviour is preserved bit-for-bit.
- For locale `vi-VN` the directive carries:
  1. A clear instruction to produce reader-visible content in Vietnamese.
  2. An explicit carve-out preserving JSON schema field names, internal
     IDs, enum values and machine-readable status codes in their original
     form.
  3. A glossary excerpt of the top 16 fiction-craft terms drawn from
     `shared/localization/glossary.json` (filtered to category `craft`).
- Future locales return an empty directive and silently fall back to no
  language guidance until a concrete directive is authored.

The directive is appended **after** the asset's own messages (so it
overrides any tone the asset already set) but **before**
`appendStructuredOutputHintMessages` (so the JSON example inside the
hint is unaffected).

### Locale propagation

The locale travels per-request via:

1. The client sets `Accept-Language: <locale>` on every axios request
   (interceptor in `client/src/api/client.ts`).
2. `server/src/middleware/i18nMiddleware.ts` resolves it through the
   `SUPPORTED_LOCALES` allow-list, attaches it to `res.locals.locale`,
   and opens an AsyncLocalStorage scope.
3. `server/src/runtime/requestLocaleContext.ts` exposes the locale via
   `getCurrentRequestLocale()` so any service called inside the request
   tree can read it without touching its function signature.
4. `promptRunner.ts` reads
   `options.outputLanguage ?? getCurrentRequestLocale()` when assembling
   the rendered messages.

## Examples

### Same prompt, two locales

```
[asset render output: Chinese system message + Chinese user message]
+ structured output hint (zh)
+ Output Language Directive
```

For `vi-VN` the directive looks like:

```
【输出语言 / Output language】
请使用越南语 (Tiếng Việt) 输出所有面向读者可见的内容...
结构化输出 JSON 的字段名（schema keys）保持原样，不翻译。
JSON 内部的字符串值（标题、描述、台词等）必须使用越南语。
数据 ID、枚举值、内部状态码、内部任务名等机器可读字段保持原样。

专业术语遵循以下术语表（出现左边的中文，必须使用右边的越南语）：
- 世界观 -> thế giới quan
- 卷 -> tập
- 章 -> chương
...
```

For `zh-CN` the directive is `""` (empty); the rendered messages array
is identical to the pre-Phase-5 baseline.

## Failure Modes

| Mode | Detection | Recovery |
|------|-----------|----------|
| LLM produces mixed Chinese-Vietnamese output | Phase 5 AI smoke test (3-chapter Auto Director run with locale=vi-VN) | Iterate on directive wording; never translate prompt assets. |
| LLM translates JSON schema field names | Structured-output schema validation fails downstream | Strengthen the carve-out wording; investigate which prompt asset's hint is misaligned. |
| Worker tasks (no request scope) emit Chinese for vi-VN users | `getCurrentRequestLocale` returns `DEFAULT_LOCALE`; if the user is on vi-VN this is the right answer; if not, the calling code must pass `outputLanguage` explicitly | Audit fire-and-forget task creation paths; if they need a locale, snapshot it from `res.locals.locale` and pass it as task input. |
| Glossary drift between translation pipeline and runtime directive | Coverage gate P4 (glossary uniqueness) fails | Glossary is the single source-of-truth; both the translator script and the directive read the same JSON. |
| New locale added without authoring a directive | Directive returns empty suffix → AI emits Chinese (same as `zh-CN` baseline) | Add the locale's directive variant in the same commit that adds the locale. |

## Related Modules

- `server/src/prompting/core/outputLanguage.ts` — the directive builder.
- `server/src/prompting/core/promptRunner.ts` — invokes
  `appendOutputLanguageDirective` after rendering and after the
  structured-output hint.
- `server/src/prompting/core/promptTypes.ts` — declares
  `PromptExecutionOptions.outputLanguage`.
- `server/src/runtime/requestLocaleContext.ts` — AsyncLocalStorage
  carrier.
- `server/src/middleware/i18nMiddleware.ts` — opens the scope.
- `client/src/api/client.ts` — sets `Accept-Language` per request.
- `shared/localization/glossary.json` — single source-of-truth for
  craft-term mappings.

## Source Documents

- Design: `.kiro/specs/vietnamese-localization/design.md` §"AI Prompt Strategy"
- Requirements: `.kiro/specs/vietnamese-localization/requirements.md` §"Requirement 4: AI Output Language Directive"
- Tasks: `.kiro/specs/vietnamese-localization/tasks.md` Phase 5 (5.1 – 5.7)
- Workspace rules: `AGENTS.md` — AI-First System Rules, Prompt Governance.
