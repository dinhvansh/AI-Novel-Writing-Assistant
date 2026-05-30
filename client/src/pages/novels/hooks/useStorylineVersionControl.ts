import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, type QueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import type { StorylineDiff, StorylineVersion } from "@ai-novel/shared/types/novel";
import {
  activateStorylineVersion,
  analyzeStorylineImpact,
  createStorylineDraft,
  freezeStorylineVersion,
  getStorylineDiff,
  listStorylineVersions,
} from "@/api/novel";
import { queryKeys } from "@/api/queryKeys";

interface StorylineImpactResult {
  novelId: string;
  sourceVersion: number | null;
  affectedCharacters: number;
  affectedChapters: number;
  changedLines: number;
  requiresOutlineRebuild: boolean;
  recommendations: {
    shouldSyncOutline: boolean;
    shouldRecheckCharacters: boolean;
    suggestedStrategy: "rebuild_outline" | "incremental_sync";
  };
}

interface UseStorylineVersionControlArgs {
  novelId: string;
  draftText: string;
  setDraftText: (value: string) => void;
  queryClient: QueryClient;
  invalidateNovelDetail: () => Promise<void>;
  t: TFunction;
}

export function useStorylineVersionControl({
  novelId,
  draftText,
  setDraftText,
  queryClient,
  invalidateNovelDetail,
  t,
}: UseStorylineVersionControlArgs) {
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [storylineMessage, setStorylineMessage] = useState("");
  const [diffResult, setDiffResult] = useState<StorylineDiff | null>(null);
  const [impactResult, setImpactResult] = useState<StorylineImpactResult | null>(null);

  const storylineVersionsQuery = useQuery({
    queryKey: queryKeys.novels.storylineVersions(novelId),
    queryFn: () => listStorylineVersions(novelId),
    enabled: Boolean(novelId),
  });

  const storylineVersions = storylineVersionsQuery.data?.data ?? [];
  const selectedVersion = useMemo(
    () => storylineVersions.find((item) => item.id === selectedVersionId),
    [selectedVersionId, storylineVersions],
  );

  useEffect(() => {
    if (!selectedVersionId && storylineVersions.length > 0) {
      setSelectedVersionId(storylineVersions[0].id);
    }
  }, [selectedVersionId, storylineVersions]);

  const invalidateVersionList = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.novels.storylineVersions(novelId) });
  };

  const createDraftVersionMutation = useMutation({
    mutationFn: () => createStorylineDraft(novelId, {
      content: draftText,
      baseVersion: selectedVersion?.version,
    }),
    onSuccess: async (response) => {
      const nextVersionId = response.data?.id;
      if (nextVersionId) {
        setSelectedVersionId(nextVersionId);
      }
      setStorylineMessage(response.message ?? t("structured.storylineVersionControl.draftCreated"));
      await invalidateVersionList();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t("structured.storylineVersionControl.draftCreateFailed");
      setStorylineMessage(message);
    },
  });

  const activateVersionMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(t("structured.storylineVersionControl.selectVersionFirst"));
      }
      return activateStorylineVersion(novelId, selectedVersionId);
    },
    onSuccess: async (response) => {
      setStorylineMessage(response.message ?? t("structured.storylineVersionControl.activateSuccess"));
      await invalidateVersionList();
      await invalidateNovelDetail();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t("structured.storylineVersionControl.activateFailed");
      setStorylineMessage(message);
    },
  });

  const freezeVersionMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(t("structured.storylineVersionControl.selectVersionFirst"));
      }
      return freezeStorylineVersion(novelId, selectedVersionId);
    },
    onSuccess: async (response) => {
      setStorylineMessage(response.message ?? t("structured.storylineVersionControl.freezeSuccess"));
      await invalidateVersionList();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t("structured.storylineVersionControl.freezeFailed");
      setStorylineMessage(message);
    },
  });

  const diffMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(t("structured.storylineVersionControl.selectVersionFirst"));
      }
      return getStorylineDiff(novelId, selectedVersionId);
    },
    onSuccess: (response) => {
      setDiffResult(response.data ?? null);
      setStorylineMessage(response.message ?? t("structured.storylineVersionControl.diffUpdated"));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t("structured.storylineVersionControl.diffLoadFailed");
      setStorylineMessage(message);
    },
  });

  const analyzeDraftImpactMutation = useMutation({
    mutationFn: () => analyzeStorylineImpact(novelId, { content: draftText }),
    onSuccess: (response) => {
      setImpactResult(response.data ?? null);
      setStorylineMessage(response.message ?? t("structured.storylineVersionControl.draftImpactDone"));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t("structured.storylineVersionControl.draftImpactFailed");
      setStorylineMessage(message);
    },
  });

  const analyzeVersionImpactMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(t("structured.storylineVersionControl.selectVersionFirst"));
      }
      return analyzeStorylineImpact(novelId, { versionId: selectedVersionId });
    },
    onSuccess: (response) => {
      setImpactResult(response.data ?? null);
      setStorylineMessage(response.message ?? t("structured.storylineVersionControl.versionImpactDone"));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t("structured.storylineVersionControl.versionImpactFailed");
      setStorylineMessage(message);
    },
  });

  const loadSelectedVersionToDraft = () => {
    if (!selectedVersion) {
      return;
    }
    setDraftText(selectedVersion.content);
    setStorylineMessage(t("structured.storylineVersionControl.loadedVersion", { version: selectedVersion.version }));
  };

  return {
    storylineMessage,
    storylineVersions,
    selectedVersionId,
    setSelectedVersionId,
    selectedVersion,
    diffResult,
    impactResult,
    isLoadingVersions: storylineVersionsQuery.isLoading,
    createDraftVersionMutation,
    activateVersionMutation,
    freezeVersionMutation,
    diffMutation,
    analyzeDraftImpactMutation,
    analyzeVersionImpactMutation,
    loadSelectedVersionToDraft,
  };
}
