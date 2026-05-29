import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CreativeHubToolResultCardProps {
  toolName: string;
  summary: string;
  success: boolean;
  output?: Record<string, unknown>;
  errorCode?: string;
  onQuickAction?: (prompt: string) => void;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.map((item) => asRecord(item)).filter((item) => Object.keys(item).length > 0)
    : [];
}

function itemLabel(item: Record<string, unknown>): string {
  const candidates = ["title", "name", "label", "summary", "content"];
  for (const key of candidates) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  if (typeof item.id === "string" && item.id.trim()) {
    return item.id.trim();
  }
  return "未命名条目"; // i18n-ignore: internal fallback for unnamed items
}

function compactText(value: string, max = 140): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function formatNovelProjectStatus(value: unknown, t: TFunction): string | null {
  switch (value) {
    case "in_progress": return t("creativeHub:toolResult.projectStatus.inProgress");
    case "not_started": return t("creativeHub:toolResult.projectStatus.notStarted");
    case "completed": return t("creativeHub:toolResult.projectStatus.completed");
    case "rework": return t("creativeHub:toolResult.projectStatus.rework");
    case "blocked": return t("creativeHub:toolResult.projectStatus.blocked");
    default: return null;
  }
}

function renderActionButtons(actions: Array<{ label: string; prompt: string }>, onQuickAction?: (prompt: string) => void) {
  if (!onQuickAction || actions.length === 0) {
    return null;
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={`${action.label}-${action.prompt}`}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onQuickAction(action.prompt)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

function renderNovelList(output: Record<string, unknown>, t: TFunction, onQuickAction?: (prompt: string) => void) {
  const total = typeof output.total === "number" ? output.total : null;
  const items = asRecordArray(output.items).slice(0, 8);
  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-600">
        {t("creativeHub:toolResult.novelList.found", { count: total ?? items.length })}
        {total != null && total > items.length ? t("creativeHub:toolResult.novelList.showing", { count: items.length }) : ""}
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const title = itemLabel(item);
          const chapterCount = typeof item.chapterCount === "number" ? item.chapterCount : null;
          const projectStatus = formatNovelProjectStatus(item.projectStatus, t);
          return (
            <div key={`${item.id ?? title}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-sm font-medium text-slate-900">《{title}》</div>
              <div className="mt-1 text-xs text-slate-500">
                {chapterCount != null ? t("creativeHub:toolResult.novelList.chapterCount", { count: chapterCount }) : t("creativeHub:toolResult.novelList.chapterUnknown")}
                {projectStatus ? ` · ${projectStatus}` : ""}
              </div>
              {onQuickAction ? (
                <div className="mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onQuickAction(t("creativeHub:toolResult.novelList.setWorkspacePrompt", { title }))}
                  >
                    {t("creativeHub:toolResult.novelList.setWorkspace")}
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderWorkspaceCard(
  output: Record<string, unknown>,
  variant: "created" | "selected",
  t: TFunction,
  onQuickAction?: (prompt: string) => void,
) {
  const title = typeof output.title === "string" && output.title.trim() ? output.title.trim() : t("creativeHub:toolResult.workspace.unnamedNovel");
  const chapterCount = typeof output.chapterCount === "number" ? output.chapterCount : 0;
  const actions = variant === "created"
    ? [
      { label: t("creativeHub:toolResult.workspace.viewProgress"), prompt: t("creativeHub:toolResult.workspace.viewProgressPrompt") },
      { label: t("creativeHub:toolResult.workspace.planFirstChapter"), prompt: t("creativeHub:toolResult.workspace.planFirstChapterPrompt") },
    ]
    : [
      { label: t("creativeHub:toolResult.workspace.viewProgress"), prompt: t("creativeHub:toolResult.workspace.viewProgressPrompt") },
      { label: t("creativeHub:toolResult.workspace.viewFirstTwo"), prompt: t("creativeHub:toolResult.workspace.viewFirstTwoPrompt") },
    ];
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
        <div className="text-sm font-medium text-slate-900">《{title}》</div>
        <div className="mt-1 text-xs text-slate-600">
          {variant === "created" ? t("creativeHub:toolResult.workspace.created") : t("creativeHub:toolResult.workspace.selected")}
        </div>
        <div className="mt-2 text-xs text-slate-500">{t("creativeHub:toolResult.workspace.chapterCount", { count: chapterCount })}</div>
      </div>
      {renderActionButtons(actions, onQuickAction)}
    </div>
  );
}

function renderWorldBindingCard(output: Record<string, unknown>, t: TFunction, onQuickAction?: (prompt: string) => void) {
  const novelTitle = typeof output.novelTitle === "string" && output.novelTitle.trim()
    ? output.novelTitle.trim()
    : t("creativeHub:toolResult.worldBinding.currentNovel");
  const worldName = typeof output.worldName === "string" && output.worldName.trim()
    ? output.worldName.trim()
    : t("creativeHub:toolResult.worldBinding.unnamedWorld");
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-3">
        <div className="text-sm font-medium text-slate-900">《{novelTitle}》</div>
        <div className="mt-1 text-xs text-slate-600">{t("creativeHub:toolResult.worldBinding.bound", { worldName })}</div>
      </div>
      {renderActionButtons([
        { label: t("creativeHub:toolResult.worldBinding.viewConstraints"), prompt: t("creativeHub:toolResult.worldBinding.viewConstraintsPrompt") },
        { label: t("creativeHub:toolResult.worldBinding.checkConflicts"), prompt: t("creativeHub:toolResult.worldBinding.checkConflictsPrompt") },
      ], onQuickAction)}
    </div>
  );
}

function renderProductionAssetCard(
  title: string,
  description: string,
  actions: Array<{ label: string; prompt: string }>,
  onQuickAction?: (prompt: string) => void,
) {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-3">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="mt-1 text-xs leading-5 text-slate-600">{description}</div>
      </div>
      {renderActionButtons(actions, onQuickAction)}
    </div>
  );
}

function renderProductionStatusCard(output: Record<string, unknown>, t: TFunction, onQuickAction?: (prompt: string) => void) {
  const title = typeof output.title === "string" && output.title.trim() ? output.title.trim() : t("creativeHub:toolResult.productionStatus.currentNovel");
  const currentStage = typeof output.currentStage === "string" ? output.currentStage.trim() : t("creativeHub:toolResult.productionStatus.unknownStage");
  const chapterCount = typeof output.chapterCount === "number" ? output.chapterCount : 0;
  const targetChapterCount = typeof output.targetChapterCount === "number" ? output.targetChapterCount : null;
  const pipelineStatus = typeof output.pipelineStatus === "string" && output.pipelineStatus.trim()
    ? output.pipelineStatus.trim()
    : t("creativeHub:toolResult.productionStatus.notStarted");
  const assetStages = asRecordArray(output.assetStages);
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-3">
        <div className="text-sm font-medium text-slate-900">《{title}》</div>
        <div className="mt-1 text-xs text-slate-600">{t("creativeHub:toolResult.productionStatus.stage", { stage: currentStage })}</div>
        <div className="mt-1 text-xs text-slate-600">
          {t("creativeHub:toolResult.productionStatus.chapters", {
            count: chapterCount,
            target: targetChapterCount,
          })}
        </div>
        <div className="mt-1 text-xs text-slate-600">{t("creativeHub:toolResult.productionStatus.pipeline", { status: pipelineStatus })}</div>
        {typeof output.failureSummary === "string" && output.failureSummary.trim() ? (
          <div className="mt-2 text-xs leading-5 text-slate-600">{t("creativeHub:toolResult.productionStatus.failureSummary", { summary: output.failureSummary.trim() })}</div>
        ) : null}
      </div>
      {assetStages.length > 0 ? (
        <div className="grid gap-2">
          {assetStages.slice(0, 8).map((stage) => (
            <div key={`${stage.key ?? stage.label}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-sm font-medium text-slate-900">{String(stage.label ?? stage.key ?? t("creativeHub:toolResult.productionStatus.stageLabel"))}</div>
              <div className="mt-1 text-xs text-slate-500">{t("creativeHub:toolResult.productionStatus.stageStatus", { status: String(stage.status ?? "unknown") })}</div>
              {typeof stage.detail === "string" && stage.detail.trim() ? (
                <div className="mt-1 text-xs text-slate-600">{stage.detail.trim()}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {renderActionButtons([
        { label: t("creativeHub:toolResult.productionStatus.continueGeneration"), prompt: t("creativeHub:toolResult.productionStatus.continueGenerationPrompt") },
        { label: t("creativeHub:toolResult.productionStatus.viewProgress"), prompt: t("creativeHub:toolResult.productionStatus.viewProgressPrompt") },
      ], onQuickAction)}
    </div>
  );
}

function renderPipelineRunCard(
  toolName: "preview_pipeline_run" | "queue_pipeline_run",
  output: Record<string, unknown>,
  t: TFunction,
  onQuickAction?: (prompt: string) => void,
) {
  const startOrder = typeof output.startOrder === "number" ? output.startOrder : null;
  const endOrder = typeof output.endOrder === "number" ? output.endOrder : null;
  const jobId = typeof output.jobId === "string" && output.jobId.trim() ? output.jobId.trim() : null;
  const scope = startOrder != null && endOrder != null
    ? startOrder === endOrder
      ? t("creativeHub:toolResult.pipelineRun.scopeSingle", { order: startOrder })
      : t("creativeHub:toolResult.pipelineRun.scopeRange", { start: startOrder, end: endOrder })
    : t("creativeHub:toolResult.pipelineRun.scopeFallback");
  const title = toolName === "preview_pipeline_run"
    ? t("creativeHub:toolResult.pipelineRun.previewTitle")
    : t("creativeHub:toolResult.pipelineRun.queueTitle");
  const description = toolName === "preview_pipeline_run"
    ? t("creativeHub:toolResult.pipelineRun.previewDescription", { scope })
    : t("creativeHub:toolResult.pipelineRun.queueDescription", { scope, jobId: jobId ?? "" });
  const actions = toolName === "preview_pipeline_run"
    ? [
      { label: t("creativeHub:toolResult.pipelineRun.viewProgress"), prompt: t("creativeHub:toolResult.pipelineRun.viewProgressPrompt") },
      { label: t("creativeHub:toolResult.pipelineRun.viewBlocker"), prompt: t("creativeHub:toolResult.pipelineRun.viewBlockerPrompt") },
    ]
    : [
      { label: t("creativeHub:toolResult.pipelineRun.viewProgress"), prompt: t("creativeHub:toolResult.pipelineRun.viewProgressPrompt") },
      { label: t("creativeHub:toolResult.pipelineRun.viewTasks"), prompt: t("creativeHub:toolResult.pipelineRun.viewTasksPrompt") },
    ];
  return renderProductionAssetCard(title, description, actions, onQuickAction);
}

function renderDiagnosticCard(output: Record<string, unknown>, t: TFunction, onQuickAction?: (prompt: string) => void) {
  const failureSummary = typeof output.failureSummary === "string" ? output.failureSummary : "";
  const failureDetails = typeof output.failureDetails === "string" ? output.failureDetails : "";
  const recoveryHint = typeof output.recoveryHint === "string" ? output.recoveryHint : "";
  return (
    <div className="space-y-2">
      {failureSummary ? <div className="text-sm font-medium text-slate-900">{failureSummary}</div> : null}
      {failureDetails ? <div className="text-xs leading-5 text-slate-600">{t("creativeHub:toolResult.diagnostic.details", { details: failureDetails })}</div> : null}
      {recoveryHint ? <div className="text-xs leading-5 text-slate-600">{t("creativeHub:toolResult.diagnostic.hint", { hint: recoveryHint })}</div> : null}
      {renderActionButtons([
        { label: t("creativeHub:toolResult.diagnostic.continueDiagnosis"), prompt: t("creativeHub:toolResult.diagnostic.continueDiagnosisPrompt") },
        { label: t("creativeHub:toolResult.diagnostic.viewTasks"), prompt: t("creativeHub:toolResult.diagnostic.viewTasksPrompt") },
      ], onQuickAction)}
    </div>
  );
}

function renderListCard(
  output: Record<string, unknown>,
  emptyLabel: string,
  t: TFunction,
  onQuickAction?: (prompt: string) => void,
) {
  const items = asRecordArray(output.items).slice(0, 6);
  if (items.length === 0) {
    return <div className="text-xs text-slate-500">{emptyLabel}</div>;
  }
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {items.map((item) => (
          <div key={`${item.id ?? itemLabel(item)}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-sm font-medium text-slate-900">{itemLabel(item)}</div>
            {"status" in item && typeof item.status === "string" ? (
              <div className="mt-1 text-xs text-slate-500">{t("creativeHub:toolResult.list.status", { status: item.status })}</div>
            ) : null}
          </div>
        ))}
      </div>
      {renderActionButtons([{ label: t("creativeHub:toolResult.list.refine"), prompt: t("creativeHub:toolResult.list.refinePrompt") }], onQuickAction)}
    </div>
  );
}

function renderChapterCard(output: Record<string, unknown>, t: TFunction, onQuickAction?: (prompt: string) => void) {
  const title = typeof output.title === "string" && output.title.trim() ? output.title.trim() : "";
  const order = typeof output.order === "number" ? output.order : null;
  const content = typeof output.content === "string"
    ? output.content
    : typeof output.summary === "string"
      ? output.summary
      : "";
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-900">
        {order != null ? t("creativeHub:toolResult.chapter.orderLabel", { order }) : t("creativeHub:toolResult.chapter.fallbackLabel")}
        {title ? `《${title}》` : ""}
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
        {content || t("creativeHub:toolResult.chapter.empty")}
      </div>
      {renderActionButtons([
        { label: t("creativeHub:toolResult.chapter.summarize"), prompt: t("creativeHub:toolResult.chapter.summarizePrompt") },
        { label: t("creativeHub:toolResult.chapter.checkConflict"), prompt: t("creativeHub:toolResult.chapter.checkConflictPrompt") },
      ], onQuickAction)}
    </div>
  );
}

export default function CreativeHubToolResultCard({
  toolName,
  summary,
  success,
  output,
  errorCode,
  onQuickAction,
}: CreativeHubToolResultCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const payload = asRecord(output);
  const summaryText = compactText(summary, 160) || t("creativeHub:toolResult.defaultSummary");
  const cardContent = (() => {
    if (toolName === "list_novels") {
      return renderNovelList(payload, t, onQuickAction);
    }
    if (toolName === "create_novel") {
      return renderWorkspaceCard(payload, "created", t, onQuickAction);
    }
    if (toolName === "select_novel_workspace") {
      return renderWorkspaceCard(payload, "selected", t, onQuickAction);
    }
    if (toolName === "bind_world_to_novel") {
      return renderWorldBindingCard(payload, t, onQuickAction);
    }
    if (toolName === "generate_world_for_novel") {
      const worldName = typeof payload.worldName === "string" && payload.worldName.trim() ? payload.worldName.trim() : t("creativeHub:toolResult.worldBinding.unnamedWorld");
      return renderProductionAssetCard(
        t("creativeHub:toolResult.worldGenerated.title"),
        t("creativeHub:toolResult.worldGenerated.description", { worldName }),
        [
          { label: t("creativeHub:toolResult.productionStatus.continueGeneration"), prompt: t("creativeHub:toolResult.productionStatus.continueGenerationPrompt") },
          { label: t("creativeHub:toolResult.productionStatus.viewProgress"), prompt: t("creativeHub:toolResult.productionStatus.viewProgressPrompt") },
        ],
        onQuickAction,
      );
    }
    if (toolName === "generate_novel_characters") {
      const characterCount = typeof payload.characterCount === "number" ? payload.characterCount : 0;
      return renderProductionAssetCard(
        t("creativeHub:toolResult.charactersGenerated.title"),
        t("creativeHub:toolResult.charactersGenerated.description", { count: characterCount }),
        [
          { label: t("creativeHub:toolResult.productionStatus.continueGeneration"), prompt: t("creativeHub:toolResult.productionStatus.continueGenerationPrompt") },
          { label: t("creativeHub:toolResult.charactersGenerated.viewStatus"), prompt: t("creativeHub:toolResult.charactersGenerated.viewStatusPrompt") },
        ],
        onQuickAction,
      );
    }
    if (toolName === "generate_story_bible") {
      return renderProductionAssetCard(
        t("creativeHub:toolResult.bibleGenerated.title"),
        typeof payload.mainPromise === "string" && payload.mainPromise.trim()
          ? payload.mainPromise.trim()
          : t("creativeHub:toolResult.bibleGenerated.fallback"),
        [
          { label: t("creativeHub:toolResult.productionStatus.continueGeneration"), prompt: t("creativeHub:toolResult.productionStatus.continueGenerationPrompt") },
          { label: t("creativeHub:toolResult.productionStatus.viewProgress"), prompt: t("creativeHub:toolResult.productionStatus.viewProgressPrompt") },
        ],
        onQuickAction,
      );
    }
    if (toolName === "generate_novel_outline") {
      return renderProductionAssetCard(
        t("creativeHub:toolResult.outlineGenerated.title"),
        typeof payload.outline === "string" && payload.outline.trim()
          ? payload.outline.trim()
          : t("creativeHub:toolResult.outlineGenerated.fallback"),
        [
          { label: t("creativeHub:toolResult.productionStatus.continueGeneration"), prompt: t("creativeHub:toolResult.productionStatus.continueGenerationPrompt") },
          { label: t("creativeHub:toolResult.productionStatus.viewProgress"), prompt: t("creativeHub:toolResult.productionStatus.viewProgressPrompt") },
        ],
        onQuickAction,
      );
    }
    if (toolName === "generate_structured_outline") {
      const targetChapterCount = typeof payload.targetChapterCount === "number" ? payload.targetChapterCount : 0;
      return renderProductionAssetCard(
        t("creativeHub:toolResult.structuredOutlineGenerated.title"),
        targetChapterCount > 0
          ? t("creativeHub:toolResult.structuredOutlineGenerated.description", { count: targetChapterCount })
          : t("creativeHub:toolResult.structuredOutlineGenerated.fallback"),
        [
          { label: t("creativeHub:toolResult.structuredOutlineGenerated.syncChapters"), prompt: t("creativeHub:toolResult.productionStatus.continueGenerationPrompt") },
          { label: t("creativeHub:toolResult.productionStatus.viewProgress"), prompt: t("creativeHub:toolResult.productionStatus.viewProgressPrompt") },
        ],
        onQuickAction,
      );
    }
    if (toolName === "sync_chapters_from_structured_outline") {
      const chapterCount = typeof payload.chapterCount === "number" ? payload.chapterCount : 0;
      return renderProductionAssetCard(
        t("creativeHub:toolResult.chaptersSynced.title"),
        chapterCount > 0
          ? t("creativeHub:toolResult.chaptersSynced.description", { count: chapterCount })
          : t("creativeHub:toolResult.chaptersSynced.fallback"),
        [
          { label: t("creativeHub:toolResult.productionStatus.viewProgress"), prompt: t("creativeHub:toolResult.productionStatus.viewProgressPrompt") },
          { label: t("creativeHub:toolResult.productionStatus.continueGeneration"), prompt: t("creativeHub:toolResult.productionStatus.continueGenerationPrompt") },
        ],
        onQuickAction,
      );
    }
    if (toolName === "start_full_novel_pipeline" || toolName === "get_novel_production_status") {
      return renderProductionStatusCard(payload, t, onQuickAction);
    }
    if (toolName === "preview_pipeline_run" || toolName === "queue_pipeline_run") {
      return renderPipelineRunCard(toolName, payload, t, onQuickAction);
    }
    if (
      toolName === "get_task_failure_reason"
      || toolName === "get_run_failure_reason"
      || toolName === "get_index_failure_reason"
      || toolName === "get_book_analysis_failure_reason"
      || toolName === "explain_generation_blocker"
      || toolName === "explain_world_conflict"
      || toolName === "failure_diagnostic"
    ) {
      return renderDiagnosticCard(payload, t, onQuickAction);
    }
    if (
      toolName === "list_worlds"
      || toolName === "list_tasks"
      || toolName === "list_knowledge_documents"
      || toolName === "list_book_analyses"
      || toolName === "list_writing_formulas"
      || toolName === "list_base_characters"
    ) {
      return renderListCard(payload, t("creativeHub:toolResult.list.empty"), t, onQuickAction);
    }
    if (
      toolName === "get_chapter_content"
      || toolName === "get_chapter_content_by_order"
      || toolName === "summarize_chapter_range"
    ) {
      return renderChapterCard(payload, t, onQuickAction);
    }
    return null;
  })();

  if (!cardContent) {
    return null;
  }

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-medium text-slate-900">{summaryText}</div>
          <Badge variant={success ? "secondary" : "destructive"}>{success ? t("creativeHub:toolResult.parsedBadge") : errorCode ?? t("creativeHub:toolResult.failedBadge")}</Badge>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] text-slate-600 transition hover:bg-slate-100"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t("creativeHub:toolResult.collapse") : t("creativeHub:toolResult.expand")}
        </button>
      </div>
      {expanded ? (
        <div className="mt-3">{cardContent}</div>
      ) : (
        <div className="mt-2 text-xs text-slate-500">{t("creativeHub:toolResult.collapsedHint")}</div>
      )}
    </div>
  );
}
