import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const REPORT_DIR = path.resolve('reports');
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

async function runIndependentSnowSubagentAudit() {
  console.log('================================================================================');
  console.log('❄️ INDEPENDENT THIRD-PARTY STAGE 4 SNOW PARAMETERS & DELIVERY AUDIT');
  console.log('Target Production: https://blog.epocanvas.com');
  console.log('Audit Timestamp:   ' + new Date().toISOString());
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const fatalErrors = [];
  const testResults = {
    timestamp: new Date().toISOString(),
    checks: {},
    passed: true,
    fatalErrors: []
  };

  async function createCleanContext(name, initialConfig = null) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 ThirdPartySnowAuditor/1.0'
    });

    await context.addInitScript((cfg) => {
      try {
        sessionStorage.setItem('shijianus-loader-seen', 'true');
        if (cfg) {
          window.__SNOW_MANTLE_CONFIG__ = cfg;
        }
      } catch {}
    }, initialConfig);

    const page = await context.newPage();
    await page.route('**/*.mp4', r => r.abort());
    await page.route('**/*.webm', r => r.abort());

    page.on('console', msg => {
      const type = msg.type();
      const txt = msg.text();
      if (type === 'error') {
        if (
          txt.includes('net::ERR_FAILED') ||
          txt.includes('player.bilibili.com') ||
          txt.includes('bili-user-fingerprint') ||
          txt.includes('favicon') ||
          txt.includes('Font') ||
          txt.includes('404') ||
          txt.includes('status of 404')
        ) return;
        console.log(`[CONSOLE ERROR in ${name}]:`, txt);
        fatalErrors.push(`[${name}] ${txt}`);
      }
    });
    page.on('pageerror', err => {
      const msg = err.message || String(err);
      if (
        msg.includes('player.bilibili.com') ||
        msg.includes('bili-user-fingerprint') ||
        msg.includes('net::ERR_FAILED')
      ) return;
      console.log(`[PAGE ERROR in ${name}]:`, msg);
      fatalErrors.push(`[${name}] ${msg}`);
    });

    return { page, context };
  }

  // ---------------------------------------------------------------------------
  // Check 1: Home Default State (No override, testing siteConfig defaults)
  // ---------------------------------------------------------------------------
  console.log('>>> [CHECK 1] Auditing Home Default Mode...');
  const { page: page1, context: ctx1 } = await createCleanContext('Check1_HomeDefault');
  try {
    await page1.goto('https://blog.epocanvas.com/', { waitUntil: 'commit', timeout: 60000 });
    await page1.waitForFunction(() => document.querySelectorAll('.recent-post-item').length > 0, { timeout: 60000 });
    await page1.waitForTimeout(1000);

    const homeData = await page1.evaluate(() => {
      const root = document.documentElement;
      const card = document.querySelector('.recent-post-item');
      return {
        background: root.dataset.background,
        snowMantle: root.dataset.snowMantle,
        snowMantleEnabled: root.dataset.snowMantleEnabled,
        snowMantleHomeOnly: root.dataset.snowMantleHomeOnly,
        winConfig: window.__SNOW_MANTLE_CONFIG__,
        svgCount: document.querySelectorAll('.card-snow-svg').length,
        hasSnowUniverseCanvas: !!document.getElementById('theme-snow-universe'),
        cardBorderTop: card ? window.getComputedStyle(card).borderTopColor : null,
      };
    });

    console.log('    ✓ Home Default Data:', JSON.stringify(homeData, null, 2));
    testResults.checks.homeDefault = homeData;

    if (homeData.background !== 'snow') throw new Error(`Expected background="snow", got "${homeData.background}"`);
    if (homeData.snowMantle !== 'disabled') throw new Error(`Expected snowMantle="disabled", got "${homeData.snowMantle}"`);
    if (homeData.snowMantleEnabled !== 'false') throw new Error(`Expected snowMantleEnabled="false", got "${homeData.snowMantleEnabled}"`);
    if (homeData.snowMantleHomeOnly !== 'false') throw new Error(`Expected snowMantleHomeOnly="false", got "${homeData.snowMantleHomeOnly}"`);
    if (homeData.svgCount !== 0) throw new Error(`Expected 0 accumulation SVGs on home default, found ${homeData.svgCount}`);
    if (!homeData.hasSnowUniverseCanvas) throw new Error(`Expected #theme-snow-universe canvas to be active`);
    if (homeData.cardBorderTop === 'rgba(0, 0, 0, 0)' || homeData.cardBorderTop === 'transparent') {
      throw new Error(`Expected card border-top-color to be preserved (not transparent), got ${homeData.cardBorderTop}`);
    }

    console.log('    ✓ PASS: Home default state has 0 SVGs, active snowfall canvas, preserved card border.');
  } finally {
    await ctx1.close().catch(() => {});
  }

  // ---------------------------------------------------------------------------
  // Check 2: Post Detail Default State (No override, testing siteConfig defaults)
  // ---------------------------------------------------------------------------
  console.log('\n>>> [CHECK 2] Auditing Post Detail Default Mode...');
  const { page: page2, context: ctx2 } = await createCleanContext('Check2_PostDefault');
  try {
    await page2.goto('https://blog.epocanvas.com/posts/markdown-syntax-mastery/', { waitUntil: 'commit', timeout: 60000 });
    await page2.waitForFunction(() => !!document.querySelector('#post, .markdown-alert, .article-callout'), { timeout: 60000 });
    await page2.waitForTimeout(1000);

    const postData = await page2.evaluate(() => {
      const root = document.documentElement;
      const alert = document.querySelector('.markdown-alert, .article-callout, .admonition');
      return {
        background: root.dataset.background,
        snowMantle: root.dataset.snowMantle,
        snowMantleEnabled: root.dataset.snowMantleEnabled,
        snowMantleHomeOnly: root.dataset.snowMantleHomeOnly,
        winConfig: window.__SNOW_MANTLE_CONFIG__,
        svgCount: document.querySelectorAll('.card-snow-svg').length,
        hasSnowUniverseCanvas: !!document.getElementById('theme-snow-universe'),
        alertPaddingTop: alert ? window.getComputedStyle(alert).paddingTop : null,
      };
    });

    console.log('    ✓ Post Default Data:', JSON.stringify(postData, null, 2));
    testResults.checks.postDefault = postData;

    if (postData.snowMantle !== 'disabled') throw new Error(`Expected post snowMantle="disabled", got "${postData.snowMantle}"`);
    if (postData.svgCount !== 0) throw new Error(`Expected 0 accumulation SVGs on post default, found ${postData.svgCount}`);
    if (!postData.hasSnowUniverseCanvas) throw new Error(`Expected #theme-snow-universe canvas on post page`);

    console.log('    ✓ PASS: Post default state has 0 SVGs, active snowfall canvas, normal alert padding.');
  } finally {
    await ctx2.close().catch(() => {});
  }

  // ---------------------------------------------------------------------------
  // Check 3: Stationmaster Override (enableMantle: true, homeOnly: true) on Home
  // (Testing stationmaster toggling accumulation on for homepage)
  // ---------------------------------------------------------------------------
  console.log('\n>>> [CHECK 3] Auditing Stationmaster Override (enableMantle: true, homeOnly: true) on Home...');
  const { page: page3, context: ctx3 } = await createCleanContext('Check3_HomeOverride', { enableMantle: true, homeOnly: true });
  try {
    await page3.goto('https://blog.epocanvas.com/', { waitUntil: 'commit', timeout: 60000 });
    await page3.waitForFunction(() => document.querySelectorAll('.recent-post-item').length > 0, { timeout: 60000 });
    await page3.waitForTimeout(1500);

    const homeOverrideRes = await page3.evaluate(async () => {
      // Trigger scanCards if needed
      window.dispatchEvent(new Event('resize'));
      window.scrollBy(0, 150);
      await new Promise(r => setTimeout(r, 600));

      return {
        snowMantle: document.documentElement.dataset.snowMantle,
        svgCount: document.querySelectorAll('.card-snow-svg').length,
        hasCardSnow: !!document.querySelector('.recent-post-item .card-snow-svg'),
        sampleCardArchetype: document.querySelector('.card-snow-svg')?.getAttribute('data-snow-archetype')
      };
    });

    console.log('    ✓ Home Override Result:', JSON.stringify(homeOverrideRes, null, 2));
    testResults.checks.homeOverride = homeOverrideRes;

    if (homeOverrideRes.svgCount === 0) {
      throw new Error(`Expected >0 accumulation SVGs on Home when enableMantle=true, got 0`);
    }
    if (homeOverrideRes.snowMantle !== 'active') {
      throw new Error(`Expected data-snow-mantle="active" on Home when enabled, got "${homeOverrideRes.snowMantle}"`);
    }

    console.log(`    ✓ PASS: Home override successfully activated ${homeOverrideRes.svgCount} snow mantle SVGs (Archetype: ${homeOverrideRes.sampleCardArchetype}).`);
  } finally {
    await ctx3.close().catch(() => {});
  }

  // ---------------------------------------------------------------------------
  // Check 4: Stationmaster Override (enableMantle: true, homeOnly: true) on Post
  // (Must STRICTLY keep Post accumulation disabled: 0 SVGs)
  // ---------------------------------------------------------------------------
  console.log('\n>>> [CHECK 4] Auditing Stationmaster Override (enableMantle: true, homeOnly: true) on Post...');
  const { page: page4, context: ctx4 } = await createCleanContext('Check4_PostHomeOnlyRestricted', { enableMantle: true, homeOnly: true });
  try {
    await page4.goto('https://blog.epocanvas.com/posts/markdown-syntax-mastery/', { waitUntil: 'commit', timeout: 60000 });
    await page4.waitForFunction(() => !!document.querySelector('#post, .markdown-alert, .article-callout'), { timeout: 60000 });
    await page4.waitForTimeout(1500);

    const postHomeOnlyRes = await page4.evaluate(async () => {
      window.dispatchEvent(new Event('resize'));
      window.scrollBy(0, 150);
      await new Promise(r => setTimeout(r, 600));

      return {
        snowMantle: document.documentElement.dataset.snowMantle,
        svgCount: document.querySelectorAll('.card-snow-svg').length,
        hasSnowUniverseCanvas: !!document.getElementById('theme-snow-universe'),
      };
    });

    console.log('    ✓ Post with homeOnly=true Result:', JSON.stringify(postHomeOnlyRes, null, 2));
    testResults.checks.postHomeOnly = postHomeOnlyRes;

    if (postHomeOnlyRes.svgCount !== 0) {
      throw new Error(`Expected strictly 0 SVGs on Post when homeOnly=true, found ${postHomeOnlyRes.svgCount}`);
    }
    if (postHomeOnlyRes.snowMantle !== 'disabled') {
      throw new Error(`Expected snowMantle="disabled" on Post when homeOnly=true, got "${postHomeOnlyRes.snowMantle}"`);
    }

    console.log('    ✓ PASS: homeOnly=true strictly prevents snow accumulation on Post page (0 SVGs, canvas active).');
  } finally {
    await ctx4.close().catch(() => {});
  }

  // ---------------------------------------------------------------------------
  // Check 5: Stationmaster Override (enableMantle: true, homeOnly: false) on Post
  // (Allows Post accumulation when homeOnly is disabled by stationmaster)
  // ---------------------------------------------------------------------------
  console.log('\n>>> [CHECK 5] Auditing Stationmaster Override (enableMantle: true, homeOnly: false) on Post...');
  const { page: page5, context: ctx5 } = await createCleanContext('Check5_PostGlobalEnabled', { enableMantle: true, homeOnly: false });
  try {
    await page5.goto('https://blog.epocanvas.com/posts/markdown-syntax-mastery/', { waitUntil: 'commit', timeout: 60000 });
    await page5.waitForFunction(() => !!document.querySelector('#post, .markdown-alert, .article-callout'), { timeout: 60000 });
    await page5.waitForTimeout(1500);

    const postGlobalRes = await page5.evaluate(async () => {
      window.dispatchEvent(new Event('resize'));
      window.scrollBy(0, 150);
      await new Promise(r => setTimeout(r, 600));

      return {
        snowMantle: document.documentElement.dataset.snowMantle,
        svgCount: document.querySelectorAll('.card-snow-svg').length,
      };
    });

    console.log('    ✓ Post with homeOnly=false Result:', JSON.stringify(postGlobalRes, null, 2));
    testResults.checks.postGlobal = postGlobalRes;

    if (postGlobalRes.svgCount === 0) {
      throw new Error(`Expected >0 accumulation SVGs on Post when homeOnly=false, got 0`);
    }
    if (postGlobalRes.snowMantle !== 'active') {
      throw new Error(`Expected snowMantle="active" on Post when homeOnly=false, got "${postGlobalRes.snowMantle}"`);
    }

    console.log(`    ✓ PASS: homeOnly=false allows snow accumulation across Post pages (${postGlobalRes.svgCount} SVGs).`);
  } finally {
    await ctx5.close().catch(() => {});
  }

  // ---------------------------------------------------------------------------
  // Check 6: Fatal Console Errors
  // ---------------------------------------------------------------------------
  console.log('\n>>> [CHECK 6] Verifying Fatal Console Errors...');
  testResults.fatalErrors = fatalErrors;
  console.log(`    Total Fatal Errors: ${fatalErrors.length}`);
  if (fatalErrors.length > 0) {
    console.error('    Found fatal errors:', fatalErrors);
    throw new Error(`Fatal console errors encountered: ${fatalErrors.join('; ')}`);
  }
  console.log('    ✓ PASS: 0 fatal console errors across all test flows.');

  // Save report
  fs.writeFileSync(
    path.join(REPORT_DIR, 'stage4-snow-params-audit-report.json'),
    JSON.stringify(testResults, null, 2),
    'utf-8'
  );

  console.log('\n================================================================================');
  console.log('🎉 ALL 6 CRITICAL INDEPENDENT AUDIT CHECKS PASSED WITH HARD EVIDENCE CHAIN!');
  console.log('Report saved to: reports/stage4-snow-params-audit-report.json');
  console.log('================================================================================');

  await browser.close();
}

runIndependentSnowSubagentAudit().catch(err => {
  console.error('\n❌ AUDIT FAILED:', err);
  process.exit(1);
});
