import { sha256Hex } from '../_lib/hash';
import { jsonResponse, optionsResponse, safeReadJson, numberFromEnv } from '../_lib/http';
import { generateWithGemini } from '../_lib/provider-gemini';
import { generateWithModelscope } from '../_lib/provider-modelscope';
import { generateWithWorkersAi } from '../_lib/provider-workers-ai';
import { enforceRateLimit, envLimit } from '../_lib/rate-limit';
import { buildSummaryPrompt, normalizeArticleText, SUMMARY_SYSTEM_INSTRUCTION } from '../_lib/summary';
import type { AppEnv } from '../_lib/types';

type SummaryRequest = {
  slug?: string;
  title?: string;
  url?: string;
  summary?: string;
  content?: string;
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
      provider: row.provider || 'cache',
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
  const globalMinuteLimit = envLimit(env, 'AI_SUMMARY_PER_MINUTE', 6);
  const globalHourLimit = envLimit(env, 'AI_SUMMARY_PER_HOUR', 24);
  const deviceMinuteLimit = envLimit(env, 'AI_SUMMARY_PER_DEVICE_MINUTE', 4);
  const deviceHourLimit = envLimit(env, 'AI_SUMMARY_PER_DEVICE_HOUR', 12);
  const ipMinuteLimit = envLimit(env, 'AI_SUMMARY_PER_IP_MINUTE', 8);
  const ipHourLimit = envLimit(env, 'AI_SUMMARY_PER_IP_HOUR', 30);

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
        error: 'AI summary is temporarily rate limited for this device or IP.',
        resetAt: failingRate?.resetAt || Math.floor(Date.now() / 1000) + 60,
      },
      { status: 429 },
    );
  }

  const body = await safeReadJson<SummaryRequest>(request);
  const title = body?.title?.trim() || '';
  const url = body?.url?.trim() || '';
  const summary = body?.summary?.trim() || '';
  const content = normalizeArticleText(body?.content || '');
  const slug = body?.slug?.trim() || title;

  if (!title || !url || !content) {
    return jsonResponse(request, env, { ok: false, error: 'Missing title, url, or content.' }, { status: 400 });
  }

  const cacheKey = await sha256Hex([slug, title, summary, content].join('|'));
  const cached = await readCachedSummary(env, cacheKey);
  if (cached) {
    return jsonResponse(request, env, {
      ok: true,
      cached: true,
      provider: cached.provider,
      model: cached.model,
      summary: cached.summary,
    });
  }

  const prompt = buildSummaryPrompt({ title, url, summary, content });
  const geminiResult = await generateWithGemini(env, prompt, SUMMARY_SYSTEM_INSTRUCTION);
  const modelscopeResult = geminiResult ? null : await generateWithModelscope(env, prompt, SUMMARY_SYSTEM_INSTRUCTION);
  const aiResult = geminiResult
    || modelscopeResult
    || (await generateWithWorkersAi(env, prompt, SUMMARY_SYSTEM_INSTRUCTION));

  if (!aiResult?.text) {
    return jsonResponse(
      request,
      env,
      {
        ok: false,
        error: 'All AI providers are unavailable right now. Please retry later.',
      },
      { status: 503 },
    );
  }

  const ttlSeconds = numberFromEnv(env.AI_SUMMARY_CACHE_TTL_SECONDS, 60 * 60 * 24 * 7);
  await writeCachedSummary(env, cacheKey, slug, aiResult.text, aiResult.provider, aiResult.model, ttlSeconds);

  return jsonResponse(request, env, {
    ok: true,
    cached: false,
    provider: aiResult.provider,
    model: aiResult.model,
    summary: aiResult.text,
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
