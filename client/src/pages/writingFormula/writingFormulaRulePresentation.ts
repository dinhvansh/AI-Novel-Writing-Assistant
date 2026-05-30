import type { TFunction } from "i18next";
import type {
  CharacterRules,
  LanguageRules,
  NarrativeRules,
  RhythmRules,
} from "@ai-novel/shared/types/styleEngine";

export type RuleSection = "narrativeRules" | "characterRules" | "languageRules" | "rhythmRules";
type RuleObject = NarrativeRules | CharacterRules | LanguageRules | RhythmRules;

export interface RuleEntry {
  key: string;
  label: string;
  value: string;
}

const FIELD_ORDER: Record<RuleSection, string[]> = {
  narrativeRules: [
    "summary",
    "progressionMode",
    "sceneUnitPattern",
    "multiPov",
    "looping",
    "endingStyle",
    "povSwitchStyle",
  ],
  characterRules: [
    "summary",
    "dialogueStyle",
    "emotionExpression",
    "defenseMechanisms",
    "allowSelfReflection",
    "facePriority",
  ],
  languageRules: [
    "summary",
    "register",
    "roughness",
    "sentenceVariation",
    "allowIncompleteSentences",
    "allowSwearing",
    "allowUselessDetails",
  ],
  rhythmRules: [
    "summary",
    "pace",
    "paragraphDensity",
    "allowFragmentedFlow",
    "actionOverExplanation",
  ],
};

function getFieldLabels(t: TFunction): Record<RuleSection, Record<string, string>> {
  return {
    narrativeRules: {
      summary: t("novel:writingFormula.fields.narrativeRules.summary"),
      progressionMode: t("novel:writingFormula.fields.narrativeRules.progressionMode"),
      sceneUnitPattern: t("novel:writingFormula.fields.narrativeRules.sceneUnitPattern"),
      multiPov: t("novel:writingFormula.fields.narrativeRules.multiPov"),
      looping: t("novel:writingFormula.fields.narrativeRules.looping"),
      endingStyle: t("novel:writingFormula.fields.narrativeRules.endingStyle"),
      povSwitchStyle: t("novel:writingFormula.fields.narrativeRules.povSwitchStyle"),
    },
    characterRules: {
      summary: t("novel:writingFormula.fields.characterRules.summary"),
      dialogueStyle: t("novel:writingFormula.fields.characterRules.dialogueStyle"),
      emotionExpression: t("novel:writingFormula.fields.characterRules.emotionExpression"),
      defenseMechanisms: t("novel:writingFormula.fields.characterRules.defenseMechanisms"),
      allowSelfReflection: t("novel:writingFormula.fields.characterRules.allowSelfReflection"),
      facePriority: t("novel:writingFormula.fields.characterRules.facePriority"),
    },
    languageRules: {
      summary: t("novel:writingFormula.fields.languageRules.summary"),
      register: t("novel:writingFormula.fields.languageRules.register"),
      roughness: t("novel:writingFormula.fields.languageRules.roughness"),
      sentenceVariation: t("novel:writingFormula.fields.languageRules.sentenceVariation"),
      allowIncompleteSentences: t("novel:writingFormula.fields.languageRules.allowIncompleteSentences"),
      allowSwearing: t("novel:writingFormula.fields.languageRules.allowSwearing"),
      allowUselessDetails: t("novel:writingFormula.fields.languageRules.allowUselessDetails"),
    },
    rhythmRules: {
      summary: t("novel:writingFormula.fields.rhythmRules.summary"),
      pace: t("novel:writingFormula.fields.rhythmRules.pace"),
      paragraphDensity: t("novel:writingFormula.fields.rhythmRules.paragraphDensity"),
      allowFragmentedFlow: t("novel:writingFormula.fields.rhythmRules.allowFragmentedFlow"),
      actionOverExplanation: t("novel:writingFormula.fields.rhythmRules.actionOverExplanation"),
    },
  };
}

function getFieldValueMaps(t: TFunction): Record<string, Record<string, string>> {
  return {
    progressionMode: {
      time_sequence: t("novel:writingFormula.values.progressionMode.timeSequence"),
      goal_driven: t("novel:writingFormula.values.progressionMode.goalDriven"),
      mystery_escalation: t("novel:writingFormula.values.progressionMode.mysteryEscalation"),
      relationship_push_pull: t("novel:writingFormula.values.progressionMode.relationshipPushPull"),
      multi_thread: t("novel:writingFormula.values.progressionMode.multiThread"),
      scene_immersion: t("novel:writingFormula.values.progressionMode.sceneImmersion"),
      fact_driven: t("novel:writingFormula.values.progressionMode.factDriven"),
      contrast_driven: t("novel:writingFormula.values.progressionMode.contrastDriven"),
    },
    endingStyle: {
      unresolved: t("novel:writingFormula.values.endingStyle.unresolved"),
      hook: t("novel:writingFormula.values.endingStyle.hook"),
      suspense: t("novel:writingFormula.values.endingStyle.suspense"),
      emotional_hook: t("novel:writingFormula.values.endingStyle.emotionalHook"),
      cross_hook: t("novel:writingFormula.values.endingStyle.crossHook"),
      soft_open: t("novel:writingFormula.values.endingStyle.softOpen"),
      pressure_continue: t("novel:writingFormula.values.endingStyle.pressureContinue"),
      bitter_aftertaste: t("novel:writingFormula.values.endingStyle.bitterAftertaste"),
    },
    povSwitchStyle: {
      controlled: t("novel:writingFormula.values.povSwitchStyle.controlled"),
    },
    emotionExpression: {
      behavior_only: t("novel:writingFormula.values.emotionExpression.behaviorOnly"),
      dialogue_and_action: t("novel:writingFormula.values.emotionExpression.dialogueAndAction"),
      reaction_only: t("novel:writingFormula.values.emotionExpression.reactionOnly"),
      subtext: t("novel:writingFormula.values.emotionExpression.subtext"),
      mixed: t("novel:writingFormula.values.emotionExpression.mixed"),
      light_behavior: t("novel:writingFormula.values.emotionExpression.lightBehavior"),
      suppressed: t("novel:writingFormula.values.emotionExpression.suppressed"),
      deadpan: t("novel:writingFormula.values.emotionExpression.deadpan"),
    },
    dialogueStyle: {
      short_colloquial: t("novel:writingFormula.values.dialogueStyle.shortColloquial"),
      direct: t("novel:writingFormula.values.dialogueStyle.direct"),
      restrained: t("novel:writingFormula.values.dialogueStyle.restrained"),
      subtext_heavy: t("novel:writingFormula.values.dialogueStyle.subtextHeavy"),
      distinct_by_role: t("novel:writingFormula.values.dialogueStyle.distinctByRole"),
      daily_natural: t("novel:writingFormula.values.dialogueStyle.dailyNatural"),
      informational: t("novel:writingFormula.values.dialogueStyle.informational"),
      deadpan_colloquial: t("novel:writingFormula.values.dialogueStyle.deadpanColloquial"),
    },
    register: {
      colloquial: t("novel:writingFormula.values.register.colloquial"),
      direct: t("novel:writingFormula.values.register.direct"),
      restrained: t("novel:writingFormula.values.register.restrained"),
      natural: t("novel:writingFormula.values.register.natural"),
      flexible: t("novel:writingFormula.values.register.flexible"),
      professional: t("novel:writingFormula.values.register.professional"),
    },
    sentenceVariation: {
      high: t("novel:writingFormula.values.sentenceVariation.high"),
      medium: t("novel:writingFormula.values.sentenceVariation.medium"),
      medium_high: t("novel:writingFormula.values.sentenceVariation.mediumHigh"),
    },
    pace: {
      medium_fast: t("novel:writingFormula.values.pace.mediumFast"),
      fast: t("novel:writingFormula.values.pace.fast"),
      medium: t("novel:writingFormula.values.pace.medium"),
      medium_slow: t("novel:writingFormula.values.pace.mediumSlow"),
      balanced: t("novel:writingFormula.values.pace.balanced"),
      slow: t("novel:writingFormula.values.pace.slow"),
    },
    paragraphDensity: {
      high: t("novel:writingFormula.values.paragraphDensity.high"),
      medium: t("novel:writingFormula.values.paragraphDensity.medium"),
      medium_high: t("novel:writingFormula.values.paragraphDensity.mediumHigh"),
    },
  };
}

function compactText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function humanizeUnknownToken(value: string): string {
  return value.replace(/_/g, " ").trim();
}

function formatBooleanValue(key: string, value: boolean, t: TFunction): string {
  return t(`novel:writingFormula.booleans.${key}.${value ? "true" : "false"}`, {
    defaultValue: value ? t("novel:writingFormula.booleans.default.true") : t("novel:writingFormula.booleans.default.false"),
  });
}

function formatArrayValue(value: unknown[]): string {
  return value
    .map((item) => {
      if (typeof item === "string") return humanizeUnknownToken(item);
      return String(item);
    })
    .filter(Boolean)
    .join(" / ");
}

export function formatRuleFieldLabel(section: RuleSection, key: string, t: TFunction): string {
  return getFieldLabels(t)[section][key] ?? humanizeUnknownToken(key);
}

export function formatRuleFieldValue(section: RuleSection, key: string, value: unknown, t: TFunction): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return formatBooleanValue(key, value, t);
  if (typeof value === "number") {
    if (key === "roughness") return `${Math.round(value * 100)} / 100`;
    return String(value);
  }
  if (Array.isArray(value)) return formatArrayValue(value);
  if (typeof value === "string") {
    const normalized = compactText(value);
    if (!normalized) return "";
    return getFieldValueMaps(t)[key]?.[normalized] ?? normalized;
  }
  return "";
}

export function buildReadableRuleEntries(section: RuleSection, rules: RuleObject | Record<string, unknown>, t: TFunction): RuleEntry[] {
  const record = rules as Record<string, unknown>;
  const keySet = new Set<string>([
    ...FIELD_ORDER[section],
    ...Object.keys(record),
  ]);

  return Array.from(keySet)
    .map((key) => ({
      key,
      label: formatRuleFieldLabel(section, key, t),
      value: formatRuleFieldValue(section, key, record[key], t),
    }))
    .filter((entry) => Boolean(entry.value))
    .sort((left, right) => {
      const leftIndex = FIELD_ORDER[section].indexOf(left.key);
      const rightIndex = FIELD_ORDER[section].indexOf(right.key);
      const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
      return normalizedLeft - normalizedRight;
    });
}

export function buildReadableRuleSummary(
  section: RuleSection,
  rules: RuleObject | Record<string, unknown>,
  fallback: string,
  t: TFunction,
): string {
  const entries = buildReadableRuleEntries(section, rules, t);
  if (entries.length === 0) return fallback;
  return entries
    .slice(0, 3)
    .map((entry) => (entry.key === "summary" ? entry.value : `${entry.label}：${entry.value}`))
    .join("；");
}
