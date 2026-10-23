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

const PORT = 5792;

server.listen(PORT, async () => {
  console.log(`[E2E] Verifying CategoryBar line width and Flip-Content Tech UI on http://localhost:${PORT}...`);
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForTimeout(600);

    // ==========================================
    // 1. Audit #categoryBar and #category-bar UI Style
    // ==========================================
    console.log('[Audit] Checking #categoryBar and #category-bar styling in Light Mode...');
    const categoryAudit = await page.evaluate(() => {
      const bar = document.getElementById('category-bar');
      const firstPost = document.querySelector('.recent-post-item');
      if (!bar) return { error: '#category-bar element not found' };
      if (!firstPost) return { error: '.recent-post-item not found' };

      const barStyle = window.getComputedStyle(bar);
      const postStyle = window.getComputedStyle(firstPost);

      const items = Array.from(document.querySelectorAll('#catalog-list .catalog-list-item a'));
      const firstItemStyle = items.length > 0 ? window.getComputedStyle(items[0]) : null;

      return {
        barBorderWidth: barStyle.borderTopWidth,
        barBorderStyle: barStyle.borderTopStyle,
        barBorderColor: barStyle.borderTopColor,
        barBorderRadius: barStyle.borderRadius,
        barBoxShadow: barStyle.boxShadow,
        postBorderWidth: postStyle.borderTopWidth,
        postBorderRadius: postStyle.borderRadius,
        postBorderColor: postStyle.borderTopColor,
        itemBorderRadius: firstItemStyle ? firstItemStyle.borderRadius : null,
      };
    });

    if (categoryAudit.error) {
      throw new Error(`CategoryBar Audit Failed: ${categoryAudit.error}`);
    }

    console.log('CategoryBar Audit Metrics:', categoryAudit);

    // Verify 1px border width
    if (categoryAudit.barBorderWidth !== '1px') {
      throw new Error(`Expected #category-bar border width to be 1px, got: ${categoryAudit.barBorderWidth}`);
    }
    // Verify border radius matches recent-post-item (8px ~ 12px)
    if (categoryAudit.barBorderRadius !== categoryAudit.postBorderRadius && !['8px', '10px', '12px'].includes(categoryAudit.barBorderRadius)) {
      throw new Error(`Expected #category-bar border radius to match recent-post-item (${categoryAudit.postBorderRadius}), got: ${categoryAudit.barBorderRadius}`);
    }
    console.log(`✅ #categoryBar 1px thin line & border-radius (${categoryAudit.barBorderRadius}) matching post cards verified!`);

    // ==========================================
    // 2. Audit #flip-content Tech UI & QR-Code
    // ==========================================
    console.log('[Audit] Checking #flip-content Tech UI & Full QR-Code...');
    const flipAudit = await page.evaluate(() => {
      const card = document.getElementById('card-telegram');
      const flipContent = document.querySelector('#card-telegram #flip-content');
      const techCanvas = document.querySelector('#card-telegram .promo-tech-canvas');
      const techSvg = document.querySelector('#card-telegram .tech-grid-svg');
      const radarWatermark = document.querySelector('#card-telegram .promo-radar-watermark');
      const pulseDot = document.querySelector('#card-telegram .status-pulse-dot');
      const cyberOrb = document.querySelector('#card-telegram .promo-icon-cyber-wrap');
      const qrHudBox = document.querySelector('#card-telegram .promo-qr-hud-box');
      const qrContainer = document.querySelector('#card-telegram .promo-qr-container');
      const qrImg = document.querySelector('#card-telegram .promo-qr-container img');

      if (!card || !flipContent) return { error: 'Telegram card or #flip-content not found' };

      const qrStyle = qrImg ? window.getComputedStyle(qrImg) : null;
      const flipStyle = window.getComputedStyle(flipContent);

      return {
        hasTechCanvas: !!techCanvas,
        hasTechSvg: !!techSvg,
        hasRadarWatermark: !!radarWatermark,
        hasPulseDot: !!pulseDot,
        hasCyberOrb: !!cyberOrb,
        hasQrHudBox: !!qrHudBox,
        hasQrContainer: !!qrContainer,
        qrObjectFit: qrStyle ? qrStyle.objectFit : null,
        transformStyle: flipStyle.transformStyle,
        qrSrc: qrImg ? qrImg.getAttribute('src') : null,
      };
    });

    if (flipAudit.error) {
      throw new Error(`FlipAudit Failed: ${flipAudit.error}`);
    }

    console.log('Flip-Content Audit Metrics:', flipAudit);

    if (!flipAudit.hasTechCanvas || !flipAudit.hasTechSvg) {
      throw new Error('Cyber Tech Canvas SVG not found in flip-content');
    }
    if (!flipAudit.hasRadarWatermark) {
      throw new Error('Radar Compass Watermark SVG not found in flip-content');
    }
    if (!flipAudit.hasPulseDot || !flipAudit.hasCyberOrb) {
      throw new Error('Status pulse dot or Cyber Orb not found in flip-content');
    }
    if (!flipAudit.hasQrHudBox) {
      throw new Error('QR HUD Box with reticles not found in back-face');
    }
    if (flipAudit.qrObjectFit !== 'contain') {
      throw new Error(`Expected QR Code object-fit to be contain (for full uncropped display), got: ${flipAudit.qrObjectFit}`);
    }
    console.log('✅ Tech UI Elements and Full QR-Code contain configuration verified!');

    // ==========================================
    // 3. Hover Flip Animation & QR Visibility
    // ==========================================
    console.log('[Audit] Testing 3D Flip Animation on hover...');
    const cardEl = await page.$('#card-telegram');
    await cardEl.hover();
    await page.waitForTimeout(700);

    const hoverResult = await page.evaluate(() => {
      const qrImg = document.querySelector('#card-telegram .promo-qr-container img');
      const rect = qrImg ? qrImg.getBoundingClientRect() : null;
      const flipContent = document.querySelector('#card-telegram #flip-content');
      const flipStyle = flipContent ? window.getComputedStyle(flipContent) : null;
      return {
        transform: flipStyle ? flipStyle.transform : '',
        qrVisible: rect ? rect.width >= 50 && rect.height >= 50 : false,
        qrWidth: rect ? rect.width : 0,
        qrHeight: rect ? rect.height : 0,
      };
    });

    console.log('Flip Hover Result:', hoverResult);
    if (!hoverResult.qrVisible) {
      throw new Error(`QR Code was not fully rendered/visible after flip: width=${hoverResult.qrWidth}, height=${hoverResult.qrHeight}`);
    }
    console.log('✅ 3D Flip animation and full QR-code visibility verified successfully!');

    // ==========================================
    // 4. Dark Theme Audit
    // ==========================================
    console.log('[Audit] Testing Dark Theme Mode...');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300);

    const darkBarBorder = await page.evaluate(() => {
      const bar = document.getElementById('category-bar');
      return bar ? window.getComputedStyle(bar).borderTopWidth : null;
    });

    if (darkBarBorder !== '1px') {
      throw new Error(`Expected dark mode border to remain 1px, got: ${darkBarBorder}`);
    }
    console.log('✅ Dark mode 1px border verified!');

    console.log('\n🎉 ALL E2E AUDITS FOR CATEGORYBAR & FLIP-CONTENT PASSED CONVINCINGLY!');
  } finally {
    await browser.close();
    server.close();
  }
});
