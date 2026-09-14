import { chromium } from 'playwright';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/live_support_cf';

async function capture() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  const url = 'https://blog.epocanvas.com/support/';
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // 1. Capture Main Cards
  const cardsContainer = page.locator('.grid.grid-cols-1.lg\\:grid-cols-12');
  await cardsContainer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(outDir, 'fresh-live-cards.png'),
    clip: {
      x: 0,
      y: 400,
      width: 1440,
      height: 900,
    },
  });
  console.log('Saved fresh-live-cards.png');

  // 2. Capture FAQs
  const faqSection = page.locator('section:has(h2:has-text("常見問題與透明度承諾"))');
  await faqSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await faqSection.screenshot({
    path: path.join(outDir, 'fresh-live-faq.png'),
  });
  console.log('Saved fresh-live-faq.png');

  // 3. Capture Full Page
  await page.screenshot({
    path: path.join(outDir, 'fresh-live-fullpage.png'),
    fullPage: true,
  });
  console.log('Saved fresh-live-fullpage.png');

  await browser.close();
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
