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

    // Force Light Mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await page.waitForTimeout(600);

    const card = await page.$('#card-telegram');
    if (!card) throw new Error('#card-telegram not found on production!');

    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // 1. Capture Live Front Face in Light Mode
    const frontPath = path.join(SCREENSHOT_DIR, 'live_front_vivid.png');
    await card.screenshot({ path: frontPath });
    console.log('[E2E Live] Vivid front screenshot captured to', frontPath);

    // 2. Trigger Hover to Flip to Back Face (0.85s smooth physical flip)
    console.log('[E2E Live] Hovering on card to trigger smooth 0.85s 3D flip...');
    await card.hover();
    await page.waitForTimeout(950);

    // Capture Live Back Face in Light Mode
    const backPath = path.join(SCREENSHOT_DIR, 'live_back_vivid.png');
    await card.screenshot({ path: backPath });
    console.log('[E2E Live] Vivid back screenshot captured to', backPath);

    // 3. Inspect Live DOM & Metrics
    const metrics = await page.evaluate(() => {
      const card = document.querySelector('#card-telegram');
      const front = document.querySelector('#card-telegram .front-face');
      const back = document.querySelector('#card-telegram .back-face');
      const qrImg = document.querySelector('#card-telegram .promo-qr-img');
      const ctaBtn = document.querySelector('#card-telegram .promo-cta-btn');
      const qrLabel = document.querySelector('#card-telegram .promo-qr-label');
      const emblem = document.querySelector('#card-telegram .promo-icon-emblem');
      const watermark = document.querySelector('#card-telegram .promo-watermark');

      const frontHint = document.querySelector('#card-telegram .promo-front-hint');

      const qrSrc = qrImg ? qrImg.getAttribute('src') : '';
      const qrRect = qrImg ? qrImg.getBoundingClientRect() : null;

      const frontStyle = window.getComputedStyle(front);
      const backStyle = window.getComputedStyle(back);
      const cardStyle = window.getComputedStyle(card);

      return {
        cardHeight: cardStyle.height,
        hasFrontHint: !!frontHint,
        hasEmblem: !!emblem,
        hasWatermark: !!watermark,
        isQrEmbeddedDataUrl: qrSrc.startsWith('data:image/'),
        qrSrcPrefix: qrSrc.slice(0, 32),
        qrSize: qrRect ? { width: qrRect.width, height: qrRect.height } : null,
        frontOpacityOnHover: frontStyle.opacity,
        frontVisibilityOnHover: frontStyle.visibility,
        backOpacityOnHover: backStyle.opacity,
        backVisibilityOnHover: backStyle.visibility,
        backTransform: backStyle.transform,
        ctaText: ctaBtn ? ctaBtn.textContent.trim() : '',
        qrLabelText: qrLabel ? qrLabel.textContent.trim() : '',
      };
    });

    console.log('[E2E Live] Verified Production Metrics:', metrics);

    if (metrics.hasFrontHint) {
      throw new Error('FAIL: .promo-front-hint still exists on production!');
    }
    if (!metrics.isQrEmbeddedDataUrl) {
      throw new Error(`Expected embedded data URL on production, got: ${metrics.qrSrcPrefix}`);
    }
    if (parseFloat(metrics.frontOpacityOnHover) > 0.05) {
      throw new Error(`Front face should be hidden on hover, but opacity is ${metrics.frontOpacityOnHover}`);
    }
    if (parseFloat(metrics.backOpacityOnHover) < 0.95) {
      throw new Error(`Back face should be visible on hover, but opacity is ${metrics.backOpacityOnHover}`);
    }
    if (metrics.ctaText !== '立即直达 ↗') {
      throw new Error(`CTA button text unexpected: ${metrics.ctaText}`);
    }
    if (!metrics.hasEmblem || !metrics.hasWatermark) {
      throw new Error('Live emblem or watermark is missing!');
    }

    console.log('\n🎉 ALL PRODUCTION LIVE E2E VERIFICATIONS PASSED WITH 100% SUCCESS!');
  } finally {
    await browser.close();
  }
}

verifyLive().catch(err => {
  console.error('[E2E Live] FAILED:', err);
  process.exit(1);
});
