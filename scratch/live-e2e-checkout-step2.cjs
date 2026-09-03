const { chromium } = require('playwright');
const path = require('path');

const PROD_URL = 'https://blog.epocanvas.com';
const OUT_DIR = '/home/shijian/projects/shijianus-blog/scratch';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('🚀 Running Live Stripe Embedded Checkout Test on:', PROD_URL);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  page.on('console', msg => {
    console.log('[Browser Console]', msg.type(), msg.text());
  });

  await page.goto(`${PROD_URL}/posts/readable-geek-interfaces/`, { waitUntil: 'networkidle', timeout: 35000 });
  await sleep(1000);

  // Trigger Stripe modal
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-stripe-modal', { detail: { region: 'GLOBAL' } }));
  });
  await sleep(1000);

  const modal = page.locator('.fixed.inset-0.z-\\[1000\\] > div').first();
  await modal.waitFor({ state: 'visible', timeout: 10000 });

  // Select 2nd amount or custom amount
  const continueBtn = modal.locator('button:has-text("继续")').first();
  console.log('👉 Clicking Continue to request Stripe Embedded Checkout Session...');
  await continueBtn.click();

  // Wait for Stripe Embedded iframe
  console.log('⏳ Waiting for Stripe iframe mounting...');
  try {
    const iframe = page.locator('#embedded-stripe-checkout iframe').first();
    await iframe.waitFor({ state: 'attached', timeout: 20000 });
    console.log('✅ Stripe iframe successfully mounted!');
    await sleep(4000);
  } catch (err) {
    console.log('⚠️ Wait error or timeout:', err.message);
  }

  const ssPath = path.join(OUT_DIR, 'live-prod-stripe-iframe-loaded.png');
  await modal.screenshot({ path: ssPath });
  console.log('📸 Saved modal screenshot to:', ssPath);

  await browser.close();
  console.log('✅ Done testing Stripe Embedded Checkout on live CF Pages.');
})();
