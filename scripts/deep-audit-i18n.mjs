import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4398;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        let reqPath = decodeURIComponent(req.url.split('?')[0]);
        let filePath = path.join(DIST_DIR, reqPath);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        } else if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
          filePath = `${filePath}.html`;
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const content = fs.readFileSync(filePath);
          res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Content-Length': content.length,
            'Access-Control-Allow-Origin': '*',
          });
          res.end(content);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error');
      }
    });

    server.listen(PORT, () => {
      console.log(`[Scan Server] Serving at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

const PAGES_TO_AUDIT = [
  '/',
  '/archives/',
  '/categories/',
  '/tags/',
  '/about/',
  '/standards/',
  '/version/',
  '/status/',
  '/support/',
  '/friends/',
  '/roadmap/',
  '/lab/',
  '/404.html',
  '/posts/hello-world/',
];

const LOCALES_TO_TEST = ['en', 'fr', 'es', 'de'];

async function scanPageForChinese(page, targetLocale) {
  // Switch to targetLocale
  await page.evaluate((loc) => {
    window.localStorage.setItem('shijianus-locale-variant', loc);
    window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: loc }));
    if (window.__shijianus_applyLocaleVariant) {
      window.__shijianus_applyLocaleVariant(loc);
    }
  }, targetLocale);
  await page.waitForTimeout(600);

  // Extract all text nodes that still contain Chinese characters
  // We exclude the actual post body content and markdown post title/headings of the article (because AI translation of articles is disabled by default)
  // But we DO inspect header, navigation, sidebar, widgets, comments section, modals, buttons, drawers, footers!
  const leaks = await page.evaluate(() => {
    const zhRegex = /[\u4e00-\u9fa5]/;
    const results = [];

    // Filter out article markdown body and markdown titles/excerpts/TOC since article body AI translation is isolated
    const isInsideArticleContent = (el) => {
      // Ignore elements inside closed modals or overlays when running general page audit
      if (el.closest('#search-dialog:not(.show), #console:not(.show), .theme-account-overlay:not(.show), .theme-account-drawer:not(.show)')) {
        return true;
      }

      return Boolean(el.closest(
        '#article-container, .article-body, .post-content, #card-toc, .toc-content, .mobile-toc-text, #mobile-toc, ' +
        '.shijianus-ai-summary__output, .ai-explanation, .article-title, .article-sort-item-title, ' +
        '.home-mobile-focus-card__title, .postNav-title, .post-hero__title, ' +
        '.card-recent-post strong, .card-recent-post span.line-clamp-2, .card-recent-post .line-clamp-1, ' +
        '.card-recent-post .title, .aside-list .title, ' +
        '.recent-post-info p, a.article-title, .search-result-item__content strong, .search-result-item__content span, ' +
        '.post-card-title, .post-card-excerpt, .recent-post-item a, .recent-post-item p'
      ));
    };

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || !zhRegex.test(node.nodeValue)) {
            return NodeFilter.FILTER_REJECT;
          }
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          // Ignore script, style, code blocks
          const tag = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'code', 'pre'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Ignore article body and markdown title/excerpt/headings itself
          if (isInsideArticleContent(parent)) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let curr;
    while ((curr = walker.nextNode())) {
      const parent = curr.parentElement;
      const text = curr.nodeValue.trim();
      if (!text) continue;
      
      // Calculate selector
      let selector = parent.tagName.toLowerCase();
      if (parent.id) selector += `#${parent.id}`;
      if (parent.className && typeof parent.className === 'string') {
        const cls = parent.className.split(/\s+/).filter(Boolean).slice(0, 3).join('.');
        if (cls) selector += `.${cls}`;
      }

      results.push({
        text,
        selector,
        tag: parent.tagName.toLowerCase(),
        ariaLabel: parent.getAttribute('aria-label') || parent.getAttribute('title'),
      });
    }

    return results;
  });

  return leaks;
}

async function runAudit() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const summary = {};
  let totalLeakCount = 0;

  console.log('=== STARTING MULTILINGUAL PLAYWRIGHT UI AUDIT ===\n');

  for (const loc of LOCALES_TO_TEST) {
    console.log(`\n================ Testing Locale: [${loc}] ================\n`);
    summary[loc] = {};

    for (const pagePath of PAGES_TO_AUDIT) {
      await page.goto(`http://127.0.0.1:${PORT}${pagePath}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);

      const leaks = await scanPageForChinese(page, loc);
      summary[loc][pagePath] = leaks;
      totalLeakCount += leaks.length;

      if (leaks.length === 0) {
        console.log(`  ✓ ${pagePath.padEnd(24)} -> 0 Chinese leaks`);
      } else {
        console.error(`  ✗ ${pagePath.padEnd(24)} -> ${leaks.length} LEAKS!`);
        for (const item of leaks.slice(0, 5)) {
          console.error(`     [${item.selector}] "${item.text}"`);
        }
      }
    }

    // Also test overlays in this locale
    console.log(`  --- Testing Overlays in [${loc}] ---`);
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    await page.evaluate((l) => {
      window.localStorage.setItem('shijianus-locale-variant', l);
      window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: l }));
    }, loc);
    await page.waitForTimeout(300);

    // 1. Console
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:open-console')));
    await page.waitForTimeout(400);
    const consoleLeaks = await scanPageForChinese(page, loc);
    const consoleFiltered = consoleLeaks.filter(i => i.selector.includes('console') || i.selector.includes('author') || i.selector.includes('webinfo'));
    console.log(`  ${consoleFiltered.length === 0 ? '✓' : '✗'} Console Overlay: ${consoleFiltered.length} leaks`);
    if (consoleFiltered.length > 0) totalLeakCount += consoleFiltered.length;
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:close-overlay')));
    await page.waitForTimeout(200);

    // 2. Account Drawer
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:open-notifications')));
    await page.waitForTimeout(400);
    const drawerLeaks = await scanPageForChinese(page, loc);
    const drawerFiltered = drawerLeaks.filter(i => i.selector.includes('drawer') || i.selector.includes('account') || i.selector.includes('panel'));
    console.log(`  ${drawerFiltered.length === 0 ? '✓' : '✗'} Account Drawer: ${drawerFiltered.length} leaks`);
    if (drawerFiltered.length > 0) totalLeakCount += drawerFiltered.length;
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:close-overlay')));
    await page.waitForTimeout(200);

    // 3. Search
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:open-search')));
    await page.waitForTimeout(400);
    const searchLeaks = await scanPageForChinese(page, loc);
    const searchFiltered = searchLeaks.filter(i => i.selector.includes('search') || i.selector.includes('local'));
    console.log(`  ${searchFiltered.length === 0 ? '✓' : '✗'} Search Modal: ${searchFiltered.length} leaks`);
    if (searchFiltered.length > 0) totalLeakCount += searchFiltered.length;
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:close-overlay')));
    await page.waitForTimeout(200);

    // 4. Music Pocket (open panel)
    await page.evaluate(() => {
      const toggle = document.querySelector('.shijianus-music-pocket__toggle');
      if (toggle) toggle.click();
    });
    await page.waitForTimeout(400);
    const musicLeaks = await scanPageForChinese(page, loc);
    const musicFiltered = musicLeaks.filter(i => i.selector.includes('music-pocket'));
    console.log(`  ${musicFiltered.length === 0 ? '✓' : '✗'} Music Pocket: ${musicFiltered.length} leaks`);
    if (musicFiltered.length > 0) totalLeakCount += musicFiltered.length;
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.shijianus-music-pocket__close-btn');
      if (closeBtn) closeBtn.click();
    });
    await page.waitForTimeout(200);
  }

  await browser.close();
  server.close();

  fs.writeFileSync('scratch/i18n-raw-audit.json', JSON.stringify(summary, null, 2));
  console.log(`\n======================================================`);
  console.log(`Audit Finished! Total Leaks Detected: ${totalLeakCount}`);
  console.log(`======================================================\n`);

  if (totalLeakCount > 0) {
    process.exit(1);
  }
}

runAudit();
