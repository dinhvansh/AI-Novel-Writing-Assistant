import type { Character } from "@ai-novel/shared/types/novel";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isProtagonistCharacter } from "./characterAssetWorkspace.helpers";

interface CharacterAssetSidebarProps {
  characters: Character[];
  selectedCharacterId: string;
  onSelectedCharacterChange: (id: string) => void;
  onDeleteCharacter: (characterId: string) => void;
  isDeletingCharacter: boolean;
  deletingCharacterId: string;
}

function getCharacterCardClass(isSelected: boolean, isProtagonist: boolean): string {
  const selectedClass = isProtagonist
    ? "border-primary bg-primary/10 shadow-sm"
    : "border-primary bg-primary/5 shadow-sm";
  const idleClass = isProtagonist
    ? "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
    : "border-border/70 hover:border-primary/30 hover:bg-muted/30";
  return `flex w-full items-stretch gap-2 rounded-xl border p-3 text-left transition ${
    isSelected ? selectedClass : idleClass
  }`;
}

function confirmDeleteCharacter(character: Character, onDeleteCharacter: (characterId: string) => void, t: (key: string, opts?: Record<string, unknown>) => string) {
  const confirmed = window.confirm(t("characterSidebar.deleteConfirm", { name: character.name }));
  if (!confirmed) {
    return;
  }
  onDeleteCharacter(character.id);
}

function CharacterCard(props: {
  character: Character;
  selectedCharacterId: string;
  onSelectedCharacterChange: (id: string) => void;
  onDeleteCharacter: (characterId: string) => void;
  isDeletingCharacter: boolean;
  deletingCharacterId: string;
  isProtagonist?: boolean;
}) {
  const {
    character,
    selectedCharacterId,
    onSelectedCharacterChange,
    onDeleteCharacter,
    isDeletingCharacter,
    deletingCharacterId,
    isProtagonist = false,
  } = props;
  const isSelected = selectedCharacterId === character.id;
  const isDeletingThis = isDeletingCharacter && deletingCharacterId === character.id;
  const { t } = useTranslation("novel");
  const supportingLine = isProtagonist
    ? character.currentGoal || character.storyFunction || character.role || t("characterSidebar.pendingProtagonistGoal")
    : character.relationToProtagonist || character.role || t("characterSidebar.pendingCharacterRole");
  const supportingLabel = character.relationToProtagonist ? t("characterSidebar.relationLabel") : t("characterSidebar.roleLabel");

  return (
    <div className={getCharacterCardClass(isSelected, isProtagonist)}>
      <button
        type="button"
        onClick={() => onSelectedCharacterChange(character.id)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate font-medium">{character.name}</div>
          {isProtagonist ? <Badge variant="secondary">{t("characterSidebar.protagonistBadge")}</Badge> : null}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {isProtagonist ? t("characterSidebar.identityLabel", { role: character.role || t("characterSidebar.pending") }) : `${supportingLabel}：${supportingLine}`}
        </div>
        {isProtagonist ? (
          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {t("characterSidebar.currentGoalLabel")}{supportingLine}
          </div>
        ) : null}
      </button>
      <Button
        size="sm"
        variant="destructive"
        disabled={isDeletingThis}
        onClick={() => confirmDeleteCharacter(character, onDeleteCharacter, t)}
        className="shrink-0 self-center"
      >
        {isDeletingThis ? t("characterSidebar.deleting") : t("characterSidebar.delete")}
      </Button>
    </div>
  );
}

export default function CharacterAssetSidebar(props: CharacterAssetSidebarProps) {
  const {
    characters,
    selectedCharacterId,
    onSelectedCharacterChange,
    onDeleteCharacter,
    isDeletingCharacter,
    deletingCharacterId,
  } = props;
  const { t } = useTranslation("novel");
  const protagonist = characters.find(isProtagonistCharacter);
  const supportingCharacters = characters.filter((character) => !isProtagonistCharacter(character));

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Protagonist</div>
          {protagonist ? <Badge variant="outline">{t("characterSidebar.protagonistBadge")}</Badge> : null}
        </div>
        {protagonist ? (
          <CharacterCard
            character={protagonist}
            selectedCharacterId={selectedCharacterId}
            onSelectedCharacterChange={onSelectedCharacterChange}
            onDeleteCharacter={onDeleteCharacter}
            isDeletingCharacter={isDeletingCharacter}
            deletingCharacterId={deletingCharacterId}
            isProtagonist
          />
        ) : (
          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
            {t("characterSidebar.noProtagonist")}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {t("characterSidebar.supportingTitle")}
        </div>
        {characters.length === 0 ? (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {t("characterSidebar.noCharacters")}
          </div>
        ) : supportingCharacters.length > 0 ? (
          <div className="max-h-[460px] space-y-2 overflow-auto pr-1">
            {supportingCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                selectedCharacterId={selectedCharacterId}
                onSelectedCharacterChange={onSelectedCharacterChange}
                onDeleteCharacter={onDeleteCharacter}
                isDeletingCharacter={isDeletingCharacter}
                deletingCharacterId={deletingCharacterId}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {t("characterSidebar.onlyProtagonist")}
          </div>
        )}
      </section>
    </div>
  );
}
