import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { listImageAssets, resolveImageAssetUrl } from "@/api/images";
import { queryKeys } from "@/api/queryKeys";
import { Button } from "@/components/ui/button";
import type { NovelBasicFormState } from "../../novelBasicInfo.shared";
import type { StoryWorldSliceView } from "@ai-novel/shared/types/storyWorldSlice";
import { NovelCoverDialog } from "./NovelCoverDialog";

interface GenreOption {
  id: string;
  label: string;
  path: string;
}

interface StoryModeOption {
  id: string;
  name: string;
  label: string;
  path: string;
}

interface WorldOption {
  id: string;
  name: string;
}

interface NovelCoverCardProps {
  novelId: string;
  basicForm: NovelBasicFormState;
  genreOptions: GenreOption[];
  storyModeOptions: StoryModeOption[];
  worldOptions: WorldOption[];
  worldSliceView?: StoryWorldSliceView | null;
}

export function NovelCoverCard(props: NovelCoverCardProps) {
  const { t } = useTranslation("novel");
  const [open, setOpen] = useState(false);

  const assetsQuery = useQuery({
    queryKey: queryKeys.images.assets("novel_cover", props.novelId),
    queryFn: () => listImageAssets({
      sceneType: "novel_cover",
      sceneId: props.novelId,
    }),
    staleTime: 30_000,
  });

  const assets = assetsQuery.data?.data ?? [];
  const primaryAsset = useMemo(
    () => assets.find((item) => item.isPrimary) ?? assets[0] ?? null,
    [assets],
  );

  return (
    <>
      <section className="space-y-4 rounded-xl border border-border/70 bg-background/95 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">{t("cover.cardTitle")}</div>
            <div className="text-sm leading-6 text-muted-foreground">
              {t("cover.cardDescription")}
            </div>
          </div>
          <Button type="button" variant="outline" className="shrink-0" onClick={() => setOpen(true)}>
            {assets.length > 0 ? t("cover.manageGallery") : t("cover.generateCover")}
          </Button>
        </div>

        {assetsQuery.isLoading ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            {t("cover.loadingGalleryCard")}
          </div>
        ) : null}

        {!assetsQuery.isLoading && !primaryAsset ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            {t("cover.emptyGalleryCard")}
          </div>
        ) : null}

        {primaryAsset ? (
          <div className="grid gap-4 lg:grid-cols-[220px,1fr]">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20 shadow-sm">
              <div className="aspect-[2/3] w-full">
                <img
                  src={resolveImageAssetUrl(primaryAsset.url)}
                  alt={t("cover.coverAltCurrent", { title: props.basicForm.title || t("cover.novelFallback") })}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  {t("cover.primaryCoverBadge")}
                </span>
                <span className="text-xs text-muted-foreground">{t("cover.candidateCount", { count: assets.length })}</span>
              </div>

              <div className="text-sm leading-6 text-muted-foreground">
                {t("cover.primarySwitchNote")}
              </div>

              {assets.length > 1 ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                  {assets.slice(0, 6).map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      className="overflow-hidden rounded-xl border border-border/70 bg-muted/10 transition hover:border-primary/40"
                      onClick={() => setOpen(true)}
                      title={t("cover.openGalleryTitle")}
                    >
                      <div className="aspect-[2/3] w-full">
                        <img
                          src={resolveImageAssetUrl(asset.url)}
                          alt={t("cover.coverAltCandidate", { title: props.basicForm.title || t("cover.novelFallback") })}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <NovelCoverDialog
        open={open}
        novelId={props.novelId}
        basicForm={props.basicForm}
        genreOptions={props.genreOptions}
        storyModeOptions={props.storyModeOptions}
        worldOptions={props.worldOptions}
        worldSliceView={props.worldSliceView}
        onOpenChange={setOpen}
      />
    </>
  );
}
