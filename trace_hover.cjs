const { chromium } = require('playwright');
const path = require('path');

async function runTrace(theme, traceName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:4321', { waitUntil: 'networkidle' });

  // Set theme
  if (theme === 'dark') {
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-background', 'starfield'); // force background if any
      window.dispatchEvent(new Event('shijianus:themechange'));
    });
  } else {
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      window.dispatchEvent(new Event('shijianus:themechange'));
    });
  }
  
  await page.waitForTimeout(2000); // wait for animations to settle

  await browser.startTracing(page, { path: traceName, screenshots: true });
  
  // Find some interactive elements
  const elements = await page.$$('a, .recent-post-item, .card-widget');
  console.log(`[${theme}] Found ${elements.length} elements to hover.`);
  
  // Hover over the first 5 elements slowly
  for (let i = 0; i < Math.min(5, elements.length); i++) {
    try {
      await elements[i].hover();
      await page.waitForTimeout(500);
    } catch(e) {}
  }

  await browser.stopTracing();
  await browser.close();
}

async function main() {
  console.log("Tracing light mode...");
  await runTrace('light', 'trace_light.json');
  console.log("Tracing dark mode...");
  await runTrace('dark', 'trace_dark.json');
  console.log("Done.");
}

main();
