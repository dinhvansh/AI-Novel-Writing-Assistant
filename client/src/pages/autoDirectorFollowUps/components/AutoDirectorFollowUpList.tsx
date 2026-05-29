import { useTranslation } from "react-i18next";
import type {
  AutoDirectorFollowUpAvailableFilters,
  AutoDirectorFollowUpItem,
  AutoDirectorFollowUpPagination,
} from "@ai-novel/shared/types/autoDirectorFollowUp";
import type { AutoDirectorFollowUpSection } from "@ai-novel/shared/types/autoDirectorValidation";
import type { TaskStatus } from "@ai-novel/shared/types/task";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";

interface AutoDirectorFollowUpListPanelProps {
  items: AutoDirectorFollowUpItem[];
  pagination: AutoDirectorFollowUpPagination | null;
  filters: AutoDirectorFollowUpAvailableFilters | null;
  activeReason: string;
  activeSection: AutoDirectorFollowUpSection | "";
  activeStatus: string;
  activeSupportsBatch: string;
  selectedTaskId: string;
  selectedTaskIds: string[];
  loading: boolean;
  actionLoading: boolean;
  onSelectTask: (taskId: string) => void;
  onFilterChange: (key: "reason" | "status" | "supportsBatch" | "channelType", value: string) => void;
  onToggleSelected: (taskId: string, checked: boolean) => void;
  onPageChange: (page: number) => void;
}

export function AutoDirectorFollowUpListPanel(props: AutoDirectorFollowUpListPanelProps) {
  const { t } = useTranslation();
  const totalPages = props.pagination ? Math.max(1, Math.ceil(props.pagination.total / props.pagination.pageSize)) : 1;

  function formatStatus(status: TaskStatus): string {
    if (status === "waiting_approval") return t("autoDirectorFollowUps:list.status.waiting_approval");
    if (status === "failed") return t("autoDirectorFollowUps:list.status.failed");
    if (status === "cancelled") return t("autoDirectorFollowUps:list.status.cancelled");
    if (status === "running") return t("autoDirectorFollowUps:list.status.running");
    if (status === "queued") return t("autoDirectorFollowUps:list.status.queued");
    return t("autoDirectorFollowUps:list.status.succeeded");
  }

  function formatSection(section: AutoDirectorFollowUpSection): string {
    return t(`autoDirectorFollowUps:overview.sections.${section}`);
  }

  function formatActiveSection(section: AutoDirectorFollowUpSection | ""): string {
    return section ? formatSection(section) : t("autoDirectorFollowUps:overview.sections.all");
  }

  function buildChannelBadges(item: AutoDirectorFollowUpItem): string[] {
    const labels: string[] = [];
    if (item.channelCapabilities.dingtalk) labels.push(t("autoDirectorFollowUps:list.channelBadge.dingtalk"));
    if (item.channelCapabilities.wecom) labels.push(t("autoDirectorFollowUps:list.channelBadge.wecom"));
    return labels;
  }

  function formatItemType(item: AutoDirectorFollowUpItem): string {
    return item.itemType === "auto_approval_record"
      ? t("autoDirectorFollowUps:list.itemType.auto_approval_record")
      : t("autoDirectorFollowUps:list.itemType.default");
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle className={`${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText} text-base`}>{formatActiveSection(props.activeSection)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={AUTO_DIRECTOR_MOBILE_CLASSES.followUpFilterGrid}>
          <Select value={props.activeReason || "__all__"} onValueChange={(value) => props.onFilterChange("reason", value === "__all__" ? "" : value)}>
            <SelectTrigger className={AUTO_DIRECTOR_MOBILE_CLASSES.followUpFilterTrigger}>
              <SelectValue placeholder={t("autoDirectorFollowUps:list.allReasons")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("autoDirectorFollowUps:list.allReasons")}</SelectItem>
              {(props.filters?.reasons ?? []).map((reason) => (
                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={props.activeStatus || "__all__"} onValueChange={(value) => props.onFilterChange("status", value === "__all__" ? "" : value)}>
            <SelectTrigger className={AUTO_DIRECTOR_MOBILE_CLASSES.followUpFilterTrigger}>
              <SelectValue placeholder={t("autoDirectorFollowUps:list.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("autoDirectorFollowUps:list.allStatuses")}</SelectItem>
              {(props.filters?.statuses ?? []).map((status) => (
                <SelectItem key={status} value={status}>{formatStatus(status)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={props.activeSupportsBatch || "__all__"} onValueChange={(value) => props.onFilterChange("supportsBatch", value === "__all__" ? "" : value)}>
            <SelectTrigger className={AUTO_DIRECTOR_MOBILE_CLASSES.followUpFilterTrigger}>
              <SelectValue placeholder={t("autoDirectorFollowUps:list.allBatch")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("autoDirectorFollowUps:list.allBatch")}</SelectItem>
              <SelectItem value="true">{t("autoDirectorFollowUps:list.batchOnly")}</SelectItem>
              <SelectItem value="false">{t("autoDirectorFollowUps:list.noBatch")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {props.loading ? (
            <div className={`rounded-md border border-dashed p-6 text-sm text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{t("autoDirectorFollowUps:list.loading")}</div>
          ) : null}

          {!props.loading && props.items.length === 0 ? (
            <div className={`rounded-md border border-dashed p-6 text-sm text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
              {props.activeSection === "auto_progress"
                ? t("autoDirectorFollowUps:list.emptyAutoProgress")
                : props.activeSection === "replaced"
                  ? t("autoDirectorFollowUps:list.emptyReplaced")
                  : t("autoDirectorFollowUps:list.emptyDefault")}
            </div>
          ) : null}

          {props.items.map((item) => {
            const itemKey = item.autoApprovalRecordId ?? item.directorTaskId;
            const checked = props.selectedTaskIds.includes(item.directorTaskId);
            const selected = props.selectedTaskId === item.directorTaskId;
            return (
              <button
                key={itemKey}
                type="button"
                className={cn(
                  "w-full min-w-0 rounded-xl border p-4 text-left transition-colors",
                  selected ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                )}
                onClick={() => props.onSelectTask(item.directorTaskId)}
              >
                <div className={AUTO_DIRECTOR_MOBILE_CLASSES.followUpListHeader}>
                  <div className="min-w-0 space-y-1">
                    <div className={`${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText} font-medium`}>{item.novelTitle}</div>
                    <div className={`${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText} text-sm text-muted-foreground`}>{item.followUpSummary}</div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {item.supportsBatch ? (
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => props.onToggleSelected(item.directorTaskId, event.target.checked)}
                        onClick={(event) => event.stopPropagation()}
                        disabled={props.actionLoading}
                      />
                    ) : null}
                    <Badge variant={item.priority === "P0" ? "destructive" : item.priority === "P1" ? "secondary" : "outline"}>
                      {formatSection(item.section)}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 flex min-w-0 flex-wrap gap-2 text-xs text-muted-foreground">
                  {item.section === "auto_progress" ? <Badge variant="secondary">{formatItemType(item)}</Badge> : null}
                  <Badge variant="outline">{formatStatus(item.status)}</Badge>
                  <Badge variant="outline">{item.reasonLabel}</Badge>
                  <Badge variant="outline">{item.priority}</Badge>
                  {item.executionScope ? <Badge variant="outline" className={`max-w-full whitespace-normal text-left ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{item.executionScope}</Badge> : null}
                  {item.supportsBatch ? <Badge variant="secondary">{t("autoDirectorFollowUps:list.batchBadge")}</Badge> : null}
                  {buildChannelBadges(item).map((label) => (
                    <Badge key={`${item.directorTaskId}:${label}`} variant="secondary">{label}</Badge>
                  ))}
                </div>

                <div className={`mt-2 text-xs text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                  {t("autoDirectorFollowUps:list.currentStage", { stage: item.currentStage ?? t("autoDirectorFollowUps:list.none") })} · {t("autoDirectorFollowUps:list.currentModel", { model: item.currentModel ?? t("autoDirectorFollowUps:list.none") })} · {t("autoDirectorFollowUps:list.updatedAt", { date: new Date(item.updatedAt).toLocaleString() })}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {t("autoDirectorFollowUps:list.pagination", {
              page: props.pagination?.page ?? 1,
              total: totalPages,
              count: props.pagination?.total ?? 0,
            })}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              variant="outline"
              size="sm"
              className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction}
              disabled={(props.pagination?.page ?? 1) <= 1}
              onClick={() => props.onPageChange((props.pagination?.page ?? 1) - 1)}
            >
              {t("autoDirectorFollowUps:list.prevPage")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction}
              disabled={(props.pagination?.page ?? 1) >= totalPages}
              onClick={() => props.onPageChange((props.pagination?.page ?? 1) + 1)}
            >
              {t("autoDirectorFollowUps:list.nextPage")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
