import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function runLiveVerification() {
  console.log('🌐 Starting Live E2E Verification on Production: https://blog.epocanvas.com ...\n');

  const screenshotsDir = path.resolve('scripts/audit_screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    const targetUrl = 'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/';
    console.log(`Navigating to: ${targetUrl}`);
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log(`HTTP Status: ${response?.status()}`);
    if (response?.status() !== 200) {
      throw new Error(`Expected HTTP 200, got ${response?.status()}`);
    }

    // Scroll to comments area
    await page.waitForSelector('#post-comment', { state: 'attached', timeout: 15000 });
    await page.evaluate(() => {
      document.querySelector('#post-comment')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(1500);

    // Wait for comment items
    await page.waitForSelector('.tk-comment', { state: 'visible', timeout: 15000 });
    console.log('✓ Production comments loaded successfully');

    // Click first comment avatar to trigger author profile popover
    const avatar = await page.$('.tk-comment .tk-avatar');
    if (!avatar) throw new Error('Could not find comment avatar on production');
    await avatar.click();

    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 8000 });
    console.log('✓ Author profile popover opened on production');

    // 1. Audit: Ensure .profile-popover-copy-btn is DELETED from DOM
    const copyBtnCount = await page.evaluate(() => {
      return document.querySelectorAll('.profile-popover-copy-btn').length;
    });
    console.log(`   -> Production .profile-popover-copy-btn count in DOM: ${copyBtnCount}`);
    if (copyBtnCount !== 0) {
      console.warn(`   ⚠️ Warning: Found ${copyBtnCount} copy-btn. Cloudflare Pages build may still be deploying. Will retry after delay...`);
      return false;
    }
    console.log('   ✅ 1. Production confirmed: .profile-popover-copy-btn is completely removed from DOM.');

    // 2. Audit: Verify profile-popover-email-wrap exists and is clickable
    const emailWrapInfo = await page.evaluate(() => {
      const wrap = document.querySelector('.profile-popover-email-wrap');
      if (!wrap) return null;
      return {
        role: wrap.getAttribute('role'),
        tabIndex: wrap.getAttribute('tabindex'),
        title: wrap.getAttribute('title'),
        text: wrap.querySelector('.profile-popover-email-text')?.textContent?.trim(),
        hasCopyIcon: Boolean(wrap.querySelector('.profile-popover-copy-icon')),
        cursor: window.getComputedStyle(wrap).cursor,
      };
    });
    console.log('   -> Production .profile-popover-email-wrap info:', emailWrapInfo);
    if (!emailWrapInfo) throw new Error('Production .profile-popover-email-wrap not found');
    if (emailWrapInfo.role !== 'button') throw new Error(`Expected role="button", got ${emailWrapInfo.role}`);
    if (emailWrapInfo.cursor !== 'pointer') throw new Error(`Expected cursor="pointer", got ${emailWrapInfo.cursor}`);
    console.log('   ✅ 2. Production .profile-popover-email-wrap is an accessible button with pointer cursor.');

    // 3. Test Direct Click to Copy
    console.log('   -> Testing click-to-copy on production...');
    const emailWrapEl = await page.$('.profile-popover-email-wrap');
    await emailWrapEl.click();
    await page.waitForTimeout(300);

    const postClickWrapState = await page.evaluate(() => {
      const wrap = document.querySelector('.profile-popover-email-wrap');
      const badge = wrap?.querySelector('.profile-popover-copied-badge')?.textContent?.trim();
      const isCopiedClass = wrap?.classList.contains('is-copied');
      return { badge, isCopiedClass };
    });
    console.log('   -> Production post-click wrap state:', postClickWrapState);
    if (!postClickWrapState.isCopiedClass) {
      throw new Error('Expected .is-copied class after clicking email wrap');
    }
    console.log('   ✅ 3. Direct click on email successfully activates copy animation and "已复制" badge.');

    // 4. Test Mail Link Placement in .profile-popover-actions and Unauthenticated State (Fallback to mailto)
    const mailLinkPlacement = await page.evaluate(() => {
      const inActions = document.querySelector('.profile-popover-actions .profile-popover-mail-link');
      const inEmailLine = document.querySelector('.profile-popover-email-line .profile-popover-mail-link');
      const mentionBtn = document.querySelector('.profile-popover-actions .profile-popover-mention-btn');
      return {
        hasInActions: Boolean(inActions),
        hasInEmailLine: Boolean(inEmailLine),
        hasMentionBtn: Boolean(mentionBtn),
      };
    });
    console.log('   -> Production mail link placement audit:', mailLinkPlacement);
    if (!mailLinkPlacement.hasInActions) {
      throw new Error('Expected .profile-popover-mail-link to be inside .profile-popover-actions on production');
    }
    if (mailLinkPlacement.hasInEmailLine) {
      throw new Error('.profile-popover-mail-link should NOT be inside .profile-popover-email-line on production');
    }
    if (!mailLinkPlacement.hasMentionBtn) {
      throw new Error('Expected .profile-popover-mention-btn to be alongside in .profile-popover-actions on production');
    }
    console.log('   ✅ 4. Production confirmed: .profile-popover-mail-link is placed inside .profile-popover-actions side-by-side with mention button.');

    // 5. Test Mail Link in Unauthenticated State (Fallback to mailto)
    const mailLinkUnauthenticated = await page.evaluate(() => {
      const link = document.querySelector('.profile-popover-actions .profile-popover-mail-link');
      if (!link) return null;
      return {
        href: link.getAttribute('href'),
        text: link.textContent?.trim(),
        target: link.getAttribute('target'),
      };
    });
    console.log('   -> Production default mail link state:', mailLinkUnauthenticated);
    if (!mailLinkUnauthenticated) throw new Error('Production .profile-popover-mail-link not found');
    if (!mailLinkUnauthenticated.href?.startsWith('mailto:')) {
      throw new Error(`Expected mailto: href, got ${mailLinkUnauthenticated.href}`);
    }
    if (mailLinkUnauthenticated.text !== '写信') {
      throw new Error(`Expected label strictly "写信", got "${mailLinkUnauthenticated.text}"`);
    }
    console.log('   ✅ 5. Unauthenticated state on production correctly displays "写信" and falls back to standard mailto: link.');

    // 6. Test Mail Link in Epomail Logged-In State
    console.log('\n   -> Simulating user logged in via Epomail on production...');
    await page.evaluate(() => {
      const epomailIdentity = {
        id: 'usr_epomail_live_test',
        name: 'EpomailLiveTester',
        email: 'tester@epocanvas.com',
        avatar: '',
        role: 'reader',
        provider: 'epomail',
      };
      window.localStorage.setItem('shijianus-comment-account', JSON.stringify(epomailIdentity));
      window.localStorage.setItem('shijianus_comment_account', JSON.stringify(epomailIdentity));
      window.dispatchEvent(new CustomEvent('shijianus:comment-account-change', { detail: epomailIdentity }));
      window.dispatchEvent(new CustomEvent('shijianus:account-change', { detail: epomailIdentity }));
      window.dispatchEvent(new CustomEvent('shijianus:comment-identity-changed', { detail: epomailIdentity }));
    });
    await page.waitForTimeout(400);

    // Close and re-open popover
    await page.evaluate(() => {
      document.body.click();
    });
    await page.waitForTimeout(300);

    const avatarAgain = await page.$('.tk-comment .tk-avatar');
    await avatarAgain.click();
    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 8000 });
    await page.waitForTimeout(300);

    const mailLinkEpomail = await page.evaluate(() => {
      const link = document.querySelector('.profile-popover-actions .profile-popover-mail-link');
      if (!link) return null;
      return {
        href: link.getAttribute('href'),
        text: link.textContent?.trim(),
        title: link.getAttribute('title'),
        target: link.getAttribute('target'),
        rel: link.getAttribute('rel'),
      };
    });
    console.log('   -> Production Epomail-authenticated mail link state:', mailLinkEpomail);
    if (!mailLinkEpomail) throw new Error('Production .profile-popover-mail-link not found after Epomail login');
    if (!mailLinkEpomail.href?.includes('https://mail.epocanvas.com/inbox?composeTo=')) {
      throw new Error(`Expected Epomail compose URL, got ${mailLinkEpomail.href}`);
    }
    if (mailLinkEpomail.text !== '写信') {
      throw new Error(`Expected label strictly "写信", got "${mailLinkEpomail.text}"`);
    }
    if (mailLinkEpomail.target !== '_blank') {
      throw new Error(`Expected target="_blank", got ${mailLinkEpomail.target}`);
    }
    console.log('   ✅ 6. When authenticated via Epomail, mail link on production retains "写信" and prioritizes Epomail compose with composeTo target in new tab.');

    // Save screenshot for audit
    const screenshotPath = path.join(screenshotsDir, 'live-popover-email-actions.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`\n📸 Audit screenshot saved: ${screenshotPath}`);

    console.log('\n🎉 ALL PRODUCTION AUDIT CHECKS PASSED!\n');
    return true;
  } finally {
    await browser.close();
  }
}

async function main() {
  let passed = false;
  for (let attempt = 1; attempt <= 6; attempt++) {
    console.log(`\n--- Verification Attempt ${attempt}/6 ---`);
    passed = await runLiveVerification().catch((err) => {
      console.warn(`Attempt ${attempt} encounter: ${err.message}`);
      return false;
    });
    if (passed) break;
    console.log('Waiting 20 seconds for Cloudflare Pages build to finish deploying...');
    await new Promise((r) => setTimeout(r, 20000));
  }

  if (!passed) {
    console.error('❌ Production verification did not pass after 6 attempts.');
    process.exit(1);
  }
}

main();
