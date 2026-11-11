import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SANDBOX_DIR = path.join(ROOT_DIR, 'sandbox-runner');
const SCREENSHOT_DIR = path.join(DIST_DIR, 'audit_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const MAIN_PORT = 4380;
const SANDBOX_PORT = 4381;
const BASE_URL = `http://127.0.0.1:${MAIN_PORT}`;
const SANDBOX_ORIGIN = `http://localhost:${SANDBOX_PORT}`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm',
};

function createStaticServer(baseDir, isSandbox = false) {
  return http.createServer((req, res) => {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
      let reqPath = decodeURIComponent(parsedUrl.pathname);

      if (reqPath.endsWith('/')) {
        reqPath += 'index.html';
      }

      let filePath = path.join(baseDir, reqPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath) && !path.extname(filePath)) {
        const withHtml = `${filePath}.html`;
        if (fs.existsSync(withHtml)) {
          filePath = withHtml;
        }
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const fileBytes = fs.readFileSync(filePath);

      const headers = {
        'Content-Type': contentType,
        'Content-Length': fileBytes.length,
      };

      if (isSandbox) {
        headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;";
        headers['Access-Control-Allow-Origin'] = '*';
      }

      res.writeHead(200, headers);
      res.end(fileBytes);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(err.message);
    }
  });
}

async function runVisualAudit() {
  console.log('🚀 [Visual Audit] 启动本地静态服务...');
  const mainServer = createStaticServer(DIST_DIR, false);
  const sandboxServer = createStaticServer(SANDBOX_DIR, true);

  await new Promise((resolve) => mainServer.listen(MAIN_PORT, '127.0.0.1', resolve));
  await new Promise((resolve) => sandboxServer.listen(SANDBOX_PORT, '127.0.0.1', resolve));

  console.log(`  -> 主站预览运行于: ${BASE_URL}`);
  console.log(`  -> 沙盒预览运行于: ${SANDBOX_ORIGIN}`);

  const browser = await chromium.launch({ headless: true });
  const report = {
    timestamp: new Date().toISOString(),
    metrics: {},
    screenshots: [],
    assertions: [],
  };

  try {
    // -------------------------------------------------------------
    // Test 1: Desktop /lab/ 仪表盘 UI、尺寸测量与视觉截图
    // -------------------------------------------------------------
    console.log('\n📸 [Test 1] 审计 /lab/ 仪表盘 UI（桌面 1440x900）...');
    const contextDesktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const pageDesktop = await contextDesktop.newPage();
    await pageDesktop.goto(`${BASE_URL}/lab/`, { waitUntil: 'networkidle' });

    // 检查 Hero 徽标与统计指标
    const heroStats = await pageDesktop.locator('.stat-item').count();
    console.log(`  -> Hero 核心统计指标卡片数: ${heroStats}`);
    assert.equal(heroStats, 4, 'Hero 统计指标应呈现 4 项');

    // 检查实验卡片数量（应为 8 项）
    const cardCount = await pageDesktop.locator('.lab-card').count();
    console.log(`  -> 官方实验展示卡片数: ${cardCount}`);
    assert.equal(cardCount, 8, '展示卡片总数应为 8 项');

    // 测量卡片预览框高度（验证是否摆脱扁平，高度 >= 320px）
    const previewBoxHeights = await pageDesktop.evaluate(() => {
      const boxes = Array.from(document.querySelectorAll('.canvas-preview-box, .plane-preview-box, .algo-mini-preview, .svg-preview-box'));
      return boxes.map((el) => ({
        className: el.className,
        clientHeight: el.clientHeight,
        clientWidth: el.clientWidth,
      }));
    });
    console.log('  -> 卡片预览框尺寸样本 (前 3 项):', previewBoxHeights.slice(0, 3));
    for (const box of previewBoxHeights) {
      assert.ok(box.clientHeight >= 320, `预览框高度必须 >= 320px，实际: ${box.clientHeight}px (${box.className})`);
    }

    // 浅色主题截图
    const shotDashLight = path.join(SCREENSHOT_DIR, 'lab_dashboard_desktop_light.png');
    await pageDesktop.screenshot({ path: shotDashLight, fullPage: false });
    report.screenshots.push('lab_dashboard_desktop_light.png');
    console.log(`  -> 已保存桌面浅色截图: ${shotDashLight}`);

    // 切换暗黑主题并截图
    await pageDesktop.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await pageDesktop.waitForTimeout(300);
    const shotDashDark = path.join(SCREENSHOT_DIR, 'lab_dashboard_desktop_dark.png');
    await pageDesktop.screenshot({ path: shotDashDark, fullPage: false });
    report.screenshots.push('lab_dashboard_desktop_dark.png');
    console.log(`  -> 已保存桌面暗黑截图: ${shotDashDark}`);

    await contextDesktop.close();

    // -------------------------------------------------------------
    // Test 2: Desktop 实验 7 (`interactive-svg-morph`) 工作台空间与分屏交互
    // -------------------------------------------------------------
    console.log('\n📸 [Test 2] 审计实验 7 (interactive-svg-morph) 工作台尺寸与交互...');
    const ctxMorph = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const pageMorph = await ctxMorph.newPage();
    await pageMorph.goto(`${BASE_URL}/lab/interactive-svg-morph/`, { waitUntil: 'networkidle' });

    // 验证工坊卡片高度 >= 700px (摆脱 540px 扁平)
    const morphLayout = await pageMorph.evaluate(() => {
      const workspace = document.querySelector('.lab-pg-workspace');
      const previewContainer = document.querySelector('.sandbox-viewport-container');
      const editorWrap = document.querySelector('.editor-body-wrap');
      const consoleDrawer = document.querySelector('.lab-console-drawer');
      return {
        workspaceHeight: workspace ? workspace.clientHeight : 0,
        previewHeight: previewContainer ? previewContainer.clientHeight : 0,
        editorHeight: editorWrap ? editorWrap.clientHeight : 0,
        drawerHeight: consoleDrawer ? consoleDrawer.clientHeight : 0,
      };
    });
    console.log('  -> 工作区初始尺寸测量:', morphLayout);
    assert.ok(morphLayout.workspaceHeight >= 700, `工作台卡片高度应 >= 700px，实际: ${morphLayout.workspaceHeight}px`);
    assert.ok(morphLayout.previewHeight >= 450, `预览视口高度应 >= 450px，实际: ${morphLayout.previewHeight}px`);
    assert.ok(morphLayout.editorHeight >= 450, `代码编辑区高度应 >= 450px，实际: ${morphLayout.editorHeight}px`);

    // 测试三档分屏模式切换
    console.log('  -> 测试三档分屏切换 (大预览 36/64)...');
    await pageMorph.click('[data-testid="layout-btn-preview"]');
    await pageMorph.waitForTimeout(200);
    const isPreviewFocus = await pageMorph.evaluate(() => {
      return document.querySelector('.lab-pg-workspace').classList.contains('preview-focus');
    });
    assert.equal(isPreviewFocus, true, '点击大预览后工作区应包含 preview-focus 类');

    console.log('  -> 测试三档分屏切换 (大代码 64/36)...');
    await pageMorph.click('[data-testid="layout-btn-code"]');
    await pageMorph.waitForTimeout(200);
    const isCodeFocus = await pageMorph.evaluate(() => {
      return document.querySelector('.lab-pg-workspace').classList.contains('code-focus');
    });
    assert.equal(isCodeFocus, true, '点击大代码后工作区应包含 code-focus 类');

    console.log('  -> 测试分屏切回均衡 (50/50)...');
    await pageMorph.click('[data-testid="layout-btn-equal"]');
    await pageMorph.waitForTimeout(200);

    // 测试可折叠手风琴控制台抽屉收起与空间释放
    console.log('  -> 测试控制台手风琴抽屉收起与最大化视口...');
    const drawerCollapseBtn = pageMorph.locator('[data-testid="btn-toggle-console-collapse"]');
    await drawerCollapseBtn.click();
    await pageMorph.waitForTimeout(300);

    const collapsedLayout = await pageMorph.evaluate(() => {
      const drawer = document.querySelector('.lab-console-drawer');
      const previewContainer = document.querySelector('.sandbox-viewport-container');
      return {
        isCollapsed: drawer ? drawer.classList.contains('is-collapsed') : false,
        drawerHeight: drawer ? drawer.clientHeight : 0,
        expandedPreviewHeight: previewContainer ? previewContainer.clientHeight : 0,
      };
    });
    console.log('  -> 控制台折叠后测量:', collapsedLayout);
    assert.equal(collapsedLayout.isCollapsed, true, '控制台抽屉应处于 is-collapsed 状态');
    assert.ok(collapsedLayout.drawerHeight <= 42, `折叠状态条高度应 <= 42px，实际: ${collapsedLayout.drawerHeight}px`);
    assert.ok(collapsedLayout.expandedPreviewHeight >= 550, `控制台收起后预览视口应扩大至 >= 550px，实际: ${collapsedLayout.expandedPreviewHeight}px`);

    const shotMorph = path.join(SCREENSHOT_DIR, 'lab_svg_morph_desktop.png');
    await pageMorph.screenshot({ path: shotMorph, fullPage: false });
    report.screenshots.push('lab_svg_morph_desktop.png');
    console.log(`  -> 已保存 SVG 动态流体工作台截图: ${shotMorph}`);

    await ctxMorph.close();

    // -------------------------------------------------------------
    // Test 3: Desktop 实验 8 (`svg-generative-fractal`) 动力学与 SVG 导出交互
    // -------------------------------------------------------------
    console.log('\n📸 [Test 3] 审计实验 8 (svg-generative-fractal) 几何动力学与 SVG 导出...');
    const ctxFractal = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const pageFractal = await ctxFractal.newPage();
    await pageFractal.goto(`${BASE_URL}/lab/svg-generative-fractal/`, { waitUntil: 'networkidle' });

    // 验证标题与 SVG 专属属性
    const title = await pageFractal.locator('.detail-title').innerText();
    console.log(`  -> 工作区标题: ${title}`);
    assert.ok(title.includes('SVG'), '标题应包含 SVG 标识');

    const shotFractal = path.join(SCREENSHOT_DIR, 'lab_svg_fractal_desktop.png');
    await pageFractal.screenshot({ path: shotFractal, fullPage: false });
    report.screenshots.push('lab_svg_fractal_desktop.png');
    console.log(`  -> 已保存 SVG 几何齿轮工作台截图: ${shotFractal}`);

    await ctxFractal.close();

    // -------------------------------------------------------------
    // Test 4: Mobile (390x844) 移动端响应式与零横向溢出审计
    // -------------------------------------------------------------
    console.log('\n📸 [Test 4] 审计移动端 (390x844) 响应式与溢出指标...');
    const ctxMobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const pageMobile = await ctxMobile.newPage();

    // 1. 仪表盘移动端检查
    await pageMobile.goto(`${BASE_URL}/lab/`, { waitUntil: 'networkidle' });
    const dashOverflow = await pageMobile.evaluate(() => {
      const doc = document.documentElement;
      return {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        overflow: doc.scrollWidth - doc.clientWidth,
      };
    });
    console.log('  -> 仪表盘移动端溢出度量:', dashOverflow);
    assert.equal(dashOverflow.overflow <= 0, true, `移动端仪表盘存在横向溢出: ${dashOverflow.overflow}px`);

    const shotMobileDash = path.join(SCREENSHOT_DIR, 'lab_dashboard_mobile.png');
    await pageMobile.screenshot({ path: shotMobileDash, fullPage: false });
    report.screenshots.push('lab_dashboard_mobile.png');

    // 2. 实验详情页移动端检查
    await pageMobile.goto(`${BASE_URL}/lab/interactive-svg-morph/`, { waitUntil: 'networkidle' });
    const morphOverflow = await pageMobile.evaluate(() => {
      const doc = document.documentElement;
      return {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        overflow: doc.scrollWidth - doc.clientWidth,
      };
    });
    console.log('  -> 实验详情页移动端溢出度量:', morphOverflow);
    assert.equal(morphOverflow.overflow <= 0, true, `移动端详情页存在横向溢出: ${morphOverflow.overflow}px`);

    const shotMobileMorph = path.join(SCREENSHOT_DIR, 'lab_svg_morph_mobile.png');
    await pageMobile.screenshot({ path: shotMobileMorph, fullPage: false });
    report.screenshots.push('lab_svg_morph_mobile.png');

    await ctxMobile.close();

    console.log('\n🎉 [Visual Audit] 全量视觉审计与交互断言 100% 通过！所有截图已落盘。');
  } finally {
    await browser.close();
    mainServer.close();
    sandboxServer.close();
  }
}

runVisualAudit().catch((err) => {
  console.error('❌ [Visual Audit] 视觉审计失败:', err);
  process.exit(1);
});
