import type { TFunction } from "i18next";
import type { UnifiedTaskDetail } from "@ai-novel/shared/types/task";
import type { DirectorLockScope } from "@ai-novel/shared/types/novelDirector";
import type { NovelEditTakeoverState } from "./components/NovelEditView.types";

export function resolveAutoExecutionScopeLabel(task: UnifiedTaskDetail | null): string {
  const seedPayload = (task?.meta.seedPayload ?? null) as {
    autoExecution?: {
      scopeLabel?: string | null;
      totalChapterCount?: number | null;
    } | null;
  } | null;
  const scopeLabel = seedPayload?.autoExecution?.scopeLabel?.trim();
  if (scopeLabel) {
    return scopeLabel;
  }
  const fallbackCount = Math.max(1, Math.round(seedPayload?.autoExecution?.totalChapterCount ?? 10));
  // i18n-ignore: this is a dynamic scope label derived from task data, not a static UI string
  return `第 1-${fallbackCount} 章`;
}

export function formatTakeoverCheckpoint(
  checkpoint: string | null | undefined,
  task: UnifiedTaskDetail | null,
  t: TFunction,
): string {
  if (checkpoint === "candidate_selection_required") {
    return t("novel:takeover.checkpoint.candidateSelectionRequired");
  }
  if (checkpoint === "book_contract_ready") {
    return t("novel:takeover.checkpoint.bookContractReady");
  }
  if (checkpoint === "character_setup_required") {
    return t("novel:takeover.checkpoint.characterSetupRequired");
  }
  if (checkpoint === "volume_strategy_ready") {
    return t("novel:takeover.checkpoint.volumeStrategyReady");
  }
  if (checkpoint === "chapter_batch_ready") {
    return t("novel:takeover.checkpoint.chapterBatchReady", { scope: resolveAutoExecutionScopeLabel(task) });
  }
  if (checkpoint === "replan_required") {
    return t("novel:takeover.checkpoint.replanRequired");
  }
  if (checkpoint === "workflow_completed") {
    return t("novel:takeover.checkpoint.workflowCompleted");
  }
  return t("novel:takeover.checkpoint.inProgress");
}

export function buildTakeoverTitle(input: {
  mode: NovelEditTakeoverState["mode"];
  novelTitle: string;
  checkpointType: string | null | undefined;
  scopeLabel: string;
  t: TFunction;
}): string {
  const { t } = input;
  if (
    input.mode === "running"
    && input.checkpointType === "chapter_batch_ready"
  ) {
    return t("novel:takeover.title.runningChapterBatch", { title: input.novelTitle, scope: input.scopeLabel });
  }
  if (input.mode === "waiting" || input.mode === "action_required") {
    if (input.checkpointType === "candidate_selection_required") {
      return t("novel:takeover.title.waitingCandidateSelection", { title: input.novelTitle });
    }
    if (input.checkpointType === "character_setup_required") {
      return t("novel:takeover.title.waitingCharacterSetup", { title: input.novelTitle });
    }
    if (input.checkpointType === "volume_strategy_ready") {
      return t("novel:takeover.title.waitingVolumeStrategy", { title: input.novelTitle });
    }
    if (input.checkpointType === "workflow_completed") {
      return t("novel:takeover.title.workflowCompleted", { title: input.novelTitle });
    }
    if (input.checkpointType === "replan_required") {
      return t("novel:takeover.title.replanRequired", { title: input.novelTitle });
    }
  }
  if (input.mode === "failed") {
    if (input.checkpointType === "chapter_batch_ready") {
      return t("novel:takeover.title.failedChapterBatch", { title: input.novelTitle, scope: input.scopeLabel });
    }
    return t("novel:takeover.title.failed", { title: input.novelTitle });
  }
  if (input.mode === "loading") {
    return t("novel:takeover.title.loading", { title: input.novelTitle });
  }
  return t("novel:takeover.title.default", { title: input.novelTitle });
}

export function buildTakeoverDescription(input: {
  mode: NovelEditTakeoverState["mode"];
  checkpointType: string | null | undefined;
  reviewScope: DirectorLockScope | null | undefined;
  scopeLabel: string;
  t: TFunction;
}): string {
  const { t } = input;
  if (
    input.mode === "running"
    && input.checkpointType === "chapter_batch_ready"
  ) {
    return t("novel:takeover.description.runningChapterBatch", { scope: input.scopeLabel });
  }
  if (input.mode === "waiting" || input.mode === "action_required") {
    if (input.checkpointType === "candidate_selection_required") {
      return t("novel:takeover.description.candidateSelectionRequired");
    }
    if (input.checkpointType === "character_setup_required") {
      return t("novel:takeover.description.characterSetupRequired");
    }
    if (input.checkpointType === "volume_strategy_ready") {
      return t("novel:takeover.description.volumeStrategyReady");
    }
    if (input.checkpointType === "workflow_completed") {
      return t("novel:takeover.description.workflowCompleted", { scope: input.scopeLabel });
    }
    if (input.checkpointType === "replan_required") {
      return t("novel:takeover.description.replanRequired");
    }
    if (input.reviewScope) {
      return t("novel:takeover.description.reviewScope");
    }
  }
  if (input.mode === "failed") {
    if (input.checkpointType === "chapter_batch_ready") {
      return t("novel:takeover.description.failedChapterBatch", { scope: input.scopeLabel });
    }
    return t("novel:takeover.description.failed");
  }
  if (input.mode === "loading") {
    return t("novel:takeover.description.loading");
  }
  return t("novel:takeover.description.default");
}

export function buildContinueAutoExecutionActionLabel(scopeLabel: string, isPending: boolean, t: TFunction): string {
  return isPending ? t("novel:takeover.actions.continuePending") : t("novel:takeover.actions.continue", { scope: scopeLabel });
}

export function buildSkipQualityRepairActionLabel(scopeLabel: string, isPending: boolean, t: TFunction): string {
  return isPending ? t("novel:takeover.actions.continuePending") : t("novel:takeover.actions.skipRepair", { scope: scopeLabel });
}

export function buildContinueAutoExecutionToast(scopeLabel: string, t: TFunction): string {
  return t("novel:takeover.actions.continueToast", { scope: scopeLabel });
}
