import type { TFunction } from "i18next";

export type MobilePrimaryNavKey = "home" | "novels" | "creation" | "tasks" | "more";

export interface MobileNavItem {
  key: string;
  label: string;
  to: string;
  group: MobilePrimaryNavKey;
}

export interface MobileNavGroup {
  title: string;
  items: MobileNavItem[];
}

export interface MobileRoutePattern {
  key: string;
  pattern: RegExp;
  title: string;
  group: MobilePrimaryNavKey;
}

export function getMobileRoutePatterns(t: TFunction): MobileRoutePattern[] {
  return [
    { key: "home", pattern: /^\/$/, title: t("settings:navigation.items.home"), group: "home" },
    { key: "help", pattern: /^\/help\/?$/, title: t("settings:navigation.items.help"), group: "more" },
    { key: "novels", pattern: /^\/novels\/?$/, title: t("settings:navigation.items.novels"), group: "novels" },
    { key: "novel-create", pattern: /^\/novels\/create\/?$/, title: t("novel:create.title"), group: "novels" },
    { key: "novel-preview", pattern: /^\/novels\/[^/]+\/preview\/?$/, title: t("novel:workspace.tabs.chapter"), group: "novels" },
    { key: "novel-edit", pattern: /^\/novels\/[^/]+\/edit\/?$/, title: t("novel:workspace.unnamedNovel"), group: "novels" },
    { key: "chapter-edit", pattern: /^\/novels\/[^/]+\/chapters\/[^/]+\/?$/, title: t("novel:workspace.tabs.chapter"), group: "novels" },
    { key: "creative-hub", pattern: /^\/creative-hub\/?$/, title: t("settings:navigation.items.creativeHub"), group: "creation" },
    { key: "chat-legacy", pattern: /^\/chat-legacy\/?$/, title: t("mobile:nav.chatLegacy"), group: "creation" },
    { key: "book-analysis", pattern: /^\/book-analysis\/?$/, title: t("settings:navigation.items.bookAnalysis"), group: "creation" },
    { key: "tasks", pattern: /^\/tasks\/?$/, title: t("settings:navigation.items.tasks"), group: "tasks" },
    { key: "auto-director-follow-ups", pattern: /^\/auto-director\/follow-ups\/?$/, title: t("settings:navigation.items.autoDirectorFollowUps"), group: "tasks" },
    { key: "knowledge", pattern: /^\/knowledge\/?$/, title: t("settings:navigation.items.knowledge"), group: "more" },
    { key: "genres", pattern: /^\/genres\/?$/, title: t("settings:navigation.items.genres"), group: "more" },
    { key: "story-modes", pattern: /^\/story-modes\/?$/, title: t("settings:navigation.items.storyModes"), group: "more" },
    { key: "titles", pattern: /^\/titles\/?$/, title: t("settings:navigation.items.titles"), group: "more" },
    { key: "prompt-workbench", pattern: /^\/prompt-workbench\/?$/, title: t("settings:navigation.items.promptWorkbench"), group: "more" },
    { key: "model-routes", pattern: /^\/settings\/model-routes\/?$/, title: t("settings:navigation.items.modelRoutes"), group: "more" },
    { key: "settings", pattern: /^\/settings\/?$/, title: t("settings:navigation.items.settings"), group: "more" },
    { key: "worlds", pattern: /^\/worlds\/?$/, title: t("settings:navigation.items.worlds"), group: "more" },
    { key: "world-generator", pattern: /^\/worlds\/generator\/?$/, title: t("mobile:nav.worldGenerator"), group: "more" },
    { key: "world-workspace", pattern: /^\/worlds\/[^/]+\/workspace\/?$/, title: t("mobile:nav.worldWorkspace"), group: "more" },
    { key: "style-engine", pattern: /^\/style-engine\/?$/, title: t("settings:navigation.items.styleEngine"), group: "more" },
    { key: "anti-ai-rules", pattern: /^\/anti-ai-rules\/?$/, title: t("settings:navigation.items.antiAiRules"), group: "more" },
    { key: "base-characters", pattern: /^\/base-characters\/?$/, title: t("settings:navigation.items.baseCharacters"), group: "more" },
  ];
}

/** @deprecated Use getMobileRoutePatterns(t) instead */
export const MOBILE_ROUTE_PATTERNS: MobileRoutePattern[] = [
  { key: "home", pattern: /^\/$/, title: "首页", group: "home" }, // i18n-ignore: deprecated fallback
  { key: "help", pattern: /^\/help\/?$/, title: "新手上路", group: "more" }, // i18n-ignore
  { key: "novels", pattern: /^\/novels\/?$/, title: "小说", group: "novels" }, // i18n-ignore
  { key: "novel-create", pattern: /^\/novels\/create\/?$/, title: "创建小说", group: "novels" }, // i18n-ignore
  { key: "novel-preview", pattern: /^\/novels\/[^/]+\/preview\/?$/, title: "小说预览", group: "novels" }, // i18n-ignore
  { key: "novel-edit", pattern: /^\/novels\/[^/]+\/edit\/?$/, title: "小说工作区", group: "novels" }, // i18n-ignore
  { key: "chapter-edit", pattern: /^\/novels\/[^/]+\/chapters\/[^/]+\/?$/, title: "章节正文", group: "novels" }, // i18n-ignore
  { key: "creative-hub", pattern: /^\/creative-hub\/?$/, title: "创作中枢", group: "creation" }, // i18n-ignore
  { key: "chat-legacy", pattern: /^\/chat-legacy\/?$/, title: "旧版聊天", group: "creation" }, // i18n-ignore
  { key: "book-analysis", pattern: /^\/book-analysis\/?$/, title: "拆书", group: "creation" }, // i18n-ignore
  { key: "tasks", pattern: /^\/tasks\/?$/, title: "任务", group: "tasks" }, // i18n-ignore
  { key: "auto-director-follow-ups", pattern: /^\/auto-director\/follow-ups\/?$/, title: "导演跟进", group: "tasks" }, // i18n-ignore
  { key: "knowledge", pattern: /^\/knowledge\/?$/, title: "知识库", group: "more" }, // i18n-ignore
  { key: "genres", pattern: /^\/genres\/?$/, title: "题材基底", group: "more" }, // i18n-ignore
  { key: "story-modes", pattern: /^\/story-modes\/?$/, title: "推进模式", group: "more" }, // i18n-ignore
  { key: "titles", pattern: /^\/titles\/?$/, title: "标题工坊", group: "more" }, // i18n-ignore
  { key: "prompt-workbench", pattern: /^\/prompt-workbench\/?$/, title: "提示词管理", group: "more" }, // i18n-ignore
  { key: "model-routes", pattern: /^\/settings\/model-routes\/?$/, title: "模型路由", group: "more" }, // i18n-ignore
  { key: "settings", pattern: /^\/settings\/?$/, title: "系统设置", group: "more" }, // i18n-ignore
  { key: "worlds", pattern: /^\/worlds\/?$/, title: "世界观", group: "more" }, // i18n-ignore
  { key: "world-generator", pattern: /^\/worlds\/generator\/?$/, title: "世界生成", group: "more" }, // i18n-ignore
  { key: "world-workspace", pattern: /^\/worlds\/[^/]+\/workspace\/?$/, title: "世界工作台", group: "more" }, // i18n-ignore
  { key: "style-engine", pattern: /^\/style-engine\/?$/, title: "写法引擎", group: "more" }, // i18n-ignore
  { key: "anti-ai-rules", pattern: /^\/anti-ai-rules\/?$/, title: "反 AI 规则", group: "more" }, // i18n-ignore
  { key: "base-characters", pattern: /^\/base-characters\/?$/, title: "基础角色", group: "more" }, // i18n-ignore
];

export function getMobilePrimaryNavItems(t: TFunction): MobileNavItem[] {
  return [
    { key: "home", label: t("settings:navigation.items.home"), to: "/", group: "home" },
    { key: "novels", label: t("settings:navigation.items.novels"), to: "/novels", group: "novels" },
    { key: "creation", label: t("mobile:nav.creation"), to: "/creative-hub", group: "creation" },
    { key: "tasks", label: t("settings:navigation.items.tasks"), to: "/tasks", group: "tasks" },
    { key: "more", label: t("mobile:nav.more"), to: "", group: "more" },
  ];
}

export function getMobileMoreNavGroups(t: TFunction): MobileNavGroup[] {
  return [
    {
      title: t("mobile:nav.groups.creationAssist"),
      items: [
        { key: "help", label: t("settings:navigation.items.help"), to: "/help", group: "more" },
        { key: "book-analysis", label: t("settings:navigation.items.bookAnalysis"), to: "/book-analysis", group: "creation" },
        { key: "auto-director-follow-ups", label: t("settings:navigation.items.autoDirectorFollowUps"), to: "/auto-director/follow-ups", group: "tasks" },
        { key: "chat-legacy", label: t("mobile:nav.chatLegacy"), to: "/chat-legacy", group: "creation" },
      ],
    },
    {
      title: t("mobile:nav.groups.assetLibrary"),
      items: [
        { key: "knowledge", label: t("settings:navigation.items.knowledge"), to: "/knowledge", group: "more" },
        { key: "genres", label: t("settings:navigation.items.genres"), to: "/genres", group: "more" },
        { key: "story-modes", label: t("settings:navigation.items.storyModes"), to: "/story-modes", group: "more" },
        { key: "titles", label: t("settings:navigation.items.titles"), to: "/titles", group: "more" },
        { key: "style-engine", label: t("settings:navigation.items.styleEngine"), to: "/style-engine", group: "more" },
        { key: "anti-ai-rules", label: t("settings:navigation.items.antiAiRules"), to: "/anti-ai-rules", group: "more" },
        { key: "base-characters", label: t("settings:navigation.items.baseCharacters"), to: "/base-characters", group: "more" },
      ],
    },
    {
      title: t("mobile:nav.groups.worldAndSystem"),
      items: [
        { key: "worlds", label: t("settings:navigation.items.worlds"), to: "/worlds", group: "more" },
        { key: "world-generator", label: t("mobile:nav.worldGenerator"), to: "/worlds/generator", group: "more" },
        { key: "prompt-workbench", label: t("settings:navigation.items.promptWorkbench"), to: "/prompt-workbench", group: "more" },
        { key: "model-routes", label: t("settings:navigation.items.modelRoutes"), to: "/settings/model-routes", group: "more" },
        { key: "settings", label: t("settings:navigation.items.settings"), to: "/settings", group: "more" },
      ],
    },
  ];
}

export function getMobileRoutePattern(pathname: string, t?: TFunction): MobileRoutePattern | undefined {
  const patterns = t ? getMobileRoutePatterns(t) : MOBILE_ROUTE_PATTERNS;
  return patterns.find((route) => route.pattern.test(pathname));
}

export function getMobilePageTitle(pathname: string, t?: TFunction): string {
  return getMobileRoutePattern(pathname, t)?.title ?? (t ? t("mobile:nav.more") : "更多功能"); // i18n-ignore: fallback when t not available
}

export function getMobileNavGroupForPath(pathname: string, t?: TFunction): MobilePrimaryNavKey {
  return getMobileRoutePattern(pathname, t)?.group ?? "more";
}

export function getMobileRouteClassName(pathname: string, t?: TFunction): string {
  return `mobile-route-${getMobileRoutePattern(pathname, t)?.key ?? "more"}`;
}
