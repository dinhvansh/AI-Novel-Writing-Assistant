import type {
  AutoDirectorAction,
  AutoDirectorActionCode,
  AutoDirectorFollowUpReason,
  AutoDirectorFollowUpResolverInput,
  AutoDirectorMutationActionCode,
  AutoDirectorResolvedFollowUpReason,
} from "@ai-novel/shared/types/autoDirectorFollowUp";
import type { LocaleCode } from "@ai-novel/shared/localization";
import { DEFAULT_LOCALE } from "@ai-novel/shared/localization";
import { buildWorkflowResumeAction } from "../novelWorkflowExplainability";
import { getI18nServerHandle } from "../../../i18n";
import { getCurrentRequestLocale } from "../../../runtime/requestLocaleContext";

function t(key: string, values?: Record<string, unknown>): string {
  const handle = getI18nServerHandle();
  if (!handle) return key;
  const locale: LocaleCode = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
  const result = handle.t("serverLogs", key, { lng: locale, values });
  return (result && result !== `serverLogs:${key}`) ? result : key;
}

const CHANNEL_ACTION_CODES = new Set<AutoDirectorActionCode>([
  "continue_auto_execution",
  "retry_with_task_model",
  "open_detail",
  "open_follow_up_center",
]);

function getReasonLabel(reason: AutoDirectorFollowUpReason): string {
  // i18n-ignore: lookup map keys
  const keyMap: Record<AutoDirectorFollowUpReason, string> = {
    manual_recovery_required: "followUpReason.manualRecoveryRequired",
    runtime_failed: "followUpReason.runtimeFailed",
    candidate_selection_required: "followUpReason.candidateSelectionRequired",
    replan_required: "followUpReason.replanRequired",
    runtime_cancelled: "followUpReason.runtimeCancelled",
    chapter_batch_execution_pending: "followUpReason.chapterBatchExecutionPending",
    quality_repair_pending: "followUpReason.qualityRepairPending",
    auto_progress_running: "followUpReason.autoProgressRunning",
    auto_approval_completed: "followUpReason.autoApprovalCompleted",
    runtime_replaced: "followUpReason.runtimeReplaced",
    validation_required: "followUpReason.validationRequired",
  };
  return t(keyMap[reason]);
}

function mutationAction(input: {
  code: AutoDirectorMutationActionCode;
  label: string;
  riskLevel: AutoDirectorAction["riskLevel"];
  requiresConfirm: boolean;
}): AutoDirectorAction {
  return {
    code: input.code,
    kind: "mutation",
    label: input.label,
    riskLevel: input.riskLevel,
    requiresConfirm: input.requiresConfirm,
  };
}

function navigationAction(input: {
  code: Extract<AutoDirectorActionCode, "go_replan" | "go_candidate_selection" | "open_detail" | "open_follow_up_center">;
  label: string;
  riskLevel?: AutoDirectorAction["riskLevel"];
  requiresConfirm?: boolean;
}): AutoDirectorAction {
  return {
    code: input.code,
    kind: "navigation",
    label: input.label,
    riskLevel: input.riskLevel ?? "low",
    requiresConfirm: input.requiresConfirm ?? false,
  };
}

function getContinueLabel(input: AutoDirectorFollowUpResolverInput, fallback: string): string {
  return buildWorkflowResumeAction(input.status, input.checkpointType ?? null, input.executionScopeLabel) ?? fallback;
}

function finalizeResolvedReason(input: {
  reason: AutoDirectorFollowUpReason;
  priority: AutoDirectorResolvedFollowUpReason["priority"];
  availableActions: AutoDirectorAction[];
  batchActionCodes?: AutoDirectorMutationActionCode[];
}): AutoDirectorResolvedFollowUpReason {
  const batchActionCodes = input.batchActionCodes ?? [];
  const hasChannelAction = input.availableActions.some((item) => CHANNEL_ACTION_CODES.has(item.code));

  return {
    reason: input.reason,
    reasonLabel: getReasonLabel(input.reason),
    priority: input.priority,
    availableActions: input.availableActions,
    batchActionCodes,
    supportsBatch: batchActionCodes.length > 0,
    channelCapabilities: {
      dingtalk: hasChannelAction,
      wecom: hasChannelAction,
    },
  };
}

export function resolveAutoDirectorFollowUpReason(
  input: AutoDirectorFollowUpResolverInput,
): AutoDirectorResolvedFollowUpReason | null {
  if (input.validationResult && !input.validationResult.allowed) {
    const hasStructuredBackfill = input.validationResult.requiredActions.some((action) => (
      action.code === "auto_backfill_structured_outline"
      && action.safeToAutoFix === true
      && action.riskLevel === "low"
    ));
    const hasSafeFix = input.validationResult.requiredActions.some((action) => (
      action.code !== "auto_backfill_structured_outline"
      && action.safeToAutoFix === true
      && action.riskLevel === "low"
    ));
    return finalizeResolvedReason({
      reason: "validation_required",
      priority: "P0",
      availableActions: [
        navigationAction({
          code: "open_detail",
          label: t("followUpActions.viewValidationResult"),
        }),
        ...(hasStructuredBackfill
          ? [
            mutationAction({
              code: "auto_backfill_structured_outline",
              label: t("followUpActions.aiBackfillStructuredOutline"),
              riskLevel: "low",
              requiresConfirm: false,
            }),
          ]
          : []),
        ...(hasSafeFix
          ? [
            mutationAction({
              code: "safe_fix_validation",
              label: t("followUpActions.safeFix"),
              riskLevel: "low",
              requiresConfirm: true,
            }),
          ]
          : []),
      ],
    });
  }

  if (input.replacementTaskId?.trim() && input.status !== "failed" && input.status !== "waiting_approval" && input.status !== "running" && input.status !== "queued") {
    return finalizeResolvedReason({
      reason: "runtime_replaced",
      priority: "P2",
      availableActions: [
        navigationAction({
          code: "open_detail",
          label: t("followUpActions.viewReplacementDetail"),
        }),
      ],
    });
  }

  if (input.pendingManualRecovery) {
    return finalizeResolvedReason({
      reason: "manual_recovery_required",
      priority: "P0",
      availableActions: [
        mutationAction({
          code: "continue_generic",
          label: t("followUpActions.recoverTask"),
          riskLevel: "low",
          requiresConfirm: false,
        }),
        navigationAction({
          code: "open_detail",
          label: t("followUpActions.viewDetail"),
        }),
      ],
    });
  }

  if (input.status === "queued" || input.status === "running") {
    return finalizeResolvedReason({
      reason: "auto_progress_running",
      priority: "P2",
      availableActions: [
        navigationAction({
          code: "open_detail",
          label: t("followUpActions.viewProgressDetail"),
        }),
      ],
    });
  }

  if (input.status === "failed") {
    return finalizeResolvedReason({
      reason: "runtime_failed",
      priority: "P0",
      availableActions: [
        mutationAction({
          code: "retry_with_task_model",
          label: t("followUpActions.retryWithTaskModel"),
          riskLevel: "low",
          requiresConfirm: false,
        }),
        mutationAction({
          code: "retry_with_route_model",
          label: t("followUpActions.retryWithRouteModel"),
          riskLevel: "medium",
          requiresConfirm: true,
        }),
        navigationAction({
          code: "open_detail",
          label: t("followUpActions.viewDetail"),
        }),
      ],
      batchActionCodes: ["retry_with_task_model"],
    });
  }

  if (input.status === "cancelled") {
    return finalizeResolvedReason({
      reason: "runtime_cancelled",
      priority: "P1",
      availableActions: [
        mutationAction({
          code: "retry_with_task_model",
          label: getContinueLabel(input, t("followUpActions.resumeFromCheckpoint")),
          riskLevel: "low",
          requiresConfirm: false,
        }),
        mutationAction({
          code: "retry_with_route_model",
          label: t("followUpActions.retryWithRouteModel"),
          riskLevel: "medium",
          requiresConfirm: true,
        }),
        navigationAction({
          code: "open_detail",
          label: t("followUpActions.viewDetail"),
        }),
      ],
      batchActionCodes: ["retry_with_task_model"],
    });
  }

  if (input.status !== "waiting_approval") {
    return null;
  }

  if (input.checkpointType === "candidate_selection_required") {
    return finalizeResolvedReason({
      reason: "candidate_selection_required",
      priority: "P1",
      availableActions: [
        navigationAction({
          code: "go_candidate_selection",
          label: getContinueLabel(input, t("followUpActions.confirmCandidateDirection")),
        }),
        navigationAction({
          code: "open_detail",
          label: t("followUpActions.viewDetail"),
        }),
      ],
    });
  }

  if (input.checkpointType === "replan_required") {
    return finalizeResolvedReason({
      reason: "replan_required",
      priority: "P1",
      availableActions: [
        navigationAction({
          code: "go_replan",
          label: getContinueLabel(input, t("followUpActions.handleReplan")),
        }),
        navigationAction({
          code: "open_detail",
          label: t("followUpActions.viewDetail"),
        }),
      ],
    });
  }

  if (input.checkpointType === "chapter_batch_ready" && input.status === "waiting_approval") {
    return finalizeResolvedReason({
      reason: "chapter_batch_execution_pending",
      priority: "P2",
      availableActions: [
        mutationAction({
          code: "continue_auto_execution",
          label: getContinueLabel(input, t("followUpActions.continueAutoExecution")),
          riskLevel: "low",
          requiresConfirm: false,
        }),
        navigationAction({
          code: "open_detail",
          label: t("followUpActions.viewDetail"),
        }),
      ],
      batchActionCodes: ["continue_auto_execution"],
    });
  }

  if (input.checkpointType === "chapter_batch_ready") {
    return finalizeResolvedReason({
      reason: "quality_repair_pending",
      priority: "P2",
      availableActions: [
        mutationAction({
          code: "continue_auto_execution",
          label: getContinueLabel(input, t("followUpActions.continueAutoExecution")),
          riskLevel: "low",
          requiresConfirm: false,
        }),
        navigationAction({
          code: "open_detail",
          label: t("followUpActions.viewDetail"),
        }),
      ],
      batchActionCodes: ["continue_auto_execution"],
    });
  }

  return null;
}
