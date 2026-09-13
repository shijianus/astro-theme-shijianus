import type { AppEnv } from '../_lib/types';
import { jsonResponse, optionsResponse } from '../_lib/http';

export interface SponsorRecord {
  id: string;
  name: string;
  amount: number;
  currency: string;
  message?: string;
  country?: string;
  channel?: string;
  status?: string;
  createdAt: string;
}

export async function onRequest(context: {
  request: Request;
  env: AppEnv;
}): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  if (request.method !== 'GET') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10), 1), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

  if (!env.DB) {
    return jsonResponse(request, env, {
      ok: true,
      list: [],
      total: 0,
      note: 'D1 not bound in current environment',
    });
  }

  try {
    // Ensure table exists
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS sponsorships (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        name TEXT,
        message TEXT,
        country TEXT,
        ip TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    ).run();

    // Query completed sponsorships (or non-failed)
    const query = `
      SELECT id, amount, currency, name, message, country, status, created_at, updated_at
      FROM sponsorships
      WHERE status IN ('completed', 'form_submitted', 'modal_closed', 'page_unload', 'idle_timeout_30m')
         OR (status IS NULL AND amount > 0)
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM sponsorships
      WHERE status IN ('completed', 'form_submitted', 'modal_closed', 'page_unload', 'idle_timeout_30m')
         OR (status IS NULL AND amount > 0)
    `;

    const [recordsResult, countResult] = await Promise.all([
      env.DB.prepare(query).bind(limit, offset).all<any>(),
      env.DB.prepare(countQuery).bind().first<{ count: number }>(),
    ]);

    const rawRows = recordsResult?.results || [];
    const total = countResult?.count || rawRows.length;

    const list: SponsorRecord[] = rawRows.map((r) => {
      const rawName = (r.name || '').trim();
      const displayName = rawName && rawName.toLowerCase() !== 'anonymous' ? rawName : '匿名支持者';
      return {
        id: r.id,
        name: displayName,
        amount: Number(r.amount) || 0,
        currency: (r.currency || 'USD').toUpperCase(),
        message: (r.message || '').trim(),
        country: r.country || 'GLOBAL',
        channel: r.id?.startsWith('cs_') ? 'Stripe (国际收银台)' : '赞赏支持',
        status: r.status,
        createdAt: r.created_at || r.updated_at || new Date().toISOString(),
      };
    });

    return jsonResponse(request, env, {
      ok: true,
      list,
      total,
    });
  } catch (err: any) {
    console.error('Error fetching sponsorships:', err);
    return jsonResponse(
      request,
      env,
      { ok: false, error: err?.message || 'Failed to fetch sponsorships' },
      { status: 500 },
    );
  }
}
