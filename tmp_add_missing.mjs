import fs from 'fs';
const zhFile = 'shared/localization/locales/zh-CN.json';
const viFile = 'shared/localization/locales/vi-VN.json';
let zhContent = fs.readFileSync(zhFile, 'utf8');
if (zhContent.charCodeAt(0) === 0xFEFF) zhContent = zhContent.slice(1);
let viContent = fs.readFileSync(viFile, 'utf8');
if (viContent.charCodeAt(0) === 0xFEFF) viContent = viContent.slice(1);
const zh = JSON.parse(zhContent);
const vi = JSON.parse(viContent);
function ensure(obj, ...keys) {
  let cur = obj;
  for (const k of keys) { if (!cur[k]) cur[k] = {}; cur = cur[k]; }
  return cur;
}
function set(obj, path, zhVal, viVal) {
  const parts = path.split('.');
  const key = parts.pop();
  const zhNode = ensure(obj[0], ...parts);
  const viNode = ensure(obj[1], ...parts);
  if (!zhNode[key]) zhNode[key] = zhVal;
  if (!viNode[key]) viNode[key] = viVal;
}
const both = [zh, vi];
