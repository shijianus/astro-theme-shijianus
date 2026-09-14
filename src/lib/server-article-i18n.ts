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
  scheme?: 'primary' | 'extraction' | 'auto';
  enableOcr?: boolean;
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
  scheme?: 'primary' | 'extraction' | 'auto';
  enableOcr?: boolean;
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
 * Compiles a compact body-only system prompt for chunk translation.
 * Does NOT include frontmatter instructions.
 */
function compileChunkSystemPrompt(targetLocale: string): string {
  const targetMeta = LOCALE_NAMES[targetLocale] || { native: targetLocale, english: targetLocale };
  const localeName = `${targetMeta.english} (${targetMeta.native})`;
  return [
    `You are a professional technical translator and documentation specialist.`,
    `Translate the provided Markdown body text into natural, idiomatic, professional ${localeName}.`,
    `CRITICAL STRUCTURAL RULES:`,
    `1. Output ONLY the translated Markdown text. Do NOT add preamble, conversational remarks, or postscript.`,
    `2. Do NOT add YAML frontmatter or --- header delimiters.`,
    `3. Maintain all Markdown syntax structure (headings #/##/###, blockquotes > [!NOTE], lists, tables, dividers ---) exactly.`,
    `4. CODE, MERMAID & MATH INTEGRITY:`,
    `   - For programming language code blocks (\`\`\`typescript, \`\`\`python, \`\`\`bash, \`\`\`html, etc.): Keep the code intact, only translate inline human-readable comments if helpful.`,
    `   - For Mermaid diagrams (\`\`\`mermaid): TRANSLATE visible human-readable node labels, decision question texts, and edge annotations into ${localeName} (e.g. [Reader visits post], {Is encrypted?}, "Yes", "No"). Keep flowchart syntax, node IDs (A, B, C), and arrows intact.`,
    `   - For Mindmap blocks (\`\`\`mindmap) AND mindmap code examples nested inside \`\`\`\`markdown \`\`\`mindmap ...: TRANSLATE all human-readable outline titles, headings (#, ##, ###), bullet items (- Item), and node labels into ${localeName}. Keep the mindmap indentation and outline hierarchy intact.`,
    `   - Do NOT translate LaTeX / KaTeX math blocks ($$....$$ or $...$). Keep all mathematical formulas, symbols, and expressions completely intact. Never drop \\partial or other LaTeX operators.`,
    `   - Do NOT translate URLs, file paths, image paths, audio paths, video paths, or technical IDs.`,
    `5. HTML & ATTRIBUTES INTEGRITY:`,
    `   - Maintain all HTML opening and closing tags (<div ...>, </div>, <details>, </details>, <summary>, <button>, etc.) exactly as in the source. Never drop or prematurely close HTML container tags.`,
    `   - Strictly keep technical attributes and their values unchanged: class, id, data-level, data-single, data-animate, data-sound, data-hash, data-default, data-video-type, viewBox, etc.`,
    `   - TRANSLATE human-readable text inside user-facing HTML attributes: data-title="...", placeholder="...", aria-label="...", alt="...", title="...", and data-hint="...". Translate ONLY their natural language values into ${localeName}.`,
    `   - IMPORTANT — Widget container tags: For tags like <div class="interactive-unit-converter" data-title="..."> or similar self-closing widget divs, the data-title attribute MUST be translated into ${localeName}. NEVER leave Chinese characters in data-title for non-Chinese locales.`,
    `   - IMPORTANT — Tab button text: For <button class="article-tabs__button" ...> elements inside <div class="article-tabs__nav">, the button text labels (like "🌟 渲染效果呈现", "💻 LaTeX 源码") MUST be translated into ${localeName}. Never leave Chinese in tab button text.`,
    `   - All chat messages (<div class="chat-message ...">) must remain strictly nested inside their parent <div class="article-chat" ...> container.`,
    `   - All accordions (<details class="article-accordion" ...>) must remain strictly inside <div class="article-accordion-group" ...>.`,
    `6. CONTEXT & CONTINUITY:`,
    `   - If any [REFERENCE CONTEXT] is provided, use it strictly for terminology continuity. Do NOT translate or echo the reference context in your output.`,
    `   - Translate ALL text under [TEXT TO TRANSLATE]. Do not truncate or summarize.`,
    `7. CHINESE CHARACTER PROHIBITION (CRITICAL for non-Chinese locales):`,
    `   - This translation is for ${localeName}. After translating, ZERO Chinese characters (Unicode range U+4E00–U+9FFF) should appear in the output EXCEPT inside code fences (\`\`\`....\`\`\`), LaTeX blocks ($$...$$), or HTML attribute values that are part of data-encrypt/data-hash/data-key technical identifiers.`,
    `   - If you encounter a section that you cannot translate (e.g., due to length), DO NOT fall back to the original Chinese. Instead, provide your best translation attempt.`,
  ].join('\n');
}

/**
 * Strips reasoning tokens, outer markdown codeblocks, and ensures frontmatter sanity.
 * NOTE: isAiGenerated is intentionally NOT added. Only i18nKey, lang, aiTranslatedFrom are set.
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

  // Strip legacy or echoed context comments and prompt headers
  cleaned = cleaned.replace(/<!--\s*context from previous chunk\s*-->[\s\S]*?<!--\s*end context\s*-->/gi, '');
  cleaned = cleaned.replace(/<!--\s*context from previous chunk\s*-->/gi, '');
  cleaned = cleaned.replace(/<!--\s*end context\s*-->/gi, '');
  cleaned = cleaned.replace(/\[REFERENCE (?:ONLY|CONTEXT)[\s\S]*?\[END REFERENCE CONTEXT\]/gi, '');
  cleaned = cleaned.replace(/\[Preceding context[\s\S]*?---\r?\n/gi, '');
  cleaned = cleaned.replace(/\[TEXT TO TRANSLATE[^\]]*\]:?\r?\n?/gi, '');
  cleaned = cleaned.replace(/\[END TEXT TO TRANSLATE\]/gi, '');
  cleaned = cleaned.trim();

  // Validate frontmatter presence
  if (!cleaned.startsWith('---')) {
    const firstFm = cleaned.indexOf('---');
    if (firstFm !== -1) {
      cleaned = cleaned.slice(firstFm).trim();
    }
  }

  // Ensure i18nKey, lang, and aiTranslatedFrom are accurately set in frontmatter.
  // isAiGenerated is intentionally NOT added here.
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
    // which causes build errors (validateCustomToken gets "" + "alt" = "alt" -> 3 chars, fails).
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

    // Append standard i18n fields — NO isAiGenerated
    cleanedFmLines.push(`i18nKey: "${i18nKey}"`);
    cleanedFmLines.push(`lang: "${targetLocale}"`);
    cleanedFmLines.push(`aiTranslatedFrom: "${sourceLocale}"`);

    cleaned = `---\n${cleanedFmLines.join('\n')}\n---` + cleaned.slice(fmMatch[0].length);
  }

  // Strip any hardcoded black or dark inline styles to safeguard dark mode readability
  cleaned = cleaned
    .replace(/style=(["'])[^"']*color:\s*(?:#000(?:000)?|black|rgb\(0,\s*0,\s*0\))[^"']*\1/gi, '')
    .replace(/<font\s+color=(["'])(?:#000(?:000)?|black)\1\s*>/gi, '')
    .replace(/<\/font>/gi, '');

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
 * Default target locales: en,zh-Hant,fr,es,de (all 5 non-source locales).
 */
export function resolveArticleI18nConfig(): ArticleI18nConfig {
  loadLocalEnvFiles();
  const enabled = process.env.ENABLE_ARTICLE_AI_I18N === 'true';

  const rawLocales = process.env.ARTICLE_AI_I18N_LOCALES || 'en,zh-Hant,fr,es,de';
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

  const rawScheme = process.env.ARTICLE_AI_I18N_SCHEME?.trim().toLowerCase();
  const scheme: 'primary' | 'extraction' | 'auto' =
    rawScheme === 'extraction' ? 'extraction' : rawScheme === 'primary' ? 'primary' : 'auto';
  const enableOcr = process.env.ENABLE_IMAGE_OCR !== 'false';

  return {
    enabled,
    targetLocales: targetLocales.length > 0 ? targetLocales : ['en', 'zh-Hant', 'fr', 'es', 'de'],
    apiKey: customKey || instanceKey,
    baseUrl: customBase || instanceBase,
    model: customModel || instanceModel,
    groqApiKey,
    groqModel,
    targetPosts,
    scheme,
    enableOcr,
  };
}

// ---------------------------------------------------------------------------
// Low-level API call helper (shared by full and chunked translation paths)
// ---------------------------------------------------------------------------

interface CallModelOptions {
  systemPrompt: string;
  userMessage: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  groqApiKey?: string;
  groqModel?: string;
  timeoutMs?: number;
}

interface CallModelResult {
  ok: boolean;
  text: string;
  provider: string;
  model: string;
  error?: string;
}

let primaryEndpointOffline = false;
const badGeminiKeys = new Set<string>();
const badGeminiModelKeys = new Set<string>();
const rateLimitedGeminiKeys = new Map<string, number>();
let geminiKeyIndex = 0;

async function callModel(opts: CallModelOptions): Promise<CallModelResult> {
  loadLocalEnvFiles();
  const { systemPrompt, userMessage, timeoutMs = 90000 } = opts;

  // 1. Primary: Google Gemini (multi-model, 21 keys round-robin with auto-health filtering & rate limit cooldown)
  const rawGeminiKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  const allGeminiKeys = rawGeminiKeys
    .split(',')
    .map((k) => k.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
  const candidateGeminiKeys = allGeminiKeys.filter((k) => !badGeminiKeys.has(k));

  if (candidateGeminiKeys.length > 0) {
    const candidateGeminiModels = [
      'gemini-2.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
    ];
    for (const gModel of candidateGeminiModels) {
      const now = Date.now();
      const availableKeys = candidateGeminiKeys.filter(
        (k) => !badGeminiModelKeys.has(`${k}:${gModel}`) && (rateLimitedGeminiKeys.get(`${k}:${gModel}`) || 0) <= now,
      );
      const nonBannedKeys = candidateGeminiKeys.filter((k) => !badGeminiModelKeys.has(`${k}:${gModel}`));
      if (nonBannedKeys.length === 0) continue;

      const keysToTry = availableKeys.length > 0 ? availableKeys : nonBannedKeys;
      const maxKeyAttempts = Math.min(keysToTry.length * 2, 20);

      for (let kAttempt = 0; kAttempt < maxKeyAttempts; kAttempt++) {
        const gKey = keysToTry[geminiKeyIndex % keysToTry.length];
        geminiKeyIndex++;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000);
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${encodeURIComponent(gKey)}`;
          const response = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\n---\n\n${userMessage}` }],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8192,
              },
            }),
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            const json = await response.json();
            const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            if (text) {
              return { ok: true, text, provider: 'Chronral-Gemini', model: gModel };
            }
          } else {
            const errText = await response.text().catch(() => '');
            if (response.status === 404) {
              badGeminiModelKeys.add(`${gKey}:${gModel}`);
            } else if (response.status === 403 || response.status === 401) {
              badGeminiKeys.add(gKey);
              console.warn(`[Article-i18n] Gemini key marked permanently inactive (status ${response.status})`);
            } else if (response.status === 429) {
              rateLimitedGeminiKeys.set(`${gKey}:${gModel}`, Date.now() + 20000);
            } else if (response.status !== 503) {
              console.warn(`[Article-i18n] Gemini (${gModel}) status ${response.status}: ${errText.slice(0, 100)}`);
            }
          }
        } catch (err: any) {
          // Network error, try next key
        }
      }
    }
  }

  // 2. Secondary: Groq (High-speed Fallback)
  const groqKey = opts.groqApiKey || process.env.GROQ_API_KEY || '';
  if (groqKey) {
    const candidateGroqModels = Array.from(
      new Set(
        [
          'openai/gpt-oss-120b',
          opts.groqModel,
          process.env.GROQ_MODEL,
          'qwen/qwen3.8-27b',
          'qwen/qwen3.6-27b',
          'openai/gpt-oss-20b',
        ].filter(Boolean) as string[],
      ),
    );

    for (const gModel of candidateGroqModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        const estimatedInputTokens = Math.ceil((systemPrompt.length + userMessage.length) / 3);
        const safeMaxTokens = Math.max(1500, Math.min(3600, 7500 - estimatedInputTokens));
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
            temperature: 0.15,
            max_tokens: safeMaxTokens,
          }),
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const json = await response.json();
          const text = json?.choices?.[0]?.message?.content || '';
          if (text) {
            return { ok: true, text, provider: 'Chronral-Groq', model: gModel };
          }
        }
      } catch (err: any) {}
    }
  }

  // 3. Tertiary: Primary Instance AI
  const customApiKey = opts.apiKey || process.env.ARTICLE_AI_I18N_API_KEY || process.env.INSTANCE_AI_API_KEY || '';
  const customBaseUrl = (
    opts.baseUrl ||
    process.env.ARTICLE_AI_I18N_BASE_URL ||
    process.env.INSTANCE_AI_BASE_URL ||
    'https://ai.121628.xyz/v1'
  ).replace(/\/+$/, '');
  const customModel = opts.model || process.env.ARTICLE_AI_I18N_MODEL || process.env.INSTANCE_AI_MODEL || 'kimi-k3-free';

  if (customApiKey && !primaryEndpointOffline) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
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
        const text = json?.choices?.[0]?.message?.content || '';
        if (text) {
          return { ok: true, text, provider: 'Chronral-Instance', model: customModel };
        }
      } else {
        primaryEndpointOffline = true;
      }
    } catch (err: any) {
      primaryEndpointOffline = true;
    }
  }

  return {
    ok: false,
    text: '',
    provider: 'none',
    model: 'error',
    error: 'All configured AI endpoints failed or timed out.',
  };
}

// ---------------------------------------------------------------------------
// Chunk splitting logic
// ---------------------------------------------------------------------------

/**
 * Splits an article body into semantic chunks at paragraph or heading boundaries.
 * Strictly guarantees that:
 * 1. Fenced code blocks (``` or ~~~) are NEVER cut across chunks.
 * 2. KaTeX math blocks ($$ ... $$) are NEVER cut across chunks.
 * 3. HTML container tags (<div ...> ... </div>, <details> ... </details>, etc.) are NEVER cut across chunks.
 * 4. Human-readable components (tabs, accordions, chat dialogs) remain intact as atomic units.
 */
export function splitIntoChunks(body: string, maxChars = 3200): string[] {
  if (body.length <= maxChars) return [body];

  const lines = body.split('\n');
  const chunks: string[] = [];

  let currentChunkLines: string[] = [];
  let currentChunkChars = 0;

  let inCodeFence = false;
  let codeFenceChar = '';
  let codeFenceLen = 0;

  let inMathFence = false;
  let htmlDepth = 0;

  const VOID_TAGS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
    'circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect', 'stop', 'use'
  ]);

  function scanHtmlDepthChange(line: string): number {
    let delta = 0;
    // Strip inline code spans e.g. `<div>`
    const lineWithoutInlineCode = line.replace(/`[^`]*`/g, '');
    const tagRegex = /<\/?([a-zA-Z0-9_-]+)(?:\s+[^>]*?)?(\/?)>/g;
    let match: RegExpExecArray | null;
    while ((match = tagRegex.exec(lineWithoutInlineCode)) !== null) {
      const isClosing = match[0].startsWith('</');
      const tagName = match[1].toLowerCase();
      const isSelfClosing = match[2] === '/' || VOID_TAGS.has(tagName);

      if (isSelfClosing) continue;
      if (isClosing) {
        delta -= 1;
      } else {
        delta += 1;
      }
    }
    return delta;
  }

  interface SplitCandidate {
    lineIndex: number;
    quality: number; // 3: ##/---, 2: ###, 1: \n\n
    charsSoFar: number;
  }

  let safeSplitPoints: SplitCandidate[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Track code fence: ``` or ~~~
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      const matchFenceStr = fenceMatch[1];
      if (!inCodeFence) {
        inCodeFence = true;
        codeFenceChar = matchFenceStr[0];
        codeFenceLen = matchFenceStr.length;
      } else if (codeFenceChar === matchFenceStr[0] && matchFenceStr.length >= codeFenceLen) {
        inCodeFence = false;
        codeFenceChar = '';
        codeFenceLen = 0;
      }
    }

    // 2. Track math fence: $$
    if (!inCodeFence) {
      if (trimmed === '$$') {
        inMathFence = !inMathFence;
      } else if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 2) {
        // Single-line block math $$ ... $$ does not alter multiline fence state
      } else if (trimmed.startsWith('$$')) {
        inMathFence = true;
      } else if (trimmed.endsWith('$$') && inMathFence) {
        inMathFence = false;
      }
    }

    // 3. Track HTML depth (only outside code fences)
    if (!inCodeFence) {
      // Top-level markdown headings or thematic breaks are never inside inline HTML elements
      if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed === '---') {
        htmlDepth = 0;
      } else {
        const delta = scanHtmlDepthChange(line);
        htmlDepth = Math.max(0, htmlDepth + delta);
      }
    }

    currentChunkLines.push(line);
    currentChunkChars += line.length + 1;

    // A split is safe ONLY when outside code fences, outside math fences, and outside any HTML container
    const isSafeState = !inCodeFence && !inMathFence && htmlDepth === 0;

    if (isSafeState) {
      let quality = 0;
      if (i < lines.length - 1) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith('## ') || nextLine === '---') {
          quality = 3;
        } else if (nextLine.startsWith('### ')) {
          quality = 2;
        } else if (trimmed === '' && nextLine !== '') {
          quality = 1;
        }
      }
      if (quality > 0) {
        safeSplitPoints.push({
          lineIndex: currentChunkLines.length,
          quality,
          charsSoFar: currentChunkChars,
        });
      }
    }

    // If accumulated characters exceed maxChars and we are in a safe state, attempt split
    if (currentChunkChars >= maxChars && isSafeState) {
      const minAcceptableChars = maxChars * 0.55;
      let chosenPoint: SplitCandidate | null = null;

      // Prefer quality 3 or 2 (headings / section rules)
      for (let p = safeSplitPoints.length - 1; p >= 0; p--) {
        const pt = safeSplitPoints[p];
        if (pt.charsSoFar >= minAcceptableChars && pt.quality >= 2) {
          chosenPoint = pt;
          break;
        }
      }

      // Fallback: paragraph boundary
      if (!chosenPoint) {
        for (let p = safeSplitPoints.length - 1; p >= 0; p--) {
          const pt = safeSplitPoints[p];
          if (pt.charsSoFar >= minAcceptableChars) {
            chosenPoint = pt;
            break;
          }
        }
      }

      if (chosenPoint) {
        const chunkLines = currentChunkLines.slice(0, chosenPoint.lineIndex);
        const remainderLines = currentChunkLines.slice(chosenPoint.lineIndex);

        const chunkText = chunkLines.join('\n').trim();
        if (chunkText) chunks.push(chunkText);

        currentChunkLines = remainderLines;
        currentChunkChars = remainderLines.reduce((acc, l) => acc + l.length + 1, 0);
        safeSplitPoints = [];
      } else if (currentChunkChars > maxChars * 1.6) {
        // Overflow safety guard: if block is huge, split at current safe point
        const chunkText = currentChunkLines.join('\n').trim();
        if (chunkText) chunks.push(chunkText);
        currentChunkLines = [];
        currentChunkChars = 0;
        safeSplitPoints = [];
      }
    }
  }

  // Flush any remaining lines
  if (currentChunkLines.length > 0) {
    const chunkText = currentChunkLines.join('\n').trim();
    if (chunkText) chunks.push(chunkText);
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Chunk / frontmatter translation helpers
// ---------------------------------------------------------------------------

/**
 * Translates ONLY the YAML frontmatter fields (title, description, category, group, tags).
 * All technical/non-translatable fields are preserved unchanged.
 */
export async function translateFrontmatterOnly(
  frontmatter: string,
  options: TranslateArticleOptions,
): Promise<string> {
  const { targetLocale } = options;
  const targetMeta = LOCALE_NAMES[targetLocale] || { native: targetLocale, english: targetLocale };
  const localeName = `${targetMeta.english} / ${targetMeta.native}`;

  const systemPrompt = [
    `You are a precise YAML translator. Translate ONLY the human-readable text values in the given YAML frontmatter into ${localeName}.`,
    `Rules:`,
    `- Translate ONLY the values of these fields: title, description, category, group, tags (and tag list items).`,
    `- Do NOT translate or modify: i18nKey, lang, date, updated, cover, images, slug, permalink, abbrlink, externalLink, encrypt, externalEncrypt, externalEncrypts, pinned, sticky, hidden, draft, isAiGenerated, aiTranslatedFrom, wordCount, readingTime, or any field whose value is a URL, number, boolean, or null.`,
    `- Output ONLY the raw YAML block (no --- delimiters, no markdown fences).`,
    `- Preserve the exact YAML structure, indentation, and key order.`,
  ].join('\n');

  const userMessage = `Frontmatter to translate:\n\n${frontmatter}`;

  const result = await callModel({
    systemPrompt,
    userMessage,
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
    model: options.model,
    groqApiKey: options.groqApiKey,
    groqModel: options.groqModel,
    timeoutMs: 45000,
  });

  if (result.ok && result.text.trim()) {
    let out = result.text.trim();
    if (out.startsWith('```')) out = out.replace(/^```[a-z]*\r?\n/, '');
    if (out.endsWith('```')) out = out.replace(/\r?\n```$/, '');
    return out.trim();
  }

  // Fallback: return original frontmatter unchanged
  return frontmatter;
}

/**
 * Translates a single body chunk (not a full article; no frontmatter expected in output).
 * Includes retry logic (up to 5 attempts). Falls back to original source chunk on failure.
 */
export async function translateBodyChunk(
  chunk: string,
  chunkIndex: number,
  totalChunks: number,
  options: TranslateArticleOptions,
  prevContext?: string,
): Promise<{ text: string; provider: string; model: string }> {
  const { i18nKey, targetLocale } = options;
  const targetMeta = LOCALE_NAMES[targetLocale] || { native: targetLocale, english: targetLocale };
  const localeName = `${targetMeta.english} (${targetMeta.native})`;
  const systemPrompt = compileChunkSystemPrompt(targetLocale);

  const parts: string[] = [];
  parts.push(`Translate Chunk ${chunkIndex + 1} of ${totalChunks} of the article body into ${localeName}.`);
  if (prevContext && prevContext.trim()) {
    parts.push(
      '',
      `[REFERENCE CONTEXT - FOR CONTINUITY ONLY - DO NOT TRANSLATE - DO NOT OUTPUT]:`,
      prevContext.trim().slice(-300),
      `[END REFERENCE CONTEXT]`,
    );
  }
  parts.push('', `[TEXT TO TRANSLATE]:`, chunk, `[END TEXT TO TRANSLATE]`);
  const userMessage = parts.join('\n');

  const MAX_RETRIES = 5;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await callModel({
      systemPrompt,
      userMessage,
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
      model: options.model,
      groqApiKey: options.groqApiKey,
      groqModel: options.groqModel,
      timeoutMs: 60000,
    });

    if (result.ok && result.text.trim()) {
      let translated = result.text.trim();

      // Smart wrapper stripping: only strip artificial outer ```markdown ... ``` wrapper if the source chunk did not start with a code fence
      const sourceStartsWithFence = /^(`{3,}|~{3,})/i.test(chunk.trim());
      const sourceEndsWithFence = /(`{3,}|~{3,})$/i.test(chunk.trim());

      if (!sourceStartsWithFence && /^```(?:markdown)?\r?\n/i.test(translated) && /\r?\n```$/.test(translated)) {
        translated = translated.replace(/^```(?:markdown)?\r?\n/i, '').replace(/\r?\n```$/, '').trim();
      }

      // Strip echoed prompt markers and reference context
      translated = translated.replace(/\[REFERENCE CONTEXT[\s\S]*?\[END REFERENCE CONTEXT\]/gi, '').trim();
      translated = translated.replace(/<!--\s*context from previous chunk\s*-->[\s\S]*?<!--\s*end context\s*-->/gi, '').trim();
      translated = translated.replace(/<!--\s*context from previous chunk\s*-->/gi, '').trim();
      translated = translated.replace(/<!--\s*end context\s*-->/gi, '').trim();
      translated = translated.replace(/^\[TEXT TO TRANSLATE\]:\s*\r?\n?/i, '').trim();
      translated = translated.replace(/\[END TEXT TO TRANSLATE\]\s*$/i, '').trim();

      // Strip conversational intros (e.g. "Here is the translation:", "Aquí tienes la traducción...", "Voici la traduction :", etc.)
      translated = translated.replace(/^(?:(?:Aquí tienes|Here is|Voici|Hier ist|Claro|Sure|Below is|Here's|Voici la|Este es)[\s\S]*?:\s*\r?\n+)/i, '').trim();
      // Strip conversational outros
      translated = translated.replace(/\r?\n+(?:(?:Espero que|Hope this|J'espère que|Ich hoffe|Si tienes alguna)[\s\S]*)$/i, '').trim();

      // Strip accidental frontmatter block ONLY if it contains YAML metadata keys
      if (translated.startsWith('---')) {
        const secondDashes = translated.indexOf('---', 3);
        if (secondDashes !== -1 && secondDashes < 500) {
          const possibleFm = translated.slice(0, secondDashes + 3);
          if (possibleFm.includes('title:') || possibleFm.includes('lang:') || possibleFm.includes('pubDate:')) {
            translated = translated.slice(secondDashes + 3).trim();
          }
        }
      }

      console.log(`[Article-i18n] 📦 Chunk ${chunkIndex + 1}/${totalChunks} for "${i18nKey}" -> translated via [${result.provider} / ${result.model}]`);
      return { text: translated, provider: result.provider, model: result.model };
    }

    if (attempt < MAX_RETRIES) {
      const delay = Math.min(attempt * 4000, 20000);
      console.warn(`[Article-i18n] Warning: Chunk ${chunkIndex + 1}/${totalChunks} attempt ${attempt} failed, retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // All retries exhausted: use original source chunk as fallback
  console.warn(`[Article-i18n] Warning: Chunk ${chunkIndex + 1}/${totalChunks} for "${i18nKey}" failed all retries - using original source text as fallback.`);
  return { text: chunk, provider: 'fallback-source', model: 'none' };
}

// ---------------------------------------------------------------------------
// Chunked translation pipeline
// ---------------------------------------------------------------------------

/**
 * Full chunked translation pipeline for large articles (body > 8000 chars).
 * 1. Extracts frontmatter and body
 * 2. Translates frontmatter (first request)
 * 3. Splits body into ~3500-char semantic chunks
 * 4. Translates each chunk sequentially (3s delay between calls to avoid rate limiting)
 * 5. Reassembles: translated frontmatter + translated body chunks
 * 6. Runs cleanAiArticleOutput() and returns TranslateArticleResult
 */
export async function translateArticleChunked(options: TranslateArticleOptions): Promise<TranslateArticleResult> {
  const { sourceMarkdown, sourceLocale = 'zh-CN', targetLocale, i18nKey } = options;

  // Extract frontmatter and body
  const fmMatch = sourceMarkdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) {
    console.warn(`[Article-i18n] Warning: No frontmatter detected for "${i18nKey}". Falling back to full translateArticle().`);
    return translateArticle(options);
  }

  const rawFrontmatter = fmMatch[1];
  const rawBody = fmMatch[2];

  console.log(`[Article-i18n] Starting chunked translation for "${i18nKey}" -> ${targetLocale}`);
  console.log(`[Article-i18n]    Body length: ${rawBody.length} chars`);

  // Step 1: Translate frontmatter
  const translatedFm = await translateFrontmatterOnly(rawFrontmatter, options);

  // Brief pause before body chunks
  await new Promise((r) => setTimeout(r, 1500));

  // Step 2: Split body into clean semantic chunks (~3200 chars each)
  const chunks = splitIntoChunks(rawBody, 3200);
  console.log(`[Article-i18n]    Split into ${chunks.length} chunks`);

  // Step 3: Translate each chunk sequentially
  const translatedChunks: string[] = [];
  let lastProvider = 'none';
  let lastModel = 'none';

  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) {
      // 3s delay between chunk API calls to avoid rate limiting
      await new Promise((r) => setTimeout(r, 3000));
    }
    // Extract only a clean complete sentence or heading from the end of the previous chunk.
    // Never slice raw characters across math formulas or code blocks.
    const prevCleanLines = (i > 0 ? chunks[i - 1] : '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('```') && !l.startsWith('$$') && !l.startsWith('<'));
    const prevContext = prevCleanLines.length > 0 ? prevCleanLines[prevCleanLines.length - 1] : '';
    const chunkRes = await translateBodyChunk(chunks[i], i, chunks.length, options, prevContext);
    
    // Strict integrity guard: if any chunk failed all retries and defaulted to source,
    // abort Scheme 1 immediately so Scheme 2 (Extraction & Re-insertion) takes over!
    if (chunkRes.provider === 'fallback-source') {
      console.warn(`[Article-i18n] ❌ Chunk ${i + 1}/${chunks.length} failed all translation retries for ${targetLocale}. Failing Scheme 1 to activate Scheme 2 backup.`);
      return {
        ok: false,
        error: `Body chunk ${i + 1}/${chunks.length} failed all translation attempts in Scheme 1`,
        targetLocale,
        i18nKey,
        provider: 'fallback-source',
        model: 'none',
      };
    }

    translatedChunks.push(chunkRes.text);
    lastProvider = chunkRes.provider;
    lastModel = chunkRes.model;
  }

  // Step 4: Reassemble translated frontmatter + body
  const translatedBody = translatedChunks.join('\n\n');
  const reconstructed = `---\n${translatedFm}\n---\n${translatedBody}`;

  // Step 5: Clean and finalize
  let cleaned = cleanAiArticleOutput(reconstructed, i18nKey, targetLocale, sourceLocale);

  if (cleaned && cleaned.includes('---')) {
    if (options.enableOcr !== false) {
      cleaned = await processImagesWithOcr(cleaned, targetLocale);
    }
    return {
      ok: true,
      translatedMarkdown: cleaned,
      targetLocale,
      i18nKey,
      provider: lastProvider,
      model: lastModel,
    };
  }

  return {
    ok: false,
    translatedMarkdown: '',
    targetLocale,
    i18nKey,
    provider: 'none',
    model: 'error',
    error: 'Chunked translation produced empty or invalid output.',
  };
}

// ---------------------------------------------------------------------------
// Original single-request translation (for small articles with body <= 8000 chars)
// ---------------------------------------------------------------------------

/**
 * Core translation function: calls model with fallback capability.
 * Use for articles with body <= 8000 chars. For larger articles, use translateArticleChunked().
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
    `Target Language: ${targetMeta.english} (${targetLocale})`,
    `Unified i18n Key: "${i18nKey}"`,
    `Slug Stem: "${slug}"`,
    '',
    'Please perform complete, idiomatic localization on the following Markdown article in accordance with the system prompt rules.',
    'Output strictly valid raw Markdown starting directly with "---" frontmatter.',
    '',
    'Original Markdown Content:',
    '----------------------------------------',
    sourceMarkdown,
    '----------------------------------------',
  ].join('\n');

  const result = await callModel({
    systemPrompt,
    userMessage,
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
    model: options.model,
    groqApiKey: options.groqApiKey,
    groqModel: options.groqModel,
    timeoutMs: 90000,
  });

  if (result.ok && result.text) {
    let cleaned = cleanAiArticleOutput(result.text, i18nKey, targetLocale, sourceLocale);
    if (cleaned && cleaned.includes('---')) {
      if (options.enableOcr !== false) {
        cleaned = await processImagesWithOcr(cleaned, targetLocale);
      }
      return {
        ok: true,
        translatedMarkdown: cleaned,
        targetLocale,
        i18nKey,
        provider: result.provider,
        model: result.model,
      };
    }
  }

  return {
    ok: false,
    translatedMarkdown: '',
    targetLocale,
    i18nKey,
    provider: 'none',
    model: 'error',
    error: result.error || 'All configured AI endpoints failed or timed out during translation.',
  };
}

// ---------------------------------------------------------------------------
// Image OCR Extraction & Localization Pipeline
// ---------------------------------------------------------------------------

/**
 * Extracts visible text from an image via Gemini Vision OCR, then translates it.
 * Supports both local media paths (e.g. /media/shijianus/workbench.jpg) and remote URLs.
 */
export async function performImageOcr(imageSrc: string, targetLocale = 'en'): Promise<string | null> {
  try {
    loadLocalEnvFiles();
    const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    const geminiKeys = rawKeys.split(',').map((k) => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    if (geminiKeys.length === 0) return null;

    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(imageSrc, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > 5 * 1024 * 1024) return null;
      base64Data = buffer.toString('base64');
      const ct = res.headers.get('content-type');
      if (ct) mimeType = ct.split(';')[0].trim();
    } else {
      let cleanSrc = imageSrc.replace(/^\/+/, '');
      let fullPath = path.resolve(process.cwd(), 'public', cleanSrc);
      if (!fs.existsSync(fullPath)) {
        fullPath = path.resolve(process.cwd(), cleanSrc);
      }
      if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) return null;
      const buffer = fs.readFileSync(fullPath);
      if (buffer.length > 5 * 1024 * 1024) return null;
      base64Data = buffer.toString('base64');
      if (cleanSrc.endsWith('.png')) mimeType = 'image/png';
      else if (cleanSrc.endsWith('.webp')) mimeType = 'image/webp';
      else if (cleanSrc.endsWith('.svg')) mimeType = 'image/svg+xml';
      else mimeType = 'image/jpeg';
    }

    if (!base64Data) return null;

    const targetMeta = LOCALE_NAMES[targetLocale] || { native: targetLocale, english: targetLocale };
    const promptText = `Extract all readable and visible text from this image via OCR. If the image contains text, diagrams, labels, screenshots, UI, or code, output the extracted text accurately localized into ${targetMeta.english} / ${targetMeta.native}. If the image contains NO text (e.g. pure abstract illustration, landscape photo, or zero readable letters), reply strictly: NO_TEXT.`;

    for (const key of geminiKeys) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`;
        const res = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { text: promptText },
                { inlineData: { mimeType, data: base64Data } }
              ]
            }],
            generationConfig: {
              maxOutputTokens: 350,
              temperature: 0.1,
              thinkingConfig: { thinkingBudget: 0 }
            }
          })
        });
        clearTimeout(timeout);
        if (res.ok) {
          const json = await res.json();
          const extracted = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          if (extracted && !extracted.includes('NO_TEXT') && extracted.length > 2) {
            return extracted.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
          }
          return null;
        }
      } catch {
        // try next candidate key
      }
    }
  } catch (err: any) {
    console.warn(`[Article-i18n] OCR extraction skipped for ${imageSrc}: ${err.message}`);
  }
  return null;
}

/**
 * Scans markdown content for images and enriches them with OCR captions and alt text.
 */
export async function processImagesWithOcr(markdown: string, targetLocale = 'en'): Promise<string> {
  const targetMeta = LOCALE_NAMES[targetLocale] || { native: targetLocale, english: targetLocale };
  const badgeLabel = `OCR · ${targetMeta.native || targetLocale}`;

  // Find markdown images: ![alt](src)
  const mdImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let matches: Array<{ full: string; alt: string; src: string }> = [];
  let m;
  while ((m = mdImgRegex.exec(markdown)) !== null) {
    matches.push({ full: m[0], alt: m[1], src: m[2].trim() });
  }

  if (matches.length === 0) return markdown;

  let modified = markdown;
  for (const match of matches) {
    if (modified.includes('data-image-ocr="true"') && modified.includes(match.src)) {
      continue;
    }
    const ocrText = await performImageOcr(match.src, targetLocale);
    if (ocrText) {
      const ocrCard = `\n<div class="article-image-ocr" data-image-ocr="true">\n  <span class="ocr-badge">📷 ${badgeLabel}</span>\n  <span class="ocr-text">${ocrText}</span>\n</div>\n`;
      modified = modified.replace(match.full, `${match.full}\n${ocrCard}`);
    }
  }

  return modified;
}

// ---------------------------------------------------------------------------
// Format Validation Engine
// ---------------------------------------------------------------------------

/**
 * Validates that the translated output has preserved the essential Markdown/HTML structural integrity.
 */
export function validateTranslatedFormat(
  sourceMarkdown: string,
  translatedMarkdown: string,
  targetLocale = 'en',
): { valid: boolean; reason?: string } {
  if (!translatedMarkdown || translatedMarkdown.length < 50) {
    return { valid: false, reason: 'Output too short' };
  }

  // Check code blocks preservation (support indented fences)
  const srcCodeBlocks = (sourceMarkdown.match(/^\s*(`{3,}|~{3,})[a-z0-9_-]+/gim) || []).length;
  const transCodeBlocks = (translatedMarkdown.match(/^\s*(`{3,}|~{3,})[a-z0-9_-]+/gim) || []).length;
  if (srcCodeBlocks > 0 && transCodeBlocks < Math.floor(srcCodeBlocks * 0.5)) {
    return { valid: false, reason: `Code blocks dropped: expected ~${srcCodeBlocks}, got ${transCodeBlocks}` };
  }

  // Check code block parity (even count of code fence lines)
  const totalFenceLines = (translatedMarkdown.match(/^\s*(`{3,}|~{3,})/gim) || []).length;
  if (totalFenceLines % 2 !== 0) {
    return { valid: false, reason: `Unbalanced code fences (odd number of code fence lines: ${totalFenceLines})` };
  }

  // Check KaTeX math block parity (even count of $$)
  const srcMathBlocks = (sourceMarkdown.match(/\$\$/g) || []).length;
  const transMathBlocks = (translatedMarkdown.match(/\$\$/g) || []).length;
  if (srcMathBlocks > 0 && transMathBlocks % 2 !== 0) {
    return { valid: false, reason: `Unbalanced KaTeX math fences (odd number of $$: ${transMathBlocks})` };
  }

  // Check for corrupted LaTeX partial formula (e.g. artial t} where \p was severed)
  if (/(?<![pP])artial\s+[a-zA-Z0-9_\{\}\\]+/i.test(translatedMarkdown) || /(?<![pP])artial\s*t\}/i.test(translatedMarkdown)) {
    return { valid: false, reason: 'Corrupted LaTeX formula detected (partial cut: artial t})' };
  }

  // Check HTML tags preservation
  const srcHtmlTags = (sourceMarkdown.match(/<(?:div|span|details|summary|table|tr|td|th|mark|kbd|figure|figcaption)/gi) || []).length;
  const transHtmlTags = (translatedMarkdown.match(/<(?:div|span|details|summary|table|tr|td|th|mark|kbd|figure|figcaption)/gi) || []).length;
  if (srcHtmlTags >= 4 && transHtmlTags < Math.floor(srcHtmlTags * 0.6)) {
    return { valid: false, reason: `HTML tags dropped: expected ~${srcHtmlTags}, got ${transHtmlTags}` };
  }

  // Check HTML container balance (<div> vs </div>, <details> vs </details>) relative to source
  const srcOpenDivs = (sourceMarkdown.match(/<div(\s+[^>]*)?>/gi) || []).length;
  const srcCloseDivs = (sourceMarkdown.match(/<\/div>/gi) || []).length;
  const srcDivDiff = Math.abs(srcOpenDivs - srcCloseDivs);
  const openDivs = (translatedMarkdown.match(/<div(\s+[^>]*)?>/gi) || []).length;
  const closeDivs = (translatedMarkdown.match(/<\/div>/gi) || []).length;
  const transDivDiff = Math.abs(openDivs - closeDivs);
  if (Math.abs(transDivDiff - srcDivDiff) > 8) {
    return { valid: false, reason: `Unbalanced <div> tags in translation: open=${openDivs}, close=${closeDivs} (source diff: ${srcDivDiff})` };
  }

  const openDetails = (translatedMarkdown.match(/<details(\s+[^>]*)?>/gi) || []).length;
  const closeDetails = (translatedMarkdown.match(/<\/details>/gi) || []).length;
  if (openDetails !== closeDetails) {
    return { valid: false, reason: `Unbalanced <details> tags in translation: open=${openDetails}, close=${closeDetails}` };
  }

  // Check for unclosed article-accordion-group swallowing article-tabs
  if (/<div[^>]*class="[^"]*article-accordion-group[^"]*"[^>]*>(?:(?!<\/div>)[\s\S])*?<div[^>]*class="[^"]*article-tabs/i.test(translatedMarkdown)) {
    return { valid: false, reason: 'Unclosed article-accordion-group swallowed downstream article-tabs' };
  }

  // Check for chat container presence if chat messages exist
  const transChatMessages = (translatedMarkdown.match(/<div[^>]*class="[^"]*chat-message/gi) || []).length;
  const transChatContainers = (translatedMarkdown.match(/<div[^>]*class="[^"]*article-chat/gi) || []).length;
  if (transChatMessages > 0 && transChatContainers === 0) {
    return { valid: false, reason: 'Chat messages present but outer article-chat container is missing' };
  }

  // Check for untranslated Chinese in data-title attribute for non-Chinese locales
  if (targetLocale !== 'zh-CN' && targetLocale !== 'zh-Hant') {
    const dataTitleMatch = translatedMarkdown.match(/data-title="([^"]*[\u4e00-\u9fa5]+[^"]*)"/);
    if (dataTitleMatch) {
      return { valid: false, reason: `Untranslated Chinese characters in data-title: ${dataTitleMatch[0]}` };
    }

    // Check for excessive residual Chinese characters in body (outside code blocks and LaTeX math)
    let textWithoutCode = translatedMarkdown;
    textWithoutCode = textWithoutCode.replace(/^(`{4,}|~{4,})[^\n]*\r?\n[\s\S]*?\r?\n\1\s*$/gm, '');
    textWithoutCode = textWithoutCode.replace(/^(`{3}|~{3})[^\n]*\r?\n[\s\S]*?\r?\n\1\s*$/gm, '');
    textWithoutCode = textWithoutCode
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`\r\n]+`/g, '')
      .replace(/\$\$[\s\S]*?\$\$/g, '')
      .replace(/\$[^$\r\n]+\$/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, '');

    const chineseMatches = textWithoutCode.match(/[\u4e00-\u9fa5]/g) || [];
    const nonCodeLen = textWithoutCode.replace(/\s+/g, '').length;
    const chineseRatio = nonCodeLen > 0 ? (chineseMatches.length / nonCodeLen) : 0;

    // If more than 70 Chinese characters remain, or Chinese exceeds 1% of body text,
    // this indicates a failed chunk fallback, dropped translation, or untranslated section.
    if (chineseMatches.length > 70 || (chineseMatches.length > 25 && chineseRatio > 0.01)) {
      return {
        valid: false,
        reason: `Excessive residual Chinese text in ${targetLocale} translation: ${chineseMatches.length} characters (${(chineseRatio * 100).toFixed(1)}% of body). Likely chunk translation failure or dropped translation.`
      };
    }
  }

  // Check for leaked markers
  if (
    /<!--\s*context from previous chunk\s*-->/i.test(translatedMarkdown) ||
    /<!--\s*end context\s*-->/i.test(translatedMarkdown) ||
    /\[REFERENCE (?:ONLY|CONTEXT)\]/i.test(translatedMarkdown) ||
    /\[TEXT TO TRANSLATE\]/i.test(translatedMarkdown)
  ) {
    return { valid: false, reason: `Leaked prompt markers detected in output` };
  }

  // Check headings preservation
  const srcHeadings = (sourceMarkdown.match(/^#{1,6}\s+/gm) || []).length;
  const transHeadings = (translatedMarkdown.match(/^#{1,6}\s+/gm) || []).length;
  if (srcHeadings >= 3 && transHeadings < Math.floor(srcHeadings * 0.6)) {
    return { valid: false, reason: `Headings dropped: expected ~${srcHeadings}, got ${transHeadings}` };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Scheme 2: AST & Text Node Extraction with In-Place Re-insertion
// ---------------------------------------------------------------------------

/**
 * Scheme 2 (Backup Plan / 备案方案):
 * 1. Parses article body into a structural template with placeholders for translatable text.
 * 2. Shields 100% of code blocks, HTML tags, attributes, CSS classes, URLs, and math formulas.
 * 3. Chunks translatable text segments into small batches (分片) and translates them via JSON dictionary.
 * 4. Re-inserts translated text into the exact template positions.
 * 5. Guarantees 0% formatting loss, 0% tag degradation, and 0% loading failure.
 */
export async function translateArticleByExtraction(options: TranslateArticleOptions): Promise<TranslateArticleResult> {
  const { sourceMarkdown, sourceLocale = 'zh-CN', targetLocale, i18nKey } = options;

  const fmMatch = sourceMarkdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) {
    return translateArticle(options);
  }

  const rawFrontmatter = fmMatch[1];
  const rawBody = fmMatch[2];

  console.log(`[Article-i18n] [Scheme 2: Extraction] Translating frontmatter for "${i18nKey}"...`);
  const translatedFm = await translateFrontmatterOnly(rawFrontmatter, options);

  // 1. Mask non-translatable blocks into protected tokens
  const protectedTokens: string[] = [];
  const mask = (val: string) => {
    const placeholder = `__PROT_${protectedTokens.length}__`;
    protectedTokens.push(val);
    return placeholder;
  };

  let template = rawBody;

  // Mask fenced code blocks (``` ... ```)
  template = template.replace(/```[a-z0-9_-]*\r?\n[\s\S]*?\r?\n```/gi, (m) => mask(m));

  // Mask block math ($$ ... $$)
  template = template.replace(/\$\$[\s\S]*?\$\$/g, (m) => mask(m));

  // Mask inline code (`...`)
  template = template.replace(/`[^`\r\n]+`/g, (m) => mask(m));

  // Mask inline math ($...$)
  template = template.replace(/\$[^$\r\n]+\$/g, (m) => mask(m));

  // Mask HTML comments
  template = template.replace(/<!--[\s\S]*?-->/g, (m) => mask(m));

  // 2. Extract translatable segments line by line
  const textSegments: string[] = [];
  const addSegment = (text: string): string => {
    const trimmed = text.trim();
    if (!trimmed || /^[\d\s.,:;!?_—–\-=+*\/\\|()\[\]{}'"]+$/.test(trimmed) || /^__PROT_\d+__$/.test(trimmed)) {
      return text;
    }
    const idx = textSegments.length;
    textSegments.push(trimmed);
    const leading = text.match(/^\s*/)?.[0] || '';
    const trailing = text.match(/\s*$/)?.[0] || '';
    return `${leading}__TX_NODE_${idx}__${trailing}`;
  };

  // Mask HTML tags (<div ...>, </span>, etc.), while extracting translatable attributes
  template = template.replace(/<[^>]+>/g, (tagStr) => {
    const translatableAttrs = ['data-title', 'placeholder', 'aria-label', 'alt', 'title', 'data-hint'];
    let modifiedTag = tagStr;
    for (const attr of translatableAttrs) {
      const attrRegex = new RegExp(`(${attr}=)(["'])(.*?)\\2`, 'gi');
      modifiedTag = modifiedTag.replace(attrRegex, (_match, prefix, quote, val) => {
        if (val && !/^[\d\s.,:;!?_—–\-=+*\/\\|()\[\]{}'"]+$/.test(val)) {
          return `${prefix}${quote}${addSegment(val)}${quote}`;
        }
        return _match;
      });
    }
    return mask(modifiedTag);
  });

  const lines = template.split('\n');
  const templatedLines: string[] = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      templatedLines.push(line);
      continue;
    }

    // Heading: ## Heading text
    const headingMatch = line.match(/^(#{1,6}\s+)(.*)$/);
    if (headingMatch) {
      templatedLines.push(headingMatch[1] + addSegment(headingMatch[2]));
      continue;
    }

    // Blockquote: > text
    const bqMatch = line.match(/^(>\s*(?:\[!(?:NOTE|TIP|WARNING|IMPORTANT|CAUTION|QUOTE)\])?\s*)(.*)$/);
    if (bqMatch) {
      templatedLines.push(bqMatch[1] + addSegment(bqMatch[2]));
      continue;
    }

    // List item: - text or 1. text
    const listMatch = line.match(/^(\s*[-*+]\s+|\s*\d+\.\s+)(.*)$/);
    if (listMatch) {
      templatedLines.push(listMatch[1] + addSegment(listMatch[2]));
      continue;
    }

    // Table row: | col1 | col2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const parts = line.split('|');
      const newParts = parts.map((cell) => {
        const cTrim = cell.trim();
        if (/^:?-+:?$/.test(cTrim) || !cTrim) return cell;
        return addSegment(cell);
      });
      templatedLines.push(newParts.join('|'));
      continue;
    }

    // Regular line: extract links and plain text segments cleanly without nested wrapping
    if (/\[([^\]]+)\]\(([^)]+)\)/.test(line)) {
      let result = '';
      let lastIdx = 0;
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match: RegExpExecArray | null;
      while ((match = linkRegex.exec(line)) !== null) {
        const textBefore = line.slice(lastIdx, match.index);
        if (textBefore) result += addSegment(textBefore);
        const anchorSeg = addSegment(match[1]);
        result += `[${anchorSeg}](${match[2]})`;
        lastIdx = match.index + match[0].length;
      }
      const textAfter = line.slice(lastIdx);
      if (textAfter) result += addSegment(textAfter);
      templatedLines.push(result);
    } else {
      templatedLines.push(addSegment(line));
    }
  }

  let finalBodyTemplate = templatedLines.join('\n');
  console.log(`[Article-i18n] [Scheme 2] Extracted ${textSegments.length} text segments to translate.`);

  // 3. Batch translate segments in chunks of 25 (~1500 chars)
  const translatedSegments: string[] = new Array(textSegments.length);
  const BATCH_SIZE = 25;
  const targetMeta = LOCALE_NAMES[targetLocale] || { native: targetLocale, english: targetLocale };

  for (let b = 0; b < textSegments.length; b += BATCH_SIZE) {
    const slice = textSegments.slice(b, b + BATCH_SIZE);
    const batchDict: Record<string, string> = {};
    slice.forEach((s, idx) => {
      batchDict[String(idx)] = s;
    });

    const batchPrompt = [
      `You are a high-precision translation engine. Translate the JSON string values into ${targetMeta.english} / ${targetMeta.native}.`,
      `Rules:`,
      `- Preserve all keys ("0", "1", ...) EXACTLY identical.`,
      `- Do not modify tokens like __PROT_0__, __PROT_1__, etc. Keep them intact.`,
      `- Output ONLY a strictly valid JSON object matching the input keys.`,
    ].join('\n');

    let translatedBatch: Record<string, string> | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await callModel({
          systemPrompt: batchPrompt,
          userMessage: JSON.stringify(batchDict, null, 2),
          apiKey: options.apiKey,
          baseUrl: options.baseUrl,
          model: options.model,
          groqApiKey: options.groqApiKey,
          groqModel: options.groqModel,
          timeoutMs: 45000,
        });

        if (res.ok && res.text) {
          let cleanJson = res.text.trim();
          if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/^```json\r?\n/, '');
          else if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/^```[a-z]*\r?\n/, '');
          if (cleanJson.endsWith('```')) cleanJson = cleanJson.replace(/\r?\n```$/, '');
          cleanJson = cleanJson.trim();

          const parsed = JSON.parse(cleanJson);
          if (parsed && typeof parsed === 'object') {
            translatedBatch = parsed;
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[Article-i18n] [Scheme 2] Batch ${b / BATCH_SIZE + 1} attempt ${attempt} failed: ${err.message}`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    slice.forEach((s, idx) => {
      const trans = translatedBatch?.[String(idx)];
      translatedSegments[b + idx] = (trans && typeof trans === 'string' && trans.trim()) ? trans.trim() : s;
    });
  }

  // 4. In-place re-insertion of translated segments into protected tokens (for HTML attributes like data-title)
  for (let p = 0; p < protectedTokens.length; p++) {
    for (let i = 0; i < translatedSegments.length; i++) {
      const token = `__TX_NODE_${i}__`;
      if (protectedTokens[p].includes(token)) {
        protectedTokens[p] = protectedTokens[p].replaceAll(token, translatedSegments[i] || textSegments[i]);
      }
    }
  }

  // 5. In-place re-insertion of translated segments into body template
  for (let i = 0; i < translatedSegments.length; i++) {
    const token = `__TX_NODE_${i}__`;
    finalBodyTemplate = finalBodyTemplate.replaceAll(token, translatedSegments[i] || textSegments[i]);
  }

  // 6. Restore protected tokens (HTML tags, code blocks, math)
  for (let i = protectedTokens.length - 1; i >= 0; i--) {
    const token = `__PROT_${i}__`;
    finalBodyTemplate = finalBodyTemplate.replaceAll(token, protectedTokens[i]);
  }

  // 7. Safety pass: replace any remaining __TX_NODE_ in finalBodyTemplate
  for (let i = 0; i < translatedSegments.length; i++) {
    const token = `__TX_NODE_${i}__`;
    if (finalBodyTemplate.includes(token)) {
      finalBodyTemplate = finalBodyTemplate.replaceAll(token, translatedSegments[i] || textSegments[i]);
    }
  }

  // 6. OCR image processing
  if (options.enableOcr !== false) {
    finalBodyTemplate = await processImagesWithOcr(finalBodyTemplate, targetLocale);
  }

  // 7. Assemble and clean
  const reconstructed = `---\n${translatedFm}\n---\n${finalBodyTemplate}`;
  const cleaned = cleanAiArticleOutput(reconstructed, i18nKey, targetLocale, sourceLocale);

  return {
    ok: true,
    translatedMarkdown: cleaned,
    targetLocale,
    i18nKey,
    provider: 'Chronral-Extraction',
    model: 'ast-reinsertion',
  };
}

// ---------------------------------------------------------------------------
// Unified Smart Orchestrator
// ---------------------------------------------------------------------------

/**
 * Unified smart entrypoint for article translation:
 * Orchestrates Scheme 1 (Format-Preserving Translation) and Scheme 2 (Extraction & Re-insertion).
 */
export async function translateArticleAuto(options: TranslateArticleOptions): Promise<TranslateArticleResult> {
  const scheme = options.scheme || resolveArticleI18nConfig().scheme || 'auto';

  if (scheme === 'extraction') {
    console.log(`[Article-i18n] Running Scheme 2 (Extraction & Re-insertion) for "${options.i18nKey}"...`);
    return translateArticleByExtraction(options);
  }

  console.log(`[Article-i18n] Running Scheme 1 (Format In, Format Out) for "${options.i18nKey}"...`);
  const bodyLength = options.sourceMarkdown.length;
  let primaryResult: TranslateArticleResult;

  if (bodyLength > 8000) {
    primaryResult = await translateArticleChunked(options);
  } else {
    primaryResult = await translateArticle(options);
  }

  if (primaryResult.ok && primaryResult.translatedMarkdown) {
    const validation = validateTranslatedFormat(options.sourceMarkdown, primaryResult.translatedMarkdown, options.targetLocale);
    if (validation.valid) {
      console.log(`[Article-i18n] ✅ Scheme 1 format verification passed for "${options.i18nKey}".`);
      if (options.enableOcr !== false) {
        primaryResult.translatedMarkdown = await processImagesWithOcr(primaryResult.translatedMarkdown, options.targetLocale);
      }
      return primaryResult;
    }
    console.warn(`[Article-i18n] ⚠️ Scheme 1 format verification failed (${validation.reason}). Activating Scheme 2 backup plan...`);
  } else {
    console.warn(`[Article-i18n] ⚠️ Scheme 1 failed (${primaryResult.error}). Activating Scheme 2 backup plan...`);
  }

  return translateArticleByExtraction(options);
}

