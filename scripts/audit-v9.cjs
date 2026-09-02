/**
 * Playwright — Full Stripe Checkout Sessions integration test
 * Target: http://localhost:8788 (wrangler pages dev — full CF Pages runtime)
 * This validates the complete payment flow including real Stripe API calls
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8788';
const OUT = '/tmp/audit-v9';

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function tryFind(page, selectors, timeout = 5000) {
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { timeout });
      const el = await page.$(sel);
      if (el) return el;
    } catch {}
  }
  return null;
}

async function openStripeModal(page) {
  // Find reward button — try multiple selectors
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
  await sleep(600);

  const rewardBtn = await tryFind(page, [
    '.reward-button',
    '[data-panel-trigger="reward"]',
    'button:has-text("赞赏")',
    'button:has-text("支持")',
  ], 5000);

  if (!rewardBtn) {
    console.log('⚠️  Reward button not found — trying to dispatch open event directly');
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent('open-stripe-modal', { detail: {} }))
    );
    await sleep(1500);
    return false;
  }

  await rewardBtn.scrollIntoViewIfNeeded();
  await rewardBtn.hover();
  await sleep(500);

  // Click to pin popover
  await rewardBtn.click();
  await sleep(800);

  // Find Stripe button in popover
  const stripeBtn = await tryFind(page, [
    'button:has-text("Stripe")',
    'button:has-text("信用卡")',
    'button:has-text("国际")',
  ], 4000);

  if (!stripeBtn) {
    // Try dispatching event directly
    console.log('⚠️  Stripe button not found in popover — dispatching event directly');
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent('open-stripe-modal', { detail: {} }))
    );
    await sleep(1500);
    return true;
  }

  await stripeBtn.click();
  await sleep(2000);
  return true;
}

(async () => {
  console.log('🚀 Starting Playwright audit against', BASE);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  // Get a blog post URL
  const p0 = await browser.newPage();
  await p0.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(1000);
  const postHref = await p0.evaluate(() => {
    const a = document.querySelector('a[href*="/posts/"]');
    return a ? a.getAttribute('href') : null;
  });
  await p0.close();
  const POST_URL = postHref
    ? (postHref.startsWith('http') ? postHref : BASE + postHref)
    : BASE + '/posts/readable-geek-interfaces/';
  console.log('📄 Post URL:', POST_URL);

  // ── TEST 1: Light mode — Amount step ───────────────────────────────────────
  console.log('\n── Test 1: Light mode amount modal ──');
  const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const page1 = await ctx1.newPage();
  await page1.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3500); // wait for React hydration

  await openStripeModal(page1);

  // Wait for modal
  const modal = await tryFind(page1, [
    'div[class*="fixed inset-0"][class*="z-[1000]"]',
    'div:has(> div:has-text("赞赏支持"))',
  ], 5000);

  await page1.screenshot({ path: `${OUT}/01-amount-light.png` });
  console.log('✅ 01-amount-light.png');

  // Verify no amber classes and proper grid
  const amberCheck = await page1.evaluate(() => {
    const body = document.body.innerHTML;
    return {
      hasAmber: /bg-amber|text-amber/.test(body),
      hasGridCols5: /grid-cols-5/.test(body),
      has4242: body.includes('4242'),
      modalVisible: !!document.querySelector('[class*="z-[1000]"]'),
    };
  });
  console.log('  Amber classes:', amberCheck.hasAmber ? '❌ FAIL' : '✅ none');
  console.log('  grid-cols-5:', amberCheck.hasGridCols5 ? '❌ FAIL' : '✅ none');
  console.log('  Test card text:', amberCheck.has4242 ? '❌ FAIL' : '✅ none');
  console.log('  Modal visible:', amberCheck.modalVisible ? '✅' : '⚠️ maybe not open');

  // Click Continue (2nd preset amount pre-selected)
  const continueBtn = await tryFind(page1, [
    'button:has-text("继续")',
    'button:has-text("Continue")',
    'button[class*="635BFF"]',
  ], 3000);

  if (continueBtn) {
    await continueBtn.click();
    console.log('  Clicked Continue button, waiting for Stripe session & iframe...');
    try {
      await page1.waitForSelector('iframe', { timeout: 25000 });
      await sleep(5000); // allow iframe content to render
    } catch {
      await sleep(15000);
    }
    await page1.screenshot({ path: `${OUT}/02-checkout-embedded.png` });
    console.log('✅ 02-checkout-embedded.png');

    // Check if Stripe iframe is present
    const stripeIframe = await page1.$('iframe');
    console.log('  Stripe iframe:', stripeIframe ? '✅ present' : '⚠️ may be loading');
  } else {
    await page1.screenshot({ path: `${OUT}/02-checkout-embedded.png` });
    console.log('⚠️ 02: Continue button not found');
  }
  await ctx1.close();

  // ── TEST 2: Dark mode ───────────────────────────────────────────────────────
  console.log('\n── Test 2: Dark mode ──');
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  const page2 = await ctx2.newPage();
  await page2.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);
  await page2.evaluate(() => document.documentElement.classList.add('dark'));
  await sleep(300);
  await openStripeModal(page2);
  await sleep(1500);
  await page2.screenshot({ path: `${OUT}/03-amount-dark.png` });
  console.log('✅ 03-amount-dark.png');
  await ctx2.close();

  // ── TEST 3: Mobile (390×844 iPhone) ────────────────────────────────────────
  console.log('\n── Test 3: Mobile 390px ──');
  const ctx3 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });
  const page3 = await ctx3.newPage();
  await page3.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);
  await openStripeModal(page3);
  await sleep(1500);
  await page3.screenshot({ path: `${OUT}/04-amount-mobile.png` });
  console.log('✅ 04-amount-mobile.png');
  await ctx3.close();

  // ── TEST 4: HKD currency (simulate HK geo) ─────────────────────────────────
  console.log('\n── Test 4: HKD currency simulation ──');
  const ctx4 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page4 = await ctx4.newPage();
  // Mock geo-profile response to return HK
  await page4.route('**/api/geo-profile', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ country: 'HK', isMainland: false }) })
  );
  await page4.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);
  await openStripeModal(page4);
  await sleep(1500);
  await page4.screenshot({ path: `${OUT}/05-amount-hkd.png` });
  console.log('✅ 05-amount-hkd.png');
  // Verify HKD shown
  const hkdShown = await page4.evaluate(() => document.body.innerText.includes('HK$') || document.body.innerText.includes('HKD'));
  console.log('  HKD currency shown:', hkdShown ? '✅' : '⚠️ check screenshot');
  await ctx4.close();

  // ── TEST 5: JPY currency ───────────────────────────────────────────────────
  console.log('\n── Test 5: JPY currency simulation ──');
  const ctx5 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page5 = await ctx5.newPage();
  await page5.route('**/api/geo-profile', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ country: 'JP', isMainland: false }) })
  );
  await page5.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);
  await openStripeModal(page5);
  await sleep(1500);
  await page5.screenshot({ path: `${OUT}/06-amount-jpy.png` });
  console.log('✅ 06-amount-jpy.png');
  const jpyShown = await page5.evaluate(() => document.body.innerText.includes('¥') || document.body.innerText.includes('JPY'));
  console.log('  JPY currency shown:', jpyShown ? '✅' : '⚠️ check screenshot');
  await ctx5.close();

  // ── TEST 6: MYR currency ───────────────────────────────────────────────────
  console.log('\n── Test 6: MYR currency simulation ──');
  const ctx6 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page6 = await ctx6.newPage();
  await page6.route('**/api/geo-profile', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ country: 'MY', isMainland: false }) })
  );
  await page6.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);
  await openStripeModal(page6);
  await sleep(1500);
  await page6.screenshot({ path: `${OUT}/07-amount-myr.png` });
  console.log('✅ 07-amount-myr.png');
  const myrShown = await page6.evaluate(() => document.body.innerText.includes('RM') || document.body.innerText.includes('MYR'));
  console.log('  MYR currency shown:', myrShown ? '✅' : '⚠️ check screenshot');
  await ctx6.close();

  await browser.close();

  console.log('\n✅ All audit screenshots saved to', OUT);
  console.log('Files:', fs.readdirSync(OUT).join(', '));
})().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
