import type {
  DirectorBookAutomationAction,
  DirectorBookAutomationDisplayState,
  DirectorBookAutomationProjection,
} from "@ai-novel/shared/types/directorRuntime";
import { getDirectorNodeDisplayLabel } from "@ai-novel/shared/types/directorRuntime";
import { translateDirectorLabel } from "@/lib/directorRuntimeI18n";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  History,
  PauseCircle,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AICockpitProps {
  projection?: DirectorBookAutomationProjection | null;
  mode?: "focusedNovel" | "compact";
  fallbackSummary?: string | null;
  fallbackStatusLabel?: string | null;
  isActionPending?: boolean;
  showDetailsAction?: boolean;
  onAction?: (projection: DirectorBookAutomationProjection, action: DirectorBookAutomationAction) => void;
  onOpenDetails?: (projection: DirectorBookAutomationProjection) => void;
  onOpenNovel?: (projection: DirectorBookAutomationProjection) => void;
  onOpenFallbackDetails?: () => void;
}

function displayStateLabel(t: TFunction, state: DirectorBookAutomationDisplayState): string {
  const keyMap: Record<DirectorBookAutomationDisplayState, string> = {
    processing: "processing",
    needs_confirmation: "needsConfirmation",
    paused: "paused",
    needs_attention: "needsAttention",
    completed: "completed",
    idle: "idle",
  };
  return t(`autoDirector:cockpit.states.${keyMap[state]}`);
}

function stateBadgeVariant(state: DirectorBookAutomationDisplayState): "default" | "secondary" | "outline" | "destructive" {
  if (state === "needs_attention") {
    return "destructive";
  }
  if (state === "processing") {
    return "default";
  }
  if (state === "needs_confirmation" || state === "paused") {
    return "outline";
  }
  return "secondary";
}

function stateClassName(state: DirectorBookAutomationDisplayState): string {
  if (state === "processing") {
    return "border-sky-200 bg-sky-50/70";
  }
  if (state === "needs_confirmation") {
    return "border-amber-200 bg-amber-50/70";
  }
  if (state === "paused") {
    return "border-indigo-200 bg-indigo-50/60";
  }
  if (state === "needs_attention") {
    return "border-destructive/30 bg-destructive/5";
  }
  if (state === "completed") {
    return "border-emerald-200 bg-emerald-50/60";
  }
  return "border-border/70 bg-muted/20";
}

function stateIcon(state: DirectorBookAutomationDisplayState) {
  if (state === "processing") {
    return <Activity className="h-4 w-4" />;
  }
  if (state === "needs_confirmation") {
    return <PauseCircle className="h-4 w-4" />;
  }
  if (state === "paused") {
    return <Clock3 className="h-4 w-4" />;
  }
  if (state === "needs_attention") {
    return <AlertTriangle className="h-4 w-4" />;
  }
  if (state === "completed") {
    return <CheckCircle2 className="h-4 w-4" />;
  }
  return <ShieldCheck className="h-4 w-4" />;
}

function formatDate(t: TFunction, value: string | null | undefined): string {
  if (!value) {
    return t("autoDirector:cockpit.labels.noTime");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t("autoDirector:cockpit.labels.noTime");
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
    return t("autoDirector:cockpit.labels.lessThanOneSecond");
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

function fallbackProjectionReason(t: TFunction, props: Pick<AICockpitProps, "fallbackSummary">): string {
  return props.fallbackSummary?.trim() || t("autoDirector:cockpit.fallback.noTask");
}

function renderActionLabel(
  t: TFunction,
  action: DirectorBookAutomationAction,
  displayState?: DirectorBookAutomationDisplayState,
): string {
  if (
    displayState === "needs_confirmation"
    && (action.type === "continue" || action.type === "auto_execute_range")
  ) {
    return t("autoDirector:cockpit.labels.confirmContinue");
  }
  return action.label || t("autoDirector:cockpit.labels.continueDefault");
}

function artifactTypeLabel(t: TFunction, type: string): string {
  const keyMap: Record<string, string> = {
    book_contract: "bookContract",
    story_macro: "storyMacro",
    character_cast: "characterCast",
    volume_strategy: "volumeStrategy",
    chapter_task_sheet: "chapterTaskSheet",
    chapter_draft: "chapterDraft",
    audit_report: "auditReport",
    repair_ticket: "repairTicket",
    reader_promise: "readerPromise",
    character_governance_state: "characterGovernanceState",
    world_skeleton: "worldSkeleton",
    source_knowledge_pack: "sourceKnowledgePack",
    chapter_retention_contract: "chapterRetentionContract",
    continuity_state: "continuityState",
    rolling_window_review: "rollingWindowReview",
  };
  const suffix = keyMap[type];
  return suffix ? t(`autoDirector:cockpit.artifacts.types.${suffix}`) : type;
}

function recoveryActionLabel(
  t: TFunction,
  action: NonNullable<DirectorBookAutomationProjection["circuitBreaker"]>["recoveryAction"],
): string | null {
  const keyMap: Record<string, string> = {
    retry: "retry",
    resume_after_review: "resumeAfterReview",
    switch_model: "switchModel",
    confirm_protected_content: "confirmProtectedContent",
    manual_repair: "manualRepair",
  };
  if (!action) return null;
  const suffix = keyMap[action];
  return suffix ? t(`autoDirector:cockpit.circuitBreaker.recoveryActions.${suffix}`) : null;
}

function workerStateLabel(
  t: TFunction,
  state: NonNullable<DirectorBookAutomationProjection["workerHealth"]>["derivedState"],
): string {
  const keyMap: Record<NonNullable<DirectorBookAutomationProjection["workerHealth"]>["derivedState"], string> = {
    idle: "idle",
    queued_waiting_worker: "queuedWaitingWorker",
    leased_starting: "leasedStarting",
    running_step: "runningStep",
    waiting_gate: "waitingGate",
    auto_recovering: "autoRecovering",
    cancelled: "cancelled",
    failed_recoverable: "failedRecoverable",
    failed_hard: "failedHard",
    succeeded: "succeeded",
  };
  return t(`autoDirector:cockpit.background.states.${keyMap[state]}`);
}

function workerStateDetail(t: TFunction, health: NonNullable<DirectorBookAutomationProjection["workerHealth"]>): string {
  if (health.message?.trim()) {
    return health.message.trim();
  }
  if (health.queuedCommandCount > 0) {
    return t("autoDirector:cockpit.background.messageQueued");
  }
  if (health.runningCommandCount > 0 || health.leasedCommandCount > 0) {
    return t("autoDirector:cockpit.background.messageRunning");
  }
  if (health.staleCommandCount > 0) {
    return t("autoDirector:cockpit.background.messageStale");
  }
  return t("autoDirector:cockpit.background.messageIdle");
}

export default function AICockpit(props: AICockpitProps) {
  const {
    mode = "focusedNovel",
    fallbackStatusLabel,
    isActionPending = false,
    showDetailsAction = true,
    onAction,
    onOpenDetails,
    onOpenNovel,
    onOpenFallbackDetails,
  } = props;
  const { t } = useTranslation();
  const focusProjection = props.projection ?? null;
  const isCompact = mode === "compact";

  if (!focusProjection) {
    return (
      <div className={cn("rounded-lg border p-3", stateClassName("idle"))}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 shrink-0 text-foreground">{stateIcon("idle")}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">{t("autoDirector:cockpit.title")}</div>
              <div className="mt-1 text-xs leading-5 text-muted-foreground">{fallbackProjectionReason(t, props)}</div>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">{fallbackStatusLabel ?? t("autoDirector:cockpit.states.idle")}</Badge>
        </div>
        {onOpenFallbackDetails ? (
          <Button type="button" size="sm" variant="outline" className="mt-3 w-full" onClick={onOpenFallbackDetails}>
            {t("autoDirector:cockpit.fallback.view")}
          </Button>
        ) : null}
      </div>
    );
  }

  const primaryAction = focusProjection.primaryAction ?? null;
  const detailAction = focusProjection.secondaryActions?.find((item) => item.type === "open_details") ?? null;
  const canOpenDetails = showDetailsAction && Boolean(onOpenDetails || (detailAction && onAction));
  const recentItems = focusProjection.timeline.slice(0, isCompact ? 2 : 3);
  const artifactRows = focusProjection.artifactSummary.byType?.slice(0, 3) ?? [];
  const usageSummary = focusProjection.usageSummary ?? null;
  const stepUsage = focusProjection.stepUsage?.slice(0, 2) ?? [];
  const promptUsage = focusProjection.promptUsage?.slice(0, 6) ?? [];
  const circuitBreaker = focusProjection.circuitBreaker?.status === "open" ? focusProjection.circuitBreaker : null;
  const circuitRecovery = recoveryActionLabel(t, circuitBreaker?.recoveryAction ?? null);
  const workerHealth = focusProjection.workerHealth ?? null;
  const artifactInsightLines = [
    focusProjection.artifactSummary.affectedChapterCount
      ? t("autoDirector:cockpit.artifacts.insights.affectedChapters", { count: focusProjection.artifactSummary.affectedChapterCount })
      : null,
    focusProjection.artifactSummary.recentStaleArtifacts?.length
      ? t("autoDirector:cockpit.artifacts.insights.staleArtifacts", { count: focusProjection.artifactSummary.recentStaleArtifacts.length })
      : null,
    focusProjection.artifactSummary.recentRepairArtifacts?.length
      ? t("autoDirector:cockpit.artifacts.insights.repairArtifacts", { count: focusProjection.artifactSummary.recentRepairArtifacts.length })
      : null,
    focusProjection.artifactSummary.recentVersionedArtifacts?.length
      ? t("autoDirector:cockpit.artifacts.insights.versionedArtifacts", { count: focusProjection.artifactSummary.recentVersionedArtifacts.length })
      : null,
  ].filter((line): line is string => Boolean(line));
  const reason = focusProjection.userReason?.trim()
    || focusProjection.blockedReason?.trim()
    || focusProjection.detail?.trim()
    || focusProjection.automationSummary?.trim()
    || fallbackProjectionReason(t, props);

  const handlePrimaryAction = () => {
    if (primaryAction && onAction) {
      onAction(focusProjection, primaryAction);
      return;
    }
    onOpenNovel?.(focusProjection);
  };

  const handleDetails = () => {
    if (detailAction && onAction) {
      onAction(focusProjection, detailAction);
      return;
    }
    onOpenDetails?.(focusProjection);
  };

  const handleCompactOpen = () => {
    if (onOpenNovel) {
      onOpenNovel(focusProjection);
      return;
    }
    handleDetails();
  };

  if (isCompact) {
    return (
      <div className={cn("rounded-lg border p-3", stateClassName(focusProjection.displayState))}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 shrink-0 text-foreground">{stateIcon(focusProjection.displayState)}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">{t("autoDirector:cockpit.title")}</div>
              <div className="mt-1 line-clamp-1 text-xs leading-5 text-muted-foreground">
              {translateDirectorLabel(focusProjection.userHeadline || focusProjection.headline) || reason}
              </div>
            </div>
          </div>
          <Badge variant={stateBadgeVariant(focusProjection.displayState)} className="shrink-0">
            {displayStateLabel(t, focusProjection.displayState)}
          </Badge>
        </div>
        <Button type="button" size="sm" variant="outline" className="mt-3 w-full" onClick={handleCompactOpen}>
          {t("autoDirector:cockpit.fallback.view")}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border p-3", stateClassName(focusProjection.displayState))}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 shrink-0 text-foreground">{stateIcon(focusProjection.displayState)}</span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">{t("autoDirector:cockpit.title")}</div>
            {!isCompact ? (
              <div className="mt-1 truncate text-xs font-medium text-foreground">{focusProjection.focusNovel.title}</div>
            ) : null}
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {translateDirectorLabel(focusProjection.userHeadline || focusProjection.headline)}
            </div>
          </div>
        </div>
        <Badge variant={stateBadgeVariant(focusProjection.displayState)} className="shrink-0">
          {displayStateLabel(t, focusProjection.displayState)}
        </Badge>
      </div>

      <div className="mt-3 rounded-md border bg-background/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
        {reason}
      </div>

      {!isCompact && focusProjection.progressSummary ? (
        <div className="mt-2 text-xs leading-5 text-muted-foreground">{focusProjection.progressSummary}</div>
      ) : null}

      {!isCompact && workerHealth ? (
        <div className="mt-3 rounded-md border bg-background/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Database className="h-3.5 w-3.5" />
              {t("autoDirector:cockpit.background.title")}
            </div>
            <Badge variant="outline">{workerStateLabel(t, workerHealth.derivedState)}</Badge>
          </div>
          <div className="mt-1">{workerStateDetail(t, workerHealth)}</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            <div className="rounded-md bg-muted/40 px-2 py-1">
              <div className="text-[11px] text-muted-foreground">{t("autoDirector:cockpit.background.queueLabel")}</div>
              <div className="font-medium text-foreground">{workerHealth.queuedCommandCount}</div>
            </div>
            <div className="rounded-md bg-muted/40 px-2 py-1">
              <div className="text-[11px] text-muted-foreground">{t("autoDirector:cockpit.background.leasedLabel")}</div>
              <div className="font-medium text-foreground">{workerHealth.leasedCommandCount}</div>
            </div>
            <div className="rounded-md bg-muted/40 px-2 py-1">
              <div className="text-[11px] text-muted-foreground">{t("autoDirector:cockpit.background.runningLabel")}</div>
              <div className="font-medium text-foreground">{workerHealth.runningCommandCount}</div>
            </div>
            <div className="rounded-md bg-muted/40 px-2 py-1">
              <div className="text-[11px] text-muted-foreground">{t("autoDirector:cockpit.background.staleLabel")}</div>
              <div className="font-medium text-foreground">{workerHealth.staleCommandCount}</div>
            </div>
          </div>
          {workerHealth.oldestQueuedWaitMs ? (
            <div className="mt-2 text-[11px] text-muted-foreground">
              {t("autoDirector:cockpit.background.waitingForWorker", {
                duration: formatDuration(t, workerHealth.oldestQueuedWaitMs) ?? t("autoDirector:cockpit.labels.lessThanOneSecond"),
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {circuitBreaker ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
          <div className="font-medium">{t("autoDirector:cockpit.circuitBreaker.title")}</div>
          <div className="mt-1">{circuitBreaker.message || t("autoDirector:cockpit.circuitBreaker.defaultMessage")}</div>
          {circuitRecovery ? (
            <div className="mt-1">{t("autoDirector:cockpit.circuitBreaker.recoveryHint", { action: circuitRecovery })}</div>
          ) : null}
        </div>
      ) : null}

      {usageSummary ? (
        <div className="mt-3 rounded-md border bg-background/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
          <div className="font-medium text-foreground">{t("autoDirector:cockpit.usage.title")}</div>
          <div className="mt-1">{formatUsageLine(t, usageSummary)}</div>
          {promptUsage.length > 0 ? (
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
          {stepUsage.length > 0 ? (
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

      {artifactRows.length > 0 ? (
        <div className="mt-3 rounded-md border bg-background/70 px-3 py-2">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            {t("autoDirector:cockpit.artifacts.title")}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {artifactRows.map((item) => (
              <Badge key={item.artifactType} variant={item.staleCount > 0 ? "outline" : "secondary"} className="text-[11px]">
                {artifactTypeLabel(t, String(item.artifactType))}
                <span className="ml-1 text-muted-foreground">{item.activeCount}/{item.totalCount}</span>
              </Badge>
            ))}
          </div>
          {artifactInsightLines.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
              {artifactInsightLines.map((line) => (
                <span key={line} className="rounded-full bg-muted/40 px-2 py-0.5">{line}</span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {focusProjection.nextActionLabel ? (
        <div className="mt-2 rounded-md border bg-background/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
          {t("autoDirector:cockpit.nextStepLabel", { label: focusProjection.nextActionLabel })}
        </div>
      ) : null}

      {recentItems.length > 0 ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <History className="h-3.5 w-3.5" />
            {t("autoDirector:cockpit.timeline.title")}
          </div>
          {recentItems.map((item) => (
            <div key={item.id} className="rounded-md border bg-background/70 px-3 py-2 text-xs leading-5">
              <div className="line-clamp-2 text-foreground">{item.title}</div>
              {item.usage ? (
                <div className="mt-1 text-muted-foreground">{formatUsageLine(t, item.usage)}</div>
              ) : item.durationMs ? (
                <div className="mt-1 text-muted-foreground">
                  {t("autoDirector:cockpit.timeline.duration", { duration: formatDuration(t, item.durationMs) })}
                </div>
              ) : null}
              <div className="mt-1 text-muted-foreground">{formatDate(t, item.occurredAt)}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className={cn("mt-3 flex gap-2", isCompact && canOpenDetails && "grid grid-cols-2")}>
        <Button type="button" size="sm" className="flex-1" onClick={handlePrimaryAction} disabled={isActionPending}>
          {isActionPending ? t("autoDirector:cockpit.labels.processing") : renderActionLabel(t, primaryAction ?? {
            type: "open_novel",
            label: t("autoDirector:cockpit.labels.openNovel"),
            target: { novelId: focusProjection.novelId },
          }, focusProjection.displayState)}
        </Button>
        {canOpenDetails ? (
          <Button type="button" size="sm" variant="outline" onClick={handleDetails}>
            <ExternalLink className="h-4 w-4" />
            {t("autoDirector:cockpit.labels.details")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
