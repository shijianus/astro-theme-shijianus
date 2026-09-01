import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/v3_reward';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runAudit() {
  console.log('🚀 Launching Chromium for Reward Modal V3 Audit (Full Isolation & Regional GeoIP)...');
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

  // -------------------------------------------------------------
  // Test 1: CN Region (Mainland China) - Only WeChat & Alipay QR codes
  // -------------------------------------------------------------
  console.log('📸 01: CN Region View (WeChat & Alipay Only)...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'CN' } }));
  });
  await page.waitForTimeout(1000);
  const modal = page.locator('[aria-labelledby="reward-modal-heading"]');
  await modal.waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(outDir, '01-region-cn-wechat-alipay.png') });

  // -------------------------------------------------------------
  // Test 2: HK Region (Hong Kong) - WeChat/Alipay & PayPal HK
  // -------------------------------------------------------------
  console.log('📸 02: HK Region View (WeChat/Alipay tab)...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'HK' } }));
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '02-region-hk-cn-tab.png') });

  console.log('📸 03: HK Region View (PayPal HK tab with Clickable QR)...');
  const paypalHkBtn = modal.locator('button:has-text("PayPal HK")');
  if (await paypalHkBtn.isVisible()) {
    await paypalHkBtn.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(outDir, '03-region-hk-paypal-tab.png') });

  // -------------------------------------------------------------
  // Test 3: GB Region (UK) - Stripe Button, PayPal UK & USDT
  // -------------------------------------------------------------
  console.log('📸 04: GB Region View (Stripe Entry Button & PayPal UK)...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'GB' } }));
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '04-region-gb-main.png') });

  console.log('📸 05: GB Region View (USDT Crypto Tab)...');
  const cryptoTabBtn = modal.locator('button:has-text("USDT 加密钱包")');
  if (await cryptoTabBtn.isVisible()) {
    await cryptoTabBtn.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(outDir, '05-region-gb-crypto-trc20.png') });

  // Switch to ERC20 and copy
  const erc20Btn = modal.locator('button:has-text("ERC20")');
  if (await erc20Btn.isVisible()) {
    await erc20Btn.click();
    await page.waitForTimeout(400);
    const copyBtn = modal.locator('button[title="复制完整地址"]');
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await page.waitForTimeout(400);
    }
  }
  await page.screenshot({ path: path.join(outDir, '06-region-gb-crypto-erc20-copied.png') });

  // -------------------------------------------------------------
  // Test 4: Dedicated Stripe Checkout View (Transition from Button)
  // -------------------------------------------------------------
  console.log('📸 07: Dedicated Stripe Checkout View (Light Theme)...');
  const enterStripeBtn = modal.locator('button:has-text("进入收银台")');
  if (await enterStripeBtn.isVisible()) {
    await enterStripeBtn.click();
    await page.waitForTimeout(2000); // Allow Stripe Elements to render
  }
  await page.screenshot({ path: path.join(outDir, '07-stripe-view-light-theme.png') });

  // Test Custom Amount $50 in Stripe View
  console.log('📸 08: Stripe View - Custom Amount $50...');
  const customAmtBtn = modal.locator('[data-amt="custom"]');
  if (await customAmtBtn.isVisible()) {
    await customAmtBtn.click();
    await page.waitForTimeout(300);
    const customInput = modal.locator('input[placeholder*="输入赞赏金额"]');
    if (await customInput.isVisible()) {
      await customInput.fill('50');
      await page.waitForTimeout(300);
    }
  }
  await page.screenshot({ path: path.join(outDir, '08-stripe-view-custom-amount.png') });

  // -------------------------------------------------------------
  // Test 5: Dark Theme Stripe Checkout View
  // -------------------------------------------------------------
  console.log('📸 09: Stripe View - Dark Theme...');
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    window.dispatchEvent(new CustomEvent('shijianus:themechange', { detail: 'dark' }));
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '09-stripe-view-dark-theme.png') });

  // -------------------------------------------------------------
  // Test 6: Return Back to Main View from Stripe View
  // -------------------------------------------------------------
  console.log('📸 10: Return Back to Main View via Back Arrow...');
  const backBtn = modal.locator('button[title="返回其他支付方式"]');
  if (await backBtn.isVisible()) {
    await backBtn.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(outDir, '10-returned-to-main-view.png') });

  // -------------------------------------------------------------
  // Test 7: GLOBAL Region View
  // -------------------------------------------------------------
  console.log('📸 11: GLOBAL Region View...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'GLOBAL' } }));
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '11-region-global-main.png') });

  // -------------------------------------------------------------
  // Test 8: Mobile Viewport Audit (375x812)
  // -------------------------------------------------------------
  console.log('📱 Auditing Mobile Viewport (375x812)...');
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 812 });
  await mobilePage.goto('http://localhost:4321/posts/hello-world/', {
    waitUntil: 'networkidle',
  });

  // Mobile CN
  await mobilePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'CN' } }));
  });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(outDir, '12-mobile-cn-view.png') });

  // Mobile GB & Stripe
  await mobilePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'GB' } }));
  });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(outDir, '13-mobile-gb-main.png') });

  const mStripeBtn = mobilePage.locator('button:has-text("进入收银台")');
  if (await mStripeBtn.isVisible()) {
    await mStripeBtn.click();
    await mobilePage.waitForTimeout(2000);
  }
  await mobilePage.screenshot({ path: path.join(outDir, '14-mobile-stripe-view.png') });

  await mobilePage.close();
  await page.close();
  await browser.close();

  console.log('🎉 Reward Modal V3 Audit completed successfully!');
}

runAudit().catch((err) => {
  console.error('❌ Audit encountered error:', err);
  process.exit(1);
});
