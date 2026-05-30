import type { TFunction } from "i18next";
import type { NovelWorkspaceTab } from "../novelWorkspaceNavigation";
import type { NovelEditViewProps } from "../components/NovelEditView.types";

export interface MobileSaveState {
  visible: boolean;
  label: string;
  savingLabel: string;
  isSaving: boolean;
  onSave: () => void;
}

export function getMobileNovelWorkspaceStatusText(input: {
  activeLabel: string;
  workflowLabel: string;
}, t: TFunction): string {
  if (input.activeLabel === input.workflowLabel) {
    return t("novel:workspace.mobile.statusCurrentStep", { label: input.activeLabel });
  }

  return t("novel:workspace.mobile.statusCurrentStepWithFlow", { activeLabel: input.activeLabel, workflowLabel: input.workflowLabel });
}

export function getMobileNovelSaveState(
  tab: NovelWorkspaceTab,
  props: NovelEditViewProps,
  t: TFunction,
): MobileSaveState {
  switch (tab) {
    case "basic":
      return {
        visible: true,
        label: t("novel:workspace.mobile.saveBasic"),
        savingLabel: t("novel:workspace.mobile.saving"),
        isSaving: props.basicTab.isSaving,
        onSave: props.basicTab.onSave,
      };
    case "story_macro":
      return {
        visible: true,
        label: t("novel:workspace.mobile.saveStoryMacro"),
        savingLabel: t("novel:workspace.mobile.saving"),
        isSaving: props.storyMacroTab.isSaving,
        onSave: props.storyMacroTab.onSaveEdits,
      };
    case "character":
      return {
        visible: true,
        label: t("novel:workspace.mobile.saveCharacter"),
        savingLabel: t("novel:workspace.mobile.saving"),
        isSaving: props.characterTab.isSavingCharacter,
        onSave: props.characterTab.onSaveCharacter,
      };
    case "outline":
      return {
        visible: true,
        label: t("novel:workspace.mobile.saveOutline"),
        savingLabel: t("novel:workspace.mobile.saving"),
        isSaving: props.outlineTab.isSaving,
        onSave: props.outlineTab.onSave,
      };
    case "structured":
      return {
        visible: true,
        label: t("novel:workspace.mobile.saveStructured"),
        savingLabel: t("novel:workspace.mobile.saving"),
        isSaving: props.structuredTab.isSaving,
        onSave: props.structuredTab.onSave,
      };
    default:
      return {
        visible: false,
        label: "",
        savingLabel: "",
        isSaving: false,
        onSave: () => undefined,
      };
  }
}
