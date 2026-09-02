/**
 * Playwright audit against live production: https://blog.epocanvas.com
 */
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'https://blog.epocanvas.com';
const POST_URL = `${BASE}/posts/readable-geek-interfaces/`;
const OUT = '/tmp/prod-audit';

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function tryFind(page, selectors, timeout = 6000) {
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { timeout });
      const el = await page.$(sel);
      if (el) return el;
    } catch {}
  }
  return null;
}

(async () => {
  console.log('🚀 Running Playwright audit against PRODUCTION:', POST_URL);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  // 1. Light Mode Production
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(4000);

  // Scroll to reward button
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.75));
  await sleep(1000);

  const rewardBtn = await tryFind(page, ['.reward-button', 'button:has-text("赞赏")']);
  if (rewardBtn) {
    await rewardBtn.scrollIntoViewIfNeeded();
    await rewardBtn.hover();
    await sleep(500);
    await rewardBtn.click();
    await sleep(800);

    const stripeBtn = await tryFind(page, ['button:has-text("Stripe")', 'button:has-text("国际收银台")'], 4000);
    if (stripeBtn) {
      await stripeBtn.click();
      await sleep(2500);
      await page.screenshot({ path: `${OUT}/prod-01-amount.png` });
      console.log('✅ prod-01-amount.png');

      const continueBtn = await tryFind(page, ['button:has-text("继续")', 'button:has-text("Continue")'], 3000);
      if (continueBtn) {
        await continueBtn.click();
        console.log('Clicked Continue in production, waiting for Stripe iframe...');
        try {
          await page.waitForSelector('iframe', { timeout: 25000 });
          await sleep(5000);
        } catch {
          await sleep(15000);
        }
        await page.screenshot({ path: `${OUT}/prod-02-checkout.png` });
        console.log('✅ prod-02-checkout.png');
      }
    }
  }

  // 2. Dark Mode Production
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await sleep(500);
  await page.screenshot({ path: `${OUT}/prod-03-dark.png` });
  console.log('✅ prod-03-dark.png');

  await ctx.close();
  await browser.close();

  console.log('🎉 Production Playwright audit complete!');
})().catch(e => {
  console.error('❌ Production audit error:', e.message);
});
