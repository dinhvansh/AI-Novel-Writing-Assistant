import { useTranslation } from "react-i18next";
import type { TaskKind, TaskStatus } from "@ai-novel/shared/types/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TaskSortMode } from "../taskCenterUtils";

interface TaskCenterFilterPanelProps {
  kind: TaskKind | "";
  status: TaskStatus | "";
  keyword: string;
  onlyAnomaly: boolean;
  sortMode: TaskSortMode;
  onKindChange: (value: TaskKind | "") => void;
  onStatusChange: (value: TaskStatus | "") => void;
  onKeywordChange: (value: string) => void;
  onOnlyAnomalyChange: (value: boolean) => void;
  onSortModeChange: (value: TaskSortMode) => void;
}

export default function TaskCenterFilterPanel({
  kind,
  status,
  keyword,
  onlyAnomaly,
  sortMode,
  onKindChange,
  onStatusChange,
  onKeywordChange,
  onOnlyAnomalyChange,
  onSortModeChange,
}: TaskCenterFilterPanelProps) {
  const { t } = useTranslation();
  return (
    <Card className="task-filter-card">
      <CardHeader className="task-filter-header">
        <CardTitle className="text-base">{t("tasks:page.filterTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="task-filter-controls grid min-w-0 grid-cols-3 gap-2 xl:grid-cols-1">
        <select
          className="task-filter-kind col-start-1 row-start-1 w-full rounded-md border bg-background px-2 py-2 text-sm xl:col-auto xl:row-auto"
          value={kind}
          onChange={(event) => onKindChange(event.target.value as TaskKind | "")}
        >
          <option value="">{t("tasks:filter.allKinds")}</option>
          <option value="book_analysis">{t("tasks:kind.book_analysis")}</option>
          <option value="novel_workflow">{t("tasks:kind.novel_workflow")}</option>
          <option value="novel_pipeline">{t("tasks:kind.novel_pipeline")}</option>
          <option value="knowledge_document">{t("tasks:kind.knowledge_document")}</option>
          <option value="image_generation">{t("tasks:kind.image_generation")}</option>
          <option value="style_extraction">{t("tasks:kind.style_extraction")}</option>
          <option value="agent_run">{t("tasks:kind.agent_run")}</option>
        </select>
        <select
          className="task-filter-status col-start-2 row-start-1 w-full rounded-md border bg-background px-2 py-2 text-sm xl:col-auto xl:row-auto"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as TaskStatus | "")}
        >
          <option value="">{t("tasks:filter.allStatuses")}</option>
          <option value="queued">{t("tasks:status.queued")}</option>
          <option value="running">{t("tasks:status.running")}</option>
          <option value="waiting_approval">{t("tasks:status.waiting_approval")}</option>
          <option value="failed">{t("tasks:status.failed")}</option>
          <option value="cancelled">{t("tasks:status.cancelled")}</option>
          <option value="succeeded">{t("tasks:status.succeeded")}</option>
        </select>
        <label className="task-filter-pill col-start-3 row-start-1 flex items-center gap-1.5 rounded-md border bg-muted/30 px-1.5 py-2 text-xs text-muted-foreground sm:gap-2 sm:px-2 sm:text-sm xl:col-auto xl:row-auto">
          <input
            type="checkbox"
            checked={onlyAnomaly}
            onChange={(event) => onOnlyAnomalyChange(event.target.checked)}
          />
          {t("tasks:filter.onlyAnomaly")}
        </label>
        <Input
          className="task-filter-keyword col-span-2 col-start-1 row-start-2 h-10 px-2 xl:col-auto xl:row-auto"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder={t("tasks:filter.keywordPlaceholder")}
        />
        <select
          className="task-filter-sort col-start-3 row-start-2 w-full rounded-md border bg-background px-2 py-2 text-sm xl:col-auto xl:row-auto"
          value={sortMode}
          onChange={(event) => onSortModeChange(event.target.value as TaskSortMode)}
        >
          <option value="updated_desc">{t("tasks:filter.sort.updated_desc")}</option>
          <option value="updated_asc">{t("tasks:filter.sort.updated_asc")}</option>
          <option value="heartbeat_desc">{t("tasks:filter.sort.heartbeat_desc")}</option>
          <option value="heartbeat_asc">{t("tasks:filter.sort.heartbeat_asc")}</option>
          <option value="default">{t("tasks:filter.sort.default")}</option>
        </select>
      </CardContent>
    </Card>
  );
}
