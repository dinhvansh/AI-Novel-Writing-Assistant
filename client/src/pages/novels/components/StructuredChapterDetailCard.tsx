import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getChapterExecutionDetailStatus,
  type ChapterDetailBatchSelection,
} from "../chapterDetailPlanning.shared";
import type { StructuredTabViewProps } from "./NovelEditView.types";

const textareaClassName =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type StructuredVolume = StructuredTabViewProps["volumes"][number];
type StructuredChapter = StructuredVolume["chapters"][number];
type BatchMode = "count" | "visible_all" | "volume_all";

interface BatchPlan {
  count: number;
  hint: string;
  request: ChapterDetailBatchSelection;
}

function renderChapterDetailStatusBadge(
  status: ReturnType<typeof getChapterExecutionDetailStatus>,
  t: (key: string) => string,
) {
  if (status === "complete") {
    return <Badge variant="secondary">{t("structured.chapterDetail.statusComplete")}</Badge>;
  }
  if (status === "partial") {
    return <Badge>{t("structured.chapterDetail.statusPartial")}</Badge>;
  }
  return <Badge variant="outline">{t("structured.chapterDetail.statusEmpty")}</Badge>;
}

interface StructuredChapterDetailCardProps {
  selectedVolume: StructuredVolume | undefined;
  selectedChapter: StructuredChapter | null;
  visibleChapters: StructuredChapter[];
  selectedChapterBeatLabel?: string | null;
  selectedChapterIndex: number;
  showChapterAdvanced: boolean;
  onToggleAdvanced: () => void;
  isGeneratingChapterDetail: boolean;
  isGeneratingChapterDetailBundle: boolean;
  generatingChapterDetailMode: "purpose" | "boundary" | "task_sheet" | "";
  generatingChapterDetailChapterId: string;
  onGenerateChapterDetail: StructuredTabViewProps["onGenerateChapterDetail"];
  onGenerateChapterDetailBundle: StructuredTabViewProps["onGenerateChapterDetailBundle"];
  onChapterFieldChange: StructuredTabViewProps["onChapterFieldChange"];
  onChapterNumberChange: StructuredTabViewProps["onChapterNumberChange"];
  onChapterPayoffRefsChange: StructuredTabViewProps["onChapterPayoffRefsChange"];
  onMoveChapter: StructuredTabViewProps["onMoveChapter"];
  onRemoveChapter: StructuredTabViewProps["onRemoveChapter"];
  locked: boolean;
}

export default function StructuredChapterDetailCard(props: StructuredChapterDetailCardProps) {
  const { t } = useTranslation("novel");
  const {
    selectedVolume,
    selectedChapter,
    visibleChapters,
    selectedChapterBeatLabel,
    selectedChapterIndex,
    showChapterAdvanced,
    onToggleAdvanced,
    isGeneratingChapterDetail,
    isGeneratingChapterDetailBundle,
    generatingChapterDetailMode,
    generatingChapterDetailChapterId,
    onGenerateChapterDetail,
    onGenerateChapterDetailBundle,
    onChapterFieldChange,
    onChapterNumberChange,
    onChapterPayoffRefsChange,
    onMoveChapter,
    onRemoveChapter,
    locked,
  } = props;

  const [batchMode, setBatchMode] = useState<BatchMode>("count");
  const [batchCount, setBatchCount] = useState(3);

  const volumeChapters = selectedVolume?.chapters ?? [];
  const remainingChapters = selectedChapterIndex >= 0 ? volumeChapters.slice(selectedChapterIndex) : [];
  const hasVisibleBatch = visibleChapters.length > 1 && visibleChapters.length < volumeChapters.length;
  const hasVolumeBatch = volumeChapters.length > 1;
  const hasCountBatch = remainingChapters.length > 1;
  const chapterDetailStatus = selectedChapter ? getChapterExecutionDetailStatus(selectedChapter) : "empty";

  useEffect(() => {
    if (hasCountBatch) {
      setBatchCount((current) => Math.min(Math.max(current, 2), remainingChapters.length));
      return;
    }
    setBatchCount(1);
  }, [hasCountBatch, remainingChapters.length]);

  useEffect(() => {
    if (batchMode === "count" && !hasCountBatch) {
      if (hasVisibleBatch) {
        setBatchMode("visible_all");
        return;
      }
      if (hasVolumeBatch) {
        setBatchMode("volume_all");
      }
      return;
    }
    if (batchMode === "visible_all" && !hasVisibleBatch) {
      setBatchMode(hasCountBatch ? "count" : "volume_all");
      return;
    }
    if (batchMode === "volume_all" && !hasVolumeBatch) {
      setBatchMode("count");
    }
  }, [batchMode, hasCountBatch, hasVisibleBatch, hasVolumeBatch]);

  const batchPlan = useMemo<BatchPlan | null>(() => {
    if (!selectedVolume || !selectedChapter) {
      return null;
    }
    if (batchMode === "visible_all" && hasVisibleBatch) {
      return {
        count: visibleChapters.length,
        hint: t("structured.chapterDetail.batchHintVisible", { count: visibleChapters.length }),
        request: {
          chapterIds: visibleChapters.map((chapter) => chapter.id),
          label: t("structured.chapterDetail.batchLabelVisible", { count: visibleChapters.length }),
        },
      };
    }
    if (batchMode === "volume_all" && hasVolumeBatch) {
      return {
        count: volumeChapters.length,
        hint: t("structured.chapterDetail.batchHintVolume", { count: volumeChapters.length }),
        request: {
          chapterIds: volumeChapters.map((chapter) => chapter.id),
          label: t("structured.chapterDetail.batchLabelVolume", { count: volumeChapters.length }),
        },
      };
    }
    if (!hasCountBatch) {
      return null;
    }
    const count = Math.min(Math.max(batchCount, 2), remainingChapters.length);
    return {
      count,
      hint: t("structured.chapterDetail.batchHintCount", { order: selectedChapter.chapterOrder, count }),
      request: {
        chapterIds: remainingChapters.slice(0, count).map((chapter) => chapter.id),
        label: t("structured.chapterDetail.batchLabelCount", { order: selectedChapter.chapterOrder, count }),
      },
    };
  }, [
    batchCount,
    batchMode,
    hasCountBatch,
    hasVisibleBatch,
    hasVolumeBatch,
    remainingChapters,
    selectedChapter,
    selectedVolume,
    visibleChapters,
    volumeChapters,
    t,
  ]);

  const currentBundleRunning = Boolean(
    selectedChapter
    && isGeneratingChapterDetailBundle
    && generatingChapterDetailChapterId === selectedChapter.id,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base leading-none">{t("structured.chapterDetail.title")}</CardTitle>
              {selectedChapter ? (
                <>
                  <Badge variant="outline">{t("structured.chapterDetail.chapterOrder", { order: selectedChapter.chapterOrder })}</Badge>
                  {selectedChapterBeatLabel ? <Badge variant="secondary">{selectedChapterBeatLabel}</Badge> : null}
                  {renderChapterDetailStatusBadge(chapterDetailStatus, t)}
                </>
              ) : null}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedChapter
                ? t("structured.chapterDetail.withChapterDescription")
                : t("structured.chapterDetail.withoutChapterDescription")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedVolume && selectedChapter ? (
              <AiButton
                size="sm"
                onClick={() => onGenerateChapterDetailBundle(selectedVolume.id, selectedChapter.id)}
                disabled={isGeneratingChapterDetail || locked}
              >
                {currentBundleRunning ? t("structured.chapterDetail.currentBundleRunning") : t("structured.chapterDetail.refineCurrent")}
              </AiButton>
            ) : null}
            <Button size="sm" variant="outline" onClick={onToggleAdvanced}>
              {showChapterAdvanced ? t("structured.chapterDetail.collapseAdvanced") : t("structured.chapterDetail.expandAdvanced")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedVolume && selectedChapter ? (
          <>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{t("structured.chapterDetail.batchTitle")}</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    {t("structured.chapterDetail.batchDescription")}
                  </div>
                </div>
                <AiButton
                  size="sm"
                  variant="secondary"
                  onClick={() => onGenerateChapterDetailBundle(selectedVolume.id, batchPlan?.request ?? { chapterIds: [] })}
                  disabled={isGeneratingChapterDetail || locked || !batchPlan}
                >
                  {isGeneratingChapterDetailBundle ? t("structured.chapterDetail.batchRunning") : t("structured.chapterDetail.batchButton", { count: batchPlan?.count ?? 0 })}
                </AiButton>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
                <label className="space-y-2 text-sm">
                  <span className="text-xs text-muted-foreground">{t("structured.chapterDetail.batchRangeLabel")}</span>
                  <select
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground"
                    value={batchMode}
                    onChange={(event) => setBatchMode(event.target.value as BatchMode)}
                  >
                    <option value="count" disabled={!hasCountBatch}>{t("structured.chapterDetail.batchModeCount")}</option>
                    {hasVisibleBatch ? <option value="visible_all">{t("structured.chapterDetail.batchModeVisible")}</option> : null}
                    {hasVolumeBatch ? <option value="volume_all">{t("structured.chapterDetail.batchModeVolume")}</option> : null}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-xs text-muted-foreground">{batchMode === "count" ? t("structured.chapterDetail.batchCountLabel") : t("structured.chapterDetail.batchCurrentRangeLabel")}</span>
                  {batchMode === "count" ? (
                    <Input
                      type="number"
                      min={hasCountBatch ? 2 : 1}
                      max={Math.max(remainingChapters.length, 1)}
                      value={batchCount}
                      onChange={(event) => setBatchCount(Number(event.target.value || 0))}
                      disabled={!hasCountBatch}
                    />
                  ) : (
                    <div className="rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground">
                      {batchPlan ? t("structured.chapterDetail.batchChapterCount", { count: batchPlan.count }) : t("structured.chapterDetail.batchNotAvailable")}
                    </div>
                  )}
                </label>
              </div>

              <div className="mt-2 text-xs leading-6 text-muted-foreground">
                {locked
                  ? t("structured.chapterDetail.batchLockedHint")
                  : batchPlan?.hint ?? t("structured.chapterDetail.batchSingleChapterHint")}
              </div>
            </div>

            <label className="space-y-2 text-sm">
              <span className="text-xs text-muted-foreground">{t("structured.chapterDetail.fields.title")}</span>
              <Input
                value={selectedChapter.title}
                onChange={(event) => onChapterFieldChange(selectedVolume.id, selectedChapter.id, "title", event.target.value)}
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-xs text-muted-foreground">{t("structured.chapterDetail.fields.summary")}</span>
              <textarea
                className={cn(textareaClassName, "min-h-[130px]")}
                value={selectedChapter.summary}
                onChange={(event) => onChapterFieldChange(selectedVolume.id, selectedChapter.id, "summary", event.target.value)}
              />
            </label>

            <label className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{t("structured.chapterDetail.fields.purpose")}</span>
                <AiButton
                  size="sm"
                  variant="outline"
                  onClick={() => onGenerateChapterDetail(selectedVolume.id, selectedChapter.id, "purpose")}
                  disabled={isGeneratingChapterDetail || locked}
                >
                  {isGeneratingChapterDetail && generatingChapterDetailMode === "purpose" && generatingChapterDetailChapterId === selectedChapter.id ? t("structured.chapterDetail.aiFixing") : t("structured.chapterDetail.aiFix")}
                </AiButton>
              </div>
              <textarea
                className={cn(textareaClassName, "min-h-[110px]")}
                value={selectedChapter.purpose ?? ""}
                onChange={(event) => onChapterFieldChange(selectedVolume.id, selectedChapter.id, "purpose", event.target.value)}
              />
            </label>

            <label className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{t("structured.chapterDetail.fields.taskSheet")}</span>
                <AiButton
                  size="sm"
                  variant="outline"
                  onClick={() => onGenerateChapterDetail(selectedVolume.id, selectedChapter.id, "task_sheet")}
                  disabled={isGeneratingChapterDetail || locked}
                >
                  {isGeneratingChapterDetail && generatingChapterDetailMode === "task_sheet" && generatingChapterDetailChapterId === selectedChapter.id ? t("structured.chapterDetail.aiFixing") : t("structured.chapterDetail.aiFix")}
                </AiButton>
              </div>
              <textarea
                className={cn(textareaClassName, "min-h-[130px]")}
                value={selectedChapter.taskSheet ?? ""}
                onChange={(event) => onChapterFieldChange(selectedVolume.id, selectedChapter.id, "taskSheet", event.target.value)}
              />
            </label>

            {showChapterAdvanced ? (
              <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="text-sm font-medium">{t("structured.chapterDetail.advancedTitle")}</div>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="space-y-2 text-sm">
                    <span className="text-xs text-muted-foreground">{t("structured.chapterDetail.fields.conflictLevel")}</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedChapter.conflictLevel ?? ""}
                      onChange={(event) => onChapterNumberChange(selectedVolume.id, selectedChapter.id, "conflictLevel", event.target.value ? Number(event.target.value) : null)}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-xs text-muted-foreground">{t("structured.chapterDetail.fields.revealLevel")}</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedChapter.revealLevel ?? ""}
                      onChange={(event) => onChapterNumberChange(selectedVolume.id, selectedChapter.id, "revealLevel", event.target.value ? Number(event.target.value) : null)}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-xs text-muted-foreground">{t("structured.chapterDetail.fields.targetWordCount")}</span>
                    <Input
                      type="number"
                      min={200}
                      step={100}
                      value={selectedChapter.targetWordCount ?? ""}
                      onChange={(event) => onChapterNumberChange(selectedVolume.id, selectedChapter.id, "targetWordCount", event.target.value ? Number(event.target.value) : null)}
                    />
                  </label>
                </div>

                <label className="space-y-2 text-sm">
                  <span className="text-xs text-muted-foreground">{t("structured.chapterDetail.fields.mustAvoid")}</span>
                  <textarea
                    className={cn(textareaClassName, "min-h-[100px]")}
                    value={selectedChapter.mustAvoid ?? ""}
                    onChange={(event) => onChapterFieldChange(selectedVolume.id, selectedChapter.id, "mustAvoid", event.target.value)}
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-xs text-muted-foreground">{t("structured.chapterDetail.fields.payoffRefs")}</span>
                  <textarea
                    className={cn(textareaClassName, "min-h-[100px]")}
                    value={selectedChapter.payoffRefs.join("\n")}
                    onChange={(event) => onChapterPayoffRefsChange(selectedVolume.id, selectedChapter.id, event.target.value)}
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => onMoveChapter(selectedVolume.id, selectedChapter.id, -1)} disabled={selectedChapterIndex <= 0}>
                    {t("structured.chapterDetail.moveUp")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onMoveChapter(selectedVolume.id, selectedChapter.id, 1)} disabled={selectedChapterIndex < 0 || selectedChapterIndex >= selectedVolume.chapters.length - 1}>
                    {t("structured.chapterDetail.moveDown")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onRemoveChapter(selectedVolume.id, selectedChapter.id)} disabled={selectedVolume.chapters.length <= 1}>
                    {t("structured.chapterDetail.delete")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                {t("structured.chapterDetail.advancedCollapsedHint")}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            {t("structured.chapterDetail.noSelectionHint")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
