import {
  buildDefaultNovelCoverSourceDescription,
  type NovelCoverImagePromptNovelContext,
} from "@ai-novel/shared/imagePrompt";
import type { TFunction } from "i18next";
import { normalizeCommercialTags } from "@ai-novel/shared/types/novelFraming";
import type { StoryWorldSliceView } from "@ai-novel/shared/types/storyWorldSlice";
import type { NovelBasicFormState } from "../../novelBasicInfo.shared";

interface GenreOption {
  id: string;
  label: string;
  path: string;
}

interface StoryModeOption {
  id: string;
  name: string;
  label: string;
  path: string;
}

interface WorldOption {
  id: string;
  name: string;
}

export interface BuildNovelCoverDraftInput {
  basicForm: NovelBasicFormState;
  genreOptions: GenreOption[];
  storyModeOptions: StoryModeOption[];
  worldOptions: WorldOption[];
  worldSliceView?: StoryWorldSliceView | null;
  t: TFunction;
}

function getNarrativePovLabels(t: TFunction): Record<NovelBasicFormState["narrativePov"], string> {
  return {
    first_person: t("novel:coverDraft.narrativePov.firstPerson"),
    third_person: t("novel:coverDraft.narrativePov.thirdPerson"),
    mixed: t("novel:coverDraft.narrativePov.mixed"),
  };
}

function getPacePreferenceLabels(t: TFunction): Record<NovelBasicFormState["pacePreference"], string> {
  return {
    slow: t("novel:coverDraft.pacePreference.slow"),
    balanced: t("novel:coverDraft.pacePreference.balanced"),
    fast: t("novel:coverDraft.pacePreference.fast"),
  };
}

function getEmotionIntensityLabels(t: TFunction): Record<NovelBasicFormState["emotionIntensity"], string> {
  return {
    low: t("novel:coverDraft.emotionIntensity.low"),
    medium: t("novel:coverDraft.emotionIntensity.medium"),
    high: t("novel:coverDraft.emotionIntensity.high"),
  };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function findNamedOption<T extends { id: string }>(
  options: T[],
  selectedId: string,
): T | null {
  if (!selectedId) {
    return null;
  }
  return options.find((item) => item.id === selectedId) ?? null;
}

export function buildNovelCoverDraftContext(
  input: BuildNovelCoverDraftInput,
): NovelCoverImagePromptNovelContext {
  const { t } = input;
  const genre = findNamedOption(input.genreOptions, input.basicForm.genreId);
  const primaryStoryMode = findNamedOption(input.storyModeOptions, input.basicForm.primaryStoryModeId);
  const secondaryStoryMode = findNamedOption(input.storyModeOptions, input.basicForm.secondaryStoryModeId);
  const world = findNamedOption(input.worldOptions, input.basicForm.worldId);
  const worldSummary = normalizeOptionalText(input.worldSliceView?.slice?.coreWorldFrame);
  const commercialTags = normalizeCommercialTags(input.basicForm.commercialTagsText);

  return {
    title: normalizeOptionalText(input.basicForm.title) ?? t("novel:coverDraft.defaultTitle"),
    description: normalizeOptionalText(input.basicForm.description),
    targetAudience: normalizeOptionalText(input.basicForm.targetAudience),
    bookSellingPoint: normalizeOptionalText(input.basicForm.bookSellingPoint),
    competingFeel: normalizeOptionalText(input.basicForm.competingFeel),
    first30ChapterPromise: normalizeOptionalText(input.basicForm.first30ChapterPromise),
    commercialTags: commercialTags.length > 0 ? commercialTags : null,
    genreLabel: normalizeOptionalText(genre?.path || genre?.label),
    primaryStoryModeLabel: normalizeOptionalText(primaryStoryMode?.path || primaryStoryMode?.label || primaryStoryMode?.name),
    secondaryStoryModeLabel: normalizeOptionalText(secondaryStoryMode?.path || secondaryStoryMode?.label || secondaryStoryMode?.name),
    worldName: normalizeOptionalText(world?.name),
    worldSummary,
    styleTone: normalizeOptionalText(input.basicForm.styleTone),
    narrativePovLabel: getNarrativePovLabels(t)[input.basicForm.narrativePov],
    pacePreferenceLabel: getPacePreferenceLabels(t)[input.basicForm.pacePreference],
    emotionIntensityLabel: getEmotionIntensityLabels(t)[input.basicForm.emotionIntensity],
  };
}

export function buildNovelCoverDraftSourcePrompt(input: BuildNovelCoverDraftInput): string {
  return buildDefaultNovelCoverSourceDescription(buildNovelCoverDraftContext(input));
}
