import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  
  // 1. Home page normal & hover
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'scripts/verify_home_normal.png', fullPage: false });

  // Hover first category item
  const categoryItems = await page.$$('.categoryItem');
  if (categoryItems.length > 0) {
    await categoryItems[0].hover();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'scripts/verify_home_hover_cat1.png', fullPage: false });
  }

  // Hover last category item
  if (categoryItems.length > 2) {
    await categoryItems[2].hover();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'scripts/verify_home_hover_cat3.png', fullPage: false });
  }

  // Hover random banner
  await page.hover('#random-banner');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'scripts/verify_home_hover_banner.png', fullPage: false });

  // 2. Post page
  await page.goto('http://localhost:4321/posts/content-first-homepage/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'scripts/verify_post_normal.png', fullPage: false });

  // Scroll a bit on post page
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'scripts/verify_post_scroll.png', fullPage: false });

  console.log('Visual verification screenshots saved successfully.');
  await browser.close();
}

run().catch(console.error);
