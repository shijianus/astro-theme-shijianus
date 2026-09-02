import type { AppEnv } from '../_lib/types';
import { optionsResponse, jsonResponse, safeReadJson } from '../_lib/http';

interface PaymentIntentPayload {
  amount?: number;
  currency?: string;
  name?: string;
  message?: string;
  country?: string;
  paymentMethod?: string;
  paymentMethodId?: string;
  confirm?: boolean;
}

function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function notifyTelegramBot(
  token: string,
  chatId: string,
  data: {
    amount: number;
    currency: string;
    name?: string;
    message?: string;
    country?: string;
    ip?: string;
    id?: string;
    paymentMethod?: string;
  },
) {
  if (!token || !chatId) return;
  try {
    const formattedAmount = `$${(data.amount / 100).toFixed(2)} ${data.currency.toUpperCase()}`;
    const sponsorName = sanitizeHtml(data.name?.trim() ? data.name.trim() : '匿名支持者');
    const sponsorMsg = sanitizeHtml(data.message?.trim() ? data.message.trim() : '（未留言）');
    const location = sanitizeHtml(data.country ? data.country : 'GLOBAL');
    const clientIp = sanitizeHtml(data.ip || 'Unknown');
    const nowStr = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    });
    const payChannel = sanitizeHtml(data.paymentMethod || 'Stripe Checkout (Cards / Apple Pay / Google Pay)');

    const text = [
      `🎉 <b>收到新的博客赞赏发起</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `💰 <b>赞赏金额</b>: <code>${formattedAmount}</code>`,
      `👤 <b>赞赏者</b>: <b>${sponsorName}</b>`,
      `💬 <b>留言寄语</b>: ${sponsorMsg}`,
      `🌍 <b>地区 / IP</b>: <code>${location}</code> (${clientIp})`,
      `💳 <b>支付通道</b>: ${payChannel}`,
      `🆔 <b>订单标识</b>: <code>${sanitizeHtml(data.id || 'N/A')}</code>`,
      `🕒 <b>提交时间</b>: <code>${nowStr}</code>`,
      `━━━━━━━━━━━━━━━━━━`,
    ].join('\n');

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Telegram API response error:', res.status, errText);
    }
  } catch (tgErr) {
    console.error('Telegram notification error:', tgErr);
  }
}

async function recordInD1(
  db: any,
  data: {
    id: string;
    amount: number;
    currency: string;
    name?: string;
    message?: string;
    country?: string;
    ip?: string;
    status?: string;
  },
) {
  if (!db) return;
  try {
    // Ensure table exists
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

    await db
      .prepare(
        `INSERT OR REPLACE INTO sponsorships (id, amount, currency, name, message, country, ip, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      )
      .bind(
        data.id,
        data.amount / 100,
        data.currency.toUpperCase(),
        data.name || 'Anonymous',
        data.message || '',
        data.country || 'GLOBAL',
        data.ip || '',
        data.status || 'created',
      )
      .run();
  } catch (dbErr) {
    console.error('D1 recording error:', dbErr);
  }
}

export async function onRequest(context: { request: Request; env: AppEnv }): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  const payload = await safeReadJson<PaymentIntentPayload>(request);
  const rawAmount = typeof payload?.amount === 'number' ? payload.amount : 5;
  const currency = (payload?.currency || 'usd').toLowerCase();
  const name = payload?.name?.trim() || '';
  const message = payload?.message?.trim() || '';
  const clientCountry = payload?.country || request.headers.get('cf-ipcountry') || 'GLOBAL';
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  const paymentMethod = payload?.paymentMethod || 'Stripe Checkout';

  // Validate amount: support both dollar amount (e.g., 5 => 500 cents) or cents
  let amountInCents = Math.round(rawAmount >= 50 && Number.isInteger(rawAmount) ? rawAmount : rawAmount * 100);
  if (amountInCents < 50) {
    amountInCents = 50; // Minimum $0.50
  }
  if (amountInCents > 100000) {
    amountInCents = 100000; // Cap at $1000
  }

  const stripeSecretKey =
    env.STRIPE_SECRET_KEY ||
    (typeof process !== 'undefined' && process.env?.STRIPE_SECRET_KEY) ||
    '';

  if (!stripeSecretKey) {
    return jsonResponse(
      request,
      env,
      { ok: false, error: 'Stripe secret key is not configured.' },
      { status: 500 },
    );
  }

  try {
    const params = new URLSearchParams();
    params.set('amount', String(amountInCents));
    params.set('currency', currency);
    params.set('automatic_payment_methods[enabled]', 'true');
    params.set('automatic_payment_methods[allow_redirects]', 'never');
    params.set('description', `Support EpoCanvas / shijianus blog (${name || 'Anonymous'})`);
    if (name) {
      params.set('metadata[sponsor_name]', name);
    }
    if (message) {
      params.set('metadata[sponsor_message]', message);
    }
    params.set('metadata[country]', clientCountry);
    params.set('metadata[payment_method]', paymentMethod);

    // If confirm is requested or in test mode, confirm the PaymentIntent to trigger balance change
    if (payload?.confirm) {
      params.set('confirm', 'true');
      if (stripeSecretKey.startsWith('sk_test_')) {
        params.set('payment_method', payload?.paymentMethodId || 'pm_card_visa');
      } else if (payload?.paymentMethodId) {
        params.set('payment_method', payload.paymentMethodId);
      }
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = (await stripeRes.json()) as Record<string, any>;

    if (!stripeRes.ok || data.error) {
      const errorMsg = data.error?.message || `Stripe error (${stripeRes.status})`;
      console.error('Stripe API error:', errorMsg);
      return jsonResponse(request, env, { ok: false, error: errorMsg }, { status: 400 });
    }

    const tgToken =
      env.TELEGRAM_BOT_TOKEN ||
      (typeof process !== 'undefined' && process.env?.TELEGRAM_BOT_TOKEN) ||
      '8690822896:AAH7WQiDPd_Y7Crpn8Hlt6_3w3g2pF5D1ZA';
    const tgChatId =
      env.TELEGRAM_CHAT_ID ||
      (typeof process !== 'undefined' && process.env?.TELEGRAM_CHAT_ID) ||
      '7963161588';

    // MUST AWAIT Telegram & D1 so Cloudflare Pages worker does not terminate beforehand!
    await notifyTelegramBot(tgToken, tgChatId, {
      amount: amountInCents,
      currency,
      name,
      message,
      country: clientCountry,
      ip: clientIp,
      id: data.id,
      paymentMethod,
    });

    if (env.DB) {
      await recordInD1(env.DB, {
        id: data.id,
        amount: amountInCents,
        currency,
        name,
        message,
        country: clientCountry,
        ip: clientIp,
        status: data.status || 'created',
      });
    }

    return jsonResponse(request, env, {
      ok: true,
      clientSecret: data.client_secret,
      id: data.id,
      amount: amountInCents,
      currency,
      status: data.status,
    });
  } catch (err: any) {
    console.error('Create payment intent exception:', err);
    return jsonResponse(
      request,
      env,
      { ok: false, error: err?.message || 'Failed to create Stripe payment intent' },
      { status: 500 },
    );
  }
}
