const fs = require('fs');
const path = require('path');
const CJK = /[\u4E00-\u9FFF]/;

function walk(dir) {
  const r = [];
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const f = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') r.push(...walk(f));
    else if (e.isFile() && /\.(ts|tsx)$/.test(e.name)) r.push(f);
  }
  return r;
}

function scanFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const hits = [];
  let ignoreBlock = false;
  let braceDepth = 0;
  let ignoreBlockStartDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const openBraces = (line.match(/[{[]/g) || []).length;
    const closeBraces = (line.match(/[}\]]/g) || []).length;

    const prevLine = i > 0 ? lines[i - 1].trim() : '';
    const hasSameLineIgnore = line.includes('i18n-ignore');
    const hasPrevLineIgnore = prevLine.includes('i18n-ignore');

    // If previous line has i18n-ignore and opens a block, start ignoring
    if (hasPrevLineIgnore && (line.includes('{') || line.includes('['))) {
      ignoreBlock = true;
      ignoreBlockStartDepth = braceDepth;
    }

    braceDepth += openBraces - closeBraces;

    if (ignoreBlock && braceDepth <= ignoreBlockStartDepth) {
      ignoreBlock = false;
    }

    if (ignoreBlock) continue;
    if (hasSameLineIgnore) continue;
    if (hasPrevLineIgnore) continue;
    if (trimmed.startsWith('//')) continue;
    if (trimmed.startsWith('*')) continue;

    // Already wrapped: t("key", "fallback") or t('key', 'fallback')
    if (/\bt\s*\(\s*['"`][^'"`]*['"`]\s*,\s*['"`]/.test(line)) continue;
    if (/\bt\s*\(\s*['"`][^'"`]*['"`]\s*,\s*`/.test(line)) continue;

    // Already wrapped: t ? t("key") : "CJK" or t ? t("key") : `CJK`
    if (/\bt\s*\?\s*t\s*\(/.test(line)) continue;

    // Already wrapped: condition ? t("key") : "CJK"
    if (/\?\s*t\s*\(/.test(line) && /:\s*['"`]/.test(line)) continue;

    if (CJK.test(line)) {
      hits.push({ lineNo: i + 1, text: trimmed.slice(0, 100) });
    }
  }
  return hits;
}

const files = walk('client/src');
const withCJK = [];
for (const file of files) {
  const hits = scanFile(file);
  if (hits.length > 0) {
    withCJK.push({ file: file.replace(/.*client[/\\]src[/\\]/, ''), count: hits.length, hits });
  }
}
withCJK.sort((a, b) => b.count - a.count);

const showDetail = process.argv.includes('--detail');
for (const { file, count, hits } of withCJK) {
  process.stdout.write(count + '\t' + file + '\n');
  if (showDetail) {
    for (const h of hits) {
      process.stdout.write('    L' + h.lineNo + ': ' + h.text + '\n');
    }
  }
}
process.stdout.write('\nTotal files: ' + withCJK.length + '\n');
process.stdout.write('Total CJK lines: ' + withCJK.reduce((s, x) => s + x.count, 0) + '\n');
