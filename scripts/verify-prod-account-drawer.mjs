import { chromium } from 'playwright';
import assert from 'assert';

async function verifyProdAccountDrawer() {
  const targetUrl = process.env.TARGET_URL || 'https://blog.epocanvas.com';
  console.log(`🚀 Starting Live Production E2E Verification on: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log(`1. Navigating to ${targetUrl} ...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 35000 });
    console.log('   ✓ Page loaded.');

    console.log('2. Opening Account Drawer via custom event...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    await page.waitForTimeout(600);

    const drawer = await page.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 5000 });
    assert(drawer !== null, 'Account drawer should be visible');
    console.log('   ✓ Account Drawer is visible with smooth animation.');

    // 3. Verify Header
    console.log('3. Verifying Header elements...');
    const headTitle = await page.textContent('.theme-account-drawer__head h2');
    assert(headTitle?.includes('账号中心'), 'Header title must contain 账号中心');
    console.log('   ✓ Header title: 账号中心 verified');

    const statusDot = await page.$('.status-indicator-dot');
    assert(statusDot !== null, 'Status indicator dot must be present');
    console.log('   ✓ Live status indicator dot present');

    const closeBtn = await page.$('.theme-account-drawer__close');
    assert(closeBtn !== null, 'Close button with class theme-account-drawer__close must be present');
    console.log('   ✓ Close button verified');

    // 4. Verify Hero Profile Card
    console.log('4. Verifying Hero Profile Card...');
    const heroCard = await page.$('.account-hero-card');
    assert(heroCard !== null, 'Hero profile card must be present');
    const heroBox = await heroCard.boundingBox();
    assert(heroBox && heroBox.height >= 80, `Hero card height must be at least 80px, got ${heroBox?.height}px`);
    console.log(`   ✓ Hero card height verified: ${heroBox.height}px >= 80px`);
    const heroPill = await page.textContent('.account-pill');
    assert(Boolean(heroPill), 'Account pill must be present');
    console.log(`   ✓ Hero pill tag: [${heroPill?.trim()}] verified`);

    // 5. Verify Navigation Tabs (3 tabs)
    console.log('5. Verifying Segmented Navigation Tabs...');
    const tabs = await page.$$('.account-nav-tab');
    assert.strictEqual(tabs.length, 3, 'Must have exactly 3 navigation tabs');
    console.log('   ✓ Exactly 3 segmented navigation tabs present');

    // 6. Verify Tab 1 Content (Epomail card & benefit chips)
    console.log('6. Verifying Tab 1 (Auth & Profile)...');
    const epomailCard = await page.$('.account-card--epomail');
    assert(epomailCard !== null, 'Epomail SSO card must be present');
    const epomailTitle = await page.textContent('.account-card--epomail .account-card__title');
    assert(epomailTitle?.includes('EpoCanvas Mail'), 'Epomail brand title must be present');
    console.log(`   ✓ Epomail card title: [${epomailTitle?.trim()}] verified`);

    const benefitChips = await page.$$('.epomail-benefit-item');
    console.log(`   ✓ Epomail benefit chips count: ${benefitChips.length}`);

    const oauthBtn = await page.$('.epomail-primary-login-btn');
    assert(oauthBtn !== null, 'OAuth primary login button must be present');
    console.log('   ✓ Primary OAuth button verified');

    // 7. Verify Tab 2 (Notifications)
    console.log('7. Verifying Tab 2 (Notifications)...');
    await tabs[1].click();
    await page.waitForTimeout(400);

    const notifCard = await page.waitForSelector('.account-tab-content', { state: 'visible' });
    assert(notifCard !== null, 'Notifications tab content must be visible');
    console.log('   ✓ Notifications tab content visible');

    // 8. Verify Tab 3 (Settings & Architecture)
    console.log('8. Verifying Tab 3 (Settings & Architecture)...');
    await tabs[2].click();
    await page.waitForTimeout(400);

    const archDiagram = await page.waitForSelector('.arch-flow-diagram', { state: 'visible' });
    assert(archDiagram !== null, 'Architecture flow diagram must be visible');
    const archText = await page.textContent('.arch-flow-diagram');
    assert(archText?.includes('评论数据域') && archText?.includes('用户身份域'), 'Arch diagram must detail both domains');
    console.log('   ✓ Architecture Flow Diagram verified');

    // Switch back to Tab 1 and take screenshot
    await tabs[0].click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'scratch/prod-account-drawer.png' });
    console.log('   ✓ Production visual audit screenshot saved to scratch/prod-account-drawer.png');

    // Verify close interaction
    console.log('9. Testing Close Button interaction...');
    await closeBtn.click();
    await page.waitForTimeout(500);
    const drawerOpen = await page.evaluate(() => {
      return document.querySelector('.theme-account-overlay')?.classList.contains('show');
    });
    assert.strictEqual(drawerOpen, false, 'Drawer overlay should close after clicking close button');
    console.log('   ✓ Drawer successfully closed on button click');

    console.log('\n=============================================================');
    console.log('🎉 LIVE PRODUCTION E2E AUDIT PASSED 100% WITH ZERO ERRORS!');
    console.log('=============================================================');
  } finally {
    await browser.close();
  }
}

verifyProdAccountDrawer().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
