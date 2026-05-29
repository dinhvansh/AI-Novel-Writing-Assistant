import type { KeyboardEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LandingProfileItem } from "../writingFormulaLandingItems";

interface WritingFormulaLandingProps {
  onOpenCreate: () => void;
  onSelectProfile: (profileId: string) => void;
  onEditProfile: (profileId: string) => void;
  onOpenWorkbench: (profileId: string) => void;
  onUseProfileForClean: (profileId: string) => void;
  onDeleteProfile: (profileId: string) => void;
  deletePending: boolean;
  profileItems: LandingProfileItem[];
  selectedProfileId: string;
}

function truncateText(value: string | null | undefined, maxLength: number): string {
  const text = value?.trim() ?? "";
  if (!text) {
    return "";
  }
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function handleSelectableKeyDown(event: KeyboardEvent<HTMLDivElement>, onSelect: () => void): void {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  event.preventDefault();
  onSelect();
}

function DetailPanel(props: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border bg-white/80 p-4">
      <div className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{props.title}</div>
        {props.description ? (
          <div className="text-xs leading-6 text-slate-500">{props.description}</div>
        ) : null}
      </div>
      {props.children}
    </div>
  );
}

function DetailStatRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm leading-6">
      <div className="text-slate-500">{props.label}</div>
      <div className="text-right text-slate-800">{props.value}</div>
    </div>
  );
}

function SummaryCard(props: { title: string; summary: string }) {
  return (
    <div className="rounded-xl border bg-slate-50/80 p-3">
      <div className="text-sm font-medium text-slate-900">{props.title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{props.summary}</div>
    </div>
  );
}

export default function WritingFormulaLanding(props: WritingFormulaLandingProps) {
  const { t } = useTranslation();
  const {
    onOpenCreate,
    onSelectProfile,
    onEditProfile,
    onOpenWorkbench,
    onUseProfileForClean,
    onDeleteProfile,
    deletePending,
    profileItems,
    selectedProfileId,
  } = props;

  const customProfiles = profileItems.filter((item) => !item.isStarter);
  const starterProfiles = profileItems.filter((item) => item.isStarter);

  const renderProfileCard = (profile: LandingProfileItem) => {
    const isSelected = profile.id === selectedProfileId;
    const selectedStyle = profile.isStarter
      ? "border-sky-500 bg-sky-50/80 shadow-[0_8px_24px_rgba(14,165,233,0.12)]"
      : "border-slate-950 bg-[linear-gradient(135deg,rgba(15,23,42,0.04),rgba(14,165,233,0.06))] shadow-[0_8px_24px_rgba(15,23,42,0.06)]";
    const idleStyle = profile.isStarter
      ? "border-slate-200 bg-white hover:border-sky-300"
      : "border-slate-200 bg-slate-50/80 hover:border-slate-300";
    const badgeClassName = profile.isStarter
      ? "h-6 border-sky-200 bg-white text-sky-700"
      : "h-6";

    return (
      <div
        key={profile.id}
        role="button"
        tabIndex={0}
        onClick={() => onSelectProfile(profile.id)}
        onKeyDown={(event) => handleSelectableKeyDown(event, () => onSelectProfile(profile.id))}
        className={`rounded-2xl border px-4 py-4 text-left transition ${isSelected ? selectedStyle : idleStyle}`}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-semibold text-slate-950">{profile.name}</div>
              <Badge variant={profile.isStarter ? "outline" : (isSelected ? "default" : "secondary")} className={badgeClassName}>
                {profile.originLabel}
              </Badge>
              {profile.category ? (
                <Badge variant="outline" className="h-6 border-slate-200 text-slate-600">
                  {profile.category}
                </Badge>
              ) : null}
              <Badge variant="outline" className="h-6 border-slate-200 text-slate-600">
                {profile.sourceTypeLabel}
              </Badge>
            </div>
            <div className="text-sm leading-6 text-slate-600">
              {truncateText(profile.summaryLine, 120) || t("novel:writingFormula.landing.noSummary")}
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.tags.slice(0, 4).map((tag) => (
                <Badge key={`${profile.id}-${tag}`} variant="outline" className="h-6 border-slate-200 text-slate-600">
                  {tag}
                </Badge>
              ))}
              {profile.recentNovelTitle ? (
                <Badge variant="secondary" className="h-6 bg-amber-50 text-amber-800">
                  {t("novel:writingFormula.landing.recentBinding")}：{profile.recentNovelTitle}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                onEditProfile(profile.id);
              }}
            >
              {t("novel:writingFormula.landing.editSettings")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                onOpenWorkbench(profile.id);
              }}
            >
              {t("novel:writingFormula.landing.applyAndTest")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                onUseProfileForClean(profile.id);
              }}
            >
              {t("novel:writingFormula.landing.removeAi")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deletePending}
              onClick={(event) => {
                event.stopPropagation();
                onDeleteProfile(profile.id);
              }}
            >
              {deletePending ? t("novel:writingFormula.landing.deleting") : t("novel:writingFormula.landing.delete")}
            </Button>
          </div>
        </div>

        {isSelected ? (
          <div className="mt-4 space-y-4 border-t border-slate-200/80 pt-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_280px]">
              <DetailPanel
                title={t("novel:writingFormula.landing.detail.readingFeel")}
                description={t("novel:writingFormula.landing.detail.readingFeelHint")}
              >
                <div className="rounded-xl border bg-slate-50/80 p-4 text-sm leading-7 text-slate-700">
                  {profile.description}
                </div>
                {profile.detailLines.length > 0 ? (
                  <div className="grid gap-2">
                    {profile.detailLines.map((line) => (
                      <div key={`${profile.id}-${line}`} className="rounded-xl border bg-white px-3 py-3 text-sm leading-6 text-slate-700">
                        {line}
                      </div>
                    ))}
                  </div>
                ) : null}
                {profile.sourceContentPreview ? (
                  <div className="rounded-xl border bg-slate-950 px-4 py-4 text-sm leading-7 text-slate-100">
                    <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{t("novel:writingFormula.landing.detail.sourcePreview")}</div>
                    <div>{profile.sourceContentPreview}</div>
                  </div>
                ) : null}
              </DetailPanel>

              <div className="space-y-4">
                <DetailPanel
                  title={t("novel:writingFormula.landing.detail.ruleSummary")}
                  description={t("novel:writingFormula.landing.detail.ruleSummaryHint")}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <SummaryCard title={t("novel:writingFormula.landing.detail.narrativeRules")} summary={profile.narrativeSummary} />
                    <SummaryCard title={t("novel:writingFormula.landing.detail.characterRules")} summary={profile.characterSummary} />
                    <SummaryCard title={t("novel:writingFormula.landing.detail.languageRules")} summary={profile.languageSummary} />
                    <SummaryCard title={t("novel:writingFormula.landing.detail.rhythmRules")} summary={profile.rhythmSummary} />
                  </div>
                </DetailPanel>

                <DetailPanel
                  title={t("novel:writingFormula.landing.detail.antiAi")}
                  description={t("novel:writingFormula.landing.detail.antiAiHint")}
                >
                  {profile.antiAiFocus.length > 0 || profile.antiAiRuleNames.length > 0 || profile.extractionAntiAiRecommendationCount > 0 ? (
                    <div className="space-y-3">
                      {profile.antiAiFocus.length > 0 ? (
                        <div className="grid gap-2">
                          {profile.antiAiFocus.map((line) => (
                            <div key={`${profile.id}-${line}`} className="rounded-xl border bg-amber-50/80 px-3 py-3 text-sm leading-6 text-amber-900">
                              {line}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {profile.antiAiRuleNames.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.antiAiRuleNames.map((ruleName) => (
                            <Badge key={`${profile.id}-${ruleName}`} variant="secondary" className="bg-slate-100 text-slate-700">
                              {ruleName}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {profile.extractionAntiAiRecommendationCount > 0 ? (
                        <div className="rounded-xl border bg-slate-50/80 px-3 py-3 text-sm leading-6 text-slate-600">
                          {t("novel:writingFormula.landing.detail.extractionAntiAiCount", { count: profile.extractionAntiAiRecommendationCount })}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed px-3 py-3 text-sm leading-6 text-slate-500">
                      {t("novel:writingFormula.landing.detail.noAntiAi")}
                    </div>
                  )}
                </DetailPanel>
              </div>

              <div className="space-y-4">
                <DetailPanel
                  title={t("novel:writingFormula.landing.detail.assetOverview")}
                  description={t("novel:writingFormula.landing.detail.assetOverviewHint")}
                >
                  <div className="space-y-2">
                    <DetailStatRow label={t("novel:writingFormula.landing.detail.source")} value={profile.sourceTypeLabel} />
                    <DetailStatRow label={t("novel:writingFormula.landing.detail.lastUpdated")} value={profile.updatedAtLabel} />
                    <DetailStatRow label={t("novel:writingFormula.landing.detail.enabledFeatures")} value={t("novel:writingFormula.landing.detail.featureCount", { count: profile.extractedFeatureCount })} />
                    <DetailStatRow label={t("novel:writingFormula.landing.detail.highRiskFeatures")} value={t("novel:writingFormula.landing.detail.featureCount", { count: profile.highRiskFeatureCount })} />
                    <DetailStatRow
                      label={t("novel:writingFormula.landing.detail.currentPreset")}
                      value={profile.selectedPresetLabel || t("novel:writingFormula.landing.detail.noPreset")}
                    />
                    <DetailStatRow
                      label={t("novel:writingFormula.landing.detail.availablePresets")}
                      value={profile.presetLabels.length > 0 ? profile.presetLabels.join(" / ") : t("novel:writingFormula.landing.detail.none")}
                    />
                    <DetailStatRow label={t("novel:writingFormula.landing.detail.bindingCount")} value={t("novel:writingFormula.landing.detail.bindingCountValue", { count: profile.bindingCount })} />
                    <DetailStatRow
                      label={t("novel:writingFormula.landing.detail.recentNovel")}
                      value={profile.recentNovelTitle || t("novel:writingFormula.landing.detail.noNovel")}
                    />
                    <DetailStatRow
                      label={t("novel:writingFormula.landing.detail.applicableGenres")}
                      value={profile.applicableGenres.length > 0 ? profile.applicableGenres.join(" / ") : t("novel:writingFormula.landing.detail.notFilled")}
                    />
                  </div>
                </DetailPanel>

                <DetailPanel
                  title={t("novel:writingFormula.landing.detail.nextSteps")}
                  description={t("novel:writingFormula.landing.detail.nextStepsHint")}
                >
                  <div className="space-y-2 text-sm leading-6 text-slate-700">
                    <div>{t("novel:writingFormula.landing.detail.editDesc")}</div>
                    <div>{t("novel:writingFormula.landing.detail.applyDesc")}</div>
                    <div>{t("novel:writingFormula.landing.detail.removeAiDesc")}</div>
                  </div>
                </DetailPanel>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <CardContent className="space-y-5 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                {t("novel:writingFormula.landing.header.badge")}
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {t("novel:writingFormula.landing.header.title")}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-slate-600">
                  {t("novel:writingFormula.landing.header.description")}
                </p>
              </div>
            </div>

            <Button type="button" onClick={onOpenCreate}>
              {t("novel:writingFormula.landing.header.create")}
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,rgba(241,245,249,0.9),rgba(248,250,252,0.95))] px-4 py-3 text-sm leading-7 text-slate-700">
            {t("novel:writingFormula.landing.header.bookLevelHint")}
          </div>

          {profileItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-6">
              <div className="text-lg font-semibold text-slate-950">{t("novel:writingFormula.landing.empty.title")}</div>
              <div className="mt-2 text-sm leading-7 text-slate-600">
                {t("novel:writingFormula.landing.empty.hint")}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" onClick={onOpenCreate}>
                  {t("novel:writingFormula.landing.empty.cta")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {customProfiles.length > 0 ? (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">{t("novel:writingFormula.landing.sections.custom.title")}</div>
                      <div className="text-xs leading-6 text-slate-500">
                        {t("novel:writingFormula.landing.sections.custom.hint")}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {t("novel:writingFormula.landing.sections.count", { count: customProfiles.length })}
                    </Badge>
                  </div>
                  <div className="grid gap-3">
                    {customProfiles.map(renderProfileCard)}
                  </div>
                </section>
              ) : null}

              {starterProfiles.length > 0 ? (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">{t("novel:writingFormula.landing.sections.starter.title")}</div>
                      <div className="text-xs leading-6 text-slate-500">
                        {t("novel:writingFormula.landing.sections.starter.hint")}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {t("novel:writingFormula.landing.sections.count", { count: starterProfiles.length })}
                    </Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {starterProfiles.map(renderProfileCard)}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
