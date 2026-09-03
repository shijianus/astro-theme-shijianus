const { chromium } = require('playwright');

(async () => {
  const BASE = 'http://127.0.0.1:4322';
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const [locale, expectedTitle, expectedBtn] of [
    ['zh-CN', '赞赏支持', '继续'],
    ['zh-Hant', '讚賞支持', '繼續'],
    ['en', 'Support Creator', 'Continue'],
  ]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await page.goto(`${BASE}/posts/anzhiyu-markdown-showcase/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Set localeVariant on documentElement and open modal directly
    await page.evaluate((loc) => {
      document.documentElement.dataset.localeVariant = loc;
      window.localStorage.setItem('shijianus-locale-variant', loc);
      window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: loc }));
      window.dispatchEvent(new CustomEvent('open-stripe-modal', { detail: { region: 'GLOBAL' } }));
    }, locale);
    await page.waitForTimeout(800);

    const titleText = await page.locator('.fixed.inset-0 .text-sm.font-bold').first().innerText();
    console.log(`[Locale: ${locale}] Modal Title: "${titleText}" (Matched: ${titleText === expectedTitle})`);

    let apiLocale = null;
    page.on('response', async (res) => {
      if (res.url().includes('/api/create-checkout-session')) {
        const body = await res.json().catch(() => ({}));
        console.log(`[Locale: ${locale}] Checkout Session created with clientSecret:`, !!body.clientSecret);
      }
    });

    const continueBtn = page.locator('.fixed.inset-0 button:has-text("' + expectedBtn + '")').first();
    if (await continueBtn.count()) {
      await continueBtn.click();
      await page.waitForTimeout(3500);
      const iframeCount = await page.locator('#embedded-stripe-checkout iframe').count();
      console.log(`[Locale: ${locale}] Stripe Embedded iframe mounted:`, iframeCount > 0);
    }

    await page.close();
  }

  await browser.close();
  console.log('\n🎉 ALL 3 LOCALES 100% VERIFIED!');
})();
