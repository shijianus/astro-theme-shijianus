import fs from 'node:fs';
import path from 'node:path';

const dir = 'src/content/posts';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
const groups = {};
const langSuffixRegex = /(?:[.-])(en|zh-Hant|zh-CN|fr|es|de)$/i;

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const fm = fmMatch ? fmMatch[1] : '';
  const keyMatch = fm.match(/i18nKey:\s*["'](.*?)["']/);
  const langMatch = fm.match(/lang:\s*["'](.*?)["']/);
  const baseName = file.replace(/\.md$/, '');
  const inferredMatch = baseName.match(langSuffixRegex);
  const key = keyMatch ? keyMatch[1] : baseName.replace(langSuffixRegex, '');
  const lang = langMatch ? langMatch[1] : (inferredMatch ? inferredMatch[1] : 'zh-CN');
  if (!groups[key]) groups[key] = [];
  groups[key].push({ file, lang });
}

console.log('--- Post i18n Summary ---');
for (const [key, list] of Object.entries(groups)) {
  const langs = list.map(x => x.lang).sort().join(', ');
  console.log(`[${key}] (${list.length} variants): ${langs}`);
  for (const item of list) {
    console.log(`   - ${item.file} (${item.lang})`);
  }
}
