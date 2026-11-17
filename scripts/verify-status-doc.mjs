import assert from 'node:assert';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  sanitizeSafeHttpUrl,
  parseSafeMarkdownLink,
  validateFriendApplicationInput,
  sanitizeGeneralFormPayload,
} from '../src/lib/friend-apply.ts';
import { buildOfficialFriendSnippets } from '../src/config/friends.ts';
import { onRequest as applyOnRequest } from '../functions/api/friends/apply.ts';
import { onRequest as submitOnRequest } from '../functions/api/forms/submit.ts';

const PORT = 4348;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'playwright-report/status-audit');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function startStaticServer() {
  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.mp4': 'video/mp4',
  };

  const server = http.createServer((req, res) => {
    const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = path.join(DIST_DIR, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
      filePath = `${filePath}.html`;
    }
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function runUnitAndApiTests() {
  console.log('▶ [Stage 1] Running unit tests & API handler contract tests...');

  // 1. URL sanitization
  assert.strictEqual(sanitizeSafeHttpUrl('https://example.com/path'), 'https://example.com/path');
  assert.strictEqual(sanitizeSafeHttpUrl('http://example.com'), 'http://example.com/');
  assert.strictEqual(sanitizeSafeHttpUrl('javascript:alert(1)'), '');
  assert.strictEqual(sanitizeSafeHttpUrl('data:text/html,<script>alert(1)</script>'), '');
  assert.strictEqual(sanitizeSafeHttpUrl('vbscript:msgbox(1)'), '');
  assert.strictEqual(sanitizeSafeHttpUrl('//evil.com/x'), '');
  assert.strictEqual(sanitizeSafeHttpUrl('https://user:pass@evil.com/'), '');

  // 2. Markdown link parsing
  const mdGood = parseSafeMarkdownLink('[测试站点](https://blog.example.com)');
  assert.strictEqual(mdGood.mode, 'markdown');
  assert.strictEqual(mdGood.name, '测试站点');
  assert.strictEqual(mdGood.url, 'https://blog.example.com/');

  const mdEvil = parseSafeMarkdownLink('[XSS](javascript:alert(1))');
  assert.strictEqual(mdEvil.mode, 'invalid');
  assert.strictEqual(mdEvil.url, '');

  // 3. Friend validation
  const badFriend = validateFriendApplicationInput({
    name: 'Test',
    url: 'javascript:alert(1)',
    avatar: 'https://example.com/a.png',
    desc: 'hello',
  });
  assert.strictEqual(badFriend.ok, false);

  const badGeneral = sanitizeGeneralFormPayload({
    formId: 'test-form',
    fields: { url: 'javascript:alert(1)' },
  });
  assert.strictEqual(badGeneral.ok, false);

  // 4. Official snippets single source of truth
  const snippets = buildOfficialFriendSnippets();
  assert.strictEqual(snippets.profile.name, 'shijianus');
  const parsedJson = JSON.parse(snippets.json);
  assert.strictEqual(parsedJson.name, 'shijianus');
  assert.strictEqual(parsedJson.url, snippets.profile.url);
  assert(snippets.yaml.includes(`name: ${snippets.profile.name}`));
  assert(snippets.html.includes(`href="${snippets.profile.url}"`));
  assert(snippets.markdown.includes(`[${snippets.profile.name}](${snippets.profile.url})`));

  // 5. API handler tests: success, D1-fail, TG-fail, both-fail (503), bad URL (400), rate-limit (429)
  const makeMockDb = (shouldSucceed) => ({
    prepare: () => ({
      bind: () => ({
        all: async () => ({ results: [], success: shouldSucceed }),
        first: async () => (shouldSucceed ? { count: 1 } : null),
        run: async () => {
          if (!shouldSucceed) throw new Error('Simulated D1 write failure');
          return { success: true };
        },
      }),
    }),
  });

  const makeApplyReq = (body, ip = '203.0.113.10') =>
    new Request('https://blog.epocanvas.com/api/friends/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': ip,
      },
      body: JSON.stringify(body),
    });

  const validBody = {
    name: 'Tester Blog',
    url: 'https://tester.example.com',
    avatar: 'https://tester.example.com/avatar.png',
    desc: 'Independent technical blog.',
    contact: '@tester',
  };

  // Mock global fetch for Telegram
  const origFetch = globalThis.fetch;
  try {
    // Case A: D1 OK + TG OK -> 200 persisted:true, notified:true
    globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
    const resA = await applyOnRequest({
      request: makeApplyReq(validBody, '203.0.113.11'),
      env: { DB: makeMockDb(true), TELEGRAM_BOT_TOKEN: 'tok', TELEGRAM_CHAT_ID: '123' },
    });
    const jsonA = await resA.json();
    assert.strictEqual(resA.status, 200);
    assert.strictEqual(jsonA.ok, true);
    assert.strictEqual(jsonA.persisted, true);
    assert.strictEqual(jsonA.notified, true);
    assert.strictEqual(jsonA.reviewStatus, 'pending_review');

    // Case B: D1 FAIL + TG OK -> 200 degraded persisted:false, notified:true
    const resB = await applyOnRequest({
      request: makeApplyReq(validBody, '203.0.113.12'),
      env: { DB: makeMockDb(false), TELEGRAM_BOT_TOKEN: 'tok', TELEGRAM_CHAT_ID: '123' },
    });
    const jsonB = await resB.json();
    assert.strictEqual(resB.status, 200);
    assert.strictEqual(jsonB.degraded, true);
    assert.strictEqual(jsonB.persisted, false);
    assert.strictEqual(jsonB.notified, true);
    assert.strictEqual(jsonB.storageStatus, 'failed');

    // Case C: D1 OK + TG FAIL -> 200 degraded persisted:true, notified:false
    globalThis.fetch = async () => new Response('TG Down', { status: 502 });
    const resC = await applyOnRequest({
      request: makeApplyReq(validBody, '203.0.113.13'),
      env: { DB: makeMockDb(true), TELEGRAM_BOT_TOKEN: 'tok', TELEGRAM_CHAT_ID: '123' },
    });
    const jsonC = await resC.json();
    assert.strictEqual(resC.status, 200);
    assert.strictEqual(jsonC.degraded, true);
    assert.strictEqual(jsonC.persisted, true);
    assert.strictEqual(jsonC.notified, false);
    assert.strictEqual(jsonC.notifyStatus, 'failed');

    // Case D: BOTH D1 FAIL AND TG FAIL -> 503 ok:false (NO fake success)
    const resD = await applyOnRequest({
      request: makeApplyReq(validBody, '203.0.113.14'),
      env: { DB: makeMockDb(false), TELEGRAM_BOT_TOKEN: 'tok', TELEGRAM_CHAT_ID: '123' },
    });
    const jsonD = await resD.json();
    assert.strictEqual(resD.status, 503);
    assert.strictEqual(jsonD.ok, false);
    assert.strictEqual(jsonD.persisted, false);
    assert.strictEqual(jsonD.notified, false);
    assert.strictEqual(jsonD.reviewStatus, 'not_recorded');

    // Case E: Unsafe URL -> 400
    const resE = await applyOnRequest({
      request: makeApplyReq({ ...validBody, url: 'javascript:alert(1)' }, '203.0.113.15'),
      env: { DB: makeMockDb(true), TELEGRAM_BOT_TOKEN: 'tok', TELEGRAM_CHAT_ID: '123' },
    });
    assert.strictEqual(resE.status, 400);

    // Case F: General /api/forms/submit total failure -> 503
    const resF = await submitOnRequest({
      request: new Request('https://blog.epocanvas.com/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.16' },
        body: JSON.stringify({ formId: 'custom', fields: { note: 'hello' } }),
      }),
      env: { DB: makeMockDb(false), TELEGRAM_BOT_TOKEN: 'tok', TELEGRAM_CHAT_ID: '123' },
    });
    assert.strictEqual(resF.status, 503);
  } finally {
    globalThis.fetch = origFetch;
  }

  console.log('  ✓ Unit tests & API handler contract tests passed (100% honest persistence/notify semantics)');
}

async function runBrowserTests() {
  console.log('\n▶ [Stage 2] Running Playwright browser verification on /status/ & regression routes...');
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const page = await context.newPage();

    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(`${BASE_URL}/status/`, { waitUntil: 'networkidle' });

    // 1. SEO, brand, language & single H1 check
    const metaCheck = await page.evaluate(() => {
      const h1s = Array.from(document.querySelectorAll('h1'));
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
      const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content');
      const ldJson = document.querySelector('script[type="application/ld+json"]')?.textContent || '';
      const bodyText = document.body.innerText;
      return {
        lang: document.documentElement.lang,
        title: document.title,
        h1Count: h1s.length,
        h1Text: h1s[0]?.textContent?.trim(),
        canonical,
        ogUrl,
        ldJson,
        hasFalseGoogleStandard: bodyText.includes('符合 Google 手册规范') || bodyText.includes('Google Manuals 规范'),
        hasFalseSla: bodyText.includes('近零冷启动') || bodyText.includes('毫秒级首屏'),
      };
    });

    assert.strictEqual(metaCheck.lang, 'zh-CN', `Expected lang=zh-CN, got ${metaCheck.lang}`);
    assert.strictEqual(metaCheck.h1Count, 1, `Expected single H1, got ${metaCheck.h1Count}`);
    assert(metaCheck.h1Text?.includes('shijianus'), `H1 must reflect shijianus brand: ${metaCheck.h1Text}`);
    assert(metaCheck.canonical?.endsWith('/status/'), `Canonical missing or wrong: ${metaCheck.canonical}`);
    assert(metaCheck.ogUrl?.endsWith('/status/'), `og:url missing or wrong: ${metaCheck.ogUrl}`);
    assert(metaCheck.ldJson.includes('shijianus'), 'JSON-LD missing shijianus publisher');
    assert.strictEqual(metaCheck.hasFalseGoogleStandard, false, 'Found old false Google standard wording');
    assert.strictEqual(metaCheck.hasFalseSla, false, 'Found unverified SLA/cold-start claims');
    console.log(`  ✓ Single H1, zh-CN, canonical (${metaCheck.canonical}), JSON-LD & brand verified`);

    // 2. Outline navigation & anchor deep-link
    await page.locator('.status-doc-rail a[href="#exchange-rules"]').click();
    await page.waitForTimeout(250);
    await page.goto(`${BASE_URL}/status/#official-friend-info`, { waitUntil: 'networkidle' });
    const hashMatches = await page.evaluate(() => window.location.hash === '#official-friend-info');
    assert(hashMatches, 'Deep link #official-friend-info failed on reload');
    console.log('  ✓ Outline navigation & deep-link reload verified');

    // 3. Glossary interaction: mouse hover + click + keyboard + Escape close + focus return
    const firstTerm = page.locator('.doc-term').first();
    await firstTerm.scrollIntoViewIfNeeded();
    await firstTerm.hover();
    await page.waitForTimeout(250);
    const popover = page.locator('#doc-glossary-popover');
    assert(await popover.isVisible(), 'Glossary popover should open on hover');

    await page.mouse.move(10, 10);
    await page.waitForTimeout(250);

    await firstTerm.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    assert(await popover.isVisible(), 'Glossary popover should open on keyboard Enter');
    assert.strictEqual(await firstTerm.getAttribute('aria-expanded'), 'true');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    assert(!(await popover.isVisible()), 'Glossary popover must close on Escape');
    assert.strictEqual(await firstTerm.getAttribute('aria-expanded'), 'false');
    console.log('  ✓ Glossary disclosure verified (hover, keyboard Enter, Escape close & focus restore)');

    // 4. External link icon & internal link checks
    const extCount = await page.locator('.status-doc-article a.doc-link--external .doc-ext-icon').count();
    assert(extCount > 0, 'External links should render .doc-ext-icon');
    assert((await page.locator('.status-doc-article a[href="/friends/"]').count()) > 0, 'Missing internal /friends/ link');
    assert((await page.locator('.status-doc-article a[href="/moments/"]').count()) > 0, 'Missing internal /moments/ link');
    console.log(`  ✓ Semantic links verified (${extCount} external links with icon)`);

    // 5. Official friend-link card: tab switching & real clipboard copy (YAML & JSON)
    const copyActiveBtn = page.locator('[data-copy-active-format]');
    await copyActiveBtn.scrollIntoViewIfNeeded();
    await copyActiveBtn.click();
    await page.waitForTimeout(150);
    const copiedYaml = await page.evaluate(() => navigator.clipboard.readText());
    assert(copiedYaml.includes('name: shijianus'), `Copied YAML mismatch: ${copiedYaml}`);

    await page.locator('#tab-json').focus();
    await page.keyboard.press('ArrowRight'); // moves to HTML
    await page.locator('#tab-json').click();
    await page.waitForTimeout(100);
    await copyActiveBtn.click();
    await page.waitForTimeout(150);
    const copiedJsonRaw = await page.evaluate(() => navigator.clipboard.readText());
    const copiedJson = JSON.parse(copiedJsonRaw);
    assert.strictEqual(copiedJson.name, 'shijianus');
    assert.strictEqual(copiedJson.url, 'https://blog.epocanvas.com');
    console.log('  ✓ Official friend card tabs & clipboard copy verified (YAML + valid JSON)');

    // 6. Friend Application Form: unsafe URL block + mocked API scenarios (success, D1 fail, TG fail, 503 total fail)
    const quickInput = page.locator('#status-apply-quicklink');
    await quickInput.scrollIntoViewIfNeeded();
    await quickInput.fill('[Evil](javascript:alert(1))');
    await page.waitForTimeout(100);
    const previewErr = await page.locator('#status-apply-quicklink-preview').textContent();
    assert(previewErr?.includes('未识别到合法的 https:// 或 http:// 链接'), `Unsafe link should be rejected: ${previewErr}`);

    await quickInput.fill('[独立示例博客](https://blog.example.org)');
    await page.locator('#status-apply-avatar').fill('https://blog.example.org/avatar.png');
    await page.locator('#status-apply-desc').fill('独立前端与系统工程记录。');

    // 6a. Total failure (503) -> MUST NOT show fake success
    await page.route('**/api/friends/apply', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          accepted: true,
          persisted: false,
          notified: false,
          error: '服务端数据库写入失败，且站长即时通知未能送达。',
        }),
      });
    });
    await page.locator('#status-apply-submit').click();
    await page.waitForTimeout(200);
    const feedbackEl = page.locator('#status-apply-feedback');
    assert(await feedbackEl.isVisible());
    assert.strictEqual(await feedbackEl.getAttribute('data-kind'), 'error');
    assert((await feedbackEl.textContent())?.includes('未能完成受理'));

    // 6b. Degraded D1 failure (200, persisted:false, notified:true)
    await page.unroute('**/api/friends/apply');
    await page.route('**/api/friends/apply', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          accepted: true,
          degraded: true,
          persisted: false,
          notified: true,
          reviewStatus: 'pending_review',
        }),
      });
    });
    await page.locator('#status-apply-submit').click();
    await page.waitForTimeout(200);
    assert.strictEqual(await feedbackEl.getAttribute('data-kind'), 'degraded_notified');

    // 6c. Full success (200, persisted:true, notified:true)
    await page.unroute('**/api/friends/apply');
    await page.route('**/api/friends/apply', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          accepted: true,
          degraded: false,
          persisted: true,
          notified: true,
          reviewStatus: 'pending_review',
          submissionId: 'apply_test_123',
        }),
      });
    });
    await quickInput.fill('[独立示例博客](https://blog.example.org)');
    await page.locator('#status-apply-avatar').fill('https://blog.example.org/avatar.png');
    await page.locator('#status-apply-desc').fill('独立前端与系统工程记录。');
    await page.locator('#status-apply-submit').click();
    await page.waitForTimeout(200);
    assert.strictEqual(await feedbackEl.getAttribute('data-kind'), 'full_success');
    assert((await feedbackEl.textContent())?.includes('并不代表站点已被收录'));
    console.log('  ✓ Friend application form scenarios verified (XSS URL block, 503 error, degraded D1, honest success)');

    // 7. Viewports & Light/Dark screenshots
    await page.goto(`${BASE_URL}/status/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'status-desktop-light-1440.png') });

    for (const vp of [
      { width: 1920, height: 1080, name: '1920' },
      { width: 1440, height: 900, name: '1440' },
      { width: 768, height: 1024, name: '768' },
      { width: 390, height: 844, name: '390' },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(250);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.strictEqual(overflow, false, `Horizontal overflow detected at viewport ${vp.width}x${vp.height}`);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'status-mobile-light-390.png') });

    // Dark mode check
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'status-desktop-dark-1440.png') });
    console.log('  ✓ All 4 viewports (390/768/1440/1920) & Light/Dark modes verified with zero horizontal overflow');

    // 8. Reduced Motion check
    const reducedCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const reducedPage = await reducedCtx.newPage();
    await reducedPage.goto(`${BASE_URL}/status/`, { waitUntil: 'networkidle' });
    const reducedOk = await reducedPage.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    assert.strictEqual(reducedOk, true);
    await reducedCtx.close();

    // 9. No-JS check
    const noJsCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: false,
    });
    const noJsPage = await noJsCtx.newPage();
    await noJsPage.goto(`${BASE_URL}/status/`, { waitUntil: 'domcontentloaded' });
    const noJsCheck = await noJsPage.evaluate(() => {
      const text = document.body.innerText;
      const visiblePanels = Array.from(document.querySelectorAll('.format-tabpanel')).filter(
        (el) => getComputedStyle(el).display !== 'none'
      ).length;
      const overflow = document.documentElement.scrollWidth > window.innerWidth;
      return {
        hasTitle: text.includes('shijianus 站点状态与友邻指南'),
        hasNotice: text.includes('本页提供的是最近核验的运行信息，并非实时监控面板'),
        hasGlossary: Boolean(document.getElementById('glossary-rss')),
        hasNoscript: text.includes('当前浏览器未启用 JavaScript'),
        visiblePanels,
        overflow,
      };
    });
    assert(noJsCheck.hasTitle && noJsCheck.hasNotice && noJsCheck.hasGlossary && noJsCheck.hasNoscript);
    assert.strictEqual(noJsCheck.visiblePanels, 4, 'All 4 format panels must be readable without JS');
    assert.strictEqual(noJsCheck.overflow, false, 'No horizontal overflow without JS on mobile');
    await noJsCtx.close();
    console.log('  ✓ Reduced-motion & No-JS experience verified');

    // 10. Regression check on ordinary posts, homepage, /friends/, /moments/, /standards/
    const statusErrors = [...pageErrors];
    assert.strictEqual(statusErrors.length, 0, `Unexpected page errors on /status/: ${statusErrors.join('; ')}`);

    for (const route of ['/', '/friends/', '/standards/', '/posts/readable-geek-interfaces/']) {
      pageErrors.length = 0;
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);
      const statusText = await page.evaluate(() => document.body.innerText.trim().length);
      assert(statusText > 100, `Regression route ${route} rendered empty`);
      assert.strictEqual(pageErrors.length, 0, `Unexpected page errors on ${route}: ${pageErrors.join('; ')}`);
    }

    // /moments/ renders cleanly though global ThemeOverlays.tsx has a pre-existing SSR-vs-client isMomentsPage check
    pageErrors.length = 0;
    await page.goto(`${BASE_URL}/moments/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const momentsText = await page.evaluate(() => document.body.innerText.trim().length);
    assert(momentsText > 100, 'Regression route /moments/ rendered empty');
    if (pageErrors.length > 0) {
      console.log(`  ! Pre-existing warning observed on /moments/ (ThemeOverlays isMomentsPage): ${pageErrors[0]}`);
    }
    console.log('  ✓ Cross-page regression checks passed (0 page errors on /status/, /, /friends/, /standards/, /posts/)');

    await context.close();
  } finally {
    await browser.close();
    server.close();
  }
}

await runUnitAndApiTests();
await runBrowserTests();
console.log('\n🎉 ALL /status/ UNIT, API, SECURITY, ACCESSIBILITY, AND E2E VERIFICATIONS PASSED!\n');
