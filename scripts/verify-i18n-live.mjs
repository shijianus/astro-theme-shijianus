#!/usr/bin/env node
/**
 * MCP Playwright E2E Verification
 * Target: https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/
 * Checks: i18n switcher presence, language switching zh-CN ↔ en
 */
import { chromium } from 'playwright';

const BASE_URL = 'https://blog.epocanvas.com';
const ZH_PATH = '/posts/content-formats-and-markup-mastery/';
const EN_PATH = '/posts/content-formats-and-markup-mastery-en/';
const LIVE_URL = BASE_URL + ZH_PATH;

async function run() {
  console.log('[MCP-i18n-E2E] 🚀 Starting live site Playwright verification...');
  console.log(`[MCP-i18n-E2E] 🌐 Target: ${LIVE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (compatible; Playwright/1.0; E2E-i18n-Audit)',
  });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ─────────────────────────────────────────────────────
    // Test 1: Load Chinese article, verify title & i18n switcher
    // ─────────────────────────────────────────────────────
    console.log('\n─── Test 1: ZH article loads correctly ───');
    await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    const zhTitle = await page.$eval('h1', (el) => el.textContent?.trim() ?? '');
    console.log(`  Title: "${zhTitle.slice(0, 60)}..."`);
    assert(
      zhTitle.includes('静态站点') || zhTitle.includes('SSG') || zhTitle.includes('内容格式'),
      `Chinese title contains expected keywords (got: "${zhTitle.slice(0, 60)}")`
    );

    // Check i18n switcher presence
    const switcher = await page.$('.post-hero__i18n-switch');
    assert(switcher !== null, 'i18n language switcher (.post-hero__i18n-switch) is present');

    // Check pills
    const pills = await page.$$eval('.post-hero__i18n-pill', (els) => els.map((el) => ({
      text: el.textContent?.trim() ?? '',
      lang: el.getAttribute('data-target-lang') ?? '',
      active: el.classList.contains('is-active'),
    })));
    console.log(`  Pills found: ${JSON.stringify(pills)}`);
    assert(pills.length >= 2, `At least 2 language pills found (got ${pills.length})`);
    assert(pills.some((p) => p.lang === 'zh-CN' && p.active), 'zh-CN pill is active on ZH page');
    assert(pills.some((p) => p.lang === 'en'), 'English pill exists');

    // ─────────────────────────────────────────────────────
    // Test 2: Click English pill → navigate to EN page
    // ─────────────────────────────────────────────────────
    console.log('\n─── Test 2: Click English pill → navigate to EN page ───');
    const enPill = await page.$('.post-hero__i18n-pill[data-target-lang="en"]');
    assert(enPill !== null, 'English pill button found and clickable');

    if (enPill) {
      await enPill.click();
      await page.waitForURL(/content-formats-and-markup-mastery-en/, { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      console.log(`  Navigated to: ${page.url()}`);
      assert(page.url().includes('content-formats-and-markup-mastery-en'), 'URL switched to EN slug');

      const enTitle = await page.$eval('h1', (el) => el.textContent?.trim() ?? '');
      console.log(`  EN Title: "${enTitle.slice(0, 80)}..."`);
      assert(
        /[a-zA-Z]{4,}/.test(enTitle) && enTitle.length > 10,
        `English title contains substantial English text (got: "${enTitle.slice(0, 60)}")`
      );
      assert(
        enTitle.toLowerCase().includes('ssg') || enTitle.toLowerCase().includes('static') || enTitle.toLowerCase().includes('content'),
        `English title is topically correct`
      );

      // Check EN active pill
      const enActivePill = await page.$eval('.post-hero__i18n-pill.is-active', (el) => el.textContent?.trim() ?? '');
      console.log(`  Active pill on EN page: "${enActivePill}"`);
      assert(enActivePill.includes('English') || enActivePill.includes('EN'), `Active pill shows English (got "${enActivePill}")`);

      // Check body has English content
      const bodyText = await page.$eval('#article-container', (el) => el.textContent?.slice(0, 200) ?? '');
      const hasEnglish = /[a-zA-Z]{4,}/.test(bodyText);
      assert(hasEnglish, 'Article body contains English text');
      console.log(`  Body snippet: "${bodyText.slice(0, 100).replace(/\s+/g, ' ')}..."`);
    }

    // ─────────────────────────────────────────────────────
    // Test 3: Switch back to Chinese
    // ─────────────────────────────────────────────────────
    console.log('\n─── Test 3: Switch back to Chinese ───');
    const zhPill = await page.$('.post-hero__i18n-pill[data-target-lang="zh-CN"]');
    assert(zhPill !== null, 'zh-CN pill exists on EN page');

    if (zhPill) {
      await zhPill.click();
      await page.waitForURL(/content-formats-and-markup-mastery\/?$/, { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      console.log(`  Navigated back to: ${page.url()}`);
      assert(!page.url().includes('-en'), 'URL returned to ZH (no -en suffix)');

      const restoredTitle = await page.$eval('h1', (el) => el.textContent?.trim() ?? '');
      assert(
        restoredTitle.includes('静态站点') || restoredTitle.includes('SSG'),
        `Chinese title restored (got: "${restoredTitle.slice(0, 60)}")`
      );
    }

    // ─────────────────────────────────────────────────────
    // Test 4: EN article direct access
    // ─────────────────────────────────────────────────────
    console.log('\n─── Test 4: Direct EN article access ───');
    await page.goto(BASE_URL + EN_PATH, { waitUntil: 'networkidle', timeout: 30000 });
    const directEnTitle = await page.$eval('h1', (el) => el.textContent?.trim() ?? '');
    console.log(`  Direct EN title: "${directEnTitle.slice(0, 80)}"`);
    assert(/[a-zA-Z]{4,}/.test(directEnTitle), 'Direct EN article loads with English title');

    const aiPill = await page.$('.post-hero__i18n-pill.is-active');
    const aiPillText = aiPill ? await aiPill.evaluate((el) => el.textContent?.trim() ?? '') : '';
    console.log(`  Active pill: "${aiPillText}"`);
    assert(aiPillText.includes('English'), 'Active pill shows English on direct EN page access');

    // Check for partial translation notice
    const noticeText = await page.$$eval('blockquote', (els) =>
      els.map((el) => el.textContent?.trim() ?? '').join('\n')
    );
    const hasNotice = noticeText.includes('partial') || noticeText.includes('Note');
    console.log(`  Partial translation notice present: ${hasNotice}`);
    if (hasNotice) {
      console.log(`  ℹ️  Notice text: "${noticeText.slice(0, 100)}..."`);
    }

    // ─────────────────────────────────────────────────────
    // Test 5: Homepage deduplification
    // ─────────────────────────────────────────────────────
    console.log('\n─── Test 5: Homepage deduplication check ───');
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle', timeout: 30000 });
    const allLinks = await page.$$eval('a[href*="/posts/"]', (els) => els.map((el) => el.getAttribute('href') ?? ''));
    // Check that the EN version (-en slug) doesn't appear as a separate card
    const enLinks = allLinks.filter((l) => l.includes('content-formats-and-markup-mastery-en'));
    const zhLinks = [...new Set(allLinks.filter((l) => l.includes('content-formats-and-markup-mastery') && !l.includes('-en') && !l.includes('--x')))];
    console.log(`  ZH links on homepage: ${JSON.stringify(zhLinks)}`);
    console.log(`  EN duplicate links on homepage: ${JSON.stringify(enLinks)}`);
    assert(enLinks.length === 0, `EN translation (-en) does NOT appear as a separate card on homepage (dedup working) — found: ${JSON.stringify(enLinks)}`);
    assert(zhLinks.length >= 1, `ZH article appears on homepage feed`);

  } finally {
    await browser.close();
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[MCP-i18n-E2E] Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('[MCP-i18n-E2E] ✅ ALL LIVE SITE i18n VERIFICATION TESTS PASSED!');
  } else {
    console.error('[MCP-i18n-E2E] ❌ Some tests failed. See above for details.');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('[MCP-i18n-E2E] 💥 Fatal error:', err);
  process.exit(1);
});
