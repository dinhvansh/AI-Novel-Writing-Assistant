import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CreativeHubProductionStatus } from "@ai-novel/shared/types/creativeHub";
import { getNovelDetail, updateNovel } from "@/api/novel";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

interface NovelProductionStarterCardProps {
  currentNovelTitle?: string | null;
  currentNovelId?: string | null;
  productionStatus?: CreativeHubProductionStatus | null;
  onSubmit: (prompt: string) => void;
  onQuickAction?: (prompt: string) => void;
}

// Internal enum values — kept in Chinese to match DB/API contracts
// i18n-ignore: these are internal enum keys, not UI display text
// i18n-ignore: internal enum values used for API/DB mapping — not UI display text
const POV_VALUES = {
  first_person: "第一人称",
  third_person: "第三人称",
  mixed: "混合视角",
} as const;

// i18n-ignore: internal enum values used for API/DB mapping — not UI display text
const PACE_VALUES = {
  slow: "慢节奏",
  balanced: "均衡节奏",
  fast: "快节奏",
} as const;

// i18n-ignore: internal enum values used for API/DB mapping — not UI display text
const PROJECT_MODE_VALUES = {
  ai_led: "AI 主导",
  co_pilot: "人机协作",
  draft_mode: "草稿优先",
  auto_pipeline: "自动流水线",
} as const;

// i18n-ignore: internal enum values used for API/DB mapping — not UI display text
const LEVEL_VALUES = {
  low: "低",
  medium: "中",
  high: "高",
} as const;

function fromNarrativePov(value: "first_person" | "third_person" | "mixed" | null | undefined): string {
  return POV_VALUES[value as keyof typeof POV_VALUES] ?? "";
}

function toNarrativePov(value: string): "first_person" | "third_person" | "mixed" | null {
  const entry = Object.entries(POV_VALUES).find(([, v]) => v === value);
  return entry ? entry[0] as "first_person" | "third_person" | "mixed" : null;
}

function fromPacePreference(value: "slow" | "balanced" | "fast" | null | undefined): string {
  return PACE_VALUES[value as keyof typeof PACE_VALUES] ?? "";
}

function toPacePreference(value: string): "slow" | "balanced" | "fast" | null {
  const entry = Object.entries(PACE_VALUES).find(([, v]) => v === value);
  return entry ? entry[0] as "slow" | "balanced" | "fast" : null;
}

function fromProjectMode(value: "ai_led" | "co_pilot" | "draft_mode" | "auto_pipeline" | null | undefined): string {
  return PROJECT_MODE_VALUES[value as keyof typeof PROJECT_MODE_VALUES] ?? "";
}

function toProjectMode(value: string): "ai_led" | "co_pilot" | "draft_mode" | "auto_pipeline" | null {
  const entry = Object.entries(PROJECT_MODE_VALUES).find(([, v]) => v === value);
  return entry ? entry[0] as "ai_led" | "co_pilot" | "draft_mode" | "auto_pipeline" : null;
}

function fromLevel(value: "low" | "medium" | "high" | null | undefined): string {
  return LEVEL_VALUES[value as keyof typeof LEVEL_VALUES] ?? "";
}

function toLevel(value: string): "low" | "medium" | "high" | null {
  const entry = Object.entries(LEVEL_VALUES).find(([, v]) => v === value);
  return entry ? entry[0] as "low" | "medium" | "high" : null;
}

function buildProductionPrompt(input: {
  currentNovelId?: string | null;
  title: string;
  description: string;
  targetChapterCount: number;
  genre: string;
  styleTone: string;
  narrativePov: string;
  pacePreference: string;
  projectMode: string;
  emotionIntensity: string;
  aiFreedom: string;
  defaultChapterLength: number;
  worldType: string;
}) {
  // Prompts are sent to AI in Chinese — i18n-ignore: AI prompt content
  const description = input.description.trim();
  const genre = input.genre.trim();
  const styleTone = input.styleTone.trim();
  const narrativePov = input.narrativePov.trim();
  const pacePreference = input.pacePreference.trim();
  const projectMode = input.projectMode.trim();
  const emotionIntensity = input.emotionIntensity.trim();
  const aiFreedom = input.aiFreedom.trim();
  const defaultChapterLength = Math.max(500, Math.min(10000, Math.floor(input.defaultChapterLength || 2500)));
  const worldType = input.worldType.trim();
  const targetChapterCount = Math.max(1, Math.min(200, Math.floor(input.targetChapterCount || 20)));
  if (input.currentNovelId) {
    // i18n-ignore: AI prompt content — these strings are sent to the AI model in Chinese
    const segments = [`继续生成当前小说。目标章节数：${targetChapterCount}。`];
    if (description) segments.push(`补充设定：${description}。`); // i18n-ignore: AI prompt
    if (genre) segments.push(`题材偏好：${genre}。`); // i18n-ignore: AI prompt
    if (styleTone) segments.push(`风格基调：${styleTone}。`); // i18n-ignore: AI prompt
    if (narrativePov) segments.push(`叙事视角：${narrativePov}。`); // i18n-ignore: AI prompt
    if (pacePreference) segments.push(`推进节奏：${pacePreference}。`); // i18n-ignore: AI prompt
    if (projectMode) segments.push(`协作模式：${projectMode}。`); // i18n-ignore: AI prompt
    if (emotionIntensity) segments.push(`情绪强度：${emotionIntensity}。`); // i18n-ignore: AI prompt
    if (aiFreedom) segments.push(`AI 自由度：${aiFreedom}。`); // i18n-ignore: AI prompt
    if (defaultChapterLength) segments.push(`默认章长：约 ${defaultChapterLength} 字。`); // i18n-ignore: AI prompt
    if (worldType) segments.push(`世界观类型偏好：${worldType}。`); // i18n-ignore: AI prompt
    return segments.join("");
  }
  const title = input.title.trim();
  // i18n-ignore: AI prompt content — these strings are sent to the AI model in Chinese
  const segments = [`创建一本${targetChapterCount}章小说《${title}》，并开始整本生成。`];
  if (description) segments.push(`简介：${description}。`); // i18n-ignore: AI prompt
  if (genre) segments.push(`题材：${genre}。`); // i18n-ignore: AI prompt
  if (styleTone) segments.push(`风格基调：${styleTone}。`); // i18n-ignore: AI prompt
  if (narrativePov) segments.push(`叙事视角：${narrativePov}。`); // i18n-ignore: AI prompt
  if (pacePreference) segments.push(`推进节奏：${pacePreference}。`); // i18n-ignore: AI prompt
  if (projectMode) segments.push(`协作模式：${projectMode}。`); // i18n-ignore: AI prompt
  if (emotionIntensity) segments.push(`情绪强度：${emotionIntensity}。`); // i18n-ignore: AI prompt
  if (aiFreedom) segments.push(`AI 自由度：${aiFreedom}。`); // i18n-ignore: AI prompt
  if (defaultChapterLength) segments.push(`默认章长：约 ${defaultChapterLength} 字。`); // i18n-ignore: AI prompt
  if (worldType) segments.push(`世界观类型：${worldType}。`); // i18n-ignore: AI prompt
  return segments.join("");
}

export default function NovelProductionStarterCard({
  currentNovelTitle,
  currentNovelId,
  productionStatus,
  onSubmit,
  onQuickAction,
}: NovelProductionStarterCardProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetChapterCount, setTargetChapterCount] = useState(20);
  const [genre, setGenre] = useState("");
  const [styleTone, setStyleTone] = useState("");
  const [narrativePov, setNarrativePov] = useState("");
  const [pacePreference, setPacePreference] = useState("");
  const [projectMode, setProjectMode] = useState("");
  const [emotionIntensity, setEmotionIntensity] = useState("");
  const [aiFreedom, setAiFreedom] = useState("");
  const [defaultChapterLength, setDefaultChapterLength] = useState(2500);
  const [worldType, setWorldType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productionStatus?.targetChapterCount) {
      setTargetChapterCount(productionStatus.targetChapterCount);
    }
  }, [productionStatus?.targetChapterCount]);

  useEffect(() => {
    let cancelled = false;
    if (!currentNovelId) {
      return () => { cancelled = true; };
    }
    void getNovelDetail(currentNovelId)
      .then((response) => {
        if (cancelled) return;
        const novel = response.data;
        if (!novel) return;
        setDescription(novel.description ?? "");
        setGenre(novel.genre?.name ?? "");
        setStyleTone(novel.styleTone ?? "");
        setNarrativePov(fromNarrativePov(novel.narrativePov));
        setPacePreference(fromPacePreference(novel.pacePreference));
        setProjectMode(fromProjectMode(novel.projectMode));
        setEmotionIntensity(fromLevel(novel.emotionIntensity));
        setAiFreedom(fromLevel(novel.aiFreedom));
        setDefaultChapterLength(novel.defaultChapterLength ?? 2500);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [currentNovelId]);

  const resolvedTitle = currentNovelTitle?.trim() || "";
  const isContinueMode = Boolean(currentNovelId);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 text-xs font-medium text-slate-500">{t("creativeHub:starter.title")}</div>
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {isContinueMode
            ? t("creativeHub:starter.continueMode", { title: resolvedTitle || t("creativeHub:starter.currentNovel") })
            : t("creativeHub:starter.createMode")}
        </div>
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
          {t("creativeHub:starter.hint")}
        </div>
        {!isContinueMode ? (
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            placeholder={t("creativeHub:starter.titlePlaceholder")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        ) : null}
        <textarea
          className="min-h-[88px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
          placeholder={t("creativeHub:starter.descriptionPlaceholder")}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            placeholder={t("creativeHub:starter.genrePlaceholder")}
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            placeholder={t("creativeHub:starter.styleTonePlaceholder")}
            value={styleTone}
            onChange={(event) => setStyleTone(event.target.value)}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            value={narrativePov}
            onChange={(event) => setNarrativePov(event.target.value)}
          >
            <option value="">{t("creativeHub:starter.narrativePov")}</option>
            <option value={POV_VALUES.first_person}>{t("creativeHub:starter.pov.firstPerson")}</option>
            <option value={POV_VALUES.third_person}>{t("creativeHub:starter.pov.thirdPerson")}</option>
            <option value={POV_VALUES.mixed}>{t("creativeHub:starter.pov.mixed")}</option>
          </select>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            value={pacePreference}
            onChange={(event) => setPacePreference(event.target.value)}
          >
            <option value="">{t("creativeHub:starter.pacePreference")}</option>
            <option value={PACE_VALUES.slow}>{t("creativeHub:starter.pace.slow")}</option>
            <option value={PACE_VALUES.balanced}>{t("creativeHub:starter.pace.balanced")}</option>
            <option value={PACE_VALUES.fast}>{t("creativeHub:starter.pace.fast")}</option>
          </select>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            value={projectMode}
            onChange={(event) => setProjectMode(event.target.value)}
          >
            <option value="">{t("creativeHub:starter.projectMode")}</option>
            <option value={PROJECT_MODE_VALUES.ai_led}>{t("creativeHub:starter.mode.aiLed")}</option>
            <option value={PROJECT_MODE_VALUES.co_pilot}>{t("creativeHub:starter.mode.coPilot")}</option>
            <option value={PROJECT_MODE_VALUES.draft_mode}>{t("creativeHub:starter.mode.draftMode")}</option>
            <option value={PROJECT_MODE_VALUES.auto_pipeline}>{t("creativeHub:starter.mode.autoPipeline")}</option>
          </select>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            value={emotionIntensity}
            onChange={(event) => setEmotionIntensity(event.target.value)}
          >
            <option value="">{t("creativeHub:starter.emotionIntensity")}</option>
            <option value={LEVEL_VALUES.low}>{t("creativeHub:starter.level.low")}</option>
            <option value={LEVEL_VALUES.medium}>{t("creativeHub:starter.level.medium")}</option>
            <option value={LEVEL_VALUES.high}>{t("creativeHub:starter.level.high")}</option>
          </select>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            value={aiFreedom}
            onChange={(event) => setAiFreedom(event.target.value)}
          >
            <option value="">{t("creativeHub:starter.aiFreedom")}</option>
            <option value={LEVEL_VALUES.low}>{t("creativeHub:starter.level.low")}</option>
            <option value={LEVEL_VALUES.medium}>{t("creativeHub:starter.level.medium")}</option>
            <option value={LEVEL_VALUES.high}>{t("creativeHub:starter.level.high")}</option>
          </select>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            placeholder={t("creativeHub:starter.targetChapterCount")}
            type="number"
            min={1}
            max={200}
            value={targetChapterCount}
            onChange={(event) => setTargetChapterCount(Number(event.target.value || 20))}
          />
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            placeholder={t("creativeHub:starter.defaultChapterLength")}
            type="number"
            min={500}
            max={10000}
            value={defaultChapterLength}
            onChange={(event) => setDefaultChapterLength(Number(event.target.value || 2500))}
          />
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            placeholder={t("creativeHub:starter.worldTypePlaceholder")}
            value={worldType}
            onChange={(event) => setWorldType(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              if (!isContinueMode && !title.trim()) return;
              setIsSubmitting(true);
              try {
                if (currentNovelId) {
                  await updateNovel(currentNovelId, {
                    ...(description.trim() ? { description: description.trim() } : {}),
                    ...(styleTone.trim() ? { styleTone: styleTone.trim() } : {}),
                    ...(toNarrativePov(narrativePov) ? { narrativePov: toNarrativePov(narrativePov) } : {}),
                    ...(toPacePreference(pacePreference) ? { pacePreference: toPacePreference(pacePreference) } : {}),
                    ...(toProjectMode(projectMode) ? { projectMode: toProjectMode(projectMode) } : {}),
                    ...(toLevel(emotionIntensity) ? { emotionIntensity: toLevel(emotionIntensity) } : {}),
                    ...(toLevel(aiFreedom) ? { aiFreedom: toLevel(aiFreedom) } : {}),
                    ...(defaultChapterLength ? { defaultChapterLength: Math.max(500, Math.min(10000, defaultChapterLength)) } : {}),
                  });
                }
                onSubmit(buildProductionPrompt({
                  currentNovelId,
                  title,
                  description,
                  targetChapterCount,
                  genre,
                  styleTone,
                  narrativePov,
                  pacePreference,
                  projectMode,
                  emotionIntensity,
                  aiFreedom,
                  defaultChapterLength,
                  worldType,
                }));
              } catch (error) {
                toast.error(error instanceof Error ? error.message : t("creativeHub:starter.saveError"));
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting ? t("creativeHub:starter.processing") : isContinueMode ? t("creativeHub:starter.continueButton") : t("creativeHub:starter.startButton")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onQuickAction?.(t("creativeHub:starter.viewProgressPrompt"))}
          >
            {t("creativeHub:starter.viewProgress")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onQuickAction?.(t("creativeHub:starter.viewBlockerPrompt"))}
          >
            {t("creativeHub:starter.viewBlocker")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onQuickAction?.(t("creativeHub:starter.generateAlternativesPrompt"))}
          >
            {t("creativeHub:starter.generateAlternatives")}
          </Button>
        </div>
      </div>
    </div>
  );
}
