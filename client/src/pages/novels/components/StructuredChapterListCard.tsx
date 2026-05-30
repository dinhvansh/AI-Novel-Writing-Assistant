import { useTranslation } from "react-i18next";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import {
  getChapterExecutionDetailStatus,
  hasChapterExecutionDetail,
} from "../chapterDetailPlanning.shared";
import {
  chapterMatchesBeat,
  getBeatExpectedChapterCount,
} from "./structuredOutlineWorkspace.shared";
import type { StructuredTabViewProps } from "./NovelEditView.types";

type StructuredVolume = StructuredTabViewProps["volumes"][number];
type StructuredChapter = StructuredVolume["chapters"][number];
type StructuredBeatSheet = StructuredTabViewProps["beatSheets"][number];
type StructuredBeat = StructuredBeatSheet["beats"][number];

interface StructuredChapterListCardProps {
  selectedVolume: StructuredVolume;
  selectedBeat: StructuredBeat | null;
  selectedBeatKey: string;
  selectedBeatSheet: StructuredBeatSheet | null;
  selectedVolumeChapters: StructuredChapter[];
  visibleChapters: StructuredChapter[];
  selectedChapter: StructuredChapter | null;
  visibleRefinedChapterCount: number;
  selectedVolumeRequiredChapterCount: number;
  selectedVolumeNeedsChapterExpansion: boolean;
  isGeneratingChapterList: boolean;
  generatingChapterListVolumeId: string;
  generatingChapterListBeatKey: string;
  generatingChapterListMode: StructuredTabViewProps["generatingChapterListMode"];
  locked: boolean;
  onGenerateChapterList: StructuredTabViewProps["onGenerateChapterList"];
  onAddChapter: StructuredTabViewProps["onAddChapter"];
  onRemoveChapter: StructuredTabViewProps["onRemoveChapter"];
  onSelectBeatKey: (beatKey: string) => void;
  onSelectChapter: (chapterId: string) => void;
}

function renderChapterDetailStatusBadge(chapter: StructuredChapter, t: (key: string) => string) {
  const status = getChapterExecutionDetailStatus(chapter);
  if (status === "complete") {
    return <Badge variant="secondary">{t("novel:chapter.listCard.statusRefined")}</Badge>;
  }
  if (status === "partial") {
    return <Badge>{t("novel:chapter.listCard.statusRefining")}</Badge>;
  }
  return <Badge variant="outline">{t("novel:chapter.listCard.statusPendingRefine")}</Badge>;
}

export default function StructuredChapterListCard(props: StructuredChapterListCardProps) {
  const { t } = useTranslation();
  const {
    selectedVolume,
    selectedBeat,
    selectedBeatKey,
    selectedBeatSheet,
    selectedVolumeChapters,
    visibleChapters,
    selectedChapter,
    visibleRefinedChapterCount,
    selectedVolumeRequiredChapterCount,
    selectedVolumeNeedsChapterExpansion,
    isGeneratingChapterList,
    generatingChapterListVolumeId,
    generatingChapterListBeatKey,
    generatingChapterListMode,
    locked,
    onGenerateChapterList,
    onAddChapter,
    onRemoveChapter,
    onSelectBeatKey,
    onSelectChapter,
  } = props;

  const isGeneratingCurrentVolume = isGeneratingChapterList && generatingChapterListVolumeId === selectedVolume.id;
  const matchedChapterIds = new Set<string>();
  const beatGroups = (selectedBeatSheet?.beats ?? []).map((beat) => {
    const chapters = selectedVolumeChapters.filter((chapter) => {
      const matches = chapterMatchesBeat(chapter, beat, selectedVolumeChapters);
      if (matches) {
        matchedChapterIds.add(chapter.id);
      }
      return matches;
    });
    return {
      key: beat.key,
      label: beat.label,
      chapterSpanHint: beat.chapterSpanHint,
      expectedCount: getBeatExpectedChapterCount(beat),
      chapters,
      refinedCount: chapters.filter((chapter) => hasChapterExecutionDetail(chapter)).length,
    };
  });
  const unmatchedChapters = selectedVolumeChapters.filter((chapter) => !matchedChapterIds.has(chapter.id));

  function renderBeatStatusBadge(group: typeof beatGroups[number]) {
    const isGeneratingGroup = isGeneratingCurrentVolume
      && (generatingChapterListMode === "full_volume" || generatingChapterListBeatKey === group.key);
    if (isGeneratingGroup) {
      return <Badge>{t("novel:chapter.listCard.groupStatusGenerating")}</Badge>;
    }
    if (group.chapters.length === 0) {
      return <Badge variant="outline">{selectedVolumeChapters.length === 0 ? t("novel:chapter.listCard.groupStatusPending") : t("novel:chapter.listCard.groupStatusRetry")}</Badge>;
    }
    if (group.expectedCount > 0 && group.chapters.length !== group.expectedCount) {
      return <Badge variant="outline">{t("novel:chapter.listCard.groupStatusRetry")}</Badge>;
    }
    return <Badge variant="secondary">{t("novel:chapter.listCard.groupStatusReady")}</Badge>;
  }

  return (
    <Card className="border-border/70 bg-background/90">
      <CardHeader className="pb-3">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-base leading-none">{t("novel:chapter.listCard.title")}</CardTitle>
              <div className="mt-1 text-sm text-muted-foreground">
                {selectedBeat
                  ? t("novel:chapter.listCard.descriptionFocused", { label: selectedBeat.label })
                  : t("novel:chapter.listCard.descriptionAll")}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <AiButton
                onClick={() => onGenerateChapterList(selectedVolume.id)}
                disabled={isGeneratingChapterList || locked}
              >
                {isGeneratingCurrentVolume && generatingChapterListMode === "full_volume"
                  ? t("novel:chapter.listCard.generating")
                  : t("novel:chapter.listCard.generate")}
              </AiButton>
              <Button size="sm" variant="outline" onClick={() => onAddChapter(selectedVolume.id)}>
                {t("novel:chapter.listCard.addChapter")}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => onSelectBeatKey("all")}
              className={cn(
                "rounded-full border px-3 py-1.5 transition-colors",
                selectedBeatKey === "all" ? "border-primary/50 bg-primary/5 text-foreground" : "border-border/70 hover:border-primary/30",
              )}
            >
              {t("novel:chapter.listCard.filterAll")}
            </button>
            <Badge variant="outline">{t("novel:chapter.listCard.showCount", { visible: visibleChapters.length, total: selectedVolumeChapters.length })}</Badge>
            <Badge variant="outline">{t("novel:chapter.listCard.refinedCount", { refined: visibleRefinedChapterCount, total: Math.max(visibleChapters.length, 1) })}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {selectedVolumeNeedsChapterExpansion ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-800">
            {t("novel:chapter.listCard.expansionHint", {
              current: selectedVolumeChapters.length,
              required: selectedVolumeRequiredChapterCount,
            })}
          </div>
        ) : null}

        {selectedVolumeChapters.length > 0 ? (
          <>
            <div className="structured-chapter-navigation-list space-y-3 xl:max-h-[calc(100vh-12rem)] xl:overflow-y-auto xl:pr-1">
              {beatGroups.map((group) => {
                const active = selectedBeatKey === group.key;
                const expanded = selectedBeatKey === "all" || active;
                return (
                  <div key={group.key} className="rounded-xl border border-border/70 bg-background/80 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <button
                        type="button"
                        onClick={() => onSelectBeatKey(active ? "all" : group.key)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={active ? "default" : "outline"}>{group.label}</Badge>
                            <Badge variant="secondary">{group.chapterSpanHint}</Badge>
                            {renderBeatStatusBadge(group)}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {t("novel:chapter.listCard.groupChapterCount", {
                              current: group.chapters.length,
                              total: Math.max(group.expectedCount, group.chapters.length, 1),
                              refined: group.refinedCount,
                            })}
                          </span>
                        </div>
                      </button>
                      {active && selectedVolumeChapters.length > 0 ? (
                        <AiButton
                          size="sm"
                          variant="outline"
                          onClick={() => onGenerateChapterList(selectedVolume.id, {
                            generationMode: "single_beat",
                            targetBeatKey: group.key,
                          })}
                          disabled={isGeneratingChapterList || locked}
                        >
                          {isGeneratingCurrentVolume && generatingChapterListMode === "single_beat" && generatingChapterListBeatKey === group.key
                            ? t("novel:chapter.listCard.groupRegenerating")
                            : t("novel:chapter.listCard.groupRegenerate")}
                        </AiButton>
                      ) : null}
                    </div>

                    {expanded ? (
                      <div className="mt-3 space-y-2 border-l border-border/70 pl-3">
                        {group.chapters.length > 0 ? group.chapters.map((chapter) => {
                          const isSelected = selectedChapter?.id === chapter.id;
                          return (
                            <button
                              key={chapter.id}
                              type="button"
                              onClick={() => {
                                onSelectBeatKey(group.key);
                                onSelectChapter(chapter.id);
                              }}
                              className={cn(
                                "w-full rounded-xl border p-3 text-left transition-colors",
                                isSelected ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border/70 hover:border-primary/30",
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant={isSelected ? "default" : "outline"}>{t("novel:chapter.listCard.chapterOrder", { order: chapter.chapterOrder })}</Badge>
                                {renderChapterDetailStatusBadge(chapter, t)}
                              </div>
                              <div className="mt-2 text-sm font-medium">{chapter.title || t("novel:chapter.listCard.fallbackChapterTitle", { order: chapter.chapterOrder })}</div>
                            </button>
                          );
                        }) : (
                          <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                            {t("novel:chapter.listCard.groupEmpty")}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {unmatchedChapters.length > 0 ? (
                <div className="rounded-xl border border-dashed p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{t("novel:chapter.listCard.unmatchedTitle")}</Badge>
                      <Badge variant="secondary">{t("novel:chapter.listCard.unmatchedCount", { count: unmatchedChapters.length })}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{t("novel:chapter.listCard.unmatchedHint")}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {unmatchedChapters.map((chapter) => {
                      const isSelected = selectedChapter?.id === chapter.id;
                      const title = chapter.title || t("novel:chapter.listCard.fallbackChapterTitle", { order: chapter.chapterOrder });
                      return (
                        <div
                          key={chapter.id}
                          className={cn(
                            "flex items-start gap-2 rounded-xl border p-3 transition-colors",
                            isSelected ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border/70 hover:border-primary/30",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectChapter(chapter.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant={isSelected ? "default" : "outline"}>{t("novel:chapter.listCard.chapterOrder", { order: chapter.chapterOrder })}</Badge>
                              {renderChapterDetailStatusBadge(chapter, t)}
                            </div>
                            <div className="mt-2 text-sm font-medium">{title}</div>
                          </button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            disabled={locked || selectedVolume.chapters.length <= 1}
                            title={t("novel:chapter.listCard.unmatchedDeleteTitle")}
                            onClick={() => {
                              const confirmed = window.confirm(t("novel:chapter.listCard.unmatchedDeleteConfirm", { title }));
                              if (!confirmed) {
                                return;
                              }
                              onRemoveChapter(selectedVolume.id, chapter.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t("novel:chapter.listCard.unmatchedDeleteSrLabel")}</span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            {visibleChapters.length === 0 && selectedBeat ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                {selectedVolumeNeedsChapterExpansion ? (
                  <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-800">
                    {t("novel:chapter.listCard.noBeatChaptersHint", {
                      hint: selectedBeat.chapterSpanHint,
                      current: selectedVolumeChapters.length,
                      required: selectedVolumeRequiredChapterCount,
                    })}
                  </div>
                ) : null}
                {t("novel:chapter.listCard.noBeatGenericHint")}
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {selectedVolumeRequiredChapterCount > 0 ? (
              <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-800">
                {t("novel:chapter.listCard.needsExpansionHint", { required: selectedVolumeRequiredChapterCount })}
              </div>
            ) : null}
            {t("novel:chapter.listCard.noChaptersHint")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
