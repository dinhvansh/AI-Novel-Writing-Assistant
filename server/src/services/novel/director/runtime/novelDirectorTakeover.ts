import type {
  BookSpec,
  DirectorCandidate,
  DirectorConfirmRequest,
  DirectorProjectContextInput,
  DirectorRunMode,
  DirectorTakeoverEntryReadiness,
  DirectorTakeoverEntryStep,
  DirectorTakeoverExecutableRangeSnapshot,
  DirectorTakeoverPipelineJobSnapshot,
  DirectorTakeoverPreview,
  DirectorTakeoverReadinessResponse,
  DirectorTakeoverStageReadiness,
  DirectorTakeoverStartPhase,
  DirectorTakeoverStrategy,
  DirectorTakeoverCheckpointSnapshot,
} from "@ai-novel/shared/types/novelDirector";
import type { NovelWorkflowStage, BookContract } from "@ai-novel/shared/types/novelWorkflow";
import type { StoryMacroPlan } from "@ai-novel/shared/types/storyMacro";
import { DIRECTOR_TAKEOVER_ENTRY_STEPS } from "@ai-novel/shared/types/novelDirector";
import { normalizeDirectorTargetChapterCount } from "./novelDirectorHelpers";
import { DEFAULT_LOCALE } from "@ai-novel/shared/localization";
import { getI18nServerHandle } from "../../../../i18n";
import { getCurrentRequestLocale } from "../../../../runtime/requestLocaleContext";

export interface DirectorTakeoverNovelContext extends Omit<DirectorProjectContextInput, "description"> {
  id: string;
  title: string;
  description?: string | null;
  commercialTags: string[];
}

export interface DirectorTakeoverAssetSnapshot {
  hasStoryMacroPlan: boolean;
  hasBookContract: boolean;
  characterCount: number;
  chapterCount: number;
  plannedChapterCount?: number | null;
  volumeCount: number;
  hasVolumeStrategyPlan?: boolean;
  firstVolumeId: string | null;
  firstVolumeChapterCount: number;
  volumeChapterRanges?: Array<{
    volumeOrder: number;
    startOrder: number;
    endOrder: number;
  }>;
  structuredOutlineChapterOrders?: number[];
  firstVolumeBeatSheetReady?: boolean;
  firstVolumePreparedChapterCount?: number;
  structuredOutlineRecoveryStep?: "beat_sheet" | "chapter_list" | "chapter_detail_bundle" | "chapter_sync" | "completed" | null;
  generatedChapterCount?: number;
  approvedChapterCount?: number;
  pendingRepairChapterCount?: number;
}

export interface DirectorTakeoverDecisionInput {
  entryStep: DirectorTakeoverEntryStep;
  strategy: DirectorTakeoverStrategy;
  snapshot: DirectorTakeoverAssetSnapshot;
  activePipelineJob?: DirectorTakeoverPipelineJobSnapshot | null;
  latestCheckpoint?: DirectorTakeoverCheckpointSnapshot | null;
  executableRange?: DirectorTakeoverExecutableRangeSnapshot | null;
}

export interface DirectorTakeoverResolvedPlan {
  entryStep: DirectorTakeoverEntryStep;
  strategy: DirectorTakeoverStrategy;
  effectiveStep: DirectorTakeoverEntryStep;
  effectiveStage: NovelWorkflowStage;
  startPhase: DirectorTakeoverStartPhase;
  resumeStage: "basic" | "story_macro" | "character" | "outline" | "structured" | "chapter" | "pipeline";
  skipSteps: DirectorTakeoverEntryStep[];
  summary: string;
  effectSummary: string;
  impactNotes: string[];
  usesCurrentBatch: boolean;
  currentStep?: DirectorTakeoverEntryStep | null;
  restartStep?: DirectorTakeoverEntryStep | null;
  executionMode: "phase" | "auto_execution";
  phase?: DirectorTakeoverStartPhase;
  resumeCheckpointType?: "chapter_batch_ready" | "replan_required" | null;
}

function getTakeoverStageMeta(phase: DirectorTakeoverStartPhase): Pick<DirectorTakeoverStageReadiness, "label" | "description"> {
  const handle = getI18nServerHandle();
  const locale = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
  function t(key: string): string {
    if (handle) {
      const result = handle.t("serverLogs", key, { lng: locale });
      if (result && result !== `serverLogs:${key}`) return result;
    }
    return key;
  }
  // i18n-ignore: fallback map keys
  const fallbacks: Record<DirectorTakeoverStartPhase, { label: string; description: string }> = {
    story_macro: { label: "\u4ece\u6545\u4e8b\u5b8f\u89c2\u89c4\u5212\u5f00\u59cb", description: "\u5148\u8865\u9f50 Story Macro \u548c Book Contract\uff0c\u518d\u7ee7\u7eed\u89d2\u8272\u3001\u5377\u6218\u7565\u548c\u62c6\u7ae0\u3002" },
    character_setup: { label: "\u4ece\u89d2\u8272\u51c6\u5907\u5f00\u59cb", description: "\u6cbf\u7528\u5df2\u6709\u4e66\u7ea7\u65b9\u5411\uff0c\u53ea\u8ba9 AI \u63a5\u624b\u89d2\u8272\u9635\u5bb9\u548c\u540e\u7eed\u89c4\u5212\u3002" },
    volume_strategy: { label: "\u4ece\u5377\u6218\u7565\u5f00\u59cb", description: "\u6cbf\u7528\u73b0\u6709\u4e66\u7ea7\u65b9\u5411\u548c\u89d2\u8272\uff0c\u7ee7\u7eed\u751f\u6210\u5377\u6218\u7565\u4e0e\u5377\u9aa8\u67b6\u3002" },
    structured_outline: { label: "\u4ece\u8282\u594f / \u62c6\u7ae0\u5f00\u59cb", description: "\u6cbf\u7528\u73b0\u6709\u5377\u89c4\u5212\uff0c\u7ee7\u7eed\u751f\u6210\u8282\u594f\u677f\u3001\u7ae0\u8282\u5217\u8868\u548c\u7ae0\u8282\u7ec6\u5316\u3002" },
  };
  const labelKey = `takeoverStage.${phase}.label`;
  const descKey = `takeoverStage.${phase}.description`;
  const label = t(labelKey) !== labelKey ? t(labelKey) : fallbacks[phase].label;
  const description = t(descKey) !== descKey ? t(descKey) : fallbacks[phase].description;
  return { label, description };
}

function getTakeoverEntryMeta(step: DirectorTakeoverEntryStep): { label: string; description: string } {
  const handle = getI18nServerHandle();
  const locale = getCurrentRequestLocale() ?? DEFAULT_LOCALE;

  function t(key: string): string {
    if (handle) {
      const result = handle.t("serverLogs", key, { lng: locale });
      if (result && result !== `serverLogs:${key}`) return result;
    }
    return key;
  }

  // i18n-ignore: fallback map keys
  const fallbacks: Record<DirectorTakeoverEntryStep, { label: string; description: string }> = {
    basic: { label: "\u9879\u76ee\u8bbe\u5b9a", description: "\u4ece\u73b0\u6709\u9879\u76ee\u57fa\u7840\u4fe1\u606f\u7ee7\u7eed\u63a5\u7ba1\uff0c\u4f18\u5148\u8865\u6700\u65e9\u7f3a\u5931\u7684\u5bfc\u6f14\u524d\u7f6e\u8d44\u4ea7\u3002" },
    story_macro: { label: "\u6545\u4e8b\u5b8f\u89c2\u89c4\u5212", description: "\u56f4\u7ed5 Story Macro \u548c Book Contract \u7ee7\u7eed\u6216\u91cd\u8dd1\u4e66\u7ea7\u89c4\u5212\u3002" },
    character: { label: "\u89d2\u8272\u51c6\u5907", description: "\u56f4\u7ed5\u89d2\u8272\u9635\u5bb9\u4e0e\u5e94\u7528\u7ee7\u7eed\u6216\u91cd\u8dd1\u5f53\u524d\u6b65\u9aa4\u3002" },
    outline: { label: "\u5377\u6218\u7565", description: "\u56f4\u7ed5\u5377\u6218\u7565\u4e0e\u5377\u9aa8\u67b6\u7ee7\u7eed\u6216\u91cd\u8dd1\u5f53\u524d\u6b65\u9aa4\u3002" },
    structured: { label: "\u8282\u594f / \u62c6\u7ae0", description: "\u56f4\u7ed5\u5f53\u524d\u5377\u8282\u594f\u677f\u3001\u7ae0\u8282\u5217\u8868\u548c\u7ec6\u5316\u8d44\u6e90\u7ee7\u7eed\u6216\u91cd\u8dd1\u5f53\u524d\u6b65\u9aa4\u3002" },
    chapter: { label: "\u7ae0\u8282\u6267\u884c", description: "\u4f18\u5148\u6062\u590d\u5f53\u524d\u7ae0\u8282\u6279\u6b21\u6216\u4ece\u5df2\u51c6\u5907\u8303\u56f4\u7ee7\u7eed\u6267\u884c\u3002" },
    pipeline: { label: "\u8d28\u91cf\u4fee\u590d", description: "\u4f18\u5148\u6062\u590d\u5f53\u524d\u4fee\u590d\u6279\u6b21\uff0c\u6216\u627f\u63a5\u5f85\u4fee\u7ae0\u8282\u7ee7\u7eed\u63a8\u8fdb\u3002" },
  };

  const labelKey = `takeoverEntry.${step}.label`;
  const descKey = `takeoverEntry.${step}.description`;
  const label = t(labelKey) !== labelKey ? t(labelKey) : fallbacks[step].label;
  const description = t(descKey) !== descKey ? t(descKey) : fallbacks[step].description;
  return { label, description };
}

function hasMeaningfulSeedMaterial(novel: DirectorTakeoverNovelContext): boolean {
  return Boolean(
    novel.description?.trim()
    || novel.targetAudience?.trim()
    || novel.bookSellingPoint?.trim()
    || novel.competingFeel?.trim()
    || novel.first30ChapterPromise?.trim()
    || novel.commercialTags.length > 0
    || novel.genreId?.trim()
    || novel.worldId?.trim(),
  );
}

function splitToneKeywords(novel: DirectorTakeoverNovelContext): string[] {
  const raw = [
    novel.styleTone?.trim() ?? "",
    novel.competingFeel?.trim() ?? "",
    ...novel.commercialTags,
  ]
    .filter(Boolean)
    .join("，");
  return Array.from(
    new Set(
      raw
        .split(/[，、|/]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 4);
}

function buildTakeoverIdea(novel: DirectorTakeoverNovelContext): string {
  const lines = [
    novel.description?.trim() ? `故事概述：${novel.description.trim()}` : "",
    novel.title.trim() ? `项目标题：《${novel.title.trim()}》` : "",
    novel.targetAudience?.trim() ? `目标读者：${novel.targetAudience.trim()}` : "",
    novel.bookSellingPoint?.trim() ? `书级卖点：${novel.bookSellingPoint.trim()}` : "",
    novel.competingFeel?.trim() ? `对标气质：${novel.competingFeel.trim()}` : "",
    novel.first30ChapterPromise?.trim() ? `前30章承诺：${novel.first30ChapterPromise.trim()}` : "",
    novel.commercialTags.length > 0 ? `商业标签：${novel.commercialTags.join("、")}` : "",
  ].filter(Boolean);
  return lines.join("\n") || `项目标题：《${novel.title.trim() || "当前项目"}》`;
}

function buildTakeoverCandidate(input: {
  novel: DirectorTakeoverNovelContext;
  storyMacroPlan: StoryMacroPlan | null;
  bookContract: BookContract | null;
}): DirectorCandidate {
  const { novel, storyMacroPlan, bookContract } = input;
  const decomposition = storyMacroPlan?.decomposition ?? null;
  const expansion = storyMacroPlan?.expansion ?? null;
  const workingTitle = novel.title.trim() || "当前项目";
  const sellingPoint = bookContract?.coreSellingPoint?.trim()
    || novel.bookSellingPoint?.trim()
    || decomposition?.selling_point?.trim()
    || "围绕当前项目的核心卖点持续兑现读者回报。";
  const coreConflict = decomposition?.core_conflict?.trim()
    || novel.description?.trim()
    || bookContract?.readingPromise?.trim()
    || "围绕当前项目主线冲突持续推进。";
  const protagonistPath = decomposition?.growth_path?.trim()
    || expansion?.protagonist_core?.trim()
    || bookContract?.protagonistFantasy?.trim()
    || "主角在主线压力中持续成长并完成阶段转变。";
  const hookStrategy = decomposition?.main_hook?.trim()
    || bookContract?.chapter3Payoff?.trim()
    || novel.first30ChapterPromise?.trim()
    || "围绕当前卖点建立前期钩子和阶段回报。";
  const progressionLoop = decomposition?.progression_loop?.trim()
    || bookContract?.escalationLadder?.trim()
    || "目标推进 -> 阻力升级 -> 阶段回报 -> 新问题。";
  const endingDirection = decomposition?.ending_flavor?.trim()
    || bookContract?.relationshipMainline?.trim()
    || "沿当前项目既定气质和主线方向收束。";

  return {
    id: `takeover-${novel.id}`,
    workingTitle,
    logline: novel.description?.trim() || coreConflict,
    positioning: novel.targetAudience?.trim() || sellingPoint,
    sellingPoint,
    coreConflict,
    protagonistPath,
    endingDirection,
    hookStrategy,
    progressionLoop,
    whyItFits: "沿用当前项目已保存的书级信息与既有资产，继续自动导演。",
    toneKeywords: splitToneKeywords(novel),
    targetChapterCount: normalizeDirectorTargetChapterCount(novel.estimatedChapterCount),
  };
}

export function buildDirectorTakeoverInput(input: {
  novel: DirectorTakeoverNovelContext;
  storyMacroPlan: StoryMacroPlan | null;
  bookContract: BookContract | null;
  runMode?: DirectorRunMode;
}): DirectorConfirmRequest {
  return {
    title: input.novel.title.trim(),
    description: input.novel.description?.trim() || undefined,
    targetAudience: input.novel.targetAudience?.trim() || undefined,
    bookSellingPoint: input.novel.bookSellingPoint?.trim() || undefined,
    competingFeel: input.novel.competingFeel?.trim() || undefined,
    first30ChapterPromise: input.novel.first30ChapterPromise?.trim() || undefined,
    commercialTags: input.novel.commercialTags.length > 0 ? input.novel.commercialTags : undefined,
    genreId: input.novel.genreId?.trim() || undefined,
    primaryStoryModeId: input.novel.primaryStoryModeId?.trim() || undefined,
    secondaryStoryModeId: input.novel.secondaryStoryModeId?.trim() || undefined,
    worldId: input.novel.worldId?.trim() || undefined,
    writingMode: input.novel.writingMode,
    projectMode: input.novel.projectMode,
    narrativePov: input.novel.narrativePov,
    pacePreference: input.novel.pacePreference,
    styleTone: input.novel.styleTone?.trim() || undefined,
    emotionIntensity: input.novel.emotionIntensity,
    aiFreedom: input.novel.aiFreedom,
    postGenerationStyleReviewEnabled: input.novel.postGenerationStyleReviewEnabled,
    defaultChapterLength: input.novel.defaultChapterLength,
    estimatedChapterCount: input.novel.estimatedChapterCount ?? undefined,
    projectStatus: input.novel.projectStatus,
    storylineStatus: input.novel.storylineStatus,
    outlineStatus: input.novel.outlineStatus,
    resourceReadyScore: input.novel.resourceReadyScore,
    sourceNovelId: input.novel.sourceNovelId ?? undefined,
    sourceKnowledgeDocumentId: input.novel.sourceKnowledgeDocumentId ?? undefined,
    continuationBookAnalysisId: input.novel.continuationBookAnalysisId ?? undefined,
    continuationBookAnalysisSections: input.novel.continuationBookAnalysisSections ?? undefined,
    idea: buildTakeoverIdea(input.novel),
    candidate: buildTakeoverCandidate({
      novel: input.novel,
      storyMacroPlan: input.storyMacroPlan,
      bookContract: input.bookContract,
    }),
    runMode: input.runMode,
  };
}

function isStoryMacroReady(snapshot: DirectorTakeoverAssetSnapshot): boolean {
  return snapshot.hasStoryMacroPlan && snapshot.hasBookContract;
}

function isCharacterReady(snapshot: DirectorTakeoverAssetSnapshot): boolean {
  return snapshot.characterCount > 0;
}

function isOutlineReady(snapshot: DirectorTakeoverAssetSnapshot): boolean {
  return snapshot.volumeCount > 0 && Boolean(snapshot.hasVolumeStrategyPlan);
}

export function isTakeoverStructuredOutlineReadyForValidation(snapshot: Pick<DirectorTakeoverAssetSnapshot, "structuredOutlineRecoveryStep">): boolean {
  return snapshot.structuredOutlineRecoveryStep === "chapter_sync"
    || snapshot.structuredOutlineRecoveryStep === "completed";
}

function isStructuredReady(snapshot: DirectorTakeoverAssetSnapshot): boolean {
  return isTakeoverStructuredOutlineReadyForValidation(snapshot);
}

function isStructuredSyncPending(snapshot: DirectorTakeoverAssetSnapshot): boolean {
  return snapshot.structuredOutlineRecoveryStep === "chapter_sync";
}

function hasAnyStructuredAsset(snapshot: DirectorTakeoverAssetSnapshot): boolean {
  return Boolean(snapshot.firstVolumeBeatSheetReady)
    || snapshot.firstVolumeChapterCount > 0
    || (snapshot.firstVolumePreparedChapterCount ?? 0) > 0;
}

function hasExecutableRange(input: {
  snapshot: DirectorTakeoverAssetSnapshot;
  executableRange?: DirectorTakeoverExecutableRangeSnapshot | null;
  latestCheckpoint?: DirectorTakeoverCheckpointSnapshot | null;
  activePipelineJob?: DirectorTakeoverPipelineJobSnapshot | null;
}): boolean {
  return Boolean(
    input.executableRange
    || input.activePipelineJob,
  );
}

function isRepairingPipelineJob(job: DirectorTakeoverPipelineJobSnapshot | null | undefined): boolean {
  if (!job?.currentStage) {
    return false;
  }
  return job.currentStage === "reviewing" || job.currentStage === "repairing";
}

function hasPendingRepairContext(input: {
  snapshot: DirectorTakeoverAssetSnapshot;
  activePipelineJob?: DirectorTakeoverPipelineJobSnapshot | null;
  latestCheckpoint?: DirectorTakeoverCheckpointSnapshot | null;
}): boolean {
  return Boolean(
    isRepairingPipelineJob(input.activePipelineJob)
    || input.latestCheckpoint?.checkpointType === "chapter_batch_ready"
    || input.latestCheckpoint?.checkpointType === "replan_required"
    || (input.snapshot.pendingRepairChapterCount ?? 0) > 0,
  );
}

function phaseToEntryStep(phase: DirectorTakeoverStartPhase): DirectorTakeoverEntryStep {
  if (phase === "story_macro") return "story_macro";
  if (phase === "character_setup") return "character";
  if (phase === "volume_strategy") return "outline";
  return "structured";
}

function entryStepToLegacyStartPhase(step: DirectorTakeoverEntryStep): DirectorTakeoverStartPhase {
  if (step === "story_macro" || step === "basic") return "story_macro";
  if (step === "character") return "character_setup";
  if (step === "outline") return "volume_strategy";
  return "structured_outline";
}

function entryStepToWorkflowStage(step: DirectorTakeoverEntryStep): NovelWorkflowStage {
  if (step === "story_macro" || step === "basic") return "story_macro";
  if (step === "character") return "character_setup";
  if (step === "outline") return "volume_strategy";
  if (step === "structured") return "structured_outline";
  if (step === "chapter") return "chapter_execution";
  return "quality_repair";
}

function buildSkipSteps(from: DirectorTakeoverEntryStep, to: DirectorTakeoverEntryStep): DirectorTakeoverEntryStep[] {
  const fromIndex = DIRECTOR_TAKEOVER_ENTRY_STEPS.indexOf(from);
  const toIndex = DIRECTOR_TAKEOVER_ENTRY_STEPS.indexOf(to);
  if (fromIndex < 0 || toIndex < 0 || toIndex <= fromIndex) {
    return [];
  }
  return DIRECTOR_TAKEOVER_ENTRY_STEPS.slice(fromIndex, toIndex).filter((step) => step !== to);
}

function resolveExecutionContinuationStep(input: {
  snapshot: DirectorTakeoverAssetSnapshot;
  activePipelineJob?: DirectorTakeoverPipelineJobSnapshot | null;
  latestCheckpoint?: DirectorTakeoverCheckpointSnapshot | null;
  executableRange?: DirectorTakeoverExecutableRangeSnapshot | null;
  preferPipeline: boolean;
}): DirectorTakeoverEntryStep | null {
  const executable = hasExecutableRange(input);
  if (!executable) {
    return null;
  }
  const pendingRepair = hasPendingRepairContext(input);
  if (pendingRepair) {
    return "pipeline";
  }
  if (input.preferPipeline) {
    return "chapter";
  }
  return "chapter";
}

function resolveContinueTargetStep(input: {
  entryStep: DirectorTakeoverEntryStep;
  selectedEntryStep?: DirectorTakeoverEntryStep;
  snapshot: DirectorTakeoverAssetSnapshot;
  activePipelineJob?: DirectorTakeoverPipelineJobSnapshot | null;
  latestCheckpoint?: DirectorTakeoverCheckpointSnapshot | null;
  executableRange?: DirectorTakeoverExecutableRangeSnapshot | null;
}): DirectorTakeoverEntryStep {
  const storyReady = isStoryMacroReady(input.snapshot);
  const characterReady = isCharacterReady(input.snapshot);
  const outlineReady = isOutlineReady(input.snapshot);
  const structuredExecutionReady = hasExecutableRange(input);

  if (input.entryStep === "basic") {
    if (!storyReady) return "story_macro";
    if (!characterReady) return "character";
    if (!outlineReady) return "outline";
    if (!structuredExecutionReady) return "structured";
    return resolveExecutionContinuationStep({
      ...input,
      preferPipeline: false,
    }) ?? "structured";
  }
  if (input.entryStep === "story_macro") {
    if (!storyReady) return "story_macro";
    return resolveContinueTargetStep({ ...input, selectedEntryStep: input.selectedEntryStep ?? input.entryStep, entryStep: "character" });
  }
  if (input.entryStep === "character") {
    if (!characterReady) return "character";
    return resolveContinueTargetStep({ ...input, selectedEntryStep: input.selectedEntryStep ?? input.entryStep, entryStep: "outline" });
  }
  if (input.entryStep === "outline") {
    if (!outlineReady) return "outline";
    return resolveContinueTargetStep({ ...input, selectedEntryStep: input.selectedEntryStep ?? input.entryStep, entryStep: "structured" });
  }
  if (input.entryStep === "structured") {
    if ((input.selectedEntryStep ?? input.entryStep) === "structured") return "structured";
    if (!structuredExecutionReady) return "structured";
    return resolveExecutionContinuationStep({
      ...input,
      preferPipeline: false,
    }) ?? "structured";
  }
  if (input.entryStep === "chapter") {
    return resolveExecutionContinuationStep({
      ...input,
      preferPipeline: false,
    }) ?? "structured";
  }
  return resolveExecutionContinuationStep({
    ...input,
    preferPipeline: true,
  }) ?? "structured";
}

function buildPhasePlan(input: {
  entryStep: DirectorTakeoverEntryStep;
  strategy: DirectorTakeoverStrategy;
  effectiveStep: Extract<DirectorTakeoverEntryStep, "story_macro" | "character" | "outline" | "structured">;
  summary: string;
  effectSummary: string;
  impactNotes: string[];
}): DirectorTakeoverResolvedPlan {
  const startPhase = entryStepToLegacyStartPhase(input.effectiveStep);
  return {
    entryStep: input.entryStep,
    strategy: input.strategy,
    effectiveStep: input.effectiveStep,
    effectiveStage: entryStepToWorkflowStage(input.effectiveStep),
    startPhase,
    phase: startPhase,
    resumeStage: input.effectiveStep,
    skipSteps: buildSkipSteps(input.entryStep, input.effectiveStep),
    summary: input.summary,
    effectSummary: input.effectSummary,
    impactNotes: input.impactNotes,
    usesCurrentBatch: false,
    currentStep: input.strategy === "continue_existing" ? input.effectiveStep : null,
    restartStep: input.strategy === "restart_current_step" ? input.effectiveStep : null,
    executionMode: "phase",
    resumeCheckpointType: null,
  };
}

function buildAutoExecutionPlan(input: {
  entryStep: DirectorTakeoverEntryStep;
  strategy: DirectorTakeoverStrategy;
  effectiveStep: "chapter" | "pipeline";
  usesCurrentBatch: boolean;
  summary: string;
  effectSummary: string;
  impactNotes: string[];
  latestCheckpoint?: DirectorTakeoverCheckpointSnapshot | null;
}): DirectorTakeoverResolvedPlan {
  const effectiveStage = input.effectiveStep === "pipeline" ? "quality_repair" : "chapter_execution";
  return {
    entryStep: input.entryStep,
    strategy: input.strategy,
    effectiveStep: input.effectiveStep,
    effectiveStage,
    startPhase: "structured_outline",
    resumeStage: input.effectiveStep,
    skipSteps: buildSkipSteps(input.entryStep, input.effectiveStep),
    summary: input.summary,
    effectSummary: input.effectSummary,
    impactNotes: input.impactNotes,
    usesCurrentBatch: input.usesCurrentBatch,
    currentStep: input.strategy === "continue_existing" ? input.effectiveStep : null,
    restartStep: input.strategy === "restart_current_step" ? input.entryStep : null,
    executionMode: "auto_execution",
    resumeCheckpointType: input.latestCheckpoint?.checkpointType ?? null,
  };
}

export function resolveDirectorTakeoverPlan(input: DirectorTakeoverDecisionInput): DirectorTakeoverResolvedPlan {
  const storyReady = isStoryMacroReady(input.snapshot);
  const characterReady = isCharacterReady(input.snapshot);
  const outlineReady = isOutlineReady(input.snapshot);
  const executable = hasExecutableRange(input);
  const pendingRepair = hasPendingRepairContext(input);

  if (input.strategy === "continue_existing") {
    const effectiveStep = resolveContinueTargetStep(input);
    if (effectiveStep === "story_macro") {
      return buildPhasePlan({
        entryStep: input.entryStep,
        strategy: input.strategy,
        effectiveStep,
        summary: "继续已有进度，先补齐故事宏观规划。",
        effectSummary: "会复用当前基础信息，只补缺失的 Story Macro 与 Book Contract。",
        impactNotes: ["不会清空已有章节与正文。"],
      });
    }
    if (effectiveStep === "character") {
      return buildPhasePlan({
        entryStep: input.entryStep,
        strategy: input.strategy,
        effectiveStep,
        summary: "继续已有进度，接着补角色准备。",
        effectSummary: "会复用已完成的书级规划，只补角色阵容与角色应用。",
        impactNotes: ["不会重跑已存在的 Story Macro / Book Contract。"],
      });
    }
    if (effectiveStep === "outline") {
      return buildPhasePlan({
        entryStep: input.entryStep,
        strategy: input.strategy,
        effectiveStep,
        summary: "继续已有进度，接着补卷战略。",
        effectSummary: "会复用现有书级规划与角色资产，只补卷战略和卷骨架。",
        impactNotes: ["不会清空已存在的角色与正文。"],
      });
    }
    if (effectiveStep === "structured") {
      return buildPhasePlan({
        entryStep: input.entryStep,
        strategy: input.strategy,
        effectiveStep,
        summary: "继续已有进度，接着补节奏 / 拆章。",
        effectSummary: "会复用已完成的卷战略，只补当前卷节奏板、章节列表、章节细化或同步步骤。",
        impactNotes: ["保留已有正文，不会批量删章节。"],
      });
    }
    if (!executable) {
      throw new Error("当前还没有可继续的章节执行范围，请先补齐节奏 / 拆章资源。");
    }
    if (effectiveStep === "pipeline") {
      return buildAutoExecutionPlan({
        entryStep: input.entryStep,
        strategy: input.strategy,
        effectiveStep,
        usesCurrentBatch: true,
        latestCheckpoint: input.latestCheckpoint,
        summary: "继续已有进度，优先恢复当前质量修复批次。",
        effectSummary: "会优先恢复当前修复中的批次或待修章节，不会新开一条重复任务。",
        impactNotes: ["保留现有正文与规划资产。", "只会跳过已正式通过的章节。"],
      });
    }
    return buildAutoExecutionPlan({
      entryStep: input.entryStep,
      strategy: input.strategy,
      effectiveStep: "chapter",
      usesCurrentBatch: executable,
      latestCheckpoint: input.latestCheckpoint,
      summary: "继续已有进度，优先恢复当前章节批次。",
      effectSummary: "会优先恢复活动中的批次、检查点或已准备好的章节范围继续执行。",
      impactNotes: ["不会清空已有正文。", "只会跳过 approved / published 的章节。"],
    });
  }

  if (input.entryStep === "basic" || input.entryStep === "story_macro") {
    return buildPhasePlan({
      entryStep: input.entryStep,
      strategy: input.strategy,
      effectiveStep: "story_macro",
      summary: "重新生成当前步，从故事宏观规划重跑。",
      effectSummary: "会先清空 Story Macro 与 Book Contract，再从故事宏观规划重跑。",
      impactNotes: ["会刷新当前书级规划资产。", "不会删除已写正文。"],
    });
  }
  if (input.entryStep === "character") {
    if (!storyReady) {
      throw new Error("当前缺少 Story Macro 或 Book Contract，不能直接从角色准备重跑。");
    }
    return buildPhasePlan({
      entryStep: input.entryStep,
      strategy: input.strategy,
      effectiveStep: "character",
      summary: "重新生成当前步，从角色准备重跑。",
      effectSummary: "会先清空当前角色阵容、关系和角色准备候选，再重跑角色准备。",
      impactNotes: ["保留前置书级规划。", "不会清空已有正文。"],
    });
  }
  if (input.entryStep === "outline") {
    if (!storyReady || !characterReady) {
      throw new Error("当前前置资产不足，不能直接从卷战略重跑。");
    }
    return buildPhasePlan({
      entryStep: input.entryStep,
      strategy: input.strategy,
      effectiveStep: "outline",
      summary: "重新生成当前步，从卷战略重跑。",
      effectSummary: "会先清空当前卷战略与卷骨架，再从卷战略重跑。",
      impactNotes: ["保留前置书级规划与角色。", "不会清空已有正文。"],
    });
  }
  if (input.entryStep === "structured") {
    if (!storyReady || !characterReady || !outlineReady) {
      throw new Error("当前前置资产不足，不能直接从节奏 / 拆章重跑。");
    }
    return buildPhasePlan({
      entryStep: input.entryStep,
      strategy: input.strategy,
      effectiveStep: "structured",
      summary: "重新生成当前步，从节奏 / 拆章重跑。",
      effectSummary: "会先清空当前卷的节奏板、章节列表和章节细化资源，再重跑这一阶段。",
      impactNotes: ["会清空当前卷尚未开写的拆章产物。", "不会删除已写正文。"],
    });
  }
  if (!executable) {
    throw new Error("当前还没有可执行的章节范围，不能直接新开章节批次。");
  }
  if (input.entryStep === "pipeline" && !pendingRepair && !executable) {
    throw new Error("当前没有可继续的质量修复上下文。");
  }
  return buildAutoExecutionPlan({
    entryStep: input.entryStep,
    strategy: input.strategy,
    effectiveStep: input.entryStep === "pipeline" ? "pipeline" : "chapter",
    usesCurrentBatch: false,
    latestCheckpoint: input.latestCheckpoint,
    summary: input.entryStep === "pipeline" ? "重新生成当前步，清空当前质量修复结果后重跑。" : "重新生成当前步，清空当前章节批次后重跑。",
    effectSummary: input.entryStep === "pipeline"
      ? "会先清空当前质量修复结果与通过状态，再对现有正文重新审校 / 修复。"
      : "会先清空当前章节执行范围的正文草稿、审校状态和派生摘要，再重新生成这一批。",
    impactNotes: input.entryStep === "pipeline"
      ? ["保留当前章节正文。", "会重新进入自动审校与修复。"]
      : ["会清空当前批次正文草稿。", "保留前置规划和章节结构。"],
  });
}

function buildStoryMacroReadiness(
  novel: DirectorTakeoverNovelContext,
): Pick<DirectorTakeoverStageReadiness, "available" | "reason"> {
  if (hasMeaningfulSeedMaterial(novel)) {
    return {
      available: true,
      reason: "当前书级信息已具备，可以从故事宏观规划开始接管。",
    };
  }
  return {
    available: false,
    reason: "请至少补充一句故事概述、书级卖点、对标气质或前30章承诺，再启动自动接管。",
  };
}

function buildCharacterSetupReadiness(
  snapshot: DirectorTakeoverAssetSnapshot,
): Pick<DirectorTakeoverStageReadiness, "available" | "reason"> {
  if (!isStoryMacroReady(snapshot)) {
    return {
      available: false,
      reason: "跳过故事宏观规划前，需要先具备 Story Macro 与 Book Contract。",
    };
  }
  return {
    available: true,
    reason: "书级规划已齐，可以从角色准备继续接管。",
  };
}

function buildVolumeStrategyReadiness(
  snapshot: DirectorTakeoverAssetSnapshot,
): Pick<DirectorTakeoverStageReadiness, "available" | "reason"> {
  if (!isStoryMacroReady(snapshot)) {
    return {
      available: false,
      reason: "跳过前置阶段前，需要先具备 Story Macro 与 Book Contract。",
    };
  }
  if (!isCharacterReady(snapshot)) {
    return {
      available: false,
      reason: "从卷战略开始前，至少需要 1 位已确认角色。",
    };
  }
  return {
    available: true,
    reason: "书级规划和角色资产已齐，可以从卷战略继续。",
  };
}

function buildStructuredOutlineReadiness(
  snapshot: DirectorTakeoverAssetSnapshot,
): Pick<DirectorTakeoverStageReadiness, "available" | "reason"> {
  if (!isStoryMacroReady(snapshot)) {
    return {
      available: false,
      reason: "跳过前置阶段前，需要先具备 Story Macro 与 Book Contract。",
    };
  }
  if (!isCharacterReady(snapshot)) {
    return {
      available: false,
      reason: "从节奏 / 拆章开始前，至少需要 1 位已确认角色。",
    };
  }
  if (!isOutlineReady(snapshot)) {
    return {
      available: false,
      reason: "从节奏 / 拆章开始前，需要先有卷战略 / 卷骨架。",
    };
  }
  return {
    available: true,
    reason: "卷级资产已存在，可以直接从节奏 / 拆章开始继续。",
  };
}

function resolveRecommendedTakeoverPhase(snapshot: DirectorTakeoverAssetSnapshot): DirectorTakeoverStartPhase {
  if (!isStoryMacroReady(snapshot)) {
    return "story_macro";
  }
  if (!isCharacterReady(snapshot)) {
    return "character_setup";
  }
  if (!isOutlineReady(snapshot)) {
    return "volume_strategy";
  }
  return "structured_outline";
}

function buildPreviewOrFallback(input: {
  entryStep: DirectorTakeoverEntryStep;
  strategy: DirectorTakeoverStrategy;
  snapshot: DirectorTakeoverAssetSnapshot;
  activePipelineJob?: DirectorTakeoverPipelineJobSnapshot | null;
  latestCheckpoint?: DirectorTakeoverCheckpointSnapshot | null;
  executableRange?: DirectorTakeoverExecutableRangeSnapshot | null;
}): DirectorTakeoverPreview {
  try {
    const plan = resolveDirectorTakeoverPlan(input);
    return {
      strategy: input.strategy,
      summary: plan.summary,
      effectSummary: plan.effectSummary,
      effectiveStep: plan.effectiveStep,
      effectiveStage: plan.effectiveStage,
      skipSteps: plan.skipSteps,
      continueStep: plan.currentStep ?? null,
      restartStep: plan.restartStep ?? null,
      usesCurrentBatch: plan.usesCurrentBatch,
      impactNotes: plan.impactNotes,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "当前条件下暂时不能从这一步接管。";
    return {
      strategy: input.strategy,
      summary: input.strategy === "continue_existing" ? "当前还不能继续已有进度。" : "当前还不能重跑这一步。",
      effectSummary: message,
      effectiveStep: input.entryStep,
      effectiveStage: entryStepToWorkflowStage(input.entryStep),
      skipSteps: [],
      continueStep: input.strategy === "continue_existing" ? input.entryStep : null,
      restartStep: input.strategy === "restart_current_step" ? input.entryStep : null,
      usesCurrentBatch: false,
      impactNotes: [message],
    };
  }
}

function buildEntryStepStatus(input: {
  step: DirectorTakeoverEntryStep;
  novel: DirectorTakeoverNovelContext;
  snapshot: DirectorTakeoverAssetSnapshot;
  activePipelineJob?: DirectorTakeoverPipelineJobSnapshot | null;
  latestCheckpoint?: DirectorTakeoverCheckpointSnapshot | null;
  executableRange?: DirectorTakeoverExecutableRangeSnapshot | null;
}): DirectorTakeoverEntryReadiness["status"] {
  const { snapshot } = input;
  if (input.step === "basic") {
    return hasMeaningfulSeedMaterial(input.novel) ? "ready" : "missing";
  }
  if (input.step === "story_macro") {
    if (snapshot.hasStoryMacroPlan && snapshot.hasBookContract) return "complete";
    if (snapshot.hasStoryMacroPlan || snapshot.hasBookContract) return "partial";
    return "missing";
  }
  if (input.step === "character") {
    if (!isStoryMacroReady(snapshot)) return "blocked";
    return isCharacterReady(snapshot) ? "complete" : "missing";
  }
  if (input.step === "outline") {
    if (!isStoryMacroReady(snapshot) || !isCharacterReady(snapshot)) return "blocked";
    return isOutlineReady(snapshot) ? "complete" : "missing";
  }
  if (input.step === "structured") {
    if (!isStoryMacroReady(snapshot) || !isCharacterReady(snapshot) || !isOutlineReady(snapshot)) return "blocked";
    if (hasExecutableRange(input)) return "complete";
    if (isStructuredSyncPending(snapshot)) return "partial";
    if (isStructuredReady(snapshot)) return "partial";
    if (hasAnyStructuredAsset(snapshot)) return "partial";
    return "missing";
  }
  if (input.step === "chapter") {
    if (!hasExecutableRange(input)) return "blocked";
    if (input.activePipelineJob) return "partial";
    if (hasExecutableRange(input)) return "ready";
    return "missing";
  }
  if (
    !hasExecutableRange(input)
    && !hasPendingRepairContext(input)
    && (snapshot.approvedChapterCount ?? 0) <= 0
  ) {
    return "blocked";
  }
  if (input.activePipelineJob || hasPendingRepairContext(input)) return "ready";
  if ((snapshot.approvedChapterCount ?? 0) > 0) return "complete";
  return "missing";
}

function buildEntryReason(input: {
  step: DirectorTakeoverEntryStep;
  status: DirectorTakeoverEntryReadiness["status"];
  snapshot: DirectorTakeoverAssetSnapshot;
  latestCheckpoint?: DirectorTakeoverCheckpointSnapshot | null;
  activePipelineJob?: DirectorTakeoverPipelineJobSnapshot | null;
  executableRange?: DirectorTakeoverExecutableRangeSnapshot | null;
}): string {
  if (input.step === "basic") {
    return "会优先检查当前项目已有资产，从最早缺失步骤开始继续。";
  }
  if (input.step === "story_macro") {
    return input.status === "complete"
      ? "Story Macro 与 Book Contract 已具备，继续模式会自动推进到下一缺失步骤。"
      : "当前可以从故事宏观规划开始接管。";
  }
  if (input.step === "character") {
    return input.status === "blocked"
      ? "需要先具备 Story Macro 与 Book Contract，才能直接从角色准备接管。"
      : input.status === "complete"
        ? "角色资产已具备，继续模式会自动推进到下一缺失步骤。"
        : "当前可以从角色准备继续。";
  }
  if (input.step === "outline") {
    return input.status === "blocked"
      ? "需要先具备故事宏观规划与角色资产，才能直接从卷战略接管。"
      : input.status === "complete"
        ? "卷战略资产已具备，继续模式会自动推进到下一缺失步骤。"
        : "当前可以从卷战略继续。";
  }
  if (input.step === "structured") {
    return input.status === "blocked"
      ? "需要先具备卷战略，才能直接从节奏 / 拆章接管。"
      : hasExecutableRange(input)
        ? "当前卷节奏板、章节细化和执行区资源已具备，继续模式会直接转入章节执行。"
        : input.snapshot.structuredOutlineRecoveryStep === "chapter_sync"
          ? "当前卷节奏板和章节细化已具备，但还没同步到章节执行区，继续模式会先完成同步。"
          : input.snapshot.structuredOutlineRecoveryStep === "chapter_detail_bundle"
            ? "当前卷已有部分章节细化资源，继续模式会从未完成的章节细化继续。"
            : input.snapshot.firstVolumeBeatSheetReady
              ? "当前卷已有节奏板或章节列表基础，继续模式会补齐剩余拆章步骤。"
              : "当前可以从节奏 / 拆章继续。";
  }
  if (input.step === "chapter") {
    if (!hasExecutableRange(input)) {
      return "需要先完成节奏 / 拆章同步，把章节资源写入执行区后，才能从章节执行接管。";
    }
    if (input.activePipelineJob) {
      return "检测到活动中的章节批次，继续模式会优先恢复当前批次。";
    }
    if (input.latestCheckpoint?.checkpointType === "chapter_batch_ready" || input.executableRange) {
      return "检测到可执行章节范围，继续模式会按当前范围恢复或续跑。";
    }
    return "当前可以从章节执行接管。";
  }
  if (input.activePipelineJob) {
    return "检测到活动中的质量修复批次，继续模式会优先恢复当前批次。";
  }
  if (input.latestCheckpoint?.checkpointType === "chapter_batch_ready" || input.latestCheckpoint?.checkpointType === "replan_required") {
    return input.latestCheckpoint.checkpointType === "replan_required"
      ? "检测到最近的重规划检查点，继续模式会优先恢复待处理的重规划与后续批次。"
      : "检测到最近的章节批次检查点，继续模式会优先恢复待修章节。";
  }
  return "当前可以从质量修复接管。";
}

export function buildDirectorTakeoverReadiness(input: {
  novel: DirectorTakeoverNovelContext;
  snapshot: DirectorTakeoverAssetSnapshot;
  hasActiveTask: boolean;
  activeTaskId?: string | null;
  activePipelineJob?: DirectorTakeoverPipelineJobSnapshot | null;
  latestCheckpoint?: DirectorTakeoverCheckpointSnapshot | null;
  executableRange?: DirectorTakeoverExecutableRangeSnapshot | null;
}): DirectorTakeoverReadinessResponse {
  const recommendedPhase = resolveRecommendedTakeoverPhase(input.snapshot);
  const recommendedStep = phaseToEntryStep(recommendedPhase);
  const storyMacroReadiness = buildStoryMacroReadiness(input.novel);
  const characterSetupReadiness = buildCharacterSetupReadiness(input.snapshot);
  const volumeStrategyReadiness = buildVolumeStrategyReadiness(input.snapshot);
  const structuredOutlineReadiness = buildStructuredOutlineReadiness(input.snapshot);

  const entrySteps: DirectorTakeoverEntryReadiness[] = DIRECTOR_TAKEOVER_ENTRY_STEPS.map((step) => {
    const status = buildEntryStepStatus({
      step,
      novel: input.novel,
      snapshot: input.snapshot,
      activePipelineJob: input.activePipelineJob,
      latestCheckpoint: input.latestCheckpoint,
      executableRange: input.executableRange,
    });
    const available = status !== "blocked";
    return {
      step,
      label: getTakeoverEntryMeta(step).label,
      description: getTakeoverEntryMeta(step).description,
      available,
      recommended: step === recommendedStep || (step === "chapter" && recommendedStep === "structured" && Boolean(input.executableRange)),
      status,
      reason: buildEntryReason({
        step,
        status,
        snapshot: input.snapshot,
        activePipelineJob: input.activePipelineJob,
        latestCheckpoint: input.latestCheckpoint,
        executableRange: input.executableRange,
      }),
      previews: [
        buildPreviewOrFallback({
          entryStep: step,
          strategy: "continue_existing",
          snapshot: input.snapshot,
          activePipelineJob: input.activePipelineJob,
          latestCheckpoint: input.latestCheckpoint,
          executableRange: input.executableRange,
        }),
        buildPreviewOrFallback({
          entryStep: step,
          strategy: "restart_current_step",
          snapshot: input.snapshot,
          activePipelineJob: input.activePipelineJob,
          latestCheckpoint: input.latestCheckpoint,
          executableRange: input.executableRange,
        }),
      ],
    };
  });

  return {
    novelId: input.novel.id,
    novelTitle: (() => {
      const handle = getI18nServerHandle();
      const locale = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
      const fallback = handle
        ? handle.t("serverLogs", "dashboardStatus.unnamedNovel", { lng: locale })
        : "\u5f53\u524d\u9879\u76ee";
      return input.novel.title.trim() || fallback;
    })(),
    hasActiveTask: input.hasActiveTask,
    activeTaskId: input.activeTaskId ?? null,
    snapshot: {
      ...input.snapshot,
    },
    stages: ([
      ["story_macro", storyMacroReadiness],
      ["character_setup", characterSetupReadiness],
      ["volume_strategy", volumeStrategyReadiness],
      ["structured_outline", structuredOutlineReadiness],
    ] as const).map(([phase, readiness]) => ({
      phase,
      label: getTakeoverStageMeta(phase).label,
      description: getTakeoverStageMeta(phase).description,
      available: readiness.available,
      recommended: readiness.available && phase === recommendedPhase,
      reason: readiness.reason,
    })),
    entrySteps,
    activePipelineJob: input.activePipelineJob ?? null,
    latestCheckpoint: input.latestCheckpoint ?? null,
    executableRange: input.executableRange ?? null,
  };
}

export function assertDirectorTakeoverPhaseAvailable(
  readiness: DirectorTakeoverReadinessResponse,
  phase: DirectorTakeoverStartPhase,
): void {
  const targetStage = readiness.stages.find((item) => item.phase === phase);
  if (!targetStage) {
    throw new Error("当前自动导演接管阶段不存在。");
  }
  if (!targetStage.available) {
    throw new Error(targetStage.reason || "当前项目还不适合从该阶段继续自动导演。");
  }
}

export function buildTakeoverBookSpec(input: {
  novel: DirectorTakeoverNovelContext;
  storyMacroPlan: StoryMacroPlan | null;
  bookContract: BookContract | null;
}): BookSpec {
  const candidate = buildTakeoverCandidate(input);
  const idea = buildTakeoverIdea(input.novel);
  return {
    storyInput: idea,
    positioning: candidate.positioning,
    sellingPoint: candidate.sellingPoint,
    coreConflict: candidate.coreConflict,
    protagonistPath: candidate.protagonistPath,
    endingDirection: candidate.endingDirection,
    hookStrategy: candidate.hookStrategy,
    progressionLoop: candidate.progressionLoop,
    targetChapterCount: candidate.targetChapterCount,
  };
}
