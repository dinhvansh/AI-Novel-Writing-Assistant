import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TitleFactorySuggestion, TitleLibraryEntry } from "@ai-novel/shared/types/title";
import {
  AI_FREEDOM_OPTIONS,
  EMOTION_OPTIONS,
  PACE_OPTIONS,
  POV_OPTIONS,
  WRITING_MODE_OPTIONS,
  type NovelBasicFormState,
} from "../../novelBasicInfo.shared";
import {
  buildTitleLibraryListKey,
  createTitleLibraryEntry,
  generateTitleIdeas,
  listTitleLibrary,
} from "@/api/title";
import { queryKeys } from "@/api/queryKeys";
import AiButton from "@/components/common/AiButton";
import LLMSelector from "@/components/common/LLMSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { useLLMStore } from "@/store/llmStore";
import TitleSuggestionList from "@/pages/titles/components/TitleSuggestionList";
import { getClickRateBadgeClass, truncateText } from "@/pages/titles/titleStudio.shared";

interface NovelCreateTitleQuickFillProps {
  basicForm: NovelBasicFormState;
  onApplyTitle: (title: string) => void;
}

const DEFAULT_TITLE_COUNT = 8;
const TITLE_LIBRARY_PAGE_SIZE = 8;

function sortSuggestions(items: TitleFactorySuggestion[]): TitleFactorySuggestion[] {
  return [...items].sort((left, right) => right.clickRate - left.clickRate);
}

function resolveOptionLabel<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: T,
): string | null {
  return options.find((item) => item.value === value)?.label ?? null;
}

function buildGenerationBrief(basicForm: NovelBasicFormState): string {
  // i18n-ignore: AI prompt
  const lines = [
    basicForm.description.trim() ? `作品概述：${basicForm.description.trim()}` : "",
    basicForm.title.trim() ? `当前草拟标题：${basicForm.title.trim()}` : "",
    `创作模式：${resolveOptionLabel(WRITING_MODE_OPTIONS, basicForm.writingMode) ?? basicForm.writingMode}`,
    `叙事视角：${resolveOptionLabel(POV_OPTIONS, basicForm.narrativePov) ?? basicForm.narrativePov}`,
    `节奏偏好：${resolveOptionLabel(PACE_OPTIONS, basicForm.pacePreference) ?? basicForm.pacePreference}`,
    `情绪浓度：${resolveOptionLabel(EMOTION_OPTIONS, basicForm.emotionIntensity) ?? basicForm.emotionIntensity}`,
    `AI 自由度：${resolveOptionLabel(AI_FREEDOM_OPTIONS, basicForm.aiFreedom) ?? basicForm.aiFreedom}`,
    basicForm.styleTone.trim() ? `文风关键词：${basicForm.styleTone.trim()}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

function renderLibraryDescription(entry: TitleLibraryEntry, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (entry.description?.trim()) {
    return truncateText(entry.description, 100);
  }
  if (entry.keywords?.trim()) {
    return t("novel:titleWorkshop.library.keywordsPrefix", { keywords: truncateText(entry.keywords, 80) });
  }
  return t("novel:titleWorkshop.library.defaultDescription");
}

function joinKeywords(...values: Array<string | null | undefined>): string | null {
  const next = values
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(" / ")
    .slice(0, 160);
  return next || null;
}

export default function NovelCreateTitleQuickFill({
  basicForm,
  onApplyTitle,
}: NovelCreateTitleQuickFillProps) {
  const { t } = useTranslation();
  const llm = useLLMStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"generate" | "library">("generate");
  const [count, setCount] = useState(DEFAULT_TITLE_COUNT);
  const [search, setSearch] = useState("");
  const [manualBrief, setManualBrief] = useState("");
  const [referenceTitle, setReferenceTitle] = useState("");
  const [suggestions, setSuggestions] = useState<TitleFactorySuggestion[]>([]);

  const autoBrief = useMemo(() => buildGenerationBrief(basicForm), [basicForm]);
  const resolvedBrief = useMemo(
    () => [autoBrief, manualBrief.trim() ? t("novel:titleWorkshop.generate.extraSupplementPrefix", { text: manualBrief.trim() }) : ""].filter(Boolean).join("\n"),
    [autoBrief, manualBrief, t],
  );
  const generationMode = referenceTitle.trim() ? "adapt" : "brief";
  const hasGenerationContext = Boolean(resolvedBrief.trim() || referenceTitle.trim());

  const titleLibraryParams = useMemo(
    () => ({
      page: 1,
      pageSize: TITLE_LIBRARY_PAGE_SIZE,
      search: search.trim() || undefined,
      genreId: basicForm.genreId || undefined,
      sort: "clickRate" as const,
    }),
    [basicForm.genreId, search],
  );
  const titleLibraryParamsKey = useMemo(
    () => buildTitleLibraryListKey(titleLibraryParams),
    [titleLibraryParams],
  );

  const libraryQuery = useQuery({
    queryKey: queryKeys.titles.list(titleLibraryParamsKey),
    queryFn: () => listTitleLibrary(titleLibraryParams),
    staleTime: 60 * 1000,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!hasGenerationContext) {
        throw new Error(t("novel:titleWorkshop.generate.noContextError"));
      }
      const response = await generateTitleIdeas({
        mode: generationMode,
        brief: resolvedBrief || undefined,
        referenceTitle: referenceTitle.trim() || undefined,
        genreId: basicForm.genreId || null,
        count: Math.min(24, Math.max(3, Math.floor(count) || DEFAULT_TITLE_COUNT)),
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
      toast.success(t("novel:titleWorkshop.generate.generatedCount", { count: next.length }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: (suggestion: TitleFactorySuggestion) => createTitleLibraryEntry({
      title: suggestion.title,
      description: basicForm.description.trim().slice(0, 400) || manualBrief.trim().slice(0, 400) || null,
      clickRate: suggestion.clickRate,
      keywords: joinKeywords(basicForm.title, referenceTitle, basicForm.styleTone),
      genreId: basicForm.genreId || null,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.titles.all });
      toast.success(t("novel:titleWorkshop.generate.savedToLibrary"));
    },
  });

  const handleApplyTitle = (title: string, source: "generated" | "library") => {
    onApplyTitle(title);
    setOpen(false);
    toast.success(source === "generated" ? t("novel:titleWorkshop.apply.appliedFromGenerated") : t("novel:titleWorkshop.apply.appliedFromLibrary"));
  };

  const handleCopySuggestion = async (suggestion: TitleFactorySuggestion) => {
    await navigator.clipboard.writeText(suggestion.title);
    toast.success(t("novel:titleWorkshop.apply.copiedToClipboard"));
  };

  return (
    <>
      <div className="flex items-center justify-end">
        <AiButton type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          {t("novel:titleWorkshop.triggerButton")}
        </AiButton>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("novel:titleWorkshop.dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("novel:titleWorkshop.dialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as "generate" | "library")}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">{t("novel:titleWorkshop.tabs.generate")}</TabsTrigger>
              <TabsTrigger value="library">{t("novel:titleWorkshop.tabs.library")}</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="rounded-lg border bg-background/80 p-3">
                <div className="text-xs leading-6 text-muted-foreground">
                  {t("novel:titleWorkshop.generate.autoBriefHint")}
                </div>
                <div className="mt-3">
                  <LLMSelector />
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="space-y-2">
                    <label
                      htmlFor="novel-create-title-quick-brief"
                      className="text-sm font-medium text-foreground"
                    >
                      {t("novel:titleWorkshop.generate.briefLabel")}
                    </label>
                    <textarea
                      id="novel-create-title-quick-brief"
                      className="min-h-[132px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      value={manualBrief}
                      onChange={(event) => setManualBrief(event.target.value)}
                      placeholder={t("novel:titleWorkshop.generate.briefPlaceholder")}
                    />
                    <div className="text-xs leading-6 text-muted-foreground">
                      {t("novel:titleWorkshop.generate.briefHint")}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label
                        htmlFor="novel-create-title-reference"
                        className="text-sm font-medium text-foreground"
                      >
                      {t("novel:titleWorkshop.generate.referenceTitleLabel")}
                    </label>
                      <Input
                        id="novel-create-title-reference"
                        value={referenceTitle}
                        onChange={(event) => setReferenceTitle(event.target.value)}
                        placeholder={t("novel:titleWorkshop.generate.referenceTitlePlaceholder")}
                      />
                    </div>
                    <div className="rounded-md border bg-muted/20 p-3 text-xs leading-6 text-muted-foreground">
                      {referenceTitle.trim()
                        ? t("novel:titleWorkshop.generate.referenceActiveHint")
                        : t("novel:titleWorkshop.generate.referenceEmptyHint")}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-md border bg-muted/20 p-3">
                  <div className="text-xs font-medium text-foreground">{t("novel:titleWorkshop.generate.autoBriefSectionTitle")}</div>
                  <div className="mt-2 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">
                    {autoBrief || t("novel:titleWorkshop.generate.autoBriefEmpty")}
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">{t("novel:titleWorkshop.generate.countLabel")}</span>
                    <Input
                      type="number"
                      min={3}
                      max={24}
                      step={1}
                      value={count}
                      onChange={(event) => setCount(Number(event.target.value) || DEFAULT_TITLE_COUNT)}
                      className="w-[120px]"
                    />
                  </label>
                  <AiButton
                    type="button"
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending || !hasGenerationContext}
                  >
                    {generateMutation.isPending ? t("novel:titleWorkshop.generate.generating") : t("novel:titleWorkshop.generate.generateButton")}
                  </AiButton>
                </div>

                {!hasGenerationContext ? (
                  <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
                    {t("novel:titleWorkshop.generate.noContextWarning")}
                  </div>
                ) : null}
              </div>

              <TitleSuggestionList
                suggestions={suggestions}
                selectedTitle={basicForm.title}
                primaryActionLabel={t("novel:titleWorkshop.apply.fillTitle")}
                onPrimaryAction={(suggestion) => handleApplyTitle(suggestion.title, "generated")}
                onCopy={handleCopySuggestion}
                onSave={(suggestion) => saveMutation.mutate(suggestion)}
                savingTitle={saveMutation.isPending ? saveMutation.variables?.title ?? "" : ""}
                emptyMessage={t("novel:titleWorkshop.generate.emptyMessage")}
              />
            </TabsContent>

            <TabsContent value="library" className="space-y-4">
              <div className="flex flex-col gap-3 rounded-lg border bg-background/80 p-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">{t("novel:titleWorkshop.library.title")}</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    {basicForm.genreId
                      ? t("novel:titleWorkshop.library.sortHintWithGenre")
                      : t("novel:titleWorkshop.library.sortHint")}
                  </div>
                </div>
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("novel:titleWorkshop.library.searchPlaceholder")}
                  className="md:max-w-xs"
                />
              </div>

              {libraryQuery.isLoading ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  {t("novel:titleWorkshop.library.loading")}
                </div>
              ) : (libraryQuery.data?.data?.items ?? []).length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  {t("novel:titleWorkshop.library.empty")}
                </div>
              ) : (
                <div className="grid gap-3">
                  {(libraryQuery.data?.data?.items ?? []).map((entry) => {
                    const isSelected = basicForm.title.trim() === entry.title.trim();
                    return (
                      <div
                        key={entry.id}
                        className={`rounded-xl border p-4 transition ${
                          isSelected ? "border-primary/50 bg-primary/5" : "border-border/70 bg-background"
                        }`}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {typeof entry.clickRate === "number" ? (
                                <Badge className={getClickRateBadgeClass(entry.clickRate)}>
                                  {t("novel:titleWorkshop.library.estimatedClickRate", { rate: entry.clickRate })}
                                </Badge>
                              ) : null}
                              {typeof entry.usedCount === "number" ? (
                                <Badge variant="secondary">{t("novel:titleWorkshop.library.usedCount", { count: entry.usedCount })}</Badge>
                              ) : null}
                              {entry.genre?.name ? <Badge variant="outline">{entry.genre.name}</Badge> : null}
                              {isSelected ? <Badge variant="outline">{t("novel:titleWorkshop.library.currentlySelected")}</Badge> : null}
                            </div>
                            <div className="text-lg font-semibold text-foreground">{entry.title}</div>
                            <div className="text-sm leading-6 text-muted-foreground">
                              {renderLibraryDescription(entry, t)}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button type="button" size="sm" onClick={() => handleApplyTitle(entry.title, "library")}>
                              {t("novel:titleWorkshop.apply.fillTitle")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
