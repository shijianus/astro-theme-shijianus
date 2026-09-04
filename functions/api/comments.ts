import type { AppEnv } from '../_lib/types';
import { jsonResponse, optionsResponse, safeReadJson } from '../_lib/http';

interface RawCommentRow {
  id: string;
  post_slug: string;
  parent_id: string | null;
  quote_id: string | null;
  quote_source?: string;
  post_type: 'comment' | 'boost' | 'emoji';
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
  status: 'published' | 'pinned' | 'flagged' | 'deleted';
  created_at: string;
  updated_at: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  CN: '中国',
  HK: '中国香港',
  MO: '中国澳门',
  TW: '中国台湾',
  US: '美国',
  JP: '日本',
  KR: '韩国',
  SG: '新加坡',
  GB: '英国',
  DE: '德国',
  FR: '法国',
  CA: '加拿大',
  AU: '澳大利亚',
  RU: '俄罗斯',
  IN: '印度',
  GLOBAL: '全球',
};

function resolveCountryInfo(countryCode: string) {
  const code = (countryCode || 'GLOBAL').toUpperCase();
  const name = COUNTRY_NAMES[code] || code;
  let flag = '🌍';
  if (code.length === 2 && code !== 'XX' && code !== 'ZZ') {
    const codePoints = [...code].map((c) => 127397 + c.charCodeAt(0));
    flag = String.fromCodePoint(...codePoints);
  }
  return { code, name, flag };
}

// In-memory fallback store when running without D1 binding
const memoryFallbackStore = new Map<string, RawCommentRow>();

async function ensureTable(db: any) {
  if (!db || !db.prepare) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_slug TEXT NOT NULL,
        parent_id TEXT,
        quote_id TEXT,
        quote_source TEXT DEFAULT '',
        post_type TEXT DEFAULT 'comment',
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
        status TEXT DEFAULT 'published',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments (post_slug);`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments (created_at);`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments (parent_id);`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_ip_created ON comments (ip, created_at);`).run();
  } catch (err) {
    console.error('[Comments] Table ensure error:', err);
  }
}

function mapRowToClientComment(row: RawCommentRow, isAdmin = false) {
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

  return {
    id: row.id,
    postSlug: row.post_slug,
    parentId: row.parent_id,
    quoteId: row.quote_id,
    quote: quoteParsed,
    postType: row.post_type || 'comment',
    authorId: row.author_id,
    authorName: row.author_name || '访客',
    authorAvatar: row.author_avatar || '',
    authorWebsite: row.author_website || '',
    authorRole: row.author_role || 'visitor',
    message: row.message,
    likesCount: Number(row.likes_count || 0),
    status: row.status || 'published',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Country & Location exposure rules
    showLocation: showLoc,
    ipCountry: showLoc || isAdmin ? countryInfo.code : null,
    ipCountryName: showLoc || isAdmin ? countryInfo.name : null,
    ipCountryFlag: showLoc || isAdmin ? countryInfo.flag : null,
    ipLocation: showLoc || isAdmin ? (row.ip_location || countryInfo.name) : null,
    // Raw IP is exclusively exposed to Admin
    ip: isAdmin ? row.ip : undefined,
  };
}

async function sendTelegramCommentNotification(
  env: AppEnv,
  data: {
    slug: string;
    authorName: string;
    message: string;
    ip: string;
    country: string;
    id: string;
    parentId?: string | null;
    postType: string;
  }
) {
  const token = env.TELEGRAM_BOT_TOKEN || (typeof process !== 'undefined' && process.env?.TELEGRAM_BOT_TOKEN);
  const chatId = env.TELEGRAM_CHAT_ID || (typeof process !== 'undefined' && process.env?.TELEGRAM_CHAT_ID);
  if (!token || !chatId) return;

  const typeIcon = data.postType === 'boost' ? '⚡ Boost' : (data.parentId ? '💬 回复' : '💬 留言');
  const countryInfo = resolveCountryInfo(data.country);

  const text = [
    `<b>博客新互动提醒 (${typeIcon})</b>`,
    `----------------------------------------`,
    `📝 <b>文章</b>: <code>/posts/${data.slug}/</code>`,
    `👤 <b>发言人</b>: <b>${data.authorName}</b>`,
    `💬 <b>内容</b>:\n${data.message}`,
    `🌍 <b>来源地</b>: ${countryInfo.flag} <code>${countryInfo.name}</code> (${data.ip || 'Unknown'})`,
    `🆔 <b>编号</b>: <code>${data.id}</code>${data.parentId ? ` (父级: <code>${data.parentId}</code>)` : ''}`,
    `⏰ <b>时间</b>: <code>${new Date().toISOString()}</code>`,
    `----------------------------------------`,
  ].join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch (err) {
    console.error('[Comments] Telegram notify error:', err);
  }
}

export async function onRequest(context: {
  request: Request;
  env: AppEnv;
  waitUntil?: (promise: Promise<unknown>) => void;
}): Promise<Response> {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  const url = new URL(request.url);
  const headerAdminToken = request.headers.get('X-Admin-Token') || request.headers.get('Authorization')?.replace('Bearer ', '');
  const isAdmin = Boolean(env.ADMIN_TOKEN && headerAdminToken && headerAdminToken === env.ADMIN_TOKEN);

  // ----------------------------------------------------
  // GET: Fetch real comments for a post slug (supports sort=hot|new)
  // ----------------------------------------------------
  if (method === 'GET') {
    const slug = url.searchParams.get('slug')?.trim();
    const sort = (url.searchParams.get('sort') || 'new').toLowerCase();

    if (!slug) {
      return jsonResponse(request, env, { ok: false, error: 'Slug parameter is required' }, { status: 400 });
    }

    if (env.DB) {
      await ensureTable(env.DB);
      try {
        const orderClause = sort === 'hot'
          ? `ORDER BY CASE WHEN status = 'pinned' THEN 0 ELSE 1 END, likes_count DESC, created_at DESC`
          : `ORDER BY CASE WHEN status = 'pinned' THEN 0 ELSE 1 END, created_at DESC`;

        const query = `
          SELECT id, post_slug, parent_id, quote_id, quote_source, post_type, author_id, author_name,
                 author_avatar, author_website, author_role, message, ip, ip_country, ip_location,
                 show_location, likes_count, status, created_at, updated_at
          FROM comments
          WHERE post_slug = ? AND status != 'deleted'
          ${orderClause}
        `;
        const res = await env.DB.prepare(query).bind(slug).all<RawCommentRow>();
        const rows = res.results || [];
        return jsonResponse(request, env, {
          ok: true,
          sort,
          comments: rows.map((r) => mapRowToClientComment(r, isAdmin)),
        });
      } catch (dbErr: any) {
        console.error('[Comments] DB query error:', dbErr);
        return jsonResponse(request, env, { ok: true, sort, comments: [] });
      }
    }

    // In-memory fallback
    const list = Array.from(memoryFallbackStore.values())
      .filter((c) => c.post_slug === slug && c.status !== 'deleted')
      .sort((a, b) => {
        if (a.status === 'pinned' && b.status !== 'pinned') return -1;
        if (b.status === 'pinned' && a.status !== 'pinned') return 1;
        if (sort === 'hot') {
          const diffLikes = (b.likes_count || 0) - (a.likes_count || 0);
          if (diffLikes !== 0) return diffLikes;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .map((r) => mapRowToClientComment(r, isAdmin));

    return jsonResponse(request, env, { ok: true, sort, comments: list });
  }

  // ----------------------------------------------------
  // POST / PUT / DELETE Actions
  // ----------------------------------------------------
  const payload = (await safeReadJson<any>(request)) || {};
  const action = (payload.action || (method === 'PUT' ? 'edit' : method === 'DELETE' ? 'delete' : 'create')).toLowerCase();
  const headerSessionToken = request.headers.get('X-Comment-Session-Token');
  const sessionToken = payload.sessionToken || headerSessionToken || '';
  const adminToken = payload.adminToken || headerAdminToken || '';
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const cfCountry = request.headers.get('cf-ipcountry') || 'GLOBAL';

  // 1. CREATE COMMENT / BOOST / EMOJI
  if (action === 'create') {
    const slug = (payload.slug || url.searchParams.get('slug') || '').trim();
    const rawMessage = (payload.message || '').trim();
    const postType = (payload.postType === 'boost' ? 'boost' : (payload.postType === 'emoji' ? 'emoji' : 'comment'));
    const authorRole = payload.authorRole === 'admin' ? 'admin' : (payload.authorRole === 'reader' ? 'reader' : 'visitor');
    const isVisitor = authorRole === 'visitor';

    if (!slug) {
      return jsonResponse(request, env, { ok: false, error: '文章标识 (slug) 不能为空' }, { status: 400 });
    }
    if (!rawMessage || rawMessage.length < 1) {
      return jsonResponse(request, env, { ok: false, error: '内容不能为空' }, { status: 400 });
    }

    // Boost limit check: <= 16 characters
    if (postType === 'boost' && rawMessage.length > 16) {
      return jsonResponse(request, env, { ok: false, error: '⚡ Boost 动态内容不能超过 16 个字' }, { status: 400 });
    }
    if (postType === 'comment' && rawMessage.length > 1000) {
      return jsonResponse(request, env, { ok: false, error: '评论内容不能超过 1000 字' }, { status: 400 });
    }

    // Anti-abuse & Rate limiting for Visitors (1 hour window)
    if (isVisitor) {
      const oneHourAgo = Date.now() - 3600 * 1000;

      if (env.DB) {
        await ensureTable(env.DB);
        // A. Check for identical duplicate message in last 1 hour
        const dupRow = await env.DB.prepare(`
          SELECT id FROM comments
          WHERE ip = ? AND message = ? AND created_at > datetime('now', '-1 hour') AND status != 'deleted'
          LIMIT 1
        `).bind(clientIp, rawMessage).first();

        if (dupRow) {
          return jsonResponse(request, env, {
            ok: false,
            error: '请勿在1小时内重复发表完全相同的评论内容',
          }, { status: 400 });
        }

        // B. Rate limit: Max 3 normal comments per 1 hour per IP
        if (postType === 'comment') {
          const countRow = await env.DB.prepare(`
            SELECT COUNT(*) as cnt FROM comments
            WHERE ip = ? AND post_type = 'comment' AND created_at > datetime('now', '-1 hour') AND status != 'deleted'
          `).bind(clientIp).first<{ cnt: number }>();

          if (countRow && countRow.cnt >= 3) {
            return jsonResponse(request, env, {
              ok: false,
              error: '访客发言频率受限：1小时内最多发表 3 条评论，请稍后再试或登录账号',
            }, { status: 429 });
          }
        }

        // C. Rate limit: Max 5 Boosts per 1 hour per IP
        if (postType === 'boost') {
          const boostCountRow = await env.DB.prepare(`
            SELECT COUNT(*) as cnt FROM comments
            WHERE ip = ? AND post_type = 'boost' AND created_at > datetime('now', '-1 hour') AND status != 'deleted'
          `).bind(clientIp).first<{ cnt: number }>();

          if (boostCountRow && boostCountRow.cnt >= 5) {
            return jsonResponse(request, env, {
              ok: false,
              error: '访客 Boost 频率受限：1小时内最多发表 5 次 Boost，请稍后再试',
            }, { status: 429 });
          }
        }
      } else {
        // Memory fallback rate limits
        const recentFromIp = Array.from(memoryFallbackStore.values()).filter(
          (c) => c.ip === clientIp && new Date(c.created_at).getTime() > oneHourAgo && c.status !== 'deleted'
        );
        const hasDup = recentFromIp.some((c) => c.message === rawMessage);
        if (hasDup) {
          return jsonResponse(request, env, { ok: false, error: '请勿在1小时内重复发表完全相同的评论内容' }, { status: 400 });
        }
        if (postType === 'comment' && recentFromIp.filter((c) => c.post_type === 'comment').length >= 3) {
          return jsonResponse(request, env, { ok: false, error: '访客发言频率受限：1小时内最多发表 3 条评论，请稍后再试或登录账号' }, { status: 429 });
        }
        if (postType === 'boost' && recentFromIp.filter((c) => c.post_type === 'boost').length >= 5) {
          return jsonResponse(request, env, { ok: false, error: '访客 Boost 频率受限：1小时内最多发表 5 次 Boost，请稍后再试' }, { status: 429 });
        }
      }
    }

    const commentId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const effectiveSessionToken = sessionToken || `st_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const authorName = (payload.authorName || (isVisitor ? '访客' : '用户')).trim().slice(0, 50);
    const authorAvatar = (payload.authorAvatar || '').trim().slice(0, 500);
    const authorWebsite = (payload.authorWebsite || '').trim().slice(0, 300);
    const authorEmail = (payload.authorEmail || '').trim().slice(0, 200);
    const authorId = (payload.authorId || `vis_${Date.now()}`).trim();
    const parentId = payload.parentId ? String(payload.parentId).trim() : null;
    const quoteId = payload.quoteId ? String(payload.quoteId).trim() : null;
    const quoteSource = payload.quote ? JSON.stringify(payload.quote).slice(0, 500) : '';
    // Visitors are forced to show location (1), registered users can toggle
    const showLocation = isVisitor ? 1 : (payload.showLocation === false ? 0 : 1);
    const countryInfo = resolveCountryInfo(cfCountry);
    const ipLocation = countryInfo.name;
    const userAgent = request.headers.get('user-agent') || '';
    const nowIso = new Date().toISOString();

    const newRecord: RawCommentRow = {
      id: commentId,
      post_slug: slug,
      parent_id: parentId,
      quote_id: quoteId,
      quote_source: quoteSource,
      post_type: postType,
      author_id: authorId,
      author_name: authorName,
      author_email: authorEmail,
      author_avatar: authorAvatar,
      author_website: authorWebsite,
      author_role: authorRole,
      message: rawMessage,
      session_token: effectiveSessionToken,
      ip: clientIp,
      ip_country: cfCountry,
      ip_location: ipLocation,
      show_location: showLocation,
      user_agent: userAgent,
      likes_count: 0,
      status: 'published',
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (env.DB) {
      await ensureTable(env.DB);
      try {
        await env.DB.prepare(`
          INSERT INTO comments (
            id, post_slug, parent_id, quote_id, quote_source, post_type, author_id, author_name,
            author_email, author_avatar, author_website, author_role, message, session_token,
            ip, ip_country, ip_location, show_location, user_agent, likes_count, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          commentId, slug, parentId, quoteId, quoteSource, postType, authorId, authorName,
          authorEmail, authorAvatar, authorWebsite, authorRole, rawMessage, effectiveSessionToken,
          clientIp, cfCountry, ipLocation, showLocation, userAgent
        ).run();
      } catch (insertErr: any) {
        console.error('[Comments] DB Insert error:', insertErr);
        return jsonResponse(request, env, { ok: false, error: '评论保存失败' }, { status: 500 });
      }
    } else {
      memoryFallbackStore.set(commentId, newRecord);
    }

    // Telegram notification in background
    const bgTask = sendTelegramCommentNotification(env, {
      slug,
      authorName,
      message: rawMessage,
      ip: clientIp,
      country: cfCountry,
      id: commentId,
      parentId,
      postType,
    });
    if (typeof context.waitUntil === 'function') {
      context.waitUntil(bgTask);
    }

    return jsonResponse(request, env, {
      ok: true,
      comment: mapRowToClientComment(newRecord, false),
      sessionToken: effectiveSessionToken,
    });
  }

  // 2. EDIT COMMENT (Strict session verification)
  if (action === 'edit') {
    const id = (payload.id || url.searchParams.get('id') || '').trim();
    const message = (payload.message || '').trim();

    if (!id) {
      return jsonResponse(request, env, { ok: false, error: '缺少评论 ID' }, { status: 400 });
    }
    if (!message || message.length < 1) {
      return jsonResponse(request, env, { ok: false, error: '修改后的评论内容不能为空' }, { status: 400 });
    }
    if (message.length > 1000) {
      return jsonResponse(request, env, { ok: false, error: '评论内容不能超过 1000 字' }, { status: 400 });
    }

    const isAuthorizedAdmin = Boolean(env.ADMIN_TOKEN && adminToken === env.ADMIN_TOKEN);

    if (env.DB) {
      await ensureTable(env.DB);
      const row = await env.DB.prepare(`SELECT * FROM comments WHERE id = ?`).bind(id).first<RawCommentRow>();
      if (!row || row.status === 'deleted') {
        return jsonResponse(request, env, { ok: false, error: '评论不存在或已被删除' }, { status: 404 });
      }

      const isOwner = Boolean(sessionToken && row.session_token === sessionToken);
      if (!isOwner && !isAuthorizedAdmin) {
        return jsonResponse(request, env, { ok: false, error: '无权修改此评论或访客会话已失效（无法验证身份）' }, { status: 403 });
      }

      await env.DB.prepare(`
        UPDATE comments SET message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(message, id).run();

      return jsonResponse(request, env, { ok: true, message: '评论修改成功' });
    }

    const item = memoryFallbackStore.get(id);
    if (!item || item.status === 'deleted') {
      return jsonResponse(request, env, { ok: false, error: '评论不存在' }, { status: 404 });
    }
    const isOwner = Boolean(sessionToken && item.session_token === sessionToken);
    if (!isOwner && !isAuthorizedAdmin) {
      return jsonResponse(request, env, { ok: false, error: '无权修改此评论或访客会话已失效' }, { status: 403 });
    }
    item.message = message;
    item.updated_at = new Date().toISOString();
    return jsonResponse(request, env, { ok: true, message: '评论修改成功' });
  }

  // 3. DELETE COMMENT (Strict session verification)
  if (action === 'delete') {
    const id = (payload.id || url.searchParams.get('id') || '').trim();
    if (!id) {
      return jsonResponse(request, env, { ok: false, error: '缺少评论 ID' }, { status: 400 });
    }

    const isAuthorizedAdmin = Boolean(env.ADMIN_TOKEN && adminToken === env.ADMIN_TOKEN);

    if (env.DB) {
      await ensureTable(env.DB);
      const row = await env.DB.prepare(`SELECT * FROM comments WHERE id = ?`).bind(id).first<RawCommentRow>();
      if (!row || row.status === 'deleted') {
        return jsonResponse(request, env, { ok: false, error: '评论不存在或已删除' }, { status: 404 });
      }

      const isOwner = Boolean(sessionToken && row.session_token === sessionToken);
      if (!isOwner && !isAuthorizedAdmin) {
        return jsonResponse(request, env, { ok: false, error: '无权删除此评论或访客会话已失效' }, { status: 403 });
      }

      await env.DB.prepare(`
        UPDATE comments SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(id).run();

      return jsonResponse(request, env, { ok: true, message: '评论已删除' });
    }

    const item = memoryFallbackStore.get(id);
    if (!item || item.status === 'deleted') {
      return jsonResponse(request, env, { ok: false, error: '评论不存在' }, { status: 404 });
    }
    const isOwner = Boolean(sessionToken && item.session_token === sessionToken);
    if (!isOwner && !isAuthorizedAdmin) {
      return jsonResponse(request, env, { ok: false, error: '无权删除此评论' }, { status: 403 });
    }
    item.status = 'deleted';
    return jsonResponse(request, env, { ok: true, message: '评论已删除' });
  }

  // 4. LIKE COMMENT
  if (action === 'like') {
    const id = (payload.id || url.searchParams.get('id') || '').trim();
    if (!id) {
      return jsonResponse(request, env, { ok: false, error: '缺少评论 ID' }, { status: 400 });
    }

    if (env.DB) {
      await ensureTable(env.DB);
      await env.DB.prepare(`
        UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?
      `).bind(id).run();
      const updated = await env.DB.prepare(`SELECT likes_count FROM comments WHERE id = ?`).bind(id).first<{ likes_count: number }>();
      return jsonResponse(request, env, { ok: true, likesCount: updated?.likes_count || 1 });
    }

    const item = memoryFallbackStore.get(id);
    if (item) {
      item.likes_count = (item.likes_count || 0) + 1;
      return jsonResponse(request, env, { ok: true, likesCount: item.likes_count });
    }
    return jsonResponse(request, env, { ok: true, likesCount: 1 });
  }

  return jsonResponse(request, env, { ok: false, error: 'Unsupported action' }, { status: 400 });
}
