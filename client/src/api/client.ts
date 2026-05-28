import axios, { AxiosError } from "axios";
import type { ApiResponse } from "@ai-novel/shared/types/api";
import { API_BASE_URL, API_TIMEOUT_MS } from "@/lib/constants";
import { toast } from "@/components/ui/toast";
import { getI18nClientHandle } from "@/i18n";

export interface ApiHttpError extends Error {
  status?: number;
  details?: unknown;
}

declare module "axios" {
  interface AxiosRequestConfig {
    silentErrorStatuses?: number[];
  }
}

/**
 * Resolve a translated common-error string. Falls back to the canonical
 * Chinese key (or its zh-CN bundle entry) when the i18n handle has not
 * booted yet — the worst case is the user sees Chinese text, never a
 * crash or a raw key.
 */
function tCommonError(key: "network" | "server" | "request"): string {
  const handle = getI18nClientHandle();
  if (!handle) {
    // Pre-init fallback: keep the original Chinese strings to match the
    // canonical bundle.
    if (key === "network") return "网络连接失败，请检查网络后重试。";
    if (key === "server") return "服务器错误，请稍后重试。";
    return "请求失败。";
  }
  return handle.i18n.t(`common:errors.${key}`);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

// Forward the user's chosen locale to the server so the i18n middleware
// can resolve it via `Accept-Language`. Reading from the i18next handle
// (rather than directly from localStorage) ensures any in-memory
// language change is reflected on the very next request without waiting
// for a page reload.
apiClient.interceptors.request.use((config) => {
  const handle = getI18nClientHandle();
  const locale = handle?.currentLocale();
  if (locale) {
    config.headers.set("Accept-Language", locale);
  }
  return config;
});

const AUTO_DISMISS_SERVER_ERROR_TOAST = {
  duration: 4000,
  closeButton: false,
} as const;

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    const backendError = error.response?.data?.error;
    const backendMessage = error.response?.data?.message;
    const silentErrorStatuses = error.config?.silentErrorStatuses ?? [];
    let title = backendError ?? error.message ?? tCommonError("request");
    let description = backendMessage && backendMessage !== backendError ? backendMessage : undefined;

    const networkErrorTitle = tCommonError("network");
    const serverErrorTitle = tCommonError("server");

    if (!status) {
      title = networkErrorTitle;
      description = undefined;
    } else if (status >= 500) {
      title = backendError ?? serverErrorTitle;
      description = backendMessage && backendMessage !== title ? backendMessage : undefined;
    }

    if (!status || !silentErrorStatuses.includes(status)) {
      const isGenericServerErrorToast = title === serverErrorTitle;

      if (description) {
        toast.error(
          title,
          isGenericServerErrorToast
            ? {
                description,
                ...AUTO_DISMISS_SERVER_ERROR_TOAST,
              }
            : { description },
        );
      } else {
        toast.error(title, isGenericServerErrorToast ? AUTO_DISMISS_SERVER_ERROR_TOAST : undefined);
      }
    }

    const message = description ? `${title} ${description}` : title;

    const normalizedError = new Error(
      message,
    ) as ApiHttpError;
    normalizedError.status = status;
    normalizedError.details = error.response?.data;
    return Promise.reject(normalizedError);
  },
);
