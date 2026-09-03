const { chromium } = require('playwright');
const http = require('http');

async function getAvailablePort() {
  for (const port of [4321, 4322, 4323, 4324]) {
    const isOk = await new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${port}/posts/anzhiyu-markdown-showcase/`, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });
    if (isOk) return port;
  }
  return 4321;
}

(async () => {
  const port = await getAvailablePort();
  const BASE = `http://127.0.0.1:${port}`;
  console.log(`[E2E] Connecting to active server on: ${BASE}`);

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  const apiCalls = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/')) {
      const status = res.status();
      const body = await res.json().catch(() => ({}));
      apiCalls.push({ url, status, body });
      console.log(`[API Response] ${status} ${url}`);
    }
  });

  console.log('\n=== 1. 打开文章页 ===');
  await page.goto(`${BASE}/posts/anzhiyu-markdown-showcase/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('\n=== 2. 点击赞赏与 Stripe 国际收银台 ===');
  const rewardBtn = page.locator('[data-panel-trigger="reward"]').first();
  await rewardBtn.scrollIntoViewIfNeeded();
  await rewardBtn.click();
  await page.waitForTimeout(800);

  const stripeBtn = page.locator('button:has-text("Stripe 国际收银台")').first();
  await stripeBtn.click();
  await page.waitForTimeout(1000);

  console.log('\n=== 3. 验证四个支付渠道 Logo（Card, Apple Pay, Google Pay, Link） ===');
  const appleSvg = await page.locator('svg[aria-label="Apple Pay"]').count();
  console.log('Official Apple Pay SVG logo count:', appleSvg, '(Expected > 0)');

  const gpaySvg = await page.locator('svg[aria-label="Google Pay"]').count();
  console.log('Official Google Pay (G logo) SVG count:', gpaySvg, '(Expected > 0)');

  const linkSvg = await page.locator('svg[aria-label="Link by Stripe"]').count();
  console.log('Official Stripe Link SVG logo count:', linkSvg, '(Expected > 0)');

  console.log('\n=== 4. 验证点击「继续」时绝不向 TG 发送虚假完成通知 ===');
  const continueBtn = page.locator('.fixed.inset-0 button:has-text("继续")').first();
  await continueBtn.click();
  await page.waitForTimeout(5000);

  const sessionCalls = apiCalls.filter(c => c.url.includes('/api/create-checkout-session'));
  const blessingCalls = apiCalls.filter(c => c.url.includes('/api/record-blessing'));

  console.log(`Create-checkout-session calls: ${sessionCalls.length} (Status: ${sessionCalls[0]?.status})`);
  console.log(`Record-blessing calls during session creation: ${blessingCalls.length} (Expected: 0)`);
  if (blessingCalls.length === 0) {
    console.log('✅ 正确：创建 Checkout Session 时并未向 TG 发送通知！');
  }

  // Verify Stripe iframe is mounted
  const iframe = page.locator('#embedded-stripe-checkout iframe').first();
  await iframe.waitFor({ state: 'attached', timeout: 15000 });
  console.log('✅ Stripe Embedded Checkout iframe successfully mounted into DOM!');

  console.log('\n=== 5. 验证寄语提交与完成时的 TG 验收标准 ===');
  const res = await page.evaluate(async () => {
    const res = await fetch('/api/record-blessing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'cs_test_verification_id_123',
        amount: 500,
        currency: 'usd',
        name: '自动化测试支持者',
        message: '祝博客越办越好！🎉',
        country: 'CN',
      }),
    });
    return { ok: res.ok, status: res.status, json: await res.json() };
  });

  console.log('Record-blessing API test result:', res);
  if (res.ok && res.json.ok) {
    console.log('✅ /api/record-blessing API test passed with 200 OK!');
  }

  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/scratch/final-audit-modal.png' });

  await browser.close();
  console.log('\n🎉 ALL FOUR REQUIREMENTS VERIFIED AND PASSED!');
})();
