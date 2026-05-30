import i18n from "i18next";
import type { Character, CharacterCastRole, CharacterGender } from "@ai-novel/shared/types/novel";

export function getCastRoleLabel(castRole?: CharacterCastRole | null): string {
  if (!castRole) {
    return i18n.t("novel:characterAsset.undefinedRole");
  }
  const key = `novel:characterAsset.castRoles.${castRole}`;
  const translated = i18n.t(key);
  return translated !== key ? translated : castRole;
}

export function getCharacterGenderLabel(gender?: CharacterGender | null): string {
  if (!gender) {
    return i18n.t("novel:characterAsset.unknownGender");
  }
  const key = `novel:characterAsset.genders.${gender}`;
  const translated = i18n.t(key);
  return translated !== key ? translated : gender;
}

export function isProtagonistCharacter(character?: Character | null): boolean {
  if (!character) {
    return false;
  }
  if (character.castRole === "protagonist") {
    return true;
  }
  const roleText = `${character.role ?? ""} ${character.castRole ?? ""}`;
  return /主角|男主|女主|主人公/.test(roleText); // i18n-ignore: matching against DB role values
}
