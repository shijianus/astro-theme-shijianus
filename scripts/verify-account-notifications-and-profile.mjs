import { spawn } from 'child_process';
import { chromium } from 'playwright';

async function runVerification() {
  console.log('🚀 Starting Astro Dev Server for Account Drawer Notification & Profile Verification...');
  const port = '4339';
  const devProc = spawn('npx', ['astro', 'dev', '--port', port, '--host', '127.0.0.1'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  let output = '';
  let serverReady = false;

  devProc.stdout.on('data', (d) => {
    const text = d.toString();
    output += text;
    if (text.includes('http://') || text.includes('Local:')) {
      serverReady = true;
    }
  });
  devProc.stderr.on('data', (d) => { output += d.toString(); });

  const maxWait = 30000;
  const start = Date.now();
  while (!serverReady && Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, 400));
  }

  if (!serverReady) {
    devProc.kill('SIGTERM');
    throw new Error('Dev server failed to start within timeout. Output:\n' + output);
  }

  console.log(`✅ Dev server is ready on http://127.0.0.1:${port}`);

  let browser;
  try {
    // ----------------------------------------------------
    // PHASE 1: Backend /api/comments?feed=user Verification
    // ----------------------------------------------------
    console.log('\n--- PHASE 1: Backend /api/comments?feed=user Verification ---');
    const feedRes = await fetch(`http://127.0.0.1:${port}/api/comments?feed=user&authorName=Tester`);
    console.log('   -> Status:', feedRes.status);
    if (feedRes.status !== 200) throw new Error('Expected 200 from /api/comments?feed=user');
    const feedJson = await feedRes.json();
    console.log('   -> Feed JSON ok:', feedJson.ok);
    console.log('   -> User comments count:', feedJson.userComments?.length);
    console.log('   -> Notifications count:', feedJson.notifications?.length);
    if (!feedJson.ok || !Array.isArray(feedJson.userComments) || !Array.isArray(feedJson.notifications)) {
      throw new Error('Invalid feed json structure: ' + JSON.stringify(feedJson));
    }

    // ----------------------------------------------------
    // PHASE 2: Desktop Browser Testing (1440x900)
    // ----------------------------------------------------
    console.log('\n--- PHASE 2: Desktop Browser Testing (1440x900) ---');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 1. Open Account Drawer
    console.log('1. Opening Account Drawer via custom event...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    await page.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 5000 });
    console.log('   -> Account Drawer is visible.');

    // 2. Check Account Hero Card
    console.log('2. Inspecting Account Hero Card...');
    const heroCard = await page.$('.account-hero-card');
    if (!heroCard) throw new Error('Missing .account-hero-card');

    const avatarUploadTrigger = await page.$('.account-hero-card__avatar.is-clickable');
    if (!avatarUploadTrigger) throw new Error('Missing avatar upload trigger on hero card');
    console.log('   -> Avatar upload trigger found on Hero Card.');

    const nameText = await page.textContent('.account-hero-card__name-row strong');
    console.log('   -> Hero Card Name:', nameText?.trim());

    const editBtn = await page.$('.account-edit-profile-btn');
    if (!editBtn) throw new Error('Missing .account-edit-profile-btn');
    console.log('   -> "编辑资料" button found.');

    // 3. Click "编辑资料" and verify Tab 1 (Profile Form)
    console.log('3. Testing Tab 1: Profile Settings Form...');
    await editBtn.click();
    await page.waitForTimeout(300);

    const nameInput = await page.$('.account-profile-form input[name="name"]');
    const websiteInput = await page.$('.account-profile-form input[name="website"]');
    const bioInput = await page.$('.account-profile-form input[name="bio"]');
    const tzInput = await page.$('.account-profile-form input[name="timezone"]');
    const locInput = await page.$('.account-profile-form input[name="location"]');

    if (!nameInput || !websiteInput || !bioInput || !tzInput || !locInput) {
      throw new Error('One or more profile input fields are missing in Tab 1');
    }
    console.log('   -> All profile inputs (name, website, bio, timezone, location) verified.');

    // Test Auto-detect Timezone button
    const detectTzBtn = await page.$('.account-field-quick-btn');
    if (detectTzBtn) {
      await detectTzBtn.click();
      await page.waitForTimeout(200);
      const detectedTz = await tzInput.inputValue();
      console.log('   -> Auto-detected timezone:', detectedTz);
      if (!detectedTz) throw new Error('Auto-detect timezone did not fill value');
    }

    // Fill in profile fields
    await nameInput.fill('EpoExplorer');
    await locInput.fill('San Francisco, CA');
    await bioInput.fill('Exploring code and interfaces.');

    console.log('   -> nameInput value before save:', await nameInput.inputValue());
    console.log('   -> locInput value before save:', await locInput.inputValue());
    console.log('   -> tzInput value before save:', await tzInput.inputValue());
    console.log('   -> bioInput value before save:', await bioInput.inputValue());

    const saveProfileBtn = await page.$('.account-profile-form button[type="submit"]');
    if (!saveProfileBtn) throw new Error('Missing save profile button');
    await saveProfileBtn.click();
    await page.waitForTimeout(1000);

    // Verify localStorage has updated identity
    const savedIdentity = await page.evaluate(() => {
      const raw = localStorage.getItem('shijianus-comment-account') || localStorage.getItem('shijianus_comment_identity_v1');
      return raw ? JSON.parse(raw) : null;
    });
    console.log('   -> Full saved identity:', JSON.stringify(savedIdentity));
    if (savedIdentity?.name !== 'EpoExplorer' || savedIdentity?.location !== 'San Francisco, CA') {
      throw new Error('Identity was not persisted properly to localStorage');
    }

    // Verify Hero Card now reflects updated name and location
    const updatedHeroName = await page.textContent('.account-hero-card__name-row strong');
    console.log('   -> Updated Hero Name:', updatedHeroName?.trim());
    if (!updatedHeroName?.includes('EpoExplorer')) {
      throw new Error('Hero Card name did not update to EpoExplorer');
    }

    const metaRow = await page.$('.account-hero-card__meta-row');
    if (!metaRow) throw new Error('Missing .account-hero-card__meta-row after profile save');
    console.log('   -> Verified meta row chips are now visible on Hero Card.');

    // 4. Test Tab 2: Dual-Partition Notifications
    console.log('4. Testing Tab 2: Dual-Partition Notifications...');
    const tabs = await page.$$('.account-nav-tab');
    // Tab index 1 is notifications
    await tabs[1].click();
    await page.waitForTimeout(400);

    const partitionNav = await page.$('.account-partition-nav');
    if (!partitionNav) throw new Error('Missing .account-partition-nav');

    const partitionButtons = await page.$$('.account-partition-btn');
    if (partitionButtons.length !== 2) {
      throw new Error(`Expected 2 partition buttons, got ${partitionButtons.length}`);
    }

    const broadcastBtnText = await partitionButtons[0].textContent();
    const personalBtnText = await partitionButtons[1].textContent();
    console.log('   -> Partition Button 1:', broadcastBtnText?.trim());
    console.log('   -> Partition Button 2:', personalBtnText?.trim());
    if (!broadcastBtnText?.includes('全站广播通告') || !personalBtnText?.includes('个人互动与足迹')) {
      throw new Error('Unexpected partition button labels');
    }

    // Check Partition 1 (Broadcast) Content
    const broadcastList = await page.$('.account-broadcast-list');
    if (!broadcastList) throw new Error('Missing .account-broadcast-list in broadcast partition');
    const broadcastItems = await page.$$('.account-broadcast-item');
    console.log('   -> Broadcast items count (auto-compiled from build):', broadcastItems.length);
    if (broadcastItems.length === 0) throw new Error('Broadcast list should contain auto-compiled post notices');

    // Switch to Partition 2 (Personal)
    console.log('   -> Switching to personal partition...');
    await partitionButtons[1].click();
    await page.waitForTimeout(500);

    const refreshFeedBtn = await page.$('.account-refresh-feed-btn');
    if (!refreshFeedBtn) throw new Error('Missing .account-refresh-feed-btn in personal partition');
    console.log('   -> Personal partition "🔄 刷新" button found.');
    await refreshFeedBtn.click();
    await page.waitForTimeout(500);

    // 5. Test Tab 3: Site Preferences
    console.log('5. Testing Tab 3: Site Preferences...');
    await tabs[2].click();
    await page.waitForTimeout(400);

    const sortButtons = await page.$$('.account-pref-sort-btn');
    console.log('   -> Sort mode options count:', sortButtons.length);
    if (sortButtons.length !== 2) throw new Error('Expected 2 comment sort buttons (最新 / 最热)');

    // Click "🔥 最热" sort mode
    await sortButtons[1].click();
    await page.waitForTimeout(300);

    // Verify localStorage has updated preferences
    const savedPrefs = await page.evaluate(() => {
      const raw = localStorage.getItem('shijianus-user-preferences') || localStorage.getItem('shijianus_user_preferences');
      return raw ? JSON.parse(raw) : null;
    });
    console.log('   -> Saved preferences in localStorage:', savedPrefs);
    if (savedPrefs?.defaultCommentSort !== 'hot') {
      throw new Error('Comment sort preference was not persisted as "hot"');
    }

    // Toggle preferences checkboxes
    const toggles = await page.$$('.account-pref-card input[type="checkbox"]');
    console.log('   -> Preference toggles count:', toggles.length);
    if (toggles.length < 5) throw new Error('Expected at least 5 preference toggles');

    // ----------------------------------------------------
    // PHASE 3: Mobile Viewport Testing (390x844)
    // ----------------------------------------------------
    console.log('\n--- PHASE 3: Mobile Viewport Testing (390x844) ---');
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(1000);

    await mobilePage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    await mobilePage.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 5000 });
    console.log('   -> Mobile drawer opened cleanly.');

    const mobileDrawerRect = await mobilePage.evaluate(() => {
      const el = document.querySelector('.theme-account-drawer');
      const rect = el.getBoundingClientRect();
      return { width: rect.width, left: rect.left, right: rect.right };
    });
    console.log('   -> Mobile Drawer Width:', mobileDrawerRect.width);
    if (mobileDrawerRect.width > 390) {
      throw new Error(`Drawer width ${mobileDrawerRect.width} exceeded mobile viewport`);
    }

    // Switch tabs on mobile
    const mobileTabs = await mobilePage.$$('.account-nav-tab');
    await mobileTabs[1].click();
    await mobilePage.waitForTimeout(300);
    const mobileBroadcastItems = await mobilePage.$$('.account-broadcast-item');
    console.log('   -> Mobile Broadcast items rendered:', mobileBroadcastItems.length);
    if (mobileBroadcastItems.length === 0) throw new Error('Mobile broadcast items not rendered');

    console.log('\n🎉 ALL AUTOMATED VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  } finally {
    if (browser) await browser.close();
    devProc.kill('SIGTERM');
  }
}

runVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
