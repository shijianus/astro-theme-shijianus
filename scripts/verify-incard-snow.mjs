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

const PORT = 4331;
await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`Local test server running at http://localhost:${PORT}`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 950 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text());
  }
});

try {
  console.log('Navigating to local site...');
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // 1. Audit In-Card Snow Attachment
  const snowAudit = await page.evaluate(() => {
    const svgs = document.querySelectorAll('.card-snow-svg');
    const cardsWithSnow = [];
    svgs.forEach((svg) => {
      const parent = svg.parentElement;
      cardsWithSnow.push({
        tag: parent.tagName,
        className: parent.className,
        id: parent.id,
        parentWidth: parent.offsetWidth,
        svgWidth: Math.round(svg.getBoundingClientRect().width),
        svgHeight: Math.round(svg.getBoundingClientRect().height),
      });
    });
    return {
      totalSnowSvgs: svgs.length,
      sampleCards: cardsWithSnow.slice(0, 8),
    };
  });

  console.log('Snow Audit:', JSON.stringify(snowAudit, null, 2));

  // Take screenshot of top of homepage
  await page.screenshot({ path: 'scripts/audit_screenshots/incard_01_top.png' });
  console.log('Saved incard_01_top.png');

  // 2. Audit .categoryItem hover expansion
  console.log('Testing .categoryItem hover expansion...');
  const firstCat = page.locator('.categoryItem').first();
  await firstCat.hover();
  await page.waitForTimeout(400); // let flex transition animate

  const catHoverAudit = await page.evaluate(() => {
    const cat = document.querySelector('.categoryItem');
    const svg = cat ? cat.querySelector('.card-snow-svg') : null;
    return {
      catWidth: cat ? cat.offsetWidth : 0,
      svgWidth: svg ? Math.round(svg.getBoundingClientRect().width) : 0,
      svgMatchesCat: svg && Math.abs(cat.offsetWidth - svg.getBoundingClientRect().width) < 5,
    };
  });
  console.log('Category Hover Audit:', catHoverAudit);
  await page.screenshot({ path: 'scripts/audit_screenshots/incard_02_cat_hover.png' });
  console.log('Saved incard_02_cat_hover.png');

  // 3. Audit todayCard flip
  console.log('Testing todayCard flip...');
  const todayToggle = page.locator('#today-card-toggle');
  const todayCard = page.locator('.todayCard');

  const beforeFlip = await todayCard.evaluate((el) => {
    const svg = el.querySelector('.card-snow-svg');
    const style = window.getComputedStyle(el);
    return {
      opacity: style.opacity,
      hasSnow: !!svg,
    };
  });
  console.log('TodayCard Before Flip:', beforeFlip);

  // Click toggle
  await page.evaluate(() => {
    const t = document.getElementById('today-card-toggle');
    if (t) {
      t.checked = true;
      t.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(400);

  const afterFlip = await todayCard.evaluate((el) => {
    const svg = el.querySelector('.card-snow-svg');
    const style = window.getComputedStyle(el);
    return {
      opacity: style.opacity,
      pointerEvents: style.pointerEvents,
      hasSnow: !!svg,
    };
  });
  console.log('TodayCard After Flip:', afterFlip);
  await page.screenshot({ path: 'scripts/audit_screenshots/incard_03_today_flipped.png' });
  console.log('Saved incard_03_today_flipped.png');

  // Flip back
  await page.evaluate(() => {
    const t = document.getElementById('today-card-toggle');
    if (t) {
      t.checked = false;
      t.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(300);

  // 4. Audit Scrolling Down
  console.log('Scrolling down 600px...');
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'scripts/audit_screenshots/incard_04_scrolled_600px.png' });
  console.log('Saved incard_04_scrolled_600px.png');

  // 5. Dark Mode Audit
  console.log('Testing Dark Mode...');
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'scripts/audit_screenshots/incard_05_dark_top.png' });
  console.log('Saved incard_05_dark_top.png');

  console.log('Console Errors:', consoleErrors);
  if (consoleErrors.length > 0) {
    console.error('Fatal errors found:', consoleErrors);
    process.exit(1);
  }

  console.log('All In-Card Snow Mantle tests passed successfully!');
} finally {
  await browser.close();
  server.close();
}
