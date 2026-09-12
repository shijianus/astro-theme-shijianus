export type SummaryLevel = 'low' | 'medium' | 'high';

export function getSummaryLevel(raw?: string | null): SummaryLevel {
  const val = (raw || '').toLowerCase().trim();
  if (val === 'high') return 'high';
  if (val === 'medium') return 'medium';
  return 'low'; // 默认低档位，省 token 且可随时切回
}

export function normalizeArticleText(value: string, level: SummaryLevel = 'low'): string {
  const cleaned = (value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[ \t]+\./g, '.')
    .trim();

  // 档位化正文裁剪策略：
  // 1. 低档位 (low): 仅保留前 3,500 字符，控制 token 消耗，适合快速轻量摘要；
  // 2. 中档位 (medium): 保留前 15,000 字符，涵盖大部分文章的主要章节与架构细节；
  // 3. 高档位 (high): 将整篇正体全部同步发给 AI 作为完整知识库与上下文（支持 120,000+ 字符全文无损直传）。
  if (level === 'high') {
    return cleaned.slice(0, 120000);
  }
  if (level === 'medium') {
    return cleaned.slice(0, 15000);
  }
  return cleaned.slice(0, 3500);
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

export const SUMMARY_SYSTEM_INSTRUCTION = getSystemInstructionByLevel('low');

export function buildSummaryPrompt(input: {
  title: string;
  url: string;
  summary: string;
  content: string;
  level?: SummaryLevel;
  customUserPrompt?: string | null;
}) {
  const level = input.level || 'low';

  if (input.customUserPrompt?.trim()) {
    return input.customUserPrompt
      .replace(/\$\{title\}/g, input.title)
      .replace(/\$\{url\}/g, input.url)
      .replace(/\$\{summary\}/g, input.summary || '无')
      .replace(/\$\{content\}/g, input.content);
  }

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
      `文章标题：${input.title}`,
      `文章链接：${input.url}`,
      `作者手记：${input.summary || '暂无作者手记'}`,
      '完整正文知识库：',
      input.content,
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
      `标题：${input.title}`,
      `链接：${input.url}`,
      `作者自述：${input.summary || '无'}`,
      `正文核心内容：\n${input.content}`,
    ].join('\n');
  }

  // 低档位 (low): 保持既有轻量逻辑
  return [
    '请为这篇博客文章生成极简中文核心摘要。',
    '要求：',
    '1. 输出 120-170 字纯文本。',
    '2. 保持信息密度高，语言精炼，不要寒暄。',
    '3. 优先说明文章核心技术方案与适合什么读者。',
    '4. 不要编造正文里没有的信息。',
    '5. 输出纯文本，不要 Markdown 列表。',
    '',
    `标题：${input.title}`,
    `链接：${input.url}`,
    `作者自述：${input.summary || '无'}`,
    `正文片段：\n${input.content}`,
  ].join('\n');
}

export function buildQuestionPrompt(input: {
  title: string;
  url: string;
  summary: string;
  content: string;
  questionType: string;
  level?: SummaryLevel;
  related?: Array<{ title: string; href: string }>;
}) {
  const level = input.level || 'low';
  const relatedListStr = (input.related || []).map((r, i) => `${i + 1}. 《${r.title}》`).join('、');

  const typeMap: Record<string, string> = {
    point:
      level === 'high'
        ? '请以资深架构师视角，纵观全文知识库，深度提炼本文最硬核的 2-3 个核心架构论点与技术决断，阐明其立论依据与取舍。'
        : '请准确提炼出本文最核心的 2-3 个论点与关键技术结论，用一段连贯通顺的话进行总结。',
    audience:
      level === 'high'
        ? '请深度剖析本文针对的工程师与架构师受众画像，阐述阅读本文能如何重构读者的技术认知、解决关键工程难点或拓宽认知边界。'
        : '请分析这篇文章适合哪些背景的读者（如前端、架构、全栈或技术写作者），以及能帮助他们解决什么具体问题。',
    quick:
      '请用最精炼的 3 句话进行 30 秒极速概览（背景痛点、核心方案、最终收益），让读者在最短时间内掌握关键价值。',
    insight:
      level === 'high'
        ? '请基于全文知识库深度提炼技术人在真实系统设计、架构演进与长期主义构建中的核心避坑经验与工程认知升级启示。'
        : '请总结阅读本文后能获得的最关键实践启示、架构思考或避坑建议。',
    intro:
      '请为博主 Shijianus（时鉴）生成一份详尽、立体且富有极客工匠精神的作者介绍，涵盖其通才型软件构建者、学生与长期写作者的定位，强调“内容优先、结构优先、体验洁癖”与系统级构建哲学。',
    related_reason:
      `请结合本文核心主题，深度剖析为什么推荐以下延伸阅读文章（${relatedListStr || '相关技术主题'}），说明其技术脉络递进与互补价值。`,
  };

  const instruction = typeMap[input.questionType] || '请针对这篇博客文章进行提炼与总结。';
  const wordLimit = level === 'high' ? '150-240 字' : level === 'medium' ? '130-200 字' : '100-180 字';

  return [
    instruction,
    '要求：',
    `1. 输出 ${wordLimit} 纯文本。`,
    '2. 保持客观、高信息密度，富有思考质感，不要寒暄。',
    '3. 完全基于提供的正文知识库，不编造任何虚假信息。',
    '4. 输出单一连贯段落的纯文本，不使用 Markdown 列表或标题。',
    '',
    `标题：${input.title}`,
    `链接：${input.url}`,
    `作者手记：${input.summary || '无'}`,
    `正文知识库：\n${input.content}`,
  ].join('\n');
}
