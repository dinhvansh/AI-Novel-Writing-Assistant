import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  PayoffLedgerItem,
  PayoffLedgerResponse,
  StoryStateSnapshot,
} from "@ai-novel/shared/types/novel";
import CollapsibleSummary from "./CollapsibleSummary";

interface BookPayoffLedgerCardProps {
  latestStateSnapshot?: StoryStateSnapshot | null;
  payoffLedger?: PayoffLedgerResponse | null;
}

function payoffStatusLabel(status: string, t: (key: string) => string): string {
  switch (status) {
    case "setup":
      return t("novel:outline.bookPayoffLedger.status.setup");
    case "hinted":
      return t("novel:outline.bookPayoffLedger.status.hinted");
    case "pending_payoff":
      return t("novel:outline.bookPayoffLedger.status.pendingPayoff");
    case "paid_off":
      return t("novel:outline.bookPayoffLedger.status.paidOff");
    case "failed":
      return t("novel:outline.bookPayoffLedger.status.failed");
    case "overdue":
      return t("novel:outline.bookPayoffLedger.status.overdue");
    default:
      return status || t("novel:outline.bookPayoffLedger.status.unknown");
  }
}

function payoffStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "paid_off":
      return "default";
    case "failed":
      return "secondary";
    default:
      return "outline";
  }
}

function payoffStatusTone(status: string): string {
  if (status === "overdue") {
    return "border-amber-300 bg-amber-50 text-amber-900";
  }
  if (status === "paid_off") {
    return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }
  if (status === "failed") {
    return "border-slate-300 bg-slate-100 text-slate-700";
  }
  return "";
}

function formatWindow(item: PayoffLedgerItem, t: (key: string, params?: Record<string, unknown>) => string): string {
  if (
    typeof item.targetStartChapterOrder === "number"
    && typeof item.targetEndChapterOrder === "number"
  ) {
    return t("novel:outline.bookPayoffLedger.window.range", {
      start: item.targetStartChapterOrder,
      end: item.targetEndChapterOrder,
    });
  }
  if (typeof item.targetEndChapterOrder === "number") {
    return t("novel:outline.bookPayoffLedger.window.latest", { end: item.targetEndChapterOrder });
  }
  if (typeof item.targetStartChapterOrder === "number") {
    return t("novel:outline.bookPayoffLedger.window.startsFrom", { start: item.targetStartChapterOrder });
  }
  return t("novel:outline.bookPayoffLedger.window.unbounded");
}

function scopeLabel(scopeType: PayoffLedgerItem["scopeType"], t: (key: string) => string): string {
  if (scopeType === "book") {
    return t("novel:outline.bookPayoffLedger.scope.book");
  }
  if (scopeType === "volume") {
    return t("novel:outline.bookPayoffLedger.scope.volume");
  }
  return t("novel:outline.bookPayoffLedger.scope.chapter");
}

function sourceSummary(item: PayoffLedgerItem, t: (key: string) => string): string {
  const labels = item.sourceRefs
    .map((source) => source.refLabel?.trim())
    .filter(Boolean)
    .slice(0, 3);
  return labels.length > 0 ? labels.join(" / ") : t("novel:outline.bookPayoffLedger.sourceFallback");
}

export default function BookPayoffLedgerCard(props: BookPayoffLedgerCardProps) {
  const { t } = useTranslation();
  const { latestStateSnapshot, payoffLedger } = props;
  const ledgerItems = payoffLedger?.items ?? [];
  const ledgerSummary = payoffLedger?.summary;
  const snapshotForeshadows = latestStateSnapshot?.foreshadowStates ?? [];
  const pendingForeshadows = snapshotForeshadows.filter(
    (item) => item.status !== "paid_off" && item.status !== "failed",
  );
  const paidOffForeshadows = snapshotForeshadows.filter((item) => item.status === "paid_off");
  const failedForeshadows = snapshotForeshadows.filter((item) => item.status === "failed");
  const hasCanonicalLedgerContent = ledgerItems.length > 0;
  const hasSnapshotContent = snapshotForeshadows.length > 0 || Boolean(latestStateSnapshot?.summary?.trim());

  return (
    <Card>
      <CardContent className="p-0">
        <details className="group">
          <summary className="cursor-pointer list-none p-5">
            <CollapsibleSummary
              title={t("novel:outline.bookPayoffLedger.title")}
              description={t("novel:outline.bookPayoffLedger.description")}
              collapsedLabel={t("novel:outline.bookPayoffLedger.expandLabel")}
              expandedLabel={t("novel:outline.bookPayoffLedger.collapseLabel")}
              meta={(
                <>
                  <Badge variant="outline">{t("novel:outline.bookPayoffLedger.summary.pending", { count: ledgerSummary?.pendingCount ?? 0 })}</Badge>
                  <Badge variant={ledgerSummary?.urgentCount ? "secondary" : "outline"}>
                    {t("novel:outline.bookPayoffLedger.summary.urgent", { count: ledgerSummary?.urgentCount ?? 0 })}
                  </Badge>
                  <Badge variant={ledgerSummary?.overdueCount ? "secondary" : "outline"}>
                    {t("novel:outline.bookPayoffLedger.summary.overdue", { count: ledgerSummary?.overdueCount ?? 0 })}
                  </Badge>
                  <Badge variant="outline">{t("novel:outline.bookPayoffLedger.summary.paidOff", { count: ledgerSummary?.paidOffCount ?? 0 })}</Badge>
                </>
              )}
            />
          </summary>

          <div className="space-y-3 border-t border-border/70 px-5 pb-5 pt-4">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-foreground">{t("novel:outline.bookPayoffLedger.canonical.title")}</div>
                <Badge variant="outline">{ledgerItems.length}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("novel:outline.bookPayoffLedger.canonical.description")}
              </div>
              <div className="mt-3 space-y-2 text-sm">
                {hasCanonicalLedgerContent ? (
                  ledgerItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border/70 bg-background p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-foreground">{item.title}</div>
                        <Badge
                          variant={payoffStatusVariant(item.currentStatus)}
                          className={cn(payoffStatusTone(item.currentStatus))}
                        >
                          {payoffStatusLabel(item.currentStatus, t)}
                        </Badge>
                        <Badge variant="outline">{scopeLabel(item.scopeType, t)}</Badge>
                        <Badge variant="outline">{formatWindow(item, t)}</Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">{item.summary}</div>
                      <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                        <div>
                          {t("novel:outline.bookPayoffLedger.canonical.lastTouched", {
                            value: typeof item.lastTouchedChapterOrder === "number"
                              ? t("novel:outline.bookPayoffLedger.canonical.lastTouchedChapter", { order: item.lastTouchedChapterOrder })
                              : t("novel:outline.bookPayoffLedger.canonical.lastTouchedNone"),
                          })}
                        </div>
                        <div>{t("novel:outline.bookPayoffLedger.canonical.sourceLabel", { value: sourceSummary(item, t) })}</div>
                        <div>
                          {t("novel:outline.bookPayoffLedger.canonical.riskLabel", {
                            value: item.riskSignals.length > 0
                              ? item.riskSignals
                                .slice(0, 2)
                                .map((signal) => signal.summary)
                                .join(t("novel:outline.bookPayoffLedger.canonical.riskJoin"))
                              : t("novel:outline.bookPayoffLedger.canonical.riskNone"),
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 bg-background p-3 text-xs text-muted-foreground">
                    {t("novel:outline.bookPayoffLedger.canonical.empty")}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-foreground">{t("novel:outline.bookPayoffLedger.snapshot.title")}</div>
                <Badge variant="outline">{snapshotForeshadows.length}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("novel:outline.bookPayoffLedger.snapshot.description")}
              </div>
              {latestStateSnapshot?.summary ? (
                <div className="mt-3 rounded-lg border border-border/70 bg-background p-3 text-xs text-muted-foreground">
                  {latestStateSnapshot.summary}
                </div>
              ) : null}
              <div className="mt-3 space-y-3 text-sm">
                {hasSnapshotContent ? (
                  <>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">{t("novel:outline.bookPayoffLedger.snapshot.pendingHeading")}</div>
                      {pendingForeshadows.length > 0 ? (
                        pendingForeshadows.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-border/70 bg-background p-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-medium text-foreground">{item.title}</div>
                              <Badge variant={payoffStatusVariant(item.status)}>
                                {payoffStatusLabel(item.status, t)}
                              </Badge>
                            </div>
                            {item.summary ? (
                              <div className="mt-1 text-xs text-muted-foreground">{item.summary}</div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-border/70 bg-background p-3 text-xs text-muted-foreground">
                          {t("novel:outline.bookPayoffLedger.snapshot.pendingEmpty")}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg border border-border/70 bg-background p-3">
                        <div className="text-xs text-muted-foreground">{t("novel:outline.bookPayoffLedger.snapshot.paidOffLabel")}</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">
                          {paidOffForeshadows.length}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background p-3">
                        <div className="text-xs text-muted-foreground">{t("novel:outline.bookPayoffLedger.snapshot.failedLabel")}</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">
                          {failedForeshadows.length}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 bg-background p-3 text-xs text-muted-foreground">
                    {t("novel:outline.bookPayoffLedger.snapshot.empty")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
