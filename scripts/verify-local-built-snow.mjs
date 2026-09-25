import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function main() {
  const screenshotsDir = path.resolve('scripts/audit_screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('Navigating to http://localhost:4329/...');
  await page.goto('http://localhost:4329/', { waitUntil: 'networkidle' });

  // Verify all 3 canvases exist
  const bgCanvas = await page.$('#theme-snow-universe');
  const midCanvas = await page.$('#theme-snow-mid');
  const fgCanvas = await page.$('#theme-snow-foreground');

  console.log('Canvas detection:');
  console.log('  #theme-snow-universe exists:', !!bgCanvas);
  console.log('  #theme-snow-mid exists:', !!midCanvas);
  console.log('  #theme-snow-foreground exists:', !!fgCanvas);

  if (!bgCanvas || !midCanvas || !fgCanvas) {
    throw new Error('Missing snow canvas elements in DOM!');
  }

  // Ensure snow is active
  await page.evaluate(() => {
    document.documentElement.dataset.background = 'snow';
    document.documentElement.dataset.theme = 'light';
  });

  // Let snow engine run for 1.5s to populate particles
  await page.waitForTimeout(1500);

  // Capture daylight screenshot
  const dayPath = path.join(screenshotsDir, 'local-daylight-snow.png');
  await page.screenshot({ path: dayPath });
  console.log(`Saved daylight screenshot: ${dayPath}`);

  // Switch to dark mode
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  await page.waitForTimeout(1000);

  // Capture night screenshot
  const nightPath = path.join(screenshotsDir, 'local-night-snow.png');
  await page.screenshot({ path: nightPath });
  console.log(`Saved night screenshot: ${nightPath}`);

  // Check canvas styles
  const styles = await page.evaluate(() => {
    const bg = document.getElementById('theme-snow-universe');
    const mid = document.getElementById('theme-snow-mid');
    const fg = document.getElementById('theme-snow-foreground');
    return {
      bgZ: window.getComputedStyle(bg).zIndex,
      midZ: window.getComputedStyle(mid).zIndex,
      fgZ: window.getComputedStyle(fg).zIndex,
      midOpacity: window.getComputedStyle(mid).opacity,
      fgFilter: window.getComputedStyle(fg).filter,
    };
  });
  console.log('Canvas computed styles:', styles);

  console.log('Console errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.warn('Errors encountered:', consoleErrors);
  }

  await browser.close();
  console.log('Local built snow verification finished successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
