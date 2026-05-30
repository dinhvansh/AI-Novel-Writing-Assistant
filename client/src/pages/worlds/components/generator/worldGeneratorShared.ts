import type {
  WorldOptionRefinementLevel,
  WorldPropertyOption,
  WorldReferenceMode,
  WorldReferenceSeedBundle,
  WorldReferenceSeedSelection,
} from "@ai-novel/shared/types/worldWizard";
import type { TFunction } from "i18next";

export type InspirationMode = "free" | "reference" | "random";

export interface WorldGeneratorConceptCard {
  worldType: string;
  templateKey: string;
  coreImagery: string[];
  tone: string;
  keywords: string[];
  summary: string;
}

export interface GeneratorGenreOption {
  id: string;
  name: string;
  path: string;
  description?: string | null;
  template?: string | null;
}

export interface WorldGeneratorTemplateOption {
  key: string;
  name: string;
  description: string;
  worldType: string;
  classicElements: string[];
  pitfalls: string[];
}

export const REFERENCE_MODE_OPTIONS: Array<{
  value: WorldReferenceMode;
  label: string;
  description: string;
}> = [
  {
    value: "adapt_world",
    label: "基于原作做架空改造", // i18n-ignore: deprecated fallback — use getReferenceModeOptions(t)
    description: "保留原作世界基底，再决定哪些规则、势力和地点结构可以改造。", // i18n-ignore: deprecated fallback — use getReferenceModeOptions(t)
  },
  {
    value: "extract_base",
    label: "提取原作世界基底", // i18n-ignore: deprecated fallback — use getReferenceModeOptions(t)
    description: "先稳定抽出原作世界骨架，后续扩写尽量围绕原作事实展开。", // i18n-ignore: deprecated fallback — use getReferenceModeOptions(t)
  },
  {
    value: "tone_rebuild",
    label: "只借原作气质与结构重建", // i18n-ignore: deprecated fallback — use getReferenceModeOptions(t)
    description: "保留氛围、关系结构与生活手感，但允许较大幅度重建世界事实。", // i18n-ignore: deprecated fallback — use getReferenceModeOptions(t)
  },
];

export const DEFAULT_DIMENSIONS: Record<string, boolean> = {
  foundation: true,
  power: true,
  society: true,
  culture: true,
  history: true,
  conflict: true,
};

// i18n-ignore: deprecated fallback constants — use getDimensionLabelI18n(t, key) for i18n-aware labels
const DIMENSION_LABELS: Record<string, string> = {
  foundation: "基础层", // i18n-ignore: deprecated fallback
  power: "力量层", // i18n-ignore: deprecated fallback
  society: "社会层", // i18n-ignore: deprecated fallback
  culture: "文化层", // i18n-ignore: deprecated fallback
  history: "历史层", // i18n-ignore: deprecated fallback
  conflict: "冲突层", // i18n-ignore: deprecated fallback
};

export const REFERENCE_SEED_SELECTION_KEYS: Record<
  keyof WorldReferenceSeedBundle,
  keyof WorldReferenceSeedSelection
> = {
  rules: "ruleIds",
  factions: "factionIds",
  forces: "forceIds",
  locations: "locationIds",
};

export function getDimensionLabel(key: string): string {
  return DIMENSION_LABELS[key] ?? key;
}

/** Resolve translated dimension label at runtime. */
export function getDimensionLabelI18n(t: TFunction, key: string): string {
  return t(`generator.dimensions.${key}`, { defaultValue: DIMENSION_LABELS[key] ?? key });
}

/** Build translated reference mode options at runtime. */
export function getReferenceModeOptions(t: TFunction): Array<{ value: WorldReferenceMode; label: string; description: string }> {
  return [
    { value: "adapt_world", label: t("generator.referenceModes.adapt_world.label"), description: t("generator.referenceModes.adapt_world.description") },
    { value: "extract_base", label: t("generator.referenceModes.extract_base.label"), description: t("generator.referenceModes.extract_base.description") },
    { value: "tone_rebuild", label: t("generator.referenceModes.tone_rebuild.label"), description: t("generator.referenceModes.tone_rebuild.description") },
  ];
}

/** @deprecated Use getReferenceModeOptions(t) for i18n-aware label. */
export function getReferenceModeLabel(mode: WorldReferenceMode): string {
  return REFERENCE_MODE_OPTIONS.find((item) => item.value === mode)?.label ?? REFERENCE_MODE_OPTIONS[0].label;
}

export function normalizeAxiomTexts(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
    .filter(Boolean);
}

export function clampOptionsCount(value: number): number {
  return Math.max(4, Math.min(8, Math.floor(value)));
}

export function parseReferenceControlText(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,，;；]/) // i18n-ignore: regex delimiter characters, not UI text
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function buildDefaultPropertySelectionState(options: WorldPropertyOption[]) {
  return {
    selectedIds: options.map((option) => option.id),
    selectedChoiceIds: options.reduce<Record<string, string>>((acc, option) => {
      const firstChoiceId = option.choices?.[0]?.id;
      if (firstChoiceId) {
        acc[option.id] = firstChoiceId;
      }
      return acc;
    }, {}),
  };
}

export function buildDefaultReferenceSeedSelection(seeds: WorldReferenceSeedBundle): WorldReferenceSeedSelection {
  return {
    ruleIds: seeds.rules.map((item) => item.id),
    factionIds: seeds.factions.map((item) => item.id),
    forceIds: seeds.forces.map((item) => item.id),
    locationIds: seeds.locations.map((item) => item.id),
  };
}

export function isWorldGeneratorTemplateOption(
  value: unknown,
): value is WorldGeneratorTemplateOption {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.key === "string" && typeof record.name === "string";
}

export type GeneratorOptionRefinementLevel = WorldOptionRefinementLevel;
