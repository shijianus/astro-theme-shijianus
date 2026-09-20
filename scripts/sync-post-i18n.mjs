#!/usr/bin/env node
/**
 * AI-Assisted Article i18n Build Script
 * 
 * Logic:
 * 1. Checks if AI translation build assistant is enabled (ENABLE_ARTICLE_AI_I18N === 'true').
 *    - Default is DISABLED (false). Exits with zero delay.
 * 2. Scans `src/content/posts/` for all articles and extracts their `i18nKey`, `lang`, and `aiTranslatedFrom` status.
 * 3. User-written articles take 100% precedence and are NEVER overwritten.
 * 4. For missing target locales (e.g. 'en'), calls the AI translation interface (ChronralAI / Custom API)
 *    to generate full, idiomatic localized Markdown articles.
 *    - Articles with body > 8000 chars use the chunked pipeline (translateArticleChunked).
 *    - Articles with body <= 8000 chars use single-request translation (translateArticle).
 * 5. Saves generated files and updates `src/.generated/article-i18n-map.json`.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import yaml from 'js-yaml';
import {
  translateArticle,
  translateArticleChunked,
  translateArticleByExtraction,
  translateArticleAuto,
  resolveArticleI18nConfig,
  isArticleEncryptedOrProtected,
} from '../src/lib/server-article-i18n.ts';

const POSTS_DIR = path.resolve(process.cwd(), 'src/content/posts');
const GENERATED_DIR = path.resolve(process.cwd(), 'src/.generated');
const I18N_MAP_PATH = path.resolve(GENERATED_DIR, 'article-i18n-map.json');
const LANG_SUFFIX_REGEX = /(?:[._-])(en|zh-hant|zh-cn|zh-hans|zh-tw|zh-hk|zh-mo|fr|es|de|ja|ko|ru|it|pt|pt-br|vi|ar|nl|pl|tr)$/i;

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
  const { meta, body } = parseFrontmatter(raw, filename);

  const baseStem = filename.replace(/\.(md|mdx)$/, '');
  
  // Use exact language whitelist regex to prevent false positives like -lab
  const suffixMatch = baseStem.match(LANG_SUFFIX_REGEX);
  
  let inferredKey = baseStem;
  let inferredLang = 'zh-CN';

  if (suffixMatch) {
    let currentKey = baseStem;
    while (LANG_SUFFIX_REGEX.test(currentKey)) {
      currentKey = currentKey.replace(LANG_SUFFIX_REGEX, '');
    }
    inferredKey = currentKey;
    const matched = suffixMatch[1].toLowerCase();
    inferredLang = (matched === 'zh-hant' || matched === 'zh-tw' || matched === 'zh-hk') ? 'zh-Hant' : (matched === 'zh-cn' || matched === 'zh-hans') ? 'zh-CN' : matched;
  }

  const i18nKey = meta.i18nKey || inferredKey;
  const lang = meta.lang || inferredLang;
  // An article is AI-generated if it has aiTranslatedFrom or isAiGenerated (legacy)
  const isAiGenerated = Boolean(meta.isAiGenerated || meta.aiTranslatedFrom);
  const isProtected = isArticleEncryptedOrProtected(meta, raw);
  const title = meta.title || baseStem;

  return {
    filename,
    fullPath,
    i18nKey,
    inferredKey,
    lang,
    isAiGenerated,
    isProtected,
    title,
    raw,
    body,
    mtime: fs.statSync(fullPath).mtimeMs,
  };
}

async function main() {
  console.log('[Article-i18n] Inspecting article i18n build matrix...');

  if (!fs.existsSync(POSTS_DIR)) {
    console.log('[Article-i18n] Warning: Posts directory not found. Skipping.');
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  const articles = files.map((file) => inspectArticle(file, path.join(POSTS_DIR, file)));

  // Group articles by i18nKey, with fallback to inferredKey matching
  const articleGroups = new Map();
  for (const art of articles) {
    let matchedGroupKey = art.i18nKey;
    if (!articleGroups.has(matchedGroupKey)) {
      for (const [key, group] of articleGroups.entries()) {
        if (group.some((item) => item.inferredKey === art.inferredKey || item.i18nKey === art.inferredKey || item.inferredKey === art.i18nKey)) {
          matchedGroupKey = key;
          break;
        }
      }
    }
    if (!articleGroups.has(matchedGroupKey)) {
      articleGroups.set(matchedGroupKey, []);
    }
    articleGroups.get(matchedGroupKey).push(art);
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

  const HASHES_PATH = path.resolve(GENERATED_DIR, 'article-i18n-hashes.json');
  let knownHashes = {};
  try {
    if (fs.existsSync(HASHES_PATH)) {
      knownHashes = JSON.parse(fs.readFileSync(HASHES_PATH, 'utf8'));
    }
  } catch (_) {}

  // Parse CLI flags
  const args = process.argv.slice(2);
  const isCli = args.includes('--cli');
  const forceRegenerate = args.includes('--force') || process.env.FORCE_REGENERATE_TRANSLATION === 'true';

  let cliPost = null;
  const postIdx = args.indexOf('--post');
  if (postIdx !== -1 && args[postIdx + 1]) cliPost = args[postIdx + 1];
  const postsIdx = args.indexOf('--posts');
  if (postsIdx !== -1 && args[postsIdx + 1]) cliPost = args[postsIdx + 1];

  let cliModel = null;
  const modelIdx = args.indexOf('--model');
  if (modelIdx !== -1 && args[modelIdx + 1]) cliModel = args[modelIdx + 1];

  let cliBaseUrl = null;
  const baseIdx = args.indexOf('--base-url');
  if (baseIdx !== -1 && args[baseIdx + 1]) cliBaseUrl = args[baseIdx + 1];

  let cliApiKey = null;
  const keyIdx = args.indexOf('--api-key');
  if (keyIdx !== -1 && args[keyIdx + 1]) cliApiKey = args[keyIdx + 1];

  let cliLocales = null;
  const locIdx = args.indexOf('--locales');
  if (locIdx !== -1 && args[locIdx + 1]) cliLocales = args[locIdx + 1].split(',').map((s) => s.trim()).filter(Boolean);

  const baseConfig = resolveArticleI18nConfig();
  const config = {
    ...baseConfig,
    enabled: isCli ? true : baseConfig.enabled,
    apiKey: cliApiKey || baseConfig.apiKey,
    baseUrl: cliBaseUrl || baseConfig.baseUrl,
    model: cliModel || baseConfig.model,
    targetLocales: cliLocales || baseConfig.targetLocales,
    targetPosts: cliPost ? cliPost.split(',').map((s) => s.trim()).filter(Boolean) : baseConfig.targetPosts,
  };

  if (!config.enabled) {
    console.log('[Article-i18n] AI article translation is DISABLED by default (ENABLE_ARTICLE_AI_I18N=false).');
    console.log('[Article-i18n]    -> Safe zero-lag build mode active (0 network requests).');
    console.log('[Article-i18n]    -> To translate articles on-demand locally, run: npm run i18n:translate -- --post <slug>');
    console.log(`[Article-i18n]    -> Indexed ${articleGroups.size} article groups across ${articles.length} posts.`);
    return;
  }

  console.log(`[Article-i18n] AI article translation assistant is ACTIVE!`);
  console.log(`[Article-i18n]    Provider Endpoint: ${config.baseUrl || 'https://ai.121628.xyz/v1'}`);
  console.log(`[Article-i18n]    Active Model: ${config.model || 'kimi-k3-free'}`);
  console.log(`[Article-i18n]    Target Locales: ${config.targetLocales.join(', ')}`);
  console.log(`[Article-i18n]    Confidentiality Protection: ${config.protectEncrypted ? 'ENABLED (Skipping encrypted articles)' : 'DISABLED'}`);
  if (config.targetPosts && config.targetPosts.length > 0) {
    console.log(`[Article-i18n]    Target Post Scope: ${config.targetPosts.join(', ')}`);
  } else {
    console.log(`[Article-i18n]    Target Post Scope: ALL ARTICLES (${articleGroups.size} groups)`);
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

    // Confidentiality Protection Guard
    // When protectEncrypted is true (default), articles with access / externalEncrypt are skipped to protect confidential data.
    // When false, user explicitly permits translating encrypted articles (e.g. for testing chunked translation).
    if (config.protectEncrypted && sourceArticle.isProtected) {
      console.log(`[Article-i18n] 🛡️ Article "${key}" is protected/encrypted. Skipping translation to protect confidential data (ARTICLE_I18N_PROTECT_ENCRYPTED=true).`);
      skippedCount++;
      continue;
    } else if (sourceArticle.isProtected) {
      console.log(`[Article-i18n] ⚠️ Confidentiality protection disabled (ARTICLE_I18N_PROTECT_ENCRYPTED=false). Translating encrypted article "${key}" for verification...`);
    }

    // Dynamically calculate target locales for this article (ensuring bidirectional support)
    let localesToTranslate = [...config.targetLocales];
    if (sourceArticle.lang !== 'zh-CN' && !localesToTranslate.includes('zh-CN')) {
      localesToTranslate.push('zh-CN');
    }

    for (const targetLang of localesToTranslate) {
      if (targetLang === sourceArticle.lang) continue;

      const existingTranslation = group.find((g) => g.lang === targetLang);

      const forceRegenerate = process.env.FORCE_REGENERATE_TRANSLATION === 'true';

      if (existingTranslation) {
        if (!existingTranslation.isAiGenerated) {
          // User-authored translation exists: strictly preserve it!
          skippedCount++;
          continue;
        } else if (!forceRegenerate) {
          // AI-generated translation exists: re-generate if source article is newer, undersized (truncated), or has untranslated Chinese leakage
          const isUndersized = sourceArticle.raw.length > 4000 && existingTranslation.raw.length < sourceArticle.raw.length * 0.6;
          
          let hasChineseLeakage = false;
          let chineseCount = 0;
          if (targetLang !== 'zh-CN' && targetLang !== 'zh-Hant') {
            // 1. Check Frontmatter title & description
            const fmMatch = existingTranslation.raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
            let fmHasChinese = false;
            if (fmMatch) {
              const titleMatch = fmMatch[1].match(/title:\s*["']?(.*?)["']?(?:\r?\n|$)/m);
              const descMatch = fmMatch[1].match(/description:\s*["']?(.*?)["']?(?:\r?\n|$)/m);
              if (titleMatch && /[\u4e00-\u9fa5]/.test(titleMatch[1])) fmHasChinese = true;
              if (descMatch && /[\u4e00-\u9fa5]/.test(descMatch[1])) fmHasChinese = true;
            }

            // 2. Check body, but DO NOT strip mindmap or mermaid code blocks
            let rawWithoutCode = existingTranslation.raw
              .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
              .replace(/<pre[\s\S]*?<\/pre>/gi, '')
              .replace(/<code[\s\S]*?<\/code>/gi, '')
              .replace(/<video[\s\S]*?<\/video>/gi, '')
              .replace(/<audio[\s\S]*?<\/audio>/gi, '')
              .replace(/^(`{3}|~{3})(?:typescript|javascript|ts|js|python|py|bash|sh|shell|html|css|json|yaml|yml|sql|go|rust|c|cpp|tsx|jsx)[\s\S]*?\r?\n\1\s*$/gm, '')
              .replace(/`[^`\r\n]+`/g, '')
              .replace(/\$\$[\s\S]*?\$\$/g, '')
              .replace(/<!--[\s\S]*?-->/g, '')
              .replace(/<ruby[\s\S]*?<\/ruby>/gi, '')
              .replace(/<[^>]+>/g, '');
            const chineseMatches = rawWithoutCode.match(/[\u4e00-\u9fa5]/g) || [];
            chineseCount = chineseMatches.length;
            hasChineseLeakage = fmHasChinese || chineseCount > 20;
          } else if (targetLang === 'zh-Hant') {
            // Check for simplified Chinese character leakage in zh-Hant frontmatter
            const SIMPLIFIED_CHARS = /[这为个们时后点国发对经学现实动应开关门车头经书见长变带门质电条结标页码统计]/;
            const fmMatch = existingTranslation.raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
            if (fmMatch) {
              const titleMatch = fmMatch[1].match(/title:\s*["']?(.*?)["']?(?:\r?\n|$)/m);
              if (titleMatch && SIMPLIFIED_CHARS.test(titleMatch[1])) {
                hasChineseLeakage = true;
                chineseCount = 1;
              }
            }
          }

          if (existingTranslation.mtime >= sourceArticle.mtime && !isUndersized && !hasChineseLeakage) {
            skippedCount++;
            continue;
          }

          if (hasChineseLeakage) {
            console.log(`[Article-i18n] Translation "${existingTranslation.filename}" has ${chineseCount} untranslated Chinese characters. Triggering clean re-translation for ${targetLang}...`);
          } else if (isUndersized) {
            console.log(`[Article-i18n] Translation "${existingTranslation.filename}" is undersized (${existingTranslation.raw.length} vs source ${sourceArticle.raw.length} bytes). Regenerating full translation for ${targetLang}...`);
          } else {
            console.log(`[Article-i18n] Source article "${key}" updated. Refreshing AI translation for ${targetLang}...`);
          }
        } else {
          console.log(`[Article-i18n] Force regenerating translation "${existingTranslation.filename}" for ${targetLang}...`);
        }
      }

      // Determine body size to pick translation strategy
      const bodyLength = sourceArticle.body ? sourceArticle.body.length : sourceArticle.raw.length;

      console.log(`[Article-i18n] Generating ${targetLang} translation for "${key}" (Title: ${sourceArticle.title})...`);
      console.log(`[Article-i18n]    Body is ${bodyLength} chars - using smart dual-scheme orchestrator (scheme: ${config.scheme || 'auto'}, OCR: ${config.enableOcr ? 'on' : 'off'})`);

      const result = await translateArticleAuto({
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
        scheme: config.scheme,
        enableOcr: config.enableOcr,
      });

      if (
        result.ok &&
        result.translatedMarkdown &&
        result.translatedMarkdown.length >= Math.min(100, sourceArticle.raw.length * 0.35) &&
        result.translatedMarkdown.includes('title:')
      ) {
        const targetFilename = `${key}-${targetLang}.md`;
        const targetFilePath = path.join(POSTS_DIR, targetFilename);

        fs.writeFileSync(targetFilePath, result.translatedMarkdown, 'utf8');
        console.log(`[Article-i18n] Successfully generated ${targetFilename} via [${result.provider} / ${result.model}]`);
        generatedCount++;

        // Update in-memory mapping
        i18nMap[key].translations[targetLang] = {
          filename: targetFilename,
          slug: targetFilename.replace(/\.md$/, ''),
          title: result.translatedMarkdown.match(/title:\s*["']?(.*?)["']?\r?\n/)?.[1] || key,
          isAiGenerated: true,
        };
      } else {
        console.error(`[Article-i18n] Failed to generate ${targetLang} translation for "${key}": ${result.error || 'Unknown error'}`);
      }
    }
  }

  // Update mapping file with new translations
  fs.writeFileSync(I18N_MAP_PATH, JSON.stringify(i18nMap, null, 2), 'utf8');
  console.log(`[Article-i18n] Completed: ${generatedCount} generated, ${skippedCount} preserved.`);
}

main().catch((err) => {
  console.error('[Article-i18n] Fatal error during i18n sync:', err);
  process.exit(1);
});
