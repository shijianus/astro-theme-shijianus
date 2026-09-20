import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function verifyLiveSnowHomepage() {
  const screenshotDir = path.resolve('scripts/audit_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const liveUrl = 'https://blog.epocanvas.com/';
  console.log(`🚀 Starting Playwright live E2E audit on: ${liveUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Listen for console errors
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. Audit Live Light Mode
    console.log('\n--- 1. Auditing Live Homepage (Light Mode) ---');
    await page.goto(liveUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000); // Allow snow universe initialization

    const lightAudit = await page.evaluate(() => {
      const canvas = document.getElementById('theme-snow-universe');
      const todayCard = document.querySelector('.todayCard');
      const todaySnow = todayCard ? todayCard.querySelector('.snow-cover') : null;
      const banner = document.querySelector('#bannerGroup #random-banner');
      const bannerSnow = banner ? banner.querySelector('.snow-cover') : null;
      const notice = document.querySelector('.home-top-notice');
      const noticeSnow = notice ? notice.querySelector('.snow-cover') : null;
      const catButtons = Array.from(document.querySelectorAll('#bannerGroup .categoryItem .categoryButton'));
      const catSnows = catButtons.map(b => b.querySelector('.snow-cover'));
      const postCards = Array.from(document.querySelectorAll('.recent-post-item'));
      const postSnows = postCards.map(p => p.querySelector('.snow-cover'));
      const asideCards = Array.from(document.querySelectorAll('#aside-content .card-widget'));
      const asideSnows = asideCards.map(c => c.querySelector('.snow-cover'));

      const getStyle = (el) => {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          display: cs.display,
          backgroundImage: cs.backgroundImage.substring(0, 45),
          height: cs.height,
          position: cs.position,
          zIndex: cs.zIndex,
          pointerEvents: cs.pointerEvents,
        };
      };

      return {
        datasetBg: document.documentElement.dataset.background,
        canvasActive: !!canvas && window.getComputedStyle(canvas).opacity === '1',
        todaySnow: getStyle(todaySnow),
        bannerSnow: getStyle(bannerSnow),
        noticeSnow: getStyle(noticeSnow),
        catCount: catSnows.filter(Boolean).length,
        catDistinct: new Set(catSnows.map(s => s ? s.className : '')).size,
        postCount: postSnows.filter(Boolean).length,
        postDistinct: new Set(postSnows.map(s => s ? s.className : '')).size,
        asideCount: asideSnows.filter(Boolean).length,
      };
    });

    console.log('Live Light Mode Audit Results:', JSON.stringify(lightAudit, null, 2));

    if (!lightAudit.canvasActive) {
      throw new Error(`Live canvas is not active or opacity is not 1`);
    }
    if (lightAudit.postCount === 0 || lightAudit.postDistinct < 4) {
      throw new Error(`Live post cards do not exhibit 4 distinct topologies!`);
    }

    const lightPath = path.join(screenshotDir, 'live-snow-homepage-light.png');
    const lightFullPath = path.join(screenshotDir, 'live-snow-homepage-light-full.png');
    await page.screenshot({ path: lightPath });
    await page.screenshot({ path: lightFullPath, fullPage: true });
    console.log(`📸 Live Light mode screenshots saved to:\n  ${lightPath}\n  ${lightFullPath}`);

    // 2. Audit Live Dark Mode
    console.log('\n--- 2. Auditing Live Homepage (Dark Mode) ---');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(1000);

    const darkAudit = await page.evaluate(() => {
      const todaySnow = document.querySelector('.todayCard .snow-cover');
      const cs = todaySnow ? window.getComputedStyle(todaySnow) : null;
      return {
        theme: document.documentElement.dataset.theme,
        snowFilter: cs ? cs.filter : null,
      };
    });

    console.log('Live Dark Mode Audit Results:', darkAudit);
    const darkPath = path.join(screenshotDir, 'live-snow-homepage-dark.png');
    const darkFullPath = path.join(screenshotDir, 'live-snow-homepage-dark-full.png');
    await page.screenshot({ path: darkPath });
    await page.screenshot({ path: darkFullPath, fullPage: true });
    console.log(`📸 Live Dark mode screenshots saved to:\n  ${darkPath}\n  ${darkFullPath}`);

    // 3. Audit Switch to Clean Mode and Back
    console.log('\n--- 3. Auditing Background Mode Switch (Clean ⇄ Snow) on Live ---');
    await page.evaluate(() => {
      document.documentElement.dataset.background = 'clean';
    });
    await page.waitForTimeout(500);

    const cleanAudit = await page.evaluate(() => {
      const canvas = document.getElementById('theme-snow-universe');
      const todaySnow = document.querySelector('.todayCard .snow-cover');
      return {
        datasetBg: document.documentElement.dataset.background,
        canvasOpacity: canvas ? window.getComputedStyle(canvas).opacity : null,
        snowDisplay: todaySnow ? window.getComputedStyle(todaySnow).display : null,
      };
    });
    console.log('Live Clean Mode Switch:', cleanAudit);
    if (cleanAudit.snowDisplay !== 'none') {
      throw new Error('Snow cover did not hide in clean mode!');
    }

    await page.evaluate(() => {
      document.documentElement.dataset.background = 'snow';
    });
    await page.waitForTimeout(500);

    const restoredAudit = await page.evaluate(() => {
      const todaySnow = document.querySelector('.todayCard .snow-cover');
      return {
        datasetBg: document.documentElement.dataset.background,
        snowDisplay: todaySnow ? window.getComputedStyle(todaySnow).display : null,
      };
    });
    console.log('Live Restored Snow Mode:', restoredAudit);
    if (restoredAudit.snowDisplay !== 'block') {
      throw new Error('Snow cover did not restore in snow mode!');
    }

    console.log('\n🎉 ALL LIVE PRODUCTION AUDIT CHECKS PASSED PERFECTLY!');
  } finally {
    await browser.close();
  }
}

verifyLiveSnowHomepage().catch((err) => {
  console.error('❌ Live E2E Audit Failed:', err);
  process.exit(1);
});
