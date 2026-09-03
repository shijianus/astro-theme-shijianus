/**
 * Telegram 赞赏消息通知配置与模板引擎 (Cloudflare Functions / Worker 端)
 * 
 * 严格发送时机准则：
 * 1. 严禁在支付完成前（出现 class="flex-1 overflow-y-auto" 成功阶段前）发送任何 Telegram 消息。
 * 2. 赞赏完成并进入寄语阶段后，严格在 class="flex-1 overflow-y-auto" 关闭的瞬间触发发送。
 * 3. 关闭包括：
 *    - 人为自然关闭（填写/未填写寄语后点击发送或完成、点击 X 关闭、点击遮罩、按 Esc 关闭）
 *    - 非自然关闭（刷新页面、关闭浏览器标签、断网等 unload 事件）
 *    - 30分钟兜底超时（用户停留超过 30min 未操作）
 */

export interface TelegramBlessingPayload {
  id?: string;
  amount?: number;
  currency?: string;
  name?: string;
  message?: string;
  country?: string;
  ip?: string;
  paymentMethod?: string;
  trigger?: 'form_submitted' | 'modal_closed' | 'page_unload' | 'idle_timeout_30m' | 'external_return' | string;
  completedAt?: string | Date;
}

export const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
  'pyg', 'rwf', 'ugx', 'vnd', 'xaf', 'xof', 'xpf'
]);

export interface TelegramConfig {
  enabled: boolean;
  timeZone: string;
  timeZoneLabel: string;
  defaults: {
    anonymousName: string;
    defaultBlessing: string;
    defaultCountry: string;
    defaultPaymentChannel: string;
  };
  triggerLabels: Record<string, string>;
  template: {
    title: string;
    divider: string;
    labels: {
      amount: string;
      sponsor: string;
      blessing: string;
      locationIp: string;
      channel: string;
      orderId: string;
      completionTime: string;
      triggerReason: string;
    };
  };
}

export const telegramConfig: TelegramConfig = {
  enabled: true,
  timeZone: 'America/Los_Angeles',
  timeZoneLabel: 'PST',
  defaults: {
    anonymousName: '匿名支持者',
    defaultBlessing: '（支持作者，感谢创作！）',
    defaultCountry: 'GLOBAL',
    defaultPaymentChannel: 'Stripe Checkout (Cards / Apple Pay / Google Pay / Link)',
  },
  triggerLabels: {
    form_submitted: '用户提交寄语并完成 (form_submitted)',
    modal_closed: '模态框手动关闭触发 (modal_closed)',
    page_unload: '页面卸载/刷新拦截触发 (page_unload)',
    idle_timeout_30m: '30分钟兜底超时自动发送 (idle_timeout_30m)',
    external_return: '外部重定向返回确认 (external_return)',
  },
  template: {
    title: '🎉 <b>收到赞赏者的寄语祝福</b>',
    divider: '━━━━━━━━━━━━━━━━━━',
    labels: {
      amount: '💰 <b>赞赏金额</b>',
      sponsor: '👤 <b>赞赏者</b>',
      blessing: '💬 <b>寄语祝福</b>',
      locationIp: '🌍 <b>地区 / IP</b>',
      channel: '💳 <b>支付通道</b>',
      orderId: '🆔 <b>订单标识</b>',
      completionTime: '🕒 <b>完成时间</b>',
      triggerReason: '⚡️ <b>触发机制</b>',
    },
  },
};

export function sanitizeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 将时间转换为美国太平洋时间 (Pacific Time)，并标注 PST / PDT
 */
export function formatPacificTime(dateInput?: string | Date): string {
  const d = dateInput instanceof Date ? dateInput : (dateInput ? new Date(dateInput) : new Date());
  try {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: telegramConfig.timeZone || 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const dateStr = formatter.format(d).replace(/\//g, '-');
    return `${dateStr} ${telegramConfig.timeZoneLabel || 'PST'}`;
  } catch {
    return `${d.toISOString()} (UTC)`;
  }
}

/**
 * 格式化金额
 */
export function formatAmount(amount?: number, currency: string = 'usd'): string {
  const cur = (currency || 'usd').toLowerCase();
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '已支付 ✓';
  }
  if (ZERO_DECIMAL_CURRENCIES.has(cur)) {
    return `${amount} ${cur.toUpperCase()}`;
  }
  return `$${(amount / 100).toFixed(2)} ${cur.toUpperCase()}`;
}

/**
 * 构造 Telegram HTML 消息内容（包含所有必备字段）
 */
export function buildTelegramBlessingMessage(
  data: TelegramBlessingPayload,
  customConfig?: Partial<TelegramConfig>
): string {
  const cfg = { ...telegramConfig, ...customConfig };
  
  const formattedAmount = formatAmount(data.amount, data.currency);
  const sponsorName = sanitizeHtml(
    data.name?.trim() ? data.name.trim() : cfg.defaults.anonymousName
  );
  const sponsorBlessing = sanitizeHtml(
    data.message?.trim() ? data.message.trim() : cfg.defaults.defaultBlessing
  );
  const location = sanitizeHtml(data.country?.trim() ? data.country.trim() : cfg.defaults.defaultCountry);
  const clientIp = sanitizeHtml(data.ip?.trim() ? data.ip.trim() : 'Unknown');
  const payChannel = sanitizeHtml(
    data.paymentMethod?.trim() ? data.paymentMethod.trim() : cfg.defaults.defaultPaymentChannel
  );
  const orderId = sanitizeHtml(data.id?.trim() ? data.id.trim() : 'N/A');
  const pstTime = formatPacificTime(data.completedAt);
  
  const rawTrigger = data.trigger || 'modal_closed';
  const triggerText = sanitizeHtml(cfg.triggerLabels[rawTrigger] || rawTrigger);

  const lines = [
    cfg.template.title,
    cfg.template.divider,
    `${cfg.template.labels.amount}: <code>${formattedAmount}</code> <i>(支付已完成 ✓)</i>`,
    `${cfg.template.labels.sponsor}: <b>${sponsorName}</b>`,
    `${cfg.template.labels.blessing}: ${sponsorBlessing}`,
    `${cfg.template.labels.locationIp}: <code>${location}</code> (${clientIp})`,
    `${cfg.template.labels.channel}: ${payChannel}`,
    `${cfg.template.labels.orderId}: <code>${orderId}</code>`,
    `${cfg.template.labels.completionTime}: <code>${pstTime}</code>`,
    `${cfg.template.labels.triggerReason}: <code>${triggerText}</code>`,
    cfg.template.divider,
  ];

  return lines.join('\n');
}

/**
 * 发送 Telegram Bot 消息
 */
export async function sendTelegramNotification(
  token: string,
  chatId: string,
  data: TelegramBlessingPayload,
  customConfig?: Partial<TelegramConfig>
): Promise<{ ok: boolean; status: number; error?: string }> {
  if (!token || !chatId) {
    return { ok: false, status: 400, error: 'Telegram bot token or chat ID is missing' };
  }

  const messageText = buildTelegramBlessingMessage(data, customConfig);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Telegram API error:', res.status, errText);
      return { ok: false, status: res.status, error: errText };
    }

    return { ok: true, status: 200 };
  } catch (err: any) {
    console.error('Telegram notification request exception:', err);
    return { ok: false, status: 500, error: err?.message || 'Network exception' };
  }
}
