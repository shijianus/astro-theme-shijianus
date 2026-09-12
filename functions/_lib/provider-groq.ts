import type { AppEnv } from './types';

type GroqResult = {
  text: string;
  provider: 'groq';
  model: string;
};

const DEFAULT_GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'groq/compound-mini',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
];

export async function generateWithGroq(
  env: AppEnv,
  prompt: string,
  systemInstruction: string,
  options?: {
    fixedModel?: string;
    maxTokens?: number;
  },
): Promise<GroqResult | null> {
  const apiKey = env.GROQ_API_KEY || '';
  if (!apiKey) return null;

  const explicitFixedModel = options?.fixedModel?.trim() || env.AI_SUMMARY_FIXED_MODEL?.trim();
  let candidateModels: string[] = [];

  if (explicitFixedModel) {
    candidateModels = [explicitFixedModel];
  } else {
    const shuffled = [...DEFAULT_GROQ_MODELS].sort(() => Math.random() - 0.5);
    if (env.GROQ_MODEL && !shuffled.includes(env.GROQ_MODEL)) {
      shuffled.unshift(env.GROQ_MODEL);
    }
    candidateModels = shuffled;
  }

  const maxTokens = options?.maxTokens || 850;

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
          temperature: 0.35,
          max_tokens: maxTokens,
        }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      let text = payload.choices?.[0]?.message?.content?.trim() || '';
      text = text
        .replace(/<think>[\s\S]*?(<\/think>|$)/gi, '')
        .replace(/^```[a-z]*\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      if (text && text.length >= 20) {
        return {
          text,
          provider: 'groq',
          model,
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}
