export function normalizeArticleText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[ \t]+\./g, '.')
    .trim()
    .slice(0, 12000);
}

export function buildSummaryPrompt(input: {
  title: string;
  url: string;
  summary: string;
  content: string;
}) {
  return [
    '请为这篇博客文章生成中文核心摘要。',
    '要求：',
    '1. 输出 120-180 字。',
    '2. 保持信息密度高，语言精炼，不要寒暄。',
    '3. 优先说明文章在讲什么、核心技术方案与适合什么读者。',
    '4. 不要编造正文里没有的信息。',
    '5. 输出纯文本，不要 Markdown 列表。',
    '',
    `标题：${input.title}`,
    `链接：${input.url}`,
    `作者自述：${input.summary || '无'}`,
    `正文：${input.content}`,
  ].join('\n');
}

export function buildQuestionPrompt(input: {
  title: string;
  url: string;
  summary: string;
  content: string;
  questionType: string;
}) {
  const typeMap: Record<string, string> = {
    point: '请准确提炼出本文最核心的 2-3 个论点与关键技术结论，用一段连贯通顺的话进行总结。',
    audience: '请分析这篇文章适合哪些背景的读者（如前端、架构、全栈或技术写作者），以及能帮助他们解决什么具体问题。',
    quick: '请用最精炼的 3 句话进行 30 秒极速概览，让读者在最短时间内了解核心背景、方案和收益。',
    insight: '请总结阅读本文后能获得的最关键实践启示、架构思考或避坑建议。',
    intro: '请为博主 Shijianus（时鉴）生成一份详尽、立体的作者介绍，涵盖其全栈工程师、学生与长期写作者的构建理念与工匠精神。',
    related_reason: '请结合本文核心主题，深度剖析为什么推荐这些延伸阅读文章，说明其技术递进与互补价值。',
  };

  const instruction = typeMap[input.questionType] || '请针对这篇博客文章进行提炼与总结。';

  return [
    instruction,
    '要求：',
    '1. 输出 100-180 字。',
    '2. 保持客观、高信息密度，不要寒暄。',
    '3. 完全基于正文内容，不编造任何信息。',
    '4. 输出纯文本，不使用 Markdown 列表。',
    '',
    `标题：${input.title}`,
    `链接：${input.url}`,
    `作者自述：${input.summary || '无'}`,
    `正文：${input.content}`,
  ].join('\n');
}

export const SUMMARY_SYSTEM_INSTRUCTION =
  '你是由 Chronral 驱动的技术博客智能摘要助手。请保持冷静、严谨、客观、紧凑，优先提炼核心论点、技术要点与阅读价值。严禁寒暄与无意义客套，输出纯文本。';
