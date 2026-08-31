import fs from 'node:fs';
import path from 'node:path';

const postsDir = path.resolve('src/content/posts');
const dataDir = path.resolve('src/data');
const outputFile = path.join(dataDir, 'ai-summaries.json');

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'groq/compound-mini',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-20b',
];

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function cleanAiOutput(text) {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?(<\/think>|$)/gi, '')
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^["'“](.*)["'”]$/s, '$1')
    .trim();
}

function extractFrontmatterAndContent(fileContent) {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, content: fileContent };
  }
  const fmRaw = match[1];
  const body = match[2];
  const titleMatch = fmRaw.match(/title:\s*["']?(.*?)["']?\s*\n/);
  const descMatch = fmRaw.match(/description:\s*["']?(.*?)["']?\s*\n/);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const description = descMatch ? descMatch[1].trim() : '';
  return {
    title,
    description,
    content: body
      .replace(/```[\s\S]*?```/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000),
  };
}

async function generateSummary(title, description, bodyContent) {
  const systemPrompt =
    '你是由 Chronral 驱动的技术博客智能摘要助手。请为这篇博文生成一段高质量、高信息密度的中文核心摘要。要求：\n1. 字数严格控制在 120-180 字之间；\n2. 准确提炼核心论点、技术要点与读者价值；\n3. 语言客观凝练、富有逻辑，严禁寒暄与套话，严禁 Markdown 列表；\n4. 输出纯文本。';
  const userPrompt = `标题：${title}\n作者自述：${description || '无'}\n正文内容：\n${bodyContent}`;

  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.75,
          max_tokens: 450,
        }),
      });

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content?.trim();
      const text = cleanAiOutput(rawText);
      if (text && text.length >= 30) {
        return { summary: text, model: 'llama-3.3-70b-versatile', provider: 'Chronral LLMGPT' };
      }
    } catch {
      continue;
    }
  }

  return {
    summary: description || `${title}：本文深入探讨了相关核心技术与实践要点，帮助读者系统掌握关键概念与应用方法。`,
    model: 'primer-fallback',
    provider: 'Chronral Primer',
  };
}

async function main() {
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  console.log(`[Chronral Generator] Processing ${files.length} posts...`);

  const results = {};
  for (const file of files) {
    const slug = file.replace(/\.(md|mdx)$/, '');
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
    const { title, description, content } = extractFrontmatterAndContent(raw);

    console.log(`[Generating] ${slug} ("${title}")...`);
    const res = await generateSummary(title, description, content);
    results[slug] = {
      title,
      summary: res.summary,
      model: res.model,
      provider: res.provider,
      generatedAt: new Date().toISOString(),
    };
    console.log(`[Done] ${slug} -> ${res.summary.slice(0, 50)}...`);

    // Small delay between calls
    await new Promise((r) => setTimeout(r, 400));
  }

  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n[Chronral Generator] Successfully saved ${Object.keys(results).length} clean summaries to ${outputFile}`);
}

main().catch((err) => {
  console.error('[Chronral Generator Error]', err);
  process.exit(1);
});
