import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('client/src/pages/novels/components/NovelExistingProjectTakeoverDialog.tsx', 'utf8');

// Replace RUN_MODE_OPTIONS
content = content.replace(
  /const RUN_MODE_OPTIONS[\s\S]*?];/,
  `// i18n-ignore: internal - resolved via t() in component
const RUN_MODE_KEYS = [
  { value: "full_book_autopilot", labelKey: "novel:takeover.runMode.fullBookAutopilot", descKey: "novel:takeover.runModeDesc.fullBookAutopilot" },
  { value: "auto_to_ready", labelKey: "novel:takeover.runMode.autoToReady", descKey: "novel:takeover.runModeDesc.autoToReady" },
  { value: "auto_to_execution", labelKey: "novel:takeover.runMode.autoToExecution", descKey: "novel:takeover.runModeDesc.autoToExecution" },
];`
);

// Replace STRATEGY_OPTIONS
content = content.replace(
  /const STRATEGY_OPTIONS[\s\S]*?];/,
  `// i18n-ignore: internal - resolved via t() in component
const STRATEGY_KEYS = [
  { value: "continue_existing", labelKey: "novel:takeover.strategy.continueExisting", descKey: "novel:takeover.strategyDesc.continueExisting" },
  { value: "restart_current_step", labelKey: "novel:takeover.strategy.restartCurrentStep", descKey: "novel:takeover.strategyDesc.restartCurrentStep" },
];`
);

// Replace summarizeCurrentContext function labels
content = content.replace('`概述：${basicForm.description.trim()}`', 't("novel:takeover.contextLabel.description", { value: basicForm.description.trim() })');
content = content.replace('`目标读者：${basicForm.targetAudience.trim()}`', 't("novel:takeover.contextLabel.targetAudience", { value: basicForm.targetAudience.trim() })');
content = content.replace('`书级卖点：${basicForm.bookSellingPoint.trim()}`', 't("novel:takeover.contextLabel.bookSellingPoint", { value: basicForm.bookSellingPoint.trim() })');
content = content.replace('`题材：${genrePath}`', 't("novel:takeover.contextLabel.genre", { value: genrePath })');
content = content.replace('`主推进模式：${primaryStoryModePath}`', 't("novel:takeover.contextLabel.primaryStoryMode", { value: primaryStoryModePath })');
content = content.replace('`世界观：${worldName}`', 't("novel:takeover.contextLabel.world", { value: worldName })');
content = content.replace('`商业标签：${commercialTags.join(" / ")}`', 't("novel:takeover.contextLabel.commercialTags", { value: commercialTags.join(" / ") })');

writeFileSync('client/src/pages/novels/components/NovelExistingProjectTakeoverDialog.tsx', content, 'utf8');
console.log('step1 done');
