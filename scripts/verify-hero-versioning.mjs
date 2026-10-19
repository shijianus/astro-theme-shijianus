import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { bumpPatchVersion, formatIsoDate } from './sync-content-versions.mjs';

const PORT = 4329;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUTPUT_DIR = path.resolve(process.cwd(), 'playwright-report/hero-versioning-audit');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function startServer() {
  console.log(`[Test Server] Starting server on port ${PORT}...`);
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', 'dist'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));
  return server;
}

async function runAudit() {
  // Test unit: bumpPatchVersion
  console.log('[Unit Test] Verifying bumpPatchVersion logic:');
  const t1 = bumpPatchVersion('v0.0.1');
  const t2 = bumpPatchVersion('v1.2.0');
  const t3 = bumpPatchVersion('2.6.0');
  const t4 = bumpPatchVersion(undefined);
  console.log(`  v0.0.1 -> ${t1} (Expected: v0.0.2) - ${t1 === 'v0.0.2' ? 'PASS' : 'FAIL'}`);
  console.log(`  v1.2.0 -> ${t2} (Expected: v1.2.1) - ${t2 === 'v1.2.1' ? 'PASS' : 'FAIL'}`);
  console.log(`  2.6.0  -> ${t3} (Expected: 2.6.1)  - ${t3 === '2.6.1' ? 'PASS' : 'FAIL'}`);
  console.log(`  undef  -> ${t4} (Expected: v0.0.1) - ${t4 === 'v0.0.1' ? 'PASS' : 'FAIL'}`);

  if (t1 !== 'v0.0.2' || t2 !== 'v1.2.1' || t3 !== '2.6.1' || t4 !== 'v0.0.1') {
    throw new Error('Unit tests for bumpPatchVersion failed!');
  }

  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const testRoutes = [
    { path: '/standards/', name: 'standards-index', type: 'standards', title: '工程标准总纲' },
    { path: '/standards/activity-level/', name: 'standards-activity-level', type: 'standards', title: '活跃等级规范' },
    { path: '/standards/content-density/', name: 'standards-content-density', type: 'standards', title: '内容密度规范' },
    { path: '/version/', name: 'standards-version', type: 'standards', title: '版本协议与系统架构规范' },
    { path: '/status/', name: 'standards-status', type: 'standards', title: '运行状态与服务拓扑规范' },
    { path: '/posts/readable-geek-interfaces/', name: 'post-geek', type: 'post', title: '极客感界面为什么更需要可读性' },
  ];

  const results = [];

  try {
    for (const r of testRoutes) {
      const url = `${BASE_URL}${r.path}`;
      console.log(`\n[Browser Audit] Auditing: ${url} (${r.title})`);

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(600);

      const isStandards = r.type === 'standards';
      const headerSelector = isStandards ? '.standards-spec-header' : '.post-hero';
      const headerEl = page.locator(headerSelector).first();
      const headerBox = await headerEl.boundingBox();

      const titleEl = page.locator(`${headerSelector} .post-hero__title`).first();
      const titleBox = await titleEl.boundingBox();

      const innerEl = page.locator(`${headerSelector} .post-hero__inner`).first();
      const innerBox = await innerEl.boundingBox();

      // Top distance of title relative to header
      const titleRelTop = titleBox ? titleBox.y - headerBox.y : 0;
      // Is title in upper-middle? (e.g. between 30px and 110px from top, relative to 432px header)
      const isUpperMiddle = titleRelTop >= 25 && titleRelTop <= 115;

      // Check meta grid items
      const metaGrid = page.locator(`${headerSelector} .post-hero__meta-grid`).first();
      const metaText = await metaGrid.innerText();

      // Check version text
      const hasVersion = metaText.includes('版本') || metaText.includes('v0.') || metaText.includes('v1.') || metaText.includes('v2.');
      // Check date format: MM/DD/YY (e.g. \d{2}\/\d{2}\/\d{2})
      const hasDateMatch = /\d{2}\/\d{2}\/\d{2}/.test(metaText);

      // DOM check: #article-container count on standards pages
      const articleContainerCount = isStandards ? await page.locator('#article-container').count() : -1;

      console.log(`  Header height: ${Math.round(headerBox?.height || 0)}px`);
      console.log(`  Title relative top: ${Math.round(titleRelTop)}px (Upper-middle: ${isUpperMiddle})`);
      console.log(`  Meta text: "${metaText.replace(/\s+/g, ' ').trim()}"`);
      console.log(`  Has version: ${hasVersion}, Has MM/DD/YY date: ${hasDateMatch}`);
      if (isStandards) {
        console.log(`  #article-container count: ${articleContainerCount} (Expected: 0)`);
      }

      await page.screenshot({ path: path.join(OUTPUT_DIR, `${r.name}.png`) });

      const passed = Boolean(
        headerBox &&
        headerBox.height >= 380 &&
        headerBox.height <= 460 &&
        isUpperMiddle &&
        hasVersion &&
        hasDateMatch &&
        (!isStandards || articleContainerCount === 0)
      );

      results.push({
        title: r.title,
        type: r.type,
        headerHeight: Math.round(headerBox?.height || 0),
        titleTop: Math.round(titleRelTop),
        isUpperMiddle,
        hasVersion,
        hasDateMatch,
        articleContainerRemoved: isStandards ? articleContainerCount === 0 : true,
        passed,
      });
    }

    console.log('\n================ AUDIT SUMMARY ================');
    console.table(results);

    const allPassed = results.every((x) => x.passed);
    console.log(`\nOverall Result: ${allPassed ? 'ALL AUDITS PASSED ✓' : 'SOME AUDITS FAILED ✗'}`);

    if (!allPassed) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

runAudit().catch((err) => {
  console.error('[Audit Fatal Error]', err);
  process.exit(1);
});
