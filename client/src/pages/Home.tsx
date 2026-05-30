import type { KeyboardEvent, MouseEvent } from "react";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { continueNovelWorkflow } from "@/api/novelWorkflow";
import { getNovelList } from "@/api/novel";
import type { NovelListResponse } from "@/api/novel/shared";
import { queryKeys } from "@/api/queryKeys";
import { getTaskOverview } from "@/api/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  canContinueDirector,
  canContinueChapterBatchAutoExecution,
  canEnterChapterExecution,
  getCandidateSelectionLink,
  getWorkflowBadge,
  getWorkflowDescription,
  isWorkflowRunningInBackground,
  isWorkflowActionRequired,
  requiresCandidateSelection,
} from "@/lib/novelWorkflowTaskUi";
import { toast } from "@/components/ui/toast";
import { resolveWorkflowContinuationFeedback } from "@/lib/novelWorkflowContinuation";

const HOME_NOVEL_FETCH_LIMIT = 12;
const HOME_RECENT_LIMIT = 6;
const DIRECTOR_CREATE_LINK = "/novels/create?mode=director";
const MANUAL_CREATE_LINK = "/novels/create";

type HomeNovelItem = NovelListResponse["items"][number];

function MetricCard(props: {
  title: string;
  value: string | number;
  hint: string;
  pending?: boolean;
}) {
  const { title, value, hint, pending = false } = props;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{pending ? "--" : value}</CardTitle>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </CardHeader>
    </Card>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const formatDate = (value: string | undefined): string => {
    if (!value) {
      return t("novel:home.labels.noTime");
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return t("novel:home.labels.noTime");
    }
    return date.toLocaleString();
  };

  const getNovelLeadSummary = (novel: HomeNovelItem): string => {
    const workflowDescription = getWorkflowDescription(novel.latestAutoDirectorTask ?? null);
    if (workflowDescription) {
      return workflowDescription;
    }
    if (novel.description?.trim()) {
      return novel.description.trim();
    }
    if (novel.world?.name) {
      return t("novel:home.labels.boundWorld", { name: novel.world.name });
    }
    return t("novel:home.labels.noWorld");
  };

  const taskQuery = useQuery({
    queryKey: queryKeys.tasks.overview,
    queryFn: getTaskOverview,
    staleTime: 30_000,
    refetchInterval: (query) => {
      const overview = query.state.data?.data;
      return (overview?.queuedCount ?? 0) > 0 || (overview?.runningCount ?? 0) > 0 ? 4000 : false;
    },
  });

  const novelQuery = useQuery({
    queryKey: queryKeys.novels.list(1, HOME_NOVEL_FETCH_LIMIT),
    queryFn: () => getNovelList({ page: 1, limit: HOME_NOVEL_FETCH_LIMIT }),
    staleTime: 30_000,
  });

  const continueWorkflowMutation = useMutation({
    mutationFn: async (input: {
      taskId: string;
      mode?: "resume" | "auto_execute_range";
    }) => continueNovelWorkflow(input.taskId, input.mode ? { continuationMode: input.mode } : undefined),
    onSuccess: async (response, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.novels.all }),
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      ]);
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
            ? t("novel:home.actions.errorFallbackContinueRange")
            : t("novel:home.actions.errorFallbackContinueDirector"),
      );
    },
  });

  const allNovels = novelQuery.data?.data?.items ?? [];
  const hasNovels = allNovels.length > 0;

  function getNovelPriorityScore(novel: HomeNovelItem): number {
    const task = novel.latestAutoDirectorTask ?? null;
    if (canContinueChapterBatchAutoExecution(task)) {
      return 0;
    }
    if (requiresCandidateSelection(task)) {
      return 1;
    }
    if (canContinueDirector(task)) {
      return 2;
    }
    if (task?.status === "running" || task?.status === "queued") {
      return 3;
    }
    if (canEnterChapterExecution(task)) {
      return 4;
    }
    if (task?.status === "failed" || task?.status === "cancelled") {
      return 5;
    }
    return 6;
  }

  const liveWorkflowCount = useMemo(
    () => allNovels.filter((novel) => isWorkflowRunningInBackground(novel.latestAutoDirectorTask ?? null)).length,
    [allNovels],
  );
  const actionRequiredCount = useMemo(
    () => allNovels.filter((novel) => isWorkflowActionRequired(novel.latestAutoDirectorTask ?? null)).length,
    [allNovels],
  );
  const readyForExecutionCount = useMemo(
    () => allNovels.filter((novel) => canEnterChapterExecution(novel.latestAutoDirectorTask ?? null)).length,
    [allNovels],
  );
  const failedTaskCount = useMemo(
    () => taskQuery.data?.data?.failedCount ?? 0,
    [taskQuery.data?.data?.failedCount],
  );
  const primaryNovel = useMemo(() => {
    if (allNovels.length === 0) {
      return null;
    }
    return allNovels.reduce<HomeNovelItem | null>((selected, current) => {
      if (!selected) {
        return current;
      }
      const selectedPriority = getNovelPriorityScore(selected);
      const currentPriority = getNovelPriorityScore(current);
      return currentPriority < selectedPriority ? current : selected;
    }, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNovels]);
  const recentNovels = useMemo(
    () => allNovels.slice(0, HOME_RECENT_LIMIT),
    [allNovels],
  );

  const stopCardClick = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const openNovelEditor = (novelId: string) => {
    navigate(`/novels/${novelId}/edit`);
  };

  const renderNovelPrimaryAction = (
    novel: HomeNovelItem,
    options?: {
      size?: "default" | "sm" | "lg";
      stopPropagation?: boolean;
    },
  ) => {
    const { size = "sm", stopPropagation = false } = options ?? {};
    const task = novel.latestAutoDirectorTask ?? null;
    const isWorkflowPending = continueWorkflowMutation.isPending
      && continueWorkflowMutation.variables?.taskId === task?.id;

    const handleActionClick = (event: MouseEvent<HTMLElement>) => {
      if (stopPropagation) {
        stopCardClick(event);
      }
    };

    if (canContinueChapterBatchAutoExecution(task)) {
      const scopeLabel = task?.executionScopeLabel ?? t("novel:home.actions.currentChapterRange");
      const defaultLabel = t("novel:home.actions.continueChapterRangeDefault", { scope: scopeLabel });
      return (
        <Button
          size={size}
          onClick={(event) => {
            handleActionClick(event);
            if (!task) {
              return;
            }
            continueWorkflowMutation.mutate({
              taskId: task.id,
              mode: "auto_execute_range",
            });
          }}
          disabled={isWorkflowPending}
        >
          {isWorkflowPending ? t("novel:home.actions.continueExecuting") : (task?.resumeAction ?? defaultLabel)}
        </Button>
      );
    }

    if (canContinueDirector(task)) {
      return (
        <Button
          size={size}
          onClick={(event) => {
            handleActionClick(event);
            if (!task) {
              return;
            }
            continueWorkflowMutation.mutate({
              taskId: task.id,
            });
          }}
          disabled={isWorkflowPending}
        >
          {isWorkflowPending ? t("novel:home.actions.continueDirector") : (task?.resumeAction ?? t("novel:home.actions.continueDirectorDefault"))}
        </Button>
      );
    }

    if (requiresCandidateSelection(task)) {
      return (
        <Button asChild size={size}>
          <Link
            to={getCandidateSelectionLink(task!.id)}
            onClick={stopPropagation ? stopCardClick : undefined}
          >
            {task!.resumeAction ?? t("novel:home.actions.selectDirection")}
          </Link>
        </Button>
      );
    }

    if (canEnterChapterExecution(task)) {
      return (
        <Button asChild size={size}>
          <Link
            to={`/novels/${novel.id}/edit`}
            onClick={stopPropagation ? stopCardClick : undefined}
          >
            {t("novel:home.actions.enterChapterExecution")}
          </Link>
        </Button>
      );
    }

    if (task) {
      return (
        <Button asChild size={size}>
          <Link
            to={`/novels/${novel.id}/edit?directorTaskId=${task.id}`}
            onClick={stopPropagation ? stopCardClick : undefined}
          >
            {t("novel:home.actions.viewProgress")}
          </Link>
        </Button>
      );
    }

    return (
      <Button asChild size={size}>
        <Link
          to={`/novels/${novel.id}/edit`}
          onClick={stopPropagation ? stopCardClick : undefined}
        >
          {t("novel:home.actions.editNovel")}
        </Link>
      </Button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="home-status-summary-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t("novel:home.metrics.liveRunning")}
          value={liveWorkflowCount}
          hint={t("novel:home.metrics.liveRunningHint")}
          pending={novelQuery.isPending}
        />
        <MetricCard
          title={t("novel:home.metrics.actionRequired")}
          value={actionRequiredCount}
          hint={t("novel:home.metrics.actionRequiredHint")}
          pending={novelQuery.isPending}
        />
        <MetricCard
          title={t("novel:home.metrics.readyForExecution")}
          value={readyForExecutionCount}
          hint={t("novel:home.metrics.readyForExecutionHint")}
          pending={novelQuery.isPending}
        />
        <MetricCard
          title={t("novel:home.metrics.failedTasks")}
          value={failedTaskCount}
          hint={t("novel:home.metrics.failedTasksHint")}
          pending={taskQuery.isPending}
        />
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{t("novel:home.starter.beginnerTag")}</Badge>
            <Badge variant="outline">{t("novel:home.starter.lowBarrierTag")}</Badge>
          </div>
          <CardTitle>
            {hasNovels ? t("novel:home.starter.ctaTitleExisting") : t("novel:home.starter.ctaTitleNew")}
          </CardTitle>
          <CardDescription>
            {t("novel:home.starter.ctaDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{t("novel:home.starter.fitFor1")}</span>
            <span>{t("novel:home.starter.fitFor2")}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="lg">
              <Link to={DIRECTOR_CREATE_LINK}>{t("novel:home.starter.directorCta")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={MANUAL_CREATE_LINK}>{t("novel:home.starter.manualCta")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/help">{t("novel:home.starter.helpCta")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("novel:home.primary.title")}</CardTitle>
          <CardDescription>{t("novel:home.primary.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {novelQuery.isPending ? (
            <div className="space-y-4">
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              <div className="h-5 w-full animate-pulse rounded bg-muted" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-10 w-36 animate-pulse rounded bg-muted" />
                <div className="h-10 w-28 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ) : novelQuery.isError ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {t("novel:home.primary.errorTitle")}
              </div>
              <Button onClick={() => void novelQuery.refetch()}>{t("novel:home.primary.reload")}</Button>
            </div>
          ) : primaryNovel ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-3">
                  <div>
                    <div className="text-2xl font-semibold">{primaryNovel.title}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {primaryNovel.latestAutoDirectorTask ? (
                        <>
                          {(() => {
                            const workflowBadge = getWorkflowBadge(primaryNovel.latestAutoDirectorTask);
                            return workflowBadge ? (
                              <Badge variant={workflowBadge.variant}>
                                {workflowBadge.label}
                              </Badge>
                            ) : null;
                          })()}
                          <Badge variant="outline">
                            {t("novel:home.labels.progressBadge", {
                              percent: Math.round((primaryNovel.latestAutoDirectorTask.progress ?? 0) * 100),
                            })}
                          </Badge>
                        </>
                      ) : null}
                      <Badge variant={primaryNovel.status === "published" ? "default" : "secondary"}>
                        {primaryNovel.status === "published" ? t("novel:home.labels.statusPublished") : t("novel:home.labels.statusDraft")}
                      </Badge>
                      <Badge variant="outline">
                        {primaryNovel.writingMode === "continuation" ? t("novel:home.labels.modeContinuation") : t("novel:home.labels.modeOriginal")}
                      </Badge>
                    </div>
                  </div>
                  <div className="max-w-3xl text-sm text-muted-foreground">
                    {getNovelLeadSummary(primaryNovel)}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{t("novel:home.labels.updatedAt", { date: formatDate(primaryNovel.updatedAt) })}</span>
                    <span>{t("novel:home.labels.chapterCount", { count: primaryNovel._count.chapters })}</span>
                    <span>{t("novel:home.labels.characterCount", { count: primaryNovel._count.characters })}</span>
                    {primaryNovel.latestAutoDirectorTask?.currentStage ? (
                      <span>{t("novel:home.labels.currentStage", { stage: primaryNovel.latestAutoDirectorTask.currentStage })}</span>
                    ) : null}
                    {primaryNovel.latestAutoDirectorTask?.lastHealthyStage ? (
                      <span>{t("novel:home.labels.lastHealthyStage", { stage: primaryNovel.latestAutoDirectorTask.lastHealthyStage })}</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {renderNovelPrimaryAction(primaryNovel, { size: "lg" })}
                  {primaryNovel.latestAutoDirectorTask ? (
                    <Button asChild size="lg" variant="outline">
                      <Link to={`/novels/${primaryNovel.id}/edit?directorTaskId=${primaryNovel.latestAutoDirectorTask.id}&taskPanel=1`}>{t("novel:home.primary.executionDetails")}</Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" variant="outline">
                      <Link to={`/novels/${primaryNovel.id}/edit`}>{t("novel:home.primary.openProject")}</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {t("novel:home.starter.ctaDescription")}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to={DIRECTOR_CREATE_LINK}>{t("novel:home.starter.directorCta")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={MANUAL_CREATE_LINK}>{t("novel:home.starter.manualCta")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/help">{t("novel:home.starter.helpCta")}</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("novel:home.quickActions.title")}</CardTitle>
          <CardDescription>{t("novel:home.quickActions.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to={DIRECTOR_CREATE_LINK}>{t("novel:home.starter.directorCta")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={MANUAL_CREATE_LINK}>{t("novel:home.starter.manualCta")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/book-analysis">{t("novel:home.quickActions.newBookAnalysis")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/tasks">{t("novel:home.quickActions.backgroundTasks")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/help">{t("novel:home.starter.helpCta")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("novel:home.recent.title")}</CardTitle>
          <CardDescription>{t("novel:home.recent.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {novelQuery.isPending ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`home-loading-${index}`} className="space-y-3 rounded-xl border p-4">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : novelQuery.isError ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {t("novel:home.recent.errorTitle")}
              </div>
              <Button variant="outline" onClick={() => void novelQuery.refetch()}>{t("novel:home.recent.reload")}</Button>
            </div>
          ) : recentNovels.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {t("novel:home.recent.empty")}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recentNovels.map((novel) => {
                const workflowTask = novel.latestAutoDirectorTask ?? null;
                const workflowBadge = getWorkflowBadge(workflowTask);

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
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-2">
                          <CardTitle className="line-clamp-1 text-lg">{novel.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-2">
                            {workflowBadge ? (
                              <Badge variant={workflowBadge.variant}>{workflowBadge.label}</Badge>
                            ) : (
                              <Badge variant="outline">{t("novel:home.labels.noDirectorTask")}</Badge>
                            )}
                            {workflowTask ? (
                              <Badge variant="outline">{t("novel:home.labels.progressBadge", { percent: Math.round(workflowTask.progress * 100) })}</Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Badge variant={novel.status === "published" ? "default" : "secondary"}>
                            {novel.status === "published" ? t("novel:home.labels.statusPublished") : t("novel:home.labels.statusDraft")}
                          </Badge>
                          <Badge variant="outline">
                            {novel.writingMode === "continuation" ? t("novel:home.labels.modeContinuation") : t("novel:home.labels.modeOriginal")}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-3">
                        {getNovelLeadSummary(novel)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{t("novel:home.labels.updatedAt", { date: formatDate(novel.updatedAt) })}</span>
                        <span>{t("novel:home.labels.chapterCount", { count: novel._count.chapters })}</span>
                        <span>{t("novel:home.labels.characterCount", { count: novel._count.characters })}</span>
                        {workflowTask?.currentStage ? (
                          <span>{t("novel:home.labels.stage", { stage: workflowTask.currentStage })}</span>
                        ) : null}
                        {workflowTask?.lastHealthyStage ? (
                          <span>{t("novel:home.labels.lastHealthyStage", { stage: workflowTask.lastHealthyStage })}</span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {renderNovelPrimaryAction(novel, { stopPropagation: true })}
                        {workflowTask ? (
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/novels/${novel.id}/edit?directorTaskId=${workflowTask.id}&taskPanel=1`} onClick={stopCardClick}>{t("novel:home.primary.executionDetails")}</Link>
                          </Button>
                        ) : (
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/novels/${novel.id}/edit`} onClick={stopCardClick}>{t("novel:home.primary.openProject")}</Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
