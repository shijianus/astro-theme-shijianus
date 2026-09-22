import { chromium } from 'playwright';

async function main() {
  console.log('Testing static article access unlock with password...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://127.0.0.1:4399/posts/access-control-lab/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // 1. Initial state: verify lock panel is present and active
  const isLockedInitially = await page.evaluate(() => {
    return Boolean(document.querySelector('.content-access-panel--server'));
  });
  console.log('1. Lock panel present initially:', isLockedInitially);
  if (!isLockedInitially) throw new Error('Expected access control panel to be present initially!');

  // Verify visible variants count is 0 initially
  const initialVariants = await page.$$eval('.article-translation-variant', (els) =>
    els.filter((el) => window.getComputedStyle(el).display !== 'none').length
  );
  console.log('2. Visible variants before unlock:', initialVariants);
  if (initialVariants !== 0) throw new Error('Expected 0 visible variants before unlock!');

  // 2. Test wrong password
  console.log('3. Testing wrong password...');
  await page.fill('input[name="post-password"]', 'wrong-pass');
  await page.click('.content-access-panel__form button[type="submit"]');
  await page.waitForTimeout(400);

  const errorVisible = await page.evaluate(() => {
    const err = document.getElementById('content-access-client-error');
    return err && window.getComputedStyle(err).display !== 'none';
  });
  console.log('   Error message shown for wrong password:', errorVisible);
  if (!errorVisible) throw new Error('Expected error message to be displayed for wrong password!');

  // 3. Test correct password 12345
  console.log('4. Testing correct password (12345)...');
  await page.fill('input[name="post-password"]', '12345');
  await page.click('.content-access-panel__form button[type="submit"]');
  await page.waitForTimeout(600);

  // Verify lock panel is removed
  const panelAfter = await page.$('.content-access-panel--server');
  console.log('5. Lock panel removed after correct password:', !panelAfter);
  if (panelAfter) throw new Error('Expected access panel to be removed after unlock!');

  // 4. Verify all 6 translation variants are mounted and present in DOM
  const variants = await page.$$eval('.article-translation-variant', (els) =>
    els.map((el) => ({
      lang: el.getAttribute('data-lang'),
      visible: window.getComputedStyle(el).display !== 'none',
      len: el.innerText.trim().length,
    }))
  );
  console.log(`6. Unlocked variants detected (${variants.length} total):`, variants.map((v) => `${v.lang}(${v.len} chars)`).join(', '));
  if (variants.length !== 6) throw new Error(`Expected 6 unlocked variants, got ${variants.length}`);

  const visibleCount = variants.filter((v) => v.visible).length;
  console.log('7. Exactly 1 visible variant:', visibleCount === 1);
  if (visibleCount !== 1) throw new Error(`Expected exactly 1 visible variant, got ${visibleCount}`);

  // 5. Test switching to English after unlock
  console.log('8. Testing switch to English after unlock...');
  await page.click('.post-hero__lang-tag[data-target-lang="en"]');
  await page.waitForTimeout(300);

  const enVisible = await page.$eval('.article-translation-variant[data-lang="en"]', (el) => window.getComputedStyle(el).display !== 'none');
  const zhVisible = await page.$eval('.article-translation-variant[data-lang="zh-CN"]', (el) => window.getComputedStyle(el).display !== 'none');
  console.log(`   Switch results -> EN visible: ${enVisible}, ZH visible: ${zhVisible}`);
  if (!enVisible || zhVisible) throw new Error('Switching to English failed after unlock!');

  // 6. Test sessionStorage persistence on refresh
  console.log('9. Testing reload with sessionStorage persistence...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const reloadedVariants = await page.$$('.article-translation-variant');
  console.log('   Variants present after reload:', reloadedVariants.length);
  if (reloadedVariants.length !== 6) throw new Error('SessionStorage unlock persistence failed on reload!');

  console.log('\n🎉 ALL STATIC UNLOCK AND MULTILINGUAL CHECKS PASSED 100%!');
  await browser.close();
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
