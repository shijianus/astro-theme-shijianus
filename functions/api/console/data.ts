import { jsonResponse, optionsResponse } from '../../_lib/http';
import type { AppEnv } from '../../_lib/types';

export const onRequest: PagesFunction<AppEnv> = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return optionsResponse(context.request, context.env);
  }

  if (context.request.method !== 'GET') {
    return jsonResponse(
      { ok: false, error: 'Method Not Allowed' },
      context.request,
      context.env,
      { status: 405 },
    );
  }

  try {
    // 优先读取静态打包生成的预编译指标与热力图 JSON (同源边缘快速响应)
    const url = new URL(context.request.url);
    const assetUrl = new URL('/data/console-metrics.json', url.origin);
    
    let baseData: any = null;
    try {
      const res = await fetch(assetUrl.toString(), {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        baseData = await res.json();
      }
    } catch (e) {
      // Ignore static asset fetch error and fallback
    }

    const now = new Date();
    const START_DATE = new Date('2024-01-01T00:00:00Z');
    const dynamicUptimeDays = Math.floor((now.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24));

    if (baseData && baseData.ok) {
      // 动态校准最新运行天数与时间戳
      baseData.stats.uptimeDays = dynamicUptimeDays;
      baseData.servedAt = now.toISOString();

      return jsonResponse(
        baseData,
        context.request,
        context.env,
        {
          headers: {
            'Cache-Control': 'public, max-age=60, s-maxage=300',
          },
        },
      );
    }

    // 兜底响应
    return jsonResponse(
      {
        ok: true,
        stats: {
          uptimeDays: dynamicUptimeDays,
          activeStatus: 'Status 3',
          activeLevel: 'Lv.3',
          densityStatus: 'Level 4 (Ultra)',
          densityLevel: 'Lv.4',
        },
        activity: [],
        servedAt: now.toISOString(),
      },
      context.request,
      context.env,
    );
  } catch (err: any) {
    return jsonResponse(
      { ok: false, error: err.message || 'Internal Server Error' },
      context.request,
      context.env,
      { status: 500 },
    );
  }
};
