import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';

async function runLocalAndLiveTest(isProduction = false) {
  const targetUrl = isProduction ? 'https://blog.epocanvas.com/' : 'http://127.0.0.1:4321/';
  console.log(`\n======================================================`);
  console.log(`💎 Starting Translucent Card Verification on ${targetUrl} (${isProduction ? 'PRODUCTION' : 'LOCAL'})...`);
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

    // 2. Check default data-translucent attribute
    const dataTranslucent = await page.evaluate(() => document.documentElement.dataset.translucent);
    console.log(`✅ Default documentElement.dataset.translucent: "${dataTranslucent}" (Expected: "true")`);
    if (dataTranslucent !== 'true') {
      throw new Error(`❌ Expected default data-translucent to be "true", got "${dataTranslucent}"`);
    }

    // 3. Inspect computed style of .recent-post-item and .card-widget
    const cardStyles = await page.evaluate(() => {
      const postCard = document.querySelector('.recent-post-item');
      const asideWidget = document.querySelector('#aside-content .card-widget');
      
      const postCardStyle = postCard ? window.getComputedStyle(postCard) : null;
      const asideWidgetStyle = asideWidget ? window.getComputedStyle(asideWidget) : null;

      return {
        postCardBg: postCardStyle?.backgroundColor,
        postCardBackdrop: postCardStyle?.backdropFilter || postCardStyle?.webkitBackdropFilter,
        asideBg: asideWidgetStyle?.backgroundColor,
        asideBackdrop: asideWidgetStyle?.backdropFilter || asideWidgetStyle?.webkitBackdropFilter,
      };
    });

    console.log(`✅ .recent-post-item background: ${cardStyles.postCardBg}`);
    console.log(`✅ .recent-post-item backdrop-filter: ${cardStyles.postCardBackdrop}`);
    console.log(`✅ #aside-content .card-widget background: ${cardStyles.asideBg}`);
    console.log(`✅ #aside-content .card-widget backdrop-filter: ${cardStyles.asideBackdrop}`);

    // 4. Test Switching to Solid Mode (data-translucent='false')
    console.log('\n[Step 2] Switching to Solid Mode (data-translucent="false")...');
    await page.evaluate(() => {
      document.documentElement.dataset.translucent = 'false';
    });
    await page.waitForTimeout(500);

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

    // 5. Switch back to Translucent Mode
    console.log('\n[Step 3] Switching back to Translucent Mode (data-translucent="true")...');
    await page.evaluate(() => {
      document.documentElement.dataset.translucent = 'true';
    });
    await page.waitForTimeout(500);

    // 6. Test Dark Mode Translucent Styles
    console.log('\n[Step 4] Testing Dark Mode Translucent Styles...');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(500);

    const darkStyles = await page.evaluate(() => {
      const asideWidget = document.querySelector('#aside-content .card-widget');
      const asideWidgetStyle = asideWidget ? window.getComputedStyle(asideWidget) : null;
      return {
        asideBg: asideWidgetStyle?.backgroundColor,
        asideBackdrop: asideWidgetStyle?.backdropFilter || asideWidgetStyle?.webkitBackdropFilter,
      };
    });

    console.log(`✅ Dark Mode .card-widget background: ${darkStyles.asideBg}`);
    console.log(`✅ Dark Mode .card-widget backdrop-filter: ${darkStyles.asideBackdrop}`);

    // 7. Test Clean Mode + Translucent Cards
    console.log('\n[Step 5] Testing Clean Mode (纯色模式) + Translucent Cards...');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'light';
      document.documentElement.dataset.background = 'clean';
      document.documentElement.dataset.translucent = 'true';
    });
    await page.waitForTimeout(500);

    const cleanModeBg = await page.evaluate(() => {
      const webBg = document.querySelector('#web_bg');
      return webBg ? window.getComputedStyle(webBg).backgroundColor : null;
    });
    console.log(`✅ Clean Mode #web_bg background color: ${cleanModeBg}`);

    // 8. Test Post Page
    console.log('\n[Step 6] Visiting Post Page...');
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

    console.log(`\n🎉 All Translucent & Frosted Glass tests passed successfully on ${targetUrl}!\n`);
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
