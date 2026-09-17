import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:4321';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'verification-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const EXPECTED_LABELS = {
  chat: {
    'en': {
      title: 'Live Dialogue Stream Simulation',
      badge: 'Scroll-in Animation',
      replay: '↺ Replay',
      sound: 'Sound enabled',
    },
    'es': {
      title: 'Simulación de Diálogo en Vivo',
      badge: 'Animación al Desplazarse',
      replay: '↺ Reproducir',
      sound: 'Efectos de sonido activados',
    },
    'de': {
      title: 'Echtzeit-Dialogsimulation',
      badge: 'Scroll-in-Animation',
      replay: '↺ Wiederholen',
      sound: 'Soundeffekte aktiviert',
    },
    'fr': {
      title: 'Simulation de Dialogue en Direct',
      badge: 'Animation au Défilement',
      replay: '↺ Rejouer',
      sound: 'Effets sonores activés',
    },
    'zh-Hant': {
      title: '即時對話模擬流',
      badge: '首次滑入動效',
      replay: '↺ 重播',
      sound: '音效開啟中',
    },
  },
  code: {
    'en': { copy: 'Copy' },
    'es': { copy: 'Copiar' },
    'de': { copy: 'Kopieren' },
    'fr': { copy: 'Copier' },
    'zh-Hant': { copy: '複製' },
  },
  taskTracker: {
    'en': { pending: 'Progress', completedSnippet: 'steps completed' },
    'es': { pending: 'Progreso', completedSnippet: 'pasos completados' },
    'de': { pending: 'Fortschritt', completedSnippet: 'Schritte abgeschlossen' },
    'fr': { pending: 'Progression', completedSnippet: 'étapes terminées' },
    'zh-Hant': { pending: '目前進度', completedSnippet: '步驟已完成' },
  },
};

const hasChinese = (str) => /[\u4e00-\u9fa5]/.test(str);

async function runAudit() {
  console.log(`\n======================================================`);
  console.log(`[E2E Audit] Starting Universal Multi-Article i18n Audit`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  let passedAssertions = 0;
  let failedAssertions = 0;

  function assert(condition, message) {
    if (condition) {
      passedAssertions++;
      console.log(`  ✅ [PASS] ${message}`);
    } else {
      failedAssertions++;
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: example-embeds across all 5 non-zh-CN languages
    // -------------------------------------------------------------
    console.log(`\n--- Test Group 1: example-embeds (Animated Chat Dialogue) ---`);
    for (const [lang, exp] of Object.entries(EXPECTED_LABELS.chat)) {
      const url = `${BASE_URL}/posts/example-embeds-${lang.toLowerCase()}/`;
      console.log(`\nAuditing URL: ${url}`);
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      assert(resp.status() === 200, `Page HTTP status is 200 for ${lang}`);

      // Wait for content feature enhancer initialization
      await page.waitForSelector('.article-chat', { timeout: 8000 });
      // Scroll into view to trigger animation
      await page.locator('.article-chat').scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);

      // Verify chat header bar exists
      const headerBar = page.locator('.article-chat .chat-header-bar').first();
      await headerBar.waitFor({ state: 'visible', timeout: 5000 });

      const title = (await page.locator('.article-chat .chat-header-title').first().textContent()).trim();
      assert(title === exp.title, `[${lang}] Chat title: "${title}" === "${exp.title}"`);
      if (lang !== 'zh-Hant') {
        assert(!hasChinese(title), `[${lang}] Chat title has ZERO residual Chinese`);
      }

      const badge = (await page.locator('.article-chat .chat-header-badge').first().textContent()).trim();
      assert(badge === exp.badge, `[${lang}] Chat badge: "${badge}" === "${exp.badge}"`);
      if (lang !== 'zh-Hant') {
        assert(!hasChinese(badge), `[${lang}] Chat badge has ZERO residual Chinese`);
      }

      const replay = (await page.locator('.article-chat .chat-replay-btn').first().textContent()).trim();
      assert(replay === exp.replay, `[${lang}] Chat replay button: "${replay}" === "${exp.replay}"`);
      if (lang !== 'zh-Hant') {
        assert(!hasChinese(replay), `[${lang}] Chat replay button has ZERO residual Chinese`);
      }

      const soundBtn = page.locator('.article-chat .chat-sound-toggle').first();
      const soundTitle = await soundBtn.getAttribute('title');
      assert(soundTitle && soundTitle.includes(exp.sound), `[${lang}] Sound toggle title matches "${exp.sound}"`);

      // Verify sibling language alternate links and JSON metadata
      const alternates = await page.locator('link[rel="alternate"][hreflang]').count();
      assert(alternates >= 5, `[${lang}] Alternate links present all sibling variants (count: ${alternates})`);
      const i18nData = await page.evaluate(() => {
        const el = document.getElementById('shijianus-article-i18n-data');
        return el ? JSON.parse(el.textContent || '{}') : null;
      });
      assert(i18nData && Object.keys(i18nData.translations || {}).length >= 5, `[${lang}] Sibling translations JSON contains 5+ variants`);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `universal_embeds_${lang}.png`),
      });
    }

    // -------------------------------------------------------------
    // Test 2: example-code-enhancements across all languages
    // -------------------------------------------------------------
    console.log(`\n--- Test Group 2: example-code-enhancements (Code Buttons & Traffic Lights) ---`);
    for (const [lang, exp] of Object.entries(EXPECTED_LABELS.code)) {
      const url = `${BASE_URL}/posts/example-code-enhancements-${lang.toLowerCase()}/`;
      console.log(`\nAuditing URL: ${url}`);
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      assert(resp.status() === 200, `Page HTTP status is 200 for ${lang}`);

      await page.waitForSelector('.code-copy-button', { timeout: 8000 });
      const copyBtn = page.locator('.code-copy-button').first();
      const copyText = (await copyBtn.textContent()).trim();
      const copyTitle = await copyBtn.getAttribute('title') || '';
      const copyLabel = copyText || copyTitle;

      assert(copyLabel.toLowerCase().includes(exp.copy.toLowerCase()), `[${lang}] Copy button label "${copyLabel}" includes "${exp.copy}"`);
      if (lang !== 'zh-Hant') {
        assert(!hasChinese(copyLabel), `[${lang}] Copy button has ZERO residual Chinese`);
      }

      // Check mac traffic lights & toolbar
      const macBar = await page.locator('.code-block-toolbar, .code-block-lights').count();
      assert(macBar > 0, `[${lang}] Code block toolbar and traffic lights are present (count: ${macBar})`);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `universal_code_${lang}.png`),
      });
    }

    // -------------------------------------------------------------
    // Test 3: example-tabs (Tab Switching & Text Integrity)
    // -------------------------------------------------------------
    console.log(`\n--- Test Group 3: example-tabs (Tabs & Sibling Links) ---`);
    for (const lang of ['en', 'fr', 'es', 'de']) {
      const url = `${BASE_URL}/posts/example-tabs-${lang}/`;
      console.log(`\nAuditing URL: ${url}`);
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      assert(resp.status() === 200, `Tabs page status is 200 for ${lang}`);

      const tabCount = await page.locator('.article-tabs__button').count();
      assert(tabCount > 0, `[${lang}] Tabs rendered properly (count: ${tabCount})`);

      const tabText = await page.locator('.article-tabs__button').allTextContents();
      const fullTabString = tabText.join(' ');
      assert(!hasChinese(fullTabString), `[${lang}] Tabs contain ZERO residual Chinese: "${fullTabString}"`);
    }

    // -------------------------------------------------------------
    // Test 4: example-details-collapse (Details Accordion)
    // -------------------------------------------------------------
    console.log(`\n--- Test Group 4: example-details-collapse (Details & Accordions) ---`);
    for (const lang of ['en', 'fr', 'es', 'de']) {
      const url = `${BASE_URL}/posts/example-details-collapse-${lang}/`;
      console.log(`\nAuditing URL: ${url}`);
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      assert(resp.status() === 200, `Details page status is 200 for ${lang}`);

      const detailsCount = await page.locator('details.article-details, details.article-accordion').count();
      assert(detailsCount > 0, `[${lang}] Details/Accordions rendered (count: ${detailsCount})`);

      // Test accordion toggle interactivity
      const firstAccordion = page.locator('details.article-details, details.article-accordion').first();
      const initialOpen = await firstAccordion.getAttribute('open');
      const firstSummary = firstAccordion.locator('summary').first();
      await firstSummary.click();
      await page.waitForTimeout(300);
      const toggledOpen = await firstAccordion.getAttribute('open');
      assert(initialOpen !== toggledOpen, `[${lang}] Details accordion toggled successfully (was: ${initialOpen !== null}, now: ${toggledOpen !== null})`);

      // Verify zero Chinese in summaries
      const summaryTexts = await page.locator('details.article-details summary, details.article-accordion summary').allTextContents();
      const allSummaries = summaryTexts.join(' ');
      assert(!hasChinese(allSummaries), `[${lang}] Details summaries have ZERO residual Chinese: "${allSummaries}"`);
    }

    // -------------------------------------------------------------
    // Test 5: content-formats-and-markup-mastery (Task Tracker & Status Card)
    // -------------------------------------------------------------
    console.log(`\n--- Test Group 5: content-formats-and-markup-mastery (Task Tracker & Status) ---`);
    for (const [lang, exp] of Object.entries(EXPECTED_LABELS.taskTracker)) {
      const url = `${BASE_URL}/posts/content-formats-and-markup-mastery-${lang.toLowerCase()}/`;
      console.log(`\nAuditing URL: ${url}`);
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      assert(resp.status() === 200, `Markup mastery status is 200 for ${lang}`);

      await page.waitForSelector('.task-tracker__status-card', { timeout: 8000 });
      const statusCard = page.locator('.task-tracker__status-card').first();
      const statusText = (await statusCard.textContent()).trim();
      assert(statusText.toLowerCase().includes(exp.pending.toLowerCase()), `[${lang}] Task tracker status text "${statusText.slice(0, 40)}..." contains "${exp.pending}"`);
      if (lang !== 'zh-Hant') {
        assert(!hasChinese(statusText), `[${lang}] Task tracker status text has ZERO residual Chinese`);
      }

      const countLabel = (await page.locator('.task-tracker__count').first().textContent()).trim();
      assert(countLabel.toLowerCase().includes(exp.completedSnippet.toLowerCase()), `[${lang}] Progress count "${countLabel}" contains "${exp.completedSnippet}"`);
      if (lang !== 'zh-Hant') {
        assert(!hasChinese(countLabel), `[${lang}] Progress count has ZERO residual Chinese`);
      }
    }

    // -------------------------------------------------------------
    // Test 6: Dynamic Locale Change Event Reactivity (without page reload)
    // -------------------------------------------------------------
    console.log(`\n--- Test Group 6: Dynamic Event Reactivity (shijianus:localechange) ---`);
    await page.goto(`${BASE_URL}/posts/example-embeds/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.article-chat', { timeout: 8000 });
    await page.locator('.article-chat').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    // Initial is zh-CN
    let title = (await page.locator('.article-chat .chat-header-title').first().textContent()).trim();
    assert(title === '实时对话模拟流', `Initial chat title is zh-CN: "${title}"`);

    // Dispatch shijianus:localechange with detail: 'en'
    console.log(`Dispatching shijianus:localechange ('en')...`);
    await page.evaluate(() => {
      window.localStorage.setItem('shijianus-manual-locale-selected', 'en');
      window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: 'en' }));
    });
    await page.waitForTimeout(400);

    // Verify in-place re-localization without page reload!
    title = (await page.locator('.article-chat .chat-header-title').first().textContent()).trim();
    assert(title === 'Live Dialogue Stream Simulation', `Dynamically re-localized chat title to en: "${title}"`);
    assert(!hasChinese(title), `Dynamically re-localized chat title has ZERO Chinese residue`);

    // Clear localStorage before testing code copy button dynamic re-localization
    await page.evaluate(() => {
      window.localStorage.clear();
    });

    // Now test code copy button dynamic re-localization on example-code-enhancements
    await page.goto(`${BASE_URL}/posts/example-code-enhancements/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.code-copy-button', { timeout: 8000 });

    let copyBtnText = (await page.locator('.code-copy-button').first().textContent()).trim();
    assert(copyBtnText === '复制', `Initial code copy button is zh-CN: "${copyBtnText}"`);

    await page.evaluate(() => {
      window.localStorage.setItem('shijianus-manual-locale-selected', 'en');
      window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: 'en' }));
    });
    await page.waitForTimeout(400);

    copyBtnText = (await page.locator('.code-copy-button').first().textContent()).trim();
    assert(copyBtnText.toLowerCase().includes('copy'), `Dynamically re-localized code copy button to en: "${copyBtnText}"`);
    assert(!hasChinese(copyBtnText), `Dynamically re-localized copy button has ZERO Chinese residue`);

    // -------------------------------------------------------------
    // Test 7: Universal Cross-Article Coverage (All 10 Showcase Posts × All Variants)
    // -------------------------------------------------------------
    console.log(`\n--- Test Group 7: Universal Zero 404 & All 10 Showcase Posts Coverage ---`);
    const ALL_SHOWCASE = [
      'access-control-lab',
      'api-ready-theme-contracts',
      'badges-guide',
      'content-formats-and-markup-mastery',
      'example-all-special-formats',
      'example-code-enhancements',
      'example-details-collapse',
      'example-embeds',
      'example-tabs',
      'hello-world',
    ];
    const VARIANTS = ['en', 'es', 'de', 'fr', 'zh-hant'];

    for (const post of ALL_SHOWCASE) {
      for (const v of VARIANTS) {
        const postUrl = `${BASE_URL}/posts/${post}-${v}/`;
        const resp = await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        assert(resp.status() === 200, `[Universal 200 OK] ${post}-${v} returned status 200`);

        const hasArticle = await page.locator('article.article-body, article.post-content, #article-container').count();
        assert(hasArticle > 0, `[Content Rendered] ${post}-${v} contains article content container`);
      }
    }

  } finally {
    await browser.close();
  }

  console.log(`\n======================================================`);
  console.log(`[E2E Audit Summary] Passed: ${passedAssertions}, Failed: ${failedAssertions}`);
  console.log(`======================================================\n`);

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('[E2E Audit Fatal Error]:', err);
  process.exit(1);
});
