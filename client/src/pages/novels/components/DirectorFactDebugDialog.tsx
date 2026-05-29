import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bug, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import type { DirectorTaskFactInspectionStep } from "@ai-novel/shared/types/directorRuntime";
import { getDirectorNovelFactInspection } from "@/api/novelDirector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function formatPercent(ratio: number): string {
  return `${Math.max(0, Math.min(100, Math.round(ratio * 100)))}%`;
}

function formatStageLabel(stage: string, t: (key: string) => string): string {
  const stageMap: Record<string, string> = {
    candidate_selection: t("novel:directorDebug.stages.candidateSelection"),
    candidate_confirm: t("novel:directorDebug.stages.candidateConfirm"),
    story_macro: t("novel:directorDebug.stages.storyMacro"),
    book_contract: t("novel:directorDebug.stages.bookContract"),
    character_setup: t("novel:directorDebug.stages.characterSetup"),
    volume_strategy: t("novel:directorDebug.stages.volumeStrategy"),
    structured_outline: t("novel:directorDebug.stages.structuredOutline"),
    chapter_execution: t("novel:directorDebug.stages.chapterExecution"),
    quality_repair: t("novel:directorDebug.stages.qualityRepair"),
    takeover: t("novel:directorDebug.stages.takeover"),
  };
  return stageMap[stage] ?? stage;
}

function formatNextAction(action?: string | null, t?: (key: string) => string): string {
  if (!action) return t ? t("novel:directorDebug.noActionSuggestion") : "当前没有额外动作建议";
  if (action === "run_chapter_detail_generation") return t ? t("novel:directorDebug.actions.runChapterDetailGeneration") : "继续细化剩余章节任务单";
  if (action === "run_chapter_list_generation") return t ? t("novel:directorDebug.actions.runChapterListGeneration") : "继续补齐卷拆章列表";
  if (action === "sync_execution_contracts") return t ? t("novel:directorDebug.actions.syncExecutionContracts") : "同步章节执行合同";
  const text = action
    .replace(/_/g, " ")
    .replace(/\./g, " ")
    .trim();
  return text || action;
}

function formatResumeFrom(resumeFrom?: string | null, t?: (key: string, opts?: Record<string, unknown>) => string): string {
  if (!resumeFrom) return t ? t("novel:directorDebug.resumeFrom.reJudge") : "按当前现场重新判断";
  if (resumeFrom === "chapter_detail_bundle") return t ? t("novel:directorDebug.resumeFrom.chapterDetailBundle") : "从剩余未细化章节继续";
  if (resumeFrom === "chapter_list") return t ? t("novel:directorDebug.resumeFrom.chapterList") : "从卷拆章列表继续";
  if (resumeFrom === "beat_sheet") return t ? t("novel:directorDebug.resumeFrom.beatSheet") : "从卷节奏板继续";
  if (resumeFrom.startsWith("chapter:")) {
    const rawOrder = resumeFrom.slice("chapter:".length).trim();
    const order = Number(rawOrder);
    if (Number.isFinite(order) && order > 0) {
      return t ? t("novel:directorDebug.resumeFrom.chapterOrder", { order }) : `第 ${order} 章`;
    }
  }
  return resumeFrom.replace(/_/g, " ").trim() || resumeFrom;
}

function summarizeStep(step: DirectorTaskFactInspectionStep, t: (key: string) => string): {
  tone: "done" | "current" | "blocked" | "working" | "error";
  title: string;
  detail: string;
} {
  if (step.inspectError) {
    return {
      tone: "error",
      title: t("novel:directorDebug.stepTone.error"),
      detail: step.inspectError,
    };
  }
  if (step.completed) {
    return {
      tone: "done",
      title: t("novel:directorDebug.stepTone.done"),
      detail: t("novel:directorDebug.stepDetail.done"),
    };
  }
  if (!step.ready) {
    return {
      tone: "blocked",
      title: t("novel:directorDebug.stepTone.blocked"),
      detail: step.blockers[0]?.reason || t("novel:directorDebug.stepDetail.blocked"),
    };
  }
  if (step.isCurrentFactStep) {
    return {
      tone: "current",
      title: t("novel:directorDebug.stepTone.current"),
      detail: step.progress?.label || t("novel:directorDebug.stepDetail.current"),
    };
  }
  return {
    tone: "working",
    title: t("novel:directorDebug.stepTone.working"),
    detail: step.progress?.label || t("novel:directorDebug.stepDetail.working"),
  };
}

function toneBadgeVariant(tone: "done" | "current" | "blocked" | "working" | "error"): "default" | "secondary" | "outline" | "destructive" {
  if (tone === "done") return "secondary";
  if (tone === "current") return "default";
  if (tone === "blocked" || tone === "error") return "destructive";
  return "outline";
}

function StepFactCard({ step }: { step: DirectorTaskFactInspectionStep }) {
  const { t } = useTranslation();
  const summary = summarizeStep(step, t);

  return (
    <Card className="rounded-lg">
      <CardHeader className="space-y-3 p-4 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="text-sm font-semibold text-foreground">{step.label}</div>
            <div className="text-xs text-muted-foreground">{formatStageLabel(step.stage, t)}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {step.isCurrentFactStep ? <Badge>{t("novel:directorDebug.currentFactStep")}</Badge> : null}
            {step.isActiveRuntimeStep ? <Badge variant="outline">{t("novel:directorDebug.activeRuntimeStep")}</Badge> : null}
            <Badge variant={toneBadgeVariant(summary.tone)}>{summary.title}</Badge>
          </div>
        </div>
        <div className="text-sm leading-6 text-muted-foreground">{summary.detail}</div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("novel:directorDebug.completeness")}</span>
            <span>{formatPercent(step.completenessRatio)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: formatPercent(step.completenessRatio) }}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
            <div className="text-xs text-muted-foreground">{t("novel:directorDebug.canContinue")}</div>
            <div className="mt-1 text-sm font-medium text-foreground">
              {step.ready ? t("novel:directorDebug.canStart") : t("novel:directorDebug.needsPrerequisite")}
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
            <div className="text-xs text-muted-foreground">{t("novel:directorDebug.nextStep")}</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatNextAction(step.nextAction, t)}</div>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
            <div className="text-xs text-muted-foreground">{t("novel:directorDebug.resumeFrom.label")}</div>
            <div className="mt-1 text-sm font-medium text-foreground">{formatResumeFrom(step.resumeFrom, t)}</div>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
            <div className="text-xs text-muted-foreground">{t("novel:directorDebug.latestFactDesc")}</div>
            <div className="mt-1 text-sm font-medium text-foreground">{step.progress?.label || t("novel:directorDebug.noExtraDesc")}</div>
          </div>
        </div>

        {step.blockers.length > 0 ? (
          <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="text-sm font-medium text-destructive">{t("novel:directorDebug.blockedReason")}</div>
            <ul className="space-y-2 text-sm leading-6 text-destructive/90">
              {step.blockers.map((blocker) => (
                <li key={`${step.stepId}:${blocker.code}`}>{blocker.reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {step.evidence ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">{t("novel:directorDebug.evidence")}</div>
            <pre className="overflow-x-auto rounded-lg border border-border/70 bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
              {JSON.stringify(step.evidence, null, 2)}
            </pre>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function DirectorFactDebugDialog(input: {
  novelId: string;
  taskId?: string | null;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { novelId, disabled = false } = input;
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["director-novel-fact-inspection", novelId],
    queryFn: () => getDirectorNovelFactInspection(novelId),
    enabled: open && Boolean(novelId),
    staleTime: 0,
  });

  const inspection = query.data?.data?.inspection ?? null;
  const summary = useMemo(() => {
    const steps = inspection?.steps ?? [];
    return {
      completedCount: steps.filter((step) => step.completed).length,
      blockedCount: steps.filter((step) => !step.completed && !step.ready).length,
      currentStep: steps.find((step) => step.isCurrentFactStep) ?? null,
    };
  }, [inspection]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled || !novelId}>
          <Bug className="h-4 w-4" />
          {t("novel:directorDebug.debugButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle>{t("novel:directorDebug.dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("novel:directorDebug.dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[calc(90vh-88px)] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-6 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {t("novel:directorDebug.completedCount", { count: summary.completedCount, total: inspection?.steps.length ?? 0 })}
              </Badge>
              <Badge variant={summary.blockedCount > 0 ? "destructive" : "outline"}>
                {t("novel:directorDebug.blockedCount", { count: summary.blockedCount })}
              </Badge>
              {summary.currentStep ? (
                <Badge>
                  {t("novel:directorDebug.currentStepLabel", { label: summary.currentStep.label })}
                </Badge>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
              disabled={query.isFetching || !novelId}
            >
              {query.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {t("novel:directorDebug.recheck")}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {query.isLoading || query.isFetching ? (
              <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("novel:directorDebug.loading")}
              </div>
            ) : query.isError ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <div className="max-w-md rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive">
                  {t("novel:directorDebug.loadError")} {query.error instanceof Error ? query.error.message : t("common:actions.retry")}
                </div>
              </div>
            ) : !inspection ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <div className="max-w-md rounded-lg border border-border/70 bg-muted/10 px-4 py-4 text-sm text-muted-foreground">
                  {t("novel:directorDebug.noTask")}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {inspection.currentFactEvidence ? (
                  <Card className="rounded-lg border-primary/20 bg-primary/5">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CheckCircle2 className="h-4 w-4" />
                        {t("novel:directorDebug.currentFactStepTitle")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 pt-0">
                      <div className="text-sm text-foreground">{inspection.currentFactStepLabel || t("novel:directorDebug.reJudging")}</div>
                      <pre className="overflow-x-auto rounded-lg border border-border/70 bg-background/70 p-3 text-xs leading-5 text-muted-foreground">
                        {JSON.stringify(inspection.currentFactEvidence, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ) : null}

                <div className="grid gap-4">
                  {inspection.steps.map((step) => (
                    <StepFactCard key={step.stepId} step={step} />
                  ))}
                </div>

                {inspection.steps.some((step) => step.inspectError) ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {t("novel:directorDebug.partialInspectWarning")}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



