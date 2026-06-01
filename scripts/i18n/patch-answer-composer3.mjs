#!/usr/bin/env node
/**
 * Patches answerComposer.ts - step 3: replace all remaining hardcoded Chinese strings.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const FILE = path.join(REPO_ROOT, "server", "src", "agents", "runtime", "answerComposer.ts");

let src = fs.readFileSync(FILE, "utf8");

// Replace all remaining Chinese strings using regex-based replacements
// Each replacement is [oldPattern, newString]
const replacements = [
  // composeNovelListAnswer
  [/return "\u5f53\u524d\u8fd8\u6ca1\u6709\u5c0f\u8bf4\u3002";(\r?\n\s+}\r?\n\s+const lines = items\.slice\(0, 8\)\.map\(\(item, index\) => \{\r?\n\s+const title = typeof item\?\.title === "string" && item\.title\.trim\(\) \? item\.title\.trim\(\) : "\u672a\u547d\u540d\u5c0f\u8bf4";)/,
   `return ta("novelList.empty");$1`.replace("$1", "\n    const title = typeof item?.title === \"string\" && item.title.trim() ? item.title.trim() : ta(\"novelList.unnamedNovel\");")],
];

// Use simpler targeted replacements
function r(old, neo) {
  if (!src.includes(old)) {
    console.warn("WARNING: not found:", JSON.stringify(old.slice(0, 60)));
    return;
  }
  src = src.replace(old, neo);
}

// composeNovelListAnswer
r('return "\u5f53\u524d\u8fd8\u6ca1\u6709\u5c0f\u8bf4\u3002";', 'return ta("novelList.empty");');
r(': "\u672a\u547d\u540d\u5c0f\u8bf4";', ': ta("novelList.unnamedNovel");');
r('`\uff08${chapterCount}\u7ae0\uff09`', 'ta("novelList.chapterCount", { count: chapterCount })');
r('return `\u5f53\u524d\u5171\u6709 ${total} \u672c\u5c0f\u8bf4\uff1a\\n${lines.join("\\n")}`;',
  'return ta("novelList.summary", { total }) + "\\n" + lines.join("\\n");');

// composeBaseCharacterListAnswer
r('return "\u5f53\u524d\u57fa\u7840\u89d2\u8272\u5e93\u8fd8\u662f\u7a7a\u7684\u3002";', 'return ta("baseCharacterList.empty");');
r(': "\u672a\u547d\u540d\u89d2\u8272";', ': ta("character.unnamedCharacter");');
r('return `\u5f53\u524d\u57fa\u7840\u89d2\u8272\u5e93\u5171\u6709 ${items.length} \u4e2a\u89d2\u8272\u6a21\u677f\uff1a\\n${lines.join("\\n")}`;',
  'return ta("baseCharacterList.summary", { count: items.length }) + "\\n" + lines.join("\\n");');

// composeWorldListAnswer
r('return "\u5f53\u524d\u8fd8\u6ca1\u6709\u4e16\u754c\u89c2\u3002";', 'return ta("worldList.empty");');
r(': "\u672a\u547d\u540d\u4e16\u754c\u89c2";', ': ta("worldList.unnamedWorld");');
r('return `\u5f53\u524d\u5171\u6709 ${items.length} \u4e2a\u4e16\u754c\u89c2\uff1a\\n${lines.join("\\n")}`;',
  'return ta("worldList.summary", { count: items.length }) + "\\n" + lines.join("\\n");');

// composeTaskListAnswer
r('return "\u5f53\u524d\u6ca1\u6709\u7cfb\u7edf\u4efb\u52a1\u3002";', 'return ta("taskList.empty");');
r(': "\u672a\u547d\u540d\u4efb\u52a1";', ': ta("taskList.unnamedTask");');
r('return `\u5f53\u524d\u5171\u6709 ${items.length} \u4e2a\u7cfb\u7edf\u4efb\u52a1\uff1a\\n${lines.join("\\n")}`;',
  'return ta("taskList.summary", { count: items.length }) + "\\n" + lines.join("\\n");');

// composeBindWorldAnswer
r('return `\u5df2\u5c06\u4e16\u754c\u89c2\u300a${worldName}\u300b\u7ed1\u5b9a\u5230\u5c0f\u8bf4\u300a${novelTitle}\u300b\u3002`;',
  'return ta("worldBinding.bound", { worldName, novelTitle });');
r('return "\u5df2\u5b8c\u6210\u4e16\u754c\u89c2\u7ed1\u5b9a\u3002";', 'return ta("worldBinding.boundGeneric");');
r('return "\u6ca1\u6709\u5f53\u524d\u5c0f\u8bf4\u4e0a\u4e0b\u6587\uff0c\u65e0\u6cd5\u8bbe\u7f6e\u4e16\u754c\u89c2\u3002";',
  'return ta("worldBinding.noContext");');
r('return "\u672a\u627e\u5230\u8981\u7ed1\u5b9a\u7684\u4e16\u754c\u89c2\u3002";', 'return ta("worldBinding.notFound");');
r('return "\u672a\u5b8c\u6210\u4e16\u754c\u89c2\u7ed1\u5b9a\u3002";', 'return ta("worldBinding.failed");');

// composeUnbindWorldAnswer
r('return `\u5df2\u5c06\u4e16\u754c\u89c2\u300a${previousWorldName}\u300b\u4ece\u5c0f\u8bf4\u300a${novelTitle}\u300b\u89e3\u7ed1\u3002`;',
  'return ta("worldUnbinding.unbound", { previousWorldName, novelTitle });');
r('return `\u5df2\u66f4\u65b0\u5c0f\u8bf4\u300a${novelTitle}\u300b\u7684\u4e16\u754c\u89c2\u7ed1\u5b9a\u72b6\u6001\u3002`;',
  'return ta("worldUnbinding.unboundUpdated", { novelTitle });');
r('return "\u5df2\u5b8c\u6210\u4e16\u754c\u89c2\u89e3\u7ed1\u3002";', 'return ta("worldUnbinding.unboundGeneric");');
r('return "\u6ca1\u6709\u5f53\u524d\u5c0f\u8bf4\u4e0a\u4e0b\u6587\uff0c\u65e0\u6cd5\u89e3\u9664\u4e16\u754c\u89c2\u7ed1\u5b9a\u3002";',
  'return ta("worldUnbinding.noContext");');
r('return "\u672a\u5b8c\u6210\u4e16\u754c\u89c2\u89e3\u7ed1\u3002";', 'return ta("worldUnbinding.failed");');

// composeFactProductionStatusText - fallbackTitle default
r('function composeFactProductionStatusText(status: Record<string, unknown>, fallbackTitle = "\u5f53\u524d\u5c0f\u8bf4"): string {',
  'function composeFactProductionStatusText(status: Record<string, unknown>, fallbackTitle?: string): string {\n  const _fallbackTitle = fallbackTitle ?? ta("productionStatus.fallbackTitle");');
// Fix the usage of fallbackTitle in the function
r('? status.title.trim() : fallbackTitle;', '? status.title.trim() : _fallbackTitle;');

// composeFactProductionStatusText - unknownStage
r(': "\u672a\u77e5\u9636\u6bb5";', ': ta("productionStatus.unknownStage");');

// composeFactProductionStatusText - factProgress line
r('const parts = [`\u300a${title}\u300b\u4e8b\u5b9e\u8fdb\u5c55\uff1a${currentStage}\u3002`];',
  'const parts = [ta("productionStatus.factProgress", { title, stage: currentStage })];');

// planning
r('parts.push(`\u89c4\u5212\uff1a${planningCompleted}/${planningTotal} \u9879\u3002`);',
  'parts.push(ta("productionStatus.planning", { completed: planningCompleted, total: planningTotal }));');

// draftWithTarget / draftOnly
r('? `\u6b63\u6587\uff1a${draftedChapterCount}/${targetChapterCount} \u7ae0\u3002`\r\n            : `\u6b63\u6587\uff1a${draftedChapterCount} \u7ae0\u3002`);',
  '? ta("productionStatus.draftWithTarget", { drafted: draftedChapterCount, target: targetChapterCount })\r\n            : ta("productionStatus.draftOnly", { drafted: draftedChapterCount }));');

// chapterDir (in factProgress block)
r('parts.push(targetChapterCount != null ? `\u7ae0\u8282\u76ee\u5f55\uff1a${chapterCount}/${targetChapterCount} \u7ae0\u3002` : `\u7ae0\u8282\u76ee\u5f55\uff1a${chapterCount} \u7ae0\u3002`);\r\n    }\r\n    if (reviewedChapterCount',
  'parts.push(targetChapterCount != null ? ta("productionStatus.chapterDirWithTarget", { count: chapterCount, target: targetChapterCount }) : ta("productionStatus.chapterDirOnly", { count: chapterCount }));\r\n    }\r\n    if (reviewedChapterCount');

// reviewed
r('parts.push(`\u5ba1\u6821\uff1a${reviewedChapterCount} \u7ae0\u3002`);',
  'parts.push(ta("productionStatus.reviewed", { count: reviewedChapterCount }));');

// committed
r('parts.push(`\u72b6\u6001\u63d0\u4ea4\uff1a${committedChapterCount} \u7ae0\u3002`);',
  'parts.push(ta("productionStatus.committed", { count: committedChapterCount }));');

// needsRepair
r('parts.push(`${needsRepairChapters} \u7ae0\u5f85\u4fee\u590d\u3002`);',
  'parts.push(ta("productionStatus.needsRepair", { count: needsRepairChapters }));');

// chapterDir (outside factProgress block)
r('parts.push(targetChapterCount != null ? `\u7ae0\u8282\u76ee\u5f55\uff1a${chapterCount}/${targetChapterCount} \u7ae0\u3002` : `\u7ae0\u8282\u76ee\u5f55\uff1a${chapterCount} \u7ae0\u3002`);\r\n  }',
  'parts.push(targetChapterCount != null ? ta("productionStatus.chapterDirWithTarget", { count: chapterCount, target: targetChapterCount }) : ta("productionStatus.chapterDirOnly", { count: chapterCount }));\r\n  }');

// runtimeLabel
r('parts.push(`\u540e\u53f0\u8865\u5145\uff1a${runtimeLabel}\u3002`);',
  'parts.push(ta("productionStatus.runtimeLabel", { label: runtimeLabel }));');

// pipelineStatus
r('parts.push(`\u540e\u53f0\u8865\u5145\uff1a${pipelineStatus}\u3002`);',
  'parts.push(ta("productionStatus.pipelineStatus", { status: pipelineStatus }));');

// failureSummary
r('parts.push(`\u540e\u53f0\u5931\u8d25\u539f\u56e0\uff1a${failureSummary}`);',
  'parts.push(ta("productionStatus.failureSummary", { summary: failureSummary }));');

// contentUsable
r('parts.push("\u5df2\u4ea7\u51fa\u7684\u4e8b\u5b9e\u5185\u5bb9\u53ef\u7ee7\u7eed\u4f7f\u7528\u3002");',
  'parts.push(ta("productionStatus.contentUsable"));');

// recoveryHint
r('parts.push(`\u5efa\u8bae\uff1a${recoveryHint}`);',
  'parts.push(ta("productionStatus.recoveryHint", { hint: recoveryHint }));');

// composeProgressAnswer - insufficient
r('return "\u5f53\u524d\u4fe1\u606f\u4e0d\u8db3\uff0c\u65e0\u6cd5\u7ee7\u7eed";\r\n  }\r\n  const completedChapterCount',
  'return ta("progress.insufficient");\r\n  }\r\n  const completedChapterCount');
r('return "\u5f53\u524d\u4fe1\u606f\u4e0d\u8db3\uff0c\u65e0\u6cd5\u7ee7\u7eed";\r\n  const parts = [',
  'return ta("progress.insufficient");\r\n  const parts = [');

// progress draftWithTarget / draftOnly
r('? `\u6b63\u6587\uff1a${completedChapterCount}/${chapterCount} \u7ae0\u3002`\r\n      : `\u6b63\u6587\uff1a${completedChapterCount} \u7ae0\u3002`,',
  '? ta("progress.draftWithTarget", { completed: completedChapterCount, total: chapterCount })\r\n      : ta("progress.draftOnly", { completed: completedChapterCount }),');

// latestChapter
r('parts.push(`\u6700\u8fd1\u5b8c\u6210\u5230\u7b2c${latestCompletedChapterOrder}\u7ae0\u3002`);',
  'parts.push(ta("progress.latestChapter", { order: latestCompletedChapterOrder }));');

// noChapters
r('parts.push("\u672a\u68c0\u6d4b\u5230\u5199\u5165\u6b63\u6587\u7684\u7ae0\u8282\u3002");',
  'parts.push(ta("progress.noChapters"));');

// composeCharacterAnswer
r('return "\u672a\u83b7\u53d6\u5230\u89d2\u8272\u72b6\u6001\u4fe1\u606f";',
  'return ta("character.notFound");');
r('return "\u5f53\u524d\u5c0f\u8bf4\u8fd8\u6ca1\u6709\u5df2\u89c4\u5212\u89d2\u8272\u3002";',
  'return ta("character.empty");');
r(': "\u672a\u547d\u540d\u89d2\u8272";', ': ta("character.unnamedCharacter");');
r('return `\u5f53\u524d\u5c0f\u8bf4\u5df2\u89c4\u5212 ${count} \u4e2a\u89d2\u8272\uff1a\\n${lines.join("\\n")}`;',
  'return ta("character.summary", { count }) + "\\n" + lines.join("\\n");');

// composeChapterAnswer
r('return `\u7b2c${order}\u7ae0${title ? `\u300a${title}\u300b` : ""}\uff1a${truncateText(content, 360) || "\u6b63\u6587\u4e3a\u7a7a"}`;',
  'return (title ? ta("chapter.orderTitleWithName", { order, title }) : ta("chapter.orderTitle", { order })) + "\uff1a" + (truncateText(content, 360) || ta("chapter.emptyContent"));');

// composeWriteAnswer - preview
r('? `\u5df2\u5b8c\u6210\u7b2c${start}\u7ae0\u6267\u884c\u9884\u89c8\uff0c\u5f53\u524d\u7b49\u5f85\u5ba1\u6279\u3002`\r\n        : `\u5df2\u5b8c\u6210\u7b2c${start}\u5230\u7b2c${end}\u7ae0\u6267\u884c\u9884\u89c8\uff0c\u5f53\u524d\u7b49\u5f85\u5ba1\u6279\u3002`;',
  '? ta("write.previewSingle", { start })\r\n        : ta("write.previewRange", { start, end });');

// composeWriteAnswer - queue
r('const scope = start === end ? `\u7b2c${start}\u7ae0` : `\u7b2c${start}\u5230\u7b2c${end}\u7ae0`;\r\n      return `\u5df2\u521b\u5efa ${scope} \u7684\u5199\u4f5c\u4efb\u52a1${jobId ? `\uff08\u4efb\u52a1 ${jobId}\uff09` : ""}\u3002`;',
  'if (start === end) {\r\n        return jobId ? ta("write.queuedSingle", { start, jobId }) : ta("write.queuedSingleNoJob", { start });\r\n      }\r\n      return jobId ? ta("write.queuedRange", { start, end, jobId }) : ta("write.queuedRangeNoJob", { start, end });');

// composeProductionStatusAnswer
r('? "未获取到整本生产状态。"\r\n      : "没有当前小说上下文，无法读取整本生产状态。";',
  '? ta("overallStatus.notFound")\r\n      : ta("overallStatus.noContext");');
r('const title = typeof status.title === "string" ? status.title.trim() : "\u5f53\u524d\u5c0f\u8bf4";',
  'const title = typeof status.title === "string" ? status.title.trim() : ta("productionStatus.fallbackTitle");');

// composeProduceNovelAnswer - fallbackTitle
r(': "\u5f53\u524d\u5c0f\u8bf4";', ': ta("productionStatus.fallbackTitle");');

// composeProduceNovelAnswer - assetParts
r('assetParts.push(worldName ? `\u4e16\u754c\u89c2\u300a${worldName}\u300b` : "\u4e16\u754c\u89c2");',
  'assetParts.push(worldName ? ta("produce.worldAsset", { name: worldName }) : ta("produce.worldAssetGeneric"));');
r('assetParts.push(`${characterCount} \u4e2a\u6838\u5fc3\u89d2\u8272`);',
  'assetParts.push(ta("produce.characterCount", { count: characterCount }));');
r('assetParts.push("\u5c0f\u8bf4\u5723\u7ecf");', 'assetParts.push(ta("produce.bible"));');
r('assetParts.push("\u53d1\u5c55\u8d70\u5411");', 'assetParts.push(ta("produce.outline"));');
r('assetParts.push(targetChapterCount != null ? `${targetChapterCount} \u7ae0\u7ed3\u6784\u5316\u5927\u7eb2` : "\u7ed3\u6784\u5316\u5927\u7eb2");',
  'assetParts.push(targetChapterCount != null ? ta("produce.structuredOutlineWithCount", { count: targetChapterCount }) : ta("produce.structuredOutlineGeneric"));');
r('assetParts.push(chapterCount != null ? `${chapterCount} \u4e2a\u7ae0\u8282\u76ee\u5f55` : "\u7ae0\u8282\u76ee\u5f55");',
  'assetParts.push(chapterCount != null ? ta("produce.chapterDirWithCount", { count: chapterCount }) : ta("produce.chapterDirGeneric"));');

// composeProduceNovelAnswer - return strings
r('return `\u300a${title}\u300b\u7684\u6838\u5fc3\u8d44\u4ea7\u5df2\u751f\u6210\u5b8c\u6210${assetParts.length > 0 ? `\uff1a${assetParts.join("\u3001")}\u3002` : "\u3002"}\u6574\u672c\u5199\u4f5c\u9884\u89c8\u5df2\u5b8c\u6210\uff0c\u5f53\u524d\u7b49\u5f85\u5ba1\u6279\u3002`;',
  'return assetParts.length > 0 ? ta("produce.assetsWithPreview", { title, assets: assetParts.join(ta("collaborative.separator")) }) : ta("produce.assetsWithPreviewNoList", { title });');
r('const jobId = typeof queued.jobId === "string" && queued.jobId.trim() ? `\uff08\u4efb\u52a1 ${queued.jobId}\uff09` : "";\r\n    return `\u300a${title}\u300b\u7684\u6838\u5fc3\u8d44\u4ea7\u5df2\u751f\u6210\u5b8c\u6210${assetParts.length > 0 ? `\uff1a${assetParts.join("\u3001")}\u3002` : "\u3002"}\u6574\u672c\u5199\u4f5c\u4efb\u52a1\u5df2\u542f\u52a8${jobId}\u3002`;',
  'const jobId = typeof queued.jobId === "string" && queued.jobId.trim() ? queued.jobId.trim() : "";\r\n    if (assetParts.length > 0) {\r\n      return jobId ? ta("produce.assetsQueued", { title, assets: assetParts.join(ta("collaborative.separator")), jobId }) : ta("produce.assetsQueuedNoJob", { title, assets: assetParts.join(ta("collaborative.separator")) });\r\n    }\r\n    return ta("produce.assetsQueuedNoList", { title });');
r('return `\u300a${title}\u300b\u7684\u6838\u5fc3\u8d44\u4ea7\u5df2\u751f\u6210\u5b8c\u6210${assetParts.length > 0 ? `\uff1a${assetParts.join("\u3001")}\u3002` : "\u3002"}\u6574\u672c\u5199\u4f5c\u672a\u542f\u52a8\u3002`;',
  'return assetParts.length > 0 ? ta("produce.assetsNoQueue", { title, assets: assetParts.join(ta("collaborative.separator")) }) : ta("produce.assetsNoQueueNoList", { title });');
r('return `\u300a${title}\u300b\u7684\u6838\u5fc3\u8d44\u4ea7\u5df2\u751f\u6210\u5b8c\u6210${assetParts.length > 0 ? `\uff1a${assetParts.join("\u3001")}\u3002` : "\u3002"}`',
  'return assetParts.length > 0 ? ta("produce.assetsOnly", { title, assets: assetParts.join(ta("collaborative.separator")) }) : ta("produce.assetsOnlyNoList", { title })');

// composeFailureDiagnosisAnswer
r('return "\u5f53\u524d\u6ca1\u6709\u53ef\u7528\u7684\u5931\u8d25\u8bca\u65ad\u4fe1\u606f";',
  'return ta("failure.noDiagnostics");');
r('parts.push(`\u8be6\u60c5\uff1a${first.failureDetails.trim()}`);',
  'parts.push(ta("failure.details", { details: first.failureDetails.trim() }));');
r('parts.push(`\u5efa\u8bae\uff1a${first.recoveryHint.trim()}`);',
  'parts.push(ta("failure.hint", { hint: first.recoveryHint.trim() }));');
r('parts.push(`\u5931\u8d25\u6b65\u9aa4\uff1a${first.lastFailedStep.trim()}`);',
  'parts.push(ta("failure.step", { step: first.lastFailedStep.trim() }));');

// composeFallbackAnswer - fallback strings
r('return result.output.trim() || "\u5f53\u524d\u4fe1\u606f\u4e0d\u8db3\uff0c\u65e0\u6cd5\u7ee7\u7eed";',
  'return result.output.trim() || ta("progress.insufficient");');
r('return summary || "\u5f53\u524d\u4fe1\u606f\u4e0d\u8db3\uff0c\u65e0\u6cd5\u7ee7\u7eed";',
  'return summary || ta("progress.insufficient");');
r('return "\u5f53\u524d\u4fe1\u606f\u4e0d\u8db3\uff0c\u65e0\u6cd5\u7ee7\u7eed";\r\n}',
  'return ta("progress.insufficient");\r\n}');

// composeAssistantMessage - chapter notFound
r('return composeChapterAnswer(results) ?? "\u672a\u83b7\u53d6\u5230\u7ae0\u8282\u6b63\u6587";',
  'return composeChapterAnswer(results) ?? ta("chapter.notFound");');

// composeAssistantMessage - write noScope
r('return composeWriteAnswer(results, waitingForApproval) ?? "\u672a\u83b7\u53d6\u5230\u53ef\u6267\u884c\u8303\u56f4";',
  'return composeWriteAnswer(results, waitingForApproval) ?? ta("write.noScope");');

fs.writeFileSync(FILE, src, "utf8");
console.log("Step 3: all remaining Chinese strings patched");

// Verify no CJK remains (outside comments)
const finalSrc = fs.readFileSync(FILE, "utf8");
const lines = finalSrc.split("\n");
const cjk = /[\u4e00-\u9fff]/;
let remaining = 0;
lines.forEach((line, i) => {
  if (cjk.test(line) && !line.trim().startsWith("//") && !line.includes("i18n-ignore")) {
    console.log(`  Remaining CJK at line ${i + 1}: ${line.trim().slice(0, 80)}`);
    remaining++;
  }
});
if (remaining === 0) {
  console.log("✓ No CJK literals remain in answerComposer.ts");
} else {
  console.log(`⚠ ${remaining} CJK literal(s) still remain`);
}
