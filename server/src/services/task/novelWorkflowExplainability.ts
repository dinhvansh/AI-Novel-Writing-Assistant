import type {
  NovelWorkflowCheckpoint,
  NovelWorkflowStage,
} from "@ai-novel/shared/types/novelWorkflow";
import type { TaskStatus } from "@ai-novel/shared/types/task";
import type { LocaleCode } from "@ai-novel/shared/localization";
import { DEFAULT_LOCALE } from "@ai-novel/shared/localization";
import { isAutoDirectorRecoveryInProgress } from "../novel/workflow/novelWorkflowRecoveryHeuristics";
import { normalizeFailureSummary } from "./taskSupport";
import { NOVEL_WORKFLOW_STAGE_LABELS } from "../novel/workflow/novelWorkflow.shared";
import { getI18nServerHandle } from "../../i18n";
import { getCurrentRequestLocale } from "../../runtime/requestLocaleContext";

function t(key: string, values?: Record<string, unknown>): string {
  const handle = getI18nServerHandle();
  if (!handle) return key;
  const locale: LocaleCode = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
  const result = handle.t("serverLogs", key, { lng: locale, values });
  return (result && result !== `serverLogs:${key}`) ? result : key;
}

interface WorkflowExplainabilityInput {
  status: TaskStatus;
  pendingManualRecovery?: boolean | null;
  currentStage?: string | null;
  currentItemKey?: string | null;
  checkpointType?: NovelWorkflowCheckpoint | null;
  lastError?: string | null;
  executionScopeLabel?: string | null;
}

export interface WorkflowExplainabilitySummary {
  displayStatus: string | null;
  blockingReason: string | null;
  resumeAction: string | null;
  lastHealthyStage: string | null;
}

const WORKFLOW_ITEM_STAGE_MAP: Partial<Record<string, NovelWorkflowStage>> = {
  project_setup: "project_setup",
  auto_director: "auto_director",
  candidate_seed_alignment: "auto_director",
  candidate_project_framing: "auto_director",
  candidate_direction_batch: "auto_director",
  candidate_title_pack: "auto_director",
  novel_create: "project_setup",
  book_contract: "story_macro",
  story_macro: "story_macro",
  constraint_engine: "story_macro",
  character_setup: "character_setup",
  character_cast_apply: "character_setup",
  volume_strategy: "volume_strategy",
  volume_skeleton: "volume_strategy",
  beat_sheet: "structured_outline",
  chapter_list: "structured_outline",
  chapter_sync: "structured_outline",
  chapter_detail_bundle: "structured_outline",
  structured_outline: "structured_outline",
  chapter_execution: "chapter_execution",
  quality_repair: "quality_repair",
};

const CHECKPOINT_DISPLAY_STATUS: Record<NovelWorkflowCheckpoint, string> = {
  // i18n-ignore: lookup map keys — translated at runtime via t()
  candidate_selection_required: "workflowExplainability.checkpointStatus.candidateSelectionRequired",
  book_contract_ready: "workflowExplainability.checkpointStatus.bookContractReady",
  character_setup_required: "workflowExplainability.checkpointStatus.characterSetupRequired",
  volume_strategy_ready: "workflowExplainability.checkpointStatus.volumeStrategyReady",
  chapter_batch_ready: "workflowExplainability.checkpointStatus.chapterBatchReady",
  replan_required: "workflowExplainability.checkpointStatus.replanRequired",
  workflow_completed: "workflowExplainability.checkpointStatus.workflowCompleted",
};

const CHECKPOINT_BLOCKING_REASON: Record<NovelWorkflowCheckpoint, string> = {
  // i18n-ignore: lookup map keys — translated at runtime via t()
  candidate_selection_required: "workflowExplainability.checkpointReason.candidateSelectionRequired",
  book_contract_ready: "workflowExplainability.checkpointReason.bookContractReady",
  character_setup_required: "workflowExplainability.checkpointReason.characterSetupRequired",
  volume_strategy_ready: "workflowExplainability.checkpointReason.volumeStrategyReady",
  chapter_batch_ready: "workflowExplainability.checkpointReason.chapterBatchReady",
  replan_required: "workflowExplainability.checkpointReason.replanRequired",
  workflow_completed: "workflowExplainability.checkpointReason.workflowCompleted",
};

const CHECKPOINT_LAST_HEALTHY_STAGE: Record<NovelWorkflowCheckpoint, NovelWorkflowStage> = {
  candidate_selection_required: "auto_director",
  book_contract_ready: "story_macro",
  character_setup_required: "character_setup",
  volume_strategy_ready: "volume_strategy",
  chapter_batch_ready: "structured_outline",
  replan_required: "quality_repair",
  workflow_completed: "quality_repair",
};

function getExecutionScopeLabel(input: WorkflowExplainabilityInput, fallback?: string): string {
  return input.executionScopeLabel?.trim() || fallback || t("workflowExplainability.defaultScope");
}

function buildAutoExecutionPreparedStatus(input: WorkflowExplainabilityInput): string {
  return t("workflowExplainability.autoExecution.preparedStatus", { scope: getExecutionScopeLabel(input) });
}

function buildAutoExecutionRunningStatus(input: WorkflowExplainabilityInput): string {
  return t("workflowExplainability.autoExecution.runningStatus", { scope: getExecutionScopeLabel(input) });
}

function buildAutoExecutionPausedStatus(input: WorkflowExplainabilityInput): string {
  return t("workflowExplainability.autoExecution.pausedStatus", { scope: getExecutionScopeLabel(input) });
}

function buildAutoExecutionCancelledStatus(input: WorkflowExplainabilityInput): string {
  return t("workflowExplainability.autoExecution.cancelledStatus", { scope: getExecutionScopeLabel(input) });
}

function buildAutoExecutionResumeAction(input: WorkflowExplainabilityInput): string {
  return t("workflowExplainability.autoExecution.resumeAction", { scope: getExecutionScopeLabel(input) });
}

function buildAutoExecutionPreparedReason(input: WorkflowExplainabilityInput): string {
  return t("workflowExplainability.autoExecution.preparedReason", { scope: getExecutionScopeLabel(input) });
}

function buildAutoExecutionPausedReason(input: WorkflowExplainabilityInput): string {
  return t("workflowExplainability.autoExecution.pausedReason", { scope: getExecutionScopeLabel(input) });
}

function isPreparedChapterBatchCheckpoint(input: WorkflowExplainabilityInput): boolean {
  return input.checkpointType === "chapter_batch_ready" && input.status === "waiting_approval";
}

function isPausedChapterBatchCheckpoint(input: WorkflowExplainabilityInput): boolean {
  return input.checkpointType === "chapter_batch_ready"
    && (input.status === "failed" || input.status === "cancelled");
}

function getStageLabel(stage: NovelWorkflowStage | null | undefined): string | null {
  return stage ? (NOVEL_WORKFLOW_STAGE_LABELS[stage] ?? stage) : null;
}

function getLastHealthyStage(input: WorkflowExplainabilityInput): string | null {
  if (isPreparedChapterBatchCheckpoint(input)) {
    return getStageLabel("structured_outline");
  }
  if (isPausedChapterBatchCheckpoint(input)) {
    return getStageLabel("chapter_execution");
  }
  if (input.checkpointType) {
    return getStageLabel(CHECKPOINT_LAST_HEALTHY_STAGE[input.checkpointType]);
  }
  const mappedStage = input.currentItemKey ? WORKFLOW_ITEM_STAGE_MAP[input.currentItemKey] : null;
  if (mappedStage) {
    return getStageLabel(mappedStage);
  }
  return input.currentStage?.trim() || null;
}

function getCurrentStageLabel(input: WorkflowExplainabilityInput): string | null {
  const mappedStage = input.currentItemKey ? WORKFLOW_ITEM_STAGE_MAP[input.currentItemKey] : null;
  if (mappedStage) {
    return getStageLabel(mappedStage);
  }
  if (input.currentStage && input.currentStage in NOVEL_WORKFLOW_STAGE_LABELS) {
    return getStageLabel(input.currentStage as NovelWorkflowStage);
  }
  return input.currentStage?.trim() || null;
}

export function buildWorkflowResumeAction(
  status: TaskStatus,
  checkpointType: NovelWorkflowCheckpoint | null,
  executionScopeLabel?: string | null,
  pendingManualRecovery?: boolean | null,
): string | null {
  const explainabilityInput = {
    status,
    checkpointType,
    executionScopeLabel,
    pendingManualRecovery,
  } satisfies WorkflowExplainabilityInput;
  if (status === "waiting_approval") {
    if (checkpointType === "candidate_selection_required") {
      return t("workflowExplainability.resumeAction.confirmCandidateDirection");
    }
    if (checkpointType === "book_contract_ready") {
      return t("workflowExplainability.resumeAction.viewBookContract");
    }
    if (checkpointType === "character_setup_required") {
      return t("workflowExplainability.resumeAction.reviewCharacterSetup");
    }
    if (checkpointType === "volume_strategy_ready") {
      return t("workflowExplainability.resumeAction.viewVolumeStrategy");
    }
    if (checkpointType === "chapter_batch_ready") {
      return buildAutoExecutionResumeAction(explainabilityInput);
    }
    if (checkpointType === "replan_required") {
      return t("workflowExplainability.resumeAction.handleReplan");
    }
    if (checkpointType === "workflow_completed") {
      return t("workflowExplainability.resumeAction.enterChapterExecution");
    }
    return t("workflowExplainability.resumeAction.continueMainFlow");
  }
  if (explainabilityInput.pendingManualRecovery) {
    return t("workflowExplainability.resumeAction.resumeFromCheckpoint");
  }
  if (status === "failed" || status === "cancelled") {
    if (checkpointType === "chapter_batch_ready") {
      return buildAutoExecutionResumeAction(explainabilityInput);
    }
    if (checkpointType === "workflow_completed") {
      return t("workflowExplainability.resumeAction.enterChapterExecution");
    }
    return t("workflowExplainability.resumeAction.resumeFromCheckpoint");
  }
  if (status === "running" || status === "queued") {
    return t("workflowExplainability.resumeAction.viewCurrentProgress");
  }
  if (status === "succeeded" && checkpointType === "workflow_completed") {
    return t("workflowExplainability.resumeAction.enterChapterExecution");
  }
  return null;
}

function buildDisplayStatus(input: WorkflowExplainabilityInput): string | null {
  if (input.pendingManualRecovery) {
    return t("workflowExplainability.displayStatus.waitingManualRecovery");
  }
  if (isAutoDirectorRecoveryInProgress(input)) {
    const currentStageLabel = getCurrentStageLabel(input);
    return currentStageLabel
      ? t("workflowExplainability.displayStatus.stageRecovering", { stage: currentStageLabel })
      : t("workflowExplainability.displayStatus.directorRecovering");
  }
  if (
    (input.status === "queued" || input.status === "running")
    && input.checkpointType === "chapter_batch_ready"
  ) {
    return buildAutoExecutionRunningStatus(input);
  }
  if (input.status === "waiting_approval") {
    if (input.checkpointType === "chapter_batch_ready") {
      return buildAutoExecutionPreparedStatus(input);
    }
    return input.checkpointType
      ? t(CHECKPOINT_DISPLAY_STATUS[input.checkpointType])
      : t("workflowExplainability.displayStatus.waitingMainFlow");
  }
  if (input.status === "running") {
    const currentStageLabel = getCurrentStageLabel(input);
    return currentStageLabel
      ? t("workflowExplainability.displayStatus.stageRunning", { stage: currentStageLabel })
      : t("workflowExplainability.displayStatus.directorRunning");
  }
  if (input.status === "queued") {
    return t("workflowExplainability.displayStatus.directorQueued");
  }
  if (input.status === "failed") {
    if (input.checkpointType === "chapter_batch_ready") {
      return buildAutoExecutionPausedStatus(input);
    }
    return t("workflowExplainability.displayStatus.directorFailed");
  }
  if (input.status === "cancelled") {
    if (input.checkpointType === "chapter_batch_ready") {
      return buildAutoExecutionCancelledStatus(input);
    }
    return t("workflowExplainability.displayStatus.directorCancelled");
  }
  if (input.checkpointType === "workflow_completed") {
    return t("workflowExplainability.displayStatus.directorCompleted");
  }
  return input.status === "succeeded" ? t("workflowExplainability.displayStatus.mainFlowCompleted") : null;
}

function buildBlockingReason(input: WorkflowExplainabilityInput): string | null {
  if (input.pendingManualRecovery) {
    return input.lastError?.trim() || t("workflowExplainability.blockingReason.pendingManualRecovery");
  }
  if (isAutoDirectorRecoveryInProgress(input)) {
    return input.lastError?.trim() || t("workflowExplainability.blockingReason.recoveryInProgress");
  }
  if (input.status === "running" || input.status === "succeeded") {
    return null;
  }
  if (input.status === "queued") {
    return t("workflowExplainability.blockingReason.queued");
  }
  if (input.status === "waiting_approval") {
    if (input.checkpointType === "chapter_batch_ready") {
      return buildAutoExecutionPreparedReason(input);
    }
    return input.checkpointType
      ? t(CHECKPOINT_BLOCKING_REASON[input.checkpointType])
      : t("workflowExplainability.blockingReason.waitingCheckpoint");
  }
  if (input.status === "failed") {
    if (input.checkpointType === "chapter_batch_ready") {
      return t("workflowExplainability.blockingReason.chapterBatchFailed", { scope: getExecutionScopeLabel(input) });
    }
    return normalizeFailureSummary(input.lastError, t("workflowExplainability.blockingReason.failedDefault"));
  }
  if (input.status === "cancelled") {
    if (input.checkpointType === "chapter_batch_ready") {
      return t("workflowExplainability.blockingReason.chapterBatchCancelled", { scope: getExecutionScopeLabel(input) });
    }
    return t("workflowExplainability.blockingReason.cancelled");
  }
  return null;
}

export function buildWorkflowExplainability(input: WorkflowExplainabilityInput): WorkflowExplainabilitySummary {
  return {
    displayStatus: buildDisplayStatus(input),
    blockingReason: buildBlockingReason(input),
    resumeAction: buildWorkflowResumeAction(
      input.status,
      input.checkpointType ?? null,
      input.executionScopeLabel,
      input.pendingManualRecovery,
    ),
    lastHealthyStage: getLastHealthyStage(input),
  };
}
