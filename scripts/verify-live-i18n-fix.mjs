import { chromium } from 'playwright';

const LIVE_TARGETS = [
  'https://9f40e8ed.shijianus-blog.pages.dev',
  'https://blog.epocanvas.com'
];

async function testLiveUrl(baseUrl) {
  console.log(`\n======================================================`);
  console.log(`🌐 Auditing Live Target: ${baseUrl}`);
  console.log(`======================================================`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const locales = [
    {
      locale: 'es',
      path: '/posts/content-formats-and-markup-mastery-es/',
      expectedUnitCategory: 'Masa / Peso',
      expectedUnitInputLabel: '🔢 Ingrese el valor:',
      expectedUnitResetBtn: '↺ Restablecer a 1',
      expectedUnitFormula: '📌 Ecuación en tiempo real:',
      expectedMindmapCollapsed: 'Contraído · Clic para expandir ramas',
      expectedZoomIn: 'Acercar (+)',
    },
    {
      locale: 'de',
      path: '/posts/content-formats-and-markup-mastery-de/',
      expectedUnitCategory: 'Masse / Gewicht',
      expectedUnitInputLabel: '🔢 Wert eingeben:',
      expectedUnitResetBtn: '↺ Auf 1 zurücksetzen',
      expectedUnitFormula: '📌 Gleichung in Echtzeit:',
      expectedMindmapCollapsed: 'Eingeklappt · Klicken zum Erweitern',
      expectedZoomIn: 'Vergrößern (+)',
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const item of locales) {
    const fullUrl = `${baseUrl}${item.path}`;
    console.log(`\n🔍 Checking [${item.locale.toUpperCase()}]: ${fullUrl}`);

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
      const resp = await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
      const status = resp ? resp.status() : 0;
      console.log(`   HTTP Status: ${status}`);
      if (status !== 200) {
        console.error(`   ❌ Failed: HTTP status ${status}`);
        failed++;
        continue;
      }

      await page.waitForTimeout(1500);

      // Check HTML lang
      const htmlLang = await page.getAttribute('html', 'lang');
      const articleLang = await page.getAttribute('article#article-container', 'data-lang');
      console.log(`   <html lang="${htmlLang}">`);
      console.log(`   <article data-lang="${articleLang}">`);

      if (htmlLang === item.locale) {
        console.log(`   ✅ HTML lang matches ${item.locale}`);
        passed++;
      } else {
        console.warn(`   ⚠️ HTML lang is "${htmlLang}" (expected "${item.locale}")`);
      }

      // Check Unit Converter
      const unitConverter = page.locator('.interactive-unit-converter').first();
      if ((await unitConverter.count()) > 0) {
        const inputLabel = await page.locator('.interactive-unit-converter .unit-input-label span').innerText();
        const resetBtn = await page.locator('.interactive-unit-converter .unit-reset-btn').innerText();
        const formulaBar = await page.locator('.interactive-unit-converter .unit-formula-bar span').first().innerText();
        const catButtons = await page.locator('.interactive-unit-converter .unit-cat-btn').allInnerTexts();

        console.log(`   Unit Input: "${inputLabel}"`);
        console.log(`   Unit Reset: "${resetBtn}"`);
        console.log(`   Unit Formula: "${formulaBar}"`);
        console.log(`   Unit Categories: [${catButtons.map((c) => c.replace(/\n/g, ' ')).join(', ')}]`);

        if (inputLabel.includes(item.expectedUnitInputLabel)) {
          console.log(`   ✅ Unit input label properly localized in ${item.locale}`);
          passed++;
        } else {
          console.error(`   ❌ Unit input label mismatch: "${inputLabel}"`);
          failed++;
        }

        if (resetBtn.includes(item.expectedUnitResetBtn)) {
          console.log(`   ✅ Unit reset button properly localized in ${item.locale}`);
          passed++;
        } else {
          console.error(`   ❌ Unit reset button mismatch: "${resetBtn}"`);
          failed++;
        }

        if (catButtons.some((c) => c.includes(item.expectedUnitCategory))) {
          console.log(`   ✅ Expected category "${item.expectedUnitCategory}" found!`);
          passed++;
        } else {
          console.error(`   ❌ Category "${item.expectedUnitCategory}" missing in [${catButtons.join(', ')}]`);
          failed++;
        }

        const unitText = await unitConverter.innerText();
        const chineseMatches = unitText.match(/[\u4e00-\u9fa5]/g) || [];
        if (chineseMatches.length === 0) {
          console.log(`   ✅ ZERO Chinese characters found in unit converter!`);
          passed++;
        } else {
          console.warn(`   ⚠️ Found ${chineseMatches.length} Chinese characters: ${chineseMatches.join('')}`);
        }
      } else {
        console.error(`   ❌ Unit converter not found!`);
        failed++;
      }

      // Check Mindmap
      const mindmap = page.locator('.mindmap-wrapper').first();
      if ((await mindmap.count()) > 0) {
        const stateTag = await page.locator('.mindmap-wrapper .mindmap-state-tag').first().innerText();
        const zoomTitle = await page.locator('.mindmap-wrapper .mindmap-btn--zoom-in').first().getAttribute('title');

        console.log(`   Mindmap State: "${stateTag}"`);
        console.log(`   Mindmap Zoom Title: "${zoomTitle}"`);

        if (stateTag.includes(item.expectedMindmapCollapsed)) {
          console.log(`   ✅ Mindmap state tag properly localized in ${item.locale}`);
          passed++;
        } else {
          console.error(`   ❌ Mindmap state tag mismatch: "${stateTag}"`);
          failed++;
        }

        if (zoomTitle === item.expectedZoomIn) {
          console.log(`   ✅ Mindmap zoom button title properly localized: "${zoomTitle}"`);
          passed++;
        } else {
          console.error(`   ❌ Mindmap zoom title mismatch: "${zoomTitle}"`);
          failed++;
        }
      } else {
        console.error(`   ❌ Mindmap wrapper not found!`);
        failed++;
      }

      if (consoleErrors.length > 0) {
        console.warn(`   ⚠️ Console errors (${consoleErrors.length}):`, consoleErrors.slice(0, 3));
      } else {
        console.log(`   ✅ Console errors: 0`);
        passed++;
      }

    } catch (err) {
      console.error(`   ❌ Error loading ${fullUrl}:`, err.message);
      failed++;
    }
  }

  await browser.close();
  return { passed, failed };
}

async function main() {
  let allPassed = 0;
  let allFailed = 0;

  for (const target of LIVE_TARGETS) {
    const res = await testLiveUrl(target);
    allPassed += res.passed;
    allFailed += res.failed;
  }

  console.log(`\n======================================================`);
  console.log(`🏁 Total Live Audit Results: ${allPassed} Passed, ${allFailed} Failed`);
  console.log(`======================================================\n`);

  if (allFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});
