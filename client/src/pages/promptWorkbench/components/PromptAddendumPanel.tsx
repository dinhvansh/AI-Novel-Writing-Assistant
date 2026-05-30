import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Power, Save, Trash2 } from "lucide-react";
import { getNovelList } from "@/api/novel/core";
import {
  deletePromptAddendum,
  getPromptAddendums,
  savePromptAddendum,
  setPromptAddendumEnabled,
  type PromptAddendum,
  type PromptAddendumPayload,
  type PromptCatalogItem,
} from "@/api/promptWorkbench";
import { queryKeys } from "@/api/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AddendumFormState {
  id?: string;
  title: string;
  content: string;
  enabled: boolean;
}

const EMPTY_GLOBAL_FORM: AddendumFormState = {
  title: "全局补充要求", // i18n-ignore: default form value — overridden by actual addendum data
  content: "",
  enabled: true,
};

const EMPTY_NOVEL_FORM: AddendumFormState = {
  title: "本书补充要求", // i18n-ignore: default form value — overridden by actual addendum data
  content: "",
  enabled: true,
};

function toForm(row: PromptAddendum | undefined, fallback: AddendumFormState): AddendumFormState {
  if (!row) {
    return fallback;
  }
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    enabled: row.enabled,
  };
}

function buildParamsKey(promptId: string, novelId: string): string {
  return JSON.stringify({ promptId, novelId: novelId || undefined });
}

function AddendumEditor({
  title,
  description,
  disabled,
  form,
  active,
  pending,
  headerControl,
  onChange,
  onSave,
  onToggle,
  onDelete,
}: {
  title: string;
  description: string;
  disabled?: boolean;
  form: AddendumFormState;
  active: boolean;
  pending?: boolean;
  headerControl?: ReactNode;
  onChange: (next: AddendumFormState) => void;
  onSave: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation("promptWorkbench");
  return (
    <div className={cn("rounded-md border p-4", disabled && "opacity-60")}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <Badge variant={active ? "default" : "secondary"}>
              {active ? t("addendum.enabled") : t("addendum.disabled")}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          {headerControl}
          <Button type="button" variant="outline" size="sm" onClick={onToggle} disabled={disabled || !form.id || pending}>
            <Power className="mr-2 h-4 w-4" />
            {active ? t("addendum.disable") : t("addendum.enable")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onDelete} disabled={disabled || !form.id || pending}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("addendum.delete")}
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Input
          value={form.title}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
          disabled={disabled || pending}
          placeholder={t("addendum.titlePlaceholder")}
        />
        <textarea
          value={form.content}
          onChange={(event) => onChange({ ...form, content: event.target.value })}
          disabled={disabled || pending}
          placeholder={t("addendum.contentPlaceholder")}
          className="min-h-36 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          maxLength={4000}
        />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground">
            {t("addendum.charCount", { count: form.content.trim().length })}
          </div>
          <Button type="button" onClick={onSave} disabled={disabled || pending || form.content.trim().length === 0}>
            <Save className="mr-2 h-4 w-4" />
            {t("addendum.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PromptAddendumPanel({ prompt }: { prompt: PromptCatalogItem }) {
  const { t } = useTranslation("promptWorkbench");
  const queryClient = useQueryClient();
  const [selectedNovelId, setSelectedNovelId] = useState("");
  const [globalForm, setGlobalForm] = useState<AddendumFormState>(EMPTY_GLOBAL_FORM);
  const [novelForm, setNovelForm] = useState<AddendumFormState>(EMPTY_NOVEL_FORM);

  const paramsKey = useMemo(() => buildParamsKey(prompt.id, selectedNovelId), [prompt.id, selectedNovelId]);
  const addendumQueryKey = queryKeys.promptWorkbench.addendums(paramsKey);

  const novelsQuery = useQuery({
    queryKey: queryKeys.novels.list(1, 50),
    queryFn: () => getNovelList({ page: 1, limit: 50 }),
    staleTime: 60_000,
  });

  const addendumsQuery = useQuery({
    queryKey: addendumQueryKey,
    queryFn: () => getPromptAddendums({
      promptId: prompt.id,
      novelId: selectedNovelId || undefined,
    }),
    enabled: prompt.addendumSupported,
    staleTime: 15_000,
  });

  const addendums = addendumsQuery.data?.data ?? [];
  const globalAddendum = addendums.find((item) => item.scope === "global");
  const novelAddendum = addendums.find((item) => item.scope === "novel" && item.novelId === selectedNovelId);

  useEffect(() => {
    setGlobalForm(toForm(globalAddendum, EMPTY_GLOBAL_FORM));
    setNovelForm(toForm(novelAddendum, EMPTY_NOVEL_FORM));
  }, [globalAddendum?.id, globalAddendum?.updatedAt, novelAddendum?.id, novelAddendum?.updatedAt, prompt.id]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: addendumQueryKey });
  };

  const saveMutation = useMutation({
    mutationFn: (payload: PromptAddendumPayload) => savePromptAddendum(payload),
    onSuccess: invalidate,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => setPromptAddendumEnabled(id, enabled),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePromptAddendum(id),
    onSuccess: invalidate,
  });

  const pending = saveMutation.isPending || toggleMutation.isPending || deleteMutation.isPending;
  const novels = novelsQuery.data?.data?.items ?? [];

  if (!prompt.addendumSupported) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        {t("addendum.notSupported")}
      </div>
    );
  }

  const saveGlobal = () => saveMutation.mutate({
    id: globalForm.id,
    scope: "global",
    promptId: prompt.id,
    title: globalForm.title,
    content: globalForm.content,
    enabled: globalForm.enabled,
  });

  const saveNovel = () => saveMutation.mutate({
    id: novelForm.id,
    scope: "novel",
    novelId: selectedNovelId,
    promptId: prompt.id,
    title: novelForm.title,
    content: novelForm.content,
    enabled: novelForm.enabled,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          {t("addendum.effectOrderTitle")}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("addendum.effectOrderDescription")}
        </p>
      </div>

      <AddendumEditor
        title={t("addendum.globalTitle")}
        description={t("addendum.globalDescription")}
        form={globalForm}
        active={Boolean(globalAddendum?.enabled)}
        pending={pending}
        onChange={setGlobalForm}
        onSave={saveGlobal}
        onToggle={() => globalForm.id && toggleMutation.mutate({ id: globalForm.id, enabled: !globalAddendum?.enabled })}
        onDelete={() => globalForm.id && deleteMutation.mutate(globalForm.id)}
      />

      <AddendumEditor
        title={t("addendum.novelTitle")}
        description={t("addendum.novelDescription")}
        disabled={!selectedNovelId}
        form={novelForm}
        active={Boolean(novelAddendum?.enabled)}
        pending={pending}
        headerControl={(
          <select
            value={selectedNovelId}
            onChange={(event) => setSelectedNovelId(event.target.value)}
            className="h-9 min-w-64 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">{t("addendum.selectNovelPlaceholder")}</option>
            {novels.map((novel) => (
              <option key={novel.id} value={novel.id}>
                {novel.title || novel.id}
              </option>
            ))}
          </select>
        )}
        onChange={setNovelForm}
        onSave={saveNovel}
        onToggle={() => novelForm.id && toggleMutation.mutate({ id: novelForm.id, enabled: !novelAddendum?.enabled })}
        onDelete={() => novelForm.id && deleteMutation.mutate(novelForm.id)}
      />
    </div>
  );
}
