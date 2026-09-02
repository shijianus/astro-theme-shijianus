import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOT_DIR = path.join(__dirname, 'audit_screenshots', 'v5_extension');

async function runAudit() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('🚀 Starting Anzhiyu Reward Extension & Stripe Centered Modal Audit (V5)...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Mock Stripe and geo
  await page.addInitScript(() => {
    window.__MOCK_GEO_COUNTRY__ = 'CN';

    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('/api/geo-profile')) {
        return new Response(
          JSON.stringify({
            ip: '114.114.114.114',
            country: window.__MOCK_GEO_COUNTRY__ || 'CN',
            country_name: 'China',
            city: 'Shanghai',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (typeof url === 'string' && url.includes('/api/record-blessing')) {
        return new Response(JSON.stringify({ success: true, id: 'blessing_mock_ok' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(url, options);
    };
  });

  await page.goto('http://localhost:4321/posts/hello-world/', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Scroll to post tools
  await page.evaluate(() => {
    const postTools = document.querySelector('.post-tools, [data-post-tools]');
    if (postTools) {
      postTools.scrollIntoView({ behavior: 'instant', block: 'end' });
    }
  });
  await page.waitForTimeout(800);

  // --------------------------------------------------------------------------
  // 1. CN View: Click .post-reward button to open attached extension bar
  // --------------------------------------------------------------------------
  console.log('📸 1. Capturing CN Attached Reward Extension (2 direct QR cards)...');
  const rewardBtn = page.locator('.post-reward .reward-button').first();
  await rewardBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01-cn-attached-extension-bar.png'),
  });

  // --------------------------------------------------------------------------
  // 2. HK View: Switch to HK via region selector dropdown
  // --------------------------------------------------------------------------
  console.log('📸 2. Capturing HK Attached Extension (3 direct QR cards)...');
  const regionDropdownBtn = page.locator('.reward-main button').filter({ hasText: '🇨🇳' }).first();
  if (await regionDropdownBtn.isVisible()) {
    await regionDropdownBtn.click();
    await page.waitForTimeout(300);
    const hkOption = page.locator('.reward-main button').filter({ hasText: '中国香港' }).first();
    await hkOption.click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '02-hk-attached-extension-bar.png'),
  });

  // --------------------------------------------------------------------------
  // 3. GB View: Switch to UK (PayPal UK + USDT Arbitrum + Stripe Launch CTA)
  // --------------------------------------------------------------------------
  console.log('📸 3. Capturing GB Attached Extension (PayPal UK + USDT Arbitrum + Stripe Launch CTA)...');
  const regionDropdownBtn2 = page.locator('.reward-main button').filter({ hasText: '🇭🇰' }).first();
  if (await regionDropdownBtn2.isVisible()) {
    await regionDropdownBtn2.click();
    await page.waitForTimeout(300);
    const gbOption = page.locator('.reward-main button').filter({ hasText: '英国' }).first();
    await gbOption.click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '03-gb-attached-extension-bar.png'),
  });

  // --------------------------------------------------------------------------
  // 4. Click USDT in UK: verify Toast copy feedback
  // --------------------------------------------------------------------------
  console.log('📸 4. Testing USDT Arbitrum copy interaction...');
  const usdtCard = page.locator('.reward-main').getByText('USDT (Arbitrum)').first();
  if (await usdtCard.isVisible()) {
    await usdtCard.click();
    await page.waitForTimeout(400);
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '04-usdt-copied-toast.png'),
  });

  // --------------------------------------------------------------------------
  // 5. GLOBAL View: Switch to GLOBAL (PayPal Global + USDT + Stripe Launch CTA)
  // --------------------------------------------------------------------------
  console.log('📸 5. Capturing GLOBAL Attached Extension...');
  const regionDropdownBtn3 = page.locator('.reward-main button').filter({ hasText: '🇬🇧' }).first();
  if (await regionDropdownBtn3.isVisible()) {
    await regionDropdownBtn3.click();
    await page.waitForTimeout(300);
    const globalOption = page.locator('.reward-main button').filter({ hasText: '全球 (Stripe)' }).first();
    await globalOption.click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '05-global-attached-extension-bar.png'),
  });

  // --------------------------------------------------------------------------
  // 6. Click Stripe Launch Button -> Open Centered RewardModal (Stripe 收银台)
  // --------------------------------------------------------------------------
  console.log('📸 6. Clicking Launch Button to open centered Stripe Checkout Modal...');
  const launchStripeBtn = page.locator('.reward-main button').filter({ hasText: '国际收银台' }).first();
  if (await launchStripeBtn.isVisible()) {
    await launchStripeBtn.click();
    await page.waitForTimeout(600);
  }

  // Interacting with form
  const cardInput = page.locator('input[placeholder="1234 1234 1234 1234"]').first();
  if (await cardInput.isVisible()) {
    await cardInput.fill('4242424242424242');
    const expiryInput = page.locator('input[placeholder="MM / YY"]').first();
    await expiryInput.fill('1228');
    const cvcInput = page.locator('input[placeholder="CVC"]').first();
    await cvcInput.fill('123');
    await page.waitForTimeout(400);
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '06-stripe-modal-checkout-light.png'),
  });

  // --------------------------------------------------------------------------
  // 7. Stripe Centered Modal: Dark Mode
  // --------------------------------------------------------------------------
  console.log('📸 7. Stripe Centered Modal in Dark Mode...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(400);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '07-stripe-modal-checkout-dark.png'),
  });

  // --------------------------------------------------------------------------
  // 8. Post-Payment: Click Pay -> Triggering In-Modal Blessing Screen
  // --------------------------------------------------------------------------
  console.log('📸 8. Clicking Pay -> Triggering In-Modal Blessing Screen...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  });

  const payBtn = page.locator('button').filter({ hasText: /^Pay$/ }).first();
  if (await payBtn.isVisible()) {
    await payBtn.click();
    await page.waitForTimeout(1200);
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '08-post-payment-blessing-form.png'),
  });

  // --------------------------------------------------------------------------
  // 9. Fill Blessing Form (Name + Message)
  // --------------------------------------------------------------------------
  console.log('📸 9. Filling Donor Blessing & Message in Modal...');
  const nameInput = page.locator('input[placeholder*="@github_username"]').first();
  if (await nameInput.isVisible()) {
    await nameInput.fill('@shijian_sponsor');
    const msgInput = page.locator('textarea[placeholder*="写下想对作者说的话"]').first();
    await msgInput.fill('博客排版与内容太棒了，持续加油独立创作！☕️');
    await page.waitForTimeout(300);
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '09-post-payment-blessing-filled.png'),
  });

  // --------------------------------------------------------------------------
  // 10. Submit Blessing -> Confirmation
  // --------------------------------------------------------------------------
  console.log('📸 10. Submitting Blessing...');
  const sendBlessingBtn = page.locator('button').filter({ hasText: '发送寄语与祝福' }).first();
  if (await sendBlessingBtn.isVisible()) {
    await sendBlessingBtn.click();
    await page.waitForTimeout(600);
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '10-post-payment-blessing-confirmed.png'),
  });

  // Close modal
  const finishBtn = page.locator('button').filter({ hasText: '完成' }).first();
  if (await finishBtn.isVisible()) {
    await finishBtn.click();
    await page.waitForTimeout(400);
  }

  // --------------------------------------------------------------------------
  // 11. Mobile Viewport: 375x812
  // --------------------------------------------------------------------------
  console.log('📸 11. Mobile viewport audit...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:4321/posts/hello-world/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  const mPostTools = mobilePage.locator('.post-tools').first();
  await mPostTools.scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);

  // Mobile CN view
  await mobilePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-post-reward-extension', { detail: { region: 'CN' } }));
  });
  await mobilePage.waitForTimeout(500);

  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, '11-mobile-cn-attached-extension.png'),
  });

  // Mobile HK view (3 cards)
  await mobilePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-post-reward-extension', { detail: { region: 'HK' } }));
  });
  await mobilePage.waitForTimeout(500);

  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, '12-mobile-hk-attached-extension.png'),
  });

  // Mobile Centered Stripe Modal
  await mobilePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-stripe-modal', { detail: { region: 'GLOBAL', amount: 5 } }));
  });
  await mobilePage.waitForTimeout(600);

  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, '13-mobile-stripe-modal.png'),
  });

  await browser.close();
  console.log('✅ Audit V5 complete! Screenshots saved to:', SCREENSHOT_DIR);
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
