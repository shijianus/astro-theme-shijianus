import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function runLiveVerification() {
  const screenshotDir = path.resolve('scripts/audit_screenshots/live_phase2');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('🚀 Initiating Live Production E2E Verification for EpoCanvas Snow Mantle...');
  console.log('Target: https://blog.epocanvas.com/');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const loc = msg.location();
      console.log('[LIVE BROWSER ERROR]', text, 'at', JSON.stringify(loc));
      if (!text.includes('favicon') && !text.includes('analytics') && !text.includes('404')) {
        consoleErrors.push(`${text} (at ${loc.url}:${loc.lineNumber})`);
      }
    }
  });

  page.on('pageerror', (err) => {
    console.log('[LIVE PAGE ERROR]', err.stack || err.message);
    consoleErrors.push(err.message);
  });

  // ── 1. Audit Live Production Homepage Daylight Mode ──
  console.log('\n--- 1. Auditing Live Homepage Daylight Snow Accumulation ---');
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000);

  const liveHomeAudit = await page.evaluate(() => {
    const midCanvas = document.getElementById('theme-snow-mid');
    const isSnow = document.documentElement.dataset.background === 'snow';
    const isDay = document.documentElement.dataset.theme !== 'dark';

    const selectors = [
      '.home-top-notice',
      '#random-banner',
      '.todayCard',
      '.categoryItem',
      '.recent-post-item',
      '#aside-content .card-widget',
    ];
    const matched = [];
    for (const s of selectors) {
      const els = document.querySelectorAll(s);
      if (els.length > 0) {
        matched.push({ selector: s, count: els.length });
      }
    }

    return {
      isSnow,
      isDay,
      midCanvasExists: !!midCanvas,
      midCanvasWidth: midCanvas ? midCanvas.width : 0,
      midCanvasHeight: midCanvas ? midCanvas.height : 0,
      matched,
    };
  });

  console.log('Live Homepage audit state:', JSON.stringify(liveHomeAudit, null, 2));

  const homeShot = path.join(screenshotDir, '01_live_homepage_daylight_top.png');
  await page.screenshot({ path: homeShot, fullPage: false });
  console.log('📸 Live homepage daylight screenshot saved:', homeShot);

  // ── 2. Audit Dynamic Scrolling on Live Homepage ──
  console.log('\n--- 2. Auditing Dynamic Scrolling on Live Homepage ---');
  console.log('Scrolling down 600px...');
  await page.evaluate(() => window.scrollBy({ top: 600, behavior: 'instant' }));
  await page.waitForTimeout(500);

  const scroll600Shot = path.join(screenshotDir, '02_live_homepage_scrolled_600px.png');
  await page.screenshot({ path: scroll600Shot, fullPage: false });
  console.log('📸 Live homepage scrolled 600px saved:', scroll600Shot);

  console.log('Scrolling down another 800px...');
  await page.evaluate(() => window.scrollBy({ top: 800, behavior: 'instant' }));
  await page.waitForTimeout(500);

  const scroll1400Shot = path.join(screenshotDir, '03_live_homepage_scrolled_1400px.png');
  await page.screenshot({ path: scroll1400Shot, fullPage: false });
  console.log('📸 Live homepage scrolled 1400px saved:', scroll1400Shot);

  console.log('Scrolling back up...');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(400);

  // ── 3. Audit Dark Mode on Live Homepage ──
  console.log('\n--- 3. Auditing Dark Mode on Live Homepage ---');
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  await page.waitForTimeout(600);

  const darkShot = path.join(screenshotDir, '04_live_homepage_dark_top.png');
  await page.screenshot({ path: darkShot, fullPage: false });
  console.log('📸 Live homepage dark mode screenshot saved:', darkShot);

  // ── 4. Audit Live Post Page ──
  console.log('\n--- 4. Auditing Live Post Page ---');
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
  });
  await page.goto('https://blog.epocanvas.com/posts/hello-world/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000);

  const livePostAudit = await page.evaluate(() => {
    const postCard = document.getElementById('post');
    const related = document.querySelectorAll('.relatedPosts-item');
    const comment = document.getElementById('post-comment');
    const toc = document.getElementById('card-toc');

    return {
      postCardExists: !!postCard,
      relatedPostsCount: related.length,
      commentExists: !!comment,
      tocExists: !!toc,
    };
  });
  console.log('Live Post page audit state:', JSON.stringify(livePostAudit, null, 2));

  const livePostShot = path.join(screenshotDir, '05_live_post_daylight_top.png');
  await page.screenshot({ path: livePostShot, fullPage: false });
  console.log('📸 Live post page daylight screenshot saved:', livePostShot);

  // Scroll to comments
  await page.evaluate(() => {
    const commentEl = document.getElementById('post-comment');
    if (commentEl) commentEl.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(600);

  const liveCommentShot = path.join(screenshotDir, '06_live_post_comments_and_related.png');
  await page.screenshot({ path: liveCommentShot, fullPage: false });
  console.log('📸 Live post comments & related screenshot saved:', liveCommentShot);

  await browser.close();

  // ── 5. Assert Console Cleanliness ──
  console.log('\n--- Console Errors Check on Production ---');
  if (consoleErrors.length > 0) {
    console.error('❌ Detected console errors during Live E2E testing:', consoleErrors);
    throw new Error(`Console errors detected on production: ${consoleErrors.join(', ')}`);
  }

  console.log('✅ ZERO fatal console errors detected across all live production scenarios!');
  console.log('\n🎉 Production Live E2E Verification PASSED completely!');
}

runLiveVerification().catch((err) => {
  console.error('Fatal error during Live E2E verification:', err);
  process.exit(1);
});
