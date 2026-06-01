import type { TaskKind, TaskStatus } from "@ai-novel/shared/types/task";
import {
  extractStructuredOutputErrorCategory,
} from "../../llm/structuredOutput";
import { summarizeStructuredOutputFailure } from "../../llm/structuredInvoke";
import { DEFAULT_LOCALE, type LocaleCode } from "@ai-novel/shared/localization";
import { getI18nServerHandle } from "../../i18n";
import { getCurrentRequestLocale } from "../../runtime/requestLocaleContext";

function t(key: string, values?: Record<string, unknown>): string {
  const handle = getI18nServerHandle();
  if (!handle) return key;
  const locale: LocaleCode = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
  return handle.t("serverLogs", key, { lng: locale, ...(values ?? {}) });
}

export function normalizeFailureSummary(summary?: string | null, fallback?: string): string {
  return summary?.trim() || (fallback ?? t("taskSupport.noFailureRecord"));
}

export function resolveStructuredFailureSummary(summary?: string | null): {
  failureCode: string | null;
  failureSummary: string | null;
} {
  if (!summary?.trim()) {
    return {
      failureCode: null,
      failureSummary: null,
    };
  }
  const category = extractStructuredOutputErrorCategory(summary);
  if (!category) {
    return {
      failureCode: null,
      failureSummary: null,
    };
  }
  const details = summarizeStructuredOutputFailure({
    error: summary,
    fallbackAvailable: false,
  });
  return {
    failureCode: details.failureCode,
    failureSummary: details.summary,
  };
}

export function isArchivableTaskStatus(status: TaskStatus): boolean {
  return status === "succeeded" || status === "failed" || status === "cancelled";
}

export function buildTaskRecoveryHint(kind: TaskKind, status: TaskStatus): string {
  if (status === "failed") {
    if (kind === "knowledge_document") {
      return t("taskSupport.recovery.failed.knowledge_document");
    }
    if (kind === "agent_run") {
      return t("taskSupport.recovery.failed.agent_run");
    }
    if (kind === "novel_workflow") {
      return t("taskSupport.recovery.failed.novel_workflow");
    }
    if (kind === "novel_pipeline") {
      return t("taskSupport.recovery.failed.novel_pipeline");
    }
    if (kind === "book_analysis") {
      return t("taskSupport.recovery.failed.book_analysis");
    }
    if (kind === "style_extraction") {
      return t("taskSupport.recovery.failed.style_extraction");
    }
    return t("taskSupport.recovery.failed.default");
  }
  if (status === "waiting_approval") {
    if (kind === "novel_workflow") {
      return t("taskSupport.recovery.waiting_approval.novel_workflow");
    }
    return t("taskSupport.recovery.waiting_approval.default");
  }
  if (status === "running") {
    return t("taskSupport.recovery.running");
  }
  if (status === "queued") {
    if (kind === "knowledge_document") {
      return t("taskSupport.recovery.queued.knowledge_document");
    }
    if (kind === "style_extraction") {
      return t("taskSupport.recovery.queued.style_extraction");
    }
    return t("taskSupport.recovery.queued.default");
  }
  if (status === "cancelled") {
    if (kind === "knowledge_document") {
      return t("taskSupport.recovery.cancelled.knowledge_document");
    }
    if (kind === "novel_workflow") {
      return t("taskSupport.recovery.cancelled.novel_workflow");
    }
    if (kind === "style_extraction") {
      return t("taskSupport.recovery.cancelled.style_extraction");
    }
    return t("taskSupport.recovery.cancelled.default");
  }
  return t("taskSupport.recovery.noAction");
}
