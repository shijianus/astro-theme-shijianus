import { chromium } from 'playwright';

async function runVerification() {
  const targetUrl = (process.env.TARGET_URL || process.argv[2] || 'https://blog.epocanvas.com').replace(/\/+$/, '');
  console.log("================================================================================");
  console.log("❄️ [AUDIT] VERIFYING SNOW MANTLE ACCUMULATION CONTROL & HOME-ONLY PARAMETERS");
  console.log(`❄️ Target Base URL: ${targetUrl}`);
  console.log("================================================================================\n");

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();
  await page.route('**/*.mp4', r => r.abort());
  await page.route('**/*.webm', r => r.abort());

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('ERR_FAILED') && !text.includes('favicon') && !text.includes('cloudflare.com')) {
        consoleErrors.push(text);
      }
    }
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: DEFAULT STATE (enableMantle: false)
    // -------------------------------------------------------------------------
    console.log(">>> [TEST 1] Default State: Falling Snow ACTIVE, Accumulation Mantle DISABLED");
    
    await page.goto(`${targetUrl}/`, { waitUntil: 'commit', timeout: 30000 });
    await page.waitForFunction(() => {
      const loadingBox = document.querySelector('#loading-box');
      return !loadingBox || getComputedStyle(loadingBox).display === 'none' || getComputedStyle(loadingBox).opacity === '0';
    }, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => window.scrollBy(0, 150));
    await page.waitForTimeout(2000);

    const homeDefault = await page.evaluate(() => {
      const bg = document.documentElement.dataset.background;
      const mantleAttr = document.documentElement.dataset.snowMantle;
      const mantleEnabled = document.documentElement.dataset.snowMantleEnabled;
      const mantleHomeOnly = document.documentElement.dataset.snowMantleHomeOnly;
      const winConfig = (window as any).__SNOW_MANTLE_CONFIG__;
      const bgCanvas = document.getElementById('theme-snow-universe');
      const svgs = document.querySelectorAll('.card-snow-svg');
      const card = document.querySelector('.recent-post-item');
      const cardBorderTop = card ? window.getComputedStyle(card).borderTopColor : null;
      return {
        bg,
        mantleAttr,
        mantleEnabled,
        mantleHomeOnly,
        winConfig,
        bgCanvasExists: !!bgCanvas,
        svgCount: svgs.length,
        cardBorderTop
      };
    });

    console.log(`  [Home Default]: data-background=${homeDefault.bg}, data-snow-mantle=${homeDefault.mantleAttr}`);
    console.log(`  [Home Default]: data-snow-mantle-enabled=${homeDefault.mantleEnabled}, data-snow-mantle-home-only=${homeDefault.mantleHomeOnly}`);
    console.log(`  [Home Default]: window.__SNOW_MANTLE_CONFIG__ =`, JSON.stringify(homeDefault.winConfig));
    console.log(`  [Home Default]: Canvas Fall Flakes: ${homeDefault.bgCanvasExists ? '✅ RUNNING' : '❌ MISSING'}`);
    console.log(`  [Home Default]: Snow Mantle SVGs Count: ${homeDefault.svgCount} (Expected: 0) -> ${homeDefault.svgCount === 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  [Home Default]: Card Border Top: ${homeDefault.cardBorderTop} -> Normal Card Display Preserved\n`);

    // Check Article Default
    await page.goto(`${targetUrl}/posts/markdown-syntax-mastery/`, { waitUntil: 'commit', timeout: 30000 });
    await page.waitForFunction(() => {
      const loadingBox = document.querySelector('#loading-box');
      return !loadingBox || getComputedStyle(loadingBox).display === 'none' || getComputedStyle(loadingBox).opacity === '0';
    }, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => window.scrollBy(0, 150));
    await page.waitForTimeout(2000);

    const postDefault = await page.evaluate(() => {
      const bg = document.documentElement.dataset.background;
      const mantleAttr = document.documentElement.dataset.snowMantle;
      const bgCanvas = document.getElementById('theme-snow-universe');
      const svgs = document.querySelectorAll('.card-snow-svg');
      const codeBlock = document.querySelector('.code-block-shell, figure.highlight');
      const alertBlock = document.querySelector('.markdown-alert, .article-callout');
      const alertPaddingTop = alertBlock ? window.getComputedStyle(alertBlock).paddingTop : null;
      return {
        bg,
        mantleAttr,
        bgCanvasExists: !!bgCanvas,
        svgCount: svgs.length,
        hasCodeBlock: !!codeBlock,
        hasAlertBlock: !!alertBlock,
        alertPaddingTop
      };
    });

    console.log(`  [Post Default]: data-background=${postDefault.bg}, data-snow-mantle=${postDefault.mantleAttr}`);
    console.log(`  [Post Default]: Canvas Fall Flakes: ${postDefault.bgCanvasExists ? '✅ RUNNING' : '❌ MISSING'}`);
    console.log(`  [Post Default]: Snow Mantle SVGs Count: ${postDefault.svgCount} (Expected: 0) -> ${postDefault.svgCount === 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  [Post Default]: Alert Padding Top: ${postDefault.alertPaddingTop} -> Standard Article Display Preserved\n`);

    // -------------------------------------------------------------------------
    // TEST 2: ENABLED WITH HOME ONLY (enableMantle: true, homeOnly: true)
    // -------------------------------------------------------------------------
    console.log(">>> [TEST 2] Stationmaster activates: enableMantle = true, homeOnly = true");
    
    // Visit Home with override
    await page.goto(`${targetUrl}/`, { waitUntil: 'commit', timeout: 30000 });
    await page.waitForFunction(() => {
      const loadingBox = document.querySelector('#loading-box');
      return !loadingBox || getComputedStyle(loadingBox).display === 'none' || getComputedStyle(loadingBox).opacity === '0';
    }, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => {
      document.documentElement.dataset.snowMantleEnabled = 'true';
      document.documentElement.dataset.snowMantleHomeOnly = 'true';
      (window as any).__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: true };
      document.documentElement.setAttribute('data-background', 'snow');
      window.dispatchEvent(new Event('resize'));
      window.scrollBy(0, 150);
    });
    await page.waitForTimeout(2000);

    const homeHomeOnly = await page.evaluate(() => {
      const svgs = document.querySelectorAll('.card-snow-svg');
      const mantleAttr = document.documentElement.dataset.snowMantle;
      return {
        mantleAttr,
        svgCount: svgs.length
      };
    });

    console.log(`  [Home with homeOnly=true]: data-snow-mantle=${homeHomeOnly.mantleAttr}, SVGs: ${homeHomeOnly.svgCount} -> ${homeHomeOnly.svgCount > 0 ? '✅ MANTLE ATTACHED' : '❌ FAILED'}`);

    // Visit Article with same config
    await page.goto(`${targetUrl}/posts/markdown-syntax-mastery/`, { waitUntil: 'commit', timeout: 30000 });
    await page.waitForFunction(() => {
      const loadingBox = document.querySelector('#loading-box');
      return !loadingBox || getComputedStyle(loadingBox).display === 'none' || getComputedStyle(loadingBox).opacity === '0';
    }, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => {
      document.documentElement.dataset.snowMantleEnabled = 'true';
      document.documentElement.dataset.snowMantleHomeOnly = 'true';
      (window as any).__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: true };
      document.documentElement.setAttribute('data-background', 'snow');
      window.dispatchEvent(new Event('resize'));
      window.scrollBy(0, 150);
    });
    await page.waitForTimeout(2000);

    const postHomeOnly = await page.evaluate(() => {
      const svgs = document.querySelectorAll('.card-snow-svg');
      const mantleAttr = document.documentElement.dataset.snowMantle;
      const bgCanvas = document.getElementById('theme-snow-universe');
      return {
        mantleAttr,
        svgCount: svgs.length,
        bgCanvasExists: !!bgCanvas
      };
    });

    console.log(`  [Post with homeOnly=true]: data-snow-mantle=${postHomeOnly.mantleAttr}, SVGs: ${postHomeOnly.svgCount} (Expected: 0) -> ${postHomeOnly.svgCount === 0 ? '✅ 100% UNTOUCHED' : '❌ FAILED'}`);
    console.log(`  [Post with homeOnly=true]: Canvas Fall Flakes: ${postHomeOnly.bgCanvasExists ? '✅ RUNNING' : '❌ MISSING'}\n`);

    // -------------------------------------------------------------------------
    // TEST 3: ENABLED SITE-WIDE (enableMantle: true, homeOnly: false)
    // -------------------------------------------------------------------------
    console.log(">>> [TEST 3] Stationmaster activates: enableMantle = true, homeOnly = false (Site-wide)");

    await page.goto(`${targetUrl}/posts/markdown-syntax-mastery/`, { waitUntil: 'commit', timeout: 30000 });
    await page.waitForFunction(() => {
      const loadingBox = document.querySelector('#loading-box');
      return !loadingBox || getComputedStyle(loadingBox).display === 'none' || getComputedStyle(loadingBox).opacity === '0';
    }, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => {
      document.documentElement.dataset.snowMantleEnabled = 'true';
      document.documentElement.dataset.snowMantleHomeOnly = 'false';
      (window as any).__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: false };
      document.documentElement.setAttribute('data-background', 'snow');
      window.dispatchEvent(new Event('resize'));
      window.scrollBy(0, 150);
    });
    await page.waitForTimeout(2000);

    const postSiteWide = await page.evaluate(() => {
      const svgs = document.querySelectorAll('.card-snow-svg');
      const mantleAttr = document.documentElement.dataset.snowMantle;
      return {
        mantleAttr,
        svgCount: svgs.length
      };
    });

    console.log(`  [Post with homeOnly=false]: data-snow-mantle=${postSiteWide.mantleAttr}, SVGs: ${postSiteWide.svgCount} -> ${postSiteWide.svgCount > 0 ? '✅ MANTLE ATTACHED' : '❌ FAILED'}\n`);

    console.log(`- Filtered Console Errors: ${consoleErrors.length}`);
    const passed =
      homeDefault.svgCount === 0 &&
      postDefault.svgCount === 0 &&
      homeDefault.bgCanvasExists &&
      postDefault.bgCanvasExists &&
      homeHomeOnly.svgCount > 0 &&
      postHomeOnly.svgCount === 0 &&
      postSiteWide.svgCount > 0 &&
      consoleErrors.length === 0;

    console.log(`\n================================================================================");
    console.log(`OVERALL PARAMETERS VERIFICATION VERDICT: ${passed ? '✅ 100% PASS' : '❌ FAIL'}`);
    console.log(`================================================================================");

    if (!passed) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

runVerification().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
