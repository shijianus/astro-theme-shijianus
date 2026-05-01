import type { AppEnv } from './types';

export async function generateWithWorkersAi(env: AppEnv, input: string, instructions: string) {
  if (!env.AI?.run) return null;

  const model = env.WORKERS_AI_MODEL || '@cf/openai/gpt-oss-20b';
  const payload = await env.AI.run(model, {
    instructions,
    input,
  });

  const text =
    typeof payload?.response === 'string'
      ? payload.response
      : typeof payload?.result === 'string'
        ? payload.result
        : typeof payload?.output_text === 'string'
          ? payload.output_text
          : '';

  if (!text.trim()) return null;
  return {
    text: text.trim(),
    provider: 'workers-ai' as const,
    model,
  };
}
