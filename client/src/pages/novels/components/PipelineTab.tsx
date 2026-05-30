import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Chapter, NovelBible, PipelineJob, PlotBeat, QualityScore, ReviewIssue } from "@ai-novel/shared/types/novel";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import LLMSelector from "@/components/common/LLMSelector";
import StreamOutput from "@/components/common/StreamOutput";
import CollapsibleSummary from "./CollapsibleSummary";
import WorldInjectionHint from "./WorldInjectionHint";
import { getLowScoreChapterRange, getPipelineStageItems, getPipelineStageState } from "./pipelineTab.utils";
import DirectorTakeoverEntryPanel from "./DirectorTakeoverEntryPanel";

interface PipelineTabProps {
  novelId: string;
  worldInjectionSummary: string | null;
  hasCharacters: boolean;
  directorTakeoverEntry?: ReactNode;
  onGoToCharacterTab: () => void;
  pipelineForm: {
    startOrder: number;
    endOrder: number;
    maxRetries: number;
    runMode: "fast" | "polish";
    autoReview: boolean;
    autoRepair: boolean;
    skipCompleted: boolean;
    qualityThreshold: number;
    repairMode: "detect_only" | "light_repair" | "heavy_repair" | "continuity_only" | "character_only" | "ending_only";
  };
  onPipelineFormChange: (
    field: "startOrder" | "endOrder" | "maxRetries" | "runMode" | "autoReview" | "autoRepair" | "skipCompleted" | "qualityThreshold" | "repairMode",
    value: number | boolean | string,
  ) => void;
  maxOrder: number;
  onGenerateBible: () => void;
  onAbortBible: () => void;
  isBibleStreaming: boolean;
  bibleStreamContent: string;
  onGenerateBeats: () => void;
  onAbortBeats: () => void;
  isBeatsStreaming: boolean;
  beatsStreamContent: string;
  onRunPipeline: (patch?: Partial<PipelineTabProps["pipelineForm"]>) => void;
  isRunningPipeline: boolean;
  pipelineMessage: string;
  pipelineJob?: PipelineJob;
  chapters: Chapter[];
  selectedChapterId: string;
  onSelectedChapterChange: (chapterId: string) => void;
  onReviewChapter: () => void;
  isReviewing: boolean;
  onRepairChapter: () => void;
  isRepairing: boolean;
  onGenerateHook: () => void;
  isGeneratingHook: boolean;
  reviewResult: {
    score: QualityScore;
    issues: ReviewIssue[];
  } | null;
  repairBeforeContent: string;
  repairAfterContent: string;
  repairStreamContent: string;
  isRepairStreaming: boolean;
  onAbortRepair: () => void;
  qualitySummary?: QualityScore;
  chapterReports: Array<{
    chapterId?: string | null;
    coherence: number;
    repetition: number;
    pacing: number;
    voice: number;
    engagement: number;
    overall: number;
    issues?: string | null;
  }>;
  bible?: NovelBible | null;
  plotBeats: PlotBeat[];
}

export default function PipelineTab(props: PipelineTabProps) {
  const { t } = useTranslation("novel");
  const {
    worldInjectionSummary,
    hasCharacters,
    onGoToCharacterTab,
    pipelineForm,
    onPipelineFormChange,
    maxOrder,
    onGenerateBible,
    onAbortBible,
    isBibleStreaming,
    bibleStreamContent,
    onGenerateBeats,
    onAbortBeats,
    isBeatsStreaming,
    beatsStreamContent,
    onRunPipeline,
    isRunningPipeline,
    pipelineMessage,
    pipelineJob,
    chapters,
    selectedChapterId,
    onSelectedChapterChange,
    onReviewChapter,
    isReviewing,
    onRepairChapter,
    isRepairing,
    onGenerateHook,
    isGeneratingHook,
    reviewResult,
    repairBeforeContent,
    repairAfterContent,
    repairStreamContent,
    isRepairStreaming,
    onAbortRepair,
    qualitySummary,
    chapterReports,
    bible,
    plotBeats,
    directorTakeoverEntry,
  } = props;

  const lowScoreRange = getLowScoreChapterRange(chapters, chapterReports, pipelineForm.qualityThreshold);
  const pipelineStageItems = getPipelineStageItems(t);
  const lowScoreReports = chapterReports
    .filter((item) => item.chapterId && item.overall < pipelineForm.qualityThreshold)
    .slice(0, 12);
  const pendingRepairCount = chapterReports.filter((item) => item.chapterId && item.overall < pipelineForm.qualityThreshold).length;

  const exportPipelineReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      pipelineForm,
      pipelineJob,
      qualitySummary,
      chapterReports,
      lowScoreThreshold: pipelineForm.qualityThreshold,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pipeline-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <DirectorTakeoverEntryPanel
        title={t("pipeline.takeoverTitle")}
        description={t("pipeline.takeoverDescription")}
        entry={directorTakeoverEntry}
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("pipeline.batchTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <WorldInjectionHint worldInjectionSummary={worldInjectionSummary} />
          {!hasCharacters ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              <span>{t("pipeline.noCharactersWarning")}</span>
              <Button size="sm" variant="outline" onClick={onGoToCharacterTab}>{t("pipeline.goToCharacters")}</Button>
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground">{t("pipeline.currentFocus")}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {pendingRepairCount > 0 ? t("pipeline.pendingRepairCount", { count: pendingRepairCount }) : t("pipeline.noLowScoreChapters")}
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground">{t("pipeline.qualityThreshold")}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{pipelineForm.qualityThreshold}</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground">{t("pipeline.currentRunMode")}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{pipelineForm.runMode === "polish" ? t("pipeline.runModePolish") : t("pipeline.runModeFast")}</div>
            </div>
          </div>
          {pipelineMessage ? <div className="text-sm text-muted-foreground">{pipelineMessage}</div> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("pipeline.repairCenterTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={selectedChapterId}
            onChange={(event) => onSelectedChapterChange(event.target.value)}
          >
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>{t("pipeline.chapterOption", { order: chapter.order, title: chapter.title })}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <AiButton onClick={onReviewChapter} disabled={isReviewing || !selectedChapterId}>{t("pipeline.reviewAction")}</AiButton>
            <AiButton variant="secondary" onClick={onRepairChapter} disabled={isRepairing || !selectedChapterId}>{t("pipeline.repairAction")}</AiButton>
            <AiButton variant="outline" onClick={onGenerateHook} disabled={isGeneratingHook || !selectedChapterId}>{t("pipeline.hookAction")}</AiButton>
          </div>
          {reviewResult ? (
            <div className="rounded-md border p-3 text-sm">
              <div className="mb-2 font-medium">{t("pipeline.reviewScoreTitle")}</div>
              <div className="grid gap-1 md:grid-cols-2">
                <div>{t("pipeline.scoreCoherence")}：{reviewResult.score.coherence}</div>
                <div>{t("pipeline.scoreRepetition")}：{reviewResult.score.repetition}</div>
                <div>{t("pipeline.scorePacing")}：{reviewResult.score.pacing}</div>
                <div>{t("pipeline.scoreVoice")}：{reviewResult.score.voice}</div>
                <div>{t("pipeline.scoreEngagement")}：{reviewResult.score.engagement}</div>
                <div>{t("pipeline.scoreOverall")}：{reviewResult.score.overall}</div>
              </div>
            </div>
          ) : null}
          <StreamOutput content={repairStreamContent} isStreaming={isRepairStreaming} onAbort={onAbortRepair} />
          {(repairBeforeContent || repairAfterContent) ? (
            <div className="grid gap-3 md:grid-cols-2">
              <pre className="max-h-[220px] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-2 text-xs">{repairBeforeContent || t("pipeline.noContent")}</pre>
              <pre className="max-h-[220px] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-2 text-xs">{repairAfterContent || t("pipeline.repairResultPlaceholder")}</pre>
            </div>
          ) : null}
          {lowScoreReports.length > 0 ? (
            <div className="space-y-2 rounded-md border p-2 text-xs">
              <div className="font-medium">{t("pipeline.lowScoreFilter", { threshold: pipelineForm.qualityThreshold })}</div>
              {lowScoreReports.map((item, index) => (
                <div key={`${item.chapterId}-${index}`} className="flex items-center justify-between">
                  <span>{item.chapterId}</span>
                  <Badge variant="secondary">overall {item.overall}</Badge>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <details className="group rounded-2xl border border-border/70 bg-background/95 p-4">
        <summary className="cursor-pointer list-none">
          <CollapsibleSummary
            title={t("pipeline.configSectionTitle")}
            description={t("pipeline.configSectionDescription")}
          />
        </summary>

        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("pipeline.modelConfigTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <LLMSelector />
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t("pipeline.startChapter")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={maxOrder}
                    value={pipelineForm.startOrder}
                    onChange={(event) => onPipelineFormChange("startOrder", Number(event.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t("pipeline.endChapter")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={maxOrder}
                    value={pipelineForm.endOrder}
                    onChange={(event) => onPipelineFormChange("endOrder", Number(event.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t("pipeline.maxRetries")}</div>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    value={pipelineForm.maxRetries}
                    onChange={(event) => onPipelineFormChange("maxRetries", Number(event.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t("pipeline.runModeLabel")}</div>
                  <select
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={pipelineForm.runMode}
                    onChange={(event) => onPipelineFormChange("runMode", event.target.value)}
                  >
                    <option value="fast">{t("pipeline.runModeFast")}</option>
                    <option value="polish">{t("pipeline.runModePolish")}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t("pipeline.qualityThreshold")}</div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={pipelineForm.qualityThreshold}
                    onChange={(event) => onPipelineFormChange("qualityThreshold", Number(event.target.value) || 75)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t("pipeline.repairModeLabel")}</div>
                  <select
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={pipelineForm.repairMode}
                    onChange={(event) => onPipelineFormChange("repairMode", event.target.value)}
                  >
                    <option value="detect_only">{t("pipeline.repairMode.detectOnly")}</option>
                    <option value="light_repair">{t("pipeline.repairMode.lightRepair")}</option>
                    <option value="heavy_repair">{t("pipeline.repairMode.heavyRepair")}</option>
                    <option value="continuity_only">{t("pipeline.repairMode.continuityOnly")}</option>
                    <option value="character_only">{t("pipeline.repairMode.characterOnly")}</option>
                    <option value="ending_only">{t("pipeline.repairMode.endingOnly")}</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={pipelineForm.autoReview}
                    onChange={(event) => onPipelineFormChange("autoReview", event.target.checked)}
                  />
                  {t("pipeline.autoReview")}
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={pipelineForm.autoRepair}
                    onChange={(event) => onPipelineFormChange("autoRepair", event.target.checked)}
                  />
                  {t("pipeline.autoRepair")}
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={pipelineForm.skipCompleted}
                    onChange={(event) => onPipelineFormChange("skipCompleted", event.target.checked)}
                  />
                  {t("pipeline.skipCompleted")}
                </label>
              </div>
              <div className="rounded-md border bg-muted/20 p-2 text-xs text-muted-foreground">
                {t("pipeline.currentSettings", {
                  runMode: pipelineForm.runMode === "polish" ? t("pipeline.runModePolish") : t("pipeline.runModeFast"),
                  threshold: pipelineForm.qualityThreshold,
                  repairMode: t(`pipeline.repairMode.${pipelineForm.repairMode === "detect_only" ? "detectOnly" : pipelineForm.repairMode === "light_repair" ? "lightRepair" : pipelineForm.repairMode === "heavy_repair" ? "heavyRepair" : pipelineForm.repairMode === "continuity_only" ? "continuityOnly" : pipelineForm.repairMode === "character_only" ? "characterOnly" : "endingOnly"}`),
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("pipeline.stageVisualizationTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pipelineStageItems.map((stage) => {
                  const state = getPipelineStageState(stage.key, pipelineJob, pipelineStageItems);
                  return (
                    <div
                      key={stage.key}
                      className={`rounded-md border px-3 py-2 text-sm ${
                        state === "active"
                          ? "border-primary bg-primary/10"
                          : state === "completed"
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : state === "failed"
                              ? "border-red-400/40 bg-red-500/10"
                              : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{stage.label}</span>
                        <span className="text-xs text-muted-foreground">{t(`pipeline.stageStatus.${state}`)}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("pipeline.runPanelTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <AiButton onClick={() => onRunPipeline()} disabled={isRunningPipeline || !hasCharacters}>{t("pipeline.startBatch")}</AiButton>
                  <AiButton
                    variant="outline"
                    onClick={() => {
                      if (!lowScoreRange) {
                        return;
                      }
                      onRunPipeline({
                        startOrder: lowScoreRange.startOrder,
                        endOrder: lowScoreRange.endOrder,
                        skipCompleted: true,
                      });
                    }}
                    disabled={isRunningPipeline || !lowScoreRange}
                  >
                    {t("pipeline.rerunLowScore")}
                  </AiButton>
                  <Button variant="outline" onClick={exportPipelineReport}>{t("pipeline.exportReport")}</Button>
                  <AiButton onClick={onGenerateBible} disabled={isBibleStreaming || !hasCharacters}>{t("pipeline.generateBible")}</AiButton>
                  <Button variant="secondary" onClick={onAbortBible} disabled={!isBibleStreaming}>{t("pipeline.stopBible")}</Button>
                  <AiButton onClick={onGenerateBeats} disabled={isBeatsStreaming || !hasCharacters}>{t("pipeline.generateBeats")}</AiButton>
                  <Button variant="secondary" onClick={onAbortBeats} disabled={!isBeatsStreaming}>{t("pipeline.stopBeats")}</Button>
                </div>
                {lowScoreRange ? (
                  <div className="text-xs text-muted-foreground">
                    {t("pipeline.lowScoreRangeInfo", { count: lowScoreRange.count, start: lowScoreRange.startOrder, end: lowScoreRange.endOrder })}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">{t("pipeline.noLowScoreChapters")}</div>
                )}
                <div className="rounded-md border p-3 text-sm">
                  <div className="mb-2 font-medium">{t("pipeline.taskStatusTitle")}</div>
                  {pipelineJob ? (
                    <div className="space-y-1">
                      <div>{t("pipeline.taskId")}：{pipelineJob.id}</div>
                      <div>{t("pipeline.taskStatusLabel")}：{pipelineJob.status}</div>
                      <div>{t("pipeline.currentStage")}：{pipelineJob.currentStage || "-"}</div>
                      <div>{t("pipeline.currentItem")}：{pipelineJob.currentItemLabel || "-"}</div>
                      <div>{t("pipeline.progress")}：{Math.round((pipelineJob.progress ?? 0) * 100)}%</div>
                      <div>{t("pipeline.completed")}：{pipelineJob.completedCount}/{pipelineJob.totalCount}</div>
                      <div>{t("pipeline.retries")}：{pipelineJob.retryCount}/{pipelineJob.maxRetries}</div>
                      {pipelineJob.lastErrorType ? <div>{t("pipeline.errorType")}：{pipelineJob.lastErrorType}</div> : null}
                      {pipelineJob.error ? <div className="text-red-600">{t("pipeline.error")}：{pipelineJob.error}</div> : null}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">{t("pipeline.noRunningTask")}</div>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <StreamOutput content={bibleStreamContent} isStreaming={isBibleStreaming} onAbort={onAbortBible} />
                  <StreamOutput content={beatsStreamContent} isStreaming={isBeatsStreaming} onAbort={onAbortBeats} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </details>

      <details className="group rounded-2xl border border-border/70 bg-background/95 p-4">
        <summary className="cursor-pointer list-none">
          <CollapsibleSummary
            title={t("pipeline.reportSectionTitle")}
            description={t("pipeline.reportSectionDescription")}
          />
        </summary>

        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("pipeline.qualityReportTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {qualitySummary ? (
                <div className="grid gap-2 md:grid-cols-3">
                  <Badge variant="outline">{t("pipeline.scoreCoherence")}：{qualitySummary.coherence}</Badge>
                  <Badge variant="outline">{t("pipeline.scoreRepetition")}：{qualitySummary.repetition}</Badge>
                  <Badge variant="outline">{t("pipeline.scorePacing")}：{qualitySummary.pacing}</Badge>
                  <Badge variant="outline">{t("pipeline.scoreVoice")}：{qualitySummary.voice}</Badge>
                  <Badge variant="outline">{t("pipeline.scoreEngagement")}：{qualitySummary.engagement}</Badge>
                  <Badge variant="default">{t("pipeline.scoreOverall")}：{qualitySummary.overall}</Badge>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t("pipeline.noQualityReport")}</div>
              )}
              <div className="space-y-2 text-sm">
                {chapterReports.slice(0, 10).map((item, index) => (
                  <div key={`${item.chapterId ?? "novel"}-${index}`} className="rounded-md border p-2">
                    <div>{t("pipeline.chapterLabel")}：{item.chapterId ?? t("pipeline.fullBook")}</div>
                    <div className="text-muted-foreground">
                      {t("pipeline.scoreOverall")}：{item.overall}，{t("pipeline.scoreCoherence")}：{item.coherence}，{t("pipeline.scoreRepetition")}：{item.repetition}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t("pipeline.savedBibleTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {bible ? (
                  <>
                    <div className="rounded-md border p-2"><div className="font-medium">{t("pipeline.bibleMainPromise")}</div><div className="text-muted-foreground">{bible.mainPromise ?? t("pipeline.noContent")}</div></div>
                    <div className="rounded-md border p-2"><div className="font-medium">{t("pipeline.bibleCoreSetting")}</div><div className="text-muted-foreground">{bible.coreSetting ?? t("pipeline.noContent")}</div></div>
                    <div className="rounded-md border p-2"><div className="font-medium">{t("pipeline.bibleWorldRules")}</div><div className="text-muted-foreground">{bible.worldRules ?? t("pipeline.noContent")}</div></div>
                  </>
                ) : (
                  <div className="text-muted-foreground">{t("pipeline.noBible")}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t("pipeline.savedBeatsTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {plotBeats.length > 0 ? (
                  plotBeats.slice(0, 20).map((beat) => (
                    <div key={beat.id} className="rounded-md border p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{t("pipeline.beatChapterLabel", { order: beat.chapterOrder ?? "-", title: beat.title })}</div>
                        <Badge variant="outline">{beat.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{t("pipeline.beatType")}：{beat.beatType}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">{t("pipeline.noBeats")}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </details>
    </div>
  );
}
