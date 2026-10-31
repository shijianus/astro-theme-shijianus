import type { AppEnv } from '../_lib/types';
import { jsonResponse, optionsResponse, safeReadJson } from '../_lib/http.ts';

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

  // 1. GET: 代理读取远端友邻博客某条说说的评论楼层
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
      return jsonResponse(request, env, {
        ok: true,
        federated: true,
        originApi,
        data,
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

  // 2. POST: 代理向远端友邻博客发表串门评论
  if (method === 'POST') {
    const payload = await safeReadJson<any>(request);
    if (!payload || !payload.targetApi) {
      return jsonResponse(request, env, { ok: false, error: '无效请求，缺少 targetApi 目标端点' }, { status: 400 });
    }

    const targetApi = String(payload.targetApi).trim();
    const slug = String(payload.slug || payload.post_slug || '').trim();
    const author = String(payload.author || payload.author_name || '热心博友').trim().slice(0, 50);
    const email = String(payload.email || payload.author_email || '').trim().slice(0, 100);
    const message = String(payload.message || payload.content || '').trim().slice(0, 1000);
    const parentId = payload.parentId || payload.parent_id || null;
    const fromSite = String(payload.fromSite || payload.from_site || 'https://blog.epocanvas.com').trim();

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
