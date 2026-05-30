import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  WorldBindingSupport,
  WorldFaction,
  WorldForce,
  WorldForceRelation,
  WorldLocation,
  WorldLocationControlRelation,
  WorldRule,
  WorldStructuredData,
  WorldStructureSectionKey,
} from "@ai-novel/shared/types/world";
import type { WorldStructurePayload } from "@/api/world";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";


function updateArrayItem<T>(items: T[], index: number, nextItem: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
}

function parseTextList(value: string): string[] {
  return value
    .split(/[\n,，;；、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function WorldStructureTab(props: {
  initialPayload?: WorldStructurePayload;
  savePending: boolean;
  backfillPending: boolean;
  generatePending: boolean;
  onSave: (structure: WorldStructuredData, bindingSupport: WorldBindingSupport) => Promise<void>;
  onBackfill: () => Promise<{ structure: WorldStructuredData; bindingSupport: WorldBindingSupport } | undefined>;
  onGenerate: (
    section: WorldStructureSectionKey,
    structure: WorldStructuredData,
    bindingSupport: WorldBindingSupport,
  ) => Promise<{ structure: WorldStructuredData; bindingSupport: WorldBindingSupport } | undefined>;
}) {
  const { t } = useTranslation();
  const { initialPayload, savePending, backfillPending, generatePending, onSave, onBackfill, onGenerate } = props;
  const SECTION_OPTIONS = [
    { value: "profile" as WorldStructureSectionKey, label: t("novel:world.structure.sections.profile") },
    { value: "rules" as WorldStructureSectionKey, label: t("novel:world.structure.sections.rules") },
    { value: "factions" as WorldStructureSectionKey, label: t("novel:world.structure.sections.factions") },
    { value: "locations" as WorldStructureSectionKey, label: t("novel:world.structure.sections.locations") },
    { value: "relations" as WorldStructureSectionKey, label: t("novel:world.structure.sections.relations") },
  ];
  const [activeSection, setActiveSection] = useState<WorldStructureSectionKey>("profile");
  const [draftStructure, setDraftStructure] = useState<WorldStructuredData | null>(initialPayload?.structure ?? null);
  const [draftBindingSupport, setDraftBindingSupport] = useState<WorldBindingSupport | null>(
    initialPayload?.bindingSupport ?? null,
  );

  useEffect(() => {
    if (!initialPayload) {
      return;
    }
    setDraftStructure(initialPayload.structure);
    setDraftBindingSupport(initialPayload.bindingSupport);
  }, [initialPayload]);

  const hasStructuredData = Boolean(initialPayload?.hasStructuredData);
  const factionNameById = useMemo(
    () => new Map((draftStructure?.factions ?? []).map((item) => [item.id, item.name])),
    [draftStructure?.factions],
  );
  const forceNameById = useMemo(
    () => new Map((draftStructure?.forces ?? []).map((item) => [item.id, item.name])),
    [draftStructure?.forces],
  );
  const locationNameById = useMemo(
    () => new Map((draftStructure?.locations ?? []).map((item) => [item.id, item.name])),
    [draftStructure?.locations],
  );

  if (!draftStructure || !draftBindingSupport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("novel:world.structure.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t("novel:world.structure.loading")}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("novel:world.structure.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {SECTION_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={activeSection === option.value ? "default" : "outline"}
                onClick={() => setActiveSection(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                const result = await onBackfill();
                if (result) {
                  setDraftStructure(result.structure);
                  setDraftBindingSupport(result.bindingSupport);
                }
              }}
              disabled={backfillPending}
            >
              {backfillPending ? t("novel:world.structure.extracting") : hasStructuredData ? t("novel:world.structure.reExtract") : t("novel:world.structure.extract")}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const result = await onGenerate(activeSection, draftStructure, draftBindingSupport);
                if (result) {
                  setDraftStructure(result.structure);
                  setDraftBindingSupport(result.bindingSupport);
                }
              }}
              disabled={generatePending}
            >
              {generatePending ? t("novel:world.structure.completing") : t("novel:world.structure.aiComplete")}
            </Button>
            <Button onClick={() => void onSave(draftStructure, draftBindingSupport)} disabled={savePending}>
              {savePending ? t("novel:world.structure.saving") : t("novel:world.structure.save")}
            </Button>
          </div>
        </div>

        <div className="rounded-md border p-3 space-y-3">
          <div className="font-medium">{t("novel:world.structure.sections.profile")}</div>
          <Input
            value={draftStructure.profile.identity}
            onChange={(event) =>
              setDraftStructure((prev) =>
                prev
                  ? { ...prev, profile: { ...prev.profile, identity: event.target.value } }
                  : prev,
              )
            }
            placeholder={t("novel:world.structure.profile.identityPlaceholder")}
          />
          <Input
            value={draftStructure.profile.tone}
            onChange={(event) =>
              setDraftStructure((prev) =>
                prev
                  ? { ...prev, profile: { ...prev.profile, tone: event.target.value } }
                  : prev,
              )
            }
            placeholder={t("novel:world.structure.profile.tonePlaceholder")}
          />
          <textarea
            className="min-h-[100px] w-full rounded-md border bg-background p-2 text-sm"
            value={draftStructure.profile.summary}
            onChange={(event) =>
              setDraftStructure((prev) =>
                prev
                  ? { ...prev, profile: { ...prev.profile, summary: event.target.value } }
                  : prev,
              )
            }
            placeholder={t("novel:world.structure.profile.summaryPlaceholder")}
          />
          <textarea
            className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
            value={draftStructure.profile.coreConflict}
            onChange={(event) =>
              setDraftStructure((prev) =>
                prev
                  ? { ...prev, profile: { ...prev.profile, coreConflict: event.target.value } }
                  : prev,
              )
            }
            placeholder={t("novel:world.structure.profile.coreConflictPlaceholder")}
          />
          <Input
            value={draftStructure.profile.themes.join("、")}
            onChange={(event) =>
              setDraftStructure((prev) =>
                prev
                  ? {
                    ...prev,
                    profile: {
                      ...prev.profile,
                      themes: event.target.value.split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
                    },
                  }
                  : prev,
              )
            }
            placeholder={t("novel:world.structure.profile.themesPlaceholder")}
          />
        </div>

        <div className="rounded-md border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{t("novel:world.structure.sections.rules")}</div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setDraftStructure((prev) =>
                  prev
                    ? {
                      ...prev,
                      rules: {
                        ...prev.rules,
                        axioms: [
                          ...prev.rules.axioms,
                          {
                            id: `rule-${prev.rules.axioms.length + 1}`,
                            name: "",
                            summary: "",
                            cost: "",
                            boundary: "",
                            enforcement: "",
                          },
                        ],
                      },
                    }
                    : prev,
                )
              }
            >{t("novel:world.structure.rules.addRule")}</Button>
          </div>
          <textarea
            className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
            value={draftStructure.rules.summary}
            onChange={(event) =>
              setDraftStructure((prev) =>
                prev
                  ? { ...prev, rules: { ...prev.rules, summary: event.target.value } }
                  : prev,
              )
            }
            placeholder={t("novel:world.structure.rules.summaryPlaceholder")}
          />
          {draftStructure.rules.axioms.map((rule, index) => (
            <div key={rule.id || index} className="rounded-md border p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={rule.name}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          rules: {
                            ...prev.rules,
                            axioms: updateArrayItem<WorldRule>(prev.rules.axioms, index, {
                              ...rule,
                              name: event.target.value,
                            }),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.rules.namePlaceholder")}
                />
                <Input
                  value={rule.cost}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          rules: {
                            ...prev.rules,
                            axioms: updateArrayItem<WorldRule>(prev.rules.axioms, index, {
                              ...rule,
                              cost: event.target.value,
                            }),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.rules.costPlaceholder")}
                />
              </div>
              <textarea
                className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
                value={rule.summary}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        rules: {
                          ...prev.rules,
                          axioms: updateArrayItem<WorldRule>(prev.rules.axioms, index, {
                            ...rule,
                            summary: event.target.value,
                          }),
                        },
                      }
                      : prev,
                  )
                }
                placeholder={t("novel:world.structure.rules.descPlaceholder")}
              />
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={rule.boundary}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          rules: {
                            ...prev.rules,
                            axioms: updateArrayItem<WorldRule>(prev.rules.axioms, index, {
                              ...rule,
                              boundary: event.target.value,
                            }),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.rules.boundaryPlaceholder")}
                />
                <Input
                  value={rule.enforcement}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          rules: {
                            ...prev.rules,
                            axioms: updateArrayItem<WorldRule>(prev.rules.axioms, index, {
                              ...rule,
                              enforcement: event.target.value,
                            }),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.rules.enforcementPlaceholder")}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-md border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{t("novel:world.structure.sections.factions")}</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        factions: [
                          ...prev.factions,
                          {
                            id: `faction-${prev.factions.length + 1}`,
                            name: "",
                            position: "",
                            doctrine: "",
                            goals: [],
                            methods: [],
                            representativeForceIds: [],
                          },
                        ],
                      }
                      : prev,
                  )
                }
              >{t("novel:world.structure.factions.addFaction")}</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        forces: [
                          ...prev.forces,
                          {
                            id: `force-${prev.forces.length + 1}`,
                            name: "",
                            type: "",
                            factionId: null,
                            summary: "",
                            baseOfPower: "",
                            currentObjective: "",
                            pressure: "",
                            leader: null,
                            narrativeRole: "",
                          },
                        ],
                      }
                      : prev,
                  )
                }
              >{t("novel:world.structure.factions.addForce")}</Button>
            </div>
          </div>
          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground space-y-1">
            <div>{t("novel:world.structure.factions.hint1")}</div>
            <div>{t("novel:world.structure.factions.hint2")}</div>
            <div>
              {t("novel:world.structure.factions.currentFactionIds")}: {
                draftStructure.factions.length > 0
                  ? draftStructure.factions.map((item) => `${item.id}（${item.name || t("novel:world.structure.unnamed")}）`).join("、")
                  : t("novel:world.structure.none")
              }
            </div>
            <div>
              {t("novel:world.structure.factions.currentForceIds")}: {
                draftStructure.forces.length > 0
                  ? draftStructure.forces.map((item) => `${item.id}（${item.name || t("novel:world.structure.unnamed")}）`).join("、")
                  : t("novel:world.structure.none")
              }
            </div>
          </div>
          <div className="space-y-3">
            {draftStructure.factions.map((faction, index) => (
              <div key={faction.id || index} className="rounded-md border p-3 space-y-2">
                <div className="text-xs text-muted-foreground">
                  {t("novel:world.structure.factions.factionCardHint")}
                </div>
                <Input
                  value={faction.name}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          factions: updateArrayItem<WorldFaction>(prev.factions, index, {
                            ...faction,
                            name: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.factions.factionNamePlaceholder")}
                />
                <Input
                  value={faction.position}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          factions: updateArrayItem<WorldFaction>(prev.factions, index, {
                            ...faction,
                            position: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.factions.positionPlaceholder")}
                />
                <textarea
                  className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
                  value={faction.doctrine}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          factions: updateArrayItem<WorldFaction>(prev.factions, index, {
                            ...faction,
                            doctrine: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.factions.doctrinePlaceholder")}
                />
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    value={faction.goals.join("、")}
                    onChange={(event) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            factions: updateArrayItem<WorldFaction>(prev.factions, index, {
                              ...faction,
                              goals: parseTextList(event.target.value),
                            }),
                          }
                          : prev,
                      )
                    }
                    placeholder={t("novel:world.structure.factions.goalsPlaceholder")}
                  />
                  <Input
                    value={faction.methods.join("、")}
                    onChange={(event) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            factions: updateArrayItem<WorldFaction>(prev.factions, index, {
                              ...faction,
                              methods: parseTextList(event.target.value),
                            }),
                          }
                          : prev,
                      )
                    }
                    placeholder={t("novel:world.structure.factions.methodsPlaceholder")}
                  />
                </div>
                <Input
                  value={faction.representativeForceIds.join("、")}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          factions: updateArrayItem<WorldFaction>(prev.factions, index, {
                            ...faction,
                            representativeForceIds: parseTextList(event.target.value),
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.factions.representativeForceIdsPlaceholder")}
                />
                {faction.representativeForceIds.length > 0 ? (
                  <div className="text-xs text-muted-foreground">
                    {t("novel:world.structure.factions.representativeForces")}: {faction.representativeForceIds.map((id) => forceNameById.get(id) || id).join("、")}
                  </div>
                ) : null}
              </div>
            ))}
            {draftStructure.forces.map((force, index) => (
              <div key={force.id || index} className="rounded-md border p-3 space-y-2">
                <div className="text-xs text-muted-foreground">
                  {t("novel:world.structure.factions.forceCardHint")}
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <Input
                    value={force.name}
                    onChange={(event) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            forces: updateArrayItem<WorldForce>(prev.forces, index, {
                              ...force,
                              name: event.target.value,
                            }),
                          }
                          : prev,
                      )
                    }
                    placeholder={t("novel:world.structure.factions.forceNamePlaceholder")}
                  />
                  <Input
                    value={force.type}
                    onChange={(event) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            forces: updateArrayItem<WorldForce>(prev.forces, index, {
                              ...force,
                              type: event.target.value,
                            }),
                          }
                          : prev,
                      )
                    }
                    placeholder={t("novel:world.structure.factions.forceTypePlaceholder")}
                  />
                  <Input
                    value={force.factionId ?? ""}
                    onChange={(event) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            forces: updateArrayItem<WorldForce>(prev.forces, index, {
                              ...force,
                              factionId: event.target.value || null,
                            }),
                          }
                          : prev,
                      )
                    }
                    placeholder={t("novel:world.structure.factions.factionIdPlaceholder")}
                  />
                </div>
                {force.factionId ? (
                  <div className="text-xs text-muted-foreground">
                    {t("novel:world.structure.factions.belongsToFaction")}: {factionNameById.get(force.factionId) || force.factionId}
                  </div>
                ) : null}
                <textarea
                  className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
                  value={force.summary}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          forces: updateArrayItem<WorldForce>(prev.forces, index, {
                            ...force,
                            summary: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.factions.forceSummaryPlaceholder")}
                />
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    value={force.baseOfPower}
                    onChange={(event) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            forces: updateArrayItem<WorldForce>(prev.forces, index, {
                              ...force,
                              baseOfPower: event.target.value,
                            }),
                          }
                          : prev,
                      )
                    }
                    placeholder={t("novel:world.structure.factions.baseOfPowerPlaceholder")}
                  />
                  <Input
                    value={force.currentObjective}
                    onChange={(event) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            forces: updateArrayItem<WorldForce>(prev.forces, index, {
                              ...force,
                              currentObjective: event.target.value,
                            }),
                          }
                          : prev,
                      )
                    }
                    placeholder={t("novel:world.structure.factions.currentObjectivePlaceholder")}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    value={force.leader ?? ""}
                    onChange={(event) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            forces: updateArrayItem<WorldForce>(prev.forces, index, {
                              ...force,
                              leader: event.target.value || null,
                            }),
                          }
                          : prev,
                      )
                    }
                    placeholder={t("novel:world.structure.factions.leaderPlaceholder")}
                  />
                  <Input
                    value={force.pressure}
                    onChange={(event) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            forces: updateArrayItem<WorldForce>(prev.forces, index, {
                              ...force,
                              pressure: event.target.value,
                            }),
                          }
                          : prev,
                      )
                    }
                    placeholder={t("novel:world.structure.factions.pressurePlaceholder")}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-1">
                  <Input
                    value={force.narrativeRole}
                    onChange={(event) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            forces: updateArrayItem<WorldForce>(prev.forces, index, {
                              ...force,
                              narrativeRole: event.target.value,
                            }),
                          }
                          : prev,
                      )
                    }
                    placeholder={t("novel:world.structure.factions.narrativeRolePlaceholder")}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{t("novel:world.structure.sections.locations")}</div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setDraftStructure((prev) =>
                  prev
                    ? {
                      ...prev,
                      locations: [
                        ...prev.locations,
                        {
                          id: `location-${prev.locations.length + 1}`,
                          name: "",
                          terrain: "",
                          summary: "",
                          narrativeFunction: "",
                          risk: "",
                          entryConstraint: "",
                          exitCost: "",
                          controllingForceIds: [],
                        },
                      ],
                    }
                    : prev,
                )
              }
            >{t("novel:world.structure.locations.addLocation")}</Button>
          </div>
          {draftStructure.locations.map((location, index) => (
            <div key={location.id || index} className="rounded-md border p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={location.name}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                            ...location,
                            name: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.locations.namePlaceholder")}
                />
                <Input
                  value={location.terrain}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                            ...location,
                            terrain: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.locations.terrainPlaceholder")}
                />
              </div>
              <textarea
                className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
                value={location.summary}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                          ...location,
                          summary: event.target.value,
                        }),
                      }
                      : prev,
                  )
                }
                placeholder={t("novel:world.structure.locations.summaryPlaceholder")}
              />
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={location.narrativeFunction}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                            ...location,
                            narrativeFunction: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.locations.narrativeFunctionPlaceholder")}
                />
                <Input
                  value={location.risk}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                            ...location,
                            risk: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.locations.riskPlaceholder")}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={location.entryConstraint}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                            ...location,
                            entryConstraint: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.locations.entryConstraintPlaceholder")}
                />
                <Input
                  value={location.exitCost}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                            ...location,
                            exitCost: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.locations.exitCostPlaceholder")}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-md border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{t("novel:world.structure.sections.relations")}</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        relations: {
                          ...prev.relations,
                          forceRelations: [
                            ...prev.relations.forceRelations,
                            {
                              id: `force-relation-${prev.relations.forceRelations.length + 1}`,
                              sourceForceId: "",
                              targetForceId: "",
                              relation: "",
                              tension: "",
                              detail: "",
                            },
                          ],
                        },
                      }
                      : prev,
                  )
                }
              >{t("novel:world.structure.relations.addForceRelation")}</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        relations: {
                          ...prev.relations,
                          locationControls: [
                            ...prev.relations.locationControls,
                            {
                              id: `location-control-${prev.relations.locationControls.length + 1}`,
                              forceId: "",
                              locationId: "",
                              relation: "",
                              detail: "",
                            },
                          ],
                        },
                      }
                      : prev,
                  )
                }
              >{t("novel:world.structure.relations.addLocationControl")}</Button>
            </div>
          </div>
          {draftStructure.relations.forceRelations.map((relation, index) => (
            <div key={relation.id || index} className="rounded-md border p-3 space-y-2">
              <div className="text-xs text-muted-foreground">
                {forceNameById.get(relation.sourceForceId) || relation.sourceForceId || t("novel:world.structure.relations.sourceForce")} {"->"}{" "}
                {forceNameById.get(relation.targetForceId) || relation.targetForceId || t("novel:world.structure.relations.targetForce")}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={relation.sourceForceId}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          relations: {
                            ...prev.relations,
                            forceRelations: updateArrayItem<WorldForceRelation>(prev.relations.forceRelations, index, {
                              ...relation,
                              sourceForceId: event.target.value,
                            }),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.relations.sourceForceIdPlaceholder")}
                />
                <Input
                  value={relation.targetForceId}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          relations: {
                            ...prev.relations,
                            forceRelations: updateArrayItem<WorldForceRelation>(prev.relations.forceRelations, index, {
                              ...relation,
                              targetForceId: event.target.value,
                            }),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.relations.targetForceIdPlaceholder")}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={relation.relation}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          relations: {
                            ...prev.relations,
                            forceRelations: updateArrayItem<WorldForceRelation>(prev.relations.forceRelations, index, {
                              ...relation,
                              relation: event.target.value,
                            }),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.relations.relationTypePlaceholder")}
                />
                <Input
                  value={relation.tension}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          relations: {
                            ...prev.relations,
                            forceRelations: updateArrayItem<WorldForceRelation>(prev.relations.forceRelations, index, {
                              ...relation,
                              tension: event.target.value,
                            }),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.relations.tensionPlaceholder")}
                />
              </div>
              <textarea
                className="min-h-[70px] w-full rounded-md border bg-background p-2 text-sm"
                value={relation.detail}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        relations: {
                          ...prev.relations,
                          forceRelations: updateArrayItem<WorldForceRelation>(prev.relations.forceRelations, index, {
                            ...relation,
                            detail: event.target.value,
                          }),
                        },
                      }
                      : prev,
                  )
                }
                placeholder={t("novel:world.structure.relations.descPlaceholder")}
              />
            </div>
          ))}
          {draftStructure.relations.locationControls.map((relation, index) => (
            <div key={relation.id || index} className="rounded-md border p-3 space-y-2">
              <div className="text-xs text-muted-foreground">
                {(forceNameById.get(relation.forceId) || relation.forceId || t("novel:world.structure.factions.force"))} {t("novel:world.structure.relations.controls")}{" "}
                {(locationNameById.get(relation.locationId) || relation.locationId || t("novel:world.structure.locations.location"))}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={relation.forceId}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          relations: {
                            ...prev.relations,
                            locationControls: updateArrayItem<WorldLocationControlRelation>(
                              prev.relations.locationControls,
                              index,
                              { ...relation, forceId: event.target.value },
                            ),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.relations.forceIdPlaceholder")}
                />
                <Input
                  value={relation.locationId}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          relations: {
                            ...prev.relations,
                            locationControls: updateArrayItem<WorldLocationControlRelation>(
                              prev.relations.locationControls,
                              index,
                              { ...relation, locationId: event.target.value },
                            ),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("novel:world.structure.relations.locationIdPlaceholder")}
                />
              </div>
              <Input
                value={relation.relation}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        relations: {
                          ...prev.relations,
                          locationControls: updateArrayItem<WorldLocationControlRelation>(
                            prev.relations.locationControls,
                            index,
                            { ...relation, relation: event.target.value },
                          ),
                        },
                      }
                      : prev,
                  )
                }
                placeholder={t("novel:world.structure.relations.controlRelationPlaceholder")}
              />
              <textarea
                className="min-h-[70px] w-full rounded-md border bg-background p-2 text-sm"
                value={relation.detail}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        relations: {
                          ...prev.relations,
                          locationControls: updateArrayItem<WorldLocationControlRelation>(
                            prev.relations.locationControls,
                            index,
                            { ...relation, detail: event.target.value },
                          ),
                        },
                      }
                      : prev,
                  )
                }
                placeholder={t("novel:world.structure.relations.notesPlaceholder")}
              />
            </div>
          ))}
        </div>

        <div className="rounded-md border p-3 space-y-2">
          <div className="font-medium">{t("novel:world.structure.binding.title")}</div>
          <div className="text-xs text-muted-foreground">{t("novel:world.structure.binding.readOnlyHint")}</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-3 text-sm">
              <div className="font-medium">{t("novel:world.structure.binding.entryPoints")}</div>
              <div className="mt-2 whitespace-pre-wrap">
                {draftBindingSupport.recommendedEntryPoints.join("\n") || t("novel:world.structure.none")}
              </div>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="font-medium">{t("novel:world.structure.binding.highPressureForces")}</div>
              <div className="mt-2 whitespace-pre-wrap">
                {draftBindingSupport.highPressureForces.join("\n") || t("novel:world.structure.none")}
              </div>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="font-medium">{t("novel:world.structure.binding.compatibleConflicts")}</div>
              <div className="mt-2 whitespace-pre-wrap">
                {draftBindingSupport.compatibleConflicts.join("\n") || t("novel:world.structure.none")}
              </div>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="font-medium">{t("novel:world.structure.binding.forbiddenCombinations")}</div>
              <div className="mt-2 whitespace-pre-wrap">
                {draftBindingSupport.forbiddenCombinations.join("\n") || t("novel:world.structure.none")}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
