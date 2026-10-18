import { jsonResponse, optionsResponse } from '../../_lib/http';
import type { AppEnv } from '../../_lib/types';
import metricsSnapshot from '../../../public/data/console-metrics.json';

export const onRequest: PagesFunction<AppEnv> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  if (request.method !== 'GET') {
    return jsonResponse(
      request,
      env,
      { ok: false, error: 'Method Not Allowed' },
      { status: 405 },
    );
  }

  try {
    const url = new URL(request.url);
    const assetUrl = new URL('/data/console-metrics.json', url.origin);

    let baseData: any = null;
    const assetBinding = (env as any)?.ASSETS;
    if (assetBinding && typeof assetBinding.fetch === 'function') {
      try {
        const res = await assetBinding.fetch(new Request(assetUrl.toString()));
        if (res && res.ok) {
          baseData = await res.json();
        }
      } catch {
        // Fallback gracefully to bundled snapshot
      }
    }

    if (!baseData || !baseData.ok) {
      baseData = JSON.parse(JSON.stringify(metricsSnapshot));
    }

    const now = new Date();
    const START_DATE = new Date('2024-01-01T00:00:00Z');
    const dynamicUptimeDays = Math.floor((now.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24));

    if (baseData && baseData.stats) {
      baseData.stats.uptimeDays = dynamicUptimeDays;
      baseData.stats.activeHref = '/standards/activity-level/';
      baseData.stats.densityHref = '/standards/content-density/';
    }

    // 动态严格按当前请求日期生成 52 周日历
    if (baseData && baseData.posts && Array.isArray(baseData.posts)) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      today.setHours(0, 0, 0, 0);

      const currentWeekSunday = new Date(today);
      currentWeekSunday.setDate(today.getDate() - today.getDay());

      const gridStartDate = new Date(currentWeekSunday);
      gridStartDate.setDate(currentWeekSunday.getDate() - (51 * 7));

      const activityMap = new Map<string, any[]>();
      for (const p of baseData.posts) {
        if (p.pubDate) {
          const list = activityMap.get(p.pubDate) || [];
          if (!list.some((e: any) => e.href === p.href && e.type === 'publish')) {
            list.push({ title: p.title, href: p.href, type: 'publish', date: p.pubDate });
            activityMap.set(p.pubDate, list);
          }
        }
        if (p.updatedDate && p.updatedDate !== p.pubDate) {
          const list = activityMap.get(p.updatedDate) || [];
          if (!list.some((e: any) => e.href === p.href && e.type === 'update')) {
            list.push({ title: `${p.title} (更新)`, href: p.href, type: 'update', date: p.updatedDate });
            activityMap.set(p.updatedDate, list);
          }
        }
      }

      const dynamicDays = [];
      for (let i = 0; i < 364; i++) {
        const cur = new Date(gridStartDate);
        cur.setDate(gridStartDate.getDate() + i);

        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;
        const displayDate = `${y}/${parseInt(m, 10)}/${parseInt(d, 10)}`;

        const isFuture = cur > today;
        const items = isFuture ? [] : (activityMap.get(dateKey) || []);
        const count = items.length;

        let level = 0;
        if (!isFuture) {
          if (count >= 7) level = 4;
          else if (count >= 4) level = 3;
          else if (count >= 2) level = 2;
          else if (count >= 1) level = 1;
        }

        dynamicDays.push({
          date: dateKey,
          displayDate,
          level,
          posts: items,
          isFuture,
        });
      }
      baseData.activity = dynamicDays;
    }

    baseData.servedAt = now.toISOString();

    return jsonResponse(
      request,
      env,
      baseData,
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300',
        },
      },
    );
  } catch (err: any) {
    return jsonResponse(
      request,
      env,
      { ok: false, error: err?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
};

