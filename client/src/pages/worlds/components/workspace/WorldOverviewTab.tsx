import type { WorldVisualizationPayload } from "@ai-novel/shared/types/world";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { featureFlags } from "@/config/featureFlags";
import WorldVisualizationBoard from "../WorldVisualizationBoard";

interface WorldOverviewTabProps {
  summary?: string;
  sections: Array<{ key: string; title: string; content: string }>;
  visualization?: WorldVisualizationPayload;
}

export default function WorldOverviewTab(props: WorldOverviewTabProps) {
  const { summary, sections, visualization } = props;
  const { t } = useTranslation("world");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{featureFlags.worldVisEnabled ? t("workspace.overview.titleWithVis") : t("workspace.overview.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border p-3 text-sm">
          <div className="font-medium mb-1">{t("workspace.overview.summaryLabel")}</div>
          <div>{summary ?? t("workspace.overview.noSummary")}</div>
        </div>
        {sections.map((section) => (
          <div key={section.key} className="rounded-md border p-3 text-sm">
            <div className="font-medium mb-1">{section.title}</div>
            <div className="whitespace-pre-wrap">{section.content}</div>
          </div>
        ))}
        {featureFlags.worldVisEnabled ? (
          <WorldVisualizationBoard payload={visualization} />
        ) : (
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            {t("workspace.overview.visDisabled")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
