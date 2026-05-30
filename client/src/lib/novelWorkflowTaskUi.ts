import type { TFunction } from "i18next";
import type { NovelAutoDirectorTaskSummary } from "@ai-novel/shared/types/novel";
import type { NovelWorkflowCheckpoint } from "@ai-novel/shared/types/novelWorkflow";
import type { TaskStatus } from "@ai-novel/shared/types/task";

export type WorkflowBadgeVariant = "default" | "outline" | "secondary" | "destructive";

type WorkflowTaskLike = {
  id: string;
  status: TaskStatus;
  checkpointType?: NovelWorkflowCheckpoint | null;
  executionScopeLabel?: string | null;
  pendingManualRecovery?: boolean | null;
};

export const LIVE_TASK_STATUSES = new Set<TaskStatus>(["queued", "running", "waiting_approval"]);
export const BACKGROUND_RUNNING_TASK_STATUSES = new Set<TaskStatus>(["running"]);

// i18n-ignore: t() fallback strings — used only when t is not provided (non-React contexts)
function getExecutionScopeLabel(scopeLabel?: string | null, t?: TFunction): string {
  return scopeLabel?.trim() || (t ? t("autoDirector:taskUi.defaultScopeLabel") : "第 1-10 章");
}

function buildAutoExecutionRunningLabel(scopeLabel?: string | null, t?: TFunction): string {
  const scope = getExecutionScopeLabel(scopeLabel, t);
  return t ? t("autoDirector:taskUi.autoExecutionRunning", { scope }) : `${scope}自动执行中`;
}

function buildAutoExecutionPausedLabel(scopeLabel?: string | null, t?: TFunction): string {
  const scope = getExecutionScopeLabel(scopeLabel, t);
  return t ? t("autoDirector:taskUi.autoExecutionPaused", { scope }) : `${scope}自动执行已暂停`;
}

function buildAutoExecutionCancelledLabel(scopeLabel?: string | null, t?: TFunction): string {
  const scope = getExecutionScopeLabel(scopeLabel, t);
  return t ? t("autoDirector:taskUi.autoExecutionCancelled", { scope }) : `${scope}自动执行已取消`;
}

export function formatWorkflowCheckpoint(checkpoint?: NovelWorkflowCheckpoint | null, scopeLabel?: string | null, t?: TFunction): string {
  // i18n-ignore: t() fallback strings — used only when t is not provided
  if (checkpoint === "candidate_selection_required") {
    return t ? t("autoDirector:taskUi.checkpoints.candidateSelection") : "等待确认书级方向";
  }
  if (checkpoint === "book_contract_ready") {
    return t ? t("autoDirector:taskUi.checkpoints.bookContractReady") : "Book Contract 已就绪";
  }
  if (checkpoint === "character_setup_required") {
    return t ? t("autoDirector:taskUi.checkpoints.characterSetup") : "角色准备待审核";
  }
  if (checkpoint === "volume_strategy_ready") {
    return t ? t("autoDirector:taskUi.checkpoints.volumeStrategy") : "卷战略待审核";
  }
  if (checkpoint === "chapter_batch_ready") {
    return buildAutoExecutionPausedLabel(scopeLabel, t);
  }
  if (checkpoint === "replan_required") {
    return t ? t("autoDirector:taskUi.checkpoints.replanRequired") : "等待重规划";
  }
  if (checkpoint === "workflow_completed") {
    return t ? t("autoDirector:taskUi.checkpoints.workflowCompleted") : "自动导演已完成";
  }
  return t ? t("autoDirector:taskUi.checkpoints.autoDirector") : "自动导演";
}

export function getWorkflowBadge(task?: NovelAutoDirectorTaskSummary | null, t?: TFunction): {
  label: string;
  variant: WorkflowBadgeVariant;
} | null {
  // i18n-ignore: t() fallback strings — used only when t is not provided
  if (!task) {
    return null;
  }
  const displayStatus = task.displayStatus?.trim() || null;
  if (
    (task.status === "queued" || task.status === "running")
    && task.checkpointType === "chapter_batch_ready"
  ) {
    return {
      label: displayStatus ?? buildAutoExecutionRunningLabel(task.executionScopeLabel, t),
      variant: "default",
    };
  }
  if ((task.status === "failed" || task.status === "cancelled") && task.checkpointType === "chapter_batch_ready") {
    return {
      label: displayStatus ?? (task.status === "failed"
        ? buildAutoExecutionPausedLabel(task.executionScopeLabel, t)
        : buildAutoExecutionCancelledLabel(task.executionScopeLabel, t)),
      variant: task.status === "failed" ? "destructive" : "outline",
    };
  }
  if (task.status === "waiting_approval") {
    return {
      label: displayStatus ?? formatWorkflowCheckpoint(task.checkpointType, task.executionScopeLabel, t),
      variant: "secondary",
    };
  }
  if (task.status === "running") {
    return {
      label: displayStatus ?? (t ? t("autoDirector:taskUi.status.running") : "自动导演进行中"),
      variant: "default",
    };
  }
  if (task.status === "queued") {
    return {
      label: displayStatus ?? (t ? t("autoDirector:taskUi.status.queued") : "自动导演排队中"),
      variant: "secondary",
    };
  }
  if (task.status === "failed") {
    return {
      label: displayStatus ?? (t ? t("autoDirector:taskUi.status.failed") : "自动导演失败"),
      variant: "destructive",
    };
  }
  if (task.status === "cancelled") {
    return {
      label: displayStatus ?? (t ? t("autoDirector:taskUi.status.cancelled") : "自动导演已取消"),
      variant: "outline",
    };
  }
  return {
    label: displayStatus ?? (task.checkpointType === "workflow_completed"
      ? (t ? t("autoDirector:taskUi.checkpoints.workflowCompleted") : "自动导演已完成")
      : formatWorkflowCheckpoint(task.checkpointType, task.executionScopeLabel, t)),
    variant: "outline",
  };
}

export function getWorkflowDescription(task?: NovelAutoDirectorTaskSummary | null, t?: TFunction): string | null {
  // i18n-ignore: t() fallback strings — used only when t is not provided
  if (!task) {
    return null;
  }
  if (
    (task.status === "queued" || task.status === "running")
    && task.checkpointType === "chapter_batch_ready"
  ) {
    const scope = getExecutionScopeLabel(task.executionScopeLabel, t);
    const percent = Math.round(task.progress * 100);
    return t
      ? t("autoDirector:taskUi.description.autoExecutionProgress", { scope, percent })
      : `AI 正在后台继续执行${scope}，当前进度 ${percent}%。`;
  }
  if ((task.status === "failed" || task.status === "cancelled") && task.checkpointType === "chapter_batch_ready") {
    const scope = getExecutionScopeLabel(task.executionScopeLabel, t);
    return t
      ? t("autoDirector:taskUi.description.autoExecutionPausedBatch", { scope })
      : `${scope}自动执行在批量阶段暂停了，建议先查看任务，再决定是否继续自动执行。`;
  }
  if (task.blockingReason?.trim()) {
    return task.blockingReason.trim();
  }
  if (task.checkpointSummary?.trim()) {
    return task.checkpointSummary.trim();
  }
  if (task.currentItemLabel?.trim()) {
    return task.currentItemLabel.trim();
  }
  if (task.resumeAction?.trim()) {
    return t
      ? t("autoDirector:taskUi.description.recommendContinue", { action: task.resumeAction.trim() })
      : `推荐继续：${task.resumeAction.trim()}`;
  }
  if (task.nextActionLabel?.trim()) {
    return t
      ? t("autoDirector:taskUi.description.nextStep", { label: task.nextActionLabel.trim() })
      : `下一步：${task.nextActionLabel.trim()}`;
  }
  return null;
}

export function canContinueDirector(task?: NovelAutoDirectorTaskSummary | null): boolean {
  return Boolean(
    task
      && task.status === "waiting_approval"
      && task.checkpointType !== "candidate_selection_required"
      && task.checkpointType !== "chapter_batch_ready",
  );
}

export function canCancelDirectorTask(
  task?: Pick<WorkflowTaskLike, "status" | "pendingManualRecovery"> | null,
): boolean {
  if (!task) {
    return false;
  }
  if (task.pendingManualRecovery) {
    return true;
  }
  return task.status === "queued"
    || task.status === "running"
    || task.status === "waiting_approval"
    || task.status === "failed";
}

export function requiresCandidateSelection(task?: Pick<WorkflowTaskLike, "status" | "checkpointType"> | null): boolean {
  return Boolean(task && task.status === "waiting_approval" && task.checkpointType === "candidate_selection_required");
}

export function canContinueChapterBatchAutoExecution(task?: NovelAutoDirectorTaskSummary | null): boolean {
  if (!task) {
    return false;
  }
  return (task.status === "failed" || task.status === "cancelled") && task.checkpointType === "chapter_batch_ready";
}

export function canEnterChapterExecution(task?: NovelAutoDirectorTaskSummary | null): boolean {
  return Boolean(
    task
      && (task.checkpointType === "chapter_batch_ready"
        || task.checkpointType === "workflow_completed"),
  );
}

export function isLiveWorkflowTask(task?: NovelAutoDirectorTaskSummary | null): boolean {
  return Boolean(task && LIVE_TASK_STATUSES.has(task.status));
}

export function isWorkflowRunningInBackground(task?: NovelAutoDirectorTaskSummary | null): boolean {
  return Boolean(task && BACKGROUND_RUNNING_TASK_STATUSES.has(task.status));
}

export function isWorkflowActionRequired(task?: NovelAutoDirectorTaskSummary | null): boolean {
  return Boolean(
    task
      && (task.status === "waiting_approval"
        || task.status === "failed"
        || task.status === "cancelled"),
  );
}

export function getTaskCenterLink(taskId: string): string {
  return `/tasks?kind=novel_workflow&id=${taskId}`;
}

export function getCandidateSelectionLink(taskId: string): string {
  const searchParams = new URLSearchParams();
  searchParams.set("workflowTaskId", taskId);
  searchParams.set("mode", "director");
  return `/novels/create?${searchParams.toString()}`;
}
