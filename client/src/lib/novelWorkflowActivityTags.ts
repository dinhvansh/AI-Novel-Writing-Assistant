import type { TFunction } from "i18next";

// i18n-ignore: these are internal activity tag strings matched against server-emitted labels
const WORKFLOW_ACTIVITY_TAGS_ZH = [
  "资产回灌中",
  "角色成长中",
  "状态同步中",
  "资源账本同步中",
  "伏笔账本同步中",
  "账本校准中",
  "伏笔回填中",
] as const;

export type WorkflowActivityTag = typeof WORKFLOW_ACTIVITY_TAGS_ZH[number];

export function getWorkflowActivityTagKeys(): string[] {
  return [
    "workflow:activityTags.assetBackfill",
    "workflow:activityTags.characterGrowth",
    "workflow:activityTags.stateSync",
    "workflow:activityTags.resourceLedgerSync",
    "workflow:activityTags.payoffLedgerSync",
    "workflow:activityTags.ledgerCalibration",
    "workflow:activityTags.payoffBackfill",
  ];
}

export function extractWorkflowActivityTags(value: string | null | undefined): string[] {
  const source = value?.trim() ?? "";
  if (!source) {
    return [];
  }
  return WORKFLOW_ACTIVITY_TAGS_ZH.filter((label) => source.includes(label));
}

export function extractWorkflowActivityTagsLocalized(
  value: string | null | undefined,
  t: TFunction,
): string[] {
  const source = value?.trim() ?? "";
  if (!source) {
    return [];
  }
  const keys = getWorkflowActivityTagKeys();
  return WORKFLOW_ACTIVITY_TAGS_ZH
    .map((zhLabel, index) => ({ zhLabel, key: keys[index] }))
    .filter(({ zhLabel }) => source.includes(zhLabel))
    .map(({ key }) => t(key));
}
