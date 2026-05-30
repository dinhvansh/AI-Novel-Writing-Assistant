import type { TFunction } from "i18next";

type DirectorDialogMode = "candidate_selection" | "execution_progress" | "execution_failed";

interface NovelAutoDirectorDialogHeaderProps {
  mode: DirectorDialogMode;
  t: TFunction;
}

export function NovelAutoDirectorDialogTitle({ mode, t }: NovelAutoDirectorDialogHeaderProps) {
  if (mode === "candidate_selection") {
    return t("autoDirector:dialog.title.candidateSelection");
  }
  if (mode === "execution_failed") {
    return t("autoDirector:dialog.title.executionFailed");
  }
  return t("autoDirector:dialog.title.executionInProgress");
}

export function NovelAutoDirectorDialogDescription({ mode, t }: NovelAutoDirectorDialogHeaderProps) {
  if (mode === "candidate_selection") {
    return t("autoDirector:dialog.description.candidateSelection");
  }
  if (mode === "execution_failed") {
    return t("autoDirector:dialog.description.executionFailed");
  }
  return t("autoDirector:dialog.description.executionInProgress");
}

export type { DirectorDialogMode };
