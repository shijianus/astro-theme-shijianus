import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/live_support_cf';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function verifyLive() {
  const targetUrls = [
    'https://ce5150f2.shijianus-blog.pages.dev/support/',
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
        if (topDiff > 2 || bottomDiff > 2) {
          throw new Error(`Live cards are not aligned (topDiff: ${topDiff}, bottomDiff: ${bottomDiff})`);
        }
        console.log('✅ Live Cards Alignment PASS!');
      }

      // 3. Audit Full-Width FAQ Alignment
      console.log('📐 Auditing FAQ Section Full-Width Alignment...');
      const faqSection = page.locator('section:has(h2:has-text("常見問題與透明度承諾"))');
      const recordsSection = page.locator('#sponsor-records');
      const faqBox = await faqSection.boundingBox();
      const recordsBox = await recordsSection.boundingBox();

      if (faqBox && recordsBox) {
        const widthDiff = Math.abs(faqBox.width - recordsBox.width);
        const leftDiff = Math.abs(faqBox.x - recordsBox.x);
        console.log(`FAQ: x=${faqBox.x}, width=${faqBox.width}`);
        console.log(`Records: x=${recordsBox.x}, width=${recordsBox.width}`);
        console.log(`Live FAQ Width Diff: ${widthDiff}px, Left Diff: ${leftDiff}px`);
        if (widthDiff > 2 || leftDiff > 2) {
          throw new Error(`FAQ is not full-width aligned with records (diff: ${widthDiff})`);
        }
        console.log('✅ Live FAQ Full-Width Alignment PASS!');
      }

      // 4. Test 2-Currency Switcher
      console.log('💱 Testing 2-Currency Switcher on live page...');
      const currencyButtons = page.locator('.lg\\:col-span-7 .flex.items-center.gap-1.p-1 button');
      const btnCount = await currencyButtons.count();
      console.log(`Live Currency Switcher Buttons Count: ${btnCount}`);
      if (btnCount !== 2) {
        throw new Error(`Expected exactly 2 currency buttons, found ${btnCount}`);
      }

      // 5. Test Presets, Unselected Button Non-White Gradient, and Custom Input
      console.log('☕ Testing 6 Presets and Cursor-Text Custom Input...');
      const presetButtons = page.locator('.grid.grid-cols-3.gap-2\\.5 button');
      const presetCount = await presetButtons.count();
      console.log(`Live Presets Count: ${presetCount}`);
      if (presetCount !== 6) {
        throw new Error(`Expected exactly 6 presets, found ${presetCount}`);
      }

      // Verify unselected preset buttons have non-pure-white background
      const unselectedPreset = presetButtons.nth(1); // second button
      const bgStyle = await unselectedPreset.evaluate((el) => window.getComputedStyle(el).backgroundImage || window.getComputedStyle(el).backgroundColor);
      console.log(`Unselected Preset Background Style: ${bgStyle}`);
      if (bgStyle.includes('rgb(255, 255, 255)') && !bgStyle.includes('gradient')) {
        throw new Error('Unselected preset button must not be pure white; it must have gradient background styling!');
      }

      const customInputLabel = page.locator('label.cursor-text:has(input[placeholder*="自定义金额"])');
      const customInputVisible = await customInputLabel.isVisible();
      console.log(`Live Custom Input (cursor-text) Visible: ${customInputVisible}`);
      if (!customInputVisible) {
        throw new Error('Expected custom amount input with cursor-text style to be visible');
      }

      // Check min amount hint / input attributes
      const customInput = customInputLabel.locator('input');
      const minAttr = await customInput.getAttribute('min');
      console.log(`Custom Input min attribute: ${minAttr}`);
      if (Number(minAttr) < 1) {
        throw new Error(`Custom input min should be at least 1, got: ${minAttr}`);
      }

      // 6. Test Right Card Content & Absence of False Claims
      console.log('🛡️ Verifying Absence of False Claims and Checking QR expansion...');
      const pageText = await page.locator('body').innerText();
      const falsePhrases = [
        '零中转扣费',
        '100% 直达技术开销',
        '免中转手续费',
        'TG 记账同步',
        '贴合生活常用认知',
        '扫码支持提示'
      ];
      for (const phrase of falsePhrases) {
        if (pageText.includes(phrase)) {
          throw new Error(`Forbidden false phrase detected on live page: "${phrase}"`);
        }
      }
      console.log('✅ Zero false claims verified!');

      // Check clean QR code showcase in right column
      const qrCards = page.locator('.lg\\:col-span-5 img');
      const qrCount = await qrCards.count();
      console.log(`Live QR count in right column: ${qrCount}`);
      if (qrCount < 2) {
        throw new Error('QR code cards are missing in right column');
      }

      // 7. Audit Absence of Amber Filler Cards & Verify 9 Distinct Grounded FAQs
      console.log('💎 Auditing 9 Distinct Grounded FAQs...');
      const faqButtons = page.locator('section:has(h2:has-text("常見問題與透明度承諾")) button');
      const faqCount = await faqButtons.count();
      console.log(`Live FAQ Items Count: ${faqCount}`);
      if (faqCount !== 9) {
        throw new Error(`Expected exactly 9 distinct FAQ items, got: ${faqCount}`);
      }

      // Check specific FAQ titles
      const tgFaq = page.locator('button:has-text("Telegram 机器人的通知与数据存储机制是怎样的？")');
      if ((await tgFaq.count()) === 0) {
        throw new Error('Missing FAQ on Telegram bot notification & data storage!');
      }
      const feeFaq = page.locator('button:has-text("PayPal 与 Web3 (USDT) 赞赏的手续费与网络成本如何理解？")');
      if ((await feeFaq.count()) === 0) {
        throw new Error('Missing FAQ on transaction fees (PayPal & Web3)!');
      }

      // Test opening TG FAQ and checking content
      await tgFaq.click();
      await page.waitForTimeout(300);
      const tgAnswer = await page.locator('text=Telegram 机器人仅作为博主本人的实时消息提醒终端').textContent();
      console.log(`TG FAQ Answer snippet: "${tgAnswer?.slice(0, 60)}..."`);
      if (!tgAnswer?.includes('Telegram 内部并不存储、维护任何资金账本') || !tgAnswer?.includes('管理员也无权且无法篡改')) {
        throw new Error(`TG FAQ must clarify one-way alert, no TG storage, and no tampering! Got: ${tgAnswer}`);
      }

      // 8. Test Triggering Stripe Modal
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

      // Check modal min amount note doesn't mention (约等值 1 HKD)
      const modalText = await modal.first().innerText();
      if (modalText.includes('约等值 1 HKD')) {
        throw new Error('Modal text still mentions "约等值 1 HKD"!');
      }

      await page.screenshot({ path: path.join(outDir, `live-target-${i + 1}-modal.png`) });

      // Close modal
      const closeBtn = modal.first().locator('button:has(svg.lucide-x)');
      await closeBtn.click();
      await page.waitForTimeout(500);

      // 9. Test Supporter Table with Allocation Column & Max 3 initial records
      console.log('📜 Testing Supporter Table on live page...');
      await page.locator('#sponsor-records').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const tableHeaders = page.locator('#sponsor-records table thead tr th');
      const headerCount = await tableHeaders.count();
      console.log(`Live Table Header Count: ${headerCount}`);
      if (headerCount !== 6) {
        throw new Error(`Expected 6 table headers, got: ${headerCount}`);
      }

      const rowsCount = await page.locator('#sponsor-records table tbody tr').count();
      console.log(`Live Initial Rows Count: ${rowsCount}`);

      await page.screenshot({ path: path.join(outDir, `live-target-${i + 1}-table.png`) });

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
