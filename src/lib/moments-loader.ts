/**
 * Moments Loader & Federation Engine
 * 
 * 朋友圈内容加载器与主题联盟数据管线
 * 支持从 src/content/moments/*.md 读取站长原生 Markdown 说说
 * 并与 friends-moments.json / 友邻 shijianus-moments.json 深度混排
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { friendsConfig, type MomentItem } from '../config/friends';

export interface ShijianusMomentsManifest {
  version: string;
  protocol: 'shijianus-moments-v1';
  generator: string;
  site: {
    title: string;
    url: string;
    avatar: string;
    desc: string;
  };
  api: {
    comments: string;
    likes: string;
    crossComment: string;
  };
  updatedAt: string;
  total: number;
  moments: Array<{
    id: string;
    author: string;
    authorUrl: string;
    avatar: string;
    badge?: string;
    isOwner: boolean;
    mood?: string;
    device?: string;
    title: string;
    url: string;
    summary: string;
    timeAgo: string;
    timestamp: string;
    category: 'tech' | 'life' | 'design' | 'thought';
    tags: string[];
    likes: number;
    commentCount?: number;
    origin?: string;
    originUrl?: string;
    originApi?: string;
  }>;
}

/**
 * Format relative time string from Date or ISO string
 */
export function formatTimeAgo(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return '刚刚';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分钟前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}小时前`;
  if (diffSec < 86400 * 2) return '昨天';
  if (diffSec < 86400 * 3) return '前天';
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)}天前`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Format timestamp into YYYY-MM-DD HH:mm
 */
export function formatTimestamp(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

/**
 * Clean markdown symbols for summary snippet
 */
function cleanMarkdownSnippet(body: string, maxLength = 260): string {
  if (!body) return '';
  return body
    .replace(/^#+\s+/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Convert Astro moments collection entries into standard MomentItems
 */
export function convertCollectionMoments(entries: CollectionEntry<'moments'>[]): MomentItem[] {
  return entries.map((entry) => {
    const data = entry.data;
    const body = entry.body || '';
    const dateObj = data.pubDate || new Date();
    const summary = cleanMarkdownSnippet(body) || '暂无内容';
    const firstLine = body.split('\n').map((s) => s.trim()).filter(Boolean)[0] || '站长新说说';
    const title = firstLine.length > 40 ? `${firstLine.slice(0, 40)}...` : firstLine;
    const momentId = data.id || `m_${entry.id}`;
    const images = Array.isArray(data.images) && data.images.length > 0 ? data.images : [];

    return {
      id: momentId,
      author: data.author || friendsConfig.siteInfo.name,
      authorUrl: data.authorUrl || friendsConfig.siteInfo.url,
      avatar: data.avatar || friendsConfig.siteInfo.avatar,
      badge: '👑 站长原声',
      isOwner: true,
      mood: data.mood || '☕ 思考',
      device: data.device || 'Mac Studio · Astro 5',
      title,
      url: `/moments/#moment-${momentId}`,
      summary,
      content: body,
      images,
      timeAgo: formatTimeAgo(dateObj),
      timestamp: data.date || formatTimestamp(dateObj),
      category: data.category || 'thought',
      tags: data.tags || ['站长原声'],
      likes: data.likes || 0,
      commentCount: data.commentCount || 0,
      origin: friendsConfig.siteInfo.url,
      originUrl: `${friendsConfig.siteInfo.url}/moments/#moment-${momentId}`,
      originApi: `${friendsConfig.siteInfo.url}/api/comments`,
    };
  });
}

/**
 * Load all moments: Markdown local moments + Synced friends moments
 */
export async function getAllMoments(): Promise<MomentItem[]> {
  let localMoments: MomentItem[] = [];
  try {
    const rawEntries = await getCollection('moments');
    localMoments = convertCollectionMoments(rawEntries);
  } catch (err) {
    console.warn('[MomentsLoader] Failed to read moments collection, falling back to static config:', err);
  }

  // Load friends synced moments
  let syncedFriendMoments: MomentItem[] = [];
  try {
    // If running in Node environment during build
    if (typeof process !== 'undefined' && process.cwd) {
      const fs = (globalThis as any).__node_fs || await import('node:fs');
      const path = (globalThis as any).__node_path || await import('node:path');
      const dataPath = path.resolve(process.cwd(), 'public/data/friends-moments.json');
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          syncedFriendMoments = parsed.filter((m: MomentItem) => !m.isOwner);
        }
      }
    }
  } catch {
    // Graceful fallback to static friends moments in config
  }

  // If no synced friends moments found, fallback to friendsConfig.moments (excluding duplicate owners)
  if (syncedFriendMoments.length === 0) {
    syncedFriendMoments = friendsConfig.moments.filter((m) => !m.isOwner);
  }

  // Combine local master moments and friends moments
  const combined = [...localMoments, ...syncedFriendMoments];

  // If local moments was empty, also keep owner moments from config
  if (localMoments.length === 0) {
    const configOwnerMoments = friendsConfig.moments.filter((m) => m.isOwner);
    combined.unshift(...configOwnerMoments);
  }

  // Deduplicate by ID
  const seenIds = new Set<string>();
  const deduplicated: MomentItem[] = [];
  for (const m of combined) {
    if (!seenIds.has(m.id)) {
      seenIds.add(m.id);
      deduplicated.push(m);
    }
  }

  return deduplicated;
}

/**
 * Generate standard shijianus-moments-v1 manifest for public export
 */
export function generateShijianusManifest(ownerMoments: MomentItem[]): ShijianusMomentsManifest {
  const site = friendsConfig.siteInfo;
  return {
    version: '1.0.0',
    protocol: 'shijianus-moments-v1',
    generator: 'shijianus-blog-theme',
    site: {
      title: site.name,
      url: site.url,
      avatar: site.avatar,
      desc: site.desc,
    },
    api: {
      comments: `${site.url}/api/comments`,
      likes: `${site.url}/api/comments`,
      crossComment: `${site.url}/api/cross-comment`,
    },
    updatedAt: new Date().toISOString(),
    total: ownerMoments.length,
    moments: ownerMoments.map((m) => ({
      id: m.id,
      author: m.author,
      authorUrl: m.authorUrl,
      avatar: m.avatar,
      badge: m.badge,
      isOwner: true,
      mood: m.mood,
      device: m.device,
      title: m.title,
      url: m.url,
      summary: m.summary,
      timeAgo: m.timeAgo,
      timestamp: m.timestamp,
      category: m.category,
      tags: m.tags,
      likes: m.likes,
      commentCount: m.commentCount,
      origin: site.url,
      originUrl: `${site.url}/moments/#${m.id}`,
      originApi: `${site.url}/api/comments`,
    })),
  };
}
