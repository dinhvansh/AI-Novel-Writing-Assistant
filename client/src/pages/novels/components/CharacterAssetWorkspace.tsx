import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type {
  Character,
  CharacterGender,
  CharacterTimeline,
  CharacterVisibleProfileBatchResult,
  CharacterVisibleProfileField,
  CharacterVisibleProfileSuggestion,
} from "@ai-novel/shared/types/novel";
import type { CharacterResourceLedgerItem } from "@ai-novel/shared/types/characterResource";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CharacterAssetSidebar from "./CharacterAssetSidebar";
import CharacterFocusSummary from "./CharacterFocusSummary";
import { isProtagonistCharacter } from "./characterAssetWorkspace.helpers";
import { getLastAppearanceChapter } from "./characterPanel.utils";

interface CharacterFormState {
  name: string;
  role: string;
  gender: CharacterGender;
  personality: string;
  background: string;
  development: string;
  appearance: string;
  physique: string;
  attireStyle: string;
  signatureDetail: string;
  voiceTexture: string;
  presenceImpression: string;
  currentState: string;
  currentGoal: string;
}

interface CharacterAssetWorkspaceProps {
  characters: Character[];
  selectedCharacterId: string;
  onSelectedCharacterChange: (id: string) => void;
  onDeleteCharacter: (characterId: string) => void;
  isDeletingCharacter: boolean;
  deletingCharacterId: string;
  selectedCharacter?: Character;
  characterForm: CharacterFormState;
  onCharacterFormChange: (field: keyof CharacterFormState, value: string) => void;
  onSaveCharacter: () => void;
  isSavingCharacter: boolean;
  timelineEvents: CharacterTimeline[];
  onSyncTimeline: () => void;
  isSyncingTimeline: boolean;
  onSyncAllTimeline: () => void;
  isSyncingAllTimeline: boolean;
  onWorldCheck: () => void;
  isCheckingWorld: boolean;
  onGenerateVisibleProfile: (userGuidance?: string) => void;
  isGeneratingVisibleProfile: boolean;
  visibleProfileSuggestion?: CharacterVisibleProfileSuggestion | null;
  onApplyVisibleProfile: () => void;
  isApplyingVisibleProfile: boolean;
  onGenerateBatchVisibleProfiles: (userGuidance?: string) => void;
  isGeneratingBatchVisibleProfiles: boolean;
  batchVisibleProfileResult?: CharacterVisibleProfileBatchResult | null;
  onApplyBatchVisibleProfiles: () => void;
  isApplyingBatchVisibleProfiles: boolean;
  characterResources?: CharacterResourceLedgerItem[];
  pendingCharacterResourceCount?: number;
  onBackfillCharacterResources?: () => void;
  isBackfillingCharacterResources?: boolean;
}

const VISIBLE_PROFILE_FIELDS = (t: TFunction): Array<{ key: CharacterVisibleProfileField; label: string; placeholder: string }> => [
  { key: "appearance", label: t("novel:character.workspace.visibleProfile.fields.appearance.label"), placeholder: t("novel:character.workspace.visibleProfile.fields.appearance.placeholder") },
  { key: "physique", label: t("novel:character.workspace.visibleProfile.fields.physique.label"), placeholder: t("novel:character.workspace.visibleProfile.fields.physique.placeholder") },
  { key: "attireStyle", label: t("novel:character.workspace.visibleProfile.fields.attireStyle.label"), placeholder: t("novel:character.workspace.visibleProfile.fields.attireStyle.placeholder") },
  { key: "signatureDetail", label: t("novel:character.workspace.visibleProfile.fields.signatureDetail.label"), placeholder: t("novel:character.workspace.visibleProfile.fields.signatureDetail.placeholder") },
  { key: "voiceTexture", label: t("novel:character.workspace.visibleProfile.fields.voiceTexture.label"), placeholder: t("novel:character.workspace.visibleProfile.fields.voiceTexture.placeholder") },
  { key: "presenceImpression", label: t("novel:character.workspace.visibleProfile.fields.presenceImpression.label"), placeholder: t("novel:character.workspace.visibleProfile.fields.presenceImpression.placeholder") },
];

function getSecretStatus(selectedCharacter: Character | undefined, t: TFunction): string {
  if (!selectedCharacter) return t("novel:character.workspace.status.none");
  if (selectedCharacter.secret?.trim()) return t("novel:character.workspace.status.hasSecret");
  const runtimeSignal = `${selectedCharacter.currentState ?? ""} ${selectedCharacter.currentGoal ?? ""}`;
  // i18n-ignore: regex matches against AI-generated content in Chinese
  return /秘密|隐瞒|卧底|伪装/.test(runtimeSignal) ? t("novel:character.workspace.status.hiddenInfo") : t("novel:character.workspace.status.noSecret");
}

function getEmotionSignal(selectedCharacter: Character | undefined, t: TFunction): string {
  const runtimeSignal = `${selectedCharacter?.currentState ?? ""} ${selectedCharacter?.currentGoal ?? ""}`;
  // i18n-ignore: regex matches against AI-generated content in Chinese
  if (/愤|怒|焦虑|崩溃|绝望/.test(runtimeSignal)) return t("novel:character.workspace.emotion.highStress");
  if (/平静|稳|冷静|从容/.test(runtimeSignal)) return t("novel:character.workspace.emotion.stable");
  return t("novel:character.workspace.emotion.observe");
}

function getResourceDisplayMode(character: Character | undefined, t: TFunction): {
  label: string;
  helper: string;
  limit: number;
  shouldShowResource: (item: CharacterResourceLedgerItem) => boolean;
} {
  const roleText = `${character?.role ?? ""} ${character?.castRole ?? ""}`;
  if (isProtagonistCharacter(character)) {
    return {
      label: t("novel:character.workspace.resource.protagonistLabel"),
      helper: t("novel:character.workspace.resource.protagonistHelper"),
      limit: 10,
      shouldShowResource: () => true,
    };
  }
  // i18n-ignore: regex matches against DB role values in Chinese
  if (/临时|路人|客串|一次性/.test(roleText)) {
    return {
      label: t("novel:character.workspace.resource.temporaryLabel"),
      helper: t("novel:character.workspace.resource.temporaryHelper"),
      limit: 5,
      shouldShowResource: (item) => (
        item.narrativeFunction === "promise"
        || item.narrativeFunction === "hidden_card"
        || item.expectedUseEndChapterOrder != null
        || item.status === "transferred"
      ),
    };
  }
  return {
    label: t("novel:character.workspace.resource.longTermLabel"),
    helper: t("novel:character.workspace.resource.longTermHelper"),
    limit: 6,
    shouldShowResource: (item) => item.status !== "stale",
  };
}

function getResourceStatusLabel(status: CharacterResourceLedgerItem["status"], t: TFunction): string {
  return t(`novel:character.workspace.resource.status.${status}`, { defaultValue: status });
}

function getResourceFunctionLabel(value: CharacterResourceLedgerItem["narrativeFunction"], t: TFunction): string {
  return t(`novel:character.workspace.resource.function.${value}`, { defaultValue: value });
}

export default function CharacterAssetWorkspace(props: CharacterAssetWorkspaceProps) {
  const { t } = useTranslation();
  const {
    characters,
    selectedCharacterId,
    onSelectedCharacterChange,
    onDeleteCharacter,
    isDeletingCharacter,
    deletingCharacterId,
    selectedCharacter,
    characterForm,
    onCharacterFormChange,
    onSaveCharacter,
    isSavingCharacter,
    timelineEvents,
    onSyncTimeline,
    isSyncingTimeline,
    onSyncAllTimeline,
    isSyncingAllTimeline,
    onWorldCheck,
    isCheckingWorld,
    onGenerateVisibleProfile,
    isGeneratingVisibleProfile,
    visibleProfileSuggestion,
    onApplyVisibleProfile,
    isApplyingVisibleProfile,
    onGenerateBatchVisibleProfiles,
    isGeneratingBatchVisibleProfiles,
    batchVisibleProfileResult,
    onApplyBatchVisibleProfiles,
    isApplyingBatchVisibleProfiles,
    characterResources = [],
    pendingCharacterResourceCount = 0,
    onBackfillCharacterResources,
    isBackfillingCharacterResources = false,
  } = props;
  const [visibleProfileGuidance, setVisibleProfileGuidance] = useState("");

  const lastAppearanceChapter = useMemo(
    () => getLastAppearanceChapter(timelineEvents),
    [timelineEvents],
  );
  const emotionSignal = getEmotionSignal(selectedCharacter, t);
  const secretStatus = getSecretStatus(selectedCharacter, t);
  const visibleProfileFields = VISIBLE_PROFILE_FIELDS(t);
  const selectedCharacterResources = useMemo(
    () => selectedCharacter
      ? characterResources.filter((item) => (
          item.holderCharacterId === selectedCharacter.id
          || item.ownerCharacterId === selectedCharacter.id
        ))
      : [],
    [characterResources, selectedCharacter],
  );
  const resourceDisplayMode = getResourceDisplayMode(selectedCharacter, t);
  const displayedResources = selectedCharacterResources
    .filter(resourceDisplayMode.shouldShowResource)
    .slice(0, resourceDisplayMode.limit);
  const hasVisibleProfileSuggestionForSelected = Boolean(
    visibleProfileSuggestion
    && selectedCharacter
    && visibleProfileSuggestion.characterId === selectedCharacter.id,
  );
  const applicableVisibleProfileCount = Object.keys(visibleProfileSuggestion?.fields ?? {}).length;
  const batchApplicableCount = batchVisibleProfileResult?.results.filter((item) => item.hasApplicableChanges).length ?? 0;
  const isSelectedProtagonist = isProtagonistCharacter(selectedCharacter);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("novel:character.workspace.title")}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {t("novel:character.workspace.description")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{t("novel:character.workspace.characterCount", { count: characters.length })}</Badge>
            {selectedCharacter ? <Badge variant="secondary">{t("novel:character.workspace.editing", { name: selectedCharacter.name })}</Badge> : null}
            {isSelectedProtagonist ? <Badge variant="outline">{t("novel:character.workspace.protagonist")}</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <CharacterAssetSidebar
          characters={characters}
          selectedCharacterId={selectedCharacterId}
          onSelectedCharacterChange={onSelectedCharacterChange}
          onDeleteCharacter={onDeleteCharacter}
          isDeletingCharacter={isDeletingCharacter}
          deletingCharacterId={deletingCharacterId}
        />

        {!selectedCharacter ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed px-6 text-center text-sm text-muted-foreground">
            {t("novel:character.workspace.selectHint")}
          </div>
        ) : (
          <div className="space-y-4">
            <CharacterFocusSummary
              selectedCharacter={selectedCharacter}
              lastAppearanceChapter={lastAppearanceChapter}
            />
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border p-3">
                <div className="text-xs text-muted-foreground">{t("novel:character.workspace.runtimeStatus.title")}</div>
                <div className="mt-2 text-xs text-muted-foreground">{t("novel:character.workspace.runtimeStatus.currentState", { value: selectedCharacter.currentState || t("novel:character.workspace.pending") })}</div>
                <div className="text-xs text-muted-foreground">{t("novel:character.workspace.runtimeStatus.currentGoal", { value: selectedCharacter.currentGoal || t("novel:character.workspace.pending") })}</div>
                <div className="text-xs text-muted-foreground">{t("novel:character.workspace.runtimeStatus.emotionTone", { value: emotionSignal })}</div>
                <div className="text-xs text-muted-foreground">{t("novel:character.workspace.runtimeStatus.secretStatus", { value: secretStatus })}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-muted-foreground">{t("novel:character.workspace.dramaticBlueprint.title")}</div>
                <div className="mt-2 text-xs text-muted-foreground">{t("novel:character.workspace.dramaticBlueprint.storyFunction", { value: selectedCharacter.storyFunction || t("novel:character.workspace.pending") })}</div>
                <div className="text-xs text-muted-foreground">
                  {t("novel:character.workspace.dramaticBlueprint.relationToProtagonist", { value: selectedCharacter.relationToProtagonist || t("novel:character.workspace.pending") })}
                </div>
                <div className="text-xs text-muted-foreground">{t("novel:character.workspace.dramaticBlueprint.outerGoal", { value: selectedCharacter.outerGoal || t("novel:character.workspace.pending") })}</div>
                <div className="text-xs text-muted-foreground">{t("novel:character.workspace.dramaticBlueprint.innerNeed", { value: selectedCharacter.innerNeed || t("novel:character.workspace.pending") })}</div>
                <div className="text-xs text-muted-foreground">
                  {t("novel:character.workspace.dramaticBlueprint.fearWound", { value: selectedCharacter.fear || selectedCharacter.wound || t("novel:character.workspace.pending") })}
                </div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-muted-foreground">{t("novel:character.workspace.personality.title")}</div>
                <div className="mt-2 text-xs text-muted-foreground">{t("novel:character.workspace.personality.core", { value: selectedCharacter.personality || t("novel:character.workspace.pending") })}</div>
                <div className="text-xs text-muted-foreground">{t("novel:character.workspace.personality.background", { value: selectedCharacter.background || t("novel:character.workspace.pending") })}</div>
                <div className="text-xs text-muted-foreground">{t("novel:character.workspace.personality.development", { value: selectedCharacter.development || t("novel:character.workspace.pending") })}</div>
                <div className="text-xs text-muted-foreground">{t("novel:character.workspace.personality.misbelief", { value: selectedCharacter.misbelief || t("novel:character.workspace.pending") })}</div>
                <div className="text-xs text-muted-foreground">{t("novel:character.workspace.personality.moralLine", { value: selectedCharacter.moralLine || t("novel:character.workspace.pending") })}</div>
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-medium">{t("novel:character.workspace.visibleProfile.title")}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("novel:character.workspace.visibleProfile.description")}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AiButton
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateVisibleProfile(visibleProfileGuidance)}
                    disabled={isGeneratingVisibleProfile || !selectedCharacterId}
                  >
                    {isGeneratingVisibleProfile ? t("novel:character.workspace.visibleProfile.generating") : t("novel:character.workspace.visibleProfile.generate")}
                  </AiButton>
                  <AiButton
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateBatchVisibleProfiles(visibleProfileGuidance)}
                    disabled={isGeneratingBatchVisibleProfiles || characters.length === 0}
                  >
                    {isGeneratingBatchVisibleProfiles ? t("novel:character.workspace.visibleProfile.generating") : t("novel:character.workspace.visibleProfile.generateBatch")}
                  </AiButton>
                </div>
              </div>
              <div className="mt-3">
                <textarea
                  className="min-h-[72px] w-full rounded-md border bg-background p-2 text-sm"
                  placeholder={t("novel:character.workspace.visibleProfile.guidancePlaceholder")}
                  value={visibleProfileGuidance}
                  onChange={(event) => setVisibleProfileGuidance(event.target.value)}
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("novel:character.workspace.visibleProfile.guidanceHint")}
                </div>
              </div>
              {isGeneratingVisibleProfile ? (
                <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
                  {t("novel:character.workspace.visibleProfile.generatingFor", { name: selectedCharacter.name })}
                </div>
              ) : null}
              {hasVisibleProfileSuggestionForSelected && visibleProfileSuggestion ? (
                <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-medium">
                        {applicableVisibleProfileCount > 0
                          ? t("novel:character.workspace.visibleProfile.generatedFor", { name: visibleProfileSuggestion.characterName, count: applicableVisibleProfileCount })
                          : t("novel:character.workspace.visibleProfile.noApplicableFor", { name: visibleProfileSuggestion.characterName })}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t("novel:character.workspace.visibleProfile.confirmHint")}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={onApplyVisibleProfile}
                      disabled={isApplyingVisibleProfile || applicableVisibleProfileCount === 0}
                    >
                      {isApplyingVisibleProfile ? t("novel:character.workspace.visibleProfile.saving") : t("novel:character.workspace.visibleProfile.save")}
                    </Button>
                  </div>
                  {visibleProfileSuggestion.warnings.length > 0 ? (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-900">
                      {visibleProfileSuggestion.warnings.map((warning) => (
                        <div key={warning}>{t("novel:character.workspace.visibleProfile.warning", { text: warning })}</div>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-2 grid gap-2 lg:grid-cols-2">
                    {visibleProfileFields.map((field) => {
                      const nextValue = visibleProfileSuggestion.fields[field.key];
                      const skippedReason = visibleProfileSuggestion.skippedFields[field.key];
                      return (
                        <div key={field.key} className="rounded-md border bg-background/80 p-2 text-xs leading-5">
                          <div className="font-medium">{field.label}</div>
                          <div className="text-muted-foreground">{t("novel:character.workspace.visibleProfile.current", { value: selectedCharacter[field.key] || t("novel:character.workspace.pending") })}</div>
                          <div>{t("novel:character.workspace.visibleProfile.suggestion", { value: nextValue || skippedReason || t("novel:character.workspace.visibleProfile.skip") })}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {!isGeneratingVisibleProfile && !hasVisibleProfileSuggestionForSelected ? (
                <div className="mt-3 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  {t("novel:character.workspace.visibleProfile.emptyHint")}
                </div>
              ) : null}
              {batchVisibleProfileResult ? (
                <div className="mt-3 rounded-lg border border-border/70 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-medium">
                      {t("novel:character.workspace.visibleProfile.batchSuggestion", { count: batchApplicableCount })}
                    </div>
                    <Button
                      size="sm"
                      onClick={onApplyBatchVisibleProfiles}
                      disabled={isApplyingBatchVisibleProfiles || batchApplicableCount === 0}
                    >
                      {isApplyingBatchVisibleProfiles ? t("novel:character.workspace.visibleProfile.applying") : t("novel:character.workspace.visibleProfile.applyBatch")}
                    </Button>
                  </div>
                  <div className="mt-2 max-h-64 space-y-2 overflow-auto pr-1">
                    {batchVisibleProfileResult.results.map((result) => (
                      <div key={result.characterId} className="rounded-md border bg-muted/10 p-2 text-xs leading-5">
                        <div className="font-medium">{result.characterName}</div>
                        <div className="text-muted-foreground">
                          {result.hasApplicableChanges
                            ? t("novel:character.workspace.visibleProfile.applicableCount", { count: Object.keys(result.fields).length })
                            : t("novel:character.workspace.visibleProfile.noApplicable")}
                        </div>
                        <div>{visibleProfileFields.map((field) => result.fields[field.key]).filter(Boolean).join(" / ")}</div>
                      </div>
                    ))}
                    {batchVisibleProfileResult.skippedCharacters.map((item) => (
                      <div key={item.characterId} className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                        {t("novel:character.workspace.visibleProfile.skippedItem", { name: item.characterName, reason: item.reason })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {visibleProfileFields.map((field) => (
                  <div key={field.key} className="rounded-lg border border-border/70 bg-muted/15 p-3">
                    <div className="text-xs font-medium text-muted-foreground">{field.label}</div>
                    <div className="mt-1 text-sm leading-6">{selectedCharacter[field.key] || t("novel:character.workspace.pending")}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium">{t("novel:character.workspace.resource.title")}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">{resourceDisplayMode.helper}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onBackfillCharacterResources?.()}
                    disabled={isBackfillingCharacterResources || !onBackfillCharacterResources}
                  >
                    {isBackfillingCharacterResources ? t("novel:character.workspace.resource.backfilling") : t("novel:character.workspace.resource.backfill")}
                  </Button>
                  <Badge variant="outline">{resourceDisplayMode.label}</Badge>
                  {pendingCharacterResourceCount > 0 ? (
                    <Badge variant="secondary">{t("novel:character.workspace.resource.pendingCount", { count: pendingCharacterResourceCount })}</Badge>
                  ) : null}
                </div>
              </div>

              {displayedResources.length > 0 ? (
                <div className="mt-3 grid gap-2 lg:grid-cols-2">
                  {displayedResources.map((resource) => (
                    <div key={resource.id} className="rounded-lg border border-border/70 bg-muted/15 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{resource.name}</div>
                        <Badge variant={resource.status === "available" || resource.status === "borrowed" ? "default" : "outline"}>
                          {getResourceStatusLabel(resource.status, t)}
                        </Badge>
                        <Badge variant="secondary">{getResourceFunctionLabel(resource.narrativeFunction, t)}</Badge>
                      </div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">{resource.summary}</div>
                      <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                        <div>{t("novel:character.workspace.resource.holder", { name: resource.holderCharacterName || selectedCharacter.name })}</div>
                        <div>{t("novel:character.workspace.resource.readerKnows", { value: resource.readerKnows ? t("novel:character.workspace.resource.known") : t("novel:character.workspace.resource.unknown") })}</div>
                        {resource.expectedUseEndChapterOrder ? (
                          <div>{t("novel:character.workspace.resource.useWindow", { start: resource.expectedUseStartChapterOrder ?? "?", end: resource.expectedUseEndChapterOrder })}</div>
                        ) : null}
                        {resource.constraints.length > 0 ? (
                          <div>{t("novel:character.workspace.resource.constraints", { value: resource.constraints.slice(0, 2).join(" / ") })}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {t("novel:character.workspace.resource.emptyHint")}
                </div>
              )}
            </div>

            <details className="rounded-xl border p-3" open>
              <summary className="cursor-pointer font-medium">{t("novel:character.workspace.editForm.title")}</summary>
              <div className="mt-3 space-y-2">
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    placeholder={t("novel:character.workspace.editForm.namePlaceholder")}
                    value={characterForm.name}
                    onChange={(event) => onCharacterFormChange("name", event.target.value)}
                  />
                  <Input
                    placeholder={t("novel:character.workspace.editForm.rolePlaceholder")}
                    value={characterForm.role}
                    onChange={(event) => onCharacterFormChange("role", event.target.value)}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <select
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={characterForm.gender}
                    onChange={(event) => onCharacterFormChange("gender", event.target.value)}
                  >
                    <option value="unknown">{t("novel:character.workspace.editForm.gender.unknown")}</option>
                    <option value="male">{t("novel:character.workspace.editForm.gender.male")}</option>
                    <option value="female">{t("novel:character.workspace.editForm.gender.female")}</option>
                    <option value="other">{t("novel:character.workspace.editForm.gender.other")}</option>
                  </select>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    placeholder={t("novel:character.workspace.editForm.currentStatePlaceholder")}
                    value={characterForm.currentState}
                    onChange={(event) => onCharacterFormChange("currentState", event.target.value)}
                  />
                  <Input
                    placeholder={t("novel:character.workspace.editForm.currentGoalPlaceholder")}
                    value={characterForm.currentGoal}
                    onChange={(event) => onCharacterFormChange("currentGoal", event.target.value)}
                  />
                </div>
                <textarea
                  className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
                  placeholder={t("novel:character.workspace.editForm.personalityPlaceholder")}
                  value={characterForm.personality}
                  onChange={(event) => onCharacterFormChange("personality", event.target.value)}
                />
                <textarea
                  className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
                  placeholder={t("novel:character.workspace.editForm.backgroundPlaceholder")}
                  value={characterForm.background}
                  onChange={(event) => onCharacterFormChange("background", event.target.value)}
                />
                <textarea
                  className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
                  placeholder={t("novel:character.workspace.editForm.developmentPlaceholder")}
                  value={characterForm.development}
                  onChange={(event) => onCharacterFormChange("development", event.target.value)}
                />
                <div className="grid gap-2 md:grid-cols-2">
                  {visibleProfileFields.map((field) => (
                    <textarea
                      key={field.key}
                      className="min-h-[72px] w-full rounded-md border bg-background p-2 text-sm"
                      placeholder={`${field.label}：${field.placeholder}`}
                      value={characterForm[field.key]}
                      onChange={(event) => onCharacterFormChange(field.key, event.target.value)}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={onSaveCharacter} disabled={isSavingCharacter}>
                    {isSavingCharacter ? t("novel:character.workspace.visibleProfile.saving") : t("novel:character.workspace.editForm.save")}
                  </Button>
                  <AiButton size="sm" variant="outline" onClick={onSyncTimeline} disabled={isSyncingTimeline}>
                    {isSyncingTimeline ? t("novel:character.workspace.editForm.syncing") : t("novel:character.workspace.editForm.syncTimeline")}
                  </AiButton>
                  <AiButton
                    size="sm"
                    variant="outline"
                    onClick={onSyncAllTimeline}
                    disabled={isSyncingAllTimeline}
                  >
                    {isSyncingAllTimeline ? t("novel:character.workspace.editForm.syncing") : t("novel:character.workspace.editForm.syncAllTimeline")}
                  </AiButton>
                  <AiButton size="sm" variant="outline" onClick={onWorldCheck} disabled={isCheckingWorld}>
                    {isCheckingWorld ? t("novel:character.workspace.editForm.checking") : t("novel:character.workspace.editForm.worldCheck")}
                  </AiButton>
                </div>
              </div>
            </details>

            <details className="rounded-xl border p-3">
              <summary className="cursor-pointer font-medium">{t("novel:character.workspace.arcNodes.title")}</summary>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div>{t("novel:character.workspace.arcNodes.arcStart", { value: selectedCharacter.arcStart || t("novel:character.workspace.pending") })}</div>
                <div>{t("novel:character.workspace.arcNodes.arcMidpoint", { value: selectedCharacter.arcMidpoint || t("novel:character.workspace.pending") })}</div>
                <div>{t("novel:character.workspace.arcNodes.arcClimax", { value: selectedCharacter.arcClimax || t("novel:character.workspace.pending") })}</div>
                <div>{t("novel:character.workspace.arcNodes.arcEnd", { value: selectedCharacter.arcEnd || t("novel:character.workspace.pending") })}</div>
                <div>{t("novel:character.workspace.arcNodes.firstImpression", { value: selectedCharacter.firstImpression || t("novel:character.workspace.pending") })}</div>
                <div>{t("novel:character.workspace.arcNodes.secret", { value: selectedCharacter.secret || t("novel:character.workspace.pending") })}</div>
              </div>
            </details>

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("novel:character.workspace.timeline.title")}</div>
              {timelineEvents.length > 0 ? (
                timelineEvents.slice(-12).reverse().map((event) => (
                  <div key={event.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{event.title}</div>
                      <Badge variant="outline">{event.source}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.chapterOrder ? t("novel:character.workspace.timeline.chapter", { order: event.chapterOrder }) : t("novel:character.workspace.timeline.noChapter")} ·{" "}
                      {new Date(event.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{event.content}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  {t("novel:character.workspace.timeline.emptyHint")}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
