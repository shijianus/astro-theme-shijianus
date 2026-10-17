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
    const url = new URL(context.request.url);
    const assetUrl = new URL('/data/console-metrics.json', url.origin);
    
    let baseData: any = null;
    try {
      const assetBinding = (context.env as any)?.ASSETS;
      const res = assetBinding
        ? await assetBinding.fetch(new Request(assetUrl.toString()))
        : await fetch(assetUrl.toString());
      if (res && res.ok) {
        baseData = await res.json();
      }
    } catch (e) {
      // Fallback seamlessly if assets fetch fails
    }

    const now = new Date();
    const START_DATE = new Date('2024-01-01T00:00:00Z');
    const dynamicUptimeDays = Math.floor((now.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24));

    if (baseData && baseData.ok) {
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
