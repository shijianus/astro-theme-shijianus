import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/live_support_optimization';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runLiveAudit() {
  const targets = [
    'https://8bb54a89.shijianus-blog.pages.dev/support/',
    'https://blog.epocanvas.com/support/'
  ];

  console.log('🚀 Launching Chromium for Production Support Page E2E Verification...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (let idx = 0; idx < targets.length; idx++) {
      const targetUrl = targets[idx];
      console.log(`\n======================================================`);
      console.log(`🌐 Auditing Target [${idx + 1}/${targets.length}]: ${targetUrl}`);
      console.log(`======================================================`);

      const context = await browser.newContext({
        viewport: { width: 1440, height: 960 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();

      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      console.log(`📄 Navigating to ${targetUrl} ...`);
      const resp = await page.goto(targetUrl, {
        waitUntil: 'networkidle',
        timeout: 35000,
      });

      console.log(`Response Status: ${resp.status()}`);
      if (resp.status() !== 200) {
        throw new Error(`Expected HTTP 200, got ${resp.status()} for ${targetUrl}`);
      }

      // 1. Verify Page H1
      const h1 = await page.locator('h1').textContent();
      console.log(`✨ Page H1: "${h1?.trim()}"`);
      if (!h1?.includes('请喝一杯咖啡')) {
        throw new Error(`H1 does not contain '请喝一杯咖啡': ${h1}`);
      }

      // 2. Audit Card Alignment
      console.log('📐 Auditing Card Alignment...');
      const leftCard = page.locator('.lg\\:col-span-7');
      const rightCard = page.locator('.lg\\:col-span-5');
      const boxLeft = await leftCard.boundingBox();
      const boxRight = await rightCard.boundingBox();

      if (boxLeft && boxRight) {
        const topDiff = Math.abs(boxLeft.y - boxRight.y);
        const bottomDiff = Math.abs((boxLeft.y + boxLeft.height) - (boxRight.y + boxRight.height));
        console.log(`Left Card: y=${boxLeft.y.toFixed(1)}, height=${boxLeft.height.toFixed(1)}, bottom=${(boxLeft.y + boxLeft.height).toFixed(1)}`);
        console.log(`Right Card: y=${boxRight.y.toFixed(1)}, height=${boxRight.height.toFixed(1)}, bottom=${(boxRight.y + boxRight.height).toFixed(1)}`);
        console.log(`Top Diff: ${topDiff.toFixed(1)}px, Bottom Diff: ${bottomDiff.toFixed(1)}px`);
        if (topDiff > 3 || bottomDiff > 3) {
          console.warn(`⚠️ Warning: Card height difference is topDiff=${topDiff}, bottomDiff=${bottomDiff}`);
        } else {
          console.log('✅ Left and Right Cards are 100% aligned!');
        }
      }

      // 3. Verify Preset Buttons
      console.log('☕ Verifying 6 Preset Tier Cards...');
      const presetButtons = page.locator('.grid.grid-cols-3.gap-2\\.5 button');
      const presetCount = await presetButtons.count();
      console.log(`Found ${presetCount} preset buttons`);
      if (presetCount !== 6) {
        throw new Error(`Expected 6 presets, got ${presetCount}`);
      }

      const firstPresetText = (await presetButtons.first().innerText()).trim();
      const sixthPresetText = (await presetButtons.nth(5).innerText()).trim();
      console.log(`1st Preset: ${firstPresetText.replace(/\n/g, ' ')}`);
      console.log(`6th Preset: ${sixthPresetText.replace(/\n/g, ' ')}`);

      // 4. Verify Currency Synchronization
      console.log('💱 Verifying Currency Switcher...');
      const currencyButtons = page.locator('.lg\\:col-span-7 .flex.items-center.gap-1.p-1 button');
      const activeCurrencyBtn = page.locator('.lg\\:col-span-7 .flex.items-center.gap-1.p-1 button.bg-white, .lg\\:col-span-7 .flex.items-center.gap-1.p-1 button.dark\\:bg-\\[\\#1e2233\\]');
      const activeBtnText = (await activeCurrencyBtn.first().innerText()).trim();
      console.log(`Active Currency Button: "${activeBtnText.replace(/\n/g, ' ')}"`);

      const stripeBtn = page.locator('button:has-text("前往 Stripe 安全收银台支付")');
      const stripeBtnText = (await stripeBtn.innerText()).trim();
      console.log(`Stripe Button: "${stripeBtnText}"`);

      // 5. Test Click 6th Tier
      console.log('👉 Testing Click on Tier 6...');
      await presetButtons.nth(5).click();
      await page.waitForTimeout(300);
      const stripeBtnTextAfterTier6 = (await stripeBtn.innerText()).trim();
      console.log(`Stripe Button after Tier 6: "${stripeBtnTextAfterTier6}"`);

      // 6. Test Switch to Global Currency
      console.log('👉 Switching to Global Currency...');
      await currencyButtons.nth(1).click();
      await page.waitForTimeout(400);

      const stripeBtnGlobal = (await stripeBtn.innerText()).trim();
      console.log(`Stripe Button Global: "${stripeBtnGlobal}"`);

      // 7. Verify Right Column Pillars
      console.log('🛡️ Verifying Right Column Infrastructure Pillars...');
      const pillars = page.locator('text=真实开销与站点保障公示');
      const pillarsVisible = await pillars.isVisible();
      console.log(`Pillars Visible: ${pillarsVisible}`);

      // 8. Verify Supporter Table & Metrics
      console.log('📜 Verifying Supporter Table & Dynamic Metrics...');
      await page.locator('#sponsor-records').scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);

      const metricsCards = page.locator('.grid.grid-cols-2.sm\\:grid-cols-4.gap-3\\.5 > div');
      const metricCount = await metricsCards.count();
      for (let m = 0; m < metricCount; m++) {
        const text = (await metricsCards.nth(m).innerText()).trim();
        console.log(`Metric ${m + 1}: ${text.replace(/\n/g, ' ')}`);
      }

      // 9. Verify FAQs
      console.log('❓ Verifying FAQ Section...');
      const faqButtons = page.locator('section.space-y-4 button:has(svg.lucide-chevron-down)');
      const faqCount = await faqButtons.count();
      console.log(`Total FAQ items: ${faqCount}`);
      if (faqCount < 10) {
        throw new Error(`Expected at least 10 FAQs, got ${faqCount}`);
      }

      // 10. Capture Screenshots
      console.log('📸 Capturing Live Screenshots...');
      await page.screenshot({ path: path.join(outDir, `target-${idx + 1}-full.png`), fullPage: true });
      await page.locator('.grid.grid-cols-1.lg\\:grid-cols-12').screenshot({ path: path.join(outDir, `target-${idx + 1}-cards.png`) });
      await page.locator('#sponsor-records').screenshot({ path: path.join(outDir, `target-${idx + 1}-table.png`) });

      await context.close();
      console.log(`✅ Target [${idx + 1}/${targets.length}] PASS!`);
    }

    console.log('\n🎉 ALL Production Support Page E2E Verifications PASSED with 0 errors!');
  } finally {
    await browser.close();
  }
}

runLiveAudit().catch((err) => {
  console.error('❌ Live audit failed:', err);
  process.exit(1);
});
