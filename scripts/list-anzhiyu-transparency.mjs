import fs from 'node:fs';
import path from 'node:path';

function findStylAndCss(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(findStylAndCss(full));
    } else if (file.endsWith('.styl') || file.endsWith('.css')) {
      results.push(full);
    }
  }
  return results;
}

const files = findStylAndCss('/tmp/hexo-theme-anzhiyu/source/css');
const transparencyRules = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('backdrop-filter') || (line.includes('linear-gradient') && line.includes('none')) || line.includes('--anzhiyu-maskbg')) {
      transparencyRules.push({ file: path.relative('/tmp/hexo-theme-anzhiyu', f), line: idx + 1, text: line.trim() });
    }
  });
}

console.log('Total transparency occurrences:', transparencyRules.length);
transparencyRules.forEach(r => console.log(`${r.file}:${r.line}  ${r.text}`));
