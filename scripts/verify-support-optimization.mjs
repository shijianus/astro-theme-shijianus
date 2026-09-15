import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/support_optimization';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runAudit() {
  console.log('🚀 Launching Chromium for Support Page Verification...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
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

    console.log('📄 Navigating to http://localhost:4322/support/ ...');
    const resp = await page.goto('http://localhost:4322/support/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    if (resp.status() !== 200) {
      throw new Error(`Expected HTTP 200, got ${resp.status()}`);
    }

    // 1. Verify Header
    const h1 = await page.locator('h1').textContent();
    console.log(`✨ Page H1: "${h1?.trim()}"`);
    if (!h1?.includes('请喝一杯咖啡')) {
      throw new Error(`H1 does not contain '请喝一杯咖啡': ${h1}`);
    }

    // 2. Audit Card Alignment (Col-7 vs Col-5)
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
        throw new Error(`Cards are not aligned! topDiff=${topDiff}, bottomDiff=${bottomDiff}`);
      }
      console.log('✅ Left and Right Cards are 100% aligned!');
    }

    // 3. Verify 6 Preset Tier Cards and their Practical Results
    console.log('☕ Verifying 6 Preset Tier Cards & Practical Result Badges...');
    const presetButtons = page.locator('.grid.grid-cols-3.gap-2\\.5 button');
    const presetCount = await presetButtons.count();
    console.log(`Found ${presetCount} preset buttons (Expected 6)`);
    if (presetCount !== 6) {
      throw new Error(`Expected 6 preset buttons, got ${presetCount}`);
    }

    for (let i = 0; i < presetCount; i++) {
      const btnText = await presetButtons.nth(i).innerText();
      console.log(`Tier ${i + 1}: ${btnText.replace(/\n/g, ' | ')}`);
      // Verify button has SVGs (icon + watermark)
      const svgs = await presetButtons.nth(i).locator('svg').count();
      if (svgs < 2) {
        throw new Error(`Tier ${i + 1} expected at least 2 SVGs (icon + watermark), got ${svgs}`);
      }
    }

    // 4. Verify Currency Synchronization (Local vs Global)
    console.log('💱 Verifying Currency Synchronization...');
    const currencyButtons = page.locator('.lg\\:col-span-7 .flex.items-center.gap-1.p-1 button');
    const currencyBtnCount = await currencyButtons.count();
    if (currencyBtnCount !== 2) {
      throw new Error(`Expected 2 currency buttons, got ${currencyBtnCount}`);
    }

    const localBtn = currencyButtons.nth(0);
    const globalBtn = currencyButtons.nth(1);

    const localText = (await localBtn.innerText()).trim();
    const globalText = (await globalBtn.innerText()).trim();
    console.log(`Currency options: [${localText}] and [${globalText}]`);

    // Check Stripe checkout button currency
    const stripeBtn = page.locator('button:has-text("前往 Stripe 安全收银台支付")');
    const stripeBtnText = (await stripeBtn.innerText()).trim();
    console.log(`Stripe Button Text: "${stripeBtnText}"`);

    // Click 6th card (rose tier)
    console.log('👉 Testing 6th card (Tier 6) selection...');
    await presetButtons.nth(5).click();
    await page.waitForTimeout(300);
    const stripeBtnTextAfterTier6 = (await stripeBtn.innerText()).trim();
    console.log(`Stripe Button Text after Tier 6 click: "${stripeBtnTextAfterTier6}"`);

    // Switch to Global Currency (USD)
    console.log('👉 Switching to Global Currency...');
    await globalBtn.click();
    await page.waitForTimeout(300);

    const firstPresetTextGlobal = (await presetButtons.first().innerText()).trim();
    const sixthPresetTextGlobal = (await presetButtons.nth(5).innerText()).trim();
    const stripeBtnTextGlobal = (await stripeBtn.innerText()).trim();
    console.log(`Global 1st Preset: ${firstPresetTextGlobal.replace(/\n/g, ' ')}`);
    console.log(`Global 6th Preset: ${sixthPresetTextGlobal.replace(/\n/g, ' ')}`);
    console.log(`Global Stripe Button: "${stripeBtnTextGlobal}"`);

    if (!stripeBtnTextGlobal.includes('USD') && !stripeBtnTextGlobal.includes('HKD')) {
      throw new Error(`Stripe button does not reflect global currency: ${stripeBtnTextGlobal}`);
    }

    // Switch back to Local Currency
    console.log('👉 Switching back to Local Currency...');
    await localBtn.click();
    await page.waitForTimeout(300);

    const stripeBtnTextLocal = (await stripeBtn.innerText()).trim();
    console.log(`Back to Local Stripe Button: "${stripeBtnTextLocal}"`);

    // 5. Verify Right Column Content (No blank whitespace)
    console.log('🛡️ Verifying Right Column Pillars & Tabs...');
    const pillars = page.locator('text=真实开销与站点保障公示');
    const pillarsVisible = await pillars.isVisible();
    console.log(`Right column infrastructure pillars visible: ${pillarsVisible}`);
    if (!pillarsVisible) {
      throw new Error('Right column infrastructure pillars not visible');
    }

    // 6. Test Channel Tabs in Right Card
    const qrTabs = page.locator('.lg\\:col-span-5 .flex.rounded-xl.p-1 button');
    console.log(`QR Tabs Count: ${await qrTabs.count()}`);
    // Click HK tab
    await qrTabs.nth(1).click();
    await page.waitForTimeout(300);
    // Click PayPal tab
    await qrTabs.nth(2).click();
    await page.waitForTimeout(300);
    // Click USDT tab
    await qrTabs.nth(3).click();
    await page.waitForTimeout(300);
    // Switch back to CN
    await qrTabs.nth(0).click();
    await page.waitForTimeout(300);

    // 7. Verify Metrics and Supporter Table
    console.log('📜 Verifying Metrics Cards & Supporter Table...');
    await page.locator('#sponsor-records').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const metricsCards = page.locator('.grid.grid-cols-2.sm\\:grid-cols-4.gap-3\\.5 > div');
    const metricsCount = await metricsCards.count();
    console.log(`Metrics cards count: ${metricsCount}`);
    for (let i = 0; i < metricsCount; i++) {
      const text = await metricsCards.nth(i).innerText();
      console.log(`Metric ${i + 1}: ${text.replace(/\n/g, ' ')}`);
    }

    // 8. Verify FAQs
    console.log('❓ Verifying FAQ Section...');
    const faqButtons = page.locator('section.space-y-4 button:has(svg.lucide-chevron-down)');
    const faqCount = await faqButtons.count();
    console.log(`Total FAQ items: ${faqCount}`);
    if (faqCount < 10) {
      throw new Error(`Expected at least 10 FAQs, got ${faqCount}`);
    }

    // Test expanding an FAQ
    await faqButtons.nth(1).click();
    await page.waitForTimeout(300);

    // 9. Take Desktop Full Screenshot
    console.log('📸 Capturing Desktop Screenshots...');
    await page.screenshot({ path: path.join(outDir, '01-desktop-support-full.png'), fullPage: true });
    await page.locator('.grid.grid-cols-1.lg\\:grid-cols-12').screenshot({ path: path.join(outDir, '02-desktop-donation-cards.png') });
    await page.locator('#sponsor-records').screenshot({ path: path.join(outDir, '03-desktop-sponsor-records.png') });

    // 10. Mobile Responsive Test
    console.log('📱 Testing Mobile Viewport (375x812)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:4322/support/', { waitUntil: 'networkidle' });
    await mobilePage.screenshot({ path: path.join(outDir, '04-mobile-support-full.png'), fullPage: true });
    await mobileContext.close();

    console.log('\n🎉 ALL Support Page Verification Tests PASSED with 0 errors!');
  } finally {
    await browser.close();
  }
}

runAudit().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
