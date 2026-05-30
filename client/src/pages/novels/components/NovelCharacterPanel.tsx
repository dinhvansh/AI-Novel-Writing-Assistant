import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type {
  BaseCharacter,
  Character,
  CharacterCastRole,
  CharacterGender,
  CharacterTimeline,
  CharacterVisibleProfileBatchResult,
  CharacterVisibleProfileSuggestion,
  SupplementalCharacterCandidate,
  SupplementalCharacterGenerateInput,
  SupplementalCharacterGenerationMode,
  SupplementalCharacterGenerationResult,
} from "@ai-novel/shared/types/novel";
import type { LLMProvider } from "@ai-novel/shared/types/llm";
import type { CharacterResourceLedgerItem } from "@ai-novel/shared/types/characterResource";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import CharacterAssetWorkspace from "./CharacterAssetWorkspace";
import CharacterDiagnosticsSection from "./CharacterDiagnosticsSection";
import type { QuickCharacterCreatePayload } from "./characterPanel.utils";
import DirectorTakeoverEntryPanel from "./DirectorTakeoverEntryPanel";

interface QuickCharacterFormState {
  name: string;
  role: string;
}

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

// CAST_ROLE_LABELS converted to t() calls
// CHARACTER_GENDER_LABELS converted to t() calls
// SUPPLEMENTAL_MODE_LABELS converted to t() calls

function getCastRoleLabel(castRole: CharacterCastRole | "auto" | null | undefined, t: ReturnType<typeof useTranslation>["t"]): string {
  if (!castRole || castRole === "auto") {
    return t("novel:character.panel.supplemental.aiJudge");
  }
  return t(`novel:character.panel.castRoles.${castRole}`, { defaultValue: castRole });
}

function getCharacterGenderLabel(gender: CharacterGender | null | undefined, t: ReturnType<typeof useTranslation>["t"]): string {
  if (!gender) {
    return t("novel:character.panel.gender.unknown");
  }
  return t(`novel:character.panel.gender.${gender}`, { defaultValue: gender });
}

function getSupplementalRelationLabel(
  candidate: SupplementalCharacterCandidate,
  relation: SupplementalCharacterCandidate["relations"][number],
): string {
  if (relation.sourceName === candidate.name) {
    return relation.targetName;
  }
  if (relation.targetName === candidate.name) {
    return relation.sourceName;
  }
  return `${relation.sourceName} -> ${relation.targetName}`;
}

interface NovelCharacterPanelProps {
  novelId: string;
  llmProvider?: LLMProvider;
  llmModel?: string;
  characterMessage: string;
  quickCharacterForm: QuickCharacterFormState;
  onQuickCharacterFormChange: (field: keyof QuickCharacterFormState, value: string) => void;
  onQuickCreateCharacter: (payload: QuickCharacterCreatePayload) => void;
  isQuickCreating: boolean;
  onGenerateSupplementalCharacters: (payload: SupplementalCharacterGenerateInput) => Promise<{
    data?: SupplementalCharacterGenerationResult;
    message?: string;
  }>;
  isGeneratingSupplementalCharacters: boolean;
  onApplySupplementalCharacter: (candidate: SupplementalCharacterCandidate) => Promise<{
    data?: { character?: Character; relationCount?: number };
    message?: string;
  }>;
  isApplyingSupplementalCharacter: boolean;
  characters: Character[];
  coreCharacterCount: number;
  baseCharacters: BaseCharacter[];
  selectedBaseCharacterId: string;
  onSelectedBaseCharacterChange: (id: string) => void;
  selectedBaseCharacter?: BaseCharacter;
  importedBaseCharacterIds: Set<string>;
  onImportBaseCharacter: () => void;
  isImportingBaseCharacter: boolean;
  selectedCharacterId: string;
  onSelectedCharacterChange: (id: string) => void;
  onDeleteCharacter: (characterId: string) => void;
  isDeletingCharacter: boolean;
  deletingCharacterId: string;
  onSyncTimeline: () => void;
  isSyncingTimeline: boolean;
  onSyncAllTimeline: () => void;
  isSyncingAllTimeline: boolean;
  onEvolveCharacter: () => void;
  isEvolvingCharacter: boolean;
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
  onWorldCheck: () => void;
  isCheckingWorld: boolean;
  selectedCharacter?: Character;
  characterResources?: CharacterResourceLedgerItem[];
  pendingCharacterResourceCount?: number;
  onBackfillCharacterResources?: () => void;
  isBackfillingCharacterResources?: boolean;
  characterForm: CharacterFormState;
  onCharacterFormChange: (field: keyof CharacterFormState, value: string) => void;
  onSaveCharacter: () => void;
  isSavingCharacter: boolean;
  timelineEvents: CharacterTimeline[];
  directorTakeoverEntry?: ReactNode;
}

export default function NovelCharacterPanel(props: NovelCharacterPanelProps) {
  const {
    novelId,
    llmProvider,
    llmModel,
    characterMessage,
    quickCharacterForm,
    onQuickCharacterFormChange,
    onQuickCreateCharacter,
    isQuickCreating,
    onGenerateSupplementalCharacters,
    isGeneratingSupplementalCharacters,
    onApplySupplementalCharacter,
    isApplyingSupplementalCharacter,
    characters,
    coreCharacterCount,
    baseCharacters,
    selectedBaseCharacterId,
    onSelectedBaseCharacterChange,
    selectedBaseCharacter,
    importedBaseCharacterIds,
    onImportBaseCharacter,
    isImportingBaseCharacter,
    selectedCharacterId,
    onSelectedCharacterChange,
    onDeleteCharacter,
    isDeletingCharacter,
    deletingCharacterId,
    onSyncTimeline,
    isSyncingTimeline,
    onSyncAllTimeline,
    isSyncingAllTimeline,
    onEvolveCharacter,
    isEvolvingCharacter,
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
    onWorldCheck,
    isCheckingWorld,
    selectedCharacter,
    characterResources = [],
    pendingCharacterResourceCount = 0,
    onBackfillCharacterResources,
    isBackfillingCharacterResources = false,
    characterForm,
    onCharacterFormChange,
    onSaveCharacter,
    isSavingCharacter,
    timelineEvents,
    directorTakeoverEntry,
  } = props;

  const { t } = useTranslation();
  const [isCharacterEntryOpen, setIsCharacterEntryOpen] = useState(false);
  const [isSupplementalCharacterOpen, setIsSupplementalCharacterOpen] = useState(false);
  const [relationToProtagonist, setRelationToProtagonist] = useState("");
  const [storyFunction, setStoryFunction] = useState("");
  const [wizardKeywords, setWizardKeywords] = useState("");
  const [autoGenerateProfile, setAutoGenerateProfile] = useState(true);
  const [supplementalMode, setSupplementalMode] = useState<SupplementalCharacterGenerationMode>("auto");
  const [supplementalAnchorIds, setSupplementalAnchorIds] = useState<string[]>([]);
  const [supplementalTargetRole, setSupplementalTargetRole] = useState<CharacterCastRole | "auto">("auto");
  const [supplementalCount, setSupplementalCount] = useState<"auto" | "1" | "2" | "3">("auto");
  const [supplementalPrompt, setSupplementalPrompt] = useState("");
  const [supplementalStatusMessage, setSupplementalStatusMessage] = useState("");
  const [supplementalResult, setSupplementalResult] = useState<SupplementalCharacterGenerationResult | null>(null);
  const previousQuickCreating = useRef(isQuickCreating);

  useEffect(() => {
    if (previousQuickCreating.current && !isQuickCreating && !quickCharacterForm.name.trim()) {
      setIsCharacterEntryOpen(false);
      setRelationToProtagonist("");
      setStoryFunction("");
      setWizardKeywords("");
      setAutoGenerateProfile(true);
    }
    previousQuickCreating.current = isQuickCreating;
  }, [isQuickCreating, quickCharacterForm.name]);

  const handleQuickCreate = () => {
    const payload: QuickCharacterCreatePayload = {
      name: quickCharacterForm.name,
      role: quickCharacterForm.role,
      relationToProtagonist,
      storyFunction,
      keywords: wizardKeywords,
      autoGenerateProfile,
    };
    onQuickCreateCharacter(payload);
  };

  const handleOpenSupplementalDialog = () => {
    setIsSupplementalCharacterOpen(true);
    if (selectedCharacterId && supplementalAnchorIds.length === 0) {
      setSupplementalAnchorIds([selectedCharacterId]);
    }
  };

  const toggleSupplementalAnchor = (characterId: string) => {
    setSupplementalAnchorIds((prev) =>
      prev.includes(characterId)
        ? prev.filter((item) => item !== characterId)
        : [...prev, characterId],
    );
  };

  const handleGenerateSupplementalCharacters = async () => {
    if (supplementalMode === "linked" && characters.length === 0) {
      setSupplementalStatusMessage(t("novel:character.panel.supplemental.noCharactersError"));
      return;
    }

    try {
      const response = await onGenerateSupplementalCharacters({
        mode: supplementalMode,
        anchorCharacterIds: supplementalMode === "independent" ? [] : supplementalAnchorIds,
        targetCastRole: supplementalTargetRole,
        count: supplementalCount === "auto" ? undefined : Number(supplementalCount),
        userPrompt: supplementalPrompt.trim() || undefined,
      });
      setSupplementalResult(response.data ?? null);
      setSupplementalStatusMessage(response.message ?? t("novel:character.panel.supplemental.generated"));
    } catch (error) {
      setSupplementalStatusMessage(error instanceof Error ? error.message : t("novel:character.panel.supplemental.generateFailed"));
    }
  };

  const handleApplySupplementalCharacter = async (candidate: SupplementalCharacterCandidate) => {
    try {
      const response = await onApplySupplementalCharacter(candidate);
      const createdName = response.data?.character?.name ?? candidate.name;
      const relationCount = response.data?.relationCount ?? 0;
      setSupplementalResult((prev) => prev
        ? {
          ...prev,
          candidates: prev.candidates.filter((item) => item.name !== candidate.name),
        }
        : prev);
      setSupplementalStatusMessage(
        response.message
        ?? t("novel:character.panel.supplemental.characterJoined", { name: createdName, relationCount }),
      );
    } catch (error) {
      setSupplementalStatusMessage(error instanceof Error ? error.message : t("novel:character.panel.supplemental.applyFailed"));
    }
  };

  return (
    <div className="space-y-5">
      <DirectorTakeoverEntryPanel
        title={t("novel:character.panel.takeoverTitle")}
        description={t("novel:character.panel.takeoverDescription")}
        entry={directorTakeoverEntry}
      />
      {characterMessage ? <div className="text-sm text-muted-foreground">{characterMessage}</div> : null}

      <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-muted/30">
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Character Prep
              </div>
              <div className="text-2xl font-semibold tracking-tight text-foreground">
                {t("novel:character.panel.mainTitle")}
              </div>
              <div className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {t("novel:character.panel.mainDescription")}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("novel:character.panel.stats.totalCharacters")}</div>
                <div className="mt-2 text-2xl font-semibold">{characters.length}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t("novel:character.panel.stats.totalHint")}</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("novel:character.panel.stats.coreCharacters")}</div>
                <div className="mt-2 text-2xl font-semibold">{coreCharacterCount}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t("novel:character.panel.stats.coreHint")}</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("novel:character.panel.stats.currentFocus")}</div>
                <div className="mt-2 text-base font-semibold">{selectedCharacter?.name ?? t("novel:character.panel.stats.noSelection")}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {selectedCharacter?.role || t("novel:character.panel.stats.baseCharactersAvailable", { count: baseCharacters.length })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-background/70 p-3">
            <Button onClick={() => setIsCharacterEntryOpen(true)}>{t("novel:character.panel.addCharacter")}</Button>
            <AiButton variant="outline" onClick={handleOpenSupplementalDialog}>
              {t("novel:character.panel.supplementCharacter")}
            </AiButton>
            <AiButton
              variant="secondary"
              onClick={onEvolveCharacter}
              disabled={isEvolvingCharacter || !selectedCharacterId}
            >
              {isEvolvingCharacter ? t("novel:character.panel.evolving") : t("novel:character.panel.evolve")}
            </AiButton>
            <AiButton
              variant="outline"
              onClick={() => onGenerateVisibleProfile()}
              disabled={isGeneratingVisibleProfile || !selectedCharacterId}
            >
              {isGeneratingVisibleProfile ? t("novel:character.panel.generating") : t("novel:character.panel.generateVisibleProfile")}
            </AiButton>
            <Badge variant="outline">{t("novel:character.panel.lowFreqBadge")}</Badge>
            <div className="text-xs text-muted-foreground">
              {t("novel:character.panel.dailyEditHint")}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCharacterEntryOpen} onOpenChange={setIsCharacterEntryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("novel:character.panel.addCharacter")}</DialogTitle>
            <DialogDescription>
              {t("novel:character.panel.addCharacterDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className="space-y-3 rounded-2xl border p-4">
              <div className="space-y-1">
                <div className="font-medium">{t("novel:character.panel.quickCreate.title")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("novel:character.panel.quickCreate.hint")}
                </div>
              </div>
              <Input
                placeholder={t("novel:character.panel.quickCreate.namePlaceholder")}
                value={quickCharacterForm.name}
                onChange={(event) => onQuickCharacterFormChange("name", event.target.value)}
              />
              <select
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={quickCharacterForm.role}
                onChange={(event) => onQuickCharacterFormChange("role", event.target.value)}
              >
                <option value="主角"> {/* i18n-ignore: DB value */}{t("novel:character.panel.roles.protagonist")}</option>
                <option value="配角"> {/* i18n-ignore: DB value */}{t("novel:character.panel.roles.supporting")}</option>
                <option value="反派"> {/* i18n-ignore: DB value */}{t("novel:character.panel.roles.antagonist")}</option>
                <option value="导师"> {/* i18n-ignore: DB value */}{t("novel:character.panel.roles.mentor")}</option>
                <option value="情感线"> {/* i18n-ignore: DB value */}{t("novel:character.panel.roles.loveInterest")}</option>
                <option value="功能角色"> {/* i18n-ignore: DB value */}{t("novel:character.panel.roles.functional")}</option>
              </select>
              <Input
                placeholder={t("novel:character.panel.quickCreate.relationPlaceholder")}
                value={relationToProtagonist}
                onChange={(event) => setRelationToProtagonist(event.target.value)}
              />
              <Input
                placeholder={t("novel:character.panel.quickCreate.storyFunctionPlaceholder")}
                value={storyFunction}
                onChange={(event) => setStoryFunction(event.target.value)}
              />
              <Input
                placeholder={t("novel:character.panel.quickCreate.keywordsPlaceholder")}
                value={wizardKeywords}
                onChange={(event) => setWizardKeywords(event.target.value)}
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={autoGenerateProfile}
                  onChange={(event) => setAutoGenerateProfile(event.target.checked)}
                />
                {t("novel:character.panel.quickCreate.autoGenerateLabel")}
              </label>
              <AiButton onClick={handleQuickCreate} disabled={isQuickCreating || !quickCharacterForm.name.trim()}>
                {isQuickCreating ? t("novel:character.panel.generating") : t("novel:character.panel.quickCreate.generate")}
              </AiButton>
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <div className="space-y-1">
                <div className="font-medium">{t("novel:character.panel.importBase.title")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("novel:character.panel.importBase.hint")}
                </div>
              </div>
              {baseCharacters.length > 0 ? (
                <>
                  <select
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={selectedBaseCharacterId}
                    onChange={(event) => onSelectedBaseCharacterChange(event.target.value)}
                  >
                    {baseCharacters.map((character) => (
                      <option key={character.id} value={character.id}>
                        {character.name}（{character.role}）
                      </option>
                    ))}
                  </select>
                  {selectedBaseCharacter ? (
                    <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{selectedBaseCharacter.name}</span>
                        <Badge variant={importedBaseCharacterIds.has(selectedBaseCharacter.id) ? "outline" : "secondary"}>
                          {importedBaseCharacterIds.has(selectedBaseCharacter.id) ? t("novel:character.panel.importBase.linked") : t("novel:character.panel.importBase.notLinked")}
                        </Badge>
                      </div>
                      <div className="line-clamp-3 text-xs text-muted-foreground">
                        {t("novel:character.panel.importBase.personality", { value: selectedBaseCharacter.personality || t("novel:character.panel.importBase.none") })}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={onImportBaseCharacter}
                      disabled={
                        isImportingBaseCharacter
                        || !selectedBaseCharacter
                        || importedBaseCharacterIds.has(selectedBaseCharacter.id)
                      }
                    >
                      {isImportingBaseCharacter ? t("novel:character.panel.importBase.importing") : t("novel:character.panel.importBase.import")}
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/base-characters">{t("novel:character.panel.importBase.manage")}</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  {t("novel:character.panel.importBase.empty")}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSupplementalCharacterOpen} onOpenChange={setIsSupplementalCharacterOpen}>
        <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 px-6 pb-0 pt-6">
            <DialogTitle>{t("novel:character.panel.supplementCharacter")}</DialogTitle>
            <DialogDescription>
              {t("novel:character.panel.supplemental.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-6 pb-6 pt-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] xl:overflow-hidden">
            <div className="space-y-4 rounded-2xl border p-4 xl:min-h-0 xl:overflow-y-auto">
              <div className="space-y-1">
                <div className="font-medium">{t("novel:character.panel.supplemental.modeTitle")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("novel:character.panel.supplemental.modeHint")}
                </div>
              </div>
              <select
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={supplementalMode}
                onChange={(event) => setSupplementalMode(event.target.value as SupplementalCharacterGenerationMode)}
              >
                <option value="auto">{t("novel:character.panel.supplemental.modeAuto")}</option>
                <option value="linked">{t("novel:character.panel.supplemental.modeLinked")}</option>
                <option value="independent">{t("novel:character.panel.supplemental.modeIndependent")}</option>
              </select>

              {characters.length > 0 && supplementalMode !== "independent" ? (
                <div className="space-y-2">
                  <div className="font-medium">{t("novel:character.panel.supplemental.anchorTitle")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("novel:character.panel.supplemental.anchorHint")}
                  </div>
                  <div className="max-h-40 space-y-2 overflow-auto rounded-xl border bg-muted/15 p-3">
                    {characters.map((character) => (
                      <label key={character.id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={supplementalAnchorIds.includes(character.id)}
                          onChange={() => toggleSupplementalAnchor(character.id)}
                        />
                        <span>
                          {character.name}
                          <span className="ml-1 text-xs text-muted-foreground">({character.role})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="font-medium">{t("novel:character.panel.supplemental.targetRoleTitle")}</div>
                  <select
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={supplementalTargetRole}
                    onChange={(event) => setSupplementalTargetRole(event.target.value as CharacterCastRole | "auto")}
                  >
                    <option value="auto">{t("novel:character.panel.supplemental.aiJudge")}</option>
                    <option value="protagonist">{t("novel:character.panel.castRoles.protagonist")}</option>
                    <option value="antagonist">{t("novel:character.panel.castRoles.antagonist")}</option>
                    <option value="ally">{t("novel:character.panel.castRoles.ally")}</option>
                    <option value="foil">{t("novel:character.panel.castRoles.foil")}</option>
                    <option value="mentor">{t("novel:character.panel.castRoles.mentor")}</option>
                    <option value="love_interest">{t("novel:character.panel.castRoles.loveInterest")}</option>
                    <option value="pressure_source">{t("novel:character.panel.castRoles.pressureSource")}</option>
                    <option value="catalyst">{t("novel:character.panel.castRoles.catalyst")}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="font-medium">{t("novel:character.panel.supplemental.countTitle")}</div>
                  <select
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={supplementalCount}
                    onChange={(event) => setSupplementalCount(event.target.value as "auto" | "1" | "2" | "3")}
                  >
                    <option value="auto">{t("novel:character.panel.supplemental.aiJudge")}</option>
                    <option value="1">{t("novel:character.panel.supplemental.count1")}</option>
                    <option value="2">{t("novel:character.panel.supplemental.count2")}</option>
                    <option value="3">{t("novel:character.panel.supplemental.count3")}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-medium">{t("novel:character.panel.supplemental.extraNotes")}</div>
                <textarea
                  className="min-h-[140px] w-full rounded-xl border bg-background p-3 text-sm"
                  placeholder={t("novel:character.panel.supplemental.promptPlaceholder")}
                  value={supplementalPrompt}
                  onChange={(event) => setSupplementalPrompt(event.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <AiButton
                  onClick={handleGenerateSupplementalCharacters}
                  disabled={isGeneratingSupplementalCharacters || (supplementalMode === "linked" && characters.length === 0)}
                >
                  {isGeneratingSupplementalCharacters ? t("novel:character.panel.generating") : t("novel:character.panel.supplemental.generate")}
                </AiButton>
                <Badge variant="outline">{t("novel:character.panel.supplemental.countHint")}</Badge>
                <Badge variant="outline">{t("novel:character.panel.supplemental.linkedHint")}</Badge>
              </div>

              {supplementalStatusMessage ? (
                <div className="rounded-xl border border-border/70 bg-background/80 p-3 text-xs text-muted-foreground">
                  {supplementalStatusMessage}
                </div>
              ) : null}
            </div>

            <div className="space-y-3 rounded-2xl border p-4 xl:min-h-0 xl:overflow-y-auto">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium">{t("novel:character.panel.supplemental.resultsTitle")}</div>
                {supplementalResult ? <Badge variant="outline">{t("novel:character.panel.supplemental.candidateCount", { count: supplementalResult.candidates.length })}</Badge> : null}
                {supplementalResult?.mode ? <Badge variant="outline">{t("novel:character.panel.supplemental.modeLabel", { mode: t(`novel:character.panel.supplemental.modes.${supplementalResult.mode}`) })}</Badge> : null}
              </div>
              {supplementalResult?.planningSummary ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-xs text-muted-foreground">
                  {t("novel:character.panel.supplemental.aiJudgment")}: {supplementalResult.planningSummary}
                </div>
              ) : null}

              {isGeneratingSupplementalCharacters ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                  {t("novel:character.panel.supplemental.analyzing")}
                </div>
              ) : supplementalResult?.candidates.length ? (
                <div className="space-y-3">
                  {supplementalResult.candidates.map((candidate) => (
                    <div key={candidate.name} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium">{candidate.name}</div>
                            <Badge variant="outline">{candidate.role}</Badge>
                            <Badge variant="secondary">{getCastRoleLabel(candidate.castRole, t)}</Badge>
                            <Badge variant="outline">{t("novel:character.panel.gender.label", { value: t(`novel:character.panel.gender.${candidate.gender || "unknown"}`) })}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{candidate.summary}</div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => void handleApplySupplementalCharacter(candidate)}
                          disabled={isApplyingSupplementalCharacter}
                        >
                          {isApplyingSupplementalCharacter ? t("novel:character.panel.supplemental.creating") : t("novel:character.panel.supplemental.createThis")}
                        </Button>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                          <div>{t("novel:character.panel.supplemental.candidate.storyFunction")}: {candidate.storyFunction}</div>
                          <div>{t("novel:character.panel.supplemental.candidate.relationToProtagonist")}: {candidate.relationToProtagonist || t("novel:character.panel.supplemental.aiNotSpecified")}</div>
                          <div>{t("novel:character.panel.supplemental.candidate.outerGoal")}: {candidate.outerGoal || t("novel:character.workspace.pending")}</div>
                          <div>{t("novel:character.panel.supplemental.candidate.currentGoal")}: {candidate.currentGoal || t("novel:character.workspace.pending")}</div>
                        </div>
                        <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                          <div>{t("novel:character.panel.supplemental.candidate.firstImpression")}: {candidate.firstImpression || t("novel:character.workspace.pending")}</div>
                          <div>{t("novel:character.panel.supplemental.candidate.fear")}: {candidate.fear || t("novel:character.workspace.pending")}</div>
                          <div>{t("novel:character.panel.supplemental.candidate.misbelief")}: {candidate.misbelief || t("novel:character.workspace.pending")}</div>
                          <div>{t("novel:character.panel.supplemental.candidate.whyNow")}: {candidate.whyNow || t("novel:character.panel.supplemental.aiNotSpecified")}</div>
                        </div>
                      </div>

                      {candidate.relations.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">{t("novel:character.panel.supplemental.candidate.suggestedRelations")}</div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {candidate.relations.map((relation, index) => (
                              <div key={`${candidate.name}-${relation.sourceName}-${relation.targetName}-${index}`} className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                                <div className="font-medium text-foreground">{getSupplementalRelationLabel(candidate, relation)}</div>
                                <div>{t("novel:character.panel.supplemental.candidate.surfaceRelation")}: {relation.surfaceRelation}</div>
                                {relation.hiddenTension ? <div>{t("novel:character.panel.supplemental.candidate.hiddenTension")}: {relation.hiddenTension}</div> : null}
                                {relation.conflictSource ? <div>{t("novel:character.panel.supplemental.candidate.conflictSource")}: {relation.conflictSource}</div> : null}
                                {relation.nextTurnPoint ? <div>{t("novel:character.panel.supplemental.candidate.nextTurnPoint")}: {relation.nextTurnPoint}</div> : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                          {t("novel:character.panel.supplemental.candidate.noRelations")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed px-6 text-center text-sm text-muted-foreground">
                  {t("novel:character.panel.supplemental.emptyHint")}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CharacterDiagnosticsSection
        novelId={novelId}
        characters={characters}
        selectedCharacter={selectedCharacter}
        selectedCharacterId={selectedCharacterId}
        onSelectedCharacterChange={onSelectedCharacterChange}
        llmProvider={llmProvider}
        llmModel={llmModel}
      />

      <CharacterAssetWorkspace
        characters={characters}
        selectedCharacterId={selectedCharacterId}
        onSelectedCharacterChange={onSelectedCharacterChange}
        onDeleteCharacter={onDeleteCharacter}
        isDeletingCharacter={isDeletingCharacter}
        deletingCharacterId={deletingCharacterId}
        selectedCharacter={selectedCharacter}
        characterForm={characterForm}
        onCharacterFormChange={onCharacterFormChange}
        onSaveCharacter={onSaveCharacter}
        isSavingCharacter={isSavingCharacter}
        timelineEvents={timelineEvents}
        onSyncTimeline={onSyncTimeline}
        isSyncingTimeline={isSyncingTimeline}
        onSyncAllTimeline={onSyncAllTimeline}
        isSyncingAllTimeline={isSyncingAllTimeline}
        onWorldCheck={onWorldCheck}
        isCheckingWorld={isCheckingWorld}
        onGenerateVisibleProfile={onGenerateVisibleProfile}
        isGeneratingVisibleProfile={isGeneratingVisibleProfile}
        visibleProfileSuggestion={visibleProfileSuggestion}
        onApplyVisibleProfile={onApplyVisibleProfile}
        isApplyingVisibleProfile={isApplyingVisibleProfile}
        onGenerateBatchVisibleProfiles={onGenerateBatchVisibleProfiles}
        isGeneratingBatchVisibleProfiles={isGeneratingBatchVisibleProfiles}
        batchVisibleProfileResult={batchVisibleProfileResult}
        onApplyBatchVisibleProfiles={onApplyBatchVisibleProfiles}
        isApplyingBatchVisibleProfiles={isApplyingBatchVisibleProfiles}
        characterResources={characterResources}
        pendingCharacterResourceCount={pendingCharacterResourceCount}
        onBackfillCharacterResources={onBackfillCharacterResources}
        isBackfillingCharacterResources={isBackfillingCharacterResources}
      />
    </div>
  );
}
