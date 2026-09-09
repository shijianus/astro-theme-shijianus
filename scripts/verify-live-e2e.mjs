import { chromium } from 'playwright';
import assert from 'node:assert';

async function runLiveVerification() {
  console.log('🌐 Starting Live E2E Verification on Production: https://blog.epocanvas.com ...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // 1. Verify Flag Asset HTTP 200 on Production
    // -------------------------------------------------------------
    console.log('\n--- 1. Live Flag Asset Verification ---');
    const flagResp = await page.goto('https://blog.epocanvas.com/media/flags/my.png');
    assert.strictEqual(flagResp.status(), 200, 'Live /media/flags/my.png must return 200 OK');
    const flagBuffer = await flagResp.body();
    assert(flagBuffer.length > 500, 'Flag asset must have valid file size');
    console.log(`✅ Live /media/flags/my.png returned HTTP 200 OK (${flagBuffer.length} bytes)`);

    // -------------------------------------------------------------
    // 2. Verify Tab 3 Preferences on Production
    // -------------------------------------------------------------
    console.log('\n--- 2. Live Account Drawer Tab 3 (偏好设置) Verification ---');
    await page.goto('https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Open account drawer
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    const drawer = await page.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 8000 });
    assert(drawer !== null, 'Live account drawer must open');
    console.log('   -> Live account drawer opened successfully');

    // Click Tab 3: 偏好设置
    const tabButtons = await page.$$('.account-nav-tab');
    assert(tabButtons.length >= 3, 'Must have at least 3 account tabs');
    await tabButtons[2].click();
    await page.waitForTimeout(500);

    // Verify all preferences sections
    const sectionTitles = await page.$$eval('.account-card__title', (els) => els.map((e) => e.textContent?.trim()));
    console.log('   -> Live section titles in Tab 3:', sectionTitles);

    const hasNoticePref = sectionTitles.some((t) => t.includes('站内通知接收偏好'));
    const hasCommentPref = sectionTitles.some((t) => t.includes('评论区互动与显示偏好'));
    const hasMotionPref = sectionTitles.some((t) => t.includes('交互反馈与无障碍'));

    assert(hasNoticePref, 'Section 1: 站内通知接收偏好 must be present');
    assert(hasCommentPref, 'Section 2: 评论区互动与显示偏好 must be present');
    assert(hasMotionPref, 'Section 3: 交互反馈与无障碍 must be present');
    console.log('✅ All preferences sections verified intact on production!');

    // Close drawer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // 3. Verify Live Comments Residency, Flags & Zero Flickering
    // -------------------------------------------------------------
    console.log('\n--- 3. Live Comments Residency & Flag Verification ---');
    
    // Scroll to comment area
    await page.evaluate(() => {
      const el = document.querySelector('#post-comment');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForSelector('.tk-comments-list', { timeout: 12000 });
    console.log('   -> Live comment list loaded in DOM');

    // Verify flag rendering on live comments
    const flagInfo = await page.evaluate(() => {
      const img = document.querySelector('.tk-geo-flag-img');
      const badge = document.querySelector('.tk-geo-badge');
      return {
        hasFlagImg: Boolean(img),
        src: img?.getAttribute('src'),
        naturalWidth: img?.naturalWidth,
        naturalHeight: img?.naturalHeight,
        complete: img?.complete,
        badgeText: badge?.textContent?.trim(),
      };
    });
    console.log('   -> Live Flag badge info:', flagInfo);
    assert(flagInfo.hasFlagImg, 'Live comment must render .tk-geo-flag-img');
    assert(flagInfo.src?.includes('/media/flags/'), 'Flag img src must point to local /media/flags/');
    assert(flagInfo.naturalWidth > 0, 'Flag img must be decoded with naturalWidth > 0');
    assert(flagInfo.badgeText?.includes('马来西亚'), 'Badge text must show localized name 马来西亚');
    console.log('✅ Live country flag graphic image rendered and loaded 100% successfully!');

    // -------------------------------------------------------------
    // 4. Verify Zero Flickering on Clicks & Window Focus
    // -------------------------------------------------------------
    console.log('\n--- 4. Live Residency & Zero-Flicker Interaction Audit ---');

    await page.evaluate(() => {
      window.__sawLoadingFlicker = false;
      const observer = new MutationObserver(() => {
        if (document.body.innerText.includes('正在加载评论...')) {
          window.__sawLoadingFlicker = true;
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });

    // Simulate clicking across the comment section and page
    for (let i = 0; i < 15; i++) {
      await page.mouse.click(300 + i * 20, 500 + (i % 3) * 30);
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await page.waitForTimeout(50);
    }

    const flickerDetected = await page.evaluate(() => Boolean(window.__sawLoadingFlicker));
    assert(!flickerDetected, 'Live comment area must NEVER flash "正在加载评论..." on clicks or window focus!');
    console.log('✅ Zero flickering confirmed on live production site across 15 clicks and focus events!');

    console.log('\n🎉 ALL LIVE PRODUCTION E2E VERIFICATIONS PASSED 100%!');
  } finally {
    await browser.close();
  }
}

runLiveVerification().catch((err) => {
  console.error('\n❌ Live Verification Failed:', err);
  process.exit(1);
});
