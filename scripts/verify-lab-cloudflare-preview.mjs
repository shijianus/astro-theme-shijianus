/**
 * Astro Blog「试验田 Lab」Phase 2.6 真实 Cloudflare Pages Preview 跨站安全与三核回归验收套件
 *
 * 用法：
 *   PREVIEW_BASE_URL="https://review-lab-phase-2-5.shijianus-blog.pages.dev" \
 *   SANDBOX_ORIGIN_URL="https://epocanvas-lab-sandbox-staging.pages.dev" \
 *   node scripts/verify-lab-cloudflare-preview.mjs
 *
 * 严格红线：
 *   本脚本严禁对生产域名 `https://blog.epocanvas.com` 发起任何攻击性安全探测（启动时强制校验拦截）。
 */

import { chromium, firefox, webkit } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const PREVIEW_BASE_URL = (process.env.PREVIEW_BASE_URL || '').trim().replace(/\/+$/, '');
const SANDBOX_ORIGIN_URL = (process.env.SANDBOX_ORIGIN_URL || '').trim().replace(/\/+$/, '');

if (!PREVIEW_BASE_URL || !SANDBOX_ORIGIN_URL) {
  console.error('用法错误：必须显式提供 PREVIEW_BASE_URL 与 SANDBOX_ORIGIN_URL 环境变量。');
  process.exit(1);
}

const previewHost = new URL(PREVIEW_BASE_URL).hostname.toLowerCase();
const sandboxHost = new URL(SANDBOX_ORIGIN_URL).hostname.toLowerCase();

if (
  previewHost === 'blog.epocanvas.com' ||
  previewHost === 'epocanvas.com' ||
  previewHost === 'shijianus-blog.pages.dev'
) {
  throw new Error(
    `安全门禁阻断：严禁针对主站生产域名 (${PREVIEW_BASE_URL}) 运行预发布对抗性安全测试！请使用 Preview 分支 URL。`
  );
}

function encodeTestShareBundle(bundle) {
  const json = JSON.stringify(bundle);
  return Buffer.from(json, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function inspectLiveHeaders() {
  console.log('🌐 [Edge Header Audit] 抓取真实 Cloudflare Pages 边缘响应头...');

  const sandboxRes = await fetch(`${SANDBOX_ORIGIN_URL}/`, { redirect: 'manual' });
  assert.equal(sandboxRes.status, 200, `预发布沙盒 ${SANDBOX_ORIGIN_URL}/ 应返回 200`);

  const sandboxHeaders = Object.fromEntries(sandboxRes.headers.entries());
  const sandboxCsp = sandboxHeaders['content-security-policy'] || '';

  assert.ok(sandboxCsp.includes("default-src 'none'"), '沙盒 CSP 必须包含 default-src none');
  assert.ok(sandboxCsp.includes("connect-src 'none'"), '沙盒 CSP 必须包含 connect-src none');
  assert.ok(sandboxCsp.includes("worker-src 'none'"), '沙盒 CSP 必须包含 worker-src none');
  assert.ok(
    sandboxCsp.includes('frame-ancestors https://blog.epocanvas.com https://shijianus-blog.pages.dev https://*.shijianus-blog.pages.dev'),
    `沙盒 frame-ancestors 必须白名单限制主站与 Preview 域名，实际: ${sandboxCsp}`
  );
  assert.equal(sandboxCsp.includes('localhost'), false, '线上沙盒 CSP 不得包含 localhost');
  assert.equal(sandboxHeaders['referrer-policy'], 'no-referrer');
  assert.equal(sandboxHeaders['x-content-type-options'], 'nosniff');
  assert.equal(sandboxHeaders['cross-origin-resource-policy'], 'cross-origin');

  // 验证沙盒项目无 Functions / 无 API 暴露
  const sandboxApiProbe = await fetch(`${SANDBOX_ORIGIN_URL}/api/comments`, { redirect: 'manual' });
  assert.equal(
    sandboxApiProbe.status,
    404,
    `独立沙盒项目不得挂载任何 Functions API (/api/comments 状态码应为 404，实际 ${sandboxApiProbe.status})`
  );

  // 验证主站 Preview 边缘响应头与精确 frame-src
  const previewRoutes = [
    '/lab/',
    '/lab/playground/',
    '/lab/verlet-rope-physics/',
    '/lab/preview/star-trails-simulator/',
  ];
  const previewHeadersByRoute = {};

  for (const routePath of previewRoutes) {
    const res = await fetch(`${PREVIEW_BASE_URL}${routePath}`, { redirect: 'manual' });
    assert.equal(res.status, 200, `Preview 路由 ${routePath} 应返回 200`);
    const h = Object.fromEntries(res.headers.entries());
    const csp = h['content-security-policy'] || '';
    assert.ok(
      csp.includes(SANDBOX_ORIGIN_URL),
      `Preview 路由 ${routePath} 的 CSP frame-src 必须精确包含 ${SANDBOX_ORIGIN_URL}，实际: ${csp}`
    );
    const frameSrcDirective = csp
      .split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith('frame-src '));
    assert.ok(frameSrcDirective, '主站 CSP 必须包含 frame-src 指令');
    assert.equal(frameSrcDirective.includes('*'), false, '主站 frame-src 严禁包含通配符 *');
    previewHeadersByRoute[routePath] = {
      status: res.status,
      'content-security-policy': h['content-security-policy'],
      'x-frame-options': h['x-frame-options'],
      'referrer-policy': h['referrer-policy'],
      'permissions-policy': h['permissions-policy'],
      'strict-transport-security': h['strict-transport-security'],
      'x-content-type-options': h['x-content-type-options'],
      'cache-control': h['cache-control'],
    };
  }

  return {
    sandboxOrigin: SANDBOX_ORIGIN_URL,
    sandboxHeaders: {
      status: sandboxRes.status,
      'access-control-allow-origin': sandboxHeaders['access-control-allow-origin'] ?? null,
      'content-security-policy': sandboxHeaders['content-security-policy'],
      'permissions-policy': sandboxHeaders['permissions-policy'],
      'referrer-policy': sandboxHeaders['referrer-policy'],
      'cross-origin-resource-policy': sandboxHeaders['cross-origin-resource-policy'],
      'x-content-type-options': sandboxHeaders['x-content-type-options'],
      'cache-control': sandboxHeaders['cache-control'],
    },
    sandboxApi404Verified: true,
    previewOrigin: PREVIEW_BASE_URL,
    previewHeaders: previewHeadersByRoute['/lab/playground/'],
  };
}

function startUnauthorizedFramingServer(port) {
  const html = `<!DOCTYPE html>
<html>
<body>
  <iframe id="evil-frame" src="${SANDBOX_ORIGIN_URL}/"></iframe>
  <script>
    window.__evilReceived = [];
    window.addEventListener('message', (e) => {
      window.__evilReceived.push({ origin: e.origin, data: e.data });
    });
    const f = document.getElementById('evil-frame');
    f.addEventListener('load', () => {
      try {
        f.contentWindow.postMessage({
          protocol: 'LAB_SANDBOX_PROTOCOL_V1',
          sessionId: 'evil-sess-1',
          type: 'EXECUTE_CODE',
          payload: { srcDoc: '<script>parent.postMessage("EVIL_RAN","*")<\\/script>' }
        }, '*');
      } catch (_e) {}
    });
  </script>
</body>
</html>`;

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function runLiveBrowserSuite(browserName, browserType, unauthorizedPort) {
  console.log(`\n======================================================================`);
  console.log(`🌍 真实 Cloudflare Preview 跨站验收: ${browserName.toUpperCase()}`);
  console.log(`======================================================================`);

  const result = {
    browser: browserName,
    version: '',
    crossSiteIframeAndHandshake: 'PENDING',
    unauthorizedParentBlocked: 'PENDING',
    networkAndStorageIsolation: 'PENDING',
    resourceExhaustionAndFlood: 'PENDING',
    untrustedManualAndFailClosed: 'PENDING',
    officialExplicitFallback: 'PENDING',
    functionalAndMobileRegression: 'PENDING',
    uncaughtPageErrors: 0,
  };

  const browser = await browserType.launch({ headless: true });
  result.version = browser.version();

  try {
    let context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    });
    if (browserName === 'webkit') {
      await context.route('https://drawing.shijian.qzz.io/**', (route) => route.abort());
    }
    let page = await context.newPage();

    const pageErrors = [];
    const attachListeners = (p) => {
      p.on('pageerror', (err) => {
        const msg = String(err?.message || err || '');
        if (browserName === 'webkit' && /^\/.* due to access control checks\.$/.test(msg.trim())) {
          return;
        }
        pageErrors.push(msg);
      });
    };
    attachListeners(page);

    const resetPage = async () => {
      if (browserName !== 'webkit') return;
      const oldPage = page;
      page = await context.newPage();
      attachListeners(page);
      await Promise.race([
        oldPage.close().catch(() => {}),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    };

    const clickTarget = async (locator) => {
      if (browserName === 'webkit') {
        await locator.evaluate((el) => el.click());
      } else {
        await locator.click();
      }
    };

    // 1. 验证非授权父页面 (http://127.0.0.1) 嵌入预发布沙盒被 frame-ancestors + origin 白名单双重阻断
    await page.goto(`http://127.0.0.1:${unauthorizedPort}/`, { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    const evilMessages = await page.evaluate(() => window.__evilReceived || []);
    const anyExecReply = evilMessages.some(
      (m) => m?.data === 'EVIL_RAN' || m?.data?.type === 'SANDBOX_READY'
    );
    assert.equal(anyExecReply, false, `[${browserName}] 非授权父窗口严禁驱动跨站沙盒执行代码`);
    result.unauthorizedParentBlocked = 'PASS';

    // 2. 验证真实 Cloudflare Preview 主站 <-> 独立 Cloudflare Pages 预发布沙盒跨站连接
    await page.goto(`${PREVIEW_BASE_URL}/lab/playground/?slug=verlet-rope-physics`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForFunction(
      () => document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') === 'completed',
      null,
      { timeout: 15000, polling: 100 }
    );

    assert.equal(
      await page.locator('#lab-playground-workspace').getAttribute('data-isolation-mode'),
      'cross-origin',
      `[${browserName}] Preview 必须激活真实 cross-origin 跨站沙盒模式`
    );
    assert.equal(
      await page.getByTestId('lab-sandbox-iframe').getAttribute('src'),
      `${SANDBOX_ORIGIN_URL}/`
    );
    assert.equal(
      await page.getByTestId('official-fallback-banner').count(),
      0,
      `[${browserName}] 真实跨站沙盒正常握手时不应出现回退提示`
    );
    result.crossSiteIframeAndHandshake = `PASS (${previewHost} -> ${sandboxHost} -> opaque null)`;

    // 3. 在真实跨站沙盒内运行全量网络隔离、Cookie/Storage/DOM 隔离、Worker 封锁与 XSS 探针
    await page.evaluate(() => {
      document.cookie = 'cf_preview_secret=TopSecretPreviewCookie_777; path=/; SameSite=Lax';
      window.localStorage.setItem('cf_preview_admin', 'SuperSecretLocalStorage_888');
    });

    await page.getByTestId('playground-preset-select').selectOption('star-trails-simulator');
    await page.waitForFunction(
      () => document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') === 'completed',
      null,
      { timeout: 15000, polling: 100 }
    );

    await clickTarget(page.locator('[data-file-tab="index.html"]'));
    await page
      .getByTestId('lab-code-textarea')
      .fill('<textarea>breakout</script><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" onerror="window.__inline_ran=1"><div>SAFE</div>');
    await clickTarget(page.locator('[data-file-tab="script.js"]'));

    const crossSiteProbe = `
      console.log('LIVE_ORIGIN:' + window.origin);
      console.log('INLINE_RAN:' + Boolean(window.__inline_ran));

      try {
        console.log('COOKIE_VAL:' + document.cookie);
      } catch (e) {
        console.log('COOKIE_ERR:' + (e && e.name ? e.name : 'Blocked'));
      }

      try {
        console.log('LS_VAL:' + window.localStorage.getItem('cf_preview_admin'));
      } catch (e) {
        console.log('LS_ERR:' + (e && e.name ? e.name : 'Blocked'));
      }

      try {
        console.log('PARENT_DOM:' + window.parent.document.title);
      } catch (e) {
        console.log('PARENT_ERR:' + (e && e.name ? e.name : 'Blocked'));
      }

      try {
        console.log('TOP_DOM:' + window.top.document.title);
      } catch (e) {
        console.log('TOP_ERR:' + (e && e.name ? e.name : 'Blocked'));
      }

      // 测试 XHR 阻断
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '${PREVIEW_BASE_URL}/api/comments?slug=test', true);
        xhr.onload = () => console.log('XHR_ALLOWED:' + xhr.status);
        xhr.onerror = () => console.log('XHR_BLOCKED:ErrorEvent');
        xhr.send();
      } catch (e) {
        console.log('XHR_BLOCKED:' + (e && e.name ? e.name : 'Exception'));
      }

      // 测试 WebSocket 阻断
      try {
        const ws = new WebSocket('wss://echo.websocket.events');
        ws.onopen = () => console.log('WS_ALLOWED');
        ws.onerror = () => console.log('WS_BLOCKED:ErrorEvent');
      } catch (e) {
        console.log('WS_BLOCKED:' + (e && e.name ? e.name : 'Exception'));
      }

      // 测试 Worker 阻断
      try {
        const blobUrl = URL.createObjectURL(new Blob(['postMessage("WORKER_OK")'], { type: 'text/javascript' }));
        const w = new Worker(blobUrl);
        let done = false;
        w.onmessage = () => { done = true; console.log('WORKER_ALLOWED'); };
        w.onerror = () => { if (!done) { done = true; console.log('WORKER_BLOCKED:Event'); } };
        setTimeout(() => { if (!done) { done = true; console.log('WORKER_BLOCKED:Silent'); } }, 250);
      } catch (e) {
        console.log('WORKER_BLOCKED:' + (e && e.name ? e.name : 'Exception'));
      }

      Promise.allSettled([
        fetch('https://example.com/exfil'),
        fetch('${PREVIEW_BASE_URL}/api/comments?slug=test'),
        fetch('${SANDBOX_ORIGIN_URL}/')
      ]).then((res) => {
        console.log('FETCH_ALL_REJECTED:' + res.every((r) => r.status === 'rejected'));
      });

      console.log('<svg onload="window.__host_svg_xss=true">');
    `;

    await page.getByTestId('lab-code-textarea').fill(crossSiteProbe);
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForTimeout(1400);

    await clickTarget(page.getByTestId('tab-console'));
    const logs = await page.getByTestId('console-log-list').innerText();

    assert.ok(logs.includes('LIVE_ORIGIN:null'), `[${browserName}] 内层执行帧必须为 null opaque origin`);
    assert.ok(logs.includes('INLINE_RAN:false'), `[${browserName}] 内联脚本逃逸必须被拦截`);
    assert.ok(logs.includes('COOKIE_ERR:'), `[${browserName}] Cookie 访问必须被拦截`);
    assert.equal(logs.includes('TopSecretPreviewCookie_777'), false);
    assert.ok(logs.includes('LS_ERR:'), `[${browserName}] localStorage 访问必须被拦截`);
    assert.equal(logs.includes('SuperSecretLocalStorage_888'), false);
    assert.ok(logs.includes('PARENT_ERR:'), `[${browserName}] parent DOM 访问必须被拦截`);
    assert.ok(logs.includes('TOP_ERR:'), `[${browserName}] top DOM 访问必须被拦截`);
    assert.equal(logs.includes('XHR_ALLOWED'), false, `[${browserName}] XHR 请求必须被阻断`);
    assert.equal(logs.includes('WS_ALLOWED'), false, `[${browserName}] WebSocket 必须被阻断`);
    assert.ok(logs.includes('WORKER_BLOCKED:'), `[${browserName}] Blob Worker 必须被阻断`);
    assert.equal(logs.includes('WORKER_ALLOWED'), false);
    assert.ok(logs.includes('FETCH_ALL_REJECTED:true'), `[${browserName}] 所有跨站与主站 fetch 必须被阻断`);
    assert.equal(await page.evaluate(() => Boolean(window.__host_svg_xss)), false);
    result.networkAndStorageIsolation = 'PASS';

    // 4. 资源耗尽防线：篡改 performance.now 的死循环熔断 + 定时器炸弹上限 + 日志防洪 + 伪造 postMessage 丢弃
    await clickTarget(page.getByTestId('btn-reset-code'));
    await page.waitForFunction(
      () => document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') === 'completed',
      null,
      { timeout: 15000, polling: 100 }
    );
    await clickTarget(page.locator('[data-file-tab="script.js"]'));
    await page
      .getByTestId('lab-code-textarea')
      .fill('performance.now = () => 0;\nfor (;;) { try { while (true) {} } catch (_e) {} }');
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForSelector('[data-testid="runtime-error-item"]', { timeout: 8000 });
    assert.ok((await page.getByTestId('runtime-error-list').innerText()).includes('[Sandbox Timeout]'));

    await page
      .getByTestId('lab-code-textarea')
      .fill('for (let i = 0; i < 400; i++) setInterval(() => {}, 50);');
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForTimeout(700);
    assert.ok((await page.getByTestId('runtime-error-list').innerText()).includes('并发计时器数量超过安全上限'));

    await page.evaluate(() => {
      window.postMessage(
        {
          protocol: 'LAB_SANDBOX_PROTOCOL_V1',
          sessionId: 'forged-live-session',
          type: 'CONSOLE_EVENT',
          payload: { level: 'error', args: ['LIVE_FORGED_MSG'] },
        },
        '*'
      );
    });
    await page.waitForTimeout(200);
    await clickTarget(page.getByTestId('tab-console'));
    assert.equal((await page.getByTestId('console-output-body').innerText()).includes('LIVE_FORGED_MSG'), false);
    result.resourceExhaustionAndFlood = 'PASS';

    // 5. 外部导入 (imported / community) 与 #bundle= 在真实跨站沙盒在线时的手动门禁，以及沙盒故障时的强制 Fail-Closed！
    const importedBundle = {
      version: 'lab-bundle-v1',
      slug: 'star-trails-simulator',
      title: 'Preview Imported Bundle',
      description: 'Cross-site test',
      category: 'utility',
      language: 'html-css-js',
      files: [
        { name: 'index.html', language: 'html', content: '<div>Live Imported</div>' },
        { name: 'script.js', language: 'javascript', content: 'console.log("LIVE_IMPORTED_OK:" + window.origin);' },
      ],
    };

    await page.getByTestId('input-import-file').setInputFiles({
      name: 'live-imported.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(importedBundle), 'utf8'),
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
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0, 'JSON 导入严禁自动执行');

    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForFunction(
      () => document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') === 'completed',
      null,
      { timeout: 12000, polling: 100 }
    );
    await clickTarget(page.getByTestId('tab-console'));
    assert.ok((await page.getByTestId('console-log-list').innerText()).includes('LIVE_IMPORTED_OK:null'));

    // 现在通过路由拦截阻断独立沙盒域名，模拟真实跨站沙盒宕机不可达：
    await context.route(`${SANDBOX_ORIGIN_URL}/**`, (route) => route.abort('failed'));

    // (a) imported 代码点击运行 -> 必须 Fail-Closed，严禁回退本地 srcdoc！
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForFunction(
      () => document.querySelector('#lab-playground-workspace')?.getAttribute('data-fail-closed') === 'true',
      null,
      { timeout: 9000, polling: 100 }
    );
    assert.equal(await page.getByTestId('sandbox-fail-closed-banner').isVisible(), true);
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0);

    // (b) community 代码点击运行 -> 必须 Fail-Closed！
    const communityBundle = {
      ...importedBundle,
      sourceKind: 'community',
      author: { name: 'CommunityAuthor', role: 'community' },
    };
    await page.getByTestId('input-import-file').setInputFiles({
      name: 'live-community.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(communityBundle), 'utf8'),
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
      { timeout: 9000, polling: 100 }
    );
    assert.equal(await page.getByTestId('sandbox-fail-closed-banner').isVisible(), true);
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0);

    // (c) #bundle= 分享代码在跨站沙盒不可达时：自动运行禁止 + 点击运行必须 Fail-Closed！
    const encodedBundle = encodeTestShareBundle(importedBundle);
    await page.goto(
      `${PREVIEW_BASE_URL}/lab/playground/?slug=star-trails-simulator#bundle=${encodedBundle}`,
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForSelector('#lab-playground-workspace[data-source-kind="bundle"]', { timeout: 8000 });
    await page.waitForTimeout(250);
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0);
    await clickTarget(page.getByTestId('btn-run-code'));
    await page.waitForFunction(
      () => document.querySelector('#lab-playground-workspace')?.getAttribute('data-fail-closed') === 'true',
      null,
      { timeout: 9000, polling: 100 }
    );
    assert.equal(await page.getByTestId('sandbox-fail-closed-banner').isVisible(), true);
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0);
    result.untrustedManualAndFailClosed = 'PASS';

    // (d) official 官方预设在跨站沙盒不可达时：展示明确提示横幅后回退至本地 opaque-srcdoc 完成运行！
    await page.goto(`${PREVIEW_BASE_URL}/lab/playground/?slug=star-trails-simulator`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForFunction(
      () =>
        document.querySelector('#lab-playground-workspace')?.getAttribute('data-isolation-mode') ===
          'opaque-srcdoc' &&
        document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') ===
          'completed',
      null,
      { timeout: 10000, polling: 100 }
    );
    assert.equal(await page.getByTestId('official-fallback-banner').isVisible(), true);
    result.officialExplicitFallback = 'PASS';

    // 解除跨站沙盒故障拦截：新建无拦截钩子的干净 BrowserContext（规避 Playwright Firefox Juggler 一旦启用 route 后对真实 HTTPS Fission OOPIF 产生 NS_BINDING_ABORTED 的已知驱动限制）
    await Promise.race([
      context.close().catch(() => {}),
      new Promise((r) => setTimeout(r, 2000)),
    ]);
    context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    });
    if (browserName === 'webkit') {
      await context.route('https://drawing.shijian.qzz.io/**', (route) => route.abort());
    }
    page = await context.newPage();
    attachListeners(page);

    // 6. 全路由功能与移动端 390x844 回归验证
    const hubRes = await page.goto(`${PREVIEW_BASE_URL}/lab/`, { waitUntil: 'domcontentloaded' });
    assert.equal(hubRes?.status(), 200);
    await page.waitForSelector('#lab-experiments-grid [data-exp-slug]', { timeout: 8000 });
    assert.equal(await page.locator('#lab-experiments-grid [data-exp-slug]').count(), 6);

    await page.goto(`${PREVIEW_BASE_URL}/lab/algorithm-execution-tracer/`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForFunction(
      () => document.querySelector('#lab-playground-workspace')?.getAttribute('data-exec-status') === 'completed',
      null,
      { timeout: 15000, polling: 100 }
    );
    assert.equal(
      await page.locator('#lab-playground-workspace').getAttribute('data-isolation-mode'),
      'cross-origin',
      '详情页离屏下方的跨站沙盒同样必须完成握手且不被冻结'
    );
    assert.equal(await page.locator('#lab-execution-visualizer').isVisible(), true);

    await page.goto(`${PREVIEW_BASE_URL}/lab/preview/star-trails-simulator/`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('[data-testid="standalone-preview-iframe"][data-isolation-mode="cross-origin"]', {
      timeout: 10000,
    });
    assert.equal(
      await page.getByTestId('standalone-preview-iframe').getAttribute('src'),
      `${SANDBOX_ORIGIN_URL}/`
    );

    await resetPage();
    await page.setViewportSize({ width: 390, height: 844 });
    for (const mobilePath of ['/lab/', '/lab/playground/?slug=star-trails-simulator']) {
      await page.goto(`${PREVIEW_BASE_URL}${mobilePath}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        iw: window.innerWidth,
      }));
      assert.ok(overflow.sw <= overflow.iw + 2, `[${browserName}] ${mobilePath} 移动端零溢出校验失败`);
    }

    for (const p of ['/', '/about/']) {
      await resetPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      const r = await page.goto(`${PREVIEW_BASE_URL}${p}`, { waitUntil: 'domcontentloaded' });
      assert.equal(r?.status(), 200);
      await page.waitForTimeout(300);
    }

    assert.equal(
      pageErrors.length,
      0,
      `[${browserName}] Preview 验收期间捕获到未处理页面异常: ${pageErrors.join('; ')}`
    );
    result.functionalAndMobileRegression = 'PASS';
    result.uncaughtPageErrors = 0;

    await Promise.race([
      context.close().catch(() => {}),
      new Promise((r) => setTimeout(r, 2000)),
    ]);
    return result;
  } finally {
    await Promise.race([
      browser.close().catch(() => {}),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  }
}

async function main() {
  const headerAudit = await inspectLiveHeaders();
  const unauthorizedPort = 4398;
  const evilServer = await startUnauthorizedFramingServer(unauthorizedPort);

  const report = {
    timestamp: new Date().toISOString(),
    previewUrl: PREVIEW_BASE_URL,
    sandboxUrl: SANDBOX_ORIGIN_URL,
    headerAudit,
    browsers: {},
  };

  try {
    for (const [name, engine] of [
      ['chromium', chromium],
      ['firefox', firefox],
      ['webkit', webkit],
    ]) {
      report.browsers[name] = await runLiveBrowserSuite(name, engine, unauthorizedPort);
    }
  } finally {
    evilServer.closeAllConnections?.();
    await new Promise((r) => evilServer.close(r));
  }

  const outDir = path.join(process.cwd(), 'scratch', 'phase-2.6-audit');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'live-preview-test-report.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );

  console.log('\n🎉 [Cloudflare Preview Cross-Site Gate] 三大浏览器真实跨站验收全量通过！');
  console.log(JSON.stringify(report, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ [Cloudflare Preview Cross-Site Gate] 验收失败:', err);
    process.exit(1);
  });
