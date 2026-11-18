import { sha256Hex } from '../_lib/hash.ts';
import { batchFetchBoostsByGestureIds, welcomeReplyCount, welcomeId, welcomeContent, welcomeReplies, isStarterBoost } from '../_lib/gesture-history.ts';
import { collectGestureLinks, resolveGestureLinks } from '../_lib/gesture-links.ts';
import { gestureTimestamp, validBoost } from '../../src/lib/gesture-text.ts';
import type { AppEnv } from '../_lib/types';
import { jsonResponse, optionsResponse, safeReadJson } from '../_lib/http.ts';
import { getUserBySessionToken } from '../_lib/auth-service.ts';
import {
  buildReactionDetails,
  ensureGestureTables,
  generateSecureId,
  mapRowToClientComment,
  memoryBoostsStore,
  memoryFallbackStore,
  memorySubscriptionsStore,
  parseReactionsColumn,
  resolveCountryInfo,
  syncDevStore,
  type RawBoostRow,
  type RawCommentRow,
} from '../_lib/gesture-shared.ts';

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
    let isSubscribed = false;

    if (env.DB) {
      await ensureGestureTables(env.DB);


      if (trackView) {
        try {
          await env.DB.prepare(`UPDATE comments SET views_count = COALESCE(views_count, 0) + 1 WHERE id = ? AND parent_id IS NULL AND post_slug = 'guestbook' AND status IN ('published','pinned')`).bind(rootId).run();
        } catch {}
      }

      opRow = await env.DB.prepare(`SELECT * FROM comments WHERE id = ? AND parent_id IS NULL AND post_slug = 'guestbook' AND status IN ('published','pinned')`).bind(rootId).first<RawCommentRow>();
      if (!opRow) {
        return jsonResponse(request, env, { ok: false, error: 'Gesture not found' }, { status: 404 });
      }

      const subRes = await env.DB.prepare(`
        SELECT * FROM comments
        WHERE parent_id = ? AND post_type != 'boost' AND status IN ('published','pinned')
        ORDER BY julianday(created_at), id
      `).bind(rootId).all<RawCommentRow>();
      replyRows = subRes.results || [];

      if (currentUserId) {
        const subRow = await env.DB.prepare(
          `SELECT subscribed FROM gesture_subscriptions WHERE gesture_id = ? AND user_id = ?`
        ).bind(rootId, currentUserId).first<{ subscribed: number }>();
        isSubscribed = Boolean(subRow?.subscribed);
      }
    } else {

      opRow = memoryFallbackStore.get(rootId) || null;
      if (!opRow || opRow.parent_id || opRow.post_slug !== 'guestbook' || !['pinned','published'].includes(opRow.status)) {
        return jsonResponse(request, env, { ok: false, error: 'Gesture not found' }, { status: 404 });
      }
      if (trackView) {
        opRow.views_count = (opRow.views_count || 0) + 1;
      }
      replyRows = Array.from(memoryFallbackStore.values())
        .filter((r) => r.parent_id === rootId && r.post_type !== 'boost' && ['published','pinned'].includes(r.status))
        .sort((a, b) => Date.parse(gestureTimestamp(a.created_at)) - Date.parse(gestureTimestamp(b.created_at)) || a.id.localeCompare(b.id));

      if (currentUserId) {
        isSubscribed = Boolean(memorySubscriptionsStore.get(`${rootId}:${currentUserId}`));
      }
    }

    const boostsGrouped = await batchFetchBoostsByGestureIds(env.DB, [opRow.id, ...replyRows.map(r => r.id)]);
    const oldFloors = replyRows;
    if (opRow.id === welcomeId) {
      opRow = welcomeContent(opRow);
      replyRows = welcomeReplies(replyRows, boostsGrouped);
    }
    const canManage = (row: RawCommentRow) => isAdmin || Boolean(authUser?.id && authUser.id === row.author_id) ||
      Boolean(candidateToken && row.session_token && candidateToken === row.session_token);
    const mapFloor = (row: RawCommentRow, floor: number) => ({ ...mapRowToClientComment(row, isAdmin, currentUserId, floor), canManage: canManage(row) });
    const opMapped = mapFloor(opRow, 1);
    const subMapped = replyRows.map((row,i) => mapFloor(row,i+2));
    const allIds = [opRow.id, ...replyRows.map(r => r.id)];
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
      boostsByGestureId[id] = (boostsGrouped[id] || []).filter(b => opRow!.id !== welcomeId || !isStarterBoost(b)).map((b) => ({
        id: b.id,
        gestureId: b.gesture_id || id,
        userId: b.user_id,
        authorName: b.author_name,
        authorAvatar: b.author_avatar || '',
        content: b.content,
        createdAt: b.created_at,
      }));
    }

    const citations = collectGestureLinks([opRow, ...replyRows], url.origin);
    const ids = [...new Set(citations.flatMap(link => link.id ? [link.id] : []))];
    const targets: Array<Pick<RawCommentRow, 'id' | 'title' | 'message'> & { reply_count: number }> = [];
    for (let i = 0; i < ids.length; i += 80) {
      const chunk = ids.slice(i, i + 80);
      if (env.DB) {
        const marks = chunk.map(() => '?').join(',');
        const result = await env.DB.prepare(`SELECT t.id, t.title, t.message,
          (SELECT count(*) FROM comments r WHERE r.parent_id=t.id AND r.post_type!='boost' AND r.status IN ('published','pinned')) AS reply_count
          FROM comments t WHERE t.id IN (${marks}) AND t.post_slug='guestbook' AND t.parent_id IS NULL AND t.status IN ('published','pinned')`)
          .bind(...chunk).all<typeof targets[number]>();
        targets.push(...(result.results || []));
      } else {
        const rows = [...memoryFallbackStore.values()];
        for (const id of chunk) {
          const root = memoryFallbackStore.get(id);
          if (root?.post_slug === 'guestbook' && !root.parent_id && ['pinned','published'].includes(root.status)) {
            targets.push({ ...root, reply_count: rows.filter(r => r.parent_id === id && r.post_type !== 'boost' && ['published','pinned'].includes(r.status)).length });
          }
        }
      }
    }
    const floorIds = new Map<string, string[]>();
    const oldIds = new Map<string, string[]>();
    const floorTargets = new Set(citations.filter(c => (c.floor || 1) > 1 || c.postId).map(c => c.id));
    for (const t of targets) {
      if (!floorTargets.has(t.id)) {
        if (t.id === welcomeId) t.reply_count = opRow.id === welcomeId ? replyRows.length : await welcomeReplyCount(env.DB);
        continue;
      }
      const original = t.id === rootId ? oldFloors : env.DB
        ? (await env.DB.prepare("SELECT * FROM comments WHERE parent_id=? AND post_type!='boost' AND status IN ('published','pinned') ORDER BY julianday(created_at), id").bind(t.id).all<RawCommentRow>()).results || []
        : [...memoryFallbackStore.values()].filter(r => r.parent_id === t.id && r.post_type !== 'boost' && ['published','pinned'].includes(r.status))
          .sort((a,b) => Date.parse(gestureTimestamp(a.created_at))-Date.parse(gestureTimestamp(b.created_at)) || a.id.localeCompare(b.id));
      const visible = t.id === rootId ? replyRows : t.id === welcomeId
        ? welcomeReplies(original, await batchFetchBoostsByGestureIds(env.DB, original.map(r => r.id))) : original;
      floorIds.set(t.id, [t.id, ...visible.map(r => r.id)]);
      t.reply_count = visible.length;
      if (visible.length !== original.length) oldIds.set(t.id, [t.id, ...original.map(r => r.id)]);
    }
    const relatedLinks = resolveGestureLinks(citations, targets, floorIds, oldIds);

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
        const existing = participantMap.get(pKey);
        if (existing) existing.count += 1;
        else {
          participantMap.set(pKey, {
            authorId: b.userId,
            authorName: b.authorName,
            authorAvatar: b.authorAvatar || '',
            authorRole: '',
            count: 1,
          });
        }
      }
    }

    const opKey = opMapped.authorId || opMapped.authorName;
    const participants = Array.from(participantMap.values()).sort((a, b) => {
      const aKey = a.authorId || a.authorName;
      const bKey = b.authorId || b.authorName;
      if (aKey === opKey && bKey !== opKey) return -1;
      if (bKey === opKey && aKey !== opKey) return 1;
      return b.count - a.count;
    });
    let latestReplyAt = gestureTimestamp(opMapped.createdAt);
    for (const timestamp of [...allFloors.map(f => f.updatedAt || f.createdAt), ...Object.values(boostsByGestureId).flat().map(b => b.createdAt)]) {
      const candidate = gestureTimestamp(timestamp);
      if (Date.parse(candidate) > Date.parse(latestReplyAt)) latestReplyAt = candidate;
    }

    return jsonResponse(request, env, {
      ok: true,
      gesture: opMapped,
      subGestures: subMapped,
      legacyFloorIds: oldFloors.length !== replyRows.length ? [opRow.id, ...oldFloors.map(r => r.id)] : undefined,
      boostsByGestureId,
      relatedLinks,
      topicMap: {
        viewsCount: Number(opRow.views_count || 0),
        likesCount: totalReactions,
        linksCount: relatedLinks.length,
        usersCount: participantMap.size,
        participants: participants.slice(0, 5),
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

  const guestId = !postAuthUser && !isAdmin && sessionToken
    ? 'vis_' + (await sha256Hex('guestbook/' + sessionToken)).slice(0,24)
    : generateSecureId('vis', 8);
  const resolveActor = () => {
    const rawName = (payload.authorName || (authorRole === 'visitor' ? '访客' : '读者')).trim().slice(0, 50);
    let authorName = rawName;
    let authorAvatar = (payload.authorAvatar || '').trim().slice(0, 500);
    let authorId = guestId;
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


    if (!rootId) {
      return jsonResponse(request, env, { ok: false, error: '缺少主贴文 ID (rootId)' }, { status: 400 });
    }
    if (!rawMessage || rawMessage.length < 1) {
      return jsonResponse(request, env, { ok: false, error: '回复内容不能为空' }, { status: 400 });
    }
    if (rawMessage.length > 5000) {
      return jsonResponse(request, env, { ok: false, error: '回复内容不能超过 5000 字' }, { status: 400 });
    }

    if (env.DB) await ensureGestureTables(env.DB);
    const findNode = async (id: string) => env.DB
      ? env.DB.prepare('SELECT * FROM comments WHERE id=?').bind(id).first<RawCommentRow>()
      : memoryFallbackStore.get(id);
    const root = await findNode(rootId);
    if (!root || root.post_slug !== 'guestbook' || root.parent_id || root.post_type === 'boost' || !['published','pinned'].includes(root.status)) {
      return jsonResponse(request, env, { ok: false, error: '讨论不存在' }, { status: 404 });
    }
    const inThread = (n?: RawCommentRow | null) => n && (n.id === rootId || n.parent_id === rootId) && n.post_type !== 'boost' && ['published','pinned'].includes(n.status);
    const parent = replyToId === rootId ? root : await findNode(replyToId);
    const quoted = quoteId ? (quoteId === replyToId ? parent : await findNode(quoteId)) : null;
    if (!inThread(parent) || (quoteId && !inThread(quoted))) {
      return jsonResponse(request, env, { ok: false, error: '引用或回复目标不在当前讨论中' }, { status: 400 });
    }
    const quoteSource = quoted ? JSON.stringify({ id: quoted.id, authorName: quoted.author_name, authorAvatar: quoted.author_avatar, excerpt: quoted.message.slice(0, 100) }) : '';

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
        `SELECT COUNT(*) as cnt FROM comments WHERE parent_id = ? AND post_type != 'boost' AND status IN ('published','pinned')`
      ).bind(rootId).first<{ cnt: number }>();
      floorIndex = 1 + Number(countRes?.cnt || 1);
    } else {

      memoryFallbackStore.set(replyId, newRow);
      syncDevStore('save');
      const siblings = Array.from(memoryFallbackStore.values()).filter(
        (r) => r.parent_id === rootId && r.post_type !== 'boost' && ['published','pinned'].includes(r.status)
      );
      floorIndex = 1 + siblings.length;
    }

    return jsonResponse(request, env, {
      ok: true,
      subGesture: { ...mapRowToClientComment(newRow, false, actor.authorId, floorIndex), canManage: true },
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
    if (!validBoost(String(payload.content || ''))) {
      return jsonResponse(request, env, { ok: false, error: 'Boost 限单行、最多 16 字' }, { status: 400 });
    }

    if (env.DB) await ensureGestureTables(env.DB);
    const target = env.DB ? await env.DB.prepare('SELECT post_slug, status, post_type FROM comments WHERE id=?').bind(gestureId).first<RawCommentRow>() : memoryFallbackStore.get(gestureId);
    if (!target || target.post_slug !== 'guestbook' || target.post_type === 'boost' || !['published','pinned'].includes(target.status))
      return jsonResponse(request, env, { ok: false, error: '目标楼层不存在' }, { status: 404 });
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

      for (let attempt = 0; attempt < 5; attempt++) {
        const row = await env.DB.prepare("SELECT * FROM comments WHERE id=? AND post_slug='guestbook' AND status IN ('published','pinned')").bind(targetId).first<RawCommentRow>();
        if (!row) return jsonResponse(request, env, { ok: false, error: '楼层不存在' }, { status: 404 });
        const { rx, totalLikes, newUserEmoji } = applyReactionMutation(row);
        const updated = await env.DB.prepare(`UPDATE comments SET likes_count=?, reactions=?
          WHERE id=? AND reactions IS ? AND status IN ('published','pinned') RETURNING id`)
          .bind(totalLikes, JSON.stringify(rx), targetId, row.reactions ?? null).first();
        if (updated) return jsonResponse(request, env, {
          ok: true, likesCount: totalLikes, userReaction: newUserEmoji,
          reactions: { summary: rx.summary, users: newUserEmoji ? { [effectiveUserId]: newUserEmoji } : {}, details: buildReactionDetails(rx) },
        });
      }
      return jsonResponse(request, env, { ok: false, error: '表态正在更新，请重试' }, { status: 409 });
    }

    const row = memoryFallbackStore.get(targetId);
    if (!row || row.post_slug !== 'guestbook' || !['published','pinned'].includes(row.status)) {
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
    return jsonResponse(request, env, { ok: true, message: '请按站点举报与申诉说明提交反馈', url: '/community/reporting-and-appeals/' });
  }

  return jsonResponse(request, env, { ok: false, error: 'Unsupported action' }, { status: 400 });
}
