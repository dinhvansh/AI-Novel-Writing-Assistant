import { useTranslation } from "react-i18next";
import type { KnowledgeDocumentDetail, KnowledgeRecallTestResult } from "@ai-novel/shared/types/knowledge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppDialogContent, Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatStatus } from "./knowledgeRagUi";

interface KnowledgeDocumentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: KnowledgeDocumentDetail;
  selectedDocumentId: string;
  versionBusy: boolean;
  onUploadVersionFile: (file: File) => Promise<void>;
  onReindex: () => void;
  recallQuery: string;
  onRecallQueryChange: (value: string) => void;
  onRecallTest: () => void;
  recallPending: boolean;
  recallErrorMessage?: string | null;
  recallResult: KnowledgeRecallTestResult | null;
  onRestoreDocument: () => void;
  restorePending: boolean;
  onActivateVersion: (versionId: string) => void;
  activateVersionPending: boolean;
}

export default function KnowledgeDocumentDetailDialog({
  open,
  onOpenChange,
  document,
  selectedDocumentId,
  versionBusy,
  onUploadVersionFile,
  onReindex,
  recallQuery,
  onRecallQueryChange,
  onRecallTest,
  recallPending,
  recallErrorMessage,
  recallResult,
  onRestoreDocument,
  restorePending,
  onActivateVersion,
  activateVersionPending,
}: KnowledgeDocumentDetailDialogProps) {
  const { t } = useTranslation();
  const isArchived = document?.status === "archived";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent
        className="max-w-4xl"
        title={document?.title ?? t("knowledge:documentDetail.title")}
        bodyClassName="min-w-0 space-y-4"
      >
          <div className="flex flex-wrap gap-2">
            {isArchived ? (
              <Button variant="outline" onClick={onRestoreDocument} disabled={restorePending}>
                {restorePending ? t("knowledge:documentDetail.restoring") : t("knowledge:documentDetail.restore")}
              </Button>
            ) : (
              <input
                type="file"
                accept=".txt,text/plain"
                className="rounded-md border bg-background p-2 text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) {
                    return;
                  }
                  void onUploadVersionFile(file);
                }}
                disabled={versionBusy}
              />
            )}
            {selectedDocumentId && !isArchived ? (
              <Button variant="outline" onClick={onReindex}>
                {t("knowledge:documentDetail.reindex")}
              </Button>
            ) : null}
          </div>

          {document ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline">{t("knowledge:documentDetail.docStatus", { status: formatStatus(document.status) })}</Badge>
                <Badge variant="outline">{t("knowledge:documentDetail.indexStatus", { status: formatStatus(isArchived ? "idle" : (document.latestIndexStatus ?? "-")) })}</Badge>
              </div>
              {document.latestIndexStatus === "failed" && document.latestIndexError ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  {t("knowledge:documentDetail.indexFailReason", { reason: document.latestIndexError })}
                </div>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>{t("knowledge:documentDetail.recallTest.title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isArchived ? (
                    <div className="text-sm text-muted-foreground">
                      {t("knowledge:documentDetail.recallTest.archivedHint")}
                    </div>
                  ) : document.latestIndexStatus === "succeeded" ? (
                    <>
                      <div className="flex min-w-0 flex-col gap-2 md:flex-row">
                        <Input
                          value={recallQuery}
                          onChange={(event) => onRecallQueryChange(event.target.value)}
                          placeholder={t("knowledge:documentDetail.recallTest.placeholder")}
                        />
                        <Button
                          onClick={onRecallTest}
                          disabled={recallPending || !selectedDocumentId || !recallQuery.trim()}
                        >
                          {recallPending ? t("knowledge:documentDetail.recallTest.testing") : t("knowledge:documentDetail.recallTest.start")}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("knowledge:documentDetail.recallTest.hint")}
                      </div>
                      {recallErrorMessage ? (
                        <div className="text-sm text-destructive">{recallErrorMessage}</div>
                      ) : null}
                      {recallResult ? (
                        <div className="min-w-0 space-y-2 overflow-hidden">
                          {recallResult.hits.length === 0 ? (
                            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                              {t("knowledge:documentDetail.recallTest.noHits")}
                            </div>
                          ) : (
                            recallResult.hits.map((hit, index) => (
                              <div key={hit.id} className="min-w-0 max-w-full overflow-hidden rounded-md border p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="min-w-0 break-all font-medium">
                                    {t("knowledge:documentDetail.recallTest.hitLabel", {
                                      index: index + 1,
                                      source: hit.source === "vector" ? t("knowledge:documentDetail.recallTest.sourceVector") : t("knowledge:documentDetail.recallTest.sourceKeyword"),
                                      chunkOrder: hit.chunkOrder + 1,
                                    })}
                                  </div>
                                  <Badge variant="outline">{t("knowledge:documentDetail.recallTest.score", { score: hit.score.toFixed(4) })}</Badge>
                                </div>
                                {hit.title ? (
                                  <div className="mt-1 break-all text-xs text-muted-foreground">{hit.title}</div>
                                ) : null}
                                <pre className="mt-3 max-h-52 w-full max-w-full overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-muted/40 p-3 text-xs">
                                  {hit.chunkText}
                                </pre>
                              </div>
                            ))
                          )}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {t("knowledge:documentDetail.recallTest.notIndexedHint")}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="min-w-0 space-y-3">
                {document.versions.map((version) => (
                  <div key={version.id} className="min-w-0 max-w-full overflow-hidden rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium">{t("knowledge:documentDetail.version.label", { versionNumber: version.versionNumber })}</div>
                      {version.isActive ? <Badge>{t("knowledge:documentDetail.version.active")}</Badge> : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t("knowledge:documentDetail.version.meta", { charCount: version.charCount, date: new Date(version.createdAt).toLocaleString() })}
                    </div>
                    {!version.isActive && !isArchived ? (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onActivateVersion(version.id)}
                          disabled={activateVersionPending}
                        >
                          {t("knowledge:documentDetail.version.activate")}
                        </Button>
                      </div>
                    ) : null}
                    <pre className="mt-3 max-h-64 w-full max-w-full overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-muted/40 p-3 text-xs">
                      {version.content}
                    </pre>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {t("knowledge:documentDetail.loading")}
            </div>
          )}
      </AppDialogContent>
    </Dialog>
  );
}
