import { spawn } from 'child_process';
import { chromium } from 'playwright';

async function runVerification() {
  console.log('🚀 Starting Astro Dev Server for Account Drawer & Epomail Auth Verification...');
  const devProc = spawn('npx', ['astro', 'dev', '--port', '4334', '--host', '127.0.0.1'], {
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

  const maxWait = 25000;
  const start = Date.now();
  while (!serverReady && Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, 400));
  }

  if (!serverReady) {
    devProc.kill('SIGTERM');
    throw new Error('Dev server failed to start within timeout. Output:\n' + output);
  }

  console.log('✅ Dev server is ready on http://127.0.0.1:4334');

  try {
    // ----------------------------------------------------
    // PHASE 1: Backend API Direct Verification
    // ----------------------------------------------------
    console.log('\n--- PHASE 1: Backend Auth API Verification ---');

    console.log('1. GET /api/auth/config ...');
    const cfgRes = await fetch('http://127.0.0.1:4334/api/auth/config');
    if (cfgRes.status !== 200) throw new Error('Config API status: ' + cfgRes.status);
    const cfgJson = await cfgRes.json();
    console.log('   -> Mode:', cfgJson.mode);
    console.log('   -> Providers:', cfgJson.providers);
    console.log('   -> Epomail ClientId:', cfgJson.epomail?.clientId);
    if (!cfgJson.ok || !cfgJson.epomail?.clientId) throw new Error('Invalid config response');

    console.log('2. POST /api/auth/epomail/authorize (Direct Admin App Auth) ...');
    const authRes = await fetch('http://127.0.0.1:4334/api/auth/epomail/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@epomail.bond',
        password: 'test-password-123',
      }),
    });
    if (authRes.status !== 200) throw new Error('Direct auth status: ' + authRes.status);
    const authJson = await authRes.json();
    console.log('   -> User Authenticated:', authJson.user?.name, `(${authJson.user?.email})`);
    console.log('   -> Role:', authJson.user?.role, 'Provider:', authJson.user?.provider);
    console.log('   -> Token generated:', authJson.token?.slice(0, 16) + '...');
    if (!authJson.ok || !authJson.token || authJson.user?.provider !== 'epomail') {
      throw new Error('Invalid auth response: ' + JSON.stringify(authJson));
    }
    const token = authJson.token;

    console.log('3. GET /api/auth/user (Validate Session) ...');
    const userRes = await fetch('http://127.0.0.1:4334/api/auth/user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (userRes.status !== 200) throw new Error('User API status: ' + userRes.status);
    const userJson = await userRes.json();
    console.log('   -> Validated User:', userJson.user?.name);
    if (!userJson.ok || userJson.user?.id !== authJson.user.id) {
      throw new Error('User validation failed: ' + JSON.stringify(userJson));
    }

    console.log('4. POST /api/auth/logout (Revoke Session) ...');
    const logoutRes = await fetch('http://127.0.0.1:4334/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ token }),
    });
    if (logoutRes.status !== 200) throw new Error('Logout status: ' + logoutRes.status);
    console.log('   -> Logout successful');

    // ----------------------------------------------------
    // PHASE 2: Playwright Browser End-to-End Testing
    // ----------------------------------------------------
    console.log('\n--- PHASE 2: Playwright E2E UI & Interaction Verification ---');

    const browser = await chromium.launch({ headless: true });

    // Desktop Test (1440x900)
    console.log('\n[Desktop 1440x900]');
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktopPage.goto('http://127.0.0.1:4334/', { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForTimeout(1000);

    console.log('1. Opening Account Drawer via custom event or header...');
    await desktopPage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    await desktopPage.waitForTimeout(500);

    const drawerSelector = '.theme-account-drawer';
    await desktopPage.waitForSelector(drawerSelector, { state: 'visible' });
    console.log('   -> Account Drawer is visible.');

    // Assert Header & Navigation Tabs
    const headTitle = await desktopPage.textContent('.theme-account-drawer__head h2');
    console.log('   -> Drawer Title:', headTitle?.trim());
    if (!headTitle?.includes('账号中心')) throw new Error('Missing drawer title');

    const tabs = await desktopPage.$$('.account-nav-tab');
    console.log('   -> Found navigation tabs count:', tabs.length);
    if (tabs.length !== 3) throw new Error('Expected 3 navigation tabs, got: ' + tabs.length);

    // Assert Epomail Brand Header
    const epomailTitle = await desktopPage.textContent('.account-card--epomail .account-card__title');
    console.log('   -> Epomail Card Title:', epomailTitle?.trim());
    if (!epomailTitle?.includes('EpoCanvas Mail')) throw new Error('Missing Epomail brand title');

    // Assert Epomail OAuth Button
    const oauthBtn = await desktopPage.$('.epomail-primary-login-btn');
    if (!oauthBtn) throw new Error('Missing Epomail OAuth primary button');
    const oauthBtnText = await oauthBtn.textContent();
    console.log('   -> OAuth Button Text:', oauthBtnText?.trim());

    // Test Expanding "使用管理员 APP 外接方案授权"
    console.log('2. Testing Direct App Auth Accordion...');
    const accordionToggle = await desktopPage.$('.direct-app-auth-toggle');
    if (!accordionToggle) throw new Error('Missing accordion toggle');
    await accordionToggle.click();
    await desktopPage.waitForTimeout(300);

    const emailInput = await desktopPage.$('.direct-app-auth-form input[type="email"]');
    if (!emailInput) throw new Error('Email input not visible in direct auth form');

    // Verify requested scope list
    const scopeItems = await desktopPage.$$('.auth-scope-list li');
    console.log('   -> Permission Scopes Count:', scopeItems.length);
    if (scopeItems.length < 3) throw new Error('Expected 3 scope permission items');

    // Fill in Epomail credentials
    console.log('3. Submitting Direct Epomail Authorization...');
    await emailInput.fill('admin@epomail.bond');
    const pwdInput = await desktopPage.$('.direct-app-auth-form input[type="password"]');
    if (pwdInput) await pwdInput.fill('AdminPassword!2026');

    const submitBtn = await desktopPage.$('.direct-app-submit-btn');
    await submitBtn.click();
    await desktopPage.waitForTimeout(1000);

    // Verify that Hero Summary Card updated to authenticated Epomail state
    const heroPill = await desktopPage.textContent('.account-pill--epomail');
    console.log('   -> Hero Pill:', heroPill?.trim());
    if (!heroPill?.includes('Epomail')) throw new Error('Hero pill did not update to Epomail');

    const heroDesc = await desktopPage.textContent('.account-hero-card__desc');
    console.log('   -> Account Email:', heroDesc?.trim());
    if (!heroDesc?.includes('admin@epomail.bond')) throw new Error('Email did not update');

    // Verify OAuth App Inspector is now visible
    const inspectorVisible = await desktopPage.isVisible('.account-card--inspector');
    console.log('   -> OAuth App Inspector visible:', inspectorVisible);
    if (!inspectorVisible) throw new Error('OAuth App Inspector should be visible after login');

    const inspectorClientId = await desktopPage.textContent('.app-inspector-grid');
    if (!inspectorClientId?.includes('epo_live_shijianus_blog')) {
      throw new Error('Inspector missing client ID');
    }
    console.log('   -> App Inspector verified: Client ID matches epo_live_shijianus_blog');

    // Test Tab 2: 站内提醒
    console.log('4. Testing Tab 2: 站内提醒...');
    await tabs[1].click();
    await desktopPage.waitForTimeout(300);
    const notifCard = await desktopPage.isVisible('.account-notification-list, .account-empty-state');
    console.log('   -> Notifications tab content visible:', notifCard);
    if (!notifCard) throw new Error('Notifications content missing');

    // Test Tab 3: 偏好与架构
    console.log('5. Testing Tab 3: 偏好与架构 (Architecture Inspector)...');
    await tabs[2].click();
    await desktopPage.waitForTimeout(300);
    const archDiagram = await desktopPage.isVisible('.arch-flow-diagram');
    console.log('   -> Architecture flow diagram visible:', archDiagram);
    if (!archDiagram) throw new Error('Architecture flow diagram missing');

    const archText = await desktopPage.textContent('.account-card--arch');
    if (!archText?.includes('Cloudflare D1 (DB)') || !archText?.includes('Epomail (USER_DB)')) {
      throw new Error('Architecture diagram missing DB breakdown');
    }
    console.log('   -> Architecture diagram properly details Comments DB & Identity DB');

    // Test Logout
    console.log('6. Testing In-Place Logout...');
    await tabs[0].click();
    await desktopPage.waitForTimeout(300);
    const logoutBtn = await desktopPage.$('.account-card__foot .account-btn-danger, .account-btn-icon');
    if (logoutBtn) {
      await logoutBtn.click();
      await desktopPage.waitForTimeout(500);
      const guestPill = await desktopPage.textContent('.account-pill--guest');
      console.log('   -> Logged out, returned to guest mode:', guestPill?.trim());
      if (!guestPill?.includes('访客')) throw new Error('Logout failed to return to guest mode');
    }

    // Test 7: EPOMAIL_OAUTH_SUCCESS window message handshake
    console.log('7. Testing Popup Window Message Handshake (EPOMAIL_OAUTH_SUCCESS)...');
    await desktopPage.evaluate(() => {
      window.postMessage({
        type: 'EPOMAIL_OAUTH_SUCCESS',
        code: 'oauth_code_live_popup_test_999',
        state: 'blog_sso'
      }, '*');
    });
    await desktopPage.waitForTimeout(1000);

    const postAuthPill = await desktopPage.textContent('.account-pill--epomail');
    console.log('   -> Post-Message Hero Pill:', postAuthPill?.trim());
    if (!postAuthPill?.includes('Epomail')) throw new Error('Hero pill did not update on EPOMAIL_OAUTH_SUCCESS');

    const localStorageAccount = await desktopPage.evaluate(() => {
      return localStorage.getItem('shijianus-comment-account');
    });
    console.log('   -> LocalStorage Account saved:', Boolean(localStorageAccount));
    if (!localStorageAccount || !localStorageAccount.includes('epomail')) {
      throw new Error('LocalStorage account not set on EPOMAIL_OAUTH_SUCCESS');
    }
    console.log('   ✅ EPOMAIL_OAUTH_SUCCESS postMessage handshake verified 100%!');

    await desktopPage.close();

    // Mobile Viewport Test (375x812)
    console.log('\n[Mobile 375x812]');
    const mobilePage = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await mobilePage.goto('http://127.0.0.1:4334/', { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(1000);

    await mobilePage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    await mobilePage.waitForTimeout(500);

    const drawerEl = await mobilePage.$('.theme-account-drawer');
    const drawerBox = await drawerEl?.boundingBox();
    console.log('   -> Mobile drawer width:', drawerBox?.width);
    if (!drawerBox || drawerBox.width > 375) throw new Error('Drawer overflows mobile screen');
    console.log('   -> Mobile layout fits within viewport width flawlessly');

    await mobilePage.close();
    await browser.close();

    console.log('\n🎉 ALL ACCOUNT DRAWER & EPOMAIL AUTH TESTS PASSED SUCCESSFULLY!');
  } finally {
    devProc.kill('SIGTERM');
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
