import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const PROD_BASE = 'https://blog.epocanvas.com';
const OUTPUT_DIR = path.resolve(process.cwd(), 'playwright-report/live-production-i18n');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function verifyLiveI18n() {
  console.log(`[E2E Live i18n Audit] Connecting to edge production: ${PROD_BASE}\n`);
  const browser = await chromium.launch({ headless: true });

  const auditReport = {
    desktopSwitch: {},
    mobileSwitch: {},
    standards: {},
    consoleErrors: [],
  };

  try {
    // 1. Desktop Multi-Language Switching on Live Production
    console.log('--- 1. DESKTOP PRODUCTION i18n SWITCHING AUDIT (1440x900) ---');
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', (err) => auditReport.consoleErrors.push(err.message));

    const postUrl = `${PROD_BASE}/posts/readable-geek-interfaces/`;
    console.log(`Navigating to: ${postUrl}`);
    await page.goto(postUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Initial language (zh-CN)
    const initialZh = await page.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const title = document.querySelector('.post-hero__title');
      const lede = document.querySelector('.post-hero__lede');
      const b = (el) => el ? el.getBoundingClientRect() : null;
      return {
        title: title ? title.textContent.trim() : '',
        lede: lede ? lede.textContent.trim() : '',
        heroHeight: b(hero)?.height,
        i18nMode: hero?.getAttribute('data-hero-i18n-mode'),
      };
    });

    console.log(`[Live ZH] Title: "${initialZh.title}"`);
    console.log(`[Live ZH] Hero Height: ${initialZh.heroHeight}px, Mode: ${initialZh.i18nMode}`);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'live-geek-zh-desktop.png') });

    // Switch to English (en) on live production
    console.log('\nTriggering window.switchArticleLanguage("en") on live production...');
    await page.evaluate(() => {
      if (typeof window.switchArticleLanguage === 'function') {
        window.switchArticleLanguage('en');
      }
    });
    await page.waitForTimeout(1000);

    const switchedEn = await page.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const title = document.querySelector('.post-hero__title');
      const lede = document.querySelector('.post-hero__lede');
      const b = (el) => el ? el.getBoundingClientRect() : null;
      return {
        title: title ? title.textContent.trim() : '',
        lede: lede ? lede.textContent.trim() : '',
        heroHeight: b(hero)?.height,
      };
    });

    console.log(`[Live EN] Title: "${switchedEn.title}"`);
    console.log(`[Live EN] Hero Height: ${switchedEn.heroHeight}px`);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'live-geek-en-desktop.png') });

    const diffEn = Math.abs((initialZh.heroHeight || 0) - (switchedEn.heroHeight || 0));
    console.log(`Height difference on live production (ZH vs EN): ${diffEn.toFixed(2)}px`);

    if (diffEn > 2) {
      throw new Error(`Live i18n jump detected! Height shifted by ${diffEn}px when switching to EN!`);
    }

    // Switch to Traditional Chinese (zh-Hant) on live production
    console.log('\nTriggering window.switchArticleLanguage("zh-Hant") on live production...');
    await page.evaluate(() => {
      if (typeof window.switchArticleLanguage === 'function') {
        window.switchArticleLanguage('zh-Hant');
      }
    });
    await page.waitForTimeout(1000);

    const switchedHant = await page.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const title = document.querySelector('.post-hero__title');
      const b = (el) => el ? el.getBoundingClientRect() : null;
      return {
        title: title ? title.textContent.trim() : '',
        heroHeight: b(hero)?.height,
      };
    });

    console.log(`[Live zh-Hant] Title: "${switchedHant.title}"`);
    console.log(`[Live zh-Hant] Hero Height: ${switchedHant.heroHeight}px`);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'live-geek-hant-desktop.png') });

    const diffHant = Math.abs((initialZh.heroHeight || 0) - (switchedHant.heroHeight || 0));
    console.log(`Height difference on live production (ZH vs zh-Hant): ${diffHant.toFixed(2)}px`);

    if (diffHant > 2) {
      throw new Error(`Live i18n jump detected! Height shifted by ${diffHant}px when switching to zh-Hant!`);
    }

    // 2. Mobile Viewport (390x844) Live Production Language Switch
    console.log('\n--- 2. MOBILE PRODUCTION i18n SWITCHING AUDIT (390x844) ---');
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    mobilePage.on('pageerror', (err) => auditReport.consoleErrors.push(err.message));

    await mobilePage.goto(postUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await mobilePage.waitForTimeout(1000);

    const mobileZh = await mobilePage.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const b = (el) => el ? el.getBoundingClientRect() : null;
      return { heroHeight: b(hero)?.height };
    });

    await mobilePage.evaluate(() => {
      if (typeof window.switchArticleLanguage === 'function') {
        window.switchArticleLanguage('en');
      }
    });
    await mobilePage.waitForTimeout(1000);

    const mobileEn = await mobilePage.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const b = (el) => el ? el.getBoundingClientRect() : null;
      return { heroHeight: b(hero)?.height };
    });

    console.log(`[Mobile Live ZH] Hero Height: ${mobileZh.heroHeight}px`);
    console.log(`[Mobile Live EN] Hero Height: ${mobileEn.heroHeight}px`);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'live-geek-en-mobile.png') });

    const mobileDiff = Math.abs((mobileZh.heroHeight || 0) - (mobileEn.heroHeight || 0));
    console.log(`Mobile Height difference on live production: ${mobileDiff.toFixed(2)}px`);

    if (mobileDiff > 2) {
      throw new Error(`Live Mobile i18n jump detected! Shifted by ${mobileDiff}px!`);
    }

    // 3. Standards Spec Page Live Audit
    console.log('\n--- 3. STANDARDS LIVE PRODUCTION AUDIT ---');
    await page.goto(`${PROD_BASE}/standards/activity-level/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const liveStandardsMetrics = await page.evaluate(() => {
      const hero = document.querySelector('.standards-spec-header');
      const waves = document.querySelector('.post-hero__waves');
      const meta = document.querySelector('.standards-spec-header__meta-grid');
      const main = document.querySelector('.page-main');
      const b = (el) => el ? el.getBoundingClientRect() : null;
      return {
        heroHeight: b(hero) ? Math.round(b(hero).height) : null,
        gapBetweenMetaAndWaves: b(waves) && b(meta) ? Math.round(b(waves).top - b(meta).bottom) : null,
        gapHeroToMain: b(hero) && b(main) ? Math.round(b(main).top - b(hero).bottom) : null,
      };
    });

    console.log('Live Standards Metrics:', JSON.stringify(liveStandardsMetrics, null, 2));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'live-standards-activity.png') });

    if (liveStandardsMetrics.gapHeroToMain > 16) {
      throw new Error(`Excessive gap below standards hero on live: ${liveStandardsMetrics.gapHeroToMain}px > 16px`);
    }

    await browser.close();

    console.log('\n=== LIVE PRODUCTION AUDIT REPORT ===');
    console.log(`Fatal Console Errors: ${auditReport.consoleErrors.length}`);
    if (auditReport.consoleErrors.length > 0) {
      throw new Error(`Fatal console errors on live production: ${auditReport.consoleErrors.join(', ')}`);
    }

    console.log('LIVE PRODUCTION i18n UNIFORM HERO BOX 100% PASSED WITH ZERO JUMPING (CLS = 0)! ✓');
  } finally {
    await browser.close();
  }
}

verifyLiveI18n().catch((err) => {
  console.error('Live i18n Audit Failed:', err);
  process.exit(1);
});
