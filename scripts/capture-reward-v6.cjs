const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  // Navigate to a blog post
  await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  const postLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/posts/"]'));
    return links.slice(0, 1).map(el => el.href);
  });

  const postUrl = postLinks[0] || 'http://localhost:4321/posts/anzhiyu-markdown-showcase/';
  console.log('Post URL:', postUrl);

  await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);

  // Screenshot 1: Post page overview
  await page.screenshot({ path: '/tmp/reward-01-post-page.png' });
  console.log('Screenshot 1: post page');

  // Scroll down to find reward button
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/reward-01b-post-scroll.png' });
  console.log('Screenshot 1b: scrolled post');

  // Hover on reward button to open popover
  const rewardBtn = await page.$('.reward-button, [data-panel-trigger="reward"]');
  if (rewardBtn) {
    await rewardBtn.hover();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/reward-02-popover-hover.png' });
    console.log('Screenshot 2: popover on hover');

    // Click to pin it
    await rewardBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/reward-02b-popover-pinned.png' });
    console.log('Screenshot 2b: popover pinned');

    // Find and click GLOBAL to see Stripe button
    const globalBtn = await page.$('button:has-text("GLOBAL"), button:has-text("全球")');
    if (globalBtn) {
      await globalBtn.click();
      await page.waitForTimeout(300);
    }

    // Click the Stripe/国际收银台 button
    const stripeBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find(b => b.textContent && (b.textContent.includes('国际收银台') || b.textContent.includes('Stripe')));
      if (found) { found.click(); return true; }
      return false;
    });

    if (stripeBtn) {
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/reward-03-stripe-modal-amount.png' });
      console.log('Screenshot 3: Stripe modal step 1 (amount selection)');

      // Dark mode screenshot
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.waitForTimeout(300);
      await page.screenshot({ path: '/tmp/reward-03b-stripe-modal-dark.png' });
      console.log('Screenshot 3b: Dark mode');
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
    }
  }

  // Mobile view
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/reward-04-mobile.png' });
  console.log('Screenshot 4: mobile view');

  await browser.close();
  console.log('All screenshots taken!');
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
