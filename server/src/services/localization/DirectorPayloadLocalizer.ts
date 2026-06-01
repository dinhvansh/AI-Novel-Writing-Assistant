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
// Dashboard/display state strings (Chinese → serverLogs.dashboardStatus.*)
// ---------------------------------------------------------------------------
const DASHBOARD_STATUS_MAP: Record<string, string> = {
  // i18n-ignore: lookup map keys
  // Status labels
  "\u7b49\u5f85\u6267\u884c": "dashboardStatus.statusQueued",
  "AI \u63a5\u7ba1\u4e2d": "dashboardStatus.statusRunning",
  "\u7b49\u5f85\u786e\u8ba4": "dashboardStatus.statusWaiting",
  "\u7b49\u5f85\u6062\u590d": "dashboardStatus.statusRecovering",
  "\u6267\u884c\u5f02\u5e38": "dashboardStatus.statusFailed",
  "\u5df2\u5b8c\u6210": "dashboardStatus.statusCompleted",
  "\u6682\u672a\u542f\u52a8": "dashboardStatus.statusIdle",
  // Headline labels
  "\u7b49\u5f85\u81ea\u52a8\u5bfc\u6f14": "dashboardStatus.headlineQueued",
  "\u6b63\u5728\u81ea\u52a8\u5bfc\u6f14": "dashboardStatus.headlineRunning",
  "\u6267\u884c\u53d7\u963b": "dashboardStatus.headlineFailed",
  "\u5bfc\u6f14\u5df2\u5b8c\u6210": "dashboardStatus.headlineCompleted",
  // Description strings
  "\u4efb\u52a1\u5df2\u8fdb\u5165\u540e\u53f0\u961f\u5217\uff0c\u6267\u884c\u5668\u9886\u53d6\u540e\u4f1a\u7ee7\u7eed\u63a8\u8fdb\u3002": "dashboardStatus.descQueued",
  "AI \u6b63\u5728\u540e\u53f0\u63a5\u7ba1\u8fd9\u672c\u4e66\u7684\u5f00\u4e66\u6d41\u7a0b\u3002\u4f60\u53ef\u4ee5\u7ee7\u7eed\u624b\u52a8\u64cd\u4f5c\u5f53\u524d\u9879\u76ee\uff1b\u5982\u679c\u4e0e\u81ea\u52a8\u5bfc\u6f14\u540c\u65f6\u6539\u540c\u4e00\u5757\u5185\u5bb9\uff0c\u4ee5\u6700\u65b0\u5199\u5165\u7ed3\u679c\u4e3a\u51c6\u3002": "dashboardStatus.descRunning",
  "\u5f53\u524d\u5bfc\u6f14\u6d41\u7a0b\u505c\u5728\u9700\u8981\u786e\u8ba4\u7684\u4f4d\u7f6e\u3002\u4f60\u53ef\u4ee5\u5148\u67e5\u770b\u7ed3\u679c\uff0c\u518d\u51b3\u5b9a\u662f\u5426\u7ee7\u7eed\u3002": "dashboardStatus.descWaiting",
  "\u540e\u53f0\u6267\u884c\u5668\u8fde\u63a5\u4e2d\u65ad\u540e\u6b63\u5728\u6062\u590d\uff0c\u7cfb\u7edf\u4f1a\u4f18\u5148\u4ece\u6700\u8fd1\u8fdb\u5ea6\u7ee7\u7eed\u3002": "dashboardStatus.descRecovering",
  "\u5f53\u524d\u5bfc\u6f14\u6d41\u7a0b\u505c\u5728\u6700\u8fd1\u4e00\u6b65\u3002\u53ef\u4ee5\u5148\u67e5\u770b\u6267\u884c\u8be6\u60c5\uff0c\u518d\u51b3\u5b9a\u662f\u5426\u91cd\u8bd5\u6216\u7ee7\u7eed\u3002": "dashboardStatus.descFailed",
  "\u672c\u8f6e\u5bfc\u6f14\u6d41\u7a0b\u5df2\u6536\u5c3e\uff0c\u4f60\u53ef\u4ee5\u7ee7\u7eed\u63a8\u8fdb\u7ae0\u8282\u3001\u67e5\u770b\u7ed3\u679c\uff0c\u6216\u53d1\u8d77\u4e0b\u4e00\u8f6e\u81ea\u52a8\u5bfc\u6f14\u3002": "dashboardStatus.descCompleted",
  "\u5f53\u524d\u6ca1\u6709\u6b63\u5728\u63a8\u8fdb\u7684\u5bfc\u6f14\u4efb\u52a1\u3002": "dashboardStatus.descIdle",
  // buildHeadline strings from DirectorBookAutomationProjectionModel
  "\u7b49\u5f85\u6062\u590d\u81ea\u52a8\u5bfc\u6f14": "dashboardStatus.headlineWaitingRecovery",
  "\u81ea\u52a8\u5bfc\u6f14\u5df2\u53d6\u6d88": "dashboardStatus.headlineCancelled",
  "AI \u81ea\u52a8\u5bfc\u6f14\u5df2\u6392\u961f": "dashboardStatus.headlineQueuedAlt",
  "AI \u6b63\u5728\u63a8\u8fdb\u8fd9\u672c\u4e66": "dashboardStatus.headlineRunningBook",
  "\u7b49\u5f85\u4f60\u7684\u786e\u8ba4": "dashboardStatus.headlineWaitingConfirm",
  "\u81ea\u52a8\u5bfc\u6f14\u5df2\u6682\u505c": "dashboardStatus.headlineBlocked",
  "\u81ea\u52a8\u5bfc\u6f14\u9047\u5230\u95ee\u9898": "dashboardStatus.headlineFailedAlt",
  "\u81ea\u52a8\u5bfc\u6f14\u5b8c\u6210\u6700\u8fd1\u4e00\u6b21\u63a8\u8fdb": "dashboardStatus.headlineCompletedAlt",
  "\u8fd9\u672c\u4e66\u8fd8\u6ca1\u6709\u81ea\u52a8\u5bfc\u6f14\u8bb0\u5f55": "dashboardStatus.headlineNoRecord",
  // buildUserHeadline strings
  "AI \u5df2\u63a5\u5230\u8fd9\u672c\u4e66\u7684\u63a8\u8fdb\u4efb\u52a1": "dashboardStatus.userHeadlineQueued",
  "\u7b49\u4f60\u786e\u8ba4\u540e\u7ee7\u7eed": "dashboardStatus.userHeadlineWaiting",
  "AI \u5df2\u6682\u505c\u5728\u53ef\u5904\u7406\u7684\u4f4d\u7f6e": "dashboardStatus.userHeadlineBlocked",
  "AI \u63a8\u8fdb\u9047\u5230\u95ee\u9898": "dashboardStatus.userHeadlineFailed",
  "\u8fd9\u6b21\u81ea\u52a8\u63a8\u8fdb\u5df2\u505c\u6b62": "dashboardStatus.userHeadlineCancelled",
  "AI \u5b8c\u6210\u4e86\u6700\u8fd1\u4e00\u6b21\u63a8\u8fdb": "dashboardStatus.userHeadlineCompleted",
  "\u8fd9\u672c\u4e66\u8fd8\u6ca1\u6709\u5f00\u542f AI \u81ea\u52a8\u63a8\u8fdb": "dashboardStatus.userHeadlineNoRecord",
  // buildUserReason strings
  "\u4efb\u52a1\u5df2\u8fdb\u5165\u540e\u53f0\u961f\u5217\uff0c\u4f60\u53ef\u4ee5\u79bb\u5f00\u5f53\u524d\u9875\u9762\u3002": "dashboardStatus.userReasonQueued",
  "AI \u6b63\u5728\u6309\u5f53\u524d\u8ba1\u5212\u63a8\u8fdb\u5c0f\u8bf4\u3002": "dashboardStatus.userReasonRunning",
  "\u7ee7\u7eed\u524d\u9700\u8981\u4f60\u786e\u8ba4\u5f53\u524d\u9636\u6bb5\u7684\u7ed3\u679c\u6216\u5f71\u54cd\u8303\u56f4\u3002": "dashboardStatus.userReasonWaiting",
  "\u7cfb\u7edf\u4fdd\u7559\u4e86\u6700\u8fd1\u8fdb\u5ea6\uff0c\u786e\u8ba4\u540e\u53ef\u4ee5\u4ece\u5f53\u524d\u4f4d\u7f6e\u7ee7\u7eed\u3002": "dashboardStatus.userReasonRecovery",
  "\u7ee7\u7eed\u524d\u9700\u8981\u5148\u5904\u7406\u5f53\u524d\u963b\u585e\u539f\u56e0\u3002": "dashboardStatus.userReasonBlocked",
  "\u67e5\u770b\u539f\u56e0\u540e\u53ef\u4ee5\u91cd\u8bd5\u6216\u56de\u5230\u5c0f\u8bf4\u9875\u9762\u5904\u7406\u3002": "dashboardStatus.userReasonFailed",
  "\u53ef\u4ee5\u8fdb\u5165\u5c0f\u8bf4\u9875\u9762\u67e5\u770b\u6210\u679c\u6216\u7ee7\u7eed\u4e0b\u4e00\u6bb5\u5199\u4f5c\u3002": "dashboardStatus.userReasonCompleted",
  "\u53ef\u4ee5\u7ee7\u7eed\u624b\u52a8\u521b\u4f5c\uff0c\u4e5f\u53ef\u4ee5\u8ba9 AI \u63a5\u7ba1\u540e\u7eed\u63a8\u8fdb\u3002": "dashboardStatus.userReasonIdle",
  // buildDetail strings
  "\u540e\u53f0\u6267\u884c\u4e2d\u65ad\u540e\u4fdd\u7559\u4e86\u8fdb\u5ea6\u70b9\uff0c\u786e\u8ba4\u6062\u590d\u540e\u4f1a\u4ece\u6700\u8fd1\u8fdb\u5c55\u7ee7\u7eed\u3002": "dashboardStatus.detailRecovery",
  "\u81ea\u52a8\u5bfc\u6f14\u4efb\u52a1\u5df2\u53d6\u6d88\u3002": "dashboardStatus.detailCancelled",
  "\u67e5\u770b\u6267\u884c\u8be6\u60c5\u540e\u53ef\u9009\u62e9\u6062\u590d\u6216\u91cd\u8bd5\u3002": "dashboardStatus.detailFailed",
  "\u53ef\u4ee5\u4ece AI \u81ea\u52a8\u5bfc\u6f14\u5f00\u59cb\uff0c\u8ba9\u7cfb\u7edf\u6839\u636e\u8fd9\u672c\u4e66\u7684\u8d44\u4ea7\u63a8\u8350\u4e0b\u4e00\u6b65\u3002": "dashboardStatus.detailIdle",
  // buildFocusNovel
  "\u672a\u547d\u540d\u5c0f\u8bf4": "dashboardStatus.unnamedNovel",
  // buildAutomationSummary
  "\u6682\u65e0\u81ea\u52a8\u5316\u52a8\u4f5c": "dashboardStatus.noAutomation",
  // Action labels
  "\u6253\u5f00\u5c0f\u8bf4": "dashboardStatus.actionOpenNovel",
  "\u786e\u8ba4\u4e66\u7ea7\u65b9\u5411": "dashboardStatus.actionConfirmDirection",
  "\u7ee7\u7eed\u81ea\u52a8\u6267\u884c\u7ae0\u8282": "dashboardStatus.actionContinueChapters",
  "\u6253\u5f00\u8d28\u91cf\u4fee\u590d": "dashboardStatus.actionOpenQualityRepair",
  "\u786e\u8ba4\u5e76\u7ee7\u7eed": "dashboardStatus.actionConfirmContinue",
  "\u4ece\u8fdb\u5ea6\u70b9\u7ee7\u7eed": "dashboardStatus.actionResumeCheckpoint",
  "\u67e5\u770b\u5931\u8d25\u539f\u56e0": "dashboardStatus.actionViewFailure",
  "\u67e5\u770b\u6682\u505c\u539f\u56e0": "dashboardStatus.actionViewBlocked",
  "\u67e5\u770b\u8fdb\u5ea6": "dashboardStatus.actionViewProgress",
  "\u540e\u53f0\u7ee7\u7eed": "dashboardStatus.actionBackgroundContinue",
  "\u53d6\u6d88\u81ea\u52a8\u5bfc\u6f14": "dashboardStatus.actionCancel",
  // commandLabel strings
  "\u786e\u8ba4\u5f00\u4e66\u65b9\u5411": "dashboardStatus.cmdConfirmCandidate",
  "\u7ee7\u7eed\u81ea\u52a8\u5bfc\u6f14": "dashboardStatus.cmdContinue",
  "\u4ece\u8fdb\u5ea6\u70b9\u6062\u590d": "dashboardStatus.cmdResumeCheckpoint",
  "\u91cd\u8bd5\u81ea\u52a8\u5bfc\u6f14": "dashboardStatus.cmdRetry",
  "\u63a5\u7ba1\u8fd9\u672c\u4e66": "dashboardStatus.cmdTakeover",
  "\u4fee\u590d\u7ae0\u8282\u6807\u9898": "dashboardStatus.cmdRepairTitles",
  // commandStatusLabel strings
  "\u6392\u961f\u4e2d": "dashboardStatus.cmdStatusQueued",
  "\u51c6\u5907\u6267\u884c": "dashboardStatus.cmdStatusLeased",
  "\u6267\u884c\u4e2d": "dashboardStatus.cmdStatusRunning",
  "\u5b8c\u6210": "dashboardStatus.cmdStatusSucceeded",
  "\u5931\u8d25": "dashboardStatus.cmdStatusFailed",
  "\u5df2\u53d6\u6d88": "dashboardStatus.cmdStatusCancelled",
  "\u9700\u8981\u6062\u590d": "dashboardStatus.cmdStatusStale",
  // Secondary action labels
  "\u6267\u884c\u8be6\u60c5": "dashboardStatus.actionExecutionDetails",
  "\u6682\u505c\u63a8\u8fdb": "dashboardStatus.actionPause",
  "\u91cd\u8bd5": "dashboardStatus.actionRetry",
  // Runtime event summaries — unified runtime
  "\u81ea\u52a8\u5bfc\u6f14\u8fd0\u884c\u5df2\u8fdb\u5165\u7edf\u4e00\u8fd0\u884c\u65f6\u3002": "dashboardStatus.eventEnteredRuntime",
  "\u81ea\u52a8\u5bfc\u6f14\u5019\u9009\u9636\u6bb5\u5df2\u8fdb\u5165\u7edf\u4e00\u8fd0\u884c\u65f6\u3002": "dashboardStatus.eventCandidateEnteredRuntime",
  "\u81ea\u52a8\u5bfc\u6f14\u786e\u8ba4\u65b9\u6848\u540e\u8fdb\u5165\u7edf\u4e00\u8fd0\u884c\u65f6\u3002": "dashboardStatus.eventConfirmEnteredRuntime",
  "\u81ea\u52a8\u5bfc\u6f14\u590d\u7528\u5df2\u521b\u5efa\u7684\u5c0f\u8bf4\u9879\u76ee\u5e76\u8fdb\u5165\u7edf\u4e00\u8fd0\u884c\u65f6\u3002": "dashboardStatus.eventReuseNovelEnteredRuntime",
  "\u81ea\u52a8\u5bfc\u6f14\u5df2\u521b\u5efa\u5c0f\u8bf4\u9879\u76ee\u5e76\u8fdb\u5165\u7edf\u4e00\u8fd0\u884c\u65f6\u3002": "dashboardStatus.eventCreatedNovelEnteredRuntime",
  "AI \u81ea\u52a8\u5bfc\u6f14\u63a5\u7ba1\u5df2\u5e76\u5165\u7edf\u4e00\u8fd0\u884c\u65f6\u3002": "dashboardStatus.eventTakeoverEnteredRuntime",
  "\u81ea\u52a8\u5bfc\u6f14\u4efb\u52a1\u4ece\u7edf\u4e00\u8fd0\u884c\u65f6\u7ee7\u7eed\u3002": "dashboardStatus.eventRuntimeContinued",
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

  // Dashboard/display state labels (exact match)
  const dashKey = DASHBOARD_STATUS_MAP[v];
  if (dashKey) {
    const result = t(dashKey);
    if (result && result !== `serverLogs:${dashKey}`) return result;
  }

  // Partial match for dynamic strings with interpolation
  // e.g. "正在整理你的项目设定与起始灵感" → "analyzingWorkspace"
  for (const [pattern, key] of Object.entries(ITEM_LABEL_MAP)) {
    if (v.includes(pattern) || pattern.includes(v)) {
      const result = t(key);
      if (result && result !== `serverLogs:${key}`) return result;
    }
  }

  // Substring match for runtime event summaries containing 统一运行时
  // i18n-ignore: pattern matching
  if (v.includes("\u7edf\u4e00\u8fd0\u884c\u65f6")) {
    const result = t("dashboardStatus.eventEnteredRuntime");
    if (result && result !== "serverLogs:dashboardStatus.eventEnteredRuntime") return result;
  }

  // Pattern match for 第 X 轮 (round label)
  // i18n-ignore: pattern matching
  const roundMatch = v.match(/^\u7b2c\s*(\d+)\s*\u8f6e$/);
  if (roundMatch) {
    const round = roundMatch[1];
    const handle = getI18nServerHandle();
    if (handle) {
      const result = handle.t("serverLogs", "candidateRound.roundLabel", { lng: locale, values: { round: Number(round) } });
      if (result && result !== "serverLogs:candidateRound.roundLabel") return result;
    }
  }

  // Pattern match for task title defaults
  // i18n-ignore: pattern matching
  if (v === "AI \u81ea\u52a8\u5bfc\u6f14\u5c0f\u8bf4") {
    const result = t("taskTitles.autoDirectorDefault");
    if (result && result !== "serverLogs:taskTitles.autoDirectorDefault") return result;
  }
  if (v === "\u5c0f\u8bf4\u6d41\u7a0b\u4efb\u52a1") {
    const result = t("taskTitles.manualDefault");
    if (result && result !== "serverLogs:taskTitles.manualDefault") return result;
  }

  // Pattern match for next action labels
  // i18n-ignore: pattern matching
  const nextActionMap: Record<string, string> = {
    "\u7ee7\u7eed\u81ea\u52a8\u5bfc\u6f14": "nextActionLabels.continue",
    "\u7ee7\u7eed\u7ae0\u8282\u6267\u884c": "nextActionLabels.continueChapterExecution",
    "\u4ece\u6700\u8fd1\u8fdb\u5ea6\u6062\u590d": "nextActionLabels.resumeFromCheckpoint",
    "\u786e\u8ba4\u5e76\u7ee7\u7eed": "nextActionLabels.approveGate",
    "\u4fee\u590d\u5f53\u524d\u7ae0\u8282": "nextActionLabels.repairChapter",
    "\u8fdb\u5165\u8d28\u91cf\u68c0\u67e5": "nextActionLabels.runQualityReview",
    "\u5f00\u59cb\u7ae0\u8282\u6267\u884c": "nextActionLabels.runChapterExecution",
    "\u540c\u6b65\u6b63\u5f0f\u7ae0\u8282\u6267\u884c\u4e0a\u4e0b\u6587": "nextActionLabels.syncExecutionContracts",
  };
  const nextActionKey = nextActionMap[v];
  if (nextActionKey) {
    const result = t(nextActionKey);
    if (result && result !== `serverLogs:${nextActionKey}`) return result;
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
    "title",
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
