import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/v2_reward';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runAudit() {
  console.log('🚀 Launching Chromium for Reward Modal V2 Audit...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 920 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log('📄 Navigating to blog post...');
  await page.goto('http://localhost:4321/posts/hello-world/', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Scroll to copyright section and find reward button
  console.log('🖱️ Clicking [赞赏支持] trigger...');
  const rewardBtn = await page.waitForSelector('[data-panel-trigger="reward"]', { timeout: 10000 });
  await rewardBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await rewardBtn.click();
  await page.waitForTimeout(1000);

  const modal = page.locator('[role="dialog"]');
  await modal.waitFor({ state: 'visible', timeout: 5000 });

  // 1. Default Tab: Card & Preset Amounts
  console.log('📸 01: Default Tab (Card & Preset Amounts)...');
  await page.waitForTimeout(3000); // Wait for Stripe Elements to initialize
  await page.screenshot({ path: path.join(outDir, '01-tab-card-default.png') });

  // 2. Click Custom Amount button & input $50
  console.log('📸 02: Custom Amount input ($50)...');
  const customAmtBtn = modal.locator('[data-amt="custom"]');
  if (await customAmtBtn.isVisible()) {
    await customAmtBtn.click();
    await page.waitForTimeout(300);
    const customInput = modal.locator('input[placeholder*="输入赞赏金额"]');
    if (await customInput.isVisible()) {
      await customInput.fill('50');
      await page.waitForTimeout(400);
    }
  }
  await page.screenshot({ path: path.join(outDir, '02-custom-amount-50.png') });

  // 3. Switch to Crypto Tab
  console.log('📸 03: Crypto Tab (USDT-TRC20)...');
  const cryptoTabBtn = modal.locator('[data-tab="crypto"]');
  await cryptoTabBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '03-tab-crypto-trc20.png') });

  // 4. Switch to ERC20 network & copy address
  console.log('📸 04: Switch to ERC20 & Click Copy (Toast)...');
  const erc20Btn = modal.locator('button:has-text("ERC20")');
  await erc20Btn.click();
  await page.waitForTimeout(600);
  const copyBtn = modal.locator('button[title="复制完整地址"]');
  if (await copyBtn.isVisible()) {
    await copyBtn.click();
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: path.join(outDir, '04-tab-crypto-erc20-toast.png') });

  // 5. Switch to PayPal Tab
  console.log('📸 05: PayPal Tab...');
  const paypalTabBtn = modal.locator('[data-tab="paypal"]');
  await paypalTabBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '05-tab-paypal.png') });

  // 6. Switch to WeChat / Alipay Tab
  console.log('📸 06: WeChat / Alipay Tab...');
  const cnTabBtn = modal.locator('[data-tab="cn"]');
  await cnTabBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '06-tab-cn-wechat-alipay.png') });

  // 7. Test Theme Toggle to Light Mode
  console.log('📸 07: Theme Toggle to Light Mode (Card Tab)...');
  const cardTabBtn = modal.locator('[data-tab="card"]');
  await cardTabBtn.click();
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
    window.dispatchEvent(new CustomEvent('shijianus:themechange', { detail: 'light' }));
  });
  await page.waitForTimeout(1500); // Allow Stripe appearance sync
  await page.screenshot({ path: path.join(outDir, '07-theme-light-card.png') });

  // 8. Test Theme Toggle back to Dark Mode
  console.log('📸 08: Theme Toggle to Dark Mode (Card Tab)...');
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    window.dispatchEvent(new CustomEvent('shijianus:themechange', { detail: 'dark' }));
  });
  await page.waitForTimeout(1500); // Allow Stripe appearance sync
  await page.screenshot({ path: path.join(outDir, '08-theme-dark-card.png') });

  // 9. Mobile Viewport Audit (375x812)
  console.log('📱 Auditing Mobile Viewport (375x812)...');
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 812 });
  await mobilePage.goto('http://localhost:4321/posts/hello-world/', {
    waitUntil: 'networkidle',
  });

  const mRewardBtn = await mobilePage.waitForSelector('[data-panel-trigger="reward"]', { timeout: 10000 });
  await mRewardBtn.scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await mRewardBtn.click();
  await mobilePage.waitForTimeout(3000);

  const mModal = mobilePage.locator('[role="dialog"]');
  await mModal.waitFor({ state: 'visible' });
  await mobilePage.screenshot({ path: path.join(outDir, '09-mobile-card-tab.png') });

  // Mobile Crypto Tab
  const mCryptoTab = mModal.locator('[data-tab="crypto"]');
  await mCryptoTab.click();
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(outDir, '10-mobile-crypto-tab.png') });

  // Mobile PayPal Tab
  const mPaypalTab = mModal.locator('[data-tab="paypal"]');
  await mPaypalTab.click();
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: path.join(outDir, '11-mobile-paypal-tab.png') });

  await mobilePage.close();
  await page.close();
  await browser.close();

  console.log('🎉 All reward modal audits completed successfully!');
}

runAudit().catch((err) => {
  console.error('❌ Audit encountered error:', err);
  process.exit(1);
});
