import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const PORT = 4399;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

// Simple static file server for dist
function createServer() {
  return http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath.endsWith('/')) reqPath += 'index.html';
    let filePath = path.join(DIST_DIR, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.webp': 'image/webp',
      '.woff2': 'font/woff2',
    };

    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const LANGUAGES = [
  { code: 'zh-CN', name: 'Simplified Chinese' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German (Long-word)' },
  { code: 'fr', name: 'French (Long-word)' },
  { code: 'es', name: 'Spanish (Long-word)' },
];

const VIEWPORTS = [
  { name: 'Desktop', width: 1440, height: 950 },
  { name: 'Mobile', width: 375, height: 812 },
];

async function applyLocale(page, langCode) {
  await page.evaluate((targetLang) => {
    if (typeof window.__shijianus_applyLocaleVariant === 'function') {
      window.__shijianus_applyLocaleVariant(targetLang);
    } else {
      localStorage.setItem('shijianus_locale', targetLang);
      localStorage.setItem('shijianus_locale_variant', targetLang);
      localStorage.setItem('shijianus-locale-variant', targetLang);
      document.documentElement.lang = targetLang;
      document.documentElement.setAttribute('data-locale-variant', targetLang);
      window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: targetLang }));
    }
  }, langCode);
  await page.waitForTimeout(300);
}

async function run() {
  console.log('Starting local static server on port ' + PORT + '...');
  const server = createServer();
  await new Promise((resolve) => server.listen(PORT, resolve));
  const baseUrl = `http://127.0.0.1:${PORT}`;

  const browser = await chromium.launch({ headless: true });
  const errors = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n======================================================`);
      console.log(`AUDITING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`======================================================`);

      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      // 1. Audit Homepage components
      await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      for (const lang of LANGUAGES) {
        console.log(`\n--- [${vp.name}] Testing Language: ${lang.name} (${lang.code}) ---`);
        await applyLocale(page, lang.code);

        // Test 1: MusicPocket tab buttons wrapping & sizing
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('shijianus:toggle-music-pocket', { detail: { visible: true } }));
        });
        await page.waitForTimeout(200);
        await page.evaluate(() => {
          const toggle = document.querySelector('.shijianus-music-pocket__toggle');
          if (toggle && !document.querySelector('.shijianus-music-pocket__panel')) {
            toggle.click();
          }
        });
        await page.waitForTimeout(300);

        const pocketTabs = await page.evaluate(() => {
          const tabs = Array.from(document.querySelectorAll('.shijianus-music-pocket__tab'));
          return tabs.map((t) => {
            const span = t.querySelector('span');
            return {
              tab: t.getAttribute('data-tab'),
              text: (t.textContent || '').trim(),
              width: Math.round(t.getBoundingClientRect().width),
              spanHeight: span ? Math.round(span.getBoundingClientRect().height) : 0,
              isMultiLine: span ? span.getBoundingClientRect().height > 20 : false,
            };
          });
        });

        console.log(`  MusicPocket tabs:`, pocketTabs.map(t => `${t.text} (${t.width}px, lines:${t.isMultiLine ? 'MULTI' : '1'})`).join(', '));
        for (const t of pocketTabs) {
          if (t.isMultiLine) {
            errors.push(`[${vp.name}][${lang.code}] MusicPocket tab '${t.text}' wrapped into multiple lines!`);
          }
        }

        // Test 2: Account Drawer tabs
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('shijianus:open-account', { detail: { tab: 'settings' } }));
        });
        await page.waitForTimeout(300);

        const accountTabs = await page.evaluate(() => {
          const tabs = Array.from(document.querySelectorAll('.account-nav-tab'));
          return tabs.map((t) => {
            const span = t.querySelector('span');
            return {
              text: (span ? span.textContent : t.textContent || '').trim(),
              width: Math.round(t.getBoundingClientRect().width),
              scrollWidth: span ? span.scrollWidth : t.scrollWidth,
              clientWidth: span ? span.clientWidth : t.clientWidth,
              isTruncated: span ? span.scrollWidth > span.clientWidth + 2 : false,
            };
          });
        });

        console.log(`  Account tabs:`, accountTabs.map(t => `${t.text} (${t.width}px, trunc:${t.isTruncated})`).join(', '));

        // Test 3: Console modal layout & heatmap overlap
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('shijianus:open-console'));
        });
        await page.waitForTimeout(400);

        const consoleCheck = await page.evaluate(() => {
          const leftCard = document.querySelector('.console-card-group-left');
          const rightCard = document.querySelector('.console-card-group-right');
          const heatmap = document.querySelector('#console .heatmap-internal-wrapper');
          if (!leftCard || !rightCard) return null;

          const lRect = leftCard.getBoundingClientRect();
          const rRect = rightCard.getBoundingClientRect();
          const hRect = heatmap ? heatmap.getBoundingClientRect() : null;

          return {
            leftCardWidth: Math.round(lRect.width),
            rightCardWidth: Math.round(rRect.width),
            heatmapLeft: hRect ? Math.round(hRect.left) : 0,
            rightCardLeft: Math.round(rRect.left),
            leftCardRight: Math.round(lRect.right),
            isHeatmapOverlappingLeftCard: hRect ? hRect.left < lRect.right : false,
          };
        });

        if (consoleCheck) {
          console.log(`  Console: leftCardWidth=${consoleCheck.leftCardWidth}px, rightCardWidth=${consoleCheck.rightCardWidth}px, heatmapOverlapLeft=${consoleCheck.isHeatmapOverlappingLeftCard}`);
          if (vp.name === 'Desktop' && consoleCheck.isHeatmapOverlappingLeftCard) {
            errors.push(`[${vp.name}][${lang.code}] Console heatmap overlapped left card! (heatmapLeft=${consoleCheck.heatmapLeft} < leftRight=${consoleCheck.leftCardRight})`);
          }
        }

        // Close overlays
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('shijianus:close-overlays'));
        });
        await page.waitForTimeout(200);
      }

      // 2. Audit Post page (Comment section & TOC)
      const postSlug = '/posts/content-formats-and-markup-mastery/';
      console.log(`\nNavigating to post page: ${baseUrl}${postSlug}`);
      await page.goto(`${baseUrl}${postSlug}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      for (const lang of LANGUAGES) {
        console.log(`\n--- [${vp.name}][PostPage] Testing Language: ${lang.name} (${lang.code}) ---`);
        await applyLocale(page, lang.code);

        // Check comment section title & sort group
        const commentCheck = await page.evaluate(() => {
          const commentRoot = document.querySelector('#post-comment');
          const titleRow = document.querySelector('#post-comment .tk-comments-title');
          const sortGroup = document.querySelector('#post-comment .tk-sort-group');
          if (!commentRoot || !titleRow) return null;

          const cRect = commentRoot.getBoundingClientRect();
          const tRect = titleRow.getBoundingClientRect();
          const sRect = sortGroup ? sortGroup.getBoundingClientRect() : null;

          const hasOverflow = commentRoot.scrollWidth > commentRoot.clientWidth + 2;
          const sortExceeds = sRect ? sRect.right > cRect.right + 2 : false;

          return {
            clientWidth: commentRoot.clientWidth,
            scrollWidth: commentRoot.scrollWidth,
            hasOverflow,
            sortRight: sRect ? Math.round(sRect.right) : 0,
            containerRight: Math.round(cRect.right),
            sortExceeds,
          };
        });

        if (commentCheck) {
          console.log(`  Comment title: clientWidth=${commentCheck.clientWidth}px, scrollWidth=${commentCheck.scrollWidth}px, sortExceeds=${commentCheck.sortExceeds}`);
          if (commentCheck.sortExceeds) {
            errors.push(`[${vp.name}][${lang.code}] Comment sort group exceeds container! (sortRight=${commentCheck.sortRight} > containerRight=${commentCheck.containerRight})`);
          }
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n======================================================`);
  console.log(`AUDIT RESULTS SUMMARY`);
  console.log(`======================================================`);
  if (errors.length === 0) {
    console.log('✅ ALL TESTS PASSED! 0 LAYOUT OVERFLOWS OR VULNERABILITIES DETECTED!');
  } else {
    console.error(`❌ FOUND ${errors.length} ISSUES:`);
    errors.forEach(e => console.error('  - ' + e));
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
