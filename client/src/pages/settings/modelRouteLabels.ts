import type { ModelRouteTaskType } from "@ai-novel/shared/types/novel";
import { useTranslation } from "react-i18next";

export interface ModelRouteLabel {
  title: string;
  description: string;
}

const TASK_TYPE_KEY_MAP: Record<ModelRouteTaskType, string> = {
  planner: "planner",
  writer: "writer",
  review: "review",
  light_review: "lightReview",
  critical_review: "criticalReview",
  repair: "repair",
  replan: "replan",
  state_resolution: "stateResolution",
  summary: "summary",
  fact_extraction: "factExtraction",
  chat: "chat",
};

export function useModelRouteLabels(): Record<ModelRouteTaskType, ModelRouteLabel> {
  const { t } = useTranslation();
  const out = {} as Record<ModelRouteTaskType, ModelRouteLabel>;
  for (const [taskType, keySuffix] of Object.entries(TASK_TYPE_KEY_MAP) as [ModelRouteTaskType, string][]) {
    out[taskType] = {
      title: t(`settings:modelRoutes.labels.${keySuffix}.title`),
      description: t(`settings:modelRoutes.labels.${keySuffix}.description`),
    };
  }
  return out;
}
