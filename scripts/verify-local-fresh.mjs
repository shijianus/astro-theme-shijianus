import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

// Simple static server
const distDir = path.resolve('dist');
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    if (ext === '.css') contentType = 'text/css';
    if (ext === '.js') contentType = 'application/javascript';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.jpg') contentType = 'image/jpeg';
    if (ext === '.svg') contentType = 'image/svg+xml';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8089, async () => {
  console.log('Static server running on http://127.0.0.1:8089');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await page.goto('http://127.0.0.1:8089/', { waitUntil: 'networkidle' });

    // Locate the promo card
    const promoCard = page.locator('#card-telegram .promo-widget, .promo-widget').first();
    await promoCard.waitFor({ state: 'visible', timeout: 5000 });

    // 1. Check that .promo-front-hint does NOT exist
    const hintCount = await promoCard.locator('.promo-front-hint').count();
    console.log(`Hint count (must be 0): ${hintCount}`);
    if (hintCount > 0) throw new Error('FAIL: .promo-front-hint still exists!');

    // 2. Measure box
    const box = await promoCard.boundingBox();
    console.log(`Promo Card Bounding Box: width=${box.width}, height=${box.height}`);

    // Take screenshot of default front face
    await page.screenshot({ path: 'scratch/local_fresh_front_full.png' });
    await promoCard.screenshot({ path: 'scratch/local_fresh_front_card.png' });
    console.log('Saved scratch/local_fresh_front_card.png');

    // 3. Hover over the promo card to trigger flip
    await promoCard.hover();
    // Wait for flip transition (0.85s)
    await page.waitForTimeout(1100);

    // Take screenshot of back face
    await promoCard.screenshot({ path: 'scratch/local_fresh_back_card.png' });
    console.log('Saved scratch/local_fresh_back_card.png');

    // Verify QR code image is visible
    const qrImg = promoCard.locator('.promo-qr-img');
    const isQrVisible = await qrImg.isVisible();
    const qrSrc = await qrImg.getAttribute('src');
    console.log(`QR code visible: ${isQrVisible}, src starts with: ${qrSrc ? qrSrc.slice(0, 30) : 'null'}`);

    console.log('Local E2E Verification SUCCESS!');
  } catch (err) {
    console.error('Local verification error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
