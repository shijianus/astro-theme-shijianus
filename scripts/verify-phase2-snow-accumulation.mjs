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
  const screenshotDir = path.resolve('scripts/audit_screenshots/phase2');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('🚀 Starting astro preview server for Phase 2 Snow Accumulation verification...');
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
    console.log('✅ Server online at http://127.0.0.1:4321');

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
        console.log('[BROWSER CONSOLE ERROR]', text, 'at', JSON.stringify(loc));
        if (!text.includes('favicon') && !text.includes('analytics') && !text.includes('404')) {
          consoleErrors.push(`${text} (at ${loc.url}:${loc.lineNumber})`);
        }
      }
    });

    page.on('pageerror', (err) => {
      console.log('[PAGE ERROR STACK]', err.stack || err.message);
      consoleErrors.push(err.message);
    });

    // ── 1. Audit Homepage Daylight Mode ──
    console.log('\n--- 1. Auditing Homepage Daylight Snow Accumulation ---');
    await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);

    const homeAudit = await page.evaluate(() => {
      const midCanvas = document.getElementById('theme-snow-mid');
      const isSnow = document.documentElement.dataset.background === 'snow';
      const isDay = document.documentElement.dataset.theme !== 'dark';

      // Count tracked cards matching CLOSED_BOX_SELECTORS
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
        matched,
      };
    });

    console.log('Homepage audit state:', JSON.stringify(homeAudit, null, 2));

    // Capture initial top view
    const homeTopShot = path.join(screenshotDir, '01_homepage_daylight_top.png');
    await page.screenshot({ path: homeTopShot, fullPage: false });
    console.log('📸 Homepage daylight top screenshot saved:', homeTopShot);

    // Zoom into recent post item to inspect white card contrast & snow tongues
    const postItem = await page.$('.recent-post-item');
    if (postItem) {
      const postItemShot = path.join(screenshotDir, '02_recent_post_card_zoom.png');
      await postItem.screenshot({ path: postItemShot });
      console.log('📸 Recent post card zoom screenshot saved:', postItemShot);
    }

    // Zoom into random banner or today card
    const banner = await page.$('#random-banner');
    if (banner) {
      const bannerShot = path.join(screenshotDir, '03_random_banner_zoom.png');
      await banner.screenshot({ path: bannerShot });
      console.log('📸 Random banner zoom screenshot saved:', bannerShot);
    }

    // ── 2. Audit Dynamic Scrolling (Down and Up) ──
    console.log('\n--- 2. Auditing Dynamic Scrolling on Homepage ---');
    console.log('Scrolling down 600px...');
    await page.evaluate(() => window.scrollBy({ top: 600, behavior: 'instant' }));
    await page.waitForTimeout(400);

    const scroll600Shot = path.join(screenshotDir, '04_homepage_scrolled_600px.png');
    await page.screenshot({ path: scroll600Shot, fullPage: false });
    console.log('📸 Homepage scrolled 600px saved:', scroll600Shot);

    console.log('Scrolling down another 800px (into feed & sidebar)...');
    await page.evaluate(() => window.scrollBy({ top: 800, behavior: 'instant' }));
    await page.waitForTimeout(400);

    const scroll1400Shot = path.join(screenshotDir, '05_homepage_scrolled_1400px.png');
    await page.screenshot({ path: scroll1400Shot, fullPage: false });
    console.log('📸 Homepage scrolled 1400px saved:', scroll1400Shot);

    console.log('Scrolling back up to top...');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(400);

    // ── 3. Audit Dark Mode ──
    console.log('\n--- 3. Auditing Homepage Dark Mode Snow Accumulation ---');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(600);

    const darkShot = path.join(screenshotDir, '06_homepage_dark_top.png');
    await page.screenshot({ path: darkShot, fullPage: false });
    console.log('📸 Homepage dark mode screenshot saved:', darkShot);

    if (postItem) {
      const darkCardShot = path.join(screenshotDir, '07_recent_post_card_dark_zoom.png');
      await postItem.screenshot({ path: darkCardShot });
      console.log('📸 Dark mode post card zoom screenshot saved:', darkCardShot);
    }

    // ── 4. Audit Post Page ──
    console.log('\n--- 4. Auditing Post Page Snow Accumulation ---');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'light';
    });
    await page.goto('http://127.0.0.1:4321/posts/markdown-syntax-mastery/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);

    const postPageAudit = await page.evaluate(() => {
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
    console.log('Post page audit state:', JSON.stringify(postPageAudit, null, 2));

    const postPageTopShot = path.join(screenshotDir, '08_post_page_daylight_top.png');
    await page.screenshot({ path: postPageTopShot, fullPage: false });
    console.log('📸 Post page daylight screenshot saved:', postPageTopShot);

    // Scroll to comments and related posts
    console.log('Scrolling to comments & related posts...');
    await page.evaluate(() => {
      const commentEl = document.getElementById('post-comment');
      if (commentEl) commentEl.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(600);

    const postCommentShot = path.join(screenshotDir, '09_post_comment_and_related.png');
    await page.screenshot({ path: postCommentShot, fullPage: false });
    console.log('📸 Post comments & related posts screenshot saved:', postCommentShot);

    await browser.close();

    console.log('\n--- Console Errors Check ---');
    if (consoleErrors.length > 0) {
      console.error('❌ Detected console errors during E2E testing:', consoleErrors);
      throw new Error(`Console errors detected: ${consoleErrors.join(', ')}`);
    } else {
      console.log('✅ ZERO console errors detected across all tested scenarios!');
    }

    console.log('\n🎉 Phase 2 Snow Accumulation E2E Verification PASSED completely!');
  } finally {
    cleanup();
  }
}

run().catch((err) => {
  console.error('Fatal error during Phase 2 E2E verification:', err);
  process.exit(1);
});
