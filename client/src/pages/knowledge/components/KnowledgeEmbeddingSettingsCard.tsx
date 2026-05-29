import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import type { EmbeddingProvider, RagEmbeddingModelStatus, RagProviderStatus } from "@/api/settings";
import SearchableSelect from "@/components/common/SearchableSelect";
import SelectField from "@/components/common/SelectField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface KnowledgeEmbeddingSettingsFormState {
  embeddingProvider: EmbeddingProvider;
  embeddingModel: string;
  collectionVersion: number;
  collectionMode: "auto" | "manual";
  collectionName: string;
  collectionTag: string;
  autoReindexOnChange: boolean;
  embeddingBatchSize: number;
  embeddingTimeoutMs: number;
  embeddingMaxRetries: number;
  embeddingRetryBaseMs: number;
  enabled: boolean;
  qdrantUrl: string;
  qdrantApiKey: string;
  qdrantApiKeyConfigured: boolean;
  clearQdrantApiKey: boolean;
  qdrantTimeoutMs: number;
  qdrantUpsertMaxBytes: number;
  chunkSize: number;
  chunkOverlap: number;
  vectorCandidates: number;
  keywordCandidates: number;
  finalTopK: number;
  workerPollMs: number;
  workerMaxAttempts: number;
  workerRetryBaseMs: number;
  httpTimeoutMs: number;
}

interface KnowledgeEmbeddingSettingsCardProps {
  form: KnowledgeEmbeddingSettingsFormState;
  setForm: Dispatch<SetStateAction<KnowledgeEmbeddingSettingsFormState>>;
  providers: RagProviderStatus[];
  modelOptions: string[];
  modelQuery: {
    isLoading: boolean;
    data?: RagEmbeddingModelStatus;
  };
  isSaving: boolean;
  onSave: () => void;
}

function slugifySegment(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || fallback;
}

function buildSuggestedCollectionName(form: KnowledgeEmbeddingSettingsFormState): string {
  const parts = [
    "ai",
    "novel",
    "rag",
    form.embeddingProvider,
    slugifySegment(form.embeddingModel, "embedding"),
    slugifySegment(form.collectionTag, "kb"),
    `v${form.collectionVersion}`,
  ];
  return parts.join("_").slice(0, 120);
}

function parseNumberInput(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function KnowledgeEmbeddingSettingsCard({
  form,
  setForm,
  providers,
  modelOptions,
  modelQuery,
  isSaving,
  onSave,
}: KnowledgeEmbeddingSettingsCardProps) {
  const { t } = useTranslation();
  const suggestedCollectionName = useMemo(() => buildSuggestedCollectionName(form), [form]);
  const currentProvider = providers.find((item) => item.provider === form.embeddingProvider);
  const collectionNameToDisplay = form.collectionMode === "auto"
    ? suggestedCollectionName
    : form.collectionName.trim();

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{t("knowledge:embedding.title")}</CardTitle>
          <Badge variant="outline">{t("knowledge:embedding.collectionVersionBadge", { version: form.collectionVersion })}</Badge>
          {currentProvider ? <Badge variant="outline">{currentProvider.name}</Badge> : null}
          <Badge variant={form.enabled ? "default" : "outline"}>
            {form.enabled ? t("knowledge:embedding.ragEnabled") : t("knowledge:embedding.ragPaused")}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {t("knowledge:embedding.headerDescription")}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">{t("knowledge:embedding.vectorModel.title")}</div>
            <div className="text-xs text-muted-foreground">
              {t("knowledge:embedding.vectorModel.description")}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <SelectField
                label={t("knowledge:embedding.vectorModel.providerLabel")}
                value={form.embeddingProvider}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    embeddingProvider: value as EmbeddingProvider,
                    embeddingModel: "",
                  }))}
                options={providers.map((item) => ({
                  value: item.provider,
                  label: item.name,
                }))}
              />
              {currentProvider ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant={currentProvider.isConfigured ? "default" : "outline"}>
                    {currentProvider.isConfigured ? t("knowledge:embedding.vectorModel.connectionConfigured") : t("knowledge:embedding.vectorModel.connectionPending")}
                  </Badge>
                  <Badge variant={currentProvider.isActive ? "default" : "outline"}>
                    {currentProvider.isActive ? t("knowledge:embedding.vectorModel.available") : t("knowledge:embedding.vectorModel.notEnabled")}
                  </Badge>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("knowledge:embedding.vectorModel.modelLabel")}</div>
              {modelQuery.isLoading ? (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  {t("knowledge:embedding.vectorModel.loadingModels")}
                </div>
              ) : modelOptions.length > 0 ? (
                <SearchableSelect
                  value={form.embeddingModel}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, embeddingModel: value }))}
                  options={modelOptions.map((model) => ({ value: model }))}
                  placeholder={t("knowledge:embedding.vectorModel.selectModelPlaceholder")}
                  searchPlaceholder={t("knowledge:embedding.vectorModel.searchModelPlaceholder")}
                  emptyText={t("knowledge:embedding.vectorModel.noMatchingModel")}
                />
              ) : null}
              <Input
                className={modelQuery.isLoading || modelOptions.length > 0 ? "hidden" : undefined}
                value={form.embeddingModel}
                onChange={(event) => setForm((prev) => ({ ...prev, embeddingModel: event.target.value }))}
                placeholder="例如：text-embedding-3-small"
              />
              {modelQuery.data ? (
                <div className="text-xs text-muted-foreground">
                  {modelQuery.data.source === "remote"
                    ? t("knowledge:embedding.vectorModel.remoteModelCount", { count: modelQuery.data.models.length })
                    : t("knowledge:embedding.vectorModel.useRecommendedHint")}
                </div>
              ) : null}
            </div>
          </div>

        </section>

        <section className="space-y-4 rounded-md border bg-background/60 p-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">{t("knowledge:embedding.vectorStore.title")}</div>
            <div className="text-xs text-muted-foreground">
              {t("knowledge:embedding.vectorStore.description")}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t("knowledge:embedding.vectorStore.urlLabel")}</div>
            <Input
              value={form.qdrantUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, qdrantUrl: event.target.value }))}
              placeholder="http://127.0.0.1:6333"
            />
            <div className="text-xs text-muted-foreground">
              {t("knowledge:embedding.vectorStore.urlHint")}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{t("knowledge:embedding.vectorStore.apiKeyLabel")}</div>
                <Badge variant={form.qdrantApiKeyConfigured ? "default" : "outline"}>
                  {form.qdrantApiKeyConfigured ? t("knowledge:embedding.vectorStore.keyAvailable") : t("knowledge:embedding.vectorStore.keyNotSet")}
                </Badge>
              </div>
              <Input
                type="password"
                value={form.qdrantApiKey}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    qdrantApiKey: event.target.value,
                    clearQdrantApiKey: false,
                  }))}
                placeholder={form.qdrantApiKeyConfigured ? t("knowledge:embedding.vectorStore.keepSavedKeyPlaceholder") : t("knowledge:embedding.vectorStore.enterApiKeyPlaceholder")}
              />
            </div>

            <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={form.clearQdrantApiKey}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    clearQdrantApiKey: event.target.checked,
                    qdrantApiKey: event.target.checked ? "" : prev.qdrantApiKey,
                  }))}
              />
              {t("knowledge:embedding.vectorStore.clearKeyOnSave")}
            </label>
          </div>
        </section>

        <details className="group rounded-md border bg-muted/10 p-4">
          <summary className="flex cursor-pointer list-none flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-semibold">{t("knowledge:embedding.advanced.title")}</div>
              <div className="text-xs text-muted-foreground">
                {t("knowledge:embedding.advanced.description")}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="group-open:hidden">{t("knowledge:embedding.advanced.expand")}</span>
              <span className="hidden group-open:inline">{t("knowledge:embedding.advanced.collapse")}</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
            </div>
          </summary>

          <div className="mt-5 space-y-6">
            <section className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("knowledge:embedding.collection.title")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("knowledge:embedding.collection.description")}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label={t("knowledge:embedding.collection.namingModeLabel")}
                  value={form.collectionMode}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      collectionMode: value as "auto" | "manual",
                    }))}
                  options={[
                    { value: "auto", label: t("knowledge:embedding.collection.autoGenerate") },
                    { value: "manual", label: t("knowledge:embedding.collection.manualSpecify") },
                  ]}
                />

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.collection.tagLabel")}</div>
                  <Input
                    value={form.collectionTag}
                    onChange={(event) => setForm((prev) => ({ ...prev, collectionTag: event.target.value }))}
                    placeholder="例如：kb / prod / novel"
                  />
                  <div className="text-xs text-muted-foreground">
                    {t("knowledge:embedding.collection.tagHint")}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">
                  {form.collectionMode === "auto" ? t("knowledge:embedding.collection.autoNameLabel") : t("knowledge:embedding.collection.manualNameLabel")}
                </div>
                {form.collectionMode === "auto" ? (
                  <div className="rounded-md border border-dashed bg-muted/20 p-3 font-mono text-xs break-all">
                    {collectionNameToDisplay}
                  </div>
                ) : (
                  <Input
                    value={form.collectionName}
                    onChange={(event) => setForm((prev) => ({ ...prev, collectionName: event.target.value }))}
                    placeholder="例如：ai_novel_rag_openai_text_embedding_3_small_kb_v1"
                  />
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label={t("knowledge:embedding.collection.autoReindexLabel")}
                  value={form.autoReindexOnChange ? "true" : "false"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      autoReindexOnChange: value === "true",
                    }))}
                  options={[
                    { value: "true", label: t("knowledge:embedding.collection.reindexOn") },
                    { value: "false", label: t("knowledge:embedding.collection.reindexOff") },
                  ]}
                />

                <div className="rounded-md border bg-background p-3">
                  <div className="text-sm font-medium">{t("knowledge:embedding.collection.targetCollection")}</div>
                  <div className="mt-2 font-mono text-xs break-all">{collectionNameToDisplay}</div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("knowledge:embedding.connectionParams.title")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("knowledge:embedding.connectionParams.description")}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <SelectField
                  label={t("knowledge:embedding.connectionParams.ragStatusLabel")}
                  value={form.enabled ? "true" : "false"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      enabled: value === "true",
                    }))}
                  options={[
                    { value: "true", label: t("knowledge:embedding.connectionParams.ragEnabled") },
                    { value: "false", label: t("knowledge:embedding.connectionParams.ragPaused") },
                  ]}
                />

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.connectionParams.qdrantTimeoutLabel")}</div>
                  <Input
                    type="number"
                    min={1000}
                    max={300000}
                    value={form.qdrantTimeoutMs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        qdrantTimeoutMs: parseNumberInput(event.target.value, prev.qdrantTimeoutMs),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.connectionParams.upsertMaxBytesLabel")}</div>
                  <Input
                    type="number"
                    min={1024 * 1024}
                    max={64 * 1024 * 1024}
                    value={form.qdrantUpsertMaxBytes}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        qdrantUpsertMaxBytes: parseNumberInput(event.target.value, prev.qdrantUpsertMaxBytes),
                      }))}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("knowledge:embedding.retrieval.title")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("knowledge:embedding.retrieval.description")}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.retrieval.chunkSizeLabel")}</div>
                  <Input
                    type="number"
                    min={200}
                    max={4000}
                    value={form.chunkSize}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        chunkSize: parseNumberInput(event.target.value, prev.chunkSize),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.retrieval.chunkOverlapLabel")}</div>
                  <Input
                    type="number"
                    min={0}
                    max={1000}
                    value={form.chunkOverlap}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        chunkOverlap: parseNumberInput(event.target.value, prev.chunkOverlap),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.retrieval.finalTopKLabel")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={form.finalTopK}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        finalTopK: parseNumberInput(event.target.value, prev.finalTopK),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.retrieval.vectorCandidatesLabel")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={form.vectorCandidates}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        vectorCandidates: parseNumberInput(event.target.value, prev.vectorCandidates),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.retrieval.keywordCandidatesLabel")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={form.keywordCandidates}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        keywordCandidates: parseNumberInput(event.target.value, prev.keywordCandidates),
                      }))}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("knowledge:embedding.embeddingBehavior.title")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("knowledge:embedding.embeddingBehavior.description")}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.embeddingBehavior.batchSizeLabel")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={256}
                    value={form.embeddingBatchSize}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        embeddingBatchSize: parseNumberInput(event.target.value, prev.embeddingBatchSize),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.embeddingBehavior.timeoutLabel")}</div>
                  <Input
                    type="number"
                    min={5000}
                    max={300000}
                    value={form.embeddingTimeoutMs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        embeddingTimeoutMs: parseNumberInput(event.target.value, prev.embeddingTimeoutMs),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.embeddingBehavior.maxRetriesLabel")}</div>
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    value={form.embeddingMaxRetries}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        embeddingMaxRetries: parseNumberInput(event.target.value, prev.embeddingMaxRetries),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.embeddingBehavior.retryBaseIntervalLabel")}</div>
                  <Input
                    type="number"
                    min={100}
                    max={10000}
                    value={form.embeddingRetryBaseMs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        embeddingRetryBaseMs: parseNumberInput(event.target.value, prev.embeddingRetryBaseMs),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.embeddingBehavior.workerPollIntervalLabel")}</div>
                  <Input
                    type="number"
                    min={200}
                    max={60000}
                    value={form.workerPollMs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        workerPollMs: parseNumberInput(event.target.value, prev.workerPollMs),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.embeddingBehavior.workerMaxAttemptsLabel")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={form.workerMaxAttempts}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        workerMaxAttempts: parseNumberInput(event.target.value, prev.workerMaxAttempts),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.embeddingBehavior.workerRetryBaseIntervalLabel")}</div>
                  <Input
                    type="number"
                    min={1000}
                    max={300000}
                    value={form.workerRetryBaseMs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        workerRetryBaseMs: parseNumberInput(event.target.value, prev.workerRetryBaseMs),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("knowledge:embedding.embeddingBehavior.httpTimeoutLabel")}</div>
                  <Input
                    type="number"
                    min={1000}
                    max={300000}
                    value={form.httpTimeoutMs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        httpTimeoutMs: parseNumberInput(event.target.value, prev.httpTimeoutMs),
                      }))}
                  />
                </div>
              </div>
            </section>
          </div>
        </details>

        <Button
          onClick={onSave}
          disabled={
            isSaving
            || modelQuery.isLoading
            || !form.embeddingModel.trim()
            || !collectionNameToDisplay.trim()
            || !form.qdrantUrl.trim()
          }
        >
          {isSaving ? t("knowledge:embedding.saving") : t("knowledge:embedding.saveButton")}
        </Button>
      </CardContent>
    </Card>
  );
}
