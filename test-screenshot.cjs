const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4324/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-screenshot-http.png', fullPage: true });
  await browser.close();
  process.exit(0);
})();
