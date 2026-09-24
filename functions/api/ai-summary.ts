import { sha256Hex } from '../_lib/hash';
import { jsonResponse, optionsResponse, safeReadJson, numberFromEnv } from '../_lib/http';
import { generateWithInstanceAi } from '../_lib/provider-instance-ai';
import { generateWithGroq } from '../_lib/provider-groq';
import { generateWithGemini } from '../_lib/provider-gemini';
import { generateWithModelscope } from '../_lib/provider-modelscope';
import { generateWithWorkersAi } from '../_lib/provider-workers-ai';
import { enforceRateLimit, envLimit } from '../_lib/rate-limit';
import {
  buildSummaryPrompt,
  buildQuestionPrompt,
  normalizeArticleText,
  normalizeSummaryLocale,
  getSummaryLevel,
  getSystemInstructionByLevel,
  SUMMARY_SYSTEM_INSTRUCTION,
} from '../_lib/summary';
import type { AppEnv } from '../_lib/types';

type SummaryRequest = {
  slug?: string;
  title?: string;
  url?: string;
  summary?: string;
  content?: string;
  mode?: 'auto' | 'instance' | 'llmgpt' | 'question';
  questionType?: string;
  lang?: string;
  locale?: string;
  related?: Array<{ title: string; href: string }>;
};

async function readCachedSummary(env: AppEnv, cacheKey: string) {
  if (!env.DB?.prepare) return null;

  try {
    const row = await env.DB.prepare(
      `SELECT summary, provider, model
         FROM ai_summary_cache
        WHERE cache_key = ? AND expires_at > ?`
    ).bind(cacheKey, Math.floor(Date.now() / 1000)).first<{ summary?: string; provider?: string; model?: string }>();

    if (!row?.summary) return null;
    return {
      summary: row.summary,
      provider: row.provider || 'Chronral',
      model: row.model || 'cached',
    };
  } catch {
    return null;
  }
}

async function writeCachedSummary(
  env: AppEnv,
  cacheKey: string,
  slug: string,
  summary: string,
  provider: string,
  model: string,
  ttlSeconds: number,
) {
  if (!env.DB?.prepare) return;

  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `INSERT INTO ai_summary_cache (cache_key, slug, summary, provider, model, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET
        slug = excluded.slug,
        summary = excluded.summary,
        provider = excluded.provider,
        model = excluded.model,
        created_at = excluded.created_at,
        expires_at = excluded.expires_at`
  ).bind(cacheKey, slug, summary, provider, model, now, now + ttlSeconds).run();
}

export async function onRequestPost(context: { request: Request; env: AppEnv }) {
  const { request, env } = context;
  const isDev = Boolean(env.IS_DEV || (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'));

  // Validate origin / referer: prevent unauthorized direct scraping or third-party site abuse
  const originHeader = request.headers.get('origin');
  const refererHeader = request.headers.get('referer');
  const callerUrl = originHeader || refererHeader;

  if (!callerUrl && !isDev) {
    return jsonResponse(request, env, { ok: false, error: 'Forbidden: missing Origin/Referer header.' }, { status: 403 });
  }

  if (callerUrl) {
    try {
      const parsedHost = new URL(callerUrl).hostname.toLowerCase();
      const isAllowedHost =
        parsedHost === 'blog.epocanvas.com' ||
        parsedHost === 'epocanvas.com' ||
        parsedHost === 'shijianus.github.io' ||
        parsedHost === 'localhost' ||
        parsedHost === '127.0.0.1' ||
        parsedHost.endsWith('.pages.dev');
      if (!isAllowedHost) {
        return jsonResponse(request, env, { ok: false, error: 'Forbidden cross-origin summary request.' }, { status: 403 });
      }
    } catch {
      return jsonResponse(request, env, { ok: false, error: 'Invalid origin or referer header.' }, { status: 403 });
    }
  }

  // Consolidated 2-tier Rate Limiting (Minute + Hour) to prevent D1 database write amplification
  const minuteLimit = envLimit(env, 'AI_SUMMARY_PER_IP_MINUTE', 12);
  const hourLimit = envLimit(env, 'AI_SUMMARY_PER_IP_HOUR', 50);

  const minuteRate = await enforceRateLimit({
    namespace: 'ai-summary-minute',
    request,
    env,
    limit: minuteLimit,
    windowSeconds: 60,
    scope: 'ip',
  });
  const hourRate = await enforceRateLimit({
    namespace: 'ai-summary-hour',
    request,
    env,
    limit: hourLimit,
    windowSeconds: 60 * 60,
    scope: 'ip',
  });

  if (!minuteRate.allowed || !hourRate.allowed) {
    const failingRate = !minuteRate.allowed ? minuteRate : hourRate;
    return jsonResponse(
      request,
      env,
      {
        ok: false,
        error: 'Chronral 摘要服务请求频次较高，请稍候再试。',
        resetAt: failingRate?.resetAt || Math.floor(Date.now() / 1000) + 60,
      },
      { status: 429 },
    );
  }

  const body = await safeReadJson<SummaryRequest>(request);
  const title = (body?.title || '').trim().slice(0, 250);
  const rawSlug = (body?.slug || '').trim();
  const summary = (body?.summary || '').trim().slice(0, 1000);
  const mode = body?.mode || 'auto';
  const questionType = (body?.questionType || '').trim().slice(0, 50);
  const related = Array.isArray(body?.related) ? body.related.slice(0, 10) : [];

  // Enforce slug validation: must match valid post slug syntax and not exceed 150 chars
  const SLUG_REGEX = /^[a-zA-Z0-9_\-\.\/]{1,150}$/;
  if (!rawSlug || !SLUG_REGEX.test(rawSlug)) {
    return jsonResponse(request, env, { ok: false, error: 'Invalid or missing canonical post slug.' }, { status: 400 });
  }
  const slug = rawSlug;

  const ALLOWED_MODES = new Set(['auto', 'instance', 'llmgpt', 'question']);
  if (!ALLOWED_MODES.has(mode)) {
    return jsonResponse(request, env, { ok: false, error: 'Invalid AI summary mode.' }, { status: 400 });
  }

  const rawContent = (body?.content || '').trim();
  if (!title || !rawContent || rawContent.length < 20 || rawContent.length > 80000) {
    return jsonResponse(request, env, { ok: false, error: 'Missing or out-of-bounds title/content.' }, { status: 400 });
  }

  // 获取站长配置的档位（默认低档位 low，可随时切回）
  const level = getSummaryLevel(env.AI_SUMMARY_LEVEL);
  const lang = normalizeSummaryLocale(body?.lang || body?.locale);
  // 根据档位处理正文内容：low 截取前 3500 字，medium 截取前 15000 字，high 保留全量知识库上下文
  const content = normalizeArticleText(rawContent, level);

  // 缓存 key 加入 level 与 lang，并基于正文全量内容哈希，彻底杜绝切片截断导致的缓存投毒
  const contentHash = await sha256Hex(content);
  const cacheKey = await sha256Hex([slug, title, summary, mode, questionType, level, lang, contentHash].join('|'));
  
  // Only use server D1 cache for non-instance and non-question requests, or when cached
  if (mode !== 'instance') {
    const cached = await readCachedSummary(env, cacheKey);
    if (cached) {
      return jsonResponse(request, env, {
        ok: true,
        cached: true,
        provider: 'Chronral',
        model: cached.model,
        summary: cached.summary,
        level,
        lang,
      });
    }
  }

  const systemInstruction = getSystemInstructionByLevel(level, env.AI_SUMMARY_CUSTOM_SYSTEM_PROMPT, lang);
  const prompt = questionType
    ? buildQuestionPrompt({ title, url, summary, content, questionType, level, lang, related })
    : buildSummaryPrompt({ title, url, summary, content, level, lang, customUserPrompt: env.AI_SUMMARY_CUSTOM_USER_PROMPT });

  const maxTokens = level === 'high' ? 2048 : level === 'medium' ? 1200 : 800;
  const providerOptions = {
    fixedModel: env.AI_SUMMARY_FIXED_MODEL,
    maxTokens,
  };

  let aiResult: { text: string; provider: string; model: string } | null = null;

  if (mode === 'instance') {
    aiResult = await generateWithInstanceAi(env, prompt, systemInstruction, providerOptions);
    if (!aiResult) {
      aiResult = await generateWithGroq(env, prompt, systemInstruction, providerOptions);
    }
    if (!aiResult) {
      aiResult = await generateWithGemini(env, prompt, systemInstruction);
    }
    if (!aiResult) {
      aiResult = await generateWithWorkersAi(env, prompt, systemInstruction);
    }
  } else if (mode === 'llmgpt') {
    aiResult = await generateWithGroq(env, prompt, systemInstruction, providerOptions);
    if (!aiResult) {
      aiResult = await generateWithInstanceAi(env, prompt, systemInstruction, providerOptions);
    }
    if (!aiResult) {
      aiResult = await generateWithGemini(env, prompt, systemInstruction);
    }
    if (!aiResult) {
      aiResult = await generateWithWorkersAi(env, prompt, systemInstruction);
    }
  } else {
    // auto or question
    aiResult =
      (await generateWithInstanceAi(env, prompt, systemInstruction, providerOptions))
      || (await generateWithGroq(env, prompt, systemInstruction, providerOptions))
      || (await generateWithGemini(env, prompt, systemInstruction))
      || (await generateWithModelscope(env, prompt, systemInstruction))
      || (await generateWithWorkersAi(env, prompt, systemInstruction));
  }

  if (!aiResult?.text) {
    return jsonResponse(
      request,
      env,
      {
        ok: false,
        error: 'Chronral 摘要服务暂时离线，请稍后再试。',
      },
      { status: 503 },
    );
  }

  const ttlSeconds = numberFromEnv(env.AI_SUMMARY_CACHE_TTL_SECONDS, 60 * 60 * 24 * 7);
  await writeCachedSummary(env, cacheKey, slug, aiResult.text, 'Chronral', aiResult.model, ttlSeconds);

  return jsonResponse(request, env, {
    ok: true,
    cached: false,
    provider: 'Chronral',
    model: aiResult.model,
    summary: aiResult.text,
    level,
    lang,
    thinking: (aiResult as any).thinking || undefined,
  });
}

export async function onRequest(context: { request: Request; env: AppEnv }) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return optionsResponse(request, env);
  if (request.method !== 'POST') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }
  return onRequestPost(context);
}
