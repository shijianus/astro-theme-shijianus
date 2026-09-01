import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'scripts/audit_screenshots/v5_extension');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function runAudit() {
  console.log('🚀 Starting Anzhiyu Reward Extension & Stripe 2-Step Modal Audit (V5)...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  const page = await context.newPage();

  // Route mock for geo-profile to default to CN
  await page.route('**/api/geo-profile', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        country: 'CN',
        ip: '114.114.114.114',
      }),
    });
  });

  // Route mock for Stripe PaymentIntent creation
  await page.route('**/api/create-payment-intent', (route) => {
    const postData = JSON.parse(route.request().postData() || '{}');
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        clientSecret: 'pi_mock_123456789_secret_987654321',
        amount: (postData.amount || 5) * 100,
        currency: 'usd',
      }),
    });
  });

  // Mock Stripe JS SDK if external CDN is blocked
  await page.addInitScript(() => {
    const mockElementInstance = {
      mount: (el) => {
        if (!el) return;
        if (typeof el === 'string') el = document.querySelector(el);
        if (!el) return;
        el.innerHTML = `
          <div style="display:flex;gap:8px;width:100%;margin-bottom:8px;">
            <button type="button" style="flex:1;height:42px;background:#000;color:#fff;border-radius:10px;font-weight:bold;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;border:none;">
               Pay
            </button>
            <button type="button" style="flex:1;height:42px;background:#000;color:#fff;border-radius:10px;font-weight:bold;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;border:none;">
              G Pay
            </button>
            <button type="button" style="flex:1;height:42px;background:#00D66F;color:#000;border-radius:10px;font-weight:bold;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;border:none;">
              Link
            </button>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div>
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:inherit;">卡号 (Card number)</label>
              <input type="text" value="4242 •••• •••• 4242" readonly style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(128,128,128,0.3);background:transparent;color:inherit;font-family:monospace;" />
            </div>
            <div style="display:flex;gap:8px;">
              <div style="flex:1;">
                <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:inherit;">有效期 (MM / YY)</label>
                <input type="text" value="12 / 28" readonly style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(128,128,128,0.3);background:transparent;color:inherit;" />
              </div>
              <div style="flex:1;">
                <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:inherit;">安全码 (CVC)</label>
                <input type="text" value="•••" readonly style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(128,128,128,0.3);background:transparent;color:inherit;" />
              </div>
            </div>
          </div>
        `;
      },
      on: () => {},
      destroy: () => {},
    };

    window.Stripe = (key) => ({
      elements: (opts) => ({
        create: (type, elOpts) => mockElementInstance,
        getElement: (type) => mockElementInstance,
        update: () => {},
      }),
      confirmCardPayment: async () => ({
        paymentIntent: { id: 'pi_3P058V02n31a9V9jK08Lmock', status: 'succeeded' },
      }),
      confirmPayment: async () => ({
        paymentIntent: { id: 'pi_3P058V02n31a9V9jK08Lmock', status: 'succeeded' },
      }),
    });
  });

  await page.goto('http://localhost:4321/posts/hello-world/', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Scroll to post tools
  await page.evaluate(() => {
    const postTools = document.querySelector('.post-tools, [data-post-tools]');
    if (postTools) {
      postTools.scrollIntoView({ behavior: 'instant', block: 'center' });
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
  // 3. GB View: Switch to UK (PayPal UK + USDT Arbitrum + Stripe CTA)
  // --------------------------------------------------------------------------
  console.log('📸 3. Capturing GB Attached Extension (PayPal UK + USDT Arbitrum + Stripe CTA)...');
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
  // 5. GLOBAL View: Switch to GLOBAL
  // --------------------------------------------------------------------------
  console.log('📸 5. Capturing GLOBAL Attached Extension...');
  const regionDropdownBtn3 = page.locator('.reward-main button').filter({ hasText: '🇬🇧' }).first();
  if (await regionDropdownBtn3.isVisible()) {
    await regionDropdownBtn3.click();
    await page.waitForTimeout(300);
    const globalOption = page.locator('.reward-main button').filter({ hasText: '全球其它地区' }).first();
    await globalOption.click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '05-global-attached-extension-bar.png'),
  });

  // --------------------------------------------------------------------------
  // 6. Stripe Modal: Click "通过 Stripe 信用卡 / Apple Pay 赞赏 →" to open modal
  // --------------------------------------------------------------------------
  console.log('📸 6. Opening Stripe Checkout Modal (Amount chips + Express Checkout + Card Element)...');
  const stripeCtaBtn = page.locator('.reward-main button').filter({ hasText: '通过 Stripe 信用卡' }).first();
  await stripeCtaBtn.click();
  await page.waitForTimeout(600);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '06-stripe-modal-checkout-light.png'),
  });

  // --------------------------------------------------------------------------
  // 7. Stripe Modal: Dark Mode
  // --------------------------------------------------------------------------
  console.log('📸 7. Stripe Checkout Modal in Dark Mode...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(400);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '07-stripe-modal-checkout-dark.png'),
  });

  // --------------------------------------------------------------------------
  // 8. Post-Payment: Click Confirm & Pay -> Triggering Post-Payment Blessing Screen
  // --------------------------------------------------------------------------
  console.log('📸 8. Clicking Confirm & Pay -> Triggering Post-Payment Blessing Screen...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  });

  const payBtn = page.locator('div[role="dialog"] button[type="submit"]').first();
  if (await payBtn.isVisible()) {
    await payBtn.click();
    await page.waitForTimeout(800);
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '08-post-payment-blessing-form.png'),
  });

  // --------------------------------------------------------------------------
  // 9. Fill Blessing Form (Name + Message)
  // --------------------------------------------------------------------------
  console.log('📸 9. Filling Donor Blessing & Message...');
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

  // --------------------------------------------------------------------------
  // 11. Mobile Viewport: 375x812
  // --------------------------------------------------------------------------
  console.log('📸 11. Mobile viewport audit...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
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

  // Mobile Stripe CTA -> Modal
  const mStripeBtn = mobilePage.locator('.reward-main button').filter({ hasText: '通过 Stripe 信用卡' }).first();
  if (await mStripeBtn.isVisible()) {
    await mStripeBtn.click();
    await mobilePage.waitForTimeout(600);
  } else {
    await mobilePage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('open-stripe-modal', { detail: { region: 'GLOBAL', amount: 5 } }));
    });
    await mobilePage.waitForTimeout(600);
  }

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
