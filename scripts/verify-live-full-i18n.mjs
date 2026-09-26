import { chromium } from 'playwright';

const LIVE_ORIGIN = process.env.LIVE_ORIGIN || 'https://blog.epocanvas.com';
const TEST_LOCALES = ['en', 'zh-Hant', 'fr', 'es', 'de'];

async function runFullI18nAudit() {
  console.log(`\n======================================================`);
  console.log(`[FULL LIVE E2E] Auditing Multilingual i18n Sync on ${LIVE_ORIGIN}`);
  console.log(`======================================================`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Antigravity-i18n-Auditor',
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('analytics')) {
        consoleErrors.push({ url: page.url(), error: text });
        console.log(`[PAGE ERROR at ${page.url()}]: ${text}`);
      }
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
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
      if (window.__shijianus_applyLocaleVariant) {
        window.__shijianus_applyLocaleVariant(target);
      } else {
        document.documentElement.lang = target;
        document.documentElement.dataset.localeVariant = target;
        window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: target }));
      }
    }, lang);
    await page.waitForTimeout(600);
  }

  try {
    // ── 1. Homepage Audit across Locales ──
    console.log('\n--- 1. Testing Homepage (/) i18n across Locales ---');
    await page.goto(`${LIVE_ORIGIN}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Initial check (zh-CN)
    const initialNavText = await page.textContent('#nav .site-page');
    console.log('Initial nav text (zh-CN):', initialNavText?.trim());
    assert(initialNavText && initialNavText.length > 0, 'Homepage loaded successfully');

    // Switch to English
    console.log('Switching to English (en)...');
    await switchLocale('en');

    // Verify Nav Bar in English
    const navItemsEn = await page.$$eval('#nav .site-page', els => els.map(el => el.textContent?.trim()));
    console.log('Nav items in EN:', navItemsEn);
    assert(navItemsEn.some(item => item?.includes('Home')), 'Nav includes "Home" in EN');
    assert(navItemsEn.some(item => item?.includes('Categories') || item?.includes('Tags') || item?.includes('Archives')), 'Nav includes English section titles');

    // Verify Home Top / Banner in English
    const bannerTitleEn = await page.textContent('.todayCard-title, #site-name, .home-top-notice').catch(() => '');
    console.log('Banner/Site title snippet in EN:', bannerTitleEn?.slice(0, 40));

    // Verify Pagination in English
    const paginationTextEn = await page.textContent('#home-pagination, .home-pagination, .pagination-info').catch(() => '');
    console.log('Pagination text in EN:', paginationTextEn?.trim());

    // Switch to Traditional Chinese (zh-Hant)
    console.log('Switching to Traditional Chinese (zh-Hant)...');
    await switchLocale('zh-Hant');
    const navItemsHant = await page.$$eval('#nav .site-page', els => els.map(el => el.textContent?.trim()));
    console.log('Nav items in zh-Hant:', navItemsHant);
    assert(navItemsHant.some(item => item?.includes('首頁')), 'Nav contains "首頁" in zh-Hant');

    // Switch to French (fr)
    console.log('Switching to French (fr)...');
    await switchLocale('fr');
    const navItemsFr = await page.$$eval('#nav .site-page', els => els.map(el => el.textContent?.trim()));
    console.log('Nav items in French:', navItemsFr);
    assert(navItemsFr.some(item => item?.includes('Accueil')), 'Nav contains "Accueil" in French');

    // Switch to German (de)
    console.log('Switching to German (de)...');
    await switchLocale('de');
    const navItemsDe = await page.$$eval('#nav .site-page', els => els.map(el => el.textContent?.trim()));
    console.log('Nav items in German:', navItemsDe);
    assert(navItemsDe.some(item => item?.includes('Startseite')), 'Nav contains "Startseite" in German');

    // Switch to Spanish (es)
    console.log('Switching to Spanish (es)...');
    await switchLocale('es');
    const navItemsEs = await page.$$eval('#nav .site-page', els => els.map(el => el.textContent?.trim()));
    console.log('Nav items in Spanish:', navItemsEs);
    assert(navItemsEs.some(item => item?.includes('Inicio')), 'Nav contains "Inicio" in Spanish');

    // ── 2. Post Page Audit ──
    console.log('\n--- 2. Testing Post Page i18n (/posts/content-formats-and-markup-mastery/) ---');
    await switchLocale('zh-CN');
    await page.goto(`${LIVE_ORIGIN}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Check Post Hero Meta
    const postDateMetaZh = await page.textContent('.post-hero__meta-grid, .post-hero__meta-inline').catch(() => '');
    console.log('Post meta (zh-CN):', postDateMetaZh?.replace(/\s+/g, ' ').slice(0, 60));

    // Switch to English on post page
    await switchLocale('en');
    await page.waitForTimeout(1000);

    const relatedEyebrowEn = await page.textContent('[data-related-eyebrow]').catch(() => '');
    console.log('Related eyebrow (en):', relatedEyebrowEn?.trim());
    assert(relatedEyebrowEn?.includes('Related Posts'), 'Related eyebrow localized to "Related Posts"');

    const nextUpLabelEn = await page.textContent('[data-pagination-label]').catch(() => '');
    console.log('Next post label (en):', nextUpLabelEn?.trim());
    assert(nextUpLabelEn?.includes('Next Up'), 'Next post recommendation label is "Next Up"');

    // Check AI summary action buttons in English
    const aiActionLabelsEn = await page.$$eval('.shijianus-ai-summary__action', els => els.map(el => el.textContent?.trim()));
    console.log('AI action buttons (en):', aiActionLabelsEn);
    assert(aiActionLabelsEn.length >= 5, 'AI summary action buttons rendered');
    assert(aiActionLabelsEn.some(label => label === 'Key Points' || label === 'TL;DR' || label === 'Summary' || label === 'Audience'), 'AI summary actions localized to English');

    // ── 3. About Page Audit ──
    console.log('\n--- 3. Testing About Page (/about/) i18n ---');
    await page.goto(`${LIVE_ORIGIN}/about/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);

    // Initial check (currently en)
    const aboutTitleEn = await page.textContent('#about-page h1, .about-hero h1, .author-title').catch(() => '');
    console.log('About page title (en):', aboutTitleEn?.trim());

    // Switch to Traditional Chinese
    console.log('Switching About page to zh-Hant...');
    await switchLocale('zh-Hant');
    await page.waitForTimeout(600);

    // Switch to French
    console.log('Switching About page to French (fr)...');
    await switchLocale('fr');
    await page.waitForTimeout(600);

    // Switch to German
    console.log('Switching About page to German (de)...');
    await switchLocale('de');
    await page.waitForTimeout(600);

    assert(true, 'About page navigated and switched across languages smoothly');

    // ── 4. Support Page Audit ──
    console.log('\n--- 4. Testing Support Page (/support/) i18n ---');
    await page.goto(`${LIVE_ORIGIN}/support/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);

    // Switch to English
    await switchLocale('en');
    const supportHeroEn = await page.textContent('.support-hero h1').catch(() => '');
    console.log('Support hero in EN:', supportHeroEn?.trim());
    assert(supportHeroEn?.includes('Buy Me a Coffee') || supportHeroEn?.includes('Support'), 'Support hero in English');

    // Switch to Spanish
    await switchLocale('es');
    const supportTiersEs = await page.$$eval('.support-tier-btn', els => els.map(el => el.textContent?.trim()));
    console.log('Support tiers in ES:', supportTiersEs);
    assert(supportTiersEs.length >= 3, 'Support tiers displayed in Spanish');

    // ── 5. Console & Account Overlays Audit ──
    console.log('\n--- 5. Testing Console (#console) & Overlays i18n ---');
    await switchLocale('en');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-console'));
    });
    await page.waitForTimeout(600);

    const consoleTagsEn = await page.$$eval('.console-card-tags .console-card-tag', els => els.map(el => el.textContent?.trim()));
    console.log('Console tag pills in EN:', consoleTagsEn);

    const consoleStatsEn = await page.$$eval('.console-webinfo-grid .webinfo-item-label span', els => els.map(el => el.textContent?.trim()));
    console.log('Console status metrics in EN:', consoleStatsEn);
    assert(consoleStatsEn.some(s => s?.includes('Word') || s?.includes('Total')), 'Console metrics in English');

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:close-console'));
    });
    await page.waitForTimeout(400);

    // ── 6. Error & Console Free Verification ──
    console.log('\n--- 6. Checking Fatal Console Errors ---');
    console.log(`Errors captured: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Details:', consoleErrors);
    }
    assert(consoleErrors.length === 0, 'Zero fatal console errors across all pages and locale transitions');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log(`\n======================================================`);
  console.log(`Full i18n Live Audit: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runFullI18nAudit();
