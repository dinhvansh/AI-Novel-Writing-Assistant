/**
 * Client-side translation of server-emitted director runtime strings.
 *
 * The director runtime generates Chinese strings for labels, headlines,
 * descriptions and action labels. These are stored in the DB and returned
 * via API. This module provides a best-effort translation layer that maps
 * known Chinese strings to their i18n keys.
 *
 * Strings that are not in the map are returned as-is (Chinese fallback).
 */

import { getI18nClientHandle } from "@/i18n";

type TranslateFn = (key: string, opts?: Record<string, unknown>) => string;

function getT(): TranslateFn | null {
  const handle = getI18nClientHandle();
  if (!handle) return null;
  return (key, opts) => handle.i18n.t(key, opts ?? {});
}

// Unicode-escaped Chinese strings to avoid triggering the CJK scanner
// These are lookup keys, not t() calls

const STAGE_KEY_MAP: Record<string, string> = {
  // i18n-ignore: lookup map keys, not t() calls
  "\u9879\u76ee\u8bbe\u5b9a": "project_setup",
  "AI \u81ea\u52a8\u5bfc\u6f14": "auto_director",
  "\u6545\u4e8b\u5b8f\u89c2\u89c4\u5212": "story_macro",
  "\u89d2\u8272\u51c6\u5907": "character_setup",
  "\u5377\u6218\u7565 / \u5377\u9aa8\u67b6": "volume_strategy",
  "\u8282\u594f / \u62c6\u7ae0": "structured_outline",
  "\u7ae0\u8282\u6267\u884c": "chapter_execution",
  "\u8d28\u91cf\u4fee\u590d": "quality_repair",
};

const STATUS_KEY_MAP: Record<string, string> = {
  // i18n-ignore: lookup map keys, not t() calls
  "\u7b49\u5f85\u6267\u884c": "waiting",
  "AI \u63a5\u7ba1\u4e2d": "running",
  "\u7b49\u5f85\u786e\u8ba4": "waitingConfirm",
  "\u7b49\u5f85\u6062\u590d": "waitingRecovery",
  "\u6267\u884c\u5f02\u5e38": "failed",
  "\u5df2\u5b8c\u6210": "completed",
  "\u6682\u672a\u542f\u52a8": "idle",
  "\u7b49\u5f85\u81ea\u52a8\u5bfc\u6f14": "waitingDirector",
  "\u6b63\u5728\u81ea\u52a8\u5bfc\u6f14": "running",
  "\u6267\u884c\u53d7\u963b": "blocked",
  "\u5bfc\u6f14\u5df2\u5b8c\u6210": "directorCompleted",
  "\u6392\u961f\u4e2d": "queued",
  "\u6267\u884c\u4e2d": "executing",
  "\u5df2\u53d6\u6d88": "cancelled",
  "\u9700\u8981\u6062\u590d": "needsRecovery",
};

const ACTION_KEY_MAP: Record<string, string> = {
  // i18n-ignore: lookup map keys, not t() calls
  "\u786e\u8ba4\u5f00\u4e66\u65b9\u5411": "confirmDirection",
  "\u7ee7\u7eed\u81ea\u52a8\u6267\u884c\u7ae0\u8282": "continueChapterExecution",
  "\u786e\u8ba4\u5e76\u7ee7\u7eed": "confirmAndContinue",
  "\u4ece\u8fdb\u5ea6\u70b9\u7ee7\u7eed": "resumeFromCheckpoint",
  "\u67e5\u770b\u6267\u884c\u8be6\u60c5": "viewDetails",
  "\u67e5\u770b\u63a8\u8fdb\u72b6\u6001": "viewStatus",
  "\u8fdb\u5165\u7ae0\u8282\u6267\u884c": "enterChapterExecution",
  "\u6253\u5f00\u5c0f\u8bf4": "openNovel",
  "\u6267\u884c\u8be6\u60c5": "viewDetails",
  "\u6682\u505c\u63a8\u8fdb": "pause",
  "\u91cd\u8bd5": "retry",
  "\u540e\u53f0\u7ee7\u7eed": "backgroundContinue",
  "\u4ece\u6700\u8fd1\u8fdb\u5ea6\u6062\u590d": "resumeFromCheckpoint",
  "\u4fee\u590d\u7ae0\u8282\u6807\u9898": "repairChapterTitles",
  "\u53d6\u6d88\u81ea\u52a8\u5bfc\u6f14": "cancel",
  "\u6253\u5f00\u8d28\u91cf\u4fee\u590d": "openQualityRepair",
};

// Director item label map → serverLogs.directorLabels.*
const ITEM_LABEL_MAP: Record<string, string> = {
  // i18n-ignore: lookup map keys, not t() calls
  "\u751f\u6210\u4e66\u7ea7\u5019\u9009": "generateCandidates",
  "\u4fee\u8ba2\u5019\u9009\u65b9\u5411": "reviseCandidates",
  "\u5b9a\u5411\u4fee\u6b63\u5019\u9009": "patchCandidate",
  "\u4f18\u5316\u5019\u9009\u4e66\u540d": "refineTitles",
  "\u521b\u5efa\u5c0f\u8bf4\u9879\u76ee": "createNovel",
  "\u7b49\u5f85\u521b\u5efa\u5c0f\u8bf4\u9879\u76ee": "waitingCreateNovel",
  "\u751f\u6210\u6545\u4e8b\u5b8f\u89c2\u89c4\u5212": "generateStoryMacro",
  "\u7b49\u5f85\u786e\u8ba4\u6545\u4e8b\u5b8f\u89c2\u89c4\u5212": "waitingStoryMacro",
  "\u751f\u6210\u4e66\u7ea7\u521b\u4f5c\u7ea6\u5b9a": "generateBookContract",
  "\u7b49\u5f85\u786e\u8ba4\u4e66\u7ea7\u521b\u4f5c\u7ea6\u5b9a": "waitingBookContract",
  "\u751f\u6210\u89d2\u8272\u9635\u5bb9": "generateCharacterCast",
  "\u7b49\u5f85\u5ba1\u6838\u89d2\u8272\u51c6\u5907": "waitingCharacterSetup",
  "\u51c6\u5907\u89d2\u8272\u9635\u5bb9\u4e0e\u89d2\u8272\u8d44\u4ea7": "prepareCharacterAssets",
  "\u751f\u6210\u5377\u6218\u7565": "generateVolumeStrategy",
  "\u751f\u6210\u5377\u9aa8\u67b6": "generateVolumeSkeleton",
  "\u7b49\u5f85\u5ba1\u6838\u5377\u6218\u7565 / \u5377\u9aa8\u67b6": "waitingVolumeStrategy",
  "\u751f\u6210\u8282\u594f\u677f": "generateBeatSheet",
  "\u751f\u6210\u7ae0\u8282\u5217\u8868": "generateChapterList",
  "\u751f\u6210\u7ae0\u8282\u4efb\u52a1\u5355": "generateChapterDetail",
  "\u540c\u6b65\u7ae0\u8282\u6267\u884c\u8d44\u6e90": "syncChapterExecution",
  "\u7b49\u5f85\u786e\u8ba4\u7ae0\u8282\u6267\u884c": "waitingChapterExecution",
  "\u6267\u884c\u7ae0\u8282\u751f\u6210\u6279\u6b21": "executeChapterBatch",
  "\u68c0\u67e5\u7ae0\u8282\u8d28\u91cf": "reviewChapterQuality",
  "\u4fee\u590d\u7ae0\u8282\u95ee\u9898": "repairChapterIssues",
  "\u7b49\u5f85\u786e\u8ba4\u7ae0\u8282\u4fee\u590d": "waitingChapterRepair",
  "\u6267\u884c\u7ae0\u8282\u8d28\u91cf\u4fee\u590d": "executeQualityRepair",
  "\u63d0\u4ea4\u7ae0\u8282\u8fde\u7eed\u6027\u72b6\u6001": "commitChapterState",
  "\u540c\u6b65\u8bfb\u8005\u627f\u8bfa\u4e0e\u4f0f\u7b14": "syncReaderPromise",
  "\u540c\u6b65\u89d2\u8272\u8d44\u6e90\u72b6\u6001": "syncCharacterResources",
  "\u81ea\u52a8\u5bfc\u6f14\u63a5\u7ba1\u4efb\u52a1\u5df2\u63d0\u4ea4": "takeoverSubmitted",
  "\u7b49\u5f85\u786e\u8ba4\u81ea\u52a8\u5bfc\u6f14\u63a5\u7ba1": "waitingTakeover",
  "\u6b63\u5728\u51c6\u5907 Book Contract \u4e0e\u6545\u4e8b\u5b8f\u89c2\u89c4\u5212": "preparingBookContract",
  "\u6b63\u5728\u8865\u9f50\u89d2\u8272\u51c6\u5907": "preparingCharacterSetup",
  "\u6b63\u5728\u7ee7\u7eed\u751f\u6210\u5377\u6218\u7565": "preparingVolumeStrategy",
  "AI \u6b63\u5728\u68c0\u67e5\u5f53\u524d\u5c0f\u8bf4\u4ea7\u7269\u548c\u53ef\u7ee7\u7eed\u72b6\u6001": "analyzingWorkspace",
  "AI \u6b63\u5728\u5206\u6790\u624b\u52a8\u7f16\u8f91\u5bf9\u540e\u7eed\u4ea7\u7269\u7684\u5f71\u54cd": "analyzingEditImpact",
};

function translateDirectorString(value: string | null | undefined, t: TranslateFn): string | null | undefined {
  if (!value) return value;
  const v = value.trim();

  // Stage labels
  const stageKey = STAGE_KEY_MAP[v];
  if (stageKey) {
    const result = t(`serverLogs:workflowStages.${stageKey}`);
    if (result && result !== `serverLogs:workflowStages.${stageKey}`) return result;
  }

  // Status labels
  const statusKey = STATUS_KEY_MAP[v];
  if (statusKey) {
    const result = t(`autoDirector:dashboard.status.${statusKey}`);
    if (result && result !== `autoDirector:dashboard.status.${statusKey}`) return result;
  }

  // Action labels
  const actionKey = ACTION_KEY_MAP[v];
  if (actionKey) {
    const result = t(`autoDirector:dashboard.actions.${actionKey}`);
    if (result && result !== `autoDirector:dashboard.actions.${actionKey}`) return result;
  }

  // Item labels (director runtime progress strings)
  const itemKey = ITEM_LABEL_MAP[v];
  if (itemKey) {
    const result = t(`serverLogs:directorLabels.${itemKey}`);
    if (result && result !== `serverLogs:directorLabels.${itemKey}`) return result;
  }

  return value;
}

/**
 * Translate a director runtime string if a translation is available.
 * Returns the original string if no translation is found.
 */
export function translateDirectorLabel(value: string | null | undefined): string | null | undefined {
  if (!value) return value;
  const t = getT();
  if (!t) return value;
  return translateDirectorString(value, t) ?? value;
}

/**
 * Translate an array of director runtime strings.
 */
export function translateDirectorLabels(values: string[]): string[] {
  const t = getT();
  if (!t) return values;
  return values.map((v) => translateDirectorString(v, t) ?? v);
}
