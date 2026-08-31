import type { AppEnv } from './types';

type GroqResult = {
  text: string;
  provider: 'groq';
  model: string;
};

export async function generateWithGroq(
  env: AppEnv,
  prompt: string,
  systemInstruction: string,
): Promise<GroqResult | null> {
  const apiKey = env.GROQ_API_KEY || '';
  if (!apiKey) return null;

  const models = [
    env.GROQ_MODEL || 'openai/gpt-oss-120b',
    'groq/compound-mini',
    'llama-3.3-70b-versatile',
    'openai/gpt-oss-20b',
    'qwen/qwen3.6-27b',
  ];

  for (const model of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
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
          temperature: 0.25,
          max_tokens: 512,
        }),
      });

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
