import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsMobileViewport } from "@/components/layout/mobile/useIsMobileViewport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import KnowledgeBindingPanel from "@/components/knowledge/KnowledgeBindingPanel";
import AITakeoverContainer from "@/components/workflow/AITakeoverContainer";
import ChapterManagementTab from "./ChapterManagementTab";
import DirectorFactDebugDialog from "./DirectorFactDebugDialog";
import NovelCharacterPanel from "./NovelCharacterPanel";
import NovelTaskDrawer from "./NovelTaskDrawer";
import OutlineTab from "./OutlineTab";
import PipelineTab from "./PipelineTab";
import StoryMacroPlanTab from "./StoryMacroPlanTab";
import StructuredOutlineTab from "./StructuredOutlineTab";
import VersionHistoryTab from "./VersionHistoryTab";
import BasicInfoTab from "./BasicInfoTab";
import MobileNovelEditView from "../mobile/MobileNovelEditView";
import type { NovelEditViewProps } from "./NovelEditView.types";
import {
  getNovelWorkspaceFlowStepIndex,
  getNovelWorkspaceTabLabel,
  NOVEL_WORKSPACE_FLOW_STEPS,
  normalizeNovelWorkspaceTab,
  tabFromDirectorDisplayStage,
} from "../novelWorkspaceNavigation";

export default function NovelEditView(props: NovelEditViewProps) {
  const isMobileViewport = useIsMobileViewport();

  if (isMobileViewport) {
    return <MobileNovelEditView {...props} />;
  }

  return <DesktopNovelEditView {...props} />;
}

function DesktopNovelEditView(props: NovelEditViewProps) {
  const {
    id,
    activeTab,
    workflowCurrentTab,
    exportControls,
    basicTab,
    storyMacroTab,
    outlineTab,
    structuredTab,
    chapterTab,
    pipelineTab,
    characterTab,
    takeover,
    taskDrawer,
    activeStepTakeoverEntry,
  } = props;
  const { t } = useTranslation();

  const [isProjectToolsOpen, setIsProjectToolsOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const totalChapters = chapterTab.chapters.length;
  const generatedChapters = chapterTab.chapters.filter((item) => Boolean(item.content?.trim())).length;
  const pendingRepairs = pipelineTab.chapterReports.filter(
    (item) => item.overall < pipelineTab.pipelineForm.qualityThreshold,
  ).length;
  const currentModel = pipelineTab.pipelineJob?.payload
    ? (() => {
        try {
          const parsed = JSON.parse(pipelineTab.pipelineJob.payload) as { model?: string };
          return parsed.model ?? "default";
        } catch {
          return "default";
        }
      })()
    : "default";

  const pendingResourceProposalCount = taskDrawer?.resourceProposals?.length ?? 0;
  const taskAttentionLabel = (() => {
    if (pendingResourceProposalCount > 0) {
      return t("novel:workspace.recentTask.resourceCount", { count: pendingResourceProposalCount });
    }
    if (!taskDrawer?.task) {
      return null;
    }
    if (taskDrawer.task.pendingManualRecovery) {
      return t("novel:workspace.recentTask.needsRecovery");
    }
    if (taskDrawer.task.status === "failed") {
      return t("novel:workspace.recentTask.exception");
    }
    if (taskDrawer.task.status === "waiting_approval") {
      return t("novel:workspace.recentTask.needsApproval");
    }
    if (taskDrawer.task.status === "running" || taskDrawer.task.status === "queued") {
      return t("novel:workspace.recentTask.running");
    }
    return t("novel:workspace.recentTask.recentTaskCard");
  })();

  const normalizedActiveTab = normalizeNovelWorkspaceTab(activeTab);
  const normalizedWorkflowTab = normalizeNovelWorkspaceTab(workflowCurrentTab ?? activeTab);
  const guidedFlowTab = normalizedActiveTab === "history"
    ? normalizedWorkflowTab === "history"
      ? "basic"
      : normalizedWorkflowTab
    : normalizedActiveTab;
  const novelTitle = basicTab.basicForm.title.trim() || t("novel:workspace.unnamedNovel", { defaultValue: "Tiểu thuyết chưa đặt tên" });
  const directorDisplayState = taskDrawer?.snapshot?.displayState ?? null;
  const currentPageLabel = getNovelWorkspaceTabLabel(t, normalizedActiveTab);
  const currentStepLabel = directorDisplayState?.stageLabel ?? currentPageLabel;
  const recommendedWorkflowTab = directorDisplayState
    ? tabFromDirectorDisplayStage(directorDisplayState.stageKey)
    : normalizedWorkflowTab;
  const workflowStepLabel = recommendedWorkflowTab
    ? getNovelWorkspaceTabLabel(t, recommendedWorkflowTab)
    : null;
  const stepIndex = directorDisplayState?.stepIndex ?? getNovelWorkspaceFlowStepIndex(guidedFlowTab);
  const progressLabel = stepIndex >= 0
    ? t("novel:workspace.stepCounter", { current: stepIndex + 1, total: directorDisplayState?.totalSteps ?? NOVEL_WORKSPACE_FLOW_STEPS.length, defaultValue: "Bước {current} / Tổng {total} bước" })
    : null;
  const showWorkflowRecommendation = Boolean(
    recommendedWorkflowTab
    && recommendedWorkflowTab !== normalizedActiveTab,
  );
  const isTakeoverLoading = takeover?.mode === "loading";
  const hideTakeoverEntry = takeover?.mode === "running" || takeover?.mode === "waiting";

  const renderActivePanel = () => {
    switch (activeTab) {
      case "basic":
        return <BasicInfoTab {...basicTab} />;
      case "outline":
        return <OutlineTab {...outlineTab} />;
      case "story_macro":
        return <StoryMacroPlanTab {...storyMacroTab} />;
      case "structured":
        return <StructuredOutlineTab {...structuredTab} />;
      case "chapter":
        return <ChapterManagementTab {...chapterTab} />;
      case "pipeline":
        return <PipelineTab {...pipelineTab} />;
      case "character":
        return <NovelCharacterPanel {...characterTab} />;
      case "history":
        return <VersionHistoryTab novelId={id} />;
      default:
        return <BasicInfoTab {...basicTab} />;
    }
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      {id ? (
        <div className="space-y-3 pb-1">
          <div className="flex min-w-0 flex-wrap items-center gap-3 text-sm">
            <span className="truncate font-semibold text-foreground">{novelTitle}</span>
            <span className="h-1 w-1 shrink-0 rounded-full bg-border" />
            <span className="shrink-0 text-muted-foreground">{"\u5f53\u524d\u6b65\u9aa4\uff1a"}{currentStepLabel}</span>
            {progressLabel ? (
              <>
                <span className="h-1 w-1 shrink-0 rounded-full bg-border" />
                <span className="shrink-0 text-muted-foreground">{progressLabel}</span>
              </>
            ) : null}
            <span className="h-1 w-1 shrink-0 rounded-full bg-border" />
            <span className="shrink-0 text-muted-foreground">{"\u5f53\u524d\u9875\u9762\uff1a"}{currentPageLabel}</span>
            {showWorkflowRecommendation && workflowStepLabel ? (
              <>
                <span className="h-1 w-1 shrink-0 rounded-full bg-border" />
                <span className="shrink-0 text-sky-700">{"\u6d41\u7a0b\u63a8\u8350\uff1a\u5efa\u8bae\u5207\u6362\u5230 "}{workflowStepLabel}</span>
              </>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!hideTakeoverEntry ? (
              isTakeoverLoading ? (
                <Button type="button" size="sm" disabled>
                  <Loader2 className="animate-spin" />
                  {t("novel:workspace.header.directorTakeover")}
                </Button>
              ) : activeStepTakeoverEntry
            ) : null}

            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">{t("novel:workspace.header.export")}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t("novel:workspace.header.exportProjectTitle")}</DialogTitle>
                  <DialogDescription>
                    {t("novel:workspace.header.exportProjectDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t("novel:workspace.header.currentStep", { label: currentStepLabel })}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => exportControls.onExportCurrent("markdown")}
                        disabled={!exportControls.canExportCurrentStep || exportControls.isExportingCurrentMarkdown}
                      >
                        {exportControls.isExportingCurrentMarkdown ? t("novel:workspace.header.exporting") : "Markdown"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => exportControls.onExportCurrent("json")}
                        disabled={!exportControls.canExportCurrentStep || exportControls.isExportingCurrentJson}
                      >
                        {exportControls.isExportingCurrentJson ? t("novel:workspace.header.exporting") : "JSON"}
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t("novel:workspace.header.fullBookCardTitle")}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => exportControls.onExportFull("markdown")}
                        disabled={exportControls.isExportingFullMarkdown}
                      >
                        {exportControls.isExportingFullMarkdown ? t("novel:workspace.header.exporting") : "Markdown"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => exportControls.onExportFull("json")}
                        disabled={exportControls.isExportingFullJson}
                      >
                        {exportControls.isExportingFullJson ? t("novel:workspace.header.exporting") : "JSON"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>

            <DirectorFactDebugDialog novelId={id} taskId={taskDrawer?.task?.id ?? null} />

            <Dialog open={isProjectToolsOpen} onOpenChange={setIsProjectToolsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">{t("novel:workspace.header.projectTools")}</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-4xl overflow-auto">
                <DialogHeader>
                  <DialogTitle>{t("novel:workspace.header.projectToolsTitle")}</DialogTitle>
                  <DialogDescription>
                    {t("novel:workspace.header.projectToolsDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("novel:workspace.header.chapterProgress")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{t("novel:workspace.header.chapterProgressLine", { generated: generatedChapters, total: Math.max(totalChapters, 1) })}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("novel:workspace.header.chaptersToFix")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{pendingRepairs}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("novel:workspace.header.currentModel")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{currentModel}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("novel:workspace.header.recentTasks")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{pipelineTab.pipelineJob?.status ?? "idle"}</p>
                    </CardContent>
                  </Card>
                </div>
                <KnowledgeBindingPanel targetType="novel" targetId={id} title={t("novel:workspace.header.knowledgeBindingTitle")} />
              </DialogContent>
            </Dialog>

            <Button
              variant={taskDrawer?.task?.status === "failed" ? "destructive" : "outline"}
              onClick={() => taskDrawer?.onOpenChange(true)}
            >
              {t("novel:workspace.header.executionDetails")}
              {taskAttentionLabel ? <Badge variant="secondary">{taskAttentionLabel}</Badge> : null}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4 pt-1">
        {takeover ? (
          <AITakeoverContainer
            mode={takeover.mode}
            title={takeover.title}
            description={takeover.description}
            progress={takeover.progress}
            currentAction={takeover.currentAction}
            checkpointLabel={takeover.checkpointLabel}
            taskId={takeover.taskId}
            actions={takeover.actions}
          >
            {renderActivePanel()}
          </AITakeoverContainer>
        ) : (
          renderActivePanel()
        )}
      </div>

      {taskDrawer ? <NovelTaskDrawer {...taskDrawer} /> : null}
    </div>
  );
}
