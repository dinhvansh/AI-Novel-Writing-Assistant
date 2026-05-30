import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VolumePlan } from "@ai-novel/shared/types/novel";

interface VolumePayoffOverviewCardProps {
  selectedVolume: VolumePlan;
}

function normalizePayoffText(value: string): string {
  return value.trim().toLowerCase().replace(/[\s，。、《》“”"'‘’()（）\-—]/g, "");
}

function isLikelySamePayoff(left: string, right: string): boolean {
  const normalizedLeft = normalizePayoffText(left);
  const normalizedRight = normalizePayoffText(right);
  if (!normalizedLeft || !normalizedRight) {
    return false;
  }
  return (
    normalizedLeft === normalizedRight
    || normalizedLeft.includes(normalizedRight)
    || normalizedRight.includes(normalizedLeft)
  );
}

export default function VolumePayoffOverviewCard(props: VolumePayoffOverviewCardProps) {
  const { t } = useTranslation();
  const { selectedVolume } = props;
  const chapterPayoffGroups = selectedVolume.chapters
    .map((chapter) => ({
      chapterId: chapter.id,
      chapterOrder: chapter.chapterOrder,
      chapterTitle: chapter.title?.trim() || t("novel:outline.volumePayoff.fallbackChapterTitle"),
      refs: chapter.payoffRefs.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((chapter) => chapter.refs.length > 0);

  const chapterPayoffEntries = chapterPayoffGroups.flatMap((chapter) =>
    chapter.refs.map((ref) => ({
      ref,
      chapterOrder: chapter.chapterOrder,
      chapterTitle: chapter.chapterTitle,
    })),
  );

  const openPayoffRows = selectedVolume.openPayoffs
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({
      item,
      linkedChapters: chapterPayoffEntries.filter((entry) => isLikelySamePayoff(item, entry.ref)),
    }));

  const linkedOpenPayoffCount = openPayoffRows.filter((item) => item.linkedChapters.length > 0).length;
  const unplannedOpenPayoffs = openPayoffRows.filter((item) => item.linkedChapters.length === 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-base">{t("novel:outline.volumePayoff.title")}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {t("novel:outline.volumePayoff.description")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{t("novel:outline.volumePayoff.volumeOrder", { order: selectedVolume.sortOrder })}</Badge>
            <Badge variant="outline">{t("novel:outline.volumePayoff.openPayoffCount", { count: openPayoffRows.length })}</Badge>
            <Badge variant="outline">{t("novel:outline.volumePayoff.linkedCount", { count: linkedOpenPayoffCount })}</Badge>
            <Badge variant={unplannedOpenPayoffs.length > 0 ? "secondary" : "outline"}>
              {t("novel:outline.volumePayoff.unplannedCount", { count: unplannedOpenPayoffs.length })}
            </Badge>
            <Badge variant="outline">{t("novel:outline.volumePayoff.chapterArrangementCount", { count: chapterPayoffGroups.length })}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.35fr)]">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-foreground">{t("novel:outline.volumePayoff.openPayoffsTitle")}</div>
              <Badge variant="outline">{openPayoffRows.length}</Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {t("novel:outline.volumePayoff.openPayoffsDescription")}
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {openPayoffRows.length > 0 ? (
                openPayoffRows.map((item) => (
                  <div
                    key={item.item}
                    className="rounded-lg border border-border/70 bg-background p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-foreground">{item.item}</div>
                      <Badge variant={item.linkedChapters.length > 0 ? "default" : "secondary"}>
                        {item.linkedChapters.length > 0 ? t("novel:outline.volumePayoff.statusLinked") : t("novel:outline.volumePayoff.statusUnlinked")}
                      </Badge>
                    </div>
                    {item.linkedChapters.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {item.linkedChapters.map((entry) => (
                          <span
                            key={`${item.item}-${entry.chapterOrder}-${entry.ref}`}
                            className="rounded-full border border-border/70 px-2 py-1"
                          >
                            {t("novel:outline.volumePayoff.chapterLabel", { order: entry.chapterOrder, title: entry.chapterTitle })}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {t("novel:outline.volumePayoff.unlinkedHint")}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border/70 bg-background p-3 text-xs text-muted-foreground">
                  {t("novel:outline.volumePayoff.emptyOpenPayoffs")}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-foreground">{t("novel:outline.volumePayoff.chapterArrangementTitle")}</div>
              <Badge variant="outline">{chapterPayoffGroups.length}</Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {t("novel:outline.volumePayoff.chapterArrangementDescription")}
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {chapterPayoffGroups.length > 0 ? (
                chapterPayoffGroups.map((chapter) => (
                  <div
                    key={chapter.chapterId}
                    className="rounded-lg border border-border/70 bg-background p-3"
                  >
                    <div className="font-medium text-foreground">
                      {t("novel:outline.volumePayoff.chapterLabel", { order: chapter.chapterOrder, title: chapter.chapterTitle })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {chapter.refs.map((ref) => (
                        <span
                          key={`${chapter.chapterId}-${ref}`}
                          className="rounded-full border border-border/70 px-2 py-1"
                        >
                          {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border/70 bg-background p-3 text-xs text-muted-foreground">
                  {t("novel:outline.volumePayoff.emptyChapterArrangement")}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
