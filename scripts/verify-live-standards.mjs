import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'https://7b75e6a2.shijianus-blog.pages.dev';
const OUTPUT_DIR = path.resolve(process.cwd(), 'playwright-report/live-standards-audit');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function verifyLive() {
  console.log(`[Live Audit] Target: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const routes = [
    { path: '/standards/', name: 'live-standards-index', title: '工程标准总纲' },
    { path: '/standards/activity-level/', name: 'live-activity-level', title: '活跃等级规范' },
    { path: '/standards/content-density/', name: 'live-content-density', title: '内容密度规范' },
    { path: '/version/', name: 'live-version-protocol', title: '版本协议规范' },
    { path: '/status/', name: 'live-status-topology', title: '运行状态规范' },
  ];

  const results = [];

  for (const r of routes) {
    const url = `${BASE_URL}${r.path}`;
    console.log(`\n[Live Audit] Visiting: ${url} (${r.title})`);

    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const status = res?.status();
    await page.waitForTimeout(1000);

    const dataType = await page.getAttribute('body', 'data-type');
    const shellBox = await page.locator('.standards-spec-shell').boundingBox();
    const readmodeVisible = await page.locator('#readmode').isVisible().catch(() => false);
    const commentVisible = await page.locator('#post-comment').isVisible().catch(() => false);
    const recoVisible = await page.locator('#post-end-recommendation').isVisible().catch(() => false);
    const specNavCount = await page.locator('.standards-spec-nav').count();

    console.log(`[Live Audit] HTTP Status: ${status}`);
    console.log(`[Live Audit] body[data-type]: "${dataType}"`);
    console.log(`[Live Audit] Shell width: ${shellBox?.width}px`);
    console.log(`[Live Audit] .standards-spec-nav count: ${specNavCount} (Expected: 0)`);
    console.log(`[Live Audit] Hidden Widgets: readmode=${!readmodeVisible}, comment=${!commentVisible}, reco=${!recoVisible}`);

    if (r.path.includes('activity-level')) {
      const katexCount = await page.locator('.katex-display').count();
      const rawLeak = await page.evaluate(() => document.body.innerText.includes('$$C(E)'));
      console.log(`[Live Audit] KaTeX display blocks: ${katexCount}`);
      console.log(`[Live Audit] Raw LaTeX leakage: ${rawLeak ? 'LEAKED ✗' : 'CLEAN ✓'}`);

      // Scroll to formula and capture
      await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('h3, p')).find(e => e.textContent.includes('单日聚合事件数到视觉色阶'));
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      await page.waitForTimeout(400);
      const formulaShot = path.join(OUTPUT_DIR, 'live-activity-level-formula.png');
      await page.screenshot({ path: formulaShot });
      console.log(`[Live Audit] Saved live formula screenshot to: ${formulaShot}`);

      // Reset scroll
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    const shotPath = path.join(OUTPUT_DIR, `${r.name}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`[Live Audit] Saved page screenshot to: ${shotPath}`);

    results.push({
      page: r.title,
      url: r.path,
      httpStatus: status,
      dataType,
      width: shellBox?.width,
      readmodeHidden: !readmodeVisible,
      commentsHidden: !commentVisible,
      specNavRemoved: specNavCount === 0,
      passed: status === 200 && dataType === 'standards' && (shellBox?.width || 0) > 1000 && !readmodeVisible && !commentVisible && specNavCount === 0,
    });
  }

  await browser.close();

  console.log('\n================ LIVE AUDIT RESULTS ================');
  console.table(results);
  const allPassed = results.every(r => r.passed);
  console.log(`[Live Audit] OVERALL RESULT: ${allPassed ? 'ALL LIVE CHECKS PASSED ✓' : 'SOME CHECKS FAILED ✗'}`);
}

verifyLive().catch((err) => {
  console.error('[Live Audit Error]:', err);
  process.exit(1);
});
