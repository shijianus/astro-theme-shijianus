import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROD_URL = 'https://blog.epocanvas.com';
const PROD_API_URL = `${PROD_URL}/api/lab`;
const SCREENSHOT_DIR = path.join(process.cwd(), 'dist', 'audit_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyLiveProduction() {
  console.log('🌐 [Production Verification] 开始对线上生产环境执行全链路审计与视觉验收...');
  console.log(`  -> 生产目标: ${PROD_URL}`);

  // 1. 验证边缘后端 API
  console.log('\n📡 [Step 1] 审计线上边缘后端 API (/api/lab)...');
  const apiRes = await fetch(PROD_API_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  console.log(`  -> HTTP 状态码: ${apiRes.status} ${apiRes.statusText}`);
  assert.equal(apiRes.status, 200, `/api/lab 接口应返回 200 OK，实际: ${apiRes.status}`);

  const apiJson = await apiRes.json();
  console.log(`  -> API 返回官方实验数: ${apiJson.stats?.totalOfficialExperiments}`);
  assert.equal(apiJson.stats?.totalOfficialExperiments, 8, 'API 官方实验数应为 8');
  assert.equal(apiJson.experiments.length, 8, 'API 实验列表长度应为 8');

  const slugs = apiJson.experiments.map((e) => e.slug);
  console.log('  -> 线上已注册实验 Slug 列表:', slugs);
  assert.ok(slugs.includes('interactive-svg-morph'), '必须包含 interactive-svg-morph');
  assert.ok(slugs.includes('svg-generative-fractal'), '必须包含 svg-generative-fractal');
  console.log('  ✅ 边缘后端 API 验证通过！');

  // 2. Playwright 浏览器对线上页面执行真实交互与视觉度量
  const browser = await chromium.launch({ headless: true });

  try {
    // 2.1 桌面端 /lab/ 主仪表盘视觉度量
    console.log('\n📸 [Step 2] 审计线上 /lab/ 主仪表盘视觉与布局...');
    const ctxDesktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await ctxDesktop.newPage();
    await page.goto(`${PROD_URL}/lab/`, { waitUntil: 'networkidle', timeout: 30000 });

    const heroStats = await page.locator('.stat-item').count();
    console.log(`  -> 线上 Hero 统计指标数: ${heroStats}`);
    assert.equal(heroStats, 4, 'Hero 统计指标应为 4 项');

    const cardCount = await page.locator('.lab-card').count();
    console.log(`  -> 线上实验卡片数: ${cardCount}`);
    assert.equal(cardCount, 8, '卡片数应为 8');

    const sampleHeights = await page.evaluate(() => {
      const boxes = Array.from(document.querySelectorAll('.canvas-preview-box, .plane-preview-box, .algo-mini-preview, .svg-preview-box'));
      return boxes.map((b) => ({
        className: b.className,
        clientHeight: b.clientHeight,
        clientWidth: b.clientWidth,
      }));
    });
    console.log('  -> 线上卡片预览框样本尺寸 (前 3 项):', sampleHeights.slice(0, 3));
    for (const b of sampleHeights) {
      assert.ok(b.clientHeight >= 320, `预览框高度必须 >= 320px，实际: ${b.clientHeight}px`);
    }

    const shotLiveDash = path.join(SCREENSHOT_DIR, 'live_prod_lab_dashboard_desktop.png');
    await page.screenshot({ path: shotLiveDash, fullPage: false });
    console.log(`  -> 已保存线上主仪表盘截图: ${shotLiveDash}`);

    // 2.2 桌面端实验 7 (`interactive-svg-morph`) 交互与尺寸
    console.log('\n📸 [Step 3] 审计线上实验 7 (interactive-svg-morph) 交互与视口尺寸...');
    await page.goto(`${PROD_URL}/lab/interactive-svg-morph/`, { waitUntil: 'networkidle', timeout: 30000 });

    const liveMorphLayout = await page.evaluate(() => {
      const workspace = document.querySelector('.lab-pg-workspace');
      const preview = document.querySelector('.sandbox-viewport-container');
      const editor = document.querySelector('.editor-body-wrap');
      return {
        workspaceHeight: workspace ? workspace.clientHeight : 0,
        previewHeight: preview ? preview.clientHeight : 0,
        editorHeight: editor ? editor.clientHeight : 0,
      };
    });
    console.log('  -> 线上工作区初始尺寸:', liveMorphLayout);
    assert.ok(liveMorphLayout.workspaceHeight >= 700, `工作台高度应 >= 700px，实际: ${liveMorphLayout.workspaceHeight}px`);
    assert.ok(liveMorphLayout.previewHeight >= 450, `预览高度应 >= 450px，实际: ${liveMorphLayout.previewHeight}px`);

    // 测试三档分屏切换
    await page.click('[data-testid="layout-btn-preview"]');
    await page.waitForTimeout(200);
    const isPreviewFocus = await page.evaluate(() => {
      return document.querySelector('.lab-pg-workspace').classList.contains('preview-focus');
    });
    assert.equal(isPreviewFocus, true, '切换大预览后应包含 preview-focus 类');

    // 测试折叠手风琴控制台
    const collapseBtn = page.locator('[data-testid="btn-toggle-console-collapse"]');
    await collapseBtn.click();
    await page.waitForTimeout(300);

    const liveCollapsedLayout = await page.evaluate(() => {
      const drawer = document.querySelector('.lab-console-drawer');
      const preview = document.querySelector('.sandbox-viewport-container');
      return {
        isCollapsed: drawer ? drawer.classList.contains('is-collapsed') : false,
        drawerHeight: drawer ? drawer.clientHeight : 0,
        expandedPreviewHeight: preview ? preview.clientHeight : 0,
      };
    });
    console.log('  -> 线上控制台折叠后测量:', liveCollapsedLayout);
    assert.equal(liveCollapsedLayout.isCollapsed, true);
    assert.ok(liveCollapsedLayout.drawerHeight <= 42);
    assert.ok(liveCollapsedLayout.expandedPreviewHeight >= 550);

    const shotLiveMorph = path.join(SCREENSHOT_DIR, 'live_prod_svg_morph_desktop.png');
    await page.screenshot({ path: shotLiveMorph, fullPage: false });
    console.log(`  -> 已保存线上 SVG 动态流体工作台截图: ${shotLiveMorph}`);

    // 2.3 桌面端实验 8 (`svg-generative-fractal`)
    console.log('\n📸 [Step 4] 审计线上实验 8 (svg-generative-fractal) 几何动力学...');
    await page.goto(`${PROD_URL}/lab/svg-generative-fractal/`, { waitUntil: 'networkidle', timeout: 30000 });
    const liveTitle = await page.locator('.detail-title').innerText();
    console.log(`  -> 线上工作区标题: ${liveTitle}`);
    assert.ok(liveTitle.includes('SVG'));

    const shotLiveFractal = path.join(SCREENSHOT_DIR, 'live_prod_svg_fractal_desktop.png');
    await page.screenshot({ path: shotLiveFractal, fullPage: false });
    console.log(`  -> 已保存线上 SVG 几何动力学工作台截图: ${shotLiveFractal}`);

    await ctxDesktop.close();

    // 2.4 移动端 (390x844) 零溢出
    console.log('\n📱 [Step 5] 审计线上移动端 (390x844) 零横向溢出...');
    const ctxMobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const pageMobile = await ctxMobile.newPage();
    await pageMobile.goto(`${PROD_URL}/lab/`, { waitUntil: 'networkidle', timeout: 30000 });

    const liveMobileOverflow = await pageMobile.evaluate(() => {
      const doc = document.documentElement;
      return {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        overflow: doc.scrollWidth - doc.clientWidth,
      };
    });
    console.log('  -> 线上移动端仪表盘溢出度量:', liveMobileOverflow);
    assert.equal(liveMobileOverflow.overflow <= 0, true);

    const shotLiveMobile = path.join(SCREENSHOT_DIR, 'live_prod_lab_dashboard_mobile.png');
    await pageMobile.screenshot({ path: shotLiveMobile, fullPage: false });
    console.log(`  -> 已保存线上移动端截图: ${shotLiveMobile}`);

    await ctxMobile.close();

    console.log('\n🎉 [Production Verification] 线上生产环境全链路 E2E 验证与视觉审计 100% 全部通过！');
  } finally {
    await browser.close();
  }
}

verifyLiveProduction().catch((err) => {
  console.error('❌ [Production Verification] 线上验证失败:', err);
  process.exit(1);
});
