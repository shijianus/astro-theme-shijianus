import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const distDir = path.join(ROOT, 'dist');

function createStaticServer(distDir, port = 8091) {
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
  const server = await createStaticServer(distDir, 8091);
  const browser = await chromium.launch({ headless: true });
  
  // Test both mobile standard (390px) and small mobile (360px)
  const viewports = [
    { name: 'iPhone14', width: 390, height: 844 },
    { name: 'SmallMobile', width: 360, height: 780 }
  ];

  for (const vp of viewports) {
    console.log(`\n================ Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ================`);
    const page = await browser.newPage({ viewport: vp });
    await page.goto('http://localhost:8091/posts/access-control-lab/', { waitUntil: 'load' });
    await page.waitForTimeout(800);

    const locales = ['zh-CN', 'en', 'fr', 'es', 'de'];
    for (const loc of locales) {
      if (loc !== 'zh-CN') {
        await page.evaluate((l) => {
          window.__SHIJIANUS_LOCALE_RUNTIME__?.applyLocaleVariant(l, { manual: true });
        }, loc);
        await page.waitForTimeout(400);
      }

      // Open Account Drawer
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('shijianus:open-account'));
      });
      await page.waitForTimeout(400);

      const tabChecks = await page.evaluate(() => {
        const tabs = [];
        document.querySelectorAll('.account-nav-tab').forEach((tab) => {
          const text = tab.querySelector('span')?.textContent?.trim();
          const icon = tab.querySelector('svg');
          const ir = icon?.getBoundingClientRect();
          const tr = tab.getBoundingClientRect();
          tabs.push({
            text,
            width: Math.round(tr.width),
            iconW: ir ? Math.round(ir.width) : 0,
            iconVisible: ir && ir.width >= 14,
          });
        });
        return tabs;
      });
      console.log(`[${vp.name} | ${loc}] Tabs:`, tabChecks);

      // Verify no icon was collapsed
      const collapsed = tabChecks.filter(t => !t.iconVisible);
      if (collapsed.length > 0) {
        console.error(`❌ [${vp.name} | ${loc}] Some icons are collapsed:`, collapsed);
      } else {
        console.log(`✅ [${vp.name} | ${loc}] All icons intact (width >= 14px)!`);
      }

      // Check comments tabs in mobile
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('shijianus:close-account'));
      });
      await page.waitForTimeout(200);

      const commentTabs = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('.tk-interaction-tab').forEach(tab => {
          const r = tab.getBoundingClientRect();
          items.push({ text: tab.textContent?.trim(), width: Math.round(r.width) });
        });
        return items;
      });
      if (commentTabs.length > 0) {
        console.log(`[${vp.name} | ${loc}] Comment tabs:`, commentTabs);
      }
    }
    await page.close();
  }

  await browser.close();
  server.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
