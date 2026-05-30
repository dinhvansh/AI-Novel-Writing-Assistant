import type { StoryMacroField } from "@ai-novel/shared/types/storyMacro";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import AiButton from "@/components/common/AiButton";
import { Button } from "@/components/ui/button";

export interface StoryMacroFieldDescriptor {
  field: StoryMacroField;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

export function buildEngineTextFields(t: TFunction): StoryMacroFieldDescriptor[] {
  return [
    {
      field: "expanded_premise",
      label: t("novel:storyMacro.expansionFields.expandedPremise"),
      placeholder: t("novel:storyMacro.expansionFields.expandedPremisePlaceholder"),
      multiline: true,
    },
    {
      field: "protagonist_core",
      label: t("novel:storyMacro.expansionFields.protagonistCore"),
      placeholder: t("novel:storyMacro.expansionFields.protagonistCorePlaceholder"),
      multiline: true,
    },
    {
      field: "conflict_engine",
      label: t("novel:storyMacro.expansionFields.conflictEngine"),
      placeholder: t("novel:storyMacro.expansionFields.conflictEnginePlaceholder"),
      multiline: true,
    },
    {
      field: "mystery_box",
      label: t("novel:storyMacro.expansionFields.mysteryBox"),
      placeholder: t("novel:storyMacro.expansionFields.mysteryBoxPlaceholder"),
      multiline: true,
    },
    {
      field: "emotional_line",
      label: t("novel:storyMacro.expansionFields.emotionalLine"),
      placeholder: t("novel:storyMacro.expansionFields.emotionalLinePlaceholder"),
      multiline: true,
    },
    {
      field: "tone_reference",
      label: t("novel:storyMacro.expansionFields.toneReference"),
      placeholder: t("novel:storyMacro.expansionFields.toneReferencePlaceholder"),
      multiline: true,
    },
  ];
}

export function buildSummaryFields(t: TFunction): StoryMacroFieldDescriptor[] {
  return [
    {
      field: "selling_point",
      label: t("novel:storyMacro.decompositionFields.sellingPoint"),
      placeholder: t("novel:storyMacro.decompositionFields.sellingPointPlaceholder"),
    },
    {
      field: "core_conflict",
      label: t("novel:storyMacro.decompositionFields.coreConflict"),
      placeholder: t("novel:storyMacro.decompositionFields.coreConflictPlaceholder"),
    },
    {
      field: "main_hook",
      label: t("novel:storyMacro.decompositionFields.mainHook"),
      placeholder: t("novel:storyMacro.decompositionFields.mainHookPlaceholder"),
    },
    {
      field: "progression_loop",
      label: t("novel:storyMacro.decompositionFields.progressionLoop"),
      placeholder: t("novel:storyMacro.decompositionFields.progressionLoopPlaceholder"),
      multiline: true,
    },
    {
      field: "growth_path",
      label: t("novel:storyMacro.decompositionFields.growthPath"),
      placeholder: t("novel:storyMacro.decompositionFields.growthPathPlaceholder"),
      multiline: true,
    },
    {
      field: "ending_flavor",
      label: t("novel:storyMacro.decompositionFields.endingFlavor"),
      placeholder: t("novel:storyMacro.decompositionFields.endingFlavorPlaceholder"),
    },
  ];
}

export function listToText(value: string[]): string {
  return value.join("\n");
}

export function textareaClassName(minHeight = "min-h-28") {
  return `${minHeight} w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring`;
}

export function FieldActions(props: {
  field: StoryMacroField;
  lockedFields: Partial<Record<StoryMacroField, boolean>>;
  regeneratingField: StoryMacroField | "";
  storyInput: string;
  onToggleLock: (field: StoryMacroField) => void;
  onRegenerateField: (field: StoryMacroField) => void;
}) {
  const { t } = useTranslation();
  const isLocked = Boolean(props.lockedFields[props.field]);
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={isLocked ? "secondary" : "outline"}
        onClick={() => props.onToggleLock(props.field)}
      >
        {isLocked ? t("novel:storyMacro.fieldActions.locked") : t("novel:storyMacro.fieldActions.lock")}
      </Button>
      <AiButton
        size="sm"
        variant="outline"
        onClick={() => props.onRegenerateField(props.field)}
        disabled={props.regeneratingField === props.field || isLocked || !props.storyInput.trim()}
      >
        {props.regeneratingField === props.field ? t("novel:storyMacro.fieldActions.regenerating") : t("novel:storyMacro.fieldActions.regenerate")}
      </AiButton>
    </div>
  );
}
