#!/usr/bin/env node

/**
 * Generate reviewed-at-build official-document language variants.
 *
 * Public documentation keeps one Traditional Chinese source of truth. Each
 * generated sibling is written beside that source as `<name>.<locale>.md` so
 * Astro can render all variants in one canonical route without URL changes.
 *
 * The script is intentionally opt-in: it never runs from the normal build
 * hooks. It only writes a file after the shared Markdown/HTML/diagram
 * validator accepts the complete response.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import yaml from 'js-yaml';
import {
  resolveArticleI18nConfig,
  translateArticleAuto,
  validateTranslatedFormat,
} from '../src/lib/server-article-i18n.ts';

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, 'docs');
const SOURCE_LOCALE = 'zh-Hant';
const TARGET_LOCALES = ['zh-CN', 'en', 'fr', 'es', 'de'];
const PUBLIC_DOC_DIRS = ['community', 'operations', 'standards'];
const PUBLIC_ROOT_DOCS = ['roadmap.md'];
const EXCLUDED_ROOT_DOCS = new Set([
  'ARTICLE_TRANSLATION_VARIANT_AUDIT_REPORT.md',
  'DYNAMIC_SNOW_PHYSICS_AUDIT_REPORT.md',
  'I18N_AUDIT_REPORT.md',
]);

function parseFrontmatter(raw, filePath) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error(`Missing YAML frontmatter: ${path.relative(ROOT, filePath)}`);
  }
  const data = yaml.load(match[1]) || {};
  return { data, body: match[2], frontmatter: match[1] };
}

function docKey(relativePath, frontmatter) {
  if (typeof frontmatter.i18nKey === 'string' && frontmatter.i18nKey.trim()) {
    return frontmatter.i18nKey.trim();
  }
  return `official-${relativePath.replace(/\.md$/i, '').replace(/[\\/]+/g, '-')}`;
}

async function walkMarkdown(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkMarkdown(filePath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(filePath);
    }
  }
  return files;
}

async function getSourceFiles() {
  const files = [];
  for (const directory of PUBLIC_DOC_DIRS) {
    files.push(...await walkMarkdown(path.join(DOCS_DIR, directory)));
  }
  for (const file of PUBLIC_ROOT_DOCS) {
    const filePath = path.join(DOCS_DIR, file);
    if (await fs.stat(filePath).then(() => true).catch(() => false)) files.push(filePath);
  }
  return files
    .filter((filePath) => !EXCLUDED_ROOT_DOCS.has(path.basename(filePath)))
    .filter((filePath) => !/(?:\.(?:zh-CN|zh-Hant|en|fr|es|de))\.md$/i.test(filePath))
    .sort();
}

function translatedPath(sourcePath, locale) {
  return sourcePath.replace(/\.md$/i, `.${locale}.md`);
}

async function translateOne(sourcePath, targetLocale, config, force) {
  const relativePath = path.relative(DOCS_DIR, sourcePath);
  const sourceRaw = await fs.readFile(sourcePath, 'utf8');
  const { data } = parseFrontmatter(sourceRaw, sourcePath);
  const i18nKeyValue = docKey(relativePath, data);
  const outputPath = translatedPath(sourcePath, targetLocale);

  if (!force && await fs.stat(outputPath).then(() => true).catch(() => false)) {
    return { status: 'skipped', relativePath, targetLocale, outputPath };
  }

  console.log(`[Official-i18n] Translating ${relativePath} -> ${targetLocale}`);
  const result = await translateArticleAuto({
    sourceMarkdown: sourceRaw,
    sourceLocale: SOURCE_LOCALE,
    targetLocale,
    i18nKey: i18nKeyValue,
    slug: relativePath.replace(/\.md$/i, ''),
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    groqApiKey: config.groqApiKey,
    groqModel: config.groqModel,
    // Official documents are structural HTML/Markdown contracts. Translate
    // visible text nodes and reinsert them into the original template so a
    // provider cannot drop containers, code, formulas, or attributes.
    scheme: 'extraction',
    enableOcr: false,
    preserveHtmlTags: true,
    chunkSize: 2800,
  });

  if (!result.ok || !result.translatedMarkdown) {
    throw new Error(result.error || 'Translation provider returned no Markdown');
  }

  const validation = validateTranslatedFormat(sourceRaw, result.translatedMarkdown, targetLocale);
  if (!validation.valid) {
    throw new Error(`Shared validator rejected output: ${validation.reason}`);
  }

  const output = `${result.translatedMarkdown.trim()}\n`;
  await fs.writeFile(outputPath, output, 'utf8');
  return { status: 'written', relativePath, targetLocale, outputPath, chars: output.length };
}

async function runPool(items, worker, concurrency) {
  const results = [];
  let cursor = 0;
  async function runner() {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = await worker(items[index]);
      } catch (error) {
        results[index] = { status: 'failed', item: items[index], error: error instanceof Error ? error.message : String(error) };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runner));
  return results;
}

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const concurrencyArg = process.argv.find((arg) => arg.startsWith('--concurrency='));
const concurrency = Math.max(1, Math.min(4, Number(concurrencyArg?.split('=')[1] || 2)));
const localeArg = process.argv.find((arg) => arg.startsWith('--locales='));
const locales = localeArg
  ? localeArg.split('=')[1].split(',').map((locale) => locale.trim()).filter((locale) => TARGET_LOCALES.includes(locale))
  : TARGET_LOCALES;
const docsArg = process.argv.find((arg) => arg.startsWith('--docs='));
const requestedDocs = docsArg
  ? new Set(docsArg.split('=')[1].split(',').map((value) => value.trim().replace(/^docs\//, '').replace(/\.md$/i, '')).filter(Boolean))
  : null;

const config = resolveArticleI18nConfig();
// Use the dedicated translation model for the remaining official-document
// pass. The public Gemini and Groq quotas are intentionally not touched here.
process.env.ARTICLE_I18N_SKIP_GEMINI = 'true';
process.env.ARTICLE_I18N_GROQ_ONLY = 'false';
process.env.ARTICLE_I18N_SKIP_GROQ = 'true';
const officialModel = process.env.ARTICLE_I18N_OFFICIAL_MODEL || 'glm-5.3-flash-free';
process.env.ARTICLE_I18N_INSTANCE_MODEL = officialModel;
process.env.INSTANCE_AI_MODEL = officialModel;
config.model = officialModel;
process.env.ARTICLE_I18N_CHUNK_RETRIES = process.env.ARTICLE_I18N_CHUNK_RETRIES || '4';
process.env.ARTICLE_I18N_GROQ_TIMEOUT_MS = process.env.ARTICLE_I18N_GROQ_TIMEOUT_MS || '120000';
process.env.ARTICLE_I18N_INSTANCE_TIMEOUT_MS = process.env.ARTICLE_I18N_INSTANCE_TIMEOUT_MS || '120000';
process.env.INSTANCE_AI_MAX_OUTPUT_TOKENS = process.env.INSTANCE_AI_MAX_OUTPUT_TOKENS || '2400';
process.env.ARTICLE_I18N_DEBUG_PROVIDER = process.env.ARTICLE_I18N_DEBUG_PROVIDER || 'false';
process.env.ARTICLE_I18N_GEMINI_TIMEOUT_MS = process.env.ARTICLE_I18N_GEMINI_TIMEOUT_MS || '120000';
const sourceFiles = (await getSourceFiles()).filter((sourcePath) => {
  if (!requestedDocs || requestedDocs.size === 0) return true;
  const relativePath = path.relative(DOCS_DIR, sourcePath).replace(/\.md$/i, '');
  return requestedDocs.has(relativePath) || requestedDocs.has(path.basename(relativePath));
});
const jobs = sourceFiles.flatMap((sourcePath) => locales.map((targetLocale) => ({ sourcePath, targetLocale })));

console.log(`[Official-i18n] ${sourceFiles.length} public document sources, ${jobs.length} translation jobs, concurrency=${concurrency}`);

const results = await runPool(
  jobs,
  ({ sourcePath, targetLocale }) => translateOne(sourcePath, targetLocale, config, force),
  concurrency,
);

const failed = results.filter((result) => result.status === 'failed');
const written = results.filter((result) => result.status === 'written');
const skipped = results.filter((result) => result.status === 'skipped');

for (const result of failed) {
  console.error(`[Official-i18n] FAILED ${result.item.sourcePath} -> ${result.item.targetLocale}: ${result.error}`);
}

console.log(`[Official-i18n] written=${written.length} skipped=${skipped.length} failed=${failed.length}`);
if (failed.length > 0) process.exitCode = 1;
