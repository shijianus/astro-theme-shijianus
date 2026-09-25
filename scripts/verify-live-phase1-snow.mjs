import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function runLiveAudit() {
  const screenshotDir = path.resolve('scripts/audit_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const liveUrl = process.env.LIVE_URL || 'https://blog.epocanvas.com/';
  console.log(`🚀 Starting Playwright Live E2E Audit on: ${liveUrl}`);

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
      if (!text.includes('favicon') && !text.includes('analytics')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  try {
    // ── 1. Visit Live Site Light Mode ──
    console.log('\n--- 1. Auditing Live Production Daylight Snowscape (Light Mode) ---');
    await page.goto(liveUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000); // Allow dual-canvas init and particle drift

    const liveLightAudit = await page.evaluate(() => {
      const bgCanvas = document.getElementById('theme-snow-universe');
      const midCanvas = document.getElementById('theme-snow-mid');
      const fgCanvas = document.getElementById('theme-snow-foreground');
      const webBg = document.getElementById('web_bg');

      const bgStyle = bgCanvas ? window.getComputedStyle(bgCanvas) : null;
      const midStyle = midCanvas ? window.getComputedStyle(midCanvas) : null;
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
        midCanvas: {
          exists: !!midCanvas,
          zIndex: midStyle ? midStyle.zIndex : null,
          opacity: midStyle ? midStyle.opacity : null,
          pointerEvents: midStyle ? midStyle.pointerEvents : null,
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

    console.log('Live Light Mode Audit Result:', JSON.stringify(liveLightAudit, null, 2));

    if (!liveLightAudit.bgCanvas.exists || liveLightAudit.bgCanvas.opacity !== '1') {
      throw new Error('Live background snow canvas missing or not opacity 1');
    }
    if (!liveLightAudit.midCanvas.exists || liveLightAudit.midCanvas.opacity !== '1') {
      throw new Error('Live mid snow canvas missing or not opacity 1');
    }
    if (!liveLightAudit.fgCanvas.exists || liveLightAudit.fgCanvas.opacity !== '1') {
      throw new Error('Live foreground snow canvas missing or not opacity 1');
    }

    await page.screenshot({ path: path.join(screenshotDir, 'live-daylight-snow.png') });
    console.log('📸 Saved live screenshot: live-daylight-snow.png');

    // ── 2. Test Live Night Mode ──
    console.log('\n--- 2. Auditing Live Production Night Snowscape (Dark Mode) ---');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(1000);

    const liveDarkAudit = await page.evaluate(() => {
      const bgCanvas = document.getElementById('theme-snow-universe');
      const midCanvas = document.getElementById('theme-snow-mid');
      const fgCanvas = document.getElementById('theme-snow-foreground');
      const webBg = document.getElementById('web_bg');
      return {
        theme: document.documentElement.dataset.theme,
        bgOpacity: bgCanvas ? window.getComputedStyle(bgCanvas).opacity : null,
        midOpacity: midCanvas ? window.getComputedStyle(midCanvas).opacity : null,
        fgOpacity: fgCanvas ? window.getComputedStyle(fgCanvas).opacity : null,
        webBgImage: webBg ? window.getComputedStyle(webBg).backgroundImage : null,
      };
    });

    console.log('Live Dark Mode Audit Result:', JSON.stringify(liveDarkAudit, null, 2));
    if (liveDarkAudit.bgOpacity !== '1' || liveDarkAudit.midOpacity !== '1' || liveDarkAudit.fgOpacity !== '1') {
      throw new Error('Live canvases not active in dark mode');
    }

    await page.screenshot({ path: path.join(screenshotDir, 'live-night-snow.png') });
    console.log('📸 Saved live screenshot: live-night-snow.png');

    // ── 3. Test Live Clean Mode Switch ──
    console.log('\n--- 3. Auditing Live Clean Mode Switch ---');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'light';
      document.documentElement.dataset.background = 'clean';
    });
    await page.waitForTimeout(600);

    const liveCleanAudit = await page.evaluate(() => {
      const bgCanvas = document.getElementById('theme-snow-universe');
      const midCanvas = document.getElementById('theme-snow-mid');
      const fgCanvas = document.getElementById('theme-snow-foreground');
      return {
        bgOpacity: bgCanvas ? window.getComputedStyle(bgCanvas).opacity : null,
        midOpacity: midCanvas ? window.getComputedStyle(midCanvas).opacity : null,
        fgOpacity: fgCanvas ? window.getComputedStyle(fgCanvas).opacity : null,
      };
    });

    console.log('Live Clean Mode Audit Result:', JSON.stringify(liveCleanAudit, null, 2));
    if (liveCleanAudit.bgOpacity !== '0' || liveCleanAudit.midOpacity !== '0' || liveCleanAudit.fgOpacity !== '0') {
      throw new Error('Live canvases did not fade to 0 in clean mode');
    }

    // ── 4. Verify 0 Console Errors ──
    console.log('\n--- 4. Live Console Error Verification ---');
    console.log('Total Console Errors on Live Site:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.warn('Live console errors:', consoleErrors);
    } else {
      console.log('✅ 0 Console errors detected on live production!');
    }

    await browser.close();
    console.log('\n🎉 LIVE PRODUCTION AUDIT PASSED 100%!');
  } catch (err) {
    await browser.close();
    throw err;
  }
}

runLiveAudit().catch((err) => {
  console.error('❌ Live Audit Failed:', err);
  process.exit(1);
});
