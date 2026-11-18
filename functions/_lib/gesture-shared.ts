import type { AppEnv, D1DatabaseLike } from './types';

export interface RawCommentRow {
  id: string;
  post_slug: string;
  parent_id: string | null;
  reply_to_id?: string | null;
  quote_id: string | null;
  quote_source?: string;
  post_type: 'comment' | 'gesture' | 'boost' | 'emoji' | 'moment_like';
  tag?: string;
  title?: string | null;
  tags?: string | null;
  edit_count?: number;
  views_count?: number;
  author_id: string;
  author_name: string;
  author_email?: string;
  author_avatar?: string;
  author_website?: string;
  author_role: 'admin' | 'reader' | 'visitor';
  message: string;
  session_token?: string;
  ip?: string;
  ip_country?: string;
  ip_location?: string;
  show_location: number;
  user_agent?: string;
  likes_count: number;
  reactions?: string;
  status: 'published' | 'pinned' | 'flagged' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface RawBoostRow {
  id: string;
  gesture_id: string | null;
  user_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  created_at: string;
}

export interface ReactionDetailItem {
  emoji: string;
  count: number;
  users: Array<{ name: string; avatar?: string }>;
}

export const COUNTRY_NAMES: Record<string, { zh: string; en: string }> = {
  TW: { zh: '台湾', en: 'Taiwan' },
  HK: { zh: '香港', en: 'Hong Kong' },
  MO: { zh: '澳门', en: 'Macau' },
  CN: { zh: '中国大陆', en: 'China' },
  US: { zh: '美国', en: 'United States' },
  JP: { zh: '日本', en: 'Japan' },
  KR: { zh: '韩国', en: 'South Korea' },
  SG: { zh: '新加坡', en: 'Singapore' },
  GB: { zh: '英国', en: 'United Kingdom' },
  DE: { zh: '德国', en: 'Germany' },
  FR: { zh: '法国', en: 'France' },
  CA: { zh: '加拿大', en: 'Canada' },
  AU: { zh: '澳大利亚', en: 'Australia' },
  RU: { zh: '俄罗斯', en: 'Russia' },
  IN: { zh: '印度', en: 'India' },
  MY: { zh: '马来西亚', en: 'Malaysia' },
  GLOBAL: { zh: '全球', en: 'Global' },
};

export function resolveCountryInfo(countryCode: string) {
  const code = (countryCode || 'GLOBAL').toUpperCase();
  const entry = COUNTRY_NAMES[code];
  const name = entry?.zh || code;
  const englishName = entry?.en || code;
  let flag = '🌐';
  if (code === 'TW') flag = '🇹🇼';
  else if (code === 'HK') flag = '🇭🇰';
  else if (code === 'MO') flag = '🇲🇴';
  else if (code.length === 2 && code !== 'XX' && code !== 'ZZ') {
    const codePoints = [...code].map((c) => 127397 + c.charCodeAt(0));
    flag = String.fromCodePoint(...codePoints);
  }
  return { code, name, englishName, flag };
}

export function generateSecureId(prefix: string, bytesCount = 12): string {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const array = new Uint8Array(bytesCount);
    crypto.getRandomValues(array);
    const hex = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}_${Date.now()}_${hex}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
}

// Shared dev-mode fallback stores (across /api/comments and /api/gestures)
const globalStores = globalThis as unknown as {
  __shijianusCommentsStore?: Map<string, RawCommentRow>;
  __shijianusBoostsStore?: Map<string, RawBoostRow>;
  __shijianusSubscriptionsStore?: Map<string, boolean>;
};

export const memoryFallbackStore: Map<string, RawCommentRow> =
  globalStores.__shijianusCommentsStore || (globalStores.__shijianusCommentsStore = new Map());

export const memoryBoostsStore: Map<string, RawBoostRow> =
  globalStores.__shijianusBoostsStore || (globalStores.__shijianusBoostsStore = new Map());

export const memorySubscriptionsStore: Map<string, boolean> =
  globalStores.__shijianusSubscriptionsStore || (globalStores.__shijianusSubscriptionsStore = new Map());

export function syncDevStore(action: 'load' | 'save') {
  if (typeof process === 'undefined' || !process.cwd || typeof process.versions?.node === 'undefined') return;
  try {
    const getMod = (process as any).getBuiltinModule;
    const fs = (globalThis as any).__node_fs || (typeof getMod === 'function' ? getMod('node:fs') : undefined);
    const path = (globalThis as any).__node_path || (typeof getMod === 'function' ? getMod('node:path') : undefined);
    if (!fs || !path) return;
    const storePath = path.resolve(process.cwd(), '.comments-dev.json');
    const boostsPath = path.resolve(process.cwd(), '.boosts-dev.json');
    if (action === 'load') {
      if (fs.existsSync(storePath)) {
        const raw = fs.readFileSync(storePath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          memoryFallbackStore.clear();
          for (const item of list) {
            memoryFallbackStore.set(item.id, item);
          }
        }
      }
      if (fs.existsSync(boostsPath)) {
        const raw = fs.readFileSync(boostsPath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          memoryBoostsStore.clear();
          for (const item of list) {
            memoryBoostsStore.set(item.id, item);
          }
        }
      }
    } else {
      fs.writeFileSync(storePath, JSON.stringify(Array.from(memoryFallbackStore.values()), null, 2), 'utf8');
      fs.writeFileSync(boostsPath, JSON.stringify(Array.from(memoryBoostsStore.values()), null, 2), 'utf8');
    }
  } catch {}
}

syncDevStore('load');

let gestureTablesEnsured = false;

export async function ensureGestureTables(db?: D1DatabaseLike) {
  if (!db || !db.prepare || gestureTablesEnsured) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_slug TEXT NOT NULL,
        parent_id TEXT,
        reply_to_id TEXT DEFAULT NULL,
        quote_id TEXT,
        quote_source TEXT DEFAULT '',
        post_type TEXT DEFAULT 'comment',
        tag TEXT DEFAULT 'general',
        title TEXT DEFAULT NULL,
        tags TEXT DEFAULT '[]',
        edit_count INTEGER DEFAULT 0,
        views_count INTEGER DEFAULT 0,
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_email TEXT DEFAULT '',
        author_avatar TEXT DEFAULT '',
        author_website TEXT DEFAULT '',
        author_role TEXT DEFAULT 'visitor',
        message TEXT NOT NULL,
        session_token TEXT,
        ip TEXT,
        ip_country TEXT DEFAULT 'GLOBAL',
        ip_location TEXT DEFAULT '',
        show_location INTEGER DEFAULT 1,
        user_agent TEXT,
        likes_count INTEGER DEFAULT 0,
        reactions TEXT DEFAULT '{}',
        status TEXT DEFAULT 'published',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).bind().run();

    const alterStatements = [
      `ALTER TABLE comments ADD COLUMN tag TEXT DEFAULT 'general';`,
      `ALTER TABLE comments ADD COLUMN title TEXT DEFAULT NULL;`,
      `ALTER TABLE comments ADD COLUMN tags TEXT DEFAULT '[]';`,
      `ALTER TABLE comments ADD COLUMN reply_to_id TEXT DEFAULT NULL;`,
      `ALTER TABLE comments ADD COLUMN edit_count INTEGER DEFAULT 0;`,
      `ALTER TABLE comments ADD COLUMN views_count INTEGER DEFAULT 0;`,
    ];
    for (const sql of alterStatements) {
      try {
        await db.prepare(sql).bind().run();
      } catch {}
    }

    const indexStatements = [
      `CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments (post_slug);`,
      `CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments (created_at);`,
      `CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments (parent_id);`,
      `CREATE INDEX IF NOT EXISTS idx_comments_reply_to_id ON comments (reply_to_id);`,
      `CREATE INDEX IF NOT EXISTS idx_comments_ip_created ON comments (ip, created_at);`,
      `CREATE INDEX IF NOT EXISTS idx_comments_tag ON comments (tag);`,
    ];
    for (const sql of indexStatements) {
      try {
        await db.prepare(sql).bind().run();
      } catch {}
    }

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS boosts (
        id TEXT PRIMARY KEY,
        gesture_id TEXT DEFAULT NULL,
        user_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_avatar TEXT DEFAULT '',
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).bind().run();
    try {
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_boosts_gesture_id ON boosts (gesture_id, created_at);`).bind().run();
    } catch {}

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS gesture_subscriptions (
        gesture_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        subscribed INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (gesture_id, user_id)
      );
    `).bind().run();

    gestureTablesEnsured = true;
  } catch (err) {
    console.error('[GestureShared] Table ensure error:', err);
  }
}

export interface ParsedReactions {
  summary: Record<string, number>;
  users: Record<string, string>;
  userProfiles: Record<string, { name: string; avatar?: string }>;
}

export function parseReactionsColumn(raw?: string, fallbackLikesCount = 0): ParsedReactions {
  let parsed: ParsedReactions = { summary: {}, users: {}, userProfiles: {} };
  if (raw) {
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') {
        parsed = {
          summary: obj.summary && typeof obj.summary === 'object' ? obj.summary : {},
          users: obj.users && typeof obj.users === 'object' ? obj.users : {},
          userProfiles: obj.userProfiles && typeof obj.userProfiles === 'object' ? obj.userProfiles : {},
        };
      }
    } catch {}
  }
  const sumTotal = Object.values(parsed.summary).reduce((a, b) => a + Number(b || 0), 0);
  if (sumTotal === 0 && fallbackLikesCount > 0) {
    parsed.summary['👍'] = Number(fallbackLikesCount);
  }
  return parsed;
}

export function buildReactionDetails(rx: ParsedReactions): ReactionDetailItem[] {
  const byEmoji = new Map<string, Array<{ name: string; avatar?: string }>>();
  for (const [uid, emoji] of Object.entries(rx.users)) {
    if (!emoji) continue;
    if (!byEmoji.has(emoji)) byEmoji.set(emoji, []);
    const profile = rx.userProfiles[uid];
    byEmoji.get(emoji)!.push({
      name: profile?.name || '社区成员',
      avatar: profile?.avatar || undefined,
    });
  }

  return Object.entries(rx.summary)
    .filter(([, count]) => Number(count) > 0)
    .map(([emoji, count]) => ({
      emoji,
      count: Number(count),
      users: byEmoji.get(emoji) || [],
    }))
    .sort((a, b) => b.count - a.count);
}

export function mapRowToClientComment(
  row: RawCommentRow,
  isAdmin = false,
  currentUserId = '',
  floorIndex?: number
) {
  const isVisitor = row.author_role === 'visitor';
  const showLoc = isVisitor ? true : Boolean(row.show_location);
  const countryInfo = resolveCountryInfo(row.ip_country || 'GLOBAL');

  let quoteParsed = null;
  if (row.quote_source) {
    try {
      quoteParsed = JSON.parse(row.quote_source);
    } catch {
      quoteParsed = null;
    }
  }

  let tagsParsed: string[] = [];
  if (row.tags) {
    try {
      const parsed = JSON.parse(row.tags);
      if (Array.isArray(parsed)) {
        tagsParsed = parsed.map((t) => String(t)).filter(Boolean);
      }
    } catch {}
  }

  const rxParsed = parseReactionsColumn(row.reactions, row.likes_count || 0);
  const summaryTotal = Object.values(rxParsed.summary).reduce((a, b) => a + Number(b || 0), 0);

  let clientUsers: Record<string, string> = {};
  if (isAdmin) {
    clientUsers = rxParsed.users;
  } else if (currentUserId && rxParsed.users[currentUserId]) {
    clientUsers = { [currentUserId]: rxParsed.users[currentUserId] };
  }

  return {
    id: row.id,
    postSlug: row.post_slug,
    parentId: row.parent_id,
    replyToId: row.reply_to_id || null,
    quoteId: row.quote_id,
    quote: quoteParsed,
    postType: row.post_type || 'comment',
    tag: row.tag || 'general',
    title: row.title || null,
    tags: tagsParsed,
    editCount: Number(row.edit_count || 0),
    viewsCount: Number(row.views_count || 0),
    floorIndex,
    authorId: row.author_id,
    authorName: row.author_name || (row.author_role === 'admin' ? 'shijianus' : '访客'),
    authorAvatar: row.author_avatar || (row.author_role === 'admin' ? '/media/shijianus/avatar.jpg' : ''),
    authorWebsite: row.author_website || '',
    authorRole: row.author_role || 'visitor',
    message: row.message,
    likesCount: Number(row.likes_count || summaryTotal || 0),
    reactions: {
      summary: rxParsed.summary,
      users: clientUsers,
      details: buildReactionDetails(rxParsed),
    },
    status: row.status || 'published',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    showLocation: showLoc,
    ipCountry: showLoc || isAdmin ? countryInfo.code : null,
    ipCountryName: showLoc || isAdmin ? countryInfo.name : null,
    ipCountryFlag: showLoc || isAdmin ? countryInfo.flag : null,
    ipLocation: showLoc || isAdmin ? (row.ip_location || countryInfo.name) : null,
    ip: isAdmin ? row.ip : undefined,
  };
}
