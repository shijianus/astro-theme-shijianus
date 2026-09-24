import type { AppEnv } from '../_lib/types';
import { optionsResponse, jsonResponse, safeReadJson } from '../_lib/http.ts';
import {
  sendTelegramNotification,
  type TelegramBlessingPayload,
  ZERO_DECIMAL_CURRENCIES,
} from '../_lib/telegram-config.ts';

export async function verifySessionRecord(
  env: AppEnv,
  sessionId: string,
): Promise<{ valid: boolean; amount?: number; currency?: string; alreadyFinalized?: boolean }> {
  if (!sessionId) return { valid: false };

  const isDev = Boolean(env.IS_DEV || (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production' && !env.DB));

  // 1. Check if record exists in D1 sponsorships table and is already marked completed
  let existingInDb: { id: string; amount: number; currency: string; status: string; name?: string; message?: string } | null = null;
  if (env.DB) {
    try {
      existingInDb = await env.DB.prepare(
        'SELECT id, amount, currency, status, name, message FROM sponsorships WHERE id = ? LIMIT 1'
      )
        .bind(sessionId)
        .first<{ id: string; amount: number; currency: string; status: string; name?: string; message?: string }>();

      if (existingInDb && (existingInDb.status === 'completed' || existingInDb.status === 'succeeded' || existingInDb.status === 'form_submitted')) {
        const isFinalized = existingInDb.status === 'form_submitted' || (existingInDb.status === 'completed' && Boolean(existingInDb.name && existingInDb.name !== 'Anonymous' && existingInDb.name !== '匿名支持者'));
        return {
          valid: true,
          amount: existingInDb.amount,
          currency: existingInDb.currency,
          alreadyFinalized: isFinalized,
        };
      }
    } catch (e) {
      console.error('[RecordBlessing] DB check error:', e);
    }
  }

  // 2. Authoritative verification via Stripe API
  const stripeKey = env.STRIPE_SECRET_KEY || (typeof process !== 'undefined' && process.env?.STRIPE_SECRET_KEY);
  if (stripeKey && (sessionId.startsWith('cs_') || sessionId.startsWith('pi_'))) {
    try {
      const endpoint = sessionId.startsWith('cs_')
        ? `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`
        : `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(sessionId)}`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      if (res.ok) {
        const stripeData = (await res.json()) as any;
        const isPaid = stripeData.payment_status === 'paid' || stripeData.status === 'succeeded';
        if (isPaid) {
          const rawAmt = stripeData.amount_total ?? stripeData.amount ?? 500;
          const cur = (stripeData.currency || 'usd').toLowerCase();
          const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(cur);
          const humanAmount = isZeroDecimal ? rawAmt : rawAmt / 100;
          return {
            valid: true,
            amount: humanAmount,
            currency: cur.toUpperCase(),
          };
        } else {
          // Explicitly unpaid on Stripe
          return { valid: false };
        }
      }
    } catch (e) {
      console.error('[RecordBlessing] Stripe verify error:', e);
    }
  }

  // 3. In dev mode without Stripe credentials, allow existing record for testing
  if (isDev && existingInDb) {
    return {
      valid: true,
      amount: existingInDb.amount,
      currency: existingInDb.currency,
    };
  }

  return { valid: false };
}

async function updateD1Record(
  db: any,
  data: TelegramBlessingPayload,
  verifiedAmount?: number,
  verifiedCurrency?: string,
) {
  if (!db || !data.id) return;
  try {
    await db
      .prepare(
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
      )
      .run();

    const cleanName = (data.name || 'Anonymous').slice(0, 60);
    const cleanMessage = (data.message || '').slice(0, 500);

    const finalAmount = verifiedAmount ?? (typeof data.amount === 'number' ? data.amount : 5);
    const finalCurrency = (verifiedCurrency || data.currency || 'USD').toUpperCase();

    const targetStatus = data.trigger === 'form_submitted' ? 'form_submitted' : 'completed';

    // Use UPDATE if record already exists to preserve original server-set amount & creation date
    const res = await db
      .prepare(
        `UPDATE sponsorships
         SET name = ?, message = ?, country = ?, ip = ?, status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND (status NOT IN ('form_submitted') OR status IS NULL)`,
      )
      .bind(
        cleanName,
        cleanMessage,
        data.country || 'GLOBAL',
        data.ip || '',
        targetStatus,
        data.id,
      )
      .run();

    // If no row was updated (e.g. verified from Stripe but wasn't in DB yet), INSERT it
    if (!res?.meta?.changes || res.meta.changes === 0) {
      const exists = await db.prepare('SELECT id FROM sponsorships WHERE id = ?').bind(data.id).first();
      if (!exists) {
        await db
          .prepare(
            `INSERT INTO sponsorships (id, amount, currency, name, message, country, ip, status, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          )
          .bind(
            data.id,
            finalAmount,
            finalCurrency,
            cleanName,
            cleanMessage,
            data.country || 'GLOBAL',
            data.ip || '',
            targetStatus,
          )
          .run();
      }
    }
  } catch (dbErr) {
    console.error('D1 update error:', dbErr);
  }
}

export async function onRequest(context: {
  request: Request;
  env: AppEnv;
  waitUntil?: (promise: Promise<unknown>) => void;
}): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, env, { ok: false, error: 'Method Not Allowed' }, { status: 405 });
  }

  const payload = await safeReadJson<TelegramBlessingPayload>(request);
  const sessionId = (payload?.id || '').trim();

  if (!sessionId) {
    return jsonResponse(request, env, { ok: false, error: '缺少赞助会话标识 (id)' }, { status: 400 });
  }

  // Strict session verification: prevent arbitrary sponsorship fabrication
  const verification = await verifySessionRecord(env, sessionId);
  if (!verification.valid) {
    return jsonResponse(
      request,
      env,
      { ok: false, error: '未找到有效的支付赞助会话或支付未完成，无法提交赞赏记录' },
      { status: 403 }
    );
  }

  // Idempotency & Defacement Prevention: if already finalized with user blessings, lock against replay
  if (verification.alreadyFinalized) {
    return jsonResponse(request, env, {
      ok: true,
      message: 'Blessing already recorded and locked against tampering.',
      idempotent: true,
    });
  }

  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  const country = payload?.country || request.headers.get('cf-ipcountry') || 'GLOBAL';

  const tgToken =
    env.TELEGRAM_BOT_TOKEN ||
    (typeof process !== 'undefined' && process.env?.TELEGRAM_BOT_TOKEN) ||
    '';
  const tgChatId =
    env.TELEGRAM_CHAT_ID ||
    (typeof process !== 'undefined' && process.env?.TELEGRAM_CHAT_ID) ||
    '';

  const cleanAmount = verification.amount !== undefined ? verification.amount : (payload?.amount ?? 5);
  const cleanCurrency = verification.currency !== undefined ? verification.currency : (payload?.currency || 'USD');
  const cleanName = (payload?.name || '').trim().slice(0, 60);
  const cleanMessage = (payload?.message || '').trim().slice(0, 500);

  const notificationData: TelegramBlessingPayload = {
    id: sessionId,
    amount: cleanAmount,
    currency: cleanCurrency,
    name: cleanName,
    message: cleanMessage,
    country,
    ip: clientIp,
    paymentMethod: payload?.paymentMethod || 'Stripe Checkout (Cards / Apple Pay / Google Pay / Link)',
    trigger: payload?.trigger || 'modal_closed',
    completedAt: payload?.completedAt || new Date(),
  };

  // Background tasks — keep alive via waitUntil so the response returns immediately
  const tasks: Promise<unknown>[] = [
    sendTelegramNotification(tgToken, tgChatId, notificationData),
  ];

  if (env.DB) {
    tasks.push(updateD1Record(env.DB, notificationData, verification.amount, verification.currency));
  }

  if (typeof context.waitUntil === 'function') {
    context.waitUntil(Promise.all(tasks));
  } else {
    await Promise.all(tasks);
  }

  return jsonResponse(request, env, {
    ok: true,
    message: 'Blessing recorded and notified successfully',
  });
}
