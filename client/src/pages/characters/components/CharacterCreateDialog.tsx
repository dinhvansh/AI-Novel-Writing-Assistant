import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listBookAnalyses } from "@/api/bookAnalysis";
import type { CharacterGenerateConstraints } from "@/api/character";
import { createBaseCharacter, generateBaseCharacter } from "@/api/character";
import { listKnowledgeDocuments } from "@/api/knowledge";
import { queryKeys } from "@/api/queryKeys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function createDefaultConstraints(): CharacterGenerateConstraints {
  return {
    storyFunction: undefined,
    externalGoal: "",
    internalNeed: "",
    coreFear: "",
    moralBottomLine: "",
    secret: "",
    coreFlaw: "",
    relationshipHooks: "",
    growthStage: undefined,
    toneStyle: "",
  };
}

interface CharacterCreateDialogProps {
  onCreated?: () => void;
}

export function CharacterCreateDialog({ onCreated }: CharacterCreateDialogProps) {
  const { t } = useTranslation("novel");
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "主角",
    personality: "",
    background: "",
    development: "",
    category: "主角",
  });
  const [aiDescription, setAIDescription] = useState("");
  const [constraints, setConstraints] = useState<CharacterGenerateConstraints>(createDefaultConstraints());
  const [selectedKnowledgeDocumentIds, setSelectedKnowledgeDocumentIds] = useState<string[]>([]);
  const [selectedBookAnalysisIds, setSelectedBookAnalysisIds] = useState<string[]>([]);

  const knowledgeDocumentsQuery = useQuery({
    queryKey: queryKeys.knowledge.documents("character-generator"),
    queryFn: () => listKnowledgeDocuments({ status: "enabled" }),
  });
  const bookAnalysesQuery = useQuery({
    queryKey: queryKeys.bookAnalysis.list("character-generator-succeeded"),
    queryFn: () => listBookAnalyses({ status: "succeeded" }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createBaseCharacter({
        ...form,
        tags: "",
        appearance: "",
        weaknesses: "",
        interests: "",
        keyEvents: "",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.baseCharacters.all });
      onCreated?.();
      setIsOpen(false);
    },
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      generateBaseCharacter({
        description: aiDescription,
        category: constraints.storyFunction ?? form.category,
        knowledgeDocumentIds: selectedKnowledgeDocumentIds.length > 0 ? selectedKnowledgeDocumentIds : undefined,
        bookAnalysisIds: selectedBookAnalysisIds.length > 0 ? selectedBookAnalysisIds : undefined,
        constraints: Object.values(constraints).some(Boolean) ? constraints : undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.baseCharacters.all });
      onCreated?.();
      setAIDescription("");
      setIsOpen(false);
    },
  });

  const knowledgeDocuments = knowledgeDocumentsQuery.data?.data ?? [];
  const bookAnalyses = bookAnalysesQuery.data?.data ?? [];

  const toggleId = (ids: string[], id: string, checked: boolean) =>
    checked ? (ids.includes(id) ? ids : [...ids, id]) : ids.filter((item) => item !== id);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>{t("character.create.triggerBtn")}</Button>
      </DialogTrigger>
      <DialogContent className="w-[96vw] max-h-[90vh] max-w-[1400px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("character.create.dialogTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("character.create.manualTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              <input
                className="rounded-md border p-2 text-sm"
                placeholder={t("character.create.namePlaceholder")}
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <input
                className="rounded-md border p-2 text-sm"
                placeholder={t("character.create.rolePlaceholder")}
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              />
              <input
                className="rounded-md border p-2 text-sm"
                placeholder={t("character.create.personalityPlaceholder")}
                value={form.personality}
                onChange={(event) => setForm((prev) => ({ ...prev, personality: event.target.value }))}
              />
              <input
                className="rounded-md border p-2 text-sm"
                placeholder={t("character.create.backgroundPlaceholder")}
                value={form.background}
                onChange={(event) => setForm((prev) => ({ ...prev, background: event.target.value }))}
              />
              <input
                className="rounded-md border p-2 text-sm md:col-span-2"
                placeholder={t("character.create.developmentPlaceholder")}
                value={form.development}
                onChange={(event) => setForm((prev) => ({ ...prev, development: event.target.value }))}
              />
              <Button
                className="md:col-span-2"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.name.trim()}
              >
                {createMutation.isPending ? t("character.create.creating") : t("character.create.createBtn")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("character.create.aiTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="min-h-[120px] w-full rounded-md border p-2 text-sm"
                placeholder={t("character.create.aiDescPlaceholder")}
                value={aiDescription}
                onChange={(event) => setAIDescription(event.target.value)}
              />

              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{t("character.create.advancedSettings")}</div>
                  <Button size="sm" variant="outline" onClick={() => setConstraints(createDefaultConstraints())}>
                    {t("character.create.clearAdvanced")}
                  </Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <div className="text-xs text-muted-foreground">{t("character.create.storyFunctionLabel")}</div>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-2 text-sm"
                      value={constraints.storyFunction ?? ""}
                      onChange={(event) =>
                        setConstraints((prev) => ({
                          ...prev,
                          storyFunction: (event.target.value || undefined) as CharacterGenerateConstraints["storyFunction"],
                        }))}
                    >
                      <option value="">{t("character.create.notSpecified")}</option>
                      <option value="主角">{t("character.create.roleProtagonist")}</option>
                      <option value="反派">{t("character.create.roleAntagonist")}</option>
                      <option value="导师">{t("character.create.roleMentor")}</option>
                      <option value="对照组">{t("character.create.roleContrast")}</option>
                      <option value="配角">{t("character.create.roleSupporting")}</option>
                    </select>
                  </label>

                  <label className="space-y-1 text-sm">
                    <div className="text-xs text-muted-foreground">{t("character.create.growthStageLabel")}</div>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-2 text-sm"
                      value={constraints.growthStage ?? ""}
                      onChange={(event) =>
                        setConstraints((prev) => ({
                          ...prev,
                          growthStage: (event.target.value || undefined) as CharacterGenerateConstraints["growthStage"],
                        }))}
                    >
                      <option value="">{t("character.create.notSpecified")}</option>
                      <option value="起点">{t("character.create.stageStart")}</option>
                      <option value="受挫">{t("character.create.stageSetback")}</option>
                      <option value="转折">{t("character.create.stageTurning")}</option>
                      <option value="觉醒">{t("character.create.stageAwakening")}</option>
                      <option value="收束">{t("character.create.stageResolution")}</option>
                    </select>
                  </label>

                  <input
                    className="rounded-md border p-2 text-sm"
                    placeholder={t("character.create.externalGoalPlaceholder")}
                    value={constraints.externalGoal ?? ""}
                    onChange={(event) => setConstraints((prev) => ({ ...prev, externalGoal: event.target.value }))}
                  />
                  <input
                    className="rounded-md border p-2 text-sm"
                    placeholder={t("character.create.internalNeedPlaceholder")}
                    value={constraints.internalNeed ?? ""}
                    onChange={(event) => setConstraints((prev) => ({ ...prev, internalNeed: event.target.value }))}
                  />
                  <input
                    className="rounded-md border p-2 text-sm"
                    placeholder={t("character.create.coreFearPlaceholder")}
                    value={constraints.coreFear ?? ""}
                    onChange={(event) => setConstraints((prev) => ({ ...prev, coreFear: event.target.value }))}
                  />
                  <input
                    className="rounded-md border p-2 text-sm"
                    placeholder={t("character.create.moralBottomLinePlaceholder")}
                    value={constraints.moralBottomLine ?? ""}
                    onChange={(event) => setConstraints((prev) => ({ ...prev, moralBottomLine: event.target.value }))}
                  />
                  <input
                    className="rounded-md border p-2 text-sm"
                    placeholder={t("character.create.secretPlaceholder")}
                    value={constraints.secret ?? ""}
                    onChange={(event) => setConstraints((prev) => ({ ...prev, secret: event.target.value }))}
                  />
                  <input
                    className="rounded-md border p-2 text-sm"
                    placeholder={t("character.create.coreFlawPlaceholder")}
                    value={constraints.coreFlaw ?? ""}
                    onChange={(event) => setConstraints((prev) => ({ ...prev, coreFlaw: event.target.value }))}
                  />
                  <input
                    className="rounded-md border p-2 text-sm md:col-span-2"
                    placeholder={t("character.create.relationshipHooksPlaceholder")}
                    value={constraints.relationshipHooks ?? ""}
                    onChange={(event) => setConstraints((prev) => ({ ...prev, relationshipHooks: event.target.value }))}
                  />
                  <input
                    className="rounded-md border p-2 text-sm md:col-span-2"
                    placeholder={t("character.create.toneStylePlaceholder")}
                    value={constraints.toneStyle ?? ""}
                    onChange={(event) => setConstraints((prev) => ({ ...prev, toneStyle: event.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{t("character.create.knowledgeDocsLabel")}</div>
                  <div className="max-h-48 space-y-2 overflow-auto rounded-md border p-2">
                    {knowledgeDocumentsQuery.isLoading ? (
                      <div className="text-sm text-muted-foreground">{t("character.create.loading")}</div>
                    ) : null}
                    {!knowledgeDocumentsQuery.isLoading && knowledgeDocuments.length === 0 ? (
                      <div className="text-sm text-muted-foreground">{t("character.create.noKnowledgeDocs")}</div>
                    ) : null}
                    {knowledgeDocuments.map((document) => (
                      <label key={document.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedKnowledgeDocumentIds.includes(document.id)}
                          onChange={(event) =>
                            setSelectedKnowledgeDocumentIds((prev) => toggleId(prev, document.id, event.target.checked))
                          }
                        />
                        <div className="min-w-0">
                          <div className="font-medium">{document.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {document.fileName} | v{document.activeVersionNumber}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">{t("character.create.noKnowledgeHint")}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium">{t("character.create.bookAnalysisLabel")}</div>
                  <div className="max-h-48 space-y-2 overflow-auto rounded-md border p-2">
                    {bookAnalysesQuery.isLoading ? (
                      <div className="text-sm text-muted-foreground">{t("character.create.loading")}</div>
                    ) : null}
                    {!bookAnalysesQuery.isLoading && bookAnalyses.length === 0 ? (
                      <div className="text-sm text-muted-foreground">{t("character.create.noBookAnalysis")}</div>
                    ) : null}
                    {bookAnalyses.map((analysis) => (
                      <label key={analysis.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedBookAnalysisIds.includes(analysis.id)}
                          onChange={(event) =>
                            setSelectedBookAnalysisIds((prev) => toggleId(prev, analysis.id, event.target.checked))
                          }
                        />
                        <div className="min-w-0">
                          <div className="font-medium">{analysis.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {analysis.documentTitle} | v{analysis.documentVersionNumber}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">{t("character.create.bookAnalysisHint")}</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {t("character.create.selectedRefs", { knowledge: selectedKnowledgeDocumentIds.length, book: selectedBookAnalysisIds.length })}
              </div>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || !aiDescription.trim()}
              >
                {generateMutation.isPending ? t("character.create.generating") : t("character.create.generateBtn")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
