import type { TFunction } from "i18next";
import type { VolumePlan, VolumePlanDocument } from "@ai-novel/shared/types/novel";
import {
  CHAPTER_DETAIL_MODES,
  hasAnyChapterDetailDraft,
  hasChapterDetailDraft,
  type ChapterDetailBundleRequest,
  type ChapterDetailMode,
} from "../chapterDetailPlanning.shared";

interface ChapterDetailTarget {
  chapterId: string;
  chapterOrder: number;
  title: string;
}

interface ResolvedChapterDetailBatch {
  label: string;
  missingCount: number;
  targets: ChapterDetailTarget[];
  hasExistingDrafts: boolean;
}

interface ChapterDetailMutationPayload {
  targetVolumeId: string;
  targetChapterId: string;
  detailMode: ChapterDetailMode;
  draftVolumesOverride: VolumePlan[];
  suppressSuccessMessage: true;
}

interface ChapterDetailMutationResult {
  nextDocument: VolumePlanDocument;
}

interface RunChapterDetailBatchGenerationArgs {
  initialDraft: VolumePlan[];
  label: string;
  targetVolumeId: string;
  targets: ChapterDetailTarget[];
  t: TFunction;
  setIsGenerating: (value: boolean) => void;
  setCurrentChapterId: (value: string) => void;
  setCurrentMode: (value: ChapterDetailMode | "") => void;
  setStructuredMessage: (value: string) => void;
  generateChapterDetail: (
    payload: ChapterDetailMutationPayload,
  ) => Promise<ChapterDetailMutationResult>;
}

function describeChapterTarget(target: ChapterDetailTarget, t: TFunction): string {
  return t("novel:structured.chapterDetail.target.descriptor", { order: target.chapterOrder, title: target.title || t("novel:structured.chapterDetail.target.unnamed") });
}

function buildFallbackLabel(targets: ChapterDetailTarget[], t: TFunction): string {
  if (targets.length === 1) {
    return describeChapterTarget(targets[0], t);
  }
  const first = targets[0];
  const last = targets[targets.length - 1];
  if (!first || !last) {
    return t("novel:structured.chapterDetail.target.fallback");
  }
  return t("novel:structured.chapterDetail.target.fallbackRange", { start: first.chapterOrder, end: last.chapterOrder, count: targets.length });
}

function resolveMissingChapterDetailModes(
  draft: VolumePlan[],
  targetVolumeId: string,
  targetChapterId: string,
): ChapterDetailMode[] {
  const chapter = draft
    .find((volume) => volume.id === targetVolumeId)
    ?.chapters.find((item) => item.id === targetChapterId);
  if (!chapter) {
    return [];
  }
  return CHAPTER_DETAIL_MODES.filter((mode) => !hasChapterDetailDraft(chapter, mode));
}

export function resolveChapterDetailBatch(
  volume: VolumePlan | undefined,
  request: ChapterDetailBundleRequest,
  t: TFunction,
): ResolvedChapterDetailBatch {
  const requestedIds = typeof request === "string"
    ? [request]
    : Array.from(new Set(request.chapterIds.map((id) => id.trim()).filter(Boolean)));
  const matchedChapters = requestedIds
    .map((chapterId) => volume?.chapters.find((chapter) => chapter.id === chapterId))
    .filter((chapter): chapter is VolumePlan["chapters"][number] => Boolean(chapter));

  return {
    label: typeof request === "string"
      ? buildFallbackLabel(matchedChapters.map((chapter) => ({
        chapterId: chapter.id,
        chapterOrder: chapter.chapterOrder,
        title: chapter.title,
      })), t)
      : request.label?.trim() || buildFallbackLabel(matchedChapters.map((chapter) => ({
        chapterId: chapter.id,
        chapterOrder: chapter.chapterOrder,
        title: chapter.title,
      })), t),
    missingCount: Math.max(requestedIds.length - matchedChapters.length, 0),
    targets: matchedChapters.map((chapter) => ({
      chapterId: chapter.id,
      chapterOrder: chapter.chapterOrder,
      title: chapter.title,
    })),
    hasExistingDrafts: matchedChapters.some((chapter) => hasAnyChapterDetailDraft(chapter)),
  };
}

export function buildChapterDetailBatchConfirmationMessage(
  batch: ResolvedChapterDetailBatch,
  t: TFunction,
): string {
  return [
    batch.targets.length === 1
      ? t("novel:structured.chapterDetail.confirm.singleIntro", { label: batch.label })
      : t("novel:structured.chapterDetail.confirm.batchIntro", { label: batch.label }),
    batch.hasExistingDrafts
      ? t("novel:structured.chapterDetail.confirm.existingDrafts")
      : t("novel:structured.chapterDetail.confirm.emptyDrafts"),
    t("novel:structured.chapterDetail.confirm.keepTitleSummary"),
    batch.missingCount > 0 ? t("novel:structured.chapterDetail.confirm.skipMissing", { count: batch.missingCount }) : "",
  ].filter(Boolean).join("\n\n");
}

export async function runChapterDetailBatchGeneration({
  initialDraft,
  label,
  targetVolumeId,
  targets,
  t,
  setIsGenerating,
  setCurrentChapterId,
  setCurrentMode,
  setStructuredMessage,
  generateChapterDetail,
}: RunChapterDetailBatchGenerationArgs): Promise<void> {
  let workingDraft = initialDraft;
  let processedModeCount = 0;
  setIsGenerating(true);
  setCurrentMode("");
  setCurrentChapterId(targets[0]?.chapterId ?? "");
  setStructuredMessage(t("novel:structured.chapterDetail.batch.startMessage", { label }));

  try {
    for (const target of targets) {
      const missingModes = resolveMissingChapterDetailModes(workingDraft, targetVolumeId, target.chapterId);
      if (missingModes.length === 0) {
        continue;
      }
      setCurrentChapterId(target.chapterId);
      for (const mode of missingModes) {
        setCurrentMode(mode);
        const result = await generateChapterDetail({
          targetVolumeId,
          targetChapterId: target.chapterId,
          detailMode: mode,
          draftVolumesOverride: workingDraft,
          suppressSuccessMessage: true,
        });
        workingDraft = result.nextDocument.volumes;
        processedModeCount += 1;
      }
    }
    setStructuredMessage(
      processedModeCount > 0
        ? t("novel:structured.chapterDetail.batch.finishMessage", { label })
        : t("novel:structured.chapterDetail.batch.alreadyComplete", { label }),
    );
  } catch {
    // error message is handled by mutation onError
  } finally {
    setIsGenerating(false);
    setCurrentChapterId("");
    setCurrentMode("");
  }
}
