import type { WorldConsistencyIssue, WorldConsistencyReport } from "@ai-novel/shared/types/world";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  localizeConsistencyField,
  localizeConsistencyIssueDetail,
  localizeConsistencyIssueMessage,
  localizeConsistencyIssueTitle,
  localizeConsistencySeverity,
  localizeConsistencySource,
  localizeConsistencyStatus,
} from "../../worldConsistencyUi";

interface WorldConsistencyTabProps {
  report: WorldConsistencyReport | null;
  issues: WorldConsistencyIssue[];
  checkPending: boolean;
  onCheck: () => void;
  onPatchIssue: (payload: { issueId: string; status: "open" | "resolved" | "ignored" }) => void;
}

export default function WorldConsistencyTab(props: WorldConsistencyTabProps) {
  const { report, issues, checkPending, onCheck, onPatchIssue } = props;
  const { t } = useTranslation("world");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("workspace.consistency.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={onCheck} disabled={checkPending}>
          {checkPending ? t("workspace.consistency.checkingButton") : t("workspace.consistency.checkButton")}
        </Button>
        {report ? (
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-md border p-3 text-sm">
              <div className="text-xs text-muted-foreground">{t("workspace.consistency.statusLabel")}</div>
              <div className="mt-1 font-semibold">{localizeConsistencyStatus(report.status, t)}</div>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="text-xs text-muted-foreground">{t("workspace.consistency.scoreLabel")}</div>
              <div className="mt-1 font-semibold">{report.score}</div>
            </div>
            <div className="rounded-md border p-3 text-sm md:col-span-2">
              <div className="text-xs text-muted-foreground">{t("workspace.consistency.summaryLabel")}</div>
              <div className="mt-1 font-medium">{report.summary}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {t("workspace.consistency.generatedAt", { time: report.generatedAt ? new Date(report.generatedAt).toLocaleString() : t("workspace.consistency.generatedAtUnknown") })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">{t("workspace.consistency.noReport")}</div>
        )}
        {issues.map((issue) => (
          <div key={issue.id} className="rounded-md border p-3 space-y-2">
            <div className="font-medium">
              [{localizeConsistencySeverity(issue.severity, t)}] {localizeConsistencyIssueTitle(issue.code, t)}
            </div>
            <div className="text-sm">{localizeConsistencyIssueMessage(issue, t)}</div>
            <div className="text-xs text-muted-foreground">
              {localizeConsistencyIssueDetail(issue, t) ?? t("workspace.consistency.noDetail")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("workspace.consistency.sourcePrefix")}{localizeConsistencySource(issue.source, t)}{t("workspace.consistency.separator")}{t("workspace.consistency.fieldPrefix")}
              {localizeConsistencyField(issue.targetField, t)}{t("workspace.consistency.separator")}{t("workspace.consistency.statusPrefix")}
              {localizeConsistencyStatus(issue.status, t)}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onPatchIssue({ issueId: issue.id, status: "resolved" })}
              >
                {t("workspace.consistency.resolveButton")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPatchIssue({ issueId: issue.id, status: "ignored" })}
              >
                {t("workspace.consistency.ignoreButton")}
              </Button>
            </div>
          </div>
        ))}
        {issues.length === 0 ? (
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            {t("workspace.consistency.noIssues")}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
