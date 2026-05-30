import type { Chapter } from "@ai-novel/shared/types/novel";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  chapterStatusDescription,
  chapterStatusLabel,
  chapterSuggestedActionLabel,
  parseRiskFlags,
  resolveChapterQueuePreview,
  resolveDisplayedChapterStatus,
  type QueueFilterKey,
  type QueueFilterOption,
} from "./chapterExecution.shared";

interface ChapterExecutionQueueCardProps {
  chapters: Chapter[];
  selectedChapterId: string;
  queueFilter: QueueFilterKey;
  queueFilters: QueueFilterOption[];
  streamingChapterId?: string | null;
  streamingPhase?: "streaming" | "finalizing" | "completed" | null;
  repairStreamingChapterId?: string | null;
  onQueueFilterChange: (filter: QueueFilterKey) => void;
  onSelectChapter: (chapterId: string) => void;
}

export default function ChapterExecutionQueueCard(props: ChapterExecutionQueueCardProps) {
  const { t } = useTranslation("novel");
  const {
    chapters,
    selectedChapterId,
    queueFilter,
    queueFilters,
    streamingChapterId,
    streamingPhase,
    repairStreamingChapterId,
    onQueueFilterChange,
    onSelectChapter,
  } = props;

  return (
    <Card className="h-full overflow-hidden border-border/70 lg:sticky lg:top-4">
      <CardHeader className="gap-3 border-b bg-gradient-to-b from-muted/30 to-background pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base">{t("novel:chapterQueue.title")}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("novel:chapterQueue.description")}
          </p>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("novel:chapterQueue.visibleCount", { count: chapters.length })}</span>
          <span>{t("novel:chapterQueue.filterLabel")}{queueFilters.find((item) => item.key === queueFilter)?.label ?? t("novel:chapterQueue.filterAll")}</span>
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex min-w-max gap-2">
            {queueFilters.map((filter) => (
              <Button
                key={filter.key}
                size="sm"
                variant={queueFilter === filter.key ? "default" : "outline"}
                className="h-8 shrink-0 rounded-full px-3 text-xs"
                onClick={() => onQueueFilterChange(filter.key)}
              >
                {filter.label} {filter.count}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex h-full min-h-0 flex-col pt-4">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {chapters.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-xs leading-6 text-muted-foreground">
              {t("novel:chapterQueue.emptyHint")}
            </div>
          ) : (
            chapters.map((chapter) => {
              const chapterRisks = parseRiskFlags(chapter.riskFlags, t);
              const isSelected = selectedChapterId === chapter.id;
              const isStreamingTarget = streamingChapterId === chapter.id;
              const isRepairTarget = repairStreamingChapterId === chapter.id;
              const displayedStatus = resolveDisplayedChapterStatus(chapter);

              return (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => onSelectChapter(chapter.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/70 bg-background hover:border-primary/30 hover:bg-muted/35"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="text-sm font-semibold leading-6 text-foreground">
                        {t("novel:chapterQueue.chapterLabel", { order: chapter.order, title: chapter.title || t("novel:chapterQueue.unnamedChapter") })}
                      </div>
                      <div className="line-clamp-2 text-xs leading-6 text-muted-foreground">
                        {resolveChapterQueuePreview(chapter, t)}
                      </div>
                    </div>
                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      className="min-w-[60px] shrink-0 justify-center rounded-full px-2 py-1 text-[11px]"
                      title={chapterStatusDescription(displayedStatus, t)}
                      aria-label={chapterStatusDescription(displayedStatus, t)}
                    >
                      {chapterStatusLabel(displayedStatus, t)}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {isStreamingTarget ? (
                      <Badge className="rounded-full px-2 py-1 text-[11px]">
                        {streamingPhase === "finalizing" ? t("novel:chapterQueue.streamingFinalizing") : t("novel:chapterQueue.streamingWriting")}
                      </Badge>
                    ) : null}
                    {isRepairTarget ? (
                      <Badge variant="secondary" className="rounded-full px-2 py-1 text-[11px]">
                        {t("novel:chapterQueue.repairing")}
                      </Badge>
                    ) : null}
                    {chapterRisks.slice(0, 2).map((risk) => (
                      <Badge key={`${chapter.id}-${risk}`} variant="secondary" className="rounded-full px-2 py-1 text-[11px]">
                        {risk}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted/25 p-3 text-[11px] text-muted-foreground">
                    <div>
                      <div>{t("novel:chapterQueue.nextStep")}</div>
                      <div className="mt-1 font-medium text-foreground">{chapterSuggestedActionLabel(chapter, t)}</div>
                    </div>
                    <div>
                      <div>{t("novel:chapterQueue.wordCount")}</div>
                      <div className="mt-1 font-medium text-foreground">{chapter.content?.length ?? 0}</div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
