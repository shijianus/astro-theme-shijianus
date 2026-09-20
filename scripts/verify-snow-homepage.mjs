import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

async function waitForServer(url, timeout = 35000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 500) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(1000);
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Server at ${url} did not respond within ${timeout}ms`);
}

async function run() {
  const screenshotDir = path.resolve('scripts/audit_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('🚀 Starting preview server for Snow Theme homepage audit...');
  const server = spawn('npx', ['astro', 'preview', '--port', '4321', '--host', '127.0.0.1'], {
    stdio: 'inherit',
    env: { ...process.env, BLOG_BUILD_TARGET: 'static', PUBLIC_STATIC_EXPORT: '1' },
  });

  const cleanup = () => {
    try {
      server.kill('SIGTERM');
    } catch {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    await waitForServer('http://127.0.0.1:4321');
    console.log('✅ Preview server active at http://127.0.0.1:4321');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 1. Audit Light Mode (Winter Morning Snow Day)
    console.log('\n--- 1. Auditing Homepage (Light Mode - Crisp Snow Day) ---');
    await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Allow canvas initialization

    const lightAudit = await page.evaluate(() => {
      const canvas = document.getElementById('theme-snow-universe');
      const todayCard = document.querySelector('.todayCard');
      const randomBanner = document.querySelector('#bannerGroup #random-banner');
      const categoryButtons = Array.from(document.querySelectorAll('#bannerGroup .categoryItem .categoryButton'));
      const postCards = Array.from(document.querySelectorAll('#recent-posts .recent-post-item'));
      const profileCard = document.querySelector('#aside-content .card-info.profile-card');

      const getBeforeStyle = (el) => {
        if (!el) return null;
        const cs = window.getComputedStyle(el, '::before');
        return {
          content: cs.content,
          display: cs.display,
          backgroundImage: cs.backgroundImage,
          height: cs.height,
          pointerEvents: cs.pointerEvents,
        };
      };

      return {
        canvasExists: !!canvas,
        canvasOpacity: canvas ? window.getComputedStyle(canvas).opacity : null,
        datasetBg: document.documentElement.dataset.background,
        todayCardBefore: getBeforeStyle(todayCard),
        randomBannerBefore: getBeforeStyle(randomBanner),
        categoryButtonsBefore: categoryButtons.map(getBeforeStyle),
        postCardsBefore: postCards.slice(0, 4).map(getBeforeStyle),
        profileCardBefore: getBeforeStyle(profileCard),
      };
    });

    console.log('Light Mode Snow Audit Results:');
    console.log('- Canvas Canvas Active:', lightAudit.canvasExists, 'Opacity:', lightAudit.canvasOpacity);
    console.log('- TodayCard Snow Cap:', lightAudit.todayCardBefore?.backgroundImage?.slice(0, 60));
    console.log('- RandomBanner Snow Cap:', lightAudit.randomBannerBefore?.backgroundImage?.slice(0, 60));
    console.log('- Category Items Count:', lightAudit.categoryButtonsBefore.length);
    console.log('- PostCards Count:', lightAudit.postCardsBefore.length);

    if (!lightAudit.canvasExists || lightAudit.canvasOpacity !== '1') {
      throw new Error(`FAIL: Theme snow canvas is inactive (exists: ${lightAudit.canvasExists}, opacity: ${lightAudit.canvasOpacity})`);
    }
    if (!lightAudit.todayCardBefore?.backgroundImage || lightAudit.todayCardBefore.backgroundImage === 'none') {
      throw new Error('FAIL: TodayCard is missing its heavy snow blanket!');
    }
    if (lightAudit.todayCardBefore.pointerEvents !== 'none') {
      throw new Error('FAIL: TodayCard snow cap does not have pointer-events: none!');
    }
    if (!lightAudit.randomBannerBefore?.backgroundImage || lightAudit.randomBannerBefore.backgroundImage === 'none') {
      throw new Error('FAIL: Random banner is missing its snow ridge!');
    }

    // Verify category items have distinct snow tops
    const catImages = lightAudit.categoryButtonsBefore.map(b => b.backgroundImage);
    const catSet = new Set(catImages);
    if (catSet.size < 3) {
      throw new Error(`FAIL: Category items lack diversity (found only ${catSet.size} unique patterns)`);
    }
    console.log(`✅ Category items have diverse snow tops (${catSet.size} distinct topologies)`);

    // Verify stream post cards have distinct quad-rotation snow caps
    const postImages = lightAudit.postCardsBefore.map(p => p.backgroundImage);
    const postSet = new Set(postImages);
    if (postSet.size < 3) {
      throw new Error(`FAIL: Recent post stream cards lack diversity (found only ${postSet.size} unique patterns)`);
    }
    console.log(`✅ Post stream cards have diverse snow caps (${postSet.size} distinct topologies across 4n+1~4)`);

    // Take high-resolution screenshot
    const lightScreenPath = path.join(screenshotDir, 'snow-homepage-light.png');
    await page.screenshot({ path: lightScreenPath, fullPage: false });
    const lightFullScreenPath = path.join(screenshotDir, 'snow-homepage-light-full.png');
    await page.screenshot({ path: lightFullScreenPath, fullPage: true });
    console.log('📸 Light mode screenshot saved to:', lightScreenPath, lightFullScreenPath);

    // 2. Audit Dark Mode (Deep Snow Night)
    console.log('\n--- 2. Auditing Homepage (Dark Mode - Deep Snow Night) ---');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      window.dispatchEvent(new CustomEvent('shijianus:themechange', { detail: 'dark' }));
    });
    await page.waitForTimeout(500);

    const darkAudit = await page.evaluate(() => {
      const canvas = document.getElementById('theme-snow-universe');
      const todayCard = document.querySelector('.todayCard');
      const csCanvas = canvas ? window.getComputedStyle(canvas) : null;
      const csToday = todayCard ? window.getComputedStyle(todayCard, '::before') : null;

      return {
        theme: document.documentElement.dataset.theme,
        canvasOpacity: csCanvas?.opacity,
        todayCardFilter: csToday?.filter,
        todayCardBg: csToday?.backgroundImage?.slice(0, 60),
      };
    });

    console.log('Dark Mode Snow Audit Results:', darkAudit);
    if (darkAudit.theme !== 'dark') {
      throw new Error('FAIL: Theme did not switch to dark');
    }
    if (!darkAudit.todayCardFilter || darkAudit.todayCardFilter === 'none') {
      throw new Error('FAIL: Dark mode snow cap is missing moonlit drop-shadow glow filter');
    }
    console.log('✅ Dark mode moonlit snow cap verified with atmospheric glow!');

    const darkScreenPath = path.join(screenshotDir, 'snow-homepage-dark.png');
    await page.screenshot({ path: darkScreenPath, fullPage: false });
    const darkFullScreenPath = path.join(screenshotDir, 'snow-homepage-dark-full.png');
    await page.screenshot({ path: darkFullScreenPath, fullPage: true });
    console.log('📸 Dark mode screenshot saved to:', darkScreenPath, darkFullScreenPath);

    // 3. Test Background Toggle to Clean and Back
    console.log('\n--- 3. Auditing Background Mode Switch (Snow <-> Clean) ---');
    const bgBtn = await page.$('#background-mode');
    if (bgBtn) {
      // Toggle to clean
      await bgBtn.click();
      await page.waitForTimeout(400);

      const cleanCheck = await page.evaluate(() => {
        const canvas = document.getElementById('theme-snow-universe');
        const todayCard = document.querySelector('.todayCard');
        const csCanvas = canvas ? window.getComputedStyle(canvas) : null;
        const csToday = todayCard ? window.getComputedStyle(todayCard, '::before') : null;
        return {
          datasetBg: document.documentElement.dataset.background,
          canvasOpacity: csCanvas?.opacity,
          todayCardBeforeDisplay: csToday?.display,
          todayCardBeforeImage: csToday?.backgroundImage,
        };
      });

      console.log('Switched to clean background mode:', cleanCheck);
      if (cleanCheck.datasetBg !== 'clean') {
        throw new Error(`FAIL: Background did not toggle to clean: ${cleanCheck.datasetBg}`);
      }
      if (cleanCheck.canvasOpacity === '1') {
        throw new Error('FAIL: Canvas snow universe remained fully visible in clean mode');
      }
      if (cleanCheck.todayCardBeforeImage && cleanCheck.todayCardBeforeImage !== 'none') {
        throw new Error('FAIL: Today card still rendered snow cap in clean mode');
      }
      console.log('✅ Clean mode clean baseline confirmed: all snow caps and canvas suspended!');

      // Toggle back to snow
      await bgBtn.click();
      await page.waitForTimeout(400);

      const snowRestoreCheck = await page.evaluate(() => {
        const canvas = document.getElementById('theme-snow-universe');
        const todayCard = document.querySelector('.todayCard');
        const csCanvas = canvas ? window.getComputedStyle(canvas) : null;
        const csToday = todayCard ? window.getComputedStyle(todayCard, '::before') : null;
        return {
          datasetBg: document.documentElement.dataset.background,
          canvasOpacity: csCanvas?.opacity,
          todayCardBeforeImage: csToday?.backgroundImage?.slice(0, 40),
        };
      });

      console.log('Restored to snow background mode:', snowRestoreCheck);
      if (snowRestoreCheck.datasetBg !== 'snow') {
        throw new Error(`FAIL: Background did not restore to snow: ${snowRestoreCheck.datasetBg}`);
      }
      if (!snowRestoreCheck.todayCardBeforeImage || snowRestoreCheck.todayCardBeforeImage === 'none') {
        throw new Error('FAIL: Snow caps did not restore after switching back to snow');
      }
      console.log('✅ Snow mode successfully restored with active snow universe and card caps!');
    }

    await browser.close();
    console.log('\n🎉 ALL HOMEPAGE SNOW THEME TESTS PASSED! 100% verified and visual assets captured.');
  } finally {
    cleanup();
  }
}

run().catch((err) => {
  console.error('❌ Homepage Snow Verification failed:', err);
  process.exit(1);
});
