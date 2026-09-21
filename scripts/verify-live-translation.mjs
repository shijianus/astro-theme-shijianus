import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const baseUrl = process.env.LIVE_URL || 'https://blog.epocanvas.com';
  const targetUrl = `${baseUrl.replace(/\/$/, '')}/posts/content-formats-and-markup-mastery/`;
  console.log(`Navigating to live production article: ${targetUrl} ...`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('#article-container', { state: 'attached', timeout: 15000 });
  await page.waitForTimeout(500);

  const variants = await page.$$eval('.article-translation-variant', (els) =>
    els.map((el) => ({
      lang: el.getAttribute('data-lang'),
      visible: window.getComputedStyle(el).display !== 'none',
      length: el.innerText.trim().length,
    }))
  );
  console.log(`Live Variants detected (${variants.length} total):`, variants);

  const buttons = await page.$$eval('.post-hero__lang-tag', (els) =>
    els.map((el) => ({
      lang: el.getAttribute('data-target-lang'),
      text: el.innerText.trim(),
      ariaPressed: el.getAttribute('aria-pressed'),
    }))
  );
  console.log(`Live Lang Buttons detected (${buttons.length} total):`, buttons);

  if (variants.length === 0) throw new Error('No live variants found!');
  const visibleVariants = variants.filter((v) => v.visible);
  if (visibleVariants.length !== 1) throw new Error('Expected exactly 1 visible variant, got ' + visibleVariants.length);

  // Test click switch to English
  const enBtn = await page.$('.post-hero__lang-tag[data-target-lang="en"]');
  if (enBtn) {
    console.log('Testing click switch to English (en)...');
    await enBtn.click();
    await page.waitForTimeout(400);
    const enVisible = await page.$eval(
      '.article-translation-variant[data-lang="en"]',
      (el) => window.getComputedStyle(el).display !== 'none'
    );
    const zhVisible = await page.$eval(
      '.article-translation-variant[data-lang="zh-CN"]',
      (el) => window.getComputedStyle(el).display !== 'none'
    );
    console.log(`Switch results -> EN visible: ${enVisible}, ZH visible: ${zhVisible}`);
    if (!enVisible || zhVisible) throw new Error('Variant visibility failed after switch to EN!');
    
    const ariaPressedEn = await enBtn.getAttribute('aria-pressed');
    console.log(`EN button aria-pressed after click: ${ariaPressedEn}`);
    if (ariaPressedEn !== 'true') throw new Error('aria-pressed not updated to true!');
  }

  // Test click back to zh-CN
  const zhBtn = await page.$('.post-hero__lang-tag[data-target-lang="zh-CN"]');
  if (zhBtn) {
    console.log('Testing click switch back to zh-CN...');
    await zhBtn.click();
    await page.waitForTimeout(400);
    const zhVisible = await page.$eval(
      '.article-translation-variant[data-lang="zh-CN"]',
      (el) => window.getComputedStyle(el).display !== 'none'
    );
    console.log(`Switch back -> ZH visible: ${zhVisible}`);
    if (!zhVisible) throw new Error('ZH variant not visible after switch back!');
  }

  console.log('\n🎉 Live production article translation audit 100% PASSED!');
  await browser.close();
}

main().catch((err) => {
  console.error('❌ Live production test failed:', err);
  process.exit(1);
});
