const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'zh-CN' })).newPage();
  await page.goto('http://localhost:4321/posts/anzhiyu-markdown-showcase/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  // 整页（检查其它按钮未被 layer 修改破坏）
  await page.screenshot({ path: 'scratch/ui-00-postpage.png' });
  await page.locator('[data-panel-trigger="reward"]').first().click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'scratch/ui-01-popover.png' });
  await page.locator('button:has-text("Stripe 国际收银台")').first().click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/ui-02-modal-amount.png' });
  await page.locator('button:has-text("$10")').first().click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'scratch/ui-03-amount-selected.png' });
  // hover 效果
  await page.locator('button:has-text("继续")').first().hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/ui-04-cta-hover.png' });
  await browser.close();
  console.log('done');
})();
