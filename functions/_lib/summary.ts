export function normalizeArticleText(value: string) {
  return value
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
    '请为这篇博客文章生成中文摘要。',
    '要求：',
    '1. 输出 120-220 字。',
    '2. 保持信息密度高，不要寒暄。',
    '3. 优先说明文章在讲什么、为什么值得读、适合什么读者。',
    '4. 不要编造正文里没有的信息。',
    '5. 输出纯文本，不要 Markdown 列表。',
    '',
    `标题：${input.title}`,
    `链接：${input.url}`,
    `作者自述：${input.summary || '无'}`,
    `正文：${input.content}`,
  ].join('\n');
}

export const SUMMARY_SYSTEM_INSTRUCTION =
  '你是一个面向技术博客的中文摘要助手。请保持冷静、准确、紧凑，优先提炼核心论点与阅读价值。';
