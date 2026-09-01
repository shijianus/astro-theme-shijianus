/**
 * Shared AI Summary backend handler for Chronral AI (Dev Server & Cloudflare Functions)
 */

export interface SummaryRequestPayload {
  slug?: string;
  title?: string;
  url?: string;
  summary?: string;
  content?: string;
  mode?: 'auto' | 'instance' | 'llmgpt' | 'primer' | 'question';
  questionType?: string;
  related?: Array<{ title: string; href: string }>;
}

export interface SummaryResponsePayload {
  ok: boolean;
  provider: string;
  model: string;
  summary: string;
  thinking?: string;
  cached?: boolean;
  error?: string;
}

const INSTANCE_MODELS = [
  'gpt-oss-20b',
  'gpt-oss-120b',
  'kimi-k3-free',
  'deepseek-v4-flash-free',
];

export function cleanModelDisplayName(model: string): string {
  return model
    .replace(/^openai\//i, '')
    .replace(/^groq\//i, '')
    .replace(/^qwen\//i, '')
    .replace(/^meta-llama\//i, '')
    .replace(/-free$/i, '')
    .replace(/-instruct$/i, '')
    .replace(/-versatile$/i, '')
    .trim();
}

export function cleanAiOutputText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?(<\/think>|$)/gi, '')
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^["'“](.*)["'”]$/s, '$1')
    .trim();
}

export function buildDynamicQuestionPrompt(input: {
  title: string;
  content: string;
  summary: string;
  questionType: string;
  related?: Array<{ title: string; href: string }>;
}): string {
  const { title, content, summary, questionType, related = [] } = input;
  const relatedListStr = related.map((r, i) => `${i + 1}. 《${r.title}》`).join('、');

  switch (questionType) {
    case 'point':
      return [
        `请针对博文《${title}》深度提炼出最核心的 2~3 个技术论点与架构结论。`,
        '要求：紧扣文章技术方案，分析其立论依据与核心取舍，语言专业凝练，输出 120-170 字纯文本。',
        '',
        `正文片段：\n${content.slice(0, 7000)}`,
      ].join('\n');

    case 'audience':
      return [
        `请分析博文《${title}》最适合的目标受众画像（例如前端开发者、架构师、全栈工程师或技术写作者）。`,
        '要求：具体说明阅读本文能帮他们解决哪些开发难点、思维盲区或技术落地问题，输出 120-170 字纯文本。',
        '',
        `正文片段：\n${content.slice(0, 7000)}`,
      ].join('\n');

    case 'quick':
      return [
        `请用极精简的三句话为博文《${title}》做 30 秒极速通读：`,
        '第一句说明背景与核心痛点；',
        '第二句说明核心技术实现与方案；',
        '第三句说明最终收益与关键结论。',
        '要求：三句话连贯一体，客观紧凑，输出 100-150 字纯文本。',
        '',
        `正文片段：\n${content.slice(0, 7000)}`,
      ].join('\n');

    case 'insight':
      return [
        `请提炼博文《${title}》在真实工程实践、架构演进或组件设计中的核心避坑指南与落地启示。`,
        '要求：给出具有指导意义的工程经验与行动建议，语言精炼，输出 120-170 字纯文本。',
        '',
        `正文片段：\n${content.slice(0, 7000)}`,
      ].join('\n');

    case 'intro':
      return [
        `请为技术博主 Shijianus（时鉴）生成一份详尽、立体且富有极客工匠精神的作者介绍。`,
        '要求：介绍其作为通才型软件构建者、学生与长期写作者的定位，涵盖 Astro、TypeScript、全栈架构与系统工程技术栈，强调“内容优先、结构优先、体验洁癖”与长期主义构建理念，输出 140-190 字纯文本。',
      ].join('\n');

    case 'related_reason':
      return [
        `请结合博文《${title}》的核心主题，深度分析为什么以下延伸阅读值得读者顺着脉络继续探索：${relatedListStr || '相关主题文章'}。`,
        '要求：阐述各文章与当前主题的技术递进关系或互补价值，输出 110-160 字纯文本。',
        '',
        `当前文章概要：${summary || title}`,
      ].join('\n');

    default:
      return [
        `请为博文《${title}》生成高质量、高信息密度的中文核心摘要。`,
        '要求：准确概括核心论点、技术要点与读者价值，严禁寒暄与列表，输出 120-170 字纯文本。',
        '',
        `作者自述：${summary || '无'}`,
        `正文片段：\n${content.slice(0, 7000)}`,
      ].join('\n');
  }
}

export async function processAiSummaryRequest(
  payload: SummaryRequestPayload,
  envSecrets: {
    instanceAiBaseUrl?: string;
    instanceAiApiKey?: string;
    instanceAiModel?: string;
    groqApiKey?: string;
    groqModel?: string;
  },
): Promise<SummaryResponsePayload> {
  const title = payload.title?.trim() || '';
  const content = (payload.content || '').replace(/\s+/g, ' ').slice(0, 10000);
  const summary = payload.summary?.trim() || '';
  const mode = payload.mode || 'auto';
  const questionType = payload.questionType || '';
  const related = payload.related || [];

  if (!title) {
    return {
      ok: false,
      provider: 'Chronral',
      model: 'error',
      summary: '缺少文章标题或内容',
      error: 'Missing title',
    };
  }

  const systemInstruction =
    '你是由 Chronral 驱动的技术博客智能摘要助手。请保持冷静、严谨、客观、紧凑，基于正文提供高信息密度的专业解答。严禁寒暄与客套，严禁 Markdown 列表，输出纯文本。';

  const prompt = buildDynamicQuestionPrompt({
    title,
    content,
    summary,
    questionType: questionType || '',
    related,
  });

  const instanceKey =
    envSecrets.instanceAiApiKey ||
    process.env.INSTANCE_AI_API_KEY ||
    '';
  const instanceBase = (
    envSecrets.instanceAiBaseUrl ||
    process.env.INSTANCE_AI_BASE_URL ||
    'https://ai.121628.xyz/v1'
  ).replace(/\/+$/, '');

  // Randomize models from pool to ensure varied, dynamic runs
  const shuffledModels = [...INSTANCE_MODELS].sort(() => Math.random() - 0.5);
  // Add configured model to the front if specified
  if (envSecrets.instanceAiModel) {
    shuffledModels.unshift(envSecrets.instanceAiModel);
  }

  // Add randomness with varying temperature (0.7 ~ 0.88) and random seed
  const temperature = Number((0.72 + Math.random() * 0.15).toFixed(2));
  const seed = Math.floor(Math.random() * 1000000);

  // 1. Try InstanceAI with real models (1 attempt with 2.6s fast failover)
  for (const model of shuffledModels.slice(0, 1)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2600);

      const res = await fetch(`${instanceBase}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${instanceKey}`,
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
          max_tokens: 700,
        }),
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{
            message?: {
              content?: string | null;
              reasoning_content?: string | null;
              reasoning?: string | null;
            };
          }>;
        };

        const choice = data.choices?.[0];
        const rawContent = choice?.message?.content || '';
        const thinkingSnippet = (choice?.message?.reasoning_content || choice?.message?.reasoning || '')
          .slice(0, 80)
          .replace(/\n/g, ' ')
          .trim();
        const text = cleanAiOutputText(rawContent);

        if (text && text.length >= 25) {
          const cleanName = cleanModelDisplayName(model);
          return {
            ok: true,
            provider: 'Chronral',
            model: cleanName,
            summary: text,
            thinking: thinkingSnippet || `正在解析博文《${title}》核心脉络与技术方案...`,
          };
        }
      }
    } catch {
      continue;
    }
  }

  // 2. Try Groq with active fast models
  const groqKey =
    envSecrets.groqApiKey ||
    process.env.GROQ_API_KEY ||
    '';
  const groqModels = ['groq/compound', 'qwen/qwen3.8-27b', 'groq/compound-mini', 'openai/gpt-oss-120b', 'qwen/qwen3.6-27b'];
  const shuffledGroq = [...groqModels].sort(() => Math.random() - 0.5);

  for (const m of shuffledGroq) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: m,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
          temperature,
          max_tokens: 600,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string; reasoning_content?: string; reasoning?: string } }>;
        };
        const choice = data.choices?.[0];
        const text = cleanAiOutputText(choice?.message?.content || '');
        const thinkingSnippet = (choice?.message?.reasoning_content || choice?.message?.reasoning || '')
          .slice(0, 80)
          .replace(/\n/g, ' ')
          .trim();
        if (text && text.length >= 25) {
          const cleanName = cleanModelDisplayName(m);
          return {
            ok: true,
            provider: 'Chronral',
            model: cleanName,
            summary: text,
            thinking: thinkingSnippet || `正在基于 ${cleanName} 模型提炼文章论点与结论...`,
          };
        }
      }
    } catch {
      continue;
    }
  }

  // 3. Primer fallback
  return {
    ok: true,
    provider: 'Chronral',
    model: 'Primer',
    summary:
      summary ||
      `《${title}》：本文深入探讨了相关核心技术与实践要点，帮助读者系统掌握关键概念与架构方案。`,
    thinking: '正在调取本地预置精炼概要...',
  };
}
