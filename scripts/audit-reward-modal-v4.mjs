import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/v4_reward';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runAudit() {
  console.log('🚀 Launching Chromium for Reward Modal V4 Full Audit (Anzhiyu Direct Cards + Serv00 Flow)...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 920 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log('📄 Navigating to post...');
  await page.goto('http://localhost:4321/posts/hello-world/', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // -------------------------------------------------------------
  // Test 1: CN Region - Direct 2 QR Codes (WeChat & Alipay), No Tabs
  // -------------------------------------------------------------
  console.log('📸 01: CN Region (Direct 2 QR Cards)...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'CN' } }));
  });
  await page.waitForTimeout(800);
  const modal = page.locator('[aria-labelledby="reward-modal-heading"]');
  await modal.waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(outDir, '01-region-cn-direct-cards.png') });

  // -------------------------------------------------------------
  // Test 2: HK Region - Direct 3 QR Codes (WeChat HK, Alipay HK, PayPal HK)
  // -------------------------------------------------------------
  console.log('📸 02: HK Region (Direct 3 QR Cards)...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'HK' } }));
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '02-region-hk-3-cards.png') });

  // -------------------------------------------------------------
  // Test 3: GB Region - Direct 2 QR Codes (PayPal UK & USDT Arbitrum) + Stripe CTA
  // -------------------------------------------------------------
  console.log('📸 03: GB Region (PayPal UK + USDT Arbitrum + Stripe CTA)...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'GB' } }));
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '03-region-gb-main.png') });

  // Test copying USDT address
  console.log('📸 04: GB Region - Click USDT Copy...');
  const usdtCard = modal.locator('div:has-text("USDT (Arbitrum)")').last();
  if (await usdtCard.isVisible()) {
    await usdtCard.click();
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: path.join(outDir, '04-region-gb-usdt-copied-toast.png') });

  // -------------------------------------------------------------
  // Test 4: GLOBAL Region - Direct 2 QR Codes (PayPal Global + USDT Arbitrum)
  // -------------------------------------------------------------
  console.log('📸 05: GLOBAL Region (PayPal Global + USDT Arbitrum)...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'GLOBAL' } }));
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '05-region-global-main.png') });

  // -------------------------------------------------------------
  // Test 5: Serv00 Support EpoCanvas 2-Step Flow - Step 1: Sponsor Form
  // -------------------------------------------------------------
  console.log('📸 06: Serv00 Support EpoCanvas Form (Light Theme)...');
  const stripeCtaBtn = modal.locator('button:has-text("通过 Stripe 信用卡")');
  if (await stripeCtaBtn.isVisible()) {
    await stripeCtaBtn.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(outDir, '06-serv00-sponsor-form-light.png') });

  // Fill in sponsor name and message
  console.log('📸 07: Serv00 Form - Filled Name & Message...');
  const nameInput = modal.locator('input[placeholder*="github_username"]');
  const msgInput = modal.locator('textarea[placeholder*="写下想对作者说的话"]');
  if (await nameInput.isVisible()) {
    await nameInput.fill('@shijian_dev');
  }
  if (await msgInput.isVisible()) {
    await msgInput.fill('感谢打造这么棒的开源博客主题！加油！☕️');
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '07-serv00-form-filled.png') });

  // Dark theme sponsor form
  console.log('📸 08: Serv00 Form (Dark Theme)...');
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    window.dispatchEvent(new CustomEvent('shijianus:themechange', { detail: 'dark' }));
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '08-serv00-form-dark.png') });

  // -------------------------------------------------------------
  // Test 6: Step 2: Proceed to Stripe Checkout View
  // -------------------------------------------------------------
  console.log('📸 09: Step 2: Stripe Checkout View (Dark Theme)...');
  const proceedBtn = modal.locator('button:has-text("下一步：前往安全收银台")');
  if (await proceedBtn.isVisible()) {
    await proceedBtn.click();
    await page.waitForTimeout(2200); // Allow PaymentIntent API & Stripe Elements to mount
  }
  await page.screenshot({ path: path.join(outDir, '09-stripe-checkout-dark.png') });

  // Switch to light theme inside Stripe Checkout View
  console.log('📸 10: Step 2: Stripe Checkout View (Light Theme)...');
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
    window.dispatchEvent(new CustomEvent('shijianus:themechange', { detail: 'light' }));
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '10-stripe-checkout-light.png') });

  // -------------------------------------------------------------
  // Test 7: Mobile Viewport (375x812)
  // -------------------------------------------------------------
  console.log('📱 Auditing Mobile Viewport...');
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 812 });
  await mobilePage.goto('http://localhost:4321/posts/hello-world/', {
    waitUntil: 'networkidle',
  });

  // Mobile CN
  await mobilePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'CN' } }));
  });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(outDir, '11-mobile-cn-view.png') });

  // Mobile HK
  await mobilePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'HK' } }));
  });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(outDir, '12-mobile-hk-view.png') });

  // Mobile GB & Stripe
  await mobilePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'GB' } }));
  });
  await mobilePage.waitForTimeout(800);
  const mStripeBtn = mobilePage.locator('button:has-text("通过 Stripe 信用卡")');
  if (await mStripeBtn.isVisible()) {
    await mStripeBtn.click();
    await mobilePage.waitForTimeout(600);
  }
  await mobilePage.screenshot({ path: path.join(outDir, '13-mobile-serv00-form.png') });

  const mProceedBtn = mobilePage.locator('button:has-text("下一步：前往安全收银台")');
  if (await mProceedBtn.isVisible()) {
    await mProceedBtn.click();
    await mobilePage.waitForTimeout(2000);
  }
  await mobilePage.screenshot({ path: path.join(outDir, '14-mobile-stripe-checkout.png') });

  await mobilePage.close();
  await page.close();
  await browser.close();

  console.log('🎉 Reward Modal V4 Audit completed successfully!');
}

runAudit().catch((err) => {
  console.error('❌ Audit encountered error:', err);
  process.exit(1);
});
