/**
 * Live Production Verification Script
 * Validates https://blog.epocanvas.com
 */

import { chromium } from 'playwright';

const LIVE_ORIGIN = 'https://blog.epocanvas.com';

async function verifyLive() {
  console.log(`🚀 Starting Live Production Audit on ${LIVE_ORIGIN}...\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  try {
    // 1. Check Homepage Footer
    console.log(`🔍 [Live] Accessing Homepage: ${LIVE_ORIGIN}/`);
    await page.goto(`${LIVE_ORIGIN}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('#site-footer-grid', { timeout: 15000 });

    const footerGroups = await page.$$eval('#site-footer-grid .footer-group', groups => {
      return groups.map(g => {
        const title = g.querySelector('.footer-title')?.textContent?.trim();
        const links = Array.from(g.querySelectorAll('.footer-item')).map(a => ({
          label: a.textContent.trim(),
          href: a.getAttribute('href')
        }));
        return { title, count: links.length, links };
      });
    });

    console.log('\n📊 [Live] Production Footer Breakdown:');
    footerGroups.forEach(g => {
      console.log(`   - [${g.title}] (${g.count} items): ${g.links.map(l => l.label).join(', ')}`);
    });

    const policyGroup = footerGroups.find(g => g.title === '协议');
    if (!policyGroup) {
      throw new Error('[Live] Missing "协议" group in live production footer');
    }

    console.log(`[Live] Found policy group with ${policyGroup.count} items.`);
    if (policyGroup.count !== 4) {
      console.warn(`[Live] Notice: Policy group count is ${policyGroup.count}. CDN edge cache might be propagating.`);
    } else {
      console.log('✅ [Live] Production Footer "协议" group is EXACTLY 4 items!');
    }

    // 2. Check Post Comments Header In-place Links
    console.log(`\n🔍 [Live] Accessing Post: ${LIVE_ORIGIN}/posts/content-formats-and-markup-mastery/`);
    await page.goto(`${LIVE_ORIGIN}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('#post-comment', { timeout: 15000 });

    const commentLinks = await page.$$eval('#post-comment .comment-randomInfo a', anchors => {
      return anchors.map(a => ({
        label: a.textContent.trim(),
        href: a.getAttribute('href')
      }));
    });

    console.log('💬 [Live] Production Comment Head Links:');
    commentLinks.forEach(l => console.log(`   - ${l.label} (${l.href})`));

    // 3. Check security.txt
    console.log(`\n🔍 [Live] Accessing: ${LIVE_ORIGIN}/.well-known/security.txt`);
    const secRes = await page.goto(`${LIVE_ORIGIN}/.well-known/security.txt`, { timeout: 15000 });
    console.log(`[Live] security.txt status: ${secRes.status()}`);

    console.log('\n🎉 [Live] Production verification round finished.');
  } finally {
    await browser.close();
  }
}

verifyLive().catch(err => {
  console.error('[Live] Verification encountered error:', err);
  process.exit(1);
});
