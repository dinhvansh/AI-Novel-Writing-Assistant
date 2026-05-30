import type { SSEFrame } from "@ai-novel/shared/types/api";
import type {
  AuditReport,
  Chapter,
  StoryStateSnapshot,
} from "@ai-novel/shared/types/novel";
import type { ChapterRuntimePackage } from "@ai-novel/shared/types/chapterRuntime";
import type { TFunction } from "i18next";
import { parseChapterScenePlan } from "@ai-novel/shared/types/chapterLengthControl";
import {
  classifyChapterQualityLoopRisk,
  hasContinuableChapterQualityLoopRiskFlags,
} from "@ai-novel/shared/types/chapterQualityLoop";
import { Link } from "react-router-dom";
import AiButton from "@/components/common/AiButton";
import AiActionLabel from "@/components/common/AiActionLabel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type AssetTabKey = "content" | "taskSheet" | "sceneCards" | "quality" | "repair";
export type QueueFilterKey = "all" | "setup" | "draft" | "review" | "completed";
export type ChapterExecutionFlowStageKey =
  | "execution_plan"
  | "writing"
  | "review"
  | "repair"
  | "state_sync"
  | "payoff_sync"
  | "ready";
export type ChapterExecutionFlowStageStatus = "not_started" | "in_progress" | "done";
export type ChapterExecutionBackgroundActivityKind = "character_dynamics" | "state_snapshot" | "payoff_ledger" | "character_resources";
export type ChapterExecutionBackgroundActivityStatus = "running" | "failed";

export interface ChapterExecutionBackgroundActivity {
  kind: ChapterExecutionBackgroundActivityKind;
  status: ChapterExecutionBackgroundActivityStatus;
  chapterId: string;
  chapterOrder?: number;
  chapterTitle?: string;
  updatedAt: string;
  error?: string | null;
}

export type PrimaryAction = {
  label: string;
  reason: string;
  variant: "default" | "secondary" | "outline";
  ai?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
};

export type QueueFilterOption = {
  key: QueueFilterKey;
  label: string;
  count: number;
};

export interface ChapterExecutionFlowStage {
  key: ChapterExecutionFlowStageKey;
  label: string;
  status: ChapterExecutionFlowStageStatus;
}

interface ResolveChapterExecutionFlowInput {
  selectedChapter: Chapter | undefined;
  chapterAuditReports: AuditReport[];
  chapterRuntimePackage?: ChapterRuntimePackage | null;
  chapterStateSnapshot?: StoryStateSnapshot | null;
  latestStateSnapshot?: StoryStateSnapshot | null;
  chapterRunStatus?: Extract<SSEFrame, { type: "run_status" }> | null;
  repairRunStatus?: Extract<SSEFrame, { type: "run_status" }> | null;
  isStreaming?: boolean;
  streamingChapterId?: string | null;
  isRepairStreaming?: boolean;
  repairStreamingChapterId?: string | null;
  isRunningFullAudit?: boolean;
  backgroundActivities?: ChapterExecutionBackgroundActivity[] | null;
}

const CHAPTER_EXECUTION_FLOW_ORDER = (t: TFunction): Array<{ key: ChapterExecutionFlowStageKey; label: string }> => [
  { key: "execution_plan", label: t("novel:chapter.execution.flow.executionPlan") },
  { key: "writing", label: t("novel:chapter.execution.flow.writing") },
  { key: "review", label: t("novel:chapter.execution.flow.review") },
  { key: "repair", label: t("novel:chapter.execution.flow.repair") },
  { key: "state_sync", label: t("novel:chapter.execution.flow.stateSync") },
  { key: "payoff_sync", label: t("novel:chapter.execution.flow.payoffSync") },
  { key: "ready", label: t("novel:chapter.execution.flow.ready") },
];

function hasOpenAuditIssues(reports: AuditReport[]): boolean {
  return reports.some((report) => report.issues.some((issue) => issue.status === "open"));
}

function hasBackgroundActivity(
  activities: ChapterExecutionBackgroundActivity[] | null | undefined,
  kind: ChapterExecutionBackgroundActivity["kind"],
  chapterId: string,
): boolean {
  return (activities ?? []).some((item) => item.kind === kind && item.status === "running" && item.chapterId === chapterId);
}

function hasRuntimeLedgerData(runtimePackage: ChapterRuntimePackage | null | undefined): boolean {
  if (!runtimePackage) {
    return false;
  }
  const context = runtimePackage.context;
  return Boolean(
    context.ledgerSummary
    || context.ledgerPendingItems.length > 0
    || context.ledgerUrgentItems.length > 0
    || context.ledgerOverdueItems.length > 0,
  );
}

function hasRuntimeResourceData(runtimePackage: ChapterRuntimePackage | null | undefined): boolean {
  const context = runtimePackage?.context.characterResourceContext;
  return Boolean(
    context
    && (
      context.availableItems.length > 0
      || context.setupNeededItems.length > 0
      || context.blockedItems.length > 0
      || context.pendingReviewItems.length > 0
      || context.riskSignals.length > 0
    ),
  );
}

function buildCurrentStageNote(stage: ChapterExecutionFlowStage, t: TFunction): string {
  switch (stage.key) {
    case "execution_plan":
      return stage.status === "done"
        ? t("novel:chapter.execution.flow.notes.executionPlanDone")
        : t("novel:chapter.execution.flow.notes.executionPlanPending");
    case "writing":
      return stage.status === "in_progress"
        ? t("novel:chapter.execution.flow.notes.writingInProgress")
        : t("novel:chapter.execution.flow.notes.writingReady");
    case "review":
      return stage.status === "in_progress"
        ? t("novel:chapter.execution.flow.notes.reviewInProgress")
        : t("novel:chapter.execution.flow.notes.reviewReady");
    case "repair":
      return stage.status === "in_progress"
        ? t("novel:chapter.execution.flow.notes.repairInProgress")
        : t("novel:chapter.execution.flow.notes.repairReady");
    case "state_sync":
      return stage.status === "in_progress"
        ? t("novel:chapter.execution.flow.notes.stateSyncInProgress")
        : t("novel:chapter.execution.flow.notes.stateSyncReady");
    case "payoff_sync":
      return stage.status === "in_progress"
        ? t("novel:chapter.execution.flow.notes.payoffSyncInProgress")
        : t("novel:chapter.execution.flow.notes.payoffSyncReady");
    case "ready":
    default:
      return stage.status === "done"
        ? t("novel:chapter.execution.flow.notes.readyDone")
        : stage.status === "in_progress"
          ? t("novel:chapter.execution.flow.notes.readyInProgress")
          : t("novel:chapter.execution.flow.notes.readyPending");
  }
}

export function resolveChapterExecutionFlow(input: ResolveChapterExecutionFlowInput, t: TFunction): {
  stages: ChapterExecutionFlowStage[];
  currentStage: ChapterExecutionFlowStage & { note: string };
} {
  const chapter = input.selectedChapter;
  const chapterId = chapter?.id ?? "";
  const isCurrentChapterWriting = Boolean(
    chapter && input.isStreaming && input.streamingChapterId === chapter.id,
  );
  const isCurrentChapterRepairing = Boolean(
    chapter && input.isRepairStreaming && input.repairStreamingChapterId === chapter.id,
  );
  const currentStateSnapshot = input.chapterRuntimePackage?.context.stateSnapshot
    ?? input.chapterStateSnapshot
    ?? (input.latestStateSnapshot?.sourceChapterId === chapterId ? input.latestStateSnapshot : null);

  const stages: ChapterExecutionFlowStage[] = CHAPTER_EXECUTION_FLOW_ORDER(t).map(({ key, label }) => {
    if (!chapter) {
      return {
        key,
        label,
        status: "not_started",
      };
    }

    switch (key) {
      case "execution_plan":
        return {
          key,
          label,
          status: chapter.taskSheet?.trim() || chapter.sceneCards?.trim()
            ? "done"
            : "not_started",
        };
      case "writing":
        return {
          key,
          label,
          status: isCurrentChapterWriting || chapter.chapterStatus === "generating"
            ? "in_progress"
            : chapter.content?.trim()
              ? "done"
              : "not_started",
        };
      case "review":
        return {
          key,
          label,
          status: (input.isRunningFullAudit || (isCurrentChapterWriting && input.chapterRunStatus?.phase === "finalizing"))
            ? "in_progress"
            : (input.chapterAuditReports.length > 0 || chapter.generationState === "reviewed" || chapter.generationState === "approved" || chapter.generationState === "published")
              ? "done"
              : "not_started",
        };
      case "repair":
        return {
          key,
          label,
          status: isCurrentChapterRepairing
            ? "in_progress"
            : (chapter.generationState === "repaired" || Boolean(chapter.repairHistory?.trim()))
              ? "done"
              : "not_started",
        };
      case "state_sync":
        return {
          key,
          label,
          status: hasBackgroundActivity(input.backgroundActivities, "state_snapshot", chapterId)
            || hasBackgroundActivity(input.backgroundActivities, "character_resources", chapterId)
            ? "in_progress"
            : (currentStateSnapshot || hasRuntimeResourceData(input.chapterRuntimePackage))
              ? "done"
              : "not_started",
        };
      case "payoff_sync":
        return {
          key,
          label,
          status: hasBackgroundActivity(input.backgroundActivities, "payoff_ledger", chapterId)
            ? "in_progress"
            : (hasRuntimeLedgerData(input.chapterRuntimePackage) || Boolean(currentStateSnapshot?.foreshadowStates?.length))
              ? "done"
              : "not_started",
        };
      case "ready":
      default:
        return {
          key,
          label,
          status: chapter.chapterStatus === "completed" || chapter.generationState === "approved" || chapter.generationState === "published"
            ? "done"
            : chapter.chapterStatus === "pending_review" && !hasOpenAuditIssues(input.chapterAuditReports)
              ? "in_progress"
              : "not_started",
        };
    }
  });

  const currentStage = stages.find((stage) => stage.status === "in_progress")
    ?? stages.find((stage) => stage.status === "not_started")
    ?? stages[stages.length - 1]!;

  return {
    stages,
    currentStage: {
      ...currentStage,
      note: buildCurrentStageNote(currentStage, t),
    },
  };
}

export function resolveDisplayedChapterStatus(chapter: Chapter): Chapter["chapterStatus"] | null | undefined {
  const status = chapter.chapterStatus;
  if (!hasText(chapter.content)) {
    return status;
  }
  if (chapter.generationState === "approved" || chapter.generationState === "published") {
    return "completed";
  }
  if (
    chapterHasContinuableQualityLoop(chapter)
    && (chapter.generationState === "reviewed" || chapter.generationState === "repaired")
  ) {
    return "pending_review";
  }
  if (status === "generating" && (chapter.generationState === "reviewed" || chapter.generationState === "repaired")) {
    return "pending_review";
  }
  if (status === "needs_repair" && chapterHasContinuableQualityLoop(chapter)) {
    return "pending_review";
  }
  if (status === "pending_generation") {
    return "pending_review";
  }
  return status;
}

export function chapterStatusLabel(status: Chapter["chapterStatus"] | null | undefined, t: TFunction): string {
  switch (status) {
    case "unplanned": return t("novel:chapter.execution.status.unplanned");
    case "pending_generation": return t("novel:chapter.execution.status.pendingGeneration");
    case "generating": return t("novel:chapter.execution.status.generating");
    case "pending_review": return t("novel:chapter.execution.status.pendingReview");
    case "needs_repair": return t("novel:chapter.execution.status.needsRepair");
    case "completed": return t("novel:chapter.execution.status.completed");
    default: return t("novel:chapter.execution.status.unset");
  }
}

export function chapterStatusDescription(status: Chapter["chapterStatus"] | null | undefined, t: TFunction): string {
  switch (status) {
    case "unplanned": return t("novel:chapter.execution.statusDesc.unplanned");
    case "pending_generation": return t("novel:chapter.execution.statusDesc.pendingGeneration");
    case "generating": return t("novel:chapter.execution.statusDesc.generating");
    case "pending_review": return t("novel:chapter.execution.statusDesc.pendingReview");
    case "needs_repair": return t("novel:chapter.execution.statusDesc.needsRepair");
    case "completed": return t("novel:chapter.execution.statusDesc.completed");
    default: return t("novel:chapter.execution.statusDesc.unset");
  }
}

export function generationStateLabel(state: Chapter["generationState"] | null | undefined, t: TFunction): string {
  switch (state) {
    case "planned": return t("novel:chapter.execution.generationState.planned");
    case "drafted": return t("novel:chapter.execution.generationState.drafted");
    case "reviewed": return t("novel:chapter.execution.generationState.reviewed");
    case "repaired": return t("novel:chapter.execution.generationState.repaired");
    case "approved": return t("novel:chapter.execution.generationState.approved");
    case "published": return t("novel:chapter.execution.generationState.published");
    default: return "";
  }
}

export function generationStateDescription(state: Chapter["generationState"] | null | undefined, t: TFunction): string {
  switch (state) {
    case "planned": return t("novel:chapter.execution.generationStateDesc.planned");
    case "drafted": return t("novel:chapter.execution.generationStateDesc.drafted");
    case "reviewed": return t("novel:chapter.execution.generationStateDesc.reviewed");
    case "repaired": return t("novel:chapter.execution.generationStateDesc.repaired");
    case "approved": return t("novel:chapter.execution.generationStateDesc.approved");
    case "published": return t("novel:chapter.execution.generationStateDesc.published");
    default: return "";
  }
}

export function shouldShowGenerationStateBadge(state?: Chapter["generationState"] | null): boolean {
  return Boolean(state && state !== "planned");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringifyRiskLabel(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function qualityLoopActionLabel(value: unknown, t: TFunction): string | null {
  switch (value) {
    case "continue": return t("novel:chapter.execution.qualityLoop.action.continue");
    case "patch_repair": return t("novel:chapter.execution.qualityLoop.action.patchRepair");
    case "replan": return t("novel:chapter.execution.qualityLoop.action.replan");
    case "manual_gate": return t("novel:chapter.execution.qualityLoop.action.manualGate");
    default: return null;
  }
}

function qualityLoopStatusLabel(value: unknown, t: TFunction): string | null {
  switch (value) {
    case "risk": return t("novel:chapter.execution.qualityLoop.status.risk");
    case "invalid": return t("novel:chapter.execution.qualityLoop.status.invalid");
    case "missing": return t("novel:chapter.execution.qualityLoop.status.missing");
    default: return null;
  }
}

function qualityLoopArtifactLabel(value: unknown, t: TFunction): string | null {
  switch (value) {
    case "chapter_retention_contract": return t("novel:chapter.execution.qualityLoop.artifact.retentionContract");
    case "continuity_state": return t("novel:chapter.execution.qualityLoop.artifact.continuityState");
    case "rolling_window_review": return t("novel:chapter.execution.qualityLoop.artifact.rollingWindowReview");
    default: return null;
  }
}

function parseStructuredRiskFlagsObject(input: string): Record<string, unknown> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return null;
  }
  return isRecord(parsed) ? parsed : null;
}

export function chapterHasContinuableQualityLoop(chapter: Pick<Chapter, "riskFlags">): boolean {
  return hasContinuableChapterQualityLoopRiskFlags(chapter.riskFlags);
}

function parseStructuredRiskFlags(input: string, t: TFunction): string[] | null {
  const parsed = parseStructuredRiskFlagsObject(input);
  if (!parsed) return null;
  const labels: string[] = [];
  const qualityLoop = parsed.qualityLoop;
  if (isRecord(qualityLoop)) {
    const qualityLoopRisk = classifyChapterQualityLoopRisk(qualityLoop);
    if (qualityLoopRisk === "non_blocking_quality_debt") {
      labels.push(t("novel:chapter.execution.qualityLoop.debtRecorded"));
    } else {
      const actionLabel = qualityLoopActionLabel(qualityLoop.recommendedAction, t);
      const statusLabel = qualityLoopStatusLabel(qualityLoop.overallStatus, t);
      if (actionLabel) labels.push(actionLabel);
      if (statusLabel) labels.push(statusLabel);
    }
    const signals = Array.isArray(qualityLoop.signals) ? qualityLoop.signals : [];
    signals.forEach((signal) => {
      if (!isRecord(signal) || signal.status === "valid") return;
      const label = qualityLoopArtifactLabel(signal.artifactType, t);
      if (label) labels.push(label);
    });
  }
  const extraLabels = Object.entries(parsed)
    .filter(([key]) => key !== "qualityLoop")
    .flatMap(([, value]) => Array.isArray(value) ? value : [value])
    .map(stringifyRiskLabel)
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set([...labels, ...extraLabels])).slice(0, 4);
}

export function parseRiskFlags(input: string | null | undefined, t: TFunction): string[] {
  if (!input?.trim()) return [];
  const structured = parseStructuredRiskFlags(input.trim(), t);
  if (structured) return structured;
  return input
    .split(/[\n,，;；|]/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 4);
}

export function hasText(input: string | null | undefined): boolean {
  return Boolean(input?.trim());
}

export function chapterHasPreparationAssets(chapter: Chapter): boolean {
  return hasText(chapter.expectation) || hasText(chapter.taskSheet) || hasText(chapter.sceneCards);
}

export function parseChapterScenePlanForDisplay(chapter: Chapter) {
  return parseChapterScenePlan(chapter.sceneCards, {
    targetWordCount: chapter.targetWordCount ?? undefined,
  });
}

export function resolveChapterQueuePreview(chapter: Chapter, t: TFunction): string {
  if (hasText(chapter.expectation)) return chapter.expectation!.trim();
  if (hasText(chapter.taskSheet)) return chapter.taskSheet!.trim();
  const scenePlan = parseChapterScenePlanForDisplay(chapter);
  if (scenePlan) {
    const firstScene = scenePlan.scenes[0];
    return firstScene
      ? `${firstScene.title} · ${firstScene.purpose}`
      : t("novel:chapter.execution.queuePreview.sceneContract");
  }
  if (hasText(chapter.sceneCards)) return t("novel:chapter.execution.queuePreview.oldSceneCards");
  return t("novel:chapter.execution.queuePreview.noGoal");
}

export function chapterSuggestedActionLabel(chapter: Chapter, t: TFunction): string {
  if (chapterHasContinuableQualityLoop(chapter)) {
    return hasText(chapter.content) ? t("novel:chapter.execution.suggestedAction.continueNext") : t("novel:chapter.execution.suggestedAction.writeThis");
  }
  const status = resolveDisplayedChapterStatus(chapter);
  if (status === "generating") return t("novel:chapter.execution.suggestedAction.waitGenerating");
  if (status === "needs_repair") return t("novel:chapter.execution.suggestedAction.quickRepair");
  if (status === "pending_review") {
    return chapter.generationState === "reviewed" || chapter.generationState === "approved"
      ? t("novel:chapter.execution.suggestedAction.viewSuggestions")
      : t("novel:chapter.execution.suggestedAction.runReview");
  }
  if (status === "completed") return t("novel:chapter.execution.suggestedAction.polish");
  if (status === "unplanned" || !chapterHasPreparationAssets(chapter)) return t("novel:chapter.execution.suggestedAction.addPlan");
  if (!hasText(chapter.content) || status === "pending_generation") return t("novel:chapter.execution.suggestedAction.writeThis");
  if (chapter.generationState === "drafted") return t("novel:chapter.execution.suggestedAction.runReview");
  return t("novel:chapter.execution.suggestedAction.openEditor");
}

export function chapterMatchesQueueFilter(chapter: Chapter, filter: QueueFilterKey): boolean {
  const status = resolveDisplayedChapterStatus(chapter);
  if (filter === "all") return true;
  if (filter === "completed") {
    return status === "completed"
      || chapter.generationState === "approved"
      || chapter.generationState === "published";
  }
  if (filter === "review") {
    return status === "pending_review"
      || status === "needs_repair"
      || chapter.generationState === "drafted"
      || chapter.generationState === "reviewed";
  }
  if (filter === "setup") {
    return status === "unplanned" || (!chapterHasPreparationAssets(chapter) && !hasText(chapter.content));
  }
  if (filter === "draft") {
    return status === "pending_generation"
      || status === "generating"
      || (!hasText(chapter.content) && status !== "unplanned");
  }
  return true;
}

export function MetricBadge(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{props.label}</div>
      <div className="mt-1 text-sm font-medium text-foreground">{props.value}</div>
      {props.hint ? <div className="mt-1 text-[11px] text-muted-foreground">{props.hint}</div> : null}
    </div>
  );
}

export function RiskBadgeList(props: { risks: string[] }) {
  if (props.risks.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {props.risks.map((risk) => <Badge key={risk} variant="secondary">{risk}</Badge>)}
    </div>
  );
}

export function PrimaryActionButton(props: { action: PrimaryAction | null; className?: string }) {
  const { action, className } = props;
  if (!action) {
    return null;
  }
  if (action.href) {
    return (
      <Button asChild size="sm" variant={action.variant} className={className}>
        <Link to={action.href}>
          {action.ai ? <AiActionLabel>{action.label}</AiActionLabel> : action.label}
        </Link>
      </Button>
    );
  }
  return (
    action.ai ? (
      <AiButton size="sm" variant={action.variant} className={className} onClick={action.onClick} disabled={action.disabled}>
        {action.label}
      </AiButton>
    ) : (
      <Button size="sm" variant={action.variant} className={className} onClick={action.onClick} disabled={action.disabled}>
        {action.label}
      </Button>
    )
  );
}
