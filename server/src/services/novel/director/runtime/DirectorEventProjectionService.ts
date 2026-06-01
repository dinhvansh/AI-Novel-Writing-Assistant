import type {
  DirectorArtifactType,
  DirectorAutopilotRecoveryDecision,
  DirectorChapterExecutionProgressSummary,
  DirectorEvent,
  DirectorNextAction,
  DirectorRuntimeProgressBreakdown,
  DirectorRuntimeProjection,
  DirectorRuntimeProjectionStatus,
  DirectorRuntimeSnapshot,
  DirectorTaskFactSummary,
  DirectorRuntimeVisibleRiskBadge,
  DirectorStepRun,
  DirectorWorkspaceInventory,
} from "@ai-novel/shared/types/directorRuntime";
import type {
  DirectorQualityLoopBudgetEntry,
  DirectorQualityLoopBudgetNextAction,
} from "@ai-novel/shared/types/novelDirector";
import type { LocaleCode } from "@ai-novel/shared/localization";
import { DEFAULT_LOCALE } from "@ai-novel/shared/localization";
import { classifyChapterQualityLoopRisk } from "@ai-novel/shared/types/chapterQualityLoop";
import { resolveDirectorQualityLoopBudgetNextAction } from "./DirectorQualityLoopBudgetLedgerService";
import { getI18nServerHandle } from "../../../../i18n";
import { getCurrentRequestLocale } from "../../../../runtime/requestLocaleContext";

function timestampOf(value?: string | null): number {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function latestStep(steps: DirectorStepRun[]): DirectorStepRun | null {
  return steps.reduce<DirectorStepRun | null>((latest, step) => {
    if (!latest) {
      return step;
    }
    const stepTime = Math.max(timestampOf(step.finishedAt), timestampOf(step.startedAt));
    const latestTime = Math.max(timestampOf(latest.finishedAt), timestampOf(latest.startedAt));
    return stepTime >= latestTime ? step : latest;
  }, null);
}

function latestEvent(events: DirectorEvent[]): DirectorEvent | null {
  return events.reduce<DirectorEvent | null>((latest, event) => {
    if (!latest) {
      return event;
    }
    return timestampOf(event.occurredAt) >= timestampOf(latest.occurredAt) ? event : latest;
  }, null);
}

function statusFromStep(
  step: DirectorStepRun | null,
  factSummary?: DirectorTaskFactSummary | null,
): DirectorRuntimeProjectionStatus {
  if (!step) {
    return factSummary?.allStepsCompleted ? "completed" : "idle";
  }
  if (step.status === "waiting_approval") {
    return "waiting_approval";
  }
  if (step.status === "blocked_scope") {
    return "blocked";
  }
  if (step.status === "failed") {
    return "failed";
  }
  if (step.status === "running") {
    return "running";
  }
  if (!factSummary) {
    return "completed";
  }
  return factSummary.allStepsCompleted ? "completed" : "idle";
}

function resolveBlockedReason(step: DirectorStepRun | null, event: DirectorEvent | null): string | null {
  if (!step) {
    return null;
  }
  if (step.status === "waiting_approval" || step.status === "blocked_scope") {
    return step.policyDecision?.reason ?? event?.summary ?? step.error ?? null;
  }
  if (step.status === "failed") {
    return step.error ?? event?.summary ?? null;
  }
  return null;
}

function formatNextAction(action: DirectorNextAction | null | undefined, locale: LocaleCode = DEFAULT_LOCALE): string | null {
  if (!action) {
    return null;
  }
  const handle = getI18nServerHandle();
  if (handle) {
    const key = `nextActions.${action.action}`;
    const result = handle.t("serverLogs", key, { lng: locale });
    if (result && result !== `serverLogs:${key}`) return result;
  }
  // i18n-ignore: fallback map keys
  const labels: Record<DirectorNextAction["action"], string> = {
    generate_candidates: "\u751f\u6210\u53ef\u9009\u5f00\u4e66\u65b9\u5411",
    create_book_contract: "\u751f\u6210\u4e66\u7ea7\u521b\u4f5c\u7ea6\u5b9a",
    complete_story_macro: "\u5b8c\u5584\u6545\u4e8b\u5b8f\u89c2\u89c4\u5212",
    prepare_characters: "\u51c6\u5907\u89d2\u8272\u9635\u5bb9",
    build_volume_strategy: "\u751f\u6210\u5206\u5377\u7b56\u7565",
    build_chapter_tasks: "\u751f\u6210\u7ae0\u8282\u4efb\u52a1\u5355",
    continue_chapter_execution: "\u7ee7\u7eed\u7ae0\u8282\u751f\u6210",
    review_recent_chapters: "\u590d\u67e5\u6700\u8fd1\u7ae0\u8282",
    repair_scope: "\u4fee\u590d\u53d7\u5f71\u54cd\u8303\u56f4",
    ask_user_confirmation: "\u8bf7\u786e\u8ba4\u540e\u7ee7\u7eed",
  };
  return labels[action.action];
}

function buildHeadline(input: {
  status: DirectorRuntimeProjectionStatus;
  step: DirectorStepRun | null;
  event: DirectorEvent | null;
  locale?: LocaleCode;
}): string {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const handle = getI18nServerHandle();
  // i18n-ignore: fallback string
  const label = input.step?.label?.trim() || input.event?.summary?.trim() || (
    handle ? handle.t("serverLogs", "headlineStatus.syncingProgress", { lng: locale }) : "\u540c\u6b65\u5bfc\u6f14\u8fdb\u5ea6"
  );

  function fmt(key: string): string {
    if (handle) {
      const result = handle.t("serverLogs", key, { lng: locale, values: { label } });
      if (result && result !== `serverLogs:${key}`) return result;
    }
    return label;
  }

  if (input.status === "waiting_approval") {
    return fmt("headlineStatus.waitingApproval");
  }
  if (input.status === "blocked") {
    return fmt("headlineStatus.blocked");
  }
  if (input.status === "failed") {
    return fmt("headlineStatus.failed");
  }
  if (input.status === "running") {
    return fmt("headlineStatus.running");
  }
  if (input.status === "completed") {
    return fmt("headlineStatus.completed");
  }
  return label;
}

function buildDetail(input: {
  status: DirectorRuntimeProjectionStatus;
  step: DirectorStepRun | null;
  event: DirectorEvent | null;
  blockedReason: string | null;
  locale?: LocaleCode;
}): string | null {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const handle = getI18nServerHandle();
  if (input.status === "running") {
    const eventSummary = input.event?.summary?.trim();
    if (eventSummary) {
      if (handle) {
        const result = handle.t("serverLogs", "detailStatus.recentProgress", { lng: locale, values: { summary: eventSummary } });
        if (result && result !== "serverLogs:detailStatus.recentProgress") return result;
      }
      // i18n-ignore: fallback
      return `\u6700\u8fd1\u8fdb\u5c55\uff1a${eventSummary}`;
    }
    if (handle) {
      const result = handle.t("serverLogs", "detailStatus.processingStep", { lng: locale });
      if (result && result !== "serverLogs:detailStatus.processingStep") return result;
    }
    // i18n-ignore: fallback
    return "\u7cfb\u7edf\u6b63\u5728\u5904\u7406\u8fd9\u4e00\u6b65\uff0c\u5b8c\u6210\u540e\u4f1a\u5199\u5165\u65b0\u7684\u8fdb\u5c55\u3002";
  }
  if (input.status === "waiting_approval" || input.status === "blocked" || input.status === "failed") {
    return input.blockedReason;
  }
  if (input.status === "completed") {
    return input.event?.summary?.trim() ?? null;
  }
  return null;
}

function buildScopeSummary(inventory: DirectorWorkspaceInventory | null | undefined, locale: LocaleCode = DEFAULT_LOCALE): string | null {
  if (!inventory) {
    return null;
  }
  const handle = getI18nServerHandle();
  function t(key: string, values?: Record<string, unknown>): string {
    if (handle) {
      const result = handle.t("serverLogs", key, { lng: locale, values });
      if (result && result !== `serverLogs:${key}`) return result;
    }
    return key;
  }
  const parts = [
    t("scopeSummary.totalChapters", { count: inventory.chapterCount }),
    t("scopeSummary.draftedChapters", { count: inventory.draftedChapterCount }),
  ];
  if (inventory.pendingRepairChapterCount > 0) {
    parts.push(t("scopeSummary.pendingRepair", { count: inventory.pendingRepairChapterCount }));
  }
  if (inventory.missingArtifactTypes.length > 0) {
    parts.push(t("scopeSummary.missingArtifacts", { count: inventory.missingArtifactTypes.length }));
  }
  const prefix = t("scopeSummary.prefix");
  return `${prefix}${parts.join("，")}。`;
}

function buildProgressSummary(
  snapshot: DirectorRuntimeSnapshot,
  inventory: DirectorWorkspaceInventory | null | undefined,
  factSummary?: DirectorTaskFactSummary | null,
  locale: LocaleCode = DEFAULT_LOCALE,
): string {
  const completedSteps = factSummary?.completedStepCount ?? snapshot.steps.filter((step) => step.status === "succeeded").length;
  const totalSteps = factSummary?.totalStepCount ?? snapshot.steps.length;
  const waitingSteps = snapshot.steps.filter((step) => step.status === "waiting_approval" || step.status === "blocked_scope").length;
  const failedSteps = snapshot.steps.filter((step) => step.status === "failed").length;
  const protectedCount = inventory?.protectedUserContentArtifacts.length
    ?? snapshot.artifacts.filter((artifact) => artifact.protectedUserContent === true || artifact.source === "user_edited").length;
  const staleCount = inventory?.staleArtifacts.length
    ?? snapshot.artifacts.filter((artifact) => artifact.status === "stale").length;
  const repairCount = inventory?.needsRepairArtifacts.length
    ?? snapshot.artifacts.filter((artifact) => artifact.artifactType === "repair_ticket" && artifact.status !== "rejected").length;

  const handle = getI18nServerHandle();
  function t(key: string, values?: Record<string, unknown>): string {
    if (handle) {
      const result = handle.t("serverLogs", key, { lng: locale, values });
      if (result && result !== `serverLogs:${key}`) return result;
    }
    return key;
  }

  const parts = [
    t("progressSummary.stepsCompleted", { completed: completedSteps, total: snapshot.steps.length }),
    t("progressSummary.artifactCount", { count: snapshot.artifacts.length }),
  ];
  if (waitingSteps > 0) {
    parts.push(t("progressSummary.waitingSteps", { count: waitingSteps }));
  }
  if (failedSteps > 0) {
    parts.push(t("progressSummary.failedSteps", { count: failedSteps }));
  }
  if (protectedCount > 0) {
    parts.push(t("progressSummary.protectedContent", { count: protectedCount }));
  }
  if (staleCount > 0) {
    parts.push(t("progressSummary.staleArtifacts", { count: staleCount }));
  }
  if (repairCount > 0) {
    parts.push(t("progressSummary.repairTasks", { count: repairCount }));
  }
  const prefix = t("progressSummary.prefix");
  return `${prefix}${parts.join("，")}。`;
}

const PLANNING_ARTIFACT_TYPES: DirectorArtifactType[] = [
  "book_contract",
  "story_macro",
  "character_cast",
  "volume_strategy",
  "chapter_task_sheet",
];

const PLANNING_NODE_HINTS = [
  "book_contract",
  "story_macro",
  "character",
  "volume_strategy",
  "chapter_task",
  "structured",
];

const CHAPTER_EXECUTION_NODE_HINTS = [
  "chapter_execution",
  "chapter.write",
  "chapter_draft",
];

const QUALITY_NODE_HINTS = [
  "quality",
  "review",
  "repair",
  "state_commit",
];

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function percentFromCount(done: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return clampPercent((done / total) * 100);
}

function stepMatches(step: DirectorStepRun, hints: string[]): boolean {
  const nodeKey = step.nodeKey.toLowerCase();
  return hints.some((hint) => nodeKey.includes(hint));
}

function stepProgressPercent(steps: DirectorStepRun[], hints: string[]): number {
  const matched = steps.filter((step) => stepMatches(step, hints));
  if (matched.length === 0) {
    return 0;
  }
  const completed = matched.filter((step) => step.status === "succeeded").length;
  const running = matched.some((step) => step.status === "running" || step.status === "waiting_approval")
    ? 0.5
    : 0;
  return percentFromCount(completed + running, matched.length);
}

function buildPlanningPercent(
  snapshot: DirectorRuntimeSnapshot,
  inventory: DirectorWorkspaceInventory | null | undefined,
  factSummary?: DirectorTaskFactSummary | null,
): number {
  if (factSummary) {
    const completed = [
      factSummary.hasBookContract,
      factSummary.hasStoryMacro,
      factSummary.characterCount > 0,
      factSummary.hasVolumeStrategy,
      factSummary.outlineFacts.plannedChapterCount > 0,
    ].filter(Boolean).length;
    return percentFromCount(completed, 5);
  }
  if (inventory) {
    const completed = [
      inventory.hasBookContract,
      inventory.hasStoryMacro,
      inventory.hasCharacters,
      inventory.hasVolumeStrategy,
      inventory.hasChapterPlan,
    ].filter(Boolean).length;
    return percentFromCount(completed, 5);
  }
  return stepProgressPercent(snapshot.steps, PLANNING_NODE_HINTS);
}

function buildChapterExecutionPercent(
  snapshot: DirectorRuntimeSnapshot,
  inventory: DirectorWorkspaceInventory | null | undefined,
  factSummary?: DirectorTaskFactSummary | null,
): number {
  if (factSummary) {
    return clampPercent(factSummary.chapterExecutionFacts.ratio * 100);
  }
  if (inventory?.chapterCount) {
    const continuableChapters = Math.max(
      inventory.approvedChapterCount,
      inventory.draftedChapterCount - inventory.pendingRepairChapterCount,
    );
    return percentFromCount(continuableChapters, inventory.chapterCount);
  }
  return stepProgressPercent(snapshot.steps, CHAPTER_EXECUTION_NODE_HINTS);
}

function buildChapterExecutionPercentFromFacts(chapterProgress: DirectorChapterExecutionProgressSummary | null | undefined): number | null {
  if (!chapterProgress) {
    return null;
  }
  return clampPercent(chapterProgress.ratio * 100);
}

function buildQualityRepairPercent(
  snapshot: DirectorRuntimeSnapshot,
  inventory: DirectorWorkspaceInventory | null | undefined,
  factSummary?: DirectorTaskFactSummary | null,
): number {
  if (factSummary) {
    if (factSummary.repairFacts.draftedChapterCount <= 0) {
      return 0;
    }
    return percentFromCount(
      Math.max(0, factSummary.repairFacts.draftedChapterCount - factSummary.repairFacts.needsRepairChapters),
      factSummary.repairFacts.draftedChapterCount,
    );
  }
  if (inventory) {
    if (inventory.draftedChapterCount <= 0) {
      return 0;
    }
    return percentFromCount(
      Math.max(0, inventory.draftedChapterCount - inventory.pendingRepairChapterCount),
      inventory.draftedChapterCount,
    );
  }
  const percent = stepProgressPercent(snapshot.steps, QUALITY_NODE_HINTS);
  return percent > 0 ? percent : 100;
}

function buildQualityRepairPercentFromFacts(chapterProgress: DirectorChapterExecutionProgressSummary | null | undefined): number | null {
  if (!chapterProgress?.chapters?.length) {
    return null;
  }
  const repairedCount = chapterProgress.chapters.filter((chapter) => (
    chapter.completedStages.includes("repair_completed_or_not_needed")
  )).length;
  return percentFromCount(repairedCount, chapterProgress.chapters.length);
}

function buildActiveJobPercent(snapshot: DirectorRuntimeSnapshot): number {
  const step = latestStep(snapshot.steps);
  if (!step) {
    return 0;
  }
  if (step.status === "succeeded") {
    return 100;
  }
  if (step.status === "running") {
    return 1;
  }
  return 0;
}

function buildProgressBreakdown(
  snapshot: DirectorRuntimeSnapshot,
  inventory: DirectorWorkspaceInventory | null | undefined,
  chapterProgress?: DirectorChapterExecutionProgressSummary | null,
  factSummary?: DirectorTaskFactSummary | null,
  locale: LocaleCode = DEFAULT_LOCALE,
): DirectorRuntimeProgressBreakdown {
  const completedSteps = factSummary?.completedStepCount ?? snapshot.steps.filter((step) => step.status === "succeeded").length;
  const planningPercent = buildPlanningPercent(snapshot, inventory, factSummary);
  const chapterExecutionPercent = buildChapterExecutionPercentFromFacts(chapterProgress)
    ?? buildChapterExecutionPercent(snapshot, inventory, factSummary);
  const qualityRepairPercent = buildQualityRepairPercentFromFacts(chapterProgress)
    ?? buildQualityRepairPercent(snapshot, inventory, factSummary);
  const activeJobProgress = buildActiveJobPercent(snapshot);
  const totalPercent = clampPercent(
    planningPercent * 0.35
    + chapterExecutionPercent * 0.5
    + qualityRepairPercent * 0.15,
  );
  const draftedChapters = inventory?.draftedChapterCount ?? 0;
  const continuableChapters = inventory
    ? Math.max(
      inventory.approvedChapterCount,
      inventory.draftedChapterCount - inventory.pendingRepairChapterCount,
    )
    : 0;
  const totalChapters = inventory?.chapterCount ?? 0;
  const pendingRepairChapters = inventory?.pendingRepairChapterCount ?? 0;

  const handle = getI18nServerHandle();
  let explanation: string;
  if (totalChapters > 0) {
    if (handle) {
      const result = handle.t("serverLogs", "progressBreakdown.withChapters", {
        lng: locale,
        values: { continuable: continuableChapters, total: totalChapters, planning: planningPercent, quality: qualityRepairPercent, overall: totalPercent },
      });
      explanation = (result && result !== "serverLogs:progressBreakdown.withChapters")
        ? result
        // i18n-ignore: fallback
        : `\u7ae0\u8282\u8fdb\u5ea6 ${continuableChapters}/${totalChapters}\uff0c\u89c4\u5212 ${planningPercent}%\uff0c\u8d28\u91cf\u4fee\u590d ${qualityRepairPercent}%\uff0c\u7efc\u5408\u8fdb\u5ea6 ${totalPercent}%\u3002`;
    } else {
      // i18n-ignore: fallback
      explanation = `\u7ae0\u8282\u8fdb\u5ea6 ${continuableChapters}/${totalChapters}\uff0c\u89c4\u5212 ${planningPercent}%\uff0c\u8d28\u91cf\u4fee\u590d ${qualityRepairPercent}%\uff0c\u7efc\u5408\u8fdb\u5ea6 ${totalPercent}%\u3002`;
    }
  } else {
    if (handle) {
      const result = handle.t("serverLogs", "progressBreakdown.withoutChapters", {
        lng: locale,
        values: { planning: planningPercent, chapter: chapterExecutionPercent, quality: qualityRepairPercent, overall: totalPercent },
      });
      explanation = (result && result !== "serverLogs:progressBreakdown.withoutChapters")
        ? result
        // i18n-ignore: fallback
        : `\u89c4\u5212 ${planningPercent}%\uff0c\u7ae0\u8282\u6267\u884c ${chapterExecutionPercent}%\uff0c\u8d28\u91cf\u4fee\u590d ${qualityRepairPercent}%\uff0c\u7efc\u5408\u8fdb\u5ea6 ${totalPercent}%\u3002`;
    } else {
      // i18n-ignore: fallback
      explanation = `\u89c4\u5212 ${planningPercent}%\uff0c\u7ae0\u8282\u6267\u884c ${chapterExecutionPercent}%\uff0c\u8d28\u91cf\u4fee\u590d ${qualityRepairPercent}%\uff0c\u7efc\u5408\u8fdb\u5ea6 ${totalPercent}%\u3002`;
    }
  }

  return {
    planningProgress: planningPercent,
    chapterProgress: chapterExecutionPercent,
    qualityProgress: qualityRepairPercent,
    activeJobProgress,
    planningPercent,
    chapterExecutionPercent,
    qualityRepairPercent,
    totalPercent,
    completedSteps,
    totalSteps: factSummary?.totalStepCount ?? snapshot.steps.length,
    draftedChapters,
    continuableChapters,
    totalChapters,
    pendingRepairChapters,
    explanation,
  };
}

function buildRecoveryDecision(input: {
  status: DirectorRuntimeProjectionStatus;
  inventory: DirectorWorkspaceInventory | null | undefined;
  blockedReason: string | null;
  qualityDebtCount?: number;
}): DirectorAutopilotRecoveryDecision {
  const protectedCount = input.inventory?.protectedUserContentArtifacts.length ?? 0;
  if (protectedCount > 0 && (input.status === "waiting_approval" || input.status === "blocked" || input.status === "failed")) {
    return "requires_manual_recovery";
  }
  if (input.status === "failed") {
    return "requires_manual_recovery";
  }
  if ((input.inventory?.pendingRepairChapterCount ?? 0) > 0) {
    return "auto_repair_chapter";
  }
  const missingArtifacts = input.inventory?.missingArtifactTypes ?? [];
  if (missingArtifacts.some((type) => PLANNING_ARTIFACT_TYPES.includes(type))) {
    return "auto_replan_window";
  }
  if ((input.qualityDebtCount ?? 0) > 0) {
    return "defer_and_continue";
  }
  if (input.status === "waiting_approval" || input.status === "blocked") {
    return input.blockedReason ? "auto_resume_from_checkpoint" : "continue";
  }
  return "continue";
}

function isAutomaticPolicy(snapshot: DirectorRuntimeSnapshot): boolean {
  return snapshot.policy.mode === "auto_safe_scope";
}

function buildVisibleRiskBadges(input: {
  status: DirectorRuntimeProjectionStatus;
  blockedReason: string | null;
  inventory: DirectorWorkspaceInventory | null | undefined;
  events: DirectorEvent[];
}): DirectorRuntimeVisibleRiskBadge[] {
  const badges: DirectorRuntimeVisibleRiskBadge[] = [];
  const push = (badge: DirectorRuntimeVisibleRiskBadge) => {
    if (!badges.some((item) => item.label === badge.label)) {
      badges.push(badge);
    }
  };

  const handle = getI18nServerHandle();
  const locale = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
  function tb(key: string, values?: Record<string, unknown>): string {
    if (handle) {
      const result = handle.t("serverLogs", key, { lng: locale, values });
      if (result && result !== `serverLogs:${key}`) return result;
    }
    return key;
  }

  if (input.status === "failed") {
    push({ label: tb("riskBadges.executionFailed"), level: "danger", source: "status" });
  } else if (input.status === "blocked" || input.status === "waiting_approval") {
    push({ label: input.blockedReason ? tb("riskBadges.waitingAction") : tb("riskBadges.waitingConfirm"), level: "warning", source: "status" });
  }
  const inventory = input.inventory;
  if (inventory) {
    if (inventory.protectedUserContentArtifacts.length > 0) {
      push({ label: tb("riskBadges.protectedContent"), level: "danger", source: "artifact" });
    }
    if (inventory.pendingRepairChapterCount > 0) {
      push({ label: tb("riskBadges.pendingRepairChapters", { count: inventory.pendingRepairChapterCount }), level: "warning", source: "artifact" });
    }
    if (inventory.staleArtifacts.length > 0) {
      push({ label: tb("riskBadges.staleArtifacts", { count: inventory.staleArtifacts.length }), level: "warning", source: "artifact" });
    }
    if (inventory.missingArtifactTypes.length > 0) {
      push({ label: tb("riskBadges.missingPlanResources"), level: "warning", source: "artifact" });
    }
  }
  for (const event of input.events) {
    if (event.type === "quality_issue_found" || event.type === "quality_loop_assessed") {
      const qualityLoopRisk = event.type === "quality_loop_assessed"
        ? classifyChapterQualityLoopRisk((event.metadata?.assessment as unknown) ?? null)
        : "blocking";
      if (qualityLoopRisk === "non_blocking_quality_debt") {
        push({ label: tb("riskBadges.qualityDebtDeferred"), level: "info", source: "event" });
      } else if (qualityLoopRisk === "blocking") {
        push({ label: tb("riskBadges.qualityBlocked"), level: event.severity === "high" ? "danger" : "warning", source: "event" });
      } else if (event.type === "quality_issue_found") {
        push({ label: tb("riskBadges.qualityRisk"), level: event.severity === "high" ? "danger" : "warning", source: "event" });
      }
    }
    if (event.type === "replan_run_created") {
      push({ label: tb("riskBadges.replanStarted"), level: "info", source: "event" });
    }
    if (event.type === "circuit_breaker_opened") {
      push({ label: tb("riskBadges.circuitBreakerOpen"), level: "danger", source: "event" });
    }
  }
  for (const event of input.events) {
    if (event.type === "continue_with_risk") {
      push({ label: tb("riskBadges.qualityDebtDeferred"), level: "info", source: "event" });
    }
  }
  return badges.slice(0, 6);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isQualityBudgetNextAction(value: unknown): value is DirectorQualityLoopBudgetNextAction {
  return value === "auto_patch_repair"
    || value === "auto_rewrite_chapter"
    || value === "auto_replan_window"
    || value === "defer_and_continue";
}

function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readQualityBudgetEntry(value: unknown): DirectorQualityLoopBudgetEntry | null {
  if (!isRecord(value)) {
    return null;
  }
  const signatureKey = readNullableString(value.signatureKey);
  const issueSignature = readNullableString(value.issueSignature);
  if (!signatureKey || !issueSignature) {
    return null;
  }
  return {
    signatureKey,
    issueSignature,
    blockingLedgerKeys: Array.isArray(value.blockingLedgerKeys)
      ? value.blockingLedgerKeys.filter((item): item is string => typeof item === "string")
      : [],
    affectedChapterWindow: isRecord(value.affectedChapterWindow)
      ? {
        startOrder: readFiniteNumber(value.affectedChapterWindow.startOrder),
        endOrder: readFiniteNumber(value.affectedChapterWindow.endOrder),
        chapterOrders: Array.isArray(value.affectedChapterWindow.chapterOrders)
          ? value.affectedChapterWindow.chapterOrders.filter((item): item is number => typeof item === "number" && Number.isFinite(item))
          : [],
        chapterIds: Array.isArray(value.affectedChapterWindow.chapterIds)
          ? value.affectedChapterWindow.chapterIds.filter((item): item is string => typeof item === "string")
          : [],
      }
      : {
        startOrder: null,
        endOrder: null,
        chapterOrders: [],
        chapterIds: [],
      },
    patchRepairCount: readFiniteNumber(value.patchRepairCount) ?? 0,
    chapterRewriteCount: readFiniteNumber(value.chapterRewriteCount) ?? 0,
    windowReplanCount: readFiniteNumber(value.windowReplanCount) ?? 0,
    deferredCount: readFiniteNumber(value.deferredCount) ?? 0,
    lastAction: null,
    lastReason: readNullableString(value.lastReason),
    lastChapterId: readNullableString(value.lastChapterId),
    lastChapterOrder: readFiniteNumber(value.lastChapterOrder),
    updatedAt: readNullableString(value.updatedAt) ?? new Date(0).toISOString(),
  };
}

function buildQualityDebtSummary(
  events: DirectorEvent[],
): DirectorRuntimeProjection["qualityDebtSummary"] {
  const debtEvents = events
    .filter((event) => event.type === "continue_with_risk")
    .sort((left, right) => timestampOf(right.occurredAt) - timestampOf(left.occurredAt));
  if (debtEvents.length === 0) {
    return null;
  }
  const deferredChapterOrders = Array.from(new Set(debtEvents
    .map((event) => {
      const order = event.metadata?.chapterOrder;
      if (typeof order === "number" && Number.isFinite(order)) {
        return order;
      }
      const match = /chapter_order:(\d+)/.exec(event.affectedScope ?? "");
      return match ? Number(match[1]) : null;
    })
    .filter((order): order is number => typeof order === "number" && Number.isFinite(order))))
    .sort((left, right) => left - right);
  return {
    deferredChapterCount: debtEvents.length,
    deferredChapterOrders,
    latestReason: debtEvents[0]?.summary ?? null,
  };
}

function formatQualityBudgetNextAction(action: DirectorQualityLoopBudgetNextAction, locale: LocaleCode = DEFAULT_LOCALE): string {
  const handle = getI18nServerHandle();
  if (handle) {
    const key = `qualityBudget.nextAction.${action}`;
    const result = handle.t("serverLogs", key, { lng: locale });
    if (result && result !== `serverLogs:${key}`) return result;
  }
  // i18n-ignore: fallback map keys
  const labels: Record<DirectorQualityLoopBudgetNextAction, string> = {
    auto_patch_repair: "\u5148\u5c1d\u8bd5\u5c40\u90e8\u4fee\u590d",
    auto_rewrite_chapter: "\u6539\u7528\u6574\u7ae0\u91cd\u5199",
    auto_replan_window: "\u91cd\u89c4\u5212\u53d7\u5f71\u54cd\u7ae0\u8282",
    defer_and_continue: "\u767b\u8bb0\u4e3a\u8d28\u91cf\u5f85\u56de\u6536\u5e76\u7ee7\u7eed\u540e\u7eed\u7ae0\u8282",
  };
  return labels[action];
}

function buildQualityBudgetSummary(
  events: DirectorEvent[],
  locale: LocaleCode = DEFAULT_LOCALE,
): DirectorRuntimeProjection["qualityBudgetSummary"] {
  const budgetEvents = events
    .map((event) => {
      const entry = readQualityBudgetEntry(event.metadata?.qualityBudgetEntry);
      if (!entry) {
        return null;
      }
      return {
        event,
        entry,
        nextAction: isQualityBudgetNextAction(event.metadata?.qualityBudgetNextAction)
          ? event.metadata.qualityBudgetNextAction
          : resolveDirectorQualityLoopBudgetNextAction(entry),
      };
    })
    .filter((item): item is {
      event: DirectorEvent;
      entry: DirectorQualityLoopBudgetEntry;
      nextAction: DirectorQualityLoopBudgetNextAction;
    } => Boolean(item))
    .sort((left, right) => timestampOf(right.event.occurredAt) - timestampOf(left.event.occurredAt));
  const latest = budgetEvents[0];
  if (!latest) {
    return null;
  }
  const { entry, nextAction } = latest;
  const nextActionLabel = formatQualityBudgetNextAction(nextAction, locale);
  const currentChapterOrder = entry.lastChapterOrder
    ?? readFiniteNumber(latest.event.metadata?.chapterOrder)
    ?? (entry.affectedChapterWindow.chapterOrders ?? [])[0]
    ?? null;

  const handle = getI18nServerHandle();
  let explanation: string;
  if (handle) {
    const result = handle.t("serverLogs", "qualityBudget.summary", {
      lng: locale,
      values: {
        chapter: currentChapterOrder != null
          ? handle.t("serverLogs", "qualityBudget.chapterFormat", { lng: locale, values: { order: currentChapterOrder } }) + " "
          : "",
        patch: entry.patchRepairCount,
        rewrite: entry.chapterRewriteCount,
        replan: entry.windowReplanCount,
        action: nextActionLabel,
      },
    });
    explanation = (result && result !== "serverLogs:qualityBudget.summary")
      ? result
      // i18n-ignore: fallback
      : `\u8d28\u91cf\u9884\u7b97\uff1a\u5c40\u90e8\u4fee\u590d ${entry.patchRepairCount}/1\uff0c\u6574\u7ae0\u91cd\u5199 ${entry.chapterRewriteCount}/1\uff0c\u7a97\u53e3\u91cd\u89c4\u5212 ${entry.windowReplanCount}/1\uff1b\u540c\u7c7b\u95ee\u9898\u4e0b\u4e00\u6b65\u4f1a${nextActionLabel}\u3002`;
  } else {
    // i18n-ignore: fallback
    explanation = `\u8d28\u91cf\u9884\u7b97\uff1a\u5c40\u90e8\u4fee\u590d ${entry.patchRepairCount}/1\uff0c\u6574\u7ae0\u91cd\u5199 ${entry.chapterRewriteCount}/1\uff0c\u7a97\u53e3\u91cd\u89c4\u5212 ${entry.windowReplanCount}/1\uff1b\u540c\u7c7b\u95ee\u9898\u4e0b\u4e00\u6b65\u4f1a${nextActionLabel}\u3002`;
  }

  return {
    currentChapterId: entry.lastChapterId ?? null,
    currentChapterOrder,
    latestSignatureKey: entry.signatureKey,
    latestIssueSignature: entry.issueSignature,
    latestReason: entry.lastReason ?? latest.event.summary ?? null,
    patchRepairUsed: entry.patchRepairCount,
    chapterRewriteUsed: entry.chapterRewriteCount,
    windowReplanUsed: entry.windowReplanCount,
    deferredCount: entry.deferredCount,
    nextAction,
    nextActionLabel,
    explanation,
  };
}

function readLatestQualityLoopAssessment(events: DirectorEvent[]): {
  rootCauseCode: DirectorRuntimeProjection["rootCauseCode"];
  blockingObligations: NonNullable<DirectorRuntimeProjection["blockingObligations"]>;
} {
  const latest = events
    .filter((event) => event.type === "quality_loop_assessed")
    .sort((left, right) => timestampOf(right.occurredAt) - timestampOf(left.occurredAt))
    .find((event) => event.metadata?.assessment && typeof event.metadata.assessment === "object");
  const assessment = latest?.metadata?.assessment as {
    rootCauseCode?: DirectorRuntimeProjection["rootCauseCode"];
    blockingObligations?: NonNullable<DirectorRuntimeProjection["blockingObligations"]>;
  } | undefined;
  return {
    rootCauseCode: assessment?.rootCauseCode ?? null,
    blockingObligations: assessment?.blockingObligations ?? [],
  };
}

export class DirectorEventProjectionService {
  buildSnapshotProjection(
    snapshot: DirectorRuntimeSnapshot | null,
    options?: {
      chapterProgress?: DirectorChapterExecutionProgressSummary | null;
      factSummary?: DirectorTaskFactSummary | null;
      currentFactStep?: {
        stepId: string;
        stepLabel: string;
        evidence?: Record<string, unknown> | null;
        nextActionLabel?: string | null;
      } | null;
      locale?: LocaleCode;
    },
  ): DirectorRuntimeProjection | null {
    if (!snapshot) {
      return null;
    }
    const locale = options?.locale ?? DEFAULT_LOCALE;
    const step = latestStep(snapshot.steps);
    const event = latestEvent(snapshot.events);
    const status = statusFromStep(step, options?.factSummary ?? null);
    const requiresUserAction = status === "waiting_approval" || status === "blocked";
    const blockedReason = resolveBlockedReason(step, event);
    const inventory = snapshot.lastWorkspaceAnalysis?.inventory ?? null;
    const recommendation = snapshot.lastWorkspaceAnalysis?.recommendation
      ?? snapshot.lastWorkspaceAnalysis?.interpretation?.recommendedAction
      ?? null;
    const headline = buildHeadline({ status, step, event, locale });
    const progressBreakdown = buildProgressBreakdown(
      snapshot,
      inventory,
      options?.chapterProgress ?? null,
      options?.factSummary ?? null,
      locale,
    );
    const qualityDebtSummary = buildQualityDebtSummary(snapshot.events);
    const qualityBudgetSummary = buildQualityBudgetSummary(snapshot.events, locale);
    const qualityRootCause = readLatestQualityLoopAssessment(snapshot.events);
    const recoveryDecision = buildRecoveryDecision({
      status,
      inventory,
      blockedReason,
      qualityDebtCount: qualityDebtSummary?.deferredChapterCount ?? 0,
    });
    const isAutopilotRecoverable = isAutomaticPolicy(snapshot)
      && recoveryDecision !== "requires_manual_recovery"
      && status !== "completed"
      && status !== "idle";
    const visibleRiskBadges = buildVisibleRiskBadges({
      status,
      blockedReason,
      inventory,
      events: snapshot.events,
    });
    const recentEvents = [...snapshot.events]
      .sort((left, right) => timestampOf(right.occurredAt) - timestampOf(left.occurredAt))
      .slice(0, 8)
      .map((item) => ({
        eventId: item.eventId,
        type: item.type,
        summary: item.summary,
        nodeKey: item.nodeKey,
        artifactType: item.artifactType,
        severity: item.severity,
        occurredAt: item.occurredAt,
      }));

    return {
      runId: snapshot.runId,
      novelId: snapshot.novelId,
      status,
      currentNodeKey: step?.nodeKey ?? event?.nodeKey ?? null,
      currentLabel: step?.label ?? event?.summary ?? null,
      currentFactStepId: options?.currentFactStep?.stepId ?? null,
      currentFactStepLabel: options?.currentFactStep?.stepLabel ?? null,
      currentFactEvidence: options?.currentFactStep?.evidence ?? null,
      factSummary: options?.factSummary ?? null,
      headline,
      detail: buildDetail({ status, step, event, blockedReason, locale }),
      lastEventSummary: event?.summary ?? null,
      requiresUserAction,
      blockedReason,
      blockingReason: blockedReason,
      nextActionLabel: options?.currentFactStep?.nextActionLabel ?? formatNextAction(recommendation, locale),
      recommendedAction: recommendation,
      recoveryDecision,
      isAutopilotRecoverable,
      scopeSummary: buildScopeSummary(inventory, locale),
      progressSummary: buildProgressSummary(snapshot, inventory, options?.factSummary ?? null, locale),
      progressBreakdown,
      chapterExecutionProgress: options?.chapterProgress ?? null,
      visibleRiskBadges,
      rootCauseCode: qualityRootCause.rootCauseCode,
      blockingObligations: qualityRootCause.blockingObligations,
      qualityDebtSummary,
      qualityBudgetSummary,
      policyMode: snapshot.policy.mode,
      updatedAt: snapshot.updatedAt,
      recentEvents,
    };
  }
}
