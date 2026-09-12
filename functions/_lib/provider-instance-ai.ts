import type { AppEnv } from './types';

type InstanceAiResult = {
  text: string;
  thinking?: string;
  provider: 'instance-ai';
  model: string;
};

export const DEFAULT_INSTANCE_MODELS_POOL = [
  'gpt-oss-120b',
  'deepseek-v4-flash-free',
  'gpt-oss-20b',
  'deepseek-v4-pro-free',
  'glm-5.2-free',
  'llama-3.3-70b-free',
  'kimi-k3-free',
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
  options?: {
    fixedModel?: string;
    maxTokens?: number;
  },
): Promise<InstanceAiResult | null> {
  const baseUrl = (env.INSTANCE_AI_BASE_URL || 'https://ai.121628.xyz/v1').replace(/\/+$/, '');
  const apiKey = env.INSTANCE_AI_API_KEY || '';
  if (!apiKey) return null;

  // 1. 模型选择逻辑：固定模型节点 vs 模型池随机体验
  const explicitFixedModel = options?.fixedModel?.trim() || env.AI_SUMMARY_FIXED_MODEL?.trim();
  let candidateModels: string[] = [];

  if (explicitFixedModel) {
    // 站长指定了固定模型节点：优先且固定请求该模型
    candidateModels = [explicitFixedModel];
  } else {
    // 未指定固定模型：从支持的模型池中随机打乱挑选，确保高自由度与高体验感
    const customPool = env.AI_SUMMARY_MODEL_POOL
      ? env.AI_SUMMARY_MODEL_POOL.split(',').map((m) => m.trim()).filter(Boolean)
      : [];
    const basePool = customPool.length > 0 ? customPool : DEFAULT_INSTANCE_MODELS_POOL;
    candidateModels = [...basePool].sort(() => Math.random() - 0.5);

    // 如果设置了 INSTANCE_AI_MODEL 且未在池中，置于首选位置
    if (env.INSTANCE_AI_MODEL && !candidateModels.includes(env.INSTANCE_AI_MODEL)) {
      candidateModels.unshift(env.INSTANCE_AI_MODEL);
    }
  }

  const temperature = Number((0.72 + Math.random() * 0.15).toFixed(2));
  const seed = Math.floor(Math.random() * 1000000);
  const maxTokens = options?.maxTokens || 2048;

  const attempts = candidateModels.slice(0, 2);

  for (const model of attempts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 16000);

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
          max_tokens: maxTokens,
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
