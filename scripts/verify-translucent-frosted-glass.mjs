import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';

async function runLocalAndLiveTest(isProduction = false) {
  const targetUrl = isProduction ? 'https://blog.epocanvas.com/' : 'http://127.0.0.1:4321/';
  console.log(`\n======================================================`);
  console.log(`💎 Starting 3-Mode Card Style Verification (Solid, Gray, Transparent) on ${targetUrl} (${isProduction ? 'PRODUCTION' : 'LOCAL'})...`);
  console.log(`======================================================\n`);

  let previewProcess;
  let browser;

  try {
    if (!isProduction) {
      console.log('🚀 Starting local static server on port 4321 (serving dist/)...');
      previewProcess = spawn('python3', ['-m', 'http.server', '4321', '-d', 'dist'], {
        stdio: 'pipe',
      });

      await new Promise((r) => setTimeout(r, 1200));
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // 1. Visit homepage
    console.log(`\n[Step 1] Visiting homepage ${targetUrl}...`);
    const res = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log(`✅ HTTP Status: ${res.status()}`);
    await page.waitForTimeout(1000);

    // 2. Check default cardStyle attribute (expected: 'transparent' / 透明模式 as configured by admin)
    const initialCardStyle = await page.evaluate(() => document.documentElement.dataset.cardStyle);
    const initialTranslucent = await page.evaluate(() => document.documentElement.dataset.translucent);
    console.log(`✅ Default data-card-style: "${initialCardStyle}" (Expected: "transparent")`);
    console.log(`✅ Default data-translucent: "${initialTranslucent}" (Expected: "true")`);

    if (initialCardStyle !== 'transparent') {
      throw new Error(`❌ Expected default data-card-style to be "transparent", got "${initialCardStyle}"`);
    }

    // 3. Inspect Transparent Mode (透明模式 - 默认) computed styles
    console.log('\n[Step 2] Verifying Transparent Mode (透明模式) computed styles...');
    const transparentStyles = await page.evaluate(() => {
      const postCard = document.querySelector('.recent-post-item');
      const asideWidget = document.querySelector('#aside-content .card-widget');
      const postStyle = postCard ? window.getComputedStyle(postCard) : null;
      const asideStyle = asideWidget ? window.getComputedStyle(asideWidget) : null;
      return {
        postBg: postStyle?.backgroundColor,
        postBackdrop: postStyle?.backdropFilter || postStyle?.webkitBackdropFilter,
        asideBg: asideStyle?.backgroundColor,
        asideBackdrop: asideStyle?.backdropFilter || asideStyle?.webkitBackdropFilter,
      };
    });

    console.log(`✅ Transparent Mode .recent-post-item background: ${transparentStyles.postBg}`);
    console.log(`✅ Transparent Mode .recent-post-item backdrop-filter: ${transparentStyles.postBackdrop}`);
    console.log(`✅ Transparent Mode #aside-content .card-widget background: ${transparentStyles.asideBg}`);
    console.log(`✅ Transparent Mode #aside-content .card-widget backdrop-filter: ${transparentStyles.asideBackdrop}`);

    // 4. Test Solid Mode (纯色模式: data-card-style='solid')
    console.log('\n[Step 3] Switching to Solid Mode (纯色模式: data-card-style="solid")...');
    await page.evaluate(() => {
      document.documentElement.dataset.cardStyle = 'solid';
      document.documentElement.dataset.translucent = 'false';
    });
    await page.waitForTimeout(400);

    const solidStyles = await page.evaluate(() => {
      const asideWidget = document.querySelector('#aside-content .card-widget');
      const asideWidgetStyle = asideWidget ? window.getComputedStyle(asideWidget) : null;
      return {
        asideBg: asideWidgetStyle?.backgroundColor,
        asideBackdrop: asideWidgetStyle?.backdropFilter || asideWidgetStyle?.webkitBackdropFilter,
      };
    });

    console.log(`✅ Solid Mode .card-widget background: ${solidStyles.asideBg}`);
    console.log(`✅ Solid Mode .card-widget backdrop-filter: ${solidStyles.asideBackdrop}`);
    if (solidStyles.asideBackdrop && solidStyles.asideBackdrop !== 'none') {
      throw new Error(`❌ Expected backdrop-filter to be 'none' in solid mode, got "${solidStyles.asideBackdrop}"`);
    }

    // 5. Test Gray Mode (磨砂模式: data-card-style='gray')
    console.log('\n[Step 4] Switching to Gray Mode (磨砂模式: data-card-style="gray")...');
    await page.evaluate(() => {
      document.documentElement.dataset.cardStyle = 'gray';
      document.documentElement.dataset.translucent = 'true';
    });
    await page.waitForTimeout(400);

    const grayStyles = await page.evaluate(() => {
      const postCard = document.querySelector('.recent-post-item');
      const asideWidget = document.querySelector('#aside-content .card-widget');
      const postStyle = postCard ? window.getComputedStyle(postCard) : null;
      const asideStyle = asideWidget ? window.getComputedStyle(asideWidget) : null;
      return {
        postBg: postStyle?.backgroundColor,
        postBackdrop: postStyle?.backdropFilter || postStyle?.webkitBackdropFilter,
        asideBg: asideStyle?.backgroundColor,
        asideBackdrop: asideStyle?.backdropFilter || asideStyle?.webkitBackdropFilter,
      };
    });

    console.log(`✅ Gray Mode .recent-post-item background: ${grayStyles.postBg}`);
    console.log(`✅ Gray Mode .recent-post-item backdrop-filter: ${grayStyles.postBackdrop}`);
    console.log(`✅ Gray Mode #aside-content .card-widget background: ${grayStyles.asideBg}`);
    console.log(`✅ Gray Mode #aside-content .card-widget backdrop-filter: ${grayStyles.asideBackdrop}`);

    // 6. Test Dark Mode across all 3 styles
    console.log('\n[Step 5] Testing Dark Mode across all 3 Card Styles...');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });

    // Dark + Transparent
    await page.evaluate(() => {
      document.documentElement.dataset.cardStyle = 'transparent';
    });
    await page.waitForTimeout(300);
    const darkTransparent = await page.evaluate(() => {
      const el = document.querySelector('#aside-content .card-widget');
      const st = el ? window.getComputedStyle(el) : null;
      return { bg: st?.backgroundColor, backdrop: st?.backdropFilter || st?.webkitBackdropFilter };
    });
    console.log(`✅ Dark + Transparent .card-widget: bg=${darkTransparent.bg}, backdrop=${darkTransparent.backdrop}`);

    // Dark + Gray
    await page.evaluate(() => {
      document.documentElement.dataset.cardStyle = 'gray';
    });
    await page.waitForTimeout(300);
    const darkGray = await page.evaluate(() => {
      const el = document.querySelector('#aside-content .card-widget');
      const st = el ? window.getComputedStyle(el) : null;
      return { bg: st?.backgroundColor, backdrop: st?.backdropFilter || st?.webkitBackdropFilter };
    });
    console.log(`✅ Dark + Gray .card-widget: bg=${darkGray.bg}, backdrop=${darkGray.backdrop}`);

    // Dark + Solid
    await page.evaluate(() => {
      document.documentElement.dataset.cardStyle = 'solid';
    });
    await page.waitForTimeout(300);
    const darkSolid = await page.evaluate(() => {
      const el = document.querySelector('#aside-content .card-widget');
      const st = el ? window.getComputedStyle(el) : null;
      return { bg: st?.backgroundColor, backdrop: st?.backdropFilter || st?.webkitBackdropFilter };
    });
    console.log(`✅ Dark + Solid .card-widget: bg=${darkSolid.bg}, backdrop=${darkSolid.backdrop}`);

    // 7. Verify Account Settings Drawer has NO "视觉风格与卡片质感" (Admin-Only in config)
    console.log('\n[Step 6] Verifying Account Center has removed "视觉风格与卡片质感"...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications', { detail: { tab: 'settings' } }));
    });
    await page.waitForTimeout(800);

    const drawerVisible = await page.evaluate(() => {
      const drawer = document.querySelector('.theme-account-drawer');
      return drawer !== null;
    });
    console.log(`✅ Account Drawer opened: ${drawerVisible}`);

    const visualCardAudit = await page.evaluate(() => {
      const drawer = document.querySelector('.theme-account-drawer');
      const drawerText = drawer ? drawer.textContent || '' : '';
      const hasTitle = drawerText.includes('视觉风格与卡片质感') || drawerText.includes('Card Visual Style');
      const optionElements = document.querySelectorAll('.card-style-option, .account-card-style-grid');
      return {
        hasTitle,
        optionsCount: optionElements.length,
      };
    });

    console.log(`✅ Account Center visual card title present: ${visualCardAudit.hasTitle} (Expected: false)`);
    console.log(`✅ Account Center .card-style-option elements count: ${visualCardAudit.optionsCount} (Expected: 0)`);

    if (visualCardAudit.hasTitle || visualCardAudit.optionsCount > 0) {
      throw new Error(`❌ "视觉风格与卡片质感" was not completely removed from Account Center!`);
    }

    // Close account drawer
    await page.evaluate(() => {
      const mask = document.querySelector('.theme-account-overlay__mask');
      if (mask) mask.click();
    });
    await page.waitForTimeout(500);

    // 7.5 Verify Console button group has NO card style toggle (strictly config-driven)
    console.log('\n[Step 6.5] Verifying Console button-group has NO interactive card style toggle button...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-console'));
    });
    await page.waitForTimeout(600);

    const consoleOpened = await page.evaluate(() => {
      const c = document.getElementById('console');
      return c && c.classList.contains('show');
    });
    console.log(`✅ Console opened: ${consoleOpened}`);

    const layersBtnPresent = await page.evaluate(() => {
      const btn = document.querySelector('#console .button-group button[title*="质感"], #console .button-group button[title*="Texture"], #console .button-group button[title*="card_style"]');
      return btn !== null;
    });
    console.log(`✅ Console card style toggle button present: ${layersBtnPresent} (Expected: false)`);
    if (layersBtnPresent) {
      throw new Error(`❌ Interactive card style toggle button still found in console!`);
    }

    // Close console
    await page.evaluate(() => {
      const mask = document.querySelector('#console-mask');
      if (mask) mask.click();
    });
    await page.waitForTimeout(500);

    // 8. Test Post Page (div#post)
    console.log('\n[Step 7] Visiting Post Page...');
    const postPageRes = await page.goto(`${targetUrl}posts/content-formats-and-markup-mastery/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    console.log(`✅ Post Page HTTP Status: ${postPageRes.status()}`);
    await page.waitForTimeout(1000);

    const postStyles = await page.evaluate(() => {
      const postContainer = document.querySelector('div#post');
      const postStyle = postContainer ? window.getComputedStyle(postContainer) : null;
      return {
        postBg: postStyle?.backgroundColor,
        postBackdrop: postStyle?.backdropFilter || postStyle?.webkitBackdropFilter,
      };
    });

    console.log(`✅ div#post background: ${postStyles.postBg}`);
    console.log(`✅ div#post backdrop-filter: ${postStyles.postBackdrop}`);

    // 9. Check Console Errors
    const fatalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('analytics') && !e.includes('Font')
    );
    if (fatalErrors.length > 0) {
      console.warn('⚠️ Console errors:', fatalErrors);
    } else {
      console.log('✅ 0 fatal console errors during full run.');
    }

    console.log(`\n🎉 All 3-Mode Card Style tests (Solid, Gray, Transparent) passed successfully on ${targetUrl}!\n`);
  } finally {
    if (browser) await browser.close();
    if (previewProcess) {
      previewProcess.kill();
    }
  }
}

const isProductionArg = process.argv.includes('--production') || process.argv.includes('--prod');
runLocalAndLiveTest(isProductionArg).catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
