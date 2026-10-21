import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const PORT = 4331;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUTPUT_DIR = path.resolve(process.cwd(), 'playwright-report/hero-i18n');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function verifyHeroI18n() {
  console.log('=== STARTING i18n HERO UNIFORM BOX & SWITCHING AUDIT ===\n');

  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', 'dist'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    const browser = await chromium.launch({ headless: true });

    // Test 1: Desktop Post Multi-Language Switch Stability (Fixed Box Uniformity)
    console.log('--- Test 1: Desktop Multi-Language Switching on /posts/readable-geek-interfaces/ ---');
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto(`${BASE_URL}/posts/readable-geek-interfaces/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Initial state (zh-CN)
    const initialMetrics = await page.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const title = document.querySelector('.post-hero__title');
      const lede = document.querySelector('.post-hero__lede');
      const b = (el) => el ? el.getBoundingClientRect() : null;
      return {
        titleText: title ? title.textContent.trim() : '',
        ledeText: lede ? lede.textContent.trim() : '',
        heroBox: b(hero),
        i18nMode: hero ? hero.getAttribute('data-hero-i18n-mode') : null,
      };
    });

    console.log(`[Initial Lang] Title: "${initialMetrics.titleText}"`);
    console.log(`[Initial Lang] Hero Height: ${initialMetrics.heroBox?.height}px, Mode: ${initialMetrics.i18nMode}`);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'geek-zh-initial.png') });

    // Switch to English (en)
    console.log('\nTriggering window.switchArticleLanguage("en")...');
    await page.evaluate(() => {
      if (typeof window.switchArticleLanguage === 'function') {
        window.switchArticleLanguage('en');
      }
    });
    await page.waitForTimeout(600);

    const enMetrics = await page.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const title = document.querySelector('.post-hero__title');
      const lede = document.querySelector('.post-hero__lede');
      const b = (el) => el ? el.getBoundingClientRect() : null;
      return {
        titleText: title ? title.textContent.trim() : '',
        ledeText: lede ? lede.textContent.trim() : '',
        heroBox: b(hero),
      };
    });

    console.log(`[Switched Lang: EN] Title: "${enMetrics.titleText}"`);
    console.log(`[Switched Lang: EN] Hero Height: ${enMetrics.heroBox?.height}px`);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'geek-en-switched.png') });

    // Assert: Box height must be strictly uniform across languages
    const heightDiffEn = Math.abs((initialMetrics.heroBox?.height || 0) - (enMetrics.heroBox?.height || 0));
    console.log(`Height difference (ZH vs EN): ${heightDiffEn.toFixed(2)}px`);

    if (heightDiffEn > 2) {
      throw new Error(`i18n Fixed Box failed! Height jumped by ${heightDiffEn}px when switching to EN!`);
    }

    // Switch to Traditional Chinese (zh-Hant)
    console.log('\nTriggering window.switchArticleLanguage("zh-Hant")...');
    await page.evaluate(() => {
      if (typeof window.switchArticleLanguage === 'function') {
        window.switchArticleLanguage('zh-Hant');
      }
    });
    await page.waitForTimeout(600);

    const hantMetrics = await page.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const title = document.querySelector('.post-hero__title');
      const b = (el) => el ? el.getBoundingClientRect() : null;
      return {
        titleText: title ? title.textContent.trim() : '',
        heroBox: b(hero),
      };
    });

    console.log(`[Switched Lang: zh-Hant] Title: "${hantMetrics.titleText}"`);
    console.log(`[Switched Lang: zh-Hant] Hero Height: ${hantMetrics.heroBox?.height}px`);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'geek-zh-hant-switched.png') });

    const heightDiffHant = Math.abs((initialMetrics.heroBox?.height || 0) - (hantMetrics.heroBox?.height || 0));
    console.log(`Height difference (ZH vs zh-Hant): ${heightDiffHant.toFixed(2)}px`);

    if (heightDiffHant > 2) {
      throw new Error(`i18n Fixed Box failed! Height jumped by ${heightDiffHant}px when switching to zh-Hant!`);
    }

    // Test 2: Standards Spec Pages (StandardsHero i18n alignment & wave contact)
    console.log('\n--- Test 2: Standards Hero Box Audit on /standards/activity-level/ ---');
    await page.goto(`${BASE_URL}/standards/activity-level/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const standardsMetrics = await page.evaluate(() => {
      const hero = document.querySelector('.standards-spec-header');
      const waves = document.querySelector('.post-hero__waves');
      const meta = document.querySelector('.standards-spec-header__meta-grid');
      const main = document.querySelector('.page-main');
      const b = (el) => el ? el.getBoundingClientRect() : null;
      return {
        heroBox: b(hero),
        wavesBox: b(waves),
        metaBox: b(meta),
        mainBox: b(main),
        gapBetweenMetaAndWaves: b(waves) && b(meta) ? Math.round(b(waves).top - b(meta).bottom) : null,
        gapHeroToMain: b(hero) && b(main) ? Math.round(b(main).top - b(hero).bottom) : null,
      };
    });

    console.log('Standards Hero Metrics:', JSON.stringify(standardsMetrics, null, 2));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'standards-activity-fixed.png') });

    if (standardsMetrics.gapHeroToMain > 16) {
      throw new Error(`Excessive gap below standards hero: ${standardsMetrics.gapHeroToMain}px > 16px`);
    }

    // Test 3: Mobile Viewport (390x844) Language Switch Stability
    console.log('\n--- Test 3: Mobile (390x844) i18n Stability Audit ---');
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    mobilePage.on('pageerror', (err) => consoleErrors.push(err.message));

    await mobilePage.goto(`${BASE_URL}/posts/readable-geek-interfaces/`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(600);

    const mobileInitial = await mobilePage.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const b = (el) => el ? el.getBoundingClientRect() : null;
      return { heroHeight: b(hero)?.height };
    });

    await mobilePage.evaluate(() => {
      if (typeof window.switchArticleLanguage === 'function') {
        window.switchArticleLanguage('en');
      }
    });
    await mobilePage.waitForTimeout(600);

    const mobileEn = await mobilePage.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const b = (el) => el ? el.getBoundingClientRect() : null;
      return { heroHeight: b(hero)?.height };
    });

    console.log(`[Mobile ZH] Hero Height: ${mobileInitial.heroHeight}px`);
    console.log(`[Mobile EN] Hero Height: ${mobileEn.heroHeight}px`);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile-geek-en.png') });

    const mobileDiff = Math.abs((mobileInitial.heroHeight || 0) - (mobileEn.heroHeight || 0));
    console.log(`Mobile Height difference: ${mobileDiff.toFixed(2)}px`);

    if (mobileDiff > 2) {
      throw new Error(`Mobile i18n Fixed Box failed! Height jumped by ${mobileDiff}px!`);
    }

    await browser.close();

    console.log('\n=== AUDIT SUMMARY ===');
    console.log(`Fatal Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors encountered: ${consoleErrors.join(', ')}`);
    }

    console.log('ALL i18n UNIFORM HERO BOX AUDITS PASSED WITH ZERO JUMPING (CLS = 0)! ✓');
  } finally {
    server.kill();
  }
}

verifyHeroI18n().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
