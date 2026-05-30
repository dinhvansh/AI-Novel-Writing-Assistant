import type { TFunction } from "i18next";
import type { TitleSuggestionStyle } from "@ai-novel/shared/types/title";

export function getTitleStyleLabel(style: TitleSuggestionStyle, t: TFunction): string {
  switch (style) {
    case "literary":
      return t("titles:studio.styleLabels.literary");
    case "conflict":
      return t("titles:studio.styleLabels.conflict");
    case "suspense":
      return t("titles:studio.styleLabels.suspense");
    case "high_concept":
      return t("titles:studio.styleLabels.highConcept");
    default:
      return t("titles:studio.styleLabels.default");
  }
}

export function getClickRateBadgeClass(rate: number): string {
  if (rate >= 90) {
    return "bg-rose-500 text-white";
  }
  if (rate >= 80) {
    return "bg-orange-500 text-white";
  }
  if (rate >= 70) {
    return "bg-amber-500 text-black";
  }
  return "bg-muted text-muted-foreground";
}

export function truncateText(value: string | null | undefined, maxLength = 120): string {
  const text = (value ?? "").trim();
  if (!text) {
    return "";
  }
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}
