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
const files = walk('client/src');
const withCJK = [];
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let count = 0;
  for (const line of lines) {
    if (CJK.test(line) && !line.trim().startsWith('//') && !line.includes('i18n-ignore')) count++;
  }
  if (count > 0) withCJK.push({file: file.replace(/.*client.src./, ''), count});
}
withCJK.sort((a,b) => b.count - a.count);
process.stdout.write('Top 20 files with CJK:\n');
for (const {file, count} of withCJK.slice(0, 20)) process.stdout.write(count + '\t' + file + '\n');
process.stdout.write('Total files: ' + withCJK.length + '\n');
process.stdout.write('Total CJK lines: ' + withCJK.reduce((s,x)=>s+x.count,0) + '\n');
