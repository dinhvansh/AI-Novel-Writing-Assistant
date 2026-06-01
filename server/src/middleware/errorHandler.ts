import type { NextFunction, Request, Response } from "express";
import type { ApiResponse } from "@ai-novel/shared/types/api";
import { ZodError, type ZodIssue } from "zod";
import { getI18nServerHandle } from "../i18n";
import { getRequestLocale } from "./i18nMiddleware";

export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;
  readonly code?: string;

  constructor(message: string, statusCode = 500, details?: unknown, code?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
  }
}

function joinErrorParts(parts: Array<string | undefined>): string {
  return parts.map((part) => part?.trim() ?? "").filter(Boolean).join(" | ");
}


/**
 * Translate a server-error key with the per-request locale. Returns the
 * raw zh-CN canonical text when the i18n handle has not booted yet — the
 * worst case is the user sees Chinese, never raw `serverErrors:foo` keys
 * or a crash.
 */
export function tError(
  res: Response,
  key: string,
  values?: Record<string, unknown>,
  fallback?: string,
): string {
  const handle = getI18nServerHandle();
  if (!handle) {
    return fallback ?? key;
  }
  const lng = getRequestLocale(res);
  return handle.t("serverErrors", key, { lng, values });
}

function formatValidationPath(res: Response, path: PropertyKey[]): string {
  return path
    .map((segment) => {
      if (typeof segment === "number") {
        return tError(res, "validationItem", { index: segment + 1 }, `第 ${segment + 1} 项`);
      }
      if (typeof segment === "symbol") {
        return segment.toString();
      }
      // Try the field-label dictionary first; fall back to the raw key.
      const handle = getI18nServerHandle();
      if (handle) {
        const lng = getRequestLocale(res);
        const localized = handle.t(
          "serverErrors",
          `validationField.${segment}`,
          { lng },
        );
        // i18next returns the raw key when missing; treat that as a miss.
        if (typeof localized === "string" && localized !== `serverErrors:validationField.${segment}`) {
          return localized;
        }
      }
      return String(segment);
    })
    .filter(Boolean)
    .join(" / ");
}

function formatZodIssueMessage(res: Response, issue: ZodIssue): string {
  const issueRecord = issue as ZodIssue & Record<string, unknown>;
  const code = String(issue.code);
  const origin = typeof issueRecord.origin === "string" ? issueRecord.origin : undefined;

  switch (code) {
    case "invalid_type":
      if (issueRecord.input === undefined) {
        return tError(res, "zod.invalidTypeMissing", undefined, "不能为空。");
      }
      if (issueRecord.expected === "string") {
        return tError(res, "zod.invalidTypeString", undefined, "必须是文本。");
      }
      if (issueRecord.expected === "number") {
        return tError(res, "zod.invalidTypeNumber", undefined, "必须是数字。");
      }
      if (issueRecord.expected === "boolean") {
        return tError(res, "zod.invalidTypeBoolean", undefined, "必须是布尔值。");
      }
      return issue.message || tError(res, "zod.invalidTypeGeneric", undefined, "类型不正确。");
    case "invalid_value":
      return issue.message || tError(res, "zod.invalidValueGeneric", undefined, "取值不合法。");
    case "too_small":
      if (origin === "array") {
        return tError(res, "zod.tooSmallArray", { minimum: issueRecord.minimum }, `至少需要 ${issueRecord.minimum} 项。`);
      }
      if (origin === "string") {
        return issueRecord.minimum === 1
          ? tError(res, "zod.tooSmallStringEmpty", undefined, "不能为空。")
          : tError(res, "zod.tooSmallString", { minimum: issueRecord.minimum }, `至少 ${issueRecord.minimum} 个字符。`);
      }
      if (origin === "number") {
        return tError(res, "zod.tooSmallNumber", { minimum: issueRecord.minimum }, `不能小于 ${issueRecord.minimum}。`);
      }
      return issue.message || tError(res, "zod.tooSmallGeneric", undefined, "内容过短。");
    case "too_big":
      if (origin === "array") {
        return tError(res, "zod.tooBigArray", { maximum: issueRecord.maximum }, `最多只能填写 ${issueRecord.maximum} 项。`);
      }
      if (origin === "string") {
        return tError(res, "zod.tooBigString", { maximum: issueRecord.maximum }, `不能超过 ${issueRecord.maximum} 个字符。`);
      }
      if (origin === "number") {
        return tError(res, "zod.tooBigNumber", { maximum: issueRecord.maximum }, `不能大于 ${issueRecord.maximum}。`);
      }
      return issue.message || tError(res, "zod.tooBigGeneric", undefined, "内容过长。");
    default:
      return issue.message || tError(res, "zod.formatGeneric", undefined, "格式不正确。");
  }
}

function formatValidationIssue(res: Response, issue: ZodIssue): string {
  const path = formatValidationPath(res, issue.path);
  const message = formatZodIssueMessage(res, issue);
  if (!path) {
    return message;
  }
  return tError(res, "validationPath", { path, message }, `${path}：${message}`);
}

function setRequestErrorMessage(
  res: Response<ApiResponse<null>>,
  error: string,
  detail?: string,
): void {
  res.locals.requestErrorMessage = joinErrorParts([error, detail]);
}

function logServerError(req: Request, error: unknown): void {
  console.error(`[error] ${req.method} ${req.originalUrl}`, error);
}

function collectErrorMessages(error: unknown, depth = 0): string[] {
  if (!error || depth > 4) {
    return [];
  }
  if (error instanceof Error) {
    return [
      error.message,
      ...collectErrorMessages((error as Error & { cause?: unknown }).cause, depth + 1),
    ].filter(Boolean);
  }
  if (typeof error === "object") {
    const record = error as {
      message?: unknown;
      cause?: unknown;
    };
    return [
      typeof record.message === "string" ? record.message : "",
      ...collectErrorMessages(record.cause, depth + 1),
    ].filter(Boolean);
  }
  return [];
}

function findConnectionCause(error: unknown, depth = 0): {
  code?: string;
  host?: string;
  port?: number | string;
} | null {
  if (!error || depth > 6 || typeof error !== "object") {
    return null;
  }
  const record = error as {
    code?: unknown;
    host?: unknown;
    port?: unknown;
    cause?: unknown;
  };
  if (
    (typeof record.code === "string" && record.code.trim())
    || (typeof record.host === "string" && record.host.trim())
  ) {
    return {
      code: typeof record.code === "string" ? record.code : undefined,
      host: typeof record.host === "string" ? record.host : undefined,
      port: typeof record.port === "number" || typeof record.port === "string" ? record.port : undefined,
    };
  }
  return findConnectionCause(record.cause, depth + 1);
}

function formatUpstreamConnectionError(res: Response, error: unknown): string | null {
  const joinedMessage = collectErrorMessages(error).join(" | ").trim();
  const isNetworkLike = /connection error|fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|tls/i
    .test(joinedMessage);
  if (!isNetworkLike) {
    return null;
  }
  const cause = findConnectionCause(error);
  const fallbackTarget = tError(res, "upstreamServiceFallbackTarget", undefined, "上游模型服务");
  const target = cause?.host
    ? `${cause.host}${cause.port ? `:${cause.port}` : ""}`
    : fallbackTarget;
  const code = cause?.code ? `（${cause.code}）` : "";
  return tError(
    res,
    "upstreamConnectionGeneric",
    { target, code },
    `上游模型服务连接失败：当前服务器无法连接到 ${target}${code}。请检查该提供商的网络连通性，或切换到其它可用模型提供商。`,
  );
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response<ApiResponse<null>>,
  _next: NextFunction,
): void {
  if (
    error
    && typeof error === "object"
    && "type" in error
    && (error as { type?: string }).type === "entity.too.large"
  ) {
    const message = tError(res, "requestBodyTooLarge", undefined, "请求体过大，请缩短文本或分段上传。");
    setRequestErrorMessage(res, message);
    res.status(413).json({
      success: false,
      error: message,
    });
    return;
  }

  if (error instanceof ZodError) {
    const detail = error.issues.map((issue) => formatValidationIssue(res, issue)).join(" ");
    const message = tError(res, "validationFailed", undefined, "请求参数校验失败。");
    setRequestErrorMessage(res, message, detail);
    res.status(400).json({
      success: false,
      error: message,
      message: detail,
    });
    return;
  }

  if (error instanceof AppError) {
    const detail = typeof error.details === "string" ? error.details : undefined;
    // If the error has a code, translate it; otherwise use the message verbatim
    const message = error.code
      ? tError(res, error.code, undefined, error.message)
      : error.message;
    setRequestErrorMessage(res, message, detail);
    if (error.statusCode >= 500) {
      logServerError(req, error);
    }
    res.status(error.statusCode).json({
      success: false,
      error: message,
      message: detail,
    });
    return;
  }

  const fallbackUnknown = tError(res, "internalUnknown", undefined, "服务器发生未知错误。");
  const message = error instanceof Error ? error.message : fallbackUnknown;
  const upstreamConnectionMessage = formatUpstreamConnectionError(res, error);
  if (upstreamConnectionMessage) {
    setRequestErrorMessage(res, upstreamConnectionMessage);
    logServerError(req, error);
    res.status(502).json({
      success: false,
      error: upstreamConnectionMessage,
    });
    return;
  }

  setRequestErrorMessage(res, message);
  logServerError(req, error);
  res.status(500).json({
    success: false,
    error: message,
  });
}
