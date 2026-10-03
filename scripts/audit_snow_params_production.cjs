const { chromium } = require('playwright');
const fs = require('fs');

async function runAudit() {
  console.log("================================================================================");
  console.log("❄️ [AUDIT] VERIFYING PRODUCTION SNOW MANTLE PARAMETERS ON LIVE SITE");
  console.log("Target Production Domain: https://blog.epocanvas.com/");
  console.log("================================================================================\n");

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  const report = {
    timestamp: new Date().toISOString(),
    tests: {},
    passed: false
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: HOME PAGE DEFAULT (Falling snow active, Mantle disabled)
    // -------------------------------------------------------------------------
    console.log(">>> [1/4] Auditing Homepage Default State (https://blog.epocanvas.com/)...");
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, userAgent });
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

    await page.goto('https://blog.epocanvas.com/', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 15000 });
    await page.locator('#loading-box').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.evaluate(() => window.scrollBy(0, 150));
    await page.waitForTimeout(2000);

    const homeData = await page.evaluate(() => {
      const html = document.documentElement;
      const bg = html.dataset.background;
      const mantle = html.dataset.snowMantle;
      const mantleEnabled = html.dataset.snowMantleEnabled;
      const mantleHomeOnly = html.dataset.snowMantleHomeOnly;
      const winConfig = window.__SNOW_MANTLE_CONFIG__;
      const bgCanvas = document.getElementById('theme-snow-universe');
      const svgs = document.querySelectorAll('.card-snow-svg');
      const cards = document.querySelectorAll('.recent-post-item');
      let cardBorderTop = null;
      if (cards.length > 0) {
        cardBorderTop = window.getComputedStyle(cards[0]).borderTopColor;
      }
      return {
        bg,
        mantle,
        mantleEnabled,
        mantleHomeOnly,
        winConfig,
        bgCanvasExists: !!bgCanvas,
        svgCount: svgs.length,
        cardCount: cards.length,
        cardBorderTop
      };
    });

    console.log("  Home Default:", JSON.stringify(homeData));
    report.tests.homeDefault = homeData;

    // -------------------------------------------------------------------------
    // TEST 2: HOME OVERRIDE (enableMantle = true, homeOnly = true)
    // -------------------------------------------------------------------------
    console.log(">>> [2/4] Testing Stationmaster Override on Home (enableMantle=true, homeOnly=true)...");
    await page.evaluate(() => {
      document.documentElement.dataset.snowMantleEnabled = 'true';
      document.documentElement.dataset.snowMantleHomeOnly = 'true';
      window.__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: true };
      document.documentElement.setAttribute('data-background', 'snow');
      window.dispatchEvent(new Event('resize'));
      window.scrollBy(0, 150);
    });
    await page.waitForTimeout(2500);

    const homeOverride = await page.evaluate(() => {
      const svgs = document.querySelectorAll('.card-snow-svg');
      const mantle = document.documentElement.dataset.snowMantle;
      return { mantle, svgCount: svgs.length };
    });

    console.log("  Home with Mantle Enabled:", JSON.stringify(homeOverride));
    report.tests.homeOverride = homeOverride;
    await page.close();

    // -------------------------------------------------------------------------
    // TEST 3: ARTICLE PAGE DEFAULT (Falling snow active, Mantle disabled)
    // -------------------------------------------------------------------------
    console.log(">>> [3/4] Auditing Article Default State (https://blog.epocanvas.com/posts/markdown-syntax-mastery/)...");
    const postPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, userAgent });
    await postPage.route('**/*.mp4', r => r.abort());
    await postPage.route('**/*.webm', r => r.abort());

    postPage.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('ERR_FAILED') && !text.includes('favicon') && !text.includes('cloudflare.com')) {
          consoleErrors.push(text);
        }
      }
    });

    await postPage.goto('https://blog.epocanvas.com/posts/markdown-syntax-mastery/', { waitUntil: 'commit', timeout: 30000 });
    await postPage.waitForSelector('body', { timeout: 15000 });
    await postPage.locator('#loading-box').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await postPage.evaluate(() => window.scrollBy(0, 150));
    await postPage.waitForTimeout(2000);

    const postData = await postPage.evaluate(() => {
      const html = document.documentElement;
      const bg = html.dataset.background;
      const mantle = html.dataset.snowMantle;
      const mantleEnabled = html.dataset.snowMantleEnabled;
      const mantleHomeOnly = html.dataset.snowMantleHomeOnly;
      const winConfig = window.__SNOW_MANTLE_CONFIG__;
      const bgCanvas = document.getElementById('theme-snow-universe');
      const svgs = document.querySelectorAll('.card-snow-svg');
      const alert = document.querySelector('.markdown-alert, .article-callout');
      const alertPaddingTop = alert ? window.getComputedStyle(alert).paddingTop : null;
      return {
        bg,
        mantle,
        mantleEnabled,
        mantleHomeOnly,
        winConfig,
        bgCanvasExists: !!bgCanvas,
        svgCount: svgs.length,
        hasAlert: !!alert,
        alertPaddingTop
      };
    });

    console.log("  Post Default:", JSON.stringify(postData));
    report.tests.postDefault = postData;

    // -------------------------------------------------------------------------
    // TEST 4: ARTICLE WITH HOME-ONLY VS SITE-WIDE OVERRIDE
    // -------------------------------------------------------------------------
    console.log(">>> [4/4] Testing Article Overrides (homeOnly=true vs homeOnly=false)...");
    // Sub-test A: homeOnly = true on Article
    await postPage.evaluate(() => {
      document.documentElement.dataset.snowMantleEnabled = 'true';
      document.documentElement.dataset.snowMantleHomeOnly = 'true';
      window.__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: true };
      document.documentElement.setAttribute('data-background', 'snow');
      window.dispatchEvent(new Event('resize'));
      window.scrollBy(0, 150);
    });
    await postPage.waitForTimeout(2000);

    const postHomeOnlyOverride = await postPage.evaluate(() => {
      const svgs = document.querySelectorAll('.card-snow-svg');
      const mantle = document.documentElement.dataset.snowMantle;
      return { mantle, svgCount: svgs.length };
    });
    console.log("  Post with homeOnly=true (Expected svgCount: 0):", JSON.stringify(postHomeOnlyOverride));
    report.tests.postHomeOnlyOverride = postHomeOnlyOverride;

    // Sub-test B: homeOnly = false on Article (Site-wide)
    await postPage.evaluate(() => {
      document.documentElement.dataset.snowMantleEnabled = 'true';
      document.documentElement.dataset.snowMantleHomeOnly = 'false';
      window.__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: false };
      document.documentElement.setAttribute('data-background', 'snow');
      window.dispatchEvent(new Event('resize'));
      window.scrollBy(0, 150);
    });
    await postPage.waitForTimeout(2500);

    const postSiteWideOverride = await postPage.evaluate(() => {
      const svgs = document.querySelectorAll('.card-snow-svg');
      const mantle = document.documentElement.dataset.snowMantle;
      return { mantle, svgCount: svgs.length };
    });
    console.log("  Post with homeOnly=false (Expected svgCount > 0):", JSON.stringify(postSiteWideOverride));
    report.tests.postSiteWideOverride = postSiteWideOverride;

    await postPage.close();

    // -------------------------------------------------------------------------
    // SUMMARY EVALUATION
    // -------------------------------------------------------------------------
    report.consoleErrors = consoleErrors;
    const passHomeDefault = homeData.mantle === 'disabled' && homeData.svgCount === 0 && homeData.bgCanvasExists;
    const passPostDefault = postData.mantle === 'disabled' && postData.svgCount === 0 && postData.bgCanvasExists;
    const passHomeOverride = homeOverride.svgCount > 0;
    const passPostHomeOnly = postHomeOnlyOverride.svgCount === 0;
    const passPostSiteWide = postSiteWideOverride.svgCount > 0;
    const passErrors = consoleErrors.length === 0;

    report.evaluations = {
      passHomeDefault,
      passPostDefault,
      passHomeOverride,
      passPostHomeOnly,
      passPostSiteWide,
      passErrors
    };

    report.passed =
      passHomeDefault &&
      passPostDefault &&
      passHomeOverride &&
      passHomeOnlyPost &&
      passPostSiteWide &&
      passErrors;

    fs.writeFileSync('reports/snow-params-audit-result.json', JSON.stringify(report, null, 2));

    console.log("\n================================================================================");
    console.log("❄️ AUDIT SUMMARY ON PRODUCTION (https://blog.epocanvas.com/):");
    console.log(`  1. Home Default State (Mantle: disabled, SVGs: ${homeData.svgCount}, Canvas: ${homeData.bgCanvasExists}): ${passHomeDefault ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  2. Post Default State (Mantle: disabled, SVGs: ${postData.svgCount}, Canvas: ${postData.bgCanvasExists}): ${passPostDefault ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  3. Home Stationmaster Activation (SVGs: ${homeOverride.svgCount}): ${passHomeOverride ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  4. Post Stationmaster Home-Only Guard (SVGs: ${postHomeOnlyOverride.svgCount}): ${passPostHomeOnly ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  5. Post Stationmaster Site-Wide Activation (SVGs: ${postSiteWideOverride.svgCount}): ${passPostSiteWide ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  6. Zero Console Errors (Count: ${consoleErrors.length}): ${passErrors ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`OVERALL VERDICT: ${report.passed ? '🎉 ALL 6 AUDIT CHECKS PASSED 100%' : '❌ FAILED'}`);
    console.log("================================================================================\n");

    if (!report.passed) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

runAudit().catch(err => {
  console.error("Fatal audit error:", err);
  process.exit(1);
});
