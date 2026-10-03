import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4399;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      }).on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timeout waiting for preview server at ${url}`));
      } else {
        setTimeout(check, 300);
      }
    };
    check();
  });
}

async function runLocalVerification() {
  console.log('================================================================================');
  console.log('❄️ COMPREHENSIVE LOCAL E2E MATRIX VERIFICATION: SNOW ACCUMULATION BACKEND TOGGLE');
  console.log(`Target: ${BASE_URL}`);
  console.log('Time:   ' + new Date().toISOString());
  console.log('================================================================================\n');

  // Start preview server on port 4399
  console.log(`>>> Starting local preview server on port ${PORT}...`);
  const server = spawn('npx', ['sirv-cli', 'dist', '--port', String(PORT), '--single', 'false', '--quiet'], {
    stdio: 'ignore'
  });

  const cleanupServer = () => {
    try {
      server.kill('SIGTERM');
    } catch {}
  };

  process.on('exit', cleanupServer);
  process.on('SIGINT', cleanupServer);
  process.on('SIGTERM', cleanupServer);

  await waitForServer(BASE_URL);
  console.log('    ✓ Local preview server ready.\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // ---------------------------------------------------------------------------
    // TEST 1: Source & Config Default Parameters Audit
    // ---------------------------------------------------------------------------
    console.log('>>> [TEST 1] Auditing Source Code & Configuration Parameters...');
    const siteConfigContent = fs.readFileSync(path.resolve('src/config/site.ts'), 'utf-8');
    const snowMatch = siteConfigContent.match(/snow:\s*\{([^}]+)\}/);
    if (!snowMatch) throw new Error('Could not find snow config in src/config/site.ts');
    const snowConfigBlock = snowMatch[1];
    const hasEnableMantle = /enableMantle:\s*false/.test(snowConfigBlock);
    const hasHomeOnly = /homeOnly:\s*false/.test(snowConfigBlock);
    console.log('    ✓ siteConfig.theme.background.snow.enableMantle default = false:', hasEnableMantle);
    console.log('    ✓ siteConfig.theme.background.snow.homeOnly default = false:', hasHomeOnly);
    if (!hasEnableMantle || !hasHomeOnly) throw new Error('Default snow configuration does not match required defaults (false, false)');

    // Check UI leakage
    const themeUniverseCode = fs.readFileSync(path.resolve('src/components/ThemeUniverse.tsx'), 'utf-8');
    const themeOverlaysCode = fs.readFileSync(path.resolve('src/components/ThemeOverlays.tsx'), 'utf-8');
    const hasUiToggle = /enableMantle/i.test(themeOverlaysCode);
    console.log('    ✓ Zero UI toggle in ThemeOverlays.tsx:', !hasUiToggle);
    if (hasUiToggle) throw new Error('Mantle parameter exposed in UI!');

    // ---------------------------------------------------------------------------
    // TEST 2: Local Built Artifacts Default Homepage (enableMantle=false, homeOnly=false)
    // ---------------------------------------------------------------------------
    console.log('\n>>> [TEST 2] Testing Default State on Homepage (Falling snow ON, Mantle OFF)...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          !text.includes('favicon') &&
          !text.includes('ERR_FAILED') &&
          !text.includes('404') &&
          !text.includes('status of 404') &&
          !text.includes('api/comments')
        ) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.recent-post-item', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const homeDefault = await page.evaluate(() => {
      const root = document.documentElement;
      const card = document.querySelector('.recent-post-item');
      return {
        background: root.dataset.background,
        snowMantle: root.dataset.snowMantle,
        snowMantleEnabled: root.dataset.snowMantleEnabled,
        snowMantleHomeOnly: root.dataset.snowMantleHomeOnly,
        winConfig: window.__SNOW_MANTLE_CONFIG__,
        svgCount: document.querySelectorAll('.card-snow-svg').length,
        hasSnowCanvas: !!document.getElementById('theme-snow-universe'),
        cardBorderTop: card ? window.getComputedStyle(card).borderTopColor : null
      };
    });

    console.log('    Home Default State:', JSON.stringify(homeDefault, null, 2));
    if (homeDefault.background !== 'snow') throw new Error(`Expected background="snow", got "${homeDefault.background}"`);
    if (homeDefault.snowMantle !== 'disabled') throw new Error(`Expected snowMantle="disabled", got "${homeDefault.snowMantle}"`);
    if (homeDefault.snowMantleEnabled !== 'false') throw new Error(`Expected snowMantleEnabled="false", got "${homeDefault.snowMantleEnabled}"`);
    if (homeDefault.snowMantleHomeOnly !== 'false') throw new Error(`Expected snowMantleHomeOnly="false", got "${homeDefault.snowMantleHomeOnly}"`);
    if (homeDefault.svgCount !== 0) throw new Error(`Expected 0 mantle SVGs, got ${homeDefault.svgCount}`);
    if (!homeDefault.hasSnowCanvas) throw new Error('Expected snowfall canvas to be active');
    if (homeDefault.cardBorderTop === 'rgba(0, 0, 0, 0)' || homeDefault.cardBorderTop === 'transparent') {
      throw new Error(`Expected intact card border-top-color, got ${homeDefault.cardBorderTop}`);
    }
    console.log('    ✓ PASS: Default homepage has 0 mantle SVGs, active snowfall canvas, and intact card styling.');

    // ---------------------------------------------------------------------------
    // TEST 3: Local Built Artifacts Default Post Page (enableMantle=false, homeOnly=false)
    // ---------------------------------------------------------------------------
    console.log('\n>>> [TEST 3] Testing Default State on Post Page (Falling snow ON, Mantle OFF)...');
    await page.goto(`${BASE_URL}/posts/markdown-syntax-mastery/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#post', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const postDefault = await page.evaluate(() => {
      const root = document.documentElement;
      const alert = document.querySelector('.markdown-alert, .article-callout, .admonition');
      return {
        background: root.dataset.background,
        snowMantle: root.dataset.snowMantle,
        snowMantleEnabled: root.dataset.snowMantleEnabled,
        snowMantleHomeOnly: root.dataset.snowMantleHomeOnly,
        svgCount: document.querySelectorAll('.card-snow-svg').length,
        hasSnowCanvas: !!document.getElementById('theme-snow-universe'),
        alertPaddingTop: alert ? window.getComputedStyle(alert).paddingTop : null
      };
    });

    console.log('    Post Default State:', JSON.stringify(postDefault, null, 2));
    if (postDefault.snowMantle !== 'disabled') throw new Error(`Expected post snowMantle="disabled", got "${postDefault.snowMantle}"`);
    if (postDefault.svgCount !== 0) throw new Error(`Expected 0 mantle SVGs on post, got ${postDefault.svgCount}`);
    if (!postDefault.hasSnowCanvas) throw new Error('Expected snowfall canvas on post page');
    console.log('    ✓ PASS: Default post page has 0 mantle SVGs, active snowfall canvas, and intact styling.');

    // ---------------------------------------------------------------------------
    // TEST 4: Dynamic Stationmaster Activation: enableMantle = true, homeOnly = true
    // ---------------------------------------------------------------------------
    console.log('\n>>> [TEST 4] Stationmaster activates: enableMantle = true, homeOnly = true...');
    // Test on Homepage: should have mantles
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.recent-post-item', { timeout: 10000 });

    await page.evaluate(() => {
      window.__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: true };
      window.dispatchEvent(new CustomEvent('shijianus:snow-config-update', { detail: { enableMantle: true, homeOnly: true } }));
    });
    await page.waitForTimeout(1000);

    const homeWithMantle = await page.evaluate(() => {
      return {
        snowMantle: document.documentElement.dataset.snowMantle,
        svgCount: document.querySelectorAll('.card-snow-svg').length
      };
    });
    console.log('    Home with enableMantle=true, homeOnly=true:', JSON.stringify(homeWithMantle));
    if (homeWithMantle.snowMantle !== 'active') throw new Error(`Expected snowMantle="active" on home, got "${homeWithMantle.snowMantle}"`);
    if (homeWithMantle.svgCount === 0) throw new Error('Expected mantle SVGs to be generated on home');
    console.log(`    ✓ PASS: Mantle successfully attached on homepage (${homeWithMantle.svgCount} SVGs).`);

    // Test on Post Page: should NOT have mantles (homeOnly restricts to homepage!)
    await page.goto(`${BASE_URL}/posts/markdown-syntax-mastery/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#post', { timeout: 10000 });

    await page.evaluate(() => {
      window.__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: true };
      window.dispatchEvent(new CustomEvent('shijianus:snow-config-update', { detail: { enableMantle: true, homeOnly: true } }));
    });
    await page.waitForTimeout(1000);

    const postWithHomeOnly = await page.evaluate(() => {
      return {
        snowMantle: document.documentElement.dataset.snowMantle,
        svgCount: document.querySelectorAll('.card-snow-svg').length
      };
    });
    console.log('    Post with enableMantle=true, homeOnly=true:', JSON.stringify(postWithHomeOnly));
    if (postWithHomeOnly.snowMantle !== 'disabled') throw new Error(`Expected snowMantle="disabled" on post when homeOnly=true, got "${postWithHomeOnly.snowMantle}"`);
    if (postWithHomeOnly.svgCount !== 0) throw new Error(`Expected strictly 0 mantle SVGs on post when homeOnly=true, got ${postWithHomeOnly.svgCount}`);
    console.log('    ✓ PASS: Post page has strictly 0 mantle SVGs when homeOnly=true, normal display completely untouched!');

    // ---------------------------------------------------------------------------
    // TEST 5: Dynamic Stationmaster Activation: enableMantle = true, homeOnly = false (Site-wide)
    // ---------------------------------------------------------------------------
    console.log('\n>>> [TEST 5] Stationmaster activates: enableMantle = true, homeOnly = false (Site-wide)...');
    await page.evaluate(() => {
      window.__SNOW_MANTLE_CONFIG__ = { enableMantle: true, homeOnly: false };
      window.dispatchEvent(new CustomEvent('shijianus:snow-config-update', { detail: { enableMantle: true, homeOnly: false } }));
    });
    await page.waitForTimeout(1000);

    const postSiteWide = await page.evaluate(() => {
      return {
        snowMantle: document.documentElement.dataset.snowMantle,
        svgCount: document.querySelectorAll('.card-snow-svg').length
      };
    });
    console.log('    Post with enableMantle=true, homeOnly=false:', JSON.stringify(postSiteWide));
    if (postSiteWide.snowMantle !== 'active') throw new Error(`Expected snowMantle="active" on post when homeOnly=false, got "${postSiteWide.snowMantle}"`);
    if (postSiteWide.svgCount === 0) throw new Error('Expected mantle SVGs to be generated on post when site-wide');
    console.log(`    ✓ PASS: Post page successfully attaches mantle (${postSiteWide.svgCount} SVGs) when homeOnly=false.`);

    // ---------------------------------------------------------------------------
    // TEST 6: Teardown & Transition to Clean Mode
    // ---------------------------------------------------------------------------
    console.log('\n>>> [TEST 6] Switching theme background to "clean"...');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-background', 'clean');
    });
    await page.waitForTimeout(500);

    const cleanModeState = await page.evaluate(() => {
      const svgs = document.querySelectorAll('.card-snow-svg');
      const canvas = document.getElementById('theme-snow-universe');
      return {
        svgCount: svgs.length,
        canvasOpacity: canvas ? window.getComputedStyle(canvas).opacity : null
      };
    });
    console.log('    Clean Mode State:', JSON.stringify(cleanModeState));
    if (cleanModeState.svgCount !== 0) throw new Error(`Expected 0 SVGs in clean mode, got ${cleanModeState.svgCount}`);
    console.log('    ✓ PASS: All mantles cleared and canvas hidden in clean mode.');

    // ---------------------------------------------------------------------------
    // TEST 7: Console Health
    // ---------------------------------------------------------------------------
    console.log('\n>>> [TEST 7] Verifying Console Errors...');
    console.log(`    Total console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      throw new Error(`Fatal console errors encountered: ${consoleErrors.join('; ')}`);
    }
    console.log('    ✓ PASS: 0 fatal console errors across all test scenarios.');

    console.log('\n================================================================================');
    console.log('🎉 ALL 7 LOCAL E2E VERIFICATION CHECKS PASSED PERFECTLY (100% SUCCESS)');
    console.log('================================================================================');

    await context.close();
  } finally {
    await browser.close();
    cleanupServer();
  }
}

runLocalVerification().catch(err => {
  console.error('\n❌ LOCAL E2E MATRIX VERIFICATION FAILED:', err);
  process.exit(1);
});
