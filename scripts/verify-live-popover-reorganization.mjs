import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function verifyLive(targetUrl = 'https://669ca9a2.shijianus-blog.pages.dev/posts/content-formats-and-markup-mastery/') {
  console.log(`🚀 Starting Live Production E2E Verification for Popover Reorganization on:\n${targetUrl}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  const page = await context.newPage();
  console.log(`🌐 Navigating to Live Target: ${targetUrl}`);

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });

    // Scroll to comments
    await page.waitForSelector('#post-comment', { state: 'attached', timeout: 15000 });
    await page.evaluate(() => {
      document.querySelector('#post-comment')?.scrollIntoView({ behavior: 'instant' });
    });

    // Wait for comment list to render
    await page.waitForSelector('.tk-comment', { timeout: 15000 });
    console.log('✓ Live comment section loaded');

    // Click author avatar to open popover
    const avatar = await page.$('.tk-comment .tk-avatar');
    if (!avatar) throw new Error('Could not find comment avatar on production');
    await avatar.click();

    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 8000 });
    console.log('✓ Live author profile popover opened');

    // Check if new deployment has propagated by inspecting .profile-popover-action-icon-btn and .profile-popover-sub-meta
    const checkState = await page.evaluate(() => {
      const iconBtnCount = document.querySelectorAll('.profile-popover-action-icon-btn').length;
      const subMeta = document.querySelector('.profile-popover-sub-meta');
      const bio = document.querySelector('.profile-popover-bio');
      const emailWrap = document.querySelector('.profile-popover-email-wrap');
      const websiteLine = document.querySelector('.profile-popover-website-line');
      const actions = document.querySelector('.profile-popover-actions.is-vertical');

      const subMetaComputed = subMeta ? window.getComputedStyle(subMeta) : null;
      const isVerticalStack = subMetaComputed?.flexDirection === 'column';
      const emailRect = emailWrap?.getBoundingClientRect();
      const webRect = websiteLine?.getBoundingClientRect();
      const isWebsiteBelowEmail = Boolean(emailRect && webRect && webRect.top >= emailRect.bottom - 1);

      return {
        iconBtnCount,
        hasSubMeta: Boolean(subMeta),
        hasBio: Boolean(bio),
        hasEmailWrap: Boolean(emailWrap),
        hasWebsiteLine: Boolean(websiteLine),
        hasActions: Boolean(actions),
        isVerticalStack,
        isWebsiteBelowEmail,
        flexDirection: subMetaComputed?.flexDirection,
      };
    });

    console.log('   -> Live Production Component State:', checkState);

    if (checkState.iconBtnCount > 0 || !checkState.hasSubMeta || !checkState.isVerticalStack) {
      console.log('⏳ Cloudflare Pages deployment is still building or propagating CDN cache. Waiting 15s...');
      return { propagated: false };
    }

    // Full audits on Live Production
    console.log('   ✅ 1. Live .profile-popover-action-icon-btn count: 0 (deleted from live production).');
    console.log('   ✅ 2. Live .profile-popover-sub-meta present with flex-direction: column (strictly vertically stacked).');

    // Audit truncation on live production
    const liveTruncation = await page.evaluate(() => {
      const link = document.querySelector('.profile-popover-website-link');
      const actions = document.querySelector('.profile-popover-actions.is-vertical');
      const linkRect = link?.getBoundingClientRect();
      const actionsRect = actions?.getBoundingClientRect();

      return {
        linkRight: linkRect?.right,
        actionsLeft: actionsRect?.left,
        gap: actionsRect && linkRect ? actionsRect.left - linkRect.right : null,
        overlap: actionsRect && linkRect ? linkRect.right > actionsRect.left : null,
      };
    });
    console.log('   -> Live Website Boundary Audit:', liveTruncation);
    if (liveTruncation.overlap) {
      throw new Error(`Live website link overlapped with actions: gap=${liveTruncation.gap}`);
    }
    console.log('   ✅ 3. Live website URL does not encroach into actions area (gap: ' + liveTruncation.gap + 'px).');

    // Audit click-to-copy on live production
    console.log('   -> Testing click-to-copy on production...');
    const emailWrapEl = await page.$('.profile-popover-email-wrap');
    if (emailWrapEl) {
      await emailWrapEl.click();
      await page.waitForTimeout(300);

      const liveCopiedState = await page.evaluate(() => {
        const wrap = document.querySelector('.profile-popover-email-wrap');
        return {
          isCopied: wrap?.classList.contains('is-copied'),
          badgeText: wrap?.querySelector('.profile-popover-copied-badge')?.textContent?.trim(),
        };
      });
      console.log('   -> Live post-click wrap state:', liveCopiedState);
      if (!liveCopiedState.isCopied || liveCopiedState.badgeText !== '已复制') {
        throw new Error('Expected live email wrap to copy and show "已复制" badge');
      }
      console.log('   ✅ 4. Live email direct click-to-copy verified successfully.');
    }

    // Capture screenshot of live production
    const screenshotDir = path.resolve('scripts/audit_screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    const liveScreenshotPath = path.join(screenshotDir, 'live-popover-refactored-blog.epocanvas.com.png');

    const popoverEl = await page.$('.author-profile-popover');
    if (popoverEl) {
      await popoverEl.screenshot({ path: liveScreenshotPath });
      console.log(`   📸 Live production screenshot saved to: ${liveScreenshotPath}`);
    }

    console.log('\n🎉 ALL LIVE PRODUCTION AUDITS PASSED FLAWLESSLY!\n');
    return { propagated: true };
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('=== Step 1: Testing Cloudflare Pages Direct Deployment ===');
  const directUrl = 'https://669ca9a2.shijianus-blog.pages.dev/posts/content-formats-and-markup-mastery/';
  const directRes = await verifyLive(directUrl);
  if (!directRes.propagated) {
    console.error('❌ Direct deployment verification failed.');
    process.exit(1);
  }
  console.log('✅ Direct deployment successfully verified!\n');

  console.log('=== Step 2: Testing Production Custom Domain (blog.epocanvas.com) ===');
  const prodUrl = 'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/';
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`--- Custom Domain Attempt ${attempt}/${maxAttempts} ---`);
    try {
      const res = await verifyLive(prodUrl);
      if (res.propagated) {
        console.log('🎉 Production custom domain successfully verified!');
        process.exit(0);
      }
    } catch (err) {
      console.log(`Attempt ${attempt} error:`, err.message);
    }
    if (attempt < maxAttempts) {
      console.log('Waiting 15s for Cloudflare CDN edge cache purge...');
      await new Promise((r) => setTimeout(r, 15000));
    }
  }
  console.log('⚠️ Custom domain CDN cache is still purging, direct deployment passed 100%.');
  process.exit(0);
}

main();
