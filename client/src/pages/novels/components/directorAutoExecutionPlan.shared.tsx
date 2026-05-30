import { useTranslation } from "react-i18next";
import type {
  DirectorAutoExecutionMode,
  DirectorAutoExecutionPlan,
  DirectorTakeoverExecutableRangeSnapshot,
  DirectorTakeoverStrategy,
} from "@ai-novel/shared/types/novelDirector";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";

export interface DirectorAutoExecutionDraftState {
  mode: DirectorAutoExecutionMode;
  startOrder: string;
  endOrder: string;
  volumeOrder: string;
  autoReview: boolean;
  autoRepair: boolean;
}

const DEFAULT_DIRECTOR_AUTO_EXECUTION_DRAFT: DirectorAutoExecutionDraftState = {
  mode: "chapter_range",
  startOrder: "1",
  endOrder: "10",
  volumeOrder: "1",
  autoReview: true,
  autoRepair: true,
};

type DirectorAutoExecutionPlanUsage = "new_book" | "takeover";

function getNewBookScopeOptions(t: (key: string) => string): Array<{
  value: DirectorAutoExecutionMode;
  label: string;
  description: string;
}> {
  return [
    { value: "book", label: t("novel:autoExecution.scope.book"), description: t("novel:autoExecution.scopeDesc.bookNew") },
    { value: "chapter_range", label: t("novel:autoExecution.scope.chapterRange"), description: t("novel:autoExecution.scopeDesc.chapterRangeNew") },
    { value: "volume", label: t("novel:autoExecution.scope.volume"), description: t("novel:autoExecution.scopeDesc.volumeNew") },
  ];
}

function getTakeoverScopeOptions(t: (key: string) => string): Array<{
  value: DirectorAutoExecutionMode;
  label: string;
  description: string;
}> {
  return [
    { value: "book", label: t("novel:autoExecution.scope.book"), description: t("novel:autoExecution.scopeDesc.bookTakeover") },
    { value: "chapter_range", label: t("novel:autoExecution.scope.chapterRangeTakeover"), description: t("novel:autoExecution.scopeDesc.chapterRangeTakeover") },
    { value: "volume", label: t("novel:autoExecution.scope.volumeTakeover"), description: t("novel:autoExecution.scopeDesc.volumeTakeover") },
  ];
}

function normalizePositiveInteger(value: string | number | undefined, fallback: number): number {
  const numericValue = typeof value === "number" ? value : Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(numericValue) || numericValue < 1) {
    return fallback;
  }
  return Math.max(1, Math.round(numericValue));
}

function clampChapterOrder(value: number, maxChapterCount?: number | null): number {
  if (!maxChapterCount || maxChapterCount < 1) {
    return Math.max(1, value);
  }
  return Math.min(Math.max(1, value), Math.max(1, Math.round(maxChapterCount)));
}

export function createDefaultDirectorAutoExecutionDraftState(
  usage: DirectorAutoExecutionPlanUsage = "new_book",
): DirectorAutoExecutionDraftState {
  return {
    ...DEFAULT_DIRECTOR_AUTO_EXECUTION_DRAFT,
    mode: usage === "takeover" ? "book" : DEFAULT_DIRECTOR_AUTO_EXECUTION_DRAFT.mode,
  };
}

export function normalizeDirectorAutoExecutionDraftState(
  plan: DirectorAutoExecutionPlan | null | undefined,
): DirectorAutoExecutionDraftState {
  if (plan?.mode === "book") {
    return {
      mode: "book",
      startOrder: DEFAULT_DIRECTOR_AUTO_EXECUTION_DRAFT.startOrder,
      endOrder: DEFAULT_DIRECTOR_AUTO_EXECUTION_DRAFT.endOrder,
      volumeOrder: DEFAULT_DIRECTOR_AUTO_EXECUTION_DRAFT.volumeOrder,
      autoReview: plan.autoReview ?? true,
      autoRepair: plan.autoReview === false ? false : (plan.autoRepair ?? true),
    };
  }
  if (plan?.mode === "chapter_range") {
    const startOrder = normalizePositiveInteger(plan.startOrder, 1);
    const endOrder = normalizePositiveInteger(plan.endOrder, Math.max(startOrder, 10));
    return {
      mode: "chapter_range",
      startOrder: String(startOrder),
      endOrder: String(Math.max(startOrder, endOrder)),
      volumeOrder: DEFAULT_DIRECTOR_AUTO_EXECUTION_DRAFT.volumeOrder,
      autoReview: plan.autoReview ?? true,
      autoRepair: plan.autoReview === false ? false : (plan.autoRepair ?? true),
    };
  }
  if (plan?.mode === "volume") {
    return {
      mode: "volume",
      startOrder: DEFAULT_DIRECTOR_AUTO_EXECUTION_DRAFT.startOrder,
      endOrder: DEFAULT_DIRECTOR_AUTO_EXECUTION_DRAFT.endOrder,
      volumeOrder: String(normalizePositiveInteger(plan.volumeOrder, 1)),
      autoReview: plan.autoReview ?? true,
      autoRepair: plan.autoReview === false ? false : (plan.autoRepair ?? true),
    };
  }
  return {
    ...createDefaultDirectorAutoExecutionDraftState(),
    endOrder: String(normalizePositiveInteger(plan?.endOrder, 10)),
    autoReview: plan?.autoReview ?? true,
    autoRepair: plan?.autoReview === false ? false : (plan?.autoRepair ?? true),
  };
}

export function buildDirectorAutoExecutionPlanFromDraft(
  draft: DirectorAutoExecutionDraftState,
  options?: {
    usage?: DirectorAutoExecutionPlanUsage;
    maxChapterCount?: number | null;
  },
): DirectorAutoExecutionPlan {
  if (draft.mode === "book") {
    return {
      mode: "book",
      autoReview: draft.autoReview,
      autoRepair: draft.autoReview ? draft.autoRepair : false,
    };
  }
  if (draft.mode === "chapter_range") {
    const startOrder = clampChapterOrder(normalizePositiveInteger(draft.startOrder, 1), options?.maxChapterCount);
    const endOrder = Math.max(
      startOrder,
      clampChapterOrder(normalizePositiveInteger(draft.endOrder, 10), options?.maxChapterCount),
    );
    return {
      mode: "chapter_range",
      startOrder,
      endOrder,
      autoReview: draft.autoReview,
      autoRepair: draft.autoReview ? draft.autoRepair : false,
    };
  }
  if (draft.mode === "volume") {
    return {
      mode: "volume",
      volumeOrder: options?.usage === "new_book" ? 1 : normalizePositiveInteger(draft.volumeOrder, 1),
      autoReview: draft.autoReview,
      autoRepair: draft.autoReview ? draft.autoRepair : false,
    };
  }
  const endOrder = clampChapterOrder(normalizePositiveInteger(draft.endOrder, 10), options?.maxChapterCount);
  return {
    mode: "chapter_range",
    startOrder: 1,
    endOrder,
    autoReview: draft.autoReview,
    autoRepair: draft.autoReview ? draft.autoRepair : false,
  };
}

export function buildDirectorAutoExecutionPlanLabel(
  plan: DirectorAutoExecutionPlan | null | undefined,
  t?: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (plan?.mode === "book") {
    return t ? t("novel:autoExecution.scope.book") : "全书";
  }
  if (plan?.mode === "chapter_range") {
    const startOrder = normalizePositiveInteger(plan.startOrder, 1);
    const endOrder = Math.max(startOrder, normalizePositiveInteger(plan.endOrder, startOrder));
    if (startOrder === endOrder) {
      return t ? t("novel:autoExecution.chapterLabel", { order: startOrder }) : `第 ${startOrder} 章`;
    }
    return t ? t("novel:autoExecution.chapterRangeLabel", { start: startOrder, end: endOrder }) : `第 ${startOrder}-${endOrder} 章`;
  }
  if (plan?.mode === "volume") {
    return t ? t("novel:autoExecution.volumeLabel", { order: normalizePositiveInteger(plan.volumeOrder, 1) }) : `第 ${normalizePositiveInteger(plan.volumeOrder, 1)} 卷`;
  }
  return t ? t("novel:autoExecution.chapterRangeLabel", { start: 1, end: normalizePositiveInteger(plan?.endOrder, 10) }) : `第 1-${normalizePositiveInteger(plan?.endOrder, 10)} 章`;
}

export function buildTakeoverAutoExecutionDraftFromExecutableRange(
  executableRange: DirectorTakeoverExecutableRangeSnapshot | null | undefined,
  strategy: DirectorTakeoverStrategy = "continue_existing",
): DirectorAutoExecutionDraftState | null {
  if (!executableRange) {
    return null;
  }
  const preferredStartOrder = strategy === "continue_existing"
    ? executableRange.nextChapterOrder ?? executableRange.startOrder
    : executableRange.startOrder;
  const startOrder = Math.max(1, Math.round(preferredStartOrder));
  const endOrder = Math.max(startOrder, Math.round(executableRange.endOrder));
  return {
    ...createDefaultDirectorAutoExecutionDraftState("takeover"),
    mode: "chapter_range",
    startOrder: String(startOrder),
    endOrder: String(endOrder),
  };
}

interface DirectorAutoExecutionPlanFieldsProps {
  draft: DirectorAutoExecutionDraftState;
  onChange: (patch: Partial<DirectorAutoExecutionDraftState>) => void;
  usage?: DirectorAutoExecutionPlanUsage;
  maxChapterCount?: number | null;
}

export function DirectorAutoExecutionPlanFields({
  draft,
  onChange,
  usage = "new_book",
  maxChapterCount,
}: DirectorAutoExecutionPlanFieldsProps) {
  const { t } = useTranslation();
  const plan = buildDirectorAutoExecutionPlanFromDraft(draft, { usage, maxChapterCount });
  const scopeLabel = buildDirectorAutoExecutionPlanLabel(plan, t);
  const scopeOptions = usage === "takeover" ? getTakeoverScopeOptions(t) : getNewBookScopeOptions(t);
  const canEditChapterCount = usage === "new_book" && draft.mode === "chapter_range";
  const canEditChapterRange = usage === "takeover" && draft.mode === "chapter_range";
  const canEditVolumeOrder = usage === "takeover" && draft.mode === "volume";
  const reviewLabel = draft.autoReview
    ? draft.autoRepair
      ? t("novel:autoExecution.reviewLabel.autoReviewAndRepair")
      : t("novel:autoExecution.reviewLabel.autoReviewOnly")
    : t("novel:autoExecution.reviewLabel.noAutoReview");

  return (
    <div className="mt-3 min-w-0 rounded-md border border-primary/15 bg-primary/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-medium text-foreground">{t("novel:autoExecution.scopeTitle")}</div>
        <div className={`text-xs text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{t("novel:autoExecution.willExecute")}：{scopeLabel}</div>
      </div>

      <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-3">
        {scopeOptions.map((option) => {
          const active = option.value === draft.mode;
          return (
            <button
              key={option.value}
              type="button"
              className={`rounded-xl border px-3 py-3 text-left transition ${
                active
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-background hover:border-primary/40"
              }`}
              onClick={() => onChange({ mode: option.value })}
            >
              <div className="text-sm font-medium text-foreground">{option.label}</div>
              <div className={`mt-1 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{option.description}</div>
            </button>
          );
        })}
      </div>

      {canEditChapterCount ? (
        <div className="mt-4 max-w-xs">
          <div className="text-xs font-medium text-foreground">{t("novel:autoExecution.chapterCount")}</div>
          <Input
            className="mt-2"
            type="number"
            min={1}
            max={maxChapterCount ?? undefined}
            value={draft.endOrder}
            onChange={(event) => onChange({ endOrder: event.target.value })}
            placeholder={t("novel:autoExecution.chapterCountPlaceholder")}
          />
          {maxChapterCount ? (
            <div className="mt-1 text-xs text-muted-foreground">{t("novel:autoExecution.maxChapterHint", { count: maxChapterCount })}</div>
          ) : null}
        </div>
      ) : null}

      {canEditChapterRange ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-foreground">{t("novel:autoExecution.startChapter")}</div>
            <Input
              className="mt-2"
              type="number"
              min={1}
              max={maxChapterCount ?? undefined}
              value={draft.startOrder}
              onChange={(event) => onChange({ startOrder: event.target.value })}
              placeholder={t("novel:autoExecution.startChapterPlaceholder")}
            />
          </div>
          <div>
            <div className="text-xs font-medium text-foreground">{t("novel:autoExecution.endChapter")}</div>
            <Input
              className="mt-2"
              type="number"
              min={1}
              max={maxChapterCount ?? undefined}
              value={draft.endOrder}
              onChange={(event) => onChange({ endOrder: event.target.value })}
              placeholder={t("novel:autoExecution.endChapterPlaceholder")}
            />
          </div>
        </div>
      ) : null}

      {canEditVolumeOrder ? (
        <div className="mt-4 max-w-xs">
          <div className="text-xs font-medium text-foreground">{t("novel:autoExecution.volumeOrder")}</div>
          <Input
            className="mt-2"
            type="number"
            min={1}
            value={draft.volumeOrder}
            onChange={(event) => onChange({ volumeOrder: event.target.value })}
            placeholder={t("novel:autoExecution.volumeOrderPlaceholder")}
          />
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border bg-background/80 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="text-sm font-medium text-foreground">{t("novel:autoExecution.autoReviewLabel")}</div>
            <div className={`text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
              {t("novel:autoExecution.autoReviewHint")}
            </div>
          </div>
          <Switch
            checked={draft.autoReview}
            onCheckedChange={(checked) => onChange({
              autoReview: checked,
              autoRepair: checked ? draft.autoRepair : false,
            })}
            aria-label={t("novel:autoExecution.autoReviewAriaLabel")}
          />
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="text-sm font-medium text-foreground">{t("novel:autoExecution.autoRepairLabel")}</div>
            <div className={`text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
              {t("novel:autoExecution.autoRepairHint")}
            </div>
          </div>
          <Switch
            checked={draft.autoReview && draft.autoRepair}
            disabled={!draft.autoReview}
            onCheckedChange={(checked) => onChange({ autoRepair: checked })}
            aria-label={t("novel:autoExecution.autoRepairAriaLabel")}
          />
        </div>
      </div>

      <div className={`mt-3 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
        {t("novel:autoExecution.systemNote")}
        {t("novel:autoExecution.currentQualityPolicy")}：{reviewLabel}。
      </div>
    </div>
  );
}

