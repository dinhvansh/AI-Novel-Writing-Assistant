import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { FailureDiagnostic } from "@ai-novel/shared/types/agent";
import type {
  CreativeHubInterrupt,
  CreativeHubNovelSetupStatus,
  CreativeHubProductionStatus,
  CreativeHubResourceBinding,
  CreativeHubThread,
  CreativeHubTurnSummary,
} from "@ai-novel/shared/types/creativeHub";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import CreativeHubNovelSetupCard from "./CreativeHubNovelSetupCard";
import NovelProductionStarterCard from "./NovelProductionStarterCard";

interface CreativeHubSidebarProps {
  thread?: CreativeHubThread;
  bindings: CreativeHubResourceBinding;
  novels: Array<{ id: string; title: string }>;
  interrupt?: CreativeHubInterrupt;
  diagnostics?: FailureDiagnostic;
  productionStatus?: CreativeHubProductionStatus | null;
  novelSetup?: CreativeHubNovelSetupStatus | null;
  latestTurnSummary?: CreativeHubTurnSummary | null;
  currentCheckpointId?: string | null;
  modelSummary: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens?: number;
  };
  defaultRuntimeDetailsCollapsed: boolean;
  onToggleRuntimeDetailsDefault: () => void;
  onNovelChange: (novelId: string) => void;
  onQuickAction?: (prompt: string) => void;
  onCreateNovel?: (title: string) => void;
  onStartProduction?: (prompt: string) => void;
}

function bindingValue(value: string | null | undefined, t: TFunction): string {
  return value?.trim() || t("creativeHub:sidebar.notBound");
}

function turnStatusLabel(status: CreativeHubTurnSummary["status"], t: TFunction): string {
  switch (status) {
    case "succeeded": return t("creativeHub:sidebar.turnStatus.succeeded");
    case "interrupted": return t("creativeHub:sidebar.turnStatus.interrupted");
    case "failed": return t("creativeHub:sidebar.turnStatus.failed");
    case "cancelled": return t("creativeHub:sidebar.turnStatus.cancelled");
    case "running": return t("creativeHub:sidebar.turnStatus.running");
    default: return status;
  }
}

function threadStatusLabel(status: CreativeHubThread["status"] | undefined, t: TFunction): string {
  switch (status) {
    case "busy": return t("creativeHub:sidebar.threadStatus.busy");
    case "interrupted": return t("creativeHub:sidebar.threadStatus.interrupted");
    case "error": return t("creativeHub:sidebar.threadStatus.error");
    case "idle": return t("creativeHub:sidebar.threadStatus.idle");
    default: return t("creativeHub:sidebar.threadStatus.uninitialized");
  }
}

function statusVariant(
  status: CreativeHubTurnSummary["status"] | CreativeHubThread["status"] | undefined,
): "outline" | "secondary" | "destructive" {
  if (status === "failed" || status === "cancelled" || status === "error") {
    return "destructive";
  }
  if (status === "interrupted") {
    return "secondary";
  }
  return "outline";
}

function metricTone(status: "pending" | "completed" | "running" | "blocked"): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "running":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "blocked":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function summarizeFocus(
  latestTurnSummary: CreativeHubTurnSummary | null | undefined,
  productionStatus: CreativeHubProductionStatus | null | undefined,
  novelSetup: CreativeHubNovelSetupStatus | null | undefined,
  t: TFunction,
): string {
  if (latestTurnSummary?.intentSummary?.trim()) {
    return latestTurnSummary.intentSummary.trim();
  }
  if (novelSetup?.stage === "setup_in_progress" || novelSetup?.stage === "ready_for_planning") {
    return t("creativeHub:sidebar.setupInProgress", { title: novelSetup.title });
  }
  if (productionStatus?.summary?.trim()) {
    return productionStatus.summary.trim();
  }
  return t("creativeHub:sidebar.noFocus");
}

function buildBlockerCardData(input: {
  interrupt?: CreativeHubInterrupt;
  diagnostics?: FailureDiagnostic;
  productionStatus?: CreativeHubProductionStatus | null;
  latestTurnSummary?: CreativeHubTurnSummary | null;
}, t: TFunction) {
  if (input.interrupt) {
    return {
      title: t("creativeHub:sidebar.blocker.currentBlocker"),
      summary: input.interrupt.summary,
      details: [
        t("creativeHub:sidebar.blocker.waitingConfirm", { title: input.interrupt.title }),
        input.interrupt.targetType ? t("creativeHub:sidebar.blocker.targetType", { type: input.interrupt.targetType }) : "",
        input.interrupt.targetId ? t("creativeHub:sidebar.blocker.targetId", { id: input.interrupt.targetId }) : "",
      ].filter(Boolean),
      tone: "border-amber-200 bg-amber-50 text-amber-900",
      actionLabel: t("creativeHub:sidebar.blocker.viewPending"),
      actionPrompt: t("creativeHub:sidebar.blocker.viewPendingPrompt"),
    };
  }

  if (input.diagnostics?.failureSummary) {
    return {
      title: t("creativeHub:sidebar.blocker.currentRisk"),
      summary: input.diagnostics.failureSummary,
      details: [
        input.diagnostics.failureCode ? t("creativeHub:sidebar.blocker.errorCode", { code: input.diagnostics.failureCode }) : "",
        input.diagnostics.recoveryHint ? t("creativeHub:sidebar.blocker.recoveryHint", { hint: input.diagnostics.recoveryHint }) : "",
      ].filter(Boolean),
      tone: "border-rose-200 bg-rose-50 text-rose-900",
      actionLabel: t("creativeHub:sidebar.blocker.generateRecovery"),
      actionPrompt: input.diagnostics.recoveryHint || t("creativeHub:sidebar.blocker.generateRecoveryPrompt"),
    };
  }

  if (input.productionStatus?.failureSummary) {
    return {
      title: t("creativeHub:sidebar.blocker.currentBlocker"),
      summary: input.productionStatus.failureSummary,
      details: [
        input.productionStatus.recoveryHint ? t("creativeHub:sidebar.blocker.recoveryHint", { hint: input.productionStatus.recoveryHint }) : "",
        t("creativeHub:sidebar.blocker.currentStage", { stage: input.productionStatus.currentStage }),
      ].filter(Boolean),
      tone: "border-orange-200 bg-orange-50 text-orange-900",
      actionLabel: t("creativeHub:sidebar.blocker.handleBlocker"),
      actionPrompt: input.productionStatus.recoveryHint || t("creativeHub:sidebar.blocker.handleBlockerPrompt"),
    };
  }

  if (input.latestTurnSummary?.status === "interrupted") {
    return {
      title: t("creativeHub:sidebar.blocker.currentFocus"),
      summary: input.latestTurnSummary.nextSuggestion,
      details: [
        t("creativeHub:sidebar.blocker.stage", { stage: input.latestTurnSummary.currentStage }),
        t("creativeHub:sidebar.blocker.status", { status: turnStatusLabel(input.latestTurnSummary.status, t) }),
      ],
      tone: "border-sky-200 bg-sky-50 text-sky-900",
      actionLabel: t("creativeHub:sidebar.blocker.followSuggestion"),
      actionPrompt: input.latestTurnSummary.nextSuggestion,
    };
  }

  return {
    title: t("creativeHub:sidebar.blocker.currentStatus"),
    summary: t("creativeHub:sidebar.blocker.noBlocker"),
    details: input.latestTurnSummary?.nextSuggestion
      ? [t("creativeHub:sidebar.blocker.nextSuggestion", { suggestion: input.latestTurnSummary.nextSuggestion })]
      : [],
    tone: "border-slate-200 bg-slate-50 text-slate-800",
    actionLabel: input.latestTurnSummary?.nextSuggestion ? t("creativeHub:sidebar.blocker.followSuggestion") : undefined,
    actionPrompt: input.latestTurnSummary?.nextSuggestion,
  };
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs text-slate-600">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[60%] break-all text-right text-slate-800">{value}</span>
    </div>
  );
}

export default function CreativeHubSidebar({
  thread,
  bindings,
  novels,
  interrupt,
  diagnostics,
  productionStatus,
  novelSetup,
  latestTurnSummary,
  currentCheckpointId,
  modelSummary,
  defaultRuntimeDetailsCollapsed,
  onToggleRuntimeDetailsDefault,
  onNovelChange,
  onQuickAction,
  onCreateNovel,
  onStartProduction,
}: CreativeHubSidebarProps) {
  const { t } = useTranslation();
  const [novelTitleDraft, setNovelTitleDraft] = useState("");
  const currentNovelTitle = novels.find((item) => item.id === bindings.novelId)?.title ?? null;
  const blocker = useMemo(
    () => buildBlockerCardData({
      interrupt,
      diagnostics,
      productionStatus,
      latestTurnSummary,
    }, t),
    [diagnostics, interrupt, latestTurnSummary, productionStatus, t],
  );
  const completedAssets = productionStatus?.assetStages.filter((item) => item.status === "completed").length ?? 0;
  const activeStage = latestTurnSummary?.currentStage
    ?? productionStatus?.currentStage
    ?? (novelSetup?.stage === "ready_for_production"
      ? t("creativeHub:sidebar.stages.initComplete")
      : novelSetup?.stage === "ready_for_planning"
        ? t("creativeHub:sidebar.stages.initPending")
        : novelSetup?.stage === "setup_in_progress"
          ? t("creativeHub:sidebar.stages.initializing")
          : t("creativeHub:sidebar.stages.notStarted"));
  const latestRunId = latestTurnSummary?.runId ?? thread?.latestRunId ?? null;
  const blockerActionPrompt = blocker.actionPrompt ?? "";

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{t("creativeHub:sidebar.title")}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{t("creativeHub:sidebar.currentFocus")}</div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {thread?.title?.trim() || t("creativeHub:sidebar.unnamedThread")}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-700">
                {summarizeFocus(latestTurnSummary, productionStatus, novelSetup, t)}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{activeStage}</Badge>
              <Badge variant={statusVariant(thread?.status)}>{threadStatusLabel(thread?.status, t)}</Badge>
              {latestTurnSummary ? (
                <Badge variant={statusVariant(latestTurnSummary.status)}>
                  {turnStatusLabel(latestTurnSummary.status, t)}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-xs font-medium text-slate-500">{t("creativeHub:sidebar.resourceBinding")}</div>
          <div className="space-y-3 text-xs text-slate-700">
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-slate-500">{t("creativeHub:sidebar.currentNovel")}</div>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-700"
                value={bindings.novelId ?? ""}
                onChange={(event) => onNovelChange(event.target.value)}
              >
                <option value="">{t("creativeHub:sidebar.noNovelBound")}</option>
                {novels.map((novel) => (
                  <option key={novel.id} value={novel.id}>
                    {novel.title}
                  </option>
                ))}
              </select>
              {!bindings.novelId ? (
                <div className="mt-2 space-y-2 rounded-lg border border-dashed border-slate-200 bg-white p-2">
                  <input
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-2 text-xs text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                    value={novelTitleDraft}
                    onChange={(event) => setNovelTitleDraft(event.target.value)}
                    placeholder={t("creativeHub:sidebar.newNovelPlaceholder")}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onQuickAction?.(t("creativeHub:sidebar.viewNovelsPrompt"))}
                    >
                      {t("creativeHub:sidebar.viewNovels")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const title = novelTitleDraft.trim();
                        if (!title) {
                          return;
                        }
                        onCreateNovel?.(title);
                        setNovelTitleDraft("");
                      }}
                    >
                      {t("creativeHub:sidebar.createAndConnect")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>{t("creativeHub:sidebar.bindings.chapter")}: {bindingValue(bindings.chapterId, t)}</div>
              <div>{t("creativeHub:sidebar.bindings.world")}: {bindingValue(bindings.worldId, t)}</div>
              <div>{t("creativeHub:sidebar.bindings.task")}: {bindingValue(bindings.taskId, t)}</div>
              <div>{t("creativeHub:sidebar.bindings.bookAnalysis")}: {bindingValue(bindings.bookAnalysisId, t)}</div>
              <div>{t("creativeHub:sidebar.bindings.formula")}: {bindingValue(bindings.formulaId, t)}</div>
              <div>{t("creativeHub:sidebar.bindings.baseCharacter")}: {bindingValue(bindings.baseCharacterId, t)}</div>
            </div>
            <div>{t("creativeHub:sidebar.bindings.knowledgeDocs", { count: bindings.knowledgeDocumentIds?.length ?? 0 })}</div>
          </div>
        </div>

        {novelSetup ? (
          <CreativeHubNovelSetupCard setup={novelSetup} onQuickAction={onQuickAction} />
        ) : null}

        {novelSetup?.stage === "setup_in_progress" || novelSetup?.stage === "ready_for_planning" ? null : (
          <NovelProductionStarterCard
            currentNovelId={bindings.novelId ?? null}
            currentNovelTitle={currentNovelTitle}
            productionStatus={productionStatus}
            onQuickAction={onQuickAction}
            onSubmit={(prompt) => onStartProduction?.(prompt)}
          />
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-slate-500">{t("creativeHub:sidebar.currentProgress")}</div>
            <Badge variant="outline">{activeStage}</Badge>
          </div>
          {latestTurnSummary ? (
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:sidebar.actionSummary")}</div>
                <div className="mt-2 leading-6 text-slate-800">{latestTurnSummary.actionSummary}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:sidebar.impactSummary")}</div>
                <div className="mt-2 leading-6 text-slate-800">{latestTurnSummary.impactSummary}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:sidebar.nextSuggestion")}</div>
                <div className="mt-2 leading-6 text-slate-800">{latestTurnSummary.nextSuggestion}</div>
                {latestTurnSummary.nextSuggestion.trim() ? (
                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onQuickAction?.(latestTurnSummary.nextSuggestion)}
                    >
                      {t("creativeHub:sidebar.blocker.followSuggestion")}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              {t("creativeHub:sidebar.noTurnSummary")}
            </div>
          )}
        </div>

        <div className={cn("rounded-2xl border p-3", blocker.tone)}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-xs font-medium">{blocker.title}</div>
            {interrupt ? <Badge variant="secondary">{t("creativeHub:sidebar.needsConfirm")}</Badge> : null}
          </div>
          <div className="text-sm leading-6">{blocker.summary}</div>
          {blocker.details.length > 0 ? (
            <div className="mt-3 space-y-2 text-xs">
              {blocker.details.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          ) : null}
          {blocker.actionLabel && blockerActionPrompt ? (
            <div className="mt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-current bg-white/80"
                onClick={() => onQuickAction?.(blockerActionPrompt)}
              >
                {blocker.actionLabel}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="mb-3 text-xs font-medium text-slate-500">{t("creativeHub:sidebar.productionStage")}</div>
          {productionStatus ? (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:sidebar.currentStage")}</div>
                  <div className="mt-2 text-sm font-medium text-slate-900">{productionStatus.currentStage}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:sidebar.chapterProgress")}</div>
                  <div className="mt-2 text-sm font-medium text-slate-900">
                    {productionStatus.chapterCount}/{productionStatus.targetChapterCount}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:sidebar.assetsCompleted")}</div>
                  <div className="mt-2 text-sm font-medium text-slate-900">
                    {completedAssets}/{productionStatus.assetStages.length}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:sidebar.pipeline")}</div>
                  <div className="mt-2 text-sm font-medium text-slate-900">
                    {productionStatus.pipelineStatus ?? t("creativeHub:sidebar.notStarted")}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {productionStatus.assetStages.map((item) => (
                  <span
                    key={item.key}
                    className={cn("rounded-full border px-2 py-1 text-[11px]", metricTone(item.status))}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              {t("creativeHub:sidebar.noProductionStatus")}
            </div>
          )}
        </div>

        <details className="rounded-2xl border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer list-none text-xs font-medium text-slate-500">
            {t("creativeHub:sidebar.debug.title")}
          </summary>
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                {t("creativeHub:sidebar.debug.runtimeDetails")}
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-slate-700">
                <span>
                  {t("creativeHub:sidebar.debug.currentDefault")}
                  {defaultRuntimeDetailsCollapsed ? t("creativeHub:sidebar.debug.collapsed") : t("creativeHub:sidebar.debug.expanded")}
                  {t("creativeHub:sidebar.debug.runtimeDetailsInMessage")}
                </span>
                <Button type="button" size="sm" variant="outline" onClick={onToggleRuntimeDetailsDefault}>
                  {t("creativeHub:sidebar.debug.toggleTo", { state: defaultRuntimeDetailsCollapsed ? t("creativeHub:sidebar.debug.defaultExpanded") : t("creativeHub:sidebar.debug.defaultCollapsed") })}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:sidebar.debug.threadStatus")}</div>
              <DebugRow label={t("creativeHub:sidebar.debug.threadId")} value={thread?.id ?? "-"} />
              <DebugRow label={t("creativeHub:sidebar.debug.threadStatus")} value={threadStatusLabel(thread?.status, t)} />
              <DebugRow label={t("creativeHub:sidebar.debug.latestRun")} value={latestRunId ?? "-"} />
              <DebugRow label={t("creativeHub:sidebar.debug.currentCheckpoint")} value={currentCheckpointId ?? "-"} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:sidebar.debug.modelRouting")}</div>
              <DebugRow label="Provider" value={modelSummary.provider} />
              <DebugRow label="Model" value={modelSummary.model} />
              <DebugRow label="Temperature" value={String(modelSummary.temperature)} />
              <DebugRow label="Max tokens" value={modelSummary.maxTokens != null ? String(modelSummary.maxTokens) : t("creativeHub:sidebar.debug.default")} />
            </div>

            {latestTurnSummary ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:sidebar.debug.latestTurn")}</div>
                <DebugRow label={t("creativeHub:sidebar.debug.turnStatus")} value={turnStatusLabel(latestTurnSummary.status, t)} />
                <DebugRow label={t("creativeHub:sidebar.debug.turnStage")} value={latestTurnSummary.currentStage} />
                <DebugRow label={t("creativeHub:sidebar.debug.summaryCheckpoint")} value={latestTurnSummary.checkpointId ?? "-"} />
              </div>
            ) : null}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
