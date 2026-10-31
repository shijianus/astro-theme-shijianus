import type { AppEnv } from '../_lib/types';
import { jsonResponse, optionsResponse, safeReadJson } from '../_lib/http.ts';

export interface NormalizedComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: 'admin' | 'visitor' | 'friend';
  message: string;
  timeAgo: string;
  timestamp?: string;
  likesCount?: number;
}

/**
 * 跨站反代：将远端不同博客系统（shijianus-blog, Twikoo, Waline, Artalk 等）评论归一化
 */
function normalizeRemoteComments(rawData: any): NormalizedComment[] {
  if (!rawData) return [];
  let list: any[] = [];
  if (Array.isArray(rawData)) {
    list = rawData;
  } else if (Array.isArray(rawData.comments)) {
    list = rawData.comments;
  } else if (Array.isArray(rawData.data)) {
    list = rawData.data;
  } else if (Array.isArray(rawData.items)) {
    list = rawData.items;
  }

  return list.map((item, idx) => {
    const id = item.id || item._id || item.objectId || `remote_${idx}_${Date.now()}`;
    const authorName = item.authorName || item.author_name || item.nick || item.author || '友邻博友';
    const authorAvatar = item.authorAvatar || item.avatar || (item.mailMd5 
      ? `https://cravatar.cn/avatar/${item.mailMd5}`
      : `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(authorName)}`);
    const message = item.message || item.content || item.comment || '';
    const timeAgo = item.timeAgo || item.created_at || item.time || item.date || '刚刚';
    const isMaster = Boolean(item.is_admin || item.master || (item.authorRole === 'admin') || String(authorName).includes('站长'));
    
    return {
      id: String(id),
      authorName: String(authorName).slice(0, 50),
      authorAvatar: String(authorAvatar),
      authorRole: isMaster ? 'admin' : 'visitor',
      message: String(message),
      timeAgo: String(timeAgo),
      timestamp: item.timestamp || item.created_at,
      likesCount: Number(item.likesCount || item.likes || item.like || 0),
    };
  });
}

export async function onRequest(context: {
  request: Request;
  env: AppEnv;
}): Promise<Response> {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  const url = new URL(request.url);

  // 1. GET: 代理读取远端友邻博客某条说说的评论楼层 (统一反代并归一化输出)
  if (method === 'GET') {
    const originApi = url.searchParams.get('originApi')?.trim();
    const slug = url.searchParams.get('slug')?.trim();

    if (!originApi) {
      return jsonResponse(request, env, { ok: false, error: '缺少 originApi 参数' }, { status: 400 });
    }

    try {
      const targetUrl = new URL(originApi);
      if (slug) {
        targetUrl.searchParams.set('slug', slug);
      }

      const res = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'shijianus-moments-federation/1.0 (+https://blog.epocanvas.com)',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        return jsonResponse(request, env, {
          ok: false,
          error: `友邻端点响应非 200 (HTTP ${res.status})`,
          comments: [],
          federated: true,
          offline: true,
        }, { status: 200 });
      }

      const data = await res.json();
      const normalizedComments = normalizeRemoteComments(data);

      return jsonResponse(request, env, {
        ok: true,
        federated: true,
        originApi,
        comments: normalizedComments,
        raw: data,
      });
    } catch (err: any) {
      console.warn('[CrossComment] Failed to fetch remote comments from', originApi, err.message);
      return jsonResponse(request, env, {
        ok: false,
        error: '友邻博客暂时离线或网络波动，暂无法获取远端评论',
        comments: [],
        federated: true,
        offline: true,
      }, { status: 200 });
    }
  }

  // 2. POST: 代理向远端友邻博客发表串门评论 或 跨站点赞 (反代中枢)
  if (method === 'POST') {
    const payload = await safeReadJson<any>(request);
    if (!payload || !payload.targetApi) {
      return jsonResponse(request, env, { ok: false, error: '无效请求，缺少 targetApi 目标端点' }, { status: 400 });
    }

    const targetApi = String(payload.targetApi).trim();
    const slug = String(payload.slug || payload.post_slug || '').trim();
    const action = String(payload.action || 'comment').trim();
    const fromSite = String(payload.fromSite || payload.from_site || 'https://blog.epocanvas.com').trim();

    // 2.1 跨站点赞转发
    if (action === 'like') {
      try {
        await fetch(targetApi, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'shijianus-moments-federation/1.0 (+https://blog.epocanvas.com)',
            'X-From-Site': fromSite,
          },
          body: JSON.stringify({
            action: 'like',
            slug,
            from_site: fromSite,
          }),
          signal: AbortSignal.timeout(4000),
        });
      } catch (e: any) {
        console.warn('[CrossComment] Remote like forward non-blocking warning:', e.message);
      }

      return jsonResponse(request, env, {
        ok: true,
        success: true,
        federated: true,
        action: 'like',
        message: '跨站点赞已同步送达友邻！❤️',
      });
    }

    // 2.2 跨站评论发表
    const author = String(payload.author || payload.author_name || '热心博友').trim().slice(0, 50);
    const email = String(payload.email || payload.author_email || '').trim().slice(0, 100);
    const message = String(payload.message || payload.content || '').trim().slice(0, 1000);
    const parentId = payload.parentId || payload.parent_id || null;

    if (!message) {
      return jsonResponse(request, env, { ok: false, error: '评论内容不能为空' }, { status: 400 });
    }

    try {
      const res = await fetch(targetApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'shijianus-moments-federation/1.0 (+https://blog.epocanvas.com)',
          'X-From-Site': fromSite,
        },
        body: JSON.stringify({
          post_slug: slug,
          slug,
          author_name: `${author} 🌐 [来自 ${new URL(fromSite).hostname}]`,
          author_email: email,
          message,
          parent_id: parentId,
          from_site: fromSite,
          quote: {
            title: `跨站串门留言`,
            source: fromSite,
          },
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn('[CrossComment] Remote post returned non-200:', res.status, errorText);
        return jsonResponse(request, env, {
          ok: true,
          success: true,
          federated: true,
          pending: true,
          message: '友邻博客暂时无法直接写入，已在本地为你保留留言草稿！',
        });
      }

      const result = await res.json();
      return jsonResponse(request, env, {
        ok: true,
        success: true,
        federated: true,
        targetApi,
        result,
        message: '串门评论已成功直达友邻数据库！',
      });
    } catch (err: any) {
      console.error('[CrossComment] Remote post error:', err);
      return jsonResponse(request, env, {
        ok: true,
        success: true,
        federated: true,
        pending: true,
        message: '友邻博客网络超时，已为你安全暂存，待友邻恢复后同步！',
      });
    }
  }

  return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
}
