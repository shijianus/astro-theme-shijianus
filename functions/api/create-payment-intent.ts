import type { AppEnv } from '../_lib/types';
import { optionsResponse, jsonResponse, safeReadJson } from '../_lib/http';

interface PaymentIntentPayload {
  amount?: number;
  currency?: string;
  name?: string;
  message?: string;
  country?: string;
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
  },
) {
  if (!token || !chatId) return;
  try {
    const formattedAmount = `$${(data.amount / 100).toFixed(2)} ${data.currency.toUpperCase()}`;
    const sponsorName = data.name?.trim() ? data.name.trim() : '匿名支持者';
    const sponsorMsg = data.message?.trim() ? data.message.trim() : '（未留言）';
    const location = data.country ? data.country : 'GLOBAL';
    const nowStr = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    });

    const text = [
      `🎉 *收到新的博客赞赏发起 (EpoCanvas)*`,
      `━━━━━━━━━━━━━━━━━━`,
      `💰 *赞赏金额*: \`${formattedAmount}\``,
      `👤 *赞赏者*: *${sponsorName.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')}*`,
      `💬 *留言寄语*: ${sponsorMsg.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')}`,
      `🌍 *地区 / IP*: \`${location}\` (${data.ip || 'Unknown'})`,
      `💳 *支付通道*: Stripe Checkout (Cards / Apple Pay / Google Pay)`,
      `🆔 *订单标识*: \`${data.id || 'N/A'}\``,
      `🕒 *提交时间*: \`${nowStr}\``,
      `━━━━━━━━━━━━━━━━━━`,
    ].join('\n');

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
      }),
    });
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
      )
      .run();

    await db
      .prepare(
        `INSERT OR REPLACE INTO sponsorships (id, amount, currency, name, message, country, ip, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'created')`,
      )
      .bind(
        data.id,
        data.amount / 100,
        data.currency.toUpperCase(),
        data.name || 'Anonymous',
        data.message || '',
        data.country || 'GLOBAL',
        data.ip || '',
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
    params.set('description', `Support EpoCanvas / shijianus blog (${name || 'Anonymous'})`);
    if (name) {
      params.set('metadata[sponsor_name]', name);
    }
    if (message) {
      params.set('metadata[sponsor_message]', message);
    }
    params.set('metadata[country]', clientCountry);

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

    // Asynchronously notify TG bot & record to D1
    notifyTelegramBot(tgToken, tgChatId, {
      amount: amountInCents,
      currency,
      name,
      message,
      country: clientCountry,
      ip: clientIp,
      id: data.id,
    }).catch(() => {});

    if (env.DB) {
      recordInD1(env.DB, {
        id: data.id,
        amount: amountInCents,
        currency,
        name,
        message,
        country: clientCountry,
        ip: clientIp,
      }).catch(() => {});
    }

    return jsonResponse(request, env, {
      ok: true,
      clientSecret: data.client_secret,
      id: data.id,
      amount: amountInCents,
      currency,
    });
  } catch (err: any) {
    return jsonResponse(
      request,
      env,
      { ok: false, error: err?.message || 'Failed to create Stripe payment intent' },
      { status: 500 },
    );
  }
}
