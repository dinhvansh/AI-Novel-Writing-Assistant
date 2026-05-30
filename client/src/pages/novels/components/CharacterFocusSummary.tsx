import type { Character } from "@ai-novel/shared/types/novel";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { getCastRoleLabel, getCharacterGenderLabel, isProtagonistCharacter } from "./characterAssetWorkspace.helpers";

interface CharacterFocusSummaryProps {
  selectedCharacter: Character;
  lastAppearanceChapter?: number | null;
}

export default function CharacterFocusSummary(props: CharacterFocusSummaryProps) {
  const { t } = useTranslation("novel");
  const { selectedCharacter, lastAppearanceChapter } = props;
  const isProtagonist = isProtagonistCharacter(selectedCharacter);
  const focusTitle = isProtagonist
    ? t("novel:characterFocus.editingProtagonist", { name: selectedCharacter.name })
    : t("novel:characterFocus.editingCharacter", { name: selectedCharacter.name });
  const primaryLine = isProtagonist
    ? selectedCharacter.currentGoal || selectedCharacter.storyFunction || t("novel:characterFocus.pendingProtagonistGoal")
    : selectedCharacter.relationToProtagonist || selectedCharacter.role || t("novel:characterFocus.pendingRelation");

  return (
    <div className={`rounded-xl border p-4 ${isProtagonist ? "border-primary/30 bg-primary/5" : "bg-muted/10"}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold">{focusTitle}</div>
            {isProtagonist ? (
              <Badge variant="secondary">{t("novel:characterFocus.protagonistBadge")}</Badge>
            ) : (
              <Badge variant="outline">{getCastRoleLabel(selectedCharacter.castRole)}</Badge>
            )}
            <Badge variant="secondary">{getCharacterGenderLabel(selectedCharacter.gender)}</Badge>
          </div>
          <div className="text-sm leading-6 text-muted-foreground">
            {isProtagonist ? t("novel:characterFocus.currentGoalLine", { line: primaryLine }) : t("novel:characterFocus.relationLine", { line: primaryLine })}
          </div>
        </div>
        <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2 lg:min-w-[320px]">
          <div>{t("novel:characterFocus.roleLabel", { role: selectedCharacter.role || t("novel:characterFocus.undefinedRole") })}</div>
          <div>{t("novel:characterFocus.lastAppearanceLabel", { chapter: lastAppearanceChapter ? t("novel:characterFocus.chapterNumber", { order: lastAppearanceChapter }) : t("novel:characterFocus.noAppearance") })}</div>
          <div>{t("novel:characterFocus.storyFunctionLabel", { fn: selectedCharacter.storyFunction || t("novel:characterFocus.pending") })}</div>
          <div>{t("novel:characterFocus.currentStateLabel", { state: selectedCharacter.currentState || t("novel:characterFocus.pending") })}</div>
        </div>
      </div>
    </div>
  );
}
