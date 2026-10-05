import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const lightResults = await page.evaluate(() => {
    function getCleanStyle(el) {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        background: s.background,
        backgroundColor: s.backgroundColor,
        backgroundImage: s.backgroundImage,
        backdropFilter: s.backdropFilter,
        border: s.border,
        boxShadow: s.boxShadow,
      };
    }

    return {
      footerWrap: getCleanStyle(document.querySelector('#footer-wrap')),
      overviewCard: getCleanStyle(document.querySelector('.card-widget.card-feature-panel.card-feature-panel--overview.card-tag-cloud-panel.is-sticky-active')),
      postCardInner: getCleanStyle(document.querySelector('.recent-post-item .p-3.sm\\:p-3\\.5')),
      homePagination: getCleanStyle(document.querySelector('#home-pagination')),
      randomBanner: getCleanStyle(document.querySelector('#random-banner')),
    };
  });

  console.log('--- LIGHT MODE ---');
  console.log(JSON.stringify(lightResults, null, 2));

  const darkResults = await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    function getCleanStyle(el) {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        background: s.background,
        backgroundColor: s.backgroundColor,
        backgroundImage: s.backgroundImage,
        backdropFilter: s.backdropFilter,
        border: s.border,
        boxShadow: s.boxShadow,
      };
    }

    const paginationEl = document.querySelector('#home-pagination');
    if (paginationEl) paginationEl.classList.add('theme-card');

    return {
      footerWrap: getCleanStyle(document.querySelector('#footer-wrap')),
      overviewCard: getCleanStyle(document.querySelector('.card-widget.card-feature-panel.card-feature-panel--overview.card-tag-cloud-panel.is-sticky-active')),
      postCardInner: getCleanStyle(document.querySelector('.recent-post-item .p-3.sm\\:p-3\\.5')),
      homePaginationWithThemeCard: getCleanStyle(document.querySelector('#home-pagination')),
      homePaginationBadge: getCleanStyle(document.querySelector('.home-pagination__badge')),
      randomBanner: getCleanStyle(document.querySelector('#random-banner')),
    };
  });

  console.log('--- DARK MODE & THEME-CARD PAGINATION ---');
  console.log(JSON.stringify(darkResults, null, 2));

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
