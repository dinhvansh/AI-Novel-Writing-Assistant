import { useTranslation } from "react-i18next";
import type { AutoDirectorFollowUpListResponse, AutoDirectorFollowUpOverview } from "@ai-novel/shared/types/autoDirectorFollowUp";
import type { AutoDirectorFollowUpSection } from "@ai-novel/shared/types/autoDirectorValidation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";

interface AutoDirectorFollowUpOverviewCardsProps {
  overview: AutoDirectorFollowUpOverview | null;
  list: AutoDirectorFollowUpListResponse | null;
  activeSection: AutoDirectorFollowUpSection | "";
  onSectionChange: (section: AutoDirectorFollowUpSection | "") => void;
}

export function AutoDirectorFollowUpOverviewCards({
  overview,
  list,
  activeSection,
  onSectionChange,
}: AutoDirectorFollowUpOverviewCardsProps) {
  const { t } = useTranslation();
  const counters = list?.countersBySection ?? overview?.countersBySection;

  type SectionKey = AutoDirectorFollowUpSection | "";
  const cards: Array<{ section: SectionKey; labelKey: string; descKey: string; count: number }> = [
    { section: "", labelKey: "autoDirectorFollowUps:overview.sections.all", descKey: "autoDirectorFollowUps:overview.sectionDescriptions.all", count: overview?.totalCount ?? list?.pagination.total ?? 0 },
    { section: "needs_validation", labelKey: "autoDirectorFollowUps:overview.sections.needs_validation", descKey: "autoDirectorFollowUps:overview.sectionDescriptions.needs_validation", count: counters?.needs_validation ?? 0 },
    { section: "exception", labelKey: "autoDirectorFollowUps:overview.sections.exception", descKey: "autoDirectorFollowUps:overview.sectionDescriptions.exception", count: counters?.exception ?? 0 },
    { section: "pending", labelKey: "autoDirectorFollowUps:overview.sections.pending", descKey: "autoDirectorFollowUps:overview.sectionDescriptions.pending", count: counters?.pending ?? 0 },
    { section: "auto_progress", labelKey: "autoDirectorFollowUps:overview.sections.auto_progress", descKey: "autoDirectorFollowUps:overview.sectionDescriptions.auto_progress", count: counters?.auto_progress ?? 0 },
    { section: "replaced", labelKey: "autoDirectorFollowUps:overview.sections.replaced", descKey: "autoDirectorFollowUps:overview.sectionDescriptions.replaced", count: counters?.replaced ?? 0 },
  ];

  return (
    <div className={AUTO_DIRECTOR_MOBILE_CLASSES.followUpOverviewGrid}>
      <Card className={AUTO_DIRECTOR_MOBILE_CLASSES.followUpOverviewCard}>
        <CardHeader className="pb-3">
          <div className={AUTO_DIRECTOR_MOBILE_CLASSES.followUpOverviewHeader}>
            <div className="min-w-0">
              <CardTitle className="text-base">{t("autoDirectorFollowUps:overview.title")}</CardTitle>
              <div className={`mt-1 text-xs text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                {t("autoDirectorFollowUps:overview.todaySummary", {
                  recovered: list?.summaryCounters.recoveredToday ?? 0,
                  completed: list?.summaryCounters.completedToday ?? 0,
                })}
              </div>
            </div>
            <div className="text-2xl font-semibold leading-none">{overview?.totalCount ?? 0}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={AUTO_DIRECTOR_MOBILE_CLASSES.followUpOverviewSectionGrid}>
            {cards.map((card) => (
              <button
                key={card.section || "all"}
                type="button"
                onClick={() => onSectionChange(card.section)}
                className={cn(
                  "h-full min-w-0 rounded-lg border bg-background p-3 text-left transition hover:border-primary/50",
                  activeSection === card.section && "border-primary bg-primary/5",
                )}
              >
                <div className="text-sm font-medium">{t(card.labelKey)}</div>
                <div className="mt-1 text-xl font-semibold leading-none">{card.count}</div>
                <div className={`mt-1 text-xs text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                  {t(card.descKey)}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
