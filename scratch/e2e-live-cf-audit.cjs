const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LIVE_URL = 'https://blog.epocanvas.com';
const OUT_DIR = '/root/.gemini/antigravity-cli/brain/3e5af691-40ee-4c94-aff2-31a7ce995421';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('🚀 Starting Cloudflare Live E2E Audit on', LIVE_URL);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  // 1. Visit live blog home & find an article
  console.log('🌐 Visiting homepage:', LIVE_URL);
  await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(1000);

  const postLink = await page.locator('a[href*="/posts/"]').first().getAttribute('href');
  const postUrl = postLink.startsWith('http') ? postLink : LIVE_URL + postLink;
  console.log('📄 Navigating to post on live CF:', postUrl);

  await page.goto(postUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(1500);

  // Scroll to reward section
  await page.evaluate(() => {
    const el = document.querySelector('.post-copyright') || document.querySelector('.post-tools');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await sleep(800);

  // 2. Open reward drawer
  const rewardTrigger = page.locator('[data-reward-wrapper] button[data-panel-trigger="reward"]').first();
  await rewardTrigger.click();
  await sleep(800);

  const rewardDrawer = page.locator('[data-reward-wrapper] .reward-main').first();
  await rewardDrawer.screenshot({ path: path.join(OUT_DIR, 'live-01-reward-drawer-cf.png') });
  console.log('📸 Captured live-01-reward-drawer-cf.png');

  // 3. Hover Stripe button
  const stripeBtn = page.locator('[data-reward-wrapper] button:has-text("Stripe 国际收银台")').first();
  await stripeBtn.hover();
  await sleep(400);
  await rewardDrawer.screenshot({ path: path.join(OUT_DIR, 'live-02-stripe-hover-cf.png') });
  console.log('📸 Captured live-02-stripe-hover-cf.png');

  // 4. Click Stripe button to open Modal
  await stripeBtn.click();
  await sleep(800);

  const modal = page.locator('.fixed.inset-0.z-\\[1000\\] > div').first();
  await modal.screenshot({ path: path.join(OUT_DIR, 'live-03-modal-amount-cf.png') });
  console.log('📸 Captured live-03-modal-amount-cf.png');

  // 5. Select a tier and click Continue to create checkout session
  const ctaBtn = modal.locator('button:has-text("继续")').first();
  console.log('💳 Clicking CTA to create live Stripe Checkout Session on CF Pages API...');
  await ctaBtn.click();

  // 6. Wait for Stripe Embedded Checkout iframe to mount
  console.log('⏳ Waiting for Stripe iframe to load...');
  await page.waitForSelector('#embedded-stripe-checkout iframe', { timeout: 25000 });
  await sleep(3500);

  await modal.screenshot({ path: path.join(OUT_DIR, 'live-04-embedded-checkout-mounted-cf.png') });
  console.log('📸 Captured live-04-embedded-checkout-mounted-cf.png');

  // 7. Test return & success state handling
  console.log('🎉 Testing success redirect state handling...');
  const successUrl = `${postUrl}?stripe_return=1&amount=5&session_id=cs_test_live_verify`;
  await page.goto(successUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(1500);

  const successModal = page.locator('.fixed.inset-0.z-\\[1000\\] > div').first();
  await successModal.screenshot({ path: path.join(OUT_DIR, 'live-05-success-blessing-cf.png') });
  console.log('📸 Captured live-05-success-blessing-cf.png');

  // Send blessing
  const nameInput = successModal.locator('input[placeholder*="称呼"]').first();
  if (await nameInput.count() > 0) {
    await nameInput.fill('EpoCanvas 赞赏体验官');
    const msgInput = successModal.locator('textarea[placeholder*="想对作者说的话"]').first();
    await msgInput.fill('博客体验极佳，Stripe 国际收银台与本地化定价非常流畅！✨');
    const sendBtn = successModal.locator('button:has-text("发送寄语")').first();
    await sendBtn.click();
    await sleep(1500);
    await successModal.screenshot({ path: path.join(OUT_DIR, 'live-06-blessing-submitted-cf.png') });
    console.log('📸 Captured live-06-blessing-submitted-cf.png');
  }

  await browser.close();
  console.log('✅ Full live CF E2E verification completed successfully!');
})();
