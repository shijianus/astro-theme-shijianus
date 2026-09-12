/**
 * Shared AI Summary backend handler for Chronral AI (Dev Server & Cloudflare Functions)
 */

export type SummaryLevel = 'low' | 'medium' | 'high';

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
  level?: SummaryLevel;
  cached?: boolean;
  error?: string;
}

export const DEFAULT_INSTANCE_MODELS = [
  'kimi-k3-free',
  'deepseek-v4-flash-free',
  'gpt-oss-120b',
  'gpt-oss-20b',
  'deepseek-v4-pro-free',
  'glm-5.2-free',
  'llama-3.3-70b-free',
];

export function getSummaryLevel(raw?: string | null): SummaryLevel {
  const val = (raw || '').toLowerCase().trim();
  if (val === 'high') return 'high';
  if (val === 'medium') return 'medium';
  return 'low'; // 默认低档位，省 token 且可随时切回
}

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

export function normalizeArticleContent(content: string, level: SummaryLevel = 'low'): string {
  const cleaned = (content || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[ \t]+\./g, '.')
    .trim();

  if (level === 'high') {
    return cleaned.slice(0, 120000); // 高档位：贴入全量正文知识库
  }
  if (level === 'medium') {
    return cleaned.slice(0, 15000); // 中档位：核心章节与细节
  }
  return cleaned.slice(0, 3500); // 低档位：轻量低消耗
}

export function getSystemInstructionByLevel(
  level: SummaryLevel = 'low',
  customInstruction?: string | null,
): string {
  if (customInstruction?.trim()) {
    return customInstruction.trim();
  }

  if (level === 'high') {
    return [
      '你是由 Chronral 知识库驱动的资深技术架构师与全景内容领航专家。你的使命是将博主的整篇长文作为权威上下文知识库，融会贯通其底层设计逻辑、技术架构演进、核心工程决策与极客思考。',
      '你具备开阔的全局技术视野与敏锐的工程洞察力，能够跳脱出表面文字，直击技术本质。',
      '请以冷静、深邃、富有极客工匠精神的口吻进行总结，严禁寒暄客套，严禁空洞的八股文总结，严禁使用 Markdown 标题、编号或列表，输出一整段连贯精悍、高信息密度的纯文本。',
    ].join('\n');
  }

  if (level === 'medium') {
    return [
      '你是由 Chronral 驱动的技术博客架构剖析专家。请从工程实践与系统架构视角出发，洞悉文章的技术逻辑链条、选型背景与实现取舍。',
      '语言紧凑专业，条理清晰，严禁寒暄与客套，严禁 Markdown 标题或列表，输出结构连贯、高信息密度的纯文本。',
    ].join('\n');
  }

  return '你是由 Chronral 驱动的技术博客轻量摘要助手。请保持冷静、严谨、客观、紧凑，快速提取文章核心要点与技术结论。严禁寒暄与客套，严禁 Markdown 列表，输出一段极简紧凑的纯文本。';
}

export function buildDynamicQuestionPrompt(input: {
  title: string;
  content: string;
  summary: string;
  questionType: string;
  level?: SummaryLevel;
  related?: Array<{ title: string; href: string }>;
  customUserPrompt?: string | null;
}): string {
  const { title, content, summary, questionType, level = 'low', related = [], customUserPrompt } = input;
  const relatedListStr = related.map((r, i) => `${i + 1}. 《${r.title}》`).join('、');

  if (customUserPrompt?.trim() && !questionType) {
    return customUserPrompt
      .replace(/\$\{title\}/g, title)
      .replace(/\$\{summary\}/g, summary || '无')
      .replace(/\$\{content\}/g, content);
  }

  switch (questionType) {
    case 'point': {
      const wordLimit = level === 'high' ? '150-240 字' : level === 'medium' ? '130-200 字' : '120-170 字';
      const promptInstruction =
        level === 'high'
          ? `请以资深技术架构师视角，纵观《${title}》全文知识库，深度提炼最硬核的 2~3 个核心架构论点与技术决断。阐明立论依据、关键实现取舍与架构收益。`
          : `请针对博文《${title}》深度提炼出最核心的 2~3 个技术论点与架构结论。`;
      return [
        promptInstruction,
        `要求：紧扣文章方案，语言专业凝练，输出 ${wordLimit} 纯文本，不要列表。`,
        '',
        `正文知识库：\n${content}`,
      ].join('\n');
    }

    case 'audience': {
      const wordLimit = level === 'high' ? '150-240 字' : level === 'medium' ? '130-200 字' : '120-170 字';
      return [
        `请分析博文《${title}》最适合的目标受众画像（例如前端开发者、架构师、全栈工程师或技术写作者）。`,
        `要求：具体说明阅读本文能帮他们解决哪些开发难点、思维盲区或技术落地问题，输出 ${wordLimit} 纯文本，不要列表。`,
        '',
        `正文知识库：\n${content}`,
      ].join('\n');
    }

    case 'quick':
      return [
        `请用极精简的三句话为博文《${title}》做 30 秒极速通读：`,
        '第一句说明背景与核心痛点；',
        '第二句说明核心技术实现与方案；',
        '第三句说明最终收益与关键结论。',
        '要求：三句话连贯一体，客观紧凑，输出 100-160 字纯文本。',
        '',
        `正文知识库：\n${content}`,
      ].join('\n');

    case 'insight': {
      const wordLimit = level === 'high' ? '150-240 字' : level === 'medium' ? '130-200 字' : '120-170 字';
      return [
        `请提炼博文《${title}》在真实工程实践、架构演进或组件设计中的核心避坑指南与认知启示。`,
        `要求：给出具有指导意义的工程经验与行动建议，语言精炼，输出 ${wordLimit} 纯文本，不要列表。`,
        '',
        `正文知识库：\n${content}`,
      ].join('\n');
    }

    case 'intro':
      return [
        `请为技术博主 Shijianus（时鉴）生成一份详尽、立体且富有极客工匠精神的作者介绍。`,
        '要求：介绍其作为通才型软件构建者、学生与长期写作者的定位，涵盖 Astro、TypeScript、全栈架构与系统工程技术栈，强调“内容优先、结构优先、体验洁癖”与长期主义构建理念，输出 140-190 字纯文本。',
      ].join('\n');

    case 'related_reason':
      return [
        `请结合博文《${title}》的核心主题，深度分析为什么以下延伸阅读值得读者顺着脉络继续探索：${relatedListStr || '相关主题文章'}。`,
        '要求：阐述各文章与当前主题的技术递进关系或互补价值，输出 120-180 字纯文本。',
        '',
        `当前文章概要：${summary || title}`,
      ].join('\n');

    default: {
      // 默认核心摘要 Prompt
      if (level === 'high') {
        return [
          '【身份与使命】',
          '你是资深技术架构师与全景知识领航专家。请以整篇博文为核心知识库与完整上下文，为读者进行深度全景总结。',
          '',
          '【核心任务与自由度】',
          '1. 全景通读：基于下方提供的完整文章正文，通盘理解整篇作品的背景动机、核心设计思想、技术演进脉络与关键工程取舍。',
          '2. 自由提炼与聚焦：拒绝千篇一律的机械套路与扁平复述。请发挥架构师的全局审视能力，自由提炼最打动人或最硬核的精髓——每次总结可自主聚焦不同的核心亮点（例如独特的架构权衡、优雅的编码实现、系统级性能优化、前沿技术栈的深度整合，或是作者对工程美学的独到见解）。',
          '3. 启迪读者：点明文章对工程师、架构师或技术探索者的深层实践启示与范式转变价值。',
          '',
          '【生成约束与字数上限】',
          '- 字数上限：严格控制在 220 至 320 字纯文本之间（信息充沛饱满，篇幅恰到好处）。',
          '- 表达规范：语言自然连贯、极富思考质感，一气呵成；严禁出现“本文主要讲述了”、“首先其次最后”等刻板八股用语；严禁寒暄；严禁使用任何 Markdown 列表（如 -、*、1. 2.）、加粗或分段标签，输出为单一完整段落的纯文本。',
          '- 真实准确：完全基于提供的正文知识库，不捏造任何未提及的概念与数据。',
          '',
          '【输入知识库】',
          `文章标题：${title}`,
          `作者手记：${summary || '暂无作者手记'}`,
          '完整正文知识库：',
          content,
        ].join('\n');
      }

      if (level === 'medium') {
        return [
          '请从工程架构与技术实践视角，为这篇博客文章生成结构化中文深度摘要。',
          '要求：',
          '1. 输出 160-240 字纯文本。',
          '2. 深入梳理文章的痛点背景、关键技术方案选型依据、核心架构实现与最终落地收益。',
          '3. 语言专业凝练，条理自然顺畅，兼具技术深度与可读性。',
          '4. 严格基于文章提供的内容，严禁编造，输出纯文本，不要 Markdown 标题或列表。',
          '',
          `标题：${title}`,
          `作者自述：${summary || '无'}`,
          `正文核心内容：\n${content}`,
        ].join('\n');
      }

      return [
        '请为这篇博客文章生成极简中文核心摘要。',
        '要求：',
        '1. 输出 120-170 字纯文本。',
        '2. 保持信息密度高，语言精炼，不要寒暄。',
        '3. 优先说明文章核心技术方案与适合什么读者。',
        '4. 不要编造正文里没有的信息，输出纯文本，不要 Markdown 列表。',
        '',
        `标题：${title}`,
        `作者自述：${summary || '无'}`,
        `正文片段：\n${content}`,
      ].join('\n');
    }
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
    aiSummaryLevel?: string;
    aiSummaryFixedModel?: string;
    aiSummaryModelPool?: string;
    aiSummaryCustomSystemPrompt?: string;
    aiSummaryCustomUserPrompt?: string;
  },
): Promise<SummaryResponsePayload> {
  const title = payload.title?.trim() || '';
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

  // 1. 确定档位（默认 low，可由环境变量随时切换）
  const rawLevel = envSecrets.aiSummaryLevel || process.env.AI_SUMMARY_LEVEL;
  const level = getSummaryLevel(rawLevel);

  // 2. 根据档位处理正文内容（high 档位保留全量文章作为知识库，不截断）
  const content = normalizeArticleContent(payload.content || '', level);

  // 3. 构建对应的系统指令与提示词
  const systemInstruction = getSystemInstructionByLevel(
    level,
    envSecrets.aiSummaryCustomSystemPrompt || process.env.AI_SUMMARY_CUSTOM_SYSTEM_PROMPT,
  );

  const prompt = buildDynamicQuestionPrompt({
    title,
    content,
    summary,
    questionType: questionType || '',
    level,
    related,
    customUserPrompt: envSecrets.aiSummaryCustomUserPrompt || process.env.AI_SUMMARY_CUSTOM_USER_PROMPT,
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

  // 4. 固定模型节点 vs 模型池随机选择
  const explicitFixedModel = (
    envSecrets.aiSummaryFixedModel ||
    process.env.AI_SUMMARY_FIXED_MODEL ||
    ''
  ).trim();

  let candidateInstanceModels: string[] = [];

  if (explicitFixedModel) {
    candidateInstanceModels = [explicitFixedModel];
  } else {
    const customPool = (envSecrets.aiSummaryModelPool || process.env.AI_SUMMARY_MODEL_POOL || '')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    const pool = customPool.length > 0 ? customPool : DEFAULT_INSTANCE_MODELS;
    candidateInstanceModels = [...pool].sort(() => Math.random() - 0.5);

    const preferred = envSecrets.instanceAiModel || process.env.INSTANCE_AI_MODEL;
    if (preferred && !candidateInstanceModels.includes(preferred)) {
      candidateInstanceModels.unshift(preferred);
    }
  }

  // 随机温度与随机 seed，实现高自由度
  const temperature = Number((0.72 + Math.random() * 0.15).toFixed(2));
  const seed = Math.floor(Math.random() * 1000000);
  const maxTokens = level === 'high' ? 950 : level === 'medium' ? 750 : 550;

  // 1. Try InstanceAI
  if (instanceKey) {
    for (const model of candidateInstanceModels.slice(0, explicitFixedModel ? 1 : 2)) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

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
            max_tokens: maxTokens,
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
              level,
              thinking: thinkingSnippet || `正在解析博文《${title}》核心脉络与技术方案...`,
            };
          }
        }
      } catch {
        continue;
      }
    }
  }

  // 2. Try Groq
  const groqKey =
    envSecrets.groqApiKey ||
    process.env.GROQ_API_KEY ||
    '';

  if (groqKey) {
    const groqModels = explicitFixedModel
      ? [explicitFixedModel]
      : ['groq/compound', 'qwen/qwen3.8-27b', 'groq/compound-mini', 'openai/gpt-oss-120b', 'qwen/qwen3.6-27b'];
    const shuffledGroq = explicitFixedModel ? groqModels : [...groqModels].sort(() => Math.random() - 0.5);

    for (const m of shuffledGroq) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
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
            max_tokens: maxTokens,
          }),
        });
        clearTimeout(timeoutId);

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
              level,
              thinking: thinkingSnippet || `正在基于 ${cleanName} 模型提炼文章论点与结论...`,
            };
          }
        }
      } catch {
        continue;
      }
    }
  }

  // 3. Fallback
  return {
    ok: true,
    provider: 'Chronral',
    model: 'Primer',
    summary:
      summary ||
      `《${title}》：本文深入探讨了相关核心技术与实践要点，帮助读者系统掌握关键概念与架构方案。`,
    level,
    thinking: '正在调取本地预置精炼概要...',
  };
}
