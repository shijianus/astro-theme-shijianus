import type { AppEnv } from '../_lib/types';
import { optionsResponse, jsonResponse, safeReadJson } from '../_lib/http';

interface BlessingPayload {
  id?: string;
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
    id?: string;
    amount?: number;
    currency?: string;
    name?: string;
    message?: string;
    country?: string;
    ip?: string;
  },
) {
  if (!token || !chatId) return;
  try {
    const formattedAmount = data.amount
      ? `$${(data.amount / 100).toFixed(2)} ${(data.currency || 'USD').toUpperCase()}`
      : '已支付';
    const sponsorName = data.name?.trim() ? data.name.trim() : '匿名支持者';
    const sponsorMsg = data.message?.trim() ? data.message.trim() : '（支持作者，感谢创作！）';
    const location = data.country ? data.country : 'GLOBAL';
    const nowStr = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    });

    const text = [
      `🎉 *收到新的博客赞赏与寄语祝福 (EpoCanvas)*`,
      `━━━━━━━━━━━━━━━━━━`,
      `💰 *赞赏金额*: \`${formattedAmount}\` *(支付已完成 ✓)*`,
      `👤 *赞赏者*: *${sponsorName.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')}*`,
      `💬 *寄语祝福*: ${sponsorMsg.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')}`,
      `🌍 *地区 / IP*: \`${location}\` (${data.ip || 'Unknown'})`,
      `💳 *支付通道*: Stripe Checkout`,
      `🆔 *订单标识*: \`${data.id || 'N/A'}\``,
      `🕒 *完成时间*: \`${nowStr}\``,
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

async function updateD1Record(
  db: any,
  data: {
    id: string;
    amount?: number;
    currency?: string;
    name?: string;
    message?: string;
    country?: string;
    ip?: string;
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
      )
      .run();

    await db
      .prepare(
        `INSERT OR REPLACE INTO sponsorships (id, amount, currency, name, message, country, ip, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
      )
      .bind(
        data.id || `sp_${Date.now()}`,
        (data.amount || 500) / 100,
        (data.currency || 'USD').toUpperCase(),
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

export async function onRequest(context: { request: Request; env: AppEnv }): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, env, { ok: false, error: 'Method Not Allowed' }, { status: 405 });
  }

  const payload = await safeReadJson<BlessingPayload>(request);
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  const country = payload?.country || request.headers.get('cf-ipcountry') || 'GLOBAL';

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
    id: payload?.id,
    amount: payload?.amount,
    currency: payload?.currency || 'USD',
    name: payload?.name,
    message: payload?.message,
    country,
    ip: clientIp,
  }).catch(() => {});

  if (env.DB) {
    updateD1Record(env.DB, {
      id: payload?.id || `sp_${Date.now()}`,
      amount: payload?.amount,
      currency: payload?.currency || 'USD',
      name: payload?.name,
      message: payload?.message,
      country,
      ip: clientIp,
    }).catch(() => {});
  }

  return jsonResponse(request, env, {
    ok: true,
    message: 'Blessing recorded and notified successfully',
  });
}
