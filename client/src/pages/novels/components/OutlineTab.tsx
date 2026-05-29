import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BookPayoffLedgerCard from "./BookPayoffLedgerCard";
import CollapsibleSummary from "./CollapsibleSummary";
import WorldInjectionHint from "./WorldInjectionHint";
import VolumePayoffOverviewCard from "./VolumePayoffOverviewCard";
import type { OutlineTabViewProps } from "./NovelEditView.types";
import DirectorTakeoverEntryPanel from "./DirectorTakeoverEntryPanel";

type OutlineCharacterResource = NonNullable<OutlineTabViewProps["characterResources"]>[number];

type ReadinessStepKey =
  | "canGenerateStrategy"
  | "canGenerateSkeleton"
  | "canGenerateBeatSheet"
  | "canGenerateChapterList";

const READINESS_STEP_KEYS: readonly ReadinessStepKey[] = [
  "canGenerateStrategy",
  "canGenerateSkeleton",
  "canGenerateBeatSheet",
  "canGenerateChapterList",
] as const;

function buildReadinessSteps(t: TFunction) {
  return READINESS_STEP_KEYS.map((key) => ({
    key,
    label: t(`novel:outline.readiness.steps.${key}.label`),
    description: t(`novel:outline.readiness.steps.${key}.description`),
  }));
}

function versionStatusLabel(status: "draft" | "active" | "frozen", t: TFunction): string {
  if (status === "active") return t("novel:outline.versionControl.statusActive");
  if (status === "frozen") return t("novel:outline.versionControl.statusFrozen");
  return t("novel:outline.versionControl.statusDraft");
}

function versionStatusVariant(status: "draft" | "active" | "frozen"): "secondary" | "outline" | "default" {
  if (status === "active") return "default";
  if (status === "frozen") return "outline";
  return "secondary";
}

function getNextOutlineAction(readiness: OutlineTabViewProps["readiness"], t: TFunction): string {
  if (!readiness.canGenerateStrategy) return t("novel:outline.readiness.nextActions.generateStrategyFirst");
  if (!readiness.canGenerateSkeleton) return t("novel:outline.readiness.nextActions.generateSkeletonNow");
  if (!readiness.canGenerateBeatSheet) return t("novel:outline.readiness.nextActions.skeletonReady");
  if (!readiness.canGenerateChapterList) return t("novel:outline.readiness.nextActions.doBeatSheetThenChapters");
  return t("novel:outline.readiness.nextActions.stageComplete");
}

function getResourceStatusLabel(status: OutlineCharacterResource["status"], t: TFunction): string {
  const map: Record<OutlineCharacterResource["status"], string> = {
    available: t("novel:outline.resourceCommitment.statusAvailable"),
    hidden: t("novel:outline.resourceCommitment.statusHidden"),
    borrowed: t("novel:outline.resourceCommitment.statusBorrowed"),
    transferred: t("novel:outline.resourceCommitment.statusTransferred"),
    lost: t("novel:outline.resourceCommitment.statusLost"),
    consumed: t("novel:outline.resourceCommitment.statusConsumed"),
    damaged: t("novel:outline.resourceCommitment.statusDamaged"),
    destroyed: t("novel:outline.resourceCommitment.statusDestroyed"),
    stale: t("novel:outline.resourceCommitment.statusStale"),
  };
  return map[status] ?? status;
}

function getVolumeResourceWindow(resource: OutlineCharacterResource, t: TFunction): string {
  if (resource.expectedUseStartChapterOrder || resource.expectedUseEndChapterOrder) {
    return t("novel:outline.resourceCommitment.windowExpected", {
      start: resource.expectedUseStartChapterOrder ?? t("novel:outline.resourceCommitment.unknownChapter"),
      end: resource.expectedUseEndChapterOrder ?? t("novel:outline.resourceCommitment.unknownChapter"),
    });
  }
  if (resource.lastTouchedChapterOrder) {
    return t("novel:outline.resourceCommitment.windowLastTouched", {
      order: resource.lastTouchedChapterOrder,
    });
  }
  return t("novel:outline.resourceCommitment.windowFallback");
}

function isResourceRelevantToVolume(
  resource: OutlineCharacterResource,
  selectedVolume: OutlineTabViewProps["volumes"][number] | undefined,
): boolean {
  if (!selectedVolume || selectedVolume.chapters.length === 0) {
    return resource.expectedUseEndChapterOrder != null
      || resource.narrativeFunction === "promise"
      || resource.narrativeFunction === "hidden_card";
  }
  const orders = selectedVolume.chapters.map((chapter) => chapter.chapterOrder);
  const start = Math.min(...orders);
  const end = Math.max(...orders);
  const resourceStart = resource.expectedUseStartChapterOrder ?? resource.lastTouchedChapterOrder ?? start;
  const resourceEnd = resource.expectedUseEndChapterOrder ?? resourceStart;
  const overlapsVolume = resourceStart <= end && resourceEnd >= start;
  return overlapsVolume
    || resource.narrativeFunction === "promise"
    || resource.narrativeFunction === "hidden_card";
}

function VolumeResourceCommitmentCard(props: {
  selectedVolume: OutlineTabViewProps["volumes"][number] | undefined;
  resources: OutlineCharacterResource[];
}) {
  const { t } = useTranslation();
  const relevantResources = props.resources
    .filter((resource) => isResourceRelevantToVolume(resource, props.selectedVolume))
    .slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("novel:outline.resourceCommitment.title")}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {t("novel:outline.resourceCommitment.description")}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {relevantResources.length > 0 ? (
          relevantResources.map((resource) => (
            <div key={resource.id} className="rounded-xl border border-border/70 bg-background p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1 text-sm font-medium text-foreground">{resource.name}</div>
                <Badge variant={resource.status === "available" || resource.status === "borrowed" ? "outline" : "secondary"}>
                  {getResourceStatusLabel(resource.status, t)}
                </Badge>
              </div>
              <div className="mt-1 text-xs leading-5 text-muted-foreground">{resource.summary}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {resource.holderCharacterName ? <Badge variant="outline">{resource.holderCharacterName}</Badge> : null}
                <Badge variant="outline">{getVolumeResourceWindow(resource, t)}</Badge>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
            {t("novel:outline.resourceCommitment.emptyHint")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function OutlineTab(props: OutlineTabViewProps) {
  const { t } = useTranslation();
  const readinessSteps = buildReadinessSteps(t);
  const {
    worldInjectionSummary,
    hasCharacters,
    hasUnsavedVolumeDraft,
    generationNotice,
    readiness,
    volumeCountGuidance,
    customVolumeCountEnabled,
    customVolumeCountInput,
    onCustomVolumeCountEnabledChange,
    onCustomVolumeCountInputChange,
    onApplyCustomVolumeCount,
    onRestoreSystemRecommendedVolumeCount,
    strategyPlan,
    critiqueReport,
    isGeneratingStrategy,
    onGenerateStrategy,
    isCritiquingStrategy,
    onCritiqueStrategy,
    isGeneratingSkeleton,
    onGenerateSkeleton,
    onGoToCharacterTab,
    latestStateSnapshot,
    payoffLedger,
    characterResources = [],
    draftText,
    volumes,
    onVolumeFieldChange,
    onOpenPayoffsChange,
    onAddVolume,
    onRemoveVolume,
    onMoveVolume,
    onSave,
    isSaving,
    volumeMessage,
    volumeVersions,
    selectedVersionId,
    onSelectedVersionChange,
    onCreateDraftVersion,
    isCreatingDraftVersion,
    onLoadSelectedVersionToDraft,
    onActivateVersion,
    isActivatingVersion,
    onFreezeVersion,
    isFreezingVersion,
    onLoadVersionDiff,
    isLoadingVersionDiff,
    diffResult,
    onAnalyzeDraftImpact,
    isAnalyzingDraftImpact,
    onAnalyzeVersionImpact,
    isAnalyzingVersionImpact,
    impactResult,
  } = props;

  const selectedVersion = volumeVersions.find((item) => item.id === selectedVersionId);
  const completedReadinessCount = readinessSteps.filter((item) => readiness[item.key]).length;
  const readinessProgress = Math.round((completedReadinessCount / Math.max(readinessSteps.length, 1)) * 100);
  const nextOutlineAction = getNextOutlineAction(readiness, t);
  const outlineStageReady = completedReadinessCount === readinessSteps.length;
  const [selectedVolumeId, setSelectedVolumeId] = useState(volumes[0]?.id ?? "");
  const volumeCountModeLabel = volumeCountGuidance.userPreferredVolumeCount != null
    ? t("novel:outline.volumeCount.modeFixed", { count: volumeCountGuidance.userPreferredVolumeCount })
    : volumeCountGuidance.respectedExistingVolumeCount != null
      ? t("novel:outline.volumeCount.modeRespectExisting", { count: volumeCountGuidance.respectedExistingVolumeCount })
      : t("novel:outline.volumeCount.modeSystemRecommended", { count: volumeCountGuidance.systemRecommendedVolumeCount });

  useEffect(() => {
    if (!volumes.some((volume) => volume.id === selectedVolumeId)) {
      setSelectedVolumeId(volumes[0]?.id ?? "");
    }
  }, [selectedVolumeId, volumes]);

  const selectedVolume = volumes.find((volume) => volume.id === selectedVolumeId) ?? volumes[0];
  const selectedStrategyVolume = selectedVolume
    ? strategyPlan?.volumes.find((item) => item.sortOrder === selectedVolume.sortOrder) ?? null
    : null;

  return (
    <div className="space-y-4">
      <DirectorTakeoverEntryPanel
        title={t("novel:outline.tab.takeoverTitle")}
        description={t("novel:outline.tab.takeoverDescription")}
        entry={props.directorTakeoverEntry}
      />
      <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <CardTitle>{t("novel:outline.tab.title")}</CardTitle>
          <div className="text-sm text-muted-foreground">{t("novel:outline.tab.description")}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AiButton variant="outline" onClick={onGenerateStrategy} disabled={isGeneratingStrategy}>
            {isGeneratingStrategy
              ? t("novel:outline.tab.actions.generating")
              : t("novel:outline.tab.actions.generateStrategy")}
          </AiButton>
          <AiButton variant="outline" onClick={onCritiqueStrategy} disabled={isCritiquingStrategy || !strategyPlan}>
            {isCritiquingStrategy
              ? t("novel:outline.tab.actions.critiquing")
              : t("novel:outline.tab.actions.critiqueStrategy")}
          </AiButton>
          <AiButton onClick={onGenerateSkeleton} disabled={isGeneratingSkeleton || !readiness.canGenerateSkeleton}>
            {isGeneratingSkeleton
              ? t("novel:outline.tab.actions.generating")
              : volumes.length > 0
                ? t("novel:outline.tab.actions.regenerateSkeleton")
                : t("novel:outline.tab.actions.generateSkeleton")}
          </AiButton>
          <Button variant="secondary" onClick={onSave} disabled={isSaving}>
            {isSaving
              ? t("novel:outline.tab.actions.saving")
              : t("novel:outline.tab.actions.saveWorkspace")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <WorldInjectionHint worldInjectionSummary={worldInjectionSummary} />
        {!hasCharacters ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
            <span>{t("novel:outline.tab.missingCharactersWarning")}</span>
            <Button size="sm" variant="outline" onClick={onGoToCharacterTab}>{t("novel:outline.tab.goToCharacterTab")}</Button>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/70 bg-muted/20 p-2 text-xs text-muted-foreground">
          <span>{generationNotice}</span>
          {hasUnsavedVolumeDraft ? <Badge variant="secondary">{t("novel:outline.tab.unsavedDraftBadge")}</Badge> : null}
        </div>
        <div className="grid items-start gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <Card className="self-start">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base">{t("novel:outline.readiness.title")}</CardTitle>
                  <Badge variant={outlineStageReady ? "default" : "outline"}>
                    {t("novel:outline.readiness.completed", { count: completedReadinessCount, total: readinessSteps.length })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                  <div className="text-xs text-muted-foreground">{t("novel:outline.readiness.nextRecommendation")}</div>
                  <div className="mt-1 font-medium text-foreground">{nextOutlineAction}</div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${readinessProgress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {outlineStageReady
                      ? t("novel:outline.readiness.stageReady")
                      : readiness.blockingReasons.length > 0
                        ? t("novel:outline.readiness.blockingCount", { count: readiness.blockingReasons.length })
                        : t("novel:outline.readiness.canContinue")}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {readinessSteps.map((item) => (
                    <div key={item.key} className="rounded-xl border border-border/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-foreground">{item.label}</div>
                        <Badge variant={readiness[item.key] ? "default" : "outline"}>
                          {readiness[item.key]
                            ? t("novel:outline.readiness.stepReady")
                            : t("novel:outline.readiness.stepNotReady")}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</div>
                    </div>
                  ))}
                </div>

                {readiness.blockingReasons.length > 0 ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    {readiness.blockingReasons.map((reason) => <div key={reason}>{reason}</div>)}
                  </div>
                ) : (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                    {t("novel:outline.readiness.workspaceReadyHint")}
                  </div>
                )}
                {volumeMessage ? <div className="text-xs text-muted-foreground">{volumeMessage}</div> : null}
              </CardContent>
            </Card>

            <details className="group rounded-2xl border border-border/70 bg-background/95 p-4">
              <summary className="cursor-pointer list-none">
                <CollapsibleSummary
                  title={t("novel:outline.volumeCount.panelTitle")}
                  description={t("novel:outline.volumeCount.panelDescription")}
                  meta={<Badge variant="outline">{volumeCountModeLabel}</Badge>}
                />
              </summary>

              <div className="mt-4 space-y-3">
                <Card className="self-start">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="text-base">{t("novel:outline.volumeCount.title")}</CardTitle>
                      <Badge variant="outline">{volumeCountModeLabel}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                        <div className="text-xs text-muted-foreground">{t("novel:outline.volumeCount.chapterBudget")}</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">
                          {t("novel:outline.volumeCount.chapterBudgetValue", { count: volumeCountGuidance.chapterBudget })}
                        </div>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                        <div className="text-xs text-muted-foreground">{t("novel:outline.volumeCount.recommendedRange")}</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">
                          {t("novel:outline.volumeCount.recommendedRangeValue", {
                            min: volumeCountGuidance.allowedVolumeCountRange.min,
                            max: volumeCountGuidance.allowedVolumeCountRange.max,
                          })}
                        </div>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                        <div className="text-xs text-muted-foreground">{t("novel:outline.volumeCount.systemRecommended")}</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">
                          {t("novel:outline.volumeCount.systemRecommendedValue", { count: volumeCountGuidance.systemRecommendedVolumeCount })}
                        </div>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                        <div className="text-xs text-muted-foreground">{t("novel:outline.volumeCount.hardPlannedRange")}</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">
                          {t("novel:outline.volumeCount.hardPlannedRangeValue", {
                            min: volumeCountGuidance.hardPlannedVolumeRange.min,
                            max: volumeCountGuidance.hardPlannedVolumeRange.max,
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs leading-6 text-muted-foreground">
                      {t("novel:outline.volumeCount.scaleHint", {
                        min: volumeCountGuidance.targetChapterRange.min,
                        max: volumeCountGuidance.targetChapterRange.max,
                        ideal: volumeCountGuidance.targetChapterRange.ideal,
                      })}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={customVolumeCountEnabled ? "default" : "outline"}
                        onClick={() => onCustomVolumeCountEnabledChange(!customVolumeCountEnabled)}
                      >
                        {customVolumeCountEnabled
                          ? t("novel:outline.volumeCount.collapseCustom")
                          : t("novel:outline.volumeCount.expandCustom")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={onRestoreSystemRecommendedVolumeCount}>
                        {t("novel:outline.volumeCount.restoreSystem")}
                      </Button>
                    </div>

                    {customVolumeCountEnabled ? (
                      <div className="rounded-xl border border-border/70 p-3">
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,180px)_auto_auto] sm:items-end">
                          <label className="space-y-1 text-sm">
                            <span className="text-xs text-muted-foreground">{t("novel:outline.volumeCount.fixedCountLabel")}</span>
                            <input
                              type="number"
                              min={volumeCountGuidance.allowedVolumeCountRange.min}
                              max={volumeCountGuidance.allowedVolumeCountRange.max}
                              className="w-full rounded-md border bg-background p-2"
                              value={customVolumeCountInput}
                              onChange={(event) => onCustomVolumeCountInputChange(event.target.value)}
                            />
                          </label>
                          <Button size="sm" onClick={onApplyCustomVolumeCount}>
                            {t("novel:outline.volumeCount.applyFixed")}
                          </Button>
                          <div className="text-xs text-muted-foreground">
                            {t("novel:outline.volumeCount.allowedRangeHint", {
                              min: volumeCountGuidance.allowedVolumeCountRange.min,
                              max: volumeCountGuidance.allowedVolumeCountRange.max,
                            })}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {critiqueReport ? (
                  <Card className="self-start">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{t("novel:outline.critique.title")}</CardTitle>
                        <Badge variant={critiqueReport.overallRisk === "high" ? "secondary" : critiqueReport.overallRisk === "medium" ? "outline" : "default"}>
                          {t("novel:outline.critique.riskBadge", { level: critiqueReport.overallRisk })}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-md border p-3 text-xs text-muted-foreground">{critiqueReport.summary}</div>
                      {critiqueReport.issues.length > 0 ? (
                        <div className="space-y-2">
                          {critiqueReport.issues.map((issue) => (
                            <div key={`${issue.targetRef}-${issue.title}`} className="rounded-md border p-3 text-xs">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{issue.targetRef}</Badge>
                                <Badge variant={issue.severity === "high" ? "secondary" : issue.severity === "medium" ? "outline" : "default"}>
                                  {issue.severity}
                                </Badge>
                              </div>
                              <div className="mt-2 font-medium">{issue.title}</div>
                              <div className="mt-1 text-muted-foreground">{issue.detail}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </details>
          </div>

          <details className="group rounded-2xl border border-border/70 bg-background/95 p-4">
            <summary className="cursor-pointer list-none">
              <CollapsibleSummary
                title={t("novel:outline.derivedTexts.panelTitle")}
                description={t("novel:outline.derivedTexts.panelDescription")}
              />
            </summary>

            <div className="mt-4 space-y-3">
              <Card className="self-start">
                <CardHeader>
                  <CardTitle className="text-base">{t("novel:outline.derivedTexts.previewTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea className="min-h-[220px] w-full rounded-md border bg-muted/20 p-3 text-sm" readOnly value={draftText} />
                </CardContent>
              </Card>

              <Card className="self-start">
                <CardHeader>
                  <CardTitle className="text-base">{t("novel:outline.versionControl.title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {volumeVersions.length > 0 ? (
                    <>
                      <select className="w-full rounded-md border bg-background p-2 text-sm" value={selectedVersionId} onChange={(event) => onSelectedVersionChange(event.target.value)}>
                        {volumeVersions.map((version) => (
                          <option key={version.id} value={version.id}>
                            V{version.version} · {versionStatusLabel(version.status, t)}
                          </option>
                        ))}
                      </select>
                      {selectedVersion ? (
                        <div className="rounded-md border p-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">V{selectedVersion.version}</span>
                            <Badge variant={versionStatusVariant(selectedVersion.status)}>
                              {versionStatusLabel(selectedVersion.status, t)}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("novel:outline.versionControl.createdAt", { value: new Date(selectedVersion.createdAt).toLocaleString() })}
                          </div>
                          <div className="mt-1 line-clamp-4 text-xs text-muted-foreground">
                            {selectedVersion.diffSummary || t("novel:outline.versionControl.noDiffSummary")}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">{t("novel:outline.versionControl.emptyHint")}</div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={onCreateDraftVersion} disabled={isCreatingDraftVersion || volumes.length === 0}>
                      {isCreatingDraftVersion
                        ? t("novel:outline.versionControl.saving")
                        : t("novel:outline.versionControl.saveDraft")}
                    </Button>
                    <Button variant="outline" onClick={onLoadSelectedVersionToDraft} disabled={!selectedVersionId}>
                      {t("novel:outline.versionControl.overrideDraft")}
                    </Button>
                    <Button variant="secondary" onClick={onActivateVersion} disabled={isActivatingVersion || !selectedVersionId}>
                      {isActivatingVersion
                        ? t("novel:outline.versionControl.activating")
                        : t("novel:outline.versionControl.setActive")}
                    </Button>
                    <Button variant="outline" onClick={onFreezeVersion} disabled={isFreezingVersion || !selectedVersionId}>
                      {isFreezingVersion
                        ? t("novel:outline.versionControl.freezing")
                        : t("novel:outline.versionControl.freezeCurrent")}
                    </Button>
                    <Button variant="outline" onClick={onLoadVersionDiff} disabled={isLoadingVersionDiff || !selectedVersionId}>
                      {isLoadingVersionDiff
                        ? t("novel:outline.versionControl.loadingDiff")
                        : t("novel:outline.versionControl.viewDiff")}
                    </Button>
                  </div>
                  {diffResult ? (
                    <div className="rounded-md border p-2 text-xs">
                      <div className="font-medium">
                        {t("novel:outline.versionControl.diffPreview", { version: diffResult.version })}
                      </div>
                      <div className="text-muted-foreground">
                        {t("novel:outline.versionControl.diffStats", {
                          volumes: diffResult.changedVolumeCount,
                          chapters: diffResult.changedChapterCount,
                          lines: diffResult.changedLines,
                        })}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="self-start">
                <CardHeader>
                  <CardTitle className="text-base">{t("novel:outline.impact.title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <AiButton variant="outline" onClick={onAnalyzeDraftImpact} disabled={isAnalyzingDraftImpact || volumes.length === 0}>
                      {isAnalyzingDraftImpact
                        ? t("novel:outline.impact.analyzing")
                        : t("novel:outline.impact.analyzeDraft")}
                    </AiButton>
                    <AiButton variant="outline" onClick={onAnalyzeVersionImpact} disabled={isAnalyzingVersionImpact || !selectedVersionId}>
                      {isAnalyzingVersionImpact
                        ? t("novel:outline.impact.analyzing")
                        : t("novel:outline.impact.analyzeVersion")}
                    </AiButton>
                  </div>
                  {impactResult ? (
                    <div className="rounded-md border p-2 text-xs">
                      <div className="font-medium">{t("novel:outline.impact.previewTitle")}</div>
                      <div className="text-muted-foreground">
                        {t("novel:outline.impact.previewStats", {
                          volumes: impactResult.affectedVolumeCount,
                          chapters: impactResult.affectedChapterCount,
                          lines: impactResult.changedLines,
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">{t("novel:outline.impact.preActivateHint")}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </details>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="text-base">{t("novel:outline.summaryCard.title")}</CardTitle>
                <div className="text-sm text-muted-foreground">{t("novel:outline.summaryCard.description")}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {strategyPlan ? (
                  <>
                    <Badge variant="outline">
                      {t("novel:outline.summaryCard.recommendedBadge", { count: strategyPlan.recommendedVolumeCount })}
                    </Badge>
                    <Badge variant="secondary">
                      {t("novel:outline.summaryCard.hardPlannedBadge", { count: strategyPlan.hardPlannedVolumeCount })}
                    </Badge>
                  </>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {strategyPlan ? (
              <>
                <div className="grid gap-3 xl:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div className="text-xs text-muted-foreground">{t("novel:outline.summaryCard.rewardLadder")}</div>
                    <div className="mt-2 text-sm leading-6 text-foreground">{strategyPlan.readerRewardLadder}</div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div className="text-xs text-muted-foreground">{t("novel:outline.summaryCard.escalationLadder")}</div>
                    <div className="mt-2 text-sm leading-6 text-foreground">{strategyPlan.escalationLadder}</div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div className="text-xs text-muted-foreground">{t("novel:outline.summaryCard.midpointShift")}</div>
                    <div className="mt-2 text-sm leading-6 text-foreground">{strategyPlan.midpointShift}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 p-4 text-sm text-muted-foreground">
                  <div className="text-xs">{t("novel:outline.summaryCard.rhythmOverview")}</div>
                  <div className="mt-2 leading-6">
                    {strategyPlan.volumes
                      .map((volume) => t("novel:outline.summaryCard.volumeRhythmEntry", {
                        order: volume.sortOrder,
                        role: volume.roleLabel,
                        reward: volume.coreReward,
                      }))
                      .join(t("novel:outline.summaryCard.rhythmJoinSeparator"))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
                {t("novel:outline.tab.noPlanCta")}
              </div>
            )}
          </CardContent>
        </Card>

        <BookPayoffLedgerCard
          latestStateSnapshot={latestStateSnapshot}
          payoffLedger={payoffLedger}
        />

        <VolumeResourceCommitmentCard
          selectedVolume={selectedVolume}
          resources={characterResources}
        />

        <div className="grid items-start gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="self-start xl:sticky xl:top-4">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{t("novel:outline.navigationCard.title")}</CardTitle>
                  <div className="text-sm text-muted-foreground">{t("novel:outline.navigationCard.description")}</div>
                </div>
                <Button size="sm" variant="outline" onClick={onAddVolume}>{t("novel:outline.navigationCard.addVolume")}</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {volumes.length > 0 ? (
                <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
                  {volumes.map((volume) => {
                    const strategyVolume = strategyPlan?.volumes.find((item) => item.sortOrder === volume.sortOrder) ?? null;
                    const isSelected = selectedVolume?.id === volume.id;
                    return (
                      <button
                        key={volume.id}
                        type="button"
                        onClick={() => setSelectedVolumeId(volume.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? "border-sky-400/70 bg-sky-50 shadow-sm ring-1 ring-sky-200"
                            : "border-border/70 bg-background hover:border-primary/30 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={isSelected ? "default" : "outline"}>
                            {t("novel:outline.navigationCard.volumeOrder", { order: volume.sortOrder })}
                          </Badge>
                          {strategyVolume ? (
                            <Badge variant={strategyVolume.planningMode === "hard" ? "secondary" : "outline"}>
                              {strategyVolume.planningMode === "hard"
                                ? t("novel:outline.navigationCard.planningModeHard")
                                : t("novel:outline.navigationCard.planningModeSoft")}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="mt-2 text-sm font-medium">
                          {volume.title || strategyVolume?.roleLabel || t("novel:outline.navigationCard.fallbackVolumeTitle", { order: volume.sortOrder })}
                        </div>
                        <div className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">
                          {volume.summary || volume.mainPromise || strategyVolume?.coreReward || t("novel:outline.navigationCard.fallbackSummary")}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
                  {t("novel:outline.navigationCard.emptyHint")}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            {selectedVolume ? (
              <>
                <VolumePayoffOverviewCard
                  selectedVolume={selectedVolume}
                />
                <Card key={selectedVolume.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {t("novel:outline.volumeEditor.volumeOrder", { order: selectedVolume.sortOrder })}
                        </Badge>
                        {selectedStrategyVolume ? (
                          <Badge variant={selectedStrategyVolume.planningMode === "hard" ? "secondary" : "outline"}>
                            {selectedStrategyVolume.planningMode === "hard"
                              ? t("novel:outline.navigationCard.planningModeHard")
                              : t("novel:outline.navigationCard.planningModeSoft")}
                          </Badge>
                        ) : null}
                        {selectedStrategyVolume?.roleLabel ? <span className="text-sm text-muted-foreground">{selectedStrategyVolume.roleLabel}</span> : null}
                        <span className="text-sm text-muted-foreground">
                          {selectedVolume.chapters.length > 0
                            ? t("novel:outline.volumeEditor.chapterRange", {
                              start: selectedVolume.chapters[0]?.chapterOrder,
                              end: selectedVolume.chapters[selectedVolume.chapters.length - 1]?.chapterOrder,
                            })
                            : t("novel:outline.volumeEditor.noChapters")}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onMoveVolume(selectedVolume.id, -1)} disabled={selectedVolume.sortOrder === 1}>
                          {t("novel:outline.volumeEditor.moveUp")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onMoveVolume(selectedVolume.id, 1)} disabled={selectedVolume.sortOrder === volumes.length}>
                          {t("novel:outline.volumeEditor.moveDown")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onRemoveVolume(selectedVolume.id)} disabled={volumes.length <= 1}>
                          {t("novel:outline.volumeEditor.remove")}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-1 text-sm md:col-span-2">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.title")}</span>
                      <input className="w-full rounded-md border bg-background p-2" value={selectedVolume.title} onChange={(event) => onVolumeFieldChange(selectedVolume.id, "title", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.summary")}</span>
                      <textarea className="min-h-[84px] w-full rounded-md border bg-background p-2" value={selectedVolume.summary ?? ""} onChange={(event) => onVolumeFieldChange(selectedVolume.id, "summary", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.openingHook")}</span>
                      <textarea className="min-h-[84px] w-full rounded-md border bg-background p-2" value={selectedVolume.openingHook ?? ""} onChange={(event) => onVolumeFieldChange(selectedVolume.id, "openingHook", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.mainPromise")}</span>
                      <textarea className="min-h-[84px] w-full rounded-md border bg-background p-2" value={selectedVolume.mainPromise ?? ""} onChange={(event) => onVolumeFieldChange(selectedVolume.id, "mainPromise", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.primaryPressureSource")}</span>
                      <textarea className="min-h-[84px] w-full rounded-md border bg-background p-2" value={selectedVolume.primaryPressureSource ?? ""} onChange={(event) => onVolumeFieldChange(selectedVolume.id, "primaryPressureSource", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.coreSellingPoint")}</span>
                      <textarea className="min-h-[84px] w-full rounded-md border bg-background p-2" value={selectedVolume.coreSellingPoint ?? ""} onChange={(event) => onVolumeFieldChange(selectedVolume.id, "coreSellingPoint", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.escalationMode")}</span>
                      <textarea className="min-h-[84px] w-full rounded-md border bg-background p-2" value={selectedVolume.escalationMode ?? ""} onChange={(event) => onVolumeFieldChange(selectedVolume.id, "escalationMode", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.protagonistChange")}</span>
                      <textarea className="min-h-[84px] w-full rounded-md border bg-background p-2" value={selectedVolume.protagonistChange ?? ""} onChange={(event) => onVolumeFieldChange(selectedVolume.id, "protagonistChange", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.midVolumeRisk")}</span>
                      <textarea className="min-h-[84px] w-full rounded-md border bg-background p-2" value={selectedVolume.midVolumeRisk ?? ""} onChange={(event) => onVolumeFieldChange(selectedVolume.id, "midVolumeRisk", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.climax")}</span>
                      <textarea className="min-h-[84px] w-full rounded-md border bg-background p-2" value={selectedVolume.climax ?? ""} onChange={(event) => onVolumeFieldChange(selectedVolume.id, "climax", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.payoffType")}</span>
                      <textarea className="min-h-[84px] w-full rounded-md border bg-background p-2" value={selectedVolume.payoffType ?? ""} onChange={(event) => onVolumeFieldChange(selectedVolume.id, "payoffType", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.nextVolumeHook")}</span>
                      <textarea className="min-h-[84px] w-full rounded-md border bg-background p-2" value={selectedVolume.nextVolumeHook ?? ""} onChange={(event) => onVolumeFieldChange(selectedVolume.id, "nextVolumeHook", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.resetPoint")}</span>
                      <textarea className="min-h-[84px] w-full rounded-md border bg-background p-2" value={selectedVolume.resetPoint ?? ""} onChange={(event) => onVolumeFieldChange(selectedVolume.id, "resetPoint", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm md:col-span-2">
                      <span className="text-xs text-muted-foreground">{t("novel:outline.volumeEditor.fields.openPayoffs")}</span>
                      <textarea
                        className="min-h-[84px] w-full rounded-md border bg-background p-2"
                        placeholder={t("novel:outline.volumeEditor.fields.openPayoffsPlaceholder")}
                        value={selectedVolume.openPayoffs.join("\n")}
                        onChange={(event) => onOpenPayoffsChange(selectedVolume.id, event.target.value)}
                      />
                    </label>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                {t("novel:outline.volumeEditor.noSelection")}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      </Card>
    </div>
  );
}
