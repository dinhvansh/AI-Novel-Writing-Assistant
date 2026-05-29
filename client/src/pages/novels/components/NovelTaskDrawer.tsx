import type {
  NovelWorkflowMilestone,
  NovelWorkflowMilestoneType,
} from "@ai-novel/shared/types/novelWorkflow";
import type { DirectorBookAutomationAction } from "@ai-novel/shared/types/directorRuntime";
import type { TaskStatus } from "@ai-novel/shared/types/task";
import type { CharacterResourceProposalSummary } from "@ai-novel/shared/types/characterResource";
import type { AutoDirectorAction } from "@ai-novel/shared/types/autoDirectorFollowUp";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import AICockpit from "@/components/autoDirector/AICockpit";
import LLMSelector from "@/components/common/LLMSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import TaskCenterManualEditImpactCard from "@/pages/tasks/components/TaskCenterManualEditImpactCard";
import TaskCenterRuntimePolicyCard from "@/pages/tasks/components/TaskCenterRuntimePolicyCard";
import type { NovelTaskDrawerState } from "./NovelEditView.types";

type DrawerTask = NonNullable<NovelTaskDrawerState["task"]>;

function formatStatus(status: TaskStatus, t: TFunction): string {
  if (status === "queued") return t("novel:taskDrawer.status.queued");
  if (status === "running") return t("novel:taskDrawer.status.running");
  if (status === "waiting_approval") return t("novel:taskDrawer.status.waitingApproval");
  if (status === "succeeded") return t("novel:taskDrawer.status.succeeded");
  if (status === "failed") return t("novel:taskDrawer.status.failed");
  return t("novel:taskDrawer.status.cancelled");
}

function formatTaskStatus(task: DrawerTask, t: TFunction): string {
  if (task.pendingManualRecovery) return t("novel:taskDrawer.status.pendingRecovery");
  return formatStatus(task.status, t);
}

function toStatusVariant(status: TaskStatus): "default" | "outline" | "secondary" | "destructive" {
  if (status === "running") {
    return "default";
  }
  if (status === "failed") {
    return "destructive";
  }
  if (status === "queued" || status === "waiting_approval") {
    return "secondary";
  }
  return "outline";
}

function toTaskStatusVariant(task: DrawerTask): "default" | "outline" | "secondary" | "destructive" {
  if (task.pendingManualRecovery) {
    return "secondary";
  }
  return toStatusVariant(task.status);
}

function formatCheckpoint(checkpoint: NovelWorkflowMilestoneType | null | undefined, t: TFunction, scopeLabel?: string | null): string {
  const resolvedScopeLabel = scopeLabel?.trim() || t("novel:taskDrawer.checkpoint.defaultScope");
  if (checkpoint === "rewrite_snapshot_created") return t("novel:taskDrawer.checkpoint.rewriteSnapshotCreated");
  if (checkpoint === "candidate_selection_required") return t("novel:taskDrawer.checkpoint.candidateSelectionRequired");
  if (checkpoint === "book_contract_ready") return t("novel:taskDrawer.checkpoint.bookContractReady");
  if (checkpoint === "character_setup_required") return t("novel:taskDrawer.checkpoint.characterSetupRequired");
  if (checkpoint === "volume_strategy_ready") return t("novel:taskDrawer.checkpoint.volumeStrategyReady");
  if (checkpoint === "chapter_batch_ready") return t("novel:taskDrawer.checkpoint.chapterBatchReady", { scope: resolvedScopeLabel });
  if (checkpoint === "workflow_completed") return t("novel:taskDrawer.checkpoint.workflowCompleted");
  return t("novel:taskDrawer.checkpoint.none");
}

function formatDate(value: string | null | undefined, t: TFunction): string {
  if (!value) return t("novel:taskDrawer.none");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("novel:taskDrawer.none");
  return date.toLocaleString();
}

function formatTokenCount(value: number | null | undefined): string {
  return new Intl.NumberFormat("zh-CN").format(Math.max(0, Math.round(value ?? 0)));
}

function formatStepStatus(status: "idle" | "running" | "succeeded" | "failed" | "cancelled", t: TFunction): string {
  if (status === "running") return t("novel:taskDrawer.stepStatus.running");
  if (status === "succeeded") return t("novel:taskDrawer.stepStatus.succeeded");
  if (status === "failed") return t("novel:taskDrawer.stepStatus.failed");
  if (status === "cancelled") return t("novel:taskDrawer.stepStatus.cancelled");
  return t("novel:taskDrawer.stepStatus.idle");
}

function formatRiskLevel(riskLevel: CharacterResourceProposalSummary["riskLevel"], t: TFunction): string {
  if (riskLevel === "high") return t("novel:taskDrawer.riskLevel.high");
  if (riskLevel === "medium") return t("novel:taskDrawer.riskLevel.medium");
  return t("novel:taskDrawer.riskLevel.low");
}

function formatProposalSource(proposal: CharacterResourceProposalSummary, t: TFunction): string {
  return proposal.sourceType === "chapter_background_sync"
    ? t("novel:taskDrawer.proposalSource.autoSync")
    : t("novel:taskDrawer.proposalSource.manualReview");
}

function formatFollowUpPriority(priority: "P0" | "P1" | "P2", t: TFunction): string {
  if (priority === "P0") return t("novel:taskDrawer.followUpPriority.p0");
  if (priority === "P1") return t("novel:taskDrawer.followUpPriority.p1");
  return t("novel:taskDrawer.followUpPriority.p2");
}

function followUpActionVariant(action: AutoDirectorAction): "default" | "outline" {
  return action.kind === "mutation" && action.riskLevel !== "high" ? "default" : "outline";
}

function readProposalPayloadText(
  proposal: CharacterResourceProposalSummary,
  key: string,
): string {
  const value = proposal.payload[key];
  return typeof value === "string" ? value.trim() : "";
}

function ResourceProposalCard(props: {
  proposal: CharacterResourceProposalSummary;
  onOpenSource?: (proposal: CharacterResourceProposalSummary) => void;
  onConfirm?: (proposalId: string) => void;
  onReject?: (proposalId: string) => void;
  confirmingProposalId?: string;
  rejectingProposalId?: string;
}) {
  const { t } = useTranslation();
  const {
    proposal,
    onOpenSource,
    onConfirm,
    onReject,
    confirmingProposalId = "",
    rejectingProposalId = "",
  } = props;
  const resourceName = readProposalPayloadText(proposal, "resourceName") || t("novel:taskDrawer.proposal.defaultResourceName");
  const holderName = readProposalPayloadText(proposal, "holderCharacterName");
  const narrativeImpact = readProposalPayloadText(proposal, "narrativeImpact");
  const isConfirming = confirmingProposalId === proposal.id;
  const isRejecting = rejectingProposalId === proposal.id;

  return (
    <div className="space-y-3 rounded-xl border bg-background/80 p-3">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">{resourceName}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            {holderName ? t("novel:taskDrawer.proposal.holderRelated", { name: holderName }) : t("novel:taskDrawer.proposal.holderUnknown")}
          </div>
        </div>
        <Badge variant={proposal.riskLevel === "high" ? "destructive" : "secondary"}>
          {formatRiskLevel(proposal.riskLevel, t)}
        </Badge>
      </div>
      <div className="text-sm leading-6 text-muted-foreground">{proposal.summary}</div>
      {narrativeImpact ? (
        <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground">
          {t("novel:taskDrawer.proposal.narrativeImpact", { impact: narrativeImpact })}
        </div>
      ) : null}
      {proposal.evidence[0] ? (
        <div className="text-xs leading-5 text-muted-foreground">{t("novel:taskDrawer.proposal.evidence", { text: proposal.evidence[0] })}</div>
      ) : null}
      {proposal.validationNotes[0] ? (
        <div className="text-xs leading-5 text-muted-foreground">{t("novel:taskDrawer.proposal.validationNote", { text: proposal.validationNotes[0] })}</div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{formatProposalSource(proposal, t)}</Badge>
        {proposal.chapterId ? <Badge variant="outline">{t("novel:taskDrawer.proposal.sourceChapter")}</Badge> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {proposal.chapterId ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenSource?.(proposal)}>
            {t("novel:taskDrawer.proposal.viewSource")}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          onClick={() => onConfirm?.(proposal.id)}
          disabled={isConfirming || !onConfirm}
        >
          {isConfirming ? t("novel:taskDrawer.proposal.confirming") : t("novel:taskDrawer.proposal.confirm")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onReject?.(proposal.id)}
          disabled={isRejecting || !onReject}
        >
          {isRejecting ? t("novel:taskDrawer.proposal.rejecting") : t("novel:taskDrawer.proposal.reject")}
        </Button>
      </div>
    </div>
  );
}

export default function NovelTaskDrawer({
  open,
  onOpenChange,
  task,
  snapshot,
  runtimeSnapshot,
  projection,
  currentUiModel,
  actions,
  onProjectionAction,
  resourceProposals = [],
  onOpenResourceProposalSource,
  onConfirmResourceProposal,
  onRejectResourceProposal,
  confirmingResourceProposalId = "",
  rejectingResourceProposalId = "",
  followUp,
  onFollowUpAction,
  executingFollowUpAction = false,
  runtimeHardBlocked = false,
  runtimeBlockedReason = null,
  overrideModel,
  onOverrideModelChange,
  onRetryWithOverrideModel,
  retryWithOverrideModelPending = false,
  canRetryWithOverrideModel = false,
  onRetryWithTaskModel,
  retryWithTaskModelPending = false,
  capabilities,
  onOpenFullTaskCenter,
}: NovelTaskDrawerState) {
  const { t } = useTranslation();
  const milestones = Array.isArray(task?.meta.milestones)
    ? task.meta.milestones as NovelWorkflowMilestone[]
    : [];
  const displayState = snapshot?.displayState ?? null;
  const dashboardView = snapshot?.dashboardView ?? null;
  const projectedProgressPercent = dashboardView?.progressPercent
    ?? displayState?.progressPercent
    ?? projection?.runtimeProjection?.progressBreakdown?.totalPercent;
  const workflowProgressFraction = typeof task?.progress === "number" && Number.isFinite(task.progress)
    ? task.progress
    : null;
  const progressPercent = Math.max(0, Math.min(100, Math.round(
    workflowProgressFraction !== null
      ? workflowProgressFraction * 100
      : typeof projectedProgressPercent === "number"
        ? projectedProgressPercent
        : 0,
  )));
  const tokenUsage = task?.tokenUsage ?? null;
  const primaryAction = projection?.primaryAction ?? null;
  const primaryActionLabel = (
    (primaryAction?.type === "continue" || primaryAction?.type === "auto_execute_range")
    && projection?.displayState === "needs_confirmation"
  )
    ? t("novel:taskDrawer.actions.confirmAndContinue")
    : primaryAction?.label;
  const runProjectedAction = (action: DirectorBookAutomationAction) => {
    const matchedAction = actions.find((item) => {
      if (item.label === action.label) return true;
      if (action.type === "continue") return item.label.includes("继续"); // i18n-ignore: matching against task data labels
      if (action.type === "auto_execute_range") return item.label.includes("自动执行"); // i18n-ignore
      if (action.type === "confirm_candidate") return item.label.includes("书级方向"); // i18n-ignore
      if (action.type === "open_quality_repair") return item.label.includes("质量修复"); // i18n-ignore
      if (action.type === "open_chapter") return item.label.includes("章节执行"); // i18n-ignore
      return false;
    });
    matchedAction?.onClick();
  };
  const handleProjectionAction = (action: DirectorBookAutomationAction) => {
    if (onProjectionAction) {
      onProjectionAction(action);
      return;
    }
    runProjectedAction(action);
  };
  const canShowRuntimePolicy = capabilities?.canAdjustRuntimePolicy !== false && Boolean(task?.id && runtimeSnapshot);
  const canShowManualImpact = capabilities?.canInspectManualEditImpact !== false && Boolean(task);
  const canShowRetryWithOverrideModel = capabilities?.canRetryWithOverrideModel === true;
  const canShowFollowUp = capabilities?.availableFollowUps !== false && Boolean(followUp);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-auto right-0 top-0 flex h-dvh max-h-dvh w-full max-w-[520px] translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-y-0 border-r-0 border-l bg-background p-0 sm:max-w-[520px]">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <DialogTitle>{t("novel:taskDrawer.title")}</DialogTitle>
          <DialogDescription>
            {t("novel:taskDrawer.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {task || projection ? (
            <AICockpit
              projection={projection}
              mode="focusedNovel"
              fallbackSummary={dashboardView?.currentAction || displayState?.currentAction || task?.blockingReason || task?.currentItemLabel || t("novel:taskDrawer.cockpit.noAction")}
              fallbackStatusLabel={dashboardView?.statusLabel ?? (task ? formatTaskStatus(task, t) : t("novel:taskDrawer.cockpit.notStarted"))}
              showDetailsAction={false}
              onAction={(_projection, action) => handleProjectionAction(action)}
            />
          ) : null}

          {resourceProposals.length > 0 ? (
            <section className="space-y-3 rounded-2xl border border-amber-300/60 bg-amber-50/40 p-4 dark:border-amber-700/50 dark:bg-amber-950/15">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-foreground">{t("novel:taskDrawer.resourceProposals.title")}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("novel:taskDrawer.resourceProposals.description")}
                  </div>
                </div>
                <Badge variant="secondary">{t("novel:taskDrawer.resourceProposals.count", { count: resourceProposals.length })}</Badge>
              </div>
              <div className="space-y-2">
                {resourceProposals.slice(0, 4).map((proposal) => (
                  <ResourceProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onOpenSource={onOpenResourceProposalSource}
                    onConfirm={onConfirmResourceProposal}
                    onReject={onRejectResourceProposal}
                    confirmingProposalId={confirmingResourceProposalId}
                    rejectingProposalId={rejectingResourceProposalId}
                  />
                ))}
              </div>
              {resourceProposals.length > 4 ? (
                <div className="text-xs text-muted-foreground">
                  {t("novel:taskDrawer.resourceProposals.more", { count: resourceProposals.length - 4 })}
                </div>
              ) : null}
            </section>
          ) : null}

          {task ? (
            <>
              <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/15 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-base font-semibold text-foreground">{task.title}</div>
                  <Badge variant={toTaskStatusVariant(task)}>{formatTaskStatus(task, t)}</Badge>
                  <Badge variant="outline">{t("novel:taskDrawer.progress", { percent: progressPercent })}</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("novel:taskDrawer.fields.currentStage")}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">{dashboardView?.stageLabel ?? displayState?.stageLabel ?? task.currentStage ?? t("novel:taskDrawer.none")}</div>
                  </div>
                  <div className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("novel:taskDrawer.fields.currentAction")}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">{dashboardView?.currentAction ?? displayState?.currentAction ?? task.currentItemLabel ?? t("novel:taskDrawer.none")}</div>
                  </div>
                  <div className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("novel:taskDrawer.fields.lastCheckpoint")}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">{displayState?.checkpointLabel ?? formatCheckpoint(task.checkpointType, t, task.executionScopeLabel)}</div>
                  </div>
                  <div className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("novel:taskDrawer.fields.lastHeartbeat")}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">{formatDate(task.heartbeatAt, t)}</div>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                {task.checkpointSummary ? (
                  <div className="rounded-xl border bg-background/80 p-3 text-sm text-muted-foreground">
                    {task.checkpointSummary}
                  </div>
                ) : null}
                {task.lastError ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <div className="font-medium">{t("novel:taskDrawer.fields.lastError")}</div>
                    <div className="mt-1">{task.lastError}</div>
                    {task.recoveryHint ? (
                      <div className="mt-2 text-xs text-destructive/80">{t("novel:taskDrawer.fields.recoveryHint", { hint: task.recoveryHint })}</div>
                    ) : null}
                  </div>
                ) : null}
              </section>

              {canShowFollowUp && followUp ? (
                <section className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-medium text-foreground">{t("novel:taskDrawer.followUp.title")}</div>
                    <Badge variant="outline">{followUp.reasonLabel}</Badge>
                    <Badge variant={followUp.priority === "P0" ? "destructive" : "secondary"}>
                      {formatFollowUpPriority(followUp.priority, t)}
                    </Badge>
                  </div>
                  <div className="text-sm leading-6 text-muted-foreground">{followUp.followUpSummary}</div>
                  {followUp.blockingReason ? (
                    <div className="text-sm text-muted-foreground">{t("novel:taskDrawer.followUp.blockingReason", { reason: followUp.blockingReason })}</div>
                  ) : null}
                  {followUp.currentModel ? (
                    <div className="text-sm text-muted-foreground">{t("novel:taskDrawer.followUp.currentModel", { model: followUp.currentModel })}</div>
                  ) : null}
                  {runtimeHardBlocked && runtimeBlockedReason ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      {runtimeBlockedReason}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {followUp.availableActions.map((action) => (
                      <Button
                        key={action.code}
                        type="button"
                        size="sm"
                        variant={followUpActionVariant(action)}
                        onClick={() => onFollowUpAction?.(action)}
                        disabled={executingFollowUpAction || (runtimeHardBlocked && action.kind !== "navigation")}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </section>
              ) : null}

              {canShowRuntimePolicy && task ? (
                <section className="space-y-3">
                  <div className="text-sm font-medium text-foreground">{t("novel:taskDrawer.sections.runtimePolicy")}</div>
                  <TaskCenterRuntimePolicyCard taskId={task.id} snapshot={runtimeSnapshot} />
                </section>
              ) : null}

              {canShowManualImpact && task ? (
                <section className="space-y-3">
                  <div className="text-sm font-medium text-foreground">{t("novel:taskDrawer.sections.manualImpact")}</div>
                  <TaskCenterManualEditImpactCard task={task} />
                </section>
              ) : null}

              {canShowRetryWithOverrideModel && overrideModel && onOverrideModelChange ? (
                <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/15 p-4">
                  <div className="text-sm font-medium text-foreground">{t("novel:taskDrawer.sections.retryWithModel")}</div>
                  <LLMSelector
                    value={overrideModel}
                    onChange={onOverrideModelChange}
                    compact
                    showBadge={false}
                    showHelperText={false}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={onRetryWithOverrideModel}
                      disabled={retryWithOverrideModelPending || !canRetryWithOverrideModel}
                    >
                      {retryWithOverrideModelPending ? t("novel:taskDrawer.actions.retrying") : t("novel:taskDrawer.actions.retryWithSelected")}
                    </Button>
                    {onRetryWithTaskModel ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onRetryWithTaskModel}
                        disabled={retryWithTaskModelPending}
                      >
                        {retryWithTaskModelPending ? t("novel:taskDrawer.actions.retrying") : t("novel:taskDrawer.actions.retryWithOriginal")}
                      </Button>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <section className="space-y-3">
                <div className="text-sm font-medium text-foreground">{t("novel:taskDrawer.sections.quickActions")}</div>
                {actions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {actions.map((action) => (
                      <Button
                        key={action.label}
                        type="button"
                        size="sm"
                        variant={action.variant ?? "default"}
                        disabled={action.disabled}
                        onClick={action.onClick}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                    {t("novel:taskDrawer.sections.noQuickActions")}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="text-sm font-medium text-foreground">{t("novel:taskDrawer.sections.modelInfo")}</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("novel:taskDrawer.fields.taskModel")}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">
                      {task.provider ?? t("novel:taskDrawer.none")} / {task.model ?? t("novel:taskDrawer.none")}
                    </div>
                  </div>
                  <div className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("novel:taskDrawer.fields.uiModel")}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">
                      {currentUiModel.provider} / {currentUiModel.model}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t("novel:taskDrawer.fields.temperature", { value: currentUiModel.temperature })}
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="text-sm font-medium text-foreground">{t("novel:taskDrawer.sections.tokenStats")}</div>
                {tokenUsage ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border bg-background/80 p-3">
                      <div className="text-xs text-muted-foreground">{t("novel:taskDrawer.fields.llmCallCount")}</div>
                      <div className="mt-1 text-sm font-medium text-foreground">{formatTokenCount(tokenUsage.llmCallCount)}</div>
                    </div>
                    <div className="rounded-xl border bg-background/80 p-3">
                      <div className="text-xs text-muted-foreground">{t("novel:taskDrawer.fields.totalTokens")}</div>
                      <div className="mt-1 text-sm font-medium text-foreground">{formatTokenCount(tokenUsage.totalTokens)}</div>
                    </div>
                    <div className="rounded-xl border bg-background/80 p-3">
                      <div className="text-xs text-muted-foreground">{t("novel:taskDrawer.fields.promptTokens")}</div>
                      <div className="mt-1 text-sm font-medium text-foreground">{formatTokenCount(tokenUsage.promptTokens)}</div>
                    </div>
                    <div className="rounded-xl border bg-background/80 p-3">
                      <div className="text-xs text-muted-foreground">{t("novel:taskDrawer.fields.completionTokens")}</div>
                      <div className="mt-1 text-sm font-medium text-foreground">{formatTokenCount(tokenUsage.completionTokens)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t("novel:taskDrawer.fields.lastRecorded", { time: formatDate(tokenUsage.lastRecordedAt, t) })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                    {t("novel:taskDrawer.sections.noTokenUsage")}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="text-sm font-medium text-foreground">{t("novel:taskDrawer.sections.stepStatus")}</div>
                <div className="space-y-2">
                  {(displayState?.steps ?? task.steps).map((step) => (
                    <div key={step.key} className="flex items-center justify-between rounded-xl border bg-background/80 px-3 py-2">
                      <div className="text-sm text-foreground">{step.label}</div>
                      <Badge variant="outline">{"isCurrent" in step
                        ? (step.status === "attention"
                          ? t("novel:taskDrawer.stepStatus.attention")
                          : step.status === "running"
                            ? t("novel:taskDrawer.stepStatus.running")
                            : step.status === "completed"
                              ? t("novel:taskDrawer.stepStatus.succeeded")
                              : t("novel:taskDrawer.stepStatus.idle"))
                        : formatStepStatus(step.status, t)}</Badge>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div className="text-sm font-medium text-foreground">{t("novel:taskDrawer.sections.milestones")}</div>
                {milestones.length > 0 ? (
                  <div className="space-y-2">
                    {milestones
                      .slice()
                      .reverse()
                      .map((milestone) => (
                        <div key={`${milestone.checkpointType}:${milestone.createdAt}`} className="rounded-xl border bg-background/80 p-3">
                          <div className="font-medium text-foreground">{formatCheckpoint(milestone.checkpointType, t)}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{milestone.summary}</div>
                          <div className="mt-2 text-xs text-muted-foreground">{t("novel:taskDrawer.fields.recordedAt", { time: formatDate(milestone.createdAt, t) })}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                    {t("novel:taskDrawer.sections.noMilestones")}
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-dashed px-5 py-8 text-sm text-muted-foreground">
              {t("novel:taskDrawer.noTask")}
            </section>
          )}
        </div>

        <div className="space-y-2 border-t border-border/70 px-5 py-4">
          {primaryAction ? (
            <Button type="button" className="w-full" onClick={() => handleProjectionAction(primaryAction)}>
              {primaryActionLabel || t("novel:taskDrawer.actions.continueProcessing")}
            </Button>
          ) : null}
          {task?.sourceRoute ? (
            <Button asChild type="button" variant="outline" className="w-full">
              <Link to={task.sourceRoute}>{t("novel:taskDrawer.actions.openSource")}</Link>
            </Button>
          ) : null}
          <Button type="button" variant={primaryAction ? "ghost" : "outline"} className="w-full" onClick={onOpenFullTaskCenter}>
            {t("novel:taskDrawer.actions.openTaskCenter")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
