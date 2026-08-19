const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to local site...');
  await page.goto('http://localhost:4321/');
  await page.waitForTimeout(2000); // let things settle

  // --- LIGHT MODE TRACE ---
  console.log('Switching to light mode...');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.dataset.theme = 'light';
    // Maybe trigger a resize to force re-render of universe
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(1000);

  console.log('Starting trace for light mode...');
  await browser.startTracing(page, { path: 'trace-light.json', screenshots: true });
  
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(2000);
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(500);
  }
  
  await browser.stopTracing();
  console.log('Saved trace-light.json');

  // --- DARK MODE TRACE ---
  console.log('Switching to dark mode...');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.dataset.theme = 'dark';
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(1000);

  console.log('Starting trace for dark mode...');
  await browser.startTracing(page, { path: 'trace-dark.json', screenshots: true });
  
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(2000);
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(500);
  }
  
  await browser.stopTracing();
  console.log('Saved trace-dark.json');

  await browser.close();
})();
