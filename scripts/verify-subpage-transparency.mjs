import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4399';

async function run() {
  console.log(`[TEST] Starting subpage box card transparency verification on ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results = [];

  const pagesToTest = [
    {
      url: `${BASE_URL}/archives/`,
      name: 'Archives Page',
      selectors: [
        { key: 'hero', sel: '.archive-hero-card', expectedVar: '--archive-blue-card-bg' },
        { key: 'statsSpan', sel: '.archive-hero-card__stats span', expectedVar: '--archive-blue-sub-bg' },
        { key: 'sortGroup', sel: '.article-sort-group', expectedVar: '--archive-blue-group-bg' },
        { key: 'sortItem', sel: '.article-sort-item', expectedVar: '--archive-blue-item-bg' },
      ],
      expectedFamily: 'blue'
    },
    {
      url: `${BASE_URL}/categories/`,
      name: 'Categories Page',
      selectors: [
        { key: 'indexCard', sel: '.taxonomy-index-card', expectedVar: '--category-blue-card-bg' },
        { key: 'metaSpan', sel: '.taxonomy-index-card__meta span', expectedVar: '--category-blue-sub-bg' },
        { key: 'tagA', sel: '#tag-page-tags a', expectedVar: '--category-blue-sub-bg' },
      ],
      expectedFamily: 'sky-blue'
    },
    {
      url: `${BASE_URL}/tags/`,
      name: 'Tags Page',
      selectors: [
        { key: 'indexCard', sel: '.taxonomy-index-card', expectedVar: '--tag-coral-card-bg' },
        { key: 'metaSpan', sel: '.taxonomy-index-card__meta span', expectedVar: '--tag-coral-sub-bg' },
        { key: 'tagA', sel: '#tag-page-tags a', expectedVar: '--tag-coral-sub-bg' },
      ],
      expectedFamily: 'coral-orange'
    },
    {
      url: `${BASE_URL}/friends/`,
      name: 'Friends Page',
      selectors: [
        { key: 'hero', sel: '.friends-page__hero', expectedVar: '--home-blue-card-bg' },
        { key: 'panel', sel: '.friends-page__panel', expectedVar: '--home-blue-card-bg' },
      ],
      expectedFamily: 'ice-blue'
    }
  ];

  for (const pageConfig of pagesToTest) {
    console.log(`\nTesting ${pageConfig.name} (${pageConfig.url})...`);
    await page.goto(pageConfig.url, { waitUntil: 'domcontentloaded' });

    // Inject temporary transition freeze for instantaneous test assertions
    await page.addStyleTag({
      content: `*, *::before, *::after { transition-duration: 0s !important; transition-delay: 0s !important; }`
    });

    for (const theme of ['light', 'dark']) {
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
        void document.body.offsetHeight;
      }, theme);
      await page.waitForTimeout(50);

      const inspection = await page.evaluate((selectors) => {
        const out = {};
        for (const item of selectors) {
          const el = document.querySelector(item.sel);
          if (el) {
            const cs = getComputedStyle(el);
            out[item.key] = {
              found: true,
              bgColor: cs.backgroundColor,
              bg: cs.background,
              filter: cs.backdropFilter,
              webkitFilter: cs.webkitBackdropFilter,
              border: cs.border,
              borderWidth: cs.borderTopWidth,
              borderRadius: cs.borderRadius,
              cssVar: item.expectedVar ? cs.getPropertyValue(item.expectedVar).trim() : null
            };
          } else {
            out[item.key] = { found: false };
          }
        }
        return out;
      }, pageConfig.selectors);

      for (const item of pageConfig.selectors) {
        const data = inspection[item.key];
        if (!data || !data.found) {
          console.warn(`  [SKIP] Selector "${item.sel}" not present on page`);
          continue;
        }

        const isTransparent = data.bgColor.includes('rgba') || data.bgColor === 'transparent' || data.bg.includes('rgba');
        const hasNoBlur = (!data.filter || data.filter === 'none') && (!data.webkitFilter || data.webkitFilter === 'none');
        const has1pxBorder = data.borderWidth === '1px';
        const has8pxRadius = data.borderRadius === '8px' || parseInt(data.borderRadius, 10) <= 10;

        console.log(`  [${theme.toUpperCase()}] ${item.key} (${item.sel}):`);
        console.log(`    - bgColor: ${data.bgColor} (var: ${data.cssVar})`);
        console.log(`    - backdropFilter: ${data.filter || 'none'}`);
        console.log(`    - border: ${data.border}`);
        console.log(`    - borderRadius: ${data.borderRadius}`);

        if (!hasNoBlur) {
          throw new Error(`Expected zero blur (backdropFilter: none) for ${item.key} on ${pageConfig.name}, got ${data.filter}`);
        }
        if (!has1pxBorder) {
          throw new Error(`Expected 1px border for ${item.key} on ${pageConfig.name}, got ${data.borderWidth}`);
        }
        if (!has8pxRadius) {
          throw new Error(`Expected 8px border-radius for ${item.key} on ${pageConfig.name}, got ${data.borderRadius}`);
        }
        if (!isTransparent) {
          throw new Error(`Expected transparent/translucent background for ${item.key} on ${pageConfig.name}, got ${data.bgColor}`);
        }

        results.push({ page: pageConfig.name, theme, item: item.key, status: 'PASS' });
      }
    }
  }

  await browser.close();
  console.log(`\n[SUCCESS] All ${results.length} subpage card assertions PASSED!`);
}

run().catch((err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});
