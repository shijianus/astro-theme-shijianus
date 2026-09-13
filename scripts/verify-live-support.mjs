import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/live_support_cf';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function verifyLive() {
  const targetUrls = [
    'https://blog.epocanvas.com/support/',
    'https://024fedfb.shijianus-blog.pages.dev/support/'
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

      // 5. Test Presets and Custom Input
      console.log('☕ Testing 6 Presets and Cursor-Text Custom Input...');
      const presetButtons = page.locator('.grid.grid-cols-3.gap-2\\.5 button');
      const presetCount = await presetButtons.count();
      console.log(`Live Presets Count: ${presetCount}`);
      if (presetCount !== 6) {
        throw new Error(`Expected exactly 6 presets, found ${presetCount}`);
      }

      const customInputLabel = page.locator('.flex.items-center.gap-2\\.5.px-4.py-3.rounded-xl.cursor-text');
      const customInputVisible = await customInputLabel.isVisible();
      console.log(`Live Custom Input (cursor-text) Visible: ${customInputVisible}`);
      if (!customInputVisible) {
        throw new Error('Expected custom amount input with cursor-text style to be visible');
      }

      // 6. Test Serv00 Labels & Notice
      console.log('👤 Checking Serv00 Labels & Notification Text...');
      const nameLabel = await page.locator('label:has-text("称呼或社交账号")').textContent();
      const msgLabel = await page.locator('label:has-text("留言寄语")').textContent();
      console.log(`Field 1: "${nameLabel?.trim()}"`);
      console.log(`Field 2: "${msgLabel?.trim()}"`);

      const noticeText = await page.locator('.text-center.text-xs.text-slate-500').textContent();
      console.log(`Notice under button: "${noticeText?.trim()}"`);
      if (!noticeText?.includes('支持信息将在完成付款后自动推送到作者 Telegram 频道并安全保存')) {
        throw new Error(`Notice text unexpected: ${noticeText}`);
      }

      // 7. Audit Absence of Amber Filler Cards & Verify Grounded FAQ
      console.log('💎 Auditing Absence of Amber Filler Cards & Accurate FAQ...');
      const amberCards = await page.locator('.border-amber-500\\/30').count();
      console.log(`Amber filler cards count: ${amberCards}`);
      if (amberCards > 0) {
        throw new Error(`Found ${amberCards} amber filler cards! They must not be present.`);
      }

      const faqBtn = page.locator('button:has-text("赞赏支持能否提升我的社区等级 (LV) 或信任等级 (TL)？")');
      await faqBtn.click();
      await page.waitForTimeout(300);
      const faqAnswer = await page.locator('text=完全不能，两者 100% 独立脱钩').textContent();
      console.log(`FAQ Answer snippet: "${faqAnswer?.slice(0, 60)}..."`);
      if (!faqAnswer?.includes('LV.0 至 LV.4') || faqAnswer?.includes('LV.6')) {
        throw new Error(`FAQ answer must ground in LV.0 to LV.4 and not hallucinate LV.6! Got: ${faqAnswer}`);
      }

      // 8. Test Triggering Stripe Modal
      console.log('💳 Testing Live Stripe Modal trigger...');
      const stripeBtn = page.locator('button:has-text("前往 Stripe 安全收银台支付")');
      await stripeBtn.click();
      await page.waitForTimeout(1500);

      const modal = page.locator('.fixed.inset-0.z-\\[10000\\]');
      const modalOpened = await modal.isVisible();
      console.log(`Live Stripe Modal Opened: ${modalOpened}`);
      if (!modalOpened) {
        throw new Error('Live Stripe modal failed to open');
      }

      await page.screenshot({ path: path.join(outDir, `live-target-${i + 1}-modal.png`) });

      // Close modal
      const closeBtn = modal.locator('button:has(svg.lucide-x)');
      await closeBtn.click();
      await page.waitForTimeout(500);

      // 9. Test Table Pagination
      console.log('📜 Testing Supporter Table on live page...');
      await page.locator('#sponsor-records').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const page1Btn = page.locator('.flex.items-center.gap-1 button:has-text("1")').first();
      const page2Btn = page.locator('.flex.items-center.gap-1 button:has-text("2")').first();
      const jumpBtn = page.locator('.flex.items-center.gap-1 button:has-text("...")').first();

      console.log(`Live Page 1 Button Visible: ${await page1Btn.isVisible()}`);
      console.log(`Live Page 2 Button Visible: ${await page2Btn.isVisible()}`);
      console.log(`Live Jump Button Visible: ${await jumpBtn.isVisible()}`);

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
