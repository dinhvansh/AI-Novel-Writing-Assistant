import { useTranslation } from "react-i18next";
import type { UnifiedTaskSummary } from "@ai-novel/shared/types/task";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCheckpoint,
  formatDate,
  formatKind,
  formatStatus,
  toStatusVariant,
} from "../taskCenterUtils";

interface TaskCenterListPanelProps {
  tasks: UnifiedTaskSummary[];
  selectedKind: string | null;
  selectedId: string | null;
  onSelectTask: (task: UnifiedTaskSummary) => void;
}

export default function TaskCenterListPanel({
  tasks,
  selectedKind,
  selectedId,
  onSelectTask,
}: TaskCenterListPanelProps) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("tasks:page.listTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => {
          const isSelected = task.kind === selectedKind && task.id === selectedId;
          return (
            <button
              key={`${task.kind}:${task.id}`}
              type="button"
              className={`w-full rounded-md border p-3 text-left transition-colors ${
                isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/40"
              }`}
              onClick={() => onSelectTask(task)}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{task.title}</div>
                <Badge variant={toStatusVariant(task.status)}>{formatStatus(task.status, t)}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatKind(task.kind, t)} | {t("tasks:detail.progress", { percent: Math.round(task.progress * 100) })}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("tasks:detail.currentStage", { stage: task.currentStage ?? t("tasks:detail.none") })} | {t("tasks:detail.currentItem", { item: task.currentItemLabel ?? t("tasks:detail.none") })}
              </div>
              {task.displayStatus || task.lastHealthyStage ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("tasks:detail.displayStatus", { status: task.displayStatus ?? formatStatus(task.status, t) })} | {t("tasks:detail.lastHealthyStage", { stage: task.lastHealthyStage ?? t("tasks:detail.none") })}
                </div>
              ) : null}
              {task.kind === "novel_workflow" ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("tasks:detail.latestCheckpoint", { checkpoint: formatCheckpoint(task.checkpointType, t, task.executionScopeLabel) })} | {t("tasks:detail.suggestContinue", { action: task.resumeAction ?? task.nextActionLabel ?? t("tasks:detail.defaultContinue") })}
                </div>
              ) : null}
              {task.blockingReason ? (
                <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {t("tasks:detail.blockingReason", { reason: task.blockingReason })}
                </div>
              ) : null}
              <div className="mt-1 text-xs text-muted-foreground">
                {t("tasks:detail.latestHeartbeat", { date: formatDate(task.heartbeatAt, t) })} | {t("tasks:detail.finishedAt", { date: formatDate(task.updatedAt, t) })}
              </div>
            </button>
          );
        })}
        {tasks.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            {t("tasks:page.noTasks")}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
