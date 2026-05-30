import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { TitleFactorySuggestion } from "@ai-novel/shared/types/title";
import { generateNovelTitles } from "@/api/novel";
import { createTitleLibraryEntry } from "@/api/title";
import { queryKeys } from "@/api/queryKeys";
import AiButton from "@/components/common/AiButton";
import LLMSelector from "@/components/common/LLMSelector";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useLLMStore } from "@/store/llmStore";
import TitleSuggestionList from "@/pages/titles/components/TitleSuggestionList";

interface NovelTitleWorkshopProps {
  novelId: string;
  currentTitle: string;
  currentDescription?: string;
  genreId?: string;
  onApplyTitle: (title: string) => void;
}
const DEFAULT_NOVEL_TITLE_COUNT = 12;

export default function NovelTitleWorkshop({
  novelId,
  currentTitle,
  currentDescription,
  genreId,
  onApplyTitle,
}: NovelTitleWorkshopProps) {
  const { t } = useTranslation("novel");
  const llm = useLLMStore();
  const queryClient = useQueryClient();
  const [selectedTitle, setSelectedTitle] = useState(currentTitle);
  const [suggestions, setSuggestions] = useState<TitleFactorySuggestion[]>([]);

  const generateMutation = useMutation({
    mutationFn: () => generateNovelTitles(novelId, {
      provider: llm.provider,
      model: llm.model,
      temperature: llm.temperature,
      count: DEFAULT_NOVEL_TITLE_COUNT,
      maxTokens: llm.maxTokens,
    }),
    onSuccess: (response) => {
      const next = [...(response.data?.titles ?? [])].sort((left, right) => right.clickRate - left.clickRate);
      setSuggestions(next);
      setSelectedTitle(next[0]?.title ?? currentTitle);
      toast.success(t("titleWorkshop.generatedCount", { count: next.length }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: (suggestion: TitleFactorySuggestion) => createTitleLibraryEntry({
      title: suggestion.title,
      description: currentDescription?.trim().slice(0, 400) || null,
      clickRate: suggestion.clickRate,
      keywords: currentTitle?.trim().slice(0, 160) || null,
      genreId: genreId || null,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.titles.all });
      toast.success(t("titleWorkshop.savedToLibrary"));
    },
  });

  const saveCurrentMutation = useMutation({
    mutationFn: () => createTitleLibraryEntry({
      title: currentTitle,
      description: currentDescription?.trim().slice(0, 400) || null,
      keywords: currentTitle.trim().slice(0, 160),
      genreId: genreId || null,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.titles.all });
      toast.success(t("titleWorkshop.currentSavedToLibrary"));
    },
  });

  const handleCopy = async (suggestion: TitleFactorySuggestion) => {
    await navigator.clipboard.writeText(suggestion.title);
    setSelectedTitle(suggestion.title);
    toast.success(t("titleWorkshop.copiedToClipboard"));
  };

  const handleApply = (suggestion: TitleFactorySuggestion) => {
    setSelectedTitle(suggestion.title);
    onApplyTitle(suggestion.title);
    toast.success(t("titleWorkshop.appliedToForm"));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">{t("titleWorkshop.inProjectTitle")}</div>
            <div className="text-sm leading-6 text-muted-foreground">
              {t("titleWorkshop.inProjectDescription")}
            </div>
          </div>
          <Button type="button" variant="outline" disabled={!currentTitle.trim() || saveCurrentMutation.isPending} onClick={() => saveCurrentMutation.mutate()}>
            {saveCurrentMutation.isPending ? t("titleWorkshop.saving") : t("titleWorkshop.saveCurrentTitle")}
          </Button>
        </div>
          <div className="mt-4 space-y-3">
            <LLMSelector />
            <div className="flex justify-end">
              <AiButton type="button" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? t("titleWorkshop.generating") : t("titleWorkshop.generateCandidates")}
              </AiButton>
            </div>
          </div>
      </div>

      <TitleSuggestionList
        suggestions={suggestions}
        selectedTitle={selectedTitle}
        primaryActionLabel={t("titleWorkshop.applyToProject")}
        onPrimaryAction={handleApply}
        onCopy={handleCopy}
        onSave={(suggestion) => saveMutation.mutate(suggestion)}
        savingTitle={saveMutation.isPending ? saveMutation.variables?.title ?? "" : ""}
        emptyMessage={t("titleWorkshop.emptyMessage")}
      />
    </div>
  );
}
