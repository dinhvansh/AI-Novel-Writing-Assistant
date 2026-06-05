import type {
  NovelWorkflowCheckpoint,
  NovelWorkflowLane,
  NovelWorkflowMilestone,
  NovelWorkflowMilestoneType,
  NovelWorkflowResumeTarget,
  NovelWorkflowStage,
} from "@ai-novel/shared/types/novelWorkflow";
import type { LocaleCode } from "@ai-novel/shared/localization";
import { DEFAULT_LOCALE } from "@ai-novel/shared/localization";
import { getI18nServerHandle } from "../../../i18n";
import { getCurrentRequestLocale } from "../../../runtime/requestLocaleContext";

export const NOVEL_WORKFLOW_STAGE_LABELS: Record<NovelWorkflowStage, string> = {
  project_setup: "Thiết lập dự án",
  auto_director: "Đạo diễn AI",
  story_macro: "Hoạch định tổng thể câu chuyện",
  character_setup: "Chuẩn bị nhân vật",
  volume_strategy: "Chiến lược tập / khung tập",
  structured_outline: "Nhịp độ / tách chương",
  chapter_execution: "Thực thi chương",
  quality_repair: "Sửa chất lượng",
};

/**
 * Get a localized stage label. Falls back to the default Vietnamese label
 * when the i18n handle is not available or the key is missing.
 */
export function getWorkflowStageLabel(stage: NovelWorkflowStage, locale: LocaleCode = DEFAULT_LOCALE): string {
  const handle = getI18nServerHandle();
  if (handle) {
    const result = handle.t("serverLogs", `workflowStages.${stage}`, { lng: locale });
    if (typeof result === "string" && result !== `serverLogs:workflowStages.${stage}`) {
      return result;
    }
  }
  return NOVEL_WORKFLOW_STAGE_LABELS[stage] ?? stage;
}

export const NOVEL_WORKFLOW_STAGE_PROGRESS: Record<NovelWorkflowStage, number> = {
  project_setup: 0.08,
  auto_director: 0.15,
  story_macro: 0.26,
  character_setup: 0.34,
  volume_strategy: 0.5,
  structured_outline: 0.68,
  chapter_execution: 0.84,
  quality_repair: 0.94,
};

export const NOVEL_WORKFLOW_STAGE_STEPS = [
  { key: "project_setup", label: "Thiết lập dự án" },
  { key: "auto_director", label: "Đạo diễn AI" },
  { key: "story_macro", label: "Hoạch định tổng thể câu chuyện" },
  { key: "character_setup", label: "Chuẩn bị nhân vật" },
  { key: "volume_strategy", label: "Chiến lược tập / khung tập" },
  { key: "structured_outline", label: "Nhịp độ / tách chương" },
  { key: "chapter_execution", label: "Thực thi chương" },
  { key: "quality_repair", label: "Sửa chất lượng" },
] as const;

export function buildNovelCreateResumeTarget(taskId: string, mode: "director" | null = null): NovelWorkflowResumeTarget {
  return {
    route: "/novels/create",
    taskId,
    mode,
  };
}

export function buildNovelEditResumeTarget(params: {
  novelId: string;
  taskId?: string | null;
  lane?: NovelWorkflowResumeTarget["lane"];
  stage: NovelWorkflowResumeTarget["stage"];
  chapterId?: string | null;
  volumeId?: string | null;
}): NovelWorkflowResumeTarget {
  return {
    route: "/novels/:id/edit",
    novelId: params.novelId,
    taskId: params.taskId ?? null,
    lane: params.lane ?? null,
    stage: params.stage,
    chapterId: params.chapterId ?? null,
    volumeId: params.volumeId ?? null,
  };
}

export function resumeTargetToRoute(target: NovelWorkflowResumeTarget | null | undefined): string {
  if (!target) {
    return "/tasks";
  }
  if (target.route === "/novels/create") {
    const searchParams = new URLSearchParams();
    if (target.taskId) {
      searchParams.set("workflowTaskId", target.taskId);
    }
    if (target.mode) {
      searchParams.set("mode", target.mode);
    }
    const query = searchParams.toString();
    return query ? `/novels/create?${query}` : "/novels/create";
  }

  if (!target.novelId) {
    return "/tasks";
  }

  const searchParams = new URLSearchParams();
  if (target.stage) {
    searchParams.set("stage", target.stage);
  }
  if (target.taskId) {
    if (target.lane === "manual_create") {
      searchParams.set("workspaceTaskId", target.taskId);
    } else {
      searchParams.set("directorTaskId", target.taskId);
    }
  }
  if (target.chapterId) {
    searchParams.set("chapterId", target.chapterId);
  }
  if (target.volumeId) {
    searchParams.set("volumeId", target.volumeId);
  }
  const query = searchParams.toString();
  return query ? `/novels/${target.novelId}/edit?${query}` : `/novels/${target.novelId}/edit`;
}

export function parseMilestones(value: string | null | undefined): NovelWorkflowMilestone[] {
  if (!value?.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is NovelWorkflowMilestone => (
        Boolean(item)
        && typeof item === "object"
        && typeof (item as NovelWorkflowMilestone).checkpointType === "string"
        && typeof (item as NovelWorkflowMilestone).summary === "string"
        && typeof (item as NovelWorkflowMilestone).createdAt === "string"
      ));
  } catch {
    return [];
  }
}

export function appendMilestone(
  existing: string | null | undefined,
  checkpointType: NovelWorkflowMilestoneType,
  summary: string,
): string {
  const next = [
    ...parseMilestones(existing).filter((item) => item.checkpointType !== checkpointType),
    {
      checkpointType,
      summary,
      createdAt: new Date().toISOString(),
    },
  ];
  return JSON.stringify(next);
}

export function parseResumeTarget(value: string | null | undefined): NovelWorkflowResumeTarget | null {
  if (!value?.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as NovelWorkflowResumeTarget;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function stringifyResumeTarget(value: NovelWorkflowResumeTarget | null | undefined): string | null {
  return value ? JSON.stringify(value) : null;
}

export function parseSeedPayload<T>(value: string | null | undefined): T | null {
  if (!value?.trim()) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function mergeSeedPayload<T extends Record<string, unknown>>(
  existing: string | null | undefined,
  patch: Partial<T>,
): string {
  const current = parseSeedPayload<T>(existing) ?? {} as T;
  return JSON.stringify({
    ...current,
    ...patch,
  });
}

export function defaultWorkflowTitle(input: {
  lane: NovelWorkflowLane;
  title?: string | null;
  novelTitle?: string | null;
}): string {
  const novelTitle = input.novelTitle?.trim() || input.title?.trim();
  if (novelTitle) {
    return novelTitle;
  }
  const handle = getI18nServerHandle();
  const locale = getCurrentRequestLocale() ?? DEFAULT_LOCALE;
  if (handle) {
    const key = input.lane === "auto_director" ? "taskTitles.autoDirectorDefault" : "taskTitles.manualDefault";
    const result = handle.t("serverLogs", key, { lng: locale });
    if (result && result !== `serverLogs:${key}`) return result;
  }
  // i18n-ignore: fallback
  return input.lane === "auto_director" ? "AI \u81ea\u52a8\u5bfc\u6f14\u5c0f\u8bf4" : "\u5c0f\u8bf4\u6d41\u7a0b\u4efb\u52a1";
}
