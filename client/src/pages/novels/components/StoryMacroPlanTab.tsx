import type { StoryConflictLayers, StoryMacroField } from "@ai-novel/shared/types/storyMacro";
import { useTranslation } from "react-i18next";
import AiButton from "@/components/common/AiButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CollapsibleSummary from "./CollapsibleSummary";
import type { StoryMacroTabProps } from "./NovelEditView.types";
import {
  buildEngineTextFields,
  buildSummaryFields,
  FieldActions,
  listToText,
  textareaClassName,
} from "./StoryMacroPlanTab.shared";
import DirectorTakeoverEntryPanel from "./DirectorTakeoverEntryPanel";

const EMPTY_CONFLICT_LAYERS: StoryConflictLayers = {
  external: "",
  internal: "",
  relational: "",
};

export default function StoryMacroPlanTab(props: StoryMacroTabProps) {
  const { t } = useTranslation();
  const SUMMARY_FIELDS = buildSummaryFields(t);
  const ENGINE_TEXT_FIELDS = buildEngineTextFields(t);

  const expansion = props.expansion ?? {
    expanded_premise: "",
    protagonist_core: "",
    conflict_engine: "",
    conflict_layers: EMPTY_CONFLICT_LAYERS,
    mystery_box: "",
    emotional_line: "",
    setpiece_seeds: [],
    tone_reference: "",
  };

  return (
    <div className="space-y-4">
      <DirectorTakeoverEntryPanel
        title={t("novel:storyMacro.takeoverTitle")}
        description={t("novel:storyMacro.takeoverDescription")}
        entry={props.directorTakeoverEntry}
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("novel:storyMacro.title")}</CardTitle>
          <CardDescription>
            {t("novel:storyMacro.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.ideaInputLabel")}</div>
            <textarea
              value={props.storyInput}
              onChange={(event) => props.onStoryInputChange(event.target.value)}
              placeholder={t("novel:storyMacro.ideaInputPlaceholder")}
              className={textareaClassName("min-h-36")}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <AiButton onClick={props.onDecompose} disabled={props.isDecomposing || !props.storyInput.trim()}>
              {props.isDecomposing
                ? t("novel:storyMacro.actions.generating")
                : props.hasPlan
                  ? t("novel:storyMacro.actions.regenerateEngine")
                  : t("novel:storyMacro.actions.generateEngine")}
            </AiButton>
            <AiButton
              variant="secondary"
              onClick={props.onBuildConstraintEngine}
              disabled={props.isBuilding || !props.decomposition.selling_point.trim()}
            >
              {props.isBuilding ? t("novel:storyMacro.actions.buildingConstraints") : t("novel:storyMacro.actions.buildConstraints")}
            </AiButton>
            <Button variant="outline" onClick={props.onSaveEdits} disabled={props.isSaving}>
              {props.isSaving ? t("novel:storyMacro.actions.saving") : t("novel:storyMacro.actions.saveChanges")}
            </Button>
          </div>
          {props.message ? (
            <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {props.message}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("novel:storyMacro.decompositionTitle")}</CardTitle>
          <CardDescription>
            {t("novel:storyMacro.decompositionDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {SUMMARY_FIELDS.map((item) => {
            const value = props.decomposition[item.field as keyof typeof props.decomposition];
            return (
              <div key={item.field} className="space-y-2 rounded-xl border border-border/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium text-foreground">{item.label}</div>
                  <FieldActions
                    field={item.field}
                    lockedFields={props.lockedFields}
                    regeneratingField={props.regeneratingField}
                    storyInput={props.storyInput}
                    onToggleLock={props.onToggleLock}
                    onRegenerateField={props.onRegenerateField}
                  />
                </div>
                {item.multiline ? (
                  <textarea
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => props.onFieldChange(item.field, event.target.value)}
                    placeholder={item.placeholder}
                    className={textareaClassName()}
                  />
                ) : (
                  <Input
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => props.onFieldChange(item.field, event.target.value)}
                    placeholder={item.placeholder}
                  />
                )}
              </div>
            );
          })}

          <div className="space-y-2 rounded-xl border border-border/70 p-4 xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.keyPayoffsLabel")}</div>
              <FieldActions
                field="major_payoffs"
                lockedFields={props.lockedFields}
                regeneratingField={props.regeneratingField}
                storyInput={props.storyInput}
                onToggleLock={props.onToggleLock}
                onRegenerateField={props.onRegenerateField}
              />
            </div>
            <textarea
              value={listToText(props.decomposition.major_payoffs)}
              onChange={(event) => props.onFieldChange(
                "major_payoffs",
                event.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
              )}
              placeholder={t("novel:storyMacro.keyPayoffsPlaceholder")}
              className={textareaClassName("min-h-32")}
            />
          </div>
        </CardContent>
      </Card>

      <details className="group rounded-2xl border border-border/70 bg-background/95 p-4">
        <summary className="cursor-pointer list-none">
          <CollapsibleSummary
            title={t("novel:storyMacro.advancedTitle")}
            description={t("novel:storyMacro.advancedDescription")}
          />
        </summary>

        <div className="mt-4 space-y-4">
          {props.expansion ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("novel:storyMacro.expansionTitle")}</CardTitle>
                <CardDescription>
                  {t("novel:storyMacro.expansionDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-2">
                  {ENGINE_TEXT_FIELDS.map((item) => {
                    const value = expansion[item.field as keyof typeof expansion];
                    return (
                      <div key={item.field} className="space-y-2 rounded-xl border border-border/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium text-foreground">{item.label}</div>
                          <FieldActions
                            field={item.field}
                            lockedFields={props.lockedFields}
                            regeneratingField={props.regeneratingField}
                            storyInput={props.storyInput}
                            onToggleLock={props.onToggleLock}
                            onRegenerateField={props.onRegenerateField}
                          />
                        </div>
                        {item.multiline ? (
                          <textarea
                            value={typeof value === "string" ? value : ""}
                            onChange={(event) => props.onFieldChange(item.field, event.target.value)}
                            placeholder={item.placeholder}
                            className={textareaClassName()}
                          />
                        ) : (
                          <Input
                            value={typeof value === "string" ? value : ""}
                            onChange={(event) => props.onFieldChange(item.field, event.target.value)}
                            placeholder={item.placeholder}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 rounded-xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.conflictLayerTitle")}</div>
                    <FieldActions
                      field="conflict_layers"
                      lockedFields={props.lockedFields}
                      regeneratingField={props.regeneratingField}
                      storyInput={props.storyInput}
                      onToggleLock={props.onToggleLock}
                      onRegenerateField={props.onRegenerateField}
                    />
                  </div>
                  <div className="grid gap-4 xl:grid-cols-3">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{t("novel:storyMacro.externalPressure")}</div>
                      <textarea
                        value={expansion.conflict_layers.external}
                        onChange={(event) => props.onFieldChange("conflict_layers", {
                          ...expansion.conflict_layers,
                          external: event.target.value,
                        })}
                        placeholder={t("novel:storyMacro.externalPressurePlaceholder")}
                        className={textareaClassName("min-h-24")}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{t("novel:storyMacro.internalCollapse")}</div>
                      <textarea
                        value={expansion.conflict_layers.internal}
                        onChange={(event) => props.onFieldChange("conflict_layers", {
                          ...expansion.conflict_layers,
                          internal: event.target.value,
                        })}
                        placeholder={t("novel:storyMacro.internalCollapsePlaceholder")}
                        className={textareaClassName("min-h-24")}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{t("novel:storyMacro.relationalPressure")}</div>
                      <textarea
                        value={expansion.conflict_layers.relational}
                        onChange={(event) => props.onFieldChange("conflict_layers", {
                          ...expansion.conflict_layers,
                          relational: event.target.value,
                        })}
                        placeholder={t("novel:storyMacro.relationalPressurePlaceholder")}
                        className={textareaClassName("min-h-24")}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.highTensionSeedsLabel")}</div>
                    <FieldActions
                      field="setpiece_seeds"
                      lockedFields={props.lockedFields}
                      regeneratingField={props.regeneratingField}
                      storyInput={props.storyInput}
                      onToggleLock={props.onToggleLock}
                      onRegenerateField={props.onRegenerateField}
                    />
                  </div>
                  <textarea
                    value={listToText(expansion.setpiece_seeds)}
                    onChange={(event) => props.onFieldChange(
                      "setpiece_seeds",
                      event.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
                    )}
                    placeholder={t("novel:storyMacro.highTensionSeedsPlaceholder")}
                    className={textareaClassName("min-h-32")}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {props.issues.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("novel:storyMacro.issuesTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {props.issues.map((issue, index) => (
                  <div key={`${issue.type}-${issue.field}-${index}`} className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <div className="font-medium">{issue.type === "conflict" ? t("novel:storyMacro.issueTypes.conflict") : t("novel:storyMacro.issueTypes.information")}</div>
                    <div className="mt-1">{issue.message}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{t("novel:storyMacro.hardConstraintsTitle")}</CardTitle>
              <CardDescription>
                {t("novel:storyMacro.hardConstraintsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.narrativeRulesLabel")}</div>
                <FieldActions
                  field="constraints"
                  lockedFields={props.lockedFields}
                  regeneratingField={props.regeneratingField}
                  storyInput={props.storyInput}
                  onToggleLock={props.onToggleLock}
                  onRegenerateField={props.onRegenerateField}
                />
              </div>
              <textarea
                value={listToText(props.constraints)}
                onChange={(event) => props.onFieldChange(
                  "constraints",
                  event.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
                )}
                placeholder={t("novel:storyMacro.narrativeRulesPlaceholder")}
                className={textareaClassName("min-h-36")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("novel:storyMacro.constraintsEngineTitle")}</CardTitle>
              <CardDescription>
                {t("novel:storyMacro.constraintsEngineDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {props.constraintEngine ? (
                <>
                  <div className="space-y-2 rounded-xl border border-border/70 p-4">
                    <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.constraintsLabels.premise")}</div>
                    <div className="text-sm leading-7 text-muted-foreground">{props.constraintEngine.premise}</div>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.constraintsLabels.coreUnknown")}</div>
                      <div className="text-sm text-muted-foreground">{props.constraintEngine.mystery_box}</div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.constraintsLabels.conflictAxis")}</div>
                      <div className="text-sm text-muted-foreground">{props.constraintEngine.conflict_axis}</div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.constraintsLabels.pressureCharacterSlots")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.pressure_roles.map((item) => (
                          <div key={item}>{item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.constraintsLabels.growthMilestones")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.growth_path.map((item) => (
                          <div key={item}>{item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.constraintsLabels.phaseModel")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.phase_model.map((phase) => (
                          <div key={phase.name}>
                            <span className="font-medium text-foreground">{phase.name}</span>
                            {" · "}
                            {phase.goal}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.constraintsLabels.hardConstraintsList")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.hard_constraints.map((item) => (
                          <div key={item}>{item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4 xl:col-span-2">
                      <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.constraintsLabels.deliveryNodes")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.turning_points.map((item) => (
                          <div key={`${item.phase}-${item.title}`}>
                            <span className="font-medium text-foreground">{item.phase}</span>
                            {" · "}
                            {item.summary}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.constraintsLabels.endingMust")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.ending_constraints.must_have.map((item) => (
                          <div key={item}>{item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.constraintsLabels.endingAvoid")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.ending_constraints.must_not_have.map((item) => (
                          <div key={item}>{item}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                  {t("novel:storyMacro.constraintsEmpty")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("novel:storyMacro.stateTitle")}</CardTitle>
              <CardDescription>
                {t("novel:storyMacro.stateDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-[160px_160px_minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.stateLabels.currentPhase")}</div>
                <Input
                  type="number"
                  value={props.state.currentPhase}
                  onChange={(event) => props.onStateChange("currentPhase", Number(event.target.value))}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.stateLabels.progress")}</div>
                <Input
                  type="number"
                  value={props.state.progress}
                  onChange={(event) => props.onStateChange("progress", Number(event.target.value))}
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">{t("novel:storyMacro.stateLabels.protagonistState")}</div>
                <Input
                  value={props.state.protagonistState}
                  onChange={(event) => props.onStateChange("protagonistState", event.target.value)}
                  placeholder={t("novel:storyMacro.protagonistStatePlaceholder")}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={props.onSaveState} disabled={props.isSavingState}>
                  {props.isSavingState ? t("novel:storyMacro.actions.savingState") : t("novel:storyMacro.actions.saveState")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </details>
    </div>
  );
}
