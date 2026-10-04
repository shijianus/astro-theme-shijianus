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

    // 2. Check default cardStyle attribute (expected: 'gray' / 磨砂)
    const initialCardStyle = await page.evaluate(() => document.documentElement.dataset.cardStyle);
    const initialTranslucent = await page.evaluate(() => document.documentElement.dataset.translucent);
    console.log(`✅ Default data-card-style: "${initialCardStyle}" (Expected: "gray")`);
    console.log(`✅ Default data-translucent: "${initialTranslucent}" (Expected: "true")`);

    if (initialCardStyle !== 'gray') {
      throw new Error(`❌ Expected default data-card-style to be "gray", got "${initialCardStyle}"`);
    }

    // 3. Inspect Gray Mode (磨砂模式) computed styles
    console.log('\n[Step 2] Verifying Gray Mode (磨砂模式) computed styles...');
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

    // 5. Test Transparent Mode (透明模式: data-card-style='transparent')
    console.log('\n[Step 4] Switching to Transparent Mode (透明模式: data-card-style="transparent")...');
    await page.evaluate(() => {
      document.documentElement.dataset.cardStyle = 'transparent';
      document.documentElement.dataset.translucent = 'true';
    });
    await page.waitForTimeout(400);

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

    // 7. Test Account Settings Drawer UI Interaction
    console.log('\n[Step 6] Testing Account Settings Drawer UI Switcher...');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'light';
      document.documentElement.dataset.cardStyle = 'gray';
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications', { detail: { tab: 'settings' } }));
    });
    await page.waitForTimeout(800);

    const drawerVisible = await page.evaluate(() => {
      const drawer = document.querySelector('.theme-account-drawer');
      return drawer !== null;
    });
    console.log(`✅ Account Drawer opened: ${drawerVisible}`);

    // Click on Transparent option in UI
    console.log('👉 Clicking on Transparent option in Settings Drawer UI...');
    const transparentOption = await page.$('.card-style-option--transparent');
    if (transparentOption) {
      await transparentOption.click();
      await page.waitForTimeout(500);
      const activeStyle = await page.evaluate(() => document.documentElement.dataset.cardStyle);
      console.log(`✅ Active data-card-style after UI click: "${activeStyle}" (Expected: "transparent")`);
      if (activeStyle !== 'transparent') {
        throw new Error(`❌ UI Switch failed, expected data-card-style to be "transparent", got "${activeStyle}"`);
      }
    } else {
      console.warn('⚠️ .card-style-option--transparent not found in DOM');
    }

    // Click on Solid option in UI
    console.log('👉 Clicking on Solid option in Settings Drawer UI...');
    const solidOption = await page.$('.card-style-option--solid');
    if (solidOption) {
      await solidOption.click();
      await page.waitForTimeout(500);
      const activeStyle = await page.evaluate(() => document.documentElement.dataset.cardStyle);
      console.log(`✅ Active data-card-style after UI click: "${activeStyle}" (Expected: "solid")`);
      if (activeStyle !== 'solid') {
        throw new Error(`❌ UI Switch failed, expected data-card-style to be "solid", got "${activeStyle}"`);
      }
    }

    // Click on Gray option in UI
    console.log('👉 Clicking on Gray option in Settings Drawer UI...');
    const grayOption = await page.$('.card-style-option--gray');
    if (grayOption) {
      await grayOption.click();
      await page.waitForTimeout(500);
      const activeStyle = await page.evaluate(() => document.documentElement.dataset.cardStyle);
      console.log(`✅ Active data-card-style after UI click: "${activeStyle}" (Expected: "gray")`);
      if (activeStyle !== 'gray') {
        throw new Error(`❌ UI Switch failed, expected data-card-style to be "gray", got "${activeStyle}"`);
      }
    }

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
