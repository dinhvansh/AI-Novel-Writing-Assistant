import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowRight, Clock3, Loader2, ShieldAlert, Sparkles, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import type { ChapterRuntimePackage } from "@ai-novel/shared/types/chapterRuntime";
import type { Chapter } from "@ai-novel/shared/types/novel";
import type { TimelineContextForChapter, TimelineIssue } from "@ai-novel/shared/types/timeline";
import type { ChapterTimelineViewData } from "../NovelEditView.types";
import type { TimelineCheckSummary } from "./chapterInsights.types";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function getTimelineCheckLabel(status: TimelineCheckSummary["status"], t: (key: string) => string): string {
  if (status === "failed") {
    return t("novel:chapter.timeline.checkFailed");
  }
  if (status === "warning") {
    return t("novel:chapter.timeline.checkWarning");
  }
  return t("novel:chapter.timeline.checkPassed");
}

function getTimelineCheckTone(status: TimelineCheckSummary["status"]): string {
  if (status === "failed") {
    return "border-red-200 bg-red-50 text-red-950";
  }
  if (status === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-950";
}

function getTimelineCheckBadgeVariant(status: TimelineCheckSummary["status"]): NonNullable<BadgeProps["variant"]> {
  if (status === "failed") {
    return "destructive";
  }
  if (status === "warning") {
    return "secondary";
  }
  return "default";
}

function formatTimelineTimeLabel(context: TimelineContextForChapter | null | undefined, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (!context) {
    return t("novel:chapter.timeline.timeNotSet");
  }
  const parts = [
    typeof context.currentTime?.storyDayIndex === "number"
      ? t("novel:chapter.timeline.storyDay", { day: context.currentTime.storyDayIndex })
      : "",
    context.currentTime?.label?.trim() ?? "",
  ].filter(Boolean);
  return parts.join(" · ") || t("novel:chapter.timeline.chapterFallback", { index: context.currentChapterIndex });
}

function formatIssueSeverity(issue: TimelineIssue, t: (key: string) => string): string {
  if (issue.severity === "blocking") {
    return t("novel:chapter.timeline.severityBlocking");
  }
  if (issue.severity === "error") {
    return t("novel:chapter.timeline.severityError");
  }
  if (issue.severity === "warning") {
    return t("novel:chapter.timeline.severityWarning");
  }
  return t("novel:chapter.timeline.severityInfo");
}

function TimelineItemList(props: {
  title: string;
  icon: ReactNode;
  items: Array<{ title: string; summary: string }>;
  emptyText: string;
  tone?: "default" | "warning" | "critical";
}) {
  const { title, icon, items, emptyText, tone = "default" } = props;
  const toneClass =
    tone === "critical"
      ? "border-red-200 bg-red-50/60"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50/60"
        : "border-border/70 bg-background";

  return (
    <div className={cn("rounded-xl border p-3", toneClass)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      {items.length > 0 ? (
        <div className="mt-2 space-y-2">
          {items.slice(0, 4).map((item) => (
            <div key={`${title}-${item.title}`} className="rounded-lg border border-border/60 bg-background/80 p-2">
              <div className="line-clamp-1 text-sm font-medium text-foreground">{item.title}</div>
              <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.summary}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-xs leading-5 text-muted-foreground">{emptyText}</div>
      )}
    </div>
  );
}

function TimelineCheckPanel(props: {
  timelineCheck: TimelineCheckSummary | null;
  isLoading: boolean;
  hasChapter: boolean;
}) {
  const { t } = useTranslation();
  const { timelineCheck, isLoading, hasChapter } = props;
  if (isLoading && !timelineCheck) {
    return (
      <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs leading-6 text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("novel:chapter.timeline.checkLoading")}
        </div>
        <div className="mt-1">{t("novel:chapter.timeline.checkLoadingHint")}</div>
      </div>
    );
  }

  if (!hasChapter) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-3 text-xs leading-6 text-muted-foreground">
        {t("novel:chapter.timeline.noChapterHint")}
      </div>
    );
  }

  if (!timelineCheck) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-3 text-xs leading-6 text-muted-foreground">
        {t("novel:chapter.timeline.noCheckResult")}
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border p-3 text-sm", getTimelineCheckTone(timelineCheck.status))}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">{getTimelineCheckLabel(timelineCheck.status, t)}</div>
        <Badge variant={getTimelineCheckBadgeVariant(timelineCheck.status)}>{t("novel:chapter.timeline.scoreLabel", { score: Math.round(timelineCheck.score * 100) })}</Badge>
      </div>
      {timelineCheck.issues.length > 0 ? (
        <div className="mt-3 space-y-2">
          {timelineCheck.issues.slice(0, 3).map((issue, index) => (
            <div key={`${issue.type}-${index}`} className="rounded-lg border border-white/40 bg-background/85 p-2 text-xs leading-5 text-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[11px]">{formatIssueSeverity(issue, t)}</Badge>
                <span className="font-medium">{issue.message}</span>
              </div>
              {issue.suggestedFix ? <div className="mt-1 line-clamp-2 text-muted-foreground">{issue.suggestedFix}</div> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-xs leading-6 opacity-80">{t("novel:chapter.timeline.noIssues")}</div>
      )}
    </div>
  );
}

export default function TimelinePanel(props: {
  selectedChapter?: Chapter;
  chapterTimeline?: ChapterTimelineViewData | null;
  isLoadingChapterTimeline?: boolean;
  chapterRuntimePackage?: ChapterRuntimePackage | null;
}) {
  const { t } = useTranslation();
  const { selectedChapter, chapterTimeline, isLoadingChapterTimeline = false, chapterRuntimePackage } = props;
  const context = chapterTimeline?.context ?? null;
  const timelineCheck = (chapterTimeline?.latestReport ?? chapterRuntimePackage?.timelineCheck ?? null) as TimelineCheckSummary | null;
  const hasChapter = Boolean(selectedChapter);
  const chapterLabel = selectedChapter
    ? t("novel:chapter.timeline.chapterLabel", { order: selectedChapter.order })
    : t("novel:chapter.timeline.noChapterSelected");
  const timeLabel = formatTimelineTimeLabel(context, t as (key: string, opts?: Record<string, unknown>) => string);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-background p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            <span>{t("novel:chapter.timeline.timeAnchor")}</span>
          </div>
          <div className="mt-2 text-sm font-medium text-foreground">{timeLabel}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">{chapterLabel}</div>
        </div>
        <div className="rounded-xl border border-border/70 bg-background p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ShieldAlert className="h-4 w-4" />
            <span>{t("novel:chapter.timeline.checkResult")}</span>
          </div>
          <div className="mt-2 text-sm font-medium text-foreground">
            {timelineCheck
              ? getTimelineCheckLabel(timelineCheck.status, t)
              : isLoadingChapterTimeline
                ? t("novel:chapter.timeline.loading")
                : t("novel:chapter.timeline.notChecked")}
          </div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            {timelineCheck
              ? t("novel:chapter.timeline.scoreLabel", { score: Math.round(timelineCheck.score * 100) })
              : t("novel:chapter.timeline.checkResultHint")}
          </div>
        </div>
      </div>

      {context ? (
        <>
          <TimelineItemList
            title={t("novel:chapter.timeline.prevHooks")}
            icon={<ArrowRight className="h-4 w-4" />}
            items={context.openHooks.map((hook) => ({ title: hook.title, summary: hook.description }))}
            emptyText={t("novel:chapter.timeline.prevHooksEmpty")}
            tone={context.openHooks.length > 0 ? "warning" : "default"}
          />
          <TimelineItemList
            title={t("novel:chapter.timeline.plannedEvents")}
            icon={<Sparkles className="h-4 w-4" />}
            items={context.plannedEventsThisChapter.map((event) => ({ title: event.title, summary: event.summary }))}
            emptyText={t("novel:chapter.timeline.plannedEventsEmpty")}
          />
          <TimelineItemList
            title={t("novel:chapter.timeline.forbiddenEvents")}
            icon={<AlertTriangle className="h-4 w-4" />}
            items={context.forbiddenEvents.map((item) => ({ title: item.title, summary: item.reason }))}
            emptyText={t("novel:chapter.timeline.forbiddenEventsEmpty")}
            tone={context.forbiddenEvents.length > 0 ? "critical" : "default"}
          />
          <div className="rounded-xl border border-border/70 bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <UsersRound className="h-4 w-4" />
              <span>{t("novel:chapter.timeline.recentEvents")}</span>
            </div>
            {context.previousEvents.length > 0 ? (
              <div className="mt-2 space-y-2">
                {context.previousEvents.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-lg border border-border/60 bg-muted/10 p-2">
                    <div className="line-clamp-1 text-sm font-medium text-foreground">{item.title}</div>
                    <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.summary}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-xs leading-5 text-muted-foreground">{t("novel:chapter.timeline.recentEventsEmpty")}</div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">{t("novel:chapter.timeline.latestCheck")}</div>
            <TimelineCheckPanel timelineCheck={timelineCheck} isLoading={isLoadingChapterTimeline} hasChapter={hasChapter} />
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-3 text-xs leading-6 text-muted-foreground">
          {t("novel:chapter.timeline.noContextHint")}
        </div>
      )}
    </div>
  );
}
