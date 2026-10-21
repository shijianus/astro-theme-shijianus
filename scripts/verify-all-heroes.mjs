import { chromium } from 'playwright';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 4329;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUTPUT_DIR = path.resolve(process.cwd(), 'playwright-report/hero-verification');

import fs from 'fs';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function verifyAll() {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', 'dist'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    const browser = await chromium.launch({ headless: true });
    
    const pagesToTest = [
      { url: `${BASE_URL}/standards/activity-level/`, name: 'standards-activity-level' },
      { url: `${BASE_URL}/standards/content-density/`, name: 'standards-content-density' },
      { url: `${BASE_URL}/standards/`, name: 'standards-index' },
      { url: `${BASE_URL}/status/`, name: 'status' },
      { url: `${BASE_URL}/version/`, name: 'version' },
      { url: `${BASE_URL}/posts/readable-geek-interfaces/`, name: 'post-geek' },
      { url: `${BASE_URL}/posts/content-formats-and-markup-mastery/`, name: 'post-formats' },
    ];

    console.log('=== DESKTOP HERO AUDIT (1440x900) ===');
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    for (const item of pagesToTest) {
      await desktopPage.goto(item.url, { waitUntil: 'domcontentloaded' });
      await desktopPage.waitForTimeout(500);

      const metrics = await desktopPage.evaluate(() => {
        const hero = document.querySelector('.page-shell__hero');
        const specHeader = document.querySelector('.standards-spec-header') || document.querySelector('.post-hero');
        const inner = document.querySelector('.post-hero__inner');
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
          wavesHeight: wavesBox ? Math.round(wavesBox.height) : 0,
          gapBetweenMetaAndWaves: wavesBox && metaBox ? Math.round(wavesBox.top - metaBox.bottom) : null,
          contentTop: contentBox ? Math.round(contentBox.top) : 0,
          mainTop: mainBox ? Math.round(mainBox.top) : 0,
          gapHeroToMain: heroBox && mainBox ? Math.round(mainBox.top - heroBox.bottom) : 0,
        };
      });

      console.log(`[Desktop] ${item.name}:`, JSON.stringify(metrics));
      await desktopPage.screenshot({ path: path.join(OUTPUT_DIR, `${item.name}-desktop.png`) });

      // Assertions
      if (metrics.gapBetweenMetaAndWaves !== null && metrics.gapBetweenMetaAndWaves > 20) {
        throw new Error(`Excessive gap between meta and waves on ${item.name}: ${metrics.gapBetweenMetaAndWaves}px > 20px`);
      }
      if (metrics.gapHeroToMain > 16) {
        throw new Error(`Excessive gap below hero on ${item.name}: ${metrics.gapHeroToMain}px > 16px`);
      }
    }

    console.log('\n=== MOBILE HERO AUDIT (390x844) ===');
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });

    for (const item of pagesToTest) {
      await mobilePage.goto(item.url, { waitUntil: 'domcontentloaded' });
      await mobilePage.waitForTimeout(500);

      const metrics = await mobilePage.evaluate(() => {
        const hero = document.querySelector('.page-shell__hero');
        const title = document.querySelector('.post-hero__title');
        const metaGrid = document.querySelector('.standards-spec-header__meta-grid') || document.querySelector('.post-hero__meta-grid');
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

      console.log(`[Mobile] ${item.name}:`, JSON.stringify(metrics));
      await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, `${item.name}-mobile.png`) });

      if (metrics.titleTop < 60) {
        throw new Error(`Title obscured by nav on ${item.name}: ${metrics.titleTop}px < 60px`);
      }
      if (metrics.gapHeroToMain > 16) {
        throw new Error(`Excessive gap below hero on mobile ${item.name}: ${metrics.gapHeroToMain}px > 16px`);
      }
    }

    await browser.close();
    console.log('\nALL HERO AUDITS PASSED WITH ZERO EXCESSIVE WHITESPACE! ✓');
  } finally {
    server.kill();
  }
}

verifyAll().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
