/**
 * Telegram 赞赏通知核心配置与格式化规范 (Telegram Reward Notification Configuration)
 * 
 * 严格发送时机准则：
 * 1. 严禁在支付完成前（出现 class="flex-1 overflow-y-auto" 成功阶段前）发送任何 Telegram 消息。
 * 2. 赞赏完成并进入寄语阶段后，严格在 class="flex-1 overflow-y-auto" 关闭的瞬间触发发送。
 * 3. 关闭包括：
 *    - 人为自然关闭（填写/未填写寄语后点击发送或完成、点击 X 关闭、点击遮罩、按 Esc 关闭）
 *    - 非自然关闭（刷新页面、关闭浏览器标签、断网等 unload 事件）
 *    - 30分钟兜底超时（用户停留超过 30min 未操作）
 */

export interface TelegramNotificationConfig {
  /** 是否启用 Telegram 通知 */
  enabled: boolean;
  /** 默认时区（以美国太平洋时间 America/Los_Angeles 为准） */
  timeZone: string;
  /** 时区显示标注 */
  timeZoneLabel: string;
  /** 兜底超时时间（分钟，默认 30 分钟） */
  idleTimeoutMinutes: number;
  /** 默认占位文案 */
  defaults: {
    /** 未填写称呼时的赞赏者默认称呼 */
    anonymousName: string;
    /** 未填写祝福时的默认寄语 */
    defaultBlessing: string;
    /** 默认地区 */
    defaultCountry: string;
    /** 默认支付通道 */
    defaultPaymentChannel: string;
  };
  /** 触发关闭机制中文标签映射 */
  triggerLabels: Record<string, string>;
  /** 消息模板配置 */
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

export const telegramNotificationConfig: TelegramNotificationConfig = {
  enabled: true,
  timeZone: 'America/Los_Angeles',
  timeZoneLabel: 'PST',
  idleTimeoutMinutes: 30,
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

export default telegramNotificationConfig;
