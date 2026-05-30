import type { TFunction } from "i18next";
import type {
  VolumeBeatSheet,
  VolumeChapterListGenerationMode,
  VolumeGenerationScopeInput,
  VolumePlan,
  VolumePlanDocument,
} from "@ai-novel/shared/types/novel";
import { findBeatSheet } from "../volumePlan.utils";
import type { ChapterDetailMode } from "../chapterDetailPlanning.shared";

export interface ChapterListGenerationRequest {
  generationMode?: VolumeChapterListGenerationMode;
  targetBeatKey?: string;
}

export interface VolumeGenerationPayload {
  scope: VolumeGenerationScopeInput;
  generationMode?: VolumeChapterListGenerationMode;
  targetVolumeId?: string;
  targetBeatKey?: string;
  targetChapterId?: string;
  detailMode?: ChapterDetailMode;
  draftVolumesOverride?: VolumePlan[];
  suppressSuccessMessage?: boolean;
}

export function startStrategyGenerationAction(params: {
  t: TFunction;
  ensureCharacterGuard: () => boolean;
  userPreferredVolumeCount: number | null;
  forceSystemRecommendedVolumeCount: boolean;
  volumeCountGuidance: {
    systemRecommendedVolumeCount: number;
    allowedVolumeCountRange: { min: number; max: number };
    respectedExistingVolumeCount?: number | null;
  };
  hasUnsavedVolumeDraft: boolean;
  generate: (payload: VolumeGenerationPayload) => void;
}): void {
  if (!params.ensureCharacterGuard()) {
    return;
  }
  const { t } = params;
  const confirmed = window.confirm([
    t("volumePlan.actions.strategyConfirm.intro"),
    t("volumePlan.actions.strategyConfirm.notSkeleton"),
    params.userPreferredVolumeCount != null
      ? t("volumePlan.actions.strategyConfirm.fixedCount", { count: params.userPreferredVolumeCount })
      : params.forceSystemRecommendedVolumeCount
        ? t("volumePlan.actions.strategyConfirm.systemRecommended", { count: params.volumeCountGuidance.systemRecommendedVolumeCount })
        : params.volumeCountGuidance.respectedExistingVolumeCount != null
          ? t("volumePlan.actions.strategyConfirm.respectExisting", {
              count: params.volumeCountGuidance.respectedExistingVolumeCount,
              min: params.volumeCountGuidance.allowedVolumeCountRange.min,
              max: params.volumeCountGuidance.allowedVolumeCountRange.max,
            })
          : t("volumePlan.actions.strategyConfirm.systemRange", {
              count: params.volumeCountGuidance.systemRecommendedVolumeCount,
              min: params.volumeCountGuidance.allowedVolumeCountRange.min,
              max: params.volumeCountGuidance.allowedVolumeCountRange.max,
            }),
    params.hasUnsavedVolumeDraft
      ? t("volumePlan.actions.strategyConfirm.useDraft")
      : t("volumePlan.actions.strategyConfirm.useWorkspace"),
  ].join("\n\n"));
  if (!confirmed) {
    return;
  }
  params.generate({ scope: "strategy" });
}

export function startStrategyCritiqueAction(params: {
  ensureCharacterGuard: () => boolean;
  generate: (payload: VolumeGenerationPayload) => void;
}): void {
  if (!params.ensureCharacterGuard()) {
    return;
  }
  params.generate({ scope: "strategy_critique" });
}

export function startSkeletonGenerationAction(params: {
  t: TFunction;
  ensureCharacterGuard: () => boolean;
  hasUnsavedVolumeDraft: boolean;
  generate: (payload: VolumeGenerationPayload) => void;
}): void {
  if (!params.ensureCharacterGuard()) {
    return;
  }
  const { t } = params;
  const confirmed = window.confirm([
    t("volumePlan.actions.skeletonConfirm.intro"),
    t("volumePlan.actions.skeletonConfirm.warning"),
    params.hasUnsavedVolumeDraft
      ? t("volumePlan.actions.skeletonConfirm.useDraft")
      : t("volumePlan.actions.skeletonConfirm.useWorkspace"),
  ].join("\n\n"));
  if (!confirmed) {
    return;
  }
  params.generate({ scope: "skeleton" });
}

export function startBeatSheetGenerationAction(params: {
  t: TFunction;
  volumeId: string;
  normalizedVolumeDraft: VolumePlan[];
  strategyPlan: object | null;
  beatSheets: VolumeBeatSheet[];
  ensureCharacterGuard: () => boolean;
  setStructuredMessage: (value: string) => void;
  generate: (payload: VolumeGenerationPayload) => void;
}): void {
  const { t } = params;
  const targetVolume = params.normalizedVolumeDraft.find((volume) => volume.id === params.volumeId);
  if (!targetVolume) {
    params.setStructuredMessage(t("volumePlan.actions.beatSheet.missingVolume"));
    return;
  }
  if (!params.strategyPlan) {
    params.setStructuredMessage(t("volumePlan.actions.beatSheet.missingStrategy"));
    return;
  }
  if (!params.ensureCharacterGuard()) {
    return;
  }
  const existingBeatSheet = findBeatSheet(params.beatSheets, params.volumeId);
  if (existingBeatSheet) {
    const confirmed = window.confirm([
      t("volumePlan.actions.beatSheet.regenerateConfirm.intro", {
        title: targetVolume.title?.trim() || t("volumePlan.fallback.volumeTitle", { order: targetVolume.sortOrder }),
      }),
      t("volumePlan.actions.beatSheet.regenerateConfirm.overwrite"),
      t("volumePlan.actions.beatSheet.regenerateConfirm.checkAfter"),
    ].join("\n\n"));
    if (!confirmed) {
      return;
    }
  }
  params.generate({
    scope: "beat_sheet",
    targetVolumeId: params.volumeId,
  });
}

export function startChapterListGenerationAction(params: {
  t: TFunction;
  volumeId: string;
  request?: ChapterListGenerationRequest;
  normalizedVolumeDraft: VolumePlan[];
  beatSheets: VolumeBeatSheet[];
  ensureCharacterGuard: () => boolean;
  setStructuredMessage: (value: string) => void;
  generate: (payload: VolumeGenerationPayload) => void;
}): void {
  const { t } = params;
  const targetVolume = params.normalizedVolumeDraft.find((volume) => volume.id === params.volumeId);
  if (!targetVolume) {
    params.setStructuredMessage(t("volumePlan.actions.chapterList.missingVolume"));
    return;
  }
  if (!findBeatSheet(params.beatSheets, params.volumeId)) {
    params.setStructuredMessage(t("volumePlan.actions.chapterList.missingBeatSheet"));
    return;
  }
  if (!params.ensureCharacterGuard()) {
    return;
  }
  const generationMode = params.request?.generationMode ?? "full_volume";
  const targetBeatKey = params.request?.targetBeatKey?.trim();
  if (generationMode === "single_beat" && !targetBeatKey) {
    params.setStructuredMessage(t("volumePlan.actions.chapterList.missingBeat"));
    return;
  }
  params.generate({
    scope: "chapter_list",
    generationMode,
    targetVolumeId: params.volumeId,
    targetBeatKey,
  });
}

export function buildChapterListSuccessMessage(params: {
  t: TFunction;
  document: VolumePlanDocument;
  targetVolumeId?: string;
  generationMode?: VolumeChapterListGenerationMode;
  targetBeatKey?: string;
  autoSyncedToChapterExecution?: boolean;
}): string {
  const { t } = params;
  const updatedVolume = params.targetVolumeId
    ? params.document.volumes.find((volume) => volume.id === params.targetVolumeId)
    : undefined;
  const updatedChapterCount = updatedVolume?.chapters.length ?? 0;
  const syncSuffix = params.autoSyncedToChapterExecution
    ? t("volumePlan.actions.chapterListSuccess.syncSuffix")
    : "";
  if (params.generationMode === "single_beat" && params.targetVolumeId && params.targetBeatKey) {
    const targetBeat = findBeatSheet(params.document.beatSheets, params.targetVolumeId)?.beats
      .find((beat) => beat.key === params.targetBeatKey);
    return updatedChapterCount > 0
      ? t("volumePlan.actions.chapterListSuccess.singleBeatWithCount", {
          label: targetBeat?.label ?? params.targetBeatKey,
          syncSuffix,
          count: updatedChapterCount,
        })
      : t("volumePlan.actions.chapterListSuccess.singleBeat", {
          label: targetBeat?.label ?? params.targetBeatKey,
          syncSuffix,
        });
  }
  return updatedChapterCount > 0
    ? t("volumePlan.actions.chapterListSuccess.fullVolumeWithCount", { syncSuffix, count: updatedChapterCount })
    : t("volumePlan.actions.chapterListSuccess.fullVolume", { syncSuffix });
}
