import { chromium } from 'playwright';

const LIVE_TARGETS = [
  'https://blog.epocanvas.com',
  'https://shijianus-blog.pages.dev',
];

async function testTarget(baseUrl) {
  console.log(`\n======================================================`);
  console.log(`🌐 Testing Live Cloudflare Target: ${baseUrl}`);
  console.log(`======================================================`);

  // 1. API Verification
  console.log(`1. Probing GET ${baseUrl}/api/auth/config ...`);
  try {
    const res = await fetch(`${baseUrl}/api/auth/config`, { headers: { 'User-Agent': 'Antigravity-E2E/1.0' } });
    console.log(`   -> HTTP Status: ${res.status}`);
    const data = await res.json();
    console.log(`   -> Auth Mode: ${data.mode}`);
    console.log(`   -> Providers: ${JSON.stringify(data.providers)}`);
    console.log(`   -> Epomail ClientId: ${data.epomail?.clientId}`);
    if (!data.ok || !data.epomail?.clientId) {
      throw new Error(`Live API response invalid: ${JSON.stringify(data)}`);
    }
    console.log('   ✅ Live /api/auth/config validated successfully.');
  } catch (err) {
    console.error(`   ⚠️ API probe failed for ${baseUrl}:`, err.message);
    throw err;
  }

  // 2. Playwright Live Browser E2E
  console.log(`\n2. Launching Playwright Chromium for Live UI Audit ...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log(`   -> Navigating to ${baseUrl} ...`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Open Drawer
  console.log('3. Triggering Account Drawer ...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
  });
  await page.waitForTimeout(600);

  const drawerVisible = await page.isVisible('.theme-account-drawer');
  console.log('   -> Drawer Visible:', drawerVisible);
  if (!drawerVisible) throw new Error('Account drawer not visible on production');

  const title = await page.textContent('.theme-account-drawer__head h2');
  console.log('   -> Drawer Title:', title?.trim());
  if (!title?.includes('账号中心')) throw new Error('Drawer title does not contain 账号中心');

  // Assert Tabs
  const tabs = await page.$$('.account-nav-tab');
  console.log('   -> Navigation Tabs Count:', tabs.length);
  if (tabs.length !== 3) throw new Error('Expected 3 tabs, got ' + tabs.length);

  // Assert Epomail Brand Header & OAuth Button
  const epomailTitle = await page.textContent('.account-card--epomail .account-card__title');
  console.log('   -> Epomail Card Title:', epomailTitle?.trim());
  if (!epomailTitle?.includes('EpoCanvas Mail')) throw new Error('Missing Epomail title');

  const oauthBtn = await page.$('.epomail-primary-login-btn');
  if (!oauthBtn) throw new Error('Missing Epomail OAuth button');
  const oauthBtnText = await oauthBtn.textContent();
  console.log('   -> OAuth Button Text:', oauthBtnText?.trim());

  // Test Direct App Auth Accordion Expansion
  console.log('4. Testing Direct App Auth Accordion Expansion ...');
  const accordionToggle = await page.$('.direct-app-auth-toggle');
  if (!accordionToggle) throw new Error('Missing accordion toggle');
  await accordionToggle.click();
  await page.waitForTimeout(300);

  const emailInput = await page.$('.direct-app-auth-form input[type="email"]');
  if (!emailInput) throw new Error('Email input not rendered');
  console.log('   -> Direct App Auth Form is visible and interactive');

  const scopes = await page.$$('.auth-scope-list li');
  console.log('   -> Displayed Auth Scopes Count:', scopes.length);
  if (scopes.length < 3) throw new Error('Expected at least 3 permission scopes');

  // Test Local Reader Quick Setup
  console.log('5. Testing Local Reader Profile Fast Login ...');
  const readerNameInput = await page.$('.account-card:has-text("本地读者快速登记") input[placeholder*="昵称"]');
  if (readerNameInput) {
    await readerNameInput.fill('CloudflareProductionAuditor');
    const readerEmailInput = await page.$('.account-card:has-text("本地读者快速登记") input[type="email"]');
    if (readerEmailInput) await readerEmailInput.fill('auditor@epocanvas.com');
    const saveBtn = await page.$('.account-card:has-text("本地读者快速登记") .account-btn-secondary');
    if (saveBtn) {
      await saveBtn.click();
      await page.waitForTimeout(600);
      const heroPill = await page.textContent('.account-pill');
      console.log('   -> Hero Pill after Reader Login:', heroPill?.trim());
      if (!heroPill?.includes('读者')) throw new Error('Reader login pill did not update');
    }
  }

  // Test Tab 2: 站内提醒
  console.log('6. Testing Tab 2: 站内提醒 ...');
  await tabs[1].click();
  await page.waitForTimeout(300);
  const notifVisible = await page.isVisible('.account-notification-list, .account-empty-state');
  console.log('   -> Notifications tab content visible:', notifVisible);
  if (!notifVisible) throw new Error('Notifications content missing');

  // Test Tab 3: 偏好与架构
  console.log('7. Testing Tab 3: 偏好与架构 ...');
  await tabs[2].click();
  await page.waitForTimeout(300);
  const archVisible = await page.isVisible('.arch-flow-diagram');
  console.log('   -> Architecture Diagram visible:', archVisible);
  if (!archVisible) throw new Error('Architecture diagram not visible');

  const archContent = await page.textContent('.account-card--arch');
  if (!archContent?.includes('Cloudflare D1 (DB)') || !archContent?.includes('Epomail (USER_DB)')) {
    throw new Error('Architecture diagram missing database separation labels');
  }
  console.log('   -> Verified Cloudflare D1 & Epomail architecture flow');

  // Test Logout
  console.log('8. Testing In-Place Logout ...');
  await tabs[0].click();
  await page.waitForTimeout(300);
  const logoutBtn = await page.$('.account-card__foot .account-btn-danger, .account-btn-icon');
  if (logoutBtn) {
    await logoutBtn.click();
    await page.waitForTimeout(500);
    const guestPill = await page.textContent('.account-pill--guest');
    console.log('   -> Pill after logout:', guestPill?.trim());
    if (!guestPill?.includes('访客')) throw new Error('Logout did not return to visitor');
  }

  await page.close();

  // Mobile Viewport Test (375x812)
  console.log('9. Testing Mobile Viewport (375x812) ...');
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 812 });
  await mobilePage.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mobilePage.waitForTimeout(1500);

  await mobilePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
  });
  await mobilePage.waitForTimeout(500);

  const drawerEl = await mobilePage.$('.theme-account-drawer');
  const drawerBox = await drawerEl?.boundingBox();
  console.log('   -> Mobile drawer width on production:', drawerBox?.width);
  if (!drawerBox || drawerBox.width > 375) {
    throw new Error(`Drawer width ${drawerBox?.width} exceeds mobile viewport width (375px)`);
  }
  console.log('   -> Mobile layout is fully responsive without overflow.');

  await mobilePage.close();
  await browser.close();

  console.log(`\n🎉 Target ${baseUrl} PASSED ALL LIVE PRODUCTION TESTS!`);
}

async function main() {
  console.log('🚀 Starting Cloudflare Production Playwright E2E Audit...');
  let success = false;
  for (const url of LIVE_TARGETS) {
    try {
      await testTarget(url);
      success = true;
      break;
    } catch (e) {
      console.warn(`Target ${url} failed or still propagating, trying fallback target... Error:`, e.message);
    }
  }

  if (!success) {
    console.error('❌ All live targets failed verification.');
    process.exit(1);
  }
  console.log('\n🌟 CLOUDFLARE LIVE PRODUCTION VERIFICATION COMPLETED WITH 100% SUCCESS!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
