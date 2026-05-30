import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { APP_RUNTIME, APP_RUNTIME_IS_PACKAGED } from "@/lib/constants";
import {
  getDesktopDataImportSnapshot,
  importDesktopLegacyDatabase,
  type DesktopDataImportSnapshot,
} from "@/lib/desktop";

interface DesktopLegacyDataImportCardProps {
  forceVisible?: boolean;
  compact?: boolean;
}

function shouldRenderCard(
  snapshot: DesktopDataImportSnapshot | null,
  forceVisible: boolean,
): boolean {
  if (forceVisible) {
    return true;
  }

  if (!snapshot) {
    return false;
  }

  return snapshot.currentDatabaseLikelyFresh || Boolean(snapshot.suggestedSourcePath);
}

export default function DesktopLegacyDataImportCard({
  forceVisible = false,
  compact = false,
}: DesktopLegacyDataImportCardProps) {
  const { t } = useTranslation();
  const isSupportedDesktop = APP_RUNTIME === "desktop" && APP_RUNTIME_IS_PACKAGED;
  const [snapshot, setSnapshot] = useState<DesktopDataImportSnapshot | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!isSupportedDesktop) {
      return;
    }

    let cancelled = false;
    setIsLoadingSnapshot(true);

    void getDesktopDataImportSnapshot()
      .then((nextSnapshot) => {
        if (!cancelled) {
          setSnapshot(nextSnapshot);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : t("desktop:legacyImport.detectFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSnapshot(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isSupportedDesktop, t]);

  if (!isSupportedDesktop || !shouldRenderCard(snapshot, forceVisible)) {
    return null;
  }

  const hasSuggestedSource = Boolean(snapshot?.suggestedSourcePath);
  const title = hasSuggestedSource ? t("desktop:legacyImport.titleDetected") : t("desktop:legacyImport.titleImport");
  const description = hasSuggestedSource
    ? t("desktop:legacyImport.descriptionDetected")
    : t("desktop:legacyImport.descriptionImport");

  const importData = async (preferSuggested: boolean) => {
    try {
      setIsImporting(true);
      const result = await importDesktopLegacyDatabase({ preferSuggested });
      if (result?.cancelled) {
        return;
      }
      if (result?.scheduled) {
        toast(t("desktop:legacyImport.preparingImport"));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("desktop:legacyImport.importFailed"));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="border-sky-200 bg-sky-50/80">
      <CardHeader className={compact ? "pb-3" : undefined}>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{title}</CardTitle>
          <Badge variant="outline">Desktop</Badge>
          {snapshot?.currentDatabaseLikelyFresh ? <Badge variant="outline">{t("desktop:legacyImport.freshDbBadge")}</Badge> : null}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {snapshot?.suggestedSourcePath ? (
          <div className="rounded-md border border-dashed bg-background/70 p-3 text-sm text-muted-foreground">
            {t("desktop:legacyImport.detectedPath", { path: snapshot.suggestedSourcePath })}
            {snapshot.suggestedSourceLabel ? ` (${snapshot.suggestedSourceLabel})` : ""}
          </div>
        ) : null}

        <div className="rounded-md border border-dashed bg-background/70 p-3 text-sm text-muted-foreground">
          {t("desktop:legacyImport.backupHint", { dir: snapshot?.backupDirectory ?? "-" })}
        </div>

        <div className="text-xs text-muted-foreground">
          {t("desktop:legacyImport.closeOldProcessHint")}
        </div>

        <div className="flex flex-wrap gap-3">
          {hasSuggestedSource ? (
            <Button onClick={() => void importData(true)} disabled={isImporting || isLoadingSnapshot}>
              {isImporting ? "Preparing..." : t("desktop:legacyImport.importDetected")}
            </Button>
          ) : null}
          <Button
            variant={hasSuggestedSource ? "outline" : "default"}
            onClick={() => void importData(false)}
            disabled={isImporting || isLoadingSnapshot}
          >
            {isImporting ? "Preparing..." : hasSuggestedSource ? t("desktop:legacyImport.selectOther") : t("desktop:legacyImport.selectAndImport")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
