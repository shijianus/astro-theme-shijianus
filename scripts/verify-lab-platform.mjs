/**
 * Astro Blog「试验田 Lab」Phase 2.6 跨浏览器全链路工程审计、失败关闭策略与多 Origin 沙盒验收套件
 *
 * 覆盖矩阵（Chromium + Firefox + WebKit 三大内核全量执行）：
 * 1. 静态配置与响应头合规审计 (`sandbox-runner/_headers`)：
 *    - 验证 `! Access-Control-Allow-Origin` 剥离默认通配符 CORS 头；
 *    - 验证 `Permissions-Policy` 不含会导致离屏跨站帧冻结的实验性指令；
 *    - 验证 `frame-ancestors` 仅白名单放行 HTTPS 主站与 Pages Preview 域名，不含 localhost。
 * 2. 主站同仿真中间件环境验收 (`127.0.0.1:4355`)：
 *    - `/lab/` 实验广场、全部 6 个 `/lab/[slug]/` 详情页、`ExecutionVisualizer`、`/lab/preview/[slug]/`；
 *    - 受限 TypeScript 子集正常编译与 `enum`/JSX 显式拦截；
 *    - 沙盒分级降级策略：
 *      a) `official` 官方实验在无外部跨站沙盒时显示明确 `official-fallback-banner` 提示并在 `opaque-srcdoc` 运行；
 *      b) `imported` JSON、`community` JSON、`#bundle=` 分享代码禁止自动运行，且在无跨站沙盒时点击运行强制失败关闭 (`Fail-Closed`)，零 iframe 挂载；
 *    - 对抗性安全渗透：Opaque Origin (`null`)、Cookie/Storage/DOM `SecurityError`、CSP `connect-src 'none'`、Worker 阻断、HTML/CSS 逃逸拦截、Console XSS 免疫、`performance.now` 篡改下 `while(true){}` 2.2s 强制熔断、256 定时器上限、200 日志防洪、伪造 `postMessage` 丢弃。
 * 3. 多 Origin 跨站沙盒联调与故障演练 (`127.0.0.1:4357` <-> `localhost:4356`)：
 *    - 跨站沙盒在线时：`official` 零横幅运行于 `cross-origin`；`imported`、`community`、`#bundle=` 仍禁止自动运行，手动点击运行可在 `cross-origin` 双层沙盒中安全执行；
 *    - 关闭跨站沙盒模拟故障：`official` 在 3s 握手超时后显示明确提示回退至 `opaque-srcdoc`；`imported`、`community`、`#bundle=` 在握手超时后立即失败关闭 (`Fail-Closed`)，绝不回退至本地 `srcdoc`。
 * 4. 主题同步、简繁切换源码保护、移动端 `390x844` 全路由零横向溢出与既有博客路由无回归。
 */

import { chromium, firefox, webkit } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SANDBOX_DIR = path.join(ROOT_DIR, 'sandbox-runner');

const MAIN_PORT = 4355;
const BRIDGE_PORT = 4356;
const CROSS_HOST_PORT = 4357;

const BASE_URL = `http://127.0.0.1:${MAIN_PORT}`;
const BRIDGE_ORIGIN = `http://localhost:${BRIDGE_PORT}`;
const CROSS_MAIN_URL = `http://127.0.0.1:${CROSS_HOST_PORT}`;

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
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.flac': 'audio/flac',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function encodeTestShareBundle(bundle) {
  const json = JSON.stringify(bundle);
  return Buffer.from(json, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function parseHeadersFile(headersFilePath) {
  const raw = fs.readFileSync(headersFilePath, 'utf8');
  const headers = {};
  const detached = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('/*')) continue;
    if (trimmed.startsWith('!')) {
      detached.push(trimmed.slice(1).trim());
      continue;
    }
    const colon = trimmed.indexOf(':');
    if (colon > 0) {
      const k = trimmed.slice(0, colon).trim();
      const v = trimmed.slice(colon + 1).trim();
      headers[k] = v;
    }
  }
  return { headers, detached };
}

function buildMainSiteCsp(sandboxOrigin = '') {
  const frameSources = [
    "'self'",
    'https://js.stripe.com',
    'https://hooks.stripe.com',
    'https://challenges.cloudflare.com',
    'https://player.bilibili.com',
    'https://www.bilibili.com',
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com',
    ...(sandboxOrigin ? [sandboxOrigin] : []),
  ].join(' ');

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://img.epocanvas.com https://mail.epocanvas.com https://music-api.gdstudio.xyz https://static.cloudflareinsights.com https:",
    `frame-src ${frameSources}`,
    "frame-ancestors 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');
}

function startStaticDistServer(port, host, options = {}) {
  const { injectExternalSandboxOrigin = '' } = options;
  const cspHeader = buildMainSiteCsp(injectExternalSandboxOrigin);

  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url || '/', `http://${host}:${port}`);
    const reqPath = decodeURIComponent(parsedUrl.pathname);

    let filePath = path.join(DIST_DIR, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!path.extname(filePath) && fs.existsSync(path.join(DIST_DIR, reqPath, 'index.html'))) {
      filePath = path.join(DIST_DIR, reqPath, 'index.html');
    }

    if (!filePath.startsWith(DIST_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const errBody = JSON.stringify({ error: 'Not Found' });
      res.writeHead(404, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(errBody),
        'Content-Security-Policy': cspHeader,
      });
      res.end(errBody);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', cspHeader);

    if (ext === '.html' && injectExternalSandboxOrigin) {
      let html = fs.readFileSync(filePath, 'utf8');
      html = html.replace(
        /&quot;externalSandboxOrigin&quot;:\[0,&quot;&quot;\]/g,
        `&quot;externalSandboxOrigin&quot;:[0,&quot;${injectExternalSandboxOrigin}&quot;]`
      );
      html = html.replace(
        /data-isolation-mode="opaque-srcdoc"/g,
        'data-isolation-mode="cross-origin"'
      );
      html = html.replace(
        /title="当前官方预设运行在无 allow-same-origin 的 Opaque Origin \(null\) 回退沙盒中，且 CSP connect-src &#x27;none&#x27; 阻断外发网络"/g,
        `title="已连接独立跨站沙盒桥接器 (${injectExternalSandboxOrigin})，内层执行帧仍保持无 allow-same-origin 的 Opaque Origin 双重隔离"`
      );
      html = html.replace(
        /<span>Opaque Fallback · 官方本地隔离<\/span>/g,
        '<span>Cross-Site + Opaque 双层沙盒</span>'
      );
      html = html.replace(
        /data-external-sandbox-origin=""/g,
        `data-external-sandbox-origin="${injectExternalSandboxOrigin}"`
      );
      const buf = Buffer.from(html, 'utf8');
      res.setHeader('Content-Length', buf.length);
      res.writeHead(200);
      res.end(buf);
      return;
    }

    const stat = fs.statSync(filePath);
    const isMedia = ['.mp4', '.flac', '.mp3', '.m4a'].includes(ext);
    if (isMedia) {
      res.setHeader('Connection', 'close');
      res.setHeader('Accept-Ranges', 'bytes');
      if (req.method === 'HEAD') {
        res.setHeader('Content-Length', stat.size);
        res.writeHead(200);
        res.end();
        return;
      }
      const rangeHeader = req.headers.range;
      if (rangeHeader && rangeHeader.startsWith('bytes=')) {
        const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
        const start = Math.max(0, parseInt(startStr, 10) || 0);
        const end = endStr ? Math.min(stat.size - 1, parseInt(endStr, 10)) : Math.min(stat.size - 1, start + 65535);
        if (start <= end && start < stat.size) {
          res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
          res.setHeader('Content-Length', end - start + 1);
          res.writeHead(206);
          const stream = fs.createReadStream(filePath, { start, end });
          res.on('close', () => stream.destroy());
          stream.pipe(res);
          return;
        }
      }
      const stream = fs.createReadStream(filePath);
      res.setHeader('Content-Length', stat.size);
      res.writeHead(200);
      res.on('close', () => stream.destroy());
      stream.pipe(res);
      return;
    }

    const fileBuf = fs.readFileSync(filePath);
    res.setHeader('Content-Length', fileBuf.length);
    res.writeHead(200);
    res.end(fileBuf);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}

function startSandboxRunnerServer(port, host) {
  const { headers: securityHeaders } = parseHeadersFile(path.join(SANDBOX_DIR, '_headers'));
  const indexHtml = fs.readFileSync(path.join(SANDBOX_DIR, 'index.html'), 'utf8');

  // 仅在本地 HTTP 回环测试服务器中追加本地宿主 Origin 到 frame-ancestors，保持生产 _headers 纯净
  const localCsp = (securityHeaders['Content-Security-Policy'] || '').replace(
    /frame-ancestors\s+([^;]+);/,
    `frame-ancestors $1 http://127.0.0.1:${MAIN_PORT} http://127.0.0.1:${CROSS_HOST_PORT};`
  );

  const server = http.createServer((req, res) => {
    const parsed = new URL(req.url || '/', `http://${host}:${port}`);
    if (parsed.pathname !== '/' && parsed.pathname !== '/index.html') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': 9 });
      res.end('Not Found');
      return;
    }
    for (const [k, v] of Object.entries(securityHeaders)) {
      res.setHeader(k, k === 'Content-Security-Policy' ? localCsp : v);
    }
    const buf = Buffer.from(indexHtml, 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Length', buf.length);
    res.writeHead(200);
    res.end(buf);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}

async function runBrowserSuite(browserName, browserType) {
  console.log(`\n======================================================================`);
  console.log(`🧭 启动内核全链路验收: ${browserName.toUpperCase()}`);
  console.log(`======================================================================`);

  let mainServer = null;
  let bridgeServer = null;
  let crossHostServer = null;
  let browser = null;

  const engineReport = {
    browser: browserName,
    version: '',
    functional: {},
    security: {},
    degradationPolicy: {},
    crossOriginBridge: {},
    performance: {},
    uncaughtPageErrors: 0,
  };

  try {
    mainServer = await startStaticDistServer(MAIN_PORT, '127.0.0.1');
    bridgeServer = await startSandboxRunnerServer(BRIDGE_PORT, 'localhost');
    crossHostServer = await startStaticDistServer(CROSS_HOST_PORT, '127.0.0.1', {
      injectExternalSandboxOrigin: BRIDGE_ORIGIN,
    });

    browser = await browserType.launch({ headless: true });
    engineReport.version = browser.version();

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    });
    // 阻断与 Lab 无关且当前 DNS 超时的外链友邻图床请求，避免阻塞 Linux WebKit GResolver 线程池
    await context.route('https://drawing.shijian.qzz.io/**', (route) => route.abort());
    let page = await context.newPage();
    const pageConsoleErrors = [];
    const pendingRequests = new Set();

    const attachPageListeners = (p) => {
      p.on('pageerror', (err) => {
        const msg = String(err?.message || err || '');
        // Playwright WebKit 会将已被 try/catch 捕获的导航中断或外链歌词 API CORS 拦截日志以 `/... due to access control checks.` 投递至 pageerror
        if (browserName === 'webkit' && /^\/.* due to access control checks\.$/.test(msg.trim())) {
          return;
        }
        pageConsoleErrors.push(msg);
      });
      p.on('request', (req) => {
        pendingRequests.add(req.url());
      });
      p.on('requestfinished', (req) => {
        pendingRequests.delete(req.url());
      });
      p.on('requestfailed', (req) => {
        pendingRequests.delete(req.url());
      });
    };
    attachPageListeners(page);

    const resetPage = async () => {
      const oldPage = page;
      page = await context.newPage();
      attachPageListeners(page);
      await Promise.race([
        oldPage.close().catch(() => {}),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    };

    const clickTarget = async (target) => {
      const loc = typeof target === 'string' ? page.locator(target) : target;
      if (browserName === 'webkit') {
        await loc.evaluate((el) => el.click());
      } else {
        await loc.click();
      }
    };

    // =========================================================================
    // Part 1: /lab/ 实验广场、原有 4 实验回归、无障碍弹窗与圆角检查
    // =========================================================================
    console.log(`🔍 [${browserName} · Part 1] 验证 /lab/ 实验广场与弹窗无障碍...`);
    const navStart = Date.now();
    const hubRes = await page.goto(`${BASE_URL}/lab/`, { waitUntil: 'load' });
    engineReport.performance.labHomeLoadMs = Date.now() - navStart;

    assert.ok(
      hubRes?.headers()['content-security-policy']?.includes("form-action 'self'"),
      '主站 HTTP CSP 必须包含 form-action self'
    );
    assert.equal(
      await page.locator('#lab-experiments-grid [data-exp-slug]').count(),
      6,
      '应展示全部 6 个官方实验卡片'
    );
    assert.equal(await page.locator('#lab-star-canvas').count(), 1);
    assert.equal(await page.locator('#plane-3d').count(), 1);
    assert.equal(await page.locator('.sound-pad').count(), 6);
    assert.equal(await page.locator('#fx-input-val').count(), 1);

    await page.fill('#fx-input-val', '100');
    await page.dispatchEvent('#fx-input-val', 'input');
    assert.equal((await page.locator('#fx-cny-out').textContent())?.trim(), '¥ 725.00');

    await clickTarget('[data-filter-category="physics"]');
    assert.equal(await page.locator('#lab-experiments-grid [data-exp-slug]:visible').count(), 2);
    await clickTarget('[data-filter-category="all"]');

    await page.selectOption('#lab-tag-select', 'TypeScript');
    assert.equal(await page.locator('#lab-experiments-grid [data-exp-slug]:visible').count(), 1);
    await page.selectOption('#lab-tag-select', 'all');

    await page.fill('#lab-search-input', '二分查找');
    assert.equal(await page.locator('#lab-experiments-grid [data-exp-slug]:visible').count(), 1);
    await page.fill('#lab-search-input', '');
    await page.dispatchEvent('#lab-search-input', 'input');

    const modalTrigger = page.locator('[data-target-slug="star-trails-simulator"]');
    await clickTarget(modalTrigger);
    assert.equal(await page.locator('#lab-source-modal').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#lab-source-modal').isVisible(), false);

    const labText = await page.locator('#lab-dashboard').innerText();
    for (const forbidden of ['AnZhiYu', 'anzhiyu', 'anheyu', '安知鱼']) {
      assert.equal(labText.includes(forbidden), false, `不得包含违禁品牌词: ${forbidden}`);
    }
    const maxRadius = await page.evaluate(() => {
      const els = document.querySelectorAll('.lab-hero, .lab-card, .lab-filter-bar, .lab-modal-dialog');
      let max = 0;
      for (const el of els) {
        const r = parseFloat(window.getComputedStyle(el).borderRadius) || 0;
        if (r > max) max = r;
      }
      return max;
    });
    assert.ok(maxRadius <= 8, `Lab 卡片圆角 (${maxRadius}px) 必须 <= 8px`);
    engineReport.functional.labHub = 'PASS';

    // =========================================================================
    // Part 2: 全部 6 个详情页零报错巡检与 ExecutionVisualizer
    // =========================================================================
    console.log(`🔍 [${browserName} · Part 2] 巡检 6 个详情页、官方本地回退提示与算法可视化器...`);
    const allSlugs = [
      'star-trails-simulator',
      'aerodynamic-contrail',
      'web-audio-haptics',
      'fx-currency-converter',
      'algorithm-execution-tracer',
      'verlet-rope-physics',
    ];

    for (const slug of allSlugs) {
      console.log(`🔍 [${browserName} · Part 2] 正在巡检详情页: /lab/${slug}/`);
      const startTime = Date.now();
      const res = await page.goto(`${BASE_URL}/lab/${slug}/`, { waitUntil: 'domcontentloaded' });
      assert.equal(res?.status(), 200);
      try {
        await page.waitForFunction(
          () => {
            const el = document.querySelector('#lab-playground-workspace');
            const s = el?.getAttribute('data-exec-status');
            return s === 'completed' || s === 'error';
          },
          null,
          { timeout: 15000, polling: 100 }
        );
        console.log(`[${browserName}] /lab/${slug}/ 完成，耗时: ${Date.now() - startTime}ms`);
      } catch (err) {
        const debugInfo = await page.evaluate(() => {
          const el = document.querySelector('#lab-playground-workspace');
          const iframe = document.querySelector('iframe');
          return {
            execStatus: el?.getAttribute('data-exec-status'),
            isolationMode: el?.getAttribute('data-isolation-mode'),
            iframeSrc: iframe?.src,
            iframeSrcDocLength: iframe?.srcdoc?.length,
            hasIframe: Boolean(iframe),
            errors: document.querySelector('[data-testid="runtime-error-list"]')?.innerText,
            consoleOutput: document.querySelector('[data-testid="console-output-body"]')?.innerText,
          };
        });
        console.error(`[${browserName}] 详情页 /lab/${slug}/ 超时调试信息:`, debugInfo);
        throw err;
      }
      assert.equal(
        await page.locator('#lab-playground-workspace').getAttribute('data-exec-status'),
        'completed',
        `/lab/${slug}/ 必须零报错完成`
      );
      assert.equal(
        await page.getByTestId('official-fallback-banner').isVisible(),
        true,
        `/lab/${slug}/ 在无外部跨站沙盒时应明确提示官方实验回退至本地 opaque srcdoc`
      );

      if (slug === 'algorithm-execution-tracer') {
        assert.equal(await page.locator('#lab-execution-visualizer').isVisible(), true);
        await page.waitForSelector('[data-testid="viz-btn-next"]', { timeout: 10000 });
        await page.waitForTimeout(300);
        await clickTarget(page.getByTestId('viz-btn-next'));
        await clickTarget(page.getByTestId('viz-btn-next'));
        assert.ok((await page.getByTestId('viz-step-counter').textContent())?.includes('步骤 3 /'));
        await clickTarget(page.locator('[data-algo-tab="quick-sort-recursion"]'));
        await page.waitForTimeout(400);
        await clickTarget(page.getByTestId('viz-btn-next'));
        await clickTarget(page.getByTestId('viz-btn-next'));
        assert.ok((await page.getByTestId('viz-call-stack').locator('.stack-frame').count()) >= 2);
      }
      if (browserName === 'webkit') {
        await resetPage();
      }
    }
    engineReport.functional.detailRoutesAndVisualizer = 'PASS';

    // =========================================================================
    // Part 3: 代码工坊、沙盒安全渗透、防篡改死循环熔断与无跨站沙盒时的 Fail-Closed 门禁
    // =========================================================================
    await resetPage();
    console.log(`🛡️ [${browserName} · Part 3] 验证工坊安全渗透、防篡改死循环熔断与非官方代码 Fail-Closed...`);
    await page.goto(`${BASE_URL}/lab/playground/?slug=star-trails-simulator`, {
      waitUntil: 'commit',
    });
    try {
      await page.waitForFunction(
        () => {
          const ws = document.querySelector('#lab-playground-workspace');
          return (
            ws?.getAttribute('data-mode') === 'full-workshop' &&
            ws?.getAttribute('data-exec-status') === 'completed'
          );
        },
        null,
        { timeout: 15000, polling: 100 }
      );
    } catch (err) {
      const debugInfo = await page.evaluate(() => {
        const el = document.querySelector('#lab-playground-workspace');
        const iframe = document.querySelector('iframe');
        return {
          execStatus: el?.getAttribute('data-exec-status'),
          isolationMode: el?.getAttribute('data-isolation-mode'),
          sourceKind: el?.getAttribute('data-source-kind'),
          iframeSrc: iframe?.src,
          iframeSrcDocLength: iframe?.srcdoc?.length,
          hasIframe: Boolean(iframe),
          errors: document.querySelector('[data-testid="runtime-error-list"]')?.innerText,
          consoleOutput: document.querySelector('[data-testid="console-output-body"]')?.innerText,
        };
      });
      console.error(`[${browserName}] Part 3 playground 入口超时调试信息:`, debugInfo);
      console.error(`[${browserName}] 挂起的未完成请求:`, Array.from(pendingRequests));
      throw err;
    }

    // 3.1 历史导航与 TS 语法护栏
    await page.getByTestId('playground-preset-select').selectOption('verlet-rope-physics');
    try {
      await page.waitForFunction(
        () =>
          window.location.search.includes('slug=verlet-rope-physics') &&
          document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') ===
            'completed',
        null,
        { timeout: 15000, polling: 100 }
      );
    } catch (e) {
      const diag = await page.evaluate(() => ({
        url: window.location.href,
        selectVal: document.querySelector('[data-testid="playground-preset-select"]')?.value,
        execStatus: document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status'),
        errors: document.querySelector('[data-testid="runtime-error-list"]')?.innerText,
      }));
      console.error(`[${browserName}] 3.1 selectOption diag:`, diag);
      throw e;
    }
    assert.ok(page.url().includes('slug=verlet-rope-physics'));

    await clickTarget(page.locator('[data-file-tab="script.ts"]'));
    await page.waitForSelector('[data-file-tab="script.ts"][aria-selected="true"]', { timeout: 5000 });
    await page.getByTestId('lab-code-textarea').fill('enum BadMode { Fast, Slow }\nconsole.log(BadMode.Fast);');
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForSelector('[data-testid="runtime-error-list"]', { timeout: 8000 });
    assert.ok((await page.getByTestId('runtime-error-list').innerText()).includes('不支持 TypeScript `enum`'));

    // 3.2 全面沙盒逃逸与跨源隔离探针
    await page.getByTestId('playground-preset-select').selectOption('star-trails-simulator');
    await page.waitForFunction(
      () => document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') === 'completed',
      null,
      { timeout: 15000, polling: 100 }
    );

    await page.evaluate(() => {
      document.cookie = 'shijianus_secret_session=SensitiveCookieValue999; path=/';
      window.localStorage.setItem(
        'shijianus-comment-account',
        JSON.stringify({ token: 'SecretAdminToken_XYZ', role: 'admin' })
      );
    });

    assert.equal(
      await page.getByTestId('lab-sandbox-iframe').getAttribute('sandbox'),
      'allow-scripts'
    );

    await clickTarget(page.locator('[data-file-tab="index.html"]'));
    await page.waitForSelector('[data-file-tab="index.html"][aria-selected="true"]', { timeout: 5000 });
    await page
      .getByTestId('lab-code-textarea')
      .fill('<textarea>unclosed</script><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" onerror="window.__inline_csp_bypass=1"><div id="dom-ok">SAFE_DOM</div>');
    await clickTarget(page.locator('[data-file-tab="style.css"]'));
    await page.waitForSelector('[data-file-tab="style.css"][aria-selected="true"]', { timeout: 5000 });
    await page.getByTestId('lab-code-textarea').fill('body { --x: "</style><script>window.__css_escape_bypass=1</script>"; }');
    await clickTarget(page.locator('[data-file-tab="script.js"]'));
    await page.waitForSelector('[data-file-tab="script.js"][aria-selected="true"]', { timeout: 5000 });

    const securityProbeScript = `
      console.log('PROBE_ORIGIN:' + window.origin);
      console.log('SESSION_LEAK_IN_DOM:' + document.documentElement.outerHTML.includes('lab-sess-'));
      console.log('INLINE_BYPASS:' + Boolean(window.__inline_csp_bypass || window.__css_escape_bypass));

      try {
        const c = document.cookie;
        console.log('COOKIE_LEAK:' + c);
      } catch (e) {
        console.log('COOKIE_BLOCKED:' + (e && e.name ? e.name : 'Blocked'));
      }

      try {
        const ls = window.localStorage.getItem('shijianus-comment-account');
        console.log('STORAGE_LEAK:' + ls);
      } catch (e) {
        console.log('STORAGE_BLOCKED:' + (e && e.name ? e.name : 'Blocked'));
      }

      try {
        const domTitle = window.parent.document.title;
        console.log('DOM_LEAK:' + domTitle);
      } catch (e) {
        console.log('DOM_BLOCKED:' + (e && e.name ? e.name : 'Blocked'));
      }

      try {
        const blobUrl = URL.createObjectURL(new Blob(['postMessage("WORKER_RAN")'], { type: 'text/javascript' }));
        const w = new Worker(blobUrl);
        let settled = false;
        w.onmessage = () => { settled = true; console.log('WORKER_ALLOWED'); };
        w.onerror = () => { if (!settled) { settled = true; console.log('WORKER_BLOCKED:EventError'); } };
        setTimeout(() => { if (!settled) { settled = true; console.log('WORKER_BLOCKED:SilentDrop'); } }, 250);
      } catch (e) {
        console.log('WORKER_BLOCKED:' + (e && e.name ? e.name : 'SyncException'));
      }

      Promise.allSettled([
        fetch('https://example.com/malicious-exfil'),
        fetch('${BASE_URL}/api/comments?slug=test')
      ]).then((results) => {
        const allBlocked = results.every((r) => r.status === 'rejected');
        console.log('ALL_FETCH_BLOCKED:' + allBlocked);
      });

      console.log('<img src=x onerror="window.__host_xss_pwned=true">');
    `;

    await page.getByTestId('lab-code-textarea').fill(securityProbeScript);
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForTimeout(1000);

    await clickTarget(page.getByTestId('tab-console'));
    const consoleText = await page.getByTestId('console-log-list').innerText();

    assert.ok(consoleText.includes('PROBE_ORIGIN:null'), `[${browserName}] window.origin 必须为 null`);
    assert.ok(consoleText.includes('SESSION_LEAK_IN_DOM:false'), `[${browserName}] DOM 不得泄露 SESSION_ID`);
    assert.ok(consoleText.includes('INLINE_BYPASS:false'), `[${browserName}] 内联与闭合逃逸必须拦截`);
    assert.ok(consoleText.includes('COOKIE_BLOCKED:'), `[${browserName}] 读取 Cookie 必须被拦截`);
    assert.equal(consoleText.includes('SensitiveCookieValue999'), false);
    assert.ok(consoleText.includes('STORAGE_BLOCKED:'), `[${browserName}] 读取 localStorage 必须被拦截`);
    assert.equal(consoleText.includes('SecretAdminToken_XYZ'), false);
    assert.ok(consoleText.includes('DOM_BLOCKED:'), `[${browserName}] 读取父窗口 DOM 必须被拦截`);
    assert.ok(consoleText.includes('WORKER_BLOCKED:'), `[${browserName}] Blob Worker 必须被拦截`);
    assert.equal(consoleText.includes('WORKER_ALLOWED'), false);
    assert.ok(consoleText.includes('ALL_FETCH_BLOCKED:true'), `[${browserName}] 网络请求必须全部被拦截`);
    assert.equal(await page.evaluate(() => Boolean(window.__host_xss_pwned)), false);
    engineReport.security.opaqueAndCspIsolation = 'PASS';

    // 3.3 防篡改死循环保护 (`performance.now = () => 0` + `try/catch` 绕过尝试)
    await clickTarget(page.getByTestId('btn-reset-code'));
    await clickTarget(page.locator('[data-file-tab="script.js"]'));
    await page.waitForSelector('[data-file-tab="script.js"][aria-selected="true"]', { timeout: 5000 });
    await page
      .getByTestId('lab-code-textarea')
      .fill('performance.now = () => 0;\nfor (;;) { try { while (true) {} } catch (_e) {} }');
    const loopStart = Date.now();
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForSelector('[data-testid="runtime-error-item"]', { timeout: 6000 });
    const loopElapsed = Date.now() - loopStart;
    const loopErr = await page.getByTestId('runtime-error-list').innerText();
    assert.ok(
      loopErr.includes('[Sandbox Timeout]'),
      `[${browserName}] 篡改 performance.now 的死循环仍须触发 [Sandbox Timeout]，实际: ${loopErr}`
    );
    engineReport.security.tamperProofLoopGuard = `PASS (${loopElapsed}ms)`;

    // 3.4 定时器配额与 Console 洪泛及伪造消息防护
    await page
      .getByTestId('lab-code-textarea')
      .fill('for (let i = 0; i < 400; i++) { setInterval(() => {}, 50); }');
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForTimeout(500);
    assert.ok((await page.getByTestId('runtime-error-list').innerText()).includes('并发计时器数量超过安全上限'));

    await page
      .getByTestId('lab-code-textarea')
      .fill('for (let i = 0; i < 500; i++) console.log("flood-" + i);');
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForTimeout(600);
    await clickTarget(page.getByTestId('tab-console'));
    assert.ok((await page.getByTestId('console-log-list').locator('.console-row').count()) <= 201);

    await clickTarget(page.getByTestId('btn-clear-console'));
    await page.evaluate(() => {
      window.postMessage(
        {
          protocol: 'LAB_SANDBOX_PROTOCOL_V1',
          sessionId: 'forged-invalid-session-id',
          type: 'CONSOLE_EVENT',
          payload: { level: 'error', args: ['FORGED_MESSAGE_INJECTED'] },
        },
        '*'
      );
    });
    await page.waitForTimeout(150);
    assert.equal(
      (await page.getByTestId('console-output-body').innerText()).includes('FORGED_MESSAGE_INJECTED'),
      false
    );
    engineReport.security.resourceQuotaAndMessageAuth = 'PASS';

    // 3.5 JSON 导出 + 无独立跨站沙盒时 imported / community / #bundle= 强制失败关闭 (Fail-Closed)
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      clickTarget(page.getByTestId('btn-export-json')),
    ]);
    const exportedPath = await download.path();
    const exportedJson = JSON.parse(fs.readFileSync(exportedPath, 'utf8'));
    assert.equal(exportedJson.version, 'lab-bundle-v1');

    // (a) imported JSON 在无跨站沙盒时：禁止自动运行 + 点击运行必须 Fail-Closed
    exportedJson.files = [
      { name: 'index.html', language: 'html', content: '<div>Imported View</div>' },
      { name: 'script.js', language: 'javascript', content: 'console.log("IMPORTED_CROSS_SITE_OK");' },
    ];
    await page.getByTestId('input-import-file').setInputFiles({
      name: 'imported-test.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(exportedJson), 'utf8'),
    });
    await page.waitForFunction(
      () =>
        document.querySelector('#lab-playground-workspace')?.getAttribute('data-source-kind') ===
          'imported' &&
        document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') ===
          'idle',
      null,
      { timeout: 5000, polling: 100 }
    );
    assert.equal(await page.getByTestId('untrusted-code-banner').isVisible(), true);
    assert.equal(await page.locator('#lab-playground-workspace').getAttribute('data-source-kind'), 'imported');
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0, '导入 JSON 严禁自动执行');

    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForTimeout(250);
    assert.equal(
      await page.locator('#lab-playground-workspace').getAttribute('data-fail-closed'),
      'true',
      '无跨站沙盒时点击运行 imported 代码必须失败关闭'
    );
    assert.equal(await page.getByTestId('sandbox-fail-closed-banner').isVisible(), true);
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0, 'Fail-Closed 时严禁挂载任何 srcdoc iframe');

    // (b) community JSON 在无跨站沙盒时：禁止自动运行 + 点击运行必须 Fail-Closed
    const communityJson = {
      ...exportedJson,
      sourceKind: 'community',
      author: { name: 'CommunityTester', role: 'community' },
      files: [
        { name: 'index.html', language: 'html', content: '<div>Community View</div>' },
        { name: 'script.js', language: 'javascript', content: 'console.log("COMMUNITY_CROSS_SITE_OK");' },
      ],
    };
    await page.getByTestId('input-import-file').setInputFiles({
      name: 'community-test.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(communityJson), 'utf8'),
    });
    await page.waitForFunction(
      () =>
        document.querySelector('#lab-playground-workspace')?.getAttribute('data-source-kind') ===
          'community' &&
        document.querySelector('#lab-playground-workspace')?.getAttribute('data-fail-closed') ===
          'false',
      null,
      { timeout: 5000, polling: 100 }
    );
    assert.equal(await page.locator('#lab-playground-workspace').getAttribute('data-source-kind'), 'community');
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0, 'community 代码严禁自动执行');

    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#lab-playground-workspace').getAttribute('data-fail-closed'), 'true');
    assert.equal(await page.getByTestId('sandbox-fail-closed-banner').isVisible(), true);
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0);

    // (c) #bundle= 分享代码在无跨站沙盒时：禁止自动运行 + 点击运行必须 Fail-Closed
    const bundlePayload = {
      ...exportedJson,
      files: [
        { name: 'index.html', language: 'html', content: '<div>Bundle View</div>' },
        { name: 'script.js', language: 'javascript', content: 'console.log("BUNDLE_CROSS_SITE_OK");' },
      ],
    };
    const encodedHash = encodeTestShareBundle(bundlePayload);
    await page.goto(
      `${BASE_URL}/lab/playground/?slug=star-trails-simulator#bundle=${encodedHash}`,
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#lab-playground-workspace').getAttribute('data-source-kind'), 'bundle');
    assert.equal(await page.getByTestId('untrusted-code-banner').isVisible(), true);
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0, '#bundle= 严禁自动执行');

    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#lab-playground-workspace').getAttribute('data-fail-closed'), 'true');
    assert.equal(await page.getByTestId('sandbox-fail-closed-banner').isVisible(), true);
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0);
    engineReport.degradationPolicy.unconfiguredSandboxFailClosed = 'PASS (imported / community / #bundle= all fail-closed)';

    // =========================================================================
    // Part 4: 多 Origin 跨站沙盒联调 (`127.0.0.1:4357` <-> `localhost:4356`) 与故障分级演练
    // =========================================================================
    await resetPage();
    console.log(`🌐 [${browserName} · Part 4] 验证多 Origin 跨站沙盒联调与断连分级降级/失败关闭...`);
    await page.goto(`${CROSS_MAIN_URL}/lab/playground/?slug=verlet-rope-physics`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForFunction(
      () => document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') === 'completed',
      null,
      { timeout: 15000, polling: 100 }
    );

    assert.equal(
      await page.locator('#lab-playground-workspace').getAttribute('data-isolation-mode'),
      'cross-origin'
    );
    assert.equal(
      await page.getByTestId('lab-sandbox-iframe').getAttribute('src'),
      `${BRIDGE_ORIGIN}/`
    );
    assert.equal(
      await page.getByTestId('official-fallback-banner').count(),
      0,
      '跨站沙盒正常连接时不应显示回退横幅'
    );

    // 4.1 跨站沙盒在线时：手动运行 imported / community / #bundle= 均在 cross-origin 双层沙盒中正常执行
    await page.getByTestId('input-import-file').setInputFiles({
      name: 'imported-cross.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(exportedJson), 'utf8'),
    });
    await page.waitForFunction(
      () =>
        document.querySelector('#lab-playground-workspace')?.getAttribute('data-source-kind') ===
          'imported' &&
        document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') ===
          'idle',
      null,
      { timeout: 5000, polling: 100 }
    );
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0, '跨站模式下导入 JSON 仍禁止自动运行');
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForFunction(
      () => document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') === 'completed',
      null,
      { timeout: 15000, polling: 100 }
    );
    await clickTarget(page.getByTestId('tab-console'));
    assert.ok((await page.getByTestId('console-log-list').innerText()).includes('IMPORTED_CROSS_SITE_OK'));

    await page.goto(
      `${CROSS_MAIN_URL}/lab/playground/?slug=star-trails-simulator#bundle=${encodedHash}`,
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForTimeout(250);
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0, '跨站模式下 #bundle= 仍禁止自动运行');
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForFunction(
      () => document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') === 'completed',
      null,
      { timeout: 15000, polling: 100 }
    );
    await clickTarget(page.getByTestId('tab-console'));
    assert.ok((await page.getByTestId('console-log-list').innerText()).includes('BUNDLE_CROSS_SITE_OK'));

    // 4.2 关闭跨站沙盒服务器模拟远端不可达：
    //     - #bundle= / community / imported 代码必须 3s 超时后立即失败关闭 (Fail-Closed)，严禁回退 srcdoc！
    //     - official 官方预设实验在明确提示横幅后安全回退至本地 opaque-srcdoc！
    bridgeServer.closeAllConnections?.();
    await new Promise((resolve) => bridgeServer.close(resolve));
    bridgeServer = null;

    // 先验证当前处于 #bundle= 模式的页面点击运行 -> 3s 后必须失败关闭！
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForFunction(
      () => document.querySelector('#lab-playground-workspace')?.getAttribute('data-fail-closed') === 'true',
      null,
      { timeout: 8000, polling: 100 }
    );
    assert.equal(await page.getByTestId('sandbox-fail-closed-banner').isVisible(), true);
    assert.equal(
      await page.getByTestId('lab-sandbox-iframe').count(),
      0,
      '跨站沙盒不可达时 #bundle= 代码必须销毁 iframe 并失败关闭，绝不可回退本地 srcdoc'
    );

    // 再导入 community JSON 点击运行 -> 3s 后同样必须失败关闭！
    await page.getByTestId('input-import-file').setInputFiles({
      name: 'community-outage.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(communityJson), 'utf8'),
    });
    await page.waitForFunction(
      () =>
        document.querySelector('#lab-playground-workspace')?.getAttribute('data-source-kind') ===
          'community' &&
        document.querySelector('#lab-playground-workspace')?.getAttribute('data-fail-closed') ===
          'false',
      null,
      { timeout: 5000, polling: 100 }
    );
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForFunction(
      () => document.querySelector('#lab-playground-workspace')?.getAttribute('data-fail-closed') === 'true',
      null,
      { timeout: 8000, polling: 100 }
    );
    assert.equal(await page.getByTestId('sandbox-fail-closed-banner').isVisible(), true);
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0);

    // 切换回 official 官方预设实验 -> 3s 握手超时后必须显示明确提示横幅并回退至 opaque-srcdoc 完成运行！
    await page.goto(`${CROSS_MAIN_URL}/lab/playground/?slug=star-trails-simulator`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForFunction(
      () =>
        document.querySelector('#lab-playground-workspace')?.getAttribute('data-isolation-mode') ===
          'opaque-srcdoc' &&
        document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') ===
          'completed',
      null,
      { timeout: 15000, polling: 100 }
    );
    assert.equal(
      await page.getByTestId('official-fallback-banner').isVisible(),
      true,
      'official 实验在跨站沙盒超时回退后必须展示明确提示横幅'
    );
    engineReport.crossOriginBridge.onlineAndOutageDegradation = 'PASS (official explicit fallback + untrusted fail-closed)';

    // =========================================================================
    // Part 5: 主题同步、简繁切换保护、独立预览页与移动端 390x844 全路由零横向溢出
    // =========================================================================
    await resetPage();
    console.log(`📱 [${browserName} · Part 5] 验证主题、简繁切换、独立预览页与移动端 390x844...`);
    await page.goto(`${BASE_URL}/lab/playground/?slug=verlet-rope-physics`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForFunction(
      () =>
        document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') ===
          'completed' && typeof window.__shijianus_applyLocaleVariant === 'function',
      null,
      { timeout: 15000, polling: 100 }
    );
    await clickTarget(page.locator('[data-file-tab="script.ts"]'));
    await page.waitForSelector('[data-file-tab="script.ts"][aria-selected="true"]', { timeout: 5000 });
    const codeBeforeLocale = await page.getByTestId('lab-code-textarea').inputValue();

    await page.evaluate(async () => {
      if (window.__shijianus_applyLocaleVariant) {
        await window.__shijianus_applyLocaleVariant('zh-Hant');
      }
    });
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="btn-run-code"]')?.textContent?.includes('執行程式碼'),
      null,
      { timeout: 8000, polling: 100 }
    );
    assert.ok((await page.getByTestId('btn-run-code').innerText()).includes('執行程式碼'));
    assert.equal(await page.getByTestId('lab-code-textarea').inputValue(), codeBeforeLocale);

    await page.evaluate(async () => {
      if (window.__shijianus_applyLocaleVariant) {
        await window.__shijianus_applyLocaleVariant('zh-CN');
      }
    });

    await page.goto(`${BASE_URL}/lab/preview/star-trails-simulator/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="standalone-preview-iframe"]', { timeout: 10000 });
    assert.equal(
      await page.getByTestId('standalone-preview-iframe').getAttribute('sandbox'),
      'allow-scripts'
    );
    assert.equal(await page.getByTestId('preview-fallback-banner').isVisible(), true);

    await resetPage();
    await page.setViewportSize({ width: 390, height: 844 });
    for (const mobilePath of [
      '/lab/',
      '/lab/playground/?slug=star-trails-simulator',
      '/lab/algorithm-execution-tracer/',
      '/lab/preview/star-trails-simulator/',
    ]) {
      await page.goto(`${BASE_URL}${mobilePath}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(250);
      const overflowInfo = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      assert.ok(
        overflowInfo.scrollWidth <= overflowInfo.innerWidth + 2,
        `[${browserName}] 移动端 ${mobilePath} 横向溢出: ${overflowInfo.scrollWidth} > ${overflowInfo.innerWidth}`
      );
    }

    for (const blogPath of ['/', '/about/']) {
      await resetPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      const r = await page.goto(`${BASE_URL}${blogPath}`, { waitUntil: 'domcontentloaded' });
      assert.equal(r?.status(), 200);
    }

    assert.equal(
      pageConsoleErrors.length,
      0,
      `[${browserName}] 验收全程不得存在未捕获页面 JS 异常: ${pageConsoleErrors.join('; ')}`
    );
    engineReport.functional.themeI18nMobileAndBlogRegression = 'PASS';
    engineReport.uncaughtPageErrors = 0;

    await Promise.race([
      context.close().catch(() => {}),
      new Promise((r) => setTimeout(r, 2000)),
    ]);
    return engineReport;
  } finally {
    if (browser) {
      await Promise.race([
        browser.close().catch(() => {}),
        new Promise((r) => setTimeout(r, 3000)),
      ]);
    }
    if (mainServer) {
      mainServer.closeAllConnections?.();
      await new Promise((r) => mainServer.close(r));
    }
    if (bridgeServer) {
      bridgeServer.closeAllConnections?.();
      await new Promise((r) => bridgeServer.close(r));
    }
    if (crossHostServer) {
      crossHostServer.closeAllConnections?.();
      await new Promise((r) => crossHostServer.close(r));
    }
  }
}

async function main() {
  if (!fs.existsSync(path.join(DIST_DIR, 'lab', 'index.html'))) {
    throw new Error('未找到 dist/lab/index.html，请先执行 npm run build。');
  }

  console.log('🧪 [Part 0] 审计 sandbox-runner/_headers 静态配置合规性...');
  const { headers: sandboxHeaders, detached } = parseHeadersFile(path.join(SANDBOX_DIR, '_headers'));
  assert.ok(
    detached.includes('Access-Control-Allow-Origin'),
    'sandbox-runner/_headers 必须包含 ! Access-Control-Allow-Origin 以移除 Cloudflare 默认通配符头'
  );
  assert.ok(sandboxHeaders['Content-Security-Policy']?.includes("default-src 'none'"));
  assert.ok(sandboxHeaders['Content-Security-Policy']?.includes("connect-src 'none'"));
  assert.ok(sandboxHeaders['Content-Security-Policy']?.includes("worker-src 'none'"));
  assert.ok(sandboxHeaders['Content-Security-Policy']?.includes("frame-src 'self' blob:"));
  assert.ok(sandboxHeaders['Content-Security-Policy']?.includes('frame-ancestors https://blog.epocanvas.com'));
  assert.ok(sandboxHeaders['Content-Security-Policy']?.includes('https://*.shijianus-blog.pages.dev'));
  assert.equal(
    sandboxHeaders['Content-Security-Policy']?.includes('localhost'),
    false,
    '部署态 sandbox-runner/_headers 不得残留 localhost 白名单'
  );
  assert.equal(
    sandboxHeaders['Permissions-Policy']?.includes('execution-while-out-of-viewport'),
    false,
    'Permissions-Policy 不得包含会导致离屏跨站帧握手冻结的实验性指令'
  );

  const summary = {
    timestamp: new Date().toISOString(),
    node: process.version,
    headersStaticAudit: 'PASS',
    browsers: {},
  };

  const allEngines = [
    ['chromium', chromium],
    ['firefox', firefox],
    ['webkit', webkit],
  ];
  const targetBrowser = (process.env.TARGET_BROWSER || '').toLowerCase();
  const engines = targetBrowser
    ? allEngines.filter(([name]) => name === targetBrowser)
    : allEngines;

  for (const [name, engine] of engines) {
    summary.browsers[name] = await runBrowserSuite(name, engine);
  }

  const reportDir = path.join(ROOT_DIR, 'scratch', 'phase-2.6-audit');
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportDir, 'local-three-browser-report.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  console.log('\n🎉 [Lab Phase 2.6 Cross-Browser Verification] Chromium + Firefox + WebKit 三核全链路验收全部通过！');
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ [Lab Phase 2.6 Verification] 测试失败:', err);
    process.exit(1);
  });
