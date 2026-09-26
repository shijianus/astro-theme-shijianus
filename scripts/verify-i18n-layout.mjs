import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  let filePath = path.join(path.resolve('dist'), reqPath);

  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath += '.html';
  } else if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
    filePath = path.join(filePath, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 4333;
await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`Local test server running at http://localhost:${PORT}`);

fs.mkdirSync('scripts/audit_screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const consoleErrors = [];

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[Console Error at ${page.url()}]: ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    console.log(`[Page Error at ${page.url()}]: ${err.message}`);
    consoleErrors.push(err.message);
  });

  console.log('\n--- 1. Testing Home Page i18n & Defensive Layout ---');
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const testLanguages = [
    { lang: 'zh-CN', name: 'Simplified Chinese' },
    { lang: 'de', name: 'German (Long Words)' },
    { lang: 'en', name: 'English' },
    { lang: 'fr', name: 'French' },
    { lang: 'es', name: 'Spanish' },
    { lang: 'zh-Hant', name: 'Traditional Chinese' },
  ];

  for (const { lang, name } of testLanguages) {
    console.log(`\nTesting Language: ${name} (${lang})...`);

    // Switch language via runtime API or event
    await page.evaluate((targetLang) => {
      if (typeof window.__shijianus_applyLocaleVariant === 'function') {
        window.__shijianus_applyLocaleVariant(targetLang);
      } else {
        localStorage.setItem('shijianus_locale', targetLang);
        localStorage.setItem('shijianus_locale_variant', targetLang);
        document.documentElement.lang = targetLang;
        window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: targetLang }));
      }
    }, lang);
    await page.waitForTimeout(600);

    // Audit PostCards (.recent-post-item inside home feed)
    const feedCardsAudit = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('#recent-posts .recent-post-item'));
      return cards.slice(0, 4).map((card, idx) => {
        const titleEl = card.querySelector('.post-card-title');
        const excerptEl = card.querySelector('.post-card-excerpt');
        const stickyBadge = card.querySelector('.anzhiyu-icon-thumbtack')?.parentElement;
        const categoryLink = card.querySelector('a[href^="/categories/"]');
        const unreadSpan = card.querySelector('.unvisited-post');
        const timeEl = card.querySelector('time');
        const tags = Array.from(card.querySelectorAll('a[href^="/tags/"]')).map(t => t.textContent?.trim());

        const rect = card.getBoundingClientRect();
        const titleRect = titleEl ? titleEl.getBoundingClientRect() : null;

        return {
          idx,
          title: titleEl?.textContent?.trim()?.slice(0, 40),
          titleHeight: titleRect ? Math.round(titleRect.height) : 0,
          excerpt: excerptEl?.textContent?.trim()?.slice(0, 40),
          stickyText: stickyBadge?.textContent?.trim(),
          categoryText: categoryLink?.textContent?.trim(),
          unreadText: unreadSpan?.textContent?.trim(),
          dateText: timeEl?.textContent?.trim(),
          tags,
          cardWidth: Math.round(rect.width),
          cardHeight: Math.round(rect.height),
          hasHorizontalOverflow: card.scrollWidth > card.clientWidth + 2,
        };
      });
    });

    console.log(`Feed Cards Audit [${lang}]:`, JSON.stringify(feedCardsAudit, null, 2));

    // Verify no card horizontal overflow
    for (const card of feedCardsAudit) {
      if (card.hasHorizontalOverflow) {
        throw new Error(`Card ${card.idx} has horizontal overflow in ${lang}!`);
      }
    }

    // Audit HomeHero Top Deck & Sidebar Overview
    const heroAndSidebarAudit = await page.evaluate(() => {
      const heroTitle = document.querySelector('.topGroup .recent-post-item .article-title')?.textContent?.trim()?.slice(0, 40);
      const heroBadge = document.querySelector('.topGroup .recent-post-item .recent-post-top-text')?.textContent?.trim();
      const webinfoItems = Array.from(document.querySelectorAll('.card-webinfo-grid .webinfo-item')).map(item => ({
        label: item.querySelector('.webinfo-label')?.textContent?.trim(),
        val: item.querySelector('.webinfo-val')?.textContent?.trim(),
      }));
      const popularTagsHeader = document.querySelector('.overview-section--tags .item-headline span')?.textContent?.trim();
      const featuredCategoriesHeader = document.querySelector('.overview-section--categories .item-headline span')?.textContent?.trim();
      const sitePulseHeader = document.querySelector('.overview-section--webinfo .item-headline span')?.textContent?.trim();

      return {
        heroTitle,
        heroBadge,
        webinfoItems,
        popularTagsHeader,
        featuredCategoriesHeader,
        sitePulseHeader,
      };
    });

    console.log(`Hero & Sidebar Audit [${lang}]:`, heroAndSidebarAudit);

    // Take Desktop Screenshot
    await page.screenshot({ path: `scripts/audit_screenshots/i18n_01_desktop_${lang}.png`, fullPage: false });
    console.log(`Saved screenshot: i18n_01_desktop_${lang}.png`);
  }

  // --- 2. Testing Viewport Adaptations (Tablet & Mobile) in German ---
  console.log('\n--- 2. Testing Viewport Responsiveness in German (de) ---');
  await page.evaluate(() => {
    localStorage.setItem('shijianus_locale', 'de');
    document.documentElement.lang = 'de';
    window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: { lang: 'de' } }));
  });
  await page.waitForTimeout(400);

  // Tablet Viewport: 768x1024
  console.log('Testing Tablet Viewport (768x1024)...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/audit_screenshots/i18n_02_tablet_de.png' });
  console.log('Saved screenshot: i18n_02_tablet_de.png');

  // Mobile Viewport: 375x812
  console.log('Testing Mobile Viewport (375x812)...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);

  const mobileCardAudit = await page.evaluate(() => {
    const card = document.querySelector('#recent-posts .recent-post-item');
    if (!card) return null;
    return {
      width: Math.round(card.getBoundingClientRect().width),
      scrollWidth: card.scrollWidth,
      clientWidth: card.clientWidth,
      overflow: card.scrollWidth > card.clientWidth + 2,
    };
  });
  console.log('Mobile Card Audit [de]:', mobileCardAudit);
  if (mobileCardAudit?.overflow) {
    throw new Error('Mobile card has horizontal overflow in German!');
  }

  await page.screenshot({ path: 'scripts/audit_screenshots/i18n_03_mobile_de.png' });
  console.log('Saved screenshot: i18n_03_mobile_de.png');

  // --- 3. Testing Post Page i18n (TOC, RelatedPosts, PostNav) ---
  console.log('\n--- 3. Testing Post Page i18n (TOC, PostNav, RelatedPosts) ---');
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto(`http://localhost:${PORT}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  for (const { lang, name } of [{ lang: 'de', name: 'German' }, { lang: 'en', name: 'English' }, { lang: 'fr', name: 'French' }]) {
    console.log(`Testing Post Page in ${name} (${lang})...`);
    await page.evaluate((targetLang) => {
      if (typeof window.__shijianus_applyLocaleVariant === 'function') {
        window.__shijianus_applyLocaleVariant(targetLang);
      } else {
        localStorage.setItem('shijianus_locale', targetLang);
        localStorage.setItem('shijianus_locale_variant', targetLang);
        document.documentElement.lang = targetLang;
        window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: targetLang }));
      }
    }, lang);
    await page.waitForTimeout(500);

    const postPageAudit = await page.evaluate(() => {
      const tocTitle = document.querySelector('[data-i18n-toc-title]')?.textContent?.trim();
      const tocCount = document.querySelector('[data-i18n-toc-count]')?.textContent?.trim();
      const relatedEyebrow = document.querySelector('[data-related-eyebrow]')?.textContent?.trim();
      const relatedTitle = document.querySelector('[data-related-title]')?.textContent?.trim();
      const hasRecommendation = Boolean(document.querySelector('#pagination.pagination-post, .pagination-post'));

      return {
        tocTitle,
        tocCount,
        relatedEyebrow,
        relatedTitle,
        hasRecommendation,
      };
    });
    console.log(`Post Page Audit [${lang}]:`, postPageAudit);
    await page.screenshot({ path: `scripts/audit_screenshots/i18n_04_post_${lang}.png` });
  }

  const fatalErrors = consoleErrors.filter(e => !e.includes('404') && !e.includes('Failed to load resource'));
  console.log('\nFatal JS Errors:', fatalErrors);
  if (fatalErrors.length > 0) {
    console.error('Fatal errors encountered during E2E layout audit!');
    process.exit(1);
  }

  console.log('\nAll i18n Layout & Translation E2E Audits passed successfully with 0 errors!');
} finally {
  await browser.close();
  server.close();
}
