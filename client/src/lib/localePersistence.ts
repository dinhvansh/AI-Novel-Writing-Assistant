/**
 * Locale persistence helper for the client.
 *
 * Reads and writes the user's chosen locale to `localStorage` using a
 * stable key. In Electron desktop builds the same `localStorage` is
 * backed by Chromium's profile so no extra IPC bridge is needed; if a
 * future build splits desktop config from web, this module is the single
 * point to extend.
 */

import {
  DEFAULT_LOCALE,
  isLocaleCode,
  type LocaleCode,
} from "@ai-novel/shared/localization";

/** localStorage key used to persist the user's locale choice. */
export const LOCALE_STORAGE_KEY = "ai-novel:locale";

/**
 * Return the persisted locale, or {@link DEFAULT_LOCALE} when no valid
 * value has been saved yet. Never throws.
 */
export function readPersistedLocale(): LocaleCode {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocaleCode(raw)) {
      return raw;
    }
  } catch {
    // localStorage may be unavailable (privacy mode, blocked).
  }
  return DEFAULT_LOCALE;
}

/**
 * Persist the given locale. No-ops if `window` or `localStorage` is
 * unavailable. Never throws.
 */
export function writePersistedLocale(locale: LocaleCode): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Quota or permission errors are intentionally swallowed.
  }
}
