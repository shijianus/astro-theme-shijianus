const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // Retina simulation
  });
  const page = await context.newPage();
  
  // Enable CPU Throttling
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  console.log('Navigating to local site...');
  await page.goto('http://localhost:4321/');
  await page.waitForTimeout(2000); 

  // --- LIGHT MODE TRACE ---
  console.log('Switching to light mode...');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.dataset.theme = 'light';
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
  console.log('Switching to dark mode (starfield)...');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.dataset.background = 'starfield';
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(1000);

  console.log('Starting trace for dark mode (starfield)...');
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
  
  // --- AURORA MODE TRACE ---
  console.log('Switching to dark mode (aurora)...');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.dataset.background = 'aurora';
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(1000);

  console.log('Starting trace for dark mode (aurora)...');
  await browser.startTracing(page, { path: 'trace-aurora.json', screenshots: true });
  
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
  console.log('Saved trace-aurora.json');

  await browser.close();
})();
