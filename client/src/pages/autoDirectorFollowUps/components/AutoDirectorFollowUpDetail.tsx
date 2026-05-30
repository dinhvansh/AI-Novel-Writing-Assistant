import { useTranslation } from "react-i18next";
import type {
  AutoDirectorAction,
  AutoDirectorFollowUpDetail,
  AutoDirectorFollowUpItem,
} from "@ai-novel/shared/types/autoDirectorFollowUp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";

interface AutoDirectorFollowUpDetailPanelProps {
  detail: AutoDirectorFollowUpDetail | null;
  selectedItem: AutoDirectorFollowUpItem | null;
  loading: boolean;
  actionLoading: boolean;
  onExecuteAction: (item: AutoDirectorFollowUpItem, action: AutoDirectorAction) => void | Promise<void>;
  onRefreshValidation: () => void | Promise<void>;
  onSafeFix: () => void | Promise<void>;
}

export function AutoDirectorFollowUpDetailPanel({
  detail,
  selectedItem,
  loading,
  actionLoading,
  onExecuteAction,
  onRefreshValidation,
  onSafeFix,
}: AutoDirectorFollowUpDetailPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">{t("autoDirectorFollowUps:detail.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className={`rounded-md border border-dashed p-6 text-sm text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{t("autoDirectorFollowUps:detail.loading")}</div>
        ) : null}

        {!loading && (!detail || !selectedItem) ? (
          <div className={`rounded-md border border-dashed p-6 text-sm text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{t("autoDirectorFollowUps:detail.noSelection")}</div>
        ) : null}

        {detail && selectedItem ? (
          <>
            <div className="space-y-1">
              <div className={`${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText} font-medium`}>{selectedItem.novelTitle}</div>
              <div className={`${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText} text-sm text-muted-foreground`}>{selectedItem.reasonLabel}</div>
            </div>

            <div className={`space-y-2 text-sm text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
              <div>{t("autoDirectorFollowUps:detail.blockingReason", { reason: detail.blockingReason ?? t("autoDirectorFollowUps:detail.none") })}</div>
              <div>{t("autoDirectorFollowUps:detail.nextStep", { suggestion: detail.nextStepSuggestion ?? t("autoDirectorFollowUps:detail.defaultNextStep") })}</div>
              <div>{t("autoDirectorFollowUps:detail.checkpointSummary", { summary: detail.checkpointSummary ?? t("autoDirectorFollowUps:detail.none") })}</div>
              <div>{t("autoDirectorFollowUps:detail.currentModel", { model: detail.currentModel ?? t("autoDirectorFollowUps:detail.none") })}</div>
              <div>{t("autoDirectorFollowUps:detail.originUrl", { url: detail.originDetailUrl })}</div>
            </div>

            {selectedItem.section === "needs_validation" ? (
              <div className={`space-y-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-950 ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <div className="font-medium">{t("autoDirectorFollowUps:detail.validationTitle")}</div>
                    <div className="mt-1 text-xs">
                      {t("autoDirectorFollowUps:detail.validationHint")}
                    </div>
                  </div>
                </div>
                {(detail.validationSummary?.blockingReasons.length ?? 0) > 0 ? (
                  <div className="space-y-1 text-xs">
                    {detail.validationSummary?.blockingReasons.map((reason) => (
                      <div key={reason}>{t("autoDirectorFollowUps:detail.blockingPrefix", { reason })}</div>
                    ))}
                  </div>
                ) : null}
                {(detail.validationSummary?.warnings.length ?? 0) > 0 ? (
                  <div className="space-y-1 text-xs">
                    {detail.validationSummary?.warnings.map((warning) => (
                      <div key={warning}>{t("autoDirectorFollowUps:detail.warningPrefix", { warning })}</div>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction}
                    disabled={actionLoading}
                    onClick={() => void onRefreshValidation()}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {t("autoDirectorFollowUps:detail.refreshValidation")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    className={`${AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction} border-yellow-400 bg-yellow-100 text-yellow-950 hover:bg-yellow-200 hover:text-yellow-950`}
                    title={t("autoDirectorFollowUps:detail.safeFixTitle")}
                    onClick={() => void onSafeFix()}
                  >
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    {t("autoDirectorFollowUps:detail.safeFix")}
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("autoDirectorFollowUps:detail.availableActions")}</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {detail.availableActions.map((action) => (
                  <Button
                    key={action.code}
                    variant={action.kind === "mutation" ? "default" : "outline"}
                    size="sm"
                    className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction}
                    disabled={actionLoading}
                    onClick={() => void onExecuteAction(selectedItem, action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("autoDirectorFollowUps:detail.milestones")}</div>
              <div className="space-y-2">
                {detail.milestones.length === 0 ? (
                  <div className="text-sm text-muted-foreground">{t("autoDirectorFollowUps:detail.noMilestones")}</div>
                ) : detail.milestones.map((milestone) => (
                  <div key={`${milestone.at}:${milestone.label}`} className={`rounded-md border p-3 text-sm ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                    <div className="font-medium">{milestone.label}</div>
                    <div className="text-xs text-muted-foreground">{new Date(milestone.at).toLocaleString()}</div>
                    {milestone.summary ? (
                      <div className="mt-1 text-xs text-muted-foreground">{milestone.summary}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("autoDirectorFollowUps:detail.channelDeliveries")}</div>
              <div className="space-y-2">
                {(detail.channelDeliveries?.length ?? 0) === 0 ? (
                  <div className="text-sm text-muted-foreground">{t("autoDirectorFollowUps:detail.noDeliveries")}</div>
                ) : detail.channelDeliveries?.map((delivery) => (
                  <div key={`${delivery.channelType}:${delivery.eventType}`} className={`rounded-md border p-3 text-sm ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={delivery.status === "delivered" ? "secondary" : (delivery.status === "failed" ? "destructive" : "outline")}>
                        {t(`autoDirectorFollowUps:detail.channelType.${delivery.channelType}`)}
                      </Badge>
                      <Badge variant="outline">{t(`autoDirectorFollowUps:detail.deliveryStatus.${delivery.status}`)}</Badge>
                      <span className="text-xs text-muted-foreground">{t(`autoDirectorFollowUps:detail.eventType.${delivery.eventType}`)}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {t("autoDirectorFollowUps:detail.deliveryTarget", { target: delivery.target ?? t("autoDirectorFollowUps:detail.notRecorded") })} | {t("autoDirectorFollowUps:detail.deliveryResponse", { code: delivery.responseStatus ?? t("autoDirectorFollowUps:detail.notRecorded") })} | {t("autoDirectorFollowUps:detail.deliveryTime", { time: delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleString() : t("autoDirectorFollowUps:detail.notDelivered") })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
