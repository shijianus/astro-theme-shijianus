import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export interface SiteBroadcastData {
  id: string;
  badge: string;
  title: string;
  date: string;
  author: string;
  href: string;
  summary: string;
  bullets: string[];
  rawBody: string;
}

const DEFAULT_BROADCAST: SiteBroadcastData = {
  id: 'broadcast-default',
  badge: '博主动态',
  title: '📢 读者中心全面升级与评论区常驻优化',
  date: new Date().toISOString().slice(0, 10),
  author: 'shijianus',
  href: '/posts/content-formats-and-markup-mastery/',
  summary: '本期版本针对评论区常驻无感刷新、多端国旗高清位图呈现及个人中心偏好设置进行了深度重构与打磨。',
  bullets: [
    '<strong>评论区常驻无感刷新</strong>：彻底消除窗口聚焦与点击时的重绘闪烁，引入后台 25 秒静默轮询机制。',
    '<strong>高清国旗资源第一方本地化</strong>：引入 40+ 地区 Retina PNG 旗帜位图，在非 Apple 系统环境下 100% 稳定高保真呈现。',
    '<strong>偏好设置全量复原</strong>：完整保留站内通知、评论排序、多级嵌套回复折叠及触感音效偏好。',
    '<strong>构建时广播机制</strong>：支持博主在构建前自主编撰通告，或通过 AI 自动对比 Git 变更提炼更新日志。',
  ],
  rawBody: '',
};

/**
 * Load broadcast data during build time (zero DB queries)
 */
export function loadBroadcastData(): SiteBroadcastData {
  try {
    const jsonPath = path.resolve(process.cwd(), 'src/.generated/broadcast.json');
    if (fs.existsSync(jsonPath)) {
      const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (parsed && parsed.title) return parsed;
    }
  } catch {}

  try {
    const mdPath = path.resolve(process.cwd(), 'src/content/broadcast.md');
    if (fs.existsSync(mdPath)) {
      const rawText = fs.readFileSync(mdPath, 'utf8');
      const fmMatch = rawText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (fmMatch) {
        const meta = (yaml.load(fmMatch[1]) as any) || {};
        const body = fmMatch[2].trim();
        const bullets: string[] = [];
        for (const line of body.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            bullets.push(trimmed.slice(2).trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'));
          }
        }
        return {
          id: `broadcast-${meta.date || Date.now()}`,
          badge: meta.badge || '博主动态',
          title: meta.title || '站长最新通告',
          date: meta.date || new Date().toISOString().slice(0, 10),
          author: meta.author || 'shijianus',
          href: meta.href || '#',
          summary: meta.summary || (bullets[0] ? bullets[0].replace(/<[^>]+>/g, '') : '点击查看详情...'),
          bullets,
          rawBody: body,
        };
      }
    }
  } catch (err) {
    console.warn('[Broadcast] Error loading broadcast.md fallback:', err);
  }

  return DEFAULT_BROADCAST;
}
