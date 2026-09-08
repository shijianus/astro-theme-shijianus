import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/root/.gemini/antigravity-cli/brain/142bcfb3-8d03-4967-bd39-4898e5c09b2e';
const TARGET_URL = 'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/';

async function verifyLivePostAndDrawer() {
  console.log('🚀 Launching Playwright Live Verification on: ' + TARGET_URL);
  const browser = await chromium.launch({ headless: true });

  const consoleErrors = [];
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('1. Navigating to live post page...');
  const res = await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 45000 });
  console.log(`   -> HTTP Status: ${res.status()}`);
  if (res.status() !== 200) {
    throw new Error(`Expected HTTP 200, got ${res.status()}`);
  }

  // Check Post Title
  const title = await page.title();
  console.log(`   -> Page Title: ${title}`);

  // Take screenshot of the Post Page (Hero & Article)
  console.log('2. Capturing Live Post Hero & Content...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'live_post_page_hero.png'),
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });

  // 3. Open Account Drawer from Header button or custom event
  console.log('3. Opening Account Drawer on Live Post Page...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
  });
  await page.waitForTimeout(800);
  await page.waitForSelector('.theme-account-drawer', { state: 'visible' });

  const drawerEl = await page.$('.theme-account-drawer');
  if (!drawerEl) throw new Error('Account drawer element not found!');

  // Verify Header
  const headTitle = await page.textContent('.theme-account-drawer__head h2');
  console.log(`   -> Drawer Title: ${headTitle?.trim()}`);

  // Capture Live Light Mode Tab 1
  console.log('4. Capturing Live Desktop Light: Tab 1 (Identity/Auth)...');
  await drawerEl.screenshot({
    path: path.join(ARTIFACT_DIR, 'live_drawer_desktop_light_tab1.png'),
  });

  // Expand direct app auth accordion
  console.log('5. Expanding Accordion...');
  const accordionToggle = await page.$('.direct-app-auth-toggle');
  if (accordionToggle) {
    await accordionToggle.click();
    await page.waitForTimeout(400);
    await drawerEl.screenshot({
      path: path.join(ARTIFACT_DIR, 'live_drawer_desktop_light_accordion.png'),
    });
    await accordionToggle.click();
    await page.waitForTimeout(200);
  }

  // Capture Live Tab 2 (Notifications)
  console.log('6. Switching to Tab 2 (Notifications)...');
  await page.click('.account-nav-tabs button:nth-child(2)');
  await page.waitForTimeout(400);
  await drawerEl.screenshot({
    path: path.join(ARTIFACT_DIR, 'live_drawer_desktop_light_tab2.png'),
  });

  // Capture Live Tab 3 (Settings)
  console.log('7. Switching to Tab 3 (Settings)...');
  await page.click('.account-nav-tabs button:nth-child(3)');
  await page.waitForTimeout(400);
  await drawerEl.screenshot({
    path: path.join(ARTIFACT_DIR, 'live_drawer_desktop_light_tab3.png'),
  });

  // 8. Test Dark Mode
  console.log('8. Switching to Dark Mode on Live Site...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(400);
  await page.click('.account-nav-tabs button:nth-child(1)');
  await page.waitForTimeout(300);
  await drawerEl.screenshot({
    path: path.join(ARTIFACT_DIR, 'live_drawer_desktop_dark_tab1.png'),
  });

  // Full page view with drawer open on post
  console.log('9. Capturing Full Page Context with Drawer Open...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'live_post_page_with_drawer.png'),
  });

  await context.close();

  // 10. Mobile View (iPhone 14 / 390x844)
  console.log('10. Testing Mobile View (390x844) on Live Site...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 45000 });
  await mobilePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
  });
  await mobilePage.waitForTimeout(800);
  await mobilePage.waitForSelector('.theme-account-drawer', { state: 'visible' });

  const mobileDrawer = await mobilePage.$('.theme-account-drawer');
  const box = await mobileDrawer.boundingBox();
  console.log(`   -> Mobile Drawer Bounding Width: ${box.width} (Max allowed: 390)`);
  if (box.width > 390) {
    throw new Error(`Mobile drawer overflows screen width: ${box.width} > 390`);
  }

  await mobileDrawer.screenshot({
    path: path.join(ARTIFACT_DIR, 'live_drawer_mobile_tab1.png'),
  });

  await mobileContext.close();
  await browser.close();

  console.log('\n======================================================');
  console.log('🎉 LIVE PRODUCTION VERIFICATION COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
}

verifyLivePostAndDrawer().catch((err) => {
  console.error('❌ Live verification failed:', err);
  process.exit(1);
});
