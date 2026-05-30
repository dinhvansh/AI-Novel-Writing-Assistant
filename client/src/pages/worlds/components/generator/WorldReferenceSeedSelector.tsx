import { useTranslation } from "react-i18next";
import type {
  WorldReferenceSeedBundle,
  WorldReferenceSeedSelection,
} from "@ai-novel/shared/types/worldWizard";
import { Button } from "@/components/ui/button";

type GroupKey = keyof WorldReferenceSeedBundle;

type GroupMeta = {
  title: string;
  description: string;
  selectionKey: keyof WorldReferenceSeedSelection;
};

const GROUP_SELECTION_KEYS: Record<GroupKey, keyof WorldReferenceSeedSelection> = {
  rules: "ruleIds",
  factions: "factionIds",
  forces: "forceIds",
  locations: "locationIds",
};

function summarizeSeed(group: GroupKey, item: Record<string, unknown>): string {
  if (group === "rules") {
    return [item.summary, item.boundary, item.enforcement].filter(Boolean).join(" | ");
  }
  if (group === "factions") {
    return [item.position, item.doctrine].filter(Boolean).join(" | ");
  }
  if (group === "forces") {
    return [item.type, item.summary, item.pressure].filter(Boolean).join(" | ");
  }
  return [item.terrain, item.summary, item.narrativeFunction].filter(Boolean).join(" | ");
}

export default function WorldReferenceSeedSelector(props: {
  seeds: WorldReferenceSeedBundle;
  selectedIds: WorldReferenceSeedSelection;
  onToggle: (group: GroupKey, id: string, checked: boolean) => void;
  onToggleAll: (group: GroupKey, checked: boolean) => void;
}) {
  const { seeds, selectedIds, onToggle, onToggleAll } = props;
  const { t } = useTranslation("world");

  const visibleGroups = (Object.keys(GROUP_SELECTION_KEYS) as GroupKey[]).filter((group) => seeds[group].length > 0);
  if (visibleGroups.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        {t("generator.referenceSeed.emptyHint")}
      </div>
    );
  }

  return (
    <div className="rounded-md border p-3 text-sm space-y-4">
      <div className="space-y-1">
        <div className="font-medium">{t("generator.referenceSeed.sectionTitle")}</div>
        <div className="text-xs text-muted-foreground">
          {t("generator.referenceSeed.sectionDescription")}
        </div>
      </div>

      {visibleGroups.map((group) => {
        const items = seeds[group];
        const selectionKey = GROUP_SELECTION_KEYS[group];
        const currentSelectedIds = selectedIds[selectionKey];
        const allSelected = items.length > 0 && items.every((item) => currentSelectedIds.includes(item.id));
        return (
          <div key={group} className="rounded-md border p-3 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="font-medium">{t(`generator.referenceSeed.groups.${group}.title`)}</div>
                <div className="text-xs text-muted-foreground">{t(`generator.referenceSeed.groups.${group}.description`)}</div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onToggleAll(group, !allSelected)}
              >
                {allSelected ? t("generator.referenceSeed.deselectAllButton") : t("generator.referenceSeed.selectAllButton")}
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const checked = currentSelectedIds.includes(item.id);
                const summary = summarizeSeed(group, item as Record<string, unknown>);
                return (
                  <label key={item.id} className="flex items-start gap-3 rounded-md border p-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={(event) => onToggle(group, item.id, event.target.checked)}
                    />
                    <div className="space-y-1">
                      <div className="font-medium">{item.name}</div>
                      {summary ? (
                        <div className="text-xs text-muted-foreground">{summary}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground">{t("generator.referenceSeed.fallbackDescription")}</div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
