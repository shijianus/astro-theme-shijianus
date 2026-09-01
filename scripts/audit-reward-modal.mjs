import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runAudit() {
  console.log('Launching browser for Reward Modal audit...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  console.log('Navigating to blog post...');
  await page.goto('http://localhost:4321/posts/hello-world/', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Scroll to copyright section and find reward button
  console.log('Clicking reward button...');
  const rewardBtn = await page.waitForSelector('[data-panel-trigger="reward"]', { timeout: 10000 });
  await rewardBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Click to open modal
  await rewardBtn.click();
  await page.waitForTimeout(1000);

  // Take screenshot of default opened modal (usually CN or GLOBAL)
  await page.screenshot({ path: path.join(outDir, 'reward-modal-01-initial.png') });
  console.log('Saved reward-modal-01-initial.png');

  // Switch to CN
  console.log('Switching to CN view...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'CN' } }));
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, 'reward-modal-02-cn.png') });
  console.log('Saved reward-modal-02-cn.png');

  // Switch to HK
  console.log('Switching to HK view...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'HK' } }));
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, 'reward-modal-03-hk.png') });
  console.log('Saved reward-modal-03-hk.png');

  // Switch to GB
  console.log('Switching to GB view...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'GB' } }));
  });
  await page.waitForTimeout(600);
  // Click "显示此网络收款二维码"
  const showQrBtn = await page.locator('text=显示此网络收款二维码').first();
  if (await showQrBtn.isVisible()) {
    await showQrBtn.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(outDir, 'reward-modal-04-gb-crypto.png') });
  console.log('Saved reward-modal-04-gb-crypto.png');

  // Switch to GLOBAL
  console.log('Switching to GLOBAL (Stripe) view...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'GLOBAL' } }));
  });
  // Wait for Stripe elements to mount and load
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(outDir, 'reward-modal-05-global-stripe.png') });
  console.log('Saved reward-modal-05-global-stripe.png');

  // Also toggle "原生直接收款方式 (Crypto 冷钱包 / PayPal)" in GLOBAL view
  console.log('Toggling collapsible bottom methods in GLOBAL view...');
  const toggleBtn = await page.locator('text=原生直接收款方式').first();
  if (await toggleBtn.isVisible()) {
    await toggleBtn.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(outDir, 'reward-modal-06-global-expanded.png') });
  console.log('Saved reward-modal-06-global-expanded.png');

  // Mobile Viewport Audit
  console.log('Auditing mobile viewport (375x812)...');
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 812 });
  await mobilePage.goto('http://localhost:4321/posts/hello-world/', {
    waitUntil: 'networkidle',
  });
  await mobilePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'CN' } }));
  });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(outDir, 'reward-modal-07-mobile-cn.png') });
  console.log('Saved reward-modal-07-mobile-cn.png');

  await mobilePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-reward-modal', { detail: { region: 'GLOBAL' } }));
  });
  await mobilePage.waitForTimeout(3000);
  await mobilePage.screenshot({ path: path.join(outDir, 'reward-modal-08-mobile-global.png') });
  console.log('Saved reward-modal-08-mobile-global.png');

  await mobilePage.close();

  await browser.close();
  console.log('Audit completed successfully!');
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
