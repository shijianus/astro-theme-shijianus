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
    await page.goto(canonicalUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('#article-container', { timeout: 20000 });
    await page.waitForTimeout(1500);

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
    await page.goto(legacyEnUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2000);

    // Verify redirected immediately to canonical URL
    assert(
      page.url() === canonicalUrl,
      `Legacy URL automatically replaced to canonical: ${page.url()}`
    );

    // Verify English variant is activated because legacy target was 'en'
    const legacyEnVisible = await page.locator('.article-translation-variant[data-lang="en"]').isVisible();
    assert(legacyEnVisible, 'Active variant automatically preserved as English after redirect');

    console.log('\n======================================================');
    console.log('3. Cross-Article Universality & Initial Load TOC Alignment (/posts/badges-guide/)');
    console.log('======================================================');

    // Test first-time visitor with English persona on badges-guide
    const enContext = await browser.newContext({
      locale: 'en-US',
      viewport: { width: 1440, height: 900 }
    });
    const badgesPage = await enContext.newPage();
    const badgesUrl = `${BASE_URL}/posts/badges-guide/`;
    console.log(`Navigating to canonical URL with en-US persona: ${badgesUrl}`);
    await badgesPage.goto(badgesUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await badgesPage.waitForSelector('#article-container', { timeout: 20000 });
    await badgesPage.waitForTimeout(2000);

    assert(badgesPage.url() === badgesUrl, `Badges guide canonical URL: ${badgesPage.url()}`);
    const badgesVariants = await badgesPage.locator('.article-translation-variant').count();
    assert(badgesVariants >= 5, `Badges guide has multi-variants pre-rendered (found: ${badgesVariants})`);

    // 1. Verify Initial English Alignment on first visit
    const badgesEnVisible = await badgesPage.locator('.article-translation-variant[data-lang="en"]').isVisible();
    assert(badgesEnVisible, 'First visit with en persona: English variant is automatically active');

    const badgesHeroTitle = await badgesPage.locator('.post-hero__title-block h1').textContent();
    assert(!CHINESE_CHAR_REGEX.test(badgesHeroTitle || ''), `Badges guide hero title is in English (no Chinese): "${badgesHeroTitle}"`);

    // 2. Verify TOC Headline & Unit localized to English
    const tocTitle = await badgesPage.locator('#card-toc [data-i18n-toc-title]').textContent();
    assert(tocTitle?.trim() === 'Contents', `TOC headline translated to English: "${tocTitle?.trim()}" (NOT "文章目录")`);

    const tocCount = await badgesPage.locator('#card-toc [data-i18n-toc-count]').textContent();
    assert(tocCount?.includes('sections'), `TOC count localized to English: "${tocCount?.trim()}" (NOT "节")`);

    // 3. Verify all active TOC items on Badges Guide are in English with ZERO Chinese
    const activeTocLinks = await badgesPage.locator('.variant-toc-list[data-lang="en"] .toc-link .toc-text').allTextContents();
    assert(activeTocLinks.length > 0, `Active English TOC list has items (found: ${activeTocLinks.length})`);

    let zhInToc = false;
    for (const itemText of activeTocLinks) {
      if (CHINESE_CHAR_REGEX.test(itemText)) {
        zhInToc = true;
        console.error(`  ❌ Residual Chinese in TOC item: "${itemText}"`);
      }
    }
    assert(!zhInToc, 'ZERO residual Chinese characters in active English TOC items');

    // 4. Verify Badges Guide English body has ZERO residual Chinese
    const enBodyText = await badgesPage.locator('.article-translation-variant[data-lang="en"]').textContent();
    // Exclude code blocks & pre tags from Chinese check
    const enBodyWithoutCode = (enBodyText || '').replace(/```[\s\S]*?```/g, '');
    const zhMatchesInBody = enBodyWithoutCode.match(CHINESE_CHAR_REGEX) || [];
    assert(zhMatchesInBody.length === 0, `ZERO residual Chinese in Badges Guide English body (found: ${zhMatchesInBody.length})`);

    // 5. Test In-place switch to Spanish on Badges Guide
    console.log('\n--> Testing in-place switch to Spanish on Badges Guide...');
    const badgesEsBtn = badgesPage.locator('.post-hero__lang-tag[data-target-lang="es"]');
    await badgesEsBtn.click();
    await badgesPage.waitForTimeout(800);

    const esTocTitle = await badgesPage.locator('#card-toc [data-i18n-toc-title]').textContent();
    assert(esTocTitle?.trim() === 'Contenido', `Spanish TOC headline: "${esTocTitle?.trim()}"`);
    const esTocCount = await badgesPage.locator('#card-toc [data-i18n-toc-count]').textContent();
    assert(esTocCount?.includes('secciones'), `Spanish TOC count: "${esTocCount?.trim()}"`);

    const esTocLinks = await badgesPage.locator('.variant-toc-list[data-lang="es"] .toc-link .toc-text').allTextContents();
    const zhInEsToc = esTocLinks.some((t) => CHINESE_CHAR_REGEX.test(t));
    assert(!zhInEsToc, 'ZERO residual Chinese in Spanish TOC items');

    // 6. Test In-place switch to German on Badges Guide
    console.log('\n--> Testing in-place switch to German on Badges Guide...');
    const badgesDeBtn = badgesPage.locator('.post-hero__lang-tag[data-target-lang="de"]');
    await badgesDeBtn.click();
    await badgesPage.waitForTimeout(800);

    const deTocTitle = await badgesPage.locator('#card-toc [data-i18n-toc-title]').textContent();
    assert(deTocTitle?.trim() === 'Inhalt', `German TOC headline: "${deTocTitle?.trim()}"`);
    const deTocCount = await badgesPage.locator('#card-toc [data-i18n-toc-count]').textContent();
    assert(deTocCount?.includes('Abschnitte'), `German TOC count: "${deTocCount?.trim()}"`);

    // 7. Test TOC smooth scroll click on Badges Guide
    const firstDeTocLink = badgesPage.locator('.variant-toc-list[data-lang="de"] .toc-link').first();
    if (await firstDeTocLink.count() > 0) {
      await firstDeTocLink.click();
      await badgesPage.waitForTimeout(500);
      const scrollY = await badgesPage.evaluate(() => window.scrollY);
      assert(scrollY > 0, `TOC click successfully triggered smooth scroll (scrollY: ${scrollY}px)`);
    }

    await enContext.close();

    console.log('\n======================================================');
    console.log('4. Universal Chunked Translation & TOC (/posts/markdown-syntax-mastery/)');
    console.log('======================================================');

    const msmContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'en-US',
    });
    const msmPage = await msmContext.newPage();
    const msmUrl = `${BASE_URL}/posts/markdown-syntax-mastery/`;
    console.log(`Navigating to canonical URL with en-US persona: ${msmUrl}`);
    await msmPage.goto(msmUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await msmPage.waitForSelector('#article-container', { timeout: 20000 });
    await msmPage.waitForTimeout(2000);

    assert(msmPage.url() === msmUrl, `Markdown syntax mastery canonical URL: ${msmPage.url()}`);
    const msmVariants = await msmPage.locator('.article-translation-variant').count();
    assert(msmVariants >= 5, `Markdown syntax mastery has multi-variants pre-rendered (found: ${msmVariants})`);

    // 1. Verify Initial English Alignment on first visit
    const msmEnVisible = await msmPage.locator('.article-translation-variant[data-lang="en"]').isVisible();
    assert(msmEnVisible, 'First visit with en persona: English variant is automatically active');

    const msmHeroTitle = await msmPage.locator('.post-hero__title-block h1').textContent();
    assert(!CHINESE_CHAR_REGEX.test(msmHeroTitle || ''), `Hero title is in English (no Chinese): "${msmHeroTitle}"`);

    // 2. Verify TOC Headline & Unit localized to English
    const msmTocTitle = await msmPage.locator('#card-toc [data-i18n-toc-title]').textContent();
    assert(msmTocTitle?.trim() === 'Contents', `TOC headline translated to English: "${msmTocTitle?.trim()}" (NOT "文章目录")`);

    const msmTocCount = await msmPage.locator('#card-toc [data-i18n-toc-count]').textContent();
    assert(msmTocCount?.includes('sections'), `TOC count localized to English: "${msmTocCount?.trim()}" (NOT "节")`);

    // 3. Verify all active TOC items on Markdown Syntax Mastery are in English with ZERO Chinese
    const msmActiveTocLinks = await msmPage.locator('.variant-toc-list[data-lang="en"] .toc-link .toc-text').allTextContents();
    assert(msmActiveTocLinks.length > 0, `Active English TOC list has items (found: ${msmActiveTocLinks.length})`);

    let msmZhInToc = false;
    for (const itemText of msmActiveTocLinks) {
      if (CHINESE_CHAR_REGEX.test(itemText)) {
        msmZhInToc = true;
        console.error(`  ❌ Residual Chinese in TOC item: "${itemText}"`);
      }
    }
    assert(!msmZhInToc, 'ZERO residual Chinese characters in active English TOC items');

    // 4. Verify Markdown Syntax Mastery English body has ZERO residual Chinese (excluding ruby demo)
    const msmEnBodyText = await msmPage.locator('.article-translation-variant[data-lang="en"]').textContent();
    const msmEnBodyWithoutRuby = (msmEnBodyText || '').replace(/安知鱼|時間/g, '').replace(/```[\s\S]*?```/g, '');
    const msmZhMatchesInBody = msmEnBodyWithoutRuby.match(CHINESE_CHAR_REGEX) || [];
    assert(msmZhMatchesInBody.length === 0, `ZERO residual Chinese in Markdown Syntax Mastery English body (found: ${msmZhMatchesInBody.length})`);

    // 5. Test In-place switch to Spanish on Markdown Syntax Mastery
    console.log('\n--> Testing in-place switch to Spanish on Markdown Syntax Mastery...');
    const msmEsBtn = msmPage.locator('.post-hero__lang-tag[data-target-lang="es"]');
    await msmEsBtn.click();
    await msmPage.waitForTimeout(800);

    const msmEsTocTitle = await msmPage.locator('#card-toc [data-i18n-toc-title]').textContent();
    assert(msmEsTocTitle?.trim() === 'Contenido', `Spanish TOC headline: "${msmEsTocTitle?.trim()}"`);
    const msmEsTocCount = await msmPage.locator('#card-toc [data-i18n-toc-count]').textContent();
    assert(msmEsTocCount?.includes('secciones'), `Spanish TOC count: "${msmEsTocCount?.trim()}"`);

    const msmEsTocLinks = await msmPage.locator('.variant-toc-list[data-lang="es"] .toc-link .toc-text').allTextContents();
    const msmZhInEsToc = msmEsTocLinks.some((t) => CHINESE_CHAR_REGEX.test(t));
    assert(!msmZhInEsToc, 'ZERO residual Chinese in Spanish TOC items');

    // 6. Test In-place switch to German on Markdown Syntax Mastery
    console.log('\n--> Testing in-place switch to German on Markdown Syntax Mastery...');
    const msmDeBtn = msmPage.locator('.post-hero__lang-tag[data-target-lang="de"]');
    await msmDeBtn.click();
    await msmPage.waitForTimeout(800);

    const msmDeTocTitle = await msmPage.locator('#card-toc [data-i18n-toc-title]').textContent();
    assert(msmDeTocTitle?.trim() === 'Inhalt', `German TOC headline: "${msmDeTocTitle?.trim()}"`);
    const msmDeTocCount = await msmPage.locator('#card-toc [data-i18n-toc-count]').textContent();
    assert(msmDeTocCount?.includes('Abschnitte'), `German TOC count: "${msmDeTocCount?.trim()}"`);

    // 7. Test In-place switch to French on Markdown Syntax Mastery
    console.log('\n--> Testing in-place switch to French on Markdown Syntax Mastery...');
    const msmFrBtn = msmPage.locator('.post-hero__lang-tag[data-target-lang="fr"]');
    await msmFrBtn.click();
    await msmPage.waitForTimeout(800);

    const msmFrTocTitle = await msmPage.locator('#card-toc [data-i18n-toc-title]').textContent();
    assert(msmFrTocTitle?.trim().toLowerCase() === 'sommaire', `French TOC headline: "${msmFrTocTitle?.trim()}"`);

    // 8. Test TOC smooth scroll click on Markdown Syntax Mastery
    const firstFrTocLink = msmPage.locator('.variant-toc-list[data-lang="fr"] .toc-link').first();
    if (await firstFrTocLink.count() > 0) {
      await firstFrTocLink.click();
      await msmPage.waitForTimeout(500);
      const scrollY = await msmPage.evaluate(() => window.scrollY);
      assert(scrollY > 0, `French TOC click triggered smooth scroll (scrollY: ${scrollY}px)`);
    }

    await msmContext.close();

    console.log('\n======================================================');
    console.log('5. Residual Elements Localization Audit (Footnotes, Encrypt Banner, Copyright, Outdate)');
    console.log('======================================================');

    const auditUrl = `${BASE_URL}/posts/content-formats-and-markup-mastery/`;
    console.log(`Navigating to: ${auditUrl}`);
    await page.goto(auditUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('#article-container', { timeout: 20000 });
    await page.waitForTimeout(1000);

    // Switch to English
    const auditEnBtn = page.locator('.post-hero__lang-tag[data-target-lang="en"]');
    await auditEnBtn.click();
    await page.waitForTimeout(600);

    // 1. Audit class="footnotes" pseudo-element content
    const footnotesBeforeContent = await page.evaluate(() => {
      const el = document.querySelector('.article-translation-variant[data-lang="en"] .footnotes, .footnotes');
      if (!el) return null;
      return window.getComputedStyle(el, '::before').content;
    });
    console.log(`  Footnotes ::before content: ${footnotesBeforeContent}`);
    if (footnotesBeforeContent) {
      const hasZhInFootnotesBefore = CHINESE_CHAR_REGEX.test(footnotesBeforeContent);
      assert(!hasZhInFootnotesBefore, `Footnotes header pseudo-element in English (no Chinese): ${footnotesBeforeContent}`);
      assert(footnotesBeforeContent.includes('Footnotes'), `Footnotes header contains "Footnotes": ${footnotesBeforeContent}`);
    } else {
      console.log('  ℹ️ No footnotes block found in this post');
    }

    // 2. Audit class="ext-encrypt-entry-banner"
    const encryptBanner = page.locator('.ext-encrypt-entry-banner');
    const bannerCount = await encryptBanner.count();
    console.log(`  Encrypted entry banners found: ${bannerCount}`);
    if (bannerCount > 0) {
      for (let i = 0; i < bannerCount; i++) {
        const b = encryptBanner.nth(i);
        const bannerText = await b.textContent();
        const hasZhInBanner = CHINESE_CHAR_REGEX.test(bannerText || '');
        assert(!hasZhInBanner, `Ext encrypt banner #${i + 1} has ZERO Chinese characters in English: "${bannerText?.replace(/\s+/g, ' ').trim()}"`);
        const btnText = await b.locator('.ext-encrypt-entry-banner__btn').textContent();
        assert(!CHINESE_CHAR_REGEX.test(btnText || ''), `Banner button in English: "${btnText?.trim()}"`);
      }
    }

    // 3. Audit PostCopyright badge and notice
    const copyrightBadge = await page.locator('.post-copyright__original').first().textContent();
    assert(copyrightBadge?.trim() === 'Original', `PostCopyright original badge translated to English: "${copyrightBadge?.trim()}" (NOT "原创")`);

    const copyrightNotice = await page.locator('.post-copyright-info').first().textContent();
    assert(!copyrightNotice?.includes('除特别声明外'), `PostCopyright notice translated to English (no Chinese): "${copyrightNotice?.slice(0, 50)}..."`);

    // 4. Audit PostEndRecommendation label
    const endRecommendLabel = await page.locator('[data-pagination-label]').first().textContent();
    if (endRecommendLabel) {
      assert(endRecommendLabel.trim() === 'Next Up', `PostEndRecommendation label translated to English: "${endRecommendLabel.trim()}" (NOT "接着读")`);
    }

    // 5. Audit PostHero meta and badge
    const heroBadge = await page.locator('.post-hero__badge.is-primary').first().textContent();
    if (heroBadge) {
      assert(heroBadge.trim() === 'Original', `PostHero badge translated to English: "${heroBadge.trim()}" (NOT "原创")`);
    }
    const heroLangLabel = await page.locator('[data-translations-label]').first().textContent();
    if (heroLangLabel) {
      assert(heroLangLabel.trim() === 'Translations:', `PostHero translation label translated to English: "${heroLangLabel.trim()}" (NOT "语言版本:")`);
    }

    // 6. Audit RelatedPosts
    const relatedEyebrow = await page.locator('[data-related-eyebrow]').first().textContent();
    if (relatedEyebrow) {
      assert(relatedEyebrow.trim() === 'Related Posts', `RelatedPosts eyebrow translated to English: "${relatedEyebrow.trim()}" (NOT "相关推荐")`);
    }
  } catch (err) {
    console.error('Test run failed with error:', err);
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
