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
  '/posts/hello-world/',
];

async function scanPageForChinese(page, targetLocale) {
  // Switch to targetLocale
  await page.evaluate((loc) => {
    window.localStorage.setItem('shijianus-locale-variant', loc);
    window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: loc }));
  }, targetLocale);
  await page.waitForTimeout(800);

  // Extract all text nodes that still contain Chinese characters
  // We exclude the actual post body content of the article (because AI translation of articles is disabled by default)
  // But we DO inspect header, navigation, sidebar, widgets, comments section, modals, buttons, drawers, footers!
  const leaks = await page.evaluate(() => {
    const zhRegex = /[\u4e00-\u9fa5]/;
    const results = [];

    // Filter out article markdown body since article body AI translation is isolated
    const isInsideArticleBody = (el) => {
      return el.closest('#article-container, .article-body, .post-content');
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

          // Ignore article body itself (since article content AI translation is isolated)
          if (isInsideArticleBody(parent)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Check if visible
          const rect = parent.getBoundingClientRect();
          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            // Also inspect hidden modals if they are supposed to show
            // return NodeFilter.FILTER_ACCEPT;
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

  for (const pagePath of PAGES_TO_AUDIT) {
    console.log(`\nScanning ${pagePath}...`);
    await page.goto(`http://127.0.0.1:${PORT}${pagePath}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Scan English
    const enLeaks = await scanPageForChinese(page, 'en');
    summary[pagePath] = { en: enLeaks };
    console.log(`  -> Found ${enLeaks.length} text nodes with Chinese in English mode`);
    for (const item of enLeaks.slice(0, 10)) {
      console.log(`     [${item.selector}] "${item.text}"`);
    }
    if (enLeaks.length > 10) {
      console.log(`     ... and ${enLeaks.length - 10} more`);
    }
  }

  // Also check modals and drawers by triggering them on homepage
  console.log('\nScanning modals & drawers on homepage in English mode...');
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    window.localStorage.setItem('shijianus-locale-variant', 'en');
    window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: 'en' }));
  });
  await page.waitForTimeout(500);

  // 1. Console modal
  console.log('  -> Opening Console...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:open-console')));
  await page.waitForTimeout(500);
  const consoleLeaks = await scanPageForChinese(page, 'en');
  console.log(`     Found ${consoleLeaks.length} Chinese text nodes with Console open`);
  for (const item of consoleLeaks.filter(i => i.selector.includes('console') || i.selector.includes('author') || i.selector.includes('webinfo')).slice(0, 10)) {
    console.log(`     [${item.selector}] "${item.text}"`);
  }

  // 2. Account drawer
  console.log('  -> Opening Account Drawer...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:open-notifications')));
  await page.waitForTimeout(500);
  const accountLeaks = await scanPageForChinese(page, 'en');
  console.log(`     Found ${accountLeaks.length} Chinese text nodes with Account Drawer open`);
  for (const item of accountLeaks.filter(i => i.selector.includes('drawer') || i.selector.includes('account') || i.selector.includes('panel')).slice(0, 10)) {
    console.log(`     [${item.selector}] "${item.text}"`);
  }

  // 3. Search modal
  console.log('  -> Opening Search Modal...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:open-search')));
  await page.waitForTimeout(500);
  const searchLeaks = await scanPageForChinese(page, 'en');
  console.log(`     Found ${searchLeaks.length} Chinese text nodes with Search open`);
  for (const item of searchLeaks.filter(i => i.selector.includes('search') || i.selector.includes('local')).slice(0, 10)) {
    console.log(`     [${item.selector}] "${item.text}"`);
  }

  // 4. Keyboard Shortcuts
  console.log('  -> Opening Shortcut Panel...');
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true })));
  await page.waitForTimeout(500);
  const shortcutLeaks = await scanPageForChinese(page, 'en');
  console.log(`     Found ${shortcutLeaks.length} Chinese text nodes with Shortcuts open`);
  for (const item of shortcutLeaks.filter(i => i.selector.includes('keyboard')).slice(0, 10)) {
    console.log(`     [${item.selector}] "${item.text}"`);
  }

  await browser.close();
  server.close();

  fs.writeFileSync('scratch/i18n-raw-audit.json', JSON.stringify(summary, null, 2));
  console.log('\nAudit complete! Raw report written to scratch/i18n-raw-audit.json');
}

runAudit();
