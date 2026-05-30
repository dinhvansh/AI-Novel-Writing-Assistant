/**
 * DirectorPayloadLocalizer — translates server-emitted director runtime strings
 * in task/director API responses before they are sent to the client.
 *
 * Strategy: pattern-based substring matching against known Chinese strings.
 * Falls back to the original string when no match is found.
 *
 * This covers Phase 4.4.1: translate task.currentItemLabel, task.currentStage,
 * milestone.summary, and similar user-facing payload fields.
 */

import type { LocaleCode } from "@ai-novel/shared/localization";
import { DEFAULT_LOCALE } from "@ai-novel/shared/localization";
import { getI18nServerHandle } from "../../i18n";

type TranslateFn = (key: string, opts?: Record<string, unknown>) => string;

function getT(locale: LocaleCode): TranslateFn | null {
  const handle = getI18nServerHandle();
  if (!handle) return null;
  return (key, opts) => handle.t("serverLogs", key, { lng: locale, ...(opts ?? {}) });
}

// ---------------------------------------------------------------------------
// Stage label map (key → serverLogs.workflowStages.*)
// ---------------------------------------------------------------------------
const STAGE_MAP: Record<string, string> = {
  // i18n-ignore: lookup map keys
  "\u9879\u76ee\u8bbe\u5b9a": "workflowStages.project_setup",
  "AI \u81ea\u52a8\u5bfc\u6f14": "workflowStages.auto_director",
  "\u6545\u4e8b\u5b8f\u89c2\u89c4\u5212": "workflowStages.story_macro",
  "\u89d2\u8272\u51c6\u5907": "workflowStages.character_setup",
  "\u5377\u6218\u7565 / \u5377\u9aa8\u67b6": "workflowStages.volume_strategy",
  "\u8282\u594f / \u62c6\u7ae0": "workflowStages.structured_outline",
  "\u7ae0\u8282\u6267\u884c": "workflowStages.chapter_execution",
  "\u8d28\u91cf\u4fee\u590d": "workflowStages.quality_repair",
};

// ---------------------------------------------------------------------------
// itemLabel / currentItemLabel map (Chinese string → serverLogs.directorLabels.*)
// ---------------------------------------------------------------------------
const ITEM_LABEL_MAP: Record<string, string> = {
  // i18n-ignore: lookup map keys
  "\u751f\u6210\u4e66\u7ea7\u5019\u9009": "directorLabels.generateCandidates",
  "\u4fee\u8ba2\u5019\u9009\u65b9\u5411": "directorLabels.reviseCandidates",
  "\u5b9a\u5411\u4fee\u6b63\u5019\u9009": "directorLabels.patchCandidate",
  "\u4f18\u5316\u5019\u9009\u4e66\u540d": "directorLabels.refineTitles",
  "\u521b\u5efa\u5c0f\u8bf4\u9879\u76ee": "directorLabels.createNovel",
  "\u7b49\u5f85\u521b\u5efa\u5c0f\u8bf4\u9879\u76ee": "directorLabels.waitingCreateNovel",
  "\u751f\u6210\u6545\u4e8b\u5b8f\u89c2\u89c4\u5212": "directorLabels.generateStoryMacro",
  "\u7b49\u5f85\u786e\u8ba4\u6545\u4e8b\u5b8f\u89c2\u89c4\u5212": "directorLabels.waitingStoryMacro",
  "\u751f\u6210\u4e66\u7ea7\u521b\u4f5c\u7ea6\u5b9a": "directorLabels.generateBookContract",
  "\u7b49\u5f85\u786e\u8ba4\u4e66\u7ea7\u521b\u4f5c\u7ea6\u5b9a": "directorLabels.waitingBookContract",
  "\u751f\u6210\u89d2\u8272\u9635\u5bb9": "directorLabels.generateCharacterCast",
  "\u7b49\u5f85\u5ba1\u6838\u89d2\u8272\u51c6\u5907": "directorLabels.waitingCharacterSetup",
  "\u51c6\u5907\u89d2\u8272\u9635\u5bb9\u4e0e\u89d2\u8272\u8d44\u4ea7": "directorLabels.prepareCharacterAssets",
  "\u751f\u6210\u5377\u6218\u7565": "directorLabels.generateVolumeStrategy",
  "\u751f\u6210\u5377\u9aa8\u67b6": "directorLabels.generateVolumeSkeleton",
  "\u7b49\u5f85\u5ba1\u6838\u5377\u6218\u7565 / \u5377\u9aa8\u67b6": "directorLabels.waitingVolumeStrategy",
  "\u751f\u6210\u8282\u594f\u677f": "directorLabels.generateBeatSheet",
  "\u751f\u6210\u7ae0\u8282\u5217\u8868": "directorLabels.generateChapterList",
  "\u751f\u6210\u7ae0\u8282\u4efb\u52a1\u5355": "directorLabels.generateChapterDetail",
  "\u540c\u6b65\u7ae0\u8282\u6267\u884c\u8d44\u6e90": "directorLabels.syncChapterExecution",
  "\u7b49\u5f85\u786e\u8ba4\u7ae0\u8282\u6267\u884c": "directorLabels.waitingChapterExecution",
  "\u6267\u884c\u7ae0\u8282\u751f\u6210\u6279\u6b21": "directorLabels.executeChapterBatch",
  "\u68c0\u67e5\u7ae0\u8282\u8d28\u91cf": "directorLabels.reviewChapterQuality",
  "\u4fee\u590d\u7ae0\u8282\u95ee\u9898": "directorLabels.repairChapterIssues",
  "\u7b49\u5f85\u786e\u8ba4\u7ae0\u8282\u4fee\u590d": "directorLabels.waitingChapterRepair",
  "\u6267\u884c\u7ae0\u8282\u8d28\u91cf\u4fee\u590d": "directorLabels.executeQualityRepair",
  "\u63d0\u4ea4\u7ae0\u8282\u8fde\u7eed\u6027\u72b6\u6001": "directorLabels.commitChapterState",
  "\u540c\u6b65\u8bfb\u8005\u627f\u8bfa\u4e0e\u4f0f\u7b14": "directorLabels.syncReaderPromise",
  "\u540c\u6b65\u89d2\u8272\u8d44\u6e90\u72b6\u6001": "directorLabels.syncCharacterResources",
  "\u81ea\u52a8\u5bfc\u6f14\u63a5\u7ba1\u4efb\u52a1\u5df2\u63d0\u4ea4": "directorLabels.takeoverSubmitted",
  "\u7b49\u5f85\u786e\u8ba4\u81ea\u52a8\u5bfc\u6f14\u63a5\u7ba1": "directorLabels.waitingTakeover",
  "\u6b63\u5728\u51c6\u5907 Book Contract \u4e0e\u6545\u4e8b\u5b8f\u89c2\u89c4\u5212": "directorLabels.preparingBookContract",
  "\u6b63\u5728\u8865\u9f50\u89d2\u8272\u51c6\u5907": "directorLabels.preparingCharacterSetup",
  "\u6b63\u5728\u7ee7\u7eed\u751f\u6210\u5377\u6218\u7565": "directorLabels.preparingVolumeStrategy",
  "\u6b63\u5728\u7ee7\u7eed\u751f\u6210\u7b2c 1 \u5377\u8282\u594f\u677f\u4e0e\u7ec6\u5316": "directorLabels.preparingBeatSheet",
  "AI \u6b63\u5728\u68c0\u67e5\u5f53\u524d\u5c0f\u8bf4\u4ea7\u7269\u548c\u53ef\u7ee7\u7eed\u72b6\u6001": "directorLabels.analyzingWorkspace",
  "AI \u6b63\u5728\u5206\u6790\u624b\u52a8\u7f16\u8f91\u5bf9\u540e\u7eed\u4ea7\u7269\u7684\u5f71\u54cd": "directorLabels.analyzingEditImpact",
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Translate a single director runtime string.
 * Returns the original string if no translation is found.
 */
export function localizeDirectorString(
  value: string | null | undefined,
  locale: LocaleCode = DEFAULT_LOCALE,
): string | null | undefined {
  if (!value) return value;
  const t = getT(locale);
  if (!t) return value;

  const v = value.trim();

  // Stage labels
  const stageKey = STAGE_MAP[v];
  if (stageKey) {
    const result = t(stageKey);
    if (result && result !== `serverLogs:${stageKey}`) return result;
  }

  // Item labels (exact match)
  const itemKey = ITEM_LABEL_MAP[v];
  if (itemKey) {
    const result = t(itemKey);
    if (result && result !== `serverLogs:${itemKey}`) return result;
  }

  // Partial match for dynamic strings with interpolation
  // e.g. "正在整理你的项目设定与起始灵感" → "analyzingWorkspace"
  for (const [pattern, key] of Object.entries(ITEM_LABEL_MAP)) {
    if (v.includes(pattern) || pattern.includes(v)) {
      const result = t(key);
      if (result && result !== `serverLogs:${key}`) return result;
    }
  }

  return value;
}

/**
 * Localize all user-facing string fields in a task detail object.
 * Mutates a shallow copy — does not modify the original.
 */
export function localizeTaskPayload<T extends Record<string, unknown>>(
  data: T,
  locale: LocaleCode = DEFAULT_LOCALE,
): T {
  const USER_FACING_FIELDS = [
    "currentItemLabel",
    "currentStage",
    "displayStatus",
    "checkpointSummary",
    "resumeAction",
    "nextActionLabel",
    "blockingReason",
    "lastError",
    "ownerLabel",
  ] as const;

  const result = { ...data };
  for (const field of USER_FACING_FIELDS) {
    const val = result[field];
    if (typeof val === "string") {
      (result as Record<string, unknown>)[field] = localizeDirectorString(val, locale) ?? val;
    }
  }

  // Localize milestones array if present
  if (Array.isArray(result.milestones)) {
    (result as Record<string, unknown>).milestones = result.milestones.map(
      (m: unknown) => {
        if (!m || typeof m !== "object") return m;
        const milestone = m as Record<string, unknown>;
        return {
          ...milestone,
          summary: typeof milestone.summary === "string"
            ? (localizeDirectorString(milestone.summary, locale) ?? milestone.summary)
            : milestone.summary,
        };
      },
    );
  }

  return result;
}
