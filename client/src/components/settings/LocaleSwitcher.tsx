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

export interface LocaleSwitcherProps {
  currentLocale: LocaleCode;
  onLocaleChange: (next: LocaleCode) => Promise<void> | void;
}

/**
 * Dropdown that lets the single user toggle between supported locales.
 * Lives inside the Settings page; no automatic detection from the
 * browser/OS, per the design.
 */
export function LocaleSwitcher({
  currentLocale,
  onLocaleChange,
}: LocaleSwitcherProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">{t("settings:locale.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("settings:locale.description")}
        </p>
      </div>
      <Select
        value={currentLocale}
        onValueChange={(value) => {
          if ((SUPPORTED_LOCALES as readonly string[]).includes(value)) {
            void onLocaleChange(value as LocaleCode);
          }
        }}
      >
        <SelectTrigger className="w-72">
          <SelectValue placeholder={t("settings:locale.currentLabel")} />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LOCALES.map((locale) => (
            <SelectItem key={locale} value={locale}>
              {t(LOCALE_LABEL_KEYS[locale])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
