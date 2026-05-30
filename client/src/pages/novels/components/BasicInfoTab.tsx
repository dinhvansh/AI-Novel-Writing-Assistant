import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BasicTabProps } from "./NovelEditView.types";
import NovelBasicInfoForm from "./NovelBasicInfoForm";
import NovelStyleRecommendationCard from "./NovelStyleRecommendationCard";
import NovelWorldUsageCard from "./NovelWorldUsageCard";
import { BookFramingQuickFillButton } from "./basicInfoForm/BookFramingQuickFillButton";
import CollapsibleSummary from "./CollapsibleSummary";
import NovelCreateTitleQuickFill from "./titleWorkshop/NovelCreateTitleQuickFill";
import DirectorTakeoverEntryPanel from "./DirectorTakeoverEntryPanel";
import { NovelCoverCard } from "./cover/NovelCoverCard";

export default function BasicInfoTab(props: BasicTabProps) {
  const { t } = useTranslation("novel");
  return (
    <div className="space-y-4">
      <DirectorTakeoverEntryPanel
        title={t("basicInfoTab.takeoverTitle")}
        description={t("basicInfoTab.takeoverDescription")}
        entry={props.directorTakeoverEntry}
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("basicInfoTab.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <NovelBasicInfoForm
            basicForm={props.basicForm}
            genreOptions={props.genreOptions}
            storyModeOptions={props.storyModeOptions}
            worldOptions={props.worldOptions}
            sourceNovelOptions={props.sourceNovelOptions}
            sourceKnowledgeOptions={props.sourceKnowledgeOptions}
            sourceNovelBookAnalysisOptions={props.sourceNovelBookAnalysisOptions}
            isLoadingSourceNovelBookAnalyses={props.isLoadingSourceNovelBookAnalyses}
            availableBookAnalysisSections={props.availableBookAnalysisSections}
            onFormChange={props.onFormChange}
            onSubmit={props.onSave}
            isSubmitting={props.isSaving}
            submitLabel={t("basicInfoTab.submitLabel")}
            titleQuickFill={(
              <NovelCreateTitleQuickFill
                basicForm={props.basicForm}
                onApplyTitle={(title) => props.onFormChange({ title })}
              />
            )}
            framingQuickFill={(
              <BookFramingQuickFillButton
                basicForm={props.basicForm}
                genreOptions={props.genreOptions}
                onApplySuggestion={props.onFormChange}
              />
            )}
            coverSection={(
              <NovelCoverCard
                novelId={props.novelId}
                basicForm={props.basicForm}
                genreOptions={props.genreOptions}
                storyModeOptions={props.storyModeOptions}
                worldOptions={props.worldOptions}
                worldSliceView={props.worldSliceView}
              />
            )}
            projectQuickStart={props.projectQuickStart}
          />
        </CardContent>
      </Card>

      <details className="group rounded-2xl border border-border/70 bg-background/95 p-4">
        <summary className="cursor-pointer list-none">
          <CollapsibleSummary
            title={t("basicInfoTab.styleSection.title")}
            description={t("basicInfoTab.styleSection.description")}
            meta={t("basicInfoTab.styleSection.meta")}
          />
        </summary>

        <div className="mt-4 space-y-4">
          <NovelStyleRecommendationCard novelId={props.novelId} />

          <NovelWorldUsageCard
            view={props.worldSliceView}
            message={props.worldSliceMessage}
            isRefreshing={props.isRefreshingWorldSlice}
            isSaving={props.isSavingWorldSliceOverrides}
            onRefresh={props.onRefreshWorldSlice}
            onSave={props.onSaveWorldSliceOverrides}
          />
        </div>
      </details>
    </div>
  );
}
