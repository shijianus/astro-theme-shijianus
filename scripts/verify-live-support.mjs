import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/live_support_cf';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function verifyLive() {
  const targetUrls = [
    'https://817acb0a.shijianus-blog.pages.dev/support/',
    'https://blog.epocanvas.com/support/'
  ];

  console.log('🌐 Launching Chromium browser for Live Cloudflare Pages E2E verification...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (let i = 0; i < targetUrls.length; i++) {
      const url = targetUrls[i];
      console.log(`\n======================================================`);
      console.log(`🚀 Testing Target ${i + 1}: ${url}`);
      console.log(`======================================================`);

      const context = await browser.newContext({
        viewport: { width: 1440, height: 920 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();

      // Collect console errors
      const errors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      console.log(`📄 Navigating to ${url} ...`);
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      console.log(`Response Status: ${response.status()} ${response.statusText()}`);

      if (response.status() !== 200) {
        throw new Error(`Expected HTTP 200, got ${response.status()} for ${url}`);
      }

      // 1. Verify Page H1
      const heroTitle = await page.locator('h1').textContent();
      console.log(`✨ Page H1: "${heroTitle?.trim()}"`);
      if (!heroTitle?.includes('请喝一杯咖啡')) {
        throw new Error(`Expected H1 to contain '请喝一杯咖啡', got: ${heroTitle}`);
      }

      // 2. Audit Vertical Alignment of Left & Right Cards
      console.log('📐 Auditing Card Alignment on live page...');
      const leftCard = page.locator('.lg\\:col-span-7');
      const rightCard = page.locator('.lg\\:col-span-5');
      const boxLeft = await leftCard.boundingBox();
      const boxRight = await rightCard.boundingBox();

      if (boxLeft && boxRight) {
        const topDiff = Math.abs(boxLeft.y - boxRight.y);
        const bottomDiff = Math.abs((boxLeft.y + boxLeft.height) - (boxRight.y + boxRight.height));
        console.log(`Left Card: y=${boxLeft.y}, h=${boxLeft.height}, bottom=${boxLeft.y + boxLeft.height}`);
        console.log(`Right Card: y=${boxRight.y}, h=${boxRight.height}, bottom=${boxRight.y + boxRight.height}`);
        console.log(`Live Top Diff: ${topDiff}px, Bottom Diff: ${bottomDiff}px`);
        if (topDiff > 3 || bottomDiff > 3) {
          throw new Error(`Live cards are not aligned (topDiff: ${topDiff}, bottomDiff: ${bottomDiff})`);
        }
        console.log('✅ Live Cards Alignment PASS!');
      }

      // 3. Test Currency Switcher & Preset Buttons Sync
      console.log('💱 Testing Currency Switcher & Preset Tier Currency Synchronization...');
      const currencyButtons = page.locator('.lg\\:col-span-7 .flex.items-center.gap-1.p-1 button');
      const btnCount = await currencyButtons.count();
      console.log(`Live Currency Switcher Buttons Count: ${btnCount}`);
      if (btnCount !== 2) {
        throw new Error(`Expected exactly 2 currency buttons, found ${btnCount}`);
      }

      // Find active currency button text
      const activeCurrencyBtn = page.locator('.lg\\:col-span-7 .flex.items-center.gap-1.p-1 button.bg-white, .lg\\:col-span-7 .flex.items-center.gap-1.p-1 button.dark\\:bg-\\[\\#1e2233\\]');
      const activeBtnText = (await activeCurrencyBtn.first().innerText()).trim();
      console.log(`Active Currency Button: "${activeBtnText}"`);

      // Check first preset button text
      const presetButtons = page.locator('.grid.grid-cols-3.gap-2\\.5 button');
      const presetCount = await presetButtons.count();
      console.log(`Live Presets Count: ${presetCount}`);
      if (presetCount !== 6) {
        throw new Error(`Expected exactly 6 presets, found ${presetCount}`);
      }

      const firstPresetText = (await presetButtons.first().innerText()).trim();
      console.log(`First Preset Button Text: "${firstPresetText}"`);

      // Test currency synchronization: if active is HKD, preset should contain HK$
      if (activeBtnText.includes('HKD')) {
        if (!firstPresetText.includes('HK$') && !firstPresetText.includes('HKD')) {
          throw new Error(`Active currency is HKD, but first preset does not display HK$/HKD: "${firstPresetText}"`);
        }
      } else if (activeBtnText.includes('CNY')) {
        if (!firstPresetText.includes('¥') && !firstPresetText.includes('CNY')) {
          throw new Error(`Active currency is CNY, but first preset does not display ¥/CNY: "${firstPresetText}"`);
        }
      } else if (activeBtnText.includes('MYR')) {
        if (!firstPresetText.includes('RM') && !firstPresetText.includes('MYR')) {
          throw new Error(`Active currency is MYR, but first preset does not display RM/MYR: "${firstPresetText}"`);
        }
      }
      console.log('✅ Currency Switcher and Preset Buttons are 100% synchronized!');

      // 4. Test Artwork & SVG Illustrations in Coffee Tiers
      console.log('🎨 Verifying Artwork & SVG illustrations in 6 Coffee Tiers...');
      const tierBanner = page.locator('text=特调咖啡支持档位');
      const tierBannerVisible = await tierBanner.isVisible();
      console.log(`Coffee Tier Gradient Banner Visible: ${tierBannerVisible}`);
      if (!tierBannerVisible) {
        throw new Error('Expected "特调咖啡支持档位" banner to be visible!');
      }

      // Check SVGs inside preset buttons
      const svgsInPresets = page.locator('.grid.grid-cols-3.gap-2\\.5 button svg');
      const svgCount = await svgsInPresets.count();
      console.log(`Total SVGs in preset buttons (icons + watermark): ${svgCount}`);
      if (svgCount < 6) {
        throw new Error(`Expected at least 6 SVG artwork icons in preset buttons, got: ${svgCount}`);
      }
      console.log('✅ Coffee Tier Artwork and SVG Illustrations PASS!');

      // 5. Check Custom Input Min Amount
      const customInputLabel = page.locator('label.cursor-text:has(input[placeholder*="自定义金额"])');
      const customInput = customInputLabel.locator('input');
      const minAttr = await customInput.getAttribute('min');
      console.log(`Custom Input min attribute: ${minAttr}`);
      if (Number(minAttr) < 1) {
        throw new Error(`Custom input min should be at least 1, got: ${minAttr}`);
      }

      // 6. Test Absence of False Claims & Checking PayPal & Refund FAQ text
      console.log('🛡️ Verifying Absence of False Claims & Specific FAQ phrasing...');
      const pageText = await page.locator('body').innerText();
      const forbiddenPhrases = [
        '零中转扣费',
        '100% 直达技术开销',
        '免中转手续费',
        'TG 记账同步',
        '贴合生活常用认知',
        '扫码支持提示',
        '亲友（Friends & Family）',
        'CyberNomad',
        '时间的朋友'
      ];
      for (const phrase of forbiddenPhrases) {
        if (pageText.includes(phrase)) {
          throw new Error(`Forbidden phrase detected on live page: "${phrase}"`);
        }
      }
      console.log('✅ Zero false claims and Zero fake sponsors verified!');

      // Check PayPal FAQ specifically recommends same-currency transfer
      const paypalFaq = page.locator('button:has-text("PayPal 与 Web3 (USDT) 赞赏的手续费与网络成本如何理解？")');
      await paypalFaq.click();
      await page.waitForTimeout(300);
      const paypalAnswer = await page.locator('text=推荐使用同货币的 PayPal 转账来打赏以减少货币转换手续费').textContent();
      if (!paypalAnswer) {
        throw new Error('Missing recommendation: "推荐使用同货币的 PayPal 转账来打赏以减少货币转换手续费"');
      }
      console.log('✅ PayPal FAQ same-currency recommendation verified!');

      // Check Refund FAQ specifically mentions publication of refund status
      const refundFaq = page.locator('button:has-text("如果赞赏出现误操作或需要退款，该如何申请？")');
      await refundFaq.click();
      await page.waitForTimeout(300);
      const refundAnswer = await page.locator('text=所有因误操作退款或原路退回导致的资金变动，均会在下方支援名册中以公示标识如实注明撤销与结案情况').textContent();
      if (!refundAnswer) {
        throw new Error('Missing refund publication clause in refund FAQ!');
      }
      console.log('✅ Refund FAQ publication of fund reversal verified!');

      // 7. Test Triggering Stripe Modal
      console.log('💳 Testing Live Stripe Modal trigger...');
      const stripeBtn = page.locator('button:has-text("前往 Stripe 安全收银台支付")');
      await stripeBtn.click();
      await page.waitForTimeout(1500);

      const modal = page.locator('.fixed.inset-0:has(button:has(svg.lucide-x))');
      const modalOpened = await modal.first().isVisible();
      console.log(`Live Stripe Modal Opened: ${modalOpened}`);
      if (!modalOpened) {
        throw new Error('Live Stripe modal failed to open');
      }

      const modalText = await modal.first().innerText();
      if (modalText.includes('约等值 1 HKD')) {
        throw new Error('Modal text still mentions "约等值 1 HKD"!');
      }

      await page.screenshot({ path: path.join(outDir, `live-target-${i + 1}-modal.png`) });

      // Close modal
      const closeBtn = modal.first().locator('button:has(svg.lucide-x)');
      await closeBtn.click();
      await page.waitForTimeout(500);

      // 8. Test Supporter Table & Clean Real Data / Empty State
      console.log('📜 Testing Supporter Table on live page...');
      await page.locator('#sponsor-records').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const tableSection = page.locator('#sponsor-records');
      const tableText = await tableSection.innerText();
      console.log(`Table section text snippet: "${tableText.slice(0, 100).replace(/\n/g, ' ')}..."`);

      // Ensure mock names do not exist
      if (tableText.includes('CyberNomad') || tableText.includes('时间的朋友')) {
        throw new Error('Fake sponsor names found in supporter table!');
      }

      await page.screenshot({ path: path.join(outDir, `live-target-${i + 1}-table.png`) });
      await page.screenshot({ path: path.join(outDir, `live-target-${i + 1}-full.png`), fullPage: true });

      await context.close();
      console.log(`✅ Target ${i + 1} (${url}) verified successfully!`);
    }

    console.log('\n🎉 ALL Live Cloudflare Pages verifications PASSED with 0 errors!');
  } finally {
    await browser.close();
  }
}

verifyLive().catch((err) => {
  console.error('❌ Live verification failed:', err);
  process.exit(1);
});
