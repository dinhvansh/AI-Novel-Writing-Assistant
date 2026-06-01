import { randomUUID } from "node:crypto";
import type {
  ChapterEditorAiRevisionIntent,
  ChapterEditorMacroContext,
  ChapterEditorAiRevisionRequest,
  ChapterEditorAiRevisionResponse,
  ChapterEditorCandidate,
  ChapterEditorOperation,
  ChapterEditorRewritePreviewRequest,
  ChapterEditorRewritePreviewResponse,
  ChapterEditorTargetRange,
} from "@ai-novel/shared/types/novel";
import type { LocaleCode } from "@ai-novel/shared/localization";
import { DEFAULT_LOCALE } from "@ai-novel/shared/localization";
import { runStructuredPrompt } from "../../../prompting/core/promptRunner";
import {
  chapterEditorRewriteCandidatesPrompt,
  type ChapterEditorRewriteCandidatesPromptInput,
} from "../../../prompting/prompts/novel/chapterEditor/rewriteCandidates.prompts";
import {
  chapterEditorUserIntentPrompt,
  type ChapterEditorUserIntentPromptInput,
} from "../../../prompting/prompts/novel/chapterEditor/userIntent.prompts";
import { buildChapterEditorDiffChunks } from "./chapterEditorDiff";
import { ChapterEditorWorkspaceService } from "./ChapterEditorWorkspaceService";
import {
  buildCharacterStateSummary,
  buildMacroContextSummary,
  buildParagraphWindow,
  buildPresetIntent,
  countEditorWords,
  createTargetRangeForWholeChapter,
  normalizeChapterContent,
  normalizeEditorText,
} from "./chapterEditorShared";
import { getI18nServerHandle } from "../../../i18n";
import { getCurrentRequestLocale } from "../../../runtime/requestLocaleContext";

const FULL_CHAPTER_REVISION_LIMIT = 8000;

function getT(locale: LocaleCode) {
  const handle = getI18nServerHandle();
  if (!handle) return null;
  return (key: string, values?: Record<string, unknown>) => {
    const result = handle.t("novel", key, { lng: locale, values });
    return (result && result !== `novel:${key}`) ? result : key;
  };
}

function getOperationLabel(operation: ChapterEditorOperation, locale: LocaleCode): string {
  const t = getT(locale);
  if (t) {
    // i18n-ignore: lookup map keys
    const keyMap: Record<ChapterEditorOperation, string> = {
      polish: "chapterEditor.operations.polish",
      expand: "chapterEditor.operations.expand",
      compress: "chapterEditor.operations.compress",
      emotion: "chapterEditor.operations.emotion",
      conflict: "chapterEditor.operations.conflict",
      custom: "chapterEditor.operations.custom",
    };
    return t(keyMap[operation]);
  }
  // i18n-ignore: fallback map keys
  const OPERATION_LABELS: Record<ChapterEditorOperation, string> = {
    polish: "\u4f18\u5316\u8868\u8fbe",
    expand: "\u6269\u5199\u7ec6\u8282",
    compress: "\u7cbe\u7b80\u538b\u7f29",
    emotion: "\u5f3a\u5316\u60c5\u7eea",
    conflict: "\u5f3a\u5316\u51b2\u7a81",
    custom: "\u81ea\u5b9a\u4e49\u6307\u4ee4\u6539\u5199",
  };
  return OPERATION_LABELS[operation];
}

function buildConstraintsText(input: ChapterEditorAiRevisionRequest["constraints"], locale: LocaleCode = DEFAULT_LOCALE): string {
  const t = getT(locale);
  function c(key: string, fallback: string): string {
    return t ? t(key) : fallback;
  }
  const lines = [
    input.keepFacts
      ? `- ${c("chapterEditor.constraints.keepFacts", "\u4fdd\u7559\u73b0\u6709\u5267\u60c5\u4e8b\u5b9e")}`
      : `- ${c("chapterEditor.constraints.adjustFacts", "\u53ef\u8c03\u6574\u90e8\u5206\u4e8b\u5b9e")}`,
    input.keepPov
      ? `- ${c("chapterEditor.constraints.keepPov", "\u4fdd\u6301\u5f53\u524d\u4eba\u79f0\u4e0e\u53d9\u4e8b\u89c6\u89d2")}`
      : `- ${c("chapterEditor.constraints.adjustPov", "\u53ef\u8c03\u6574\u53d9\u4e8b\u89c6\u89d2")}`,
    input.noUnauthorizedSetting
      ? `- ${c("chapterEditor.constraints.noUnauthorizedSetting", "\u4e0d\u65b0\u589e\u672a\u6388\u6743\u8bbe\u5b9a")}`
      : `- ${c("chapterEditor.constraints.allowSetting", "\u53ef\u5f15\u5165\u8865\u5145\u8bbe\u5b9a")}`,
    input.preserveCoreInfo
      ? `- ${c("chapterEditor.constraints.preserveCoreInfo", "\u5c3d\u91cf\u4fdd\u7559\u539f\u6bb5\u6838\u5fc3\u4fe1\u606f")}`
      : `- ${c("chapterEditor.constraints.reorganizeCoreInfo", "\u53ef\u91cd\u7ec4\u6838\u5fc3\u4fe1\u606f")}`,
  ];
  return lines.join("\n");
}

function dedupeCandidates(candidates: ChapterEditorCandidate[]): ChapterEditorCandidate[] {
  const seen = new Set<string>();
  const deduped: ChapterEditorCandidate[] = [];
  for (const candidate of candidates) {
    const key = candidate.content.trim();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(candidate);
  }
  return deduped;
}

function buildIntentSummary(intent: ChapterEditorAiRevisionIntent, locale: LocaleCode = DEFAULT_LOCALE): string {
  const t = getT(locale);
  function label(key: string, fallback: string): string {
    return t ? t(key) : fallback;
  }
  return [
    `${label("chapterEditor.intentLabels.goal", "\u76ee\u6807")}：${intent.editGoal}`,
    `${label("chapterEditor.intentLabels.tone", "\u8bed\u6c14")}：${intent.toneShift}`,
    `${label("chapterEditor.intentLabels.pace", "\u8282\u594f")}：${intent.paceAdjustment}`,
    `${label("chapterEditor.intentLabels.conflict", "\u51b2\u7a81")}：${intent.conflictAdjustment}`,
    `${label("chapterEditor.intentLabels.emotion", "\u60c5\u7eea")}：${intent.emotionAdjustment}`,
    `${label("chapterEditor.intentLabels.strength", "\u5f3a\u5ea6")}：${intent.strength}`,
    `${label("chapterEditor.intentLabels.preserve", "\u4fdd\u7559\u9879")}：${intent.mustPreserve.join("；") || label("chapterEditor.intentLabels.preserveDefault", "\u4fdd\u6301\u6838\u5fc3\u4e8b\u5b9e\u4e0e\u627f\u63a5")}`,
    `${label("chapterEditor.intentLabels.avoid", "\u907f\u514d\u9879")}：${intent.mustAvoid.join("；") || label("chapterEditor.intentLabels.avoidDefault", "\u4e0d\u8981\u7834\u574f\u7ae0\u8282\u627f\u63a5")}`,
    `${label("chapterEditor.intentLabels.reasoning", "\u8bf4\u660e")}：${intent.reasoningSummary}`,
  ].join("\n");
}

function resolveSelectionTargetRange(content: string, targetRange?: ChapterEditorTargetRange): ChapterEditorTargetRange {
  const locale: LocaleCode = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
  const tErr = getT(locale);
  if (!targetRange) {
    throw new Error(tErr ? tErr("chapterEditor.errors.noSelectionForRevision") : "\u7247\u6bb5\u4fee\u6b63\u9700\u8981\u5148\u9009\u4e2d\u6b63\u6587\u5185\u5bb9\u3002");
  }
  if (
    typeof targetRange.from !== "number"
    || typeof targetRange.to !== "number"
    || targetRange.from < 0
    || targetRange.to <= targetRange.from
    || targetRange.to > content.length
  ) {
    throw new Error(tErr ? tErr("chapterEditor.errors.invalidSelection") : "\u9009\u533a\u8303\u56f4\u65e0\u6548\uff0c\u8bf7\u91cd\u65b0\u9009\u62e9\u540e\u518d\u8bd5\u3002");
  }
  const selectedText = content.slice(targetRange.from, targetRange.to);
  if (!selectedText.trim()) {
    throw new Error(tErr ? tErr("chapterEditor.errors.emptySelection") : "\u9009\u4e2d\u6587\u672c\u4e0d\u80fd\u4e3a\u7a7a\u3002");
  }
  if (normalizeEditorText(targetRange.text) !== selectedText) {
    throw new Error(tErr ? tErr("chapterEditor.errors.selectionChanged") : "\u9009\u4e2d\u6587\u672c\u5df2\u53d1\u751f\u53d8\u5316\uff0c\u8bf7\u91cd\u65b0\u9009\u62e9\u540e\u518d\u8bd5\u3002");
  }
  return {
    from: targetRange.from,
    to: targetRange.to,
    text: selectedText,
  };
}

export class NovelChapterEditorService {
  constructor(
    private readonly workspaceService: ChapterEditorWorkspaceService = new ChapterEditorWorkspaceService(),
    private readonly promptRunner: typeof runStructuredPrompt = runStructuredPrompt,
  ) {}

  async previewAiRevision(
    novelId: string,
    chapterId: string,
    input: ChapterEditorAiRevisionRequest,
  ): Promise<ChapterEditorAiRevisionResponse> {
    const context = await this.workspaceService.loadContext(novelId, chapterId);
    const content = normalizeChapterContent(input.contentSnapshot || context.chapter.content || "");
    const locale: LocaleCode = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
    const tErr = getT(locale);
    if (!content.trim()) {
      throw new Error(tErr ? tErr("chapterEditor.errors.noChapterSelected") : "\u5f53\u524d\u7ae0\u8282\u6b63\u6587\u4e3a\u7a7a\uff0c\u65e0\u6cd5\u53d1\u8d77 AI \u4fee\u6b63\u3002");
    }

    if (input.scope === "chapter" && countEditorWords(content) > FULL_CHAPTER_REVISION_LIMIT) {
      throw new Error(tErr
        ? tErr("chapterEditor.errors.chapterTooLong")
        : `\u6574\u7ae0\u4fee\u6b63\u5f53\u524d\u9650\u5236\u4e3a ${FULL_CHAPTER_REVISION_LIMIT} \u4e2a\u975e\u7a7a\u767d\u5b57\u7b26\u4ee5\u5185\uff0c\u8bf7\u6539\u4e3a\u7247\u6bb5\u4fee\u6b63\u3002`);
    }

    const targetRange = input.scope === "chapter"
      ? createTargetRangeForWholeChapter(content)
      : resolveSelectionTargetRange(content, input.selection);

    const resolvedIntent = await this.resolveRevisionIntent(input, context.macroContext, targetRange.text);
    const contextWindow = input.scope === "selection"
      ? input.context ?? buildParagraphWindow(content, targetRange)
      : { beforeParagraphs: [], afterParagraphs: [] };

    const result = await this.promptRunner({
      asset: chapterEditorRewriteCandidatesPrompt,
      promptInput: {
        operation: input.presetOperation ?? (input.source === "freeform" ? "custom" : "polish"),
        operationLabel: getOperationLabel(input.presetOperation ?? (input.source === "freeform" ? "custom" : "polish"), locale),
        scope: input.scope,
        customInstruction: input.instruction?.trim() || undefined,
        selectedText: targetRange.text,
        beforeParagraphs: contextWindow.beforeParagraphs,
        afterParagraphs: contextWindow.afterParagraphs,
        goalSummary: context.chapterPlan?.objective?.trim() || context.chapter.expectation?.trim() || null,
        chapterSummary: context.chapterSummary,
        styleSummary: context.styleSummary || null,
        characterStateSummary: buildCharacterStateSummary(context.latestStateSnapshot),
        worldConstraintSummary: context.macroContext.worldConstraintSummary,
        macroContextSummary: buildMacroContextSummary(context.macroContext),
        resolvedIntentSummary: buildIntentSummary(resolvedIntent, locale),
        constraintsText: buildConstraintsText(input.constraints, locale),
      } satisfies ChapterEditorRewriteCandidatesPromptInput,
      options: {
        provider: input.provider ?? "deepseek",
        model: input.model,
        temperature: input.temperature ?? 0.45,
      },
    });

    const candidates = dedupeCandidates(
      result.output.candidates.slice(0, 3).map((candidate, index) => ({
        id: randomUUID(),
        label: candidate.label?.trim() || `方案 ${index + 1}`,
        content: candidate.content.trim(),
        summary: candidate.summary?.trim() || null,
        rationale: candidate.rationale?.trim() || null,
        riskNotes: candidate.riskNotes?.filter((item) => item.trim().length > 0) ?? [],
        semanticTags: candidate.semanticTags?.filter((tag) => tag.trim().length > 0) ?? [],
        diffChunks: buildChapterEditorDiffChunks(targetRange.text, candidate.content.trim()),
      })),
    );

    if (candidates.length < 2) {
      throw new Error(tErr ? tErr("chapterEditor.errors.noRevisionResult") : "AI \u672a\u8fd4\u56de\u8db3\u591f\u7684\u5019\u9009\u7248\u672c\uff0c\u8bf7\u91cd\u8bd5\u3002");
    }

    return {
      sessionId: randomUUID(),
      scope: input.scope,
      resolvedIntent,
      targetRange,
      macroAlignmentNote: result.output.macroAlignmentNote?.trim() || null,
      candidates,
      activeCandidateId: candidates[0]?.id ?? null,
    };
  }

  async previewRewrite(
    novelId: string,
    chapterId: string,
    input: ChapterEditorRewritePreviewRequest,
  ): Promise<ChapterEditorRewritePreviewResponse> {
    const response = await this.previewAiRevision(novelId, chapterId, {
      source: "preset",
      scope: "selection",
      presetOperation: input.operation,
      instruction: input.customInstruction,
      contentSnapshot: input.contentSnapshot,
      selection: input.targetRange,
      context: input.context,
      constraints: input.constraints,
      provider: input.provider,
      model: input.model,
      temperature: input.temperature,
    });

    return {
      sessionId: response.sessionId,
      operation: input.operation,
      targetRange: response.targetRange,
      candidates: response.candidates,
      activeCandidateId: response.activeCandidateId,
    };
  }

  private async resolveRevisionIntent(
    input: ChapterEditorAiRevisionRequest,
    macroContext: ChapterEditorMacroContext,
    selectedText: string,
  ): Promise<ChapterEditorAiRevisionIntent> {
    if (input.source === "preset") {
      return buildPresetIntent(
        input.presetOperation ?? "polish",
        macroContext.mustKeepConstraints,
        input.instruction,
      );
    }

    if (!input.instruction?.trim()) {
      const localeInner: LocaleCode = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
      const tErrInner = getT(localeInner);
      throw new Error(tErrInner ? tErrInner("chapterEditor.errors.noInstruction") : "\u8bf7\u5148\u5199\u4e0b\u4f60\u5e0c\u671b AI \u5982\u4f55\u4fee\u6539\u3002");
    }

    const result = await this.promptRunner({
      asset: chapterEditorUserIntentPrompt,
      promptInput: {
        scope: input.scope,
        instruction: input.instruction.trim(),
        selectedText: input.scope === "selection" ? selectedText.slice(0, 800) : null,
        macroContextSummary: buildMacroContextSummary(macroContext),
        mustKeepConstraints: macroContext.mustKeepConstraints,
      } satisfies ChapterEditorUserIntentPromptInput,
      options: {
        provider: input.provider ?? "deepseek",
        model: input.model,
        temperature: 0.2,
      },
    });

    return result.output;
  }
}
