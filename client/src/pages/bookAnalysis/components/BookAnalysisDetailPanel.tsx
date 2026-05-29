import { useTranslation } from "react-i18next";
import type { BookAnalysisDetail, BookAnalysisPublishResult, BookAnalysisSection } from "@ai-novel/shared/types/bookAnalysis";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AggregatedEvidenceItem, SectionDraft } from "../bookAnalysis.types";
import { formatDate, formatStage, formatStatus } from "../bookAnalysis.utils";
import BookAnalysisSectionCard from "./BookAnalysisSectionCard";

type ExportFormat = "markdown" | "json";

interface NovelOption {
  id: string;
  title: string;
}

interface PendingState {
  copy: boolean;
  rebuild: boolean;
  archive: boolean;
  regenerate: boolean;
  optimizePreview: boolean;
  saveSection: boolean;
  publish: boolean;
  createStyleProfile: boolean;
}

interface BookAnalysisDetailPanelProps {
  selectedAnalysis?: BookAnalysisDetail;
  novelOptions: NovelOption[];
  selectedNovelId: string;
  publishFeedback: string;
  styleProfileFeedback: string;
  lastPublishResult: BookAnalysisPublishResult | null;
  aggregatedEvidence: AggregatedEvidenceItem[];
  optimizingSectionKey: BookAnalysisSection["sectionKey"] | null;
  pending: PendingState;
  onSelectedNovelChange: (novelId: string) => void;
  onCopy: () => void;
  onRebuild: (analysisId: string) => void;
  onArchive: (analysisId: string) => void;
  onDownload: (format: ExportFormat) => void;
  onPublish: () => void;
  onCreateStyleProfile: () => void;
  onRegenerateSection: (section: BookAnalysisSection) => void;
  onOptimizeSection: (section: BookAnalysisSection) => void;
  onApplyOptimizePreview: (section: BookAnalysisSection) => void;
  onCancelOptimizePreview: (section: BookAnalysisSection) => void;
  onSaveSection: (section: BookAnalysisSection) => void;
  onDraftChange: (section: BookAnalysisSection, patch: Partial<SectionDraft>) => void;
  getSectionDraft: (section: BookAnalysisSection) => SectionDraft;
}

export default function BookAnalysisDetailPanel(props: BookAnalysisDetailPanelProps) {
  const { t } = useTranslation();
  const {
    selectedAnalysis,
    novelOptions,
    selectedNovelId,
    publishFeedback,
    styleProfileFeedback,
    lastPublishResult,
    aggregatedEvidence,
    optimizingSectionKey,
    pending,
    onSelectedNovelChange,
    onCopy,
    onRebuild,
    onArchive,
    onDownload,
    onPublish,
    onCreateStyleProfile,
    onRegenerateSection,
    onOptimizeSection,
    onApplyOptimizePreview,
    onCancelOptimizePreview,
    onSaveSection,
    onDraftChange,
    getSectionDraft,
  } = props;

  if (!selectedAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("bookAnalysis:detail.workspaceTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t("bookAnalysis:detail.noSelection")}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>{selectedAnalysis.title}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {selectedAnalysis.documentTitle} | {t("bookAnalysis:detail.sourceVersion", { version: selectedAnalysis.documentVersionNumber })}
                {selectedAnalysis.isCurrentVersion ? "" : ` | ${t("bookAnalysis:detail.currentVersion", { version: selectedAnalysis.currentDocumentVersionNumber })}`}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{formatStatus(selectedAnalysis.status, t)}</Badge>
              {selectedAnalysis.publishedDocumentId && (
                <Badge variant="secondary">{t("bookAnalysis:detail.published")}</Badge>
              )}
              <Badge variant="outline">{t("bookAnalysis:detail.progress", { percent: Math.round(selectedAnalysis.progress * 100) })}</Badge>
              <Button size="sm" variant="outline" onClick={onCopy} disabled={pending.copy}>
                {t("bookAnalysis:detail.copy")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRebuild(selectedAnalysis.id)}
                disabled={pending.rebuild || selectedAnalysis.status === "archived"}
              >
                {t("bookAnalysis:detail.rebuild")}
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to={`/tasks?kind=book_analysis&id=${selectedAnalysis.id}`}>{t("bookAnalysis:detail.viewInTasks")}</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => onDownload("markdown")}>
                {t("bookAnalysis:detail.exportMarkdown")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onDownload("json")}>
                {t("bookAnalysis:detail.exportJson")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCreateStyleProfile}
                disabled={pending.createStyleProfile || selectedAnalysis.status === "archived"}
              >
                {pending.createStyleProfile ? t("bookAnalysis:detail.creatingStyleProfile") : t("bookAnalysis:detail.createStyleProfile")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onArchive(selectedAnalysis.id)}
                disabled={pending.archive || selectedAnalysis.status === "archived"}
              >
                {t("bookAnalysis:detail.archive")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!selectedAnalysis.isCurrentVersion ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {t("bookAnalysis:detail.oldVersionWarning", { version: selectedAnalysis.currentDocumentVersionNumber })}
            </div>
          ) : null}
          {styleProfileFeedback ? (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
              {styleProfileFeedback}
            </div>
          ) : null}
          <div className="rounded-md border p-3 text-sm">
            <div className="mb-2 font-medium">{t("bookAnalysis:detail.publishTitle")}</div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-9 min-w-[220px] rounded-md border bg-background px-2 text-sm"
                value={selectedNovelId}
                onChange={(event) => onSelectedNovelChange(event.target.value)}
              >
                <option value="">{t("bookAnalysis:detail.selectNovel")}</option>
                {novelOptions.map((novel) => (
                  <option key={novel.id} value={novel.id}>
                    {novel.title}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={onPublish}
                disabled={!selectedNovelId || pending.publish || selectedAnalysis.status === "archived"}
              >
                {t("bookAnalysis:detail.publishButton")}
              </Button>
            </div>
            {publishFeedback ? <div className="mt-2 text-xs text-muted-foreground">{publishFeedback}</div> : null}
            {lastPublishResult ? (
              <div className="mt-1 text-xs text-muted-foreground">{t("bookAnalysis:detail.publishedAt", { date: formatDate(lastPublishResult.publishedAt, t) })}</div>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-3 text-sm">
              <div className="font-medium">{t("bookAnalysis:detail.summaryTitle")}</div>
              <div className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {selectedAnalysis.summary?.trim() || t("bookAnalysis:detail.summaryEmpty")}
              </div>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="font-medium">{t("bookAnalysis:detail.metaTitle")}</div>
              <div className="mt-2 space-y-1 text-muted-foreground">
                <div>{t("bookAnalysis:detail.provider", { value: selectedAnalysis.provider ?? "deepseek" })}</div>
                <div>{t("bookAnalysis:detail.model", { value: selectedAnalysis.model || t("bookAnalysis:detail.defaultValue") })}</div>
                <div>{t("bookAnalysis:detail.temperature", { value: selectedAnalysis.temperature ?? t("bookAnalysis:detail.defaultValue") })}</div>
                <div>{t("bookAnalysis:detail.maxTokens", { value: selectedAnalysis.maxTokens ?? t("bookAnalysis:detail.defaultValue") })}</div>
                <div>{t("bookAnalysis:detail.currentStage", { stage: formatStage(selectedAnalysis.currentStage, t) })}</div>
                <div>{t("bookAnalysis:detail.currentItem", { item: selectedAnalysis.currentItemLabel ?? t("bookAnalysis:detail.none") })}</div>
                <div>{t("bookAnalysis:detail.latestHeartbeat", { date: formatDate(selectedAnalysis.heartbeatAt, t) })}</div>
                <div>{t("bookAnalysis:detail.lastRun", { date: formatDate(selectedAnalysis.lastRunAt, t) })}</div>
                <div>{t("bookAnalysis:detail.createdAt", { date: formatDate(selectedAnalysis.createdAt, t) })}</div>
              </div>
            </div>
          </div>
          {selectedAnalysis.lastError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {t("bookAnalysis:detail.lastError", { error: selectedAnalysis.lastError })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {selectedAnalysis.sections.map((section) => (
        <BookAnalysisSectionCard
          key={section.id}
          section={section}
          draft={getSectionDraft(section)}
          canOperate={Boolean(selectedAnalysis)}
          isRegenerating={pending.regenerate}
          isOptimizing={pending.optimizePreview && optimizingSectionKey === section.sectionKey}
          isSaving={pending.saveSection}
          onDraftChange={onDraftChange}
          onRegenerate={onRegenerateSection}
          onOptimize={onOptimizeSection}
          onApplyOptimizePreview={onApplyOptimizePreview}
          onCancelOptimizePreview={onCancelOptimizePreview}
          onSave={onSaveSection}
        />
      ))}

      <Card>
        <CardHeader>
          <CardTitle>{t("bookAnalysis:detail.evidenceTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {aggregatedEvidence.map((item, index) => (
            <div key={`${item.sectionTitle}-${index}`} className="rounded-md border p-3 text-sm">
              <div className="font-medium">
                {item.sectionTitle} | [{item.sourceLabel}] {item.label}
              </div>
              <div className="mt-1 whitespace-pre-wrap text-muted-foreground">{item.excerpt}</div>
            </div>
          ))}
          {aggregatedEvidence.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("bookAnalysis:detail.noEvidence")}</div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
