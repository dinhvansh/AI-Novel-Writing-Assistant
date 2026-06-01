import type { TFunction } from "i18next";
import type { DirectorCommandAcceptedResponse } from "@ai-novel/shared/types/directorRuntime";
import type { DirectorContinuationMode } from "@ai-novel/shared/types/novelDirector";
import type { UnifiedTaskDetail } from "@ai-novel/shared/types/task";
import { getI18nClientHandle } from "@/i18n";

function getT(): TFunction | null {
  const handle = getI18nClientHandle();
  if (!handle) return null;
  return handle.i18n.t.bind(handle.i18n) as TFunction;
}

export function resolveWorkflowContinuationFeedback(
  task: UnifiedTaskDetail | DirectorCommandAcceptedResponse | null | undefined,
  options?: {
    mode?: DirectorContinuationMode;
    scopeLabel?: string | null;
    t?: TFunction;
  },
): {
  tone: "success" | "error";
  message: string;
} {
  const t = options?.t ?? getT();
  const requestedScopeLabel = options?.scopeLabel?.trim();
  const taskScopeLabel = task && "executionScopeLabel" in task ? task.executionScopeLabel?.trim() : undefined;
  const scopeLabel = requestedScopeLabel || taskScopeLabel || (t ? t("autoDirector:continuation.currentRange") : "");

  if (task && "kind" in task && task.status === "failed") {
    return {
      tone: "error",
      message: task.failureSummary?.trim()
        || task.blockingReason?.trim()
        || task.lastError?.trim()
        || (options?.mode === "auto_execute_range"
          ? (t ? t("autoDirector:continuation.continueRangeFailed", { scope: scopeLabel }) : "")
          : (t ? t("autoDirector:continuation.continueDirectorFailed") : "")),
    };
  }

  return {
    tone: "success",
    message: options?.mode === "skip_quality_repair"
      ? (t ? t("autoDirector:continuation.skippedQualityRepair", { scope: scopeLabel }) : "")
      : options?.mode === "auto_execute_range"
        ? (t ? t("autoDirector:continuation.continuedRange", { scope: scopeLabel }) : "")
        : (t ? t("autoDirector:continuation.directorContinued") : ""),
  };
}
