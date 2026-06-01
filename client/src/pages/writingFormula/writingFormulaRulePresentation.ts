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
  const progressionModeMap = {
    time_sequence: t("novel:writingFormula.values.progressionMode.timeSequence"),
    goal_driven: t("novel:writingFormula.values.progressionMode.goalDriven"),
    mystery_escalation: t("novel:writingFormula.values.progressionMode.mysteryEscalation"),
    relationship_push_pull: t("novel:writingFormula.values.progressionMode.relationshipPushPull"),
    multi_thread: t("novel:writingFormula.values.progressionMode.multiThread"),
    scene_immersion: t("novel:writingFormula.values.progressionMode.sceneImmersion"),
    fact_driven: t("novel:writingFormula.values.progressionMode.factDriven"),
    contrast_driven: t("novel:writingFormula.values.progressionMode.contrastDriven"),
    // Chinese text aliases (legacy DB values)
    "按时间顺推": t("novel:writingFormula.values.progressionMode.timeSequence"),
    "目标驱动推进": t("novel:writingFormula.values.progressionMode.goalDriven"),
    "悬疑逐层加压": t("novel:writingFormula.values.progressionMode.mysteryEscalation"),
    "关系拉扯推进": t("novel:writingFormula.values.progressionMode.relationshipPushPull"),
    "多线交织推进": t("novel:writingFormula.values.progressionMode.multiThread"),
    "场景沉浸推进": t("novel:writingFormula.values.progressionMode.sceneImmersion"),
    "事实驱动推进": t("novel:writingFormula.values.progressionMode.factDriven"),
    "反差驱动推进": t("novel:writingFormula.values.progressionMode.contrastDriven"),
  };
  const endingStyleMap = {
    unresolved: t("novel:writingFormula.values.endingStyle.unresolved"),
    hook: t("novel:writingFormula.values.endingStyle.hook"),
    suspense: t("novel:writingFormula.values.endingStyle.suspense"),
    emotional_hook: t("novel:writingFormula.values.endingStyle.emotionalHook"),
    cross_hook: t("novel:writingFormula.values.endingStyle.crossHook"),
    soft_open: t("novel:writingFormula.values.endingStyle.softOpen"),
    pressure_continue: t("novel:writingFormula.values.endingStyle.pressureContinue"),
    bitter_aftertaste: t("novel:writingFormula.values.endingStyle.bitterAftertaste"),
    // Chinese text aliases
    "不收束核心困境": t("novel:writingFormula.values.endingStyle.unresolved"),
    "结尾抛钩子": t("novel:writingFormula.values.endingStyle.hook"),
    "悬念式收尾": t("novel:writingFormula.values.endingStyle.suspense"),
    "情绪钩子收尾": t("novel:writingFormula.values.endingStyle.emotionalHook"),
    "交叉线钩子收尾": t("novel:writingFormula.values.endingStyle.crossHook"),
    "柔开放收尾": t("novel:writingFormula.values.endingStyle.softOpen"),
    "压力延续式收尾": t("novel:writingFormula.values.endingStyle.pressureContinue"),
    "苦涩余味收尾": t("novel:writingFormula.values.endingStyle.bitterAftertaste"),
  };
  const emotionExpressionMap = {
    behavior_only: t("novel:writingFormula.values.emotionExpression.behaviorOnly"),
    dialogue_and_action: t("novel:writingFormula.values.emotionExpression.dialogueAndAction"),
    reaction_only: t("novel:writingFormula.values.emotionExpression.reactionOnly"),
    subtext: t("novel:writingFormula.values.emotionExpression.subtext"),
    mixed: t("novel:writingFormula.values.emotionExpression.mixed"),
    light_behavior: t("novel:writingFormula.values.emotionExpression.lightBehavior"),
    suppressed: t("novel:writingFormula.values.emotionExpression.suppressed"),
    deadpan: t("novel:writingFormula.values.emotionExpression.deadpan"),
    // Chinese text aliases
    "只通过动作外露": t("novel:writingFormula.values.emotionExpression.behaviorOnly"),
    "对白和动作共同外露": t("novel:writingFormula.values.emotionExpression.dialogueAndAction"),
    "主要通过反应外露": t("novel:writingFormula.values.emotionExpression.reactionOnly"),
    "通过言外之意外露": t("novel:writingFormula.values.emotionExpression.subtext"),
    "对白、动作和反应混合外露": t("novel:writingFormula.values.emotionExpression.mixed"),
    "以轻动作轻反应外露": t("novel:writingFormula.values.emotionExpression.lightBehavior"),
    "压住不直说": t("novel:writingFormula.values.emotionExpression.suppressed"),
    "冷反应式外露": t("novel:writingFormula.values.emotionExpression.deadpan"),
  };
  const dialogueStyleMap = {
    short_colloquial: t("novel:writingFormula.values.dialogueStyle.shortColloquial"),
    direct: t("novel:writingFormula.values.dialogueStyle.direct"),
    restrained: t("novel:writingFormula.values.dialogueStyle.restrained"),
    subtext_heavy: t("novel:writingFormula.values.dialogueStyle.subtextHeavy"),
    distinct_by_role: t("novel:writingFormula.values.dialogueStyle.distinctByRole"),
    daily_natural: t("novel:writingFormula.values.dialogueStyle.dailyNatural"),
    informational: t("novel:writingFormula.values.dialogueStyle.informational"),
    deadpan_colloquial: t("novel:writingFormula.values.dialogueStyle.deadpanColloquial"),
    // Chinese text aliases
    "短句口语式": t("novel:writingFormula.values.dialogueStyle.shortColloquial"),
    "直接硬朗": t("novel:writingFormula.values.dialogueStyle.direct"),
    "克制收着说": t("novel:writingFormula.values.dialogueStyle.restrained"),
    "言外之意重": t("novel:writingFormula.values.dialogueStyle.subtextHeavy"),
    "按角色明显拉开口吻差异": t("novel:writingFormula.values.dialogueStyle.distinctByRole"),
    "日常自然口吻": t("novel:writingFormula.values.dialogueStyle.dailyNatural"),
    "信息型克制对白": t("novel:writingFormula.values.dialogueStyle.informational"),
    "冷面口语式": t("novel:writingFormula.values.dialogueStyle.deadpanColloquial"),
  };
  const registerMap = {
    colloquial: t("novel:writingFormula.values.register.colloquial"),
    direct: t("novel:writingFormula.values.register.direct"),
    restrained: t("novel:writingFormula.values.register.restrained"),
    natural: t("novel:writingFormula.values.register.natural"),
    flexible: t("novel:writingFormula.values.register.flexible"),
    professional: t("novel:writingFormula.values.register.professional"),
    // Chinese text aliases
    "口语化": t("novel:writingFormula.values.register.colloquial"),
    "直接明快": t("novel:writingFormula.values.register.direct"),
    "克制收束": t("novel:writingFormula.values.register.restrained"),
    "自然日常": t("novel:writingFormula.values.register.natural"),
    "随角色灵活变化": t("novel:writingFormula.values.register.flexible"),
    "专业克制": t("novel:writingFormula.values.register.professional"),
  };
  const sentenceVariationMap = {
    high: t("novel:writingFormula.values.sentenceVariation.high"),
    medium: t("novel:writingFormula.values.sentenceVariation.medium"),
    medium_high: t("novel:writingFormula.values.sentenceVariation.mediumHigh"),
    // Chinese text aliases
    "变化大": t("novel:writingFormula.values.sentenceVariation.high"),
    "变化适中": t("novel:writingFormula.values.sentenceVariation.medium"),
    "变化偏大": t("novel:writingFormula.values.sentenceVariation.mediumHigh"),
  };
  const paceMap = {
    medium_fast: t("novel:writingFormula.values.pace.mediumFast"),
    fast: t("novel:writingFormula.values.pace.fast"),
    medium: t("novel:writingFormula.values.pace.medium"),
    medium_slow: t("novel:writingFormula.values.pace.mediumSlow"),
    balanced: t("novel:writingFormula.values.pace.balanced"),
    slow: t("novel:writingFormula.values.pace.slow"),
    // Chinese text aliases
    "中快": t("novel:writingFormula.values.pace.mediumFast"),
    "快": t("novel:writingFormula.values.pace.fast"),
    "中速": t("novel:writingFormula.values.pace.medium"),
    "中慢": t("novel:writingFormula.values.pace.mediumSlow"),
    "均衡": t("novel:writingFormula.values.pace.balanced"),
    "慢": t("novel:writingFormula.values.pace.slow"),
  };
  const paragraphDensityMap = {
    high: t("novel:writingFormula.values.paragraphDensity.high"),
    medium: t("novel:writingFormula.values.paragraphDensity.medium"),
    medium_high: t("novel:writingFormula.values.paragraphDensity.mediumHigh"),
    // Chinese text aliases
    "高密度": t("novel:writingFormula.values.paragraphDensity.high"),
    "中密度": t("novel:writingFormula.values.paragraphDensity.medium"),
    "中高密度": t("novel:writingFormula.values.paragraphDensity.mediumHigh"),
  };
  return {
    progressionMode: progressionModeMap,
    endingStyle: endingStyleMap,
    povSwitchStyle: {
      controlled: t("novel:writingFormula.values.povSwitchStyle.controlled"),
      "受控切换": t("novel:writingFormula.values.povSwitchStyle.controlled"),
    },
    emotionExpression: emotionExpressionMap,
    dialogueStyle: dialogueStyleMap,
    register: registerMap,
    sentenceVariation: sentenceVariationMap,
    pace: paceMap,
    paragraphDensity: paragraphDensityMap,
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
