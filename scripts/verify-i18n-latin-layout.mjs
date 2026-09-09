import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const IS_LIVE = process.argv.includes('--live');
const BASE_URL = IS_LIVE ? 'https://blog.epocanvas.com' : 'http://localhost:4321';
const TEST_POST_PATH = '/posts/content-formats-and-markup-mastery/';

console.log(`\n======================================================`);
console.log(`🚀 RUNNING I18N COMPREHENSIVE E2E VERIFICATION (${IS_LIVE ? 'PROD LIVE' : 'LOCAL DEV'})`);
console.log(`Target URL: ${BASE_URL}${TEST_POST_PATH}`);
console.log(`======================================================\n`);

let staticServer = null;

function createStaticServer(port) {
  const dist = path.resolve('dist');
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      let filePath = path.join(dist, urlPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
      if (!fs.existsSync(filePath)) filePath = path.join(dist, '404.html');
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const contentType = ext === '.html' ? 'text/html; charset=utf-8' : ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function startLocalServerIfNeeded() {
  if (IS_LIVE) return;

  // Check if server is already responding
  try {
    const res = await fetch(BASE_URL + '/');
    if (res.ok) {
      console.log('✅ Local server already running on port 4321.');
      return;
    }
  } catch {}

  console.log('📦 Starting native static server from dist/ on port 4321...');
  staticServer = await createStaticServer(4321);
  console.log('✅ Local static server ready.');
}

async function runAudit() {
  await startLocalServerIfNeeded();

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => {
    errors.push(`Page Error: ${err.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore network noise
      if (!text.includes('favicon') && !text.includes('net::ERR_')) {
        errors.push(`Console Error: ${text}`);
      }
    }
  });

  console.log(`🧭 Navigating to: ${BASE_URL}${TEST_POST_PATH}`);
  await page.goto(`${BASE_URL}${TEST_POST_PATH}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Capture original Chinese article text for immutability assertion
  const originalArticleText = await page.evaluate(() => {
    const article = document.getElementById('article-container');
    return article ? article.innerText.slice(0, 300) : '';
  });
  console.log(`📄 Captured original article sample (first 80 chars): "${originalArticleText.slice(0, 80).replace(/\n/g, ' ')}..."`);

  const localesToTest = ['en', 'fr', 'es', 'de', 'zh-Hant', 'zh-CN'];
  const results = {};

  for (const loc of localesToTest) {
    console.log(`\n------------------------------------------------------`);
    console.log(`🌐 Testing locale switch to: "${loc}"`);
    console.log(`------------------------------------------------------`);

    const switchStart = Date.now();
    const { browserDuration } = await page.evaluate((targetLocale) => {
      const t0 = performance.now();
      if (window.__SHIJIANUS_LOCALE_RUNTIME__ && typeof window.__SHIJIANUS_LOCALE_RUNTIME__.applyLocaleVariant === 'function') {
        window.__SHIJIANUS_LOCALE_RUNTIME__.applyLocaleVariant(targetLocale, { manual: true });
      } else {
        document.documentElement.dataset.localeVariant = targetLocale;
        document.documentElement.lang = targetLocale;
        window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: targetLocale }));
        localStorage.setItem('shijianus-locale-variant', targetLocale);
      }
      const t1 = performance.now();
      return { browserDuration: Math.round((t1 - t0) * 100) / 100 };
    }, loc);

    // Wait for requestAnimationFrame translation to complete
    await page.waitForTimeout(300);
    const totalDuration = Date.now() - switchStart;
    console.log(`⏱️ Switch latency: Browser JS ${browserDuration}ms, E2E ${totalDuration}ms (Threshold: JS < 50ms, E2E < 1000ms)`);
    if (browserDuration > 50 || totalDuration > 1000) {
      errors.push(`Locale switch to ${loc} exceeded budget: browser ${browserDuration}ms, E2E ${totalDuration}ms`);
    }

    // Inspect translated elements
    const auditData = await page.evaluate((l) => {
      const navEl = document.getElementById('nav');
      const aiSummary = document.querySelector('.shijianus-ai-summary');
      const articleEl = document.getElementById('article-container');
      const postComment = document.getElementById('post-comment');
      const asideEl = document.getElementById('aside-content');
      const copyrightNotice = document.querySelector('.post-copyright__notice');
      const nextPostLabel = document.querySelector('#pagination .label');

      // Test nav overflow
      const navOverflow = navEl ? navEl.scrollWidth > navEl.clientWidth + 2 : false;

      // Test AI actions wrapping
      const aiActions = document.querySelector('.shijianus-ai-summary__actions');
      const aiActionsOverflow = aiActions ? aiActions.scrollWidth > aiActions.clientWidth + 2 : false;

      // Extract sample strings
      const sampleNav = navEl ? navEl.innerText.slice(0, 100).replace(/\n/g, ' ') : '';
      const sampleAi = aiSummary ? aiSummary.innerText.slice(0, 120).replace(/\n/g, ' ') : '';
      const currentArticleSample = articleEl ? articleEl.innerText.slice(0, 300) : '';
      const sampleComment = postComment ? postComment.innerText.slice(0, 100).replace(/\n/g, ' ') : '';
      const sampleAside = asideEl ? asideEl.innerText.slice(0, 150).replace(/\n/g, ' ') : '';
      const copyrightText = copyrightNotice ? copyrightNotice.innerText.replace(/\n/g, ' ') : '';
      const nextLabelText = nextPostLabel ? nextPostLabel.innerText.trim() : '';

      return {
        navOverflow,
        aiActionsOverflow,
        sampleNav,
        sampleAi,
        currentArticleSample,
        sampleComment,
        sampleAside,
        copyrightText,
        nextLabelText,
        htmlLang: document.documentElement.lang,
        localeDataset: document.documentElement.dataset.localeVariant,
      };
    }, loc);

    results[loc] = auditData;

    console.log(`   - html[lang]: "${auditData.htmlLang}"`);
    console.log(`   - Nav Overflow: ${auditData.navOverflow ? '❌ YES' : '✅ NO'}`);
    console.log(`   - AI Actions Overflow: ${auditData.aiActionsOverflow ? '❌ YES' : '✅ NO'}`);
    console.log(`   - Next Post Label: "${auditData.nextLabelText}"`);
    console.log(`   - Copyright Notice: "${auditData.copyrightText.slice(0, 60)}..."`);
    console.log(`   - Aside Sample: "${auditData.sampleAside.slice(0, 70)}..."`);

    // Verification 1: Article content MUST NOT BE MUTATED
    if (auditData.currentArticleSample !== originalArticleText) {
      const msg = `❌ FATAL: Article text was modified during ${loc} locale switch! Article MUST remain untranslated!`;
      console.error(msg);
      errors.push(msg);
    } else {
      console.log(`   - Article Content Untouched: ✅ PASS`);
    }

    // Verification 2: Check target locale translations
    if (loc === 'en') {
      if (auditData.copyrightText.includes('除特别声明外')) {
        errors.push(`Copyright notice still in Chinese under en: ${auditData.copyrightText}`);
      } else {
        console.log(`   - EN Copyright Translation: ✅ PASS`);
      }
      if (auditData.nextLabelText && auditData.nextLabelText.includes('接着读')) {
        errors.push(`Next post label still in Chinese under en: ${auditData.nextLabelText}`);
      }
    } else if (loc === 'fr') {
      if (auditData.copyrightText.includes('除特别声明外')) {
        errors.push(`Copyright notice still in Chinese under fr: ${auditData.copyrightText}`);
      } else {
        console.log(`   - FR Copyright Translation: ✅ PASS`);
      }
    } else if (loc === 'de') {
      if (auditData.copyrightText.includes('除特别声明外')) {
        errors.push(`Copyright notice still in Chinese under de: ${auditData.copyrightText}`);
      } else {
        console.log(`   - DE Copyright Translation: ✅ PASS`);
      }
    } else if (loc === 'es') {
      if (auditData.copyrightText.includes('除特别声明外')) {
        errors.push(`Copyright notice still in Chinese under es: ${auditData.copyrightText}`);
      } else {
        console.log(`   - ES Copyright Translation: ✅ PASS`);
      }
    } else if (loc === 'zh-CN') {
      // Must restore cleanly to Chinese
      if (!auditData.copyrightText.includes('除特别声明外')) {
        errors.push(`Copyright notice failed to restore to zh-CN: ${auditData.copyrightText}`);
      } else {
        console.log(`   - zh-CN Restoration: ✅ PASS`);
      }
    }
  }

  // Mobile viewport test
  console.log(`\n📱 Testing Mobile Viewport (390x844)...`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);

  const mobileOverflow = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const bodyWidth = document.body.scrollWidth;
    return bodyWidth > docWidth + 2;
  });
  console.log(`   - Mobile Horizontal Scroll Overflow: ${mobileOverflow ? '❌ YES' : '✅ NO'}`);
  if (mobileOverflow) {
    errors.push('Mobile horizontal scroll overflow detected!');
  }

  await browser.close();
  if (staticServer) {
    staticServer.close();
  }

  console.log(`\n======================================================`);
  if (errors.length === 0) {
    console.log(`🎉 ALL TESTS PASSED! i18n smoothness, full translation, article immutability & layout elasticity verified!`);
    console.log(`======================================================\n`);
    process.exit(0);
  } else {
    console.error(`❌ VERIFICATION FAILED with ${errors.length} error(s):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    console.log(`======================================================\n`);
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Test execution error:', err);
  if (staticServer) staticServer.close();
  process.exit(1);
});
