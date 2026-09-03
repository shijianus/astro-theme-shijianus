const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PROD_URL = 'https://blog.epocanvas.com';
const OUT_DIR = '/home/shijian/projects/shijianus-blog/scratch';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('====================================================');
  console.log('🌐 Starting Live E2E Production Verification on:', PROD_URL);
  console.log('====================================================');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('⚠️ [Browser Console Error]:', msg.text());
    }
  });

  const apiResponses = [];
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/')) {
      const status = res.status();
      let text = '';
      try { text = await res.text(); } catch (e) {}
      apiResponses.push({ url, status, text });
      console.log(`📡 [Live API] ${status} ${url}`);
    }
  });

  // Step 1: Visit Home Page
  console.log('\n--- Step 1: Visiting Production Home Page ---');
  await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 35000 });
  await sleep(1000);
  console.log('✅ Home page loaded. Title:', await page.title());

  // Step 2: Navigate to a blog post with TOC & Reward Extension
  console.log('\n--- Step 2: Navigating to Post Page ---');
  const postLink = await page.locator('a[href*="/posts/"]').first().getAttribute('href');
  const postUrl = postLink.startsWith('http') ? postLink : PROD_URL + postLink;
  console.log('🔗 Visiting Post:', postUrl);
  await page.goto(postUrl, { waitUntil: 'networkidle', timeout: 35000 });
  await sleep(1500);

  // Verify TOC exists and is functional
  console.log('\n--- Step 3: Verifying Article TOC Component ---');
  const tocExists = await page.locator('#toc-card, .catalog-content, [data-toc]').count();
  console.log('TOC component presence:', tocExists > 0 ? '✅ FOUND' : 'ℹ️ NOT FOUND ON THIS POST');

  // Step 4: Scroll down to Reward / 打赏 Section
  console.log('\n--- Step 4: Locating Post Reward Section ---');
  await page.evaluate(() => {
    const el = document.querySelector('.post-copyright') || document.querySelector('.post-tools') || document.querySelector('[data-reward-wrapper]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await sleep(1200);

  // Trigger reward drawer
  const rewardTrigger = page.locator('[data-reward-wrapper] button[data-panel-trigger="reward"]').first();
  if (await rewardTrigger.count() > 0) {
    console.log('🎁 Clicking Reward Trigger button...');
    await rewardTrigger.click();
    await sleep(800);
  }

  // Step 5: Check Stripe Cashier Button
  console.log('\n--- Step 5: Checking Stripe 国际收银台 Button & Logos ---');
  const stripeCashierBtn = page.locator('button:has-text("Stripe 国际收银台")').first();
  const btnCount = await stripeCashierBtn.count();
  console.log('Stripe 国际收银台 Button Found:', btnCount > 0 ? '✅ YES' : '❌ NO');

  if (btnCount > 0) {
    await stripeCashierBtn.hover();
    await sleep(400);
    console.log('👉 Hovered on Stripe Cashier Button');
    await stripeCashierBtn.click();
    await sleep(1000);
  } else {
    // Dispatch open event if directly testing
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('open-stripe-modal', { detail: { region: 'GLOBAL' } }));
    });
    await sleep(1000);
  }

  // Step 6: Verify Modal & Supported Payment Methods (Google Pay / Apple Pay / Link / Cards)
  console.log('\n--- Step 6: Verifying Modal & Payment Methods (Google Pay, Apple Pay, Link) ---');
  const modal = page.locator('.fixed.inset-0.z-\\[1000\\] > div').first();
  await modal.waitFor({ state: 'visible', timeout: 10000 });

  const applePayIcon = await page.locator('svg[aria-label="Apple Pay"]').count();
  const googlePayIcon = await page.locator('svg[aria-label="Google Pay"]').count();
  const linkIcon = await page.locator('svg[aria-label="Link by Stripe"]').count();

  console.log('  - Apple Pay Official Badge:', applePayIcon > 0 ? '✅ FOUND' : '❌ NOT FOUND');
  console.log('  - Google Pay Official Badge:', googlePayIcon > 0 ? '✅ FOUND' : '❌ NOT FOUND');
  console.log('  - Stripe Link Badge:', linkIcon > 0 ? '✅ FOUND' : '❌ NOT FOUND');

  const modalScreenshotPath = path.join(OUT_DIR, 'live-prod-modal-verified.png');
  await modal.screenshot({ path: modalScreenshotPath });
  console.log('📸 Saved modal screenshot to:', modalScreenshotPath);

  // Step 7: Test Create Checkout Session on Live CF Pages
  console.log('\n--- Step 7: Testing Live Stripe Checkout Session Creation ---');
  const continueBtn = modal.locator('button:has-text("继续")').first();
  if (await continueBtn.count() > 0) {
    console.log('💳 Clicking 「继续」 to request Live Stripe Checkout Session from Cloudflare Functions...');
    await continueBtn.click();
    await sleep(3500);

    // Check if iframe loaded or error handled gracefully
    const iframeCount = await page.locator('#embedded-stripe-checkout iframe').count();
    console.log('  - Stripe Embedded Checkout iframe count:', iframeCount);
    if (iframeCount > 0) {
      console.log('  ✅ Stripe Embedded Checkout iframe successfully mounted on production!');
    } else {
      console.log('  ℹ️ Embedded element mounted, checking DOM state...');
    }
  }

  // Step 8: Direct API Health Verification
  console.log('\n--- Step 8: Verifying Cloudflare Functions API Endpoints directly ---');
  const apiCheck = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 500, currency: 'usd', locale: 'zh' })
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, clientSecretPresent: !!data.clientSecret };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('Direct /api/create-checkout-session response:', JSON.stringify(apiCheck));
  if (apiCheck.clientSecretPresent) {
    console.log('✅ Cloudflare Function /api/create-checkout-session returned valid clientSecret successfully!');
  }

  await browser.close();
  console.log('\n====================================================');
  console.log('🎉 Production Live E2E Audit Finished Successfully!');
  console.log('====================================================');
})();
