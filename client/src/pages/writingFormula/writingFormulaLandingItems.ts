import {
  buildStyleIntentSummary,
  type StyleBinding,
  type StyleProfile,
} from "@ai-novel/shared/types/styleEngine";
import type { TFunction } from "i18next";
import {
  buildReadableRuleEntries,
  buildReadableRuleSummary,
} from "./writingFormulaRulePresentation";
import { getStyleProfileOriginLabel, isStarterStyleProfile } from "./writingFormulaV2.shared";

export interface LandingProfileItem {
  id: string;
  name: string;
  originLabel: string;
  summaryLine: string;
  detailLines: string[];
  description: string;
  recentNovelTitle?: string | null;
  category?: string | null;
  tags: string[];
  applicableGenres: string[];
  narrativeSummary: string;
  characterSummary: string;
  languageSummary: string;
  rhythmSummary: string;
  antiAiFocus: string[];
  antiAiRuleNames: string[];
  sourceTypeLabel: string;
  sourceContentPreview?: string | null;
  extractedFeatureCount: number;
  highRiskFeatureCount: number;
  selectedPresetLabel?: string | null;
  presetLabels: string[];
  extractionAntiAiRecommendationCount: number;
  bindingCount: number;
  updatedAtLabel: string;
  isStarter: boolean;
}

interface BuildLandingProfileItemsParams {
  profiles: StyleProfile[];
  allBindings: StyleBinding[];
  novelTitleMap: Record<string, string>;
  t: TFunction;
}

function compactText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function firstNonEmptyText(...values: unknown[]): string {
  for (const value of values) {
    const normalized = compactText(value);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function formatSourceTypeLabel(sourceType: StyleProfile["sourceType"], t: TFunction): string {
  switch (sourceType) {
    case "manual":
      return t("writingFormula.landingItems.sourceType.manual");
    case "from_text":
      return t("writingFormula.landingItems.sourceType.fromText");
    case "from_book_analysis":
      return t("writingFormula.landingItems.sourceType.fromBookAnalysis");
    case "from_knowledge_document":
      return t("writingFormula.landingItems.sourceType.fromKnowledgeDocument");
    case "from_current_work":
      return t("writingFormula.landingItems.sourceType.fromCurrentWork");
    default:
      return t("writingFormula.landingItems.sourceType.other");
  }
}

function formatUpdatedAtLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function buildNarrativeSummary(profile: StyleProfile, t: TFunction): string {
  return buildReadableRuleSummary("narrativeRules", profile.narrativeRules, t("writingFormula.landingItems.noNarrativeSummary"), t);
}

function buildCharacterSummary(profile: StyleProfile, t: TFunction): string {
  return buildReadableRuleSummary("characterRules", profile.characterRules, t("writingFormula.landingItems.noCharacterSummary"), t);
}

function buildLanguageSummary(profile: StyleProfile, t: TFunction): string {
  return buildReadableRuleSummary("languageRules", profile.languageRules, t("writingFormula.landingItems.noLanguageSummary"), t);
}

function buildRhythmSummary(profile: StyleProfile, t: TFunction): string {
  return buildReadableRuleSummary("rhythmRules", profile.rhythmRules, t("writingFormula.landingItems.noRhythmSummary"), t);
}

function buildSourceContentPreview(sourceContent?: string | null): string | null {
  const normalized = compactText(sourceContent);
  if (!normalized) {
    return null;
  }

  return normalized.length > 180 ? `${normalized.slice(0, 180)}...` : normalized;
}

export function buildLandingProfileItems(params: BuildLandingProfileItemsParams): LandingProfileItem[] {
  const { profiles, allBindings, novelTitleMap, t } = params;
  const recentNovelBindingsByProfileId = allBindings
    .filter((binding) => binding.targetType === "novel")
    .reduce<Map<string, StyleBinding>>((result, binding) => {
      const current = result.get(binding.styleProfileId);
      const bindingTimestamp = new Date(binding.updatedAt).getTime();
      const currentTimestamp = current ? new Date(current.updatedAt).getTime() : Number.NEGATIVE_INFINITY;

      if (!current || bindingTimestamp >= currentTimestamp) {
        result.set(binding.styleProfileId, binding);
      }

      return result;
    }, new Map<string, StyleBinding>());
  const bindingCountByProfileId = allBindings.reduce<Record<string, number>>((result, binding) => {
    result[binding.styleProfileId] = (result[binding.styleProfileId] ?? 0) + 1;
    return result;
  }, {});

  return [...profiles]
    .sort((left, right) => {
      const starterDelta = Number(isStarterStyleProfile(left)) - Number(isStarterStyleProfile(right));
      if (starterDelta !== 0) {
        return starterDelta;
      }
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    })
    .map((profile) => {
      const profileSummary = buildStyleIntentSummary({ styleProfile: profile });
      const characterEntries = buildReadableRuleEntries("characterRules", profile.characterRules, t);
      const dialogueEntry = characterEntries.find((entry) => entry.key === "dialogueStyle");
      const emotionEntry = characterEntries.find((entry) => entry.key === "emotionExpression");
      const detailLines = [
        firstNonEmptyText(profile.description, profileSummary?.readingFeel)
          ? t("writingFormula.landingItems.readingFeelLine", { value: firstNonEmptyText(profile.description, profileSummary?.readingFeel) })
          : "",
        t("writingFormula.landingItems.languageLine", { value: buildLanguageSummary(profile, t) }),
        dialogueEntry ? t("writingFormula.landingItems.dialogueLine", { value: dialogueEntry.value }) : "",
        emotionEntry ? t("writingFormula.landingItems.emotionLine", { value: emotionEntry.value }) : "",
        profileSummary?.antiAiFocus.length
          ? t("writingFormula.landingItems.antiAiLine", { value: profileSummary.antiAiFocus.join("；") })
          : "",
      ].filter(Boolean);
      const recentNovelBinding = recentNovelBindingsByProfileId.get(profile.id);
      const selectedPresetLabel = profile.selectedExtractionPresetKey
        ? (
          profile.extractionPresets.find((preset) => preset.key === profile.selectedExtractionPresetKey)?.label
          ?? profile.selectedExtractionPresetKey
        )
        : null;

      return {
        id: profile.id,
        name: profile.name,
        originLabel: getStyleProfileOriginLabel(t, profile),
        summaryLine: detailLines[0] ?? profile.description ?? t("writingFormula.landingItems.noSummary"),
        detailLines,
        description: firstNonEmptyText(profile.description, profileSummary?.readingFeel, t("writingFormula.landingItems.noDescription")),
        recentNovelTitle: recentNovelBinding
          ? (novelTitleMap[recentNovelBinding.targetId] ?? recentNovelBinding.targetId)
          : null,
        category: profile.category,
        tags: Array.from(new Set([...profile.tags, ...profile.applicableGenres].filter(Boolean))).slice(0, 6),
        applicableGenres: profile.applicableGenres.filter(Boolean),
        narrativeSummary: buildNarrativeSummary(profile, t),
        characterSummary: buildCharacterSummary(profile, t),
        languageSummary: buildLanguageSummary(profile, t),
        rhythmSummary: buildRhythmSummary(profile, t),
        antiAiFocus: profileSummary?.antiAiFocus ?? [],
        antiAiRuleNames: profile.antiAiRules.map((rule) => rule.name).slice(0, 6),
        sourceTypeLabel: formatSourceTypeLabel(profile.sourceType, t),
        sourceContentPreview: buildSourceContentPreview(profile.sourceContent),
        extractedFeatureCount: profile.extractedFeatures.filter((feature) => feature.enabled).length,
        highRiskFeatureCount: profile.extractedFeatures.filter((feature) => feature.fingerprintRisk >= 0.7).length,
        selectedPresetLabel,
        presetLabels: profile.extractionPresets.map((preset) => preset.label).slice(0, 3),
        extractionAntiAiRecommendationCount: profile.extractionAntiAiRuleKeys.length,
        bindingCount: bindingCountByProfileId[profile.id] ?? 0,
        updatedAtLabel: formatUpdatedAtLabel(profile.updatedAt),
        isStarter: isStarterStyleProfile(profile),
      };
    });
}
