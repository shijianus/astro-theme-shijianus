import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const PORT = 8089;
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const OUTPUT_DIR = path.resolve(process.cwd(), 'playwright-report/standards-audit');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Simple static file server
function createStaticServer() {
  const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  };

  return http.createServer((req, res) => {
    let reqUrl = (req.url || '/').split('?')[0];
    let filePath = path.join(DIST_DIR, reqUrl);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }

    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end('Not Found: ' + reqUrl);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
}

async function runAudit() {
  console.log('[Audit] Starting static server on port ' + PORT + '...');
  const server = createStaticServer();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log('[Audit] Static server started.');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  const pagesToTest = [
    { url: '/standards/', name: '01-standards-index', title: '工程标准总纲' },
    { url: '/standards/activity-level/', name: '02-activity-level', title: '活跃等级规范' },
    { url: '/standards/content-density/', name: '03-content-density', title: '内容密度规范' },
    { url: '/version/', name: '04-version-protocol', title: '版本协议规范' },
    { url: '/status/', name: '05-status-topology', title: '运行状态规范' },
  ];

  const results = [];

  for (const item of pagesToTest) {
    const fullUrl = `http://localhost:${PORT}${item.url}`;
    console.log(`\n[Audit] Navigating to: ${fullUrl} (${item.title})`);
    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    // 1. Check data-type="standards"
    const dataType = await page.getAttribute('body', 'data-type');
    console.log(`[Audit] body[data-type] = "${dataType}"`);

    // 2. Check layout width of the article container
    const articleBox = await page.locator('.standards-spec-shell').boundingBox();
    console.log(`[Audit] standards-spec-shell width = ${articleBox?.width}px (Expected ~1300-1400px)`);

    // 3. Verify no post widgets are visible
    const readmodeVisible = await page.locator('#readmode').isVisible().catch(() => false);
    const commentVisible = await page.locator('#post-comment').isVisible().catch(() => false);
    const recoVisible = await page.locator('#post-end-recommendation').isVisible().catch(() => false);
    console.log(`[Audit] Hidden widgets check: #readmode=${readmodeVisible}, #post-comment=${commentVisible}, #post-end-recommendation=${recoVisible}`);

    // 4. Verify that standards-spec-nav is COMPLETELY REMOVED (0 elements)
    const specNavCount = await page.locator('.standards-spec-nav').count();
    console.log(`[Audit] .standards-spec-nav count = ${specNavCount} (Expected: 0)`);

    // 5. Special check for activity-level: check KaTeX formula and color mapping table
    if (item.url.includes('activity-level')) {
      const katexDisplayCount = await page.locator('.katex-display').count();
      console.log(`[Audit] .katex-display count = ${katexDisplayCount}`);

      // Verify that the piecewise function C(E) is rendered
      const formulaText = await page.evaluate(() => {
        const formulaEl = document.querySelector('.katex-display');
        return formulaEl ? formulaEl.textContent : '';
      });
      console.log(`[Audit] Formula rendered text: "${formulaText?.slice(0, 50)}..."`);

      // Verify that no raw "$$C(E)" text exists in the page text
      const rawFormulaLeak = await page.evaluate(() => {
        return document.body.innerText.includes('$$C(E)');
      });
      console.log(`[Audit] Raw LaTeX leakage ($$C(E)): ${rawFormulaLeak ? 'FAIL (LEAKED!)' : 'PASS (Clean MathML/KaTeX Rendered)'}`);

      // Verify color mapping table
      const tableHeaders = await page.locator('table th').allInnerTexts();
      console.log(`[Audit] Activity table headers:`, tableHeaders.slice(0, 4));

      // Scroll to the formula section and take a targeted snapshot
      await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('h3, p')).find(e => e.textContent.includes('单日聚合事件数到视觉色阶'));
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      await page.waitForTimeout(300);
      const formulaSectionShot = path.join(OUTPUT_DIR, 'activity-level-formula-zoomed.png');
      await page.screenshot({ path: formulaSectionShot });
      console.log(`[Audit] Saved formula zoomed screenshot to ${formulaSectionShot}`);
    }

    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    // Save full page screenshot
    const shotPath = path.join(OUTPUT_DIR, `${item.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`[Audit] Saved viewport screenshot to: ${shotPath}`);

    results.push({
      page: item.title,
      url: item.url,
      dataType,
      width: articleBox?.width,
      readmodeHidden: !readmodeVisible,
      commentsHidden: !commentVisible,
      specNavRemoved: specNavCount === 0,
      passed: dataType === 'standards' && (articleBox?.width || 0) > 1000 && !readmodeVisible && !commentVisible && specNavCount === 0,
    });
  }

  // Dark mode test for activity level formula
  console.log('\n[Audit] Testing Dark Mode appearance...');
  await page.goto(`http://localhost:${PORT}/standards/activity-level/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const el = Array.from(document.querySelectorAll('h3, p')).find(e => e.textContent.includes('单日聚合事件数到视觉色阶'));
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(300);
  const darkModeShot = path.join(OUTPUT_DIR, 'activity-level-dark-mode-zoomed.png');
  await page.screenshot({ path: darkModeShot });
  console.log(`[Audit] Saved dark mode formula screenshot to: ${darkModeShot}`);

  await browser.close();
  server.close();

  console.log('\n================ AUDIT SUMMARY ================');
  console.table(results);
  const allPassed = results.every(r => r.passed);
  console.log(`[Audit] OVERALL RESULT: ${allPassed ? 'ALL AUDITS PASSED ✓' : 'SOME AUDITS FAILED ✗'}`);
}

runAudit().catch((err) => {
  console.error('[Audit Error]:', err);
  process.exit(1);
});
