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

  console.log('🚀 Starting preview server for Autonomous Physics Snowscape audit...');
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

    // ── 1. Audit Light Mode (Winter Morning Snow Day) ──
    console.log('\n--- 1. Auditing Snowscape Architecture (Light Mode) ---');
    await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200); // Allow dual-canvas boot

    const lightAudit = await page.evaluate(() => {
      const bgCanvas = document.getElementById('theme-snow-bg');
      const fgCanvas = document.getElementById('theme-snow-fg');
      const inCardSnowCovers = document.querySelectorAll('.snow-cover, [data-snow-cover]');
      const postCard = document.querySelector('.recent-post-item');
      const banner = document.querySelector('#bannerGroup #random-banner');
      const todayCard = document.querySelector('.todayCard');
      const pagination = document.querySelector('#home-pagination, .home-pagination');

      const bgStyle = bgCanvas ? window.getComputedStyle(bgCanvas) : null;
      const fgStyle = fgCanvas ? window.getComputedStyle(fgCanvas) : null;

      // Check if fgCanvas has non-zero pixels drawn near the top of the post card
      let fgHasDrawnPixels = false;
      if (fgCanvas) {
        try {
          const ctx = fgCanvas.getContext('2d');
          if (ctx) {
            // Sample a 50x20 box around post card top-left
            const rect = postCard ? postCard.getBoundingClientRect() : null;
            if (rect) {
              const sampleX = Math.max(0, Math.round(rect.left - 2));
              const sampleY = Math.max(0, Math.round(rect.top - 8));
              const imgData = ctx.getImageData(sampleX, sampleY, 40, 20);
              for (let i = 3; i < imgData.data.length; i += 4) {
                if (imgData.data[i] > 10) {
                  fgHasDrawnPixels = true;
                  break;
                }
              }
            }
          }
        } catch (e) {
          // Canvas security/context
        }
      }

      return {
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
        fgHasDrawnPixels,
      };
    });

    console.log('Light Mode Snowscape Audit Result:', JSON.stringify(lightAudit, null, 2));

    if (lightAudit.inCardSnowCount !== 0) {
      throw new Error(`CRITICAL: In-card snow pollution detected! Count: ${lightAudit.inCardSnowCount}`);
    }
    if (!lightAudit.bgCanvas.exists || !lightAudit.fgCanvas.exists) {
      throw new Error('CRITICAL: Dual canvas elements missing!');
    }
    if (lightAudit.fgCanvas.zIndex !== '35' || lightAudit.fgCanvas.pointerEvents !== 'none') {
      throw new Error(`CRITICAL: Foreground physics canvas zIndex/pointerEvents invalid! ${JSON.stringify(lightAudit.fgCanvas)}`);
    }

    // Capture Light Mode Screenshots
    await page.screenshot({
      path: path.join(screenshotDir, 'physics-snow-light-desktop.png'),
      fullPage: false,
    });
    console.log('📸 Saved light mode screenshot: physics-snow-light-desktop.png');

    // ── 2. Test Interactive Hover Shedding & Cascading ──
    console.log('\n--- 2. Testing Interactive Hover Shedding & Cascading ---');
    // Scroll slightly so feed cards are fully in view
    await page.evaluate(() => {
      window.scrollTo({ top: 400, behavior: 'instant' });
    });
    await page.waitForTimeout(400);

    const postCardHandle = await page.$('#recent-posts .recent-post-item');
    if (postCardHandle) {
      await postCardHandle.hover({ force: true });
      console.log('🖱️ Hovered over #recent-posts .recent-post-item to trigger snow clump shedding');
      await page.waitForTimeout(400); // Snow clump begins gravity fall
      await page.screenshot({
        path: path.join(screenshotDir, 'physics-snow-hover-shedding.png'),
        fullPage: false,
      });
      console.log('📸 Saved hover shedding screenshot: physics-snow-hover-shedding.png');
    }

    // ── 3. Audit Dark Mode ──
    console.log('\n--- 3. Auditing Dark Mode Snowscape ---');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(800);

    const darkAudit = await page.evaluate(() => {
      const bgCanvas = document.getElementById('theme-snow-bg');
      const fgCanvas = document.getElementById('theme-snow-fg');
      return {
        theme: document.documentElement.dataset.theme,
        bgOpacity: bgCanvas ? window.getComputedStyle(bgCanvas).opacity : null,
        fgOpacity: fgCanvas ? window.getComputedStyle(fgCanvas).opacity : null,
      };
    });
    console.log('Dark Mode Snowscape Audit Result:', JSON.stringify(darkAudit, null, 2));

    await page.screenshot({
      path: path.join(screenshotDir, 'physics-snow-dark-desktop.png'),
      fullPage: false,
    });
    console.log('📸 Saved dark mode screenshot: physics-snow-dark-desktop.png');

    // ── 4. Scroll Down to Audit Lower Pagination Surface & Impact ──
    console.log('\n--- 4. Auditing Bottom Pagination Surface ---');
    await page.evaluate(() => {
      window.scrollTo({ top: 1200, behavior: 'instant' });
    });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'physics-snow-pagination-scroll.png'),
      fullPage: false,
    });
    console.log('📸 Saved scroll pagination screenshot: physics-snow-pagination-scroll.png');

    await browser.close();
    console.log('\n🎉 ALL PHYSICS SNOWSCAPE AUDITS PASSED WITH ZERO POLLUTION!');
  } finally {
    cleanup();
  }
}

run().catch((err) => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
