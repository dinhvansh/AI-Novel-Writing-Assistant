# Design Document: Vietnamese Localization (vi-VN)

## Overview

Translate the entire AI Novel Writing Assistant UI surface from Simplified Chinese (`zh-CN`) to Vietnamese (`vi-VN`) by introducing a proper i18n framework rather than rewriting source strings in place. The work covers ~193k Chinese characters across the React client (UI copy, error toasts, store labels), the Express server (error messages, log messages, structured-output user-visible fields), and the SQLite seed data (genres, story modes, style templates, anti-AI rules).

The architecture treats translation as a runtime resolution problem: source code references stable string keys, locale bundles map keys to translated strings, and a deterministic fallback chain (`vi-VN → zh-CN → developer marker`) ensures missing keys never surface as raw `t('foo.bar')` text. AI prompts that drive novel generation are deliberately kept in Chinese (the language they were authored and tuned in) and instead emit a per-invocation **Output Language Directive** that tells the LLM which language to produce user-visible content in. This preserves AI behavioural quality while letting the same prompt asset serve any output locale.

The work is phased into six commits on `feature/vietnamese-localization` so that no single phase commit exceeds a comfortable review size, and so that each phase is independently buildable and smoke-testable. The first phase introduces the framework but ships zero translated strings, the last phase translates DB seed data — no phase is allowed to break `pnpm typecheck` or core flows.

---

## Goals and Non-Goals

### Goals

- Replace inline Chinese string literals with `t(key)` references throughout the client UI and server-facing user-visible messages.
- Ship a Vietnamese locale bundle (`vi-VN`) that covers every extracted key.
- Preserve the original Chinese bundle (`zh-CN`) as the canonical source-of-truth and as a fallback locale.
- Make AI-generated content (chapters, character profiles, world layers, etc.) emit Vietnamese without retranslating the prompt instructions themselves.
- Keep the future ability to merge upstream Chinese updates from the source repo without losing the Vietnamese translations.
- Make every phase a complete, runnable, committable unit.

### Non-Goals (Out of Scope for v1)

- Auto-detection of browser/OS locale (locale is set explicitly by the user; defaults to `vi-VN`).
- Multi-language switching beyond the `vi-VN ↔ zh-CN` pair (no `en-US`, no others).
- Translation of error messages bubbled up from upstream LLM provider SDKs (those are passed through as-is).
- Translation of generated novel content already saved by the user (that is user data, not UI; only NEW generations honor the Output Language Directive).
- Right-to-left layout, complex pluralization beyond Vietnamese rules, locale-specific date/number formatting beyond what `Intl` provides natively.
- Migrating every existing inline prompt into `server/src/prompting/` registry (prompt-governance refactor is a separate concern; localization phase 1 only adds the **directive parameter** to assets that already exist there).

---

## Architecture

### High-level Component Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         AI Novel Production Engine                       │
│                                                                          │
│  ┌─────────────────────────┐         ┌────────────────────────────────┐ │
│  │  client/  (React 19)    │         │  server/  (Express + Prisma)   │ │
│  │                         │         │                                │ │
│  │  ┌───────────────────┐  │         │  ┌──────────────────────────┐  │ │
│  │  │ i18next core      │  │         │  │ i18next core (Node)      │  │ │
│  │  │  + react-i18next  │  │         │  │  (no react binding)      │  │ │
│  │  │  + i18next-icu    │  │         │  │  + i18next-icu           │  │ │
│  │  └────────┬──────────┘  │         │  └──────────┬───────────────┘  │ │
│  │           │             │         │             │                  │ │
│  │  ┌────────▼──────────┐  │         │  ┌──────────▼───────────────┐  │ │
│  │  │ locales/vi-VN.json│  │         │  │ locales/vi-VN.json       │  │ │
│  │  │ locales/zh-CN.json│  │         │  │ locales/zh-CN.json       │  │ │
│  │  └───────────────────┘  │         │  └──────────────────────────┘  │ │
│  └─────────────────────────┘         │                                │ │
│              │                       │  ┌──────────────────────────┐  │ │
│              │                       │  │ PromptAsset registry     │  │ │
│              │                       │  │  + outputLanguage param  │  │ │
│              │                       │  └──────────────────────────┘  │ │
│              │                       │                                │ │
│              │                       │  ┌──────────────────────────┐  │ │
│              │                       │  │ SeedTranslator service   │  │ │
│              │                       │  │  slug → vi/zh resolver   │  │ │
│              │                       │  └──────────────────────────┘  │ │
│              │                       └────────────────────────────────┘ │
│              │                                                          │
│  ┌───────────▼──────────────────────────────────────────────────────┐   │
│  │  shared/localization/                                            │   │
│  │   ├─ glossary.json     (zh ↔ vi domain term map)                 │   │
│  │   ├─ locales/zh-CN.json (CANONICAL source-of-truth, by client)   │   │
│  │   ├─ locales/vi-VN.json (translated, used by client)             │   │
│  │   └─ types.ts          (LocaleCode, NamespaceKey type guards)    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  scripts/i18n/                                                  │    │
│  │   ├─ extract-cjk-literals.mjs   (AST scan for naked CJK)        │    │
│  │   ├─ sync-locale-keys.mjs       (i18next-parser run)            │    │
│  │   ├─ translate-locale.mjs       (LLM-driven zh→vi batch)        │    │
│  │   └─ verify-locale-coverage.mjs (PBT-style coverage assert)     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Runtime Locale Resolution Flow (Client)

```
┌─────────────┐
│ React tree  │  useTranslation('common')
│ component   │ ──────────► t('settings.title')
└─────────────┘                    │
                                   ▼
                        ┌─────────────────────┐
                        │  i18next instance   │
                        │  current = 'vi-VN'  │
                        └──────────┬──────────┘
                                   │ lookup chain
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
       resources['vi-VN']  resources['zh-CN']  raw key fallback
       common.settings…    common.settings…    "[!common:set…!]"
            (hit)              (fallback)         (dev-only)
                │                  │                  │
                └──────────────────┴──────────────────┘
                                   │
                                   ▼
                          rendered string
```

### Build-time Extraction Pipeline

```
┌──────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│ source files │───►│ extract-cjk-literals │───►│ candidates.txt      │
│ .ts/.tsx     │    │  AST scanner (CJK)   │    │ file:line:literal   │
└──────────────┘    └──────────────────────┘    └──────────┬──────────┘
                                                            │ human review
                                                            ▼
                                                  developer wraps with
                                                  t('ns:key.path')
                                                            │
                                                            ▼
┌──────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│ source files │───►│  sync-locale-keys    │───►│ shared/locales/     │
│ (post-wrap)  │    │  i18next-parser      │    │  zh-CN.json (auto)  │
└──────────────┘    └──────────────────────┘    └──────────┬──────────┘
                                                            │
                                                            ▼
                                                ┌─────────────────────┐
                                                │  translate-locale   │
                                                │  DeepSeek + glossary│
                                                └──────────┬──────────┘
                                                            ▼
                                                ┌─────────────────────┐
                                                │ vi-VN.json (review) │
                                                └─────────────────────┘
```

### Phase Dependency Diagram

```
Phase 1 (framework)
    │
    ├──► Phase 2 (top-20 UI surfaces translated)
    │        │
    │        ├──► Phase 3 (remaining UI translated)
    │        │
    │        └──► Phase 4 (server error/log messages)
    │                 │
    │                 ├──► Phase 5 (AI prompt output-language directive)
    │                 │
    │                 └──► Phase 6 (DB seed translation via SeedTranslator)
```

Phases 2 and 4 are independent of each other and could be reordered; phases 3, 5, 6 each require phase 2/4 stability respectively.

---

## Library Decisions (with version pins)

### Client (Vite + React 19)

**Choice**: `i18next@^23.16.0` + `react-i18next@^15.2.0` + `i18next-icu@^2.3.0`

**Reasoning**:
- React 19 compatible (react-i18next 15.x explicitly supports React 19).
- AGPL-compatible licenses (MIT).
- Same `i18next` core works on Node — single mental model client+server.
- Lazy-loading via Vite's `import.meta.glob` (no separate HTTP backend service needed in desktop/Electron mode).
- `i18next-parser@^9.0.0` provides the AST extraction for `t()` calls.
- `i18next-icu` supports ICU plural / select / number formats — Vietnamese needs `other` only but ICU lets us share template format with Chinese.
- HMR works out of box because locale JSON is imported by Vite as a regular module.

**Alternatives considered**:
- `lingui@^5`: compile-time extraction is elegant but adds a Babel plugin layer to Vite; less mature ICU; macros would force big surface refactor. Rejected for migration cost.
- `tolgee`: requires a backend service for in-context editing; overkill for single-user desktop tool. Rejected.

### Server (Node + Express)

**Choice**: `i18next@^23.16.0` + `i18next-icu@^2.3.0` (no react binding, no fs backend; locale bundles imported as JS modules at boot)

**Reasoning**:
- Reuses the same locale JSON files via `shared/localization/locales/`.
- Server-side translation only used for: HTTP error responses (the `errorHandler` middleware), `morgan` log lines that include user-facing copy, and `console.log` lines that surface in the desktop main-process bridge to the user.
- Prompt strings are NOT routed through i18next; they are routed through PromptAsset registry (see "AI Prompt Strategy" below).

### Shared package

**Choice**: New subdirectory `shared/localization/`. No new runtime dependency in `shared/package.json` — the shared package just exports JSON data and TypeScript types. The actual `i18next` runtime is consumed by client and server independently.

### Tooling

- `i18next-parser@^9.0.0` (devDependency at workspace root) for key extraction from `t()` calls.
- `tsx@^4.x` already available, used for running `scripts/i18n/*.mjs`.
- Translation engine: DeepSeek API via the existing `server/src/llm/factory.ts` providers (no new SDK). Reasons: cheapest configured provider (~$0.14/M tokens), strong Chinese understanding, acceptable Vietnamese output. Glossary is injected as a system message to enforce term consistency.

---

## Components and Interfaces

### Component 1: `shared/localization` (single source of truth)

**Purpose**: hold locale bundles, glossary, locale codes, and namespace constants. Both client and server consume this package.

**Public exports** (added to `shared/index.ts`):

```typescript
// shared/localization/types.ts
export type LocaleCode = 'vi-VN' | 'zh-CN';
export const SUPPORTED_LOCALES: readonly LocaleCode[] = ['vi-VN', 'zh-CN'] as const;
export const DEFAULT_LOCALE: LocaleCode = 'vi-VN';
export const FALLBACK_LOCALE: LocaleCode = 'zh-CN';

export type NamespaceKey =
  | 'common'           // app shell, generic buttons, errors
  | 'novel'            // novel/chapter/world editor surfaces
  | 'autoDirector'     // auto director cockpit + workflow
  | 'creativeHub'      // creative hub UI
  | 'knowledge'        // knowledge base UI
  | 'settings'         // settings UI
  | 'serverErrors'     // server-emitted error messages
  | 'serverLogs'       // server-emitted log lines surfaced to user
  | 'seedData';        // seed slugs (genres, story modes, etc.)

// shared/localization/glossary.ts
export interface GlossaryEntry {
  zh: string;
  vi: string;
  category: 'craft' | 'workflow' | 'ui' | 'product';
  notes?: string;
}
export function loadGlossary(): GlossaryEntry[];
```

**File layout**:

```
shared/
  localization/
    types.ts
    glossary.ts
    glossary.json           // raw data (loaded by glossary.ts)
    locales/
      zh-CN.json            // canonical source-of-truth
      vi-VN.json            // translated
    index.ts                // re-exports
```

### Component 2: `client/src/i18n`

**Purpose**: configure the `i18next` instance, mount the `<I18nextProvider>`, persist user's locale choice to `localStorage`, and provide a typed `useT()` hook.

**Public interface**:

```typescript
// client/src/i18n/index.ts
import type { LocaleCode, NamespaceKey } from '@ai-novel/shared';

export interface I18nClientHandle {
  i18n: i18next.i18n;             // the configured instance
  setLocale(code: LocaleCode): Promise<void>;
  currentLocale(): LocaleCode;
}

export function createI18nClient(): Promise<I18nClientHandle>;
export function useT<NS extends NamespaceKey>(ns: NS): TFunction<NS>;
```

**Responsibilities**:
- Read persisted locale from `localStorage[KEY_LOCALE]` (default: `vi-VN`).
- Initialize `i18next` with `resources` populated by `import.meta.glob('@ai-novel/shared/localization/locales/*.json', { eager: true })`.
- Register `i18next-icu` formatter.
- Configure `fallbackLng: 'zh-CN'` and `parseMissingKeyHandler` to wrap missing keys in `[!ns:key!]` only when `import.meta.env.DEV === true`; in production, fall through to the raw key (so users see something readable rather than a debug marker).
- Mounted in `client/src/main.tsx` BEFORE `<AppRouter />` renders.

### Component 3: `client/src/components/settings/LocaleSwitcher`

**Purpose**: visible-but-discreet dropdown in Settings page that lets the user toggle between `vi-VN` and `zh-CN`. Default selection is `vi-VN`. Switching is immediate (no reload required); state is preserved.

**Interface**:

```typescript
// client/src/components/settings/LocaleSwitcher.tsx
export interface LocaleSwitcherProps {
  currentLocale: LocaleCode;
  onLocaleChange: (next: LocaleCode) => Promise<void>;
}
export function LocaleSwitcher(props: LocaleSwitcherProps): JSX.Element;
```

**Responsibilities**:
- Render a `<Select>` with `vi-VN` (Tiếng Việt) and `zh-CN` (简体中文) options.
- On change, call `i18n.setLocale(next)`, then update React Query cache for any locale-tagged queries (very few: only the seed-data queries that depend on locale).
- Persist new locale to `localStorage`.
- No page reload.

### Component 4: `server/src/i18n`

**Purpose**: server-side `i18next` instance, used by `errorHandler` middleware, by services that emit user-facing log lines, and by the SeedTranslator.

**Interface**:

```typescript
// server/src/i18n/index.ts
import type { LocaleCode, NamespaceKey } from '@ai-novel/shared';

export interface I18nServerHandle {
  t<NS extends NamespaceKey>(
    namespace: NS,
    key: string,
    options?: { lng?: LocaleCode; values?: Record<string, unknown> }
  ): string;
  resolveLocale(req: { headers: Record<string, unknown> }): LocaleCode;
}

export function createI18nServer(): Promise<I18nServerHandle>;
```

**Responsibilities**:
- Initialize once at app boot (in `createApp()`).
- Resolve locale per request from `Accept-Language` header (defaulting to `vi-VN` when desktop client is the caller; client always sends `Accept-Language: vi-VN` or `zh-CN`).
- Provide `t()` for use in `errorHandler` middleware to translate `error.code` into a localized message.

### Component 5: `server/src/prompting/core/outputLanguage.ts` (new)

**Purpose**: extend the existing `PromptAsset` rendering pipeline so every prompt invocation accepts an `outputLanguage` parameter and injects a deterministic directive line into the system message.

**Interface**:

```typescript
// server/src/prompting/core/outputLanguage.ts
import type { LocaleCode } from '@ai-novel/shared';

export interface OutputLanguageDirective {
  locale: LocaleCode;
  systemSuffix: string;          // appended to system message
  glossaryHint?: string;         // optional inline glossary reference
}

export function buildOutputLanguageDirective(
  locale: LocaleCode
): OutputLanguageDirective;

// Applied inside renderPromptAsset() before LLM invocation.
export function applyOutputLanguageDirective(
  systemMessage: string,
  directive: OutputLanguageDirective
): string;
```

**Behavior**:
- For `locale = 'vi-VN'`, `systemSuffix` is a Chinese-language instruction (because the rest of the system message is Chinese): `"\n\n【输出语言】请使用越南语 (Tiếng Việt) 输出所有面向读者可见的内容：章节正文、人物描写、世界设定、对话、标题。结构化输出 schema 字段名保持原样。专业术语遵循术语表。"` followed by a compact glossary hint of the 20 highest-priority glossary terms.
- For `locale = 'zh-CN'`, `systemSuffix` is empty (legacy behaviour preserved).
- This is the **single point of contact** between localization and the AI subsystem. The prompt registry itself is untouched; only the invocation path is.

### Component 6: `server/src/services/localization/SeedTranslator`

**Purpose**: translate seed-data rows (genres, story modes, style templates, anti-AI rules) at read time based on a stable `slug` column rather than rewriting DB rows.

**Interface**:

```typescript
// server/src/services/localization/SeedTranslator.ts
import type { LocaleCode } from '@ai-novel/shared';

export interface LocalizedSeedRow {
  id: string;
  slug: string;
  name: string;          // translated to requested locale
  description: string;   // translated to requested locale
  raw: unknown;          // original DB row for advanced consumers
}

export interface SeedTranslator {
  localizeGenre(row: GenreRow, locale: LocaleCode): LocalizedSeedRow;
  localizeStoryMode(row: StoryModeRow, locale: LocaleCode): LocalizedSeedRow;
  localizeStyleTemplate(row: StyleTemplateRow, locale: LocaleCode): LocalizedSeedRow;
  localizeAntiAiRule(row: AntiAiRuleRow, locale: LocaleCode): LocalizedSeedRow;
}

export function createSeedTranslator(): SeedTranslator;
```

**Responsibilities**:
- Look up the row's `slug` in `shared/localization/locales/<locale>.json` under the `seedData` namespace.
- If a translation exists, return it; otherwise fall back to the row's stored Chinese name/description (preserving the existing zh-CN data as the fallback).
- Pure function — no DB writes, no side effects. Locale is decided at HTTP request boundary by the `i18n` middleware.

### Component 7: Extraction Scripts (`scripts/i18n/`)

```typescript
// scripts/i18n/extract-cjk-literals.mjs
// Walks .ts/.tsx files via @typescript-eslint/typescript-estree,
// finds StringLiteral / TemplateLiteral nodes containing CJK Unified Ideographs,
// emits candidates.tsv:  filepath\tline\tcolumn\tliteral\tcontext
// Excludes: comments, files in scripts/, files matching .i18nignore patterns.
export interface ExtractCjkLiteralsOptions {
  roots: string[];
  ignorePatterns: string[];
  outputPath: string;
}

// scripts/i18n/sync-locale-keys.mjs
// Runs i18next-parser against the codebase to (a) confirm every t() call
// has a key in shared/localization/locales/zh-CN.json, and (b) emit any
// keys missing from vi-VN.json as `__MISSING__` placeholders.
export interface SyncLocaleKeysOptions {
  configPath: string;        // i18next-parser.config.cjs
  failOnMissingZh: boolean;  // CI gate
}

// scripts/i18n/translate-locale.mjs
// Reads zh-CN.json, finds keys whose vi-VN.json value is `__MISSING__`
// or absent, batches them (50 per call), invokes DeepSeek with a
// translation system prompt and the project glossary, writes vi-VN.json.
export interface TranslateLocaleOptions {
  sourceLocale: 'zh-CN';
  targetLocale: 'vi-VN';
  batchSize: number;
  glossaryPath: string;
  dryRun: boolean;
}

// scripts/i18n/verify-locale-coverage.mjs
// Property-style assertions:
//  P1  every t() key exists in zh-CN.json
//  P2  every key in zh-CN.json has a non-__MISSING__ value in vi-VN.json
//  P3  glossary terms in vi-VN.json are consistent (one canonical vi per zh)
//  P4  no raw CJK literal remains in client/src/**/*.tsx outside .i18nignore
// Exit code 0 / 1, used in pre-commit hook AND in `pnpm typecheck` chain.
```

---

## Data Models

### Locale Bundle (JSON, namespace-scoped)

```typescript
// shared/localization/locales/vi-VN.json (shape, partial)
interface LocaleBundle {
  common: {
    actions: {
      save: string;       // "Lưu"
      cancel: string;     // "Huỷ"
      retry: string;      // "Thử lại"
    };
    errors: {
      network: string;    // "Kết nối mạng thất bại, vui lòng thử lại."
      server: string;     // "Máy chủ gặp sự cố, vui lòng thử lại sau."
    };
  };
  novel: {
    chapter: {
      title: string;
      writeButton: string;
      // ICU plural example:
      countLabel: string; // "{count, plural, other {# chương}}"
    };
  };
  autoDirector: { /* ... */ };
  creativeHub: { /* ... */ };
  knowledge: { /* ... */ };
  settings: { /* ... */ };
  serverErrors: {
    routeNotFound: string;       // "Không tìm thấy điểm cuối API."
    novelNotFound: string;
    /* ... */
  };
  serverLogs: { /* ... */ };
  seedData: {
    genres: Record<string /*slug*/, { name: string; description: string }>;
    storyModes: Record<string, { name: string; description: string }>;
    styleTemplates: Record<string, { name: string; description: string }>;
    antiAiRules: Record<string, { name: string; description: string }>;
  };
}
```

**Validation Rules**:
- File MUST be valid JSON.
- All namespace top-level keys MUST be present (even if empty), so that the type guard in `types.ts` is satisfied.
- Values in `vi-VN.json` MUST NOT contain CJK Unified Ideographs except inside curly placeholders. (Property test enforces this.)
- ICU placeholders MUST match between locales (placeholders identity is part of the contract; only the surrounding text changes).

### Glossary Entry (JSON)

```typescript
// shared/localization/glossary.json (shape, partial)
interface GlossaryFile {
  version: 1;
  generatedAt: string;
  entries: Array<{
    zh: string;
    vi: string;
    category: 'craft' | 'workflow' | 'ui' | 'product';
    notes?: string;
  }>;
}
```

**Validation Rules**:
- `zh` MUST be unique across the file (one canonical Vietnamese per Chinese term).
- `vi` SHOULD be unique within `craft` category (different Chinese terms shouldn't collapse to the same Vietnamese term in fiction craft).
- `category` is required; used for filtering when injecting glossary into translation prompt vs AI output prompt.

### Initial Glossary (≥30 fiction-domain terms)

| zh                | vi                              | category | notes |
|-------------------|---------------------------------|----------|-------|
| 世界观            | thế giới quan                   | craft    | the worldview/setting |
| 卷                | tập                             | craft    | volume |
| 章                | chương                          | craft    | chapter |
| 节                | phần                            | craft    | section / scene |
| 章节              | chương                          | craft    | chapter (compound) |
| 大纲              | đại cương                       | craft    | outline |
| 提纲              | dàn ý                           | craft    | sub-outline |
| 情节              | tình tiết                       | craft    | plot beat |
| 主线              | mạch chính                      | craft    | main storyline |
| 支线              | mạch phụ                        | craft    | subplot |
| 伏笔              | phục bút                        | craft    | foreshadowing |
| 高潮              | cao trào                        | craft    | climax |
| 卡点              | điểm cao trào                   | craft    | hook / cliffhanger |
| 收尾              | kết thúc                        | craft    | ending |
| 节奏              | nhịp độ                         | craft    | pacing |
| 视角              | ngôi kể                         | craft    | POV |
| 第一人称          | ngôi thứ nhất                   | craft    | first person |
| 第三人称          | ngôi thứ ba                     | craft    | third person |
| 角色              | nhân vật                        | craft    | character |
| 主角              | nhân vật chính                  | craft    | protagonist |
| 反派              | phản diện                       | craft    | antagonist |
| 配角              | nhân vật phụ                    | craft    | supporting role |
| 类型              | thể loại                        | craft    | genre |
| 风格              | văn phong                       | craft    | style |
| 文风              | giọng văn                       | craft    | voice |
| 草稿              | bản nháp                        | workflow | draft |
| 终稿              | bản hoàn chỉnh                  | workflow | finalized draft |
| 续写              | viết tiếp                       | workflow | continuation |
| 重写              | viết lại                        | workflow | rewrite |
| 章节摘要          | tóm tắt chương                  | workflow | chapter summary |
| 检查点            | điểm kiểm tra                   | workflow | checkpoint |
| 自动导演          | Đạo diễn tự động                | product  | Auto Director (proper noun) |
| 创意工坊          | Xưởng sáng tạo                  | product  | Creative Hub (proper noun) |
| 知识库            | Kho tri thức                    | product  | Knowledge Base (proper noun) |
| 写作公式          | Công thức viết                  | product  | Writing Formula (proper noun) |
| 故事模式          | Mô thức truyện                  | product  | Story Mode (proper noun) |
| 反AI              | Chống AI                        | product  | Anti-AI (proper noun) |
| 灵感              | cảm hứng                        | ui       | inspiration |
| 设定              | thiết định                      | ui       | setting / configuration |
| 任务              | tác vụ                          | ui       | task |
| 章节执行          | Thực thi chương                 | workflow | chapter execution |

The glossary is loaded by both the translation script and the prompt directive builder, so the same Vietnamese term is used everywhere.

### Database Schema Changes (additive only)

The DB seed strategy chosen is **option (c) modified**: store stable `slug` keys on each seed table, resolve locale-specific name/description via `SeedTranslator` at read time. This keeps the existing Chinese rows intact (so upstream merges don't conflict on data rows) and isolates translation drift to JSON files.

Required additive Prisma migrations on `server/src/prisma/schema.sqlite.prisma` (and the postgres mirror):

```prisma
model Genre {
  id          String  @id @default(cuid())
  slug        String  @unique             // NEW — derived deterministically from existing Chinese name
  name        String                      // unchanged: stays in Chinese as fallback
  description String?
  // ...existing fields unchanged...
}

model StoryMode {
  id          String  @id @default(cuid())
  slug        String  @unique             // NEW
  name        String
  description String?
  // ...
}

model StyleTemplate {
  id          String  @id @default(cuid())
  slug        String  @unique             // NEW
  name        String
  description String?
  // ...
}

model AntiAiRule {
  id          String  @id @default(cuid())
  slug        String  @unique             // NEW
  name        String
  description String?
  // ...
}
```

**Migration plan** (Phase 6):
1. `pnpm prisma migrate dev --name add_seed_slugs` — adds nullable `slug` columns.
2. Run `scripts/i18n/backfill-seed-slugs.mjs` which reads each row, deterministically slugifies the Chinese name (transliteration via a built-in zh→pinyin table for stable keys), writes the slug.
3. Make `slug` non-null + unique via second migration.
4. Add `seedData.<table>.<slug>` keys to `vi-VN.json`.
5. Verify via `verify-locale-coverage.mjs` that every existing row's slug has a Vietnamese translation.

User-created seed rows (genres added by the user in their personal install) will naturally get a slug from the deterministic slugifier; if a user-created row has no Vietnamese translation in the bundle, `SeedTranslator` returns the Chinese name as-is (the fallback chain). This preserves user data without forcing a manual translation step.

### Locale Persistence

```typescript
// client/src/lib/localePersistence.ts
const STORAGE_KEY = 'ai-novel:locale';

interface PersistedLocaleState {
  locale: LocaleCode;
  setAt: string; // ISO timestamp
}
```

Stored in `localStorage` (web) and electron's `userData` config (desktop, via existing IPC bridge). Default: `vi-VN`.

---

## AI Prompt Strategy (the critical decision)

### Decision

**Keep AI prompt instructions in their current language (Chinese)**. **Do not translate the prompt assets themselves to Vietnamese**.

Instead, every prompt invocation that produces user-visible content accepts an `outputLanguage: LocaleCode` parameter, which appends an **Output Language Directive** to the system message. The directive is itself in Chinese (matching the surrounding instruction language) but says: "produce all reader-visible content in Vietnamese; keep structured-output JSON schema field names as defined; follow the attached glossary for fiction craft terms."

### Why

1. **Quality preservation**: the prompts were authored, tuned, and tested in Chinese. The LLMs in use (DeepSeek, Qwen, GLM, Kimi) have stronger Chinese instruction-following than Vietnamese. Translating prompt instructions risks subtle semantic drift that would degrade auto-director planning, structured output validity, and acceptance-assessment scoring.
2. **Single point of change**: localization concerns are confined to the directive function. Future locales (en-US, ja-JP) plug in by adding directive variants — no need to maintain N translated copies of every prompt asset.
3. **Upstream merge friendliness**: when upstream (`ExplosiveCoderflome`) updates a prompt's Chinese instructions, the merge path is clean — there's no per-locale translated mirror of the prompt to reconcile.
4. **Structured output integrity**: prompt schemas use English/Chinese field names (e.g., `chapterTitle`, `characterDynamics`); these are internal contracts and MUST NOT be translated. Keeping the prompt language stable removes one class of accidental field-name drift.

### What gets translated, what doesn't

| Layer                                              | Translate? | Method |
|----------------------------------------------------|------------|--------|
| Prompt system message text (instructions)          | NO         | stays Chinese in `prompts/*.ts` |
| Prompt user message text (the dynamic context)     | NO         | stays Chinese / English as composed |
| Output Language Directive (added at invocation)    | NO (lives in Chinese)      | `buildOutputLanguageDirective(locale)` |
| Structured output schema field names               | NO         | internal contract |
| Structured output **string values** that become user-visible | YES, by the LLM at generation | LLM is instructed via the directive |
| Server error messages (HTTP responses)             | YES, via i18next | `t('serverErrors.routeNotFound')` |
| Server log lines surfaced to desktop user          | YES, via i18next | `t('serverLogs.*')` |
| Internal `console.warn` / dev logs                 | NO         | stay Chinese; not user-facing |
| DB seed data (genres etc.)                         | YES, via SeedTranslator | slug → vi.json lookup |
| UI copy (.tsx files)                               | YES, via i18next | `useT('ns').t('key')` |

### Validation

After Phase 5, smoke test the AI flow:
1. Create a new novel with a 1-sentence inspiration (Vietnamese input).
2. Trigger Auto Director "Plan 10 chapters and continue".
3. Inspect that the chapter outline, character dynamics, and chapter draft all come back in Vietnamese.
4. Spot-check that fiction-craft terms (世界观 → thế giới quan, 主角 → nhân vật chính) are used consistently — not random transliterations.

If quality regresses (e.g., the LLM produces broken Vietnamese-Chinese mix), iterate on the directive's wording (the directive is itself a small prompt asset and easily tunable).

---

## Error Handling

### Missing Translation Key

**Condition**: code calls `t('novel.chapter.fooBar')` but neither `vi-VN.json` nor `zh-CN.json` has that key.

**Response**: 
- DEV mode: render `[!novel:chapter.fooBar!]` so it's visually obvious in screenshots.
- PROD/Desktop mode: render the raw key `novel.chapter.fooBar` (better than crashing; the user sees gibberish but the app keeps working).
- The `verify-locale-coverage.mjs` script catches this in pre-commit, so prod should never see it.

**Recovery**: pre-commit hook fails the commit, developer adds the key.

### Locale Switch During In-flight Request

**Condition**: user toggles locale while an Auto Director run is generating chapters.

**Response**: the in-flight request was sent with the previous locale's directive; chapters generated by it remain in the previous language. The locale switch only affects the UI shell rendering and any FUTURE AI requests. We do NOT abort in-flight LLM calls (those are expensive).

**Recovery**: not needed — this is the documented behaviour. The user can re-run the affected Auto Director task if they want it in the new language.

### Glossary Term Drift

**Condition**: developer adds a translation in `vi-VN.json` that uses a non-canonical Vietnamese term for a Chinese concept (e.g., translates 世界观 as `thế giới` instead of canonical `thế giới quan`).

**Response**: `verify-locale-coverage.mjs` runs property check P3 (glossary consistency); detects the drift via substring scan; fails CI.

**Recovery**: developer either fixes the offending vi.json entry, or — if the new term is intentional — updates `glossary.json` and reruns coverage.

### Seed Slug Collision

**Condition**: two seed rows deterministically slugify to the same key (e.g., two genres named differently in Chinese both transliterate to `xian-xia`).

**Response**: backfill script logs the collision and aborts. No data is changed.

**Recovery**: developer manually disambiguates via a `slugOverride` map in `scripts/i18n/seed-slug-overrides.json`.

### Server-side Locale Header Missing

**Condition**: a server-side request has no `Accept-Language` header (e.g., direct cURL).

**Response**: `resolveLocale()` returns `DEFAULT_LOCALE` (`vi-VN`).

**Recovery**: not needed — defaulting is intentional.

---

## Testing Strategy

### Unit Testing

- `shared/localization/glossary.test.ts`: glossary uniqueness, schema validity.
- `client/src/i18n/index.test.ts`: locale resolution, fallback chain, persistence.
- `server/src/i18n/index.test.ts`: `resolveLocale()` from headers, `t()` namespace lookup.
- `server/src/services/localization/SeedTranslator.test.ts`: slug → translated row mapping, fallback behaviour.
- `server/src/prompting/core/outputLanguage.test.ts`: directive contains required fields, glossary excerpt matches input locale.

### Property-Based Testing

**Library choice**: `fast-check@^3.x` (already widely used in the JS ecosystem; MIT-licensed).

**Suggested properties** (also detailed in the Correctness Properties section):

```typescript
// scripts/i18n/verify-locale-coverage.mjs (run as part of pre-commit + typecheck)
import fc from 'fast-check';

// P1: every t() key in source has a key in zh-CN.json
fc.assert(
  fc.property(arbitraryTranslationCallSite(), (callSite) => {
    expect(zhJson).toHaveKey(callSite.key);
  })
);

// P2: fallback chain determinism
fc.assert(
  fc.property(arbitraryKey(), arbitraryLocale(), (key, locale) => {
    const result = resolve(key, locale);
    expect(result).toEqual(viJson[key] ?? zhJson[key] ?? RAW_OR_MARKER(key));
  })
);

// P3: state preservation under switch
fc.assert(
  fc.property(arbitraryAppState(), (state) => {
    const before = serialize(state);
    switchLocale('vi-VN');
    switchLocale('zh-CN');
    switchLocale('vi-VN');
    const after = serialize(state);
    expect(stripDisplayStrings(after)).toEqual(stripDisplayStrings(before));
  })
);

// P4: glossary consistency
fc.assert(
  fc.property(arbitraryGlossaryEntry(), (entry) => {
    expect(countOccurrencesIn(viJson, entry.vi))
      .toEqual(countOccurrencesIn(zhJson, entry.zh));
  })
);

// P5: ICU placeholder identity preserved across locales
fc.assert(
  fc.property(arbitraryKeyPath(), (keyPath) => {
    expect(extractPlaceholders(viJson[keyPath]))
      .toEqual(extractPlaceholders(zhJson[keyPath]));
  })
);

// P6: output-language directive invariant
fc.assert(
  fc.property(arbitraryPromptAsset(), (asset) => {
    const rendered = render(asset, { outputLanguage: 'vi-VN' });
    expect(rendered.systemMessage).toContain('越南语');
  })
);
```

These property tests live in `scripts/i18n/verify-locale-coverage.mjs` and are also runnable via `pnpm test:i18n`.

### Integration Testing

- **Phase smoke test** (per phase): `pnpm dev` boots, navigate to top-3 surfaces, screenshot for visual diff.
- **AI quality smoke test** (Phase 5 only): trigger a 3-chapter Auto Director run, confirm chapters are in Vietnamese, no language-mix, glossary terms used correctly. Captured as a manual checklist in the phase commit message.
- **DB migration test** (Phase 6 only): on a backup of `server/dev.db`, run the slug-backfill migration, then run `verify-locale-coverage.mjs` and a full app smoke test (login → see translated genre list → create novel → see translated story modes).

### Manual Acceptance Criteria

Each phase commit must include in its message:
- `pnpm typecheck` result (PASS/FAIL).
- `pnpm dev` boot result (no errors in stderr at startup).
- Smoke checklist for the surfaces touched in the phase.
- For phases 5 and 6: explicit AI / DB regression notes.

---

## Correctness Properties

These are stated formally (PBT-friendly) so they map directly to `fast-check` properties.

### Property 1: Source-to-bundle key coverage

**Validates: Requirements 1.1, 7.1**

> ∀ keys K referenced via `t(K)` in `client/src/**` ∪ `server/src/**`: K ∈ keys(zh-CN.json).
> 
> Equivalently: `extractTKeys(source) ⊆ keys(zhBundle)`.
>
> Failure mode: developer wrote `t('foo.bar')` but never added `foo.bar` to the canonical bundle. Caught by `verify-locale-coverage.mjs`.

### Property 2: Deterministic fallback chain

**Validates: Requirements 1.2, 1.3**

> ∀ keys K, ∀ locales L ∈ {`vi-VN`, `zh-CN`}: `resolve(K, L)` = `bundle[L][K] ?? bundle['zh-CN'][K] ?? marker(K)`, where `marker(K) = K` in production and `marker(K) = "[!" + K + "!]"` in development.
>
> Equivalently: resolution is a pure function with deterministic preference order; never returns `undefined` or throws; always returns a non-empty string.
>
> Failure mode: a missing key crashes the UI. Property guarantees graceful degradation.

### Property 3: Locale switch preserves user state

**Validates: Requirements 2.1, 2.2**

> ∀ application states S, ∀ sequences σ of locale switches: applying σ to S mutates only the rendered display strings, not any user-data fields (novel content, character profiles, draft text, settings other than the locale itself).
>
> Equivalently: `stripDisplay(applySwitches(σ, S)) ≡ stripDisplay(S)`.
>
> Failure mode: locale toggle silently drops in-progress draft text. Property prevents regressions like that.

### Property 4: Glossary consistency

**Validates: Requirements 5.1**

> ∀ glossary entries (zh, vi) ∈ glossary.json: every occurrence of `zh` as a substring (with word boundaries) in `zh-CN.json` corresponds to an occurrence of `vi` at the equivalent position in `vi-VN.json`. No two distinct glossary entries map to the same `vi`.
>
> Equivalently: the glossary defines an injection on craft terms; translations follow it.
>
> Failure mode: 主角 sometimes translated as `nhân vật chính`, sometimes `vai chính` — readers see inconsistent terminology.

### Property 5: ICU placeholder identity across locales

**Validates: Requirements 7.2**

> ∀ keys K with ICU template values: `placeholders(viBundle[K]) = placeholders(zhBundle[K])` (as multiset, including names and types like `{count, plural, ...}`).
>
> Failure mode: translator drops or renames a `{count}` placeholder, runtime ICU formatter throws on render.

### Property 6: Output Language Directive invariant

**Validates: Requirements 4.1, 4.2**

> ∀ PromptAssets A producing user-visible content, ∀ locales L: `render(A, {outputLanguage: L}).systemMessage` ends with `directive(L).systemSuffix`. For L = `vi-VN`, `systemSuffix` contains the substring `越南语` and a glossary excerpt of at least 10 entries.
>
> Failure mode: a code path bypasses the directive and the LLM emits Chinese to a Vietnamese user. This property gates against that.

---

## Phase Plan (commit-by-commit)

Each phase = one Git commit on `feature/vietnamese-localization`. Each commit must build, typecheck, and boot. The branch merges to `beta` only after all six phases land.

### Phase 1 — Framework setup, no translations yet (foundational)

**Scope** (~600 lines added, 0 source strings translated):
- `shared/localization/types.ts`, `glossary.ts`, `glossary.json` (initial 30+ entries)
- `shared/localization/locales/zh-CN.json` (empty namespaces, valid JSON)
- `shared/localization/locales/vi-VN.json` (empty namespaces, valid JSON)
- `shared/index.ts` re-exports
- `client/src/i18n/index.ts`, `client/src/i18n/provider.tsx`
- Mount provider in `client/src/main.tsx`
- `server/src/i18n/index.ts`, `server/src/middleware/i18nMiddleware.ts`
- Wire i18n middleware into `server/src/app.ts`
- `i18next-parser.config.cjs` at workspace root
- `scripts/i18n/extract-cjk-literals.mjs`, `sync-locale-keys.mjs`, `verify-locale-coverage.mjs`
- Add deps: `i18next`, `react-i18next`, `i18next-icu`, `i18next-parser`, `fast-check`
- `docs/wiki/architecture/i18n.md` (the wiki entry — Background / Decision / Current Rule / Examples / Failure Modes / Related Modules / Source Documents)

**Verification**:
- `pnpm typecheck` passes.
- `pnpm dev` boots; visiting the app shows the same Chinese UI (no behavior change).
- `pnpm tsx scripts/i18n/verify-locale-coverage.mjs` exits 0 (trivially: no `t()` calls yet).

**Estimated lines/files touched**: ~12 new files, ~5 modified files. Zero existing UI strings touched.

### Phase 2 — Translate top-20 UI surfaces (highest-traffic)

**Scope** (~12k chars translated):

The 20 surfaces (chosen by user-traffic priority for the inspiration→10-chapter→check-in flow):
1. App shell + sidebar (`client/src/components/layout/`)
2. Login / first-run config
3. Project dashboard (novel list)
4. Novel basic-info setup page
5. World-building entry page
6. Character cast entry page
7. Auto Director cockpit (`client/src/components/autoDirector/AICockpit.tsx`)
8. Auto Director step list
9. Auto Director "continue 10 chapters" CTA
10. Chapter editor (read-only view first)
11. Chapter editor (write controls)
12. Knowledge base list page
13. Settings page (incl. LocaleSwitcher)
14. Toast / error messages from `client/src/api/client.ts`
15. Empty states across these surfaces
16. Confirmation dialogs across these surfaces
17. Auto-director check-in panel (3-chapter checkpoint UX)
18. Generation progress indicators
19. Task center summary
20. README-redirect / first-run welcome

For each surface: extract literals via `extract-cjk-literals.mjs`, wrap with `t()`, populate `zh-CN.json`, run `translate-locale.mjs` for vi-VN, human-review the Vietnamese (especially craft terms).

**Verification**:
- `pnpm typecheck` passes.
- `pnpm dev` boots; switching locale to `vi-VN` in Settings shows Vietnamese on all 20 surfaces; switching back to `zh-CN` shows original Chinese.
- Smoke test: full inspiration→10-chapter→check-in flow in Vietnamese.
- `verify-locale-coverage.mjs` passes.

**Estimated lines/files touched**: ~20 files modified, ~5k lines of zh-CN.json + vi-VN.json content added.

### Phase 3 — Translate remaining UI surfaces

**Scope** (~45k chars translated):
- All remaining `client/src/**/*.tsx` files outside the Phase-2 set.
- All remaining `client/src/api/*.ts` toast/error messages.
- All remaining store-level labels.

**Verification**: same as Phase 2, expanded to all surfaces. Manual UI tour covering every left-nav entry.

### Phase 4 — Server error and log messages

**Scope** (~10k chars translated):
- `server/src/middleware/errorHandler.ts` translates by `error.code`.
- All inline `error: "中文..."` returns in `server/src/routes/**` are converted to `error: t('serverErrors.code')`.
- Log messages emitted in code paths the user can see (desktop main-process bridge, `console.log` shown in the UI's startup gate) are translated; pure dev `console.warn` is left in Chinese.

**Verification**:
- Trigger a few error paths (POST with bad payload → 400 with Vietnamese message; navigate to a bogus route → 404 message in Vietnamese).
- `pnpm test` passes.

### Phase 5 — AI prompt Output Language Directive

**Scope** (~600 lines, no prompt translation):
- `server/src/prompting/core/outputLanguage.ts` (new): the directive builder.
- `server/src/prompting/core/promptRenderer.ts` (modified): accept `outputLanguage`, append directive to system message.
- `server/src/services/novel/**` invocation sites: pass `outputLanguage` from the request locale.
- Glossary excerpt embedded in directive (top 20 craft terms).
- `docs/wiki/prompts/output-language-directive.md` wiki entry.

**Verification**:
- `pnpm typecheck` passes.
- AI smoke test: trigger 3-chapter Auto Director run with locale=vi-VN, verify chapters are in Vietnamese, glossary terms used correctly. Capture results as a comment in the commit message.
- AI smoke test: same with locale=zh-CN — verify behavior identical to before Phase 5 (no regression).
- Run `pnpm tsx server/scripts/director-recovery-sample-audit.cjs` if available to confirm no recovery regression.

### Phase 6 — DB seed translation

**Scope**:
- Prisma migration `add_seed_slugs` (additive, nullable column).
- `scripts/i18n/backfill-seed-slugs.mjs` to populate slugs from existing Chinese names.
- Prisma migration `seed_slugs_required` (NOT NULL + UNIQUE).
- `seedData.*` keys added to both bundles for every existing slug.
- `SeedTranslator` integrated into the read paths of `routes/genre.ts`, `routes/storyMode.ts`, `routes/styleEngine.ts`.
- `verify-locale-coverage.mjs` extended with a "every seed slug has a vi entry" property.

**Pre-flight (data protection)**:
- Backup `server/dev.db` to `server/dev.db.bak.<date>` BEFORE running any migration. Confirm backup file size > 0. (Per AGENTS.md Data Protection Rule.)

**Verification**:
- `pnpm db:migrate` succeeds.
- `pnpm dev`; in vi-VN locale, the genre list shows Vietnamese names; switching to zh-CN shows the original Chinese; user-created genres without translation entries fall back to their stored Chinese name (also acceptable).
- `verify-locale-coverage.mjs` passes.

---

## Verification Strategy (per-phase gate)

Every phase commit MUST satisfy:

| Gate                                                    | Phase 1 | 2 | 3 | 4 | 5 | 6 |
|---------------------------------------------------------|:-------:|:-:|:-:|:-:|:-:|:-:|
| `pnpm typecheck` exits 0                                | ✓       | ✓ | ✓ | ✓ | ✓ | ✓ |
| `pnpm dev` boots without stderr error                   | ✓       | ✓ | ✓ | ✓ | ✓ | ✓ |
| `pnpm tsx scripts/i18n/verify-locale-coverage.mjs` 0    | ✓       | ✓ | ✓ | ✓ | ✓ | ✓ |
| Phase-specific UI smoke surfaces look right in vi-VN    | n/a     | ✓ | ✓ | ✓ | n/a | ✓ |
| Locale switcher preserves state                         | n/a     | ✓ | ✓ | ✓ | ✓ | ✓ |
| AI smoke test: vi output, glossary terms consistent     | n/a     | n/a | n/a | n/a | ✓ | n/a |
| DB backup file exists with size > 0 before migration    | n/a     | n/a | n/a | n/a | n/a | ✓ |
| Wiki entry under `docs/wiki/` updated                   | ✓       | n/a | n/a | n/a | ✓ | n/a |
| Release notes entry added (per `readme-release-updater`) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|:----------:|:------:|------------|
| AI prompt invocation in vi-VN degrades quality (e.g., LLM produces mixed-language output) | Medium | High | Keep prompts in Chinese; isolate Output Language Directive; AI smoke test gates Phase 5; iterate directive wording. |
| Glossary drift across translation passes | Medium | Medium | Single `glossary.json` consumed by both translation script and runtime; property test P4 enforces consistency. |
| Bundle size growth slows initial load | Low | Low | Lazy-load namespaces per route via dynamic JSON import; only `common` + landing namespaces eager. |
| Hot-reload breaks during i18n init in dev | Low | Low | Vite HMR works for JSON imports; documented in `docs/wiki/architecture/i18n.md`. |
| Upstream Chinese updates collide with vi-VN translations on merge | Medium | Medium | Translation files are key-additive (no row-deletes); upstream merges only conflict if a key is renamed, in which case `verify-locale-coverage.mjs` flags the orphan. |
| User-created seed rows have no Vietnamese translation | High | Low | SeedTranslator falls back to stored Chinese name; UI surface accepts that behaviour as documented. |
| Slugify collision in seed backfill | Low | Medium | Backfill aborts on collision; manual override JSON resolves. |
| Locale toggle while Auto Director is running confuses user (chapter language ≠ UI language) | Medium | Low | UI explicitly states "in-flight chapters keep their original language"; documented in wiki. |
| Vietnamese translations of fiction craft terms are awkward (machine translation quality) | High | Medium | Glossary is hand-curated for the 30+ most important terms; remainder is reviewed by user (single user is the translator/QA). |
| Breaking change in the `i18next` major version during active dev | Low | Low | Pin to `^23.16.0`; documented in this design. |
| Desktop electron build doesn't load locale bundles | Low | High | Bundles imported via Vite at build time (eager glob); test via `pnpm build:desktop:all` in Phase 1 verification. |
| Existing inline prompts (outside `server/src/prompting/`) bypass the directive | Medium | Medium | Document the exception list in `docs/wiki/prompts/output-language-directive.md`; flag inline prompt sites in Phase 5 commit message; future migration tracked separately (out of scope for v1). |

---

## Performance Considerations

- Locale bundle size estimate: zh-CN.json ~150 KB minified, vi-VN.json ~180 KB (Vietnamese tends to be ~20% longer than Chinese in characters). Eager-load `common` + visible-route namespace at boot, lazy-load others on first navigation. Total initial JS payload increase is bounded by the eagerly-loaded slice (~40–60 KB after gzip).
- `i18next` initialization time: <10 ms on a modern machine; not on the critical render path because the provider mounts before `<AppRouter />` and React 19 Suspense handles the brief delay.
- Server `i18next` initialization: <5 ms at boot; one-shot, not per-request.
- Glossary injection into prompt directive adds ~500 tokens per prompt invocation (~$0.0001 cost on DeepSeek, negligible).

---

## Security Considerations

- Locale strings are NEVER interpolated as HTML/JSX without React's automatic escaping. ICU placeholders use the standard `{name}` syntax which `i18next-icu` resolves textually, not as code.
- The translation script (`translate-locale.mjs`) sends `zh-CN.json` strings to DeepSeek's API. Since this is a single-user internal tool and the strings are public UI copy (not user secrets), this is acceptable. The script MUST NOT be run against bundles that contain user data.
- The Prisma migration adds nullable columns first (data-safe), backfills, then adds NOT NULL (data-validated). No data deletion.
- The `Accept-Language` header is the only user-controlled input for locale resolution. It's validated against the `SUPPORTED_LOCALES` allow-list before use.

---

## Dependencies

### New runtime dependencies

| Package           | Version       | Workspace location | License | Purpose |
|-------------------|---------------|--------------------|---------|---------|
| `i18next`         | `^23.16.0`    | client + server    | MIT     | core translation runtime |
| `react-i18next`   | `^15.2.0`     | client             | MIT     | React binding |
| `i18next-icu`     | `^2.3.0`      | client + server    | MIT     | ICU plural/select formatting |

### New devDependencies (workspace root)

| Package            | Version    | License | Purpose |
|--------------------|------------|---------|---------|
| `i18next-parser`   | `^9.0.0`   | MIT     | AST extraction of `t()` calls |
| `fast-check`       | `^3.x`     | MIT     | property-based tests |

### No new dependencies on

- shared package (only adds JSON + TS, no runtime deps).
- Prisma schema (only additive column migrations, no schema lib changes).

### External services

- DeepSeek API (already configured) — used by `translate-locale.mjs` only, not at runtime.
- Qdrant (unchanged) — locale doesn't affect RAG; embeddings are language-agnostic for the user's purposes.

---

## Open Questions for Requirements Phase

These are flagged for the requirements phase to firm up before tasks are written:

1. Should the `LocaleSwitcher` be visible on every page (e.g., in a header), or only inside Settings? (Recommendation: Settings-only; user said personal use, low cognitive load.)
2. For Phase 2's "top-20 surfaces", should the user explicitly approve the surface list, or is the proposed list above acceptable as-is?
3. For DB seed translation in Phase 6: when a seed row is user-customised after Phase 6 lands, should the system offer to auto-generate a Vietnamese translation for it via DeepSeek, or fall back to stored Chinese with no UI prompt? (Recommendation: silent fallback; auto-translate is a feature for v2.)
4. Should release notes be written in Vietnamese, Chinese, or English going forward? (Recommendation: Chinese for now per existing repo convention; user can change later.)
5. Should the AI Output Language Directive offer a per-novel override (e.g., a single novel's chapters could be generated in Chinese while the UI is Vietnamese)? (Recommendation: out of scope for v1; locale is global.)
