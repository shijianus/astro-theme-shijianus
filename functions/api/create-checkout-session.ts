import type { AppEnv } from '../_lib/types';
import { optionsResponse, jsonResponse, safeReadJson } from '../_lib/http';

interface CheckoutSessionPayload {
  amount?: number;
  currency?: string;
  name?: string;
  message?: string;
  country?: string;
  returnUrl?: string;
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
    const formattedAmount = `${data.amount} ${data.currency.toUpperCase()}`;
    const sponsorName = sanitizeHtml(data.name?.trim() ? data.name.trim() : '匿名支持者');
    const sponsorMsg = sanitizeHtml(data.message?.trim() ? data.message.trim() : '（未留言）');
    const location = sanitizeHtml(data.country ? data.country : 'GLOBAL');
    const clientIp = sanitizeHtml(data.ip || 'Unknown');
    const nowStr = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    });
    const payChannel = sanitizeHtml(data.paymentMethod || 'Stripe Checkout Session');

    const text = [
      `🎉 <b>收到新的博客赞赏 (Checkout Session)</b>`,
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
        data.amount,
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

const ZERO_DECIMAL_CURRENCIES = new Set(['bif','clp','gnf','jpy','kmf','krw','mga','pyg','rwf','ugx','vnd','xaf','xof','xpf']);

export async function onRequest(context: { request: Request; env: AppEnv }): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  const payload = await safeReadJson<CheckoutSessionPayload>(request);
  const amount = typeof payload?.amount === 'number' ? payload.amount : 5;
  const currency = (payload?.currency || 'usd').toLowerCase();
  const name = payload?.name?.trim() || '';
  const message = payload?.message?.trim() || '';
  const clientCountry = payload?.country || request.headers.get('cf-ipcountry') || 'GLOBAL';
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  const returnUrl = payload?.returnUrl || 'https://blog.epocanvas.com/?stripe_return=1&session_id={CHECKOUT_SESSION_ID}';

  let unitAmount = amount;
  if (!ZERO_DECIMAL_CURRENCIES.has(currency)) {
    unitAmount = Math.round(amount * 100);
    if (unitAmount < 50) {
      unitAmount = 50;
    }
  }

  const stripeSecretKey =
    env.STRIPE_SECRET_KEY ||
    (typeof process !== 'undefined' && process.env?.STRIPE_SECRET_KEY) ||
    atob('c2tfdGVzdF81MVNNdGhWM0V5RkdTaHBBR1NIeWx0R3NMNm1jUm4yaXV1cjMyZFo3UHNkT2x0RE16S3VsWmRUS0xJaE5jS1Y5eVN4aVlydjNDeENjVzE5OFBYc3ZJTGlHSTAwRkg5dlBmRnE=');

  const telegramToken =
    env.TELEGRAM_BOT_TOKEN ||
    (typeof process !== 'undefined' && process.env?.TELEGRAM_BOT_TOKEN) ||
    '8690822896:AAH7WQiDPd_Y7Crpn8Hlt6_3w3g2pF5D1ZA';

  const telegramChatId =
    env.TELEGRAM_CHAT_ID ||
    (typeof process !== 'undefined' && process.env?.TELEGRAM_CHAT_ID) ||
    '7963161588';

  try {
    const params = new URLSearchParams();
    params.set('ui_mode', 'embedded');
    params.set('mode', 'payment');
    params.set('return_url', returnUrl);
    params.set('line_items[0][price_data][currency]', currency);
    params.set('line_items[0][price_data][unit_amount]', String(unitAmount));
    params.set('line_items[0][price_data][product_data][name]', 'Support EpoCanvas Blog');
    params.set('line_items[0][price_data][product_data][description]', 'Thank you for your generous support!');
    params.set('line_items[0][quantity]', '1');
    params.set('customer_creation', 'always');
    
    if (name) params.set('metadata[sponsor_name]', name);
    if (message) params.set('metadata[sponsor_message]', message);
    params.set('metadata[country]', clientCountry);
    params.set('metadata[source]', 'blog_reward_embedded_checkout');
    params.set('metadata[payment_method]', 'Stripe Checkout Session');

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2025-06-30.basil',
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

    await notifyTelegramBot(tgToken, tgChatId, {
      amount: unitAmount,
      currency,
      name,
      message,
      country: clientCountry,
      ip: clientIp,
      id: data.id,
      paymentMethod: 'Stripe Checkout Session',
    });

    if (env.DB) {
      await recordInD1(env.DB, {
        id: data.id,
        amount: unitAmount,
        currency,
        name,
        message,
        country: clientCountry,
        ip: clientIp,
        status: 'session_created',
      });
    }

    return jsonResponse(request, env, {
      ok: true,
      clientSecret: data.client_secret,
      sessionId: data.id,
      amount,
      currency,
    });
  } catch (err: any) {
    console.error('Create checkout session exception:', err);
    return jsonResponse(
      request,
      env,
      { ok: false, error: err?.message || 'Failed to create Stripe checkout session' },
      { status: 500 },
    );
  }
}
