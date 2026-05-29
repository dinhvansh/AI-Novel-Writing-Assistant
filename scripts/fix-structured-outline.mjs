import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('client/src/pages/novels/components/StructuredOutlineWorkspace.tsx', 'utf8');

// Add useTranslation import
content = content.replace(
  'import { useEffect }',
  'import { useTranslation } from "react-i18next";\nimport { useEffect }'
);

// Replace actionLabel function
content = content.replace(
  `function actionLabel(action: StructuredTabViewProps["syncPreview"]["items"][number]["action"]) {
  if (action === "create") return "新增";
  if (action === "update") return "更新";
  if (action === "move") return "移动";
  if (action === "keep") return "保留";
  if (action === "delete") return "删除";
  return "待删候选";
}`,
  `function actionLabel(action: StructuredTabViewProps["syncPreview"]["items"][number]["action"], t: (key: string) => string) {
  if (action === "create") return t("novel:structured.sync.actions.create");
  if (action === "update") return t("novel:structured.sync.actions.update");
  if (action === "move") return t("novel:structured.sync.actions.move");
  if (action === "keep") return t("novel:structured.sync.actions.keep");
  if (action === "delete") return t("novel:structured.sync.actions.delete");
  return t("novel:structured.sync.actions.deleteCandidate");
}`
);

// Replace getWorkspaceGuidance function
content = content.replace(
  `function getWorkspaceGuidance(params: {
  locked: boolean;
  selectedBeat: StructuredBeat | null;
  selectedChapter: StructuredChapter | null;
  visibleChapterCount: number;
  totalChapterCount: number;
}): string {
  const { locked, selectedBeat, selectedChapter, visibleChapterCount, totalChapterCount } = params;
  if (locked) {
    return "先为当前卷生成节奏板，系统才能把卷内推进节奏和章节拆分对齐起来。";
  }
  if (selectedBeat) {
    return selectedChapter
      ? \`已聚焦到「\${selectedBeat.label}」，当前显示 \${visibleChapterCount} 章，右侧正在细化第 \${selectedChapter.chapterOrder} 章。\`
      : \`已聚焦到「\${selectedBeat.label}」，当前显示 \${visibleChapterCount} 章，接下来在左侧选择要细化的章节。\`;
  }
  return \`当前展示本卷全部 \${totalChapterCount} 章。建议先点一个节奏段，让系统把对应章节收束出来，再开始细化。\`;
}`,
  `function getWorkspaceGuidance(params: {
  locked: boolean;
  selectedBeat: StructuredBeat | null;
  selectedChapter: StructuredChapter | null;
  visibleChapterCount: number;
  totalChapterCount: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}): string {
  const { locked, selectedBeat, selectedChapter, visibleChapterCount, totalChapterCount, t } = params;
  if (locked) {
    return t("novel:structured.tab.lockedHint");
  }
  if (selectedBeat) {
    return selectedChapter
      ? t("novel:structured.guidance.focusedWithChapter", { label: selectedBeat.label, visible: visibleChapterCount, chapter: selectedChapter.chapterOrder })
      : t("novel:structured.guidance.focusedWithoutChapter", { label: selectedBeat.label, visible: visibleChapterCount });
  }
  return t("novel:structured.guidance.allChapters", { total: totalChapterCount });
}`
);

writeFileSync('client/src/pages/novels/components/StructuredOutlineWorkspace.tsx', content, 'utf8');
console.log('step1 done');
