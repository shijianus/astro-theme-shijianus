import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  else if (!path.extname(reqPath)) reqPath += '/index.html';

  const filePath = path.join(distDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 5789;

server.listen(PORT, async () => {
  console.log(`[E2E] Verifying #flip-content and QR-Code on http://localhost:${PORT}...`);
  const browser = await chromium.launch({ headless: true });
  
  try {
    // 1. Home Page Verification
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForTimeout(500);

    const homeCard = await page.$('#card-telegram');
    if (!homeCard) throw new Error('Home page #card-telegram not found');

    const homeFlipContent = await page.$('#card-telegram #flip-content');
    if (!homeFlipContent) throw new Error('Home page #flip-content not found');

    const homeQr = await page.$('#card-telegram .promo-qr-container img');
    if (!homeQr) throw new Error('Home page QR code image element not found');

    const homeInitial = await page.evaluate(() => {
      const el = document.querySelector('#card-telegram #flip-content');
      const front = el?.querySelector('.front-face');
      const back = el?.querySelector('.back-face');
      const qr = el?.querySelector('.promo-qr-container img');
      return {
        frontVisible: front ? getComputedStyle(front).backfaceVisibility === 'hidden' : false,
        backVisible: back ? getComputedStyle(back).backfaceVisibility === 'hidden' : false,
        qrSrc: qr ? qr.getAttribute('src') : null,
      };
    });

    if (!homeInitial.frontVisible || !homeInitial.backVisible) {
      throw new Error('backfaceVisibility is not properly set on faces');
    }
    if (!homeInitial.qrSrc || !homeInitial.qrSrc.includes('chronoral')) {
      throw new Error(`Unexpected QR Code source: ${homeInitial.qrSrc}`);
    }

    // Hover test
    await homeCard.hover();
    await page.waitForTimeout(700);

    const homeHover = await page.evaluate(() => {
      const el = document.querySelector('#card-telegram #flip-content');
      const qr = el?.querySelector('.promo-qr-container img');
      const rect = qr ? qr.getBoundingClientRect() : null;
      return {
        transform: el ? getComputedStyle(el).transform : '',
        qrVisible: rect ? rect.width > 30 && rect.height > 30 : false,
      };
    });

    if (!homeHover.qrVisible) {
      throw new Error('QR Code is not visible after flip');
    }
    console.log('✅ Home page Telegram card flip and QR-code verified successfully.');

    // 2. Post Page Verification
    await page.goto(`http://localhost:${PORT}/posts/hello-world/`);
    await page.waitForTimeout(500);

    const postCard = await page.$('#card-telegram');
    if (!postCard) throw new Error('Post page #card-telegram not found');

    await postCard.scrollIntoViewIfNeeded();
    await postCard.hover();
    await page.waitForTimeout(700);

    const postHover = await page.evaluate(() => {
      const el = document.querySelector('#card-telegram #flip-content');
      const qr = el?.querySelector('.promo-qr-container img');
      const rect = qr ? qr.getBoundingClientRect() : null;
      return {
        qrVisible: rect ? rect.width > 30 && rect.height > 30 : false,
      };
    });

    if (!postHover.qrVisible) {
      throw new Error('Post page QR Code is not visible after flip');
    }
    console.log('✅ Post page Telegram card flip and QR-code verified successfully.');

    console.log('\n🎉 ALL TG CARD & FLIP-CONTENT E2E TESTS PASSED!');
  } finally {
    await browser.close();
    server.close();
  }
});
