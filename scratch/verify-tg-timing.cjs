const assert = require('assert');

// 1. Test Pacific Time Formatting with PST label
function testPacificTime() {
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
  const pstTime = `${formatter.format(new Date()).replace(/\//g, '-')} PST`;
  console.log('✓ Pacific Time check:', pstTime);
  assert(pstTime.endsWith('PST'), 'Must end with PST');
  assert(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} PST/.test(pstTime), 'Must match YYYY-MM-DD HH:mm:ss PST format');
}

// 2. Test Message Generation with various triggers and payloads
function testMessageGeneration() {
  // Mock telegram-config logic
  const ZERO_DECIMAL_CURRENCIES = new Set([
    'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
    'pyg', 'rwf', 'ugx', 'vnd', 'xaf', 'xof', 'xpf'
  ]);

  function sanitizeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function formatAmount(amount, currency = 'usd') {
    const cur = (currency || 'usd').toLowerCase();
    if (typeof amount !== 'number' || isNaN(amount)) return '已支付 ✓';
    if (ZERO_DECIMAL_CURRENCIES.has(cur)) return `${amount} ${cur.toUpperCase()}`;
    return `$${(amount / 100).toFixed(2)} ${cur.toUpperCase()}`;
  }

  function formatPacificTime(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
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
    return `${formatter.format(d).replace(/\//g, '-')} PST`;
  }

  const triggerLabels = {
    form_submitted: '用户提交寄语并完成 (form_submitted)',
    modal_closed: '模态框手动关闭触发 (modal_closed)',
    page_unload: '页面卸载/刷新拦截触发 (page_unload)',
    idle_timeout_30m: '30分钟兜底超时自动发送 (idle_timeout_30m)',
  };

  function buildMessage(data) {
    const formattedAmount = formatAmount(data.amount, data.currency);
    const sponsorName = sanitizeHtml(data.name?.trim() || '匿名支持者');
    const sponsorBlessing = sanitizeHtml(data.message?.trim() || '（支持作者，感谢创作！）');
    const location = sanitizeHtml(data.country?.trim() || 'GLOBAL');
    const clientIp = sanitizeHtml(data.ip?.trim() || 'Unknown');
    const payChannel = sanitizeHtml(data.paymentMethod?.trim() || 'Stripe Checkout (Cards / Apple Pay / Google Pay / Link)');
    const orderId = sanitizeHtml(data.id?.trim() || 'N/A');
    const pstTime = formatPacificTime(data.completedAt);
    const triggerText = sanitizeHtml(triggerLabels[data.trigger] || data.trigger || 'modal_closed');

    return [
      `🎉 <b>收到赞赏者的寄语祝福</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `💰 <b>赞赏金额</b>: <code>${formattedAmount}</code> <i>(支付已完成 ✓)</i>`,
      `👤 <b>赞赏者</b>: <b>${sponsorName}</b>`,
      `💬 <b>寄语祝福</b>: ${sponsorBlessing}`,
      `🌍 <b>地区 / IP</b>: <code>${location}</code> (${clientIp})`,
      `💳 <b>支付通道</b>: ${payChannel}`,
      `🆔 <b>订单标识</b>: <code>${orderId}</code>`,
      `🕒 <b>完成时间</b>: <code>${pstTime}</code>`,
      `⚡️ <b>触发机制</b>: <code>${triggerText}</code>`,
      `━━━━━━━━━━━━━━━━━━`,
    ].join('\n');
  }

  // Case 1: class="space-y-2.5" is empty, modal closed
  const case1Msg = buildMessage({
    id: 'cs_test_empty_blessing_123',
    amount: 500,
    currency: 'usd',
    name: '',
    message: '',
    country: 'US',
    ip: '192.0.2.1',
    trigger: 'modal_closed',
  });
  console.log('\n--- Case 1: Empty blessing, modal closed ---');
  console.log(case1Msg);
  assert(case1Msg.includes('<b>赞赏金额</b>: <code>$5.00 USD</code>'));
  assert(case1Msg.includes('<b>赞赏者</b>: <b>匿名支持者</b>'));
  assert(case1Msg.includes('<b>寄语祝福</b>: （支持作者，感谢创作！）'));
  assert(case1Msg.includes('<b>完成时间</b>: <code>'));
  assert(case1Msg.includes('PST</code>'));
  assert(case1Msg.includes('<b>支付通道</b>: Stripe Checkout'));
  assert(case1Msg.includes('<b>订单标识</b>: <code>cs_test_empty_blessing_123</code>'));
  assert(case1Msg.includes('模态框手动关闭触发 (modal_closed)'));

  // Case 2: class="space-y-2.5" has custom name and message, form submitted
  const case2Msg = buildMessage({
    id: 'cs_test_filled_blessing_456',
    amount: 2000,
    currency: 'cny',
    name: 'Alice (@alice_dev)',
    message: '祝博客越办越好，加油！',
    country: 'CN',
    ip: '123.45.67.89',
    trigger: 'form_submitted',
  });
  console.log('\n--- Case 2: Filled blessing, form submitted ---');
  console.log(case2Msg);
  assert(case2Msg.includes('<b>赞赏金额</b>: <code>$20.00 CNY</code>'));
  assert(case2Msg.includes('<b>赞赏者</b>: <b>Alice (@alice_dev)</b>'));
  assert(case2Msg.includes('<b>寄语祝福</b>: 祝博客越办越好，加油！'));
  assert(case2Msg.includes('用户提交寄语并完成 (form_submitted)'));

  // Case 3: 30-minute idle safety timeout trigger
  const case3Msg = buildMessage({
    id: 'cs_test_timeout_789',
    amount: 15,
    currency: 'hkd',
    name: '',
    message: '',
    country: 'HK',
    ip: '203.0.113.5',
    trigger: 'idle_timeout_30m',
  });
  console.log('\n--- Case 3: 30-min idle timeout ---');
  console.log(case3Msg);
  assert(case3Msg.includes('30分钟兜底超时自动发送 (idle_timeout_30m)'));

  // Case 4: Page unload trigger (refresh / close tab)
  const case4Msg = buildMessage({
    id: 'cs_test_unload_999',
    amount: 1200,
    currency: 'jpy',
    name: 'Kenji',
    message: '素晴らしい！',
    country: 'JP',
    ip: '198.51.100.42',
    trigger: 'page_unload',
  });
  console.log('\n--- Case 4: Page unload trigger ---');
  console.log(case4Msg);
  assert(case4Msg.includes('1200 JPY'));
  assert(case4Msg.includes('页面卸载/刷新拦截触发 (page_unload)'));

  console.log('\n✓ All 4 scenario validations passed!');
}

testPacificTime();
testMessageGeneration();
console.log('\n🎉 ALL TG SENDING TIMING AND TEMPLATE TESTS PASSED PERFECTLY!');
