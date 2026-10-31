import type { AppEnv } from '../_lib/types';
import { jsonResponse, optionsResponse } from '../_lib/http.ts';
import { enforceRateLimit, envLimit } from '../_lib/rate-limit.ts';

export interface SyncedMomentItem {
  id: string;
  author: string;
  authorUrl: string;
  avatar: string;
  badge: string;
  isOwner: boolean;
  mood: string;
  device: string;
  title: string;
  url: string;
  summary: string;
  timeAgo: string;
  timestamp: string;
  category: 'tech' | 'life' | 'design' | 'thought';
  tags: string[];
  likes: number;
  commentCount: number;
  liveSynced?: boolean;
}

export const onRequest: PagesFunction<AppEnv> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  // 限制刷新频次：每分钟最多 30 次
  const rateLimit = await enforceRateLimit({
    namespace: 'moments-sync',
    request,
    env,
    limit: envLimit(env, 'MOMENTS_SYNC_MINUTE_LIMIT', 30),
    windowSeconds: 60,
    scope: 'hybrid',
  });

  if (!rateLimit.allowed) {
    return jsonResponse(
      request,
      env,
      { ok: false, error: '请求过于频繁，请稍候再试' },
      { status: 429 }
    );
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'list';

  try {
    let syncedMoments: SyncedMomentItem[] = [];
    try {
      const assetRes = await fetch(new URL('/data/friends-moments.json', request.url));
      if (assetRes.ok) {
        const parsed = await assetRes.json();
        syncedMoments = Array.isArray(parsed) ? parsed : (parsed?.items || []);
      }
    } catch {
      // 容错读取
    }

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        action,
        engine: 'EpoCanvas Cloudflare Edge Moments Sync Pipeline',
        syncedAt: new Date().toISOString(),
        total: syncedMoments.length,
        items: syncedMoments,
        status: 'synced',
        protocol: 'Fcircle-compatible Edge Pull Pipeline',
        notice: syncedMoments.length > 0 ? '友邻朋友圈动态同步完成' : '暂无友邻最新外部说说',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=1800, s-maxage=3600',
        },
      }
    );
  } catch (err: any) {
    return jsonResponse(
      request,
      env,
      {
        ok: false,
        error: err.message || '友邻动态同步失败',
      },
      { status: 500 }
    );
  }
};
