import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/support_page';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runVerification() {
  console.log('🚀 Starting local Astro preview server...');
  const server = spawn('npx', ['astro', 'preview', '--port', '4399', '--host', '127.0.0.1'], {
    cwd: '/home/shijian/projects/shijianus-blog',
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => {
    // console.log(`[server] ${d}`);
  });
  server.stderr.on('data', (d) => {
    // console.error(`[server err] ${d}`);
  });

  // Wait for preview server to be responsive
  let started = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:4399/support/');
      if (res.ok) {
        started = true;
        console.log('✅ Astro preview server ready at http://127.0.0.1:4399');
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!started) {
    server.kill();
    throw new Error('Failed to start Astro preview server on port 4399');
  }

  console.log('🌐 Launching Chromium browser for E2E audit...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // -------------------------------------------------------------
    // 1. Desktop Audit (1440 x 920)
    // -------------------------------------------------------------
    const context = await browser.newContext({
      viewport: { width: 1440, height: 920 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    console.log('📄 1. Navigating to /support/ ...');
    await page.goto('http://127.0.0.1:4399/support/', { waitUntil: 'networkidle' });

    // Assert Title and Hero
    const heroTitle = await page.locator('h1').textContent();
    console.log(`✨ Page H1: "${heroTitle}"`);
    if (!heroTitle?.includes('请喝一杯咖啡')) {
      throw new Error(`Expected H1 to contain '请喝一杯咖啡', got: ${heroTitle}`);
    }

    await page.screenshot({ path: path.join(outDir, '01-desktop-support-hero.png') });

    // 2. Test Coffee Tier & Currency Selection
    console.log('☕ 2. Testing coffee tier selection...');
    const tierButtons = page.locator('.support-dashboard button:has-text("杯")');
    const tierCount = await tierButtons.count();
    console.log(`Found ${tierCount} coffee tier preset buttons.`);
    if (tierCount < 2) {
      throw new Error('Expected at least 2 preset coffee tier buttons');
    }

    // Click 1st tier (意式浓缩)
    await tierButtons.first().click();
    await page.waitForTimeout(300);

    // 3. Test Currency Switcher
    console.log('💱 3. Testing currency switcher to USD...');
    const currencySelect = page.locator('select[aria-label="选择结算币种"]');
    await currencySelect.selectOption('USD');
    await page.waitForTimeout(300);

    // 4. Test Supporter Info Inputs
    console.log('✍️ 4. Filling in Supporter Name and Message on page...');
    const nameInput = page.locator('input[placeholder*="称呼或社交账号"]');
    const msgInput = page.locator('textarea[placeholder*="写下想对作者说的话"]');
    await nameInput.fill('时间探索者');
    await msgInput.fill('非常喜爱博客的极客交互与深度长文，请博主喝咖啡！☕️🚀');
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(outDir, '02-desktop-form-filled.png') });

    // 5. Test Triggering Stripe Modal (Direct Checkout Mode)
    console.log('💳 5. Testing Stripe Checkout CTA Trigger button...');
    const stripeCta = page.locator('button:has-text("前往 Stripe 安全收银台支付")');
    await stripeCta.click();
    await page.waitForTimeout(1000);

    // Verify RewardModal opened
    const modal = page.locator('.fixed.inset-0.z-\\[10000\\]');
    const isModalVisible = await modal.isVisible();
    console.log(`Stripe Modal visible: ${isModalVisible}`);
    if (!isModalVisible) {
      throw new Error('RewardModal did not open when clicking Stripe CTA button');
    }

    // Verify modal header title is '安全结账' (indicating direct checkout step, NOT '赞赏支持' amount step!)
    const modalTitle = await modal.locator('.font-bold.text-slate-900').first().textContent();
    console.log(`Modal Title in direct checkout: "${modalTitle}"`);

    // Verify back button is hidden in direct checkout mode
    const backBtn = modal.locator('button:has(svg.lucide-chevron-left)');
    const hasBackBtn = await backBtn.isVisible();
    console.log(`Back button visible in direct checkout: ${hasBackBtn}`);
    if (hasBackBtn) {
      throw new Error('Back button should be hidden in direct checkout mode');
    }

    await page.screenshot({ path: path.join(outDir, '03-desktop-stripe-modal-opened.png') });

    // Close modal
    const closeBtn = modal.locator('button:has(svg.lucide-x)');
    await closeBtn.click();
    await page.waitForTimeout(500);

    // 6. Test QR Code Tabs
    console.log('📱 6. Testing QR Code Tabs...');
    // Tab HK
    const hkTab = page.locator('button:has-text("港澳渠道")');
    await hkTab.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, '04-desktop-qr-hk.png') });

    // Tab PayPal
    const ppTab = page.locator('button:has-text("PayPal")');
    await ppTab.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, '05-desktop-qr-paypal.png') });

    // Tab USDT
    const usdtTab = page.locator('button:has-text("USDT")');
    await usdtTab.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, '06-desktop-qr-usdt.png') });

    // 7. Test Supporter Roster (支援名录) Table
    console.log('📜 7. Auditing Supporter Roster Table (#sponsor-records)...');
    const tableSection = page.locator('#sponsor-records');
    await tableSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const tableRows = page.locator('#sponsor-records tbody tr');
    const rowCount = await tableRows.count();
    console.log(`Supporter table has ${rowCount} visible rows.`);
    if (rowCount < 1) {
      throw new Error('Supporter roster table is empty');
    }

    // Test Table Search
    console.log('🔍 Testing table search filter...');
    const searchInput = page.locator('input[placeholder*="搜索支持者"]');
    await searchInput.fill('CyberNomad');
    await page.waitForTimeout(300);

    const filteredRows = await page.locator('#sponsor-records tbody tr').count();
    console.log(`Rows after searching "CyberNomad": ${filteredRows}`);
    if (filteredRows < 1) {
      throw new Error('Search for "CyberNomad" should match at least 1 record');
    }

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(outDir, '07-desktop-roster-table.png') });

    // 8. Test FAQ Accordion
    console.log('❓ 8. Testing FAQ Accordion...');
    const firstFaq = page.locator('.support-dashboard button:has-text("赞赏的资金将如何使用？")');
    await firstFaq.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '08-desktop-faq-expanded.png') });

    // -------------------------------------------------------------
    // 9. Mobile Viewport Audit (375 x 812)
    // -------------------------------------------------------------
    console.log('📱 9. Testing Mobile Viewport (375x812)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://127.0.0.1:4399/support/', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);

    await mobilePage.screenshot({
      path: path.join(outDir, '09-mobile-hero.png'),
      fullPage: false,
    });

    // Scroll to table on mobile
    await mobilePage.locator('#sponsor-records').scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({
      path: path.join(outDir, '10-mobile-roster-table.png'),
      fullPage: false,
    });

    await mobileContext.close();
    await context.close();

    console.log('🎉 All Support Page audits PASSED successfully!');
  } finally {
    await browser.close();
    server.kill('SIGINT');
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
