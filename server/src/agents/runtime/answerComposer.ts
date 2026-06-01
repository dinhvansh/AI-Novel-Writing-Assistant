import { runTextPrompt } from "../../prompting/core/promptRunner";
import { runtimeFallbackAnswerPrompt } from "../../prompting/prompts/agent/runtime.prompts";
import { getI18nServerHandle } from "../../i18n";
import { getCurrentRequestLocale } from "../../runtime/requestLocaleContext";
import { listAgentToolDefinitions } from "../toolRegistry";
import type { StructuredIntent, ToolCall, ToolExecutionContext } from "../types";
import { isRecord, safeJson, type ToolExecutionResult } from "./runtimeHelpers";
import { composeCreateNovelSetupAnswer, composeMissingNovelKickoffAnswer, composeSelectNovelWorkspaceSetupAnswer } from "./novelSetupGuidanceComposer";
import { composeNovelSetupIdeationAnswer } from "./novelSetupIdeationComposer";

/**
 * Translate a key in the `creativeHub.answers` sub-namespace using the
 * current request locale. Falls back to the raw key when the i18n handle
 * is not yet initialised (e.g. during unit tests that don't boot the server).
 */
function ta(key: string, values?: Record<string, unknown>): string {
  const handle = getI18nServerHandle();
  if (!handle) {
    return key;
  }
  const lng = getCurrentRequestLocale();
  return handle.t("creativeHub", `answers.${key}`, { lng, values });
}

const COLLABORATION_FIRST_INTENTS = new Set<StructuredIntent["intent"]>([
  "create_novel",
  "produce_novel",
  "write_chapter",
  "rewrite_chapter",
  "save_chapter_draft",
  "start_pipeline",
  "ideate_novel_setup",
  "general_chat",
  "unknown",
]);

function truncateText(value: string, max = 320): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}
function getSuccessfulOutputs(results: ToolExecutionResult[], tool: ToolCall["tool"]): Record<string, unknown>[] {
  return results
    .filter((item) => item.success && item.tool === tool && item.output)
    .map((item) => item.output as Record<string, unknown>);
}
function getFailedResult(results: ToolExecutionResult[], tool: ToolCall["tool"]): ToolExecutionResult | null {
  return results.find((item) => !item.success && item.tool === tool) ?? null;
}
function buildGroundingFacts(results: ToolExecutionResult[]): string {
  return safeJson(results.map((item) => ({
    tool: item.tool,
    success: item.success,
    summary: item.summary,
    output: item.output
      ? Object.fromEntries(
        Object.entries(item.output).map(([key, value]) => {
          if (typeof value === "string") {
            return [key, truncateText(value, 400)];
          }
          if (Array.isArray(value)) {
            return [key, value.slice(0, 6)];
          }
          return [key, value];
        }),
      )
      : undefined,
  })));
}

function formatMissingInfo(structuredIntent?: StructuredIntent): string[] {
  return (structuredIntent?.missingInfo ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function buildCollaborativeQuestion(structuredIntent?: StructuredIntent): string {
  switch (structuredIntent?.intent) {
    case "produce_novel":
    case "create_novel":
      return ta("collaborative.questions.produceNovel");
    case "write_chapter":
    case "rewrite_chapter":
      return ta("collaborative.questions.writeChapter");
    case "ideate_novel_setup":
      return ta("collaborative.questions.ideateNovelSetup");
    default:
      return ta("collaborative.questions.default");
  }
}

function buildCollaborativeOptions(structuredIntent?: StructuredIntent): string[] {
  switch (structuredIntent?.intent) {
    case "produce_novel":
    case "create_novel":
      return [
        ta("collaborative.options.produceNovel.option1"),
        ta("collaborative.options.produceNovel.option2"),
        ta("collaborative.options.produceNovel.option3"),
      ];
    case "write_chapter":
    case "rewrite_chapter":
      return [
        ta("collaborative.options.writeChapter.option1"),
        ta("collaborative.options.writeChapter.option2"),
        ta("collaborative.options.writeChapter.option3"),
      ];
    case "ideate_novel_setup":
      return [
        ta("collaborative.options.ideateNovelSetup.option1"),
        ta("collaborative.options.ideateNovelSetup.option2"),
        ta("collaborative.options.ideateNovelSetup.option3"),
      ];
    default:
      return [
        ta("collaborative.options.default.option1"),
        ta("collaborative.options.default.option2"),
        ta("collaborative.options.default.option3"),
      ];
  }
}


function composeCollaborativeAnswer(goal: string, structuredIntent?: StructuredIntent): string {
  const missingInfo = formatMissingInfo(structuredIntent);
  const lead = structuredIntent?.intent === "general_chat" || structuredIntent?.intent === "unknown"
    ? ta("collaborative.leadGeneral", { goal })
    : ta("collaborative.leadTask", { goal });
  const collaborationLead = structuredIntent?.interactionMode === "review"
    ? ta("collaborative.modeReview")
    : ta("collaborative.modeCoCreate");

  if ((structuredIntent?.assistantResponse ?? "explain") === "offer_options") {
    const options = buildCollaborativeOptions(structuredIntent)
      .map((item, index) => `${index + 1}. ${item}`)
      .join("\n");
    const missingLine = missingInfo.length > 0
      ? `${ta("collaborative.missingInfoPrefixWant", { items: missingInfo.join(ta("collaborative.separator")) })}\n`
      : "";
    return `${lead}\n${collaborationLead}\n${missingLine}${ta("collaborative.chooseDirection")}\n${options}`;
  }

  const missingLine = missingInfo.length > 0
    ? `${ta("collaborative.missingInfoPrefix", { items: missingInfo.join(ta("collaborative.separator")) })}`
    : "";
  return [lead, collaborationLead, missingLine, buildCollaborativeQuestion(structuredIntent)]
    .filter(Boolean)
    .join("\n");
}

function composeSocialOpeningAnswer(context: Omit<ToolExecutionContext, "runId" | "agentName">): string {
  if (context.novelId) {
    return ta("social.greetingWithNovel");
  }
  return ta("social.greetingGeneral");
}

function composeTitleAnswer(results: ToolExecutionResult[]): string {
  const title = getSuccessfulOutputs(results, "get_novel_context")
    .map((item) => (typeof item.title === "string" ? item.title.trim() : ""))
    .find(Boolean);
  return title ? `《${title}》` : ta("title.notFound");
}

function composeNovelListAnswer(results: ToolExecutionResult[]): string {
  const list = getSuccessfulOutputs(results, "list_novels")[0];
  const items = Array.isArray(list?.items) ? list.items : [];
  const total = typeof list?.total === "number" ? list.total : items.length;
  if (items.length === 0) {
    return ta("novelList.empty");
  }
  const lines = items.slice(0, 8).map((item, index) => {
    const title = typeof item?.title === "string" && item.title.trim() ? item.title.trim() : ta("novelList.unnamedNovel");
    const chapterCount = typeof item?.chapterCount === "number" ? item.chapterCount : null;
    return `${index + 1}. 《${title}》${chapterCount != null ? ta("novelList.chapterCount", { count: chapterCount }) : ""}`;
  });
  return ta("novelList.summary", { total }) + "\n" + lines.join("\n");
}

function composeBaseCharacterListAnswer(results: ToolExecutionResult[]): string {
  const list = getSuccessfulOutputs(results, "list_base_characters")[0];
  const items = Array.isArray(list?.items) ? list.items : [];
  if (items.length === 0) {
    return ta("baseCharacterList.empty");
  }
  const lines = items.slice(0, 8).map((item, index) => {
    const name = typeof item?.name === "string" && item.name.trim() ? item.name.trim() : ta("character.unnamedCharacter");
    const role = typeof item?.role === "string" && item.role.trim() ? item.role.trim() : null;
    const category = typeof item?.category === "string" && item.category.trim() ? item.category.trim() : null;
    const tags = typeof item?.tags === "string" && item.tags.trim() ? item.tags.trim() : null;
    const suffix = [role, category, tags].filter(Boolean).join(" / ");
    return `${index + 1}. ${name}${suffix ? `（${suffix}）` : ""}`;
  });
  return ta("baseCharacterList.summary", { count: items.length }) + "\n" + lines.join("\n");
}

function composeWorldListAnswer(results: ToolExecutionResult[]): string {
  const list = getSuccessfulOutputs(results, "list_worlds")[0];
  const items = Array.isArray(list?.items) ? list.items : [];
  if (items.length === 0) {
    return ta("worldList.empty");
  }
  const lines = items.slice(0, 8).map((item, index) => {
    const name = typeof item?.name === "string" && item.name.trim() ? item.name.trim() : ta("worldList.unnamedWorld");
    const status = typeof item?.status === "string" && item.status.trim() ? item.status.trim() : null;
    return `${index + 1}. ${name}${status ? `（${status}）` : ""}`;
  });
  return ta("worldList.summary", { count: items.length }) + "\n" + lines.join("\n");
}

function composeTaskListAnswer(results: ToolExecutionResult[]): string {
  const list = getSuccessfulOutputs(results, "list_tasks")[0];
  const items = Array.isArray(list?.items) ? list.items : [];
  if (items.length === 0) {
    return ta("taskList.empty");
  }
  const lines = items.slice(0, 8).map((item, index) => {
    const title = typeof item?.title === "string" && item.title.trim() ? item.title.trim() : ta("taskList.unnamedTask");
    const status = typeof item?.status === "string" && item.status.trim() ? item.status.trim() : "unknown";
    const kind = typeof item?.kind === "string" && item.kind.trim() ? item.kind.trim() : null;
    return `${index + 1}. ${title}${kind ? `（${kind}）` : ""} - ${status}`;
  });
  return ta("taskList.summary", { count: items.length }) + "\n" + lines.join("\n");
}

function getFirstSuccessfulOutput(results: ToolExecutionResult[], tool: ToolCall["tool"]): Record<string, unknown> | null {
  return getSuccessfulOutputs(results, tool)[0] ?? null;
}

function composeBindWorldAnswer(
  results: ToolExecutionResult[],
  context: Omit<ToolExecutionContext, "runId" | "agentName">,
): string {
  const bound = getSuccessfulOutputs(results, "bind_world_to_novel")[0];
  if (bound) {
    const summary = typeof bound.summary === "string" ? bound.summary.trim() : "";
    if (summary) {
      return summary;
    }
    const worldName = typeof bound.worldName === "string" ? bound.worldName.trim() : "";
    const novelTitle = typeof bound.novelTitle === "string" ? bound.novelTitle.trim() : "";
    if (worldName && novelTitle) {
      return ta("worldBinding.bound", { worldName, novelTitle });
    }
    return ta("worldBinding.boundGeneric");
  }
  if (!context.novelId) {
    return ta("worldBinding.noContext");
  }
  const failed = getFailedResult(results, "bind_world_to_novel");
  if (failed?.errorCode === "NOT_FOUND") {
    return ta("worldBinding.notFound");
  }
  if (failed?.summary) {
    return failed.summary;
  }
  return ta("worldBinding.failed");
}

function composeUnbindWorldAnswer(
  results: ToolExecutionResult[],
  context: Omit<ToolExecutionContext, "runId" | "agentName">,
): string {
  const unbound = getSuccessfulOutputs(results, "unbind_world_from_novel")[0];
  if (unbound) {
    const summary = typeof unbound.summary === "string" ? unbound.summary.trim() : "";
    if (summary) {
      return summary;
    }
    const novelTitle = typeof unbound.novelTitle === "string" ? unbound.novelTitle.trim() : "";
    const previousWorldName = typeof unbound.previousWorldName === "string" ? unbound.previousWorldName.trim() : "";
    if (novelTitle && previousWorldName) {
      return ta("worldUnbinding.unbound", { previousWorldName, novelTitle });
    }
    if (novelTitle) {
      return ta("worldUnbinding.unboundUpdated", { novelTitle });
    }
    return ta("worldUnbinding.unboundGeneric");
  }
  if (!context.novelId) {
    return ta("worldUnbinding.noContext");
  }
  const failed = getFailedResult(results, "unbind_world_from_novel");
  if (failed?.summary) {
    return failed.summary;
  }
  return ta("worldUnbinding.failed");
}

function composeFactProductionStatusText(status: Record<string, unknown>, fallbackTitle?: string): string {
  const _fallbackTitle = fallbackTitle ?? ta("productionStatus.fallbackTitle");
  const title = typeof status.title === "string" && status.title.trim() ? status.title.trim() : _fallbackTitle;
  const currentStage = typeof status.currentStage === "string" && status.currentStage.trim()
    ? status.currentStage.trim()
    : ta("productionStatus.unknownStage");
  const factProgress = isRecord(status.factProgress) ? status.factProgress : null;
  const targetChapterCount = typeof status.targetChapterCount === "number" ? status.targetChapterCount : null;
  const chapterCount = typeof status.chapterCount === "number" ? status.chapterCount : 0;
  const runtimeStatus = isRecord(status.runtimeStatus) ? status.runtimeStatus : null;
  const runtimeLabel = typeof runtimeStatus?.label === "string" && runtimeStatus.label.trim()
    ? runtimeStatus.label.trim()
    : null;
  const runtimeState = typeof runtimeStatus?.state === "string" ? runtimeStatus.state : null;
  const pipelineStatus = typeof status.pipelineStatus === "string" ? status.pipelineStatus.trim() : null;
  const failureSummary = typeof status.failureSummary === "string" ? status.failureSummary.trim() : "";
  const recoveryHint = typeof status.recoveryHint === "string" ? status.recoveryHint.trim() : "";

  const parts = [ta("productionStatus.factProgress", { title, stage: currentStage })];
  if (factProgress) {
    const planningCompleted = typeof factProgress.planningCompleted === "number" ? factProgress.planningCompleted : null;
    const planningTotal = typeof factProgress.planningTotal === "number" ? factProgress.planningTotal : null;
    const draftedChapterCount = typeof factProgress.draftedChapterCount === "number" ? factProgress.draftedChapterCount : null;
    const reviewedChapterCount = typeof factProgress.reviewedChapterCount === "number" ? factProgress.reviewedChapterCount : null;
    const committedChapterCount = typeof factProgress.committedChapterCount === "number" ? factProgress.committedChapterCount : null;
    const needsRepairChapters = typeof factProgress.needsRepairChapters === "number" ? factProgress.needsRepairChapters : 0;
    if (planningCompleted != null && planningTotal != null) {
      parts.push(ta("productionStatus.planning", { completed: planningCompleted, total: planningTotal }));
    }
    if (draftedChapterCount != null) {
      parts.push(targetChapterCount != null
        ? ta("productionStatus.draftWithTarget", { drafted: draftedChapterCount, target: targetChapterCount })
        : ta("productionStatus.draftOnly", { drafted: draftedChapterCount }));
    } else {
      parts.push(targetChapterCount != null ? ta("productionStatus.chapterDirWithTarget", { count: chapterCount, target: targetChapterCount }) : ta("productionStatus.chapterDirOnly", { count: chapterCount }));
    }
    if (reviewedChapterCount != null && reviewedChapterCount > 0) {
      parts.push(ta("productionStatus.reviewed", { count: reviewedChapterCount }));
    }
    if (committedChapterCount != null && committedChapterCount > 0) {
      parts.push(ta("productionStatus.committed", { count: committedChapterCount }));
    }
    if (needsRepairChapters > 0) {
      parts.push(ta("productionStatus.needsRepair", { count: needsRepairChapters }));
    }
  } else {
    parts.push(targetChapterCount != null ? ta("productionStatus.chapterDirWithTarget", { count: chapterCount, target: targetChapterCount }) : ta("productionStatus.chapterDirOnly", { count: chapterCount }));
  }
  if (runtimeLabel && runtimeState !== "idle") {
    parts.push(ta("productionStatus.runtimeLabel", { label: runtimeLabel }));
  } else if (pipelineStatus) {
    parts.push(ta("productionStatus.pipelineStatus", { status: pipelineStatus }));
  }
  if (failureSummary) {
    parts.push(ta("productionStatus.failureSummary", { summary: failureSummary }));
    parts.push(ta("productionStatus.contentUsable"));
  }
  if (recoveryHint) {
    parts.push(ta("productionStatus.recoveryHint", { hint: recoveryHint }));
  }
  return parts.join("");
}

function composeProgressAnswer(results: ToolExecutionResult[]): string {
  const productionStatus = getFirstSuccessfulOutput(results, "get_novel_production_status");
  if (productionStatus) {
    return composeFactProductionStatusText(productionStatus);
  }
  const context = getSuccessfulOutputs(results, "get_novel_context")[0];
  if (!context) {
    return ta("progress.insufficient");
  }
  const completedChapterCount = typeof context.completedChapterCount === "number"
    ? context.completedChapterCount
    : null;
  const chapterCount = typeof context.chapterCount === "number" ? context.chapterCount : null;
  const latestCompletedChapterOrder = typeof context.latestCompletedChapterOrder === "number"
    ? context.latestCompletedChapterOrder
    : null;
  if (completedChapterCount == null) {
    return ta("progress.insufficient");
  }
  const parts = [
    chapterCount != null
      ? ta("progress.draftWithTarget", { completed: completedChapterCount, total: chapterCount })
      : ta("progress.draftOnly", { completed: completedChapterCount }),
  ];
  if (latestCompletedChapterOrder != null) {
    parts.push(ta("progress.latestChapter", { order: latestCompletedChapterOrder }));
  }
  if (completedChapterCount === 0) {
    parts.push(ta("progress.noChapters"));
  }
  return parts.join("");
}

function composeCharacterAnswer(results: ToolExecutionResult[]): string {
  const characterState = getSuccessfulOutputs(results, "get_character_states")[0];
  if (!characterState) {
    return ta("character.notFound");
  }
  const count = typeof characterState.count === "number" ? characterState.count : 0;
  const items = Array.isArray(characterState.items) ? characterState.items : [];
  if (count === 0 || items.length === 0) {
    return ta("character.empty");
  }
  const lines = items.slice(0, 6).map((item, index) => {
    const name = typeof item?.name === "string" && item.name.trim() ? item.name.trim() : ta("character.unnamedCharacter");
    const role = typeof item?.role === "string" && item.role.trim() ? item.role.trim() : null;
    return `${index + 1}. ${name}${role ? `（${role}）` : ""}`;
  });
  return ta("character.summary", { count }) + "\n" + lines.join("\n");
}

function composeChapterAnswer(results: ToolExecutionResult[]): string | null {
  const contentOutputs = [
    ...getSuccessfulOutputs(results, "get_chapter_content_by_order"),
    ...getSuccessfulOutputs(results, "get_chapter_content"),
  ]
    .filter((item) => typeof item.order === "number")
    .sort((left, right) => Number(left.order) - Number(right.order));
  if (contentOutputs.length > 0) {
    return contentOutputs.map((item) => {
      const order = Number(item.order);
      const title = typeof item.title === "string" ? item.title.trim() : "";
      const content = typeof item.content === "string" ? item.content : "";
      return (title ? ta("chapter.orderTitleWithName", { order, title }) : ta("chapter.orderTitle", { order })) + "：" + (truncateText(content, 360) || ta("chapter.emptyContent"));
    }).join("\n\n");
  }

  const rangeSummary = getSuccessfulOutputs(results, "summarize_chapter_range")[0];
  if (rangeSummary && typeof rangeSummary.summary === "string" && rangeSummary.summary.trim()) {
    return rangeSummary.summary.trim();
  }
  return null;
}

function composeWriteAnswer(results: ToolExecutionResult[], waitingForApproval: boolean): string | null {
  const preview = getSuccessfulOutputs(results, "preview_pipeline_run")[0];
  const queue = getSuccessfulOutputs(results, "queue_pipeline_run")[0];
  const draft = getSuccessfulOutputs(results, "save_chapter_draft")[0];
  const patch = getSuccessfulOutputs(results, "apply_chapter_patch")[0];

  if (draft && typeof draft.summary === "string") {
    return draft.summary;
  }
  if (patch && typeof patch.summary === "string") {
    return patch.summary;
  }
  if (waitingForApproval && preview) {
    const start = typeof preview.startOrder === "number" ? preview.startOrder : null;
    const end = typeof preview.endOrder === "number" ? preview.endOrder : null;
    if (start != null && end != null) {
      return start === end
        ? ta("write.previewSingle", { start })
        : ta("write.previewRange", { start, end });
    }
  }
  if (queue) {
    const start = typeof queue.startOrder === "number" ? queue.startOrder : null;
    const end = typeof queue.endOrder === "number" ? queue.endOrder : null;
    const jobId = typeof queue.jobId === "string" ? queue.jobId : "";
    if (start != null && end != null) {
      if (start === end) {
        return jobId ? ta("write.queuedSingle", { start, jobId }) : ta("write.queuedSingleNoJob", { start });
      }
      return jobId ? ta("write.queuedRange", { start, end, jobId }) : ta("write.queuedRangeNoJob", { start, end });
    }
  }
  return null;
}

function composeProductionStatusAnswer(
  results: ToolExecutionResult[],
  context: Omit<ToolExecutionContext, "runId" | "agentName">,
): string {
  const status = getFirstSuccessfulOutput(results, "get_novel_production_status");
  if (!status) {
    return context.novelId
      ? ta("overallStatus.notFound")
      : ta("overallStatus.noContext");
  }
  const title = typeof status.title === "string" ? status.title.trim() : ta("productionStatus.fallbackTitle");
  return composeFactProductionStatusText(status, title);
}

async function composeProduceNovelAnswer(
  results: ToolExecutionResult[],
  waitingForApproval: boolean,
  context: Omit<ToolExecutionContext, "runId" | "agentName">,
  goal: string,
  structuredIntent?: StructuredIntent,
): Promise<string> {
  const created = getFirstSuccessfulOutput(results, "create_novel");
  const world = getFirstSuccessfulOutput(results, "generate_world_for_novel");
  const characters = getFirstSuccessfulOutput(results, "generate_novel_characters");
  const bible = getFirstSuccessfulOutput(results, "generate_story_bible");
  const outline = getFirstSuccessfulOutput(results, "generate_novel_outline");
  const structured = getFirstSuccessfulOutput(results, "generate_structured_outline");
  const synced = getFirstSuccessfulOutput(results, "sync_chapters_from_structured_outline");
  const preview = getFirstSuccessfulOutput(results, "preview_pipeline_run");
  const queued = getFirstSuccessfulOutput(results, "queue_pipeline_run");
  const productionStatus = getFirstSuccessfulOutput(results, "get_novel_production_status");

  if (!created && !context.novelId) {
    return composeMissingNovelKickoffAnswer(goal, context, structuredIntent, "produce_missing_title");
  }

  const title = typeof created?.title === "string" && created.title.trim()
    ? created.title.trim()
    : typeof productionStatus?.title === "string" && productionStatus.title.trim()
      ? productionStatus.title.trim()
      : ta("productionStatus.fallbackTitle");
  const assetParts: string[] = [];
  if (world) {
    const worldName = typeof world.worldName === "string" ? world.worldName.trim() : "";
    assetParts.push(worldName ? ta("produce.worldAsset", { name: worldName }) : ta("produce.worldAssetGeneric"));
  }
  if (characters) {
    const characterCount = typeof characters.characterCount === "number" ? characters.characterCount : 0;
    assetParts.push(ta("produce.characterCount", { count: characterCount }));
  }
  if (bible) {
    assetParts.push(ta("produce.bible"));
  }
  if (outline) {
    assetParts.push(ta("produce.outline"));
  }
  if (structured) {
    const targetChapterCount = typeof structured.targetChapterCount === "number" ? structured.targetChapterCount : null;
    assetParts.push(targetChapterCount != null ? ta("produce.structuredOutlineWithCount", { count: targetChapterCount }) : ta("produce.structuredOutlineGeneric"));
  }
  if (synced) {
    const chapterCount = typeof synced.chapterCount === "number" ? synced.chapterCount : null;
    assetParts.push(chapterCount != null ? ta("produce.chapterDirWithCount", { count: chapterCount }) : ta("produce.chapterDirGeneric"));
  }

  if (waitingForApproval && preview) {
    return assetParts.length > 0 ? ta("produce.assetsWithPreview", { title, assets: assetParts.join(ta("collaborative.separator")) }) : ta("produce.assetsWithPreviewNoList", { title });
  }
  if (queued) {
    const jobId = typeof queued.jobId === "string" && queued.jobId.trim() ? queued.jobId.trim() : "";
    if (assetParts.length > 0) {
      return jobId ? ta("produce.assetsQueued", { title, assets: assetParts.join(ta("collaborative.separator")), jobId }) : ta("produce.assetsQueuedNoJob", { title, assets: assetParts.join(ta("collaborative.separator")) });
    }
    return ta("produce.assetsQueuedNoList", { title });
  }
  if (preview) {
    return assetParts.length > 0 ? ta("produce.assetsNoQueue", { title, assets: assetParts.join(ta("collaborative.separator")) }) : ta("produce.assetsNoQueueNoList", { title });
  }
  return assetParts.length > 0 ? ta("produce.assetsOnly", { title, assets: assetParts.join(ta("collaborative.separator")) }) : ta("produce.assetsOnlyNoList", { title })
}

function composeFailureDiagnosisAnswer(results: ToolExecutionResult[]): string {
  const candidates = [
    ...getSuccessfulOutputs(results, "get_run_failure_reason"),
    ...getSuccessfulOutputs(results, "explain_generation_blocker"),
    ...getSuccessfulOutputs(results, "get_task_failure_reason"),
    ...getSuccessfulOutputs(results, "get_index_failure_reason"),
    ...getSuccessfulOutputs(results, "get_book_analysis_failure_reason"),
  ];
  const first = candidates.find((item) => typeof item.failureSummary === "string" && item.failureSummary.trim());
  if (!first) {
    return ta("failure.noDiagnostics");
  }
  const parts = [String(first.failureSummary).trim()];
  if (typeof first.failureDetails === "string" && first.failureDetails.trim() && first.failureDetails.trim() !== parts[0]) {
    parts.push(ta("failure.details", { details: first.failureDetails.trim() }));
  }
  if (typeof first.recoveryHint === "string" && first.recoveryHint.trim()) {
    parts.push(ta("failure.hint", { hint: first.recoveryHint.trim() }));
  }
  if (typeof first.lastFailedStep === "string" && first.lastFailedStep.trim()) {
    parts.push(ta("failure.step", { step: first.lastFailedStep.trim() }));
  }
  return parts.join("\n");
}

async function composeFallbackAnswer(
  goal: string,
  summary: string,
  results: ToolExecutionResult[],
  context: Omit<ToolExecutionContext, "runId" | "agentName">,
  structuredIntent?: StructuredIntent,
): Promise<string> {
  try {
    const toolList = listAgentToolDefinitions()
      .map((item) => `- ${item.name}: ${item.description}`)
      .join("\n");
    const result = await runTextPrompt({
      asset: runtimeFallbackAnswerPrompt,
      promptInput: {
        toolList,
        goal,
        structuredIntentJson: safeJson(structuredIntent ?? { intent: "unknown" }),
        summary,
        groundingFacts: buildGroundingFacts(results),
      },
      options: {
        provider: context.provider ?? "deepseek",
        model: context.model,
        temperature: 0.2,
        maxTokens: context.maxTokens,
      },
    });
    return result.output.trim() || ta("progress.insufficient");
  } catch {
    return summary || ta("progress.insufficient");
  }
  return ta("progress.insufficient");
}

export async function composeAssistantMessage(
  goal: string,
  summary: string,
  results: ToolExecutionResult[],
  waitingForApproval: boolean,
  context: Omit<ToolExecutionContext, "runId" | "agentName">,
  structuredIntent?: StructuredIntent,
): Promise<string> {
  if (structuredIntent?.intent === "social_opening") {
    return composeSocialOpeningAnswer(context);
  }

  if (
    !waitingForApproval
    && structuredIntent
    && COLLABORATION_FIRST_INTENTS.has(structuredIntent.intent)
    && (
      structuredIntent.shouldAskFollowup
      || ((structuredIntent.interactionMode ?? "execute") !== "execute" && results.length === 0)
    )
  ) {
    return composeCollaborativeAnswer(goal, structuredIntent);
  }

  switch (structuredIntent?.intent) {
    case "list_novels":
      return composeNovelListAnswer(results);
    case "list_base_characters":
      return composeBaseCharacterListAnswer(results);
    case "list_worlds":
      return composeWorldListAnswer(results);
    case "query_task_status":
      return composeTaskListAnswer(results);
    case "create_novel":
      return composeCreateNovelSetupAnswer(goal, results, context, structuredIntent);
    case "select_novel_workspace":
      return composeSelectNovelWorkspaceSetupAnswer(goal, results, context, structuredIntent);
    case "bind_world_to_novel":
      return composeBindWorldAnswer(results, context);
    case "unbind_world_from_novel":
      return composeUnbindWorldAnswer(results, context);
    case "produce_novel":
      return composeProduceNovelAnswer(results, waitingForApproval, context, goal, structuredIntent);
    case "query_novel_production_status":
      return composeProductionStatusAnswer(results, context);
    case "query_novel_title":
      return composeTitleAnswer(results);
    case "query_progress":
      return composeProgressAnswer(results);
    case "query_chapter_content":
      return composeChapterAnswer(results) ?? ta("chapter.notFound");
    case "inspect_failure_reason":
      return composeFailureDiagnosisAnswer(results);
    case "ideate_novel_setup":
      return composeNovelSetupIdeationAnswer(goal, results, context, structuredIntent);
    case "write_chapter":
    case "rewrite_chapter":
    case "save_chapter_draft":
    case "start_pipeline":
      return composeWriteAnswer(results, waitingForApproval) ?? ta("write.noScope");
    default:
      break;
  }

  if (waitingForApproval) {
    return summary;
  }
  return composeFallbackAnswer(goal, summary, results, context, structuredIntent);
}

export function hasUsableStructuredIntent(value: unknown): value is StructuredIntent {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.goal === "string"
    && typeof value.intent === "string"
    && typeof value.confidence === "number"
    && isRecord(value.chapterSelectors);
}
