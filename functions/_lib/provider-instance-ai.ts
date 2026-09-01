import type { AppEnv } from './types';

type InstanceAiResult = {
  text: string;
  thinking?: string;
  provider: 'instance-ai';
  model: string;
};

const INSTANCE_MODELS_POOL = [
  'kimi-k3-free',
  'deepseek-v4-flash-free',
  'gpt-oss-120b',
  'gpt-oss-20b',
  'deepseek-v4-pro-free',
  'glm-5.2-free',
  'llama-3.3-70b-free',
];

function cleanModelName(model: string): string {
  return model
    .replace(/^openai\//i, '')
    .replace(/^meta-llama\//i, '')
    .replace(/-free$/i, '')
    .replace(/-instruct$/i, '')
    .replace(/-versatile$/i, '')
    .trim();
}

function cleanAiOutput(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?(<\/think>|$)/gi, '')
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^["'“](.*)["'”]$/s, '$1')
    .trim();
}

export async function generateWithInstanceAi(
  env: AppEnv,
  prompt: string,
  systemInstruction: string,
): Promise<InstanceAiResult | null> {
  const baseUrl = (env.INSTANCE_AI_BASE_URL || 'https://ai.121628.xyz/v1').replace(/\/+$/, '');
  const apiKey = env.INSTANCE_AI_API_KEY || '';
  if (!apiKey) return null;

  const shuffled = [...INSTANCE_MODELS_POOL].sort(() => Math.random() - 0.5);
  if (env.INSTANCE_AI_MODEL) {
    shuffled.unshift(env.INSTANCE_AI_MODEL);
  }

  const temperature = Number((0.72 + Math.random() * 0.15).toFixed(2));
  const seed = Math.floor(Math.random() * 1000000);

  for (const model of shuffled) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; ChronralAI/2.0; +https://shijian.us)',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
          temperature,
          seed,
          max_tokens: 650,
        }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const payload = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string | null;
            reasoning_content?: string | null;
            reasoning?: string | null;
          };
        }>;
      };

      const choice = payload.choices?.[0];
      const rawContent = choice?.message?.content || choice?.message?.reasoning_content || '';
      const thinkingSnippet = (choice?.message?.reasoning_content || choice?.message?.reasoning || '')
        .slice(0, 80)
        .replace(/\n/g, ' ')
        .trim();
      const text = cleanAiOutput(rawContent);

      if (text && text.length >= 25) {
        const cleanName = cleanModelName(model);
        return {
          text,
          thinking: thinkingSnippet,
          provider: 'instance-ai',
          model: cleanName,
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}
