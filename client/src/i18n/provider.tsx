/**
 * `<I18nProvider>` — async boot wrapper around `<I18nextProvider>`.
 *
 * Usage:
 *
 *   <I18nProvider>
 *     <App />
 *   </I18nProvider>
 *
 * The provider awaits {@link createI18nClient} once on mount and then
 * exposes the i18next instance to the React tree. Until init completes,
 * children render against an inactive instance (i18next's own defaults
 * still produce sensible strings via the fallback chain). This keeps
 * the boot path simple and avoids a flash of the wrong language because
 * `lng` is set from `localStorage` synchronously during `createI18nClient`.
 */

import { useEffect, useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import { createI18nClient, type I18nClientHandle } from "./index";

interface I18nProviderProps {
  children: ReactNode;
  /** Optional override, useful for tests. */
  fallback?: ReactNode;
}

export function I18nProvider({ children, fallback = null }: I18nProviderProps) {
  const [handle, setHandle] = useState<I18nClientHandle | null>(null);

  useEffect(() => {
    let cancelled = false;
    void createI18nClient().then((instance) => {
      if (!cancelled) {
        setHandle(instance);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!handle) {
    return <>{fallback}</>;
  }

  return <I18nextProvider i18n={handle.i18n}>{children}</I18nextProvider>;
}
