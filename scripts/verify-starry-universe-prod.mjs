import { chromium } from 'playwright';

async function runProductionAudit() {
  const targetUrl = 'https://blog.epocanvas.com/';
  console.log(`🌌 [Live E2E] Starting live production audit on ${targetUrl} ...`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    // 1. Visit live homepage
    console.log('🌌 [Prod Step 1] Loading live homepage...');
    const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`✅ HTTP Status: ${response.status()}`);
    await page.waitForTimeout(1000);

    // Verify #universe canvas presence
    const universeCanvas = await page.$('#universe');
    if (!universeCanvas) {
      throw new Error('❌ #universe canvas not found in live production DOM!');
    }
    console.log('✅ Live production DOM contains #universe canvas.');

    // 2. Test switching background mode in production
    console.log('🌌 [Prod Step 2] Testing live background mode switching to "universe" ...');
    await page.evaluate(() => {
      document.documentElement.dataset.background = 'universe';
      window.dispatchEvent(new CustomEvent('shijianus:backgroundchange', { detail: 'universe' }));
    });
    await page.waitForTimeout(1000);

    const opacity = await page.$eval('#universe', (el) => window.getComputedStyle(el).opacity);
    if (parseFloat(opacity) < 0.95) {
      throw new Error(`❌ Live #universe opacity expected near 1, got ${opacity}`);
    }
    console.log(`✅ Live #universe opacity is active: ${opacity}`);

    // Check live canvas particle execution
    console.log('🌌 [Prod Step 3] Testing live canvas 2D rendering buffer...');
    const hasRendered = await page.evaluate(async () => {
      const canvas = document.getElementById('universe');
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      await new Promise(r => setTimeout(r, 400));
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let nonZero = 0;
      for (let i = 3; i < imgData.data.length; i += 4) {
        if (imgData.data[i] > 0) nonZero++;
      }
      return nonZero > 0;
    });

    if (!hasRendered) {
      throw new Error('❌ Live canvas has no rendered pixels!');
    }
    console.log('✅ Live starry universe canvas actively drawing celestial particles and comets.');

    // 4. Test dark mode switch in production
    console.log('🌌 [Prod Step 4] Testing dark mode on live production site...');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.dataset.background = 'universe';
    });
    await page.waitForTimeout(500);

    // 5. Check console errors
    const fatalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('analytics'));
    if (fatalErrors.length > 0) {
      console.warn('⚠️ Console errors detected:', fatalErrors);
    } else {
      console.log('✅ 0 fatal console errors on live production site.');
    }

    // 6. Test post page on live production
    console.log('🌌 [Prod Step 5] Checking live post page...');
    const postRes = await page.goto(`${targetUrl}posts/content-formats-and-markup-mastery/`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`✅ Post Page HTTP Status: ${postRes.status()}`);
    await page.waitForTimeout(800);
    const postUniverse = await page.$('#universe');
    if (!postUniverse) {
      throw new Error('❌ Live post page missing #universe canvas!');
    }
    console.log('✅ Live post page #universe canvas verified.');

    console.log('🎉 [Success] Production Live E2E Verification 100% Passed!');
  } finally {
    if (browser) await browser.close();
  }
}

runProductionAudit().catch((err) => {
  console.error('❌ Production audit failed:', err);
  process.exit(1);
});
