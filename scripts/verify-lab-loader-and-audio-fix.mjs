import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PORT = 4390;
const BASE_URL = `http://127.0.0.1:${PORT}`;

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
};

function createStaticServer(baseDir) {
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

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': fileBytes.length,
      });
      res.end(fileBytes);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(err.message);
    }
  });
}

async function runVerification() {
  console.log('🧪 [Test Suite] 开始验证：试验田加载过场收敛与音频加载失败提示会话级控制...');

  // 1. 静态产物 HTML 检查
  console.log('\n📄 [Step 1] 审计 dist 产物 HTML 是否仅在 2 个大界面渲染 #loading-box...');
  const homeHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
  const labHtml = fs.readFileSync(path.join(DIST_DIR, 'lab', 'index.html'), 'utf8');
  const labDetailHtml = fs.readFileSync(path.join(DIST_DIR, 'lab', 'star-trails-simulator', 'index.html'), 'utf8');
  const labPgHtml = fs.readFileSync(path.join(DIST_DIR, 'lab', 'playground', 'index.html'), 'utf8');
  const postHtml = fs.readFileSync(path.join(DIST_DIR, 'posts', 'markdown-syntax-mastery', 'index.html'), 'utf8');

  assert.ok(homeHtml.includes('id="loading-box"'), '首页 (/) 必须包含 loading-box (大界面 1)');
  assert.ok(labHtml.includes('id="loading-box"'), '试验田主页 (/lab/) 必须包含 loading-box (大界面 2)');
  assert.ok(!labDetailHtml.includes('id="loading-box"'), '试验田实验详情页严禁渲染 loading-box (避免重复加载)');
  assert.ok(!labPgHtml.includes('id="loading-box"'), '试验田独立代码工坊严禁渲染 loading-box (避免重复加载)');
  assert.ok(!postHtml.includes('id="loading-box"'), '普通文章页严禁渲染 loading-box (避免重复加载)');
  console.log('  -> 产物 HTML 验证通过：仅 / 与 /lab/ 包含 loading-box，所有分界面与详情页零注入！');

  // 2. 启动静态服务并执行 Playwright 行为测试
  const server = createStaticServer(DIST_DIR);
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // -------------------------------------------------------------
    // Part 1: 试验田加载过场顺畅度与不重复触发测试
    // -------------------------------------------------------------
    console.log('\n🎬 [Part 1] 测试首次进站 /lab/ 加载过场与同一 /lab 下不重复加载...');
    await page.goto(`${BASE_URL}/lab/`, { waitUntil: 'domcontentloaded' });

    // 等待加载过场平滑结束
    await page.waitForFunction(() => {
      return document.documentElement.classList.contains('theme-ready') && !document.getElementById('loading-box');
    }, null, { timeout: 4000 });
    console.log('  -> /lab/ 首次进站：加载过场平滑完成，成功挂载 theme-ready 并且已自动清理 #loading-box！');

    // 验证 sessionStorage 标记已写入
    const seenFlag = await page.evaluate(() => sessionStorage.getItem('shijianus-loader-seen'));
    assert.equal(seenFlag, 'true', 'sessionStorage 必须写入 shijianus-loader-seen=true');

    // 跳转至详情页 /lab/star-trails-simulator/
    console.log('  -> 从 /lab/ 跳转至详情页 /lab/star-trails-simulator/...');
    await page.click('a[href="/lab/star-trails-simulator/"]');
    await page.waitForURL('**/lab/star-trails-simulator/**');
    const hasLoaderInDetail = await page.evaluate(() => Boolean(document.getElementById('loading-box')));
    assert.equal(hasLoaderInDetail, false, '详情页绝对不出现 loading-box');
    console.log('  -> 详情页已进入：无 loading-box，加载极为顺畅！');

    // 从详情页返回 /lab/
    console.log('  -> 从详情页返回 /lab/ 广场...');
    await page.click('a.crumb-back');
    await page.waitForURL('**/lab/**');
    const hasLoaderOnReturn = await page.evaluate(() => Boolean(document.getElementById('loading-box')));
    assert.equal(hasLoaderOnReturn, false, '返回 /lab/ 时严禁再次展示 loading-box');
    console.log('  -> 返回 /lab/ 验证通过：零二次过场，无缝秒开！');

    // -------------------------------------------------------------
    // Part 2: 音频加载失败提示严格控制测试
    // -------------------------------------------------------------
    console.log('\n🎵 [Part 2] 测试音频加载失败提示：仅在 / 且一次进站仅出现 1 次...');

    // 2.1 在 /lab/ 分界面下模拟 audio error
    console.log('  -> 在 /lab/ 分界面下触发 audio.error...');
    const toastShownInLab = await page.evaluate(() => {
      const audio = document.querySelector('audio');
      if (audio) {
        audio.dispatchEvent(new Event('error'));
      }
      const bar = document.getElementById('global-activity-bar');
      const msg = document.getElementById('global-activity-message')?.innerText || '';
      return bar?.classList.contains('show') && msg.includes('音频');
    });
    assert.equal(toastShownInLab, false, '/lab 分界面下严禁弹出音频错误提示');
    console.log('  -> /lab 分界面验证通过：零音频弹窗打扰！');

    // 2.2 在 / 根目录下测试
    console.log('  -> 跳转至 / 根目录...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    // 先清除 sessionStorage 模拟初次进站
    await page.evaluate(() => sessionStorage.removeItem('shijianus_audio_error_toast_shown'));

    console.log('  -> 初次在 / 根目录下触发 audio.error...');
    await page.evaluate(() => {
      const audio = document.querySelector('audio');
      if (audio) {
        audio.dispatchEvent(new Event('error'));
      }
    });
    await page.waitForTimeout(300);

    const isLockedInSession = await page.evaluate(() => {
      return sessionStorage.getItem('shijianus_audio_error_toast_shown') === 'true';
    });
    assert.equal(isLockedInSession, true, '初次触发后必须在 sessionStorage 中锁定');
    console.log('  -> / 根目录下初次错误触发成功，已在会话中锁定！');

    // 2.3 在 / 根目录下再次触发 audio.error (应被拦截)
    console.log('  -> 再次在 / 根目录下触发 audio.error (验证拦截)...');
    const toastIntercepted = await page.evaluate(() => {
      const audio = document.querySelector('audio');
      let called = false;
      const origSnackbar = window.snackbarShow;
      window.snackbarShow = (...args) => {
        called = true;
        if (typeof origSnackbar === 'function') origSnackbar(...args);
      };
      if (audio) {
        audio.dispatchEvent(new Event('error'));
      }
      return !called;
    });
    assert.equal(toastIntercepted, true, '同一次进站二次触发必须被完全拦截，不重复弹窗');
    console.log('  -> 二次触发已成功拦截：同会话内绝对不重复弹出！');

    console.log('\n🎉 [Test Suite] 所有验证项 100% 全部通过！');
    await context.close();
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('❌ [Test Suite] 验证失败:', err);
  process.exit(1);
});
