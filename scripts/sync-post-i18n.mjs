#!/usr/bin/env node
/**
 * AI-Assisted Article i18n Build Script
 * 
 * Logic:
 * 1. Checks if AI translation build assistant is enabled (ENABLE_ARTICLE_AI_I18N === 'true').
 *    - Default is DISABLED (false). Exits with zero delay.
 * 2. Scans `src/content/posts/` for all articles and extracts their `i18nKey`, `lang`, and `isAiGenerated` status.
 * 3. User-written articles take 100% precedence and are NEVER overwritten.
 * 4. For missing target locales (e.g. 'en'), calls the AI translation interface (ChronralAI / Custom API)
 *    to generate full, idiomatic localized Markdown articles.
 * 5. Saves generated files and updates `src/.generated/article-i18n-map.json`.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { translateArticle, resolveArticleI18nConfig } from '../src/lib/server-article-i18n.ts';

const POSTS_DIR = path.resolve(process.cwd(), 'src/content/posts');
const GENERATED_DIR = path.resolve(process.cwd(), 'src/.generated');
const I18N_MAP_PATH = path.resolve(GENERATED_DIR, 'article-i18n-map.json');

// Ensure .generated directory exists
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

/**
 * Parses frontmatter and body from markdown content
 */
function parseFrontmatter(rawContent, filename) {
  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: rawContent, rawFrontmatter: '' };
  }

  let meta = {};
  try {
    meta = yaml.load(match[1]) || {};
  } catch (err) {
    console.warn(`[Article-i18n] Failed to parse YAML frontmatter in ${filename}: ${err.message}`);
  }

  return { meta, body: match[2], rawFrontmatter: match[1] };
}

/**
 * Infers i18nKey and language from filename and frontmatter
 */
function inspectArticle(filename, fullPath) {
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { meta } = parseFrontmatter(raw, filename);

  const baseStem = filename.replace(/\.(md|mdx)$/, '');
  
  // Check if filename has language suffix, e.g. hello-world-en, hello-world.en, hello-world-fr
  const suffixMatch = baseStem.match(/^(.*?)[.-]([a-zA-Z]{2,3}(?:-[a-zA-Z]{2,4})?)$/);
  
  let inferredKey = baseStem;
  let inferredLang = 'zh-CN';

  if (suffixMatch) {
    inferredKey = suffixMatch[1];
    inferredLang = suffixMatch[2];
  }

  const i18nKey = meta.i18nKey || inferredKey;
  const lang = meta.lang || inferredLang;
  const isAiGenerated = Boolean(meta.isAiGenerated);
  const title = meta.title || baseStem;

  return {
    filename,
    fullPath,
    i18nKey,
    lang,
    isAiGenerated,
    title,
    raw,
    mtime: fs.statSync(fullPath).mtimeMs,
  };
}

async function main() {
  console.log('[Article-i18n] 🌐 Inspecting article i18n build matrix...');

  if (!fs.existsSync(POSTS_DIR)) {
    console.log('[Article-i18n] ⚠️ Posts directory not found. Skipping.');
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  const articles = files.map((file) => inspectArticle(file, path.join(POSTS_DIR, file)));

  // Group articles by i18nKey
  const articleGroups = new Map();
  for (const art of articles) {
    if (!articleGroups.has(art.i18nKey)) {
      articleGroups.set(art.i18nKey, []);
    }
    articleGroups.get(art.i18nKey).push(art);
  }

  // Build current mapping table
  const i18nMap = {};
  for (const [key, group] of articleGroups.entries()) {
    i18nMap[key] = {
      i18nKey: key,
      translations: {},
    };
    for (const item of group) {
      i18nMap[key].translations[item.lang] = {
        filename: item.filename,
        slug: item.filename.replace(/\.(md|mdx)$/, ''),
        title: item.title,
        isAiGenerated: item.isAiGenerated,
      };
    }
  }

  // Save generated mapping table
  fs.writeFileSync(I18N_MAP_PATH, JSON.stringify(i18nMap, null, 2), 'utf8');

  const config = resolveArticleI18nConfig();

  if (!config.enabled) {
    console.log('[Article-i18n] ℹ️ AI article translation build assistant is disabled (ENABLE_ARTICLE_AI_I18N=false).');
    console.log('[Article-i18n]    To enable, set ENABLE_ARTICLE_AI_I18N=true in .env / build environment.');
    console.log(`[Article-i18n]    Indexed ${articleGroups.size} article groups across ${articles.length} posts.`);
    return;
  }

  console.log(`[Article-i18n] 🚀 AI article translation build assistant is ACTIVE!`);
  console.log(`[Article-i18n]    Target Locales: ${config.targetLocales.join(', ')}`);
  if (config.targetPosts && config.targetPosts.length > 0) {
    console.log(`[Article-i18n]    Target Post Scope: ${config.targetPosts.join(', ')}`);
  }

  let generatedCount = 0;
  let skippedCount = 0;

  for (const [key, group] of articleGroups.entries()) {
    // Check if target post filter applies
    if (config.targetPosts && config.targetPosts.length > 0) {
      const matchScope = config.targetPosts.some((target) => target === key || group.some((g) => g.filename.includes(target)));
      if (!matchScope) continue;
    }

    // Identify primary source article (prioritize user-written, or zh-CN, or first in group)
    const sourceArticle =
      group.find((g) => !g.isAiGenerated && g.lang === 'zh-CN') ||
      group.find((g) => !g.isAiGenerated) ||
      group.find((g) => g.lang === 'zh-CN') ||
      group[0];

    if (!sourceArticle) continue;

    for (const targetLang of config.targetLocales) {
      if (targetLang === sourceArticle.lang) continue;

      const existingTranslation = group.find((g) => g.lang === targetLang);

      if (existingTranslation) {
        if (!existingTranslation.isAiGenerated) {
          // User-authored translation exists: strictly preserve it!
          skippedCount++;
          continue;
        } else {
          // AI-generated translation exists: only re-generate if source article is newer
          if (existingTranslation.mtime >= sourceArticle.mtime) {
            skippedCount++;
            continue;
          }
          console.log(`[Article-i18n] 🔄 Source article "${key}" updated. Refreshing AI translation for ${targetLang}...`);
        }
      }

      console.log(`[Article-i18n] 🤖 Generating ${targetLang} translation for "${key}" (Title: ${sourceArticle.title})...`);

      const result = await translateArticle({
        sourceMarkdown: sourceArticle.raw,
        sourceLocale: sourceArticle.lang,
        targetLocale: targetLang,
        i18nKey: key,
        slug: key,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
        groqApiKey: config.groqApiKey,
        groqModel: config.groqModel,
      });

      if (result.ok && result.translatedMarkdown) {
        const targetFilename = `${key}-${targetLang}.md`;
        const targetFilePath = path.join(POSTS_DIR, targetFilename);

        fs.writeFileSync(targetFilePath, result.translatedMarkdown, 'utf8');
        console.log(`[Article-i18n] ✅ Successfully generated ${targetFilename} via [${result.provider} / ${result.model}]`);
        generatedCount++;

        // Update in-memory mapping
        i18nMap[key].translations[targetLang] = {
          filename: targetFilename,
          slug: targetFilename.replace(/\.md$/, ''),
          title: result.translatedMarkdown.match(/title:\s*["']?(.*?)["']?\r?\n/)?.[1] || key,
          isAiGenerated: true,
        };
      } else {
        console.error(`[Article-i18n] ❌ Failed to generate ${targetLang} translation for "${key}": ${result.error || 'Unknown error'}`);
      }
    }
  }

  // Update mapping file with new translations
  fs.writeFileSync(I18N_MAP_PATH, JSON.stringify(i18nMap, null, 2), 'utf8');
  console.log(`[Article-i18n] ✨ Completed: ${generatedCount} generated, ${skippedCount} preserved.`);
}

main().catch((err) => {
  console.error('[Article-i18n] 💥 Fatal error during i18n sync:', err);
  process.exit(1);
});
