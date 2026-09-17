import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const DIST_DIR = path.resolve('dist');
const PORT = 4399;

function startStaticServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath.endsWith('/')) reqPath += 'index.html';
    let filePath = path.join(DIST_DIR, reqPath);

    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[StaticServer] Serving ${DIST_DIR} on http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

const CHINESE_CHAR_REGEX = /[\u4e00-\u9fa5]/;
const isProd = process.argv.includes('--prod');
const customBaseArg = process.argv.find((a) => a.startsWith('--base='));
const BASE_URL = isProd
  ? 'https://blog.epocanvas.com'
  : (customBaseArg ? customBaseArg.split('=')[1].replace(/\/+$/, '') : `http://127.0.0.1:${PORT}`);

async function run() {
  let server = null;
  if (!isProd && !customBaseArg) {
    server = await startStaticServer();
  }
  console.log(`[Target Environment] Testing against: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    console.log('\n======================================================');
    console.log('1. Canonical URL & In-Place Zero-Reload Language Switch');
    console.log('======================================================');

    const canonicalUrl = `${BASE_URL}/posts/content-formats-and-markup-mastery/`;
    console.log(`Navigating to canonical URL: ${canonicalUrl}`);
    await page.goto(canonicalUrl, { waitUntil: 'networkidle' });

    // Set a reload detection token in window
    await page.evaluate(() => {
      window.__RELOAD_DETECTION_ID__ = 'session_' + Math.random();
    });
    const sessionToken = await page.evaluate(() => window.__RELOAD_DETECTION_ID__);

    // Assert initial URL has NO language suffix
    const currentUrl = page.url();
    assert(
      currentUrl === canonicalUrl,
      `Current URL is strictly canonical: ${currentUrl}`
    );

    // Verify all 6 translation variants are pre-rendered
    const variantCount = await page.locator('.article-translation-variant').count();
    assert(variantCount >= 5, `Pre-rendered translation variants count in DOM >= 5 (found: ${variantCount})`);

    // Verify PostHero language switcher buttons are present
    const langButtons = await page.locator('.post-hero__lang-tag').count();
    assert(langButtons >= 5, `PostHero language switcher buttons present (found: ${langButtons})`);

    // ── Switch to English ('en') ──
    console.log('\n--> Testing in-place switch to English (en)...');
    const enBtn = page.locator('.post-hero__lang-tag[data-target-lang="en"]');
    await enBtn.click();
    await page.waitForTimeout(500);

    // 1. Verify NO page reload occurred
    const tokenAfterEn = await page.evaluate(() => window.__RELOAD_DETECTION_ID__);
    assert(tokenAfterEn === sessionToken, 'Zero reload: window session token preserved');

    // 2. Verify URL strictly remained canonical
    assert(page.url() === canonicalUrl, `URL invariance: URL remained strictly canonical (${page.url()})`);

    // 3. Verify English variant is visible and others hidden
    const enVisible = await page.locator('.article-translation-variant[data-lang="en"]').isVisible();
    const zhVisible = await page.locator('.article-translation-variant[data-lang="zh-CN"]').isVisible();
    assert(enVisible && !zhVisible, 'Only English article variant is displayed');

    // 4. Verify PostHero title & document title updated to English
    const heroTitle = await page.locator('.post-hero__title-block h1').textContent();
    assert(!CHINESE_CHAR_REGEX.test(heroTitle || ''), `Hero title in English (no Chinese): "${heroTitle}"`);

    // 5. Verify PostHero active tag
    const isEnActive = await page.locator('.post-hero__lang-tag[data-target-lang="en"]').getAttribute('class');
    assert(isEnActive?.includes('is-active'), 'English language button marked as is-active');

    // 6. Scroll into view of Chat Dialogue and verify localized headers
    const chatContainer = page.locator('.article-translation-variant[data-lang="en"] .chat-animated-container').first();
    if (await chatContainer.count() > 0) {
      await chatContainer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      const chatTitle = await chatContainer.locator('.chat-header-title').textContent();
      const chatBadge = await chatContainer.locator('.chat-header-badge').textContent();
      const chatReplay = await chatContainer.locator('.chat-replay-btn').textContent();

      assert(chatTitle === 'Live Dialogue Stream Simulation', `Chat header title in English: "${chatTitle}"`);
      assert(chatBadge === 'Scroll-in Animation', `Chat header badge in English: "${chatBadge}"`);
      assert(chatReplay?.trim() === '↺ Replay', `Chat replay button in English: "${chatReplay?.trim()}"`);

      const hasChineseInChat = CHINESE_CHAR_REGEX.test((chatTitle || '') + (chatBadge || '') + (chatReplay || ''));
      assert(!hasChineseInChat, 'Zero Chinese fallback in English chat header components');
    } else {
      console.log('  ⚠️ Chat container not found in en variant');
    }

    // 7. Verify Task Tracker in English
    const taskTracker = page.locator('.article-translation-variant[data-lang="en"] .article-task-tracker').first();
    if (await taskTracker.count() > 0) {
      await taskTracker.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      const statusCardHeader = await taskTracker.locator('.task-tracker__status-card .status-card__header').textContent();
      const hasChineseInTask = CHINESE_CHAR_REGEX.test(statusCardHeader || '');
      assert(!hasChineseInTask, `Task tracker status card in English (no Chinese): "${statusCardHeader?.trim()}"`);
    }

    // 8. Verify TOC variant switching
    const enTocList = page.locator('.variant-toc-list[data-lang="en"]');
    if (await enTocList.count() > 0) {
      const isEnTocVisible = await enTocList.isVisible();
      assert(isEnTocVisible, 'Sidebar TOC switched to English variant list');
    }

    // ── Switch to Spanish ('es') ──
    console.log('\n--> Testing in-place switch to Spanish (es)...');
    const esBtn = page.locator('.post-hero__lang-tag[data-target-lang="es"]');
    await esBtn.click();
    await page.waitForTimeout(500);

    assert(page.url() === canonicalUrl, `URL invariance: URL remained canonical (${page.url()})`);
    const tokenAfterEs = await page.evaluate(() => window.__RELOAD_DETECTION_ID__);
    assert(tokenAfterEs === sessionToken, 'Zero reload: window session token preserved');
    const esVisible = await page.locator('.article-translation-variant[data-lang="es"]').isVisible();
    assert(esVisible, 'Spanish article variant is visible');

    const esChat = page.locator('.article-translation-variant[data-lang="es"] .chat-animated-container').first();
    if (await esChat.count() > 0) {
      await esChat.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const esTitle = await esChat.locator('.chat-header-title').textContent();
      assert(esTitle === 'Simulación de Diálogo en Vivo', `Chat title in Spanish: "${esTitle}"`);
    }

    // ── Switch to German ('de') ──
    console.log('\n--> Testing in-place switch to German (de)...');
    const deBtn = page.locator('.post-hero__lang-tag[data-target-lang="de"]');
    await deBtn.click();
    await page.waitForTimeout(500);

    assert(page.url() === canonicalUrl, `URL invariance: URL remained canonical (${page.url()})`);
    const deVisible = await page.locator('.article-translation-variant[data-lang="de"]').isVisible();
    assert(deVisible, 'German article variant is visible');

    const deChat = page.locator('.article-translation-variant[data-lang="de"] .chat-animated-container').first();
    if (await deChat.count() > 0) {
      await deChat.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const deTitle = await deChat.locator('.chat-header-title').textContent();
      assert(deTitle === 'Echtzeit-Dialogsimulation', `Chat title in German: "${deTitle}"`);
    }

    // ── Switch to French ('fr') ──
    console.log('\n--> Testing in-place switch to French (fr)...');
    const frBtn = page.locator('.post-hero__lang-tag[data-target-lang="fr"]');
    await frBtn.click();
    await page.waitForTimeout(500);

    assert(page.url() === canonicalUrl, `URL invariance: URL remained canonical (${page.url()})`);
    const frVisible = await page.locator('.article-translation-variant[data-lang="fr"]').isVisible();
    assert(frVisible, 'French article variant is visible');

    const frChat = page.locator('.article-translation-variant[data-lang="fr"] .chat-animated-container').first();
    if (await frChat.count() > 0) {
      await frChat.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const frTitle = await frChat.locator('.chat-header-title').textContent();
      assert(frTitle === 'Simulation de Dialogue en Direct', `Chat title in French: "${frTitle}"`);
    }

    // ── Switch to Traditional Chinese ('zh-Hant') ──
    console.log('\n--> Testing in-place switch to Traditional Chinese (zh-Hant)...');
    const hantBtn = page.locator('.post-hero__lang-tag[data-target-lang="zh-Hant"]');
    await hantBtn.click();
    await page.waitForTimeout(500);

    assert(page.url() === canonicalUrl, `URL invariance: URL remained canonical (${page.url()})`);
    const hantVisible = await page.locator('.article-translation-variant[data-lang="zh-Hant"]').isVisible();
    assert(hantVisible, 'Traditional Chinese variant is visible');

    const hantChat = page.locator('.article-translation-variant[data-lang="zh-Hant"] .chat-animated-container').first();
    if (await hantChat.count() > 0) {
      await hantChat.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const hantTitle = await hantChat.locator('.chat-header-title').textContent();
      assert(hantTitle === '即時對話模擬流', `Chat title in Traditional Chinese: "${hantTitle}"`);
    }

    // ── Switch back to Simplified Chinese ('zh-CN') ──
    console.log('\n--> Testing switch back to Simplified Chinese (zh-CN)...');
    const cnBtn = page.locator('.post-hero__lang-tag[data-target-lang="zh-CN"]');
    await cnBtn.click();
    await page.waitForTimeout(500);

    assert(page.url() === canonicalUrl, `URL invariance: URL remained canonical (${page.url()})`);
    const cnVisible = await page.locator('.article-translation-variant[data-lang="zh-CN"]').isVisible();
    assert(cnVisible, 'Simplified Chinese variant is visible');

    console.log('\n======================================================');
    console.log('2. Legacy URL Seamless Replace & Preference Preservation');
    console.log('======================================================');

    const legacyEnUrl = `${BASE_URL}/posts/content-formats-and-markup-mastery-en/`;
    console.log(`Navigating to legacy URL: ${legacyEnUrl}`);
    await page.goto(legacyEnUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verify redirected immediately to canonical URL
    assert(
      page.url() === canonicalUrl,
      `Legacy URL automatically replaced to canonical: ${page.url()}`
    );

    // Verify English variant is activated because legacy target was 'en'
    const legacyEnVisible = await page.locator('.article-translation-variant[data-lang="en"]').isVisible();
    assert(legacyEnVisible, 'Active variant automatically preserved as English after redirect');

    console.log('\n======================================================');
    console.log('3. Cross-Article Universality Test (/posts/badges-guide/)');
    console.log('======================================================');

    const badgesUrl = `${BASE_URL}/posts/badges-guide/`;
    console.log(`Navigating to canonical URL: ${badgesUrl}`);
    await page.goto(badgesUrl, { waitUntil: 'networkidle' });

    assert(page.url() === badgesUrl, `Badges guide canonical URL: ${page.url()}`);
    const badgesVariants = await page.locator('.article-translation-variant').count();
    assert(badgesVariants >= 5, `Badges guide has multi-variants pre-rendered (found: ${badgesVariants})`);

    // In-place switch to English on Badges Guide
    const badgesEnBtn = page.locator('.post-hero__lang-tag[data-target-lang="en"]');
    if (await badgesEnBtn.count() > 0) {
      await badgesEnBtn.click();
      await page.waitForTimeout(500);
      assert(page.url() === badgesUrl, `Badges guide URL strictly preserved (${page.url()})`);
      const badgesEnVisible = await page.locator('.article-translation-variant[data-lang="en"]').isVisible();
      assert(badgesEnVisible, 'Badges guide English variant active without reload');
    }

  } catch (err) {
    console.error('Test execution exception:', err);
    failed++;
  } finally {
    await browser.close();
    if (server) server.close();
  }

  console.log('\n======================================================');
  console.log(`TEST RESULTS: Passed: ${passed} | Failed: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run();
