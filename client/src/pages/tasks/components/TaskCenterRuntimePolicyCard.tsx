import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type {
  DirectorPolicyMode,
  DirectorRuntimeSnapshot,
} from "@ai-novel/shared/types/directorRuntime";
import { updateDirectorRuntimePolicy } from "@/api/novelDirector";
import { queryKeys } from "@/api/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

interface TaskCenterRuntimePolicyCardProps {
  taskId: string;
  snapshot: DirectorRuntimeSnapshot | null | undefined;
}

const POLICY_MODE_KEYS: DirectorPolicyMode[] = ["suggest_only", "run_next_step", "run_until_gate", "auto_safe_scope"]; // i18n-ignore: internal enum keys

export default function TaskCenterRuntimePolicyCard({
  taskId,
  snapshot,
}: TaskCenterRuntimePolicyCardProps) {
  const { t } = useTranslation();
  const POLICY_OPTIONS: Array<{ value: DirectorPolicyMode; label: string; description: string }> = [
    { value: "suggest_only", label: t("tasks:policy.modes.suggest_only"), description: t("tasks:policy.descriptions.suggest_only") },
    { value: "run_next_step", label: t("tasks:policy.modes.run_next_step"), description: t("tasks:policy.descriptions.run_next_step") },
    { value: "run_until_gate", label: t("tasks:policy.modes.run_until_gate"), description: t("tasks:policy.descriptions.run_until_gate") },
    { value: "auto_safe_scope", label: t("tasks:policy.modes.auto_safe_scope"), description: t("tasks:policy.descriptions.auto_safe_scope") },
  ];
  const queryClient = useQueryClient();
  const currentMode = snapshot?.policy.mode ?? "run_until_gate";
  const [selectedMode, setSelectedMode] = useState<DirectorPolicyMode>(currentMode);
  const [allowExpensiveReview, setAllowExpensiveReview] = useState(false);
  const [mayOverwriteUserContent, setMayOverwriteUserContent] = useState(false);
  const selectedOption = useMemo(
    () => POLICY_OPTIONS.find((item) => item.value === selectedMode) ?? POLICY_OPTIONS[2],
    [selectedMode, POLICY_OPTIONS],
  );
  const mutation = useMutation({
    mutationFn: () => updateDirectorRuntimePolicy(taskId, {
      mode: selectedMode,
      allowExpensiveReview,
      mayOverwriteUserContent,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.directorRuntime(taskId) });
      toast.success(t("tasks:policy.saved"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("tasks:policy.saveFailed"));
    },
  });

  useEffect(() => {
    setSelectedMode(currentMode);
    setAllowExpensiveReview(Boolean(snapshot?.policy.allowExpensiveReview));
    setMayOverwriteUserContent(Boolean(snapshot?.policy.mayOverwriteUserContent));
  }, [currentMode, snapshot?.policy.allowExpensiveReview, snapshot?.policy.mayOverwriteUserContent]);

  if (!snapshot) {
    return null;
  }

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium">{t("tasks:policy.title")}</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("tasks:policy.description")}
          </div>
        </div>
        <Badge variant="outline">{POLICY_OPTIONS.find((item) => item.value === snapshot.policy.mode)?.label ?? snapshot.policy.mode}</Badge>
      </div>
      <div className="mt-3 space-y-2">
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={selectedMode}
          onChange={(event) => setSelectedMode(event.target.value as DirectorPolicyMode)}
        >
          {POLICY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <div className="text-xs leading-5 text-muted-foreground">{selectedOption.description}</div>
      </div>
      <div className="mt-3 space-y-2 rounded-md border bg-background/70 p-3">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={allowExpensiveReview}
            onChange={(event) => setAllowExpensiveReview(event.target.checked)}
          />
          <span>
            <span className="block font-medium">{t("tasks:policy.allowExpensiveReview")}</span>
            <span className="block text-xs leading-5 text-muted-foreground">
              {t("tasks:policy.allowExpensiveReviewHint")}
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={mayOverwriteUserContent}
            onChange={(event) => setMayOverwriteUserContent(event.target.checked)}
          />
          <span>
            <span className="block font-medium">{t("tasks:policy.mayOverwriteUserContent")}</span>
            <span className="block text-xs leading-5 text-muted-foreground">
              {t("tasks:policy.mayOverwriteUserContentHint")}
            </span>
          </span>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={
            mutation.isPending
            || (
              selectedMode === snapshot.policy.mode
              && allowExpensiveReview === Boolean(snapshot.policy.allowExpensiveReview)
              && mayOverwriteUserContent === Boolean(snapshot.policy.mayOverwriteUserContent)
            )
          }
        >
          {mutation.isPending ? t("tasks:policy.saving") : t("tasks:policy.save")}
        </Button>
      </div>
    </div>
  );
}
