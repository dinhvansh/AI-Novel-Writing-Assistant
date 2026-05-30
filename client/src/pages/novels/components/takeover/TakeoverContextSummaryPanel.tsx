import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";

interface TakeoverContextSummaryPanelProps {
  lines: string[];
}

export default function TakeoverContextSummaryPanel({ lines }: TakeoverContextSummaryPanelProps) {
  const { t } = useTranslation("novel");
  return (
    <div className="min-w-0 rounded-xl border bg-muted/15 p-3 sm:p-4">
      <div className="text-sm font-medium text-foreground">{t("takeover.contextSummary.title")}</div>
      <div className="mt-2 flex min-w-0 flex-wrap gap-2">
        {lines.length > 0 ? lines.map((line) => (
          <Badge key={line} variant="secondary" className="max-w-full whitespace-normal break-words text-left [overflow-wrap:anywhere]">
            {line}
          </Badge>
        )) : (
          <span className={`text-sm text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
            {t("takeover.contextSummary.emptyHint")}
          </span>
        )}
      </div>
    </div>
  );
}
