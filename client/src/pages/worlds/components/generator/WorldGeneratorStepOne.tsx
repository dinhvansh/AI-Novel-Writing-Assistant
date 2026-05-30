import { useTranslation } from "react-i18next";
import type { WorldOptionRefinementLevel, WorldReferenceAnchor, WorldReferenceMode } from "@ai-novel/shared/types/worldWizard";
import { Button } from "@/components/ui/button";
import KnowledgeDocumentPicker from "@/components/knowledge/KnowledgeDocumentPicker";
import type {
  GeneratorGenreOption,
  InspirationMode,
  WorldGeneratorConceptCard,
} from "./worldGeneratorShared";
import { REFERENCE_MODE_OPTIONS } from "./worldGeneratorShared";

interface WorldGeneratorStepOneProps {
  worldName: string;
  selectedGenreId: string;
  selectedGenre: GeneratorGenreOption | null;
  genreOptions: GeneratorGenreOption[];
  genreLoading: boolean;
  inspirationMode: InspirationMode;
  referenceMode: WorldReferenceMode;
  selectedKnowledgeDocumentIds: string[];
  preserveText: string;
  allowedChangesText: string;
  forbiddenText: string;
  inspirationText: string;
  optionRefinementLevel: WorldOptionRefinementLevel;
  optionsCount: number;
  canAnalyze: boolean;
  analyzeStreaming: boolean;
  analyzeButtonLabel: string;
  analyzeProgressMessage?: string;
  inspirationSourceMeta: {
    extracted: boolean;
    originalLength: number;
    chunkCount: number;
  } | null;
  concept: WorldGeneratorConceptCard | null;
  propertyOptionsCount: number;
  referenceAnchors: WorldReferenceAnchor[];
  onWorldNameChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onOpenGenreManager: () => void;
  onInspirationModeChange: (value: InspirationMode) => void;
  onKnowledgeDocumentIdsChange: (ids: string[]) => void;
  onReferenceModeChange: (value: WorldReferenceMode) => void;
  onPreserveTextChange: (value: string) => void;
  onAllowedChangesTextChange: (value: string) => void;
  onForbiddenTextChange: (value: string) => void;
  onInspirationTextChange: (value: string) => void;
  onOptionRefinementLevelChange: (value: WorldOptionRefinementLevel) => void;
  onOptionsCountChange: (value: number) => void;
  onAnalyze: () => void;
}

export default function WorldGeneratorStepOne(props: WorldGeneratorStepOneProps) {
  const { t } = useTranslation("world");
  const {
    worldName,
    selectedGenreId,
    selectedGenre,
    genreOptions,
    genreLoading,
    inspirationMode,
    referenceMode,
    selectedKnowledgeDocumentIds,
    preserveText,
    allowedChangesText,
    forbiddenText,
    inspirationText,
    optionRefinementLevel,
    optionsCount,
    canAnalyze,
    analyzeStreaming,
    analyzeButtonLabel,
    analyzeProgressMessage,
    inspirationSourceMeta,
    concept,
    propertyOptionsCount,
    referenceAnchors,
    onWorldNameChange,
    onGenreChange,
    onOpenGenreManager,
    onInspirationModeChange,
    onKnowledgeDocumentIdsChange,
    onReferenceModeChange,
    onPreserveTextChange,
    onAllowedChangesTextChange,
    onForbiddenTextChange,
    onInspirationTextChange,
    onOptionRefinementLevelChange,
    onOptionsCountChange,
    onAnalyze,
  } = props;

  const isReferenceMode = inspirationMode === "reference";

  return (
    <div className="space-y-3">
      <input
        className="w-full rounded-md border p-2 text-sm"
        placeholder={t("generator.worldNamePlaceholder")}
        value={worldName}
        onChange={(event) => onWorldNameChange(event.target.value)}
      />

      <div className="space-y-2">
        <div className="text-sm font-medium">{t("generator.worldTypeLabel")}</div>
        <select
          className="w-full rounded-md border bg-background p-2 text-sm"
          value={selectedGenreId}
          disabled={genreLoading || genreOptions.length === 0}
          onChange={(event) => onGenreChange(event.target.value)}
        >
          <option value="">{genreLoading ? t("generator.genreLoadingOption") : t("generator.genreSelectOption")}</option>
          {genreOptions.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.path}
            </option>
          ))}
        </select>
        {selectedGenre ? (
          <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-1">
            <div>{t("generator.genrePathLabel", { path: selectedGenre.path })}</div>
            {selectedGenre.description?.trim() ? <div>{t("generator.genreDescriptionLabel", { description: selectedGenre.description.trim() })}</div> : null}
            {selectedGenre.template?.trim() ? (
              <div className="whitespace-pre-wrap">{t("generator.genreTemplateLabel", { template: selectedGenre.template.trim() })}</div>
            ) : null}
          </div>
        ) : null}
        {genreLoading ? <div className="text-xs text-muted-foreground">{t("generator.genreLoadingTree")}</div> : null}
        {!genreLoading && genreOptions.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground space-y-2">
            <div>{t("generator.noGenreTitle")}</div>
            <Button type="button" variant="outline" onClick={onOpenGenreManager}>
              {t("generator.goToGenreLibrary")}
            </Button>
          </div>
        ) : null}
        <div className="text-xs text-muted-foreground">
          {t("generator.genreReuseHint")}
        </div>
        <div className="text-xs text-muted-foreground">
          {t("generator.genreOrderHint")}
        </div>
      </div>

      <select
        className="w-full rounded-md border bg-background p-2 text-sm"
        value={inspirationMode}
        onChange={(event) => onInspirationModeChange(event.target.value as InspirationMode)}
      >
        <option value="free">{t("generator.inspirationFree")}</option>
        <option value="reference">{t("generator.inspirationReference")}</option>
        <option value="random">{t("generator.inspirationRandom")}</option>
      </select>

      {isReferenceMode ? (
        <div className="space-y-3">
          <KnowledgeDocumentPicker
            selectedIds={selectedKnowledgeDocumentIds}
            onChange={(next) => onKnowledgeDocumentIdsChange(next ?? [])}
            title={t("generator.referenceDocTitle")}
            description={t("generator.referenceDocDescription")}
            queryStatus="enabled"
          />

          <div className="rounded-md border p-3 text-sm space-y-2">
            <div className="font-medium">{t("generator.referenceModeLabel")}</div>
            <select
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={referenceMode}
              onChange={(event) => onReferenceModeChange(event.target.value as WorldReferenceMode)}
            >
              {REFERENCE_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-muted-foreground">
              {REFERENCE_MODE_OPTIONS.find((item) => item.value === referenceMode)?.description}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border p-3 text-sm space-y-2">
              <div className="font-medium">{t("generator.preserveLabel")}</div>
              <textarea
                className="min-h-[120px] w-full rounded-md border p-2 text-sm"
                placeholder={t("generator.preservePlaceholder")}
                value={preserveText}
                onChange={(event) => onPreserveTextChange(event.target.value)}
              />
            </div>

            <div className="rounded-md border p-3 text-sm space-y-2">
              <div className="font-medium">{t("generator.allowedChangesLabel")}</div>
              <textarea
                className="min-h-[120px] w-full rounded-md border p-2 text-sm"
                placeholder={t("generator.allowedChangesPlaceholder")}
                value={allowedChangesText}
                onChange={(event) => onAllowedChangesTextChange(event.target.value)}
              />
            </div>

            <div className="rounded-md border p-3 text-sm space-y-2">
              <div className="font-medium">{t("generator.forbiddenLabel")}</div>
              <textarea
                className="min-h-[120px] w-full rounded-md border p-2 text-sm"
                placeholder={t("generator.forbiddenPlaceholder")}
                value={forbiddenText}
                onChange={(event) => onForbiddenTextChange(event.target.value)}
              />
            </div>
          </div>
        </div>
      ) : null}

      <textarea
        className="min-h-[180px] w-full rounded-md border p-2 text-sm"
        placeholder={
          isReferenceMode
            ? t("generator.inspirationPlaceholderReference")
            : t("generator.inspirationPlaceholderFree")
        }
        value={inspirationText}
        onChange={(event) => onInspirationTextChange(event.target.value)}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-md border p-3 text-sm space-y-2">
          <div className="font-medium">{t("generator.refinementLevelLabel")}</div>
          <select
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={optionRefinementLevel}
            onChange={(event) => onOptionRefinementLevelChange(event.target.value as WorldOptionRefinementLevel)}
          >
            <option value="basic">{t("generator.refinementBasic")}</option>
            <option value="standard">{t("generator.refinementStandard")}</option>
            <option value="detailed">{t("generator.refinementDetailed")}</option>
          </select>
        </div>

        <div className="rounded-md border p-3 text-sm space-y-2">
          <div className="font-medium">{t("generator.optionsCountLabel")}</div>
          <input
            className="w-full rounded-md border p-2 text-sm"
            type="number"
            min={4}
            max={8}
            value={optionsCount}
            onChange={(event) => onOptionsCountChange(Number(event.target.value) || 6)}
          />
          <div className="text-xs text-muted-foreground">
            {t("generator.optionsCountHint")}
          </div>
        </div>
      </div>

      <Button onClick={onAnalyze} disabled={!canAnalyze}>
        {analyzeButtonLabel}
      </Button>

      {analyzeStreaming ? (
        <div className="rounded-md border p-3 text-sm space-y-1">
          <div className="font-medium">{t("generator.progressTitle")}</div>
          <div>{analyzeProgressMessage ?? t("generator.progressStarting")}</div>
          <div className="text-xs text-muted-foreground">
            {isReferenceMode
              ? t("generator.progressHintReference")
              : t("generator.progressHintFree")}
          </div>
        </div>
      ) : null}

      {inspirationSourceMeta?.extracted ? (
        <div className="text-xs text-muted-foreground">
          {t("generator.extractedMeta", {
            originalLength: inspirationSourceMeta.originalLength,
            chunkCount: inspirationSourceMeta.chunkCount,
          })}
        </div>
      ) : null}

      {concept ? (
        <div className="rounded-md border p-3 text-sm space-y-2">
          <div className="font-medium">{isReferenceMode ? t("generator.referenceAnalysisTitle") : t("generator.conceptCardTitle")}</div>
          <div>{t("generator.conceptTypeLabel", { worldType: concept.worldType })}</div>
          <div>{t("generator.conceptToneLabel", { tone: concept.tone })}</div>
          <div>{t("generator.conceptKeywordsLabel", { keywords: concept.keywords.join(" / ") || "-" })}</div>
          <div>{t("generator.conceptPropertyOptionsLabel", { count: propertyOptionsCount })}</div>
          {isReferenceMode && referenceAnchors.length > 0 ? (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">{t("generator.referenceAnchorsTitle")}</div>
              {referenceAnchors.map((anchor) => (
                <div key={anchor.id} className="text-xs text-muted-foreground">
                  {t("generator.referenceAnchorItem", { label: anchor.label, content: anchor.content })}
                </div>
              ))}
            </div>
          ) : null}
          <div className="whitespace-pre-wrap">{concept.summary}</div>
        </div>
      ) : null}
    </div>
  );
}
