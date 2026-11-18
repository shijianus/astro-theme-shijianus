import type { AppEnv } from '../_lib/types';
import { jsonResponse, optionsResponse, safeReadJson } from '../_lib/http.ts';
import { getUserBySessionToken } from '../_lib/auth-service.ts';
import {
  buildReactionDetails,
  ensureGestureTables,
  extractRelatedLinks,
  generateSecureId,
  mapRowToClientComment,
  memoryBoostsStore,
  memoryFallbackStore,
  memorySubscriptionsStore,
  parseReactionsColumn,
  resolveCountryInfo,
  STARTER_PINNED_BOOST_ROWS,
  STARTER_PINNED_GESTURE_ROW,
  STARTER_PINNED_REPLY_ROWS,
  syncDevStore,
  type RawBoostRow,
  type RawCommentRow,
} from '../_lib/gesture-shared.ts';

function seedStarterPinnedIfNeeded() {
  if (!memoryFallbackStore.has(STARTER_PINNED_GESTURE_ROW.id)) {
    memoryFallbackStore.set(STARTER_PINNED_GESTURE_ROW.id, { ...STARTER_PINNED_GESTURE_ROW });
  }
  const hasAnyReply = Array.from(memoryFallbackStore.values()).some(
    (r) => r.parent_id === STARTER_PINNED_GESTURE_ROW.id && r.status !== 'deleted' && r.post_type !== 'boost'
  );
  if (!hasAnyReply) {
    for (const rep of STARTER_PINNED_REPLY_ROWS) {
      if (!memoryFallbackStore.has(rep.id)) {
        memoryFallbackStore.set(rep.id, { ...rep });
      }
    }
  }
  const hasAnyOpBoost = Array.from(memoryBoostsStore.values()).some(
    (b) => b.gesture_id === STARTER_PINNED_GESTURE_ROW.id
  );
  if (!hasAnyOpBoost) {
    for (const b of STARTER_PINNED_BOOST_ROWS) {
      if (!memoryBoostsStore.has(b.id)) {
        memoryBoostsStore.set(b.id, { ...b });
      }
    }
  }
}

async function ensureStarterPinnedInD1(db: NonNullable<AppEnv['DB']>, rootId: string) {
  if (rootId !== STARTER_PINNED_GESTURE_ROW.id) return;
  const existing = await db.prepare(`SELECT id FROM comments WHERE id = ?`).bind(rootId).first<{ id: string }>();
  if (!existing) {
    await db.prepare(`
      INSERT INTO comments (
        id, post_slug, parent_id, reply_to_id, quote_id, quote_source, post_type, tag, title, tags,
        edit_count, views_count, author_id, author_name, author_email, author_avatar, author_website, author_role,
        message, session_token, ip, ip_country, ip_location, show_location, user_agent, likes_count, reactions, status, created_at, updated_at
      ) VALUES (?, ?, NULL, NULL, NULL, '', 'gesture', ?, ?, ?, ?, ?, ?, ?, '', ?, ?, 'admin', ?, '', '', 'CN', '浙江 · 杭州', 1, '', ?, ?, 'pinned', ?, ?)
    `).bind(
      STARTER_PINNED_GESTURE_ROW.id,
      STARTER_PINNED_GESTURE_ROW.post_slug,
      STARTER_PINNED_GESTURE_ROW.tag || 'chat',
      STARTER_PINNED_GESTURE_ROW.title || '',
      STARTER_PINNED_GESTURE_ROW.tags || '[]',
      STARTER_PINNED_GESTURE_ROW.edit_count || 2,
      STARTER_PINNED_GESTURE_ROW.views_count || 1280,
      STARTER_PINNED_GESTURE_ROW.author_id,
      STARTER_PINNED_GESTURE_ROW.author_name,
      STARTER_PINNED_GESTURE_ROW.author_avatar || '',
      STARTER_PINNED_GESTURE_ROW.author_website || '',
      STARTER_PINNED_GESTURE_ROW.message,
      STARTER_PINNED_GESTURE_ROW.likes_count,
      STARTER_PINNED_GESTURE_ROW.reactions || '{}',
      STARTER_PINNED_GESTURE_ROW.created_at,
      STARTER_PINNED_GESTURE_ROW.updated_at
    ).run();

    for (const rep of STARTER_PINNED_REPLY_ROWS) {
      await db.prepare(`
        INSERT OR IGNORE INTO comments (
          id, post_slug, parent_id, reply_to_id, quote_id, quote_source, post_type, tag, title, tags,
          edit_count, views_count, author_id, author_name, author_email, author_avatar, author_website, author_role,
          message, session_token, ip, ip_country, ip_location, show_location, user_agent, likes_count, reactions, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'gesture', ?, NULL, '[]', ?, 0, ?, ?, '', '', '', 'reader', ?, '', '', ?, ?, 1, '', ?, ?, 'published', ?, ?)
      `).bind(
        rep.id,
        rep.post_slug,
        rep.parent_id,
        rep.reply_to_id || null,
        rep.quote_id || null,
        rep.quote_source || '',
        rep.tag || 'tech',
        rep.edit_count || 0,
        rep.author_id,
        rep.author_name,
        rep.message,
        rep.ip_country || 'CN',
        rep.ip_location || '',
        rep.likes_count,
        rep.reactions || '{}',
        rep.created_at,
        rep.updated_at
      ).run();
    }

    for (const b of STARTER_PINNED_BOOST_ROWS) {
      await db.prepare(`
        INSERT OR IGNORE INTO boosts (id, gesture_id, user_id, author_name, author_avatar, content, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(b.id, b.gesture_id, b.user_id, b.author_name, b.author_avatar, b.content, b.created_at).run();
    }
  }
}

async function batchFetchBoostsByGestureIds(
  db: AppEnv['DB'] | undefined,
  gestureIds: string[]
): Promise<Record<string, RawBoostRow[]>> {
  const grouped: Record<string, RawBoostRow[]> = {};
  if (!gestureIds.length) return grouped;

  if (db) {
    const uniqueIds = Array.from(new Set(gestureIds));
    // SQLite bind limit safety: chunk by 80
    for (let i = 0; i < uniqueIds.length; i += 80) {
      const chunk = uniqueIds.slice(i, i + 80);
      const placeholders = chunk.map(() => '?').join(', ');
      const res = await db
        .prepare(`SELECT id, gesture_id, user_id, author_name, author_avatar, content, created_at FROM boosts WHERE gesture_id IN (${placeholders}) ORDER BY created_at ASC`)
        .bind(...chunk)
        .all<RawBoostRow>();

      for (const row of res.results || []) {
        if (!row.gesture_id) continue;
        if (!grouped[row.gesture_id]) grouped[row.gesture_id] = [];
        grouped[row.gesture_id].push(row);
      }
    }
    return grouped;
  }

  const idSet = new Set(gestureIds);
  const rows = Array.from(memoryBoostsStore.values())
    .filter((b) => b.gesture_id && idSet.has(b.gesture_id))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  for (const row of rows) {
    if (!row.gesture_id) continue;
    if (!grouped[row.gesture_id]) grouped[row.gesture_id] = [];
    grouped[row.gesture_id].push(row);
  }
  return grouped;
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
  const headerAdminToken = request.headers.get('X-Admin-Token')?.trim();
  const authHeader = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')?.trim();
  const sessionTokenHeader = request.headers.get('X-Comment-Session-Token')?.trim();
  const querySessionToken = url.searchParams.get('session_token')?.trim();

  const secureHeaderToken = headerAdminToken || authHeader;
  let isAdmin = Boolean(env.ADMIN_TOKEN && secureHeaderToken && secureHeaderToken === env.ADMIN_TOKEN);

  const candidateToken = secureHeaderToken || sessionTokenHeader || querySessionToken;
  let authUser: any = null;
  let currentUserId = '';
  if (candidateToken) {
    try {
      authUser = await getUserBySessionToken(candidateToken, env);
      if (authUser) {
        currentUserId = authUser.id;
        if (authUser.role === 'admin' && Boolean(secureHeaderToken || sessionTokenHeader)) {
          isAdmin = true;
        }
      } else {
        currentUserId = candidateToken;
      }
    } catch {
      currentUserId = candidateToken;
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/gestures?id=<rootId>
  // ---------------------------------------------------------------------------
  if (method === 'GET') {
    const rootId = (url.searchParams.get('id') || '').trim();
    const trackView = url.searchParams.get('trackView') !== '0';

    if (!rootId) {
      return jsonResponse(request, env, { ok: false, error: 'Gesture id is required' }, { status: 400 });
    }

    let opRow: RawCommentRow | null = null;
    let replyRows: RawCommentRow[] = [];
    let siblingTopRows: RawCommentRow[] = [];
    let isSubscribed = false;

    if (env.DB) {
      await ensureGestureTables(env.DB);
      await ensureStarterPinnedInD1(env.DB, rootId);

      if (trackView) {
        try {
          await env.DB.prepare(`UPDATE comments SET views_count = COALESCE(views_count, 0) + 1 WHERE id = ?`).bind(rootId).run();
        } catch {}
      }

      opRow = await env.DB.prepare(`SELECT * FROM comments WHERE id = ? AND status != 'deleted'`).bind(rootId).first<RawCommentRow>();
      if (!opRow) {
        return jsonResponse(request, env, { ok: false, error: 'Gesture not found' }, { status: 404 });
      }

      const subRes = await env.DB.prepare(`
        SELECT * FROM comments
        WHERE parent_id = ? AND post_type != 'boost' AND status != 'deleted'
        ORDER BY created_at ASC
      `).bind(rootId).all<RawCommentRow>();
      replyRows = subRes.results || [];

      const sibRes = await env.DB.prepare(`
        SELECT * FROM comments
        WHERE post_slug = ? AND parent_id IS NULL AND post_type = 'gesture' AND status != 'deleted'
        ORDER BY created_at DESC LIMIT 20
      `).bind(opRow.post_slug).all<RawCommentRow>();
      siblingTopRows = sibRes.results || [];

      if (currentUserId) {
        const subRow = await env.DB.prepare(
          `SELECT subscribed FROM gesture_subscriptions WHERE gesture_id = ? AND user_id = ?`
        ).bind(rootId, currentUserId).first<{ subscribed: number }>();
        isSubscribed = Boolean(subRow?.subscribed);
      }
    } else {
      seedStarterPinnedIfNeeded();
      opRow = memoryFallbackStore.get(rootId) || null;
      if (!opRow || opRow.status === 'deleted') {
        return jsonResponse(request, env, { ok: false, error: 'Gesture not found' }, { status: 404 });
      }
      if (trackView) {
        opRow.views_count = (opRow.views_count || 0) + 1;
      }
      replyRows = Array.from(memoryFallbackStore.values())
        .filter((r) => r.parent_id === rootId && r.post_type !== 'boost' && r.status !== 'deleted')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      siblingTopRows = Array.from(memoryFallbackStore.values())
        .filter((r) => r.post_slug === opRow!.post_slug && !r.parent_id && r.post_type === 'gesture' && r.status !== 'deleted')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);

      if (currentUserId) {
        isSubscribed = Boolean(memorySubscriptionsStore.get(`${rootId}:${currentUserId}`));
      }
    }

    // Assign implicit sequential floorIndex (1 = OP, 2..N = SubGestures chronologically)
    const opMapped = mapRowToClientComment(opRow, isAdmin, currentUserId, 1);
    const subMapped = replyRows.map((row, idx) => mapRowToClientComment(row, isAdmin, currentUserId, idx + 2));

    // Batch fetch scoped boosts (NO N+1 queries)
    const allIds = [opRow.id, ...replyRows.map((r) => r.id)];
    const boostsGrouped = await batchFetchBoostsByGestureIds(env.DB, allIds);
    const boostsByGestureId: Record<string, Array<{
      id: string;
      gestureId: string;
      userId: string;
      authorName: string;
      authorAvatar: string;
      content: string;
      createdAt: string;
    }>> = {};

    for (const id of allIds) {
      boostsByGestureId[id] = (boostsGrouped[id] || []).map((b) => ({
        id: b.id,
        gestureId: b.gesture_id || id,
        userId: b.user_id,
        authorName: b.author_name,
        authorAvatar: b.author_avatar || '',
        content: b.content,
        createdAt: b.created_at,
      }));
    }

    // Build sibling reply count map for ZONE 5 related links
    const replyCountMap = new Map<string, number>();
    if (!env.DB) {
      for (const r of memoryFallbackStore.values()) {
        if (r.parent_id && r.status !== 'deleted' && r.post_type !== 'boost') {
          replyCountMap.set(r.parent_id, (replyCountMap.get(r.parent_id) || 0) + 1);
        }
      }
    } else if (siblingTopRows.length > 0) {
      const sibIds = siblingTopRows.map((s) => s.id);
      for (let i = 0; i < sibIds.length; i += 80) {
        const chunk = sibIds.slice(i, i + 80);
        const ph = chunk.map(() => '?').join(', ');
        const cntRes = await env.DB.prepare(
          `SELECT parent_id, COUNT(*) as cnt FROM comments WHERE parent_id IN (${ph}) AND status != 'deleted' AND post_type != 'boost' GROUP BY parent_id`
        ).bind(...chunk).all<{ parent_id: string; cnt: number }>();
        for (const row of cntRes.results || []) {
          replyCountMap.set(row.parent_id, Number(row.cnt || 0));
        }
      }
    }

    const relatedLinks = extractRelatedLinks(opRow, siblingTopRows, replyCountMap);

    // Compute Topic Map metrics
    const allFloors = [opMapped, ...subMapped];
    let totalReactions = 0;
    let totalChars = 0;
    const participantMap = new Map<string, {
      authorId: string;
      authorName: string;
      authorAvatar: string;
      authorRole: string;
      count: number;
    }>();

    for (const f of allFloors) {
      totalReactions += f.likesCount || 0;
      totalChars += (f.message || '').length;
      const pKey = f.authorId || f.authorName;
      const existing = participantMap.get(pKey);
      if (existing) {
        existing.count += 1;
      } else {
        participantMap.set(pKey, {
          authorId: f.authorId,
          authorName: f.authorName,
          authorAvatar: f.authorAvatar || '',
          authorRole: f.authorRole,
          count: 1,
        });
      }
    }

    for (const list of Object.values(boostsByGestureId)) {
      for (const b of list) {
        const pKey = b.userId || b.authorName;
        if (!participantMap.has(pKey)) {
          participantMap.set(pKey, {
            authorId: b.userId,
            authorName: b.authorName,
            authorAvatar: b.authorAvatar || '',
            authorRole: 'reader',
            count: 1,
          });
        }
      }
    }

    const participants = Array.from(participantMap.values()).sort((a, b) => b.count - a.count);
    const latestReplyAt = subMapped.length > 0 ? subMapped[subMapped.length - 1].createdAt : opMapped.createdAt;

    return jsonResponse(request, env, {
      ok: true,
      gesture: opMapped,
      subGestures: subMapped,
      boostsByGestureId,
      relatedLinks,
      topicMap: {
        viewsCount: Number(opRow.views_count || 0),
        likesCount: totalReactions,
        linksCount: relatedLinks.length,
        usersCount: participantMap.size,
        participants: participants.slice(0, 8),
        estimatedReadMinutes: Math.max(1, Math.ceil(totalChars / 400)),
        latestReplyAt,
      },
      subscribed: isSubscribed,
    });
  }

  // ---------------------------------------------------------------------------
  // POST /api/gestures (reply, boost, react, edit, delete, subscribe, report)
  // ---------------------------------------------------------------------------
  const payload = (await safeReadJson<any>(request)) || {};
  const action = (payload.action || url.searchParams.get('action') || '').toLowerCase();
  const headerSessionToken = request.headers.get('X-Comment-Session-Token')?.trim();
  const sessionToken = (payload.sessionToken || headerSessionToken || candidateToken || '').trim();

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';
  const cfCountry = (
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code') ||
    payload.clientCountry ||
    'GLOBAL'
  ).toUpperCase();

  let postAuthUser: any = authUser;
  let authorRole: 'admin' | 'reader' | 'visitor' = 'visitor';
  if (isAdmin) {
    authorRole = 'admin';
  } else if (sessionToken && !postAuthUser) {
    postAuthUser = await getUserBySessionToken(sessionToken, env).catch(() => null);
  }
  if (postAuthUser) {
    authorRole = postAuthUser.role === 'admin' ? 'admin' : 'reader';
  }

  const resolveActor = () => {
    const rawName = (payload.authorName || (authorRole === 'visitor' ? '访客' : '读者')).trim().slice(0, 50);
    let authorName = rawName;
    let authorAvatar = (payload.authorAvatar || '').trim().slice(0, 500);
    let authorId = payload.authorId ? String(payload.authorId).trim().slice(0, 64) : generateSecureId('vis', 6);
    let authorWebsite = (payload.authorWebsite || '').trim().slice(0, 300);

    if (authorRole === 'admin') {
      authorId = 'admin';
      authorName = 'shijianus';
      if (!authorAvatar) authorAvatar = '/media/shijianus/avatar.jpg';
    } else if (postAuthUser) {
      authorId = postAuthUser.id;
      authorName = postAuthUser.name || authorName;
      if (!authorAvatar && postAuthUser.avatar) authorAvatar = postAuthUser.avatar;
      if (!authorWebsite && postAuthUser.website) authorWebsite = postAuthUser.website;
    } else {
      const lower = authorName.toLowerCase().replace(/[\s_\-\.]+/g, '');
      const RESERVED = new Set(['shijianus', 'admin', 'administrator', '站长', '博主', 'shijian', 'root']);
      if (RESERVED.has(lower) || lower.includes('shijianus') || lower.includes('站长')) {
        authorName = '访客';
      }
      if (authorAvatar.includes('shijianus/avatar.jpg')) {
        authorAvatar = '';
      }
    }

    return { authorId, authorName, authorAvatar, authorWebsite };
  };

  // 1. CREATE SUBGESTURE REPLY
  if (action === 'reply') {
    const rootId = String(payload.rootId || payload.parentId || '').trim();
    const replyToId = payload.replyToId ? String(payload.replyToId).trim() : rootId;
    const rawMessage = String(payload.message || '').trim();
    const quoteId = payload.quoteId ? String(payload.quoteId).trim() : null;
    const quoteSource = payload.quote ? JSON.stringify(payload.quote).slice(0, 2000) : '';

    if (!rootId) {
      return jsonResponse(request, env, { ok: false, error: '缺少主贴文 ID (rootId)' }, { status: 400 });
    }
    if (!rawMessage || rawMessage.length < 1) {
      return jsonResponse(request, env, { ok: false, error: '回复内容不能为空' }, { status: 400 });
    }
    if (rawMessage.length > 5000) {
      return jsonResponse(request, env, { ok: false, error: '回复内容不能超过 5000 字' }, { status: 400 });
    }

    const actor = resolveActor();
    const replyId = generateSecureId('sg', 8);
    const effectiveSessionToken = sessionToken || generateSecureId('st', 16);
    const countryInfo = resolveCountryInfo(cfCountry);
    const nowIso = new Date().toISOString();

    const newRow: RawCommentRow = {
      id: replyId,
      post_slug: 'guestbook',
      parent_id: rootId,
      reply_to_id: replyToId,
      quote_id: quoteId,
      quote_source: quoteSource,
      post_type: 'gesture',
      tag: String(payload.tag || 'general').slice(0, 32),
      title: null,
      tags: '[]',
      edit_count: 0,
      views_count: 0,
      author_id: actor.authorId,
      author_name: actor.authorName,
      author_email: postAuthUser?.email || '',
      author_avatar: actor.authorAvatar,
      author_website: actor.authorWebsite,
      author_role: authorRole,
      message: rawMessage,
      session_token: effectiveSessionToken,
      ip: clientIp,
      ip_country: cfCountry,
      ip_location: countryInfo.name,
      show_location: 1,
      user_agent: request.headers.get('user-agent') || '',
      likes_count: 0,
      reactions: '{}',
      status: 'published',
      created_at: nowIso,
      updated_at: nowIso,
    };

    let floorIndex = 2;
    if (env.DB) {
      await ensureGestureTables(env.DB);
      await ensureStarterPinnedInD1(env.DB, rootId);
      await env.DB.prepare(`
        INSERT INTO comments (
          id, post_slug, parent_id, reply_to_id, quote_id, quote_source, post_type, tag, title, tags,
          edit_count, views_count, author_id, author_name, author_email, author_avatar, author_website, author_role,
          message, session_token, ip, ip_country, ip_location, show_location, user_agent, likes_count, reactions, status, created_at, updated_at
        ) VALUES (?, 'guestbook', ?, ?, ?, ?, 'gesture', ?, NULL, '[]', 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, '{}', 'published', ?, ?)
      `).bind(
        newRow.id,
        newRow.parent_id,
        newRow.reply_to_id,
        newRow.quote_id,
        newRow.quote_source,
        newRow.tag,
        newRow.author_id,
        newRow.author_name,
        newRow.author_email,
        newRow.author_avatar,
        newRow.author_website,
        newRow.author_role,
        newRow.message,
        newRow.session_token,
        newRow.ip,
        newRow.ip_country,
        newRow.ip_location,
        newRow.user_agent,
        nowIso,
        nowIso
      ).run();

      const countRes = await env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM comments WHERE parent_id = ? AND post_type != 'boost' AND status != 'deleted'`
      ).bind(rootId).first<{ cnt: number }>();
      floorIndex = 1 + Number(countRes?.cnt || 1);
    } else {
      seedStarterPinnedIfNeeded();
      memoryFallbackStore.set(replyId, newRow);
      syncDevStore('save');
      const siblings = Array.from(memoryFallbackStore.values()).filter(
        (r) => r.parent_id === rootId && r.post_type !== 'boost' && r.status !== 'deleted'
      );
      floorIndex = 1 + siblings.length;
    }

    return jsonResponse(request, env, {
      ok: true,
      subGesture: mapRowToClientComment(newRow, false, actor.authorId, floorIndex),
      sessionToken: effectiveSessionToken,
    });
  }

  // 2. CREATE SCOPED BOOST (gesture_id strictly required and isolated from home plaza)
  if (action === 'boost') {
    const gestureId = String(payload.gestureId || '').trim();
    const content = String(payload.content || '').trim();

    if (!gestureId) {
      return jsonResponse(request, env, { ok: false, error: 'Boost 必须绑定到具体的 Gesture 或 SubGesture' }, { status: 400 });
    }
    if (!content) {
      return jsonResponse(request, env, { ok: false, error: 'Boost 短语不能为空' }, { status: 400 });
    }
    if (content.length > 60) {
      return jsonResponse(request, env, { ok: false, error: 'Boost 短语限制 60 字以内' }, { status: 400 });
    }

    const actor = resolveActor();
    const boostId = generateSecureId('bst', 8);
    const nowIso = new Date().toISOString();
    const boostRow: RawBoostRow = {
      id: boostId,
      gesture_id: gestureId,
      user_id: actor.authorId,
      author_name: actor.authorName,
      author_avatar: actor.authorAvatar,
      content,
      created_at: nowIso,
    };

    if (env.DB) {
      await ensureGestureTables(env.DB);
      await env.DB.prepare(`
        INSERT INTO boosts (id, gesture_id, user_id, author_name, author_avatar, content, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(boostRow.id, boostRow.gesture_id, boostRow.user_id, boostRow.author_name, boostRow.author_avatar, boostRow.content, boostRow.created_at).run();
    } else {
      seedStarterPinnedIfNeeded();
      memoryBoostsStore.set(boostId, boostRow);
      syncDevStore('save');
    }

    return jsonResponse(request, env, {
      ok: true,
      boost: {
        id: boostRow.id,
        gestureId: boostRow.gesture_id,
        userId: boostRow.user_id,
        authorName: boostRow.author_name,
        authorAvatar: boostRow.author_avatar,
        content: boostRow.content,
        createdAt: boostRow.created_at,
      },
    });
  }

  // 3. REACT (EMOJI AGGREGATION & USER BREAKDOWN)
  if (action === 'react') {
    const targetId = String(payload.id || '').trim();
    const targetEmoji = String(payload.emoji || '👍').trim().slice(0, 12);
    if (!targetId) {
      return jsonResponse(request, env, { ok: false, error: '缺少目标楼层 ID' }, { status: 400 });
    }

    const actor = resolveActor();
    const effectiveUserId = postAuthUser?.id || (isAdmin ? 'admin' : (sessionToken || `vis_${clientIp}`));
    const displayName = postAuthUser?.name || (isAdmin ? 'shijianus' : (payload.authorName || '访客'));
    const displayAvatar = postAuthUser?.avatar || (isAdmin ? '/media/shijianus/avatar.jpg' : (payload.authorAvatar || ''));

    const applyReactionMutation = (rawRow: RawCommentRow) => {
      const rx = parseReactionsColumn(rawRow.reactions, rawRow.likes_count || 0);
      const existing = rx.users[effectiveUserId];
      let newUserEmoji: string | null = null;

      if (existing === targetEmoji) {
        delete rx.users[effectiveUserId];
        rx.summary[targetEmoji] = Math.max(0, Number(rx.summary[targetEmoji] || 1) - 1);
        if (rx.summary[targetEmoji] === 0) delete rx.summary[targetEmoji];
      } else {
        if (existing && rx.summary[existing]) {
          rx.summary[existing] = Math.max(0, Number(rx.summary[existing]) - 1);
          if (rx.summary[existing] === 0) delete rx.summary[existing];
        }
        rx.users[effectiveUserId] = targetEmoji;
        rx.summary[targetEmoji] = Number(rx.summary[targetEmoji] || 0) + 1;
        rx.userProfiles[effectiveUserId] = { name: displayName, avatar: displayAvatar || undefined };
        newUserEmoji = targetEmoji;
      }

      const totalLikes = Object.values(rx.summary).reduce((a, b) => a + Number(b || 0), 0);
      return { rx, totalLikes, newUserEmoji };
    };

    if (env.DB) {
      await ensureGestureTables(env.DB);
      await ensureStarterPinnedInD1(env.DB, targetId);
      const row = await env.DB.prepare(`SELECT * FROM comments WHERE id = ?`).bind(targetId).first<RawCommentRow>();
      if (!row) {
        return jsonResponse(request, env, { ok: false, error: '楼层不存在' }, { status: 404 });
      }
      const { rx, totalLikes, newUserEmoji } = applyReactionMutation(row);
      const rxJson = JSON.stringify(rx);
      await env.DB.prepare(`UPDATE comments SET likes_count = ?, reactions = ? WHERE id = ?`)
        .bind(totalLikes, rxJson, targetId)
        .run();

      return jsonResponse(request, env, {
        ok: true,
        likesCount: totalLikes,
        userReaction: newUserEmoji,
        reactions: {
          summary: rx.summary,
          users: newUserEmoji ? { [effectiveUserId]: newUserEmoji } : {},
          details: buildReactionDetails(rx),
        },
      });
    }

    seedStarterPinnedIfNeeded();
    const row = memoryFallbackStore.get(targetId);
    if (!row) {
      return jsonResponse(request, env, { ok: false, error: '楼层不存在' }, { status: 404 });
    }
    const { rx, totalLikes, newUserEmoji } = applyReactionMutation(row);
    row.likes_count = totalLikes;
    row.reactions = JSON.stringify(rx);
    syncDevStore('save');

    return jsonResponse(request, env, {
      ok: true,
      likesCount: totalLikes,
      userReaction: newUserEmoji,
      reactions: {
        summary: rx.summary,
        users: newUserEmoji ? { [effectiveUserId]: newUserEmoji } : {},
        details: buildReactionDetails(rx),
      },
    });
  }

  // 4. EDIT GESTURE / SUBGESTURE (Increments edit_count, preserves created_at)
  if (action === 'edit') {
    const id = String(payload.id || '').trim();
    const message = String(payload.message || '').trim();
    const title = payload.title !== undefined ? String(payload.title || '').trim() : undefined;

    if (!id || !message) {
      return jsonResponse(request, env, { ok: false, error: '缺少 ID 或内容不能为空' }, { status: 400 });
    }

    if (env.DB) {
      await ensureGestureTables(env.DB);
      const row = await env.DB.prepare(`SELECT * FROM comments WHERE id = ?`).bind(id).first<RawCommentRow>();
      if (!row || row.status === 'deleted') {
        return jsonResponse(request, env, { ok: false, error: '贴文不存在' }, { status: 404 });
      }
      const isOwner = Boolean(
        (sessionToken && row.session_token && row.session_token === sessionToken) ||
        (postAuthUser && row.author_id && postAuthUser.id === row.author_id)
      );
      if (!isOwner && !isAdmin) {
        return jsonResponse(request, env, { ok: false, error: '无权编辑此内容' }, { status: 403 });
      }
      const nextEditCount = Number(row.edit_count || 0) + 1;
      const nextTitle = title !== undefined ? title : row.title;
      await env.DB.prepare(
        `UPDATE comments SET message = ?, title = ?, edit_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(message, nextTitle, nextEditCount, id).run();

      return jsonResponse(request, env, { ok: true, editCount: nextEditCount, message, title: nextTitle });
    }

    seedStarterPinnedIfNeeded();
    const row = memoryFallbackStore.get(id);
    if (!row || row.status === 'deleted') {
      return jsonResponse(request, env, { ok: false, error: '贴文不存在' }, { status: 404 });
    }
    const isOwner = Boolean(
      (sessionToken && row.session_token && row.session_token === sessionToken) ||
      (postAuthUser && row.author_id && postAuthUser.id === row.author_id)
    );
    if (!isOwner && !isAdmin) {
      return jsonResponse(request, env, { ok: false, error: '无权编辑此内容' }, { status: 403 });
    }
    row.message = message;
    if (title !== undefined) row.title = title;
    row.edit_count = Number(row.edit_count || 0) + 1;
    row.updated_at = new Date().toISOString();
    syncDevStore('save');
    return jsonResponse(request, env, { ok: true, editCount: row.edit_count, message, title: row.title });
  }

  // 5. DELETE GESTURE / SUBGESTURE
  if (action === 'delete') {
    const id = String(payload.id || '').trim();
    if (!id) {
      return jsonResponse(request, env, { ok: false, error: '缺少 ID' }, { status: 400 });
    }
    if (env.DB) {
      await ensureGestureTables(env.DB);
      const row = await env.DB.prepare(`SELECT * FROM comments WHERE id = ?`).bind(id).first<RawCommentRow>();
      if (!row || row.status === 'deleted') {
        return jsonResponse(request, env, { ok: false, error: '贴文不存在' }, { status: 404 });
      }
      const isOwner = Boolean(
        (sessionToken && row.session_token && row.session_token === sessionToken) ||
        (postAuthUser && row.author_id && postAuthUser.id === row.author_id)
      );
      if (!isOwner && !isAdmin) {
        return jsonResponse(request, env, { ok: false, error: '无权删除此内容' }, { status: 403 });
      }
      await env.DB.prepare(`UPDATE comments SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
      return jsonResponse(request, env, { ok: true });
    }

    seedStarterPinnedIfNeeded();
    const row = memoryFallbackStore.get(id);
    if (!row || row.status === 'deleted') {
      return jsonResponse(request, env, { ok: false, error: '贴文不存在' }, { status: 404 });
    }
    const isOwner = Boolean(
      (sessionToken && row.session_token && row.session_token === sessionToken) ||
      (postAuthUser && row.author_id && postAuthUser.id === row.author_id)
    );
    if (!isOwner && !isAdmin) {
      return jsonResponse(request, env, { ok: false, error: '无权删除此内容' }, { status: 403 });
    }
    row.status = 'deleted';
    syncDevStore('save');
    return jsonResponse(request, env, { ok: true });
  }

  // 6. SUBSCRIBE TOGGLE
  if (action === 'subscribe') {
    const gestureId = String(payload.gestureId || '').trim();
    if (!gestureId) {
      return jsonResponse(request, env, { ok: false, error: '缺少 Gesture ID' }, { status: 400 });
    }
    const userId = postAuthUser?.id || sessionToken || `vis_${clientIp}`;
    if (env.DB) {
      await ensureGestureTables(env.DB);
      const existing = await env.DB.prepare(
        `SELECT subscribed FROM gesture_subscriptions WHERE gesture_id = ? AND user_id = ?`
      ).bind(gestureId, userId).first<{ subscribed: number }>();
      const next = existing?.subscribed ? 0 : 1;
      await env.DB.prepare(`
        INSERT INTO gesture_subscriptions (gesture_id, user_id, subscribed, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(gesture_id, user_id) DO UPDATE SET subscribed = excluded.subscribed
      `).bind(gestureId, userId, next).run();
      return jsonResponse(request, env, { ok: true, subscribed: Boolean(next) });
    }
    const key = `${gestureId}:${userId}`;
    const next = !memorySubscriptionsStore.get(key);
    memorySubscriptionsStore.set(key, next);
    return jsonResponse(request, env, { ok: true, subscribed: next });
  }

  // 7. REPORT GESTURE
  if (action === 'report') {
    return jsonResponse(request, env, { ok: true, message: '已收到反馈，站长会尽快核查' });
  }

  return jsonResponse(request, env, { ok: false, error: 'Unsupported action' }, { status: 400 });
}
