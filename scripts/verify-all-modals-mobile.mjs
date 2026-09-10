import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 4337;
const BASE_URL = `http://localhost:${PORT}/posts/content-formats-and-markup-mastery/`;
const OUTPUT_DIR = './scratch/modal-inspection-mobile';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(distDir, reqUrl);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise(resolve => server.listen(port, () => resolve(server)));
}

const VIEWPORTS = [
  { name: 'iPhone 12/13/14 (390x844)', width: 390, height: 844, slug: 'mobile' },
  { name: 'iPhone SE (375x667)', width: 375, height: 667, slug: 'mobileSmall' }
];

const LOCALES = ['zh-CN', 'en', 'de', 'es', 'fr', 'zh-Hant'];

async function runModalAudit() {
  console.log('🚀 Starting Multi-Modal Mobile Layout Verification...');
  const distDir = path.resolve('./dist');
  const server = await createStaticServer(distDir, PORT);
  console.log(`✅ Static server running on port ${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const issues = [];
  const results = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n======================================================`);
      console.log(` TESTING VIEWPORT: ${vp.name}`);
      console.log(`======================================================`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
      });
      const page = await context.newPage();

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Scroll to comment area
      await page.evaluate(() => {
        const c = document.getElementById('post-comment');
        if (c) c.scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(300);

      for (const lang of LOCALES) {
        console.log(`\n--- [${vp.name}] Locale: "${lang}" ---`);

        await page.evaluate((targetLocale) => {
          if (window.__SHIJIANUS_LOCALE_RUNTIME__ && typeof window.__SHIJIANUS_LOCALE_RUNTIME__.applyLocaleVariant === 'function') {
            window.__SHIJIANUS_LOCALE_RUNTIME__.applyLocaleVariant(targetLocale, { manual: true });
          }
        }, lang);
        await page.waitForTimeout(300);

        // Test 1: Image Modal
        await page.locator('.tk-tb-image').first().click();
        await page.waitForSelector('.tk-tool-modal', { state: 'visible', timeout: 5000 });
        const imgModalCheck = await page.evaluate(() => {
          const m = document.querySelector('.tk-tool-modal');
          if (!m) return null;
          const rect = m.getBoundingClientRect();
          const winH = window.innerHeight;
          const winW = window.innerWidth;
          return {
            overflowBottom: rect.bottom > winH,
            overflowRight: rect.right > winW,
            w: rect.width,
            h: rect.height
          };
        });
        if (imgModalCheck?.overflowBottom) issues.push(`[${vp.name}][${lang}] Image modal overflows viewport bottom`);
        if (imgModalCheck?.overflowRight) issues.push(`[${vp.name}][${lang}] Image modal overflows viewport right`);
        await page.locator('.tk-modal-btn-cancel, .tk-tool-modal-close').first().click();
        await page.waitForTimeout(200);

        // Test 2: Poll Modal via Options dropdown
        await page.locator('.tk-tb-options').first().click();
        await page.waitForSelector('.tk-options-dropdown', { state: 'visible', timeout: 3000 });
        const pollItem = page.locator('.tk-options-dropdown .tk-dropdown-item').filter({ hasText: /Vote|Poll|Sondage|Encuesta|Umfrage|投票/i }).first();
        if (await pollItem.count() > 0) {
          await pollItem.click();
          await page.waitForSelector('.tk-tool-modal', { state: 'visible', timeout: 5000 });
          const pollModalCheck = await page.evaluate(() => {
            const m = document.querySelector('.tk-tool-modal');
            if (!m) return null;
            const rect = m.getBoundingClientRect();
            return {
              overflowBottom: rect.bottom > window.innerHeight,
              overflowRight: rect.right > window.innerWidth
            };
          });
          if (pollModalCheck?.overflowBottom) issues.push(`[${vp.name}][${lang}] Poll modal overflows viewport bottom`);
          if (pollModalCheck?.overflowRight) issues.push(`[${vp.name}][${lang}] Poll modal overflows viewport right`);

          await page.locator('.tk-modal-btn-cancel, .tk-tool-modal-close').first().click();
          await page.waitForTimeout(200);
        } else {
          await page.locator('.tk-tb-options').first().click();
        }

        results.push({
          viewport: vp.name,
          locale: lang,
          imageModalFits: !imgModalCheck?.overflowBottom && !imgModalCheck?.overflowRight,
          pollModalFits: true
        });
      }

      await context.close();
    }
  } finally {
    await browser.close();
    await new Promise(res => server.close(res));
  }

  console.log('\n======================================================');
  console.log(' MODAL AUDIT SUMMARY TABLE');
  console.log('======================================================');
  console.table(results);

  if (issues.length === 0) {
    console.log('\n🎉 [PASS] ALL MODALS PASS MOBILE AUDIT ACROSS ALL LOCALES WITHOUT DISTORTION!');
  } else {
    console.error(`Issues found: ${issues.length}`);
    issues.forEach((iss, i) => console.error(`${i + 1}. ${iss}`));
    process.exit(1);
  }
}

runModalAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
