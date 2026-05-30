import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { KnowledgeDocumentStatus, KnowledgeDocumentSummary } from "@ai-novel/shared/types/knowledge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OpenInCreativeHubButton from "@/components/creativeHub/OpenInCreativeHubButton";
import SelectField from "@/components/common/SelectField";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RagJobSummary } from "@/api/knowledge";
import {
  formatRagJobMeta,
  formatStatus,
  getRagJobProgressPercent,
  getRagJobProgressWidth,
} from "./knowledgeRagUi";

interface KnowledgeDocumentsTabProps {
  uploadTitle: string;
  onUploadTitleChange: (value: string) => void;
  uploadBusy: boolean;
  onUploadFile: (file: File) => Promise<void>;
  keyword: string;
  onKeywordChange: (value: string) => void;
  status: KnowledgeDocumentStatus | "";
  onStatusChange: (value: KnowledgeDocumentStatus | "") => void;
  documents: KnowledgeDocumentSummary[];
  latestKnowledgeDocumentJobs: Map<string, RagJobSummary>;
  onSelectDocument: (id: string) => void;
  onReindexDocument: (id: string) => void;
  onUpdateStatus: (id: string, status: KnowledgeDocumentStatus) => void;
}

export default function KnowledgeDocumentsTab({
  uploadTitle,
  onUploadTitleChange,
  uploadBusy,
  onUploadFile,
  keyword,
  onKeywordChange,
  status,
  onStatusChange,
  documents,
  latestKnowledgeDocumentJobs,
  onSelectDocument,
  onReindexDocument,
  onUpdateStatus,
}: KnowledgeDocumentsTabProps) {
  const { t } = useTranslation("knowledge");

  const statusOptions = [
    { value: "", label: t("documentsTab.statusAll") },
    { value: "enabled", label: t("documentsTab.statusEnabled") },
    { value: "disabled", label: t("documentsTab.statusDisabled") },
    { value: "archived", label: t("documentsTab.statusArchived") },
  ] as const;

  const confirmArchiveDocument = (document: KnowledgeDocumentSummary) => {
    const confirmed = window.confirm(
      t("documentsTab.confirmArchive", { title: document.title }),
    );
    if (!confirmed) {
      return;
    }
    onUpdateStatus(document.id, "archived");
  };

  const renderDocumentRow = (document: KnowledgeDocumentSummary) => {
    const documentJob = latestKnowledgeDocumentJobs.get(document.id);
    const displayIndexStatus = documentJob && (documentJob.status === "queued" || documentJob.status === "running")
      ? documentJob.status
      : document.status === "archived"
        ? "idle"
      : document.latestIndexStatus;

    return (
      <div key={document.id} className="rounded-md border p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="font-medium">{document.title}</div>
            <div className="text-xs text-muted-foreground">
              {document.fileName} | {t("documentsTab.versionCount", { count: document.versionCount })} | {t("documentsTab.activeVersion", { version: document.activeVersionNumber })}
            </div>
            <div className="text-xs text-muted-foreground">{t("documentsTab.bookAnalysisCount", { count: document.bookAnalysisCount })}</div>
            {documentJob?.progress && (documentJob.status === "queued" || documentJob.status === "running") ? (
              <div className="mt-2 rounded-md border border-dashed p-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-medium">{documentJob.progress.label}</span>
                  <span>{getRagJobProgressPercent(documentJob)}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: getRagJobProgressWidth(documentJob) }}
                  />
                </div>
                {documentJob.progress.detail ? (
                  <div className="mt-2 text-xs text-muted-foreground">{documentJob.progress.detail}</div>
                ) : null}
                <div className="mt-1 text-xs text-muted-foreground">{formatRagJobMeta(documentJob)}</div>
              </div>
            ) : null}
            {document.latestIndexStatus === "failed" && document.latestIndexError ? (
              <div className="text-xs text-destructive">{t("documentsTab.failedReason", { reason: document.latestIndexError })}</div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{formatStatus(document.status)}</Badge>
            <Badge variant="outline">{formatStatus(displayIndexStatus)}</Badge>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => onSelectDocument(document.id)}>
            {t("documentsTab.viewVersions")}
          </Button>
          {document.status === "archived" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(document.id, "enabled")}
            >
              {t("documentsTab.restoreEnabled")}
            </Button>
          ) : (
            <>
              <OpenInCreativeHubButton
                bindings={{ knowledgeDocumentIds: [document.id] }}
                label={t("documentsTab.openInCreativeHub")}
              />
              <Button asChild size="sm" variant="outline">
                <Link to={`/book-analysis?documentId=${document.id}`}>{t("documentsTab.newBookAnalysis")}</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReindexDocument(document.id)}>
                {t("documentsTab.reindex")}
              </Button>
              {document.status === "enabled" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus(document.id, "disabled")}
                >
                  {t("documentsTab.disable")}
                </Button>
              ) : document.status === "disabled" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus(document.id, "enabled")}
                >
                  {t("documentsTab.enable")}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={() => confirmArchiveDocument(document)}
              >
                {t("documentsTab.archive")}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t("documentsTab.uploadTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={uploadTitle}
            onChange={(event) => onUploadTitleChange(event.target.value)}
            placeholder={t("documentsTab.uploadTitlePlaceholder")}
          />
          <input
            type="file"
            accept=".txt,text/plain"
            className="w-full rounded-md border bg-background p-2 text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) {
                return;
              }
              void onUploadFile(file);
            }}
            disabled={uploadBusy}
          />
          <div className="text-xs text-muted-foreground">
            {t("documentsTab.uploadHint")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("documentsTab.documentListTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1fr_180px]">
            <Input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder={t("documentsTab.searchPlaceholder")}
            />
            <SelectField
              value={status}
              onValueChange={(value) => onStatusChange(value as KnowledgeDocumentStatus | "")}
              options={statusOptions.map((option) => ({ ...option }))}
              placeholder={t("documentsTab.filterStatus")}
              className="space-y-0"
              triggerClassName="h-10"
            />
          </div>
          <div className="space-y-3">
            {documents.map(renderDocumentRow)}
            {documents.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                {t("documentsTab.empty")}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
