import type {
  DirectorBookAutomationAction,
  DirectorBookAutomationDisplayState,
  DirectorBookAutomationFocusNovel,
  DirectorBookAutomationProjection,
  DirectorBookAutomationStatus,
  DirectorRuntimeProjection,
  DirectorStepRun,
} from "@ai-novel/shared/types/directorRuntime";
import type { LocaleCode } from "@ai-novel/shared/localization";
import { DEFAULT_LOCALE } from "@ai-novel/shared/localization";
import { getI18nServerHandle } from "../../../../i18n";
import { getCurrentRequestLocale } from "../../../../runtime/requestLocaleContext";

function t(key: string, values?: Record<string, unknown>): string {
  const handle = getI18nServerHandle();
  if (!handle) return key;
  const locale: LocaleCode = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
  const result = handle.t("serverLogs", key, { lng: locale, values });
  return (result && result !== `serverLogs:${key}`) ? result : key;
}

export function parseJsonOrNull<T>(value: string | null | undefined): T | null {
  if (!value?.trim()) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function toIso(value: Date | string | null | undefined): string {
  if (!value) {
    return new Date(0).toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

export function timestampOf(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function commandLabel(commandType: string): string {
  // i18n-ignore: lookup map keys
  const keyMap: Record<string, string> = {
    confirm_candidate: "dashboardStatus.cmdConfirmCandidate",
    continue: "dashboardStatus.cmdContinue",
    resume_from_checkpoint: "dashboardStatus.cmdResumeCheckpoint",
    retry: "dashboardStatus.cmdRetry",
    takeover: "dashboardStatus.cmdTakeover",
    repair_chapter_titles: "dashboardStatus.cmdRepairTitles",
    cancel: "dashboardStatus.actionCancel",
  };
  const key = keyMap[commandType];
  return key ? t(key) : commandType;
}

export function commandStatusLabel(status: string): string {
  // i18n-ignore: lookup map keys
  const keyMap: Record<string, string> = {
    queued: "dashboardStatus.cmdStatusQueued",
    leased: "dashboardStatus.cmdStatusLeased",
    running: "dashboardStatus.cmdStatusRunning",
    succeeded: "dashboardStatus.cmdStatusSucceeded",
    failed: "dashboardStatus.cmdStatusFailed",
    cancelled: "dashboardStatus.cmdStatusCancelled",
    stale: "dashboardStatus.cmdStatusStale",
  };
  const key = keyMap[status];
  return key ? t(key) : status;
}

export function workflowStatusToBookStatus(status: string | null | undefined): DirectorBookAutomationStatus {
  if (status === "queued") {
    return "queued";
  }
  if (status === "running") {
    return "running";
  }
  if (status === "waiting_approval") {
    return "waiting_approval";
  }
  if (status === "failed") {
    return "failed";
  }
  if (status === "cancelled") {
    return "cancelled";
  }
  if (status === "succeeded") {
    return "completed";
  }
  return "idle";
}

export function extractRunMode(seedPayloadJson: string | null | undefined): string | null {
  const seedPayload = parseJsonOrNull<Record<string, unknown>>(seedPayloadJson);
  if (!seedPayload) {
    return null;
  }
  const direct = seedPayload.runMode;
  if (typeof direct === "string") {
    return direct;
  }
  const directorInput = seedPayload.directorInput;
  if (directorInput && typeof directorInput === "object") {
    const value = (directorInput as { runMode?: unknown }).runMode;
    if (typeof value === "string") {
      return value;
    }
  }
  const directorSession = seedPayload.directorSession;
  if (directorSession && typeof directorSession === "object") {
    const value = (directorSession as { runMode?: unknown }).runMode;
    if (typeof value === "string") {
      return value;
    }
  }
  return null;
}

export function extractCircuitBreaker(
  seedPayloadJson: string | null | undefined,
): DirectorBookAutomationProjection["circuitBreaker"] {
  const seedPayload = parseJsonOrNull<Record<string, unknown>>(seedPayloadJson);
  const autoExecution = seedPayload?.autoExecution;
  if (!autoExecution || typeof autoExecution !== "object") {
    return null;
  }
  const circuitBreaker = (autoExecution as { circuitBreaker?: unknown }).circuitBreaker;
  if (!circuitBreaker || typeof circuitBreaker !== "object") {
    return null;
  }
  const status = (circuitBreaker as { status?: unknown }).status;
  if (status !== "open" && status !== "closed") {
    return null;
  }
  return circuitBreaker as DirectorBookAutomationProjection["circuitBreaker"];
}

export function buildWhereByNovelOrTask(novelId: string, taskIds: string[]) {
  const uniqueTaskIds = Array.from(new Set(taskIds.filter(Boolean)));
  if (uniqueTaskIds.length === 0) {
    return { novelId };
  }
  return {
    OR: [
      { novelId },
      { taskId: { in: uniqueTaskIds } },
    ],
  };
}

export function buildHeadline(input: {
  status: DirectorBookAutomationStatus;
  runtimeProjection: DirectorRuntimeProjection | null;
  task: {
    currentItemLabel?: string | null;
    checkpointSummary?: string | null;
    lastError?: string | null;
  } | null;
}): string {
  if (input.status === "waiting_recovery") {
    return t("dashboardStatus.headlineWaitingRecovery");
  }
  if (input.status === "cancelled") {
    return t("dashboardStatus.headlineCancelled");
  }
  if (input.runtimeProjection?.headline?.trim()) {
    return input.runtimeProjection.headline.trim();
  }
  if (input.status === "queued") {
    return t("dashboardStatus.headlineQueuedAlt");
  }
  if (input.status === "running") {
    const label = input.task?.currentItemLabel?.trim();
    return label ? t("dashboardStatus.headlineRunningBook") : t("dashboardStatus.headlineRunningBook");
  }
  if (input.status === "waiting_approval") {
    return t("dashboardStatus.headlineWaitingConfirm");
  }
  if (input.status === "blocked") {
    return t("dashboardStatus.headlineBlocked");
  }
  if (input.status === "failed") {
    return t("dashboardStatus.headlineFailedAlt");
  }
  if (input.status === "completed") {
    return t("dashboardStatus.headlineCompletedAlt");
  }
  return t("dashboardStatus.headlineNoRecord");
}

function getTaskFailureReason(task: {
  lastError?: string | null;
  checkpointSummary?: string | null;
} | null | undefined): string | null {
  return task?.lastError?.trim() || task?.checkpointSummary?.trim() || null;
}

export function buildDetail(input: {
  status: DirectorBookAutomationStatus;
  runtimeProjection: DirectorRuntimeProjection | null;
  task: {
    checkpointSummary?: string | null;
    lastError?: string | null;
    currentItemLabel?: string | null;
  } | null;
}): string | null {
  if (input.status === "waiting_recovery") {
    return input.task?.lastError?.trim() || t("dashboardStatus.detailRecovery");
  }
  if (input.status === "cancelled") {
    return t("dashboardStatus.detailCancelled");
  }
  if (input.status === "failed") {
    return getTaskFailureReason(input.task)
      || input.runtimeProjection?.blockedReason?.trim()
      || input.runtimeProjection?.detail?.trim()
      || t("dashboardStatus.detailFailed");
  }
  if (input.runtimeProjection?.detail?.trim()) {
    return input.runtimeProjection.detail.trim();
  }
  if (input.task?.checkpointSummary?.trim()) {
    return input.task.checkpointSummary.trim();
  }
  if (input.status === "idle") {
    return t("dashboardStatus.detailIdle");
  }
  return input.task?.currentItemLabel?.trim() ?? null;
}

export function buildAutomationSummary(input: {
  activeCommandCount: number;
  pendingCommandCount: number;
  artifactSummary: DirectorBookAutomationProjection["artifactSummary"];
  autoApprovalRecordCount: number;
  usageSummary?: DirectorBookAutomationProjection["usageSummary"];
}): string {
  const parts: string[] = [];
  if (input.activeCommandCount > 0) {
    parts.push(t("automationSummary.activeCommands", { count: input.activeCommandCount }));
  }
  if (input.pendingCommandCount > 0) {
    parts.push(t("automationSummary.pendingCommands", { count: input.pendingCommandCount }));
  }
  if (input.autoApprovalRecordCount > 0) {
    parts.push(t("automationSummary.autoApprovals", { count: input.autoApprovalRecordCount }));
  }
  if (input.artifactSummary.activeCount > 0) {
    parts.push(t("automationSummary.activeArtifacts", { count: input.artifactSummary.activeCount }));
  }
  if (input.artifactSummary.staleCount > 0) {
    parts.push(t("automationSummary.staleArtifacts", { count: input.artifactSummary.staleCount }));
  }
  if (input.artifactSummary.repairTicketCount > 0) {
    parts.push(t("automationSummary.repairTickets", { count: input.artifactSummary.repairTicketCount }));
  }
  if (input.artifactSummary.protectedUserContentCount > 0) {
    parts.push(t("automationSummary.protectedContent", { count: input.artifactSummary.protectedUserContentCount }));
  }
  if (input.usageSummary && input.usageSummary.llmCallCount > 0) {
    parts.push(t("automationSummary.llmCalls", { count: input.usageSummary.llmCallCount }));
  }
  if (input.usageSummary && input.usageSummary.totalTokens > 0) {
    parts.push(t("automationSummary.totalTokens", { count: input.usageSummary.totalTokens }));
  }
  if ((input.artifactSummary.dependencyCount ?? 0) > 0) {
    parts.push(t("automationSummary.dependencies", { count: input.artifactSummary.dependencyCount }));
  }
  return parts.length > 0 ? parts.join(t("automationSummary.separator")) : t("dashboardStatus.noAutomation");
}

function buildNovelHref(
  novelId: string,
  options?: {
    tab?: DirectorBookAutomationAction["target"]["tab"];
    taskId?: string | null;
    taskPanel?: boolean;
  },
): string {
  const params = new URLSearchParams();
  if (options?.tab) {
    params.set("stage", options.tab);
  }
  if (options?.taskId) {
    params.set("directorTaskId", options.taskId);
  }
  if (options?.taskPanel) {
    params.set("taskPanel", "1");
  }
  const query = params.toString();
  return `/novels/${novelId}/edit${query ? `?${query}` : ""}`;
}

function buildCandidateSelectionHref(taskId: string): string {
  const params = new URLSearchParams();
  params.set("workflowTaskId", taskId);
  params.set("mode", "director");
  return `/novels/create?${params.toString()}`;
}

export function buildFocusNovel(input: { id: string; title?: string | null }): DirectorBookAutomationFocusNovel {
  const title = input.title?.trim() || t("dashboardStatus.unnamedNovel");
  return {
    id: input.id,
    title,
    href: buildNovelHref(input.id),
  };
}

export function buildDisplayState(status: DirectorBookAutomationStatus): DirectorBookAutomationDisplayState {
  if (status === "queued" || status === "running") {
    return "processing";
  }
  if (status === "waiting_approval") {
    return "needs_confirmation";
  }
  if (status === "waiting_recovery" || status === "blocked" || status === "cancelled") {
    return "paused";
  }
  if (status === "failed") {
    return "needs_attention";
  }
  if (status === "completed") {
    return "completed";
  }
  return "idle";
}

export function buildUserHeadline(input: {
  status: DirectorBookAutomationStatus;
  task?: {
    currentItemLabel?: string | null;
    checkpointType?: string | null;
  } | null;
}): string {
  if (input.status === "queued") {
    return t("dashboardStatus.userHeadlineQueued");
  }
  if (input.status === "running") {
    return t("dashboardStatus.userHeadlineQueued"); // same key — AI is working
  }
  if (input.status === "waiting_approval") {
    return t("dashboardStatus.userHeadlineWaiting");
  }
  if (input.status === "waiting_recovery" || input.status === "blocked") {
    return t("dashboardStatus.userHeadlineBlocked");
  }
  if (input.status === "failed") {
    return t("dashboardStatus.userHeadlineFailed");
  }
  if (input.status === "cancelled") {
    return t("dashboardStatus.userHeadlineCancelled");
  }
  if (input.status === "completed") {
    return t("dashboardStatus.userHeadlineCompleted");
  }
  return t("dashboardStatus.userHeadlineNoRecord");
}

export function buildUserReason(input: {
  status: DirectorBookAutomationStatus;
  runtimeProjection: DirectorRuntimeProjection | null;
  task: {
    checkpointType?: string | null;
    checkpointSummary?: string | null;
    lastError?: string | null;
    currentItemLabel?: string | null;
  } | null;
  blockedReason?: string | null;
  detail?: string | null;
}): string | null {
  const directReason = input.status === "failed"
    ? (
      getTaskFailureReason(input.task)
      || input.blockedReason?.trim()
      || input.detail?.trim()
      || input.runtimeProjection?.blockedReason?.trim()
      || input.runtimeProjection?.detail?.trim()
    )
    : (
      input.blockedReason?.trim()
      || input.detail?.trim()
      || input.runtimeProjection?.blockedReason?.trim()
      || input.runtimeProjection?.detail?.trim()
      || input.task?.checkpointSummary?.trim()
      || input.task?.lastError?.trim()
    );
  if (directReason) {
    return directReason;
  }
  if (input.status === "queued") {
    return t("dashboardStatus.userReasonQueued");
  }
  if (input.status === "running") {
    return input.task?.currentItemLabel?.trim() || t("dashboardStatus.userReasonRunning");
  }
  if (input.status === "waiting_approval") {
    return t("dashboardStatus.userReasonWaiting");
  }
  if (input.status === "waiting_recovery") {
    return t("dashboardStatus.userReasonRecovery");
  }
  if (input.status === "blocked") {
    return t("dashboardStatus.userReasonBlocked");
  }
  if (input.status === "failed") {
    return t("dashboardStatus.userReasonFailed");
  }
  if (input.status === "completed") {
    return t("dashboardStatus.userReasonCompleted");
  }
  return t("dashboardStatus.userReasonIdle");
}

function action(input: DirectorBookAutomationAction): DirectorBookAutomationAction {
  return input;
}

export function buildPrimaryAction(input: {
  novelId: string;
  status: DirectorBookAutomationStatus;
  task: {
    id: string;
    checkpointType?: string | null;
  } | null;
}): DirectorBookAutomationAction | null {
  const taskId = input.task?.id ?? null;
  if (!taskId) {
    return action({
      type: "open_novel",
      label: t("dashboardStatus.actionOpenNovel"),
      target: { novelId: input.novelId, href: buildNovelHref(input.novelId) },
      emphasis: "primary",
    });
  }

  if (input.status === "waiting_approval") {
    if (input.task?.checkpointType === "candidate_selection_required") {
      return action({
        type: "confirm_candidate",
        label: t("dashboardStatus.actionConfirmDirection"),
        target: { novelId: input.novelId, taskId, href: buildCandidateSelectionHref(taskId) },
        emphasis: "primary",
      });
    }
    if (input.task?.checkpointType === "chapter_batch_ready") {
      return action({
        type: "auto_execute_range",
        label: t("dashboardStatus.actionContinueChapters"),
        target: {
          novelId: input.novelId,
          taskId,
          tab: "chapter",
          href: buildNovelHref(input.novelId, { tab: "chapter", taskId }),
        },
        commandPayload: { taskId, continuationMode: "auto_execute_range" },
        emphasis: "primary",
      });
    }
    if (input.task?.checkpointType === "replan_required") {
      return action({
        type: "open_quality_repair",
        label: t("dashboardStatus.actionOpenQualityRepair"),
        target: {
          novelId: input.novelId,
          taskId,
          tab: "pipeline",
          href: buildNovelHref(input.novelId, { tab: "pipeline", taskId }),
        },
        emphasis: "primary",
      });
    }
    return action({
      type: "continue",
      label: t("dashboardStatus.actionConfirmContinue"),
      target: { novelId: input.novelId, taskId, href: buildNovelHref(input.novelId, { taskId }) },
      commandPayload: { taskId, continuationMode: "resume" },
      emphasis: "primary",
    });
  }

  if (input.status === "waiting_recovery") {
    return action({
      type: "continue",
      label: t("dashboardStatus.actionResumeCheckpoint"),
      target: { novelId: input.novelId, taskId, href: buildNovelHref(input.novelId, { taskId }) },
      commandPayload: { taskId, continuationMode: "resume" },
      emphasis: "primary",
    });
  }

  if (input.status === "failed" || input.status === "blocked") {
    return action({
      type: "open_details",
      label: input.status === "failed" ? t("dashboardStatus.actionViewFailure") : t("dashboardStatus.actionViewBlocked"),
      target: { novelId: input.novelId, taskId, href: buildNovelHref(input.novelId, { taskId, taskPanel: true }) },
      emphasis: "primary",
    });
  }

  if (input.status === "queued" || input.status === "running") {
    return action({
      type: "open_novel",
      label: t("dashboardStatus.actionViewProgress"),
      target: { novelId: input.novelId, taskId, href: buildNovelHref(input.novelId, { taskId }) },
      emphasis: "primary",
    });
  }

  if (input.status === "completed") {
    return action({
      type: "open_chapter",
      label: t("workflowExplainability.resumeAction.enterChapterExecution"),
      target: {
        novelId: input.novelId,
        taskId,
        tab: "chapter",
        href: buildNovelHref(input.novelId, { tab: "chapter", taskId }),
      },
      emphasis: "primary",
    });
  }

  return action({
    type: "open_novel",
    label: t("dashboardStatus.actionOpenNovel"),
    target: { novelId: input.novelId, taskId, href: buildNovelHref(input.novelId, { taskId }) },
    emphasis: "primary",
  });
}

export function buildSecondaryActions(input: {
  novelId: string;
  status: DirectorBookAutomationStatus;
  taskId?: string | null;
}): DirectorBookAutomationAction[] {
  if (!input.taskId) {
    return [];
  }
  const actions: DirectorBookAutomationAction[] = [
    action({
      type: "open_details",
      label: t("dashboardStatus.actionExecutionDetails"),
      target: {
        novelId: input.novelId,
        taskId: input.taskId,
        href: buildNovelHref(input.novelId, { taskId: input.taskId, taskPanel: true }),
      },
      emphasis: "secondary",
    }),
  ];
  if (input.status === "queued" || input.status === "running" || input.status === "waiting_approval") {
    actions.push(action({
      type: "cancel",
      label: t("dashboardStatus.actionPause"),
      target: { novelId: input.novelId, taskId: input.taskId },
      emphasis: "secondary",
    }));
  }
  if (input.status === "failed" || input.status === "cancelled") {
    actions.push(action({
      type: "retry",
      label: t("dashboardStatus.actionRetry"),
      target: { novelId: input.novelId, taskId: input.taskId },
      emphasis: "secondary",
    }));
  }
  return actions;
}

export function mapStepForUsage(step: {
  idempotencyKey: string;
  nodeKey: string;
  label: string;
  status: string;
  targetType?: string | null;
  targetId?: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  error: string | null;
}): DirectorStepRun {
  return {
    idempotencyKey: step.idempotencyKey,
    nodeKey: step.nodeKey,
    label: step.label,
    status: step.status as DirectorStepRun["status"],
    targetType: step.targetType as DirectorStepRun["targetType"],
    targetId: step.targetId,
    startedAt: step.startedAt.toISOString(),
    finishedAt: step.finishedAt?.toISOString() ?? null,
    error: step.error,
  };
}
