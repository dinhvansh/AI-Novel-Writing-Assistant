import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ImageAsset } from "@ai-novel/shared/types/image";
import { resolveImageAssetUrl } from "@/api/images";
import type { BaseCharacter } from "@ai-novel/shared/types/novel";
import { Button } from "@/components/ui/button";
import { AppDialogContent, Dialog } from "@/components/ui/dialog";

interface CharacterCardProps {
  character: BaseCharacter;
  assets: ImageAsset[];
  assetsLoading?: boolean;
  onGenerateImage: () => void;
  onSetPrimary: (assetId: string) => void;
  onDeleteAsset: (asset: ImageAsset) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
  settingPrimary?: boolean;
  deletingAssetId?: string | null;
  deleting?: boolean;
  extraActions?: ReactNode;
}

export function CharacterCard({
  character,
  assets,
  assetsLoading,
  onGenerateImage,
  onSetPrimary,
  onDeleteAsset,
  onEdit,
  onDelete,
  settingPrimary,
  deletingAssetId,
  deleting,
  extraActions,
}: CharacterCardProps) {
  const { t } = useTranslation("characters");
  const [previewAsset, setPreviewAsset] = useState<ImageAsset | null>(null);

  const handleDeleteAsset = async (asset: ImageAsset) => {
    const confirmed = window.confirm(t("card.confirmDeleteAsset"));
    if (!confirmed) {
      return;
    }
    try {
      await onDeleteAsset(asset);
      setPreviewAsset((current) => (current?.id === asset.id ? null : current));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : t("card.deleteAssetError"));
    }
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{character.name}</div>
          <div className="text-sm text-muted-foreground">{character.role}</div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {extraActions}
          <Button size="sm" variant="outline" onClick={onGenerateImage}>
            {t("card.generateImage")}
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            {t("card.edit")}
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete} disabled={deleting}>
            {deleting ? t("card.deleting") : t("card.delete")}
          </Button>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <div><span className="text-muted-foreground">{t("card.personality")}：</span>{character.personality || t("card.empty")}</div>
        <div><span className="text-muted-foreground">{t("card.appearance")}：</span>{character.appearance || t("card.empty")}</div>
        <div><span className="text-muted-foreground">{t("card.weaknesses")}：</span>{character.weaknesses || t("card.empty")}</div>
        <div><span className="text-muted-foreground">{t("card.interests")}：</span>{character.interests || t("card.empty")}</div>
        <div><span className="text-muted-foreground">{t("card.keyEvents")}：</span>{character.keyEvents || t("card.empty")}</div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">{t("card.imageGallery")}</div>
        {assetsLoading ? <div className="text-xs text-muted-foreground">{t("card.loading")}</div> : null}
        {!assetsLoading && assets.length === 0 ? (
          <div className="text-xs text-muted-foreground">{t("card.noImages")}</div>
        ) : null}
        {assets.length > 0 ? (
          <div className="grid justify-items-start gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {assets.map((asset) => (
              <div key={asset.id} className="w-full max-w-[300px] space-y-2 rounded-md border p-2">
                <button
                  type="button"
                  className="block aspect-square w-full overflow-hidden rounded-md bg-muted"
                  onClick={() => setPreviewAsset(asset)}
                  title={t("card.previewTitle")}
                >
                  <img
                    src={resolveImageAssetUrl(asset.url)}
                    alt={t("card.imageAlt", { name: character.name })}
                    className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                    loading="lazy"
                  />
                </button>
                <div className="text-[11px] leading-4 text-muted-foreground break-all">
                  {t("card.localPath")}：{asset.localPath ?? t("card.noLocalFile")}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">{asset.isPrimary ? t("card.primaryImage") : t("card.candidateImage")}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={asset.isPrimary || settingPrimary || deletingAssetId === asset.id}
                      onClick={() => onSetPrimary(asset.id)}
                    >
                      {t("card.setPrimary")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deletingAssetId === asset.id}
                      onClick={() => void handleDeleteAsset(asset)}
                    >
                      {deletingAssetId === asset.id ? t("card.deleting") : t("card.delete")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Dialog
        open={Boolean(previewAsset)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewAsset(null);
          }
        }}
      >
        <AppDialogContent
          className="max-w-[1000px]"
          title={previewAsset ? t("card.previewDialogTitle", { name: character.name }) : t("card.previewDialogFallback")}
          bodyClassName="space-y-3"
          footer={previewAsset ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={previewAsset.isPrimary || settingPrimary || deletingAssetId === previewAsset.id}
                onClick={() => onSetPrimary(previewAsset.id)}
              >
                {t("card.setPrimary")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deletingAssetId === previewAsset.id}
                onClick={() => void handleDeleteAsset(previewAsset)}
              >
                {deletingAssetId === previewAsset.id ? t("card.deleting") : t("card.deleteImage")}
              </Button>
            </>
          ) : null}
          footerClassName="gap-2"
        >
          {previewAsset ? (
            <>
              <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-md bg-muted/30 p-2">
                <img
                  src={resolveImageAssetUrl(previewAsset.url)}
                  alt={t("card.previewImageAlt", { name: character.name })}
                  className="max-h-[66vh] w-auto max-w-full rounded-md object-contain"
                />
              </div>
              {previewAsset.localPath ? (
                <div className="text-xs text-muted-foreground break-all">
                  {t("card.localPath")}：{previewAsset.localPath}
                </div>
              ) : null}
            </>
          ) : null}
        </AppDialogContent>
      </Dialog>
    </div>
  );
}
