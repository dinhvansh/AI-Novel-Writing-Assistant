import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { World, WorldSnapshot } from "@ai-novel/shared/types/world";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface WorldLibraryItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  worldType?: string | null;
  usageCount: number;
  sourceWorldId?: string | null;
}

interface WorldAssetsTabProps {
  worldId: string;
  world?: World;
  selectedLayerPrimaryField: "background" | "magicSystem" | "politics" | "cultures" | "history" | "conflicts";
  libraryKeyword: string;
  setLibraryKeyword: Dispatch<SetStateAction<string>>;
  libraryCategory: string;
  setLibraryCategory: Dispatch<SetStateAction<string>>;
  publishName: string;
  setPublishName: Dispatch<SetStateAction<string>>;
  publishCategory: string;
  setPublishCategory: Dispatch<SetStateAction<string>>;
  publishDescription: string;
  setPublishDescription: Dispatch<SetStateAction<string>>;
  snapshotLabel: string;
  setSnapshotLabel: Dispatch<SetStateAction<string>>;
  diffFrom: string;
  setDiffFrom: Dispatch<SetStateAction<string>>;
  diffTo: string;
  setDiffTo: Dispatch<SetStateAction<string>>;
  importFormat: "json" | "markdown" | "text";
  setImportFormat: Dispatch<SetStateAction<"json" | "markdown" | "text">>;
  importContent: string;
  setImportContent: Dispatch<SetStateAction<string>>;
  libraryItems: WorldLibraryItem[];
  snapshots: WorldSnapshot[];
  diffChanges: Array<{ field: string; before: string | null; after: string | null }>;
  createSnapshotPending: boolean;
  publishPending: boolean;
  importPending: boolean;
  onRefreshLibrary: () => void;
  onInjectLibraryField: (libraryId: string) => void;
  onInjectLibraryStructure: (libraryId: string, targetCollection: "forces" | "locations") => void;
  onPublishLibrary: () => void;
  onCreateSnapshot: () => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  onDiffSnapshots: () => void;
  onExport: (format: "markdown" | "json") => Promise<void>;
  onImport: () => void;
}

export default function WorldAssetsTab(props: WorldAssetsTabProps) {
  const { t } = useTranslation("world");
  const {
    selectedLayerPrimaryField,
    libraryKeyword,
    setLibraryKeyword,
    libraryCategory,
    setLibraryCategory,
    publishName,
    setPublishName,
    publishCategory,
    setPublishCategory,
    publishDescription,
    setPublishDescription,
    snapshotLabel,
    setSnapshotLabel,
    diffFrom,
    setDiffFrom,
    diffTo,
    setDiffTo,
    importFormat,
    setImportFormat,
    importContent,
    setImportContent,
    libraryItems,
    snapshots,
    diffChanges,
    createSnapshotPending,
    publishPending,
    importPending,
    onRefreshLibrary,
    onInjectLibraryField,
    onInjectLibraryStructure,
    onPublishLibrary,
    onCreateSnapshot,
    onRestoreSnapshot,
    onDiffSnapshots,
    onExport,
    onImport,
  } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("assets.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-3 space-y-2">
          <div className="font-medium">{t("assets.library.title")}</div>
          <div className="grid gap-2 md:grid-cols-3">
            <Input
              placeholder={t("assets.library.keywordPlaceholder")}
              value={libraryKeyword}
              onChange={(event) => setLibraryKeyword(event.target.value)}
            />
            <select
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={libraryCategory}
              onChange={(event) => setLibraryCategory(event.target.value)}
            >
              <option value="all">{t("assets.library.categories.all")}</option>
              <option value="terrain">{t("assets.library.categories.terrain")}</option>
              <option value="race">{t("assets.library.categories.race")}</option>
              <option value="power_system">{t("assets.library.categories.powerSystem")}</option>
              <option value="organization">{t("assets.library.categories.organization")}</option>
              <option value="resource">{t("assets.library.categories.resource")}</option>
              <option value="event">{t("assets.library.categories.event")}</option>
              <option value="artifact">{t("assets.library.categories.artifact")}</option>
              <option value="custom">{t("assets.library.categories.custom")}</option>
            </select>
            <Button variant="outline" onClick={onRefreshLibrary}>
              {t("assets.library.refresh")}
            </Button>
          </div>
          <div className="rounded-md border p-2 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">
              {t("assets.library.publishHint")}
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                placeholder={t("assets.library.publishNamePlaceholder")}
                value={publishName}
                onChange={(event) => setPublishName(event.target.value)}
              />
              <select
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={publishCategory}
                onChange={(event) => setPublishCategory(event.target.value)}
              >
                <option value="custom">{t("assets.library.categories.custom")}</option>
                <option value="terrain">{t("assets.library.categories.terrain")}</option>
                <option value="race">{t("assets.library.categories.race")}</option>
                <option value="power_system">{t("assets.library.categories.powerSystem")}</option>
                <option value="organization">{t("assets.library.categories.organization")}</option>
                <option value="resource">{t("assets.library.categories.resource")}</option>
                <option value="event">{t("assets.library.categories.event")}</option>
                <option value="artifact">{t("assets.library.categories.artifact")}</option>
              </select>
              <Button onClick={onPublishLibrary} disabled={publishPending}>
                {publishPending ? t("assets.library.publishing") : t("assets.library.publishButton")}
              </Button>
            </div>
            <textarea
              className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
              value={publishDescription}
              onChange={(event) => setPublishDescription(event.target.value)}
              placeholder={t("assets.library.publishDescriptionPlaceholder")}
            />
          </div>
          {libraryItems.map((item) => (
            <div key={item.id} className="rounded border p-3 text-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div>{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.category} / {t("assets.library.usageCount", { count: item.usageCount })}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => onInjectLibraryField(item.id)}>
                  {t("assets.library.injectToLayer", { field: selectedLayerPrimaryField })}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onInjectLibraryStructure(item.id, "forces")}>
                  {t("assets.library.injectToForces")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onInjectLibraryStructure(item.id, "locations")}>
                  {t("assets.library.injectToLocations")}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-md border p-3 space-y-2">
          <div className="font-medium">{t("assets.snapshot.title")}</div>
          <div className="flex gap-2">
            <Input
              placeholder={t("assets.snapshot.labelPlaceholder")}
              value={snapshotLabel}
              onChange={(event) => setSnapshotLabel(event.target.value)}
            />
            <Button onClick={onCreateSnapshot} disabled={createSnapshotPending}>
              {t("assets.snapshot.create")}
            </Button>
          </div>
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="flex items-center justify-between rounded border p-2 text-sm">
              <div>
                {snapshot.label ?? snapshot.id.slice(0, 8)} / {new Date(snapshot.createdAt).toLocaleString()}
              </div>
              <Button size="sm" variant="outline" onClick={() => onRestoreSnapshot(snapshot.id)}>
                {t("assets.snapshot.restore")}
              </Button>
            </div>
          ))}
          <div className="grid gap-2 md:grid-cols-3">
            <select
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={diffFrom}
              onChange={(event) => setDiffFrom(event.target.value)}
            >
              <option value="">{t("assets.snapshot.diffFromPlaceholder")}</option>
              {snapshots.map((snapshot) => (
                <option key={`from-${snapshot.id}`} value={snapshot.id}>
                  {snapshot.label ?? snapshot.id.slice(0, 8)}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={diffTo}
              onChange={(event) => setDiffTo(event.target.value)}
            >
              <option value="">{t("assets.snapshot.diffToPlaceholder")}</option>
              {snapshots.map((snapshot) => (
                <option key={`to-${snapshot.id}`} value={snapshot.id}>
                  {snapshot.label ?? snapshot.id.slice(0, 8)}
                </option>
              ))}
            </select>
            <Button onClick={onDiffSnapshots} disabled={!diffFrom || !diffTo}>
              {t("assets.snapshot.diffButton")}
            </Button>
          </div>
          {diffChanges.map((change) => (
            <div key={change.field} className="rounded border p-2 text-xs">
              {change.field}: {change.before ?? t("assets.snapshot.emptyValue")} {"->"} {change.after ?? t("assets.snapshot.emptyValue")}
            </div>
          ))}
        </div>

        <div className="rounded-md border p-3 space-y-2">
          <div className="font-medium">{t("assets.export.title")}</div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void onExport("markdown")}>
              {t("assets.export.exportMarkdown")}
            </Button>
            <Button variant="secondary" onClick={() => void onExport("json")}>
              {t("assets.export.exportJson")}
            </Button>
          </div>
        </div>

        <div className="rounded-md border p-3 space-y-2">
          <div className="font-medium">{t("assets.import.title")}</div>
          <select
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={importFormat}
            onChange={(event) => setImportFormat(event.target.value as "json" | "markdown" | "text")}
          >
            <option value="text">{t("assets.import.formatText")}</option>
            <option value="markdown">{t("assets.import.formatMarkdown")}</option>
            <option value="json">{t("assets.import.formatJson")}</option>
          </select>
          <textarea
            className="min-h-[160px] w-full rounded-md border bg-background p-2 text-sm"
            value={importContent}
            onChange={(event) => setImportContent(event.target.value)}
            placeholder={t("assets.import.contentPlaceholder")}
          />
          <Button onClick={onImport} disabled={importPending || !importContent.trim()}>
            {importPending ? t("assets.import.importing") : t("assets.import.importButton")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
