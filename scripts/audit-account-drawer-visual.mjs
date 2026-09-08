import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

import { spawn } from 'child_process';

const ARTIFACT_DIR = '/root/.gemini/antigravity-cli/brain/142bcfb3-8d03-4967-bd39-4898e5c09b2e';
let TARGET_URL = process.env.TARGET_URL;

async function captureDrawerAudit() {
  let devProc = null;
  if (!TARGET_URL) {
    console.log('🚀 Spawning local dev server on 127.0.0.1:4335...');
    devProc = spawn('npx', ['astro', 'dev', '--port', '4335', '--host', '127.0.0.1'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });
    let serverReady = false;
    devProc.stdout.on('data', (d) => {
      if (d.toString().includes('http://') || d.toString().includes('Local:')) serverReady = true;
    });
    const maxWait = 25000;
    const start = Date.now();
    while (!serverReady && Date.now() - start < maxWait) {
      await new Promise((r) => setTimeout(r, 400));
    }
    if (!serverReady) {
      devProc.kill('SIGTERM');
      throw new Error('Local dev server failed to start within timeout');
    }
    TARGET_URL = 'http://127.0.0.1:4335';
    console.log(`✅ Local dev server ready on ${TARGET_URL}`);
  }

  console.log('🚀 Launching Playwright visual audit for Account & Notification Drawer...');
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Context
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // Retina capture for crisp UI audit
  });

  const page = await desktopContext.newPage();
  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 35000 });

  // Helper to open drawer
  async function openDrawer() {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    await page.waitForTimeout(600);
    await page.waitForSelector('.theme-account-drawer', { state: 'visible' });
  }

  // --- STATE 1: Desktop Light Mode - Tab 1 (Auth / Identity) ---
  console.log('Capturing Desktop Light: Tab 1 (Auth / Profile)...');
  await openDrawer();
  const drawerEl = await page.$('.theme-account-drawer');
  await drawerEl.screenshot({
    path: path.join(ARTIFACT_DIR, 'drawer_desktop_light_tab1_auth.png'),
  });

  // Expand developer accordion in Tab 1
  console.log('Capturing Desktop Light: Tab 1 with Developer Accordion open...');
  const accordionToggle = await page.$('.direct-app-auth-toggle');
  if (accordionToggle) {
    await accordionToggle.click();
    await page.waitForTimeout(400);
    await drawerEl.screenshot({
      path: path.join(ARTIFACT_DIR, 'drawer_desktop_light_tab1_accordion.png'),
    });
    // Close accordion
    await accordionToggle.click();
    await page.waitForTimeout(200);
  }

  // --- STATE 2: Desktop Light Mode - Tab 2 (Notifications) ---
  console.log('Capturing Desktop Light: Tab 2 (Notifications)...');
  await page.click('.account-nav-tabs button:nth-child(2)');
  await page.waitForTimeout(400);
  await drawerEl.screenshot({
    path: path.join(ARTIFACT_DIR, 'drawer_desktop_light_tab2_notif.png'),
  });

  // --- STATE 3: Desktop Light Mode - Tab 3 (Settings) ---
  console.log('Capturing Desktop Light: Tab 3 (Settings & Privacy)...');
  await page.click('.account-nav-tabs button:nth-child(3)');
  await page.waitForTimeout(400);
  await drawerEl.screenshot({
    path: path.join(ARTIFACT_DIR, 'drawer_desktop_light_tab3_settings.png'),
  });

  // Full page view with drawer open on desktop
  console.log('Capturing Desktop Light: Full page context with Drawer open...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'page_desktop_light_drawer_open.png'),
  });

  // --- STATE 3.5: Desktop Light Mode - Logged In State ---
  console.log('Capturing Desktop Light: Logged In State...');
  await page.evaluate(() => {
    localStorage.setItem('shijianus_account_identity', JSON.stringify({
      userId: 'epo_usr_test',
      email: 'admin@epomail.bond',
      name: 'Admin',
      provider: 'epomail',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      token: 'test_token',
      verified: true
    }));
    window.dispatchEvent(new CustomEvent('shijianus:account-changed'));
  });
  await page.click('.account-nav-tabs button:nth-child(1)');
  await page.waitForTimeout(400);
  await drawerEl.screenshot({
    path: path.join(ARTIFACT_DIR, 'drawer_desktop_light_tab1_loggedin.png'),
  });

  // --- STATE 4: Desktop Dark Mode ---
  console.log('Switching to Dark Mode...');
  // Toggle dark mode via DOM attribute or button
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(400);

  // Tab 1 Dark (Logged In)
  await page.click('.account-nav-tabs button:nth-child(1)');
  await page.waitForTimeout(300);
  await drawerEl.screenshot({
    path: path.join(ARTIFACT_DIR, 'drawer_desktop_dark_tab1_loggedin.png'),
  });

  // Tab 2 Dark
  await page.click('.account-nav-tabs button:nth-child(2)');
  await page.waitForTimeout(300);
  await drawerEl.screenshot({
    path: path.join(ARTIFACT_DIR, 'drawer_desktop_dark_tab2_notif.png'),
  });

  // Tab 3 Dark
  await page.click('.account-nav-tabs button:nth-child(3)');
  await page.waitForTimeout(300);
  await drawerEl.screenshot({
    path: path.join(ARTIFACT_DIR, 'drawer_desktop_dark_tab3_settings.png'),
  });

  await desktopContext.close();

  // --- STATE 5: Mobile View (iPhone 14 / 390x844) ---
  console.log('Capturing Mobile View (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 35000 });

  await mobilePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
  });
  await mobilePage.waitForTimeout(600);
  await mobilePage.waitForSelector('.theme-account-drawer', { state: 'visible' });

  // Mobile Tab 1
  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'drawer_mobile_light_tab1_auth.png'),
  });

  // Mobile Tab 2
  await mobilePage.click('.account-nav-tabs button:nth-child(2)');
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'drawer_mobile_light_tab2_notif.png'),
  });

  // Mobile Tab 3
  await mobilePage.click('.account-nav-tabs button:nth-child(3)');
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'drawer_mobile_light_tab3_settings.png'),
  });

  await mobileContext.close();
  await browser.close();

  if (devProc) {
    devProc.kill('SIGTERM');
  }

  console.log('✅ All screenshots captured successfully in artifact directory!');
}

captureDrawerAudit().catch((err) => {
  console.error('❌ Audit capture failed:', err);
  process.exit(1);
});
