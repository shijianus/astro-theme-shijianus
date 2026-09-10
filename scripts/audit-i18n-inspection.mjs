import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const distDir = path.join(ROOT, 'dist');

function createStaticServer(distDir, port = 8089) {
  return new Promise((resolve) => {
    const mime = {
      '.html': 'text/html', '.js': 'application/javascript',
      '.css': 'text/css', '.json': 'application/json',
      '.png': 'image/png', '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
      '.woff2': 'font/woff2', '.woff': 'font/woff',
    };
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath.endsWith('/')) urlPath += 'index.html';
      const filePath = path.join(distDir, urlPath);
      const ext = path.extname(filePath);
      const contentType = mime[ext] || 'application/octet-stream';
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const htmlPath = filePath + '.html';
        if (fs.existsSync(htmlPath)) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          fs.createReadStream(htmlPath).pipe(res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('Not found');
        }
      }
    });
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  const server = await createStaticServer(distDir, 8089);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('🚀 Running i18n Inspection on http://localhost:8089/posts/access-control-lab/ ...');
  await page.goto('http://localhost:8089/posts/access-control-lab/', { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  const outDir = path.join(ROOT, 'scratch/i18n-inspection');
  fs.mkdirSync(outDir, { recursive: true });

  const locales = ['zh-CN', 'en', 'fr', 'es', 'de', 'zh-Hant'];

  for (const loc of locales) {
    console.log(`\n--- Inspecting Locale: ${loc} ---`);
    if (loc !== 'zh-CN') {
      await page.evaluate((l) => {
        window.__SHIJIANUS_LOCALE_RUNTIME__?.applyLocaleVariant(l, { manual: true });
      }, loc);
      await page.waitForTimeout(600);
    }

    // 1. Inspect Headline Alignment in aside
    const headlineInfo = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('.aside-sticky-box .item-headline').forEach((hl) => {
        const icon = hl.querySelector('svg');
        const text = hl.querySelector('span:not(.aside-title-icon)');
        const cs = window.getComputedStyle(hl);
        const hlRect = hl.getBoundingClientRect();
        const iconRect = icon?.getBoundingClientRect();
        const textRect = text?.getBoundingClientRect();
        results.push({
          text: text?.textContent?.trim(),
          justifyContent: cs.justifyContent,
          textAlign: cs.textAlign,
          display: cs.display,
          gap: cs.gap,
          hlWidth: Math.round(hlRect.width),
          iconX: iconRect ? Math.round(iconRect.left - hlRect.left) : null,
          textX: textRect ? Math.round(textRect.left - hlRect.left) : null,
        });
      });
      return results;
    });
    console.log('Item Headlines in Sticky Boxes:', headlineInfo);

    // 2. Inspect Categories in Sidebar
    const catLinks = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('.card-categories .card-category-list-link').forEach((link) => {
        const name = link.querySelector('.card-category-list-name')?.textContent?.trim();
        const count = link.querySelector('.card-category-list-count')?.textContent?.trim();
        const rect = link.getBoundingClientRect();
        results.push({ name, count, width: Math.round(rect.width), height: Math.round(rect.height) });
      });
      return results;
    });
    console.log('Category Links:', catLinks);

    // 3. Inspect Flip Card CTA
    const flipCTA = await page.evaluate(() => {
      const ctaBtn = document.querySelector('#flip-content .promo-cta-btn');
      return ctaBtn ? ctaBtn.textContent?.trim() : null;
    });
    console.log('Flip Card CTA Text:', flipCTA);

    // 4. Open Account Drawer and inspect Tabs
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-account'));
    });
    await page.waitForTimeout(400);

    const tabsInfo = await page.evaluate(() => {
      const tabs = [];
      document.querySelectorAll('.account-nav-tab').forEach((tab) => {
        const text = tab.querySelector('span')?.textContent?.trim();
        const icon = tab.querySelector('svg');
        const iconRect = icon ? icon.getBoundingClientRect() : null;
        const tabRect = tab.getBoundingClientRect();
        const cs = window.getComputedStyle(tab);
        tabs.push({
          text,
          tabWidth: Math.round(tabRect.width),
          iconWidth: iconRect ? Math.round(iconRect.width) : 0,
          fontSize: cs.fontSize,
          whiteSpace: cs.whiteSpace,
          overflow: cs.overflow,
        });
      });
      return tabs;
    });
    console.log('Account Nav Tabs:', tabsInfo);

    // Take screenshot of Account Drawer
    const drawerEl = await page.$('.theme-account-drawer');
    if (drawerEl) {
      await drawerEl.screenshot({ path: path.join(outDir, `drawer-${loc}.png`) });
    }

    // Close drawer
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:close-account'));
    });
    await page.waitForTimeout(300);

    // Screenshot sidebar sticky box
    const stickyBoxSupport = await page.$('#aside-sticky-box-support');
    if (stickyBoxSupport) {
      await stickyBoxSupport.screenshot({ path: path.join(outDir, `sticky-support-${loc}.png`) });
    }
  }

  await browser.close();
  server.close();
  console.log('\n Inspection finished successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
