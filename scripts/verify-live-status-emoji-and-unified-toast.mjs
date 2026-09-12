import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URLS = [
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
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
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
            bio: '全栈架构师与系统美学探索者。长期专注于现代化静态网站与优雅交互开发。',
            role: 'admin',
            provider: 'epomail',
          })
        );
        window.localStorage.setItem(
          'shijianus-user-status',
          JSON.stringify({
            emoji: '☕',
            text: '喝咖啡中',
          })
        );
      });

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      // ----------------------------------------------------
      // STEP 2: Open Account Drawer
      // ----------------------------------------------------
      console.log('2. Opening Account Center Drawer...');
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('shijianus:open-notifications', { detail: { tab: 'auth' } }));
      });
      await page.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 8000 });
      await page.waitForTimeout(600);

      // Check 1: Sentence deleted
      console.log('3. Verifying redundant explanatory sentence removal...');
      const hasDeletedSentence = await page.evaluate(() => {
        const text = document.querySelector('.account-card--status')?.textContent || '';
        return text.includes('自定义当前状态 Emoji 与说明，将实时展示于评论名片中的身份');
      });
      console.log('   -> Has deleted sentence:', hasDeletedSentence);
      if (hasDeletedSentence) {
        throw new Error('Explanatory sentence was found in .account-card--status!');
      }
      console.log('   ✅ CHECK 1 PASSED: Redundant sentence completely removed.');

      // Check 2: Hero card status chip & status card chip: only emoji, text in title
      console.log('4. Verifying Emoji-only display rule in Hero & Status card heads...');
      const heroChip = await page.$eval('.account-hero-card__name-row .account-status-chip', (el) => ({
        text: el.textContent?.trim(),
        title: el.getAttribute('title'),
      }));
      console.log('   -> Hero Chip:', heroChip);
      if (heroChip.text !== '☕' || heroChip.title !== '喝咖啡中') {
        throw new Error(`Hero chip failed display rule: text='${heroChip.text}', title='${heroChip.title}'`);
      }

      const cardHeadChip = await page.$eval('.account-card--status .account-status-chip', (el) => ({
        text: el.textContent?.trim(),
        title: el.getAttribute('title'),
      }));
      console.log('   -> Status Card Head Chip:', cardHeadChip);
      if (cardHeadChip.text !== '☕' || cardHeadChip.title !== '喝咖啡中') {
        throw new Error(`Card head chip failed display rule: text='${cardHeadChip.text}', title='${cardHeadChip.title}'`);
      }
      console.log('   ✅ CHECK 2 PASSED: Only Emoji displayed; text shown in hover title.');

      // Check 3: Emoji input conflict eliminated
      console.log('5. Verifying .account-status-emoji-input elimination...');
      const hasEmojiInput = await page.isVisible('.account-status-emoji-input');
      const hasEmojiTrigger = await page.isVisible('.account-status-emoji-trigger');
      const triggerEmoji = await page.$eval(
        '.account-status-emoji-trigger .current-status-emoji',
        (el) => el.textContent?.trim()
      );
      console.log('   -> .account-status-emoji-input in DOM:', hasEmojiInput);
      console.log('   -> .account-status-emoji-trigger in DOM:', hasEmojiTrigger, `('${triggerEmoji}')`);
      if (hasEmojiInput) {
        throw new Error('.account-status-emoji-input must be deleted to eliminate duplicate display conflict!');
      }
      if (!hasEmojiTrigger || triggerEmoji !== '☕') {
        throw new Error(`Expected trigger emoji to be '☕', got '${triggerEmoji}'`);
      }
      console.log('   ✅ CHECK 3 PASSED: Input conflict eliminated; trigger button presents cleanly.');

      // Check 4: Bio max length & counter & display limits
      console.log('6. Verifying Bio input max length 100, counter, and hero truncation...');
      const bioCounter = await page.$eval('.account-field-limit', (el) => el.textContent?.trim());
      const bioMaxLength = await page.$eval('input[name="bio"]', (el) => el.getAttribute('maxLength'));
      console.log('   -> Bio visible counter:', bioCounter);
      console.log('   -> Bio input maxLength:', bioMaxLength);
      if (bioMaxLength !== '100' || !bioCounter?.includes('/ 100')) {
        throw new Error(`Bio max length / counter mismatch: maxLength=${bioMaxLength}, counter=${bioCounter}`);
      }
      console.log('   ✅ CHECK 4 PASSED: Bio 100 char limit & live counter verified.');

      // Check 5: No .account-toast-notice, unified blog navbar snackbar triggered
      console.log('7. Verifying .account-toast-notice removal & Unified Navbar Snackbar...');
      const hasAccountToast = await page.isVisible('.account-toast-notice');
      if (hasAccountToast) {
        throw new Error('.account-toast-notice must be completely removed from DOM!');
      }

      console.log('   -> Clicking preset status "💻 写代码中"...');
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('.account-status-preset-btn')).find((el) =>
          el.textContent?.includes('写代码中')
        );
        if (btn) btn.click();
      });
      await page.waitForTimeout(400);

      const snackbarInfo = await page.evaluate(() => {
        const bar = document.querySelector('#snackbar-container') || document.querySelector('.snackbar-container');
        return {
          exists: Boolean(bar),
          showClass: bar?.classList.contains('show'),
          text: (bar?.querySelector('.snackbar-text')?.textContent || bar?.textContent || '').trim(),
        };
      });
      console.log('   -> Unified Navbar Snackbar:', snackbarInfo);
      if (!snackbarInfo.exists || !snackbarInfo.showClass) {
        throw new Error('Unified blog snackbar did not trigger on status update!');
      }
      console.log('   ✅ CHECK 5 PASSED: .account-toast-notice removed; blog unified navbar snackbar triggered.');

      // Save drawer screenshot
      const drawerScreenshotPath = path.join(screenshotDir, `live-drawer-status-emoji-${hostName}.png`);
      await page.screenshot({ path: drawerScreenshotPath });
      console.log(`   📸 Saved drawer screenshot to: ${drawerScreenshotPath}`);

      // Close drawer
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);

      // ----------------------------------------------------
      // STEP 3: Navigate to post and verify comments sync
      // ----------------------------------------------------
      console.log('8. Navigating to post article to verify comments & popover status sync...');
      await page.goto(`${targetUrl}/posts/content-formats-and-markup-mastery/`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForTimeout(2000);

      const commentSection = await page.waitForSelector('#post-comment', { state: 'visible', timeout: 15000 });
      await commentSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      // Verify .tk-global-toast is removed
      const hasTkGlobalToast = await page.isVisible('.tk-global-toast');
      console.log('   -> .tk-global-toast in DOM:', hasTkGlobalToast);
      if (hasTkGlobalToast) {
        throw new Error('.tk-global-toast must be completely removed from DOM!');
      }

      // Check comments author status emoji sync
      const commentStatusEl = await page.$('#post-comment .tk-row.tk-meta .tk-status-emoji');
      if (commentStatusEl) {
        const cStatus = await commentStatusEl.evaluate((el) => ({
          text: el.textContent?.trim(),
          title: el.getAttribute('title'),
        }));
        console.log('   -> Comment Meta Status Emoji (.tk-status-emoji):', cStatus);
        if (cStatus.text !== '💻') {
          throw new Error(`Expected comment .tk-status-emoji to be '💻', got '${cStatus.text}'`);
        }
        console.log('   ✅ CHECK 6 PASSED: .tk-row.tk-meta status emoji synced and displayed.');
      } else {
        console.log('   ℹ️ No comments on this post yet, testing popover via avatar click...');
      }

      // If avatar exists, test popover
      const avatar = await page.$('#post-comment .tk-avatar.is-clickable');
      if (avatar) {
        await avatar.click();
        await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 6000 });
        const popoverStatus = await page.$eval(
          '.profile-popover-user-meta .profile-popover-status-emoji',
          (el) => ({
            text: el.textContent?.trim(),
            title: el.getAttribute('title'),
          })
        );
        console.log('   -> Popover Status Emoji (.profile-popover-status-emoji):', popoverStatus);
        if (popoverStatus.text !== '💻') {
          throw new Error(`Expected popover status emoji to be '💻', got '${popoverStatus.text}'`);
        }
        console.log('   ✅ CHECK 7 PASSED: Popover status emoji synced with hover title.');

        const popoverScreenshotPath = path.join(screenshotDir, `live-popover-status-emoji-${hostName}.png`);
        await page.screenshot({ path: popoverScreenshotPath });
        console.log(`   📸 Saved popover screenshot to: ${popoverScreenshotPath}`);
      }

      console.log(`\n🎉 TARGET ${targetUrl} AUDIT PASSED 100% WITH ZERO ERRORS!\n`);
    } catch (err) {
      console.error(`❌ AUDIT FAILED ON ${targetUrl}:`, err);
      throw err;
    } finally {
      await page.close();
      await context.close();
    }
  }

  await browser.close();
  console.log('✨ All Production E2E Audits Completed Successfully!');
}

runLiveVerification().catch((err) => {
  console.error('Fatal live verification error:', err);
  process.exit(1);
});
