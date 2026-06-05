import type { RecoverableTaskSummary } from "@ai-novel/shared/types/task";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AppDialogContent,
  Dialog,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { translateDirectorLabel } from "@/lib/directorRuntimeI18n";
import { useTaskRecovery } from "./TaskRecoveryContext";

function formatTaskKind(kind: RecoverableTaskSummary["kind"], t: ReturnType<typeof useTranslation>["t"]): string {
  if (kind === "novel_workflow") {
    return t("desktop:taskRecovery.kinds.novelWorkflow");
  }
  if (kind === "novel_pipeline") {
    return t("desktop:taskRecovery.kinds.novelPipeline");
  }
  if (kind === "book_analysis") {
    return t("desktop:taskRecovery.kinds.bookAnalysis");
  }
  if (kind === "style_extraction") {
    return t("desktop:taskRecovery.kinds.styleExtraction");
  }
  return t("desktop:taskRecovery.kinds.imageTask");
}

export default function TaskRecoveryDialog() {
  const { t } = useTranslation();
  const {
    items,
    isOpen,
    busyTaskId,
    isResumeSinglePending,
    isResumeAllPending,
    closeDialog,
    resumeSingle,
    resumeAll,
  } = useTaskRecovery();

  return (
    <Dialog open={isOpen} onOpenChange={(nextOpen) => { if (!nextOpen) closeDialog(); }}>
      <AppDialogContent
        title={t("desktop:taskRecovery.dialogTitle")}
        description={t("desktop:taskRecovery.dialogDescription")}
        footer={(
          <>
            <Button variant="outline" onClick={closeDialog}>
              {t("desktop:taskRecovery.later")}
            </Button>
            <Button onClick={resumeAll} disabled={isResumeSinglePending || isResumeAllPending}>
              {isResumeAllPending ? t("desktop:taskRecovery.resumingAll") : t("desktop:taskRecovery.continueAll")}
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          {items.map((item) => (
            (() => {
              const currentStage = translateDirectorLabel(item.currentStage ?? null) ?? item.currentStage;
              const currentItemLabel = translateDirectorLabel(item.currentItemLabel ?? null) ?? item.currentItemLabel;
              const resumeAction = translateDirectorLabel(item.resumeAction ?? null) ?? item.resumeAction;
              const recoveryHint = translateDirectorLabel(item.recoveryHint ?? null) ?? item.recoveryHint;
              return (
            <Card key={`${item.kind}-${item.id}`}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{formatTaskKind(item.kind, t)}</Badge>
                      <Badge variant={item.status === "running" ? "default" : "secondary"}>
                        {item.status === "running" ? t("desktop:taskRecovery.runningInterrupted") : t("desktop:taskRecovery.queuedInterrupted")}
                      </Badge>
                    </div>
                    <div className="text-base font-semibold">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{t("desktop:taskRecovery.ownerLabel", { label: item.ownerLabel })}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => resumeSingle({ kind: item.kind, id: item.id })}
                      disabled={isResumeAllPending || (isResumeSinglePending && busyTaskId !== item.id)}
                    >
                      {isResumeSinglePending && busyTaskId === item.id ? t("desktop:taskRecovery.resumingSingle") : t("desktop:taskRecovery.continueSingle")}
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to={item.sourceRoute} onClick={closeDialog}>{t("desktop:taskRecovery.openLocation")}</Link>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground">
                  {currentStage ? <div>{t("desktop:taskRecovery.currentStage", { stage: currentStage })}</div> : null}
                  {currentItemLabel ? <div>{t("desktop:taskRecovery.interruptedAt", { label: currentItemLabel })}</div> : null}
                  {resumeAction ? <div>{t("desktop:taskRecovery.suggestedAction", { action: resumeAction })}</div> : null}
                  {recoveryHint ? <div>{t("desktop:taskRecovery.recoveryHint", { hint: recoveryHint })}</div> : null}
                </div>
              </CardContent>
            </Card>
              );
            })()
          ))}
        </div>
      </AppDialogContent>
    </Dialog>
  );
}
