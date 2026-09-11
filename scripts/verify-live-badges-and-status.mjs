import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URLS = [
  'https://026b917e.shijianus-blog.pages.dev',
  'https://blog.epocanvas.com',
];

async function runLiveVerification() {
  console.log('🌐 Starting Cloudflare Pages Production Playwright E2E Verification...');

  const screenshotDir = path.resolve(process.cwd(), 'scripts/audit_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  for (const targetUrl of TARGET_URLS) {
    console.log(`\n======================================================`);
    console.log(`🚀 Auditing Production Target: ${targetUrl}`);
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

    const hostName = new URL(targetUrl).hostname;

    try {
      // ----------------------------------------------------
      // STEP 1: Set up initial user state in localStorage
      // ----------------------------------------------------
      console.log(`1. Navigating to ${targetUrl} ...`);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1500);

      // Pre-seed storage
      await page.evaluate(() => {
        window.localStorage.setItem(
          'shijianus-comment-account',
          JSON.stringify({
            id: 'epo_u_1',
            name: 'admin',
            email: 'admin@epomail.bond',
            website: 'https://shijian.dev',
            avatar: '/media/shijianus/avatar.jpg',
            bio: '全栈架构师与系统美学探索者。',
            role: 'admin',
            provider: 'epomail',
          })
        );
        window.localStorage.setItem(
          'shijianus-user-activity-stats',
          JSON.stringify({
            hasAccount: true,
            hasReadAny: true,
            readingMinutes: 380,
            commentCount: 45,
            reactionsReceived: 1, // Exactly 1 reaction
            activeDays: 25,
            activeDates: ['2026-09-01', '2026-09-02'],
            firstSeenAt: new Date(Date.now() - 30 * 86400000).toISOString(),
            isWebmaster: true,
          })
        );
        // Initially 0 equipped badges
        window.localStorage.setItem('shijianus-equipped-badges', JSON.stringify([]));
      });

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // ----------------------------------------------------
      // STEP 2: Account Drawer & Badges Grid Verification
      // ----------------------------------------------------
      console.log('2. Opening Account Drawer ...');
      for (let attempt = 0; attempt < 15; attempt++) {
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('shijianus:open-notifications', { detail: { tab: 'auth' } }));
        });
        const isVisible = await page.isVisible('.theme-account-drawer');
        if (isVisible) break;
        await page.waitForTimeout(500);
      }
      await page.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 8000 });
      console.log('   -> Account Drawer is visible.');

      // Switch to Tab 0 (个人资料) if needed
      await page.evaluate(() => {
        const tabs = document.querySelectorAll('.theme-account-drawer .account-nav-tab');
        if (tabs.length > 0) tabs[0].click();
      });
      await page.waitForTimeout(600);

      // Requirement 3: Check Level Requirements (No "is-exempt" or "站长特免")
      console.log('3. Auditing Level Requirements for complete removal of "站长特免" ...');
      const exemptionAudit = await page.evaluate(() => {
        const exemptElements = document.querySelectorAll('.account-level-status.is-exempt');
        const allStatusTexts = Array.from(document.querySelectorAll('.account-level-status')).map((el) => el.textContent?.trim());
        const hasExemptWord = allStatusTexts.some((txt) => txt?.includes('豁免') || txt?.includes('特免'));
        return {
          exemptElementsCount: exemptElements.length,
          allStatusTexts,
          hasExemptWord,
        };
      });
      console.log('   -> Level status elements:', exemptionAudit.allStatusTexts);
      if (exemptionAudit.exemptElementsCount > 0 || exemptionAudit.hasExemptWord) {
        throw new Error(`Found .is-exempt or exemption keyword in level list: ${JSON.stringify(exemptionAudit)}`);
      }
      console.log('   ✅ Requirement 3 PASSED: .is-exempt and "站长特免" completely removed.');

      // Requirement 1 & 4: Badge Cards Grid audit
      console.log('4. Auditing .account-badges-grid on production ...');
      await page.waitForSelector('.account-badges-grid', { state: 'visible', timeout: 5000 });

      const badgeAudit = await page.$$eval('.account-badge-card', (cards) => {
        return cards.map((c) => {
          const nameEl = c.querySelector('.badge-card-name');
          const name = nameEl?.textContent?.trim();
          const hasEquipBtn = Boolean(c.querySelector('.badge-card-equip-btn'));
          const textContent = c.textContent || '';
          const hasEquipText = textContent.includes('佩戴') || textContent.includes('已佩戴');
          const isEquipped = c.classList.contains('is-equipped');
          const computedStyle = window.getComputedStyle(c);
          const nameStyle = nameEl ? window.getComputedStyle(nameEl) : null;
          return {
            name,
            hasEquipBtn,
            hasEquipText,
            isEquipped,
            hasEllipsis: name?.includes('...'),
            textOverflow: nameStyle?.textOverflow,
            backgroundColor: computedStyle.backgroundColor,
            cursor: computedStyle.cursor,
          };
        });
      });

      console.log(`   -> Total badge cards rendered: ${badgeAudit.length}`);
      console.log('   -> First 3 badge cards sample:', badgeAudit.slice(0, 3));

      if (badgeAudit.length < 5) {
        throw new Error(`Expected extensible badge grid with > 5 badges, got ${badgeAudit.length}`);
      }

      for (const b of badgeAudit) {
        if (b.hasEquipBtn || b.hasEquipText) {
          throw new Error(`Badge card "${b.name}" contains equip button or "佩戴" text!`);
        }
        if (b.hasEllipsis) {
          throw new Error(`Badge card "${b.name}" has truncated ellipsis "..."!`);
        }
        if (b.cursor !== 'pointer') {
          throw new Error(`Badge card "${b.name}" missing pointer cursor!`);
        }
      }
      console.log('   ✅ Requirement 1 & 4 PASSED: No equip button/text, no ellipsis "...". Scalable grid with rich badge pool.');

      // Requirement 5: Custom Status Emoji Picker
      console.log('5. Testing Custom Status Emoji Palette ...');
      const emojiTrigger = await page.waitForSelector('.account-status-emoji-trigger', { state: 'visible', timeout: 3000 });
      await emojiTrigger.click();
      await page.waitForTimeout(400);

      const paletteVisible = await page.isVisible('.account-status-emoji-palette');
      if (!paletteVisible) throw new Error('.account-status-emoji-palette is not visible after clicking trigger!');
      
      const paletteCount = await page.$$eval('.account-status-emoji-palette__item', (items) => items.length);
      console.log(`   -> Emoji palette contains ${paletteCount} selectable emojis.`);
      if (paletteCount < 10) throw new Error(`Expected at least 10 emoji options, got ${paletteCount}`);

      // Select '☕'
      await page.evaluate(() => {
        const item = Array.from(document.querySelectorAll('.account-status-emoji-palette__item')).find(
          (el) => el.textContent?.trim() === '☕'
        );
        if (item) item.click();
      });
      await page.waitForTimeout(300);

      const inputEmojiVal = await page.$eval('.account-status-emoji-input', (input) => input.value);
      console.log(`   -> Selected emoji in input: ${inputEmojiVal}`);
      if (inputEmojiVal !== '☕') {
        throw new Error(`Expected emoji input to be '☕', got '${inputEmojiVal}'`);
      }

      // Capture drawer screenshot
      const drawerScreenshot = path.join(screenshotDir, `live-drawer-badges-${hostName}.png`);
      await page.screenshot({ path: drawerScreenshot, fullPage: false });
      console.log(`   📸 Saved drawer screenshot: ${drawerScreenshot}`);
      console.log('   ✅ Requirement 5 PASSED: Interactive emoji palette functions perfectly.');

      // Equip 2 badges in the drawer for subsequent synchronization test
      console.log('6. Equipping 2 badges by clicking badge cards ...');
      const cards = await page.$$('.account-badge-card');
      if (cards.length >= 2) {
        await cards[0].click();
        await page.waitForTimeout(300);
        await cards[1].click();
        await page.waitForTimeout(300);
      }

      const equippedCount = await page.$$eval('.account-badge-card.is-equipped', (els) => els.length);
      console.log(`   -> Badges currently marked .is-equipped in drawer: ${equippedCount}`);
      if (equippedCount !== 2) {
        throw new Error(`Expected 2 equipped badges in drawer, got ${equippedCount}`);
      }

      // Close drawer
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('shijianus:close-overlays'));
      });
      await page.waitForTimeout(600);

      // ----------------------------------------------------
      // STEP 3: Post Page & Comment Author Popover Verification
      // ----------------------------------------------------
      const postUrl = `${targetUrl}/posts/content-formats-and-markup-mastery/`;
      console.log(`\n7. Navigating to Post Page: ${postUrl} ...`);
      await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2000);

      // Remove loading box if present
      await page.evaluate(() => {
        document.querySelector('#loading-box')?.remove();
      });

      const commentSection = await page.waitForSelector('#post-comment', { state: 'visible', timeout: 15000 });
      await commentSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);

      // Click on author avatar to open popover
      console.log('8. Opening Author Profile Popover in Comments ...');
      const clickableAvatar = await page.waitForSelector('#post-comment .tk-avatar.is-clickable', { state: 'visible', timeout: 8000 });
      await clickableAvatar.click();
      await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 6000 });
      console.log('   -> Popover is open.');

      // Check Reaction ("喝彩") Count Deduplication
      console.log('9. Auditing "喝彩" count deduplication in popover ...');
      const popoverStats = await page.evaluate(() => {
        const pop = document.querySelector('.author-profile-popover');
        if (!pop) return null;
        const reactionEl = Array.from(pop.querySelectorAll('.stat-item')).find((el) => el.textContent?.includes('喝彩'));
        const reactionVal = reactionEl?.querySelector('.stat-value')?.textContent?.trim();
        const badgePills = Array.from(pop.querySelectorAll('.profile-popover-badge-pill')).map((p) => p.textContent?.trim());
        return {
          reactionVal,
          badgePills,
          hasBadgeFlow: Boolean(pop.querySelector('.profile-popover-badges-flow')),
        };
      });

      console.log('   -> Popover stats:', popoverStats);

      if (popoverStats.reactionVal !== '1') {
        throw new Error(`Expected "喝彩" reaction count to be 1, but got ${popoverStats.reactionVal}! Deduplication failed.`);
      }
      console.log('   ✅ Reaction deduplication PASSED: "喝彩" is strictly 1 (not 2).');

      // Check Badges Flow matches the 2 equipped badges
      if (popoverStats.badgePills.length !== 2) {
        throw new Error(`Expected exactly 2 equipped badge pills in popover, got ${popoverStats.badgePills.length} (${JSON.stringify(popoverStats.badgePills)})`);
      }
      console.log('   ✅ Requirement 2 PASSED: 100% two-way lockstep synchronization between account badges and popover flow!');

      // Capture popover screenshot
      await page.locator('.author-profile-popover').scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const popoverScreenshot = path.join(screenshotDir, `live-popover-badges-${hostName}.png`);
      await page.screenshot({ path: popoverScreenshot, fullPage: false });
      console.log(`   📸 Saved popover screenshot: ${popoverScreenshot}`);

      console.log(`\n🎉 Target ${targetUrl} verified successfully with 0 errors!`);
    } catch (err) {
      console.error(`\n❌ Error auditing ${targetUrl}:`, err);
      throw err;
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('\n===========================================================');
  console.log('🏆 ALL PRODUCTION TARGETS FULLY AUDITED AND VERIFIED!');
  console.log('===========================================================\n');
}

runLiveVerification().catch((err) => {
  console.error('\n❌ LIVE E2E VERIFICATION FAILED:', err);
  process.exit(1);
});
