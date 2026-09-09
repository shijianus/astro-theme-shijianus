import { chromium } from 'playwright';

const URL = 'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('[Live Test] Launching Chromium browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });

    const page = await context.newPage();
    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => console.log('[PAGE ERROR]', err.message));

    console.log(`[Live Test] Navigating to live URL: ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 35000 });
    await wait(1500);

    // Wait for ThemeOverlays astro-island to hydrate
    console.log('[Live Test] Waiting for ThemeOverlays hydration...');
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island[component-export="ThemeOverlays"]');
      return island && !island.hasAttribute('ssr');
    }, { timeout: 12000 }).catch(() => {
      console.log('[Live Test] Island hydration check timeout, continuing...');
    });
    await wait(800);

    // Open notification / account drawer
    console.log('[Live Test] Triggering open-notifications custom event...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });

    console.log('[Live Test] Waiting for .theme-account-overlay.show...');
    await page.waitForSelector('.theme-account-overlay.show', { timeout: 6000 });
    await wait(400);

    // 1. Verify drawer is visible
    const drawer = page.locator('.theme-account-drawer');
    const isDrawerVisible = await drawer.isVisible();
    console.log('[Assert 1] Account Drawer visible:', isDrawerVisible);
    if (!isDrawerVisible) throw new Error('Account drawer not visible on live site');

    // 2. Click "全站广播通告" partition button if not already active
    const broadcastPartitionBtn = page.locator('.account-partition-btn:has-text("全站广播通告")');
    if (await broadcastPartitionBtn.isVisible()) {
      await page.evaluate(() => {
        const btn = document.querySelector('.account-partition-btn');
        if (btn) btn.click();
      });
      await wait(400);
    }

    // 3. Assert NO online edit button exists (.account-card-action-btn)
    const editBtnCount = await page.locator('.account-card-action-btn').count();
    console.log('[Assert 2] Online edit buttons in drawer:', editBtnCount, '(Expected: 0)');
    if (editBtnCount !== 0) throw new Error(`Found ${editBtnCount} .account-card-action-btn elements; expected 0!`);

    // 4. Assert NO inline edit form exists (.account-broadcast-editor)
    const editorFormCount = await page.locator('.account-broadcast-editor').count();
    console.log('[Assert 3] Online broadcast editor forms in drawer:', editorFormCount, '(Expected: 0)');
    if (editorFormCount !== 0) throw new Error(`Found ${editorFormCount} .account-broadcast-editor elements; expected 0!`);

    // 5. Assert featured broadcast item exists (.account-broadcast-item--featured)
    const featuredItem = page.locator('.account-broadcast-item--featured');
    const isFeaturedVisible = await featuredItem.isVisible();
    console.log('[Assert 4] Featured broadcast card visible:', isFeaturedVisible);
    if (!isFeaturedVisible) throw new Error('Featured broadcast item not visible on live site');

    // 6. Assert Badge content
    const badgeText = await featuredItem.locator('.account-broadcast-badge--featured').innerText();
    console.log('[Assert 5] Badge text:', badgeText.trim(), '(Expected: 博主动态)');
    if (!badgeText.includes('博主动态')) throw new Error(`Badge text mismatch: "${badgeText}"`);

    // 7. Assert Title content
    const titleText = await featuredItem.locator('.account-broadcast-title').innerText();
    console.log('[Assert 6] Title text:', titleText.trim());
    if (!titleText.includes('读者中心全面升级') && !titleText.includes('通告')) {
      throw new Error(`Title text mismatch: "${titleText}"`);
    }

    // 8. Assert Summary / Description content
    const descText = await featuredItem.locator('.account-broadcast-desc').innerText();
    console.log('[Assert 7] Description text:', descText.trim().slice(0, 60) + '...');
    if (!descText || descText.length < 10) {
      throw new Error('Description text is empty or too short');
    }

    // 9. Assert Bullets list count and content
    const bulletsCount = await featuredItem.locator('.account-broadcast-bullets li').count();
    console.log('[Assert 8] Bullets count:', bulletsCount, '(Expected: >= 3)');
    if (bulletsCount < 3) {
      throw new Error(`Expected at least 3 bullet points, found ${bulletsCount}`);
    }

    // 10. Assert Link button
    const linkLocator = featuredItem.locator('.account-broadcast-link');
    const hasLink = await linkLocator.isVisible();
    console.log('[Assert 9] Detail link visible:', hasLink);
    if (hasLink) {
      const linkHref = await linkLocator.getAttribute('href');
      console.log('[Assert 10] Detail link href:', linkHref);
      if (!linkHref || linkHref === '#') {
        throw new Error(`Detail link href invalid: ${linkHref}`);
      }
    }

    await page.screenshot({ path: 'scratch/prod-broadcast-drawer.png' });
    console.log('[Live Test] Screenshot saved to scratch/prod-broadcast-drawer.png');

    console.log('\n=============================================');
    console.log('🎉 LIVE PRODUCTION BROADCAST E2E TESTS PASSED!');
    console.log('=============================================\n');

    await browser.close();
  } catch (err) {
    console.error('\n❌ LIVE TEST FAILED:', err);
    process.exit(1);
  }
}

run();
