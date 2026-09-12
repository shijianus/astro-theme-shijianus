import fs from 'node:fs';
import path from 'node:path';

export interface ArticleI18nConfig {
  enabled: boolean;
  targetLocales: string[];
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  groqApiKey?: string;
  groqModel?: string;
  targetPosts?: string[];
}

export interface TranslateArticleOptions {
  sourceMarkdown: string;
  sourceLocale?: string;
  targetLocale: string;
  i18nKey: string;
  slug?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  groqApiKey?: string;
  groqModel?: string;
}

export interface TranslateArticleResult {
  ok: boolean;
  translatedMarkdown: string;
  targetLocale: string;
  i18nKey: string;
  provider: string;
  model: string;
  error?: string;
}

export const LOCALE_NAMES: Record<string, { native: string; english: string }> = {
  'zh-CN': { native: '简体中文', english: 'Simplified Chinese' },
  'zh-Hant': { native: '繁體中文', english: 'Traditional Chinese' },
  en: { native: 'English', english: 'English' },
  fr: { native: 'Français', english: 'French' },
  es: { native: 'Español', english: 'Spanish' },
  de: { native: 'Deutsch', english: 'German' },
};

const PROMPT_TEMPLATE_PATH = path.resolve(process.cwd(), 'src/config/article-i18n-prompt.md');

/**
 * Reads and compiles the article localization system prompt.
 */
export function compileSystemPrompt(sourceLocale = 'zh-CN', targetLocale = 'en'): string {
  let template = '';
  try {
    if (fs.existsSync(PROMPT_TEMPLATE_PATH)) {
      template = fs.readFileSync(PROMPT_TEMPLATE_PATH, 'utf8');
    }
  } catch {}

  if (!template) {
    template = `You are an elite technical translator. Translate the markdown article faithfully into \${TARGET_LOCALE_NAME} (\${TARGET_LOCALE}). Output only valid Markdown starting with --- frontmatter.`;
  }

  const sourceMeta = LOCALE_NAMES[sourceLocale] || { native: sourceLocale, english: sourceLocale };
  const targetMeta = LOCALE_NAMES[targetLocale] || { native: targetLocale, english: targetLocale };

  return template
    .replace(/\$\{TARGET_LOCALE\}/g, targetLocale)
    .replace(/\$\{TARGET_LOCALE_NAME\}/g, `${targetMeta.english} / ${targetMeta.native}`)
    .replace(/\$\{SOURCE_LOCALE\}/g, sourceLocale)
    .replace(/\$\{SOURCE_LOCALE_NAME\}/g, `${sourceMeta.english} / ${sourceMeta.native}`);
}

/**
 * Strips reasoning tokens, outer markdown codeblocks, and ensures frontmatter sanity.
 */
export function cleanAiArticleOutput(raw: string, i18nKey: string, targetLocale: string, sourceLocale = 'zh-CN'): string {
  if (!raw) return '';

  let cleaned = raw
    .replace(/<think>[\s\S]*?(<\/think>|$)/gi, '')
    .trim();

  // Strip wrapping ```markdown ... ``` or ``` ... ```
  if (cleaned.startsWith('```markdown')) {
    cleaned = cleaned.replace(/^```markdown\r?\n/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\r?\n/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\r?\n```$/, '');
  }
  cleaned = cleaned.trim();

  // Validate frontmatter presence
  if (!cleaned.startsWith('---')) {
    // If output starts right before frontmatter, find first ---
    const firstFm = cleaned.indexOf('---');
    if (firstFm !== -1) {
      cleaned = cleaned.slice(firstFm).trim();
    }
  }

  // Ensure i18nKey, lang, and isAiGenerated are accurately set in frontmatter
  const fmMatch = cleaned.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    let fmLines = fmMatch[1].split(/\r?\n/);

    // Remove old lang, i18nKey, isAiGenerated, aiTranslatedFrom lines if duplicated
    fmLines = fmLines.filter(
      (line) =>
        !/^i18nKey\s*:/i.test(line) &&
        !/^lang\s*:/i.test(line) &&
        !/^isAiGenerated\s*:/i.test(line) &&
        !/^aiTranslatedFrom\s*:/i.test(line),
    );

    // Strip externalEncrypt / externalEncrypts blocks entirely from translations.
    // These define encrypted slug routes on the SOURCE article only.
    // Keeping them on translated copies produces duplicate encrypted slugs
    // which causes build errors (validateCustomToken gets "" + "alt" = "alt" → 3 chars, fails).
    const cleanedFmLines: string[] = [];
    let inEncryptBlock = false;
    for (const line of fmLines) {
      if (/^externalEncrypt(s)?\s*:/i.test(line)) {
        inEncryptBlock = true;
        continue;
      }
      if (inEncryptBlock) {
        // Block ends when we hit a top-level key (no leading spaces) that isn't a YAML list item
        if (/^[a-zA-Z]/.test(line) && !line.startsWith('-') && !line.startsWith('#')) {
          inEncryptBlock = false;
        } else {
          continue; // still inside the block, skip
        }
      }
      cleanedFmLines.push(line);
    }

    // Append standard i18n fields
    cleanedFmLines.push(`i18nKey: "${i18nKey}"`);
    cleanedFmLines.push(`lang: "${targetLocale}"`);
    cleanedFmLines.push(`isAiGenerated: true`);
    cleanedFmLines.push(`aiTranslatedFrom: "${sourceLocale}"`);

    cleaned = `---\n${cleanedFmLines.join('\n')}\n---` + cleaned.slice(fmMatch[0].length);
  }

  return cleaned.trim();
}

function loadLocalEnvFiles() {
  for (const envFile of ['.env', '.dev.vars']) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch {}
    }
  }
}

/**
 * Resolves configuration from options and environment variables.
 */
export function resolveArticleI18nConfig(): ArticleI18nConfig {
  loadLocalEnvFiles();
  const enabled = process.env.ENABLE_ARTICLE_AI_I18N === 'true';

  const rawLocales = process.env.ARTICLE_AI_I18N_LOCALES || 'en';
  const targetLocales = rawLocales
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);

  const targetPosts = process.env.ARTICLE_AI_I18N_POSTS
    ? process.env.ARTICLE_AI_I18N_POSTS.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;

  // Custom dedicated article i18n API credentials
  const customKey = process.env.ARTICLE_AI_I18N_API_KEY?.trim();
  const customBase = process.env.ARTICLE_AI_I18N_BASE_URL?.trim();
  const customModel = process.env.ARTICLE_AI_I18N_MODEL?.trim();

  // ChronoralAI fallback credentials
  const instanceKey = process.env.INSTANCE_AI_API_KEY?.trim();
  const instanceBase = process.env.INSTANCE_AI_BASE_URL?.trim() || 'https://ai.121628.xyz/v1';
  const instanceModel = process.env.INSTANCE_AI_MODEL?.trim() || 'kimi-k3-free';

  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  const groqModel = process.env.GROQ_MODEL?.trim() || 'qwen/qwen3.6-27b';

  return {
    enabled,
    targetLocales: targetLocales.length > 0 ? targetLocales : ['en'],
    apiKey: customKey || instanceKey,
    baseUrl: customBase || instanceBase,
    model: customModel || instanceModel,
    groqApiKey,
    groqModel,
    targetPosts,
  };
}

/**
 * Core translation function: calls model with fallback capability.
 */
export async function translateArticle(options: TranslateArticleOptions): Promise<TranslateArticleResult> {
  const {
    sourceMarkdown,
    sourceLocale = 'zh-CN',
    targetLocale,
    i18nKey,
    slug = i18nKey,
  } = options;

  const targetMeta = LOCALE_NAMES[targetLocale] || { native: targetLocale, english: targetLocale };
  const systemPrompt = compileSystemPrompt(sourceLocale, targetLocale);

  const userMessage = [
    `【Target Language】: ${targetMeta.english} (${targetLocale})`,
    `【Unified i18n Key】: "${i18nKey}"`,
    `【Slug Stem】: "${slug}"`,
    '',
    'Please perform complete, idiomatic localization on the following Markdown article in accordance with the system prompt rules.',
    'Output strictly valid raw Markdown starting directly with "---" frontmatter.',
    '',
    'Original Markdown Content:',
    '----------------------------------------',
    sourceMarkdown,
    '----------------------------------------',
  ].join('\n');

  // Candidate endpoints: Custom/Instance AI first, then Groq as fallback
  const customApiKey = options.apiKey || process.env.ARTICLE_AI_I18N_API_KEY || process.env.INSTANCE_AI_API_KEY || '';
  const customBaseUrl = (
    options.baseUrl ||
    process.env.ARTICLE_AI_I18N_BASE_URL ||
    process.env.INSTANCE_AI_BASE_URL ||
    'https://ai.121628.xyz/v1'
  ).replace(/\/+$/, '');
  const customModel = options.model || process.env.ARTICLE_AI_I18N_MODEL || process.env.INSTANCE_AI_MODEL || 'kimi-k3-free';

  const groqKey = options.groqApiKey || process.env.GROQ_API_KEY || '';
  const groqModel = options.groqModel || process.env.GROQ_MODEL || 'qwen/qwen3.6-27b';

  // 1. Attempt Primary (Custom or Instance AI)
  if (customApiKey) {
    try {
      const controller = new AbortController();
      // 90s timeout: full-article translations may take 30-80s on large posts
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const endpoint = `${customBaseUrl}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customApiKey}`,
          'User-Agent': 'Mozilla/5.0 (compatible; ChronralAI/2.0; +https://shijian.us)',
        },
        body: JSON.stringify({
          model: customModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.25,
          max_tokens: 8192,
        }),
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const rawText = json?.choices?.[0]?.message?.content || '';
        const cleaned = cleanAiArticleOutput(rawText, i18nKey, targetLocale, sourceLocale);
        if (cleaned && cleaned.includes('---')) {
          return {
            ok: true,
            translatedMarkdown: cleaned,
            targetLocale,
            i18nKey,
            provider: 'Chronral-Instance',
            model: customModel,
          };
        }
      }
    } catch (err: any) {
      console.warn(`[Article-i18n] Primary endpoint attempt failed (${err.message}). Trying secondary fallback...`);
    }
  }

  // 2. Fallback to Groq (High-speed & Reliable)
  if (groqKey) {
    const candidateGroqModels = Array.from(
    new Set(['openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'llama-3.1-8b-instant', options.groqModel, process.env.GROQ_MODEL].filter(
      (m) => m && m !== 'llama-3.3-70b-versatile'  // remove defunct model
    )),
  ) as string[];

    for (const gModel of candidateGroqModels) {
      try {
        const controller = new AbortController();
        // 120s timeout for Groq: long articles need more time
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: gModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.2,
            max_tokens: 8192,
          }),
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          const rawText = json?.choices?.[0]?.message?.content || '';
          const cleaned = cleanAiArticleOutput(rawText, i18nKey, targetLocale, sourceLocale);
          if (cleaned && cleaned.includes('---')) {
            return {
              ok: true,
              translatedMarkdown: cleaned,
              targetLocale,
              i18nKey,
              provider: 'Chronral-Groq',
              model: gModel,
            };
          }
        } else {
          const errText = await response.text().catch(() => '');
          console.warn(`[Article-i18n] Groq (${gModel}) status ${response.status}: ${errText.slice(0, 120)}`);
        }
      } catch (err: any) {
        console.warn(`[Article-i18n] Groq (${gModel}) fallback attempt failed: ${err.message}`);
      }
    }
  }

  return {
    ok: false,
    translatedMarkdown: '',
    targetLocale,
    i18nKey,
    provider: 'none',
    model: 'error',
    error: 'All configured AI endpoints failed or timed out during translation.',
  };
}
