/**
 * Per-request locale propagation via AsyncLocalStorage.
 *
 * Why AsyncLocalStorage and not a plain function argument?
 * The prompt runner is called from dozens of services that themselves
 * are called from hundreds of route handlers. Threading
 * `outputLanguage` through every call signature would be a sweeping
 * refactor with high merge-conflict risk against upstream Chinese
 * commits. AsyncLocalStorage lets the i18n middleware open a request
 * scope and any downstream code (services, prompt runner, even
 * fire-and-forget Celery-style tasks that run inside the same async
 * tree) can read the locale on demand.
 *
 * Tasks that intentionally outlive the request scope (worker tasks,
 * background watchdogs) MUST NOT depend on this context — they should
 * either pass the locale explicitly or default to {@link DEFAULT_LOCALE}.
 */

import { AsyncLocalStorage } from "node:async_hooks";

import { DEFAULT_LOCALE, type LocaleCode } from "@ai-novel/shared/localization";

interface RequestLocaleSlot {
  locale: LocaleCode;
}

const requestLocaleStorage = new AsyncLocalStorage<RequestLocaleSlot>();

/**
 * Run `callback` inside a request-scoped context that exposes the given
 * `locale` to {@link getCurrentRequestLocale}. Returns whatever
 * `callback` returns (sync or async).
 */
export function runWithRequestLocale<T>(
  locale: LocaleCode,
  callback: () => T,
): T {
  return requestLocaleStorage.run({ locale }, callback);
}

/**
 * Read the current request's locale, or {@link DEFAULT_LOCALE} when
 * called outside a request scope (e.g. by a worker task).
 */
export function getCurrentRequestLocale(): LocaleCode {
  return requestLocaleStorage.getStore()?.locale ?? DEFAULT_LOCALE;
}
