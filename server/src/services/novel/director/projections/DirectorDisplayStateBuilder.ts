import type {
  DirectorChapterExecutionProgressSummary,
  DirectorDisplayMode,
  DirectorDisplayStageKey,
  DirectorDisplayState,
  DirectorDisplayStep,
  DirectorRuntimeProjection,
  DirectorTaskFactSummary,
} from "@ai-novel/shared/types/directorRuntime";
import { DEFAULT_LOCALE } from "@ai-novel/shared/localization";
import { getI18nServerHandle } from "../../../../i18n";
import { getCurrentRequestLocale } from "../../../../runtime/requestLocaleContext";
import {
  getWorkflowCheckpointLabel,
  resolveWorkflowDisplayStage,
  WORKFLOW_DISPLAY_STAGES,
} from "@ai-novel/shared/types/directorWorkflowStepCatalog";
import type { WorkflowStepProgress } from "../workflowStepRuntime/WorkflowStepModule";

type FactStepStateLike = {
  module: {
    id: string;
    label: string;
  };
  facts: {
    nextAction?: string | null;
  };
  progress: WorkflowStepProgress;
} | null;

type SnapshotTaskLike = {
  status: string;
  currentStage?: string | null;
  currentItemKey?: string | null;
  currentItemLabel?: string | null;
  progress?: number | null;
  checkpointType?: string | null;
  checkpointSummary?: string | null;
  lastError?: string | null;
  pendingManualRecovery?: boolean | null;
};

const DISPLAY_STAGES: Array<{ key: DirectorDisplayStageKey; label: string }> = WORKFLOW_DISPLAY_STAGES.map((stage) => ({
  key: stage.key,
  label: stage.label,
}));

function clampPercent(value: number | null | undefined): number {
  if (!Number.isFinite(value ?? NaN)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

function buildCheckpointLabel(task: SnapshotTaskLike): string {
  return getWorkflowCheckpointLabel({
    checkpointType: task.checkpointType,
    status: task.status,
    fallback: task.checkpointSummary,
  });
}

function hasLiveRuntimeProgress(task: SnapshotTaskLike, projection: DirectorRuntimeProjection | null): boolean {
  return Boolean(
    task.status === "running"
    && (
      projection?.status === "running"
      || task.currentItemLabel?.trim()
      || task.currentItemKey?.trim()
      || task.currentStage?.trim()
      || projection?.currentLabel?.trim()
      || typeof projection?.progressBreakdown?.activeJobProgress === "number"
      || typeof projection?.progressBreakdown?.totalPercent === "number"
    ),
  );
}

function buildMode(input: {
  task: SnapshotTaskLike;
  projection: DirectorRuntimeProjection | null;
  factSummary?: DirectorTaskFactSummary | null;
  showPendingManualRecovery: boolean;
  isLiveRunning: boolean;
}): DirectorDisplayMode {
  if (input.showPendingManualRecovery) {
    return "needs_recovery";
  }
  if (
    input.projection?.status === "failed"
    || input.task.status === "failed"
    || input.task.status === "cancelled"
  ) {
    return "failed";
  }
  if (
    input.task.status === "waiting_approval"
    || (!input.isLiveRunning && (
      input.projection?.status === "waiting_approval"
      || input.projection?.status === "blocked"
      || input.projection?.requiresUserAction
    ))
  ) {
    return "waiting";
  }
  if (
    input.projection?.status === "running"
    || input.task.status === "running"
    || input.task.status === "queued"
  ) {
    return "running";
  }
  if (input.factSummary) {
    return input.factSummary.allStepsCompleted ? "completed" : "idle";
  }
  if (input.task.checkpointType === "workflow_completed") {
    return "completed";
  }
  return "idle";
}

function buildDescription(mode: DirectorDisplayMode): string {
  const handle = getI18nServerHandle();
  const locale = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
  function td(key: string): string {
    if (handle) {
      const result = handle.t("serverLogs", key, { lng: locale });
      if (result && result !== `serverLogs:${key}`) return result;
    }
    return key;
  }
  switch (mode) {
    case "needs_recovery": return td("dashboardStatus.descRecovering");
    case "waiting": return td("dashboardStatus.descWaiting");
    case "failed": return td("dashboardStatus.descFailed");
    case "completed": return td("dashboardStatus.descCompleted");
    case "running": return td("dashboardStatus.descRunning");
    default: return td("dashboardStatus.descIdle");
  }
}

function buildHeadline(mode: DirectorDisplayMode): string {
  const handle = getI18nServerHandle();
  const locale = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
  function th(key: string): string {
    if (handle) {
      const result = handle.t("serverLogs", key, { lng: locale });
      if (result && result !== `serverLogs:${key}`) return result;
    }
    return key;
  }
  switch (mode) {
    case "needs_recovery": return th("dashboardStatus.headlineWaitingRecovery");
    case "waiting": return th("dashboardStatus.headlineWaitingConfirm");
    case "failed": return th("dashboardStatus.headlineFailed");
    case "completed": return th("dashboardStatus.headlineCompleted");
    case "running": return th("dashboardStatus.headlineRunning");
    default: return th("dashboardStatus.statusIdle");
  }
}

function buildCurrentAction(input: {
  mode: DirectorDisplayMode;
  projection: DirectorRuntimeProjection | null;
  factStep: FactStepStateLike;
  task: SnapshotTaskLike;
  isLiveRunning: boolean;
}): string {
  if (input.mode === "needs_recovery") {
    return (
      input.task.lastError?.trim()
      || input.projection?.blockingReason?.trim()
      || input.projection?.lastEventSummary?.trim()
      || (() => {
        const handle = getI18nServerHandle();
        const locale = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
        if (handle) {
          const result = handle.t("serverLogs", "dashboardStatus.detailRecovery", { lng: locale });
          if (result && result !== "serverLogs:dashboardStatus.detailRecovery") return result;
        }
        return "dashboardStatus.detailRecovery";
      })()
    );
  }
  if (
    input.isLiveRunning
    && input.task.status === "running"
    && (
      input.projection?.status === "waiting_approval"
      || input.projection?.status === "blocked"
      || input.projection?.requiresUserAction
    )
  ) {
    return (
      input.factStep?.progress.label?.trim()
      || input.task.currentItemLabel?.trim()
      || input.projection?.currentAction?.trim()
      || input.projection?.currentLabel?.trim()
      || input.projection?.lastEventSummary?.trim()
      || (() => {
        const handle = getI18nServerHandle();
        const locale = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
        if (handle) {
          const result = handle.t("serverLogs", "dashboardStatus.fallbackPrimary", { lng: locale });
          if (result && result !== "serverLogs:dashboardStatus.fallbackPrimary") return result;
        }
        return "dashboardStatus.fallbackPrimary";
      })()
    );
  }
  return (
    input.projection?.currentLabel?.trim()
    || input.projection?.currentAction?.trim()
    || input.factStep?.progress.label?.trim()
    || input.task.currentItemLabel?.trim()
    || input.projection?.lastEventSummary?.trim()
    || (() => {
      const handle = getI18nServerHandle();
      const locale = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
      if (handle) {
        const result = handle.t("serverLogs", "dashboardStatus.fallbackPrimary", { lng: locale });
        if (result && result !== "serverLogs:dashboardStatus.fallbackPrimary") return result;
      }
      return "dashboardStatus.fallbackPrimary";
    })()
  );
}

function buildNextActionLabel(input: {
  projection: DirectorRuntimeProjection | null;
  factStep: FactStepStateLike;
}): string | null {
  const raw = input.projection?.nextActionLabel?.trim()
    || input.factStep?.progress.nextAction?.trim()
    || input.factStep?.facts.nextAction?.trim()
    || null;
  if (!raw) {
    return null;
  }

  const handle = getI18nServerHandle();
  const locale = getCurrentRequestLocale() ?? DEFAULT_LOCALE;

  function tAction(key: string): string {
    if (handle) {
      const result = handle.t("serverLogs", key, { lng: locale });
      if (result && result !== `serverLogs:${key}`) return result;
    }
    return key;
  }

  switch (raw) {
    case "continue":
      return tAction("nextActionLabels.continue");
    case "continue_chapter_execution":
      return tAction("nextActionLabels.continueChapterExecution");
    case "resume_from_checkpoint":
      return tAction("nextActionLabels.resumeFromCheckpoint");
    case "approve_gate":
      return tAction("nextActionLabels.approveGate");
    case "repair_chapter":
      return tAction("nextActionLabels.repairChapter");
    case "run_quality_review":
      return tAction("nextActionLabels.runQualityReview");
    case "run_chapter_execution":
      return tAction("nextActionLabels.runChapterExecution");
    case "sync_execution_contracts":
      return tAction("nextActionLabels.syncExecutionContracts");
    default:
      return raw;
  }
}

function buildProgressPercent(input: {
  task: SnapshotTaskLike;
  projection: DirectorRuntimeProjection | null;
  chapterProgress: DirectorChapterExecutionProgressSummary | null | undefined;
}): number {
  if (typeof input.projection?.progressBreakdown?.totalPercent === "number") {
    return clampPercent(input.projection.progressBreakdown.totalPercent);
  }
  if (typeof input.task.progress === "number") {
    return clampPercent(input.task.progress);
  }
  if (typeof input.chapterProgress?.ratio === "number") {
    return clampPercent(input.chapterProgress.ratio * 100);
  }
  return 0;
}

function buildSteps(currentStageKey: DirectorDisplayStageKey, mode: DirectorDisplayMode): DirectorDisplayStep[] {
  const handle = getI18nServerHandle();
  const locale = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
  function tStage(key: string): string {
    if (handle) {
      const result = handle.t("serverLogs", `workflowStages.${key}`, { lng: locale });
      if (result && result !== `serverLogs:workflowStages.${key}`) return result;
    }
    return key;
  }
  const currentIndex = DISPLAY_STAGES.findIndex((stage) => stage.key === currentStageKey);
  return DISPLAY_STAGES.map((stage, index) => {
    let status: DirectorDisplayStep["status"] = "pending";
    if (mode === "completed") {
      status = "completed";
    } else if (index < currentIndex) {
      status = "completed";
    } else if (index === currentIndex) {
      status = mode === "waiting" || mode === "needs_recovery" || mode === "failed"
        ? "attention"
        : "running";
    }
    return {
      key: stage.key,
      label: tStage(stage.key),
      status,
      isCurrent: index === currentIndex,
    };
  });
}

export function buildDirectorDisplayState(input: {
  task: SnapshotTaskLike;
  projection: DirectorRuntimeProjection | null;
  factSummary?: DirectorTaskFactSummary | null;
  activeStepNodeKey?: string | null;
  currentFactStepId?: string | null;
  currentFactStepLabel?: string | null;
  factStep: FactStepStateLike;
  chapterProgress?: DirectorChapterExecutionProgressSummary | null;
}): DirectorDisplayState {
  const isLiveRunning = hasLiveRuntimeProgress(input.task, input.projection);
  const needsRecovery = Boolean(input.task.pendingManualRecovery) && !isLiveRunning;
  const stageKey = resolveWorkflowDisplayStage({
    factStepId: input.currentFactStepId ?? input.projection?.currentFactStepId ?? null,
    currentNodeKey: input.projection?.currentNodeKey ?? null,
    activeNodeKey: input.activeStepNodeKey ?? null,
    taskCurrentItemKey: input.task.currentItemKey ?? null,
    checkpointType: input.task.checkpointType ?? null,
    taskStatus: input.task.status ?? null,
    currentStage: input.task.currentStage ?? null,
  });
  const stage = DISPLAY_STAGES.find((item) => item.key === stageKey) ?? DISPLAY_STAGES[0];
  const mode = buildMode({
    task: input.task,
    projection: input.projection,
    factSummary: input.factSummary ?? null,
    showPendingManualRecovery: needsRecovery,
    isLiveRunning,
  });
  const stepIndex = Math.max(0, DISPLAY_STAGES.findIndex((item) => item.key === stage.key));
  const handle = getI18nServerHandle();
  const locale = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
  const stageLabel = handle
    ? (() => {
      const result = handle.t("serverLogs", `workflowStages.${stage.key}`, { lng: locale });
      return (result && result !== `serverLogs:workflowStages.${stage.key}`) ? result : stage.label;
    })()
    : stage.label;
  return {
    stageKey: stage.key,
    stageLabel,
    stepIndex,
    totalSteps: DISPLAY_STAGES.length,
    mode,
    headline: buildHeadline(mode),
    description: buildDescription(mode),
    currentAction: buildCurrentAction({
      mode,
      projection: input.projection,
      factStep: input.factStep,
      task: input.task,
      isLiveRunning,
    }),
    checkpointLabel: buildCheckpointLabel(input.task),
    progressPercent: buildProgressPercent({
      task: input.task,
      projection: input.projection,
      chapterProgress: input.chapterProgress ?? null,
    }),
    nextActionLabel: buildNextActionLabel({
      projection: input.projection,
      factStep: input.factStep,
    }),
    currentFactStepId: input.currentFactStepId ?? input.projection?.currentFactStepId ?? null,
    currentFactStepLabel: input.currentFactStepLabel ?? input.projection?.currentFactStepLabel ?? null,
    currentFactDescription: input.factStep?.progress.label ?? input.projection?.currentLabel ?? null,
    requiresUserAction: Boolean(
      !isLiveRunning
      && (
        input.projection?.requiresUserAction
        || input.projection?.status === "blocked"
        || input.projection?.status === "waiting_approval"
      ),
    ),
    isLiveRunning,
    needsRecovery,
    steps: buildSteps(stage.key, mode),
  };
}
