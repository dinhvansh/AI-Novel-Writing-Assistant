import type { DirectorDashboardView } from "@ai-novel/shared/types/directorRuntime";
import { useTranslation } from "react-i18next";
import type { UnifiedTaskDetail } from "@ai-novel/shared/types/task";
import { Badge } from "@/components/ui/badge";
import {
  formatCheckpoint,
  formatDate,
  formatKind,
  formatResumeTarget,
  formatStatus,
  formatTokenCount,
  toStatusVariant,
} from "../taskCenterUtils";

interface TaskCenterDetailSummaryProps {
  task: UnifiedTaskDetail;
  isAutoDirectorTask: boolean;
  currentModelLabel: string;
  dashboardView?: DirectorDashboardView | null;
}

export default function TaskCenterDetailSummary({
  task,
  isAutoDirectorTask,
  currentModelLabel,
  dashboardView,
}: TaskCenterDetailSummaryProps) {
  const { t } = useTranslation();
  const progressPercent = typeof dashboardView?.progressPercent === "number"
    ? dashboardView.progressPercent
    : Math.round(task.progress * 100);
  const currentStage = dashboardView?.stageLabel ?? task.currentStage ?? t("tasks:detail.none");
  const currentItem = dashboardView?.currentAction ?? task.currentItemLabel ?? t("tasks:detail.none");
  return (
    <>
      <div className="space-y-1">
        <div className="font-medium">{task.title}</div>
        <div className="text-xs text-muted-foreground">
          {formatKind(task.kind, t)} | {t("tasks:detail.owner", { owner: task.ownerLabel })}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={toStatusVariant(task.status)}>{formatStatus(task.status, t)}</Badge>
        <Badge variant="outline">{t("tasks:detail.progress", { percent: progressPercent })}</Badge>
      </div>
      <div className="space-y-1 text-muted-foreground">
        <div>{t("tasks:detail.displayStatus", { status: dashboardView?.statusLabel ?? task.displayStatus ?? formatStatus(task.status, t) })}</div>
        <div>{t("tasks:detail.currentStage", { stage: currentStage })}</div>
        <div>{t("tasks:detail.currentItem", { item: currentItem })}</div>
        {task.kind === "novel_workflow" ? (
          <>
            <div>{t("tasks:detail.latestCheckpoint", { checkpoint: formatCheckpoint(task.checkpointType, t, task.executionScopeLabel) })}</div>
            <div>{t("tasks:detail.resumeTarget", { target: formatResumeTarget(task.resumeTarget, t) })}</div>
            <div>{t("tasks:detail.suggestContinue", { action: task.resumeAction ?? task.nextActionLabel ?? t("tasks:detail.defaultContinue") })}</div>
            <div>{t("tasks:detail.lastHealthyStage", { stage: task.lastHealthyStage ?? t("tasks:detail.none") })}</div>
          </>
        ) : null}
        {task.blockingReason ? (
          <div>{t("tasks:detail.blockingReason", { reason: task.blockingReason })}</div>
        ) : null}
        <div>{t("tasks:detail.latestHeartbeat", { date: formatDate(task.heartbeatAt, t) })}</div>
        <div>{t("tasks:detail.startedAt", { date: formatDate(task.startedAt, t) })}</div>
        <div>{t("tasks:detail.finishedAt", { date: formatDate(task.finishedAt, t) })}</div>
        <div>{t("tasks:detail.retryCount", { count: task.retryCountLabel as unknown as number })}</div>
        {(task.provider || task.model) ? (
          <div>{t("tasks:detail.calledModel", { provider: task.provider ?? t("tasks:detail.none"), model: task.model ?? t("tasks:detail.none") })}</div>
        ) : null}
        {isAutoDirectorTask ? (
          <div>{t("tasks:detail.currentModel", { model: currentModelLabel })}</div>
        ) : null}
        {(task.tokenUsage || task.provider || task.model) ? (
          <>
            <div>{t("tasks:detail.llmCallCount", { count: formatTokenCount(task.tokenUsage?.llmCallCount ?? 0) as unknown as number })}</div>
            <div>{t("tasks:detail.promptTokens", { count: formatTokenCount(task.tokenUsage?.promptTokens ?? 0) as unknown as number })}</div>
            <div>{t("tasks:detail.completionTokens", { count: formatTokenCount(task.tokenUsage?.completionTokens ?? 0) as unknown as number })}</div>
            <div>{t("tasks:detail.totalTokens", { count: formatTokenCount(task.tokenUsage?.totalTokens ?? 0) as unknown as number })}</div>
            <div>{t("tasks:detail.lastRecorded", { date: formatDate(task.tokenUsage?.lastRecordedAt, t) })}</div>
          </>
        ) : null}
      </div>
    </>
  );
}
