import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = 'file://' + path.resolve(__dirname, '../dist/index.html');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to', indexPath);
  await page.goto(indexPath, { waitUntil: 'domcontentloaded' });

  // Test 1: Light Mode Check
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await new Promise(r => setTimeout(r, 500));

  const lightCard = await page.evaluate(() => {
    const card = document.querySelector('.todayCard');
    const svg = document.querySelector('svg.todayCard-cover');
    const w1 = document.querySelector('.w1');
    const w2 = document.querySelector('.w2');
    const w3 = document.querySelector('.w3');
    const rect = card ? card.getBoundingClientRect() : null;
    return {
      cardFound: !!card,
      svgFound: !!svg,
      w1Found: !!w1,
      w2Found: !!w2,
      w3Found: !!w3,
      w2D: w2 ? w2.getAttribute('d') : null,
      cardRect: rect ? { width: rect.width, height: rect.height, top: rect.top } : null
    };
  });
  console.log('Light Mode Card Check:', lightCard);

  // Take screenshot of todayCard in light mode with reduced motion so animation completes
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await new Promise(r => setTimeout(r, 600));

  const cardElement = await page.$('.todayCard');
  if (cardElement) {
    await cardElement.screenshot({ path: 'scripts/todayCard_light.png' });
    console.log('Saved scripts/todayCard_light.png');
  }

  // Test 2: Dark Mode Check
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await new Promise(r => setTimeout(r, 600));

  if (cardElement) {
    await cardElement.screenshot({ path: 'scripts/todayCard_dark.png' });
    console.log('Saved scripts/todayCard_dark.png');
  }

  // Full viewport screenshot
  await page.screenshot({ path: 'scripts/home_hero_dark.png' });
  console.log('Saved scripts/home_hero_dark.png');

  await browser.close();
  console.log('Verification completed successfully!');
})();
