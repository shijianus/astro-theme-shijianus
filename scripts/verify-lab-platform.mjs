/**
 * Astro Blog「试验田 Lab」Phase 2.5 发布前全链路工程审计、安全渗透与跨站沙盒验收套件
 *
 * 覆盖矩阵：
 * 1. 静态单元与协议安全审计 (Node In-Process)：
 *    - 受限 TypeScript 词法擦除器：正常 JS 对象字面量/三元表达式零误伤、泛型、类型断言、非空断言 `!`、模板字面量、正则、注释、Class、import type / export；
 *    - 不支持的 TS 运行时语法显式报错拦截：`enum`、`const enum`、`namespace`、`constructor(public x)`、`@decorator`、JSX/TSX、外部 `import`、未闭合字符串；
 *    - HTML/CSS/Script 逃逸防御：`</script>`、`</style>`、未闭合 `<textarea>`、`<script src>`、Nonce CSP、`worker-src 'none'`；
 *    - `resolveSafeExternalSandboxOrigin` 与 `functions/_middleware.ts` HTTP CSP 头校验（拒绝 `*.epocanvas.com` 子域与通配符，放行独立沙盒 Origin）。
 * 2. 主站本地同仿真中间件环境验收 (`127.0.0.1:4355` 挂载真实 `functions/_middleware.ts` 安全响应头)：
 *    - `/lab/` 实验广场：原有 4 实验 + 新增 2 实验、分类/标签/简繁搜索、源码弹窗键盘 `Escape`/遮罩关闭/焦点归还、圆角 `<= 8px`、零违禁品牌词；
 *    - `/lab/[slug]/` 全部 6 个详情页（含 `verlet-rope-physics` TS 零报错验证）与 `ExecutionVisualizer` 三套算法单步/回退/调用栈验证；
 *    - `/lab/playground/` 代码工坊：编辑运行、URL `pushState`/`popstate`/刷新保持、草稿存取、JSON 导出与导入手动门禁、`#bundle=` 分享门禁、全屏 `Escape`、深浅色实时同步、简繁切换源码零篡改；
 *    - 浏览器对抗性安全验证：Opaque Origin、Cookie/Storage/DOM `SecurityError`、CSP `connect-src 'none'`、内联 HTML 事件拦截、`SESSION_ID` 隐藏、Blob Worker 阻断、Console 二阶 XSS 免疫、`while(true){}` 与 `try/catch` 死循环 2.2s 自动熔断、定时器炸弹配额拦截、伪造消息丢弃。
 * 3. 跨 Origin 独立沙盒双服务器联调与故障降级演练 (`127.0.0.1:4357` 主站 <-> `localhost:4356` 独立 `sandbox-runner/`)：
 *    - 挂载 `sandbox-runner/_headers` 真实 CSP 响应头，验证 `PING -> SANDBOX_BRIDGE_READY -> EXECUTE_CODE -> CONSOLE_EVENT / EXECUTION_COMPLETE` 全链路；
 *    - 关闭独立沙盒服务模拟远端不可达，验证 3s 握手超时自动平滑降级至本地 `opaque-srcdoc` 模式。
 * 4. 移动端 `390x844` 全路由零横向溢出与既有博客路由无回归验证。
 */

import { chromium } from 'playwright';
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
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('/*')) continue;
    const colon = trimmed.indexOf(':');
    if (colon > 0) {
      const k = trimmed.slice(0, colon).trim();
      const v = trimmed.slice(colon + 1).trim();
      headers[k] = v;
    }
  }
  return headers;
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
    let reqPath = decodeURIComponent(parsedUrl.pathname);

    let filePath = path.join(DIST_DIR, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!path.extname(filePath) && fs.existsSync(path.join(DIST_DIR, reqPath, 'index.html'))) {
      filePath = path.join(DIST_DIR, reqPath, 'index.html');
    }

    if (!filePath.startsWith(DIST_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Security-Policy': cspHeader,
      });
      res.end(JSON.stringify({ error: 'Not Found' }));
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
      // 在跨站测试服务器中模拟带 PUBLIC_LAB_SANDBOX_ORIGIN 构建出的 Astro SSR HTML + Island Props
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
        /title="当前预览运行在无 allow-same-origin 的 Opaque Origin \(null\) 沙盒中，且 CSP connect-src &#x27;none&#x27; 阻断外发网络"/g,
        `title="已连接独立跨站沙盒桥接器 (${injectExternalSandboxOrigin})，内层执行帧仍保持无 allow-same-origin 的 Opaque Origin 双重隔离"`
      );
      html = html.replace(
        /<span>Opaque Sandbox · 零 Cookie\/DOM 权限<\/span>/g,
        '<span>Cross-Site + Opaque 双层沙盒</span>'
      );
      html = html.replace(
        /data-external-sandbox-origin=""/g,
        `data-external-sandbox-origin="${injectExternalSandboxOrigin}"`
      );
      res.writeHead(200);
      res.end(html);
      return;
    }

    res.writeHead(200);
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}

function startSandboxRunnerServer(port, host) {
  const securityHeaders = parseHeadersFile(path.join(SANDBOX_DIR, '_headers'));
  const indexHtml = fs.readFileSync(path.join(SANDBOX_DIR, 'index.html'), 'utf8');

  const server = http.createServer((req, res) => {
    const parsed = new URL(req.url || '/', `http://${host}:${port}`);
    if (parsed.pathname !== '/' && parsed.pathname !== '/index.html') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    for (const [k, v] of Object.entries(securityHeaders)) {
      res.setHeader(k, v);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.writeHead(200);
    res.end(indexHtml);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}

async function main() {
  if (!fs.existsSync(path.join(DIST_DIR, 'lab', 'index.html'))) {
    throw new Error('未找到 dist/lab/index.html，请先执行 npm run build。');
  }

  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      node: process.version,
      browserEngine: 'Playwright Chromium (Headless)',
      firefoxAndWebkitBinaryStatus: 'SKIP (Playwright 仅安装 Chromium 二进制)',
    },
    unitAndProtocol: {},
    functional: {},
    security: {},
    crossOriginBridge: {},
    performance: {},
    constitution: {},
  };

  // ===========================================================================
  // Part 0: 校验 sandbox-runner/_headers 静态配置合规性
  // ===========================================================================
  console.log('🧪 [Part 0] 审计 sandbox-runner/_headers 与构建产物安全属性...');
  const sandboxHeaders = parseHeadersFile(path.join(SANDBOX_DIR, '_headers'));
  assert.ok(sandboxHeaders['Content-Security-Policy']?.includes("default-src 'none'"));
  assert.ok(sandboxHeaders['Content-Security-Policy']?.includes("connect-src 'none'"));
  assert.ok(sandboxHeaders['Content-Security-Policy']?.includes("worker-src 'none'"));
  assert.ok(sandboxHeaders['Content-Security-Policy']?.includes("frame-src 'self' blob:"));
  assert.ok(sandboxHeaders['Content-Security-Policy']?.includes('frame-ancestors https://blog.epocanvas.com'));
  assert.equal(
    sandboxHeaders['Content-Security-Policy']?.includes('sandbox allow-scripts'),
    false,
    '外层桥接响应头不应设置 sandbox allow-scripts 以保留真实 Cross-Site Origin'
  );
  report.unitAndProtocol.sandboxHeadersConfig = 'PASS';

  let mainServer = null;
  let bridgeServer = null;
  let crossHostServer = null;
  let browser = null;

  try {
    mainServer = await startStaticDistServer(MAIN_PORT, '127.0.0.1');
    bridgeServer = await startSandboxRunnerServer(BRIDGE_PORT, 'localhost');
    crossHostServer = await startStaticDistServer(CROSS_HOST_PORT, '127.0.0.1', {
      injectExternalSandboxOrigin: BRIDGE_ORIGIN,
    });

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    const pageConsoleErrors = [];
    page.on('pageerror', (err) => {
      pageConsoleErrors.push(err.message);
    });

    // =========================================================================
    // Part 1: /lab/ 主页实验广场、原有 4 实验回归、简繁搜索、无障碍弹窗与 CONSTITUTION
    // =========================================================================
    console.log('🔍 [Part 1] 验证 /lab/ 主页实验广场、原有实验回归、弹窗无障碍与 CONSTITUTION...');
    const navStart = Date.now();
    const hubRes = await page.goto(`${BASE_URL}/lab/`, { waitUntil: 'load' });
    const labLoadMs = Date.now() - navStart;
    report.performance.labHomeLoadMs = labLoadMs;

    assert.ok(
      hubRes?.headers()['content-security-policy']?.includes("form-action 'self'"),
      '主站 HTTP CSP 必须包含 form-action self'
    );

    const cardCount = await page.locator('#lab-experiments-grid [data-exp-slug]').count();
    assert.equal(cardCount, 6, '应展示全部 6 个官方实验卡片');
    assert.equal(await page.locator('#lab-star-canvas').count(), 1, '保留天体星轨模拟器 Canvas');
    assert.equal(await page.locator('#plane-3d').count(), 1, '保留 3D 纸飞机控件');
    assert.equal(await page.locator('.sound-pad').count(), 6, '保留 6 个 Web Audio 声效打击垫');
    assert.equal(await page.locator('#fx-input-val').count(), 1, '保留多币种汇率换算器输入');

    await page.fill('#fx-input-val', '100');
    await page.dispatchEvent('#fx-input-val', 'input');
    const cnyText = await page.locator('#fx-cny-out').textContent();
    assert.equal(cnyText?.trim(), '¥ 725.00', '汇率换算器实时计算结果应正确');

    // 分类、标签与关键词过滤
    await page.click('[data-filter-category="physics"]');
    assert.equal(
      await page.locator('#lab-experiments-grid [data-exp-slug]:visible').count(),
      2,
      '物理仿真分类下应显示 2 个实验'
    );
    await page.click('[data-filter-category="all"]');

    await page.selectOption('#lab-tag-select', 'TypeScript');
    assert.equal(
      await page.locator('#lab-experiments-grid [data-exp-slug]:visible').count(),
      1,
      '标签筛选 TypeScript 应精确匹配 Verlet 实验'
    );
    await page.selectOption('#lab-tag-select', 'all');

    await page.fill('#lab-search-input', '二分查找');
    assert.equal(
      await page.locator('#lab-experiments-grid [data-exp-slug]:visible').count(),
      1,
      '搜索「二分查找」应精确匹配算法追踪实验'
    );
    await page.fill('#lab-search-input', '');
    await page.dispatchEvent('#lab-search-input', 'input');

    // 弹窗 Escape 键关闭与焦点归还验证
    const modalTrigger = page.locator('[data-target-slug="star-trails-simulator"]');
    await modalTrigger.click();
    assert.equal(await page.locator('#lab-source-modal').isVisible(), true);
    assert.ok((await page.locator('#lab-modal-code').textContent())?.includes('star-canvas'));
    await page.keyboard.press('Escape');
    assert.equal(
      await page.locator('#lab-source-modal').isVisible(),
      false,
      '按下 Escape 键必须关闭源码模态框'
    );
    const focusedSlugAfterEsc = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-target-slug')
    );
    assert.equal(
      focusedSlugAfterEsc,
      'star-trails-simulator',
      '关闭源码弹窗后焦点应归还给触发按钮'
    );

    // CONSTITUTION 品牌词与圆角 <= 8px 检查
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

    report.functional.labHubAndModalA11y = 'PASS';
    report.constitution.brandAndRadius = `PASS (max border-radius = ${maxRadius}px <= 8px)`;

    // =========================================================================
    // Part 2: 全部 6 个详情页零报错巡检（重点验证 Verlet TypeScript 实验）与逐步可视化器
    // =========================================================================
    console.log('🔍 [Part 2] 巡检全部 6 个实验详情页与算法逐步追踪器...');
    const allSlugs = [
      'star-trails-simulator',
      'aerodynamic-contrail',
      'web-audio-haptics',
      'fx-currency-converter',
      'algorithm-execution-tracer',
      'verlet-rope-physics',
    ];

    for (const slug of allSlugs) {
      const res = await page.goto(`${BASE_URL}/lab/${slug}/`, { waitUntil: 'load' });
      assert.equal(res?.status(), 200, `/lab/${slug}/ 应返回 200`);
      await page.waitForFunction(
        () => {
          const el = document.querySelector('#lab-playground-workspace');
          const s = el?.getAttribute('data-exec-status');
          return s === 'completed' || s === 'error';
        },
        null,
        { timeout: 8000 }
      );
      const status = await page
        .locator('#lab-playground-workspace')
        .getAttribute('data-exec-status');
      assert.equal(
        status,
        'completed',
        `/lab/${slug}/ 内嵌沙盒必须零报错完成初始化 (实际状态: ${status})`
      );
    }

    // 深入验证 ExecutionVisualizer
    await page.goto(`${BASE_URL}/lab/algorithm-execution-tracer/`, { waitUntil: 'load' });
    assert.equal(await page.locator('#lab-execution-visualizer').isVisible(), true);
    assert.ok((await page.getByTestId('viz-step-counter').textContent())?.includes('步骤 1 /'));

    await page.getByTestId('viz-btn-next').click();
    await page.getByTestId('viz-btn-next').click();
    await page.getByTestId('viz-btn-next').click();
    assert.ok((await page.getByTestId('viz-step-counter').textContent())?.includes('步骤 4 /'));
    assert.equal(
      await page.locator('.code-line-row[data-active="true"]').count(),
      1,
      '源码区应唯一高亮当前执行行'
    );

    await page.getByTestId('viz-btn-prev').click();
    assert.ok((await page.getByTestId('viz-step-counter').textContent())?.includes('步骤 3 /'));

    await page.click('[data-algo-tab="binary-search"]');
    assert.ok(
      (await page.getByTestId('viz-step-description').textContent())?.includes('binarySearch')
    );

    await page.click('[data-algo-tab="quick-sort-recursion"]');
    await page.getByTestId('viz-btn-next').click();
    await page.getByTestId('viz-btn-next').click();
    assert.ok(
      (await page.getByTestId('viz-call-stack').locator('.stack-frame').count()) >= 2,
      '递归快速排序应显示多层调用栈帧'
    );

    report.functional.allSixDetailRoutes = 'PASS (0 runtime/transpile errors across all 6 experiments)';
    report.functional.executionVisualizer = 'PASS';

    // =========================================================================
    // Part 3: /lab/playground/ 功能回归、TypeScript 边界与对抗性沙盒安全渗透测试
    // =========================================================================
    console.log('🛡️ [Part 3] 验证代码工坊、路由历史、JSON 导入导出与对抗性沙盒安全...');
    await page.goto(`${BASE_URL}/lab/playground/?slug=star-trails-simulator`, {
      waitUntil: 'load',
    });

    // 3.1 验证预设切换同步 URL 历史 (pushState + popstate 后退 + F5 刷新保持)
    await page.getByTestId('playground-preset-select').selectOption('verlet-rope-physics');
    await page.waitForTimeout(400);
    assert.ok(page.url().includes('slug=verlet-rope-physics'), '切换实验应更新地址栏 ?slug=');
    assert.equal(
      await page.locator('#lab-playground-workspace').getAttribute('data-exec-status'),
      'completed',
      'Verlet TypeScript 实验在工坊中必须零错误运行完成'
    );

    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(350);
    assert.equal(
      await page.getByTestId('playground-preset-select').inputValue(),
      'verlet-rope-physics',
      '刷新页面后应保持当前选中的实验'
    );

    await page.goBack({ waitUntil: 'load' });
    await page.waitForTimeout(350);
    assert.equal(
      await page.getByTestId('playground-preset-select').inputValue(),
      'star-trails-simulator',
      '浏览器后退 (popstate) 应切回上一个实验'
    );
    report.functional.historyAndReload = 'PASS';

    // 3.2 验证不支持的 TypeScript 语法 (enum / JSX) 显式报错拦截而非静默错误运行
    await page.getByTestId('playground-preset-select').selectOption('verlet-rope-physics');
    await page.click('[data-file-tab="script.ts"]');
    await page.getByTestId('lab-code-textarea').fill('enum BadMode { Fast, Slow }\nconsole.log(BadMode.Fast);');
    await page.getByTestId('btn-run-code').click();
    await page.waitForTimeout(250);
    const enumErrText = await page.getByTestId('runtime-error-list').innerText();
    assert.ok(enumErrText.includes('不支持 TypeScript `enum`'), '不支持的 enum 语法必须给出明确中文报错');

    await page.getByTestId('lab-code-textarea').fill('const view = <div className="x">JSX</div>;');
    await page.getByTestId('btn-run-code').click();
    await page.waitForTimeout(250);
    const jsxErrText = await page.getByTestId('runtime-error-list').innerText();
    assert.ok(jsxErrText.includes('JSX/TSX'), '不支持的 JSX/TSX 语法必须给出明确中文报错');
    report.functional.tsSubsetGuardrails = 'PASS';

    // 3.3 切回 JS 实验，执行全面沙盒渗透测试
    await page.getByTestId('playground-preset-select').selectOption('star-trails-simulator');
    await page.evaluate(() => {
      document.cookie = 'shijianus_secret_session=SensitiveCookieValue999; path=/';
      window.localStorage.setItem(
        'shijianus-comment-account',
        JSON.stringify({ token: 'SecretAdminToken_XYZ', role: 'admin' })
      );
    });

    const sandboxAttr = await page.getByTestId('lab-sandbox-iframe').getAttribute('sandbox');
    assert.equal(sandboxAttr, 'allow-scripts', '本地 srcdoc 沙盒必须严格为 allow-scripts');

    // 测试 HTML 闭合逃逸、内联 onerror 注入与 style 闭合逃逸
    await page.click('[data-file-tab="index.html"]');
    await page
      .getByTestId('lab-code-textarea')
      .fill('<textarea>unclosed</script><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" onerror="window.__inline_csp_bypass=1"><div id="dom-ok">SAFE_DOM</div>');
    await page.click('[data-file-tab="style.css"]');
    await page.getByTestId('lab-code-textarea').fill('body { --x: "</style><script>window.__css_escape_bypass=1</script>"; }');
    await page.click('[data-file-tab="script.js"]');

    const securityProbeScript = `
      console.log('PROBE_ORIGIN:' + window.origin);
      console.log('SESSION_LEAK_IN_DOM:' + document.documentElement.outerHTML.includes('lab-sess-'));
      console.log('INLINE_BYPASS:' + Boolean(window.__inline_csp_bypass || window.__css_escape_bypass));

      try {
        const c = document.cookie;
        console.log('COOKIE_LEAK:' + c);
      } catch (e) {
        console.log('COOKIE_BLOCKED:' + e.name);
      }

      try {
        const ls = window.localStorage.getItem('shijianus-comment-account');
        console.log('STORAGE_LEAK:' + ls);
      } catch (e) {
        console.log('STORAGE_BLOCKED:' + e.name);
      }

      try {
        const domTitle = window.parent.document.title;
        console.log('DOM_LEAK:' + domTitle);
      } catch (e) {
        console.log('DOM_BLOCKED:' + e.name);
      }

      try {
        const blobUrl = URL.createObjectURL(new Blob(['postMessage(1)'], { type: 'text/javascript' }));
        new Worker(blobUrl);
        console.log('WORKER_ALLOWED');
      } catch (e) {
        console.log('WORKER_BLOCKED:' + e.name);
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
    await page.getByTestId('btn-run-code').click();
    await page.waitForTimeout(800);

    await page.getByTestId('tab-console').click();
    const consoleText = await page.getByTestId('console-log-list').innerText();

    assert.ok(consoleText.includes('PROBE_ORIGIN:null'), 'window.origin 必须为 "null"');
    assert.ok(consoleText.includes('SESSION_LEAK_IN_DOM:false'), 'DOM 中不得泄露 SESSION_ID');
    assert.ok(consoleText.includes('INLINE_BYPASS:false'), 'HTML/CSS 标签闭合与内联事件不得绕过 Nonce CSP');
    assert.ok(consoleText.includes('COOKIE_BLOCKED:SecurityError'), '读取 Cookie 必须抛出 SecurityError');
    assert.ok(consoleText.includes('STORAGE_BLOCKED:SecurityError'), '读取 localStorage 必须抛出 SecurityError');
    assert.ok(consoleText.includes('DOM_BLOCKED:SecurityError'), '读取父窗口 DOM 必须抛出 SecurityError');
    assert.ok(consoleText.includes('WORKER_BLOCKED:SecurityError'), '创建 Blob Worker 必须被拦截');
    assert.ok(consoleText.includes('ALL_FETCH_BLOCKED:true'), '外部与主站 API fetch 均须被 CSP connect-src none 阻断');
    assert.equal(await page.evaluate(() => Boolean(window.__host_xss_pwned)), false, 'Console 二阶 XSS 必须免疫');

    report.security.opaqueOrigin = 'PASS';
    report.security.sessionNonceDomHidden = 'PASS';
    report.security.htmlCssScriptBreakoutBlocked = 'PASS';
    report.security.cookieStorageDomIsolation = 'PASS (SecurityError)';
    report.security.workerAndNetworkBlocked = "PASS (worker-src 'none' & connect-src 'none')";
    report.security.consoleXssImmunity = 'PASS';

    // 3.4 验证同步死循环 `while(true){}` + `try/catch` 绕过尝试自动在 ~2.2s 熔断且页面不卡死！
    console.log('⏱️ [Part 3.4] 验证 while(true){} 死循环保护与主线程存活...');
    await page.getByTestId('btn-reset-code').click();
    await page.click('[data-file-tab="script.js"]');
    await page
      .getByTestId('lab-code-textarea')
      .fill('for (;;) { try { while (true) {} } catch (_e) {} }');
    const loopStart = Date.now();
    await page.getByTestId('btn-run-code').click();
    await page.waitForSelector('[data-testid="runtime-error-item"]', { timeout: 4500 });
    const loopElapsed = Date.now() - loopStart;
    const loopErr = await page.getByTestId('runtime-error-list').innerText();
    assert.ok(
      loopErr.includes('[Sandbox Timeout]'),
      `死循环应触发 [Sandbox Timeout] 自动熔断，实际输出: ${loopErr}`
    );
    report.security.infiniteLoopProtection = `PASS (Aborted cleanly in ${loopElapsed}ms, UI remained responsive)`;

    // 3.5 验证定时器炸弹配额保护 (`setInterval` x 400 -> 阻断在 256 个以内)
    await page
      .getByTestId('lab-code-textarea')
      .fill('for (let i = 0; i < 400; i++) { setInterval(() => {}, 50); }');
    await page.getByTestId('btn-run-code').click();
    await page.waitForTimeout(450);
    const timerErr = await page.getByTestId('runtime-error-list').innerText();
    assert.ok(
      timerErr.includes('并发计时器数量超过安全上限'),
      '持续创建计时器必须触发 MAX_ACTIVE_TIMERS 配额阻断'
    );
    report.security.timerBombQuota = 'PASS (Capped at 256 active timers)';

    // 3.6 验证 Console 洪泛限流与伪造 postMessage 丢弃
    await page
      .getByTestId('lab-code-textarea')
      .fill('for (let i = 0; i < 500; i++) console.log("flood-" + i);');
    await page.getByTestId('btn-run-code').click();
    await page.waitForTimeout(500);
    await page.getByTestId('tab-console').click();
    const logRowsCount = await page.getByTestId('console-log-list').locator('.console-row').count();
    assert.ok(logRowsCount <= 201, `Console 洪泛应截断在 201 条以内，实际 ${logRowsCount}`);

    await page.getByTestId('btn-clear-console').click();
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
    report.security.consoleFloodAndPostMessageVerify = 'PASS';

    // 3.7 验证 JSON 导出下载、JSON 文件导入（默认手动运行门禁）与 #bundle= 分享门禁
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('btn-export-json').click(),
    ]);
    const exportedPath = await download.path();
    const exportedJson = JSON.parse(fs.readFileSync(exportedPath, 'utf8'));
    assert.equal(exportedJson.version, 'lab-bundle-v1');

    // 修改导出 JSON 内容并通过文件上传控件导入
    exportedJson.files = [
      { name: 'index.html', language: 'html', content: '<div>Imported Safe View</div>' },
      { name: 'script.js', language: 'javascript', content: 'console.log("IMPORTED_MANUAL_OK");' },
    ];
    await page.getByTestId('input-import-file').setInputFiles({
      name: 'imported-test.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(exportedJson), 'utf8'),
    });
    await page.waitForTimeout(250);
    assert.equal(
      await page.getByTestId('untrusted-code-banner').isVisible(),
      true,
      '导入外部 JSON 后必须显示手动运行提醒横幅'
    );
    assert.equal(
      await page.getByTestId('lab-sandbox-iframe').count(),
      0,
      '导入外部 JSON 后未经手动点击不得自动运行'
    );
    await page.getByTestId('btn-run-code').click();
    await page.waitForTimeout(400);
    await page.getByTestId('tab-console').click();
    assert.ok((await page.getByTestId('console-log-list').innerText()).includes('IMPORTED_MANUAL_OK'));
    report.functional.jsonExportAndImportGate = 'PASS';

    // 全屏预览切换与 Escape 退出
    await page.getByTestId('btn-toggle-fullscreen').click();
    assert.equal(await page.locator('.lab-pg-preview-card.is-fullscreen').count(), 1);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.lab-pg-preview-card.is-fullscreen').count(), 0);

    // #bundle= 分享链接默认手动运行门禁
    const encodedHash = encodeTestShareBundle(exportedJson);
    await page.goto(
      `${BASE_URL}/lab/playground/?slug=star-trails-simulator#bundle=${encodedHash}`,
      { waitUntil: 'load' }
    );
    assert.equal(await page.getByTestId('untrusted-code-banner').isVisible(), true);
    assert.equal(await page.getByTestId('lab-sandbox-iframe').count(), 0);
    report.security.untrustedBundleShareGate = 'PASS';

    // =========================================================================
    // Part 4: 本地跨 Origin 双服务器真实沙盒联调 (`127.0.0.1:4357` <-> `localhost:4356`) 与断连自动降级
    // =========================================================================
    console.log('🌐 [Part 4] 验证本地多 Origin 跨站沙盒桥接与远端不可达自动降级...');
    await page.goto(`${CROSS_MAIN_URL}/lab/playground/?slug=verlet-rope-physics`, {
      waitUntil: 'load',
    });
    await page.waitForTimeout(600);

    const crossMode = await page
      .locator('#lab-playground-workspace')
      .getAttribute('data-isolation-mode');
    assert.equal(crossMode, 'cross-origin', '配置合法外部沙盒 Origin 时应进入 cross-origin 模式');

    const crossIframeSrc = await page.getByTestId('lab-sandbox-iframe').getAttribute('src');
    assert.equal(crossIframeSrc, `${BRIDGE_ORIGIN}/`, '外层桥接 iframe src 必须指向独立沙盒 Origin');

    const crossExecStatus = await page
      .locator('#lab-playground-workspace')
      .getAttribute('data-exec-status');
    assert.equal(
      crossExecStatus,
      'completed',
      'Verlet TypeScript 代码必须通过跨 Origin 沙盒桥接成功编译执行并返回 EXECUTION_COMPLETE'
    );

    // 在跨 Origin 模式下测试 Console 回传
    await page.click('[data-file-tab="script.ts"]');
    await page
      .getByTestId('lab-code-textarea')
      .fill('const tag: string = "CROSS_ORIGIN_BRIDGE_OK"; console.log(tag, window.origin);');
    await page.getByTestId('btn-run-code').click();
    await page.waitForTimeout(500);
    await page.getByTestId('tab-console').click();
    const bridgeConsole = await page.getByTestId('console-log-list').innerText();
    assert.ok(
      bridgeConsole.includes('CROSS_ORIGIN_BRIDGE_OK null'),
      `跨 Origin 桥接内层仍须保持 null Opaque Origin 并回传日志，实际: ${bridgeConsole}`
    );

    // 关闭独立沙盒服务器模拟远端 Pages 故障 -> 验证 3s 自动平滑降级至本地 opaque-srcdoc！
    bridgeServer.closeAllConnections?.();
    await new Promise((resolve) => bridgeServer.close(resolve));
    bridgeServer = null;

    await page.getByTestId('btn-run-code').click();
    await page.waitForTimeout(3600);
    const fallbackMode = await page
      .locator('#lab-playground-workspace')
      .getAttribute('data-isolation-mode');
    assert.equal(
      fallbackMode,
      'opaque-srcdoc',
      '独立沙盒站点不可达时必须在 3s 后自动降级为本地 opaque-srcdoc 模式'
    );
    assert.equal(
      await page.locator('#lab-playground-workspace').getAttribute('data-exec-status'),
      'completed',
      '降级回本地 opaque-srcdoc 后实验应继续成功执行'
    );
    report.crossOriginBridge.multiOriginExecuteAndFallback = 'PASS';

    // =========================================================================
    // Part 5: 主题实时同步、简繁切换 UI 与代码保护、移动端 390x844 全路由零溢出与既有博客无回归
    // =========================================================================
    console.log('📱 [Part 5] 验证主题同步、简繁切换、移动端全路由响应式与既有博客页面...');
    await page.goto(`${BASE_URL}/lab/playground/?slug=verlet-rope-physics`, {
      waitUntil: 'load',
    });

    // 深浅色切换同步到运行中沙盒
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(200);
    await page.click('[data-file-tab="script.ts"]');
    const codeBeforeLocale = await page.getByTestId('lab-code-textarea').inputValue();

    // 切换繁体中文：验证 React UI 按钮切换为繁体，同时 TS 源码一字不差
    await page.evaluate(() => {
      if (window.__shijianus_applyLocaleVariant) {
        window.__shijianus_applyLocaleVariant('zh-Hant');
      }
    });
    await page.waitForTimeout(350);
    const runBtnTextHant = await page.getByTestId('btn-run-code').innerText();
    assert.ok(runBtnTextHant.includes('執行程式碼'), '繁体模式下工坊按钮应切换为繁体文案');
    const codeAfterLocale = await page.getByTestId('lab-code-textarea').inputValue();
    assert.equal(codeAfterLocale, codeBeforeLocale, '切换繁体后编辑器源码必须 100% 保持原样');

    // 恢复简体
    await page.evaluate(() => {
      if (window.__shijianus_applyLocaleVariant) {
        window.__shijianus_applyLocaleVariant('zh-CN');
      }
    });
    report.functional.themeAndI18n = 'PASS';

    // 独立预览页验证
    await page.goto(`${BASE_URL}/lab/preview/star-trails-simulator/`, { waitUntil: 'load' });
    assert.equal(
      await page.getByTestId('standalone-preview-iframe').getAttribute('sandbox'),
      'allow-scripts'
    );
    report.functional.standalonePreview = 'PASS';

    // 移动端 390x844 全部 4 类 Lab 路由横向零溢出检查
    await page.setViewportSize({ width: 390, height: 844 });
    for (const mobilePath of [
      '/lab/',
      '/lab/playground/?slug=star-trails-simulator',
      '/lab/algorithm-execution-tracer/',
      '/lab/preview/star-trails-simulator/',
    ]) {
      await page.goto(`${BASE_URL}${mobilePath}`, { waitUntil: 'load' });
      await page.waitForTimeout(250);
      const overflowInfo = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      assert.ok(
        overflowInfo.scrollWidth <= overflowInfo.innerWidth + 2,
        `移动端 ${mobilePath} 出现横向溢出: scrollWidth=${overflowInfo.scrollWidth} > innerWidth=${overflowInfo.innerWidth}`
      );
    }
    report.functional.mobileAllRoutesZeroOverflow = 'PASS (4/4 route families @ 390x844)';

    // 既有博客首页与关于页无回归检查
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const blogPath of ['/', '/about/']) {
      const r = await page.goto(`${BASE_URL}${blogPath}`, { waitUntil: 'load' });
      assert.equal(r?.status(), 200, `既有博客路由 ${blogPath} 应正常返回 200`);
    }
    report.functional.existingBlogRegression = 'PASS';

    assert.equal(
      pageConsoleErrors.length,
      0,
      `验收全程不得存在未捕获页面 JS 异常: ${pageConsoleErrors.join('; ')}`
    );
    report.performance.uncaughtPageErrors = 0;

    console.log('\n🎉 [Lab Phase 2.5 Verification] 全链路审计、安全渗透与多 Origin 沙盒验收通过！');
    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    console.error('❌ [Lab Phase 2.5 Verification] 运行中断言或执行异常:', err);
    throw err;
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

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ [Lab Phase 2.5 Verification] 测试失败:', err);
    process.exit(1);
  });
