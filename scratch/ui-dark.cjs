const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'zh-CN' })).newPage();
  await page.goto('http://localhost:4321/posts/anzhiyu-markdown-showcase/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  // 切换暗色
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(500);
  await page.locator('[data-panel-trigger="reward"]').first().click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'scratch/ui-dark-01-popover.png' });
  await page.locator('button:has-text("Stripe 国际收银台")').first().click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/ui-dark-02-modal.png' });
  await browser.close();
  console.log('done');
})();
