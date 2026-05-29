import type { TFunction } from "i18next";
import type {
  VolumeBeatSheet,
  VolumeChapterPlan,
  VolumePlan,
  VolumePlanningReadiness,
  VolumeStrategyPlan,
  VolumeSyncPreview,
} from "@ai-novel/shared/types/novel";

export interface ExistingOutlineChapter {
  id: string;
  order: number;
  title: string;
  content?: string | null;
  expectation?: string | null;
  targetWordCount?: number | null;
  conflictLevel?: number | null;
  revealLevel?: number | null;
  mustAvoid?: string | null;
  taskSheet?: string | null;
}

export interface VolumeSyncOptions {
  preserveContent: boolean;
  applyDeletes: boolean;
}

export function buildVolumePlanningReadiness(params: {
  t?: TFunction;
  volumes: VolumePlan[];
  strategyPlan: VolumeStrategyPlan | null;
  beatSheets: VolumeBeatSheet[];
}): VolumePlanningReadiness {
  const { volumes, strategyPlan, beatSheets, t } = params;
  const tr = t ?? ((key: string) => key);
  const blockingReasons: string[] = [];
  if (!strategyPlan) {
    blockingReasons.push(tr("novel:volumePlan.readiness.blockingMissingStrategy"));
  }
  if (volumes.length === 0) {
    blockingReasons.push(tr("novel:volumePlan.readiness.blockingMissingVolumes"));
  }
  if (!beatSheets.some((sheet) => sheet.beats.length > 0)) {
    blockingReasons.push(tr("novel:volumePlan.readiness.blockingMissingBeatSheet"));
  }
  return {
    canGenerateStrategy: true,
    canGenerateSkeleton: Boolean(strategyPlan),
    canGenerateBeatSheet: Boolean(strategyPlan) && volumes.length > 0,
    canGenerateChapterList: Boolean(strategyPlan) && beatSheets.some((sheet) => sheet.beats.length > 0),
    blockingReasons,
  };
}

export function findBeatSheet(beatSheets: VolumeBeatSheet[], volumeId: string): VolumeBeatSheet | null {
  return beatSheets.find((sheet) => sheet.volumeId === volumeId && sheet.beats.length > 0) ?? null;
}

function createLocalId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

export function createEmptyVolume(sortOrder: number, t?: TFunction): VolumePlan {
  const tr = t ?? ((key: string, opts?: Record<string, unknown>) => opts ? `${key}` : key);
  return {
    id: createLocalId("volume"),
    novelId: "",
    sortOrder,
    title: tr("novel:volumePlan.fallback.volumeTitle", { order: sortOrder }),
    summary: "",
    openingHook: "",
    mainPromise: "",
    primaryPressureSource: "",
    coreSellingPoint: "",
    escalationMode: "",
    protagonistChange: "",
    midVolumeRisk: "",
    climax: "",
    payoffType: "",
    nextVolumeHook: "",
    resetPoint: "",
    openPayoffs: [],
    status: "active",
    sourceVersionId: null,
    chapters: [],
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

export function createEmptyChapter(chapterOrder: number, t?: TFunction): VolumeChapterPlan {
  const tr = t ?? ((key: string, opts?: Record<string, unknown>) => opts ? `${key}` : key);
  return {
    id: createLocalId("chapter"),
    volumeId: "",
    chapterOrder,
    beatKey: null,
    title: tr("novel:volumePlan.fallback.chapterTitle", { order: chapterOrder }),
    summary: "",
    purpose: "",
    conflictLevel: null,
    revealLevel: null,
    targetWordCount: null,
    mustAvoid: "",
    taskSheet: "",
    payoffRefs: [],
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

export function buildTaskSheetFromVolumeChapter(chapter: VolumeChapterPlan, t?: TFunction): string {
  const tr = t ?? ((key: string, opts?: Record<string, unknown>) => opts ? `${key}` : key);
  const lines = [
    tr("novel:volumePlan.taskSheet.purpose", { value: chapter.purpose || chapter.summary || tr("novel:volumePlan.taskSheet.purposeFallback") }),
    typeof chapter.conflictLevel === "number" ? tr("novel:volumePlan.taskSheet.conflictLevel", { value: chapter.conflictLevel }) : "",
    typeof chapter.revealLevel === "number" ? tr("novel:volumePlan.taskSheet.revealLevel", { value: chapter.revealLevel }) : "",
    typeof chapter.targetWordCount === "number" ? tr("novel:volumePlan.taskSheet.targetWordCount", { value: chapter.targetWordCount }) : "",
    chapter.mustAvoid?.trim() ? tr("novel:volumePlan.taskSheet.mustAvoid", { value: chapter.mustAvoid.trim() }) : "",
    chapter.payoffRefs.length > 0 ? tr("novel:volumePlan.taskSheet.payoffRefs", { value: chapter.payoffRefs.join("、") }) : "",
  ].filter(Boolean);
  return lines.join("\n");
}

export function normalizeVolumeDraft(volumes: VolumePlan[]): VolumePlan[] {
  let chapterOrder = 1;
  return volumes
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((volume, volumeIndex) => {
      const volumeId = volume.id || createLocalId("volume");
      const chapters = (volume.chapters ?? [])
        .slice()
        .sort((a, b) => a.chapterOrder - b.chapterOrder)
        .map((chapter) => {
          const normalizedChapter = {
            ...chapter,
            id: chapter.id || createLocalId("chapter"),
            volumeId,
            chapterOrder,
          };
          chapterOrder += 1;
          return normalizedChapter;
        });
      return {
        ...volume,
        id: volumeId,
        sortOrder: volumeIndex + 1,
        openPayoffs: (volume.openPayoffs ?? []).filter((item) => item.trim()),
        openingHook: volume.openingHook ?? "",
        primaryPressureSource: volume.primaryPressureSource ?? "",
        coreSellingPoint: volume.coreSellingPoint ?? "",
        midVolumeRisk: volume.midVolumeRisk ?? "",
        payoffType: volume.payoffType ?? "",
        chapters,
      };
    });
}

export function buildOutlinePreviewFromVolumes(volumes: VolumePlan[], t?: TFunction): string {
  const tr = t ?? ((key: string, opts?: Record<string, unknown>) => opts ? `${key}` : key);
  return normalizeVolumeDraft(volumes)
    .map((volume) => {
      const chapterSpan = volume.chapters.length > 0
        ? `${volume.chapters[0]?.chapterOrder ?? "-"}-${volume.chapters[volume.chapters.length - 1]?.chapterOrder ?? "-"}`
        : tr("novel:volumePlan.preview.noChapters");
      return [
        tr("novel:volumePlan.preview.volumeHeader", { order: volume.sortOrder, title: volume.title }),
        volume.summary?.trim() ? tr("novel:volumePlan.preview.summary", { value: volume.summary.trim() }) : "",
        volume.openingHook?.trim() ? tr("novel:volumePlan.preview.openingHook", { value: volume.openingHook.trim() }) : "",
        volume.mainPromise?.trim() ? tr("novel:volumePlan.preview.mainPromise", { value: volume.mainPromise.trim() }) : "",
        volume.primaryPressureSource?.trim() ? tr("novel:volumePlan.preview.primaryPressureSource", { value: volume.primaryPressureSource.trim() }) : "",
        volume.coreSellingPoint?.trim() ? tr("novel:volumePlan.preview.coreSellingPoint", { value: volume.coreSellingPoint.trim() }) : "",
        volume.escalationMode?.trim() ? tr("novel:volumePlan.preview.escalationMode", { value: volume.escalationMode.trim() }) : "",
        volume.protagonistChange?.trim() ? tr("novel:volumePlan.preview.protagonistChange", { value: volume.protagonistChange.trim() }) : "",
        volume.midVolumeRisk?.trim() ? tr("novel:volumePlan.preview.midVolumeRisk", { value: volume.midVolumeRisk.trim() }) : "",
        volume.climax?.trim() ? tr("novel:volumePlan.preview.climax", { value: volume.climax.trim() }) : "",
        volume.payoffType?.trim() ? tr("novel:volumePlan.preview.payoffType", { value: volume.payoffType.trim() }) : "",
        volume.nextVolumeHook?.trim() ? tr("novel:volumePlan.preview.nextVolumeHook", { value: volume.nextVolumeHook.trim() }) : "",
        volume.resetPoint?.trim() ? tr("novel:volumePlan.preview.resetPoint", { value: volume.resetPoint.trim() }) : "",
        volume.openPayoffs.length > 0 ? tr("novel:volumePlan.preview.openPayoffs", { value: volume.openPayoffs.join("；") }) : "",
        tr("novel:volumePlan.preview.chapterRange", { value: chapterSpan }),
      ].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

export function buildStructuredPreviewFromVolumes(volumes: VolumePlan[]): string {
  return JSON.stringify({
    volumes: normalizeVolumeDraft(volumes).map((volume) => ({
      volumeTitle: volume.title,
      summary: volume.summary || undefined,
      openingHook: volume.openingHook || undefined,
      mainPromise: volume.mainPromise || undefined,
      primaryPressureSource: volume.primaryPressureSource || undefined,
      coreSellingPoint: volume.coreSellingPoint || undefined,
      escalationMode: volume.escalationMode || undefined,
      protagonistChange: volume.protagonistChange || undefined,
      midVolumeRisk: volume.midVolumeRisk || undefined,
      climax: volume.climax || undefined,
      payoffType: volume.payoffType || undefined,
      nextVolumeHook: volume.nextVolumeHook || undefined,
      resetPoint: volume.resetPoint || undefined,
      openPayoffs: volume.openPayoffs,
      chapters: volume.chapters.map((chapter) => ({
        chapter_id: chapter.chapterId ?? undefined,
        order: chapter.chapterOrder,
        beat_key: chapter.beatKey ?? undefined,
        title: chapter.title,
        summary: chapter.summary,
        purpose: chapter.purpose || undefined,
        conflict_level: chapter.conflictLevel ?? undefined,
        reveal_level: chapter.revealLevel ?? undefined,
        target_word_count: chapter.targetWordCount ?? undefined,
        must_avoid: chapter.mustAvoid || undefined,
        task_sheet: chapter.taskSheet || undefined,
        payoff_refs: chapter.payoffRefs,
      })),
    })),
  }, null, 2);
}

export function applyVolumeChapterBatch(
  volumes: VolumePlan[],
  patch: {
    conflictLevel?: number;
    targetWordCount?: number;
    generateTaskSheet?: boolean;
  },
): VolumePlan[] {
  return normalizeVolumeDraft(volumes).map((volume) => ({
    ...volume,
    chapters: volume.chapters.map((chapter) => {
      const nextChapter: VolumeChapterPlan = { ...chapter };
      if (typeof patch.conflictLevel === "number") {
        nextChapter.conflictLevel = Math.max(0, Math.min(100, Math.round(patch.conflictLevel)));
      }
      if (typeof patch.targetWordCount === "number") {
        nextChapter.targetWordCount = Math.max(200, Math.round(patch.targetWordCount));
      }
      if (patch.generateTaskSheet) {
        nextChapter.taskSheet = buildTaskSheetFromVolumeChapter(nextChapter);
      }
      return nextChapter;
    }),
  }));
}

function compareText(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? "").trim() === (b ?? "").trim();
}

function compareNumber(a: number | null | undefined, b: number | null | undefined): boolean {
  return (typeof a === "number" ? a : null) === (typeof b === "number" ? b : null);
}

function getChangedFields(existing: ExistingOutlineChapter, chapter: VolumeChapterPlan, action: "update" | "move", t?: TFunction): string[] {
  const tr = t ?? ((key: string) => key);
  const changed: string[] = action === "move" ? [tr("novel:volumePlan.syncFields.chapterOrder")] : [];
  if (!compareText(existing.title, chapter.title)) changed.push(tr("novel:volumePlan.syncFields.title"));
  if (!compareText(existing.expectation, chapter.summary)) changed.push(tr("novel:volumePlan.syncFields.summary"));
  if (!compareNumber(existing.targetWordCount, chapter.targetWordCount)) changed.push(tr("novel:volumePlan.syncFields.targetWordCount"));
  if (!compareNumber(existing.conflictLevel, chapter.conflictLevel)) changed.push(tr("novel:volumePlan.syncFields.conflictLevel"));
  if (!compareNumber(existing.revealLevel, chapter.revealLevel)) changed.push(tr("novel:volumePlan.syncFields.revealLevel"));
  if (!compareText(existing.mustAvoid, chapter.mustAvoid)) changed.push(tr("novel:volumePlan.syncFields.mustAvoid"));
  if (!compareText(existing.taskSheet, chapter.taskSheet)) changed.push(tr("novel:volumePlan.syncFields.taskSheet"));
  return changed;
}

export function buildVolumeSyncPreview(
  volumes: VolumePlan[],
  existingChapters: ExistingOutlineChapter[],
  options: VolumeSyncOptions,
  t?: TFunction,
): VolumeSyncPreview {
  const normalizedVolumes = normalizeVolumeDraft(volumes);
  const flattened = normalizedVolumes.flatMap((volume) => volume.chapters.map((chapter) => ({ volume, chapter })));
  const existingById = new Map(existingChapters.map((chapter) => [chapter.id, chapter]));
  const existingByOrder = new Map(existingChapters.map((chapter) => [chapter.order, chapter]));
  const existingByTitle = new Map(existingChapters.map((chapter) => [chapter.title.trim().toLowerCase(), chapter]));
  const matchedChapterIds = new Set<string>();
  const items: VolumeSyncPreview["items"] = [];
  let createCount = 0;
  let updateCount = 0;
  let keepCount = 0;
  let moveCount = 0;
  let deleteCount = 0;
  let deleteCandidateCount = 0;
  let affectedGeneratedCount = 0;
  let clearContentCount = 0;

  for (const entry of flattened) {
    const linkedChapterId = entry.chapter.chapterId?.trim();
    const matchedById = linkedChapterId ? existingById.get(linkedChapterId) : undefined;
    const existing = matchedById && !matchedChapterIds.has(matchedById.id)
      ? matchedById
      : (() => {
        if (linkedChapterId) {
          return undefined;
        }
        const existingBySameOrder = existingByOrder.get(entry.chapter.chapterOrder);
        const matchedByOrder = existingBySameOrder && !matchedChapterIds.has(existingBySameOrder.id)
          ? existingBySameOrder
          : undefined;
        const matchedByTitle = existingByTitle.get(entry.chapter.title.trim().toLowerCase());
        return matchedByOrder ?? (
          matchedByTitle && !matchedChapterIds.has(matchedByTitle.id)
            ? matchedByTitle
            : undefined
        );
      })();

    if (!existing) {
      createCount += 1;
      items.push({
        action: "create",
        volumeTitle: entry.volume.title,
        chapterOrder: entry.chapter.chapterOrder,
        nextTitle: entry.chapter.title,
        hasContent: false,
        changedFields: [t ? t("novel:volumePlan.syncFields.newChapter") : "新章节" /* i18n-ignore: fallback when t not provided */],
      });
      continue;
    }

    matchedChapterIds.add(existing.id);
    const action = existing.order === entry.chapter.chapterOrder ? "update" : "move";
    const changedFields = getChangedFields(existing, entry.chapter, action, t);
    const hasContent = Boolean(existing.content?.trim());
    if (changedFields.length === 0) {
      keepCount += 1;
      items.push({
        action: "keep",
        volumeTitle: entry.volume.title,
        chapterOrder: entry.chapter.chapterOrder,
        nextTitle: entry.chapter.title,
        previousTitle: existing.title,
        hasContent,
        changedFields: [],
      });
      continue;
    }

    if (action === "move") {
      moveCount += 1;
    } else {
      updateCount += 1;
    }
    if (hasContent) {
      affectedGeneratedCount += 1;
      if (!options.preserveContent) {
        clearContentCount += 1;
      }
    }
    items.push({
      action,
      volumeTitle: entry.volume.title,
      chapterOrder: entry.chapter.chapterOrder,
      nextTitle: entry.chapter.title,
      previousTitle: existing.title,
      hasContent,
      changedFields,
    });
  }

  for (const chapter of existingChapters.slice().sort((a, b) => a.order - b.order)) {
    if (matchedChapterIds.has(chapter.id)) {
      continue;
    }
    const hasContent = Boolean(chapter.content?.trim());
    if (options.applyDeletes) {
      deleteCount += 1;
      items.push({
        action: "delete",
        volumeTitle: t ? t("novel:volumePlan.syncFields.unmatchedVolumeTitle") : "未匹配", /* i18n-ignore: fallback when t not provided */
        chapterOrder: chapter.order,
        nextTitle: chapter.title,
        previousTitle: chapter.title,
        hasContent,
        changedFields: [t ? t("novel:volumePlan.syncFields.removeFromOutline") : "从卷纲移除" /* i18n-ignore: fallback when t not provided */],
      });
    } else {
      deleteCandidateCount += 1;
      items.push({
        action: "delete_candidate",
        volumeTitle: t ? t("novel:volumePlan.syncFields.unmatchedVolumeTitle") : "未匹配", /* i18n-ignore: fallback when t not provided */
        chapterOrder: chapter.order,
        nextTitle: chapter.title,
        previousTitle: chapter.title,
        hasContent,
        changedFields: [t ? t("novel:volumePlan.syncFields.deleteCandidate") : "待确认删除" /* i18n-ignore: fallback when t not provided */],
      });
    }
  }

  return {
    createCount,
    updateCount,
    keepCount,
    moveCount,
    deleteCount,
    deleteCandidateCount,
    affectedGeneratedCount,
    clearContentCount,
    affectedVolumeCount: new Set(items.filter((item) => item.action !== "keep").map((item) => item.volumeTitle)).size,
    items,
  };
}
