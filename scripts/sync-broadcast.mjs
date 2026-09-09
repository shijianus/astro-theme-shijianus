import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import yaml from 'js-yaml';

const BROADCAST_MD_PATH = path.resolve(process.cwd(), 'src/content/broadcast.md');
const PROMPT_PATH = path.resolve(process.cwd(), 'src/config/broadcast-prompt.md');
const GENERATED_DIR = path.resolve(process.cwd(), 'src/.generated');
const GENERATED_JSON_PATH = path.resolve(GENERATED_DIR, 'broadcast.json');

const DEFAULT_BROADCAST_MD = `---
badge: "博主动态"
title: "📢 读者中心全面升级与评论区常驻优化"
date: "${new Date().toISOString().slice(0, 10)}"
author: "shijianus"
href: "/posts/content-formats-and-markup-mastery/"
summary: "本期版本针对评论区常驻无感刷新、多端国旗高清位图呈现及个人中心偏好设置进行了深度重构与打磨。"
---

### 🚀 本次更新概览
- **评论区常驻无感刷新**：彻底消除窗口聚焦与点击时的重绘闪烁，引入后台 25 秒静默轮询机制。
- **高清国旗资源第一方本地化**：引入 40+ 地区 Retina PNG 旗帜位图，在任何系统环境下 100% 稳定高保真呈现。
- **偏好设置全量复原**：完整保留站内通知、评论排序、多级嵌套回复折叠及触感音效偏好。
- **构建时广播机制**：支持博主在构建前自主编撰通告，或通过 AI 自动对比 Git 变更提炼更新日志。
`;

/**
 * Parse Markdown with frontmatter into structured broadcast data
 */
export function parseBroadcast(rawText) {
  const normalized = rawText.trim();
  const fmMatch = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  let meta = {};
  let body = normalized;

  if (fmMatch) {
    try {
      meta = yaml.load(fmMatch[1]) || {};
    } catch (e) {
      console.warn('[Broadcast] YAML frontmatter parse warning:', e.message);
    }
    body = fmMatch[2].trim();
  }

  // Extract bullet points from markdown body (- **xxx**: yyy)
  const bullets = [];
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Clean up markdown bold markers for clean HTML rendering
      let item = trimmed.slice(2).trim();
      // Format **bold** to <strong>bold</strong>
      item = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      bullets.push(item);
    }
  }

  return {
    id: `broadcast-${meta.date || Date.now()}`,
    badge: meta.badge || '全站通告',
    title: meta.title || '站长最新通告',
    date: meta.date || new Date().toISOString().slice(0, 10),
    author: meta.author || 'shijianus',
    href: meta.href || '#',
    summary: meta.summary || (bullets[0] ? bullets[0].replace(/<[^>]+>/g, '') : '点击查看详情...'),
    bullets: bullets.length > 0 ? bullets : [],
    rawBody: body,
  };
}

/**
 * Collect Git and Post context for AI comparison
 */
function gatherContext() {
  let gitLogs = '暂无 Git 记录';
  let gitDiffStat = '暂无 Diff 统计';

  try {
    gitLogs = execSync('git log -n 10 --pretty=format:"* %h (%ad): %s" --date=short', { encoding: 'utf8' }).trim();
  } catch {}

  try {
    gitDiffStat = execSync('git diff --stat HEAD~3 HEAD 2>/dev/null || git status --short', { encoding: 'utf8' }).trim();
  } catch {}

  // Collect recent 3 posts
  let recentPostsInfo = '暂无博文列表';
  try {
    const postsDir = path.resolve(process.cwd(), 'src/content/posts');
    if (fs.existsSync(postsDir)) {
      const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
      const postsMeta = [];
      for (const file of files) {
        const fullPath = path.join(postsDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (match) {
          try {
            const data = yaml.load(match[1]);
            if (data && data.title) {
              postsMeta.push({
                file,
                title: data.title,
                date: data.pubDate ? new Date(data.pubDate).toISOString().slice(0, 10) : '',
                description: data.description || '',
              });
            }
          } catch {}
        }
      }
      postsMeta.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      recentPostsInfo = postsMeta
        .slice(0, 3)
        .map((p) => `* 《${p.title}》(${p.date || '最新'}) - ${p.description}`)
        .join('\n');
    }
  } catch {}

  return { gitLogs, gitDiffStat, recentPostsInfo };
}

/**
 * Call AI to generate fresh broadcast markdown
 */
async function generateBroadcastViaAI({ apiKey, baseUrl, model }) {
  console.log(`[Broadcast] 🤖 Starting AI-assisted broadcast generation (Model: ${model})...`);

  let systemPrompt = '';
  try {
    systemPrompt = fs.readFileSync(PROMPT_PATH, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read prompt template: ${err.message}`);
  }

  let previousBroadcast = '暂无历史通告';
  if (fs.existsSync(BROADCAST_MD_PATH)) {
    previousBroadcast = fs.readFileSync(BROADCAST_MD_PATH, 'utf8');
  }

  const { gitLogs, gitDiffStat, recentPostsInfo } = gatherContext();
  const currentDate = new Date().toISOString().slice(0, 10);

  const userMessage = `【当前构建日期】：${currentDate}

【最近提交记录 Git Commits】：
${gitLogs}

【代码与文件变动统计 Git Diff Stat】：
${gitDiffStat}

【最近发表/更新博文 Recent Posts】：
${recentPostsInfo}

【上一版全站广播记录 Previous Broadcast】：
${previousBroadcast}

请按照系统提示词中的“四步链式核对流程”进行分析与核验，生成准确、无幻觉且符合输出格式规范的全新全站广播 Markdown 内容。`;

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`API HTTP ${response.status}: ${errorBody.slice(0, 200)}`);
  }

  const json = await response.json();
  let content = json?.choices?.[0]?.message?.content?.trim() || '';

  // Clean markdown fence if LLM wrapped in ```markdown ... ```
  content = content.replace(/^```markdown\r?\n/, '').replace(/^```\r?\n/, '').replace(/\r?\n```$/, '').trim();

  if (!content.startsWith('---') || !content.includes('badge:')) {
    throw new Error('AI output missing required YAML Frontmatter');
  }

  return content;
}

/**
 * Main execution flow
 */
async function main() {
  const isAiEnabled = process.env.ENABLE_AI_BROADCAST === 'true';
  const apiKey =
    process.env.AI_BROADCAST_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';
  const baseUrl = process.env.AI_BROADCAST_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_BROADCAST_MODEL || 'deepseek-chat';

  // Ensure directories exist
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }

  // Ensure broadcast.md exists
  if (!fs.existsSync(BROADCAST_MD_PATH)) {
    console.log('[Broadcast] Creating initial src/content/broadcast.md...');
    fs.writeFileSync(BROADCAST_MD_PATH, DEFAULT_BROADCAST_MD, 'utf8');
  }

  // Tier 2: AI Assistance (only if enabled & apiKey configured)
  if (isAiEnabled && apiKey) {
    try {
      const generatedMarkdown = await generateBroadcastViaAI({ apiKey, baseUrl, model });
      fs.writeFileSync(BROADCAST_MD_PATH, generatedMarkdown, 'utf8');
      console.log('[Broadcast] ✅ Successfully updated src/content/broadcast.md via AI!');
    } catch (err) {
      console.warn(`[Broadcast] ⚠️ AI generation skipped due to error: ${err.message}`);
      console.warn('[Broadcast] ℹ️ Using existing src/content/broadcast.md without interrupting build.');
    }
  } else {
    if (isAiEnabled && !apiKey) {
      console.log('[Broadcast] ℹ️ ENABLE_AI_BROADCAST is true, but no API Key found in env. Using manual src/content/broadcast.md.');
    } else {
      console.log('[Broadcast] ℹ️ AI auto-generation is disabled (ENABLE_AI_BROADCAST=false). Using manual src/content/broadcast.md.');
    }
  }

  // Tier 1 & 3: Parse broadcast.md and compile cache
  const rawText = fs.readFileSync(BROADCAST_MD_PATH, 'utf8');
  const structuredData = parseBroadcast(rawText);

  fs.writeFileSync(GENERATED_JSON_PATH, JSON.stringify(structuredData, null, 2), 'utf8');
  console.log(`[Broadcast] 📦 Compiled broadcast payload ready: "${structuredData.title}" (${structuredData.bullets.length} highlights).`);
}

main().catch((err) => {
  console.error('[Broadcast] Fatal error in sync-broadcast:', err);
  // Do not exit with 1 to avoid blocking build on edge cases
  process.exit(0);
});
