import type { TFunction } from "i18next";
import type { DirectorCommandAcceptedResponse } from "@ai-novel/shared/types/directorRuntime";
import type { DirectorContinuationMode } from "@ai-novel/shared/types/novelDirector";
import type { UnifiedTaskDetail } from "@ai-novel/shared/types/task";

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
  const t = options?.t;
  const requestedScopeLabel = options?.scopeLabel?.trim();
  const taskScopeLabel = task && "executionScopeLabel" in task ? task.executionScopeLabel?.trim() : undefined;
  const scopeLabel = requestedScopeLabel || taskScopeLabel || (t ? t("novel:workspace.header.currentStep", { label: "" }).trim() || t("autoDirector:continuation.currentRange") : "当前章节范围");

  if (task && "kind" in task && task.status === "failed") {
    return {
      tone: "error",
      message: task.failureSummary?.trim()
        || task.blockingReason?.trim()
        || task.lastError?.trim()
        || (options?.mode === "auto_execute_range"
          ? (t ? t("autoDirector:continuation.continueRangeFailed", { scope: scopeLabel }) : `继续自动执行${scopeLabel}失败。`)
          : (t ? t("autoDirector:continuation.continueDirectorFailed") : "继续自动导演失败。")),
    };
  }

  return {
    tone: "success",
    message: options?.mode === "skip_quality_repair"
      ? (t ? t("autoDirector:continuation.skippedQualityRepair", { scope: scopeLabel }) : `已跳过本次质量建议，自动导演会继续执行${scopeLabel}。`)
      : options?.mode === "auto_execute_range"
        ? (t ? t("autoDirector:continuation.continuedRange", { scope: scopeLabel }) : `已继续自动执行${scopeLabel}。`)
        : (t ? t("autoDirector:continuation.directorContinued") : "自动导演已继续推进。"),
  };
}
