const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:4321';
const OUT_DIR = '/root/.gemini/antigravity-cli/brain/3e5af691-40ee-4c94-aff2-31a7ce995421';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('🚀 Running visual verification of Reward & Stripe improvements...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  // Find a post URL
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const postLink = await page.locator('a[href*="/posts/"]').first().getAttribute('href');
  const postUrl = BASE + (postLink || '/posts/readable-geek-interfaces/');
  console.log('📄 Navigating to post:', postUrl);

  await page.goto(postUrl, { waitUntil: 'networkidle' });
  await sleep(1000);

  // Scroll to copyright / reward section
  await page.evaluate(() => {
    const el = document.querySelector('.post-copyright') || document.querySelector('.post-tools');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await sleep(600);

  // 1. Post Reward Extension - Light mode normal state
  const rewardTrigger = page.locator('[data-reward-wrapper] button[data-panel-trigger="reward"]').first();
  await rewardTrigger.click();
  await sleep(600);

  const rewardDrawer = page.locator('[data-reward-wrapper] .reward-main').first();
  await rewardDrawer.screenshot({ path: path.join(OUT_DIR, '01-reward-drawer-light.png') });
  console.log('📸 Captured 01-reward-drawer-light.png');

  // Hover over StripeButton in light mode
  const stripeBtn = page.locator('[data-reward-wrapper] button:has-text("Stripe 国际收银台")').first();
  await stripeBtn.hover();
  await sleep(400);
  await rewardDrawer.screenshot({ path: path.join(OUT_DIR, '02-stripe-btn-hover-light.png') });
  console.log('📸 Captured 02-stripe-btn-hover-light.png');

  // Dark mode (normal state)
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.mouse.move(0, 0); // unhover
  await sleep(400);
  await rewardDrawer.screenshot({ path: path.join(OUT_DIR, '03-stripe-btn-dark-normal.png') });
  console.log('📸 Captured 03-stripe-btn-dark-normal.png');

  // Dark mode (hover state)
  await stripeBtn.hover();
  await sleep(400);
  await rewardDrawer.screenshot({ path: path.join(OUT_DIR, '03-stripe-btn-hover-dark.png') });
  console.log('📸 Captured 03-stripe-btn-hover-dark.png');

  // Switch back to light
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await sleep(300);

  // 2. Open Stripe Modal (Default USD - 6 presets)
  await stripeBtn.click();
  await sleep(600);

  const modal = page.locator('.fixed.inset-0.z-\\[1000\\] > div').first();
  await modal.screenshot({ path: path.join(OUT_DIR, '04-stripe-modal-usd-6tiers.png') });
  console.log('📸 Captured 04-stripe-modal-usd-6tiers.png');

  // 3. Test Malaysia (MYR)
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-stripe-modal', { detail: { country: 'MY' } }));
  });
  await sleep(400);
  await modal.screenshot({ path: path.join(OUT_DIR, '05-stripe-modal-myr.png') });
  console.log('📸 Captured 05-stripe-modal-myr.png');

  // 4. Test Japan (JPY)
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-stripe-modal', { detail: { country: 'JP' } }));
  });
  await sleep(400);
  await modal.screenshot({ path: path.join(OUT_DIR, '06-stripe-modal-jpy.png') });
  console.log('📸 Captured 06-stripe-modal-jpy.png');

  // 5. Test China (CNY)
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-stripe-modal', { detail: { country: 'CN' } }));
  });
  await sleep(400);
  await modal.screenshot({ path: path.join(OUT_DIR, '07-stripe-modal-cny.png') });
  console.log('📸 Captured 07-stripe-modal-cny.png');

  // 6. Test South Korea (KRW)
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-stripe-modal', { detail: { country: 'KR' } }));
  });
  await sleep(400);
  await modal.screenshot({ path: path.join(OUT_DIR, '08-stripe-modal-krw.png') });
  console.log('📸 Captured 08-stripe-modal-krw.png');

  // 7. Test United Kingdom (GBP)
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-stripe-modal', { detail: { country: 'GB' } }));
  });
  await sleep(400);
  await modal.screenshot({ path: path.join(OUT_DIR, '09-stripe-modal-gbp.png') });
  console.log('📸 Captured 09-stripe-modal-gbp.png');

  // 8. Test Custom amount validation (> max)
  const customInput = modal.locator('input[type="number"]').first();
  await customInput.fill('9999');
  await sleep(400);
  await modal.screenshot({ path: path.join(OUT_DIR, '10-stripe-modal-custom-overflow.png') });
  console.log('📸 Captured 10-stripe-modal-custom-overflow.png');

  // 9. Test Dark mode for Modal with Security Footer
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await customInput.fill('50');
  await sleep(400);
  await modal.screenshot({ path: path.join(OUT_DIR, '11-stripe-modal-dark-security-footer.png') });
  console.log('📸 Captured 11-stripe-modal-dark-security-footer.png');

  await browser.close();
  console.log('✅ Visual verification completed successfully!');
})();
