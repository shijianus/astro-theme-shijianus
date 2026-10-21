import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const PROD_BASE = 'https://blog.epocanvas.com';
const OUTPUT_DIR = path.resolve(process.cwd(), 'playwright-report/live-production');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const routesToTest = [
  { path: '/standards/activity-level/', name: 'live-standards-activity-level' },
  { path: '/standards/content-density/', name: 'live-standards-content-density' },
  { path: '/standards/', name: 'live-standards-index' },
  { path: '/status/', name: 'live-status' },
  { path: '/version/', name: 'live-version' },
  { path: '/posts/readable-geek-interfaces/', name: 'live-post-geek' },
  { path: '/posts/content-formats-and-markup-mastery/', name: 'live-post-formats' },
];

async function verifyLiveProduction() {
  console.log(`[E2E Live Audit] Connecting to Cloudflare Pages edge: ${PROD_BASE}`);
  const browser = await chromium.launch({ headless: true });

  const auditSummary = {
    desktop: [],
    mobile: [],
    consoleErrors: [],
  };

  try {
    // 1. Desktop Audit (1440x900)
    console.log('\n--- 1. DESKTOP PRODUCTION AUDIT (1440x900) ---');
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    desktopPage.on('pageerror', (err) => {
      console.error(`[Browser PageError]:`, err.message);
      auditSummary.consoleErrors.push(err.message);
    });

    for (const item of routesToTest) {
      const url = `${PROD_BASE}${item.path}`;
      console.log(`Visiting: ${url}`);
      await desktopPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await desktopPage.waitForTimeout(1000);

      const metrics = await desktopPage.evaluate(() => {
        const hero = document.querySelector('.page-shell__hero');
        const metaGrid = document.querySelector('.standards-spec-header__meta-grid') || document.querySelector('.post-hero__meta-grid');
        const waves = document.querySelector('.post-hero__waves');
        const contentInner = document.querySelector('#content-inner');
        const pageMain = document.querySelector('.page-main');

        const b = (el) => el ? el.getBoundingClientRect() : null;
        const heroBox = b(hero);
        const metaBox = b(metaGrid);
        const wavesBox = b(waves);
        const contentBox = b(contentInner);
        const mainBox = b(pageMain);

        return {
          heroHeight: heroBox ? Math.round(heroBox.height) : 0,
          heroBottom: heroBox ? Math.round(heroBox.bottom) : 0,
          metaBottom: metaBox ? Math.round(metaBox.bottom) : 0,
          wavesTop: wavesBox ? Math.round(wavesBox.top) : 0,
          gapBetweenMetaAndWaves: wavesBox && metaBox ? Math.round(wavesBox.top - metaBox.bottom) : null,
          mainTop: mainBox ? Math.round(mainBox.top) : 0,
          gapHeroToMain: heroBox && mainBox ? Math.round(mainBox.top - heroBox.bottom) : 0,
        };
      });

      console.log(`[Live Desktop] ${item.name}:`, JSON.stringify(metrics));
      auditSummary.desktop.push({ name: item.name, metrics });

      await desktopPage.screenshot({ path: path.join(OUTPUT_DIR, `${item.name}-desktop.png`) });

      // Verifications
      if (metrics.gapBetweenMetaAndWaves !== null && metrics.gapBetweenMetaAndWaves > 20) {
        throw new Error(`Excessive gap between meta and waves on live ${item.name}: ${metrics.gapBetweenMetaAndWaves}px > 20px`);
      }
      if (metrics.gapHeroToMain > 16) {
        throw new Error(`Excessive gap below hero on live ${item.name}: ${metrics.gapHeroToMain}px > 16px`);
      }
    }

    // 2. Mobile Audit (390x844)
    console.log('\n--- 2. MOBILE PRODUCTION AUDIT (390x844) ---');
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    mobilePage.on('pageerror', (err) => {
      console.error(`[Browser PageError Mobile]:`, err.message);
      auditSummary.consoleErrors.push(err.message);
    });

    for (const item of routesToTest) {
      const url = `${PROD_BASE}${item.path}`;
      await mobilePage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await mobilePage.waitForTimeout(1000);

      const metrics = await mobilePage.evaluate(() => {
        const hero = document.querySelector('.page-shell__hero');
        const title = document.querySelector('.post-hero__title');
        const main = document.querySelector('.page-main');
        const b = (el) => el ? el.getBoundingClientRect() : null;

        const heroBox = b(hero);
        const titleBox = b(title);
        const mainBox = b(main);

        return {
          heroHeight: heroBox ? Math.round(heroBox.height) : 0,
          titleTop: titleBox ? Math.round(titleBox.top) : 0,
          gapHeroToMain: heroBox && mainBox ? Math.round(mainBox.top - heroBox.bottom) : 0,
        };
      });

      console.log(`[Live Mobile] ${item.name}:`, JSON.stringify(metrics));
      auditSummary.mobile.push({ name: item.name, metrics });

      await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, `${item.name}-mobile.png`) });

      if (metrics.titleTop < 60) {
        throw new Error(`Title obscured by nav on live mobile ${item.name}: ${metrics.titleTop}px < 60px`);
      }
      if (metrics.gapHeroToMain > 16) {
        throw new Error(`Excessive gap below hero on live mobile ${item.name}: ${metrics.gapHeroToMain}px > 16px`);
      }
    }

    console.log('\n=== LIVE PRODUCTION AUDIT SUMMARY ===');
    console.log(`Total Desktop routes tested: ${auditSummary.desktop.length}`);
    console.log(`Total Mobile routes tested: ${auditSummary.mobile.length}`);
    console.log(`Fatal Console Errors: ${auditSummary.consoleErrors.length}`);

    if (auditSummary.consoleErrors.length > 0) {
      throw new Error(`Live production audit encountered fatal errors: ${auditSummary.consoleErrors.join(', ')}`);
    }

    console.log('LIVE PRODUCTION VERIFICATION 100% PASSED WITH ZERO EXCESSIVE WHITESPACE! ✓');
  } finally {
    await browser.close();
  }
}

verifyLiveProduction().catch((err) => {
  console.error('Live Production Audit Failed:', err);
  process.exit(1);
});
