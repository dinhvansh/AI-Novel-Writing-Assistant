const fs = require('fs');
const path = require('path');
const CJK = /[\u4E00-\u9FFF]/;

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') results.push(...walk(full));
    else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) results.push(full);
  }
  return results;
}

const files = walk('client/src');
const withCJK = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let count = 0;
  for (const line of lines) {
    if (CJK.test(line) && !line.trim().startsWith('//') && !line.includes('i18n-ignore')) count++;
  }
  if (count > 0) withCJK.push({file: file.replace(/.*client.src./, ''), count});
}
withCJK.sort((a,b) => b.count - a.count);
let total = 0;
for (const {file, count} of withCJK.slice(0, 30)) {
  process.stdout.write(count + '\t' + file + '\n');
  total += count;
}
process.stdout.write('...\nTotal files: ' + withCJK.length + ', shown top 30 lines: ' + total + '\n');
