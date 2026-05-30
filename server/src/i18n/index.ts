/**
 * Server-side i18next bootstrap.
 *
 * The server uses a single i18next instance to translate:
 *  - HTTP error responses returned by `errorHandler` middleware;
 *  - log lines that the desktop main-process bridge surfaces to the user
 *    (the server startup gate, `[server] listening`-style messages,
 *    `built-in creative resources bootstrapped`, etc.).
 *
 * Prompt strings are NOT routed through this module. They go through the
 * Output Language Directive in `server/src/prompting/core/outputLanguage.ts`
 * (added in Phase 5).
 */

import i18nextNs, { type i18n as I18nInstance, type Resource } from "i18next";
import ICU from "i18next-icu";
import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  LOCALE_BUNDLES,
  NAMESPACE_KEYS,
  SUPPORTED_LOCALES,
  isLocaleCode,
  type LocaleCode,
  type NamespaceKey,
} from "@ai-novel/shared/localization";

// CommonJS interop: i18next ships its createInstance on the default export
// when imported from a CJS consumer.
const i18nextRoot = (i18nextNs as unknown as {
  default?: typeof i18nextNs;
}).default ?? i18nextNs;

/** Options accepted by the server-side `t()` helper. */
export interface ServerTranslateOptions {
  /** Locale to resolve. Defaults to {@link DEFAULT_LOCALE}. */
  lng?: LocaleCode;
  /** Variables to interpolate into the localized string. */
  values?: Record<string, unknown>;
}

/** The handle returned by {@link createI18nServer}. */
export interface I18nServerHandle {
  /** The configured i18next instance (mostly useful in tests). */
  readonly i18n: I18nInstance;
  /**
   * Translate `key` in the given `namespace`. Falls back through the
   * configured locale chain. Always returns a string.
   */
  t<NS extends NamespaceKey>(
    namespace: NS,
    key: string,
    options?: ServerTranslateOptions,
  ): string;
  /**
   * Resolve a locale from incoming HTTP headers. Defaults to
   * {@link DEFAULT_LOCALE} when the header is missing or unsupported.
   */
  resolveLocale(req: { headers?: Record<string, unknown> | undefined }): LocaleCode;
}

/**
 * Build the `resources` object expected by i18next from the eager-loaded
 * locale bundles.
 */
function buildServerResources(): Resource {
  const resources: Resource = {};
  for (const locale of SUPPORTED_LOCALES) {
    const bundle = LOCALE_BUNDLES[locale] as Record<string, Record<string, unknown>>;
    const perLocale: Record<string, Record<string, unknown>> = {};
    for (const ns of NAMESPACE_KEYS) {
      perLocale[ns] = bundle[ns] ?? {};
    }
    resources[locale] = perLocale;
  }
  return resources;
}

/**
 * Parse the first locale from an `Accept-Language` header value. Returns
 * the first tag from the comma-separated list whose primary language tag
 * matches one of {@link SUPPORTED_LOCALES}, or `null` when no match.
 */
function pickFirstSupportedLocale(headerValue: string): LocaleCode | null {
  const tags = headerValue
    .split(",")
    .map((part) => part.trim().split(";")[0]?.trim())
    .filter((tag): tag is string => Boolean(tag));
  for (const tag of tags) {
    if (isLocaleCode(tag)) {
      return tag;
    }
    // Tolerate primary-tag-only forms (e.g. `vi`, `zh`) by promoting them
    // to the supported regional variant.
    const primary = tag.toLowerCase();
    if (primary === "vi") return "vi-VN";
    if (primary === "zh" || primary === "zh-cn" || primary === "zh-hans") {
      return "zh-CN";
    }
  }
  return null;
}

let cachedHandle: I18nServerHandle | null = null;

/**
 * Configure (idempotently) the server-side i18next instance and return a
 * handle. Safe to call multiple times; the second call returns the cached
 * handle.
 */
export async function createI18nServer(): Promise<I18nServerHandle> {
  if (cachedHandle) {
    return cachedHandle;
  }

  const instance = i18nextRoot.createInstance();
  const IcuModule = (ICU as unknown as { default?: unknown }).default ?? ICU;
  await instance.use(IcuModule as Parameters<I18nInstance["use"]>[0]).init({
    resources: buildServerResources(),
    lng: DEFAULT_LOCALE,
    fallbackLng: FALLBACK_LOCALE,
    defaultNS: "common",
    ns: [...NAMESPACE_KEYS],
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    returnEmptyString: false,
    parseMissingKeyHandler: (key: string) => key,
  });

  // Self-check: missing-key handler must yield a non-empty string.
  const probe = instance.t("__startup_self_check__:does.not.exist");
  if (typeof probe !== "string" || probe.length === 0) {
    throw new Error(
      "Server i18n self-check failed: missing-key handler returned an empty value.",
    );
  }

  cachedHandle = {
    i18n: instance,
    t<NS extends NamespaceKey>(
      namespace: NS,
      key: string,
      options?: ServerTranslateOptions,
    ): string {
      const lng = options?.lng ?? DEFAULT_LOCALE;
      const fullKey = key.includes(":") ? key : `${namespace}:${key}`;
      return instance.t(fullKey, { lng, ...(options?.values ?? {}) }) as string;
    },
    resolveLocale(req: { headers?: Record<string, unknown> | undefined }): LocaleCode {
      const raw = req.headers?.["accept-language"] ?? req.headers?.["Accept-Language"];
      if (typeof raw !== "string" || raw.length === 0) {
        return DEFAULT_LOCALE;
      }
      const picked = pickFirstSupportedLocale(raw);
      return picked ?? DEFAULT_LOCALE;
    },
  };

  return cachedHandle;
}

/**
 * Return the cached handle, or `null` if {@link createI18nServer} has not
 * been called yet. Useful for code paths that cannot await but should
 * gracefully no-op when the server is still booting.
 */
export function getI18nServerHandle(): I18nServerHandle | null {
  return cachedHandle;
}

export type { LocaleCode, NamespaceKey } from "@ai-novel/shared/localization";
