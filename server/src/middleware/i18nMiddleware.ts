/**
 * Express middleware that resolves the request locale from the
 * `Accept-Language` header against the supported locale allow-list and
 * attaches it to `res.locals.locale`.
 *
 * Mounted in `server/src/app.ts` BEFORE any route mount so that
 * downstream handlers (and `errorHandler`) can read `res.locals.locale`.
 */

import type { NextFunction, Request, Response } from "express";

import { DEFAULT_LOCALE, type LocaleCode } from "@ai-novel/shared/localization";
import { getI18nServerHandle } from "../i18n";
import { runWithRequestLocale } from "../runtime/requestLocaleContext";

/**
 * Type-narrowed accessor for `res.locals.locale`. Use this rather than
 * augmenting the express-serve-static-core types directly because Express
 * 5 ships its own `Locals` interface that varies across @types versions.
 */
export function getRequestLocale(res: Response): LocaleCode {
  const fromLocals = (res.locals as { locale?: LocaleCode }).locale;
  return fromLocals ?? DEFAULT_LOCALE;
}

/**
 * Resolve `res.locals.locale` from the request `Accept-Language` header.
 * Falls back to {@link DEFAULT_LOCALE} when the i18n handle has not been
 * initialised yet (rare; only during a very narrow startup window).
 *
 * Also opens an AsyncLocalStorage scope so downstream services can read
 * the locale via `getCurrentRequestLocale()` without needing to thread
 * it through every function argument.
 */
export function i18nMiddleware(req: Request, res: Response, next: NextFunction): void {
  const handle = getI18nServerHandle();
  const locale: LocaleCode = handle
    ? handle.resolveLocale({ headers: req.headers as Record<string, unknown> })
    : DEFAULT_LOCALE;
  (res.locals as { locale?: LocaleCode }).locale = locale;
  runWithRequestLocale(locale, () => next());
}
