import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('client/src/pages/novels/components/DirectorFactDebugDialog.tsx', 'utf8');

// Replace formatStageLabel
content = content.replace(
  /function formatStageLabel\(stage: string\): string \{[\s\S]*?return stage;\n\}/,
  `function formatStageLabel(stage: string, t: (key: string) => string): string {
  const stageMap: Record<string, string> = {
    candidate_selection: t('novel:directorDebug.stages.candidateSelection'),
    candidate_confirm: t('novel:directorDebug.stages.candidateConfirm'),
    story_macro: t('novel:directorDebug.stages.storyMacro'),
    book_contract: t('novel:directorDebug.stages.bookContract'),
    character_setup: t('novel:directorDebug.stages.characterSetup'),
    volume_strategy: t('novel:directorDebug.stages.volumeStrategy'),
    structured_outline: t('novel:directorDebug.stages.structuredOutline'),
    chapter_execution: t('novel:directorDebug.stages.chapterExecution'),
    quality_repair: t('novel:directorDebug.stages.qualityRepair'),
    takeover: t('novel:directorDebug.stages.takeover'),
  };
  return stageMap[stage] ?? stage;
}`
);

// Replace formatNextAction
content = content.replace(
  /function formatNextAction\(action\?: string \| null\): string \{[\s\S]*?return text \|\| action;\n\}/,
  `function formatNextAction(action?: string | null, t?: (key: string) => string): string {
  if (!action) return t ? t('novel:directorDebug.noActionSuggestion') : '当前没有额外动作建议';
  if (action === 'run_chapter_detail_generation') return t ? t('novel:directorDebug.actions.runChapterDetailGeneration') : '继续细化剩余章节任务单';
  if (action === 'run_chapter_list_generation') return t ? t('novel:directorDebug.actions.runChapterListGeneration') : '继续补齐卷拆章列表';
  if (action === 'sync_execution_contracts') return t ? t('novel:directorDebug.actions.syncExecutionContracts') : '同步章节执行合同';
  const text = action.replace(/_/g, ' ').replace(/\\./g, ' ').trim();
  return text || action;
}`
);

// Replace formatResumeFrom
content = content.replace(
  /function formatResumeFrom\(resumeFrom\?: string \| null\): string \{[\s\S]*?return resumeFrom\.replace[\s\S]*?\|\| resumeFrom;\n\}/,
  `function formatResumeFrom(resumeFrom?: string | null, t?: (key: string, opts?: Record<string, unknown>) => string): string {
  if (!resumeFrom) return t ? t('novel:directorDebug.resumeFrom.reJudge') : '按当前现场重新判断';
  if (resumeFrom === 'chapter_detail_bundle') return t ? t('novel:directorDebug.resumeFrom.chapterDetailBundle') : '从剩余未细化章节继续';
  if (resumeFrom === 'chapter_list') return t ? t('novel:directorDebug.resumeFrom.chapterList') : '从卷拆章列表继续';
  if (resumeFrom === 'beat_sheet') return t ? t('novel:directorDebug.resumeFrom.beatSheet') : '从卷节奏板继续';
  if (resumeFrom.startsWith('chapter:')) {
    const rawOrder = resumeFrom.slice('chapter:'.length).trim();
    const order = Number(rawOrder);
    if (Number.isFinite(order) && order > 0) {
      return t ? t('novel:directorDebug.resumeFrom.chapterOrder', { order }) : \`第 \${order} 章\`;
    }
  }
  return resumeFrom.replace(/_/g, ' ').trim() || resumeFrom;
}`
);

// Replace summarizeStep
content = content.replace(
  /function summarizeStep\(step: DirectorTaskFactInspectionStep\): \{[\s\S]*?tone: "working",[\s\S]*?\};\n\}/,
  `function summarizeStep(step: DirectorTaskFactInspectionStep, t: (key: string) => string): {
  tone: 'done' | 'current' | 'blocked' | 'working' | 'error';
  title: string;
  detail: string;
} {
  if (step.inspectError) {
    return { tone: 'error', title: t('novel:directorDebug.stepTone.error'), detail: step.inspectError };
  }
  if (step.completed) {
    return { tone: 'done', title: t('novel:directorDebug.stepTone.done'), detail: t('novel:directorDebug.stepDetail.done') };
  }
  if (!step.ready) {
    return { tone: 'blocked', title: t('novel:directorDebug.stepTone.blocked'), detail: step.blockers[0]?.reason || t('novel:directorDebug.stepDetail.blocked') };
  }
  if (step.isCurrentFactStep) {
    return { tone: 'current', title: t('novel:directorDebug.stepTone.current'), detail: step.progress?.label || t('novel:directorDebug.stepDetail.current') };
  }
  return { tone: 'working', title: t('novel:directorDebug.stepTone.working'), detail: step.progress?.label || t('novel:directorDebug.stepDetail.working') };
}`
);

// Fix toneBadgeVariant
content = content.replace(
  'function toneBadgeVariant(tone: ReturnType<typeof summarizeStep>["tone"])',
  'function toneBadgeVariant(tone: "done" | "current" | "blocked" | "working" | "error")'
);

// Add useTranslation import
if (!content.includes('useTranslation')) {
  content = content.replace(
    'import { useMemo, useState }',
    'import { useTranslation } from "react-i18next";\nimport { useMemo, useState }'
  );
}

// Add t to StepFactCard
content = content.replace(
  'function StepFactCard({ step }: { step: DirectorTaskFactInspectionStep }) {\n  const summary = summarizeStep(step);',
  'function StepFactCard({ step }: { step: DirectorTaskFactInspectionStep }) {\n  const { t } = useTranslation();\n  const summary = summarizeStep(step, t);'
);

// Fix calls in StepFactCard
content = content.replace('formatStageLabel(step.stage)', 'formatStageLabel(step.stage, t)');
content = content.replace('formatNextAction(step.nextAction)', 'formatNextAction(step.nextAction, t)');
content = content.replace('formatResumeFrom(step.resumeFrom)', 'formatResumeFrom(step.resumeFrom, t)');

// Replace inline CJK in StepFactCard
content = content.replace(
  '{step.isCurrentFactStep ? <Badge>当前判断会先处理这里</Badge> : null}',
  '{step.isCurrentFactStep ? <Badge>{t("novel:directorDebug.currentFactStep")}</Badge> : null}'
);
content = content.replace(
  '<Badge variant="outline">后台此刻正在碰这一步</Badge>',
  '<Badge variant="outline">{t("novel:directorDebug.activeRuntimeStep")}</Badge>'
);
content = content.replace(
  '<span>这一段的完整度</span>',
  '<span>{t("novel:directorDebug.completeness")}</span>'
);
content = content.replace(
  '<div className="text-xs text-muted-foreground">现在能不能继续做</div>',
  '<div className="text-xs text-muted-foreground">{t("novel:directorDebug.canContinueLabel")}</div>'
);
content = content.replace(
  '{step.ready ? "可以开始或继续" : "还要先补前置事实"}',
  '{step.ready ? t("novel:directorDebug.canStart") : t("novel:directorDebug.needsPrerequisite")}'
);
content = content.replace(
  '<div className="text-xs text-muted-foreground">系统判断的下一步</div>',
  '<div className="text-xs text-muted-foreground">{t("novel:directorDebug.nextStepLabel")}</div>'
);
content = content.replace(
  '<div className="text-xs text-muted-foreground">如果中断，建议从哪继续</div>',
  '<div className="text-xs text-muted-foreground">{t("novel:directorDebug.resumeFromLabel")}</div>'
);
content = content.replace(
  '<div className="text-xs text-muted-foreground">这一步最近的事实描述</div>',
  '<div className="text-xs text-muted-foreground">{t("novel:directorDebug.latestFactDesc")}</div>'
);
content = content.replace(
  '{step.progress?.label || "暂时没有额外描述"}',
  '{step.progress?.label || t("novel:directorDebug.noExtraDesc")}'
);
content = content.replace(
  '<div className="text-sm font-medium text-destructive">现在卡住的原因</div>',
  '<div className="text-sm font-medium text-destructive">{t("novel:directorDebug.blockedReason")}</div>'
);
content = content.replace(
  '<div className="text-sm font-medium text-foreground">判断依据</div>',
  '<div className="text-sm font-medium text-foreground">{t("novel:directorDebug.evidence")}</div>'
);

// Add t to main component
content = content.replace(
  'export default function DirectorFactDebugDialog(input: {\n  novelId: string;\n  taskId?: string | null;\n  disabled?: boolean;\n}) {\n  const { novelId, disabled = false } = input;',
  'export default function DirectorFactDebugDialog(input: {\n  novelId: string;\n  taskId?: string | null;\n  disabled?: boolean;\n}) {\n  const { t } = useTranslation();\n  const { novelId, disabled = false } = input;'
);

// Replace main component CJK
content = content.replace('>调试检查<', '>{t("novel:directorDebug.debugButton")}<');
content = content.replace('<DialogTitle>导演步骤完整度检查</DialogTitle>', '<DialogTitle>{t("novel:directorDebug.dialogTitle")}</DialogTitle>');
content = content.replace(
  '这里展示的是每一步基于真实产出的检查结果。你可以直接看到哪一步已经有结果、哪一步缺前置条件、系统现在准备先补哪里。',
  '{t("novel:directorDebug.dialogDescription")}'
);
content = content.replace(
  '已确认完成 {summary.completedCount}/{inspection?.steps.length ?? 0}',
  '{t("novel:directorDebug.completedCount", { count: summary.completedCount, total: inspection?.steps.length ?? 0 })}'
);
content = content.replace(
  '还需补前置条件 {summary.blockedCount}',
  '{t("novel:directorDebug.blockedCount", { count: summary.blockedCount })}'
);
content = content.replace(
  '当前先看 {summary.currentStep.label}',
  '{t("novel:directorDebug.currentStepLabel", { label: summary.currentStep.label })}'
);
content = content.replace('>重新检查<', '>{t("novel:directorDebug.recheck")}<');
content = content.replace(
  '正在读取当前导演链的完整度检查结果...',
  '{t("novel:directorDebug.loading")}'
);
content = content.replace(
  '无法完成这次检查。{query.error instanceof Error ? query.error.message : "请稍后重试。"}',
  '{t("novel:directorDebug.loadError")} {query.error instanceof Error ? query.error.message : t("common:actions.retry")}'
);
content = content.replace(
  '当前还没有可检查的导演任务。先启动或接手一次 AI 导演流程，这里才会出现逐步骤检查结果。',
  '{t("novel:directorDebug.noTask")}'
);
content = content.replace(
  '当前系统会先补这一段',
  '{t("novel:directorDebug.currentFactStepTitle")}'
);
content = content.replace(
  '{inspection.currentFactStepLabel || "系统正在重新判断下一步"}',
  '{inspection.currentFactStepLabel || t("novel:directorDebug.reJudging")}'
);
content = content.replace(
  '有些步骤的检查没有拿到完整结果。通常是因为当前任务现场不完整，或者这一段还需要补更多事实来源。',
  '{t("novel:directorDebug.partialInspectWarning")}'
);

writeFileSync('client/src/pages/novels/components/DirectorFactDebugDialog.tsx', content, 'utf8');
console.log('done');
