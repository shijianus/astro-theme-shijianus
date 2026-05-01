import { numberFromEnv } from './http';
import { getRotatedTokens, markTokenFailure, markTokenSuccess } from './provider-tokens';
import type { AppEnv } from './types';

type ModelscopeResult = {
  text: string;
  provider: 'modelscope';
  model: string;
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function extractText(payload: Record<string, unknown>) {
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  for (const choice of choices) {
    if (!choice || typeof choice !== 'object') continue;
    const message = (choice as { message?: { content?: unknown } }).message;
    if (typeof message?.content === 'string' && message.content.trim()) {
      return message.content.trim();
    }
  }

  return '';
}

export async function generateWithModelscope(
  env: AppEnv,
  prompt: string,
  systemInstruction: string,
): Promise<ModelscopeResult | null> {
  const rawTokens = env.MODELSCOPE_API_KEYS || env.MODELSCOPE_API_KEY;
  const rotatedTokens = await getRotatedTokens(env, 'modelscope', rawTokens);
  if (rotatedTokens.length === 0) return null;

  const model = env.MODELSCOPE_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
  const baseUrl = trimTrailingSlash(env.MODELSCOPE_BASE_URL || 'https://api-inference.modelscope.cn/v1');
  const invalidCooldown = numberFromEnv(env.MODELSCOPE_COOLDOWN_INVALID_SECONDS, 60 * 60 * 24 * 7);
  const rateLimitCooldown = numberFromEnv(env.MODELSCOPE_COOLDOWN_RATE_LIMIT_SECONDS, 60 * 15);
  const transientCooldown = numberFromEnv(env.MODELSCOPE_COOLDOWN_TRANSIENT_SECONDS, 60 * 5);

  for (const candidate of rotatedTokens) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${candidate.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
          temperature: 0.45,
          max_tokens: 512,
        }),
      });

      if (!response.ok) {
        const cooldownSeconds =
          response.status === 400 || response.status === 401 || response.status === 403
            ? invalidCooldown
            : response.status === 429
              ? rateLimitCooldown
              : transientCooldown;

        await markTokenFailure(
          env,
          'modelscope',
          candidate.tokenHash,
          candidate.tokenSuffix,
          response.status,
          `modelscope status ${response.status}`,
          cooldownSeconds,
        );
        continue;
      }

      const payload = (await response.json()) as Record<string, unknown>;
      const text = extractText(payload);
      if (!text) {
        await markTokenFailure(
          env,
          'modelscope',
          candidate.tokenHash,
          candidate.tokenSuffix,
          502,
          'empty modelscope response',
          transientCooldown,
        );
        continue;
      }

      await markTokenSuccess(env, 'modelscope', candidate.tokenHash, candidate.tokenSuffix);
      return {
        text,
        provider: 'modelscope',
        model,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'modelscope request failed';
      await markTokenFailure(
        env,
        'modelscope',
        candidate.tokenHash,
        candidate.tokenSuffix,
        599,
        message,
        transientCooldown,
      );
    }
  }

  return null;
}
