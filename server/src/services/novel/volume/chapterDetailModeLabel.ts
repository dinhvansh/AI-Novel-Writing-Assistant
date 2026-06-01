import type { ChapterDetailMode } from "./volumeModels";
import { DEFAULT_LOCALE, type LocaleCode } from "@ai-novel/shared/localization";
import { getI18nServerHandle } from "../../../i18n";

export function formatChapterDetailModeLabel(detailMode: ChapterDetailMode, locale: LocaleCode = DEFAULT_LOCALE): string {
  const handle = getI18nServerHandle();
  if (handle) {
    const keyMap: Record<string, string> = {
      purpose: "chapterDetailMode.purpose",
      boundary: "chapterDetailMode.boundary",
      task_sheet: "chapterDetailMode.taskSheet",
    };
    const key = keyMap[detailMode];
    if (key) {
      const result = handle.t("serverLogs", key, { lng: locale });
      if (result && result !== `serverLogs:${key}`) return result;
    }
  }
  // i18n-ignore: fallback strings
  if (detailMode === "purpose") return "\u7ae0\u8282\u76ee\u6807";
  if (detailMode === "boundary") return "\u6267\u884c\u8fb9\u754c";
  return "\u4efb\u52a1\u5355";
}
