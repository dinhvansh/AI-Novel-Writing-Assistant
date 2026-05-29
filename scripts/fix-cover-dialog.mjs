import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('client/src/pages/novels/components/cover/NovelCoverDialog.tsx', 'utf8');

// Add useTranslation import
content = content.replace(
  'import { useEffect, useMemo, useState }',
  'import { useTranslation } from "react-i18next";\nimport { useEffect, useMemo, useState }'
);

// Replace IMAGE_STATUS_TEXT
content = content.replace(
  `const IMAGE_STATUS_TEXT: Record<string, string> = {
  queued: "排队中",
  running: "生成中",
  succeeded: "生成成功",
  failed: "生成失败",
  cancelled: "已取消",
};`,
  `// i18n-ignore: internal status map - resolved via t() at render time
const IMAGE_STATUS_KEYS: Record<string, string> = {
  queued: "novel:cover.status.queued",
  running: "novel:cover.status.running",
  succeeded: "novel:cover.status.succeeded",
  failed: "novel:cover.status.failed",
  cancelled: "novel:cover.status.cancelled",
};`
);

// Add t to component
content = content.replace(
  'export function NovelCoverDialog(props: NovelCoverDialogProps) {\n  const queryClient = useQueryClient();',
  'export function NovelCoverDialog(props: NovelCoverDialogProps) {\n  const { t } = useTranslation("novel");\n  const queryClient = useQueryClient();'
);

// Replace currentSendModeLabel
content = content.replace(
  `  const currentSendModeLabel = promptMode === "direct"
    ? (directPromptSource === "optimized" ? "AI优化 Prompt" : "手动编辑 Prompt")
    : "原链路 Prompt";`,
  `  const currentSendModeLabel = promptMode === "direct"
    ? (directPromptSource === "optimized" ? t("cover.sendMode.optimized") : t("cover.sendMode.manual"))
    : t("cover.sendMode.original");`
);

// Replace generateMutation error
content = content.replace(
  '"请先在系统设置里配置支持图像生成的厂商和模型。"',
  't("cover.noProviderError")'
);

// Replace onSuccess toast messages
content = content.replace(
  `toast.error("启动自动导演失败，未返回任务信息。");`,
  `toast.error(t("cover.startDirectorFailed"));`
);

// Replace confirm dialog
content = content.replace(
  '"确认删除这张封面图？如果它是当前主封面，系统会自动补一张新的主图。"',
  't("cover.deleteConfirm")'
);

// Replace JSX CJK strings
const replacements = [
  ['生成小说封面主画面', '{t("cover.dialogTitle")}'],
  ['还不能开始生成', '{t("cover.cannotGenerate")}'],
  ['当前没有已配置的图像模型。请先到', '{t("cover.noImageModelDesc1")}'],
  ['补全支持图像生成的厂商和模型，再回到这里继续。', '{t("cover.noImageModelDesc2")}'],
  ['小说信息整理稿 / AI优化输入', '{t("cover.sourcePromptTitle")}'],
  ['系统已经根据当前小说基础信息整理了一版封面输入草稿。你可以直接改，也可以先点"AI优化Prompt"再继续手动调整。', '{t("cover.sourcePromptHint")}'],
  ['描述这本书想突出什么样的封面主画面。', '{t("cover.sourcePromptPlaceholder")}'],
  ['优化输出语言', '{t("cover.optimizeLanguageLabel")}'],
  ['中文', '{t("cover.languageZh")}'],
  ['优化中...', '{t("cover.optimizing")}'],
  ['AI优化Prompt', '{t("cover.optimizePromptButton")}'],
  ['恢复原链路', '{t("cover.restoreOriginal")}'],
  ['当前发送模式', '{t("cover.currentSendMode")}'],
  ['最终发送 Prompt 预览', '{t("cover.finalPromptTitle")}'],
  ['这里展示最终会发送给图像模型的 prompt。你可以直接编辑，也可以在 AI 优化后继续做细调。', '{t("cover.finalPromptHint")}'],
  ['风格预设，例如：电影感插画，高辨识度', '{t("cover.stylePresetPlaceholder")}'],
  ['负向提示词，例如：文字、水印、低清晰度、畸形', '{t("cover.negativePromptPlaceholder")}'],
  ['模型厂商', '{t("cover.providerLabel")}'],
  ['请先在系统设置中填写图像模型', '{t("cover.noProviderOption")}'],
  ['尺寸', '{t("cover.sizeLabel")}'],
  ['1024x1536（推荐竖版）', '{t("cover.sizePortrait")}'],
  ['生成张数', '{t("cover.countLabel")}'],
  ['1 张', '{t("cover.count1")}'],
  ['2 张', '{t("cover.count2")}'],
  ['3 张', '{t("cover.count3")}'],
  ['4 张', '{t("cover.count4")}'],
  ['提交任务中...', '{t("cover.submitting")}'],
  ['开始生成', '{t("cover.startGenerate")}'],
  ['AI 优化失败，请稍后重试。', '{t("cover.optimizeError")}'],
  ['提交图片任务失败，请稍后重试。', '{t("cover.submitError")}'],
  ['当前任务状态：', '{t("cover.taskStatus")}：'],
  ['封面图库', '{t("cover.galleryTitle")}'],
  ['生成成功后会自动回到这里。第一张成功图会在当前没有主封面时自动设为主图。', '{t("cover.galleryHint")}'],
  ['正在读取封面图库...', '{t("cover.loadingGallery")}'],
  ['还没有封面图。先提交一次生成任务，成功后会出现在这里。', '{t("cover.emptyGallery")}'],
  ['当前主封面', '{t("cover.primaryCover")}'],
  ['候选图', '{t("cover.candidateCover")}'],
  ['尺寸待定', '{t("cover.sizeUnknown")}'],
  ['本地路径：', '{t("cover.localPath")}：'],
  ['设为当前封面', '{t("cover.setPrimary")}'],
  ['删除中...', '{t("cover.deleting")}'],
  ['删除', '{t("cover.delete")}'],
  ['删除封面失败，请稍后重试。', '{t("cover.deleteError")}'],
];

for (const [from, to] of replacements) {
  content = content.replace(from, to);
}

// Replace IMAGE_STATUS_TEXT usage
content = content.replace(
  '{IMAGE_STATUS_TEXT[activeTask.status] ?? activeTask.status}',
  '{t(IMAGE_STATUS_KEYS[activeTask.status] ?? "") || activeTask.status}'
);

// Replace asset.isPrimary conditional text
content = content.replace(
  '{asset.isPrimary ? "当前主封面" : "候选图"}',
  '{asset.isPrimary ? t("cover.primaryCover") : t("cover.candidateCover")}'
);

// Replace asset.isPrimary button text
content = content.replace(
  '{asset.isPrimary ? "当前主封面" : "设为当前封面"}',
  '{asset.isPrimary ? t("cover.primaryCover") : t("cover.setPrimary")}'
);

// Replace alt text
content = content.replace(
  '`${promptContext.title || "小说"}封面候选图`',
  '`${promptContext.title || t("cover.novelFallback")}${t("cover.coverAlt")}`'
);

writeFileSync('client/src/pages/novels/components/cover/NovelCoverDialog.tsx', content, 'utf8');
console.log('done');
