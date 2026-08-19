const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:4321/');
  await page.waitForTimeout(2000);

  // Set to dark starfield
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.dataset.background = 'starfield';
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'after-starfield.png' });
  console.log('Saved after-starfield.png');

  // Set to dark aurora
  await page.evaluate(() => {
    document.documentElement.dataset.background = 'aurora';
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'after-aurora.png' });
  console.log('Saved after-aurora.png');

  await browser.close();
})();
