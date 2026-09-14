import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const DIST_DIR = path.resolve('dist');
const PORT = 4399;

// Lightweight static server for dist
function startStaticServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath.endsWith('/')) reqPath += 'index.html';
    let filePath = path.join(DIST_DIR, reqPath);

    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[StaticServer] Serving ${DIST_DIR} on http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

async function runAudit() {
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const testLocales = [
    {
      locale: 'es',
      url: `http://127.0.0.1:${PORT}/posts/content-formats-and-markup-mastery-es/`,
      expectedUnitCategory: 'Masa / Peso',
      expectedUnitInputLabel: '🔢 Ingrese el valor:',
      expectedUnitResetBtn: '↺ Restablecer a 1',
      expectedUnitFormula: '📌 Ecuación en tiempo real:',
      expectedMindmapCollapsed: 'Contraído · Clic para expandir ramas',
      expectedMindmapFooter: '💡 Clic en nodos o puntos',
      expectedZoomIn: 'Acercar (+)',
    },
    {
      locale: 'de',
      url: `http://127.0.0.1:${PORT}/posts/content-formats-and-markup-mastery-de/`,
      expectedUnitCategory: 'Masse / Gewicht',
      expectedUnitInputLabel: '🔢 Wert eingeben:',
      expectedUnitResetBtn: '↺ Auf 1 zurücksetzen',
      expectedUnitFormula: '📌 Gleichung in Echtzeit:',
      expectedMindmapCollapsed: 'Eingeklappt · Klicken zum Erweitern',
      expectedMindmapFooter: '💡 Knoten oder Punkte',
      expectedZoomIn: 'Vergrößern (+)',
    },
  ];

  let totalPassed = 0;
  let totalFailed = 0;

  for (const t of testLocales) {
    console.log(`\n========================================`);
    console.log(`🧪 Auditing Locale: [${t.locale.toUpperCase()}] at ${t.url}`);
    console.log(`========================================`);

    await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for client scripts to hydrate
    await page.waitForTimeout(1500);

    // 1. Verify HTML lang & article data-lang
    const htmlLang = await page.getAttribute('html', 'lang');
    const articleLang = await page.getAttribute('article#article-container', 'data-lang');
    console.log(`  <html lang="${htmlLang}"> (expected "${t.locale}")`);
    console.log(`  <article data-lang="${articleLang}"> (expected "${t.locale}")`);

    if (htmlLang === t.locale) {
      console.log(`  ✅ HTML lang matches expected locale: ${htmlLang}`);
      totalPassed++;
    } else {
      console.error(`  ❌ HTML lang mismatch: expected "${t.locale}", got "${htmlLang}"`);
      totalFailed++;
    }

    // 2. Verify Unit Converter UI localization
    console.log(`\n  --- Unit Converter UI Audit ---`);
    const unitConverter = page.locator('.interactive-unit-converter').first();
    const unitExists = (await unitConverter.count()) > 0;
    if (!unitExists) {
      console.error(`  ❌ .interactive-unit-converter not found on page!`);
      totalFailed++;
    } else {
      const inputLabel = await page.locator('.interactive-unit-converter .unit-input-label span').innerText();
      const resetBtn = await page.locator('.interactive-unit-converter .unit-reset-btn').innerText();
      const formulaBar = await page.locator('.interactive-unit-converter .unit-formula-bar span').first().innerText();
      const catButtons = await page.locator('.interactive-unit-converter .unit-cat-btn').allInnerTexts();

      console.log(`    Input Label: "${inputLabel}" (expected: "${t.expectedUnitInputLabel}")`);
      console.log(`    Reset Button: "${resetBtn}" (expected: "${t.expectedUnitResetBtn}")`);
      console.log(`    Formula Bar: "${formulaBar}" (expected to include: "${t.expectedUnitFormula}")`);
      console.log(`    Categories: [${catButtons.map((c) => c.replace(/\n/g, ' ')).join(', ')}]`);

      // Check for hardcoded Chinese in unit converter
      const allUnitText = await unitConverter.innerText();
      const chineseInUnit = allUnitText.match(/[\u4e00-\u9fa5]/g) || [];

      if (inputLabel.includes(t.expectedUnitInputLabel)) {
        console.log(`  ✅ Unit converter input label correctly localized in ${t.locale}`);
        totalPassed++;
      } else {
        console.error(`  ❌ Unit converter input label not localized: "${inputLabel}"`);
        totalFailed++;
      }

      if (resetBtn.includes(t.expectedUnitResetBtn)) {
        console.log(`  ✅ Unit converter reset button correctly localized in ${t.locale}`);
        totalPassed++;
      } else {
        console.error(`  ❌ Unit converter reset button not localized: "${resetBtn}"`);
        totalFailed++;
      }

      if (catButtons.some((c) => c.includes(t.expectedUnitCategory))) {
        console.log(`  ✅ Unit converter category "${t.expectedUnitCategory}" found!`);
        totalPassed++;
      } else {
        console.error(`  ❌ Expected category "${t.expectedUnitCategory}" not found in [${catButtons.join(', ')}]`);
        totalFailed++;
      }

      if (chineseInUnit.length === 0) {
        console.log(`  ✅ ZERO residual Chinese characters found in unit converter UI!`);
        totalPassed++;
      } else {
        console.warn(`  ⚠️ Found ${chineseInUnit.length} Chinese characters in unit converter: ${chineseInUnit.join('')}`);
      }
    }

    // 3. Verify Mindmap UI localization
    console.log(`\n  --- Mindmap UI Audit ---`);
    const mindmapWrapper = page.locator('.mindmap-wrapper').first();
    const mindmapExists = (await mindmapWrapper.count()) > 0;
    if (!mindmapExists) {
      console.error(`  ❌ .mindmap-wrapper not found on page!`);
      totalFailed++;
    } else {
      const stateTag = await page.locator('.mindmap-wrapper .mindmap-state-tag').first().innerText();
      const footerGuide = await page.locator('.mindmap-wrapper .mindmap-footer__guide').first().innerText();
      const zoomInTitle = await page.locator('.mindmap-wrapper .mindmap-btn--zoom-in').first().getAttribute('title');

      console.log(`    State Tag: "${stateTag}" (expected: "${t.expectedMindmapCollapsed}")`);
      console.log(`    Footer Guide: "${footerGuide.slice(0, 40)}..." (expected to include: "${t.expectedMindmapFooter}")`);
      console.log(`    Zoom In Title: "${zoomInTitle}" (expected: "${t.expectedZoomIn}")`);

      if (stateTag.includes(t.expectedMindmapCollapsed)) {
        console.log(`  ✅ Mindmap state tag correctly localized in ${t.locale}`);
        totalPassed++;
      } else {
        console.error(`  ❌ Mindmap state tag not localized: "${stateTag}"`);
        totalFailed++;
      }

      if (footerGuide.includes(t.expectedMindmapFooter)) {
        console.log(`  ✅ Mindmap footer guide correctly localized in ${t.locale}`);
        totalPassed++;
      } else {
        console.error(`  ❌ Mindmap footer guide not localized: "${footerGuide}"`);
        totalFailed++;
      }

      if (zoomInTitle === t.expectedZoomIn) {
        console.log(`  ✅ Mindmap zoom button title correctly localized: "${zoomInTitle}"`);
        totalPassed++;
      } else {
        console.error(`  ❌ Mindmap zoom button title not localized: "${zoomInTitle}"`);
        totalFailed++;
      }

      // Check toolbar button titles for Chinese
      const buttons = page.locator('.mindmap-wrapper .mindmap-btn');
      const btnCount = await buttons.count();
      let chineseTitles = 0;
      for (let b = 0; b < btnCount; b++) {
        const title = await buttons.nth(b).getAttribute('title');
        if (/[\u4e00-\u9fa5]/.test(title || '')) chineseTitles++;
      }
      if (chineseTitles === 0) {
        console.log(`  ✅ All mindmap toolbar buttons localized with ZERO Chinese titles!`);
        totalPassed++;
      } else {
        console.error(`  ❌ ${chineseTitles} mindmap toolbar buttons still have Chinese titles!`);
        totalFailed++;
      }
    }
  }

  await browser.close();
  server.close();

  console.log(`\n========================================`);
  console.log(`🎯 Audit Summary: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log(`========================================\n`);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('[Audit Error]:', err);
  process.exit(1);
});
