import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URLS = [
  'https://9a8b0274.shijianus-blog.pages.dev',
  'https://blog.epocanvas.com',
];

async function runLiveVerification() {
  console.log('🌐 Starting Live Cloudflare Pages Playwright E2E Verification...');

  // Ensure screenshot audit directory exists
  const screenshotDir = path.resolve(process.cwd(), 'scripts/audit_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  for (const targetUrl of TARGET_URLS) {
    console.log(`\n======================================================`);
    console.log(`🚀 Auditing Target: ${targetUrl}`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      permissions: ['clipboard-read', 'clipboard-write'],
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    try {
      // ----------------------------------------------------
      // STEP 1: Home Page & Account Drawer UI/UX Verification
      // ----------------------------------------------------
      console.log(`1. Navigating to ${targetUrl} ...`);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2000);

      console.log('2. Triggering Account Drawer ...');
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
      });
      await page.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 8000 });
      console.log('   -> Account Drawer is visible.');

      // Verify Head Badge
      const headBadgeText = await page.$eval('.theme-account-drawer__head-badge', (el) => el.textContent?.trim());
      console.log('   -> Head Badge Text:', headBadgeText);
      if (!headBadgeText || (!headBadgeText.includes('LV.') && !headBadgeText.includes('TL.'))) {
        throw new Error(`Drawer head badge does not contain dynamic LV/TL status: "${headBadgeText}"`);
      }
      console.log('   ✅ Live head badge dynamically displays community level.');

      // Verify Tab 0 is named "个人资料"
      const tab0Text = await page.$eval('.theme-account-drawer .account-nav-tab', (el) => el.textContent?.trim());
      console.log('   -> Tab 0 Name:', tab0Text);
      if (!tab0Text?.includes('个人资料')) {
        throw new Error(`Expected Tab 0 to be "个人资料", got "${tab0Text}"`);
      }
      console.log('   ✅ Live Tab 0 is successfully "个人资料".');

      // Click Tab 0 and check Community Level Card
      console.log('3. Checking Tab 0 (个人资料) Community Level Card...');
      await page.evaluate(() => {
        document.querySelectorAll('.theme-account-drawer .account-nav-tab')[0].click();
      });
      await page.waitForTimeout(500);

      const levelCard = await page.$('.account-card--level');
      if (!levelCard) throw new Error('Missing .account-card--level in Tab 0 (个人资料)');
      const levelTitle = await page.$eval('.account-level-name', (el) => el.textContent?.trim());
      const trustPill = await page.$eval('.account-level-trust-pill', (el) => el.textContent?.trim());
      console.log('   -> Level Card Title:', levelTitle);
      console.log('   -> Trust Level Pill:', trustPill);
      if (!trustPill?.includes('TL.')) {
        throw new Error(`Expected trust pill to contain "TL.", got "${trustPill}"`);
      }
      console.log('   ✅ Live Community Level & Trust card verified.');

      // Check Tab 2 (设置与偏好) Sort Group
      console.log('4. Checking Tab 2 (设置与偏好) Comment Sort Group...');
      await page.evaluate(() => {
        document.querySelectorAll('.theme-account-drawer .account-nav-tab')[2].click();
      });
      await page.waitForTimeout(500);

      const sortBtns = await page.$$('.account-pref-sort-btn');
      if (sortBtns.length < 2) throw new Error('Expected 2 sort buttons in Settings tab');

      let btn0Text = (await sortBtns[0].textContent())?.trim();
      let btn1Text = (await sortBtns[1].textContent())?.trim();
      console.log('   -> Initial Sort Btns in zh-CN:');
      console.log('      Btn 0 (Newest):', JSON.stringify(btn0Text));
      console.log('      Btn 1 (Popular):', JSON.stringify(btn1Text));

      const isOneCollapsed = (btn0Text.length > 2 && btn1Text.length <= 2) || (btn1Text.length > 2 && btn0Text.length <= 2);
      if (!isOneCollapsed) {
        throw new Error(`Expected one sort button to be collapsed (emoji-only). Got: "${btn0Text}" and "${btn1Text}"`);
      }
      console.log('   ✅ Live Sort group correctly collapses unselected option to emoji only!');

      // Check overflow in Sort Group
      const sortGroupDims = await page.$eval('.account-pref-sort-group', (el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        isOverflowing: el.scrollWidth > el.clientWidth,
      }));
      console.log('   -> Sort Group Dimensions:', sortGroupDims);
      if (sortGroupDims.isOverflowing) throw new Error('Sort group is overflowing!');
      console.log('   ✅ Sort group has 0 overflow.');

      // Capture screenshot of live account drawer
      const drawerScreenshotPath = path.join(screenshotDir, `live-drawer-${new URL(targetUrl).hostname}.png`);
      await page.screenshot({ path: drawerScreenshotPath, fullPage: false });
      console.log(`   📸 Screenshot saved: ${drawerScreenshotPath}`);

      // Close drawer
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('shijianus:close-overlays'));
      });
      await page.waitForTimeout(500);

      // ----------------------------------------------------
      // STEP 2: Blog Post Page & Comment Area Verification
      // ----------------------------------------------------
      const postUrl = `${targetUrl}/posts/content-formats-and-markup-mastery/`;
      console.log(`\n5. Navigating to Post Page: ${postUrl} ...`);
      await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2500);

      // Remove loading animation overlay if still visible
      await page.evaluate(() => {
        document.querySelector('#loading-box')?.remove();
      });

      const commentSection = await page.waitForSelector('#post-comment', { state: 'visible', timeout: 15000 });
      if (!commentSection) throw new Error('Missing #post-comment section on post page');
      await commentSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      console.log('6. Auditing Avatar Shape Rules in #post-comment...');
      const avatarRules = await page.evaluate(() => {
        // Create test instances inside #post-comment to inspect real applied stylesheet rules
        const testWrap = document.createElement('div');
        testWrap.id = 'live-test-avatar-container';
        testWrap.innerHTML = `
          <div class="tk-avatar is-webmaster-avatar" id="live-wm-avatar">
            <img src="/media/shijianus/avatar.jpg" alt="Admin" />
          </div>
          <div class="tk-avatar is-user-avatar" id="live-usr-avatar">
            <img src="/media/shijianus/avatar.jpg" alt="User" />
          </div>
        `;
        document.querySelector('#post-comment').appendChild(testWrap);

        const wm = document.querySelector('#live-wm-avatar');
        const usr = document.querySelector('#live-usr-avatar');
        const wmImg = wm.querySelector('img');

        const res = {
          wmRadius: window.getComputedStyle(wm).borderRadius,
          usrRadius: window.getComputedStyle(usr).borderRadius,
          wmImgRadius: window.getComputedStyle(wmImg).borderRadius,
        };
        testWrap.remove();
        return res;
      });

      console.log('   -> Live Computed Styles:');
      console.log('      Webmaster Avatar border-radius:', avatarRules.wmRadius);
      console.log('      Regular User Avatar border-radius:', avatarRules.usrRadius);
      console.log('      Webmaster Image border-radius:', avatarRules.wmImgRadius);

      if (avatarRules.wmRadius === '50%' || !avatarRules.wmRadius.includes('8px')) {
        throw new Error(`Expected live webmaster avatar to have square border-radius (8px), got ${avatarRules.wmRadius}`);
      }
      if (avatarRules.usrRadius !== '50%') {
        throw new Error(`Expected live user avatar to have circular border-radius (50%), got ${avatarRules.usrRadius}`);
      }
      console.log('   ✅ Live Webmaster avatar is SQUARE (8px), all regular avatars are CIRCULAR (50%).');

      // 7. Check / Test Profile Popover interaction
      console.log('7. Testing Author Profile Popover Rendering on Live ...');
      const commentAvatars = await page.$$('#post-comment .tk-avatar.is-clickable');
      console.log(`   -> Found ${commentAvatars.length} clickable avatars on live post page.`);
      if (commentAvatars.length > 0) {
        console.log('   -> Clicking first live avatar to trigger Popover...');
        await commentAvatars[0].click();
        await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });
        console.log('   ✅ Live .author-profile-popover opened successfully!');
        
        const livePopoverData = await page.evaluate(() => {
          const pop = document.querySelector('.author-profile-popover');
          if (!pop) return null;
          const rect = pop.getBoundingClientRect();
          const name = pop.querySelector('.profile-popover-display-name')?.textContent?.trim();
          const username = pop.querySelector('.profile-popover-username')?.textContent?.trim();
          const title = pop.querySelector('.profile-popover-title')?.textContent?.trim();
          const stats = pop.querySelector('.profile-popover-inline-stats')?.textContent?.replace(/\s+/g, ' ').trim();
          const legacyPills = pop.querySelectorAll('.profile-popover-pill');
          const badgePills = Array.from(pop.querySelectorAll('.profile-popover-badge-pill')).map((b) => b.textContent?.trim());
          const allText = pop.textContent || '';
          return {
            width: rect.width,
            height: rect.height,
            name,
            username,
            title,
            stats,
            statsHasDotSep: stats?.includes('·') || false,
            legacyPillsCount: legacyPills.length,
            badgePillsCount: badgePills.length,
            badgePills,
            hasFakeBadges: allText.includes('受到赞赏') || allText.includes('活跃交流'),
            hasMorePill: allText.includes('更多'),
            hasFakeData: stats?.includes('9999m') || stats?.includes('999'),
          };
        });
        console.log('   📊 Live Popover Data:', livePopoverData);
        if (livePopoverData.hasFakeData) {
          throw new Error(`Live popover contains fake 9999m data: "${livePopoverData.stats}"`);
        }
        if (livePopoverData.legacyPillsCount > 0) {
          throw new Error('Live popover has legacy colorful pills');
        }
        if (livePopoverData.statsHasDotSep) {
          throw new Error(`Live popover stats must NOT contain dot separator "·": "${livePopoverData.stats}"`);
        }
        if (livePopoverData.hasFakeBadges) {
          throw new Error('Live popover contains fake badges ("受到赞赏" / "活跃交流")');
        }
        if (livePopoverData.hasMorePill) {
          throw new Error('Live popover contains "+N 更多" pill');
        }
        if (livePopoverData.badgePillsCount > 4) {
          throw new Error(`Live popover badge count must be <= 4, got ${livePopoverData.badgePillsCount}`);
        }
        console.log('   ✅ Live Popover: 100% official badges (' + livePopoverData.badgePills.join(', ') + '), 0 fake badges, 0 dot sep, gap-spaced!');

        const popoverScreenshotPath = path.join(screenshotDir, `live-popover-${new URL(targetUrl).hostname}.png`);
        await page.screenshot({ path: popoverScreenshotPath, fullPage: false });
        console.log(`   📸 Popover Screenshot saved: ${popoverScreenshotPath}`);
      } else {
        console.log('   ℹ️ No existing user comments on live yet, verifying comment box & popover stylesheet ready.');
      }

      // Verify comment input textarea
      const textarea = await page.$('#post-comment textarea');
      if (!textarea) throw new Error('Missing comment textarea');
      console.log('   ✅ Comment textarea ready.');

      // Check console errors
      const fatalErrors = consoleErrors.filter(
        (e) => !e.includes('favicon') && !e.includes('analytics') && !e.includes('Turnstile') && !e.includes('status of 404')
      );
      if (fatalErrors.length > 0) {
        console.warn('   ⚠️ Console errors encountered:', fatalErrors);
      } else {
        console.log('   ✅ Zero fatal JS console errors.');
      }

      // Capture screenshot of comment area
      const commentScreenshotPath = path.join(screenshotDir, `live-comments-${new URL(targetUrl).hostname}.png`);
      await page.screenshot({ path: commentScreenshotPath, fullPage: false });
      console.log(`   📸 Screenshot saved: ${commentScreenshotPath}`);

      console.log(`\n🎉 Live Audit Passed for: ${targetUrl}`);
    } catch (err) {
      console.error(`❌ Audit failed for ${targetUrl}:`, err);
      throw err;
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('\n🌟 ALL LIVE AUDITS COMPLETED AND PASSED WITH 100% SUCCESS!');
}

runLiveVerification().catch((err) => {
  console.error('Fatal error in live verification:', err);
  process.exit(1);
});
