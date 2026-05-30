/**
 * Client-side i18next bootstrap.
 *
 * Configures a single i18next instance that:
 *  - reads the user's persisted locale (default: vi-VN);
 *  - falls back to zh-CN for any missing key (the canonical bundle);
 *  - in development renders missing keys as `[!ns:key!]` so they stand
 *    out in screenshots; in production / desktop renders the raw key
 *    string so the UI stays usable.
 *
 * Locale bundles are eagerly imported from the `@ai-novel/shared`
 * package so they are bundled by Vite at build time (no HTTP backend
 * adapter is needed for desktop / offline builds).
 */

import i18n, { type i18n as I18nInstance, type Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import ICU from "i18next-icu";

import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  LOCALE_BUNDLES,
  NAMESPACE_KEYS,
  SUPPORTED_LOCALES,
  type LocaleCode,
} from "@ai-novel/shared/localization";
import { readPersistedLocale, writePersistedLocale } from "@/lib/localePersistence";

/**
 * The handle returned by {@link createI18nClient}. Holds the configured
 * i18next instance plus typed helpers for locale state.
 */
export interface I18nClientHandle {
  /** The configured i18next instance, ready to be passed to `<I18nextProvider>`. */
  i18n: I18nInstance;
  /** Switch the active locale. Persists the choice. */
  setLocale(code: LocaleCode): Promise<void>;
  /** Return the currently active locale. */
  currentLocale(): LocaleCode;
}

const isDevMode = (): boolean => {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
};

/**
 * Build the `resources` object expected by i18next from the eager-loaded
 * locale bundles. Each top-level key on the bundle (`common`, `novel`,
 * etc.) becomes its own namespace.
 */
function buildResources(): Resource {
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

let cachedHandle: I18nClientHandle | null = null;

/**
 * Configure (idempotently) the global i18next instance and return a
 * handle.
 */
export async function createI18nClient(): Promise<I18nClientHandle> {
  if (cachedHandle) {
    return cachedHandle;
  }

  const startingLocale = readPersistedLocale();

  await i18n
    .use(ICU)
    .use(initReactI18next)
    .init({
      resources: buildResources(),
      lng: startingLocale,
      fallbackLng: FALLBACK_LOCALE,
      defaultNS: "common",
      ns: [...NAMESPACE_KEYS],
      interpolation: {
        // i18next-icu handles formatting; React handles XSS escaping at the
        // render boundary.
        escapeValue: false,
      },
      returnNull: false,
      returnEmptyString: false,
      // When a key is missing in BOTH the active locale and the fallback,
      // i18next normally returns the raw key. In development we wrap it
      // with a marker so QA can spot it; in production we leave it raw
      // so the UI never crashes and the user sees something at worst
      // "key-shaped".
      parseMissingKeyHandler: (key: string) => (isDevMode() ? `[!${key}!]` : key),
    });

  // Self-check: the missing-key handler must produce a non-empty string
  // for a synthetic missing key. This satisfies AC 1.3.1 and is a cheap
  // boot-time guard against future misconfiguration.
  const selfCheck = i18n.t("__startup_self_check__:does.not.exist");
  if (typeof selfCheck !== "string" || selfCheck.length === 0) {
    throw new Error(
      "i18n self-check failed: missing-key handler returned an empty value.",
    );
  }

  cachedHandle = {
    i18n,
    async setLocale(code: LocaleCode) {
      writePersistedLocale(code);
      await i18n.changeLanguage(code);
    },
    currentLocale() {
      const current = i18n.language as LocaleCode;
      return SUPPORTED_LOCALES.includes(current) ? current : DEFAULT_LOCALE;
    },
  };

  return cachedHandle;
}

/**
 * Return the currently configured handle, or `null` if `createI18nClient`
 * has not run yet. Useful in module boundaries that cannot await.
 */
export function getI18nClientHandle(): I18nClientHandle | null {
  return cachedHandle;
}
