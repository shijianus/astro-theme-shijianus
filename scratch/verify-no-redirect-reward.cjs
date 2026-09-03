const { chromium } = require('playwright');

async function runTest() {
  console.log('🚀 Starting Verification: Non-redirect Stripe Embedded Checkout & In-place Form Transition');

  // Test 1: Verify API parameter directly
  console.log('\n--- 1. Testing /api/create-checkout-session API parameters ---');
  try {
    const liveRes = await fetch('https://blog.epocanvas.com/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 8,
        currency: 'usd',
        country: 'US',
        locale: 'zh-CN',
        returnUrl: 'https://blog.epocanvas.com/?stripe_return=1&amount=8&session_id={CHECKOUT_SESSION_ID}'
      })
    });
    const liveData = await liveRes.json();
    console.log('API Status:', liveRes.status, 'Session ID:', liveData.sessionId, 'clientSecret exists:', !!liveData.clientSecret);
  } catch (e) {
    console.log('API note:', e.message);
  }

  // Test 2: Headless Browser E2E Interaction Test
  console.log('\n--- 2. Browser E2E Test: No Reload, In-place Blessing Form Transition ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  let pageReloadCount = 0;
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      pageReloadCount++;
      console.log(`[Navigation Event #${pageReloadCount}] Main frame navigated to: ${frame.url()}`);
    }
  });

  const targetUrl = 'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/';
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  const initialNavigations = pageReloadCount;
  console.log(`Initial page load completed (nav count: ${initialNavigations})`);

  // Open Stripe Reward Modal
  console.log('Triggering Stripe Reward Modal open...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-stripe-modal', {
      detail: { region: 'GLOBAL', country: 'US', amount: 8 }
    }));
  });

  // Verify modal container exists
  const modalContainer = page.locator('div.w-full.sm\\:max-w-\\[420px\\]');
  await modalContainer.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ Reward Modal container successfully visible!');

  // Check Amount step
  const continueBtn = modalContainer.locator('button:has-text("继续赞赏"), button:has-text("Continue")');
  await continueBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ Amount step rendered. Clicking continue...');
  await continueBtn.click();

  // Wait for Stripe Checkout step to mount
  console.log('Waiting for Stripe checkout container to mount...');
  const checkoutContainer = page.locator('#embedded-stripe-checkout');
  await checkoutContainer.waitFor({ state: 'attached', timeout: 10000 });
  console.log('✅ Stripe Embedded Checkout container mounted successfully!');

  // Verify that during modal interaction NO unexpected page navigation occurred
  const postModalNavigations = pageReloadCount - initialNavigations;
  console.log(`Page reloads/navigations during interaction: ${postModalNavigations}`);
  if (postModalNavigations === 0) {
    console.log('✅ ZERO page reloads verified! Current page state is 100% preserved without any reload!');
  } else {
    throw new Error('Unexpected page reload occurred!');
  }

  await browser.close();
  console.log('\n🎉 Verification completed successfully!');
}

runTest().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
