import fs from 'fs';
import path from 'path';
import { LANG_SUFFIX_REGEX, normalizeLangCode, getPostCanonicalSlug } from '../src/lib/content.ts';

const postsDir = path.resolve('src/content/posts');
const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

const parsedPosts = [];

for (const file of files) {
  const fullPath = path.join(postsDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  const id = file.replace(/\.(md|mdx)$/, '');

  // Extract frontmatter
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = {};
  if (fmMatch) {
    for (const rawLine of fmMatch[1].split('\n')) {
      const line = rawLine.trim();
      const idx = line.indexOf(':');
      if (idx > 0 && !line.startsWith('#')) {
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        fm[key] = val;
      }
    }
  }

  const inferredLangMatch = id.match(LANG_SUFFIX_REGEX);
  const inferredLang = inferredLangMatch ? normalizeLangCode(inferredLangMatch[1]) : undefined;
  const canonical = getPostCanonicalSlug(id);
  const lang = normalizeLangCode(fm.lang) || inferredLang || 'zh-CN';

  parsedPosts.push({
    file,
    id,
    canonical,
    lang,
    explicitLang: fm.lang,
    inferredLang,
    i18nKey: fm.i18nKey,
    title: fm.title || id,
    draft: fm.draft === 'true' || fm.draft === true,
    access: fm.access,
  });
}

console.log(`Total post files found: ${parsedPosts.length}`);

// Grouping by canonical slug and i18nKey as Astro does
// Let's reproduce the exact siblingTranslations matching logic from [slug].astro
const canonicalSlugs = new Set();
for (const p of parsedPosts) {
  canonicalSlugs.add(p.canonical);
  if (p.i18nKey) canonicalSlugs.add(getPostCanonicalSlug(p.i18nKey));
}

console.log(`Unique canonical slugs/groups: ${canonicalSlugs.size}`);

const groupResults = [];

for (const targetSlug of Array.from(canonicalSlugs).sort()) {
  const matchingFiles = parsedPosts.filter((p) => {
    const pInferredKey = getPostCanonicalSlug(p.id);
    const pKey = p.i18nKey || pInferredKey;

    const normTarget = targetSlug.toLowerCase().replace(/[._-]+/g, '-');
    const normPKey = (pKey || '').toLowerCase().replace(/[._-]+/g, '-');
    const normPInferredKey = (pInferredKey || '').toLowerCase().replace(/[._-]+/g, '-');

    return (
      normPKey === normTarget ||
      normPInferredKey === normTarget ||
      pKey === targetSlug ||
      pInferredKey === targetSlug
    );
  });

  const langs = matchingFiles.map((m) => m.lang);
  const uniqueLangs = new Set(langs);
  const hasDuplicateLang = uniqueLangs.size < langs.length;

  groupResults.push({
    targetSlug,
    totalFiles: matchingFiles.length,
    files: matchingFiles.map((m) => ({ file: m.file, id: m.id, lang: m.lang, title: m.title, i18nKey: m.i18nKey })),
    langs: Array.from(uniqueLangs),
    hasDuplicateLang,
  });
}

// Find any file that doesn't belong to any group or has issues
const assignedFiles = new Set(groupResults.flatMap((g) => g.files.map((f) => f.file)));
const unassigned = parsedPosts.filter((p) => !assignedFiles.has(p.file));

console.log(`Unassigned files: ${unassigned.length}`);
if (unassigned.length > 0) {
  console.log('Unassigned:', unassigned);
}

// Check for groups with duplicates or issues
console.log('\n--- Group Summary ---');
for (const g of groupResults) {
  console.log(`[Group: ${g.targetSlug}] ${g.totalFiles} files, langs: [${g.langs.join(', ')}]${g.hasDuplicateLang ? ' ⚠️ DUPLICATE LANG!' : ''}`);
  for (const f of g.files) {
    console.log(`   - ${f.file} (lang: ${f.lang}, i18nKey: ${f.i18nKey || 'none'})`);
  }
}
