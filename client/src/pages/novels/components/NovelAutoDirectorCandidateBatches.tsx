import type { TitleFactorySuggestion } from "@ai-novel/shared/types/title";
import {
  type DirectorCandidate,
  type DirectorCandidateBatch,
  type DirectorCorrectionPreset,
  DIRECTOR_CORRECTION_PRESETS,
} from "@ai-novel/shared/types/novelDirector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

// i18n-ignore: key constants for correction presets
const DIRECTOR_CORRECTION_PRESET_KEYS: Record<string, { label: string; description: string; promptHint: string }> = {
  more_hooky: {
    label: "correctionPresets.more_hooky.label",
    description: "correctionPresets.more_hooky.description",
    promptHint: "correctionPresets.more_hooky.promptHint",
  },
  stronger_conflict: {
    label: "correctionPresets.stronger_conflict.label",
    description: "correctionPresets.stronger_conflict.description",
    promptHint: "correctionPresets.stronger_conflict.promptHint",
  },
  sharper_protagonist: {
    label: "correctionPresets.sharper_protagonist.label",
    description: "correctionPresets.sharper_protagonist.description",
    promptHint: "correctionPresets.sharper_protagonist.promptHint",
  },
  more_grounded: {
    label: "correctionPresets.more_grounded.label",
    description: "correctionPresets.more_grounded.description",
    promptHint: "correctionPresets.more_grounded.promptHint",
  },
  lighter_ending: {
    label: "correctionPresets.lighter_ending.label",
    description: "correctionPresets.lighter_ending.description",
    promptHint: "correctionPresets.lighter_ending.promptHint",
  },
};

function useDirectorCorrectionPresets(t: (key: string) => string) {
  return DIRECTOR_CORRECTION_PRESETS.map((preset) => ({
    value: preset.value,
    label: t(DIRECTOR_CORRECTION_PRESET_KEYS[preset.value]?.label ?? preset.value),
    description: t(DIRECTOR_CORRECTION_PRESET_KEYS[preset.value]?.description ?? ""),
    promptHint: t(DIRECTOR_CORRECTION_PRESET_KEYS[preset.value]?.promptHint ?? ""),
  }));
}

interface NovelAutoDirectorCandidateBatchesProps {
  batches: DirectorCandidateBatch[];
  selectedPresets: DirectorCorrectionPreset[];
  feedback: string;
  onFeedbackChange: (value: string) => void;
  onTogglePreset: (preset: DirectorCorrectionPreset) => void;
  candidatePatchFeedbacks: Record<string, string>;
  onCandidatePatchFeedbackChange: (candidateId: string, value: string) => void;
  titlePatchFeedbacks: Record<string, string>;
  onTitlePatchFeedbackChange: (candidateId: string, value: string) => void;
  isGenerating: boolean;
  isPatchingCandidate: boolean;
  isRefiningTitle: boolean;
  isConfirming: boolean;
  onApplyCandidateTitleOption: (batchId: string, candidateId: string, option: TitleFactorySuggestion) => void;
  onPatchCandidate: (batchId: string, candidate: DirectorCandidate, feedback: string) => void;
  onRefineTitle: (batchId: string, candidate: DirectorCandidate, feedback: string) => void;
  onConfirmCandidate: (candidate: DirectorCandidate) => void | Promise<void>;
  onGenerateNext: () => void;
}

function buildFallbackTitleOption(candidate: DirectorCandidate, t: TFunction): TitleFactorySuggestion {
  return {
    title: candidate.workingTitle,
    clickRate: 60,
    style: "high_concept",
    angle: t("autoDirector:candidateBatches.titleOption.fallbackAngle"),
    reason: t("autoDirector:candidateBatches.titleOption.fallbackReason"),
  };
}

function resolveCandidateTitleOptions(candidate: DirectorCandidate, t: TFunction): TitleFactorySuggestion[] {
  if (Array.isArray(candidate.titleOptions) && candidate.titleOptions.length > 0) {
    return candidate.titleOptions;
  }
  return [buildFallbackTitleOption(candidate, t)];
}

function renderCandidateDetails(candidate: DirectorCandidate, t: TFunction) {
  return [
    { label: t("autoDirector:candidateBatches.details.positioning"), value: candidate.positioning },
    { label: t("autoDirector:candidateBatches.details.sellingPoint"), value: candidate.sellingPoint },
    { label: t("autoDirector:candidateBatches.details.coreConflict"), value: candidate.coreConflict },
    { label: t("autoDirector:candidateBatches.details.protagonistPath"), value: candidate.protagonistPath },
    { label: t("autoDirector:candidateBatches.details.hookStrategy"), value: candidate.hookStrategy },
    { label: t("autoDirector:candidateBatches.details.progressionLoop"), value: candidate.progressionLoop },
    { label: t("autoDirector:candidateBatches.details.endingDirection"), value: candidate.endingDirection },
    {
      label: t("autoDirector:candidateBatches.details.targetChapterCount"),
      value: t("autoDirector:candidateBatches.details.chapterCountValue", { count: candidate.targetChapterCount }),
    },
  ];
}

export default function NovelAutoDirectorCandidateBatches(props: NovelAutoDirectorCandidateBatchesProps) {
  const {
    batches,
    selectedPresets,
    feedback,
    onFeedbackChange,
    onTogglePreset,
    candidatePatchFeedbacks,
    onCandidatePatchFeedbackChange,
    titlePatchFeedbacks,
    onTitlePatchFeedbackChange,
    isGenerating,
    isPatchingCandidate,
    isRefiningTitle,
    isConfirming,
    onApplyCandidateTitleOption,
    onPatchCandidate,
    onRefineTitle,
    onConfirmCandidate,
    onGenerateNext,
  } = props;

  const { t } = useTranslation("autoDirector");
  const correctionPresets = useDirectorCorrectionPresets(t);

  if (batches.length === 0) {
    return (
      <div className={`rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground sm:p-8 ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
        {t("autoDirector:candidateBatches.emptyHint")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {batches.map((batch) => (
        <section key={batch.id} className="min-w-0 overflow-hidden rounded-xl border p-3 sm:p-4">
          <div className="flex flex-col gap-2 border-b pb-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="break-words text-base font-semibold text-foreground [overflow-wrap:anywhere]">{batch.roundLabel}</div>
              <div className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                {batch.refinementSummary?.trim() || t("autoDirector:candidateBatches.initialRound")}
              </div>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
              {batch.presets.map((preset) => {
                const meta = correctionPresets.find((item) => item.value === preset);
                return meta ? <Badge key={preset} variant="outline">{meta.label}</Badge> : null;
              })}
            </div>
          </div>

          <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-2">
            {batch.candidates.map((candidate) => {
              const titleOptions = resolveCandidateTitleOptions(candidate, t);
              return (
                <article key={candidate.id} className="min-w-0 overflow-hidden rounded-xl border bg-background p-3 shadow-sm sm:p-4">
                  <div className="space-y-2">
                    <div className="break-words text-lg font-semibold text-foreground [overflow-wrap:anywhere]">{candidate.workingTitle}</div>
                    <div className="break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">{candidate.logline}</div>
                    <div className="rounded-md border bg-muted/20 p-3">
                      <div className="text-sm font-medium text-foreground">{t("autoDirector:candidateBatches.titlePack.sectionTitle")}</div>
                      <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                        {titleOptions.map((option) => {
                          const active = option.title === candidate.workingTitle;
                          return (
                            <button
                              key={`${candidate.id}-${option.title}`}
                              type="button"
                              className={`max-w-full rounded-full border px-3 py-1.5 text-left text-xs transition ${
                                active
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background text-foreground hover:border-primary/40"
                              }`}
                              onClick={() => onApplyCandidateTitleOption(batch.id, candidate.id, option)}
                            >
                              <span className={`font-medium ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{option.title}</span>
                              <span className="ml-2 text-muted-foreground">
                                {t("autoDirector:candidateBatches.titlePack.clickRateLabel", { rate: option.clickRate })}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className={`mt-2 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                        {titleOptions[0]?.reason?.trim() || t("autoDirector:candidateBatches.titlePack.fallbackReason")}
                      </div>
                      <div className="mt-3 border-t pt-3">
                        <div className="text-xs font-medium text-foreground">{t("autoDirector:candidateBatches.titlePatch.sectionTitle")}</div>
                        <div className={`mt-1 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                          {t("autoDirector:candidateBatches.titlePatch.hint")}
                        </div>
                        <Input
                          className="mt-2"
                          value={titlePatchFeedbacks[candidate.id] ?? ""}
                          onChange={(event) => onTitlePatchFeedbackChange(candidate.id, event.target.value)}
                          placeholder={t("autoDirector:candidateBatches.titlePatch.placeholder")}
                        />
                        <div className={AUTO_DIRECTOR_MOBILE_CLASSES.actionRow}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction}
                            disabled={isRefiningTitle || !titlePatchFeedbacks[candidate.id]?.trim()}
                            onClick={() => onRefineTitle(batch.id, candidate, titlePatchFeedbacks[candidate.id] ?? "")}
                          >
                            {isRefiningTitle ? t("autoDirector:candidateBatches.titlePatch.refining") : t("autoDirector:candidateBatches.titlePatch.refineButton")}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-md bg-muted/30 p-3 text-sm leading-6 text-foreground">
                      <div className="font-medium">{t("autoDirector:candidateBatches.whyItFits.title")}</div>
                      <div className="mt-1 break-words text-muted-foreground [overflow-wrap:anywhere]">{candidate.whyItFits}</div>
                    </div>
                    <div className="grid gap-2 text-sm">
                      {renderCandidateDetails(candidate, t).map((item) => (
                        <div key={item.label} className={AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}>
                          <span className="font-medium text-foreground">{item.label}：</span>
                          <span className="text-muted-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-2">
                      {candidate.toneKeywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary">{keyword}</Badge>
                      ))}
                    </div>
                    <div className="rounded-md border border-dashed p-3">
                      <div className="text-sm font-medium text-foreground">{t("autoDirector:candidateBatches.candidatePatch.sectionTitle")}</div>
                      <div className={`mt-1 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                        {t("autoDirector:candidateBatches.candidatePatch.hint")}
                      </div>
                      <Input
                        className="mt-3"
                        value={candidatePatchFeedbacks[candidate.id] ?? ""}
                        onChange={(event) => onCandidatePatchFeedbackChange(candidate.id, event.target.value)}
                        placeholder={t("autoDirector:candidateBatches.candidatePatch.placeholder")}
                      />
                      <div className={AUTO_DIRECTOR_MOBILE_CLASSES.actionRow}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction}
                          disabled={isPatchingCandidate || !candidatePatchFeedbacks[candidate.id]?.trim()}
                          onClick={() => onPatchCandidate(batch.id, candidate, candidatePatchFeedbacks[candidate.id] ?? "")}
                        >
                          {isPatchingCandidate ? t("autoDirector:candidateBatches.candidatePatch.patching") : t("autoDirector:candidateBatches.candidatePatch.patchButton")}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className={AUTO_DIRECTOR_MOBILE_CLASSES.actionRow}>
                    <Button
                      type="button"
                      className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction}
                      onClick={() => void onConfirmCandidate(candidate)}
                      disabled={isConfirming}
                    >
                      {isConfirming ? t("autoDirector:candidateBatches.confirm.confirming") : t("autoDirector:candidateBatches.confirm.confirmButton")}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <section className="min-w-0 rounded-xl border border-dashed p-3 sm:p-4">
        <div className="break-words text-base font-semibold text-foreground [overflow-wrap:anywhere]">
          {t("autoDirector:candidateBatches.refineNext.title")}
        </div>
        <div className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
          {t("autoDirector:candidateBatches.refineNext.description")}
        </div>

        <div className="mt-4 flex min-w-0 flex-wrap gap-2">
          {correctionPresets.map((preset) => {
            const active = selectedPresets.includes(preset.value);
            return (
              <button
                key={preset.value}
                type="button"
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/40"
                }`}
                onClick={() => onTogglePreset(preset.value)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          <label htmlFor="director-refine-feedback" className="text-sm font-medium text-foreground">
            {t("autoDirector:candidateBatches.refineNext.feedbackLabel")}
          </label>
          <Input
            id="director-refine-feedback"
            value={feedback}
            onChange={(event) => onFeedbackChange(event.target.value)}
            placeholder={t("autoDirector:candidateBatches.refineNext.feedbackPlaceholder")}
          />
        </div>

        <div className={AUTO_DIRECTOR_MOBILE_CLASSES.actionRow}>
          <Button
            type="button"
            variant="outline"
            className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction}
            onClick={onGenerateNext}
            disabled={isGenerating}
          >
            {isGenerating ? t("autoDirector:candidateBatches.refineNext.generating") : t("autoDirector:candidateBatches.refineNext.generateButton")}
          </Button>
        </div>
      </section>
    </div>
  );
}
