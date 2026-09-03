import type { AppEnv } from '../_lib/types';
import { optionsResponse, jsonResponse, safeReadJson } from '../_lib/http';
import {
  sendTelegramNotification,
  type TelegramBlessingPayload,
  ZERO_DECIMAL_CURRENCIES,
} from '../_lib/telegram-config';

async function updateD1Record(
  db: any,
  data: TelegramBlessingPayload,
) {
  if (!db) return;
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

    const cur = (data.currency || 'USD').toLowerCase();
    const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(cur);
    const humanAmount = typeof data.amount === 'number'
      ? (isZeroDecimal ? data.amount : data.amount / 100)
      : 5;

    await db
      .prepare(
        `INSERT OR REPLACE INTO sponsorships (id, amount, currency, name, message, country, ip, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)`,
      )
      .bind(
        data.id || `sp_${Date.now()}`,
        humanAmount,
        cur.toUpperCase(),
        data.name || 'Anonymous',
        data.message || '',
        data.country || 'GLOBAL',
        data.ip || '',
      )
      .run();
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

  const notificationData: TelegramBlessingPayload = {
    id: payload?.id,
    amount: payload?.amount,
    currency: payload?.currency || 'usd',
    name: payload?.name,
    message: payload?.message,
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
    tasks.push(updateD1Record(env.DB, notificationData));
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
