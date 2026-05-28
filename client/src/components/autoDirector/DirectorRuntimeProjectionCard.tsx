import type {
  DirectorPolicyMode,
  DirectorRuntimeProjection,
  DirectorRuntimeProjectionStatus,
} from "@ai-novel/shared/types/directorRuntime";
import { getDirectorNodeDisplayLabel } from "@ai-novel/shared/types/directorRuntime";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DirectorRuntimeProjectionCardProps {
  projection: DirectorRuntimeProjection | null | undefined;
  className?: string;
  compact?: boolean;
}

function formatDate(t: TFunction, value: string | null | undefined): string {
  if (!value) {
    return t("autoDirector:runtimeProjection.labels.noTime");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t("autoDirector:runtimeProjection.labels.noTime");
  }
  return date.toLocaleString();
}

function formatTokenCount(value: number | null | undefined): string {
  const count = Math.max(0, Math.round(Number(value ?? 0)));
  return count.toLocaleString();
}

function formatDuration(t: TFunction, value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  const seconds = Math.round(value / 1000);
  if (seconds <= 0) {
    return t("autoDirector:runtimeProjection.labels.lessThanOneSecond");
  }
  if (seconds < 60) {
    return t("autoDirector:cockpit.labels.secondsFormat", { seconds });
  }
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return restSeconds > 0
    ? t("autoDirector:cockpit.labels.minutesSecondsFormat", { minutes, seconds: restSeconds })
    : t("autoDirector:cockpit.labels.minutesOnlyFormat", { minutes });
}

function formatUsageLine(t: TFunction, usage: {
  llmCallCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs?: number | null;
}): string {
  const duration = formatDuration(t, usage.durationMs);
  return [
    t("autoDirector:cockpit.usage.callCount", { value: formatTokenCount(usage.llmCallCount) }),
    t("autoDirector:cockpit.usage.promptTokens", { value: formatTokenCount(usage.promptTokens) }),
    t("autoDirector:cockpit.usage.completionTokens", { value: formatTokenCount(usage.completionTokens) }),
    t("autoDirector:cockpit.usage.totalTokens", { value: formatTokenCount(usage.totalTokens) }),
    duration ? t("autoDirector:cockpit.usage.duration", { duration }) : null,
  ].filter(Boolean).join(" · ");
}

function formatPolicyMode(t: TFunction, mode: DirectorPolicyMode): string {
  if (mode === "suggest_only") {
    return t("autoDirector:runtimeProjection.policyModes.suggestOnly");
  }
  if (mode === "run_next_step") {
    return t("autoDirector:runtimeProjection.policyModes.runNextStep");
  }
  if (mode === "auto_safe_scope") {
    return t("autoDirector:runtimeProjection.policyModes.autoSafeScope");
  }
  return t("autoDirector:runtimeProjection.policyModes.runToCheckpoint");
}

function formatStatus(t: TFunction, status: DirectorRuntimeProjectionStatus): string {
  const keyMap: Record<DirectorRuntimeProjectionStatus, string> = {
    idle: "pending",
    running: "running",
    waiting_approval: "waitingApproval",
    blocked: "blocked",
    failed: "failed",
    completed: "completed",
  };
  return t(`autoDirector:runtimeProjection.statuses.${keyMap[status]}`);
}

function statusClassName(status: DirectorRuntimeProjectionStatus): string {
  if (status === "running") {
    return "border-sky-300 bg-sky-50 text-sky-900";
  }
  if (status === "waiting_approval") {
    return "border-amber-300 bg-amber-50 text-amber-900";
  }
  if (status === "blocked" || status === "failed") {
    return "border-destructive/30 bg-destructive/5 text-destructive";
  }
  if (status === "completed") {
    return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }
  return "border-border bg-muted/30 text-muted-foreground";
}

function statusIcon(status: DirectorRuntimeProjectionStatus) {
  if (status === "running") {
    return <Activity className="h-4 w-4" />;
  }
  if (status === "waiting_approval") {
    return <PauseCircle className="h-4 w-4" />;
  }
  if (status === "blocked") {
    return <AlertTriangle className="h-4 w-4" />;
  }
  if (status === "failed") {
    return <XCircle className="h-4 w-4" />;
  }
  if (status === "completed") {
    return <CheckCircle2 className="h-4 w-4" />;
  }
  return <ShieldCheck className="h-4 w-4" />;
}

function riskBadgeClassName(level: NonNullable<DirectorRuntimeProjection["visibleRiskBadges"]>[number]["level"]) {
  if (level === "danger") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (level === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function formatQualityDebtSummary(t: TFunction, summary: DirectorRuntimeProjection["qualityDebtSummary"] | null | undefined): string | null {
  if (!summary || summary.deferredChapterCount <= 0) {
    return null;
  }
  if (summary.deferredChapterOrders.length > 0) {
    return t("autoDirector:runtimeProjection.qualityDebt.summaryWithChapters", {
      chapters: summary.deferredChapterOrders.join("、"),
    });
  }
  return t("autoDirector:runtimeProjection.qualityDebt.summaryWithoutChapters");
}

function formatQualityBudgetSummary(t: TFunction, summary: DirectorRuntimeProjection["qualityBudgetSummary"] | null | undefined): string | null {
  if (!summary) {
    return null;
  }
  const chapter = typeof summary.currentChapterOrder === "number"
    ? t("autoDirector:runtimeProjection.qualityBudget.chapterFormat", { order: summary.currentChapterOrder })
    : t("autoDirector:runtimeProjection.qualityBudget.currentChapter");
  return t("autoDirector:runtimeProjection.qualityBudget.summary", {
    chapter,
    patch: summary.patchRepairUsed,
    rewrite: summary.chapterRewriteUsed,
    replan: summary.windowReplanUsed,
    action: summary.nextActionLabel,
  });
}

function formatRootCauseSummary(t: TFunction, projection: DirectorRuntimeProjection): string | null {
  if (!projection.rootCauseCode || projection.rootCauseCode === "none") {
    return null;
  }
  if (projection.rootCauseCode === "replan_required") {
    return t("autoDirector:runtimeProjection.rootCause.replanRequired");
  }
  if (projection.rootCauseCode === "draft_obligation_unmet") {
    return t("autoDirector:runtimeProjection.rootCause.draftObligationUnmet");
  }
  if (projection.rootCauseCode === "draft_repair_exhausted") {
    return t("autoDirector:runtimeProjection.rootCause.draftRepairExhausted");
  }
  return t("autoDirector:runtimeProjection.rootCause.draftMissing");
}

function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0%";
  }
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export default function DirectorRuntimeProjectionCard({
  projection,
  className,
  compact = false,
}: DirectorRuntimeProjectionCardProps) {
  const { t } = useTranslation();
  if (!projection) {
    return null;
  }
  const primaryText = projection.headline?.trim()
    || projection.currentLabel?.trim()
    || projection.lastEventSummary?.trim()
    || t("autoDirector:runtimeProjection.fallbackPrimary");
  const detailText = projection.detail?.trim();
  const attentionText = projection.requiresUserAction
    ? projection.blockingReason?.trim()
      || projection.blockedReason?.trim()
      || projection.lastEventSummary?.trim()
      || t("autoDirector:runtimeProjection.needsUserActionDefault")
    : projection.blockingReason?.trim() || projection.blockedReason?.trim();
  const progressLine = projection.progressBreakdown?.explanation?.trim()
    || projection.progressSummary?.trim()
    || null;
  const qualityDebtLine = formatQualityDebtSummary(t, projection.qualityDebtSummary);
  const qualityBudgetLine = formatQualityBudgetSummary(t, projection.qualityBudgetSummary);
  const rootCauseLine = formatRootCauseSummary(t, projection);
  const obligationLine = projection.blockingObligations && projection.blockingObligations.length > 0
    ? t("autoDirector:runtimeProjection.labels.obligation", {
      summary: projection.blockingObligations.slice(0, 3).map((item) => item.summary).join("；"),
    })
    : null;
  const activeExecutionLine = projection.activeExecution
    ? (() => {
      const baseLabel = getDirectorNodeDisplayLabel({
        nodeKey: projection.activeExecution.stepType,
        fallback: projection.currentAction || t("autoDirector:runtimeProjection.labels.fallbackTaskName"),
      });
      return projection.activeExecution.resourceClass
        ? t("autoDirector:runtimeProjection.labels.activeExecution", {
          label: t("autoDirector:runtimeProjection.labels.activeExecutionResource", {
            label: baseLabel,
            resource: projection.activeExecution.resourceClass,
          }),
        })
        : t("autoDirector:runtimeProjection.labels.activeExecution", { label: baseLabel });
    })()
    : null;
  const waitingLine = projection.waitingReason
    ? t("autoDirector:runtimeProjection.labels.waitingReason", { reason: projection.waitingReason })
    : null;
  const workerHealthLine = projection.workerHealth
    ? [
      t("autoDirector:runtimeProjection.labels.queueWaiting", { count: projection.workerHealth.queuedCommandCount }),
      projection.workerHealth.runningCommandCount > 0
        ? t("autoDirector:runtimeProjection.labels.queueRunning", { count: projection.workerHealth.runningCommandCount })
        : null,
      projection.workerHealth.currentWorkerId
        ? t("autoDirector:runtimeProjection.labels.currentWorker", { worker: projection.workerHealth.currentWorkerId })
        : null,
    ].filter(Boolean).join(" · ")
    : null;
  const helperLines = [
    activeExecutionLine,
    waitingLine,
    workerHealthLine,
    projection.nextActionLabel
      ? t("autoDirector:runtimeProjection.labels.nextStep", { label: projection.nextActionLabel })
      : null,
    projection.recommendedAction?.reason
      ? t("autoDirector:runtimeProjection.labels.recommendedReason", { reason: projection.recommendedAction.reason })
      : null,
    projection.isAutopilotRecoverable
      ? t("autoDirector:runtimeProjection.labels.autopilotRecoverable")
      : null,
    rootCauseLine,
    obligationLine,
    qualityBudgetLine,
    qualityDebtLine,
    projection.scopeSummary,
    progressLine,
  ].filter((line): line is string => Boolean(line?.trim()));
  const recentEvents = projection.recentEvents.slice(0, compact ? 2 : 4);
  const usageSummary = projection.usageSummary ?? null;
  const stepUsage = projection.stepUsage?.slice(0, compact ? 2 : 4) ?? [];
  const promptUsage = projection.promptUsage?.slice(0, compact ? 2 : 6) ?? [];
  const visibleRiskBadges = projection.visibleRiskBadges?.slice(0, compact ? 3 : 6) ?? [];
  const progressBreakdown = projection.progressBreakdown ?? null;

  return (
    <div className={cn("rounded-lg border bg-background/80 p-3", statusClassName(projection.status), className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 shrink-0">{statusIcon(projection.status)}</span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">{t("autoDirector:runtimeProjection.title")}</div>
            <div className="mt-1 text-sm leading-5">{primaryText}</div>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 bg-background/70">
          {formatStatus(t, projection.status)}
        </Badge>
      </div>

      {visibleRiskBadges.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleRiskBadges.map((badge) => (
            <Badge key={`${badge.source ?? "risk"}:${badge.label}`} variant="outline" className={cn("bg-background/70", riskBadgeClassName(badge.level))}>
              {badge.label}
            </Badge>
          ))}
        </div>
      ) : null}

      {progressBreakdown && !compact ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-md border bg-background/70 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{t("autoDirector:runtimeProjection.progressLabels.planning")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{formatPercent(progressBreakdown.planningProgress ?? progressBreakdown.planningPercent)}</div>
          </div>
          <div className="rounded-md border bg-background/70 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{t("autoDirector:runtimeProjection.progressLabels.chapters")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{progressBreakdown.continuableChapters}/{progressBreakdown.totalChapters}</div>
          </div>
          <div className="rounded-md border bg-background/70 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{t("autoDirector:runtimeProjection.progressLabels.quality")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{formatPercent(progressBreakdown.qualityProgress ?? progressBreakdown.qualityRepairPercent)}</div>
          </div>
          <div className="rounded-md border bg-background/70 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{t("autoDirector:runtimeProjection.progressLabels.currentAction")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{formatPercent(progressBreakdown.activeJobProgress)}</div>
          </div>
        </div>
      ) : null}

      {attentionText ? (
        <div className="mt-3 rounded-md border bg-background/70 px-3 py-2 text-sm leading-5">
          {projection.requiresUserAction
            ? t("autoDirector:runtimeProjection.needsUserAction")
            : t("autoDirector:runtimeProjection.pausedReason")}{attentionText}
        </div>
      ) : null}

      {detailText && detailText !== attentionText ? (
        <div className="mt-3 rounded-md border bg-background/70 px-3 py-2 text-sm leading-5">
          {detailText}
        </div>
      ) : null}

      {helperLines.length > 0 && !compact ? (
        <div className="mt-3 space-y-2">
          {helperLines.map((line) => (
            <div key={line} className="rounded-md border bg-background/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
              {line}
            </div>
          ))}
        </div>
      ) : null}

      {usageSummary ? (
        <div className="mt-3 rounded-md border bg-background/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
          <div className="font-medium text-foreground">{t("autoDirector:cockpit.usage.title")}</div>
          <div className="mt-1">{formatUsageLine(t, usageSummary)}</div>
          {promptUsage.length > 0 && !compact ? (
            <div className="mt-2 space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">{t("autoDirector:cockpit.usage.stageTitle")}</div>
              {promptUsage.map((item) => (
                <div key={`${item.promptAssetKey}:${item.promptVersion ?? ""}:${item.nodeKey ?? ""}`} className="flex flex-wrap items-center justify-between gap-2 border-t pt-1">
                  <span className="min-w-0 truncate text-foreground">
                    {getDirectorNodeDisplayLabel({ label: item.label ?? item.promptAssetKey, nodeKey: item.nodeKey })}
                  </span>
                  <span className="shrink-0">{formatUsageLine(t, item)}</span>
                </div>
              ))}
            </div>
          ) : null}
          {stepUsage.length > 0 && !compact ? (
            <div className="mt-2 space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">{t("autoDirector:cockpit.usage.stepTitle")}</div>
              {stepUsage.map((item) => (
                <div key={item.stepIdempotencyKey} className="flex flex-wrap items-center justify-between gap-2 border-t pt-1">
                  <span className="min-w-0 truncate text-foreground">
                    {getDirectorNodeDisplayLabel({ label: item.label, nodeKey: item.nodeKey })}
                  </span>
                  <span className="shrink-0">{formatUsageLine(t, item)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-background/70 px-2 py-1">{t("autoDirector:runtimeProjection.labels.policyMode", { mode: formatPolicyMode(t, projection.policyMode) })}</span>
        <span className="rounded-full bg-background/70 px-2 py-1">{t("autoDirector:runtimeProjection.labels.updatedAt", { time: formatDate(t, projection.updatedAt) })}</span>
      </div>

      {recentEvents.length > 0 && !compact ? (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">{t("autoDirector:runtimeProjection.labels.recentEvents")}</div>
          {recentEvents.map((event) => (
            <div key={event.eventId} className="rounded-md border bg-background/70 px-3 py-2 text-xs leading-5">
              <div className="text-foreground">{event.summary}</div>
              <div className="mt-1 text-muted-foreground">{formatDate(t, event.occurredAt)}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
