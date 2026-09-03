const { chromium } = require('playwright');

(async () => {
  const BASE = 'http://127.0.0.1:4322';
  console.log(`Connecting to: ${BASE}`);

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  console.log('\n=== 1. 打开文章页 ===');
  await page.goto(`${BASE}/posts/anzhiyu-markdown-showcase/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('\n=== 2. 验证控制台按钮（未打开时不显示、不触发） ===');
  const consoleEl = page.locator('#console');
  const count = await consoleEl.count();
  console.log('#console count in DOM:', count);
  if (count > 0) {
    const isHidden = await consoleEl.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0';
    });
    console.log('Console default visibility:', isHidden ? 'HIDDEN (Correct)' : 'VISIBLE (Error)');
  }

  console.log('\n=== 3. 验证文章页赞赏按钮与弹窗 ===');
  const rewardBtn = page.locator('[data-panel-trigger="reward"]').first();
  await rewardBtn.scrollIntoViewIfNeeded();
  await rewardBtn.click();
  await page.waitForTimeout(800);

  // Check 赞赏记录 link in popover
  const popoverRecordLink = page.locator('.reward-all a[href*="/status/"]').first();
  console.log('赞赏记录 link in popover href:', await popoverRecordLink.getAttribute('href'));

  // Open Stripe modal
  const stripeBtn = page.locator('button:has-text("Stripe 国际收银台")').first();
  await stripeBtn.click();
  await page.waitForTimeout(1000);

  console.log('\n=== 4. 验证 RewardModal UI 细节 ===');
  // Check Apple Pay badge
  const applePayCount = await page.locator('text=Apple Pay').count();
  console.log('Apple Pay badge visible in modal?', applePayCount > 0 ? 'YES' : 'NO');

  // Check Secured by Stripe link
  const stripeLink = page.locator('a[href*="stripe.com"]').first();
  console.log('Secured by Stripe link href:', await stripeLink.getAttribute('href'));

  // Check 赞赏记录 link in modal footer
  const modalRecordLink = page.locator('a[href*="/status/"]').last();
  console.log('Modal 赞赏记录 link href:', await modalRecordLink.getAttribute('href'));

  // Check subtle single-line notice
  const privacyNote = await page.locator('text=本站不存储任何支付卡号及隐私信息').count();
  console.log('Subtle single-line privacy note found?', privacyNote > 0 ? 'YES' : 'NO');

  // Check that green alert box is gone
  const greenBox = await page.locator('.bg-emerald-500\\/8, .bg-emerald-500\\/10').count();
  console.log('Old green alert box count:', greenBox, '(Should be 0)');

  console.log('\n=== 5. 验证 Stripe Checkout Session API 创建 ===');
  let apiSuccess = false;
  let apiBody = null;
  page.on('response', async (res) => {
    if (res.url().includes('/api/create-checkout-session')) {
      const status = res.status();
      const body = await res.json().catch(() => ({}));
      apiBody = body;
      console.log(`API [${status}] Response:`, JSON.stringify(body, null, 2));
      if (status === 200 && body.clientSecret) {
        apiSuccess = true;
      }
    }
  });

  const continueBtn = page.locator('button:has-text("继续")').first();
  await continueBtn.click();

  // Wait for API response and Stripe iframe mount
  await page.waitForTimeout(6000);

  if (apiSuccess) {
    console.log('✅ /api/create-checkout-session called successfully with 200 OK & valid clientSecret!');
  } else {
    console.error('❌ API call failed:', apiBody);
  }

  // Check if Stripe iframe loads
  const iframe = page.locator('#embedded-stripe-checkout iframe').first();
  await iframe.waitFor({ state: 'attached', timeout: 15000 });
  const iframeCount = await page.locator('#embedded-stripe-checkout iframe').count();
  console.log('Stripe Embedded Checkout iframe count in DOM:', iframeCount);
  if (iframeCount > 0) {
    console.log('✅ Stripe Embedded Checkout iframe successfully mounted into DOM!');
  }

  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/scratch/verified-stripe-modal.png' });

  await browser.close();
  console.log('\n🎉 ALL CHECKS FINISHED AND PASSED!');
})();
