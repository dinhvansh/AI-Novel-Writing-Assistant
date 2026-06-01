#!/usr/bin/env node
/**
 * Patches answerComposer.ts - step 2: replace remaining hardcoded Chinese strings.
 * Uses CRLF-aware replacements.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const FILE = path.join(REPO_ROOT, "server", "src", "agents", "runtime", "answerComposer.ts");

let src = fs.readFileSync(FILE, "utf8");

function replaceExact(source, oldStr, newStr) {
  if (!source.includes(oldStr)) {
    throw new Error(`String not found: ${JSON.stringify(oldStr.slice(0, 120))}`);
  }
  return source.replace(oldStr, newStr);
}

// composeCollaborativeAnswer - lead strings (CRLF)
src = replaceExact(src,
  "    ? `\u6211\u5148\u4e0d\u628a\u5b83\u5f53\u6210\u547d\u4ee4\u6267\u884c\uff0c\u5148\u548c\u4f60\u4e00\u8d77\u628a\u95ee\u9898\u8bf4\u6e05\u695a\uff1a${goal}`\r\n    : `\u6211\u7406\u89e3\u4f60\u73b0\u5728\u60f3\u63a8\u8fdb\u7684\u662f\uff1a${goal}`;",
  "    ? ta(\"collaborative.leadGeneral\", { goal })\r\n    : ta(\"collaborative.leadTask\", { goal });",
);

// composeCollaborativeAnswer - collaborationLead (CRLF)
src = replaceExact(src,
  "    ? \"\u8fd9\u8f6e\u66f4\u9002\u5408\u5148\u4e00\u8d77\u8bca\u65ad\u548c\u5224\u65ad\u3002\"\r\n    : \"\u8fd9\u8f6e\u66f4\u9002\u5408\u5148\u5171\u521b\u6f84\u6e05\uff0c\u518d\u51b3\u5b9a\u662f\u5426\u8fdb\u5165\u6267\u884c\u3002\";",
  "    ? ta(\"collaborative.modeReview\")\r\n    : ta(\"collaborative.modeCoCreate\");",
);

// composeCollaborativeAnswer - missingLine (want) (CRLF)
src = replaceExact(src,
  "      ? `\u5728\u7ee7\u7eed\u4e4b\u524d\uff0c\u6211\u8fd8\u60f3\u8865\u9f50\u8fd9\u51e0\u4e2a\u70b9\uff1a${missingInfo.join(\"\u3001\")}",
  "      ? ta(\"collaborative.missingInfoPrefixWant\", { items: missingInfo.join(ta(\"collaborative.separator\")) })",
);

// composeCollaborativeAnswer - chooseDirection
src = replaceExact(src,
  "\u4f60\u53ef\u4ee5\u76f4\u63a5\u9009\u4e00\u4e2a\u65b9\u5411\u7ee7\u7eed\uff1a\\n${options}`",
  "${ta(\"collaborative.chooseDirection\")}\\n${options}`",
);

// composeCollaborativeAnswer - missingLine (lack) (CRLF)
src = replaceExact(src,
  "    ? `\u5728\u7ee7\u7eed\u4e4b\u524d\uff0c\u6211\u8fd8\u7f3a\u8fd9\u51e0\u4e2a\u5173\u952e\u4fe1\u606f\uff1a${missingInfo.join(\"\u3001\")}",
  "    ? ta(\"collaborative.missingInfoPrefix\", { items: missingInfo.join(ta(\"collaborative.separator\")) })",
);

// composeSocialOpeningAnswer
src = replaceExact(src,
  "    return \"\u4f60\u597d\u3002\u6211\u53ef\u4ee5\u7ee7\u7eed\u966a\u4f60\u6253\u78e8\u8fd9\u672c\u4e66\u7684\u8bbe\u5b9a\u3001\u5927\u7eb2\u3001\u4eba\u7269\u3001\u7ae0\u8282\uff0c\u6216\u8005\u5148\u5e2e\u4f60\u5224\u65ad\u5f53\u524d\u5361\u70b9\u3002\u4f60\u73b0\u5728\u60f3\u5148\u63a8\u8fdb\u54ea\u4e00\u5757\uff1f\";\r\n  }\r\n  return \"\u4f60\u597d\u3002\u6211\u53ef\u4ee5\u5e2e\u4f60\u4e00\u8d77\u6253\u78e8\u8bbe\u5b9a\u3001\u5927\u7eb2\u3001\u4eba\u7269\u3001\u7ae0\u8282\uff0c\u6216\u8005\u5e2e\u4f60\u8bca\u65ad\u5f53\u524d\u5361\u70b9\u3002\u4f60\u73b0\u5728\u60f3\u5148\u63a8\u8fdb\u54ea\u4e00\u5757\uff1f\";",
  "    return ta(\"social.greetingWithNovel\");\r\n  }\r\n  return ta(\"social.greetingGeneral\");",
);

// composeTitleAnswer
src = replaceExact(src,
  "  return title ? `\u300a${title}\u300b` : \"\u672a\u83b7\u53d6\u5230\u6807\u9898\";",
  "  return title ? `\u300a${title}\u300b` : ta(\"title.notFound\");",
);

fs.writeFileSync(FILE, src, "utf8");
console.log("Step 2: composeCollaborativeAnswer, composeSocialOpeningAnswer, composeTitleAnswer patched");
