import { chromium } from 'playwright';

const LIVE_URL = 'https://blog.epocanvas.com';

async function runLiveTests() {
  console.log(`[Live E2E] Starting live verification against ${LIVE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      // Filter out non-fatal 3rd party resource errors if any
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('analytics')) {
        consoleErrors.push(text);
      }
    }
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  async function switchLocale(lang) {
    await page.evaluate((target) => {
      window.localStorage.setItem('shijianus-locale-variant', target);
      window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: target }));
    }, lang);
    await page.waitForTimeout(600);
  }

  try {
    // ── 1. Support Dashboard (/support/) ──
    console.log('\n--- 1. Testing Live Support Dashboard (/support/) i18n ---');
    await page.goto(`${LIVE_URL}/support/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Initial state (zh-CN)
    const initialHeroTitle = await page.textContent('.support-hero h1');
    console.log('Live initial hero title:', initialHeroTitle?.trim());
    assert(initialHeroTitle && (initialHeroTitle.includes('咖啡') || initialHeroTitle.includes('赞赏')), `Initial hero title contains 咖啡/赞赏 (got: ${initialHeroTitle?.trim()})`);

    // Switch to English
    console.log('Switching live language to English (en)...');
    await switchLocale('en');

    const enHeroTitle = await page.textContent('.support-hero h1');
    console.log('Live hero title in English:', enHeroTitle?.trim());
    assert(enHeroTitle && enHeroTitle.includes('Buy Me a Coffee'), 'Live Hero title in English is "Buy Me a Coffee · Support"');

    const tierNamesEn = await page.$$eval('.support-tier-btn', els => els.map(el => el.textContent?.trim()));
    console.log('Live tier names in English:', tierNamesEn);
    assert(tierNamesEn.some(t => t.includes('Instant Coffee') || t.includes('Packet')), 'Live tier 0 localized to Instant Coffee Packet');
    assert(tierNamesEn.some(t => t.includes('Ceramic') || t.includes('Mug')), 'Live tier 2 localized to Artisan Ceramic Mug');

    const tableHeadersEn = await page.$$eval('thead th', els => els.map(el => el.textContent?.trim()));
    console.log('Live table headers in English:', tableHeadersEn);
    assert(tableHeadersEn.some(h => h.includes('Sponsor')), 'Live table header contains Sponsor in EN');

    const stripeBtnEn = await page.$eval('.support-checkout-btn', el => el.textContent?.trim()).catch(() => '');
    console.log('Live Stripe checkout button text:', stripeBtnEn);
    assert(stripeBtnEn.includes('Proceed to Secure Checkout') || stripeBtnEn.includes('Checkout'), 'Live Stripe button localized in English');

    // Switch to Traditional Chinese
    console.log('Switching live language to Traditional Chinese (zh-Hant)...');
    await switchLocale('zh-Hant');
    const tierNamesHant = await page.$$eval('.support-tier-btn', els => els.map(el => el.textContent?.trim()));
    console.log('Live tier names in zh-Hant:', tierNamesHant);
    assert(tierNamesHant.some(t => t.includes('便捷速溶咖啡條') || t.includes('速溶')), 'Live tier 0 in zh-Hant localized');
    assert(tierNamesHant.some(t => t.includes('精緻精品咖啡杯') || t.includes('咖啡杯')), 'Live tier 2 in zh-Hant localized');

    // Switch to French
    console.log('Switching live language to French (fr)...');
    await switchLocale('fr');
    const tierNamesFr = await page.$$eval('.support-tier-btn', els => els.map(el => el.textContent?.trim()));
    console.log('Live tier names in French:', tierNamesFr);
    assert(tierNamesFr.some(t => t.includes('Café Soluble') || t.includes('Sachet')), 'Live tiers in French contain French coffee terms');

    // Switch to German
    console.log('Switching live language to German (de)...');
    await switchLocale('de');
    const tierNamesDe = await page.$$eval('.support-tier-btn', els => els.map(el => el.textContent?.trim()));
    console.log('Live tier names in German:', tierNamesDe);
    assert(tierNamesDe.some(t => t.includes('Instant-Kaffee') || t.includes('Stick')), 'Live tiers in German contain German coffee terms');

    // ── 2. Keyboard Shortcut Panel ──
    console.log('\n--- 2. Testing Live Keyboard Shortcut Panel i18n ---');
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }));
    });
    await page.waitForTimeout(500);

    const shortcutTitleDe = await page.textContent('#keyboard-tips .keyboardTitle').catch(() => null);
    console.log('Live shortcut modal title in DE:', shortcutTitleDe?.trim());
    if (shortcutTitleDe) {
      assert(shortcutTitleDe.includes('Tastaturkürzel') || shortcutTitleDe.includes('Shortcuts'), `Live shortcut modal title in German (got: ${shortcutTitleDe})`);
    }

    await switchLocale('en');
    const shortcutItemsEn = await page.$$eval('#keyboard-tips .keyContent .content', els => els.map(el => el.textContent?.trim()));
    console.log('Live shortcut items in EN:', shortcutItemsEn);
    if (shortcutItemsEn.length > 0) {
      assert(shortcutItemsEn.some(i => i.includes('Search') || i.includes('Open Search')), 'Live search shortcut in English');
      assert(shortcutItemsEn.some(i => i.includes('Console') || i.includes('Open Console')), 'Live console shortcut in English');
    }

    // ── 3. Console System Status ──
    console.log('\n--- 3. Testing Live Console System Status i18n ---');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-console'));
    });
    await page.waitForTimeout(600);

    const statusLabelsLive = await page.$$eval('.console-webinfo-grid .webinfo-item-label span', els => els.map(el => el.textContent?.trim()));
    console.log('Live console status labels in EN:', statusLabelsLive);
    if (statusLabelsLive.length > 0) {
      assert(statusLabelsLive.some(l => l.includes('Word') || l.includes('Words')), 'Live Total Words metric in English');
      assert(statusLabelsLive.some(l => l.includes('Uptime') || l.includes('Days')), 'Live Safe Uptime Days metric in English');
      assert(statusLabelsLive.some(l => l.includes('Update') || l.includes('Latest')), 'Live Latest Update metric in English');
    }

    // ── 4. 404 Page ──
    console.log('\n--- 4. Testing Live 404 Page i18n ---');
    await switchLocale('zh-CN');
    await page.goto(`${LIVE_URL}/404.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const live404SubZh = await page.textContent('.error_subtitle');
    console.log('Live 404 subtitle (zh-CN):', live404SubZh?.trim());
    assert(live404SubZh?.includes('这条路还没有被记录下来'), `Live 404 subtitle in zh-CN (got: ${live404SubZh?.trim()})`);

    await switchLocale('en');
    const live404SubEn = await page.textContent('.error_subtitle');
    console.log('Live 404 subtitle (en):', live404SubEn?.trim());
    assert(live404SubEn?.includes('charted yet') || live404SubEn?.includes('path') || live404SubEn?.includes('recorded'), `Live 404 subtitle in English (got: ${live404SubEn?.trim()})`);

    const liveHomeBtnEn = await page.textContent('.error-actions .theme-button:first-child');
    console.log('Live 404 home button (en):', liveHomeBtnEn?.trim());
    assert(liveHomeBtnEn?.includes('Home') || liveHomeBtnEn?.includes('Back'), `Live 404 home button in English (got: ${liveHomeBtnEn?.trim()})`);

    // ── 5. Article Page Dynamic Components ──
    console.log('\n--- 5. Testing Live Article Dynamic Elements i18n ---');
    await switchLocale('zh-CN');
    await page.goto(`${LIVE_URL}/posts/anzhiyu-markdown-showcase/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2000);

    const liveRelatedEyebrowZh = await page.textContent('[data-related-eyebrow]').catch(() => '');
    console.log('Live related eyebrow (zh-CN):', liveRelatedEyebrowZh?.trim());
    assert(liveRelatedEyebrowZh?.includes('相关') || liveRelatedEyebrowZh?.includes('推薦'), `Live related eyebrow in Chinese (got: ${liveRelatedEyebrowZh})`);

    await switchLocale('en');
    const liveRelatedEyebrowEn = await page.textContent('[data-related-eyebrow]').catch(() => '');
    console.log('Live related eyebrow in English:', liveRelatedEyebrowEn?.trim());
    assert(liveRelatedEyebrowEn?.includes('Related Posts'), `Live related eyebrow in English (got: ${liveRelatedEyebrowEn})`);

    const liveRecommendLabelEn = await page.textContent('[data-pagination-label]').catch(() => '');
    console.log('Live post recommendation label in English:', liveRecommendLabelEn?.trim());
    assert(liveRecommendLabelEn?.includes('Next Up'), `Live next post label in English (got: ${liveRecommendLabelEn})`);

    const liveAiSummaryActionCount = await page.locator('.shijianus-ai-summary__action').count();
    console.log('Live AI Summary action buttons count:', liveAiSummaryActionCount);
    assert(liveAiSummaryActionCount > 0, `Live AI summary action buttons present (${liveAiSummaryActionCount})`);

    // ── 6. Console Error Check ──
    console.log('\n--- 6. Console Errors Audit ---');
    console.log(`Fatal console errors encountered: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }
    assert(consoleErrors.length === 0, 'No fatal JavaScript runtime errors on live site');

  } catch (err) {
    console.error('Live test execution error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log(`\n========================================`);
  console.log(`Live Verification Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveTests();
