import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROD_URL = 'https://blog.epocanvas.com/';
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'scratch/music-pocket-evidence');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyLiveMusicPocketClose() {
  console.log('========================================================================');
  console.log('🌐 Cloudflare Pages Live E2E Verification: Music Pocket Close ("叉掉")');
  console.log(`   Production URL: ${PROD_URL}`);
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('pageerror', (err) => {
    console.log(`  [PAGE ERROR] ${err.toString()}`);
    consoleErrors.push(err.toString());
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`  [CONSOLE ERROR] ${msg.text()}`);
    }
  });

  try {
    console.log(`[1] Navigating to production site: ${PROD_URL}`);
    const resp = await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 35000 });
    console.log(`  -> HTTP Status: ${resp.status()}`);
    if (resp.status() !== 200) {
      throw new Error(`Production returned non-200 status: ${resp.status()}`);
    }
    await page.waitForTimeout(1500);

    // 1. Reveal Music Pocket if hidden
    console.log('[2] Revealing music pocket container...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:toggle-music-pocket', { detail: { visible: true } }));
    });
    await page.waitForTimeout(800);

    const pocket = await page.$('.shijianus-music-pocket');
    if (!pocket) throw new Error('Music pocket container not found in DOM!');

    // Verify initial state: panel should not be open
    let panelInitial = await page.$('.shijianus-music-pocket__panel');
    console.log(`  -> Initial panel present?: ${!!panelInitial}`);

    // 2. Open panel by clicking vinyl toggle disc
    console.log('[3] Clicking toggle disc to open panel...');
    const toggle = await page.$('.shijianus-music-pocket__toggle');
    if (!toggle) throw new Error('Pocket toggle button not found!');
    await toggle.click();
    await page.waitForTimeout(800);

    const panel = await page.$('.shijianus-music-pocket__panel');
    if (!panel) throw new Error('Panel failed to open on clicking toggle button!');
    const panelClass = await panel.getAttribute('class');
    console.log(`  ✓ Panel opened successfully with classes: "${panelClass}"`);

    // Capture screenshot of opened panel on live site
    const shotOpen = path.join(SCREENSHOT_DIR, 'live-01-panel-opened.png');
    await page.screenshot({ path: shotOpen });
    console.log(`  -> Screenshot saved: ${shotOpen}`);

    // 3. Click the close button (.shijianus-music-pocket__hud-btn--close)
    console.log('[4] Clicking close button (.shijianus-music-pocket__hud-btn--close) to close panel...');
    const closeBtn = await page.$('.shijianus-music-pocket__hud-btn--close');
    if (!closeBtn) throw new Error('Close button (.shijianus-music-pocket__hud-btn--close) not found in panel!');
    await closeBtn.click();
    await page.waitForTimeout(800);

    // Verify panel is completely closed
    let panelAfterClose = await page.$('.shijianus-music-pocket__panel');
    console.log(`  -> Panel in DOM after clicking close: ${!!panelAfterClose}`);
    if (panelAfterClose) {
      throw new Error('Panel failed to close on live site! Still present in DOM.');
    }
    console.log('  ✓ Panel successfully closed upon clicking close button on live site!');

    // 4. Verify stability: ensure panel stays closed and does not re-open automatically
    console.log('[5] Waiting 3 seconds to verify panel does not re-open automatically...');
    await page.waitForTimeout(3000);
    panelAfterClose = await page.$('.shijianus-music-pocket__panel');
    if (panelAfterClose) {
      throw new Error('Panel automatically re-opened! Self-sync feedback loop detected on live site!');
    }
    console.log('  ✓ Panel remained closed! Feedback loop completely eradicated.');

    // Capture screenshot of closed state on live site
    const shotClosed = path.join(SCREENSHOT_DIR, 'live-02-panel-closed.png');
    await page.screenshot({ path: shotClosed });
    console.log(`  -> Screenshot saved: ${shotClosed}`);

    // 5. Verify Escape key closing works as well
    console.log('[6] Testing Escape key close on live site...');
    await toggle.click();
    await page.waitForTimeout(800);
    if (!(await page.$('.shijianus-music-pocket__panel'))) {
      throw new Error('Failed to reopen panel on live site!');
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    if (await page.$('.shijianus-music-pocket__panel')) {
      throw new Error('Panel failed to close with Escape key on live site!');
    }
    console.log('  ✓ Escape key close verified on live site!');

    console.log('\n========================================================================');
    console.log('🎉 PRODUCTION (CLOUDFLARE PAGES) VERIFICATION 100% PASSED!');
    console.log('========================================================================\n');
  } finally {
    await browser.close();
  }
}

verifyLiveMusicPocketClose().catch((err) => {
  console.error('\n❌ LIVE VERIFICATION FAILED:', err);
  process.exit(1);
});
