import { useTranslation } from "react-i18next";
import type {
  AuditReport,
  Chapter,
  ReplanRecommendation,
  ReplanResult,
  StoryPlan,
  StoryStateSnapshot,
} from "@ai-novel/shared/types/novel";
import type { SSEFrame } from "@ai-novel/shared/types/api";
import type { ChapterRuntimePackage } from "@ai-novel/shared/types/chapterRuntime";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StreamOutput from "@/components/common/StreamOutput";
import {
  ChapterRuntimeAuditCard,
  ChapterRuntimeContextCard,
  ChapterRuntimeLengthCard,
} from "../ChapterRuntimePanels";
import {
  hasText,
  parseChapterScenePlanForDisplay,
  type AssetTabKey,
  MetricBadge,
} from "../chapterExecution.shared";

interface ChapterExecutionReferencePanelProps {
  selectedChapter?: Chapter;
  assetTab: AssetTabKey;
  onAssetTabChange: (tab: AssetTabKey) => void;
  chapterPlan?: StoryPlan | null;
  latestStateSnapshot?: StoryStateSnapshot | null;
  chapterAuditReports: AuditReport[];
  replanRecommendation?: ReplanRecommendation | null;
  onReplanChapter: () => void;
  isReplanningChapter: boolean;
  lastReplanResult?: ReplanResult | null;
  chapterQualityReport?: {
    coherence: number;
    repetition: number;
    pacing: number;
    voice: number;
    engagement: number;
    overall: number;
    issues?: string | null;
  };
  chapterRuntimePackage?: ChapterRuntimePackage | null;
  reviewResult: {
    issues?: Array<{ category: string; fixSuggestion: string }>;
  } | null;
  openAuditIssues: Array<{ id: string; auditType: string; fixSuggestion: string }>;
  repairStreamContent: string;
  isRepairStreaming: boolean;
  repairStreamingChapterId?: string | null;
  repairStreamingChapterLabel?: string | null;
  repairRunStatus?: Extract<SSEFrame, { type: "run_status" }> | null;
  onAbortRepair: () => void;
}

function PanelHintCard(props: { title: string; content: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/90 p-3">
      <div className="text-xs text-muted-foreground">{props.title}</div>
      <div className="mt-2 text-sm leading-6 text-foreground">{props.content}</div>
    </div>
  );
}

function ReferenceNotice(props: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-900">
      <div className="font-medium">{props.title}</div>
      <div className="mt-1 leading-6 text-amber-800">{props.description}</div>
    </div>
  );
}

export default function ChapterExecutionReferencePanel(props: ChapterExecutionReferencePanelProps) {
  const { t } = useTranslation("novel");
  const {
    selectedChapter,
    assetTab,
    onAssetTabChange,
    chapterPlan,
    latestStateSnapshot,
    chapterAuditReports,
    replanRecommendation,
    onReplanChapter,
    isReplanningChapter,
    lastReplanResult,
    chapterQualityReport,
    chapterRuntimePackage,
    reviewResult,
    openAuditIssues,
    repairStreamContent,
    isRepairStreaming,
    repairStreamingChapterId,
    repairStreamingChapterLabel,
    repairRunStatus,
    onAbortRepair,
  } = props;

  if (!selectedChapter) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-background p-4 text-sm leading-6 text-muted-foreground">
        {t("chapterInsights.noSelectionHint")}
      </div>
    );
  }

  const runtimePackage = chapterRuntimePackage?.chapterId === selectedChapter.id ? chapterRuntimePackage : null;
  const chapterObjective = chapterPlan?.objective ?? selectedChapter.expectation ?? t("chapterInsights.noObjectiveHint");
  const scenePlan = parseChapterScenePlanForDisplay(selectedChapter);
  const isSelectedChapterRepairStreaming = isRepairStreaming && repairStreamingChapterId === selectedChapter.id;
  const isSelectedChapterRepairFinalizing = isSelectedChapterRepairStreaming && repairRunStatus?.phase === "finalizing";
  const visibleRepairStreamContent = repairStreamingChapterId === selectedChapter.id ? repairStreamContent : "";
  const hasVisibleRepairOutput = hasText(visibleRepairStreamContent);
  const repairingOtherChapter = isRepairStreaming && repairStreamingChapterId && repairStreamingChapterId !== selectedChapter.id;
  const detailTab = assetTab === "content" ? "taskSheet" : assetTab;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-background p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-foreground">{t("chapterInsights.panelTitle")}</div>
            <div className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("chapterInsights.panelDescription")}
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">{t("chapterInsights.chapterOrderBadge", { order: selectedChapter.order })}</Badge>
        </div>
      </div>

      <Tabs value={detailTab} onValueChange={(value) => onAssetTabChange(value as AssetTabKey)}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted/50 p-1.5">
          <TabsTrigger value="taskSheet" className="rounded-xl text-xs">{t("chapterInsights.tabs.taskSheet")}</TabsTrigger>
          <TabsTrigger value="sceneCards" className="rounded-xl text-xs">{t("chapterInsights.tabs.sceneCards")}</TabsTrigger>
          <TabsTrigger value="quality" className="rounded-xl text-xs">{t("chapterInsights.tabs.quality")}</TabsTrigger>
          <TabsTrigger value="repair" className="rounded-xl text-xs">{t("chapterInsights.tabs.repair")}</TabsTrigger>
          <TabsTrigger value="content" className="col-span-2 rounded-xl text-xs">{t("chapterInsights.tabs.contextDiagnosis")}</TabsTrigger>
        </TabsList>

        <TabsContent value="taskSheet" className="space-y-3">
          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="text-xs text-muted-foreground">{t("chapterInsights.taskSheet.title")}</div>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-7">
              {selectedChapter.taskSheet?.trim() || t("chapterInsights.taskSheet.emptyHint")}
            </div>
          </div>
          <PanelHintCard title={t("chapterInsights.chapterObjectiveLabel")} content={chapterObjective} />
          <PanelHintCard title={t("chapterInsights.latestStateLabel")} content={latestStateSnapshot?.summary || t("chapterInsights.noStateSummary")} />
          <ChapterRuntimeContextCard
            runtimePackage={runtimePackage}
            chapterPlan={chapterPlan}
            stateSnapshot={latestStateSnapshot}
          />
        </TabsContent>

        <TabsContent value="sceneCards" className="space-y-3">
          <ChapterRuntimeLengthCard runtimePackage={runtimePackage} />
          {scenePlan ? (
            <div className="space-y-3">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="text-xs text-muted-foreground">{t("chapterInsights.sceneBudgetTitle")}</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <MetricBadge label={t("chapterInsights.chapterObjectiveLabel")} value={`${scenePlan.targetWordCount} ${t("chapterInsights.wordCountUnit")}`} />
                  <MetricBadge label={t("chapterInsights.sceneCountLabel")} value={String(scenePlan.scenes.length)} />
                </div>
              </div>
              {scenePlan.scenes.map((scene, index) => (
                <div key={scene.key} className="rounded-2xl border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{t("chapterInsights.sceneLabel", { index: index + 1 })}</Badge>
                    <Badge variant="secondary">{scene.targetWordCount} {t("chapterInsights.wordCountUnit")}</Badge>
                  </div>
                  <div className="mt-3 text-sm font-semibold text-foreground">{scene.title}</div>
                  <div className="mt-2 text-sm leading-6 text-muted-foreground">{scene.purpose}</div>
                  <div className="mt-3 space-y-2">
                    <PanelHintCard title={t("chapterInsights.mustAdvanceLabel")} content={scene.mustAdvance.join("；") || t("chapterInsights.noneValue")} />
                    <PanelHintCard title={t("chapterInsights.mustPreserveLabel")} content={scene.mustPreserve.join("；") || t("chapterInsights.noneValue")} />
                    <PanelHintCard title={t("chapterInsights.entryStateLabel")} content={scene.entryState} />
                    <PanelHintCard title={t("chapterInsights.exitStateLabel")} content={scene.exitState} />
                  </div>
                  {scene.forbiddenExpansion.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm leading-6 text-amber-900">
                      {t("chapterInsights.forbiddenExpansionLabel")}：{scene.forbiddenExpansion.join("；")}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground">{t("chapterInsights.sceneCardsTitle")}</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7">
                {selectedChapter.sceneCards?.trim()
                  ? t("chapterInsights.legacySceneCardsHint")
                  : t("chapterInsights.noSceneCards")}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quality" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MetricBadge label={t("chapterInsights.quality.overall")} value={String(chapterQualityReport?.overall ?? selectedChapter.qualityScore ?? "-")} />
            <MetricBadge label={t("chapterInsights.quality.coherence")} value={String(chapterQualityReport?.coherence ?? "-")} />
            <MetricBadge label={t("chapterInsights.quality.repetition")} value={String(chapterQualityReport?.repetition ?? "-")} />
            <MetricBadge label={t("chapterInsights.quality.pacing")} value={String(chapterQualityReport?.pacing ?? selectedChapter.pacingScore ?? "-")} />
            <MetricBadge label={t("chapterInsights.quality.voice")} value={String(chapterQualityReport?.voice ?? "-")} />
            <MetricBadge label={t("chapterInsights.quality.engagement")} value={String(chapterQualityReport?.engagement ?? "-")} />
          </div>

          <div className="rounded-2xl border p-4 text-sm">
            <div className="font-semibold text-foreground">{t("chapterInsights.quality.reviewIssuesTitle")}</div>
            {reviewResult?.issues?.length ? (
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                {reviewResult.issues.slice(0, 5).map((item, index) => (
                  <div key={`${item.category}-${index}`} className="rounded-xl border p-3">
                    <div className="font-medium text-foreground">{item.category}</div>
                    <div className="mt-1 leading-6">{item.fixSuggestion}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-xs leading-6 text-muted-foreground">{t("chapterInsights.quality.noReviewIssues")}</div>
            )}
          </div>

          <div className="rounded-2xl border p-4 text-sm">
            <div className="font-semibold text-foreground">{t("chapterInsights.quality.auditIssuesTitle")}</div>
            {openAuditIssues.length > 0 ? (
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                {openAuditIssues.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-xl border p-3">
                    <div className="font-medium text-foreground">{item.auditType}</div>
                    <div className="mt-1 leading-6">{item.fixSuggestion}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-xs leading-6 text-muted-foreground">{t("chapterInsights.quality.noAuditIssues")}</div>
            )}
          </div>

          <ChapterRuntimeAuditCard
            runtimePackage={runtimePackage}
            auditReports={chapterAuditReports}
            replanRecommendation={replanRecommendation}
            onReplan={onReplanChapter}
            isReplanning={isReplanningChapter}
            lastReplanResult={lastReplanResult}
          />
        </TabsContent>

        <TabsContent value="repair" className="space-y-3">
          {repairingOtherChapter ? (
            <ReferenceNotice
              title={t("chapterInsights.repair.otherChapterRepairingTitle")}
              description={t("chapterInsights.repair.otherChapterRepairingDescription", { label: repairStreamingChapterLabel ?? t("chapterInsights.repair.anotherChapterFallback") })}
            />
          ) : null}

          {(isSelectedChapterRepairStreaming || hasVisibleRepairOutput) ? (
            <StreamOutput
              title={t("chapterInsights.repair.streamTitle")}
              emptyText={isSelectedChapterRepairFinalizing
                ? (repairRunStatus?.message ?? t("chapterInsights.repair.finalizingHint"))
                : t("chapterInsights.repair.waitingHint")}
              content={visibleRepairStreamContent}
              isStreaming={isSelectedChapterRepairStreaming}
              onAbort={isSelectedChapterRepairFinalizing ? undefined : onAbortRepair}
            />
          ) : null}

          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="text-xs text-muted-foreground">{t("chapterInsights.repair.historyTitle")}</div>
            <div className="mt-3 max-h-[420px] overflow-y-auto whitespace-pre-wrap text-sm leading-7">
              {selectedChapter.repairHistory?.trim() || t("chapterInsights.repair.noHistory")}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-3">
          <ChapterRuntimeContextCard
            runtimePackage={null}
            chapterPlan={chapterPlan}
            stateSnapshot={latestStateSnapshot}
          />
          <ChapterRuntimeAuditCard
            runtimePackage={null}
            auditReports={chapterAuditReports}
            replanRecommendation={replanRecommendation}
            onReplan={onReplanChapter}
            isReplanning={isReplanningChapter}
            lastReplanResult={lastReplanResult}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
