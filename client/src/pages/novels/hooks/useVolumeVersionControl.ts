import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, type QueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import type {
  VolumeBeatSheet,
  VolumeCritiqueReport,
  VolumeImpactResult,
  VolumePlan,
  VolumePlanDocument,
  VolumePlanDiff,
  VolumePlanVersionSummary,
  VolumeRebalanceDecision,
  VolumeStrategyPlan,
} from "@ai-novel/shared/types/novel";
import {
  activateVolumeVersion,
  analyzeVolumeImpact,
  createVolumeDraft,
  freezeVolumeVersion,
  getVolumeDiff,
  getVolumeVersion,
  listVolumeVersions,
} from "@/api/novel";
import { queryKeys } from "@/api/queryKeys";

interface UseVolumeVersionControlArgs {
  novelId: string;
  draftDocument: VolumePlanDocument;
  setDraftVolumes: (value: VolumePlan[]) => void;
  setStrategyPlan: (value: VolumeStrategyPlan | null) => void;
  setCritiqueReport: (value: VolumeCritiqueReport | null) => void;
  setBeatSheets: (value: VolumeBeatSheet[]) => void;
  setRebalanceDecisions: (value: VolumeRebalanceDecision[]) => void;
  queryClient: QueryClient;
  invalidateNovelDetail: () => Promise<void>;
}

export function useVolumeVersionControl({
  novelId,
  draftDocument,
  setDraftVolumes,
  setStrategyPlan,
  setCritiqueReport,
  setBeatSheets,
  setRebalanceDecisions,
  queryClient,
  invalidateNovelDetail,
}: UseVolumeVersionControlArgs) {
  const { t } = useTranslation();
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [message, setMessage] = useState("");
  const [diffResult, setDiffResult] = useState<VolumePlanDiff | null>(null);
  const [impactResult, setImpactResult] = useState<VolumeImpactResult | null>(null);

  const volumeVersionsQuery = useQuery({
    queryKey: queryKeys.novels.volumeVersions(novelId),
    queryFn: () => listVolumeVersions(novelId),
    enabled: Boolean(novelId),
  });

  const versions = volumeVersionsQuery.data?.data ?? [];
  const selectedVersion = useMemo(
    () => versions.find((item) => item.id === selectedVersionId),
    [selectedVersionId, versions],
  );

  useEffect(() => {
    if (!selectedVersionId && versions.length > 0) {
      setSelectedVersionId(versions[0].id);
    }
  }, [selectedVersionId, versions]);

  const invalidateVersionList = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.novels.volumeVersions(novelId) });
  };

  const createDraftVersionMutation = useMutation({
    mutationFn: () => createVolumeDraft(novelId, {
      ...draftDocument,
      baseVersion: selectedVersion?.version,
    }),
    onSuccess: async (response) => {
      const nextVersionId = response.data?.id;
      if (nextVersionId) {
        setSelectedVersionId(nextVersionId);
      }
      setMessage(response.message ?? t("novel:outline.versionControl.draftCreated"));
      await invalidateVersionList();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : t("novel:outline.versionControl.draftCreateFailed"));
    },
  });

  const activateVersionMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(t("novel:outline.versionControl.selectVersionFirst"));
      }
      return activateVolumeVersion(novelId, selectedVersionId);
    },
    onSuccess: async (response) => {
      setMessage(response.message ?? t("novel:outline.versionControl.activateSuccess"));
      await invalidateVersionList();
      await invalidateNovelDetail();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : t("novel:outline.versionControl.activateFailed"));
    },
  });

  const freezeVersionMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(t("novel:outline.versionControl.selectVersionFirst"));
      }
      return freezeVolumeVersion(novelId, selectedVersionId);
    },
    onSuccess: async (response) => {
      setMessage(response.message ?? t("novel:outline.versionControl.freezeSuccess"));
      await invalidateVersionList();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : t("novel:outline.versionControl.freezeFailed"));
    },
  });

  const diffMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(t("novel:outline.versionControl.selectVersionFirst"));
      }
      return getVolumeDiff(novelId, selectedVersionId);
    },
    onSuccess: (response) => {
      setDiffResult(response.data ?? null);
      setMessage(response.message ?? t("novel:outline.versionControl.diffUpdated"));
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : t("novel:outline.versionControl.diffLoadFailed"));
    },
  });

  const analyzeDraftImpactMutation = useMutation({
    mutationFn: () => analyzeVolumeImpact(novelId, { volumes: draftDocument.volumes }),
    onSuccess: (response) => {
      setImpactResult(response.data ?? null);
      setMessage(response.message ?? t("novel:outline.versionControl.draftImpactDone"));
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : t("novel:outline.versionControl.draftImpactFailed"));
    },
  });

  const analyzeVersionImpactMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(t("novel:outline.versionControl.selectVersionFirst"));
      }
      return analyzeVolumeImpact(novelId, { versionId: selectedVersionId });
    },
    onSuccess: (response) => {
      setImpactResult(response.data ?? null);
      setMessage(response.message ?? t("novel:outline.versionControl.versionImpactDone"));
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : t("novel:outline.versionControl.versionImpactFailed"));
    },
  });

  const loadSelectedVersionMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(t("novel:outline.versionControl.selectVersionFirst"));
      }
      return getVolumeVersion(novelId, selectedVersionId);
    },
    onSuccess: (response) => {
      const version = response.data;
      if (!version) {
        setMessage(t("novel:outline.versionControl.loadContentFailed"));
        return;
      }
      try {
        const parsed = JSON.parse(version.contentJson) as Partial<VolumePlanDocument>;
        setDraftVolumes(parsed.volumes ?? []);
        setStrategyPlan(parsed.strategyPlan ?? null);
        setCritiqueReport(parsed.critiqueReport ?? null);
        setBeatSheets(parsed.beatSheets ?? []);
        setRebalanceDecisions(parsed.rebalanceDecisions ?? []);
        setMessage(t("novel:outline.versionControl.loadedVersion", { version: version.version }));
      } catch {
        setMessage(t("novel:outline.versionControl.loadContentFailed"));
      }
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : t("novel:outline.versionControl.loadContentFailed"));
    },
  });

  const loadSelectedVersionToDraft = () => {
    loadSelectedVersionMutation.mutate();
  };

  return {
    volumeMessage: message,
    volumeVersions: versions,
    selectedVersionId,
    setSelectedVersionId,
    selectedVersion: selectedVersion as VolumePlanVersionSummary | undefined,
    diffResult,
    impactResult,
    isLoadingVersions: volumeVersionsQuery.isLoading,
    createDraftVersionMutation,
    activateVersionMutation,
    freezeVersionMutation,
    diffMutation,
    analyzeDraftImpactMutation,
    analyzeVersionImpactMutation,
    loadSelectedVersionToDraft,
  };
}
