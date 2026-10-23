import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const LIVE_URL = 'https://blog.epocanvas.com/';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'scripts/audit_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyLive() {
  console.log(`[E2E Live] Auditing production environment on ${LIVE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    const res = await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 35000 });
    console.log(`[E2E Live] Response status code: ${res?.status()}`);

    if (res?.status() !== 200) {
      throw new Error(`Expected HTTP 200, got: ${res?.status()}`);
    }

    await page.waitForTimeout(1000);

    // ==========================================
    // 1. Production #categoryBar Audit
    // ==========================================
    console.log('[E2E Live] Auditing #categoryBar styling in production...');
    const catBarMetrics = await page.evaluate(() => {
      const bar = document.getElementById('category-bar');
      const firstPost = document.querySelector('.recent-post-item');
      if (!bar) return { error: '#category-bar not found on production' };

      const barStyle = window.getComputedStyle(bar);
      const postStyle = firstPost ? window.getComputedStyle(firstPost) : null;

      return {
        borderWidth: barStyle.borderTopWidth,
        borderStyle: barStyle.borderTopStyle,
        borderColor: barStyle.borderTopColor,
        borderRadius: barStyle.borderRadius,
        boxShadow: barStyle.boxShadow,
        postBorderWidth: postStyle ? postStyle.borderTopWidth : null,
        postBorderRadius: postStyle ? postStyle.borderRadius : null,
      };
    });

    console.log('[E2E Live] CategoryBar Metrics:', catBarMetrics);

    if (catBarMetrics.borderWidth !== '1px') {
      throw new Error(`Live #category-bar border-width is not 1px: ${catBarMetrics.borderWidth}`);
    }
    if (!['8px', '10px', '12px'].includes(catBarMetrics.borderRadius)) {
      throw new Error(`Live #category-bar border-radius unexpected: ${catBarMetrics.borderRadius}`);
    }
    console.log('✅ Production #categoryBar 1px thin line & rounded-xl border-radius verified!');

    // ==========================================
    // 2. Production #flip-content Overhauled Tech UI & Truly Embedded QR Audit
    // ==========================================
    console.log('[E2E Live] Auditing Overhauled #flip-content Cyber HUD & Embedded QR...');
    const flipMetrics = await page.evaluate(() => {
      const card = document.getElementById('card-telegram');
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

      const qrStyle = qrImg ? window.getComputedStyle(qrImg) : null;
      const qrSrc = qrImg ? qrImg.getAttribute('src') : '';

      return {
        cardFound: !!card,
        techCanvas: !!techCanvas,
        radarWatermark: !!radarWatermark,
        hudTopBar: !!hudTopBar,
        waveformBars: !!waveformBars,
        orbitRing: !!orbitRing,
        pulseDot: !!pulseDot,
        bottomTracker: !!bottomTracker,
        hudBackHeader: !!hudBackHeader,
        laserScanline: !!laserScanline,
        uplinkBtn: !!uplinkBtn,
        qrHudBox: !!qrHudBox,
        qrContainer: !!qrContainer,
        qrObjectFit: qrStyle ? qrStyle.objectFit : null,
        isEmbeddedDataUrl: qrSrc.startsWith('data:image/'),
        qrSrcPrefix: qrSrc.slice(0, 30),
      };
    });

    console.log('[E2E Live] Overhauled Flip-Content Metrics:', flipMetrics);

    if (!flipMetrics.cardFound) throw new Error('Live Telegram widget card not found');
    if (!flipMetrics.techCanvas || !flipMetrics.radarWatermark || !flipMetrics.hudTopBar || !flipMetrics.waveformBars) {
      throw new Error('Live Front Cyber HUD elements are missing from production');
    }
    if (!flipMetrics.hudBackHeader || !flipMetrics.laserScanline || !flipMetrics.uplinkBtn || !flipMetrics.qrHudBox) {
      throw new Error('Live Back Scanner Pod elements are missing from production');
    }
    if (!flipMetrics.isEmbeddedDataUrl) {
      throw new Error(`Expected truly embedded QR Code on production, got: ${flipMetrics.qrSrcPrefix}`);
    }
    if (flipMetrics.qrObjectFit !== 'contain') {
      throw new Error(`Expected Live QR-Code object-fit to be contain, got: ${flipMetrics.qrObjectFit}`);
    }
    console.log('✅ Production Overhauled Front Cyber HUD, Back Scanner Pod, and Truly Embedded QR-Code verified!');

    // ==========================================
    // 3. Production Flip Hover Test
    // ==========================================
    console.log('[E2E Live] Hovering on Telegram card to trigger 3D Flip...');
    const cardEl = await page.$('#card-telegram');
    await cardEl.hover();
    await page.waitForTimeout(800);

    const liveHover = await page.evaluate(() => {
      const qrImg = document.querySelector('#card-telegram .promo-qr-container img');
      const rect = qrImg ? qrImg.getBoundingClientRect() : null;
      return {
        visible: rect ? rect.width >= 40 && rect.height >= 40 : false,
        width: rect ? rect.width : 0,
        height: rect ? rect.height : 0,
      };
    });

    console.log('[E2E Live] Hover QR Result:', liveHover);
    if (!liveHover.visible) {
      throw new Error(`Live QR Code was not visible after 3D flip: width=${liveHover.width}, height=${liveHover.height}`);
    }

    // Capture screenshot as verifiable artifact
    const screenshotPath = path.join(SCREENSHOT_DIR, 'live-category-bar-and-flip.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`[E2E Live] Screenshot saved to ${screenshotPath}`);

    console.log('\n🎉 ALL LIVE PRODUCTION E2E VERIFICATIONS PASSED CONVINCINGLY ON https://blog.epocanvas.com!');
  } finally {
    await browser.close();
  }
}

verifyLive().catch((err) => {
  console.error('[E2E Live] FAILED:', err);
  process.exit(1);
});
