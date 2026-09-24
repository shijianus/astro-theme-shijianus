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

  console.log('🚀 Starting astro preview server for Phase 1 Snowscape verification...');
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
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('analytics') && !text.includes('404')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    // ── 1. Audit Light Mode (Daytime Snowscape) ──
    console.log('\n--- 1. Auditing Daylight Snowscape (Light Mode) ---');
    await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // Allow dual-canvas init and particle drift

    const lightAudit = await page.evaluate(() => {
      const bgCanvas = document.getElementById('theme-snow-universe');
      const fgCanvas = document.getElementById('theme-snow-foreground');
      const webBg = document.getElementById('web_bg');

      const bgStyle = bgCanvas ? window.getComputedStyle(bgCanvas) : null;
      const fgStyle = fgCanvas ? window.getComputedStyle(fgCanvas) : null;
      const webBgStyle = webBg ? window.getComputedStyle(webBg) : null;

      return {
        theme: document.documentElement.dataset.theme,
        bgMode: document.documentElement.dataset.background,
        bgCanvas: {
          exists: !!bgCanvas,
          zIndex: bgStyle ? bgStyle.zIndex : null,
          opacity: bgStyle ? bgStyle.opacity : null,
          pointerEvents: bgStyle ? bgStyle.pointerEvents : null,
        },
        fgCanvas: {
          exists: !!fgCanvas,
          zIndex: fgStyle ? fgStyle.zIndex : null,
          opacity: fgStyle ? fgStyle.opacity : null,
          pointerEvents: fgStyle ? fgStyle.pointerEvents : null,
        },
        webBgImage: webBgStyle ? webBgStyle.backgroundImage : null,
      };
    });

    console.log('Light Mode Audit:', JSON.stringify(lightAudit, null, 2));

    if (!lightAudit.bgCanvas.exists || lightAudit.bgCanvas.opacity !== '1') {
      throw new Error('Background snow canvas missing or not opacity 1 in light mode');
    }
    if (!lightAudit.fgCanvas.exists || lightAudit.fgCanvas.opacity !== '1') {
      throw new Error('Foreground snow canvas missing or not opacity 1 in light mode');
    }
    if (!lightAudit.webBgImage || !lightAudit.webBgImage.includes('gradient')) {
      throw new Error('Winter sky gradient missing from #web_bg in light mode');
    }

    // Capture visual proof
    await page.screenshot({ path: path.join(screenshotDir, 'phase1-daylight-snow-full.png') });
    console.log('📸 Saved scripts/audit_screenshots/phase1-daylight-snow-full.png');

    // ── 2. Audit Dark Mode (Night Snowscape) ──
    console.log('\n--- 2. Auditing Nighttime Snowscape (Dark Mode) ---');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(1000);

    const darkAudit = await page.evaluate(() => {
      const bgCanvas = document.getElementById('theme-snow-universe');
      const fgCanvas = document.getElementById('theme-snow-foreground');
      const webBg = document.getElementById('web_bg');
      return {
        theme: document.documentElement.dataset.theme,
        bgCanvasOpacity: bgCanvas ? window.getComputedStyle(bgCanvas).opacity : null,
        fgCanvasOpacity: fgCanvas ? window.getComputedStyle(fgCanvas).opacity : null,
        webBgImage: webBg ? window.getComputedStyle(webBg).backgroundImage : null,
      };
    });

    console.log('Dark Mode Audit:', JSON.stringify(darkAudit, null, 2));
    if (darkAudit.bgCanvasOpacity !== '1' || darkAudit.fgCanvasOpacity !== '1') {
      throw new Error('Canvases not active in dark mode');
    }
    await page.screenshot({ path: path.join(screenshotDir, 'phase1-night-snow-full.png') });
    console.log('📸 Saved scripts/audit_screenshots/phase1-night-snow-full.png');

    // ── 3. Audit Clean Mode (Zero Snow Pollution) ──
    console.log('\n--- 3. Auditing Clean Background Mode (Suppression) ---');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'light';
      document.documentElement.dataset.background = 'clean';
    });
    await page.waitForTimeout(600); // wait for 0.4s transition

    const cleanAudit = await page.evaluate(() => {
      const bgCanvas = document.getElementById('theme-snow-universe');
      const fgCanvas = document.getElementById('theme-snow-foreground');
      const webBg = document.getElementById('web_bg');
      return {
        bgCanvasOpacity: bgCanvas ? window.getComputedStyle(bgCanvas).opacity : null,
        fgCanvasOpacity: fgCanvas ? window.getComputedStyle(fgCanvas).opacity : null,
        webBgColor: webBg ? window.getComputedStyle(webBg).backgroundColor : null,
      };
    });

    console.log('Clean Mode Audit:', JSON.stringify(cleanAudit, null, 2));
    if (cleanAudit.bgCanvasOpacity !== '0' || cleanAudit.fgCanvasOpacity !== '0') {
      throw new Error('Canvases did not fade to opacity 0 in clean mode');
    }

    // ── 4. Audit Overlay Suppression ──
    console.log('\n--- 4. Auditing Modal/Overlay Foreground Snow Suppression ---');
    await page.evaluate(() => {
      document.documentElement.dataset.background = 'snow';
      document.body.classList.add('theme-overlay-open');
    });
    await page.waitForTimeout(300);

    const overlayAudit = await page.evaluate(() => {
      const fgCanvas = document.getElementById('theme-snow-foreground');
      const style = fgCanvas ? window.getComputedStyle(fgCanvas) : null;
      return {
        opacity: style ? style.opacity : null,
        visibility: style ? style.visibility : null,
      };
    });

    console.log('Overlay Suppression Audit:', JSON.stringify(overlayAudit, null, 2));
    if (overlayAudit.opacity !== '0' || overlayAudit.visibility !== 'hidden') {
      throw new Error('Foreground snow canvas not hidden during open overlay');
    }

    // Check console errors
    console.log('\n--- 5. Console Error Verification ---');
    console.log('Total Console Errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('Errors found:', consoleErrors);
      throw new Error(`Console errors detected during snowscape execution`);
    }

    await browser.close();
    console.log('\n🎉 ALL PHASE 1 SNOWSCAPE AUDITS PASSED WITH ZERO ERRORS!');
  } finally {
    cleanup();
  }
}

run().catch((err) => {
  console.error('❌ Audit Failed:', err);
  process.exit(1);
});
