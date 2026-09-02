const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  try {
    await page.goto('https://blog.epocanvas.com/posts/readable-geek-interfaces/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // Find and hover/click the reward button
    const rewardButton = page.locator('button[data-panel-trigger="reward"]');
    await rewardButton.waitFor({ state: 'visible' });
    await rewardButton.hover();
    await page.waitForTimeout(1000);
    await rewardButton.click();

    // Wait for popover
    await page.waitForTimeout(2000);

    // Click the Stripe / 国际收银台 button
    const stripeButton = page.locator('button', { hasText: 'Stripe 国际收银台' }).first();
    await stripeButton.waitFor({ state: 'visible' });
    await stripeButton.click();

    // Wait 3s for modal
    await page.waitForTimeout(3000);

    // Screenshot modal amount step
    await page.screenshot({ path: '/tmp/stripe-v7-01-amount.png' });

    // Click Continue button
    const continueBtn = page.locator('button', { hasText: 'Continue' });
    await continueBtn.click();

    // Wait 5s for embedded checkout
    await page.waitForTimeout(5000);

    // Screenshot checkout step
    await page.screenshot({ path: '/tmp/stripe-v7-02-checkout.png' });

    // Screenshot dark mode
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/stripe-v7-03-dark.png' });
    await page.evaluate(() => document.documentElement.classList.remove('dark'));

    // Mobile screenshot (390px)
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 }
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('https://blog.epocanvas.com/posts/readable-geek-interfaces/?stripe_return=1&session_id=cs_test_xxx&amount=5', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(3000);
    await mobilePage.screenshot({ path: '/tmp/stripe-v7-04-mobile.png' });
    await mobileContext.close();

    console.log("Playwright script finished successfully.");

  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
})();
