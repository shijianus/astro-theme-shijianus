import type { AppEnv } from './types';
import { sanitizeHtml } from './telegram-config';

export interface FormSubmissionPayload {
  formId?: string;
  title?: string;
  name?: string;
  url?: string;
  avatar?: string;
  desc?: string;
  category?: string;
  contact?: string;
  source?: string;
  fields?: Record<string, any>;
  [key: string]: any;
}

export function formatPacificTime(date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return `${formatter.format(date).replace(/\//g, '-')} PST`;
  } catch {
    return `${date.toISOString()} (UTC)`;
  }
}

export async function sendFormTelegramNotification(
  env: AppEnv,
  payload: FormSubmissionPayload,
  clientIp = 'Unknown',
  geoCountry = 'GLOBAL'
): Promise<{ ok: boolean; error?: string }> {
  const token = env.TELEGRAM_BOT_TOKEN || (typeof process !== 'undefined' ? process.env?.TELEGRAM_BOT_TOKEN : '');
  const chatId = env.TELEGRAM_CHAT_ID || (typeof process !== 'undefined' ? process.env?.TELEGRAM_CHAT_ID : '');

  if (!token || !chatId) {
    console.warn('[FormNotify] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.');
    return { ok: false, error: 'Telegram credentials not configured' };
  }

  const isFriendApply = payload.formId === 'friend-link-apply' || payload.formId === 'friend_apply' || Boolean(payload.name && payload.url);
  const pstTime = formatPacificTime();
  const formTitle = payload.title || (isFriendApply ? '友邻互链申请' : '自定义表单提交');
  const formId = payload.formId || (isFriendApply ? 'friend-link-apply' : 'general-form');

  const lines: string[] = [];
  lines.push(`🤝 <b>${isFriendApply ? '收到新的友邻互链申请' : '收到新的表单回报通知'}</b>`);
  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`📋 <b>表单主题</b>: <code>${sanitizeHtml(formTitle)}</code> (<code>${sanitizeHtml(formId)}</code>)`);

  if (payload.name) {
    lines.push(`👤 <b>站点名称 / 申请人</b>: <b>${sanitizeHtml(payload.name)}</b>`);
  }
  if (payload.url) {
    const safeUrl = sanitizeHtml(payload.url);
    lines.push(`🔗 <b>站点地址</b>: <a href="${safeUrl}">${safeUrl}</a>`);
  }
  if (payload.avatar) {
    lines.push(`🖼 <b>头像图标</b>: <code>${sanitizeHtml(payload.avatar)}</code>`);
  }
  if (payload.category) {
    lines.push(`🏷 <b>意向分类</b>: <code>${sanitizeHtml(payload.category)}</code>`);
  }
  if (payload.desc) {
    lines.push(`📝 <b>站点描述</b>:\n<blockquote>${sanitizeHtml(payload.desc)}</blockquote>`);
  }
  if (payload.contact) {
    lines.push(`📬 <b>联系方式 / 附言</b>: <code>${sanitizeHtml(payload.contact)}</code>`);
  }

  // Any other custom fields in payload.fields
  if (payload.fields && typeof payload.fields === 'object') {
    for (const [key, val] of Object.entries(payload.fields)) {
      if (['name', 'url', 'avatar', 'category', 'desc', 'contact', 'formId', 'title', 'source'].includes(key)) continue;
      if (val !== undefined && val !== null && val !== '') {
        lines.push(`• <b>${sanitizeHtml(key)}</b>: ${sanitizeHtml(String(val))}`);
      }
    }
  }

  lines.push(`🌍 <b>请求来源 IP</b>: <code>${sanitizeHtml(clientIp)}</code> (${sanitizeHtml(geoCountry)})`);
  lines.push(`🕒 <b>提交时间</b>: <code>${pstTime}</code>`);
  if (payload.source) {
    lines.push(`⚡️ <b>交互来源</b>: <code>${sanitizeHtml(payload.source)}</code>`);
  }
  lines.push(`━━━━━━━━━━━━━━━━━━`);

  const text = lines.join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[FormNotify] Telegram error:', res.status, errText);
      return { ok: false, error: errText };
    }

    return { ok: true };
  } catch (err: any) {
    console.error('[FormNotify] Network error:', err);
    return { ok: false, error: err?.message || 'Network error' };
  }
}
