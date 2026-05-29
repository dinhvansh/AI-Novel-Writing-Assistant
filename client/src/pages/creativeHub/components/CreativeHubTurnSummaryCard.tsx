import { useTranslation } from "react-i18next";
import type { CreativeHubTurnSummary } from "@ai-novel/shared/types/creativeHub";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CreativeHubTurnSummaryCardProps {
  summary: CreativeHubTurnSummary;
  onQuickAction?: (prompt: string) => void;
}

function toStatusLabel(status: CreativeHubTurnSummary["status"], t: (key: string) => string): string {
  switch (status) {
    case "succeeded":
      return t("creativeHub:turnSummary.status.succeeded");
    case "interrupted":
      return t("creativeHub:turnSummary.status.interrupted");
    case "failed":
      return t("creativeHub:turnSummary.status.failed");
    case "cancelled":
      return t("creativeHub:turnSummary.status.cancelled");
    case "running":
      return t("creativeHub:turnSummary.status.running");
    default:
      return status;
  }
}

function toVariant(status: CreativeHubTurnSummary["status"]): "secondary" | "destructive" | "outline" {
  if (status === "failed" || status === "cancelled") {
    return "destructive";
  }
  if (status === "interrupted") {
    return "secondary";
  }
  return "outline";
}

export default function CreativeHubTurnSummaryCard({
  summary,
  onQuickAction,
}: CreativeHubTurnSummaryCardProps) {
  const { t } = useTranslation();
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-slate-900">{t("creativeHub:turnSummary.title")}</div>
          <div className="mt-1 text-xs text-slate-500">
            {t("creativeHub:turnSummary.currentStage", { stage: summary.currentStage })}
          </div>
        </div>
        <Badge variant={toVariant(summary.status)}>{toStatusLabel(summary.status, t)}</Badge>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:turnSummary.intentSummary")}</div>
          <div className="mt-2 text-sm leading-6 text-slate-800">{summary.intentSummary}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:turnSummary.actionSummary")}</div>
          <div className="mt-2 text-sm leading-6 text-slate-800">{summary.actionSummary}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:turnSummary.impactSummary")}</div>
          <div className="mt-2 text-sm leading-6 text-slate-800">{summary.impactSummary}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("creativeHub:turnSummary.nextSuggestion")}</div>
          <div className="mt-2 text-sm leading-6 text-slate-800">{summary.nextSuggestion}</div>
          {onQuickAction && summary.nextSuggestion.trim() ? (
            <div className="mt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onQuickAction(summary.nextSuggestion)}
              >
                {t("creativeHub:turnSummary.followDirection")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
