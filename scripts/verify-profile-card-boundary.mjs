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
console.log(`Test server running at http://localhost:${PORT}`);

const screenshotDir = path.resolve('scripts/audit_screenshots/profile_card_fix');
fs.mkdirSync(screenshotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 950 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

try {
  console.log('\n--- 1. Testing Profile Card on Post Page ---');
  await page.goto(`http://localhost:${PORT}/posts/markdown-syntax-mastery/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Enable snow background
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-background', 'snow');
    if (window.__snowMantleEngine) {
      window.__snowMantleEngine.scanCards();
    }
  });
  await page.waitForTimeout(500);

  const profileCardAudit = await page.evaluate(() => {
    const card = document.querySelector('.profile-card');
    if (!card) return { found: false };
    const style = window.getComputedStyle(card);
    const hasSnow = Boolean(card.querySelector('.card-snow-svg'));
    const rect = card.getBoundingClientRect();
    return {
      found: true,
      overflow: style.overflow,
      borderRadius: style.borderRadius,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      hasSnowInside: hasSnow,
    };
  });

  console.log('Profile Card Audit:', JSON.stringify(profileCardAudit, null, 2));

  if (!profileCardAudit.found) {
    throw new Error('Profile card not found!');
  }
  if (profileCardAudit.overflow !== 'hidden') {
    throw new Error(`Expected profile-card overflow to be 'hidden', got '${profileCardAudit.overflow}'`);
  }
  if (profileCardAudit.borderRadius !== '8px') {
    throw new Error(`Expected profile-card borderRadius to be '8px', got '${profileCardAudit.borderRadius}'`);
  }
  if (profileCardAudit.hasSnowInside) {
    throw new Error('Profile card should NOT have snow inside altering its morphology!');
  }

  // Screenshot profile card specifically
  const profileCardEl = await page.$('.profile-card');
  if (profileCardEl) {
    await profileCardEl.screenshot({ path: path.join(screenshotDir, 'profile_card_default.png') });
    console.log('Saved profile_card_default.png');

    // Hover test
    await profileCardEl.hover();
    await page.waitForTimeout(400);
    await profileCardEl.screenshot({ path: path.join(screenshotDir, 'profile_card_hovered.png') });
    console.log('Saved profile_card_hovered.png');
  }

  // Full page screenshot of sidebar and TOC
  await page.screenshot({ path: path.join(screenshotDir, 'post_sidebar_full.png'), animations: 'disabled' });
  console.log('Saved post_sidebar_full.png');

  console.log('\n--- 2. Checking Other Cards for Unintended Side Effects ---');
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.documentElement.setAttribute('data-background', 'snow'));
  await page.waitForTimeout(1000);

  const homeCardsAudit = await page.evaluate(() => {
    const cards = [];
    document.querySelectorAll('.recent-post-item, .categoryItem, .todayCard, #random-banner').forEach((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const snow = el.querySelector('.card-snow-svg');
      cards.push({
        tag: el.tagName,
        className: el.className?.slice ? el.className.slice(0, 30) : '',
        id: el.id,
        overflow: style.overflow,
        borderRadius: style.borderRadius,
        hasSnow: Boolean(snow),
      });
    });
    return cards;
  });

  console.log(`Audited ${homeCardsAudit.length} home cards. Sample:`, homeCardsAudit.slice(0, 4));

  await page.screenshot({ path: path.join(screenshotDir, 'home_cards_overview.png'), animations: 'disabled' });
  console.log('Saved home_cards_overview.png');

  console.log('\n✅ Profile Card Boundary & Morphological Integrity Verified Successfully!');
} finally {
  await browser.close();
  server.close();
}
