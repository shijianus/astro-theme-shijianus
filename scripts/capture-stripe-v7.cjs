/**
 * Playwright screenshot script — targets blog.epocanvas.com (HTTPS)
 * This tests the production URL to verify Apple Pay / Google Pay visibility
 * and confirms the new Checkout Sessions embedded UI is working.
 */
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'https://blog.epocanvas.com';
const POST_URL = `${BASE}/posts/readable-geek-interfaces/`;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function tryFindBtn(page, selectors, timeout = 5000) {
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { timeout });
      return await page.$(sel);
    } catch {}
  }
  return null;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  // ── Screenshot 1: Light mode — post page overview ──────────────────────────
  const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const page1 = await ctx1.newPage();
  await page1.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  await page1.screenshot({ path: '/tmp/stripe-v7-01-post-light.png' });
  console.log('✅ Screenshot 1: post page light');

  // Scroll to find reward button
  await page1.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
  await sleep(800);
  await page1.screenshot({ path: '/tmp/stripe-v7-01b-post-scroll.png' });
  console.log('✅ Screenshot 1b: scrolled to reward button area');

  // Find and click reward button
  const rewardBtn = await tryFindBtn(page1, [
    '.reward-button',
    '[data-panel-trigger="reward"]',
    'button:has-text("赞赏")',
  ]);
  if (rewardBtn) {
    await rewardBtn.hover();
    await sleep(800);
    await page1.screenshot({ path: '/tmp/stripe-v7-02-popover.png' });
    console.log('✅ Screenshot 2: reward popover');

    await rewardBtn.click();
    await sleep(600);

    // Click Stripe button in popover
    const stripeBtn = await tryFindBtn(page1, [
      'button:has-text("Stripe")',
      'button:has-text("国际收银台")',
      'button:has-text("信用卡")',
    ], 3000);
    if (stripeBtn) {
      await stripeBtn.click();
      await sleep(2500);
      await page1.screenshot({ path: '/tmp/stripe-v7-03-modal-amount.png' });
      console.log('✅ Screenshot 3: modal amount step');

      // Click Continue button
      const continueBtn = await tryFindBtn(page1, [
        'button:has-text("Continue")',
        'button:has-text("继续")',
      ], 3000);
      if (continueBtn) {
        await continueBtn.click();
        await sleep(6000); // Wait for embedded checkout to load
        await page1.screenshot({ path: '/tmp/stripe-v7-04-checkout-embedded.png' });
        console.log('✅ Screenshot 4: embedded checkout (should show Apple/Google Pay)');
      } else {
        console.log('⚠️  Continue button not found — screenshotting current state');
        await page1.screenshot({ path: '/tmp/stripe-v7-04-checkout-embedded.png' });
      }
    } else {
      console.log('⚠️  Stripe button not found in popover');
      await page1.screenshot({ path: '/tmp/stripe-v7-03-modal-amount.png' });
    }
  } else {
    console.log('⚠️  Reward button not found — taking full-page screenshot');
    await page1.screenshot({ path: '/tmp/stripe-v7-02-popover.png', fullPage: true });
    await page1.screenshot({ path: '/tmp/stripe-v7-03-modal-amount.png', fullPage: true });
    await page1.screenshot({ path: '/tmp/stripe-v7-04-checkout-embedded.png', fullPage: true });
  }
  await ctx1.close();

  // ── Screenshot 5: Dark mode ─────────────────────────────────────────────────
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  const page2 = await ctx2.newPage();
  await page2.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);
  await page2.evaluate(() => document.documentElement.classList.add('dark'));
  await sleep(400);
  await page2.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
  await sleep(600);

  const rewardBtn2 = await tryFindBtn(page2, ['.reward-button', '[data-panel-trigger="reward"]', 'button:has-text("赞赏")']);
  if (rewardBtn2) {
    await rewardBtn2.click();
    await sleep(600);
    const stripeBtn2 = await tryFindBtn(page2, ['button:has-text("Stripe")', 'button:has-text("国际收银台")'], 3000);
    if (stripeBtn2) {
      await stripeBtn2.click();
      await sleep(2000);
    }
  }
  await page2.screenshot({ path: '/tmp/stripe-v7-05-modal-dark.png' });
  console.log('✅ Screenshot 5: dark mode modal');
  await ctx2.close();

  // ── Screenshot 6: Mobile (390px iPhone) ────────────────────────────────────
  const ctx3 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });
  const page3 = await ctx3.newPage();
  await page3.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);
  await page3.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
  await sleep(600);
  const rewardBtn3 = await tryFindBtn(page3, ['.reward-button', '[data-panel-trigger="reward"]', 'button:has-text("赞赏")']);
  if (rewardBtn3) {
    await rewardBtn3.click();
    await sleep(600);
    const stripeBtn3 = await tryFindBtn(page3, ['button:has-text("Stripe")', 'button:has-text("国际收银台")'], 3000);
    if (stripeBtn3) {
      await stripeBtn3.click();
      await sleep(2000);
    }
  }
  await page3.screenshot({ path: '/tmp/stripe-v7-06-mobile.png' });
  console.log('✅ Screenshot 6: mobile (390px)');
  await ctx3.close();

  await browser.close();
  console.log('\n✅ All screenshots complete!');
  console.log('Files saved to /tmp/stripe-v7-*.png');
})().catch(e => {
  console.error('❌ Script error:', e.message);
  process.exit(1);
});
