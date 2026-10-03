import { chromium } from 'playwright';

async function runCompleteLiveAudit() {
  const targetUrl = (process.env.TARGET_URL || process.argv[2] || 'https://blog.epocanvas.com').replace(/\/+$/, '');
  console.log('================================================================================');
  console.log('❄️ [INDEPENDENT LIVE AUDIT] COMPREHENSIVE PRODUCTION E2E VERIFICATION');
  console.log('Target: ' + targetUrl);
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const fatalErrors = [];

  function setupPageListeners(page, pageName) {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          !text.includes('net::ERR_FAILED') &&
          !text.includes('favicon') &&
          !text.includes('cloudflare.com') &&
          !text.includes('fonts.googleapis') &&
          !text.includes('player.bilibili.com')
        ) {
          fatalErrors.push(`[${pageName}] ${text}`);
        }
      }
    });

    page.on('pageerror', err => {
      fatalErrors.push(`[${pageName}] Uncaught: ${err.message || err}`);
    });
  }

  // ---------------------------------------------------------------------------
  // 1. DEFAULT HOMEPAGE
  // ---------------------------------------------------------------------------
  console.log(`>>> [1/4] Inspecting Default Home: ${targetUrl}/`);
  const page1 = await browser.newPage();
  setupPageListeners(page1, 'Default Home');
  await page1.goto(`${targetUrl}/`, { waitUntil: 'commit', timeout: 60000 });
  await page1.waitForSelector('body', { state: 'attached', timeout: 45000 });

  const homeDefault = await page1.evaluate(() => {
    const bg = document.documentElement.dataset.background;
    const mantleAttr = document.documentElement.dataset.snowMantle;
    const mantleEnabled = document.documentElement.dataset.snowMantleEnabled;
    const mantleHomeOnly = document.documentElement.dataset.snowMantleHomeOnly;
    const winConfig = window.__SNOW_MANTLE_CONFIG__;
    const bgCanvas = !!document.getElementById('theme-snow-universe');
    const svgs = document.querySelectorAll('.card-snow-svg');
    const card = document.querySelector('.recent-post-item');
    const cardBorderTop = card ? window.getComputedStyle(card).borderTopColor : null;
    const cardOverflow = card ? window.getComputedStyle(card).overflow : null;

    return {
      bg,
      mantleAttr,
      mantleEnabled,
      mantleHomeOnly,
      winConfig,
      bgCanvas,
      svgCount: svgs.length,
      cardBorderTop,
      cardOverflow
    };
  });
  console.log('  ✓ Home Default Result:', JSON.stringify(homeDefault, null, 2));

  // ---------------------------------------------------------------------------
  // 2. DEFAULT POST PAGE
  // ---------------------------------------------------------------------------
  console.log(`\n>>> [2/4] Inspecting Default Post: ${targetUrl}/posts/markdown-syntax-mastery/`);
  const page2 = await browser.newPage();
  setupPageListeners(page2, 'Default Post');
  await page2.goto(`${targetUrl}/posts/markdown-syntax-mastery/`, { waitUntil: 'commit', timeout: 60000 });
  await page2.waitForSelector('body', { state: 'attached', timeout: 45000 });

  const postDefault = await page2.evaluate(() => {
    const bg = document.documentElement.dataset.background;
    const mantleAttr = document.documentElement.dataset.snowMantle;
    const mantleEnabled = document.documentElement.dataset.snowMantleEnabled;
    const mantleHomeOnly = document.documentElement.dataset.snowMantleHomeOnly;
    const winConfig = window.__SNOW_MANTLE_CONFIG__;
    const bgCanvas = !!document.getElementById('theme-snow-universe');
    const svgs = document.querySelectorAll('.card-snow-svg');
    const alertBlock = document.querySelector('.markdown-alert, .article-callout, .admonition');
    const alertPaddingTop = alertBlock ? window.getComputedStyle(alertBlock).paddingTop : null;

    return {
      bg,
      mantleAttr,
      mantleEnabled,
      mantleHomeOnly,
      winConfig,
      bgCanvas,
      svgCount: svgs.length,
      alertPaddingTop
    };
  });
  console.log('  ✓ Post Default Result:', JSON.stringify(postDefault, null, 2));

  // ---------------------------------------------------------------------------
  // 3. STATIONMASTER OVERRIDE: enableMantle=true & homeOnly=true
  // ---------------------------------------------------------------------------
  console.log(`\n>>> [3/4] Testing Stationmaster Override: enableMantle=true & homeOnly=true`);

  // Activate on page1 (Home)
  const homeHomeOnly = await page1.evaluate(async () => {
    window.__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: true };
    document.documentElement.dataset.snowMantleEnabled = 'true';
    document.documentElement.dataset.snowMantleHomeOnly = 'true';
    document.documentElement.setAttribute('data-background', 'snow');
    if (typeof (window).__START_SNOW__ === 'function') {
      (window).__START_SNOW__();
    } else {
      window.dispatchEvent(new Event('shijianus:snow-config-changed'));
      document.dispatchEvent(new Event('astro:page-load'));
    }
    window.dispatchEvent(new Event('resize'));
    window.scrollBy(0, 150);
    await new Promise(r => setTimeout(r, 600));

    const svgs = document.querySelectorAll('.card-snow-svg');
    const mantleAttr = document.documentElement.dataset.snowMantle;
    return { mantleAttr, svgCount: svgs.length };
  });
  console.log('  ✓ Home (enableMantle=true, homeOnly=true):', JSON.stringify(homeHomeOnly));

  // Activate on page2 (Post) -> Should remain disabled because homeOnly=true!
  const postHomeOnly = await page2.evaluate(async () => {
    window.__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: true };
    document.documentElement.dataset.snowMantleEnabled = 'true';
    document.documentElement.dataset.snowMantleHomeOnly = 'true';
    document.documentElement.setAttribute('data-background', 'snow');
    if (typeof (window).__START_SNOW__ === 'function') {
      (window).__START_SNOW__();
    } else {
      window.dispatchEvent(new Event('shijianus:snow-config-changed'));
      document.dispatchEvent(new Event('astro:page-load'));
    }
    window.dispatchEvent(new Event('resize'));
    window.scrollBy(0, 150);
    await new Promise(r => setTimeout(r, 600));

    const svgs = document.querySelectorAll('.card-snow-svg');
    const mantleAttr = document.documentElement.dataset.snowMantle;
    const bgCanvas = !!document.getElementById('theme-snow-universe');
    return { mantleAttr, svgCount: svgs.length, bgCanvas };
  });
  console.log('  ✓ Post (enableMantle=true, homeOnly=true):', JSON.stringify(postHomeOnly));

  // ---------------------------------------------------------------------------
  // 4. STATIONMASTER OVERRIDE: enableMantle=true & homeOnly=false (Site-Wide)
  // ---------------------------------------------------------------------------
  console.log(`\n>>> [4/4] Testing Stationmaster Override: enableMantle=true & homeOnly=false (Site-Wide)`);

  const postSiteWide = await page2.evaluate(async () => {
    window.__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: false };
    document.documentElement.dataset.snowMantleEnabled = 'true';
    document.documentElement.dataset.snowMantleHomeOnly = 'false';
    document.documentElement.setAttribute('data-background', 'snow');
    if (typeof (window).__START_SNOW__ === 'function') {
      (window).__START_SNOW__();
    } else {
      window.dispatchEvent(new Event('shijianus:snow-config-changed'));
      document.dispatchEvent(new Event('astro:page-load'));
    }
    window.dispatchEvent(new Event('resize'));
    window.scrollBy(0, 150);
    await new Promise(r => setTimeout(r, 600));

    const svgs = document.querySelectorAll('.card-snow-svg');
    const mantleAttr = document.documentElement.dataset.snowMantle;
    return { mantleAttr, svgCount: svgs.length };
  });
  console.log('  ✓ Post (enableMantle=true, homeOnly=false):', JSON.stringify(postSiteWide));

  await page1.close().catch(() => {});
  await page2.close().catch(() => {});
  await browser.close().catch(() => {});

  // ---------------------------------------------------------------------------
  // 5. AUDIT ASSERTIONS & VERIFICATION
  // ---------------------------------------------------------------------------
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
  console.log(`[Check 9] Console Fatal JavaScript Errors is 0: ${check9 ? '✅ PASS' : '❌ FAIL'} (${fatalErrors.length} errors: ${JSON.stringify(fatalErrors)})`);

  const allPassed = check1 && check2 && check3 && check4 && check5 && check6 && check7 && check8 && check9;
  console.log('\n================================================================================');
  console.log(`FINAL INDEPENDENT AUDIT VERDICT: ${allPassed ? '✅ 100% AUDIT PASSED' : '❌ AUDIT FAILED'}`);
  console.log('================================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runCompleteLiveAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
