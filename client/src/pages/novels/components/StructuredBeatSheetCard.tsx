import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StructuredTabViewProps } from "./NovelEditView.types";

type StructuredVolume = StructuredTabViewProps["volumes"][number];
type StructuredChapter = StructuredVolume["chapters"][number];
type StructuredBeatSheet = StructuredTabViewProps["beatSheets"][number];
type StructuredBeat = StructuredBeatSheet["beats"][number];

interface StructuredBeatSheetCardProps {
  selectedVolume: StructuredVolume;
  selectedVolumeChapters: StructuredChapter[];
  selectedBeatSheet: StructuredBeatSheet | null;
  selectedBeat: StructuredBeat | null;
  visibleChapters: StructuredChapter[];
  refinedChapterCount: number;
  visibleRefinedChapterCount: number;
  readiness: StructuredTabViewProps["readiness"];
  isGeneratingBeatSheet: boolean;
  onGenerateBeatSheet: StructuredTabViewProps["onGenerateBeatSheet"];
  chapterListPanel?: ReactNode;
  chapterDetailPanel?: ReactNode;
}

function renderMetric(label: string, value: string) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/80 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}

export default function StructuredBeatSheetCard(props: StructuredBeatSheetCardProps) {
  const { t } = useTranslation("novel");
  const {
    selectedVolume,
    selectedVolumeChapters,
    selectedBeatSheet,
    selectedBeat,
    visibleChapters,
    refinedChapterCount,
    visibleRefinedChapterCount,
    readiness,
    isGeneratingBeatSheet,
    onGenerateBeatSheet,
    chapterListPanel,
    chapterDetailPanel,
  } = props;

  const hasExistingBeatSheet = Boolean(selectedBeatSheet);
  const volumeTitle = selectedVolume.title?.trim() || t("structured.beatSheet.fallbackVolumeTitle", { order: selectedVolume.sortOrder });
  const volumeSummary = selectedVolume.mainPromise?.trim()
    || selectedVolume.summary?.trim()
    || t("structured.beatSheet.fallbackPromise");
  const generateButtonLabel = isGeneratingBeatSheet
    ? (hasExistingBeatSheet ? t("structured.beatSheet.regenerating") : t("structured.beatSheet.generating"))
    : (hasExistingBeatSheet ? t("structured.beatSheet.regenerate") : t("structured.beatSheet.generate"));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-base">{t("structured.beatSheet.title")}</CardTitle>
            <div className="text-sm text-muted-foreground">{t("structured.beatSheet.description")}</div>
          </div>
          <AiButton
            variant="outline"
            onClick={() => onGenerateBeatSheet(selectedVolume.id)}
            disabled={isGeneratingBeatSheet || !readiness.canGenerateBeatSheet}
          >
            {generateButtonLabel}
          </AiButton>
        </div>
      </CardHeader>
      <CardContent>
        {selectedBeatSheet ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] xl:items-start">
            {chapterListPanel ? <div className="min-w-0">{chapterListPanel}</div> : <div />}

            <div className="min-w-0 space-y-4">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 lg:p-5">
                {selectedBeat ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{t("structured.beatSheet.focusHeading")}</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{selectedBeat.label}</Badge>
                        <Badge variant="secondary">{selectedBeat.chapterSpanHint}</Badge>
                        <Badge variant="outline">{t("structured.beatSheet.chapterCountBadge", { count: visibleChapters.length })}</Badge>
                        <Badge variant="outline">{t("structured.beatSheet.refinedBadge", { refined: visibleRefinedChapterCount, total: Math.max(visibleChapters.length, 1) })}</Badge>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background/90 p-4">
                      <div className="text-sm font-medium text-foreground">{t("structured.beatSheet.beatPurpose")}</div>
                      <div className="mt-2 text-sm leading-7 text-foreground">{selectedBeat.summary}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">{t("structured.beatSheet.deliverables")}</div>
                      {selectedBeat.mustDeliver.length > 0 ? (
                        <ol className="space-y-2 rounded-xl border border-border/70 bg-background/90 p-4">
                          {selectedBeat.mustDeliver.map((item, index) => (
                            <li
                              key={`${selectedBeat.key}-deliverable-${index}`}
                              className="flex items-start gap-3 text-sm text-foreground"
                            >
                              <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary">
                                {index + 1}
                              </span>
                              <span className="leading-6">{item}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                          {t("structured.beatSheet.deliverablesEmpty")}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{t("structured.beatSheet.overviewHeading")}</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{volumeTitle}</Badge>
                        <Badge variant="outline">{t("structured.beatSheet.chapterCountBadge", { count: selectedVolumeChapters.length })}</Badge>
                        <Badge variant="outline">{t("structured.beatSheet.beatCountBadge", { count: selectedBeatSheet.beats.length })}</Badge>
                        <Badge variant="outline">{t("structured.beatSheet.refinedBadge", { refined: refinedChapterCount, total: Math.max(selectedVolumeChapters.length, 1) })}</Badge>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background/90 p-4">
                      <div className="text-sm font-medium text-foreground">{t("structured.beatSheet.promiseHeading")}</div>
                      <div className="mt-2 text-sm leading-7 text-foreground">{volumeSummary}</div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {renderMetric(t("structured.beatSheet.metricChapterCount"), t("structured.beatSheet.metricChapterCountValue", { count: selectedVolumeChapters.length }))}
                      {renderMetric(t("structured.beatSheet.metricBeatCount"), t("structured.beatSheet.metricBeatCountValue", { count: selectedBeatSheet.beats.length }))}
                      {renderMetric(t("structured.beatSheet.metricRefined"), t("structured.beatSheet.metricRefinedValue", { count: refinedChapterCount }))}
                    </div>
                  </div>
                )}
              </div>

              {chapterDetailPanel}
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {t("structured.beatSheet.noSheetHint")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
