import { numberFromEnv } from './http';
import { getRotatedTokens, markTokenFailure, markTokenSuccess } from './provider-tokens';
import type { AppEnv } from './types';

type GeminiResult = {
  text: string;
  provider: 'gemini';
  model: string;
};

function extractText(payload: Record<string, unknown>) {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const content = (candidate as { content?: Record<string, unknown> }).content;
    const parts = Array.isArray(content?.parts) ? content.parts : [];
    const text = parts
      .map((part) => (part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string'
        ? (part as { text: string }).text
        : ''))
      .join('\n')
      .trim();
    if (text) return text;
  }
  return '';
}

export async function generateWithGemini(
  env: AppEnv,
  prompt: string,
  systemInstruction: string,
): Promise<GeminiResult | null> {
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const invalidCooldown = numberFromEnv(env.GEMINI_COOLDOWN_INVALID_SECONDS, 60 * 60 * 24 * 7);
  const rateLimitCooldown = numberFromEnv(env.GEMINI_COOLDOWN_RATE_LIMIT_SECONDS, 60 * 15);
  const transientCooldown = numberFromEnv(env.GEMINI_COOLDOWN_TRANSIENT_SECONDS, 60 * 5);
  const rotatedTokens = await getRotatedTokens(env, 'gemini', env.GEMINI_API_KEYS);

  for (const candidate of rotatedTokens) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(candidate.token)}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.45,
            topP: 0.9,
            maxOutputTokens: 512,
          },
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
          'gemini',
          candidate.tokenHash,
          candidate.tokenSuffix,
          response.status,
          `gemini status ${response.status}`,
          cooldownSeconds,
        );
        continue;
      }

      const payload = (await response.json()) as Record<string, unknown>;
      const text = extractText(payload);
      if (!text) {
        await markTokenFailure(
          env,
          'gemini',
          candidate.tokenHash,
          candidate.tokenSuffix,
          502,
          'empty gemini response',
          transientCooldown,
        );
        continue;
      }

      await markTokenSuccess(env, 'gemini', candidate.tokenHash, candidate.tokenSuffix);
      return {
        text,
        provider: 'gemini',
        model,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'gemini request failed';
      await markTokenFailure(
        env,
        'gemini',
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
