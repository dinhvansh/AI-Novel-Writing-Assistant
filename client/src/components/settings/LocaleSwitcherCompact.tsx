import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  SUPPORTED_LOCALES,
  type LocaleCode,
} from "@ai-novel/shared/localization";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LOCALE_LABEL_KEYS: Record<LocaleCode, string> = {
  "vi-VN": "settings:locale.options.vi-VN",
  "zh-CN": "settings:locale.options.zh-CN",
};

export interface LocaleSwitcherCompactProps {
  currentLocale: LocaleCode;
  onLocaleChange: (next: LocaleCode) => Promise<void> | void;
  className?: string;
}

/**
 * Header-mounted compact variant of `LocaleSwitcher`.
 *
 * Shows just a globe icon + active locale code so it never crowds the
 * navbar on narrow viewports. Full-fat description+label switcher still
 * lives on the Settings page.
 */
export function LocaleSwitcherCompact({
  currentLocale,
  onLocaleChange,
  className,
}: LocaleSwitcherCompactProps) {
  const { t } = useTranslation();
  return (
    <Select
      value={currentLocale}
      onValueChange={(value) => {
        if ((SUPPORTED_LOCALES as readonly string[]).includes(value)) {
          void onLocaleChange(value as LocaleCode);
        }
      }}
    >
      <SelectTrigger
        className={
          "h-9 w-auto gap-2 px-2 sm:px-3 " + (className ?? "")
        }
        aria-label={t("settings:locale.title")}
        title={t("settings:locale.title")}
      >
        <Languages className="h-4 w-4 text-muted-foreground" />
        <SelectValue placeholder={t("settings:locale.title")} />
      </SelectTrigger>
      <SelectContent align="end">
        {SUPPORTED_LOCALES.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {t(LOCALE_LABEL_KEYS[locale])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
