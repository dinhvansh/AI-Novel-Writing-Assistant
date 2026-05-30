import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TitleFactorySuggestion } from "@ai-novel/shared/types/title";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { flattenGenreTreeOptions, type GenreTreeNode } from "@/api/genre";
import { generateNovelTitles, type NovelListResponse } from "@/api/novel";
import { createTitleLibraryEntry } from "@/api/title";
import { queryKeys } from "@/api/queryKeys";
import { generateTitleIdeas } from "@/api/title";
import LLMSelector from "@/components/common/LLMSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { useLLMStore } from "@/store/llmStore";
import TitleSuggestionList from "./TitleSuggestionList";

interface TitleFactoryPanelProps {
  genreTree: GenreTreeNode[];
  novels: NovelListResponse["items"];
}

type FactoryMode = "novel" | "brief" | "adapt";

function sortSuggestions<T extends { clickRate: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => right.clickRate - left.clickRate);
}

export default function TitleFactoryPanel({ genreTree, novels }: TitleFactoryPanelProps) {
  const { t } = useTranslation();
  const llm = useLLMStore();
  const queryClient = useQueryClient();
  const genreOptions = useMemo(() => flattenGenreTreeOptions(genreTree), [genreTree]);
  const [mode, setMode] = useState<FactoryMode>("novel");
  const [selectedNovelId, setSelectedNovelId] = useState("");
  const [brief, setBrief] = useState("");
  const [referenceTitle, setReferenceTitle] = useState("");
  const [genreId, setGenreId] = useState("");
  const [count, setCount] = useState(10);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [suggestions, setSuggestions] = useState<TitleFactorySuggestion[]>([]);

  const selectedNovel = useMemo(
    () => novels.find((item) => item.id === selectedNovelId) ?? null,
    [novels, selectedNovelId],
  );

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (mode === "novel") {
        if (!selectedNovelId) {
          throw new Error(t("titles:factory.noNovelSelected"));
        }
        const response = await generateNovelTitles(selectedNovelId, {
          provider: llm.provider,
          model: llm.model,
          temperature: llm.temperature,
          count,
          maxTokens: llm.maxTokens,
        });
        return response.data?.titles ?? [];
      }

      const response = await generateTitleIdeas({
        mode,
        brief,
        referenceTitle,
        genreId: genreId || null,
        count,
        provider: llm.provider,
        model: llm.model,
        temperature: llm.temperature,
        maxTokens: llm.maxTokens,
      });
      return response.data?.titles ?? [];
    },
    onSuccess: (rows) => {
      const next = sortSuggestions(rows);
      setSuggestions(next);
      setSelectedTitle(next[0]?.title ?? "");
      toast.success(t("titles:factory.generated", { count: next.length }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: (suggestion: TitleFactorySuggestion) => {
      const resolvedGenreId = mode === "novel" ? selectedNovel?.genre?.id ?? null : genreId || null;
      const description = mode === "novel"
        ? t("titles:factory.descriptionFromNovel", { title: selectedNovel?.title ?? t("titles:factory.unnamedProject") })
        : mode === "adapt"
          ? t("titles:factory.descriptionFromAdapt", { title: referenceTitle.trim() })
          : brief.trim().slice(0, 400);
      const keywords = mode === "novel"
        ? selectedNovel?.title ?? null
        : mode === "adapt"
          ? t("titles:factory.keywordsFromAdapt", { title: referenceTitle.trim() })
          : brief.trim().slice(0, 160);
      return createTitleLibraryEntry({
        title: suggestion.title,
        clickRate: suggestion.clickRate,
        description: description || null,
        keywords,
        genreId: resolvedGenreId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.titles.all });
      toast.success(t("titles:factory.saveSuccess"));
    },
  });

  const handleCopy = async (suggestion: TitleFactorySuggestion) => {
    await navigator.clipboard.writeText(suggestion.title);
    setSelectedTitle(suggestion.title);
    toast.success(t("titles:factory.copySuccess"));
  };

  const handlePrimaryAction = async (suggestion: TitleFactorySuggestion) => {
    await handleCopy(suggestion);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="text-sm font-medium text-foreground">{t("titles:factory.modelSettings")}</div>
        <div className="mt-3">
          <LLMSelector showParameters />
        </div>
      </div>

      <Tabs value={mode} onValueChange={(value) => setMode(value as FactoryMode)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="novel">{t("titles:factory.modes.novel")}</TabsTrigger>
          <TabsTrigger value="brief">{t("titles:factory.modes.brief")}</TabsTrigger>
          <TabsTrigger value="adapt">{t("titles:factory.modes.adapt")}</TabsTrigger>
        </TabsList>

        <TabsContent value="novel" className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title-factory-novel" className="text-sm font-medium text-foreground">
              {t("titles:factory.novelLabel")}
            </label>
            <select
              id="title-factory-novel"
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={selectedNovelId}
              onChange={(event) => setSelectedNovelId(event.target.value)}
            >
              <option value="">{t("titles:factory.novelPlaceholder")}</option>
              {novels.map((novel) => (
                <option key={novel.id} value={novel.id}>
                  {novel.title}
                </option>
              ))}
            </select>
            <div className="text-xs text-muted-foreground">
              {t("titles:factory.novelHint")}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="brief" className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title-factory-brief" className="text-sm font-medium text-foreground">
              {t("titles:factory.briefLabel")}
            </label>
            <textarea
              id="title-factory-brief"
              className="min-h-[140px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder={t("titles:factory.briefPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="title-factory-genre" className="text-sm font-medium text-foreground">
              {t("titles:factory.genreLabel")}
            </label>
            <select
              id="title-factory-genre"
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={genreId}
              onChange={(event) => setGenreId(event.target.value)}
            >
              <option value="">{t("titles:factory.noGenre")}</option>
              {genreOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.path}
                </option>
              ))}
            </select>
          </div>
        </TabsContent>

        <TabsContent value="adapt" className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title-factory-reference" className="text-sm font-medium text-foreground">
              {t("titles:factory.referenceLabel")}
            </label>
            <Input
              id="title-factory-reference"
              value={referenceTitle}
              onChange={(event) => setReferenceTitle(event.target.value)}
              placeholder={t("titles:factory.referencePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="title-factory-adapt-brief" className="text-sm font-medium text-foreground">
              {t("titles:factory.adaptBriefLabel")}
            </label>
            <textarea
              id="title-factory-adapt-brief"
              className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder={t("titles:factory.adaptBriefPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="title-factory-adapt-genre" className="text-sm font-medium text-foreground">
              {t("titles:factory.genreLabel")}
            </label>
            <select
              id="title-factory-adapt-genre"
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={genreId}
              onChange={(event) => setGenreId(event.target.value)}
            >
              <option value="">{t("titles:factory.noGenre")}</option>
              {genreOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.path}
                </option>
              ))}
            </select>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 md:flex-row md:items-end md:justify-between">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">{t("titles:factory.countLabel")}</span>
          <Input
            type="number"
            min={3}
            max={24}
            step={1}
            value={count}
            onChange={(event) => setCount(Number(event.target.value) || 10)}
            className="w-[120px]"
          />
        </label>
        <Button type="button" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? t("titles:factory.generating") : t("titles:factory.generate")}
        </Button>
      </div>

      <TitleSuggestionList
        suggestions={suggestions}
        selectedTitle={selectedTitle}
        primaryActionLabel={t("titles:factory.primaryAction")}
        onPrimaryAction={handlePrimaryAction}
        onCopy={handleCopy}
        onSave={(suggestion) => saveMutation.mutate(suggestion)}
        savingTitle={saveMutation.isPending ? saveMutation.variables?.title ?? "" : ""}
        emptyMessage={t("titles:factory.emptyMessage")}
      />
    </div>
  );
}
