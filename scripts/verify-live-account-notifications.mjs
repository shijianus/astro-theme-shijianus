import { chromium } from 'playwright';

async function runLiveVerification() {
  console.log('🚀 Running Production Live E2E Verification on https://blog.epocanvas.com...');

  // 1. API Verification
  console.log('\n--- 1. Testing Production /api/comments?feed=user API ---');
  const apiRes = await fetch('https://blog.epocanvas.com/api/comments?feed=user&authorName=LiveVerifier');
  console.log('   -> Live API Status:', apiRes.status);
  if (apiRes.status !== 200) {
    throw new Error(`Expected 200 from live API, got ${apiRes.status}`);
  }
  const apiJson = await apiRes.json();
  console.log('   -> ok:', apiJson.ok);
  console.log('   -> userComments length:', apiJson.userComments?.length);
  console.log('   -> notifications length:', apiJson.notifications?.length);
  if (!apiJson.ok || !Array.isArray(apiJson.userComments) || !Array.isArray(apiJson.notifications)) {
    throw new Error('Invalid structure from live /api/comments?feed=user');
  }

  // 2. Desktop Browser Verification
  console.log('\n--- 2. Desktop Browser Verification (1440x900) ---');
  const browser = await chromium.launch({ headless: true });
  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await desktopContext.newPage();

    await page.goto('https://blog.epocanvas.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Open Account Drawer
    console.log('   -> Opening Account Drawer on live site...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    await page.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 8000 });
    console.log('   -> Live Account Drawer is visible.');

    // Verify Default Tab is Notifications / 站内提醒
    const activeTab = await page.$('.account-nav-tab.is-active');
    const activeTabText = await activeTab?.textContent();
    console.log('   -> Live Default Active Tab:', activeTabText?.trim());
    if (!activeTabText?.includes('站内提醒') && !activeTabText?.includes('通知')) {
      throw new Error(`Expected default active tab to be 站内提醒, got ${activeTabText}`);
    }

    // Verify Default Partition is 个人互动与足迹
    const activePartition = await page.$('.account-partition-btn.is-active');
    const activePartitionText = await activePartition?.textContent();
    console.log('   -> Live Default Active Notification Partition:', activePartitionText?.trim());
    if (!activePartitionText?.includes('个人互动与足迹')) {
      throw new Error(`Expected default partition to be 个人互动与足迹, got ${activePartitionText}`);
    }

    // Inspect Hero Card
    const avatarTrigger = await page.$('.account-hero-card__avatar.is-clickable');
    if (!avatarTrigger) throw new Error('Missing live avatar trigger');

    // Switch to Tab 1
    const tabs = await page.$$('.account-nav-tab');
    await tabs[0].click();
    await page.waitForTimeout(400);

    const nameInput = await page.$('.account-profile-form input[name="name"]');
    const tzInput = await page.$('.account-profile-form input[name="timezone"]');
    const locInput = await page.$('.account-profile-form input[name="location"]');
    if (!nameInput || !tzInput || !locInput) throw new Error('Missing profile inputs in Tab 1');
    console.log('   -> Live Tab 1 profile form inputs verified.');

    // Tab 2 Dual-Partition
    console.log('   -> Checking Tab 2 Dual-Partition notifications...');
    await tabs[1].click();
    await page.waitForTimeout(500);

    const partitionButtons = await page.$$('.account-partition-btn');
    if (partitionButtons.length !== 2) throw new Error('Expected 2 partition buttons');
    const btn1 = await partitionButtons[0].textContent();
    const btn2 = await partitionButtons[1].textContent();
    console.log('   -> Partition 1:', btn1?.trim());
    console.log('   -> Partition 2:', btn2?.trim());
    if (!btn1?.includes('全站广播通告') || !btn2?.includes('个人互动与足迹')) {
      throw new Error('Partition button labels incorrect on live site');
    }

    // Broadcast partition
    await partitionButtons[0].click();
    await page.waitForTimeout(400);
    const broadcastItems = await page.$$('.account-broadcast-item');
    console.log('   -> Live Broadcast Items count:', broadcastItems.length);
    if (broadcastItems.length === 0) throw new Error('Expected live broadcast items');

    // Switch to personal partition
    await partitionButtons[1].click();
    await page.waitForTimeout(400);
    const refreshBtn = await page.$('.account-refresh-feed-btn');
    if (!refreshBtn) throw new Error('Missing live refresh button in personal partition');
    console.log('   -> Personal partition verified with refresh button.');

    // Tab 3 Preferences
    console.log('   -> Checking Tab 3 Preferences...');
    await tabs[2].click();
    await page.waitForTimeout(400);
    const sortButtons = await page.$$('.account-pref-sort-btn');
    if (sortButtons.length !== 2) throw new Error('Expected 2 sort mode buttons in live Tab 3');
    const toggles = await page.$$('.account-pref-card input[type="checkbox"]');
    console.log('   -> Live preference toggles count:', toggles.length);
    if (toggles.length !== 1) throw new Error(`Expected exactly 1 preference slider in live Tab 3, got ${toggles.length}`);

    // 3. Mobile Viewport Verification
    console.log('\n--- 3. Mobile Viewport Verification (390x844) ---');
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('https://blog.epocanvas.com/', { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(1500);

    await mobilePage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    await mobilePage.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 8000 });
    const drawerRect = await mobilePage.evaluate(() => {
      const el = document.querySelector('.theme-account-drawer');
      return el.getBoundingClientRect().width;
    });
    console.log('   -> Live Mobile Drawer Width:', drawerRect);
    if (drawerRect > 390) throw new Error('Live mobile drawer exceeded 390px');

    console.log('\n🎉 ALL LIVE PRODUCTION VERIFICATIONS PASSED 100%!');
  } finally {
    await browser.close();
  }
}

runLiveVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Live verification failed:', err);
    process.exit(1);
  });
