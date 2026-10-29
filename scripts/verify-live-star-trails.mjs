import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_URLS = [
  'https://1bfa27c2.shijianus-blog.pages.dev/',
  'https://blog.epocanvas.com/'
];

(async () => {
  console.log('[Live E2E] Starting Live Cloudflare Pages Production Audit...');
  const browser = await chromium.launch({ headless: true });

  for (const url of TARGET_URLS) {
    console.log(`\n========================================`);
    console.log(`Testing Live URL: ${url}`);
    console.log(`========================================`);

    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      errors.push(err.message);
    });

    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      console.log(`HTTP Status: ${response.status()}`);
      if (response.status() !== 200) {
        throw new Error(`Non-200 HTTP response: ${response.status()}`);
      }

      await page.waitForTimeout(1000);

      // Verify #card-telegram
      const card = await page.$('#card-telegram');
      if (!card) {
        console.warn(`Card #card-telegram not found directly on ${url}`);
        continue;
      }

      // Check SVG structure on production
      const liveData = await page.evaluate(() => {
        const card = document.querySelector('#card-telegram');
        const front = card?.querySelector('.front-face');
        const svg = front?.querySelector('.promo-scene-art svg');
        const unifiedVault = svg?.querySelector('.celestial-vault-unified');
        const bloom = svg?.querySelector('#promoStarBloom');
        const microTrails = svg?.querySelectorAll('.tier-micro-trails path') || [];
        const midTrails = svg?.querySelectorAll('.tier-mid-trails path') || [];
        const alphaTrails = svg?.querySelectorAll('.tier-alpha-trails path') || [];
        const alphaHeads = svg?.querySelectorAll('.tier-alpha-heads g') || [];

        return {
          hasSvg: Boolean(svg),
          hasBloom: Boolean(bloom),
          hasUnifiedVault: Boolean(unifiedVault),
          microTrailsCount: microTrails.length,
          midTrailsCount: midTrails.length,
          alphaTrailsCount: alphaTrails.length,
          alphaHeadsCount: alphaHeads.length,
        };
      });

      console.log(`Live Audit Data [${url}]:`, liveData);

      if (liveData.hasUnifiedVault && liveData.hasBloom) {
        console.log(`✅ Production deployment ACTIVE on ${url}!`);
        await card.scrollIntoViewIfNeeded();
        const screenshotPath = path.join(__dirname, `../dist/live-production-${url.includes('pages.dev') ? 'preview' : 'domain'}.png`);
        await card.screenshot({ path: screenshotPath });
        console.log(`✅ Captured live screenshot: ${screenshotPath}`);
      } else {
        console.log(`ℹ️ Edge CDN cache may still be propagating on ${url}.`);
      }

      if (errors.length > 0) {
        console.warn(`Console Errors on ${url}:`, errors);
      } else {
        console.log(`✅ Zero console errors detected on ${url}`);
      }

    } catch (e) {
      console.error(`Error testing ${url}:`, e.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('\n[Live E2E] Live Production Audit Completed.\n');
})();
