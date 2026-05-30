import { useTranslation } from "react-i18next";

interface WorldInjectionHintProps {
  worldInjectionSummary: string | null;
}

export default function WorldInjectionHint({ worldInjectionSummary }: WorldInjectionHintProps) {
  const { t } = useTranslation("novel");
  return (
    <div className="rounded-md border border-emerald-300 bg-emerald-50 p-2 text-xs text-emerald-900">
      {worldInjectionSummary ? (
        <div className="space-y-1">
          <div className="font-semibold">{t("worldInjection.injectedTitle")}</div>
          <pre className="whitespace-pre-wrap">{worldInjectionSummary}</pre>
        </div>
      ) : (
        <div>{t("worldInjection.noWorldHint")}</div>
      )}
    </div>
  );
}
