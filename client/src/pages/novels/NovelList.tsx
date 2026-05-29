import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { ProjectProgressStatus } from "@ai-novel/shared/types/novel";
import type { DirectorContinuationMode } from "@ai-novel/shared/types/novelDirector";
import type {
  DirectorBookAutomationAction,
  DirectorBookAutomationProjection,
} from "@ai-novel/shared/types/directorRuntime";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Gauge, RotateCcw } from "lucide-react";
import { getDirectorBookAutomationProjection } from "@/api/novelDirector";
import { continueNovelWorkflow } from "@/api/novelWorkflow";
import { deleteNovel, downloadNovelExport, getNovelList } from "@/api/novel";
import { queryKeys } from "@/api/queryKeys";
import AICockpit from "@/components/autoDirector/AICockpit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AppDialogContent,
  Dialog,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  canContinueDirector,
  canContinueChapterBatchAutoExecution,
  canEnterChapterExecution,
  getCandidateSelectionLink,
  getWorkflowBadge,
  getWorkflowDescription,
  isWorkflowRunningInBackground,
  requiresCandidateSelection,
} from "@/lib/novelWorkflowTaskUi";
import { toast } from "@/components/ui/toast";
import { resolveWorkflowContinuationFeedback } from "@/lib/novelWorkflowContinuation";
import {
  getDirectorCockpitActionHref,
  getDirectorCockpitContinuationMode,
  isDirectorCockpitContinuationAction,
} from "@/lib/directorCockpitActions";
import { useTaskRecovery } from "@/components/layout/TaskRecoveryContext";
import NovelWorkflowRunningIndicator from "./components/NovelWorkflowRunningIndicator";

type StatusFilter = "all" | "draft" | "published";
type WritingModeFilter = "all" | "original" | "continuation";
const DIRECTOR_CREATE_LINK = "/novels/create?mode=director";
const MANUAL_CREATE_LINK = "/novels/create";
const NOVEL_LIST_PAGE_SIZE = 24;

function createDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatProgressStatus(status: ProjectProgressStatus | null | undefined, t: TFunction): string {
  if (status === "completed") return t("novel:novelList.progressStatus.completed");
  if (status === "in_progress") return t("novel:novelList.progressStatus.inProgress");
  if (status === "rework") return t("novel:novelList.progressStatus.rework");
  if (status === "blocked") return t("novel:novelList.progressStatus.blocked");
  return t("novel:novelList.progressStatus.notStarted");
}

function formatTokenCount(value?: number | null): string {
  const normalized = typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;
  return new Intl.NumberFormat("zh-CN").format(normalized);
}

export default function NovelList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [writingMode, setWritingMode] = useState<WritingModeFilter>("all");
  const [cockpitNovelId, setCockpitNovelId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { candidateCount: recoveryCandidateCount, openDialog: openRecoveryDialog } = useTaskRecovery();

  const novelListQuery = useQuery({
    queryKey: queryKeys.novels.list(page, NOVEL_LIST_PAGE_SIZE),
    queryFn: () => getNovelList({ page, limit: NOVEL_LIST_PAGE_SIZE }),
    staleTime: 30_000,
    refetchInterval: (query) => {
      const items = query.state.data?.data?.items ?? [];
      return items.some((novel) => {
        const task = novel.latestAutoDirectorTask;
        return task?.status === "queued" || task?.status === "running" || task?.status === "waiting_approval";
      })
        ? 4000
        : false;
    },
  });

  const cockpitProjectionQuery = useQuery({
    queryKey: cockpitNovelId
      ? queryKeys.novels.directorBookAutomation(cockpitNovelId)
      : ["novels", "director-book-automation", "idle"],
    queryFn: () => getDirectorBookAutomationProjection(cockpitNovelId ?? ""),
    enabled: Boolean(cockpitNovelId),
    staleTime: 10_000,
    refetchInterval: (query) => {
      return query.state.data?.data?.projection.displayState === "processing" ? 4000 : false;
    },
  });

  const deleteNovelMutation = useMutation({
    mutationFn: (id: string) => deleteNovel(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.novels.all });
      toast.success(t("novel:novelList.deleteSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("novel:novelList.deleteError"));
    },
  });

  const downloadNovelMutation = useMutation({
    mutationFn: (input: { novelId: string; novelTitle: string }) => downloadNovelExport(
      input.novelId,
      "txt",
      "full",
      input.novelTitle,
    ),
    onSuccess: ({ blob, fileName }) => {
      createDownload(blob, fileName);
      toast.success(t("novel:novelList.exportSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("novel:novelList.exportError"));
    },
  });

  const continueWorkflowMutation = useMutation({
    mutationFn: async (input: {
      taskId: string;
      mode?: DirectorContinuationMode;
    }) => continueNovelWorkflow(input.taskId, input.mode ? { continuationMode: input.mode } : undefined),
    onSuccess: async (response, input) => {
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: queryKeys.novels.all }),
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      ];
      if (cockpitNovelId) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: queryKeys.novels.directorBookAutomation(cockpitNovelId) }),
        );
      }
      await Promise.all(invalidations);
      const feedback = resolveWorkflowContinuationFeedback(response.data, {
        mode: input.mode,
      });
      if (feedback.tone === "error") {
        toast.error(feedback.message);
        return;
      }
      toast.success(feedback.message);
    },
    onError: (error, input) => {
      toast.error(
        error instanceof Error
          ? error.message
          : input.mode === "auto_execute_range"
            ? t("novel:novelList.continueAutoExecError")
            : t("novel:novelList.continueDirectorError"),
      );
    },
  });

  const allNovels = novelListQuery.data?.data?.items ?? [];
  const totalPages = novelListQuery.data?.data?.totalPages ?? 1;
  const totalNovels = novelListQuery.data?.data?.total ?? 0;
  const selectedCockpitNovel = allNovels.find((item) => item.id === cockpitNovelId) ?? null;
  const cockpitProjection = cockpitProjectionQuery.data?.data?.projection ?? null;

  const novels = useMemo(() => {
    return allNovels.filter((item) => {
      if (status !== "all" && item.status !== status) {
        return false;
      }
      if (writingMode !== "all" && item.writingMode !== writingMode) {
        return false;
      }
      return true;
    });
  }, [allNovels, status, writingMode]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleDelete = (novelId: string, title: string) => {
    const confirmed = window.confirm(t("novel:novelList.deleteConfirm", { title }));
    if (!confirmed) {
      return;
    }
    deleteNovelMutation.mutate(novelId);
  };

  const stopCardClick = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const openNovelEditor = (novelId: string) => {
    navigate(`/novels/${novelId}/edit`);
  };

  const handleCockpitAction = (
    projection: DirectorBookAutomationProjection,
    action: DirectorBookAutomationAction,
  ) => {
    const taskId = action.commandPayload?.taskId ?? action.target.taskId ?? projection.latestTask?.id;
    if (taskId && isDirectorCockpitContinuationAction(action)) {
      continueWorkflowMutation.mutate({
        taskId,
        mode: getDirectorCockpitContinuationMode(action),
      });
      return;
    }
    setCockpitNovelId(null);
    navigate(getDirectorCockpitActionHref(projection, action));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant={status === "all" ? "default" : "secondary"}
              onClick={() => setStatus("all")}
            >
              {t("novel:novelList.filter.all")}
            </Button>
            <Button
              variant={status === "draft" ? "default" : "secondary"}
              onClick={() => setStatus("draft")}
            >
              {t("novel:novelList.filter.draft")}
            </Button>
            <Button
              variant={status === "published" ? "default" : "secondary"}
              onClick={() => setStatus("published")}
            >
              {t("novel:novelList.filter.published")}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={writingMode === "all" ? "default" : "secondary"}
              onClick={() => setWritingMode("all")}
            >
              {t("novel:novelList.filter.writingModeAll")}
            </Button>
            <Button
              size="sm"
              variant={writingMode === "original" ? "default" : "secondary"}
              onClick={() => setWritingMode("original")}
            >
              {t("novel:novelList.filter.original")}
            </Button>
            <Button
              size="sm"
              variant={writingMode === "continuation" ? "default" : "secondary"}
              onClick={() => setWritingMode("continuation")}
            >
              {t("novel:novelList.filter.continuation")}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            第 {page} / {totalPages} 页，共 {totalNovels} 本
          </Badge>
          {recoveryCandidateCount > 0 ? (
            <Button variant="outline" onClick={openRecoveryDialog}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t("novel:novelList.pendingRecovery")}
              <Badge variant="secondary">{recoveryCandidateCount}</Badge>
            </Button>
          ) : null}
          <Button asChild>
            <Link to={DIRECTOR_CREATE_LINK}>{t("novel:novelList.createWithDirector")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={MANUAL_CREATE_LINK}>{t("novel:novelList.createManual")}</Link>
          </Button>
        </div>
      </div>

      {novelListQuery.isPending ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`loading-${index}`} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-2/3 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-20 rounded bg-muted" />
                <div className="flex gap-2">
                  <div className="h-9 w-24 rounded bg-muted" />
                  <div className="h-9 w-20 rounded bg-muted" />
                  <div className="h-9 w-20 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : novelListQuery.isError ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("novel:novelList.loadError.title")}</CardTitle>
            <CardDescription>{t("novel:novelList.loadError.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void novelListQuery.refetch()}>{t("novel:novelList.loadError.retry")}</Button>
          </CardContent>
        </Card>
      ) : novels.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{allNovels.length === 0 ? t("novel:novelList.empty.title") : t("novel:novelList.empty.filteredTitle")}</CardTitle>
            <CardDescription>
              {allNovels.length === 0
                ? t("novel:novelList.empty.description")
                : t("novel:novelList.empty.filteredDescription")}
            </CardDescription>
          </CardHeader>
          {allNovels.length === 0 ? (
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to={DIRECTOR_CREATE_LINK}>{t("novel:novelList.createWithDirector")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={MANUAL_CREATE_LINK}>{t("novel:novelList.createManual")}</Link>
              </Button>
            </CardContent>
          ) : null}
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {novels.map((novel) => {
            const workflowTask = novel.latestAutoDirectorTask ?? null;
            const workflowCurrentAction = workflowTask?.currentItemLabel?.trim() || "";
            const workflowBadge = getWorkflowBadge(workflowTask);
            const workflowDescription = getWorkflowDescription(workflowTask);
            const isWorkflowRunning = isWorkflowRunningInBackground(workflowTask);
            const isWorkflowPending = continueWorkflowMutation.isPending
              && continueWorkflowMutation.variables?.taskId === workflowTask?.id;
            const isDownloadPending = downloadNovelMutation.isPending
              && downloadNovelMutation.variables?.novelId === novel.id;
            const isDeletePending = deleteNovelMutation.isPending
              && deleteNovelMutation.variables === novel.id;

            return (
              <Card
                key={novel.id}
                role="link"
                tabIndex={0}
                className="cursor-pointer transition hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={() => openNovelEditor(novel.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openNovelEditor(novel.id);
                  }
                }}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="line-clamp-1 text-lg transition hover:text-primary">
                      {novel.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Badge variant={novel.status === "published" ? "default" : "secondary"}>
                        {novel.status === "published" ? t("novel:novelList.card.published") : t("novel:novelList.card.draft")}
                      </Badge>
                      {novel.writingMode === "continuation" ? (
                        <Badge variant="outline">{t("novel:novelList.card.continuation")}</Badge>
                      ) : (
                        <Badge variant="outline">{t("novel:novelList.card.original")}</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {novel.description || t("novel:novelList.card.noDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    {t("novel:novelList.card.stats", { chapters: novel._count.chapters, characters: novel._count.characters, tokens: formatTokenCount(
                      novel.tokenUsage?.totalTokens) })}
                  </div>

                  {workflowTask ? (
                    <div
                      className={cn(
                        "rounded-xl border p-3 transition-colors",
                        isWorkflowRunning
                          ? "border-primary/20 bg-primary/[0.04] shadow-sm"
                          : "bg-muted/20",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {workflowBadge ? (
                          <Badge variant={workflowBadge.variant}>{workflowBadge.label}</Badge>
                        ) : null}
                        <Badge variant="outline">进度 {Math.round(workflowTask.progress * 100)}%</Badge>
                        {isWorkflowRunning ? (
                          <Badge variant="outline">{t("novel:novelList.card.runningInBackground")}</Badge>
                        ) : null}
                      </div>
                      {workflowDescription ? (
                        <div className="mt-2 text-sm text-muted-foreground">{workflowDescription}</div>
                      ) : null}
                      {isWorkflowRunning ? (
                        <NovelWorkflowRunningIndicator
                          className="mt-3"
                          progress={workflowTask.progress}
                          label={workflowCurrentAction || t("novel:novelList.card.aiRunning")}
                        />
                      ) : null}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {t("novel:novelList.card.currentStage", { stage: workflowTask.currentStage ?? t("novel:novelList.card.defaultStage") })}{workflowCurrentAction ? ` · ${workflowCurrentAction}` : ""}
                      </div>
                      {workflowTask.lastHealthyStage ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {t("novel:novelList.card.lastHealthyStage", { stage: workflowTask.lastHealthyStage })}
                        </div>
                      ) : null}
                      {workflowTask.resumeAction ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {t("novel:novelList.card.resumeAction", { action: workflowTask.resumeAction })}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed bg-muted/10 p-3 text-xs text-muted-foreground">
                      {t("novel:novelList.card.noDirectorTask")}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{t("novel:novelList.card.projectStatus", { status: formatProgressStatus(novel.projectStatus, t) })}</span>
                    <span>{t("novel:novelList.card.storylineStatus", { status: formatProgressStatus(novel.storylineStatus, t) })}</span>
                    <span>{t("novel:novelList.card.outlineStatus", { status: formatProgressStatus(novel.outlineStatus, t) })}</span>
                    <span>{t("novel:novelList.card.resourceScore", { score: novel.resourceReadyScore ?? 0 })}</span>
                  </div>

                  {novel.world ? (
                    <div className="text-xs text-muted-foreground">
                      {t("novel:novelList.card.world", { name: novel.world.name })}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        stopCardClick(event);
                        setCockpitNovelId(novel.id);
                      }}
                    >
                      <Gauge className="h-4 w-4" aria-hidden="true" />
                      AI 驾驶舱
                    </Button>

                    {canContinueChapterBatchAutoExecution(workflowTask) ? (
                      <Button
                        size="sm"
                        onClick={(event) => {
                          stopCardClick(event);
                          if (!workflowTask) {
                            return;
                          }
                          continueWorkflowMutation.mutate({
                            taskId: workflowTask.id,
                            mode: "auto_execute_range",
                          });
                        }}
                        disabled={isWorkflowPending}
                      >
                        {isWorkflowPending ? t("novel:novelList.card.continuingExec") : (workflowTask?.resumeAction ?? t("novel:novelList.card.continueAutoExec", { scope: workflowTask?.executionScopeLabel ?? t("novel:novelList.card.defaultScope") }))}
                      </Button>
                    ) : canContinueDirector(workflowTask) ? (
                      <Button
                        size="sm"
                        onClick={(event) => {
                          stopCardClick(event);
                          if (!workflowTask) {
                            return;
                          }
                          continueWorkflowMutation.mutate({
                            taskId: workflowTask.id,
                          });
                        }}
                        disabled={isWorkflowPending}
                      >
                        {isWorkflowPending ? t("novel:novelList.card.continuing") : (workflowTask?.resumeAction ?? t("novel:novelList.card.continueDirector"))}
                      </Button>
                    ) : requiresCandidateSelection(workflowTask) ? (
                      <Button asChild size="sm">
                        <Link to={getCandidateSelectionLink(workflowTask!.id)} onClick={stopCardClick}>
                          {workflowTask!.resumeAction ?? t("novel:novelList.card.confirmDirection")}
                        </Link>
                      </Button>
                    ) : canEnterChapterExecution(workflowTask) ? (
                      <Button asChild size="sm">
                        <Link to={`/novels/${novel.id}/edit`} onClick={stopCardClick}>{t("novel:novelList.card.enterChapterExec")}</Link>
                      </Button>
                    ) : workflowTask ? (
                      <Button asChild size="sm">
                        <Link to={`/novels/${novel.id}/edit?directorTaskId=${workflowTask.id}`} onClick={stopCardClick}>{t("novel:novelList.card.viewProgress")}</Link>
                      </Button>
                    ) : null}

                    {workflowTask ? (
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/novels/${novel.id}/edit?directorTaskId=${workflowTask.id}&taskPanel=1`} onClick={stopCardClick}>{t("novel:novelList.card.execDetails")}</Link>
                      </Button>
                    ) : null}

                    <Button asChild size="sm" variant="outline">
                      <Link to={`/novels/${novel.id}/preview`} onClick={stopCardClick}>
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                        预览
                      </Link>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        stopCardClick(event);
                        downloadNovelMutation.mutate({
                          novelId: novel.id,
                          novelTitle: novel.title,
                        });
                      }}
                      disabled={isDownloadPending}
                    >
                      {isDownloadPending ? t("novel:novelList.card.exporting") : t("novel:novelList.card.export")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(event) => {
                        stopCardClick(event);
                        handleDelete(novel.id, novel.title);
                      }}
                      disabled={isDeletePending}
                    >
                      {isDeletePending ? t("novel:novelList.card.deleting") : t("novel:novelList.card.delete")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1 || novelListQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                上一页
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages || novelListQuery.isFetching}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                下一页
              </Button>
            </div>
          ) : null}
        </>
      )}

      <Dialog
        open={Boolean(cockpitNovelId)}
        onOpenChange={(open) => {
          if (!open) {
            setCockpitNovelId(null);
          }
        }}
      >
        <AppDialogContent
          className="max-w-2xl"
          title={t("novel:novelList.cockpit.title")}
          description={
            selectedCockpitNovel?.title
              ? t("novel:novelList.cockpit.descriptionWithTitle", { title: selectedCockpitNovel.title })
              : t("novel:novelList.cockpit.description")
          }
        >
          {cockpitProjectionQuery.isPending ? (
            <div className="rounded-lg border p-3 text-sm text-muted-foreground">
              {t("novel:novelList.cockpit.loading")}
            </div>
          ) : cockpitProjectionQuery.isError ? (
            <div className="rounded-lg border p-3">
              <div className="text-sm text-muted-foreground">{t("novel:novelList.cockpit.loadError")}</div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => void cockpitProjectionQuery.refetch()}
              >
                {t("novel:novelList.cockpit.reload")}
              </Button>
            </div>
          ) : cockpitProjection ? (
            <AICockpit
              projection={cockpitProjection}
              mode="focusedNovel"
              isActionPending={continueWorkflowMutation.isPending}
              onAction={handleCockpitAction}
              onOpenNovel={(projection) => {
                setCockpitNovelId(null);
                navigate(projection.focusNovel.href);
              }}
            />
          ) : (
            <AICockpit fallbackSummary={t("novel:novelList.cockpit.noTask")} />
          )}
        </AppDialogContent>
      </Dialog>
    </div>
  );
}
