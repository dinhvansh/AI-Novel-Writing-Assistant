import type { DirectorIdeaInspiration, DirectorRunMode } from "@ai-novel/shared/types/novelDirector";
import type {
  DirectorAutoApprovalGroup,
  DirectorAutoApprovalPoint,
} from "@ai-novel/shared/types/autoDirectorApproval";
import type { StyleIntentSummary } from "@ai-novel/shared/types/styleEngine";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import LLMSelector from "@/components/common/LLMSelector";
import AutoDirectorApprovalStrategyPanel from "@/components/autoDirector/AutoDirectorApprovalStrategyPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { NovelBasicFormState } from "../novelBasicInfo.shared";
import {
  BASIC_INFO_FIELD_HINTS,
  DEFAULT_ESTIMATED_CHAPTER_COUNT,
  EMOTION_OPTIONS,
  PACE_OPTIONS,
  POV_OPTIONS,
  READER_CHANNEL_OPTIONS,
} from "../novelBasicInfo.shared";

const POV_KEY_MAP: Record<NovelBasicFormState["narrativePov"], string> = {
  third_person: "thirdPerson",
  first_person: "firstPerson",
  mixed: "mixed",
};
const PACE_KEY_MAP: Record<NovelBasicFormState["pacePreference"], string> = {
  balanced: "balanced",
  slow: "slow",
  fast: "fast",
};
const EMOTION_KEY_MAP: Record<NovelBasicFormState["emotionIntensity"], string> = {
  medium: "medium",
  low: "low",
  high: "high",
};
import {
  type DirectorAutoExecutionDraftState,
  DirectorAutoExecutionPlanFields,
} from "./directorAutoExecutionPlan.shared";
import NovelAutoDirectorIdeaInspirationPanel from "./NovelAutoDirectorIdeaInspirationPanel";
import { BookFramingQuickFillButton } from "./basicInfoForm/BookFramingQuickFillButton";
import { BookFramingSection } from "./basicInfoForm/BookFramingSection";
import {
  FieldLabel,
  findOptionSummary,
} from "./basicInfoForm/BasicInfoFormPrimitives";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";

interface RunModeOption {
  value: DirectorRunMode;
  label: string;
  description: string;
}

interface GenreOption {
  id: string;
  path: string;
  label: string;
}

interface WorldOption {
  id: string;
  name: string;
}

interface NovelAutoDirectorSetupPanelProps {
  basicForm: NovelBasicFormState;
  genreOptions: GenreOption[];
  worldOptions: WorldOption[];
  idea: string;
  onIdeaChange: (value: string) => void;
  ideaInspirations: DirectorIdeaInspiration[];
  isGeneratingIdeaInspirations: boolean;
  onGenerateIdeaInspirations: () => void;
  runMode: DirectorRunMode;
  runModeOptions: RunModeOption[];
  onRunModeChange: (value: DirectorRunMode) => void;
  autoExecutionDraft: DirectorAutoExecutionDraftState;
  onAutoExecutionDraftChange: (patch: Partial<DirectorAutoExecutionDraftState>) => void;
  maxChapterCount?: number | null;
  autoApprovalEnabled: boolean;
  autoApprovalCodes: string[];
  autoApprovalGroups?: DirectorAutoApprovalGroup[];
  autoApprovalPoints?: DirectorAutoApprovalPoint[];
  onAutoApprovalEnabledChange: (enabled: boolean) => void;
  onAutoApprovalCodesChange: (next: string[]) => void;
  styleProfileOptions: Array<{ id: string; name: string }>;
  selectedStyleProfileId: string;
  selectedStyleSummary: StyleIntentSummary | null;
  onStyleProfileChange: (value: string) => void;
  onBasicFormChange?: (patch: Partial<NovelBasicFormState>) => void;
  canGenerate: boolean;
  isGenerating: boolean;
  batchCount: number;
  onGenerate: () => void;
  onReviewCandidates?: () => void;
}

export default function NovelAutoDirectorSetupPanel(props: NovelAutoDirectorSetupPanelProps) {
  const {
    basicForm,
    genreOptions,
    worldOptions,
    idea,
    onIdeaChange,
    ideaInspirations,
    isGeneratingIdeaInspirations,
    onGenerateIdeaInspirations,
    runMode,
    runModeOptions,
    onRunModeChange,
    autoExecutionDraft,
    onAutoExecutionDraftChange,
    maxChapterCount,
    autoApprovalEnabled,
    autoApprovalCodes,
    autoApprovalGroups,
    autoApprovalPoints,
    onAutoApprovalEnabledChange,
    onAutoApprovalCodesChange,
    styleProfileOptions,
    selectedStyleProfileId,
    selectedStyleSummary,
    onStyleProfileChange,
    onBasicFormChange,
    canGenerate,
    isGenerating,
    batchCount,
    onGenerate,
    onReviewCandidates,
  } = props;

  const hasEditableBasicForm = typeof onBasicFormChange === "function";
  const { t } = useTranslation();
  const useIdeaInspiration = (text: string) => {
    if (idea.trim()) {
      const confirmed = window.confirm(t("autoDirector:setup.ideaOverwriteConfirm"));
      if (!confirmed) {
        return;
      }
    }
    onIdeaChange(text);
  };

  const povOptions = useMemo(() => POV_OPTIONS.map((option) => ({
    ...option,
    label: t(`autoDirector:setup.options.pov.${POV_KEY_MAP[option.value]}.label`),
    summary: t(`autoDirector:setup.options.pov.${POV_KEY_MAP[option.value]}.summary`),
  })), [t]);
  const paceOptions = useMemo(() => PACE_OPTIONS.map((option) => ({
    ...option,
    label: t(`autoDirector:setup.options.pace.${PACE_KEY_MAP[option.value]}.label`),
    summary: t(`autoDirector:setup.options.pace.${PACE_KEY_MAP[option.value]}.summary`),
  })), [t]);
  const emotionOptions = useMemo(() => EMOTION_OPTIONS.map((option) => ({
    ...option,
    label: t(`autoDirector:setup.options.emotion.${EMOTION_KEY_MAP[option.value]}.label`),
    summary: t(`autoDirector:setup.options.emotion.${EMOTION_KEY_MAP[option.value]}.summary`),
  })), [t]);

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border bg-background/80 p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-medium text-foreground">{t("autoDirector:setup.ideaTitle")}</div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onGenerateIdeaInspirations}
          disabled={isGeneratingIdeaInspirations}
        >
          {isGeneratingIdeaInspirations ? t("autoDirector:setup.ideaGenerating") : t("autoDirector:setup.ideaNoIdea")}
        </Button>
      </div>
      <textarea
        className="mt-2 min-h-[128px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        value={idea}
        onChange={(event) => onIdeaChange(event.target.value)}
        placeholder={t("autoDirector:setup.ideaPlaceholder")}
      />
      {(ideaInspirations.length > 0 || isGeneratingIdeaInspirations) ? (
        <NovelAutoDirectorIdeaInspirationPanel
          ideas={ideaInspirations}
          isGenerating={isGeneratingIdeaInspirations}
          onGenerate={onGenerateIdeaInspirations}
          onUseIdea={useIdeaInspiration}
        />
      ) : null}

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="min-w-0 space-y-4">
          {hasEditableBasicForm ? (
            <section className="min-w-0 rounded-xl border bg-muted/20 p-3 sm:p-4">
              <div className="text-sm font-medium text-foreground">{t("autoDirector:setup.starterTitle")}</div>
              <div className={`mt-1 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                {t("autoDirector:setup.starterDescription")}
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="director-basic-reader-channel" hint={BASIC_INFO_FIELD_HINTS.readerChannelPreference}>{t("autoDirector:setup.fields.readerChannelPreference")}</FieldLabel>
                  <select
                    id="director-basic-reader-channel"
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={basicForm.readerChannelPreference}
                    onChange={(event) => onBasicFormChange({
                      readerChannelPreference: event.target.value as NovelBasicFormState["readerChannelPreference"],
                    })}
                  >
                    {READER_CHANNEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className={"text-xs text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}"}>{findOptionSummary(READER_CHANNEL_OPTIONS, basicForm.readerChannelPreference)}</div>
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="director-basic-pov" hint={BASIC_INFO_FIELD_HINTS.narrativePov}>{t("autoDirector:setup.fields.narrativePov")}</FieldLabel>
                  <select
                    id="director-basic-pov"
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={basicForm.narrativePov}
                    onChange={(event) => onBasicFormChange({
                      narrativePov: event.target.value as NovelBasicFormState["narrativePov"],
                    })}
                  >
                    {povOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className={`text-xs text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{findOptionSummary(povOptions, basicForm.narrativePov)}</div>
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="director-basic-pace" hint={BASIC_INFO_FIELD_HINTS.pacePreference}>{t("autoDirector:setup.fields.pacePreference")}</FieldLabel>
                  <select
                    id="director-basic-pace"
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={basicForm.pacePreference}
                    onChange={(event) => onBasicFormChange({
                      pacePreference: event.target.value as NovelBasicFormState["pacePreference"],
                    })}
                  >
                    {paceOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className={`text-xs text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{findOptionSummary(paceOptions, basicForm.pacePreference)}</div>
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="director-basic-emotion" hint={BASIC_INFO_FIELD_HINTS.emotionIntensity}>{t("autoDirector:setup.fields.emotionIntensity")}</FieldLabel>
                  <select
                    id="director-basic-emotion"
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={basicForm.emotionIntensity}
                    onChange={(event) => onBasicFormChange({
                      emotionIntensity: event.target.value as NovelBasicFormState["emotionIntensity"],
                    })}
                  >
                    {emotionOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className={`text-xs text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{findOptionSummary(emotionOptions, basicForm.emotionIntensity)}</div>
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="director-basic-estimated" hint={BASIC_INFO_FIELD_HINTS.estimatedChapterCount}>{t("autoDirector:setup.fields.estimatedChapterCount")}</FieldLabel>
                  <Input
                    id="director-basic-estimated"
                    type="number"
                    min={1}
                    max={2000}
                    value={basicForm.estimatedChapterCount}
                    onChange={(event) => onBasicFormChange({
                      estimatedChapterCount: Math.max(
                        1,
                        Math.min(2000, Number(event.target.value || 0) || DEFAULT_ESTIMATED_CHAPTER_COUNT),
                      ),
                    })}
                  />
                  <div className={`text-xs text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                    {t("autoDirector:setup.fields.estimatedChapterHint")}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <FieldLabel htmlFor="director-basic-world" hint={BASIC_INFO_FIELD_HINTS.worldId}>{t("autoDirector:setup.fields.boundWorld")}</FieldLabel>
                  <select
                    id="director-basic-world"
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={basicForm.worldId}
                    onChange={(event) => onBasicFormChange({ worldId: event.target.value })}
                  >
                    <option value="">{t("autoDirector:setup.fields.noBoundWorld")}</option>
                    {worldOptions.length === 0 ? (
                      <option value="" disabled>{t("autoDirector:setup.fields.noWorldOptions")}</option>
                    ) : null}
                    {worldOptions.map((world) => (
                      <option key={world.id} value={world.id}>{world.name}</option>
                    ))}
                  </select>
                  <div className={`text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                    {worldOptions.length > 0
                      ? t("autoDirector:setup.fields.boundWorldHint")
                      : t("autoDirector:setup.fields.noWorldHint")}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <FieldLabel htmlFor="director-basic-style-profile" hint={t("autoDirector:setup.fields.styleProfileHintLabel")}>
                    {t("autoDirector:setup.fields.styleProfile")}
                  </FieldLabel>
                  <select
                    id="director-basic-style-profile"
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={selectedStyleProfileId}
                    onChange={(event) => onStyleProfileChange(event.target.value)}
                  >
                    <option value="">{t("autoDirector:setup.fields.styleProfileNone")}</option>
                    {styleProfileOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                  <div className={`text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                    {selectedStyleSummary?.stageSummaryLines[0] ?? t("autoDirector:setup.fields.styleProfileEmptyHint")}
                  </div>
                  {selectedStyleSummary?.stageSummaryLines.length ? (
                    <div className={`rounded-xl border bg-muted/15 p-3 text-xs leading-6 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                      {t("autoDirector:setup.fields.styleProfileSummary", { summary: selectedStyleSummary.stageSummaryLines.join("；") })}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {hasEditableBasicForm ? (
            <BookFramingSection
              basicForm={basicForm}
              onFormChange={onBasicFormChange}
              quickFill={(
                <BookFramingQuickFillButton
                  basicForm={basicForm}
                  genreOptions={genreOptions}
                  descriptionOverride={idea}
                  onApplySuggestion={onBasicFormChange}
                />
              )}
            />
          ) : null}
        </div>

        <div className="min-w-0 space-y-4">
          <section className="min-w-0 rounded-xl border bg-background/70 p-3 sm:p-4">
            <div className="text-sm font-medium text-foreground">{t("autoDirector:setup.modelSettings")}</div>
            <div className="mt-3">
              <LLMSelector />
            </div>
          </section>

          <section className="min-w-0 rounded-xl border bg-background/70 p-3 sm:p-4">
            <div className="text-sm font-medium text-foreground">{t("autoDirector:setup.runMode.title")}</div>
            {hasEditableBasicForm ? (
              <div className="mt-3 rounded-lg border bg-muted/15 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">{t("autoDirector:setup.runMode.postGenerationReviewLabel")}</div>
                  <div className={`text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                    {t("autoDirector:setup.runMode.postGenerationReviewHint")}
                  </div>
                </div>
                <Switch
                  aria-label={t("autoDirector:setup.runMode.postGenerationReviewAria")}
                  checked={basicForm.postGenerationStyleReviewEnabled}
                  onCheckedChange={(checked) => onBasicFormChange({ postGenerationStyleReviewEnabled: checked })}
                />
              </div>
            </div>
            ) : null}
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              {runModeOptions.map((option) => {
                const active = option.value === runMode;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                    onClick={() => onRunModeChange(option.value)}
                  >
                    <div className="text-sm font-medium text-foreground">{option.label}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</div>
                  </button>
                );
              })}
            </div>
            {runMode === "auto_to_execution" ? (
              <>
                <DirectorAutoExecutionPlanFields
                  draft={autoExecutionDraft}
                  onChange={onAutoExecutionDraftChange}
                  usage="new_book"
                  maxChapterCount={maxChapterCount}
                />
                <AutoDirectorApprovalStrategyPanel
                  enabled={autoApprovalEnabled}
                  approvalPointCodes={autoApprovalCodes}
                  groups={autoApprovalGroups}
                  approvalPoints={autoApprovalPoints}
                  onEnabledChange={onAutoApprovalEnabledChange}
                  onApprovalPointCodesChange={onAutoApprovalCodesChange}
                />
              </>
            ) : null}
            {runMode === "full_book_autopilot" ? (
              <div className={`mt-3 rounded-md border border-primary/15 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                <div className="text-sm font-medium text-foreground">{t("autoDirector:setup.runMode.fullBookTitle")}</div>
                <div className="mt-1">
                  {t("autoDirector:setup.runMode.fullBookHint")}
                </div>
              </div>
            ) : null}
          </section>

          <div className={AUTO_DIRECTOR_MOBILE_CLASSES.actionRow}>
            {batchCount > 0 && onReviewCandidates ? (
              <Button
                type="button"
                variant="outline"
                className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction}
                onClick={onReviewCandidates}
              >
                {t("autoDirector:setup.actions.viewExisting")}
              </Button>
            ) : null}
            <Button type="button" className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction} onClick={onGenerate} disabled={!canGenerate}>
              {isGenerating
                ? t("autoDirector:setup.actions.generating")
                : batchCount === 0
                  ? t("autoDirector:setup.actions.generateFirstBatch")
                  : t("autoDirector:setup.actions.regenerateBatch")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
