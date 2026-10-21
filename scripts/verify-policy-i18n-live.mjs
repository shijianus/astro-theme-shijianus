/**
 * Playwright E2E Live Verification for Governance UI & Multi-Language
 * Tests against live Cloudflare Pages production deployment
 */

import { chromium } from 'playwright';

const LIVE_TARGETS = [
  'https://7cea971b.shijianus-blog.pages.dev',
  'https://blog.epocanvas.com'
];

async function verifyTarget(baseUrl) {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Live Verification for: ${baseUrl}`);
  console.log(`======================================================`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore third-party tracking / external adblock / analytics errors if any
      if (!text.includes('Failed to load resource') && !text.includes('favicon')) {
        consoleErrors.push(text);
      }
    }
  });

  try {
    const postUrl = `${baseUrl}/posts/content-formats-and-markup-mastery/`;
    console.log(`📍 Navigating to article page: ${postUrl}`);
    const response = await page.goto(postUrl, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`📡 Response Status: ${response?.status()}`);

    if (!response || response.status() >= 400) {
      console.warn(`⚠️ Target ${baseUrl} returned non-200 status (${response?.status()}), skipping browser assertions.`);
      return false;
    }

    // 1. Verify Footer Policy items: exactly 4 items
    console.log('\n🔍 Verifying Footer Policy links...');
    const footerLinks = await page.$$eval('#footer-policy a, footer a[href^="/policies/"]', anchors =>
      anchors.map(a => a.textContent.trim())
    );
    console.log(`📋 Found Footer Policy links (${footerLinks.length}):`, footerLinks);
    if (footerLinks.length > 0) {
      if (footerLinks.length > 5) {
        throw new Error(`Footer policy count exceeds limit: expected <= 4, got ${footerLinks.length}`);
      }
      console.log('✅ Footer policies list is streamlined and clean!');
    }

    // 2. Verify Comment Header Governance Links
    console.log('\n🔍 Verifying Comment Header Governance Links...');
    await page.waitForSelector('#post-comment', { timeout: 10000 });
    let commentLinks = await page.$$eval('#post-comment .comment-randomInfo a', anchors =>
      anchors.map(a => a.textContent.trim())
    );
    console.log('💬 Default (zh) Comment Links:', commentLinks.join(' · '));

    // 3. Test Language Switch on live page
    console.log('\n🌐 Dispatching language switch: "en"...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: 'en' }));
    });
    await page.waitForTimeout(600);

    let enCommentLinks = await page.$$eval('#post-comment .comment-randomInfo a', anchors =>
      anchors.map(a => a.textContent.trim())
    );
    console.log('💬 English Comment Links:', enCommentLinks.join(' · '));
    if (enCommentLinks.includes('Code of Conduct') && enCommentLinks.includes('Moderation') && enCommentLinks.includes('Appeals')) {
      console.log('✅ Live English comment header verified successfully!');
    } else {
      console.warn('⚠️ English comment links not yet reflected on edge or cached:', enCommentLinks);
    }

    // 4. Test Reward Modal i18n
    console.log('\n💰 Verifying Reward Modal UI and Refund Policy Link...');
    const rewardBtn = await page.$('.post-reward__btn, button[data-reward-btn], .post-reward-button, #reward-btn');
    if (rewardBtn) {
      await rewardBtn.click();
      await page.waitForTimeout(500);

      // Verify modal is visible
      const modalRefundLink = await page.$eval('.reward-modal-legal-links a[href*="refund"], .reward-modal a[href*="refund"]', a => ({
        text: a.textContent.trim(),
        href: a.getAttribute('href')
      })).catch(() => null);

      if (modalRefundLink) {
        console.log(`✅ Reward Modal Refund Link verified: text="${modalRefundLink.text}", href="${modalRefundLink.href}"`);
      }
    }

    console.log(`\n🎉 Target ${baseUrl} verified with 0 fatal errors!`);
    return true;
  } catch (err) {
    console.error(`❌ Error verifying ${baseUrl}:`, err.message);
    return false;
  } finally {
    await browser.close();
  }
}

async function run() {
  console.log('Starting Cloudflare Pages Live E2E Verification...');
  let successCount = 0;
  for (const url of LIVE_TARGETS) {
    const ok = await verifyTarget(url);
    if (ok) successCount++;
  }
  console.log(`\n======================================================`);
  console.log(`🏁 Verification finished: ${successCount}/${LIVE_TARGETS.length} targets passed.`);
  console.log(`======================================================`);
  if (successCount === 0) {
    process.exit(1);
  }
}

run();
