import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ChapterRuntimePackage } from "@ai-novel/shared/types/chapterRuntime";
import type { Chapter, StoryPlan } from "@ai-novel/shared/types/novel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { chapterStatusLabel, generationStateLabel, resolveDisplayedChapterStatus } from "../chapterExecution.shared";

interface ChapterExecutionOverviewPanelProps {
  selectedChapter?: Chapter;
  chapterPlan?: StoryPlan | null;
  chapterQualityReport?: {
    coherence: number;
    repetition: number;
    pacing: number;
    voice: number;
    engagement: number;
    overall: number;
    issues?: string | null;
  } | null;
  chapterRuntimePackage?: ChapterRuntimePackage | null;
  reviewResult?: {
    issues?: Array<{ category: string; fixSuggestion: string }>;
  } | null;
  openAuditIssues?: Array<{ id: string; auditType: string; fixSuggestion: string }>;
}

function getQualityBadgeVariant(quality: number): "default" | "outline" | "secondary" {
  if (quality >= 85) {
    return "default";
  }
  if (quality >= 70) {
    return "outline";
  }
  return "secondary";
}

function OverviewStat(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-xs text-muted-foreground">{props.label}</div>
        <div className="shrink-0 text-right text-sm font-semibold text-foreground">{props.value}</div>
      </div>
      {props.hint ? <div className="mt-1 text-xs leading-5 text-muted-foreground">{props.hint}</div> : null}
    </div>
  );
}

export default function ChapterExecutionOverviewPanel(props: ChapterExecutionOverviewPanelProps) {
  const { t } = useTranslation("novel");
  const {
    selectedChapter,
    chapterPlan,
    chapterQualityReport,
    chapterRuntimePackage,
    reviewResult,
    openAuditIssues = [],
  } = props;

  if (!selectedChapter) {
    return (
      <section className="rounded-2xl border border-dashed border-border/70 bg-background p-4 text-sm leading-6 text-muted-foreground">
        {t("chapter.overviewPanel.noSelectionHint")}
      </section>
    );
  }

  const chapterLabel = t("chapter.overviewPanel.chapterLabel", { order: selectedChapter.order });
  const chapterTitle = selectedChapter.title || t("chapter.overviewPanel.unnamedChapter");
  const chapterObjective = chapterPlan?.objective ?? selectedChapter.expectation ?? t("chapter.overviewPanel.noObjectiveHint");
  const runtimePackage = chapterRuntimePackage?.chapterId === selectedChapter.id ? chapterRuntimePackage : null;
  const lengthControl = runtimePackage?.lengthControl ?? null;
  const qualityOverall = chapterQualityReport?.overall ?? selectedChapter.qualityScore ?? null;
  const displayedStatus = resolveDisplayedChapterStatus(selectedChapter);
  const statusLabel = chapterStatusLabel(displayedStatus, t);
  const generationLabel = generationStateLabel(selectedChapter.generationState, t);
  const currentWordCount = runtimePackage?.draft.wordCount ?? selectedChapter.content?.trim().length ?? 0;
  const targetWordCount = selectedChapter.targetWordCount ?? null;
  const issueCount = openAuditIssues.length || reviewResult?.issues?.length || 0;
  const updatedAt = selectedChapter.updatedAt ? new Date(selectedChapter.updatedAt).toLocaleString("zh-CN") : t("chapter.overviewPanel.noUpdateTime");

  return (
    <section className="space-y-3 rounded-2xl border border-border/70 bg-background/95 p-4">
      <div className="flex flex-col gap-3">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{chapterLabel}</Badge>
            <Badge variant={displayedStatus === "needs_repair" ? "destructive" : displayedStatus === "pending_review" ? "secondary" : "default"}>
              {statusLabel}
            </Badge>
            {generationLabel ? <Badge variant="outline">{generationLabel}</Badge> : null}
            {typeof qualityOverall === "number" ? (
              <Badge variant={getQualityBadgeVariant(qualityOverall)}>{t("chapter.overviewPanel.qualityBadge", { score: qualityOverall })}</Badge>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">{t("chapter.overviewPanel.overviewTitle")}</div>
            <div className="text-base font-semibold text-foreground">{chapterTitle}</div>
            <p className="line-clamp-6 text-sm leading-6 text-muted-foreground">
              {chapterObjective}
            </p>
          </div>
        </div>

        <Button asChild size="sm" variant="outline" className="w-full justify-center">
          <Link to={`/novels/${selectedChapter.novelId}/chapters/${selectedChapter.id}`}>{t("chapter.overviewPanel.openEditor")}</Link>
        </Button>
      </div>

      <div className="space-y-2">
        <OverviewStat label={t("chapter.overviewPanel.statWordCount")} value={String(currentWordCount)} hint={t("chapter.overviewPanel.statWordCountHint")} />
        <OverviewStat label={t("chapter.overviewPanel.statTargetWordCount")} value={targetWordCount ? t("chapter.overviewPanel.targetWordCountValue", { count: targetWordCount }) : t("chapter.overviewPanel.targetWordCountUnset")} hint={t("chapter.overviewPanel.statTargetWordCountHint")} />
        <OverviewStat label={t("chapter.overviewPanel.statIssues")} value={String(issueCount)} hint={t("chapter.overviewPanel.statIssuesHint")} />
        <OverviewStat label={t("chapter.overviewPanel.statUpdatedAt")} value={updatedAt} hint={t("chapter.overviewPanel.statUpdatedAtHint")} />
      </div>

      {lengthControl ? (
        <div className="space-y-2">
          <OverviewStat
            label={t("chapter.overviewPanel.statBudgetRange")}
            value={`${lengthControl.softMinWordCount}-${lengthControl.softMaxWordCount}`}
            hint={t("chapter.overviewPanel.statBudgetRangeHint", { max: lengthControl.hardMaxWordCount })}
          />
          <OverviewStat
            label={t("chapter.overviewPanel.statWordControlMode")}
            value={
              lengthControl.wordControlMode === "prompt_only"
                ? t("chapter.overviewPanel.wordControlModeNatural")
                : lengthControl.wordControlMode === "balanced"
                  ? t("chapter.overviewPanel.wordControlModeBalanced")
                  : t("chapter.overviewPanel.wordControlModeMixed")
            }
            hint={t("chapter.overviewPanel.statVarianceHint", { variance: Math.round(lengthControl.variance * 100) })}
          />
        </div>
      ) : null}
    </section>
  );
}
