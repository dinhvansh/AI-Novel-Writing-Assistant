import type {
  DirectorTaskSnapshot,
} from "@ai-novel/shared/types/directorRuntime";
import type {
  DirectorAutoExecutionPlan,
  DirectorRunMode,
  DirectorTakeoverEntryReadiness,
  DirectorTakeoverEntryStep,
  DirectorTakeoverPreview,
  DirectorTakeoverReadinessResponse,
  DirectorTakeoverStrategy,
} from "@ai-novel/shared/types/novelDirector";
import type { TFunction } from "i18next";

// Loose translate function type accepted by this module — compatible with i18next TFunction
// but also allows simple fallback implementations in non-React contexts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslateFn = (key: string, opts?: any) => string;

type TakeoverScopeMode = "book" | "chapter_range" | "volume";

export interface TakeoverGuidanceViewModel {
  diagnosis: string;
  nextStep: string;
  protectionNotes: string[];
  riskLevel: "safe" | "caution";
  actionLabel: string;
}

export interface TakeoverProgressCard {
  title: string;
  status: string;
  detail: string;
}

export interface TakeoverProgressInspectionViewModel {
  cards: TakeoverProgressCard[];
  summary: string;
}

export interface TakeoverChapterTargetViewModel {
  startOrder: number;
  maxOrder: number;
  selectedOrder: number;
  plan: DirectorAutoExecutionPlan;
  actionLabel: string;
  summary: string;
}

const ENTRY_STEP_LABEL_KEYS: Record<DirectorTakeoverEntryStep, string> = {
  basic: "novel:takeover.entryStep.basic",
  story_macro: "novel:takeover.entryStep.storyMacro",
  character: "novel:takeover.entryStep.character",
  outline: "novel:takeover.entryStep.outline",
  structured: "novel:takeover.entryStep.structured",
  chapter: "novel:takeover.entryStep.chapter",
  pipeline: "novel:takeover.entryStep.pipeline",
};

const RUN_MODE_ACTION_LABEL_KEYS: Record<DirectorRunMode, string> = {
  auto_to_ready: "novel:takeover.runModeAction.autoToReady",
  auto_to_execution: "novel:takeover.runModeAction.autoToExecution",
  full_book_autopilot: "novel:takeover.runModeAction.fullBookAutopilot",
  stage_review: "novel:takeover.runModeAction.stageReview",
};

export function isTakeoverEntryStepAllowedForScope(
  entryStep: DirectorTakeoverEntryStep,
  scopeMode: TakeoverScopeMode,
): boolean {
  if (scopeMode === "chapter_range") {
    return entryStep === "structured" || entryStep === "chapter" || entryStep === "pipeline";
  }
  if (scopeMode === "volume") {
    return entryStep === "outline" || entryStep === "structured" || entryStep === "chapter" || entryStep === "pipeline";
  }
  return true;
}

export function resolveRecommendedTakeoverEntryStep(
  readiness: DirectorTakeoverReadinessResponse | null,
  scopeMode: TakeoverScopeMode,
): DirectorTakeoverEntryStep | null {
  if (!readiness) {
    return null;
  }
  const allowed = (entry: DirectorTakeoverEntryReadiness) => (
    entry.available && isTakeoverEntryStepAllowedForScope(entry.step, scopeMode)
  );
  return (
    readiness.entrySteps.find((entry) => entry.recommended && allowed(entry))
    ?? readiness.entrySteps.find(allowed)
    ?? null
  )?.step ?? null;
}

export function findTakeoverPreview(
  readiness: DirectorTakeoverReadinessResponse | null,
  entryStep: DirectorTakeoverEntryStep,
  strategy: DirectorTakeoverStrategy,
): DirectorTakeoverPreview | null {
  return readiness?.entrySteps
    .find((entry) => entry.step === entryStep)
    ?.previews.find((preview) => preview.strategy === strategy) ?? null;
}

export function buildTakeoverGuidance(
  readiness: DirectorTakeoverReadinessResponse | null,
  entryStep: DirectorTakeoverEntryStep,
  strategy: DirectorTakeoverStrategy,
  runMode: DirectorRunMode,
  taskSnapshot?: DirectorTaskSnapshot | null,
  t?: TranslateFn,
): TakeoverGuidanceViewModel {
  const _t = t ?? ((key: string) => key);
  const task = taskSnapshot?.task ?? null;
  const chapterProgress = taskSnapshot?.chapterProgress ?? taskSnapshot?.projection?.chapterExecutionProgress ?? null;
  if (task && (task.status === "queued" || task.status === "running" || task.status === "waiting_approval")) {
    const currentStage = task.currentStage?.trim() || taskSnapshot?.displayState.stageLabel || _t("novel:takeover.entryStep.chapter");
    const currentLabel = task.currentItemLabel?.trim() || taskSnapshot?.displayState.currentAction || _t("novel:takeover.guidance.waitingContinue");
    const nextChapterOrder = chapterProgress?.currentChapterOrder ?? chapterProgress?.activeChapterOrder ?? null;
    return {
      diagnosis: _t("novel:takeover.guidance.hasTaskDiagnosis", { stage: currentStage }),
      nextStep: nextChapterOrder
        ? _t("novel:takeover.guidance.hasTaskNextStepChapter", { order: nextChapterOrder })
        : _t("novel:takeover.guidance.hasTaskNextStep", { label: currentLabel }),
      protectionNotes: [
        _t("novel:takeover.guidance.taskStatus", { status: task.status }),
        currentLabel,
        _t("novel:takeover.guidance.continueNoRepeat"),
      ],
      riskLevel: "safe",
      actionLabel: _t("novel:takeover.guidance.enterCurrentTask"),
    };
  }
  if (!readiness) {
    return {
      diagnosis: _t("novel:takeover.guidance.loadingDiagnosis"),
      nextStep: _t("novel:takeover.guidance.loadingNextStep"),
      protectionNotes: [_t("novel:takeover.guidance.defaultProtection")],
      riskLevel: "safe",
      actionLabel: _t(RUN_MODE_ACTION_LABEL_KEYS[runMode] ?? "novel:takeover.guidance.continueAdvancing"),
    };
  }
  const preview = findTakeoverPreview(readiness, entryStep, strategy);
  const entryLabel = _t(ENTRY_STEP_LABEL_KEYS[preview?.effectiveStep ?? entryStep] ?? "novel:takeover.guidance.recommendedPosition");
  const hasCharacters = readiness.snapshot.characterCount > 0;
  const hasVolumes = readiness.snapshot.volumeCount > 0;
  const hasChapters = readiness.snapshot.chapterCount > 0;
  const protectionNotes = [
    hasCharacters
      ? _t("novel:takeover.guidance.protectCharacters", { count: readiness.snapshot.characterCount })
      : _t("novel:takeover.guidance.noCharacters"),
    hasVolumes
      ? _t("novel:takeover.guidance.protectVolumes")
      : _t("novel:takeover.guidance.noVolumes"),
    hasChapters
      ? _t("novel:takeover.guidance.protectChapters", { count: readiness.snapshot.chapterCount })
      : _t("novel:takeover.guidance.noChapters"),
  ];
  const riskLevel = strategy === "restart_current_step" ? "caution" : "safe";
  return {
    diagnosis: _t("novel:takeover.guidance.diagnosis", { label: entryLabel }),
    nextStep: preview?.summary ?? _t("novel:takeover.guidance.nextStep", { label: entryLabel }),
    protectionNotes,
    riskLevel,
    actionLabel: buildPrimaryActionLabel({
      fallback: _t(RUN_MODE_ACTION_LABEL_KEYS[runMode] ?? "novel:takeover.guidance.continueAdvancing"),
      taskSnapshot,
      readiness,
      t: _t,
    }),
  };
}

function formatRatio(done: number, total: number, t?: TranslateFn): string {
  // i18n-ignore: t() fallback strings — used only when t is not provided (non-React contexts)
  const _t = t ?? ((key: string, opts?: Record<string, unknown>) => {
    if (key === "novel:takeover.progress.ratioItems") return `${done} 项`;
    if (key === "novel:takeover.progress.ratioNone") return "暂无";
    if (key === "novel:takeover.progress.ratio") return `${opts?.done} / ${opts?.total}`;
    return key;
  });
  if (total <= 0) {
    return done > 0 ? _t("novel:takeover.progress.ratioItems", { count: done }) : _t("novel:takeover.progress.ratioNone");
  }
  return _t("novel:takeover.progress.ratio", { done, total });
}

function buildPrimaryActionLabel(input: {
  fallback: string;
  taskSnapshot?: DirectorTaskSnapshot | null;
  readiness?: DirectorTakeoverReadinessResponse | null;
  t?: TranslateFn;
}): string {
  const _t = input.t ?? ((key: string) => key);
  const progress = input.taskSnapshot?.chapterProgress
    ?? input.taskSnapshot?.projection?.chapterExecutionProgress
    ?? null;
  if (progress?.currentChapterOrder) {
    return _t("novel:takeover.guidance.continueChapter", { order: progress.currentChapterOrder });
  }
  const drafted = progress?.draftedChapterCount ?? input.readiness?.snapshot.generatedChapterCount ?? 0;
  const approved = progress?.approvedChapterCount ?? input.readiness?.snapshot.approvedChapterCount ?? 0;
  if (drafted > approved) {
    return _t("novel:takeover.guidance.handlePendingChapters");
  }
  if ((input.readiness?.snapshot.chapterCount ?? 0) > 0) {
    return _t("novel:takeover.guidance.continueChapterExecution");
  }
  return input.fallback;
}

function normalizePositiveOrder(value: number | null | undefined): number | null {
  if (!Number.isFinite(value ?? NaN) || !value || value < 1) {
    return null;
  }
  return Math.max(1, Math.round(value));
}

function maxNormalizedOrder(values: Array<number | null | undefined>): number | null {
  const normalized = values
    .map(normalizePositiveOrder)
    .filter((value): value is number => Boolean(value));
  if (normalized.length === 0) {
    return null;
  }
  return Math.max(...normalized);
}

export function buildTakeoverChapterTarget(
  readiness: DirectorTakeoverReadinessResponse | null,
  taskSnapshot?: DirectorTaskSnapshot | null,
  selectedOrder?: number | null,
  t?: TranslateFn,
): TakeoverChapterTargetViewModel | null {
  const progress = taskSnapshot?.chapterProgress
    ?? taskSnapshot?.projection?.chapterExecutionProgress
    ?? null;
  const snapshot = readiness?.snapshot ?? null;
  const writtenChapterCount = maxNormalizedOrder([
    progress?.draftedChapterCount,
    progress?.completedChapters,
    snapshot?.generatedChapterCount,
  ]);
  const startOrder = maxNormalizedOrder([
    progress?.currentChapterOrder
      ?? null,
    progress?.activeChapterOrder
      ?? null,
    readiness?.executableRange?.nextChapterOrder
      ?? null,
    writtenChapterCount ? writtenChapterCount + 1 : null,
    snapshot?.approvedChapterCount ? snapshot.approvedChapterCount + 1 : null,
  ]);
  const totalChapters = maxNormalizedOrder([
    progress?.totalChapters
      ?? null,
    readiness?.executableRange?.endOrder
      ?? null,
    snapshot?.chapterCount
      ?? null,
    snapshot?.firstVolumeChapterCount
      ?? null,
  ]);
  if (!startOrder || !totalChapters || startOrder > totalChapters) {
    return null;
  }
  const normalizedSelected = normalizePositiveOrder(selectedOrder ?? null);
  const selected = normalizedSelected
    ? Math.min(Math.max(normalizedSelected, startOrder), totalChapters)
    : startOrder;
  const plan: DirectorAutoExecutionPlan = {
    mode: "chapter_range",
    startOrder,
    endOrder: selected,
    autoReview: true,
    autoRepair: true,
  };
  // i18n-ignore: t() fallback strings — used only when t is not provided (non-React contexts)
  const _t = t ?? ((key: string, opts?: Record<string, unknown>) => {
    if (key === "novel:takeover.chapterTarget.actionLabel") return `推进至第 ${opts?.order} 章`;
    if (key === "novel:takeover.chapterTarget.summaryFrom") return `从第 ${opts?.start} 章继续推进。`;
    if (key === "novel:takeover.chapterTarget.summaryRange") return `从第 ${opts?.start} 章开始，连续推进到第 ${opts?.end} 章。`;
    return key;
  });
  return {
    startOrder,
    maxOrder: totalChapters,
    selectedOrder: selected,
    plan,
    actionLabel: _t("novel:takeover.chapterTarget.actionLabel", { order: selected }),
    summary: selected === startOrder
      ? _t("novel:takeover.chapterTarget.summaryFrom", { start: startOrder })
      : _t("novel:takeover.chapterTarget.summaryRange", { start: startOrder, end: selected }),
  };
}

export function buildTakeoverProgressInspection(
  readiness: DirectorTakeoverReadinessResponse | null,
  taskSnapshot?: DirectorTaskSnapshot | null,
  t?: TranslateFn,
): TakeoverProgressInspectionViewModel {
  // i18n-ignore: t() fallback strings — used only when t is not provided (non-React contexts)
  const _t = t ?? ((key: string, opts?: Record<string, unknown>) => {
    const fallbacks: Record<string, string> = {
      "novel:takeover.progress.hasVolumeStrategy": "已具备卷战略",
      "novel:takeover.progress.noVolumeStrategy": "待补卷战略",
      "novel:takeover.progress.loadingVolume": "正在读取卷规划。",
      "novel:takeover.progress.noChapterRange": "尚未检测到可执行章节范围。",
      "novel:takeover.progress.noDetailResource": "尚未检测到章节细化资源。",
      "novel:takeover.progress.notStarted": "尚未开始正文生产。",
      "novel:takeover.progress.volumeTitle": "卷规划进度",
      "novel:takeover.progress.syncTitle": "拆章同步进度",
      "novel:takeover.progress.detailTitle": "章节细化进度",
      "novel:takeover.progress.chapterQualityTitle": "正文与质量进度",
    };
    if (key in fallbacks) return fallbacks[key];
    if (key === "novel:takeover.progress.volumeDetail") {
      return `${opts?.volumeCount} 卷；当前卷章节 ${opts?.firstVolumeChapterCount} 章；已拆范围 ${opts?.ranges || "暂无"}`;
    }
    if (key === "novel:takeover.progress.executableRange") {
      return `当前可执行范围 ${opts?.start}-${opts?.end} 章。`;
    }
    if (key === "novel:takeover.progress.detailReady") {
      return `已准备 ${opts?.count} 个章节任务单 / 执行资源。`;
    }
    if (key === "novel:takeover.progress.chapterQualityDetail") {
      return [
        opts?.reviewed ? `已审校 ${opts.reviewed} 章` : "",
        opts?.approved ? `已通过 ${opts.approved} 章` : "",
        opts?.pendingRepair ? `待处理 ${opts.pendingRepair} 章` : "",
        opts?.nextChapterOrder ? `下一章第 ${opts.nextChapterOrder} 章` : "",
      ].filter(Boolean).join("；") || "尚未开始正文生产。";
    }
    if (key === "novel:takeover.progress.taskSummary") {
      return `当前任务：${opts?.stage} / ${opts?.action}`;
    }
    if (key === "novel:takeover.progress.assetSummary") {
      return "以下为当前项目已检测到的资产进度。";
    }
    return key;
  });
  const factSummary = taskSnapshot?.factSummary ?? taskSnapshot?.projection?.factSummary ?? null;
  const outline = factSummary?.outlineFacts ?? null;
  const chapterFacts = factSummary?.chapterExecutionFacts ?? null;
  const repairFacts = factSummary?.repairFacts ?? null;
  const chapterProgress = taskSnapshot?.chapterProgress ?? taskSnapshot?.projection?.chapterExecutionProgress ?? null;
  const snapshot = readiness?.snapshot ?? null;
  const volumeRanges = snapshot?.volumeChapterRanges ?? [];
  const syncedChapterCount = outline?.syncedChapterCount ?? snapshot?.chapterCount ?? 0;
  const plannedChapterCount = outline?.plannedChapterCount ?? snapshot?.chapterCount ?? chapterProgress?.totalChapters ?? 0;
  const selectedChapterCount = outline?.selectedChapterCount ?? readiness?.executableRange?.totalChapterCount ?? 0;
  const detailDone = outline?.completedDetailSteps ?? snapshot?.firstVolumePreparedChapterCount ?? 0;
  const detailTotal = outline?.totalDetailSteps ?? selectedChapterCount;
  const drafted = chapterProgress?.draftedChapterCount ?? chapterFacts?.draftedChapterCount ?? snapshot?.generatedChapterCount ?? 0;
  const approved = chapterProgress?.approvedChapterCount ?? chapterFacts?.approvedChapterCount ?? snapshot?.approvedChapterCount ?? 0;
  const reviewed = chapterFacts?.reviewedChapterCount ?? repairFacts?.reviewedChapterCount ?? 0;
  const pendingRepair = chapterProgress?.needsRepairChapters ?? chapterFacts?.needsRepairChapters ?? snapshot?.pendingRepairChapterCount ?? 0;
  const nextChapterOrder = chapterProgress?.currentChapterOrder ?? readiness?.executableRange?.nextChapterOrder ?? null;

  const cards: TakeoverProgressCard[] = [
    {
      title: _t("novel:takeover.progress.volumeTitle"),
      status: factSummary?.hasVolumeStrategy || (snapshot?.volumeCount ?? 0) > 0 ? _t("novel:takeover.progress.hasVolumeStrategy") : _t("novel:takeover.progress.noVolumeStrategy"),
      detail: snapshot
        ? _t("novel:takeover.progress.volumeDetail", {
            volumeCount: snapshot.volumeCount,
            firstVolumeChapterCount: snapshot.firstVolumeChapterCount,
            ranges: volumeRanges.map((range) => `第${range.startOrder}-${range.endOrder}章`).join("、") || "暂无",
          })
        : _t("novel:takeover.progress.loadingVolume"),
    },
    {
      title: _t("novel:takeover.progress.syncTitle"),
      status: formatRatio(syncedChapterCount, plannedChapterCount, _t),
      detail: selectedChapterCount > 0
        ? _t("novel:takeover.progress.executableRange", {
            start: readiness?.executableRange?.startOrder ?? 1,
            end: readiness?.executableRange?.endOrder ?? selectedChapterCount,
          })
        : _t("novel:takeover.progress.noChapterRange"),
    },
    {
      title: _t("novel:takeover.progress.detailTitle"),
      status: formatRatio(detailDone, detailTotal, _t),
      detail: outline?.chapterDetailReady || detailDone > 0
        ? _t("novel:takeover.progress.detailReady", { count: detailDone })
        : _t("novel:takeover.progress.noDetailResource"),
    },
    {
      title: _t("novel:takeover.progress.chapterQualityTitle"),
      status: formatRatio(drafted, chapterProgress?.totalChapters ?? chapterFacts?.totalChapters ?? plannedChapterCount, _t),
      detail: [
        reviewed > 0 ? _t("novel:takeover.progress.reviewed", { count: reviewed }) : "",
        approved > 0 ? _t("novel:takeover.progress.approved", { count: approved }) : "",
        pendingRepair > 0 ? _t("novel:takeover.progress.pendingRepair", { count: pendingRepair }) : "",
        nextChapterOrder ? _t("novel:takeover.progress.nextChapter", { order: nextChapterOrder }) : "",
      ].filter(Boolean).join("；") || _t("novel:takeover.progress.notStarted"),
    },
  ];

  return {
    cards,
    summary: taskSnapshot?.task
      ? _t("novel:takeover.progress.taskSummary", {
          stage: taskSnapshot.task.currentStage || taskSnapshot.displayState.stageLabel || _t("novel:takeover.guidance.autoDirector"),
          action: taskSnapshot.task.currentItemLabel || taskSnapshot.displayState.currentAction || _t("novel:takeover.guidance.waitingContinue"),
        })
      : _t("novel:takeover.progress.assetSummary"),
  };
}

export function formatTakeoverStartError(error: unknown, t?: TranslateFn): string {
  const _t = t ?? ((key: string) => key);
  const message = error instanceof Error ? error.message : String(error || "");
  if (message.includes("章节范围只能从节奏拆章、章节执行或质量修复开始")) { // i18n-ignore: AI parsing keyword — matches server error message
    return _t("novel:takeover.error.chapterRangeNotReady");
  }
  if (message.includes("当前已有自动导演任务")) { // i18n-ignore: AI parsing keyword — matches server error message
    return _t("novel:takeover.error.alreadyHasTask");
  }
  return message || _t("novel:takeover.startTakeoverFailed");
}
