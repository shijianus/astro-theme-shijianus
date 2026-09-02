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
    const sponsorName = sanitizeHtml(data.name?.trim() ? data.name.trim() : '匿名支持者');
    const sponsorMsg = sanitizeHtml(data.message?.trim() ? data.message.trim() : '（支持作者，感谢创作！）');
    const location = sanitizeHtml(data.country ? data.country : 'GLOBAL');
    const clientIp = sanitizeHtml(data.ip || 'Unknown');
    const nowStr = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    });

    const text = [
      `🎉 <b>收到赞赏者的寄语祝福</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `💰 <b>赞赏金额</b>: <code>${formattedAmount}</code> <i>(支付已完成 ✓)</i>`,
      `👤 <b>赞赏者</b>: <b>${sponsorName}</b>`,
      `💬 <b>寄语祝福</b>: ${sponsorMsg}`,
      `🌍 <b>地区 / IP</b>: <code>${location}</code> (${clientIp})`,
      `💳 <b>支付通道</b>: Stripe Checkout`,
      `🆔 <b>订单标识</b>: <code>${sanitizeHtml(data.id || 'N/A')}</code>`,
      `🕒 <b>完成时间</b>: <code>${nowStr}</code>`,
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
      console.error('Telegram blessing send error:', res.status, errText);
    }
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
      )
      .run();

    await db
      .prepare(
        `INSERT OR REPLACE INTO sponsorships (id, amount, currency, name, message, country, ip, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)`,
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

  // MUST AWAIT so Cloudflare Pages worker does not terminate beforehand!
  await notifyTelegramBot(tgToken, tgChatId, {
    id: payload?.id,
    amount: payload?.amount,
    currency: payload?.currency || 'USD',
    name: payload?.name,
    message: payload?.message,
    country,
    ip: clientIp,
  });

  if (env.DB) {
    await updateD1Record(env.DB, {
      id: payload?.id || `sp_${Date.now()}`,
      amount: payload?.amount,
      currency: payload?.currency || 'USD',
      name: payload?.name,
      message: payload?.message,
      country,
      ip: clientIp,
    });
  }

  return jsonResponse(request, env, {
    ok: true,
    message: 'Blessing recorded and notified successfully',
  });
}
