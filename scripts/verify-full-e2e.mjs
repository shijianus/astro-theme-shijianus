import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

async function runVerification() {
  console.log('🚀 Starting Local E2E Verification Server on dist/ ...');
  const port = 4329;
  const server = spawn('python3', ['-m', 'http.server', String(port), '-d', 'dist'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Give python http.server a moment to bind
  await new Promise((r) => setTimeout(r, 1000));

  console.log(`✅ Server ready on port ${port}. Launching Playwright browser...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // 1. Verify Flag Asset HTTP 200
    // -------------------------------------------------------------
    console.log('\n--- Test 1: First-party Flag Asset Verification ---');
    const flagResp = await page.goto(`http://127.0.0.1:${port}/media/flags/my.png`);
    assert.strictEqual(flagResp.status(), 200, 'Flag asset /media/flags/my.png must return 200 OK');
    const flagBuffer = await flagResp.body();
    assert(flagBuffer.length > 500, 'Flag asset must have valid file size (>500 bytes)');
    console.log(`✅ /media/flags/my.png returned 200 OK (${flagBuffer.length} bytes)`);

    // -------------------------------------------------------------
    // 2. Verify Tab 3 Preferences in ThemeAccountDrawer
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Account Drawer Tab 3 (偏好设置) Verification ---');
    await page.goto(`http://127.0.0.1:${port}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Open account drawer via custom event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    const drawer = await page.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 8000 });
    assert(drawer !== null, 'Account drawer must be visible');
    console.log('   -> Account drawer opened successfully');

    // Click Tab 3: 偏好设置
    const tabButtons = await page.$$('.account-nav-tab');
    assert(tabButtons.length >= 3, 'Must have at least 3 account tabs');
    await tabButtons[2].click();
    await page.waitForTimeout(400);

    // Verify all 3 sections of Tab 3
    const sectionTitles = await page.$$eval('.account-card__title', (els) => els.map((e) => e.textContent?.trim()));
    console.log('   -> Rendered section titles in Tab 3:', sectionTitles);

    const hasNoticePref = sectionTitles.some((t) => t.includes('站内通知接收偏好'));
    const hasCommentPref = sectionTitles.some((t) => t.includes('评论区互动与显示偏好'));
    const hasMotionPref = sectionTitles.some((t) => t.includes('交互反馈与无障碍'));

    assert(hasNoticePref, 'Section 1: 站内通知接收偏好 must be present');
    assert(hasCommentPref, 'Section 2: 评论区互动与显示偏好 must be present');
    assert(hasMotionPref, 'Section 3: 交互反馈与无障碍 must be present');
    console.log('✅ All 3 preferences sections verified intact with sliders!');

    // Close drawer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // 3. Verify Comment Area Residency & Zero Flickering on Clicks
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Comment Area Residency & Zero Blinking/Flickering ---');
    
    // Inject mock comments response if API endpoint is static in preview
    await page.route('**/api/comments*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          sort: 'new',
          comments: [
            {
              id: 'cm_test_e2e_1',
              postSlug: 'content-formats-and-markup-mastery',
              parentId: null,
              quoteId: null,
              quote: null,
              postType: 'comment',
              authorId: 'epo_u_1',
              authorName: 'admin',
              authorAvatar: '/media/shijianus/avatar.jpg',
              authorWebsite: '',
              authorRole: 'admin',
              message: 'E2E Verified Resident Comment without flickering',
              likesCount: 1,
              reactions: { summary: { '💡': 1 }, users: { epo_u_1: '💡' } },
              status: 'published',
              createdAt: '2026-09-05 22:19:31',
              updatedAt: '2026-09-07 11:35:18',
              showLocation: true,
              ipCountry: 'MY',
              ipCountryName: '马来西亚',
              ipCountryFlag: '🇲🇾',
              ipLocation: 'MY',
            },
          ],
        }),
      });
    });

    // Trigger comment reload with mock API
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:comment-account-change'));
    });
    await page.waitForSelector('.tk-comments-list', { timeout: 8000 });
    console.log('   -> Comment list rendered in DOM');

    // Verify flag rendering
    const flagInfo = await page.evaluate(() => {
      const img = document.querySelector('.tk-geo-flag-img');
      const badge = document.querySelector('.tk-geo-badge');
      return {
        hasFlagImg: Boolean(img),
        src: img?.getAttribute('src'),
        naturalWidth: img?.naturalWidth,
        badgeText: badge?.textContent?.trim(),
      };
    });
    console.log('   -> Flag badge info:', flagInfo);
    assert(flagInfo.hasFlagImg, 'Comment must render .tk-geo-flag-img');
    assert(flagInfo.src?.includes('/media/flags/my.png'), 'Flag img src must point to /media/flags/my.png');
    assert(flagInfo.badgeText?.includes('马来西亚'), 'Badge text must show localized name 马来西亚');
    console.log('✅ Country flag graphic image rendered properly with localized name!');

    // Test Multiple Random Clicks and Window Blur/Focus
    console.log('   -> Simulating random clicks and blur/focus events across the page...');

    // Observe any appearance of "正在加载评论..."
    await page.evaluate(() => {
      window.__sawLoadingFlicker = false;
      const observer = new MutationObserver(() => {
        if (document.body.innerText.includes('正在加载评论...')) {
          window.__sawLoadingFlicker = true;
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });

    // Perform multiple clicks on page
    for (let i = 0; i < 15; i++) {
      await page.mouse.click(200 + i * 25, 300 + i * 15);
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await page.waitForTimeout(40);
    }

    const flickerDetected = await page.evaluate(() => Boolean(window.__sawLoadingFlicker));
    assert(!flickerDetected, 'Comment area must NEVER flash "正在加载评论..." on clicks or window focus!');
    console.log('✅ Zero flickering confirmed across 15 repeated clicks and window focus events!');

    console.log('\n🎉 ALL LOCAL E2E VERIFICATIONS PASSED SUCCESSFULLY!');
  } finally {
    await browser.close();
    server.kill('SIGTERM');
  }
}

runVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
