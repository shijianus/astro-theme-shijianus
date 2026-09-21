import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  const screenshotDir = path.resolve('scripts/audit_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const liveUrl = process.env.LIVE_URL || 'https://blog.epocanvas.com/';
  console.log(`🚀 Starting Live Production Snowscape E2E verification at: ${liveUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter non-fatal network tracking/adblock noise if any
      if (!text.includes('favicon') && !text.includes('analytics')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  try {
    // ── 1. Visit Live Site ──
    console.log('\n--- 1. Visiting Production URL ---');
    await page.goto(liveUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1500); // Allow dual-canvas boot

    const liveAudit = await page.evaluate(() => {
      const bgCanvas = document.getElementById('theme-snow-bg');
      const fgCanvas = document.getElementById('theme-snow-fg');
      const inCardSnowCovers = document.querySelectorAll('.snow-cover, [data-snow-cover]');
      const postCard = document.querySelector('#recent-posts .recent-post-item');
      const banner = document.querySelector('#bannerGroup #random-banner');
      const todayCard = document.querySelector('.todayCard');
      const pagination = document.querySelector('#home-pagination, .home-pagination');

      const bgStyle = bgCanvas ? window.getComputedStyle(bgCanvas) : null;
      const fgStyle = fgCanvas ? window.getComputedStyle(fgCanvas) : null;

      return {
        url: window.location.href,
        dataBackground: document.documentElement.dataset.background,
        inCardSnowCount: inCardSnowCovers.length,
        bgCanvas: {
          exists: !!bgCanvas,
          zIndex: bgStyle ? bgStyle.zIndex : null,
          pointerEvents: bgStyle ? bgStyle.pointerEvents : null,
          opacity: bgStyle ? bgStyle.opacity : null,
        },
        fgCanvas: {
          exists: !!fgCanvas,
          zIndex: fgStyle ? fgStyle.zIndex : null,
          pointerEvents: fgStyle ? fgStyle.pointerEvents : null,
          opacity: fgStyle ? fgStyle.opacity : null,
        },
        postCardFound: !!postCard,
        bannerFound: !!banner,
        todayCardFound: !!todayCard,
        paginationFound: !!pagination,
      };
    });

    console.log('Live Production Snowscape Audit:', JSON.stringify(liveAudit, null, 2));

    if (liveAudit.inCardSnowCount !== 0) {
      throw new Error(`CRITICAL: In-card snow pollution detected online! Count: ${liveAudit.inCardSnowCount}`);
    }
    if (!liveAudit.bgCanvas.exists || !liveAudit.fgCanvas.exists) {
      throw new Error('CRITICAL: Dual canvas elements missing on live site!');
    }
    if (liveAudit.fgCanvas.zIndex !== '35' || liveAudit.fgCanvas.pointerEvents !== 'none') {
      throw new Error(`CRITICAL: Foreground canvas styles incorrect: ${JSON.stringify(liveAudit.fgCanvas)}`);
    }

    // Capture Live Desktop Screenshot
    await page.screenshot({
      path: path.join(screenshotDir, 'live-physics-snow-desktop.png'),
      fullPage: false,
    });
    console.log('📸 Saved live screenshot: live-physics-snow-desktop.png');

    // ── 2. Test Live Interactive Hover Shedding ──
    console.log('\n--- 2. Testing Live Hover Shedding & Cascading ---');
    await page.evaluate(() => {
      window.scrollTo({ top: 380, behavior: 'instant' });
    });
    await page.waitForTimeout(400);

    const postCardHandle = await page.$('#recent-posts .recent-post-item');
    if (postCardHandle) {
      await postCardHandle.hover({ force: true });
      console.log('🖱️ Hovered over live post card');
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(screenshotDir, 'live-physics-snow-hover.png'),
        fullPage: false,
      });
      console.log('📸 Saved live hover screenshot: live-physics-snow-hover.png');
    }

    // ── 3. Test Live Bottom Pagination Surface ──
    console.log('\n--- 3. Testing Live Pagination Surface ---');
    const paginationHandle = await page.$('#home-pagination, .home-pagination, nav.pagination');
    if (paginationHandle) {
      await paginationHandle.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(screenshotDir, 'live-physics-snow-pagination.png'),
        fullPage: false,
      });
      console.log('📸 Saved live pagination screenshot: live-physics-snow-pagination.png');
    }

    // ── 4. Verify Background Mode Switching ──
    console.log('\n--- 4. Testing Live Mode Switch to Clean ---');
    await page.evaluate(() => {
      document.documentElement.dataset.background = 'clean';
    });
    await page.waitForTimeout(500);

    const cleanCheck = await page.evaluate(() => {
      const bg = document.getElementById('theme-snow-bg');
      const fg = document.getElementById('theme-snow-fg');
      return {
        bgOpacity: bg ? window.getComputedStyle(bg).opacity : null,
        fgOpacity: fg ? window.getComputedStyle(fg).opacity : null,
      };
    });
    console.log('Live clean switch check:', cleanCheck);
    if (cleanCheck.bgOpacity !== '0' || cleanCheck.fgOpacity !== '0') {
      throw new Error(`Clean mode switch failed! Opacity: ${JSON.stringify(cleanCheck)}`);
    }

    if (consoleErrors.length > 0) {
      console.warn('⚠️ Console errors noticed on production:', consoleErrors);
    } else {
      console.log('✅ 0 Console errors detected on production!');
    }

    console.log('\n🎉 ALL LIVE PRODUCTION AUDITS PASSED WITH FLYING COLORS!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Live audit failed:', err);
  process.exit(1);
});
