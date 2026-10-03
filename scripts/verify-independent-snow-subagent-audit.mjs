import { chromium } from 'playwright';

async function runIndependentAudit() {
  const targetUrl = (process.env.TARGET_URL || process.argv[2] || 'https://blog.epocanvas.com').replace(/\/+$/, '');
  console.log('================================================================================');
  console.log('❄️ [INDEPENDENT AUDIT] PRODUCTION LIVE E2E VERIFICATION ON ' + targetUrl);
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const fatalErrors = [];

  async function auditPage(url, pageName, setupFn, evalFn) {
    console.log(`\n--- Inspecting [${pageName}]: ${url} ---`);
    const page = await context.newPage();
    const pageErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore expected external network drops or 3rd party tracker errors if any
        if (!text.includes('ERR_FAILED') && !text.includes('favicon') && !text.includes('cloudflare.com') && !text.includes('fonts.googleapis')) {
          pageErrors.push(text);
          fatalErrors.push(`[${pageName}] ${text}`);
        }
      }
    });

    page.on('pageerror', err => {
      const errStr = err.toString();
      pageErrors.push(`PageError: ${errStr}`);
      fatalErrors.push(`[${pageName}] Uncaught: ${errStr}`);
    });

    await page.route('**/*.mp4', r => r.abort());
    await page.route('**/*.webm', r => r.abort());

    try {
      console.log(`Navigating with timeout 60000ms...`);
      await page.goto(url, { waitUntil: 'commit', timeout: 60000 });

      // Wait for full DOM to finish streaming and parsing
      await page.waitForSelector('#footer-wrap, footer, #post', { state: 'attached', timeout: 45000 });
      await page.locator('#loading-box').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);

      if (setupFn) {
        await page.evaluate(setupFn);
        await page.waitForTimeout(2000);
      }

      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(1500);

      const result = await page.evaluate(evalFn);
      result.consoleErrors = pageErrors;
      return result;
    } finally {
      await page.close().catch(() => {});
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. DEFAULT STATE: HOME PAGE
    // -------------------------------------------------------------------------
    const homeDefault = await auditPage(
      `${targetUrl}/`,
      'Default Home',
      null,
      () => {
        const bg = document.documentElement.dataset.background;
        const mantleAttr = document.documentElement.dataset.snowMantle;
        const mantleEnabled = document.documentElement.dataset.snowMantleEnabled;
        const mantleHomeOnly = document.documentElement.dataset.snowMantleHomeOnly;
        const winConfig = (window).__SNOW_MANTLE_CONFIG__;
        const bgCanvas = document.getElementById('theme-snow-universe');
        const midCanvas = document.getElementById('theme-snow-mid');
        const fgCanvas = document.getElementById('theme-snow-foreground');
        const svgs = document.querySelectorAll('.card-snow-svg');
        const cards = document.querySelectorAll('.recent-post-item');
        const firstCard = cards[0];
        const cardBorderTop = firstCard ? window.getComputedStyle(firstCard).borderTopColor : null;
        const cardOverflow = firstCard ? window.getComputedStyle(firstCard).overflow : null;

        return {
          bg,
          mantleAttr,
          mantleEnabled,
          mantleHomeOnly,
          winConfig,
          bgCanvas: !!bgCanvas,
          midCanvas: !!midCanvas,
          fgCanvas: !!fgCanvas,
          svgCount: svgs.length,
          cardBorderTop,
          cardOverflow
        };
      }
    );

    console.log(`[Home Default Results]:`);
    console.log(`  - HTML data-background: ${homeDefault.bg}`);
    console.log(`  - HTML data-snow-mantle: ${homeDefault.mantleAttr}`);
    console.log(`  - HTML data-snow-mantle-enabled: ${homeDefault.mantleEnabled}`);
    console.log(`  - HTML data-snow-mantle-home-only: ${homeDefault.mantleHomeOnly}`);
    console.log(`  - window.__SNOW_MANTLE_CONFIG__:`, JSON.stringify(homeDefault.winConfig));
    console.log(`  - Snow Canvas Stack: bgCanvas=${homeDefault.bgCanvas}, midCanvas=${homeDefault.midCanvas}, fgCanvas=${homeDefault.fgCanvas}`);
    console.log(`  - In-Card Snow SVGs (.card-snow-svg): ${homeDefault.svgCount}`);
    console.log(`  - First Card Border-Top-Color: ${homeDefault.cardBorderTop}`);
    console.log(`  - First Card Overflow: ${homeDefault.cardOverflow}`);
    console.log(`  - Fatal Errors: ${homeDefault.consoleErrors.length}`);

    // -------------------------------------------------------------------------
    // 2. DEFAULT STATE: POST PAGE
    // -------------------------------------------------------------------------
    const postDefault = await auditPage(
      `${targetUrl}/posts/markdown-syntax-mastery/`,
      'Default Post',
      null,
      () => {
        const bg = document.documentElement.dataset.background;
        const mantleAttr = document.documentElement.dataset.snowMantle;
        const mantleEnabled = document.documentElement.dataset.snowMantleEnabled;
        const mantleHomeOnly = document.documentElement.dataset.snowMantleHomeOnly;
        const winConfig = (window).__SNOW_MANTLE_CONFIG__;
        const bgCanvas = document.getElementById('theme-snow-universe');
        const svgs = document.querySelectorAll('.card-snow-svg');
        const alertBlock = document.querySelector('.markdown-alert, .article-callout, .admonition');
        const alertPaddingTop = alertBlock ? window.getComputedStyle(alertBlock).paddingTop : null;
        const alertBorderTopColor = alertBlock ? window.getComputedStyle(alertBlock).borderTopColor : null;
        const postCard = document.querySelector('#post');
        const postOverflow = postCard ? window.getComputedStyle(postCard).overflow : null;

        return {
          bg,
          mantleAttr,
          mantleEnabled,
          mantleHomeOnly,
          winConfig,
          bgCanvas: !!bgCanvas,
          svgCount: svgs.length,
          alertPaddingTop,
          alertBorderTopColor,
          postOverflow
        };
      }
    );

    console.log(`[Post Default Results]:`);
    console.log(`  - HTML data-background: ${postDefault.bg}`);
    console.log(`  - HTML data-snow-mantle: ${postDefault.mantleAttr}`);
    console.log(`  - Snow Canvas (theme-snow-universe): ${postDefault.bgCanvas}`);
    console.log(`  - In-Card Snow SVGs (.card-snow-svg): ${postDefault.svgCount}`);
    console.log(`  - Alert Block Padding Top: ${postDefault.alertPaddingTop}`);
    console.log(`  - Alert Block Border Top Color: ${postDefault.alertBorderTopColor}`);
    console.log(`  - Post Card Overflow: ${postDefault.postOverflow}`);
    console.log(`  - Fatal Errors: ${postDefault.consoleErrors.length}`);

    // -------------------------------------------------------------------------
    // 3. STATIONMASTER OVERRIDE: enableMantle=true & homeOnly=true
    // -------------------------------------------------------------------------
    console.log('\n--- Override Scenario 1: enableMantle=true & homeOnly=true ---');
    const homeHomeOnly = await auditPage(
      `${targetUrl}/`,
      'Home (enableMantle=true, homeOnly=true)',
      () => {
        document.documentElement.dataset.snowMantleEnabled = 'true';
        document.documentElement.dataset.snowMantleHomeOnly = 'true';
        window.__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: true };
        document.documentElement.setAttribute('data-background', 'snow');
        window.dispatchEvent(new Event('resize'));
        window.scrollBy(0, 150);
      },
      () => {
        const svgs = document.querySelectorAll('.card-snow-svg');
        const mantleAttr = document.documentElement.dataset.snowMantle;
        return {
          mantleAttr,
          svgCount: svgs.length
        };
      }
    );
    console.log(`  - Home data-snow-mantle: ${homeHomeOnly.mantleAttr}`);
    console.log(`  - Home In-Card Snow SVGs: ${homeHomeOnly.svgCount} (Expected: > 0)`);

    const postHomeOnly = await auditPage(
      `${targetUrl}/posts/markdown-syntax-mastery/`,
      'Post (enableMantle=true, homeOnly=true)',
      () => {
        document.documentElement.dataset.snowMantleEnabled = 'true';
        document.documentElement.dataset.snowMantleHomeOnly = 'true';
        window.__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: true };
        document.documentElement.setAttribute('data-background', 'snow');
        window.dispatchEvent(new Event('resize'));
        window.scrollBy(0, 150);
      },
      () => {
        const svgs = document.querySelectorAll('.card-snow-svg');
        const mantleAttr = document.documentElement.dataset.snowMantle;
        const bgCanvas = document.getElementById('theme-snow-universe');
        return {
          mantleAttr,
          svgCount: svgs.length,
          bgCanvas: !!bgCanvas
        };
      }
    );
    console.log(`  - Post data-snow-mantle: ${postHomeOnly.mantleAttr}`);
    console.log(`  - Post In-Card Snow SVGs: ${postHomeOnly.svgCount} (Expected: 0)`);
    console.log(`  - Post Sky Snow Canvas: ${postHomeOnly.bgCanvas}`);

    // -------------------------------------------------------------------------
    // 4. STATIONMASTER OVERRIDE: enableMantle=true & homeOnly=false (Site-Wide)
    // -------------------------------------------------------------------------
    console.log('\n--- Override Scenario 2: enableMantle=true & homeOnly=false (Site-Wide) ---');
    const postSiteWide = await auditPage(
      `${targetUrl}/posts/markdown-syntax-mastery/`,
      'Post (enableMantle=true, homeOnly=false)',
      () => {
        document.documentElement.dataset.snowMantleEnabled = 'true';
        document.documentElement.dataset.snowMantleHomeOnly = 'false';
        window.__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: false };
        document.documentElement.setAttribute('data-background', 'snow');
        window.dispatchEvent(new Event('resize'));
        window.scrollBy(0, 150);
      },
      () => {
        const svgs = document.querySelectorAll('.card-snow-svg');
        const mantleAttr = document.documentElement.dataset.snowMantle;
        return {
          mantleAttr,
          svgCount: svgs.length
        };
      }
    );
    console.log(`  - Post (Site-Wide) data-snow-mantle: ${postSiteWide.mantleAttr}`);
    console.log(`  - Post (Site-Wide) In-Card Snow SVGs: ${postSiteWide.svgCount} (Expected: > 0)`);

    // -------------------------------------------------------------------------
    // SUMMARY OF VERIFICATION CHECKS
    // -------------------------------------------------------------------------
    console.log('\n================================================================================');
    console.log('AUDIT CHECKLIST & ASSERTIONS:');
    console.log('================================================================================');

    const check1 = homeDefault.bg === 'snow' && homeDefault.bgCanvas;
    console.log(`[Check 1] Home falling snow universe active: ${check1 ? '✅ PASS' : '❌ FAIL'}`);

    const check2 = homeDefault.svgCount === 0 && homeDefault.mantleAttr === 'disabled';
    console.log(`[Check 2] Home default mantle disabled & 0 SVG: ${check2 ? '✅ PASS' : '❌ FAIL'}`);

    const check3 = postDefault.bg === 'snow' && postDefault.bgCanvas;
    console.log(`[Check 3] Post falling snow universe active: ${check3 ? '✅ PASS' : '❌ FAIL'}`);

    const check4 = postDefault.svgCount === 0 && postDefault.mantleAttr === 'disabled';
    console.log(`[Check 4] Post default mantle disabled & 0 SVG: ${check4 ? '✅ PASS' : '❌ FAIL'}`);

    const check5 = homeDefault.cardBorderTop !== 'transparent' && homeDefault.cardBorderTop !== 'rgba(0, 0, 0, 0)';
    console.log(`[Check 5] Home card border preserved (not transparent): ${check5 ? '✅ PASS' : '❌ FAIL'}`);

    const check6 = homeHomeOnly.svgCount > 0 && homeHomeOnly.mantleAttr === 'active';
    console.log(`[Check 6] Override homeOnly=true activates Home mantle (>0 SVGs): ${check6 ? '✅ PASS' : '❌ FAIL'}`);

    const check7 = postHomeOnly.svgCount === 0 && postHomeOnly.mantleAttr === 'disabled';
    console.log(`[Check 7] Override homeOnly=true keeps Post untouched (0 SVGs): ${check7 ? '✅ PASS' : '❌ FAIL'}`);

    const check8 = postSiteWide.svgCount > 0 && postSiteWide.mantleAttr === 'active';
    console.log(`[Check 8] Override homeOnly=false enables Post mantle (>0 SVGs): ${check8 ? '✅ PASS' : '❌ FAIL'}`);

    const check9 = fatalErrors.length === 0;
    console.log(`[Check 9] Console Fatal JavaScript Errors is 0: ${check9 ? '✅ PASS' : '❌ FAIL'} (${fatalErrors.length} errors)`);

    const allPassed = check1 && check2 && check3 && check4 && check5 && check6 && check7 && check8 && check9;
    console.log('\n================================================================================');
    console.log(`FINAL INDEPENDENT AUDIT VERDICT: ${allPassed ? '✅ 100% AUDIT PASSED' : '❌ AUDIT FAILED'}`);
    console.log('================================================================================\n');

    if (!allPassed) {
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

runIndependentAudit().catch(err => {
  console.error('Fatal audit execution exception:', err);
  process.exit(1);
});
