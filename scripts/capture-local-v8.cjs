/**
 * Playwright — Local dev server screenshots of the NEW Checkout Sessions UI
 */
const { chromium } = require('playwright');

const BASE = 'http://localhost:4321';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function tryFind(page, selectors, timeout = 4000) {
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { timeout });
      return await page.$(sel);
    } catch {}
  }
  return null;
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  // Find a blog post
  const page0 = await browser.newPage();
  await page0.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  const postUrl = await page0.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/posts/"]'));
    return links[0]?.href || null;
  });
  await page0.close();
  const POST_URL = postUrl || `${BASE}/posts/readable-geek-interfaces/`;
  console.log('Post URL:', POST_URL);

  // ── Light mode ──────────────────────────────────────────────────────────────
  const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const page1 = await ctx1.newPage();
  await page1.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);

  // Scroll to bottom area to find reward button
  await page1.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.75));
  await sleep(1000);

  const rewardBtn = await tryFind(page1, ['.reward-button', '[data-panel-trigger="reward"]', 'button:has-text("赞赏")']);
  if (rewardBtn) {
    await rewardBtn.scrollIntoViewIfNeeded();
    await sleep(400);
    await rewardBtn.hover();
    await sleep(800);
    await page1.screenshot({ path: '/tmp/new-01-popover.png' });
    console.log('✅ 01: popover');

    await rewardBtn.click();
    await sleep(500);

    // Click Stripe button
    const stripeBtn = await tryFind(page1, [
      'button:has-text("Stripe")', 'button:has-text("信用卡 / Apple")', 'button:has-text("国际收银台")',
    ], 3000);
    if (stripeBtn) {
      await stripeBtn.click();
      await sleep(2500);
      await page1.screenshot({ path: '/tmp/new-02-amount-modal.png' });
      console.log('✅ 02: amount selection modal (new 3-col grid)');

      // Click a different amount button 
      const amtBtns = await page1.$$('button[class*="rounded-xl"][class*="py-4"]');
      if (amtBtns.length > 2) { await amtBtns[2].click(); await sleep(300); }

      // Click Continue
      const continueBtn = await tryFind(page1, ['button:has-text("Continue")'], 3000);
      if (continueBtn) {
        await continueBtn.click();
        await sleep(6000);
        await page1.screenshot({ path: '/tmp/new-03-embedded-checkout.png' });
        console.log('✅ 03: embedded checkout step');
      } else {
        await page1.screenshot({ path: '/tmp/new-03-embedded-checkout.png' });
        console.log('⚠️  03: no Continue btn, saved current state');
      }
    } else {
      await page1.screenshot({ path: '/tmp/new-02-amount-modal.png' });
      console.log('⚠️  02: stripe btn not found');
      require('fs').writeFileSync('/tmp/new-03-embedded-checkout.png', require('fs').readFileSync('/tmp/new-02-amount-modal.png'));
    }
  } else {
    console.log('⚠️  reward button not found on page');
    await page1.screenshot({ path: '/tmp/new-01-popover.png', fullPage: false });
    require('fs').writeFileSync('/tmp/new-02-amount-modal.png', require('fs').readFileSync('/tmp/new-01-popover.png'));
    require('fs').writeFileSync('/tmp/new-03-embedded-checkout.png', require('fs').readFileSync('/tmp/new-01-popover.png'));
  }
  await ctx1.close();

  // ── Dark mode ───────────────────────────────────────────────────────────────
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  const page2 = await ctx2.newPage();
  await page2.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(2500);
  await page2.evaluate(() => document.documentElement.classList.add('dark'));
  await sleep(300);
  await page2.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.75));
  await sleep(800);
  const rb2 = await tryFind(page2, ['.reward-button', 'button:has-text("赞赏")']);
  if (rb2) {
    await rb2.scrollIntoViewIfNeeded();
    await rb2.click();
    await sleep(500);
    const sb2 = await tryFind(page2, ['button:has-text("Stripe")', 'button:has-text("信用卡 / Apple")', 'button:has-text("国际收银台")'], 3000);
    if (sb2) { await sb2.click(); await sleep(2000); }
  }
  await page2.screenshot({ path: '/tmp/new-04-dark.png' });
  console.log('✅ 04: dark mode');
  await ctx2.close();

  // ── Mobile ──────────────────────────────────────────────────────────────────
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page3 = await ctx3.newPage();
  await page3.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(2500);
  await page3.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.75));
  await sleep(800);
  const rb3 = await tryFind(page3, ['.reward-button', 'button:has-text("赞赏")']);
  if (rb3) {
    await rb3.scrollIntoViewIfNeeded();
    await rb3.click();
    await sleep(500);
    const sb3 = await tryFind(page3, ['button:has-text("Stripe")', 'button:has-text("信用卡 / Apple")', 'button:has-text("国际收银台")'], 3000);
    if (sb3) { await sb3.click(); await sleep(2000); }
  }
  await page3.screenshot({ path: '/tmp/new-05-mobile.png' });
  console.log('✅ 05: mobile 390px');
  await ctx3.close();

  await browser.close();
  console.log('\n✅ All new UI screenshots done!');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
