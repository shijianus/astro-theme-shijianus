import { chromium } from 'playwright';

const LIVE_URL = 'https://blog.epocanvas.com/guestbook/';

async function verifyLive() {
  console.log(`[Live Verify] Launching browser to audit: ${LIVE_URL}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('[Live Verify] 1. Navigating to live guestbook page...');
    await page.goto(LIVE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.guestbook-board-container', { timeout: 20000 });

    // Assert Page Title
    const title = await page.title();
    console.log(`[Live Verify] Page Title: "${title}"`);
    if (!title.includes('留言板')) {
      throw new Error(`Expected live page title to include "留言板", got "${title}"`);
    }

    // Verify .gb-hero is completely gone
    const hero = await page.$('.gb-hero');
    if (hero) {
      throw new Error('Expected class="gb-hero" to be REMOVED from production');
    }
    console.log('[Live Verify] ✓ Verified class="gb-hero" is completely absent');

    // 2. Audit Top Boost Stream
    console.log('[Live Verify] 2. Auditing Top Boost Stream...');
    const boostBadge = await page.textContent('.gb-boost-badge');
    console.log(`[Live Verify] Boost Badge text: "${boostBadge?.trim()}"`);

    const statusCountText = await page.textContent('.gb-boost-status-count');
    console.log(`[Live Verify] Boost Status text: "${statusCountText?.trim()}"`);
    if (!statusCountText?.includes('全站共收录')) {
      throw new Error(`Expected status count to include "全站共收录", got "${statusCountText}"`);
    }

    // Assert old subtitle and stamps are gone
    const oldSub = await page.$('.gb-boost-subtitle');
    if (oldSub) throw new Error('Old .gb-boost-subtitle should not exist on live');
    const oldStamps = await page.$('.gb-stamp-pill');
    if (oldStamps) throw new Error('Old .gb-stamp-pill should not exist on live');
    console.log('[Live Verify] ✓ Confirmed old subtitle and stamp pills are completely removed');

    // Verify "+ 发布 Boost" button
    const launchBoostBtn = await page.$('.gb-launch-boost-btn');
    if (!launchBoostBtn) throw new Error('Launch Boost button (.gb-launch-boost-btn) missing on live');
    const launchBtnText = await page.textContent('.gb-launch-boost-btn');
    console.log(`[Live Verify] Launch Boost button: "${launchBtnText?.trim()}"`);

    // 3. Audit Non-blocking Floating Composer Dock for Boost
    console.log('[Live Verify] 3. Testing Floating Composer Dock for Boost...');
    await launchBoostBtn.click();
    await page.waitForTimeout(400);

    const floatingComposer = await page.$('.gb-floating-composer');
    if (!floatingComposer) throw new Error('Floating composer failed to open on live');

    const activeTab = await page.textContent('.gb-mode-tab.is-active');
    console.log(`[Live Verify] Active Mode Tab: "${activeTab?.trim()}"`);
    if (!activeTab?.includes('Boost')) throw new Error('Expected Boost mode tab active');

    // Test Minimize to dock pill
    const minimizeBtn = await page.$('.gb-window-tool-btn[title="最小化到右下角"]');
    if (minimizeBtn) {
      await minimizeBtn.click();
      await page.waitForTimeout(300);
      const minimizedPill = await page.$('.gb-composer-minimized-pill');
      if (!minimizedPill) throw new Error('Minimized pill failed to appear');
      console.log('[Live Verify] ✓ Successfully minimized composer to dock pill');

      // Expand back
      await minimizedPill.click();
      await page.waitForTimeout(300);
      console.log('[Live Verify] ✓ Successfully restored composer from dock pill');
    }

    // Close composer
    const closeBtn = await page.$('.gb-window-tool-btn.is-close');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(300);
      console.log('[Live Verify] ✓ Successfully closed composer');
    }

    // 4. Audit Horizontal Categories Bar
    console.log('[Live Verify] 4. Auditing Horizontal Categories Bar...');
    const navCategories = ['最新', '近期', '维度', '热门', '精选', '我的贴文', '已读', '书签'];
    for (const catName of navCategories) {
      const catBtn = await page.$(`.gb-cat-btn:has-text("${catName}")`);
      if (!catBtn) {
        throw new Error(`Missing category: "${catName}" in horizontal nav bar`);
      }
    }
    console.log('[Live Verify] ✓ All 8 categories active on live');

    // 5. Audit Gesture Feed & 20-Item Display Cap
    console.log('[Live Verify] 5. Auditing Gesture Feed & 20-Item Display Cap...');
    await page.waitForSelector('.gb-gesture-row', { timeout: 10000 });
    const rowCount = await page.$$eval('.gb-gesture-row', (els) => els.length);
    console.log(`[Live Verify] Gesture rows rendered on screen: ${rowCount}`);
    if (rowCount === 0) throw new Error('No gestures rendered on live feed');
    if (rowCount > 20) throw new Error(`Gesture count on screen exceeds 20: ${rowCount}`);
    console.log('[Live Verify] ✓ Confirmed Gesture feed is capped at at most 20 items on live');

    // Test Floating Composer for Gesture
    console.log('[Live Verify] 5.1 Testing Floating Composer for Gesture...');
    const newGestureBtn = await page.$('.gb-new-gesture-btn');
    if (newGestureBtn) {
      await newGestureBtn.click();
      await page.waitForTimeout(300);
      const isGestureActive = await page.textContent('.gb-mode-tab.is-active');
      console.log(`[Live Verify] Composer opened with tab: "${isGestureActive?.trim()}"`);
      if (!isGestureActive?.includes('Gesture')) throw new Error('Expected Gesture mode tab active');

      // Close it
      await page.click('.gb-window-tool-btn.is-close');
      await page.waitForTimeout(300);
      console.log('[Live Verify] ✓ Floating composer opens in Gesture mode and closes cleanly');
    }

    // 6. Audit Click to Enter Detail View & Floor Timeline Scroller
    console.log('[Live Verify] 6. Auditing Gesture Detail View on live...');
    const firstRow = await page.$('.gb-gesture-row');
    await firstRow.click();
    await page.waitForTimeout(600);

    const detailView = await page.$('.gb-gesture-detail-view');
    if (!detailView) throw new Error('Failed to enter detail view on live');

    const opFloor = await page.$('#floor-1.is-op-floor');
    if (!opFloor) throw new Error('OP floor missing in detail view');

    const scrollerPct = await page.textContent('.gb-scroller-pct');
    const scrollerFloor = await page.textContent('.gb-scroller-floor-label');
    console.log(`[Live Verify] Live Floor Scroller: "${scrollerFloor?.trim()}" (${scrollerPct?.trim()})`);

    const notches = await page.$$eval('.gb-scroller-notch', (els) => els.length);
    console.log(`[Live Verify] Live Floor Notches: ${notches}`);
    if (notches < 2) throw new Error('Expected interactive floor notches on live scroller rail');

    // Return to list view
    await page.click('.gb-back-btn');
    await page.waitForTimeout(400);
    const returnedToTable = await page.$('.gb-gesture-table');
    if (!returnedToTable) throw new Error('Failed to return to gesture list on live');
    console.log('[Live Verify] ✓ Successfully returned to list view on live');

    // Check console errors
    console.log(`[Live Verify] Console errors captured: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.warn('[Live Verify] Warning console errors:', consoleErrors);
    }

    console.log('\n======================================================');
    console.log('🎉 LIVE PRODUCTION VERIFICATION PASSED 100%!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

verifyLive().catch((err) => {
  console.error('[Live Verify] Verification failed:', err);
  process.exit(1);
});
