import type {
  NovelWorkflowCheckpoint,
  NovelWorkflowLane,
  NovelWorkflowMilestone,
  NovelWorkflowMilestoneType,
  NovelWorkflowResumeTarget,
  NovelWorkflowStage,
} from "@ai-novel/shared/types/novelWorkflow";
import {
  getWorkflowCheckpointLabel,
  resolveWorkflowStageFromCheckpoint,
} from "@ai-novel/shared/types/directorWorkflowStepCatalog";
import { NOVEL_WORKFLOW_STAGE_LABELS, NOVEL_WORKFLOW_STAGE_PROGRESS, parseResumeTarget, parseSeedPayload } from "./novelWorkflow.shared";
import type { DirectorWorkflowSeedPayload } from "../director/runtime/novelDirectorHelpers";
import type { TaskStatus } from "@ai-novel/shared/types/task";

export interface BootstrapWorkflowInput {
  workflowTaskId?: string | null;
  novelId?: string | null;
  lane: NovelWorkflowLane;
  title?: string | null;
  seedPayload?: Record<string, unknown>;
  forceNew?: boolean;
  initialState?: {
    stage: NovelWorkflowStage;
    itemKey?: string | null;
    itemLabel: string;
    progress?: number;
    chapterId?: string | null;
    volumeId?: string | null;
  };
}

export interface SyncWorkflowStageInput {
  stage: NovelWorkflowStage;
  itemLabel: string;
  itemKey?: string | null;
  checkpointType?: NovelWorkflowCheckpoint | null;
  checkpointSummary?: string | null;
  chapterId?: string | null;
  volumeId?: string | null;
  progress?: number;
  status?: TaskStatus;
}

export interface ChapterBatchCheckpointRow {
  title: string;
  novelId: string | null;
  status: string;
  checkpointType: string | null;
  currentItemLabel: string | null;
  checkpointSummary: string | null;
  resumeTargetJson: string | null;
  seedPayloadJson: string | null;
  lastError: string | null;
  finishedAt: Date | null;
  milestonesJson: string | null;
}

export function buildChapterTitleDiversityTaskNotice(input: {
  issue: string;
  volumeId?: string | null;
}) {
  return {
    code: "CHAPTER_TITLE_DIVERSITY",
    summary: input.issue.trim(),
    action: {
      type: "open_structured_outline" as const,
      label: "快速修复章节标题",
      volumeId: input.volumeId?.trim() || null,
    },
  };
}

export function resolveCheckpointStageFromRow(input: {
  checkpointType: NovelWorkflowCheckpoint;
  status?: string | null;
}): NovelWorkflowStage {
  return resolveWorkflowStageFromCheckpoint(input) ?? "auto_director";
}

export function resolveCheckpointItemLabelFromRow(input: {
  checkpointType: NovelWorkflowCheckpoint;
  status?: string | null;
}): string {
  return getWorkflowCheckpointLabel({
    checkpointType: input.checkpointType,
    status: input.status,
    preferPausedLabel: input.checkpointType === "chapter_batch_ready" && input.status !== "waiting_approval",
    fallback: input.checkpointType,
  });
}

export function parseSeedResumeTarget(seedPayloadJson: string | null | undefined) {
  const seedPayload = parseSeedPayload<{ resumeTarget?: unknown }>(seedPayloadJson);
  if (typeof seedPayload?.resumeTarget === "string") {
    return parseResumeTarget(seedPayload.resumeTarget);
  }
  if (seedPayload?.resumeTarget && typeof seedPayload.resumeTarget === "object") {
    return seedPayload.resumeTarget as NonNullable<ReturnType<typeof parseResumeTarget>>;
  }
  return null;
}

export function mergeResumeTargets(
  primary: ReturnType<typeof parseResumeTarget>,
  fallback: ReturnType<typeof parseResumeTarget>,
) {
  if (!primary) {
    return fallback;
  }
  if (!fallback) {
    return primary;
  }
  return {
    ...fallback,
    ...primary,
    stage: primary.stage === "basic" && fallback.stage !== "basic"
      ? fallback.stage
      : primary.stage,
    chapterId: primary.chapterId ?? fallback.chapterId ?? null,
    volumeId: primary.volumeId ?? fallback.volumeId ?? null,
  };
}

export function isQueuedWorkflowItemKey(itemKey: string | null | undefined): boolean {
  return itemKey === "project_setup" || itemKey === "auto_director" || !itemKey;
}

export function isCandidateSelectionItemKey(itemKey: string | null | undefined): boolean {
  return itemKey === "auto_director" || itemKey?.startsWith("candidate_") === true;
}

export function hasCandidateSelectionPhase(seedPayloadJson: string | null | undefined): boolean {
  const seedPayload = parseSeedPayload<DirectorWorkflowSeedPayload>(seedPayloadJson);
  if (!seedPayload) {
    return false;
  }
  if (seedPayload.candidateStage) {
    return true;
  }
  const phase = seedPayload.directorSession && typeof seedPayload.directorSession === "object"
    ? (seedPayload.directorSession as { phase?: unknown }).phase
    : null;
  return phase === "candidate_selection";
}

export function isPreNovelAutoDirectorCandidateTask(row: {
  lane?: string | null;
  novelId?: string | null;
  checkpointType?: string | null;
  currentItemKey?: string | null;
  seedPayloadJson?: string | null;
} | null): boolean {
  return Boolean(
    row
    && row.lane === "auto_director"
    && !row.novelId
    && (
      row.checkpointType === "candidate_selection_required"
      || isCandidateSelectionItemKey(row.currentItemKey)
      || hasCandidateSelectionPhase(row.seedPayloadJson)
    ),
  );
}

export function isChapterBatchCheckpointRow(
  row: ChapterBatchCheckpointRow | {
    title?: string | null;
    novelId?: string | null;
    status?: string | null;
    checkpointType?: string | null;
    currentItemLabel?: string | null;
    checkpointSummary?: string | null;
    resumeTargetJson?: string | null;
    seedPayloadJson?: string | null;
    lastError?: string | null;
    finishedAt?: Date | null;
    milestonesJson?: string | null;
  } | null,
): row is ChapterBatchCheckpointRow {
  return Boolean(
    row
    && typeof row.title === "string"
    && typeof row.status === "string"
    && Object.prototype.hasOwnProperty.call(row, "resumeTargetJson")
    && Object.prototype.hasOwnProperty.call(row, "seedPayloadJson")
    && Object.prototype.hasOwnProperty.call(row, "finishedAt")
    && Object.prototype.hasOwnProperty.call(row, "milestonesJson"),
  );
}

export function mapStageToTab(stage: NovelWorkflowStage): NovelWorkflowResumeTarget["stage"] {
  if (stage === "story_macro") return "story_macro";
  if (stage === "character_setup") return "character";
  if (stage === "volume_strategy") return "outline";
  if (stage === "structured_outline") return "structured";
  if (stage === "chapter_execution") return "chapter";
  if (stage === "quality_repair") return "pipeline";
  return "basic";
}

export function defaultProgressForStage(stage: NovelWorkflowStage): number {
  return NOVEL_WORKFLOW_STAGE_PROGRESS[stage] ?? 0.08;
}

export function stageLabel(stage: NovelWorkflowStage): string {
  return NOVEL_WORKFLOW_STAGE_LABELS[stage] ?? stage;
}

// i18n-ignore: lookup map keys — translated at runtime via getI18nServerHandle
const CHECKPOINT_ITEM_LABELS: Record<string, string> = {
  candidate_selection_required: "workflowExplainability.checkpointStatus.candidateSelectionRequired",
  book_contract_ready: "workflowExplainability.checkpointStatus.bookContractReady",
  character_setup_required: "workflowExplainability.checkpointStatus.characterSetupRequired",
};

export function checkpointItemLabel(checkpoint: string): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getI18nServerHandle } = require("../../../i18n") as { getI18nServerHandle: () => { t: (ns: string, key: string, opts?: Record<string, unknown>) => string } | null };
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getCurrentRequestLocale } = require("../../../runtime/requestLocaleContext") as { getCurrentRequestLocale: () => string | null };
  const handle = getI18nServerHandle();
  const locale = getCurrentRequestLocale() ?? "zh-CN";
  const key = CHECKPOINT_ITEM_LABELS[checkpoint];
  if (handle && key) {
    const result = handle.t("serverLogs", key, { lng: locale });
    if (result && result !== `serverLogs:${key}`) return result;
  }
  return checkpoint;
}

export function isTaskCancellationRequested(row: {
  status?: string | null;
  cancelRequestedAt?: Date | null;
} | null | undefined): boolean {
  return Boolean(row && (row.status === "cancelled" || row.cancelRequestedAt));
}

export function isStructuredOutlineItemKey(itemKey: string | null | undefined): boolean {
  return itemKey === "beat_sheet"
    || itemKey === "chapter_list"
    || itemKey === "chapter_sync"
    || itemKey === "chapter_detail_bundle";
}

export function parseRuntimeGateReason(policyDecisionJson: string | null | undefined): string | null {
  if (!policyDecisionJson?.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(policyDecisionJson) as { reason?: unknown };
    return typeof parsed.reason === "string" && parsed.reason.trim() ? parsed.reason.trim() : null;
  } catch {
    return null;
  }
}

export function isHistoricalAutoDirectorRecoveryNotNeededFailure(input: {
  lane?: string | null;
  status?: string | null;
  checkpointType?: string | null;
  lastError?: string | null;
}): boolean {
  if (input.lane !== "auto_director" || input.status !== "failed" || !input.checkpointType) {
    return false;
  }
  const message = input.lastError?.trim() ?? "";
  return message.includes("当前导演产物已经完整") && message.includes("无需继续自动导演");
}

export function isHistoricalAutoDirectorFront10RecoveryUnsupportedFailure(input: {
  lane?: string | null;
  status?: string | null;
  lastError?: string | null;
}): boolean {
  if (input.lane !== "auto_director" || input.status !== "failed") {
    return false;
  }
  const message = input.lastError?.trim() ?? "";
  return message.includes("服务重启后恢复失败")
    && message.includes("当前检查点不支持继续自动导演");
}

/**
 * Sanitize task error message before storing in DB.
 * Prevents LLM-generated content (novel text, JSON fragments) from leaking into error fields.
 */
export function sanitizeTaskErrorMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;

  // If message is very long (>500 chars), it's likely novel content leaked in — truncate
  if (trimmed.length > 500) {
    return trimmed.slice(0, 497) + "...";
  }

  // If message contains high ratio of CJK characters but no common error keywords,
  // it may be novel content — replace with generic error
  const cjkCount = (trimmed.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/g) ?? []).length;
  const cjkRatio = cjkCount / trimmed.length;
  const hasErrorKeywords = /错误|失败|异常|超时|连接|模型|网络|格式|解析|timeout|error|fail|invalid|missing/i.test(trimmed);

  if (cjkRatio > 0.6 && !hasErrorKeywords && trimmed.length > 50) {
    // Looks like novel content, not an error message
    return trimmed.slice(0, 100) + "...（内容已截断）";
  }

  return trimmed;
}
