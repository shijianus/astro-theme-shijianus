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

    console.log('5. POST /api/auth/local (Local Reader Anti-Spoofing Guard) ...');
    const localRes = await fetch('http://127.0.0.1:4334/api/auth/local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '站长管理员 (Impersonator)',
        email: 'admin@epocanvas.com',
      }),
    });
    if (localRes.status !== 200) throw new Error('Local auth status: ' + localRes.status);
    const localJson = await localRes.json();
    console.log('   -> Local User Role:', localJson.user?.role);
    if (localJson.user?.role !== 'reader') {
      throw new Error(`SECURITY ALERT: Local reader received role '${localJson.user?.role}' instead of 'reader'!`);
    }
    console.log('   ✓ Local readers strictly restricted to reader role (admin claim rejected)');
    const readerToken = localJson.token;

    console.log('6. POST /api/comments (Unauthenticated authorRole=admin Spoofing Protection) ...');
    const spoofCommentRes = await fetch('http://127.0.0.1:4334/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        slug: 'security-test-post',
        authorName: 'Fake Admin',
        authorRole: 'admin', // Attack: trying to spoof admin role without valid admin session
        message: 'This is an attack attempt to spoof admin badge.',
      }),
    });
    if (spoofCommentRes.status !== 200) throw new Error('Comment API status: ' + spoofCommentRes.status);
    const spoofJson = await spoofCommentRes.json();
    console.log('   -> Spoofed Comment assigned role:', spoofJson.comment?.author_role);
    if (spoofJson.comment?.author_role === 'admin') {
      throw new Error('SECURITY ALERT: Unauthenticated comment succeeded in claiming admin role!');
    }
    console.log('   ✓ Unauthenticated admin spoofing rejected, downgraded to:', spoofJson.comment?.author_role);
    const testCommentId = spoofJson.comment?.id;

    console.log('7. POST /api/comments (Admin Session Moderation & Deletion) ...');
    // Login again as legitimate Epomail admin
    const adminLoginRes = await fetch('http://127.0.0.1:4334/api/auth/epomail/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@epomail.bond', password: 'test-admin-password' }),
    });
    const adminLoginJson = await adminLoginRes.json();
    const adminSessionToken = adminLoginJson.token;

    // First attempt: Non-admin reader attempts to delete someone else's comment -> MUST BE FORBIDDEN (403)
    const unauthorizedDeleteRes = await fetch('http://127.0.0.1:4334/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-comment-session-token': readerToken,
      },
      body: JSON.stringify({
        action: 'delete',
        id: testCommentId,
      }),
    });
    if (unauthorizedDeleteRes.status !== 403) {
      throw new Error(`SECURITY ALERT: Non-admin delete returned ${unauthorizedDeleteRes.status}, expected 403 Forbidden!`);
    }
    console.log('   ✓ Non-admin session correctly rejected from deleting comments (403 Forbidden)');

    // Second attempt: Genuine Epomail Admin attempts to delete -> MUST SUCCEED (200 OK)
    const adminDeleteRes = await fetch('http://127.0.0.1:4334/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-comment-session-token': adminSessionToken,
      },
      body: JSON.stringify({
        action: 'delete',
        id: testCommentId,
      }),
    });
    if (adminDeleteRes.status !== 200) throw new Error('Admin delete status: ' + adminDeleteRes.status);
    const adminDeleteJson = await adminDeleteRes.json();
    if (!adminDeleteJson.ok) throw new Error('Admin delete failed: ' + JSON.stringify(adminDeleteJson));
    console.log('   ✓ Genuine Epomail Admin session successfully authorized to moderate & delete comment');

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

    // Verify Technical cards (.account-card--inspector, .account-card--arch) are completely eliminated
    const inspectorVisible = await desktopPage.isVisible('.account-card--inspector');
    if (inspectorVisible) throw new Error('Security Pass / Inspector card must be completely eliminated');
    console.log('   ✓ Verified: Technical Inspector card eliminated from user view');

    // Verify Tab 1 does not contain duplicate privacy toggle
    const tab1Toggles = await desktopPage.$$('.account-toggle-field');
    if (tab1Toggles.length > 0) throw new Error('Tab 1 must not contain duplicate privacy toggle');
    console.log('   ✓ Verified: Tab 1 has no duplicate privacy toggle');

    // Verify Hero Avatar is clickable with camera badge
    const heroAvatarClickable = await desktopPage.$('.account-hero-card__avatar.is-clickable');
    if (!heroAvatarClickable) throw new Error('Hero avatar must be clickable');
    const heroAvatarBadge = await desktopPage.$('.account-hero-card__avatar-badge');
    if (!heroAvatarBadge) throw new Error('Hero avatar must show camera badge');
    console.log('   ✓ Verified: Hero avatar click-to-upload and camera badge present');

    // Test Tab 2: 站内提醒与评论足迹
    console.log('4. Testing Tab 2: 站内提醒与评论足迹...');
    await tabs[1].click();
    await desktopPage.waitForTimeout(300);
    const notifCard = await desktopPage.isVisible('.account-notification-list, .account-empty-state');
    console.log('   -> Notifications tab content visible:', notifCard);
    if (!notifCard) throw new Error('Notifications content missing');

    // Test Tab 3: 偏好设置与隐私
    console.log('5. Testing Tab 3: 偏好设置与隐私...');
    await tabs[2].click();
    await desktopPage.waitForTimeout(300);

    const archDiagramVisible = await desktopPage.isVisible('.arch-flow-diagram, .account-card--arch');
    if (archDiagramVisible) throw new Error('Architecture diagram card must be completely eliminated');
    console.log('   ✓ Verified: Developer Architecture card eliminated from user view');

    const localeBtns = await desktopPage.$$('.account-locale-btn');
    if (localeBtns.length !== 3) throw new Error('Expected 3 language options in Tab 3');

    const privacyNote = await desktopPage.textContent('.account-privacy-note');
    if (!privacyNote?.includes('管理合规需要') || !privacyNote?.includes('记录发件连接 IP')) {
      throw new Error('Privacy note must accurately describe admin IP logging for moderation');
    }
    if (privacyNote?.includes('绝不记录原始 IP')) {
      throw new Error('Misleading statement "绝不记录原始 IP" must be removed');
    }
    console.log('   ✓ Verified: Tab 3 contains honest administrative IP disclaimer');

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
    process.exit(0);
  } finally {
    try {
      devProc.kill('SIGKILL');
    } catch {}
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
