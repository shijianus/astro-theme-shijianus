import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/live_mcp_playwright';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targets = [
  { name: 'Target 1: blog.epocanvas.com (Production Main Domain)', url: 'https://blog.epocanvas.com/support/' },
  { name: 'Target 2: shijianus-github-io.pages.dev (Cloudflare Pages Preview)', url: 'https://64aca32b.shijianus-github-io.pages.dev/support/' }
];

async function runMcpPlaywrightAudit() {
  console.log('================================================================');
  console.log('🎭 Launching MCP Playwright Visual Inspection Suite on Live CF Pages');
  console.log('================================================================');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const inspectionReport = [];

  try {
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      console.log(`\n----------------------------------------------------------------`);
      console.log(`🚀 [${i + 1}/${targets.length}] Auditing: ${target.name}`);
      console.log(`🔗 URL: ${target.url}`);
      console.log(`----------------------------------------------------------------`);

      const context = await browser.newContext({
        viewport: { width: 1440, height: 960 },
        deviceScaleFactor: 2
      });
      const page = await context.newPage();

      const itemReport = {
        target: target.name,
        url: target.url,
        assertions: []
      };

      // 1. Navigation & HTTP Status
      console.log('📡 Navigating to target URL...');
      const response = await page.goto(target.url, { waitUntil: 'networkidle', timeout: 35000 });
      const status = response.status();
      console.log(`HTTP Response Status: ${status}`);
      if (status !== 200) {
        throw new Error(`Target returned non-200 status: ${status}`);
      }
      await page.waitForTimeout(1500);

      // 2. Page H1 Title
      const h1Text = (await page.locator('h1').textContent() || '').trim();
      console.log(`✨ Page H1: "${h1Text}"`);
      const h1Pass = h1Text.includes('请喝一杯咖啡');
      itemReport.assertions.push({ check: 'Page H1 contains "请喝一杯咖啡"', result: h1Pass, value: h1Text });
      if (!h1Pass) throw new Error(`H1 check failed: ${h1Text}`);

      // 3. Currency Selector & Preset Tier Synchronization
      console.log('💱 Checking Currency Selector & Preset Buttons Synchronization...');
      const currencyButtons = page.locator('.lg\\:col-span-7 .flex.items-center.gap-1.p-1 button');
      const btnCount = await currencyButtons.count();
      console.log(`Currency Switcher Buttons Found: ${btnCount}`);
      
      const activeBtn = page.locator('.lg\\:col-span-7 .flex.items-center.gap-1.p-1 button.bg-white, .lg\\:col-span-7 .flex.items-center.gap-1.p-1 button.dark\\:bg-\\[\\#1e2233\\]').first();
      const activeText = (await activeBtn.innerText()).replace(/\n+/g, ' ').trim();
      console.log(`Active Currency Selector: "${activeText}"`);

      const presetButtons = page.locator('.grid.grid-cols-3.gap-2\\.5 button');
      const presetCount = await presetButtons.count();
      console.log(`Coffee Preset Buttons Count: ${presetCount}`);
      if (presetCount !== 6) throw new Error(`Expected 6 coffee presets, found ${presetCount}`);

      const firstPreset = presetButtons.first();
      const firstPresetText = (await firstPreset.innerText()).replace(/\n+/g, ' ').trim();
      console.log(`First Coffee Tier Text: "${firstPresetText}"`);

      // Determine expected currency match
      let currencyMatch = false;
      if (activeText.includes('MYR') && (firstPresetText.includes('RM') || firstPresetText.includes('MYR'))) {
        currencyMatch = true;
      } else if (activeText.includes('CNY') && (firstPresetText.includes('¥') || firstPresetText.includes('CNY'))) {
        currencyMatch = true;
      } else if (activeText.includes('HKD') && (firstPresetText.includes('HK$') || firstPresetText.includes('HKD'))) {
        currencyMatch = true;
      } else if (activeText.includes('USD') && (firstPresetText.includes('$') || firstPresetText.includes('USD'))) {
        currencyMatch = true;
      }
      console.log(`Currency Synchronized: ${currencyMatch}`);
      itemReport.assertions.push({ check: 'Currency selector and coffee presets synchronized', result: currencyMatch, activeText, firstPresetText });
      if (!currencyMatch) throw new Error(`Currency mismatch: active "${activeText}" vs tier "${firstPresetText}"`);

      // 4. Coffee Tier Artwork & Gradient Banner
      console.log('🎨 Auditing Coffee Tier Artwork, Custom SVGs and Gradient Banner...');
      const banner = page.locator('text=特调咖啡支持档位');
      const bannerVisible = await banner.isVisible();
      console.log(`"特调咖啡支持档位" Banner Visible: ${bannerVisible}`);

      const presetSvgs = page.locator('.grid.grid-cols-3.gap-2\\.5 button svg');
      const svgCount = await presetSvgs.count();
      console.log(`SVGs found inside coffee preset buttons: ${svgCount} (Icons + Background Watermarks)`);
      const artworkPass = bannerVisible && svgCount >= 6;
      itemReport.assertions.push({ check: 'Coffee tier custom SVG artwork and gradient banner', result: artworkPass, svgCount });
      if (!artworkPass) throw new Error(`Artwork check failed: banner=${bannerVisible}, svgs=${svgCount}`);

      // Capture Coffee Tiers Screenshot
      const coffeeCard = page.locator('.lg\\:col-span-7');
      const coffeeCardImgPath = path.join(outDir, `target-${i + 1}-coffee-tiers.png`);
      await coffeeCard.screenshot({ path: coffeeCardImgPath });
      console.log(`📸 Saved coffee tier screenshot: ${coffeeCardImgPath}`);

      // 5. Supporter Table: ZERO Fake Data & Display Real D1 Records
      console.log('📜 Auditing Supporter Table (#sponsor-records) on Live Page...');
      const tableSection = page.locator('#sponsor-records');
      await tableSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);

      const tableText = await tableSection.innerText();
      const hasFakeCyberNomad = tableText.includes('CyberNomad');
      const hasFakeTimeFriend = tableText.includes('时间的朋友');
      const hasRealStripeRecord = tableText.includes('Stripe 链路自动化验收官') || tableText.includes('Cloudflare Pages 最终验收');

      console.log(`Fake sponsor 'CyberNomad' present: ${hasFakeCyberNomad} (Expected: false)`);
      console.log(`Fake sponsor '时间的朋友' present: ${hasFakeTimeFriend} (Expected: false)`);
      console.log(`Real D1 Stripe records present: ${hasRealStripeRecord} (Expected: true)`);

      const tablePass = !hasFakeCyberNomad && !hasFakeTimeFriend && hasRealStripeRecord;
      itemReport.assertions.push({ check: 'Supporter table: zero mock data and real D1 records displayed', result: tablePass });
      if (!tablePass) throw new Error('Supporter table validation failed');

      const tableImgPath = path.join(outDir, `target-${i + 1}-sponsor-table.png`);
      await tableSection.screenshot({ path: tableImgPath });
      console.log(`📸 Saved supporter table screenshot: ${tableImgPath}`);

      // 6. FAQ Phrasing & Absence of False Claims
      console.log('🛡️ Auditing FAQ Content Phrasing & Grounded Truth...');
      const paypalBtn = page.locator('button:has-text("PayPal 与 Web3 (USDT) 赞赏的手续费与网络成本如何理解？")');
      await paypalBtn.click();
      await page.waitForTimeout(300);

      const pageFullText = await page.locator('body').innerText();
      const hasSameCurrencyRec = pageFullText.includes('推荐使用同货币的 PayPal 转账来打赏以减少货币转换手续费');
      const hasFriendsFamily = pageFullText.includes('亲友（Friends & Family）');

      console.log(`PayPal FAQ has same-currency transfer recommendation: ${hasSameCurrencyRec} (Expected: true)`);
      console.log(`PayPal FAQ mentions '亲友（Friends & Family）': ${hasFriendsFamily} (Expected: false)`);

      const refundBtn = page.locator('button:has-text("如果赞赏出现误操作或需要退款，该如何申请？")');
      await refundBtn.click();
      await page.waitForTimeout(300);

      const pageFullTextAfterRefund = await page.locator('body').innerText();
      const hasRefundPublication = pageFullTextAfterRefund.includes('所有因误操作退款或原路退回导致的资金变动，均会在下方支援名册中以公示标识如实注明撤销与结案情况');
      console.log(`Refund FAQ has public reversal disclosure commitment: ${hasRefundPublication} (Expected: true)`);

      const faqPass = hasSameCurrencyRec && !hasFriendsFamily && hasRefundPublication;
      itemReport.assertions.push({ check: 'FAQ phrasing (PayPal same-currency & Refund transparency)', result: faqPass });
      if (!faqPass) throw new Error('FAQ validation failed');

      // 7. Stripe Checkout Modal Trigger & No '约等值 1 HKD'
      console.log('💳 Auditing Stripe Checkout Modal Trigger & Amount Guidance...');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);

      const stripeTrigger = page.locator('button:has-text("前往 Stripe 安全收银台支付")');
      await stripeTrigger.click();
      await page.waitForTimeout(1500);

      const modal = page.locator('.fixed.inset-0:has(button:has(svg.lucide-x))').first();
      const modalVisible = await modal.isVisible();
      console.log(`Stripe Checkout Modal Visible: ${modalVisible}`);

      const modalText = await modal.innerText();
      const hasOldHkdNotice = modalText.includes('约等值 1 HKD');
      console.log(`Modal contains '约等值 1 HKD': ${hasOldHkdNotice} (Expected: false)`);

      const modalPass = modalVisible && !hasOldHkdNotice;
      itemReport.assertions.push({ check: 'Stripe modal opens and contains no "约等值 1 HKD"', result: modalPass });
      if (!modalPass) throw new Error('Modal validation failed');

      const modalImgPath = path.join(outDir, `target-${i + 1}-stripe-modal.png`);
      await modal.screenshot({ path: modalImgPath });
      console.log(`📸 Saved Stripe modal screenshot: ${modalImgPath}`);

      // Close modal
      const closeBtn = modal.locator('button:has(svg.lucide-x)');
      await closeBtn.click();
      await page.waitForTimeout(400);

      // 8. Full Page Screenshot
      const fullPageImgPath = path.join(outDir, `target-${i + 1}-fullpage.png`);
      await page.screenshot({ path: fullPageImgPath, fullPage: true });
      console.log(`📸 Saved full page screenshot: ${fullPageImgPath}`);

      inspectionReport.push(itemReport);
      await context.close();
      console.log(`✅ [${i + 1}/${targets.length}] ALL checks PASSED for ${target.name}`);
    }

    console.log('\n================================================================');
    console.log('🎉 ALL Targets PASSED MCP Playwright Visual Inspection with 0 Errors!');
    console.log('================================================================');
    console.log(JSON.stringify(inspectionReport, null, 2));

  } finally {
    await browser.close();
  }
}

runMcpPlaywrightAudit().catch((err) => {
  console.error('❌ MCP Playwright Visual Audit Failed:', err);
  process.exit(1);
});
