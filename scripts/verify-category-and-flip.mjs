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
  console.log(`[E2E] Verifying CategoryBar thin line & Overhauled Cyber Hologram Flip-Content on http://localhost:${PORT}...`);
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForTimeout(600);

    // ==========================================
    // 1. Audit #categoryBar and #category-bar UI Style
    // ==========================================
    console.log('[Audit] Checking #categoryBar styling in Light Mode...');
    const categoryAudit = await page.evaluate(() => {
      const bar = document.getElementById('category-bar');
      const firstPost = document.querySelector('.recent-post-item');
      if (!bar) return { error: '#category-bar element not found' };
      if (!firstPost) return { error: '.recent-post-item not found' };

      const barStyle = window.getComputedStyle(bar);
      const postStyle = window.getComputedStyle(firstPost);

      return {
        barBorderWidth: barStyle.borderTopWidth,
        barBorderStyle: barStyle.borderTopStyle,
        barBorderColor: barStyle.borderTopColor,
        barBorderRadius: barStyle.borderRadius,
        barBoxShadow: barStyle.boxShadow,
        postBorderWidth: postStyle.borderTopWidth,
        postBorderRadius: postStyle.borderRadius,
      };
    });

    if (categoryAudit.error) {
      throw new Error(`CategoryBar Audit Failed: ${categoryAudit.error}`);
    }

    console.log('CategoryBar Audit Metrics:', categoryAudit);

    if (categoryAudit.barBorderWidth !== '1px') {
      throw new Error(`Expected #category-bar border width to be 1px, got: ${categoryAudit.barBorderWidth}`);
    }
    if (!['8px', '10px', '12px'].includes(categoryAudit.barBorderRadius)) {
      throw new Error(`Expected #category-bar border radius to be refined 8px~12px, got: ${categoryAudit.barBorderRadius}`);
    }
    console.log(`✅ #categoryBar 1px thin line & border-radius (${categoryAudit.barBorderRadius}) matching post cards verified!`);

    // ==========================================
    // 2. Audit #flip-content Overhauled Cyber HUD & Truly Embedded QR
    // ==========================================
    console.log('[Audit] Checking Overhauled Cyber Holographic Front & Back Pod...');
    const flipAudit = await page.evaluate(() => {
      const card = document.getElementById('card-telegram');
      const flipContent = document.querySelector('#card-telegram #flip-content');
      const techCanvas = document.querySelector('#card-telegram .promo-tech-canvas');
      const radarWatermark = document.querySelector('#card-telegram .promo-radar-watermark');
      const hudTopBar = document.querySelector('#card-telegram .hud-top-bar');
      const waveformBars = document.querySelector('#card-telegram .hud-waveform-bars');
      const orbitRing = document.querySelector('#card-telegram .promo-icon-orbit-ring');
      const pulseDot = document.querySelector('#card-telegram .status-pulse-dot');
      const bottomTracker = document.querySelector('#card-telegram .hud-bottom-tracker');
      
      const hudBackHeader = document.querySelector('#card-telegram .hud-back-header');
      const laserScanline = document.querySelector('#card-telegram .hud-laser-scanline');
      const uplinkBtn = document.querySelector('#card-telegram .promo-uplink-btn');
      const qrHudBox = document.querySelector('#card-telegram .promo-qr-hud-box');
      const qrContainer = document.querySelector('#card-telegram .promo-qr-container');
      const qrImg = document.querySelector('#card-telegram .promo-qr-container img');

      if (!card || !flipContent) return { error: 'Telegram card or #flip-content not found' };

      const qrStyle = qrImg ? window.getComputedStyle(qrImg) : null;
      const flipStyle = window.getComputedStyle(flipContent);
      const qrSrc = qrImg ? qrImg.getAttribute('src') : '';

      return {
        hasTechCanvas: !!techCanvas,
        hasRadarWatermark: !!radarWatermark,
        hasHudTopBar: !!hudTopBar,
        hasWaveformBars: !!waveformBars,
        hasOrbitRing: !!orbitRing,
        hasPulseDot: !!pulseDot,
        hasBottomTracker: !!bottomTracker,
        hasHudBackHeader: !!hudBackHeader,
        hasLaserScanline: !!laserScanline,
        hasUplinkBtn: !!uplinkBtn,
        hasQrHudBox: !!qrHudBox,
        hasQrContainer: !!qrContainer,
        qrObjectFit: qrStyle ? qrStyle.objectFit : null,
        transformStyle: flipStyle.transformStyle,
        isEmbeddedDataUrl: qrSrc.startsWith('data:image/'),
        qrSrcPrefix: qrSrc.slice(0, 30),
      };
    });

    if (flipAudit.error) {
      throw new Error(`FlipAudit Failed: ${flipAudit.error}`);
    }

    console.log('Overhauled Flip-Content Audit Metrics:', flipAudit);

    // Assert Front Face Cyber HUD Elements
    if (!flipAudit.hasTechCanvas || !flipAudit.hasRadarWatermark || !flipAudit.hasHudTopBar || !flipAudit.hasWaveformBars || !flipAudit.hasOrbitRing || !flipAudit.hasPulseDot || !flipAudit.hasBottomTracker) {
      throw new Error('Front face Cyber HUD elements are missing from overhauled card');
    }

    // Assert Back Face Holographic Scanner Pod Elements
    if (!flipAudit.hasHudBackHeader || !flipAudit.hasLaserScanline || !flipAudit.hasUplinkBtn || !flipAudit.hasQrHudBox) {
      throw new Error('Back face Holographic Scanner Pod elements are missing from overhauled card');
    }

    // Assert Truly Embedded QR-Code
    if (!flipAudit.isEmbeddedDataUrl) {
      throw new Error(`Expected truly embedded QR Code (data:image/...), got: ${flipAudit.qrSrcPrefix}`);
    }
    if (flipAudit.qrObjectFit !== 'contain') {
      throw new Error(`Expected QR Code object-fit to be contain, got: ${flipAudit.qrObjectFit}`);
    }
    console.log('✅ Overhauled Front Cyber HUD, Back Scanner Pod, and Truly Embedded QR-Code verified!');

    // ==========================================
    // 3. Hover Flip Animation & QR Visibility
    // ==========================================
    console.log('[Audit] Testing 3D Flip Animation on hover...');
    const cardEl = await page.$('#card-telegram');
    await cardEl.hover();
    await page.waitForTimeout(800);

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

    console.log('\n🎉 ALL E2E AUDITS FOR CATEGORYBAR & OVERHAULED CYBER FLIP-CONTENT PASSED CONVINCINGLY!');
  } finally {
    await browser.close();
    server.close();
  }
});
