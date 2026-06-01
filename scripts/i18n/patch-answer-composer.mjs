#!/usr/bin/env node
/**
 * Patches answerComposer.ts to replace hardcoded Chinese strings with ta() calls.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const FILE = path.join(REPO_ROOT, "server", "src", "agents", "runtime", "answerComposer.ts");

let src = fs.readFileSync(FILE, "utf8");

// Helper: replace a section between two markers
function replaceBetween(source, startMarker, endMarker, replacement) {
  const startIdx = source.indexOf(startMarker);
  const endIdx = source.indexOf(endMarker, startIdx);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Markers not found: "${startMarker}" ... "${endMarker}"`);
  }
  return source.slice(0, startIdx) + replacement + source.slice(endIdx);
}

// 1. Replace buildCollaborativeOptions
src = replaceBetween(
  src,
  "function buildCollaborativeOptions(",
  "\nfunction composeCollaborativeAnswer(",
  `function buildCollaborativeOptions(structuredIntent?: StructuredIntent): string[] {
  switch (structuredIntent?.intent) {
    case "produce_novel":
    case "create_novel":
      return [
        ta("collaborative.options.produceNovel.option1"),
        ta("collaborative.options.produceNovel.option2"),
        ta("collaborative.options.produceNovel.option3"),
      ];
    case "write_chapter":
    case "rewrite_chapter":
      return [
        ta("collaborative.options.writeChapter.option1"),
        ta("collaborative.options.writeChapter.option2"),
        ta("collaborative.options.writeChapter.option3"),
      ];
    case "ideate_novel_setup":
      return [
        ta("collaborative.options.ideateNovelSetup.option1"),
        ta("collaborative.options.ideateNovelSetup.option2"),
        ta("collaborative.options.ideateNovelSetup.option3"),
      ];
    default:
      return [
        ta("collaborative.options.default.option1"),
        ta("collaborative.options.default.option2"),
        ta("collaborative.options.default.option3"),
      ];
  }
}

`,
);

fs.writeFileSync(FILE, src, "utf8");
console.log("Step 1: buildCollaborativeOptions patched");
