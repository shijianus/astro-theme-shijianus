/**
 * E2E: 完整 Stripe 赞赏链路实测
 * 1. 打开文章页 → 点击「赞赏」→ 弹出扩展栏
 * 2. 点击「Stripe 国际收银台」→ RewardModal 金额步骤
 * 3. 选择金额 → 继续 → /api/create-checkout-session 返回 JSON clientSecret
 * 4. Stripe Embedded Checkout iframe 加载 → 填 4242 测试卡 → 支付
 * 5. 回跳 ?stripe_return=1 → 成功页 → 提交寄语 → /api/record-blessing
 */
const { chromium } = require('playwright');

const BASE = process.env.E2E_BASE || 'http://localhost:4321';
const POST_URL = `${BASE}/posts/anzhiyu-markdown-showcase/`;
const SHOT = (n) => `/home/shijian/projects/shijianus-blog/scratch/e2e-${n}.png`;

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'zh-CN' });
  const page = await ctx.newPage();

  const apiLog = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/')) {
      let body = '';
      try { body = (await res.text()).slice(0, 200); } catch {}
      apiLog.push(`${res.status()} ${url} :: ${body}`);
    }
  });
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));

  const step = (msg) => console.log(`\n=== ${msg} ===`);

  step('1. 打开文章页');
  await page.goto(POST_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  step('2. 点击「赞赏」按钮，固定扩展栏');
  const rewardBtn = page.locator('[data-panel-trigger="reward"]').first();
  await rewardBtn.scrollIntoViewIfNeeded();
  await rewardBtn.click();
  await page.waitForTimeout(800);

  step('3. 点击「Stripe 国际收银台」按钮');
  const stripeBtn = page.locator('button:has-text("Stripe 国际收银台")').first();
  await stripeBtn.waitFor({ state: 'visible', timeout: 5000 });
  await page.screenshot({ path: SHOT('01-popover') });
  await stripeBtn.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: SHOT('02-modal-amount') });

  step('4. 选择金额 $10，点击继续');
  await page.locator('button:has-text("$10")').first().click();
  await page.waitForTimeout(300);
  const continueBtn = page.locator('button:has-text("继续")').first();
  await continueBtn.click();

  step('5. 等待 checkout session 创建 + 嵌入收银台加载');
  // 等 Stripe iframe 出现
  const stripeFrame = page.frameLocator('#embedded-stripe-checkout iframe').first();
  await page.locator('#embedded-stripe-checkout iframe').first().waitFor({ state: 'attached', timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: SHOT('03-embedded-checkout') });

  step('6. 在 Stripe iframe 内填写测试卡 4242 4242 4242 4242');
  // Embedded checkout: 邮箱 / 卡号 / 有效期 / CVC / 姓名 / 邮编
  const emailInput = stripeFrame.locator('input[name="email"], input[type="email"], input#email').first();
  if (await emailInput.count()) { try { await emailInput.fill('e2e-test@epocanvas.com', { timeout: 5000 }); } catch {} }
  const cardNumber = stripeFrame.locator('input[name="cardNumber"], input#cardNumber, input[autocomplete="cc-number"]').first();
  await cardNumber.waitFor({ state: 'visible', timeout: 30000 });
  await cardNumber.fill('4242424242424242');
  await stripeFrame.locator('input[name="cardExpiry"], input#cardExpiry, input[autocomplete="cc-exp"]').first().fill('1230');
  await stripeFrame.locator('input[name="cardCvc"], input#cardCvc, input[autocomplete="cc-csc"]').first().fill('123');
  const nameField = stripeFrame.locator('input[name="billingName"], input[autocomplete="cc-name"], input#billingName').first();
  if (await nameField.count()) { try { await nameField.fill('E2E Tester', { timeout: 3000 }); } catch {} }
  const zip = stripeFrame.locator('input[name="postalCode"], input#billingPostalCode').first();
  if (await zip.count()) { try { await zip.fill('10001', { timeout: 3000 }); } catch {} }
  await page.screenshot({ path: SHOT('04-card-filled') });

  step('7. 提交支付');
  const payBtn = stripeFrame.locator('button[data-testid="hosted-payment-submit-button"], button[type="submit"]').last();
  await payBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT('04b-before-pay') });
  await payBtn.click();

  step('8. 等待支付完成 → 成功页（return_url 回跳后 URL 会被 replaceState 清理，故等待成功 UI）');
  await page.locator('text=赞赏成功').waitFor({ state: 'visible', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: SHOT('05-success') });

  step('9. 提交寄语');
  const nameInput = page.locator('input[placeholder*="称呼"]').first();
  await nameInput.waitFor({ state: 'visible', timeout: 10000 });
  await nameInput.fill('E2E 测试员');
  await page.locator('textarea[placeholder*="写下想对作者说的话"]').first().fill('自动化端到端测试寄语 ✅');
  await page.locator('button:has-text("发送寄语")').first().click();
  await page.locator('text=寄语已送达').waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: SHOT('06-blessing-done') });

  const blessingVisible = await page.locator('text=寄语已送达').count();
  console.log('\n寄语提交结果:', blessingVisible > 0 ? 'OK' : '未检测到确认文案');

  step('API 调用回放');
  apiLog.forEach((l) => console.log(l));

  await browser.close();
  console.log('\n✅ E2E 完成');
})().catch((e) => {
  console.error('\n❌ E2E 失败:', e.message);
  process.exit(1);
});
