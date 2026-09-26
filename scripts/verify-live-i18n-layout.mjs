import { chromium } from 'playwright';
import fs from 'fs';

const LIVE_TARGETS = [
  'https://blog.epocanvas.com',
  'https://9595612e.shijianus-blog.pages.dev',
];

fs.mkdirSync('scripts/audit_screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const consoleErrors = [];

try {
  for (const baseUrl of LIVE_TARGETS) {
    console.log(`\n======================================================`);
    console.log(`Starting Live Production E2E Verification on: ${baseUrl}`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      viewport: { width: 1440, height: 950 },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('404')) {
          console.log(`>>> CAUGHT CONSOLE ERROR at ${page.url()}: ${text}`);
          consoleErrors.push(`[${baseUrl} @ ${page.url()}] ${text}`);
        }
      }
    });
    page.on('pageerror', (err) => {
      console.log(`>>> CAUGHT PAGE ERROR at ${page.url()}: ${err.message}`);
      consoleErrors.push(`[${baseUrl} @ ${page.url()}] ${err.message}`);
    });

    // 1. Visit Home
    console.log(`Navigating to ${baseUrl}/ ...`);
    const resp = await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`HTTP Status: ${resp.status()}`);
    if (resp.status() !== 200) {
      throw new Error(`Expected HTTP 200, got ${resp.status()}`);
    }

    const testLanguages = [
      { lang: 'zh-CN', name: 'Simplified Chinese' },
      { lang: 'de', name: 'German (Long Words)' },
      { lang: 'en', name: 'English' },
      { lang: 'fr', name: 'French' },
      { lang: 'es', name: 'Spanish' },
      { lang: 'zh-Hant', name: 'Traditional Chinese' },
    ];

    for (const { lang, name } of testLanguages) {
      console.log(`\nAuditing Live Language: ${name} (${lang})...`);

      await page.evaluate((targetLang) => {
        if (typeof window.__shijianus_applyLocaleVariant === 'function') {
          window.__shijianus_applyLocaleVariant(targetLang);
        } else {
          localStorage.setItem('shijianus_locale', targetLang);
          localStorage.setItem('shijianus_locale_variant', targetLang);
          document.documentElement.lang = targetLang;
          window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: targetLang }));
        }
      }, lang);
      await page.waitForTimeout(600);

      // Audit PostCards
      const feedCardsAudit = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('#recent-posts .recent-post-item'));
        return cards.slice(0, 4).map((card, idx) => {
          const titleEl = card.querySelector('.post-card-title');
          const excerptEl = card.querySelector('.post-card-excerpt');
          const stickyBadge = card.querySelector('.anzhiyu-icon-thumbtack')?.parentElement;
          const categoryLink = card.querySelector('a[href^="/categories/"]');
          const unreadSpan = card.querySelector('.unvisited-post');
          const timeEl = card.querySelector('time');
          const tags = Array.from(card.querySelectorAll('a[href^="/tags/"]')).map(t => t.textContent?.trim());

          const rect = card.getBoundingClientRect();
          const titleRect = titleEl ? titleEl.getBoundingClientRect() : null;

          return {
            idx,
            title: titleEl?.textContent?.trim()?.slice(0, 40),
            titleHeight: titleRect ? Math.round(titleRect.height) : 0,
            excerpt: excerptEl?.textContent?.trim()?.slice(0, 40),
            stickyText: stickyBadge?.textContent?.trim(),
            categoryText: categoryLink?.textContent?.trim(),
            unreadText: unreadSpan?.textContent?.trim(),
            dateText: timeEl?.textContent?.trim(),
            tags,
            cardWidth: Math.round(rect.width),
            cardHeight: Math.round(rect.height),
            hasHorizontalOverflow: card.scrollWidth > card.clientWidth + 2,
          };
        });
      });

      console.log(`[${baseUrl}] Cards Audit [${lang}]:`, JSON.stringify(feedCardsAudit, null, 2));

      for (const card of feedCardsAudit) {
        if (card.hasHorizontalOverflow) {
          throw new Error(`[${baseUrl}] Card ${card.idx} has horizontal overflow in ${lang}!`);
        }
      }

      // Audit Sidebar
      const sidebarAudit = await page.evaluate(() => {
        const webinfoItems = Array.from(document.querySelectorAll('.card-webinfo-grid .webinfo-item')).map(item => ({
          label: item.querySelector('.webinfo-label')?.textContent?.trim(),
          val: item.querySelector('.webinfo-val')?.textContent?.trim(),
        }));
        const popularTagsHeader = document.querySelector('.overview-section--tags .item-headline span')?.textContent?.trim();
        const featuredCategoriesHeader = document.querySelector('.overview-section--categories .item-headline span')?.textContent?.trim();
        const sitePulseHeader = document.querySelector('.overview-section--webinfo .item-headline span')?.textContent?.trim();

        return { webinfoItems, popularTagsHeader, featuredCategoriesHeader, sitePulseHeader };
      });
      console.log(`[${baseUrl}] Sidebar Audit [${lang}]:`, sidebarAudit);

      const targetPrefix = baseUrl.includes('pages.dev') ? 'pagesdev' : 'production';
      await page.screenshot({ path: `scripts/audit_screenshots/live_${targetPrefix}_${lang}.png` });
      console.log(`Saved screenshot: live_${targetPrefix}_${lang}.png`);
    }

    // 2. Mobile Viewport Live Check
    console.log(`\nAuditing Mobile Viewport (375x812) in German on ${baseUrl}...`);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => {
      window.__shijianus_applyLocaleVariant('de');
    });
    await page.waitForTimeout(500);

    const mobileAudit = await page.evaluate(() => {
      const card = document.querySelector('#recent-posts .recent-post-item');
      if (!card) return null;
      return {
        width: Math.round(card.getBoundingClientRect().width),
        scrollWidth: card.scrollWidth,
        clientWidth: card.clientWidth,
        overflow: card.scrollWidth > card.clientWidth + 2,
      };
    });
    console.log(`[${baseUrl}] Mobile Card Audit [de]:`, mobileAudit);
    if (mobileAudit?.overflow) {
      throw new Error(`[${baseUrl}] Mobile card has horizontal overflow in German!`);
    }

    const targetPrefix = baseUrl.includes('pages.dev') ? 'pagesdev' : 'production';
    await page.screenshot({ path: `scripts/audit_screenshots/live_${targetPrefix}_mobile_de.png` });

    // 3. Post Page Live Check
    console.log(`\nAuditing Post Page on ${baseUrl}...`);
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto(`${baseUrl}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    await page.evaluate(() => {
      window.__shijianus_applyLocaleVariant('de');
    });
    await page.waitForTimeout(500);

    const postAuditDe = await page.evaluate(() => {
      const tocTitle = document.querySelector('[data-i18n-toc-title]')?.textContent?.trim();
      const tocCount = document.querySelector('[data-i18n-toc-count]')?.textContent?.trim();
      const relatedEyebrow = document.querySelector('[data-related-eyebrow]')?.textContent?.trim();
      const relatedTitle = document.querySelector('[data-related-title]')?.textContent?.trim();

      return { tocTitle, tocCount, relatedEyebrow, relatedTitle };
    });
    console.log(`[${baseUrl}] Post Page Audit [de]:`, postAuditDe);
    await page.screenshot({ path: `scripts/audit_screenshots/live_${targetPrefix}_post_de.png` });

    await context.close();
  }

  const fatalErrors = consoleErrors.filter(e => !e.includes('404') && !e.includes('Failed to load resource') && !e.includes('favicon'));
  console.log('\nFatal Console Errors:', fatalErrors);
  if (fatalErrors.length > 0) {
    console.error('Fatal errors encountered during live E2E verification!');
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('ALL LIVE PRODUCTION E2E VERIFICATIONS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
} finally {
  await browser.close();
}
