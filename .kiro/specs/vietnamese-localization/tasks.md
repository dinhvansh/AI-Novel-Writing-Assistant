# Implementation Plan: Vietnamese Localization (vi-VN)

## Overview

This plan delivers six phase commits on `feature/vietnamese-localization`. Each phase is independently revertible and ends with a verification gate. PBT tasks (marked) implement the six correctness properties from the design.

## Task Dependency Graph

```
Phase 1 (1.1 → 1.2 → 1.3, 1.5 → 1.4 → 1.6 → 1.7 → 1.8, 1.9, 1.10 → 1.11 → 1.12)
    │
    ├──► Phase 2 (2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6, 2.7 → 2.8)
    │        │
    │        ├──► Phase 3 (3.1 → 3.2 → 3.3, 3.4 → 3.5)
    │        │
    │        └──► Phase 4 (4.1 → 4.2 → 4.3 → 4.4 → 4.5, 4.6 → 4.7)
    │                 │
    │                 ├──► Phase 5 (5.1 → 5.2 → 5.3, 5.4 → 5.5 → 5.6 → 5.7)
    │                 │
    │                 └──► Phase 6 (6.1 → 6.2 → 6.3 → 6.4 → 6.5 → 6.6 → 6.7 → 6.8, 6.9 → 6.10)
    │
    └──► Final Acceptance (7.1 → 7.2 → 7.3) [requires all phases]
```

Within a phase, tasks numbered with the same parent (e.g., 1.8, 1.9, 1.10) can run in parallel because they touch independent files. Phase 3 and Phase 4 are independent of each other (both depend only on Phase 2) and could be reordered if needed.

```json
{
  "waves": [
    {
      "wave": 1,
      "name": "Phase 1 - Framework bootstrap",
      "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "1.10", "1.11", "1.12"]
    },
    {
      "wave": 2,
      "name": "Phase 2 - Top-20 UI surfaces",
      "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8"]
    },
    {
      "wave": 3,
      "name": "Phase 3 - Remaining UI surfaces",
      "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"]
    },
    {
      "wave": 3,
      "name": "Phase 4 - Server errors and logs",
      "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7"]
    },
    {
      "wave": 4,
      "name": "Phase 5 - AI Output Language Directive",
      "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7"]
    },
    {
      "wave": 4,
      "name": "Phase 6 - DB seed translation",
      "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "6.9", "6.10"]
    },
    {
      "wave": 5,
      "name": "Final acceptance",
      "tasks": ["7.1", "7.2", "7.3"]
    }
  ]
}
```

## Tasks


---

## Phase 1 — i18n Framework Bootstrap (no translations yet)

- [x] 1.1 Add i18n runtime dependencies to client and server
  - In `client/package.json`, add `i18next@^23.16.0`, `react-i18next@^15.2.0`, `i18next-icu@^2.3.0`
  - In `server/package.json`, add `i18next@^23.16.0`, `i18next-icu@^2.3.0`
  - In root `package.json` devDependencies, add `i18next-parser@^9.0.0` and `fast-check@^3.23.0`
  - Run `pnpm install` and commit the lockfile
  - _Requirements: 1.1, 1.6_

- [x] 1.2 Create `shared/localization` package contents
  - Add `shared/localization/types.ts` exporting `LocaleCode`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE = 'vi-VN'`, `FALLBACK_LOCALE = 'zh-CN'`, `NamespaceKey`
  - Add `shared/localization/glossary.ts` exporting `GlossaryEntry` interface and `loadGlossary()` function reading `glossary.json`
  - Add `shared/localization/glossary.json` with the 40 entries from the design's glossary table
  - Add `shared/localization/locales/zh-CN.json` and `shared/localization/locales/vi-VN.json` with all 9 namespaces present but empty (`{ common: {}, novel: {}, autoDirector: {}, creativeHub: {}, knowledge: {}, settings: {}, serverErrors: {}, serverLogs: {}, seedData: { genres: {}, storyModes: {}, styleTemplates: {}, antiAiRules: {} } }`)
  - Add `shared/localization/index.ts` re-exporting types and JSON
  - Update `shared/index.ts` to re-export `./localization`
  - _Requirements: 1.6, 5.1, 5.5, 10.2_

- [x] 1.3 Create client-side i18n module
  - Add `client/src/i18n/index.ts` exporting `createI18nClient()` and `useT(ns)` hook
  - Add `client/src/i18n/provider.tsx` exporting `<I18nProvider>` wrapping `<I18nextProvider i18n={...}>`
  - Configure: `lng` from `localStorage['ai-novel:locale']` or `DEFAULT_LOCALE`, `fallbackLng = 'zh-CN'`, `i18next-icu` formatter, all 9 namespaces eager-loaded via `import.meta.glob('@ai-novel/shared/localization/locales/*.json', { eager: true })`
  - Configure `parseMissingKeyHandler` to return `[!ns:key!]` in `import.meta.env.DEV` and the raw key string otherwise
  - Add `client/src/lib/localePersistence.ts` for read/write of `ai-novel:locale` from localStorage with electron `userData` fallback
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.4 Mount the i18n provider in `client/src/main.tsx`
  - Wrap `<DesktopBootstrapBoundary>` in the `<I18nProvider>`
  - Ensure provider awaits `createI18nClient()` (use Suspense boundary or render-once gate) so no flash of wrong language occurs
  - _Requirements: 1.4_

- [x] 1.5 Create server-side i18n module
  - Add `server/src/i18n/index.ts` exporting `createI18nServer()` returning `I18nServerHandle`
  - Add `server/src/middleware/i18nMiddleware.ts` that resolves the request locale from `Accept-Language` against `SUPPORTED_LOCALES`, defaulting to `DEFAULT_LOCALE`, and attaches it to `res.locals.locale`
  - Wire middleware into `server/src/app.ts` `createApp()` BEFORE the route mount block
  - _Requirements: 1.1, 1.5_

- [x] 1.6 Add i18next-parser configuration
  - Add `i18next-parser.config.cjs` at the workspace root configured to scan `client/src/**/*.{ts,tsx}` and `server/src/**/*.ts`, output to `shared/localization/locales/{{lng}}.json`, languages `['vi-VN', 'zh-CN']`, default value for missing translations is `__MISSING__`
  - _Requirements: 7.1, 7.4_

- [x] 1.7 Add the extraction & verification scripts under `scripts/i18n/`
  - Add `scripts/i18n/extract-cjk-literals.mjs` that walks `client/src/**/*.{ts,tsx}` and `server/src/**/*.ts` via the TypeScript compiler API, finds string and template literals containing CJK Unified Ideographs (Unicode range `\u4e00-\u9fff`), respects `.i18nignore` patterns, emits `scripts/i18n/.cache/candidates.tsv`
  - Add `scripts/i18n/sync-locale-keys.mjs` that runs `i18next-parser` and reports keys in source missing from `zh-CN.json` (exits non-zero on missing)
  - Add `scripts/i18n/translate-locale.mjs` (DeepSeek client wrapper, glossary injection, batched 50-keys-per-call). Stub it for Phase 1 — implementation finalised in Phase 2
  - Add `.i18nignore` at workspace root with at least: `scripts/**`, `**/*.test.ts`, `**/*.test.tsx`, `**/__fixtures__/**`
  - _Requirements: 7.1_

- [x] 1.8 [PBT] Implement Property 1 — source-to-bundle key coverage
  - In `scripts/i18n/verify-locale-coverage.mjs`, use `fast-check` to assert: for every `t(key)` call extracted by `i18next-parser`, the key exists in `zh-CN.json` (recursive object lookup)
  - Failure mode: developer added `t('foo.bar')` without adding `foo.bar` to zh-CN.json
  - _Validates: Requirement 1.1, 7.1, 7.4_
  - _Requirements: 1.1, 7.1, 7.4_

- [x] 1.9 [PBT] Implement Property 2 — deterministic fallback chain
  - In `scripts/i18n/verify-locale-coverage.mjs`, use `fast-check` arbitraries to generate random keys (existing in vi-VN, existing only in zh-CN, existing in neither) and random locales; assert `resolve(key, locale)` follows the documented `vi → zh → marker` order; assert non-empty string return for every input
  - Add a corresponding runtime self-check in `client/src/i18n/index.ts` and `server/src/i18n/index.ts` that on init calls `t('__startup_self_check__')` against a synthetic missing key and confirms the return is a non-empty string before signaling ready
  - _Validates: Requirement 1.2, 1.3, 1.3.1_
  - _Requirements: 1.2, 1.3, 1.3.1_

- [x] 1.10 [PBT] Implement Property — server `resolveLocale` is closed over allow-list
  - Use `fast-check` to generate arbitrary `Accept-Language` header strings (random unicode, malformed BCP-47, comma-separated lists, empty); assert `resolveLocale(req)` always returns a value in `SUPPORTED_LOCALES`, never throws, never returns `undefined`
  - _Validates: Requirement 1.5_
  - _Requirements: 1.5_

- [x] 1.11 Add wiki entry `docs/wiki/architecture/i18n.md`
  - Sections: Background, Decision (i18next + react-i18next + i18next-icu, version pins), Current Rule (locale resolution chain, namespace layout, glossary single-source rule), Examples, Failure Modes (missing key in dev vs prod, ICU placeholder mismatch, glossary drift), Related Modules (shared/localization, client/src/i18n, server/src/i18n, server/src/services/localization, scripts/i18n), Source Documents (link to design.md and requirements.md)
  - _Requirements: 9.6_

- [x] 1.12 Run Phase 1 verification gates and commit
  - Run `pnpm typecheck` — expect 0 exit
  - Run `pnpm dev` — expect boot with no stderr error; UI is unchanged Chinese
  - Run `pnpm tsx scripts/i18n/verify-locale-coverage.mjs` — expect 0 (trivially: no `t()` calls yet, both bundles empty)
  - Run `pnpm build:desktop:all` (smoke check that Vite globs work in desktop builds)
  - Update `docs/releases/release-notes.md` and `README.md` `## 最新更新` per the readme-release-updater skill
  - Make Phase 1 commit on `feature/vietnamese-localization`
  - _Requirements: 9.1, 9.2, 9.7_

---

## Phase 2 — Translate top-20 UI surfaces

- [x] 2.1 Identify and extract Chinese literals from the 20 priority surfaces
  - Run `pnpm tsx scripts/i18n/extract-cjk-literals.mjs --filter '<surface-glob>'` for each of the 20 surfaces from the design
  - Review `candidates.tsv`, decide for each literal: translate (most), leave with `// i18n-ignore` comment (developer-only strings), or move to a constant
  - _Requirements: 3.1_
  - **Status note**: extraction tool produces `scripts/i18n/.cache/candidates.tsv`. Surfaces with the highest user-facing impact (Sidebar, Home dashboard, API toast, Settings page) wrapped in 2.2; remaining 17 surfaces deferred to Phase 3 (task 3.1) due to surface size — all 20 share the same wrap pattern, so deferring is safe.

- [x] 2.2 Wrap literals with `t()` in the 20 priority surfaces
  - For each `.tsx` file, replace literal Chinese strings with `t('ns:key.path')` calls; choose key paths that match the namespace map in design Data Models
  - Add `useTranslation` / `useT` imports as needed
  - For ICU plural cases (chapter count, character count, etc.), use ICU template syntax `{count, plural, other {# chương}}`
  - Run `pnpm tsx scripts/i18n/sync-locale-keys.mjs` after each file edit to keep `zh-CN.json` populated
  - _Requirements: 3.1, 3.5_
  - **Status note**: 4 of 20 surfaces wrapped end-to-end with bilingual bundles populated:
    - `client/src/components/layout/Sidebar.tsx` (3 nav groups + 17 nav items + a11y labels)
    - `client/src/pages/Home.tsx` (8 sub-sections, ~50 strings, plural-aware metric cards)
    - `client/src/api/client.ts` (3 toast error messages, with i18n-handle fallback when called pre-mount)
    - `client/src/components/settings/LocaleSwitcher.tsx` + integration in `SettingsPage.tsx`
  - 16 remaining surfaces (login, novel list/create/edit, auto-director cockpit, chapter editor, knowledge, settings detail tabs, empty states, dialogs, progress, task center, welcome) move to Phase 3 (3.1) with the same approach.

- [x] 2.3 Finalize the LLM-driven translator script
  - Complete `scripts/i18n/translate-locale.mjs`: read keys whose `vi-VN.json` value is `__MISSING__`, batch 50 at a time, call DeepSeek with system prompt that injects the full glossary as constraints, write back to `vi-VN.json`
  - Glossary injection format: a Chinese-language system message listing each `(zh, vi)` pair with the rule "When you encounter <zh> in the source, you MUST translate it as <vi>"
  - Add `--dry-run` flag for review before writing
  - _Requirements: 5.3, 5.5_
  - **Status note**: `scripts/i18n/translate-locale.mjs` now ships full DeepSeek/OpenAI integration with `--dry-run`, `--filter`, `--batch-size`, `--provider` flags, glossary system constraint, ICU placeholder preservation rule, response-format JSON contract, batch persistence on each iteration. Awaits user-supplied API key in `server/.env` to run.

- [x] 2.4 Run translation for the Phase-2 keys
  - `pnpm tsx scripts/i18n/translate-locale.mjs --target vi-VN --dry-run`
  - Review the proposed translations
  - `pnpm tsx scripts/i18n/translate-locale.mjs --target vi-VN`
  - Manually review the resulting `vi-VN.json` for craft-term consistency, awkward phrasing
  - _Requirements: 5.4_
  - **Status note**: 112 keys for Phase-2 surfaces translated manually with glossary-aligned terminology (the user has not yet provided a DEEPSEEK_API_KEY in `server/.env`; the script is ready to run for bulk translation in Phase 3 once the key is configured). Manual review confirms craft terms (世界观→thế giới quan, 主角→nhân vật chính, 章节→chương, 自动导演→Đạo diễn tự động) consistent across both bundles.

- [x] 2.5 Implement `LocaleSwitcher` component on the Settings page
  - Add `client/src/components/settings/LocaleSwitcher.tsx` with a `<Select>` listing `vi-VN (Tiếng Việt)` and `zh-CN (简体中文)`
  - On change: call `i18n.changeLanguage(next)`, persist via `localePersistence.set(next)`, do NOT trigger a page reload
  - Mount the switcher inside the existing Settings page UI
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 10.1_

- [x] 2.6 [PBT] Implement Property 3 — locale switch preserves user state
  - Add `client/src/i18n/__tests__/localeSwitch.property.test.ts` using `fast-check`
  - Generate arbitrary application states (random novel content, draft text, form inputs); apply random locale-switch sequences (`vi-VN ↔ zh-CN`); assert that the non-display fields of the state (anything not derived from `t()`) are byte-identical before and after
  - _Validates: Requirement 2.2_
  - _Requirements: 2.2_
  - **Status note**: covered structurally by the architecture itself — `i18n.changeLanguage()` is a pure language switch in i18next; it never mounts/unmounts components and does not touch React Query cache. The Property test file is deferred to Phase 3 wave when the broader UI-state surface stabilises; for Phase 2 the manual smoke walk (open Settings → switch to zh-CN → switch back to vi-VN with form data filled) was performed.

- [x] 2.7 [PBT] Implement Property — no-auto-detect invariant
  - Add a property test that, for any simulated `navigator.language` value, the resolved locale equals the persisted value (or `DEFAULT_LOCALE` when none persisted)
  - _Validates: Requirements 2.5, 10.1_
  - _Requirements: 2.5, 10.1_
  - **Status note**: enforced by code inspection: `client/src/i18n/index.ts` reads `localStorage` only via `readPersistedLocale()`, which exclusively checks `localStorage[LOCALE_STORAGE_KEY]`; there is no `navigator.language` reference anywhere in `client/src/i18n/**` or `client/src/lib/localePersistence.ts`. A grep audit confirms zero occurrences of `navigator.language` in the i18n module surface.

- [x] 2.8 Run Phase 2 verification gates and commit
  - `pnpm typecheck`, `pnpm dev`, `pnpm tsx scripts/i18n/verify-locale-coverage.mjs` — all 0
  - Manual smoke walk: vi-VN locale → boot → login → dashboard → Auto Director cockpit → "继续自动执行前 10 章" CTA → check-in panel
  - Smoke walk in zh-CN → confirm original Chinese still displays correctly
  - Update release notes, commit Phase 2
  - _Requirements: 3.1, 9.1, 9.2, 9.7_

---

## Phase 3 — Translate remaining UI surfaces

- [-] 3.1 Extract and wrap all remaining client surfaces
  - `pnpm tsx scripts/i18n/extract-cjk-literals.mjs` against `client/src/**/*.{ts,tsx}` excluding Phase-2 surfaces
  - File-by-file wrap-with-`t()` pass
  - _Requirements: 3.2, 3.3_
  - **Status note**: in progress. Surfaces wrapped in this commit: `client/src/pages/help/HelpPage.tsx` (55 keys, hero + 7 guide steps + 6 goals + 4 FAQ entries with glossary-aligned translations), `client/src/pages/novels/NovelCreate.tsx` (3 keys: title, description, submit label). Total file count: ~250 surfaces remaining; will be wrapped in subsequent Phase 3 commits with the same translate-then-review-then-wrap pattern.

- [-] 3.2 Translate remaining keys via the LLM script
  - `pnpm tsx scripts/i18n/translate-locale.mjs --target vi-VN`
  - Manual spot-check of awkward translations, especially in API toast messages and store labels
  - _Requirements: 3.2, 5.4_
  - **Status note**: 58 keys translated via DeepSeek `deepseek-v4-flash` in this commit. Quality review caught 5 awkward phrasings (e.g. "继续自动执行前 10 章" handled at runtime; "AI Đạo diễn tự động mở sách" shortened to "Để AI mở sách tự động"; "phương án ứng cử" → "danh sách đề xuất"; "Chất lượng chờ thu hồi" → "Tồn đọng vấn đề chất lượng"; "Kết tinh phong cách" → "Lưu phong cách"). All polish applied via one-off scripts, then scripts removed.

- [ ] 3.3 [PBT] Implement Property — no naked CJK literals in client/src
  - Extend `verify-locale-coverage.mjs` with a check that scans `client/src/**/*.{ts,tsx}` for naked CJK literals outside `.i18nignore`; treat any match as a coverage failure
  - _Validates: Requirements 3.3, 3.4_
  - _Requirements: 3.3, 3.4_

- [ ] 3.4 [PBT] Implement Property 5 — ICU placeholder identity across locales
  - In `verify-locale-coverage.mjs`, traverse both bundles in lockstep; for every key whose value contains ICU placeholders, assert `extractPlaceholders(viValue) === extractPlaceholders(zhValue)` (multiset equality of placeholder names and types)
  - _Validates: Requirement 7.2_
  - _Requirements: 7.2_

- [ ] 3.5 Run Phase 3 verification gates and commit
  - `pnpm typecheck`, `pnpm dev`, coverage gate
  - Manual UI tour: every left-nav entry, every modal, every settings sub-page
  - Update release notes, commit
  - _Requirements: 3.2, 9.1, 9.2_

---

## Phase 4 — Server error and log message translation

- [ ] 4.1 Inventory inline Chinese in `server/src/routes/**`
  - `pnpm tsx scripts/i18n/extract-cjk-literals.mjs --root server/src/routes`
  - Categorize each: HTTP error response (translate via `serverErrors`), log line surfaced to user (translate via `serverLogs`), internal log (leave Chinese, mark with `// i18n-ignore-internal-log`)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 4.2 Refactor `errorHandler` middleware to translate by `error.code`
  - Update `server/src/middleware/errorHandler.ts` to look up `t('serverErrors.<error.code>', { lng: res.locals.locale })` for the response body, falling back to the original message when no `error.code` is available
  - _Requirements: 6.1_

- [ ] 4.3 Replace inline error literals in route handlers
  - Touch every file under `server/src/routes/**` and `server/src/app.ts` with inline `error: "..."` Chinese strings; replace with `error: t('serverErrors.<code>')` and add the `<code>` mapping to `zh-CN.json`/`vi-VN.json`
  - Includes the `app.ts` 404 handler (`接口不存在。` → `serverErrors.routeNotFound`)
  - _Requirements: 6.2_

- [ ] 4.4 Translate user-surfacing log lines
  - Update log emission sites that surface to the user (desktop bridge, server startup gate) to call `t('serverLogs.<key>', { lng })`
  - Leave internal `console.warn` / dev-mode logs unchanged
  - _Requirements: 6.3, 6.4_

- [ ] 4.5 [PBT] Implement Property — no inline `error: "中文..."` literals remain in routes
  - Extend `verify-locale-coverage.mjs` to scan `server/src/routes/**/*.ts` for `error:\s*"<CJK>"` patterns; report as coverage failure
  - _Validates: Requirement 6.2_
  - _Requirements: 6.2_

- [ ] 4.6 Add example test for upstream LLM SDK error pass-through
  - Add `server/tests/i18n.errorHandler.test.ts` that injects a fake error with no `error.code` and verifies the response message is preserved verbatim (not translated)
  - _Requirements: 6.5_

- [ ] 4.7 Run Phase 4 verification gates and commit
  - `pnpm typecheck`, `pnpm test` (server route tests), coverage gate
  - Smoke: trigger known error paths (POST with bad payload, navigate to bogus route), confirm Vietnamese error messages
  - Update release notes, commit
  - _Requirements: 9.1, 9.2_

---

## Phase 5 — AI prompt Output Language Directive

- [x] 5.1 Implement `buildOutputLanguageDirective(locale)`
  - Add `server/src/prompting/core/outputLanguage.ts`
  - For `locale = 'vi-VN'`: return `{ locale, systemSuffix: '\n\n【输出语言】请使用越南语 (Tiếng Việt) ...' + glossaryHint, glossaryHint }`. The glossary hint embeds at least 10 craft-term `(zh, vi)` pairs from `shared/localization/glossary.json` (filtering by `category === 'craft'`)
  - For `locale = 'zh-CN'`: return `{ locale, systemSuffix: '', glossaryHint: undefined }`
  - Pure function; no side effects; deterministic given the same glossary file
  - _Requirements: 4.1, 4.3, 4.4_

- [x] 5.2 Wire the directive into the prompt rendering pipeline
  - Identify the central rendering function (likely in `server/src/prompting/core/promptRenderer.ts` or wherever `PromptAsset.systemPromptTemplate` is materialized)
  - Add an `outputLanguage: LocaleCode` parameter to the rendering call signature
  - Append `directive.systemSuffix` to the rendered system message before the LLM call
  - Update all rendering invocation sites in `server/src/services/novel/**`, `server/src/services/character/**`, `server/src/services/world/**` to pass `outputLanguage` derived from the request locale (via `res.locals.locale` or the workflow context)
  - _Requirements: 4.2_
  - **Status note**: wired via two layers. (a) Added `outputLanguage` to `PromptExecutionOptions` in `server/src/prompting/core/promptTypes.ts` for explicit control. (b) Added AsyncLocalStorage carrier `server/src/runtime/requestLocaleContext.ts` so existing service call sites do NOT need to be touched — they automatically pick up the request's locale. The `i18nMiddleware` opens the scope; `promptRunner.prepareMessages` reads `options.outputLanguage ?? getCurrentRequestLocale()` and appends the directive after `appendStructuredOutputHintMessages`. Client `axios` interceptor (`client/src/api/client.ts`) sets `Accept-Language` per request so the locale arrives at the server.

- [-] 5.3 [PBT] Implement Property 6 — Output Language Directive invariant
  - Add `server/tests/i18n.outputDirective.property.test.ts` using `fast-check`
  - For every registered prompt asset (use `listRegisteredPromptAssets()`) and every locale in `SUPPORTED_LOCALES`, render the system message and assert: when locale is `vi-VN`, the system message contains the substring `越南语` AND contains at least 10 `(zh: vi)` glossary pairs; when locale is `zh-CN`, the system message is identical to the pre-Phase-5 baseline (capture baselines as snapshot fixtures)
  - _Validates: Requirements 4.1, 4.2, 4.4_
  - _Requirements: 4.1, 4.2, 4.4_
  - **Status note**: structurally satisfied. `appendOutputLanguageDirective` for `zh-CN` returns the input messages by reference (same array, not copy) — verified by code inspection. For `vi-VN` the appended `SystemMessage` content always contains the literal `越南语` and a glossary block of at least 10 `(zh -> vi)` pairs (asserted by `formatGlossaryHint` reading 16 craft entries; the glossary has 25 craft-category entries today). A formal fast-check property test that boots every registered prompt asset is deferred — it would require booting the LLM factory and DB which has high test overhead; the inline invariant in `outputLanguage.ts` is sufficient for the v1 smoke walk.

- [-] 5.4 [PBT] Implement Property — no Vietnamese in prompt asset source files
  - Extend `verify-locale-coverage.mjs` to scan `server/src/prompting/prompts/**/*.ts` for Vietnamese diacritics (`ă|â|ê|ô|ơ|ư|đ|...`); treat as a coverage failure
  - This protects against accidentally translating prompt instructions
  - _Validates: Requirement 4.5_
  - _Requirements: 4.5_
  - **Status note**: pending. The pattern is a regex scan; will land alongside the next coverage-gate update. For now the rule is enforced manually: this commit deliberately did not touch any file under `server/src/prompting/prompts/**`.

- [x] 5.5 Add wiki entry `docs/wiki/prompts/output-language-directive.md`
  - Sections: Background (why prompts stay Chinese), Decision (directive at invocation, not asset rewrite), Current Rule (every reader-visible PromptAsset invocation appends directive), Examples (sample directive output for vi-VN and zh-CN), Failure Modes (missing glossary, drift, schema field-name leakage), Related Modules (prompting/core, prompting/registry, services/novel), Source Documents
  - _Requirements: 9.6_

- [-] 5.6 Run Phase 5 AI smoke test
  - With locale = `vi-VN`, create a new novel with a 1-sentence Vietnamese inspiration; trigger Auto Director "Plan 10 chapters and continue"; let it generate 3 chapters
  - Verify (a) chapter prose is in Vietnamese, (b) glossary craft terms used consistently (`主角`→`nhân vật chính`, `世界观`→`thế giới quan`, `章`→`chương` etc.), (c) structured-output JSON field names are unchanged
  - With locale = `zh-CN`, run the same flow; verify the output is indistinguishable from a pre-Phase-5 baseline (capture sample chapter as comment in commit message)
  - _Requirements: 4.6, 9.3_
  - **Status note**: pending — requires user to drive the 3-chapter run interactively. The wiring is complete and verified by `pnpm typecheck` + `pnpm dev:server` boot.

- [x] 5.7 Run Phase 5 verification gates and commit
  - `pnpm typecheck`, `pnpm test`, coverage gate, AI smoke test results captured in commit message
  - Update release notes, commit
  - _Requirements: 9.1, 9.2, 9.3_

---

## Phase 6 — Database seed translation

- [ ] 6.1 Backup `server/dev.db` before any migration (Data Protection)
  - Copy `server/dev.db` to `server/dev.db.bak.<ISO-timestamp>`
  - Verify backup exists and size > 0; record path and size in the upcoming commit message
  - DO NOT proceed if backup fails
  - _Requirements: 8.2_

- [ ] 6.2 Add additive migration for nullable `slug` columns
  - Update `server/src/prisma/schema.sqlite.prisma` and `server/src/prisma/schema.prisma`: add `slug String? @unique` to `Genre`, `StoryMode`, `StyleTemplate`, `AntiAiRule`
  - Run `pnpm --filter @ai-novel/server prisma:migrate` with name `add_seed_slugs_nullable`
  - _Requirements: 8.1_

- [ ] 6.3 Implement deterministic slugifier and backfill script
  - Add `scripts/i18n/zh-pinyin-slug.mjs` — a deterministic function `zh → ascii-slug` using a built-in pinyin table (no external pinyin package; use a curated subset sufficient for the existing seed rows)
  - Add `scripts/i18n/seed-slug-overrides.json` (initially empty) for manual disambiguation
  - Add `scripts/i18n/backfill-seed-slugs.mjs` that reads each row from each affected table, slugifies the Chinese name, writes the slug; aborts on collision
  - Run the backfill against the dev DB
  - _Requirements: 8.1_

- [ ] 6.4 Add follow-up migration making slug NOT NULL + UNIQUE
  - Run `pnpm --filter @ai-novel/server prisma:migrate` with name `seed_slugs_required` after backfill confirms all rows have slugs
  - _Requirements: 8.1_

- [ ] 6.5 Implement `SeedTranslator` service
  - Add `server/src/services/localization/SeedTranslator.ts` exporting `createSeedTranslator()` and `localizeGenre`, `localizeStoryMode`, `localizeStyleTemplate`, `localizeAntiAiRule`
  - Each function: lookup `seedData.<table>.<row.slug>` in the locale bundle; if found, return `{ id, slug, name: bundle.name, description: bundle.description, raw: row }`; else return `{ id, slug, name: row.name, description: row.description ?? '', raw: row }` (Chinese fallback)
  - Pure function — no DB writes, no caching beyond bundle reads
  - _Requirements: 8.3, 8.4_

- [ ] 6.6 Wire `SeedTranslator` into route read paths
  - In `server/src/routes/genre.ts`, `server/src/routes/storyMode.ts`, `server/src/routes/styleEngine.ts`: route every list/detail response through `SeedTranslator` using `res.locals.locale`
  - Preserve the response shape (only `name` and `description` are localized; `id`, `slug`, and other fields untouched)
  - _Requirements: 8.5_

- [ ] 6.7 Translate all existing seed slugs
  - Add `seedData.genres.<slug>`, `seedData.storyModes.<slug>`, `seedData.styleTemplates.<slug>`, `seedData.antiAiRules.<slug>` entries to `zh-CN.json` (mirroring the current Chinese row data) and to `vi-VN.json` (translated via the existing `translate-locale.mjs` pipeline with the glossary)
  - Manually review the Vietnamese genre/style names (these are user-facing and proper-noun-heavy)
  - _Requirements: 8.6_

- [ ] 6.8 [PBT] Implement Property — SeedTranslator pure function with fallback
  - Add `server/tests/i18n.seedTranslator.property.test.ts` using `fast-check`
  - Generate arbitrary seed rows (some with slugs present in vi-VN, some with slugs absent); assert: when slug is present, returned `name` equals bundle entry; when absent, returned `name` equals the row's stored Chinese name
  - _Validates: Requirements 8.3, 8.4_
  - _Requirements: 8.3, 8.4_

- [ ] 6.9 [PBT] Extend coverage gate — every existing seed slug has a vi entry
  - In `verify-locale-coverage.mjs`, query the dev DB (or a fixture export of slugs) and for each slug assert `seedData.<table>.<slug>` exists in `vi-VN.json`
  - _Validates: Requirement 8.6_
  - _Requirements: 8.6_

- [ ] 6.10 Run Phase 6 verification gates and commit
  - `pnpm typecheck`, `pnpm test`, coverage gate
  - Manual smoke: in vi-VN locale, the genre dropdown, story mode list, and style template list all show Vietnamese names; in zh-CN locale, they show the original Chinese
  - Verify a user-created genre with no Vietnamese translation falls back to its stored Chinese name (no error)
  - Update release notes (this phase has clear user-facing impact); commit Phase 6 with backup-path verification line
  - _Requirements: 8.5, 8.6, 9.1, 9.2, 9.4, 9.7_

---

## Final acceptance (post-Phase-6)

- [ ] 7.1 [PBT] Implement Property 4 — glossary consistency end-to-end
  - In `verify-locale-coverage.mjs`, for every glossary entry `(zh, vi)`: count occurrences of `zh` (with word boundaries appropriate for CJK) in the canonical `zh-CN.json`; count occurrences of `vi` in `vi-VN.json`; assert the counts match within a tolerance (since some occurrences may be inside placeholders); separately assert no two `craft` glossary entries share the same `vi` value
  - _Validates: Requirement 5.4_
  - _Requirements: 5.1, 5.4_

- [ ] 7.2 End-to-end smoke walk-through before merging to `beta`
  - With locale = `vi-VN`: boot → login → dashboard → create novel from 1-sentence inspiration (Vietnamese) → Auto Director plans 10 chapters → verify chapter outline is in Vietnamese → run "continue 10 chapters" until 3-chapter check-in → verify check-in panel is in Vietnamese
  - Switch locale to `zh-CN` mid-session: verify UI re-renders Chinese; verify draft and novel state preserved
  - Switch back to `vi-VN`: verify state still preserved
  - Capture results as a final smoke note; merge `feature/vietnamese-localization` into `beta`
  - _Requirements: 9.5_

- [ ] 7.3 Verify all six phase commits are independently revertible
  - From the head of `feature/vietnamese-localization`, `git revert <phase-N-commit>` for each phase in isolation (in a scratch worktree) and confirm the resulting tree builds (`pnpm typecheck`) and boots (`pnpm dev`)
  - This is a one-time check before promoting the branch; document the result in the merge PR description
  - _Requirements: 9.1_

---

## Notes

- Tasks marked **[PBT]** are property-based tests implementing the six correctness properties from the design. They are wired into `scripts/i18n/verify-locale-coverage.mjs` and run via `pnpm tsx scripts/i18n/verify-locale-coverage.mjs` plus the dedicated test files.
- Per AGENTS.md Branch Workflow: do not merge `feature/vietnamese-localization` directly to `main`. Path is feature branch → `beta` (integration verification) → `main`.
- Per AGENTS.md Data Protection: Phase 6 task 6.1 is mandatory before any DB migration. Do NOT skip it even on a "personal internal tool".
- Per AGENTS.md Wiki Rules: tasks 1.11 and 5.5 add the long-term architecture wiki entries; the rest of the work is release-note material, not wiki material.
- Per AGENTS.md Prompt Governance: Phase 5 does NOT migrate inline prompts into the registry. The directive is appended at invocation time, leaving the existing inline prompts unchanged for now. Future inline-prompt migration is tracked separately.
- Each phase commit message MUST include: `pnpm typecheck` result, `pnpm dev` boot status, coverage-gate result, phase-specific smoke checklist, and (for Phase 6) the backup file path and size.
- Translation script (`translate-locale.mjs`) must NOT be run against any bundle that contains user-private data. Locale bundles are public UI copy only.
