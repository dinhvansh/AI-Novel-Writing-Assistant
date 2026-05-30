# Requirements Document

## Feature: Vietnamese Localization (vi-VN)

## Introduction

The AI Novel Writing Assistant currently exists only in Simplified Chinese (`zh-CN`). The single user of this internal-tool fork needs the entire user-facing surface — UI copy, server-emitted error and log messages visible to the user, AI-generated novel content, and built-in seed data (genres, story modes, style templates, anti-AI rules) — to appear in Vietnamese (`vi-VN`).

The work introduces a proper i18n framework (`i18next` + `react-i18next` + `i18next-icu`) so that source code references stable string keys instead of inline Chinese literals. This preserves the ability to merge upstream Chinese updates from the source repo without losing translations, and lets the system fall back to Chinese when a Vietnamese translation is missing rather than crashing or showing raw keys to the user.

AI prompt instructions stay in Chinese (the language they were authored and tuned in) to avoid degrading model behaviour; instead, an **Output Language Directive** is appended to each prompt invocation, telling the LLM to produce reader-visible content in Vietnamese while preserving structured-output schemas. The DB seed data is translated at read time via a slug-keyed `SeedTranslator` so existing rows are not destructively rewritten.

The work is delivered in six phase commits on `feature/vietnamese-localization`. Each phase must boot, typecheck, and pass coverage gates before being merged toward `beta` then `main`.

## Glossary

| Term                          | Meaning                                                                                                       |
|-------------------------------|---------------------------------------------------------------------------------------------------------------|
| Locale code                   | An IETF BCP-47 tag; the only supported codes are `vi-VN` and `zh-CN`.                                         |
| Default locale                | `vi-VN` — the locale the app uses on first launch and when no persisted preference exists.                    |
| Fallback locale               | `zh-CN` — used to resolve any key whose Vietnamese translation is missing, before the raw-key marker.         |
| Translation key               | A namespaced dotted path (e.g., `novel.chapter.writeButton`) that source code passes to `t()`.                |
| Namespace                     | A top-level grouping inside a locale bundle: `common`, `novel`, `autoDirector`, `creativeHub`, `knowledge`, `settings`, `serverErrors`, `serverLogs`, `seedData`. |
| Locale bundle                 | A JSON file at `shared/localization/locales/<locale>.json` containing the full namespace tree for that locale. |
| Glossary                      | A hand-curated `zh ↔ vi` mapping at `shared/localization/glossary.json` for fiction-craft and product terms.   |
| Output Language Directive     | The Chinese-language instruction string appended to AI prompt system messages telling the LLM which language to produce reader-visible content in. |
| SeedTranslator                | The server-side service that resolves a seed row's stable `slug` key to the Vietnamese (or fallback Chinese) name and description at read time. |
| Slug                          | A stable ASCII identifier on each seed row, derived deterministically from its original Chinese name and used as the `seedData.<table>.<slug>` translation-bundle key. |
| Phase commit                  | A single Git commit on `feature/vietnamese-localization` that completes one phase end-to-end (boots, typechecks, smoke-tests). |
| Coverage gate                 | The check, runnable as `pnpm tsx scripts/i18n/verify-locale-coverage.mjs`, that asserts every required correctness property holds. |
| Reader-visible content        | AI-generated text the human reader of the novel will see: chapter prose, character descriptions, world layers, dialogue, titles. (Excludes: structured-output JSON field names, internal IDs, schema keys.) |

## Requirements

### Requirement 1: i18n Framework Bootstrap

**User Story:** As the single user of this fork, I want the application to load with a working i18n framework that defaults to Vietnamese, so that the rest of the localization work has a stable foundation and missing translations never crash or show me raw keys.

#### Acceptance Criteria

1.1 The application SHALL initialize an `i18next` instance on both the client and the server at boot, configured with `lng = 'vi-VN'` (or the user's persisted choice if present), `fallbackLng = 'zh-CN'`, the `i18next-icu` formatter, and the namespace set defined in the design.

1.2 WHEN the application calls `t(key)` for any key K, the resolved value SHALL be `vi-VN[K]` if present, ELSE `zh-CN[K]` if present, ELSE the development marker `[!key!]` (in dev mode) or the raw key string (in production / desktop mode).

1.3 THE system SHALL never return `undefined`, throw, or crash for any `t(key)` call regardless of whether K exists in either bundle.

1.3.1 IF the i18n framework loads successfully but the missing-key fallback handler is misconfigured, the system SHALL still satisfy 1.3 because the `parseMissingKeyHandler` is configured at framework initialization time AND a startup self-check SHALL assert the fallback chain returns a non-empty string for a synthetic missing key before the app marks itself ready.

1.4 THE client SHALL persist the user's chosen locale in `localStorage` under a stable key, and SHALL re-apply that choice on next boot without showing a flash of the wrong language.

1.5 THE server SHALL resolve the per-request locale from the `Accept-Language` header against the `SUPPORTED_LOCALES` allow-list, defaulting to `vi-VN` when the header is absent or contains an unsupported value.

1.6 The `shared` package SHALL expose `LocaleCode`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `FALLBACK_LOCALE`, `NamespaceKey`, and the locale-bundle JSON files as typed exports usable from both client and server without duplication.

### Requirement 2: Locale Switching

**User Story:** As the user, I want to switch between Vietnamese and Chinese inside Settings so I can fall back to the original Chinese when I need to debug a translation or compare wording, without losing my current draft or session.

#### Acceptance Criteria

2.1 THE Settings page SHALL include a `LocaleSwitcher` component that lists `vi-VN (Tiếng Việt)` and `zh-CN (简体中文)`, with the current locale pre-selected.

2.2 WHEN the user changes the locale, the UI SHALL re-render in the new language without a full page reload, and all in-memory user state (open novel, draft text, scroll position, form inputs) SHALL be preserved.

2.3 The locale change SHALL be persisted before the next render, so a manual page refresh continues to show the chosen locale.

2.4 IF an Auto Director run, chapter generation, or other long-running AI request is in flight when the user switches locale, THE system SHALL allow that request to complete in its original locale without interruption, and only future AI requests SHALL use the new locale.

2.5 THE switcher SHALL be the only locale-changing surface in the application; no automatic detection from browser/OS locale is performed.

### Requirement 3: UI Copy Translation Coverage

**User Story:** As the user, I want every Chinese string in the UI surfaces I actually use to appear in Vietnamese, starting with the high-traffic surfaces (login, dashboard, chapter editor, Auto Director cockpit) and expanding to every page.

#### Acceptance Criteria

3.1 THE Phase 2 commit SHALL translate the 20 highest-priority UI surfaces enumerated in the design (app shell, sidebar, login, project dashboard, novel basic-info setup, world-building entry, character cast entry, Auto Director cockpit, Auto Director step list, Auto Director "continue 10 chapters" CTA, chapter editor read-only view, chapter editor write controls, knowledge base list, settings + LocaleSwitcher, API toast/error messages from `client/src/api/client.ts`, empty states, confirmation dialogs, Auto Director check-in panel, generation progress indicators, task center summary, first-run welcome).

3.2 THE Phase 3 commit SHALL translate every remaining `client/src/**/*.tsx` user-visible surface and every remaining store-level label or toast string in `client/src/api/*.ts`.

3.3 EVERY string referenced via `t(key)` in client source code SHALL have a corresponding entry in `shared/localization/locales/zh-CN.json`, enforced by the coverage gate.

3.4 NO file under `client/src/**/*.tsx` SHALL contain a naked Chinese string literal outside of (a) explicitly listed exceptions in `.i18nignore`, (b) developer-only comments, or (c) strings inside the `i18n/` configuration itself.

3.5 UI copy SHALL follow the AGENTS.md UI Copy Rules: each translated string SHALL describe the function from the user's perspective in direct task wording, NOT as implementation/migration commentary.

### Requirement 4: AI Output Language Directive

**User Story:** As the user, I want chapters, character profiles, and world layers that the AI generates to come back in Vietnamese without the prompt instructions themselves being rewritten, so the model behaves the same as it does in the original Chinese build but writes in my language.

#### Acceptance Criteria

4.1 THE server SHALL provide a single `buildOutputLanguageDirective(locale)` function that returns a Chinese-language instruction suffix telling the LLM which language to produce reader-visible content in, plus a glossary excerpt of at least 10 fiction-craft terms.

4.2 EVERY invocation of a `PromptAsset` registered in `server/src/prompting/registry.ts` whose output is reader-visible SHALL append the directive to its system message based on the per-request locale.

4.3 THE directive SHALL state explicitly that structured-output JSON schema field names, internal IDs, and schema keys MUST remain in their original (English/Chinese) form.

4.4 WHEN locale is `zh-CN`, the directive SHALL be a no-op (empty suffix) to preserve the legacy AI behaviour.

4.5 The prompt assets themselves (system message text, user message text in `server/src/prompting/prompts/**`) SHALL NOT be translated to Vietnamese.

4.6 The Phase 5 commit SHALL include a manually-executed AI smoke test that drives a 3-chapter Auto Director run with locale `vi-VN` and confirms (a) chapters are in Vietnamese, (b) glossary craft terms (主角→nhân vật chính, 世界观→thế giới quan, 章→chương) are used consistently, (c) the same run with locale `zh-CN` produces output indistinguishable from a pre-Phase-5 baseline.

### Requirement 5: Glossary and Translation Quality

**User Story:** As the user, I want fiction-craft terms (worldview, protagonist, climax, foreshadowing) and product proper nouns (Auto Director, Creative Hub) to use the same Vietnamese term every time, so the UI doesn't feel like it was translated by three different people.

#### Acceptance Criteria

5.1 THE `shared/localization/glossary.json` file SHALL contain at least 30 entries, including the fiction-craft and product proper-noun terms enumerated in the design's glossary table.

5.2 EVERY glossary entry's `zh` field SHALL be unique within the file (one canonical Vietnamese per Chinese term).

5.3 THE translation script (`scripts/i18n/translate-locale.mjs`) SHALL inject the glossary into the LLM translation prompt as a system constraint so machine translation honours canonical terms.

5.4 THE coverage gate SHALL enforce that for every `(zh, vi)` glossary entry, occurrences of `zh` in `zh-CN.json` correspond to occurrences of `vi` in `vi-VN.json`, and that no two glossary entries collapse to the same `vi` value within the `craft` category.

5.5 THE glossary SHALL be the single source of truth: it is consumed by both the translation script (build-time) and the Output Language Directive (runtime).

### Requirement 6: Server Error and Log Translation

**User Story:** As the user, when the server returns an error or surfaces a log line in the desktop app, I want it in Vietnamese so I can understand what went wrong without context-switching to Chinese.

#### Acceptance Criteria

6.1 THE `errorHandler` middleware SHALL translate error responses by `error.code` using the `serverErrors` namespace and the per-request resolved locale.

6.2 EVERY inline `error: "中文..."` literal in `server/src/routes/**` SHALL be replaced with `error: t('serverErrors.<code>', { lng })` by the end of Phase 4.

6.3 Server log lines that surface to the user via the desktop main-process bridge or the startup gate SHALL be translated through the `serverLogs` namespace.

6.4 Internal-only `console.warn` and dev-mode logs (those the end user never sees) SHALL remain unchanged and are NOT in scope.

6.5 Error messages bubbled up verbatim from upstream LLM provider SDKs SHALL be passed through as-is and SHALL NOT be translated; this is a documented limitation.

### Requirement 7: Locale Bundle Integrity (Coverage Gate)

**User Story:** As a future developer (or future me) merging upstream Chinese updates, I want an automated gate that catches missing translations, broken ICU placeholders, and glossary drift before they reach the user.

#### Acceptance Criteria

7.1 The repo SHALL contain `scripts/i18n/verify-locale-coverage.mjs`, runnable via `pnpm tsx scripts/i18n/verify-locale-coverage.mjs`, that exits non-zero if any of properties P1–P6 from the design fail.

7.2 ICU placeholders (e.g., `{count, plural, ...}`, `{name}`) SHALL match identically (as a multiset of placeholder names and types) between `vi-VN.json` and `zh-CN.json` for every shared key.

7.3 The coverage gate SHALL be a required check in every phase commit (Phases 1–6). A phase commit SHALL NOT be made if the gate fails.

7.4 The coverage gate SHALL detect: unknown `t(key)` calls (key missing from `zh-CN.json`), missing `vi-VN.json` entries (still bearing the `__MISSING__` placeholder), placeholder mismatches between locales, glossary inconsistency, and naked Chinese literals outside the `.i18nignore` allow-list.

### Requirement 8: Database Seed Translation

**User Story:** As the user, I want the built-in genres, story modes, style templates, and anti-AI rules to display in Vietnamese, while my own custom rows (added later) keep working without forcing me to manually translate them.

#### Acceptance Criteria

8.1 THE Phase 6 commit SHALL add a nullable `slug` column to the `Genre`, `StoryMode`, `StyleTemplate`, and `AntiAiRule` Prisma models via an additive migration; backfill slugs deterministically from existing Chinese names; then mark `slug` NOT NULL + UNIQUE in a follow-up migration.

8.2 BEFORE running any Phase 6 migration, the developer SHALL create a backup of `server/dev.db` to a path of the form `server/dev.db.bak.<ISO-timestamp>` AND verify the backup exists with non-zero size, per AGENTS.md Data Protection Rules.

8.3 THE `SeedTranslator` service SHALL be a pure function that, given a row and a locale, returns `{ name, description }` looked up from `seedData.<table>.<slug>` in the locale bundle, falling back to the row's stored Chinese values when no translation exists.

8.4 USER-CREATED seed rows added after Phase 6 SHALL automatically receive a deterministic slug from the same slugifier; if no Vietnamese translation exists for that slug, `SeedTranslator` SHALL silently fall back to the stored Chinese name (no UI prompt, no auto-translation in v1).

8.5 THE existing read paths in `server/src/routes/genre.ts`, `server/src/routes/storyMode.ts`, and `server/src/routes/styleEngine.ts` SHALL route their responses through `SeedTranslator` using the per-request locale.

8.6 The coverage gate SHALL include a check that every existing seed row's slug has an entry in `vi-VN.json` under `seedData.<table>.<slug>`.

### Requirement 9: Phased Delivery and Verification

**User Story:** As a reviewer of this branch (and as the developer maintaining it), I want each phase to land as a coherent commit that builds, boots, and passes its smoke checks, so that any phase can be reverted independently if something breaks.

#### Acceptance Criteria

9.1 The work SHALL land as exactly six phase commits on `feature/vietnamese-localization` in the order: (1) Framework, (2) Top-20 UI, (3) Remaining UI, (4) Server errors/logs, (5) AI Output Language Directive, (6) DB seed translation. EACH phase commit SHALL be independently revertible (i.e., `git revert <phase-N>` leaves the working tree buildable, typecheckable, and bootable on the resulting state). A phase MUST NOT be merged if it cannot be reverted independently — even if it otherwise passes all technical checks.

9.2 EACH phase commit SHALL satisfy the verification gates listed in the design's "Verification Strategy (per-phase gate)" table: `pnpm typecheck` exits 0, `pnpm dev` boots without stderr error at startup, `pnpm tsx scripts/i18n/verify-locale-coverage.mjs` exits 0, and the phase-specific smoke checklist is included in the commit message.

9.3 PHASE 5 (AI directive) SHALL additionally include AI smoke test results (vi-VN run produces Vietnamese output with consistent glossary terms; zh-CN run is unchanged from baseline) in the commit message.

9.4 PHASE 6 (DB seed) SHALL additionally include the backup-file path and size verification in the commit message before any migration is run.

9.5 The branch SHALL NOT merge to `beta` until all six phases have landed and the cumulative `pnpm dev` smoke walk-through (login → vi-VN → create novel → run 3-chapter Auto Director → switch to zh-CN → see original surface) succeeds end-to-end.

9.6 Per AGENTS.md Wiki Rules, Phase 1 SHALL include a new wiki entry `docs/wiki/architecture/i18n.md` covering Background / Decision / Current Rule / Examples / Failure Modes / Related Modules / Source Documents. Phase 5 SHALL include a wiki entry `docs/wiki/prompts/output-language-directive.md`.

9.7 Per the `readme-release-updater` skill workflow, EACH phase commit SHALL update `docs/releases/release-notes.md` with a user-visible summary and refresh `README.md` `## 最新更新` accordingly. If a phase has no user-visible impact, the commit message SHALL explicitly state that release notes were intentionally skipped.

### Requirement 10: Out-of-Scope Behaviour (negative requirements)

**User Story:** As a future maintainer, I want the v1 scope to be unambiguous so that v2 ideas don't silently leak into this delivery and bloat the review.

#### Acceptance Criteria

10.1 THE system SHALL NOT auto-detect the user's browser or OS locale. Locale defaults to `vi-VN` and is changed only via the Settings switcher.

10.2 THE system SHALL NOT support locales other than `vi-VN` and `zh-CN` in v1. Adding `en-US`, `ja-JP`, etc. is a future-extension concern and the architecture SHALL accommodate it without rework, but the v1 acceptance test only covers the two-locale matrix.

10.3 THE system SHALL NOT translate error messages bubbled verbatim from upstream LLM provider SDKs (DeepSeek, OpenAI, Anthropic, etc.); these pass through unchanged.

10.4 THE system SHALL NOT retranslate or modify novel content (chapters, character profiles, world layers) the user has already saved before locale change. Only NEW AI generations honour the Output Language Directive.

10.5 THE system SHALL NOT migrate every existing inline Chinese prompt into the `server/src/prompting/` registry as part of this work. Inline-prompt migration is a separate prompt-governance concern; localization v1 only attaches the Output Language Directive to assets that already exist in the registry.

10.6 THE system SHALL NOT introduce right-to-left layout, complex pluralization beyond Vietnamese rules, or locale-specific date/number formatting beyond what `Intl` provides natively.

10.7 THE system SHALL NOT offer a per-novel locale override (e.g., novel X in Chinese while UI is Vietnamese). Locale is global in v1.
