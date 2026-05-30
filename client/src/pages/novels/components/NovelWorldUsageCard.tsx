import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import type { StoryWorldSliceOverrides, StoryWorldSliceView } from "@ai-novel/shared/types/storyWorldSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NovelWorldUsageCardProps {
  view?: StoryWorldSliceView | null;
  message: string;
  isRefreshing: boolean;
  isSaving: boolean;
  onRefresh: () => void;
  onSave: (patch: StoryWorldSliceOverrides) => void;
}

function toggleId(ids: string[], id: string, checked: boolean): string[] {
  const set = new Set(ids);
  if (checked) {
    set.add(id);
  } else {
    set.delete(id);
  }
  return Array.from(set);
}

function labelStoryInputSource(source: string | null | undefined, t: (key: string) => string): string {
  switch (source) {
    case "explicit":
      return t("worldUsage.storyInputSource.explicit");
    case "story_macro":
      return t("worldUsage.storyInputSource.storyMacro");
    case "novel_description":
      return t("worldUsage.storyInputSource.novelDescription");
    default:
      return t("worldUsage.storyInputSource.none");
  }
}

export default function NovelWorldUsageCard(props: NovelWorldUsageCardProps) {
  const { t } = useTranslation("novel");
  const [primaryLocationId, setPrimaryLocationId] = useState<string>("__none__");
  const [requiredForceIds, setRequiredForceIds] = useState<string[]>([]);
  const [requiredLocationIds, setRequiredLocationIds] = useState<string[]>([]);
  const [requiredRuleIds, setRequiredRuleIds] = useState<string[]>([]);
  const [scopeNote, setScopeNote] = useState("");

  useEffect(() => {
    setPrimaryLocationId(props.view?.overrides.primaryLocationId ?? "__none__");
    setRequiredForceIds(props.view?.overrides.requiredForceIds ?? []);
    setRequiredLocationIds(props.view?.overrides.requiredLocationIds ?? []);
    setRequiredRuleIds(props.view?.overrides.requiredRuleIds ?? []);
    setScopeNote(props.view?.overrides.scopeNote ?? "");
  }, [props.view]);

  const slice = props.view?.slice ?? null;
  const hasWorld = props.view?.hasWorld ?? false;
  const hasSlice = Boolean(slice);
  const canSave = hasWorld && Boolean(props.view);
  const savePayload = useMemo<StoryWorldSliceOverrides>(() => ({
    primaryLocationId: primaryLocationId === "__none__" ? null : primaryLocationId,
    requiredForceIds,
    requiredLocationIds,
    requiredRuleIds,
    scopeNote: scopeNote.trim() || null,
  }), [primaryLocationId, requiredForceIds, requiredLocationIds, requiredRuleIds, scopeNote]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("worldUsage.title")}</CardTitle>
            <div className="text-sm leading-6 text-muted-foreground">
              {t("worldUsage.description")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {props.view?.isStale ? <Badge variant="secondary">{t("worldUsage.needsRefresh")}</Badge> : null}
            {slice ? <Badge variant="outline">{t("worldUsage.generated")}</Badge> : null}
            <Button type="button" variant="outline" onClick={props.onRefresh} disabled={!hasWorld || props.isRefreshing}>
              {props.isRefreshing ? t("worldUsage.refreshing") : t("worldUsage.refreshButton")}
            </Button>
            <Button type="button" onClick={() => props.onSave(savePayload)} disabled={!canSave || props.isSaving}>
              {props.isSaving ? t("worldUsage.saving") : t("worldUsage.saveButton")}
            </Button>
          </div>
        </div>
        {props.message ? (
          <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {props.message}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasWorld ? (
          <div className="rounded-md border border-dashed border-border/70 px-4 py-4 text-sm leading-6 text-muted-foreground">
            {t("worldUsage.noWorldHint")}
          </div>
        ) : null}

        {hasWorld ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border/70 px-4 py-3">
              <div className="text-sm font-medium text-foreground">{t("worldUsage.boundWorld")}</div>
              <div className="mt-1 text-sm text-muted-foreground">{props.view?.worldName ?? t("worldUsage.unnamedWorld")}</div>
            </div>
            <div className="rounded-lg border border-border/70 px-4 py-3">
              <div className="text-sm font-medium text-foreground">{t("worldUsage.storyInputSourceLabel")}</div>
              <div className="mt-1 text-sm text-muted-foreground">{labelStoryInputSource(props.view?.storyInputSource, t)}</div>
            </div>
          </div>
        ) : null}

        {slice ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border/70 px-4 py-4">
              <div className="text-sm font-medium text-foreground">{t("worldUsage.currentContent")}</div>
              <div className="mt-3 space-y-4 text-sm">
                <div>
                  <div className="font-medium text-foreground">{t("worldUsage.coreWorldFrame")}</div>
                  <div className="mt-1 leading-6 text-muted-foreground">{slice.coreWorldFrame || t("common:states.empty")}</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">{t("worldUsage.activeForces")}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {slice.activeForces.length > 0 ? slice.activeForces.map((item) => (
                      <Badge key={item.id} variant="secondary">{item.name}</Badge>
                    )) : <span className="text-muted-foreground">{t("common:states.empty")}</span>}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-foreground">{t("worldUsage.activeLocations")}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {slice.activeLocations.length > 0 ? slice.activeLocations.map((item) => (
                      <Badge key={item.id} variant="secondary">{item.name}</Badge>
                    )) : <span className="text-muted-foreground">{t("common:states.empty")}</span>}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-foreground">{t("worldUsage.appliedRules")}</div>
                  <div className="mt-2 space-y-2">
                    {slice.appliedRules.length > 0 ? slice.appliedRules.map((item) => (
                      <div key={item.id} className="rounded-md bg-muted/30 px-3 py-2 text-muted-foreground">
                        <div className="font-medium text-foreground">{item.name}</div>
                        <div className="mt-1 leading-6">{item.summary}</div>
                      </div>
                    )) : <div className="text-muted-foreground">{t("common:states.empty")}</div>}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-foreground">{t("worldUsage.pressureSources")}</div>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    {slice.pressureSources.length > 0 ? slice.pressureSources.map((item) => (
                      <div key={item}>{item}</div>
                    )) : <div className="text-muted-foreground">{t("common:states.empty")}</div>}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-foreground">{t("worldUsage.storyScopeBoundary")}</div>
                  <div className="mt-1 leading-6 text-muted-foreground">{slice.storyScopeBoundary || t("common:states.empty")}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 px-4 py-4">
              <div className="text-sm font-medium text-foreground">{t("worldUsage.manualOverrideTitle")}</div>
              <div className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("worldUsage.manualOverrideHint")}
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">{t("worldUsage.primaryLocation")}</label>
                  <Select value={primaryLocationId} onValueChange={setPrimaryLocationId}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={t("worldUsage.primaryLocationPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t("worldUsage.noExtraSpec")}</SelectItem>
                      {props.view?.availableLocations.map((item) => (
                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="text-sm font-medium text-foreground">{t("worldUsage.requiredForces")}</div>
                  <div className="mt-2 grid gap-2">
                    {props.view?.availableForces.length ? props.view.availableForces.map((item) => (
                      <label key={item.id} className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={requiredForceIds.includes(item.id)}
                          onChange={(event) => setRequiredForceIds((prev) => toggleId(prev, item.id, event.target.checked))}
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-medium text-foreground">{item.name}</span>
                          <span className="block text-muted-foreground">{item.summary}</span>
                        </span>
                      </label>
                    )) : <div className="text-sm text-muted-foreground">{t("worldUsage.noForces")}</div>}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-foreground">{t("worldUsage.requiredLocations")}</div>
                  <div className="mt-2 grid gap-2">
                    {props.view?.availableLocations.length ? props.view.availableLocations.map((item) => (
                      <label key={item.id} className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={requiredLocationIds.includes(item.id)}
                          onChange={(event) => setRequiredLocationIds((prev) => toggleId(prev, item.id, event.target.checked))}
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-medium text-foreground">{item.name}</span>
                          <span className="block text-muted-foreground">{item.summary}</span>
                        </span>
                      </label>
                    )) : <div className="text-sm text-muted-foreground">{t("worldUsage.noLocations")}</div>}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-foreground">{t("worldUsage.requiredRules")}</div>
                  <div className="mt-2 grid gap-2">
                    {props.view?.availableRules.length ? props.view.availableRules.map((item) => (
                      <label key={item.id} className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={requiredRuleIds.includes(item.id)}
                          onChange={(event) => setRequiredRuleIds((prev) => toggleId(prev, item.id, event.target.checked))}
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-medium text-foreground">{item.name}</span>
                          <span className="block text-muted-foreground">{item.summary}</span>
                        </span>
                      </label>
                    )) : <div className="text-sm text-muted-foreground">{t("worldUsage.noRules")}</div>}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground" htmlFor="story-world-scope-note">
                    {t("worldUsage.scopeNoteLabel")}
                  </label>
                  <div className="mt-1 text-sm leading-6 text-muted-foreground">
                    {t("worldUsage.scopeNoteHint")}
                  </div>
                  <textarea
                    id="story-world-scope-note"
                    value={scopeNote}
                    onChange={(event) => setScopeNote(event.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder={t("worldUsage.scopeNotePlaceholder")}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {hasWorld && !hasSlice ? (
          <div className="rounded-md border border-dashed border-border/70 px-4 py-4 text-sm leading-6 text-muted-foreground">
            {t("worldUsage.noSliceHint")}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}


