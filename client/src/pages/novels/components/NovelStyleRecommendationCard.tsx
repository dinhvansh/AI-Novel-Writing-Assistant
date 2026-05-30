import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { StyleRecommendationResult } from "@ai-novel/shared/types/styleEngine";
import { createStyleBinding, getStyleBindings, recommendStyleProfilesForNovel } from "@/api/styleEngine";
import { queryKeys } from "@/api/queryKeys";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLLMStore } from "@/store/llmStore";

interface NovelStyleRecommendationCardProps {
  novelId: string;
}

export default function NovelStyleRecommendationCard({ novelId }: NovelStyleRecommendationCardProps) {
  const { t } = useTranslation("novel");
  const llm = useLLMStore();
  const queryClient = useQueryClient();
  const [recommendation, setRecommendation] = useState<StyleRecommendationResult | null>(null);
  const [message, setMessage] = useState("");

  const novelBindingsQuery = useQuery({
    queryKey: queryKeys.styleEngine.bindings(`novel-${novelId}`),
    queryFn: () => getStyleBindings({ targetType: "novel", targetId: novelId }),
    enabled: Boolean(novelId),
  });

  const currentBindings = novelBindingsQuery.data?.data ?? [];
  const hasConfirmedBookStyle = currentBindings.length > 0;

  const recommendMutation = useMutation({
    mutationFn: () => recommendStyleProfilesForNovel(novelId, {
      provider: llm.provider,
      model: llm.model,
      temperature: 0.3,
    }),
    onSuccess: (response) => {
      setRecommendation(response.data ?? null);
      setMessage("");
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : t("styleRecommendation.recommendError"));
    },
  });

  const applyMutation = useMutation({
    mutationFn: (styleProfileId: string) => createStyleBinding({
      styleProfileId,
      targetType: "novel",
      targetId: novelId,
      priority: 1,
      weight: 1,
      enabled: true,
    }),
    onSuccess: async () => {
      setMessage(t("styleRecommendation.bindingSuccess"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.styleEngine.bindings(`novel-${novelId}`) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.styleEngine.bindings("all") });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : t("styleRecommendation.bindingError"));
    },
  });

  if (!novelId) {
    return null;
  }

  return (
    <Card className="border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{t("styleRecommendation.title")}</CardTitle>
            <div className="text-sm leading-7 text-muted-foreground">
              {t("styleRecommendation.description")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline">
              <Link to="/style-engine">{t("styleRecommendation.openAssetLibrary")}</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to="/style-engine?mode=imitate">{t("styleRecommendation.createNewStyle")}</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
          <div className="space-y-4 rounded-2xl border bg-slate-50/70 p-4">
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-sm font-medium text-slate-900">{t("styleRecommendation.currentBookStyle")}</div>
              {hasConfirmedBookStyle ? (
                <div className="mt-3 space-y-2">
                  {currentBindings.map((binding) => (
                    <div key={binding.id} className="rounded-xl border bg-slate-50/70 p-3">
                      <div className="font-medium text-slate-900">{binding.styleProfile?.name ?? binding.styleProfileId}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {t("styleRecommendation.priorityWeight", { priority: binding.priority, weight: binding.weight })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-sm leading-7 text-muted-foreground">
                  {t("styleRecommendation.noBinding")}
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-slate-950 p-4 text-white">
              <div className="text-sm font-medium">{t("styleRecommendation.effectTitle")}</div>
              <div className="mt-3 space-y-2 text-sm leading-7 text-slate-200">
                <div>{t("styleRecommendation.effectPlanning")}</div>
                <div>{t("styleRecommendation.effectWriting")}</div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <AiButton onClick={() => recommendMutation.mutate()} disabled={recommendMutation.isPending}>
                {recommendMutation.isPending ? t("styleRecommendation.recommending") : t("styleRecommendation.generateRecommendations")}
              </AiButton>
              {recommendation ? (
                <AiButton variant="secondary" onClick={() => recommendMutation.mutate()} disabled={recommendMutation.isPending}>
                  {t("styleRecommendation.reRecommend")}
                </AiButton>
              ) : null}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border bg-white p-4">
            <div className="text-sm font-medium text-slate-900">{t("styleRecommendation.recommendationResult")}</div>
            {recommendation ? (
              <>
                <div className="rounded-2xl border bg-slate-50/70 p-4 text-sm leading-7 text-slate-700">
                  {recommendation.summary}
                </div>
                {recommendation.candidates.length > 0 ? (
                  <div className="grid gap-3">
                    {recommendation.candidates.map((candidate) => (
                      <div key={candidate.styleProfileId} className="rounded-2xl border bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold text-slate-900">{candidate.styleProfileName}</div>
                            {candidate.styleProfileDescription ? (
                              <div className="mt-1 text-xs leading-6 text-slate-600">{candidate.styleProfileDescription}</div>
                            ) : null}
                          </div>
                          <Badge variant="outline">{t("styleRecommendation.fitScore", { score: candidate.fitScore })}</Badge>
                        </div>
                        <div className="mt-3 text-sm leading-7 text-slate-700">{candidate.recommendationReason}</div>
                        {candidate.caution ? (
                          <div className="mt-3 rounded-xl border bg-amber-50/70 p-3 text-xs leading-6 text-amber-900">
                            {t("styleRecommendation.caution")}：{candidate.caution}
                          </div>
                        ) : null}
                        <div className="mt-4 flex justify-end">
                          <Button
                            type="button"
                            onClick={() => applyMutation.mutate(candidate.styleProfileId)}
                            disabled={applyMutation.isPending}
                          >
                            {applyMutation.isPending ? t("styleRecommendation.binding") : t("styleRecommendation.setAsDefault")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    {t("styleRecommendation.noAssets")}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed p-4 text-sm leading-7 text-muted-foreground">
                {t("styleRecommendation.emptyResult")}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {message ? (
        <CardContent className="pt-0">
          <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm">
            {message}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
