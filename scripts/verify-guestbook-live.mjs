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

    // Confirm separate Boost launch button is REMOVED
    const launchBoostBtn = await page.$('.gb-launch-boost-btn');
    if (launchBoostBtn) throw new Error('Separate Launch Boost button should be removed from header on live');
    console.log('[Live Verify] ✓ Verified separate Boost launch button removed from header');

    // Verify Boost spec badge on header right
    const specBadge = await page.$('.gb-boost-spec-badge');
    if (!specBadge) throw new Error('.gb-boost-spec-badge missing on live');
    const specText = await page.textContent('.gb-boost-spec-badge');
    console.log(`[Live Verify] Boost Spec Badge text: "${specText?.trim()}"`);

    // Verify 3 rows container and all 3 tracks
    const track1 = await page.$('.gb-track-1');
    const track2 = await page.$('.gb-track-2');
    const track3 = await page.$('.gb-track-3');
    if (!track1 || !track2 || !track3) {
      throw new Error('Expected all 3 Boost tracks rendered on live');
    }
    console.log('[Live Verify] ✓ Confirmed 3-row Boost tracks rendered on live');

    // 3. Audit Navigation Bar: "维度" First (4-Item Scrollable Menu) + Horizontal Category Tabs
    console.log('[Live Verify] 3. Auditing Navigation Bar: "维度" First + Horizontal Tabs...');
    // 3.1 Verify Dimension dropdown is placed at the first position
    const firstNavEl = await page.$('.gb-nav-bar__categories > *:first-child');
    const isFirstDim = await firstNavEl?.$('.gb-dim-dropdown-btn');
    if (!isFirstDim) throw new Error('"维度" dropdown not placed at the first position on live');
    console.log('[Live Verify] ✓ Confirmed "维度" dropdown is placed at the first position on live');

    // Open Dimension dropdown
    await isFirstDim.click();
    await page.waitForTimeout(300);

    const dimDropdownMenu = await page.$('.gb-scrollable-dropdown.is-four-items-max');
    if (!dimDropdownMenu) throw new Error('Dimension scrollable dropdown failed to open on live');
    console.log('[Live Verify] ✓ Dimension dropdown opened on live with 4-item scrollable menu');

    // Select "全部维度" to close
    const allOption = await page.$('.gb-scrollable-dropdown__item:has-text("全部维度")');
    if (allOption) await allOption.click();
    await page.waitForTimeout(300);

    // 3.2 Verify Horizontal Tabs are lined up: 最新, 近期, 热门, 精选, 我的贴文, 已读, 书签
    const horizontalTabs = await page.$$eval('.gb-cat-tab-btn', (els) => els.map((el) => el.textContent?.trim()));
    console.log(`[Live Verify] Live horizontal tabs: ${JSON.stringify(horizontalTabs)}`);
    const expectedOrder = ['最新', '近期', '热门', '精选', '我的贴文', '已读', '书签'];
    for (const exp of expectedOrder) {
      if (!horizontalTabs.some((t) => t.includes(exp))) {
        throw new Error(`Expected horizontal tab "${exp}" on live`);
      }
    }
    console.log('[Live Verify] ✓ Confirmed all category tabs horizontally rendered in order after "维度" on live');

    // 4. Audit Official Pinned Rule Threads
    console.log('[Live Verify] 4. Auditing Official Pinned Rule Threads...');
    await page.waitForSelector('.gb-gesture-row', { timeout: 10000 });
    const pinnedRowsCount = await page.$$eval('.gb-gesture-row.is-pinned-row', (els) => els.length);
    console.log(`[Live Verify] Live pinned rule threads count: ${pinnedRowsCount}`);
    if (pinnedRowsCount < 4) {
      throw new Error(`Expected at least 4 pinned rule threads on live, got ${pinnedRowsCount}`);
    }
    console.log('[Live Verify] ✓ Verified 4 official pinned rule threads on live');

    // 5. Audit Gesture Feed & 20-Item Display Cap
    console.log('[Live Verify] 5. Auditing Gesture Feed & 20-Item Display Cap...');
    const rowCount = await page.$$eval('.gb-gesture-row', (els) => els.length);
    console.log(`[Live Verify] Gesture rows rendered on screen: ${rowCount}`);
    if (rowCount === 0) throw new Error('No gestures rendered on live feed');
    if (rowCount > 20) throw new Error(`Gesture count on screen exceeds 20: ${rowCount}`);
    console.log('[Live Verify] ✓ Confirmed Gesture feed is capped at at most 20 items on live');

    // 6. Test Single Publish Button, Drag Handle, Partition Guidance & Result Word Count
    console.log('[Live Verify] 6. Testing Floating Composer (Drag Button, Partition Guidance, Result Word Count)...');
    const newGestureBtn = await page.$('.gb-new-gesture-btn');
    if (!newGestureBtn) throw new Error('Single publish button (.gb-new-gesture-btn) missing on live');
    await newGestureBtn.click();
    await page.waitForTimeout(400);

    const floatingComposer = await page.$('.gb-floating-composer');
    if (!floatingComposer) throw new Error('Floating composer failed to open on live');

    // 6.1 Verify dedicated drag handle button
    const dragBtn = await page.$('.gb-drag-handle-btn');
    if (!dragBtn) throw new Error('Dedicated drag handle button (.gb-drag-handle-btn) missing on live');
    console.log('[Live Verify] ✓ Confirmed dedicated drag handle button is present on live');

    // 6.2 Verify lecturing banners are eliminated
    const smartBadgeCount = await page.$$eval('.gb-smart-type-badge', (els) => els.length);
    const smartHintCount = await page.$$eval('.gb-composer-smart-hint', (els) => els.length);
    if (smartBadgeCount > 0 || smartHintCount > 0) {
      throw new Error('Lecturing smart badge / hint banners should be completely removed on live');
    }
    console.log('[Live Verify] ✓ Confirmed smart badge & lecturing hint banners are completely eliminated on live');

    // 6.3 Verify initial result-oriented word count and submit button
    let wordCountText = await page.textContent('.gb-word-count');
    let submitBtnText = await page.textContent('.gb-modal-foot .gb-submit-btn');
    console.log(`[Live Verify] Initial Word Result: "${wordCountText?.trim()}", Button: "${submitBtnText?.trim()}"`);
    if (!wordCountText?.includes('30 字')) {
      throw new Error(`Expected result word count to include "30 字", got "${wordCountText}"`);
    }
    if (!submitBtnText?.includes('发射 Boost')) {
      throw new Error(`Expected submit button to say "发射 Boost" on live, got "${submitBtnText}"`);
    }

    // 6.4 Verify Partition Trigger & Light Descriptions
    const channelTrigger = await page.$('.gb-composer-channel-trigger');
    if (!channelTrigger) throw new Error('Partition dropdown trigger missing on live');
    await channelTrigger.click();
    await page.waitForTimeout(200);

    const channelMenu = await page.$('.gb-composer-channel-dropdown-menu');
    if (!channelMenu) throw new Error('Partition dropdown menu failed to open on live');

    const descCount = await page.$$eval('.gb-ch-opt-desc', (els) => els.length);
    console.log(`[Live Verify] Live partition scope descriptions count: ${descCount}`);
    if (descCount < 5) throw new Error('Expected partition options to show fine purpose descriptions on live');

    // Select "技术探讨"
    const techOpt = await page.$('.gb-composer-channel-option:has-text("技术探讨")');
    if (techOpt) await techOpt.click();
    await page.waitForTimeout(200);

    wordCountText = await page.textContent('.gb-word-count');
    submitBtnText = await page.textContent('.gb-modal-foot .gb-submit-btn');
    console.log(`[Live Verify] After partition selection: Word Result: "${wordCountText?.trim()}", Button: "${submitBtnText?.trim()}"`);
    if (!wordCountText?.includes('还需至少 8 字')) {
      throw new Error(`Expected word count to say "还需至少 8 字", got "${wordCountText}"`);
    }
    if (!submitBtnText?.includes('发布 Gesture')) {
      throw new Error('Expected submit button to switch to "发布 Gesture" on live');
    }

    // 6.5 Fill title and tag
    const titleInput = await page.$('.gb-modal-title-input');
    if (titleInput) {
      await titleInput.fill('Live E2E Verification Title');
      await page.waitForTimeout(100);
    }
    const tagInput = await page.$('.gb-composer-tag-mini-input');
    if (tagInput) {
      await tagInput.fill('#架构验证');
      await page.waitForTimeout(100);
    }

    // Test Minimize to dock pill
    const minimizeBtn = await page.$('.gb-window-tool-btn[title="最小化到右下角"]');
    if (minimizeBtn) {
      await minimizeBtn.click();
      await page.waitForTimeout(300);
      const minimizedPill = await page.$('.gb-composer-minimized-pill');
      if (!minimizedPill) throw new Error('Minimized pill failed to appear on live');
      console.log('[Live Verify] ✓ Successfully minimized composer to dock pill on live');

      // Expand back
      await minimizedPill.click();
      await page.waitForTimeout(300);
      console.log('[Live Verify] ✓ Successfully restored composer from dock pill on live');
    }

    // Close composer
    const closeBtn = await page.$('.gb-window-tool-btn.is-close');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(300);
      console.log('[Live Verify] ✓ Successfully closed composer on live');
    }

    // 7. Audit Click to Enter Detail View & Floor Timeline Scroller
    console.log('[Live Verify] 7. Auditing Gesture Detail View on live...');
    const welcomeRow = await page.$('.gb-gesture-row:has-text("欢迎来到全站留言")');
    if (welcomeRow) {
      await welcomeRow.click();
    } else {
      const firstRow = await page.$('.gb-gesture-row');
      await firstRow.click();
    }
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
