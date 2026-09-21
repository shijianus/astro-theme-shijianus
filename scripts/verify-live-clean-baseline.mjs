import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function verifyLiveCleanBaseline() {
  const screenshotDir = path.resolve('scripts/audit_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const liveUrl = 'https://blog.epocanvas.com/';
  console.log(`🚀 Starting Playwright Live Clean Baseline Audit on: ${liveUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. Audit Live Clean Baseline (Light Mode)
    console.log('\n--- 1. Auditing Live Homepage (Clean Baseline - Light Mode) ---');
    await page.goto(liveUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1500);

    const lightAudit = await page.evaluate(() => {
      const snowCovers = document.querySelectorAll('.snow-cover');
      const canvasSnow = document.getElementById('theme-snow-universe');
      const todayCard = document.querySelector('.todayCard');
      const todaySnow = todayCard ? todayCard.querySelector('.snow-cover') : null;
      const banner = document.querySelector('#bannerGroup #random-banner');
      const bannerSnow = banner ? banner.querySelector('.snow-cover') : null;
      const postCards = Array.from(document.querySelectorAll('.recent-post-item'));
      const postSnows = postCards.map(p => p.querySelector('.snow-cover')).filter(Boolean);
      const profileCard = document.querySelector('.profile-card');
      const profileSnow = profileCard ? profileCard.querySelector('.snow-cover') : null;
      const asideCards = Array.from(document.querySelectorAll('#aside-content .card-widget'));
      const asideSnows = asideCards.map(c => c.querySelector('.snow-cover')).filter(Boolean);

      const htmlStyle = window.getComputedStyle(document.documentElement);
      const bodyStyle = window.getComputedStyle(document.body);

      return {
        datasetBg: document.documentElement.dataset.background,
        datasetTheme: document.documentElement.dataset.theme,
        totalSnowCovers: snowCovers.length,
        canvasSnowExists: !!canvasSnow,
        todayCardHasSnow: !!todaySnow,
        bannerHasSnow: !!bannerSnow,
        postSnowCount: postSnows.length,
        profileHasSnow: !!profileSnow,
        asideSnowCount: asideSnows.length,
        bodyBg: bodyStyle.backgroundColor,
      };
    });

    console.log('Live Light Clean Audit Results:', JSON.stringify(lightAudit, null, 2));

    if (lightAudit.datasetBg !== 'clean') {
      throw new Error(`Expected dataset.background to be 'clean', got '${lightAudit.datasetBg}'`);
    }
    if (lightAudit.totalSnowCovers !== 0) {
      throw new Error(`Expected 0 snow-cover elements on live site, found ${lightAudit.totalSnowCovers}!`);
    }
    if (lightAudit.canvasSnowExists) {
      throw new Error(`Expected theme-snow-universe canvas to NOT exist on live site!`);
    }
    if (lightAudit.todayCardHasSnow || lightAudit.bannerHasSnow || lightAudit.postSnowCount > 0 || lightAudit.profileHasSnow) {
      throw new Error(`Card elements still have snow-cover inside!`);
    }

    const lightPath = path.join(screenshotDir, 'live-restored-clean-light.png');
    await page.screenshot({ path: lightPath });
    console.log(`📸 Live Light mode clean screenshot saved to: ${lightPath}`);

    // 2. Audit Live Clean Baseline (Dark Mode)
    console.log('\n--- 2. Auditing Live Homepage (Clean Baseline - Dark Mode) ---');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(1000);

    const darkAudit = await page.evaluate(() => {
      const snowCovers = document.querySelectorAll('.snow-cover');
      const canvasSnow = document.getElementById('theme-snow-universe');
      const bodyStyle = window.getComputedStyle(document.body);
      return {
        datasetBg: document.documentElement.dataset.background,
        datasetTheme: document.documentElement.dataset.theme,
        totalSnowCovers: snowCovers.length,
        canvasSnowExists: !!canvasSnow,
        bodyBg: bodyStyle.backgroundColor,
      };
    });

    console.log('Live Dark Clean Audit Results:', JSON.stringify(darkAudit, null, 2));

    if (darkAudit.totalSnowCovers !== 0 || darkAudit.canvasSnowExists) {
      throw new Error(`Dark mode has snow elements!`);
    }

    const darkPath = path.join(screenshotDir, 'live-restored-clean-dark.png');
    await page.screenshot({ path: darkPath });
    console.log(`📸 Live Dark mode clean screenshot saved to: ${darkPath}`);

    console.log('\n🎉 ALL LIVE CLEAN BASELINE AUDITS PASSED WITH 100% PURITY!');
  } finally {
    await browser.close();
  }
}

verifyLiveCleanBaseline().catch((err) => {
  console.error('❌ Live Clean Baseline Audit Failed:', err);
  process.exit(1);
});
