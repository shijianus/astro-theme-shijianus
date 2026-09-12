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
  const globalMinuteLimit = envLimit(env, 'AI_SUMMARY_PER_MINUTE', 10);
  const globalHourLimit = envLimit(env, 'AI_SUMMARY_PER_HOUR', 40);
  const deviceMinuteLimit = envLimit(env, 'AI_SUMMARY_PER_DEVICE_MINUTE', 6);
  const deviceHourLimit = envLimit(env, 'AI_SUMMARY_PER_DEVICE_HOUR', 20);
  const ipMinuteLimit = envLimit(env, 'AI_SUMMARY_PER_IP_MINUTE', 12);
  const ipHourLimit = envLimit(env, 'AI_SUMMARY_PER_IP_HOUR', 50);

  const globalMinuteRate = await enforceRateLimit({
    namespace: 'ai-summary-minute',
    request,
    env,
    limit: globalMinuteLimit,
    windowSeconds: 60,
  });
  const globalHourRate = await enforceRateLimit({
    namespace: 'ai-summary-hour',
    request,
    env,
    limit: globalHourLimit,
    windowSeconds: 60 * 60,
  });
  const deviceMinuteRate = await enforceRateLimit({
    namespace: 'ai-summary-device-minute',
    request,
    env,
    limit: deviceMinuteLimit,
    windowSeconds: 60,
    scope: 'device',
  });
  const deviceHourRate = await enforceRateLimit({
    namespace: 'ai-summary-device-hour',
    request,
    env,
    limit: deviceHourLimit,
    windowSeconds: 60 * 60,
    scope: 'device',
  });
  const ipMinuteRate = await enforceRateLimit({
    namespace: 'ai-summary-ip-minute',
    request,
    env,
    limit: ipMinuteLimit,
    windowSeconds: 60,
    scope: 'ip',
  });
  const ipHourRate = await enforceRateLimit({
    namespace: 'ai-summary-ip-hour',
    request,
    env,
    limit: ipHourLimit,
    windowSeconds: 60 * 60,
    scope: 'ip',
  });

  if (
    !globalMinuteRate.allowed
    || !globalHourRate.allowed
    || !deviceMinuteRate.allowed
    || !deviceHourRate.allowed
    || !ipMinuteRate.allowed
    || !ipHourRate.allowed
  ) {
    const failingRate = [
      globalMinuteRate,
      globalHourRate,
      deviceMinuteRate,
      deviceHourRate,
      ipMinuteRate,
      ipHourRate,
    ].find((item) => !item.allowed);

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
  const title = body?.title?.trim() || '';
  const url = body?.url?.trim() || '';
  const summary = body?.summary?.trim() || '';
  const slug = body?.slug?.trim() || title;
  const mode = body?.mode || 'auto';
  const questionType = body?.questionType || '';
  const related = body?.related || [];

  // 获取站长配置的档位（默认低档位 low，可随时切回）
  const level = getSummaryLevel(env.AI_SUMMARY_LEVEL);
  // 根据档位处理正文内容：low 截取前 3500 字，medium 截取前 15000 字，high 保留全量知识库上下文
  const content = normalizeArticleText(body?.content || '', level);

  if (!title || !content) {
    return jsonResponse(request, env, { ok: false, error: 'Missing title or content.' }, { status: 400 });
  }

  // 缓存 key 加入 level，保证档位切换后不读取旧档位缓存
  const cacheKey = await sha256Hex([slug, title, summary, mode, questionType, level, content.slice(0, 1000)].join('|'));
  
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
      });
    }
  }

  const systemInstruction = getSystemInstructionByLevel(level, env.AI_SUMMARY_CUSTOM_SYSTEM_PROMPT);
  const prompt = questionType
    ? buildQuestionPrompt({ title, url, summary, content, questionType, level, related })
    : buildSummaryPrompt({ title, url, summary, content, level, customUserPrompt: env.AI_SUMMARY_CUSTOM_USER_PROMPT });

  const maxTokens = level === 'high' ? 950 : level === 'medium' ? 750 : 550;
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
  } else if (mode === 'llmgpt') {
    aiResult = await generateWithGroq(env, prompt, systemInstruction, providerOptions);
    if (!aiResult) {
      aiResult = await generateWithInstanceAi(env, prompt, systemInstruction, providerOptions);
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
