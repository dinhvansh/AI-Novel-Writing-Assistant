import type { TFunction } from "i18next";

const INTENT_LABEL_KEYS: Record<string, string> = {
  social_opening: "creativeHub:planner.intent.socialOpening",
  list_novels: "creativeHub:planner.intent.listNovels",
  list_worlds: "creativeHub:planner.intent.listWorlds",
  query_task_status: "creativeHub:planner.intent.queryTaskStatus",
  create_novel: "creativeHub:planner.intent.createNovel",
  select_novel_workspace: "creativeHub:planner.intent.selectNovelWorkspace",
  bind_world_to_novel: "creativeHub:planner.intent.bindWorldToNovel",
  unbind_world_from_novel: "creativeHub:planner.intent.unbindWorldFromNovel",
  produce_novel: "creativeHub:planner.intent.produceNovel",
  query_novel_production_status: "creativeHub:planner.intent.queryNovelProductionStatus",
  query_novel_title: "creativeHub:planner.intent.queryNovelTitle",
  query_chapter_content: "creativeHub:planner.intent.queryChapterContent",
  query_progress: "creativeHub:planner.intent.queryProgress",
  inspect_failure_reason: "creativeHub:planner.intent.inspectFailureReason",
  write_chapter: "creativeHub:planner.intent.writeChapter",
  rewrite_chapter: "creativeHub:planner.intent.rewriteChapter",
  save_chapter_draft: "creativeHub:planner.intent.saveChapterDraft",
  start_pipeline: "creativeHub:planner.intent.startPipeline",
  inspect_characters: "creativeHub:planner.intent.inspectCharacters",
  inspect_timeline: "creativeHub:planner.intent.inspectTimeline",
  inspect_world: "creativeHub:planner.intent.inspectWorld",
  search_knowledge: "creativeHub:planner.intent.searchKnowledge",
  ideate_novel_setup: "creativeHub:planner.intent.ideateNovelSetup",
  general_chat: "creativeHub:planner.intent.generalChat",
  unknown: "creativeHub:planner.intent.unknown",
};

const PLANNER_SOURCE_LABEL_KEYS: Record<string, string> = {
  llm: "creativeHub:planner.source.llm",
  unknown: "creativeHub:planner.source.unknown",
};

function formatBilingualLabel(label: string, rawValue: string) {
  return `${label}（${rawValue}）`;
}

export function getIntentDisplayLabel(intent: unknown, t?: TFunction): string {
  const _t = t ?? ((key: string) => key);
  const rawValue = typeof intent === "string" && intent.trim() ? intent.trim() : "unknown";
  const labelKey = INTENT_LABEL_KEYS[rawValue];
  const label = labelKey ? _t(labelKey) : _t("creativeHub:planner.intent.unmapped");
  return formatBilingualLabel(label, rawValue);
}

export function getPlannerSourceDisplayLabel(source: unknown, t?: TFunction): string {
  const _t = t ?? ((key: string) => key);
  const rawValue = typeof source === "string" && source.trim() ? source.trim() : "unknown";
  const labelKey = PLANNER_SOURCE_LABEL_KEYS[rawValue];
  const label = labelKey ? _t(labelKey) : _t("creativeHub:planner.source.unmapped");
  return formatBilingualLabel(label, rawValue);
}
