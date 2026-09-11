import { chromium } from 'playwright';
import assert from 'node:assert/strict';

async function runLiveVerification() {
  console.log('🌐 Starting Production E2E Verification on https://blog.epocanvas.com ...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const targetUrl = 'https://blog.epocanvas.com/posts/markdown-syntax-mastery/';
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Verify .toc-depth-btn is completely removed from #card-toc
  const tocDepthBtnCount = await page.locator('#toc-depth-btn').count();
  console.log(`1. Live #toc-depth-btn count: ${tocDepthBtnCount} (expected 0)`);
  assert.equal(tocDepthBtnCount, 0, 'Expected #toc-depth-btn to be absent from production DOM');

  // Verify #mobile-toc-button exists in ThemeDock
  const mobileTocBtn = page.locator('#mobile-toc-button');
  await assert.doesNotReject(async () => {
    await mobileTocBtn.waitFor({ state: 'attached', timeout: 5000 });
  }, 'Expected #mobile-toc-button to exist in ThemeDock on production');
  console.log('✅ #mobile-toc-button verified on production quick dock');

  // 2. Verify TOC Headline in Chinese (single line guarantee)
  const tocHeadlineZhBox = await page.locator('#card-toc .item-headline').boundingBox();
  const tocHeadlineZhText = await page.locator('#card-toc .item-headline').innerText();
  console.log(`2. Live TOC Headline (ZH): "${tocHeadlineZhText.replace(/\n/g, ' ')}" | Height: ${tocHeadlineZhBox.height}px`);
  assert(tocHeadlineZhText.includes('文章目录'), 'Expected TOC headline to include "文章目录" in ZH');
  assert(tocHeadlineZhBox.height >= 20 && tocHeadlineZhBox.height <= 36, `Expected TOC headline height between 20px and 36px (strictly 1 line), got ${tocHeadlineZhBox.height}px`);
  console.log('✅ Live TOC Headline in ZH is strictly 1 line');

  // 3. Verify Categories in Chinese
  const catItemsZh = await page.locator('#card-categories .card-category-list-item').evaluateAll(items =>
    items.map(el => ({
      text: el.innerText.replace(/\n/g, ' ').trim(),
      rect: el.getBoundingClientRect()
    }))
  );
  console.log('3. Live Categories items (ZH):', catItemsZh.map(c => c.text));
  const firstCatText = catItemsZh[0]?.text || '';
  assert(firstCatText.startsWith('示例'), `Expected first category to be "示例", got "${firstCatText}"`);
  assert(!firstCatText.includes('Examples'), `Expected "Examples" to NOT appear in Chinese category card, got "${firstCatText}"`);
  
  // Verify sequential 2-column grid in ZH:
  assert.equal(catItemsZh[0].rect.top, catItemsZh[1].rect.top, 'Expected Item 0 and Item 1 to be on Row 1 side-by-side');
  assert.equal(catItemsZh[2].rect.top, catItemsZh[3].rect.top, 'Expected Item 2 and Item 3 to be on Row 2 side-by-side');
  console.log('✅ Live Categories in ZH: sequential 2-column grid verified');

  // 4. Switch to English locale
  console.log('Switching to English locale on production...');
  await page.evaluate(() => {
    window.__SHIJIANUS_LOCALE_RUNTIME__?.applyLocaleVariant('en');
  });
  await page.waitForTimeout(1500);

  // 5. Verify TOC Headline in English (single line guarantee with "CONTENTS")
  const tocHeadlineEnBox = await page.locator('#card-toc .item-headline').boundingBox();
  const tocHeadlineEnText = await page.locator('#card-toc .item-headline').innerText();
  console.log(`5. Live TOC Headline (EN): "${tocHeadlineEnText.replace(/\n/g, ' ')}" | Height: ${tocHeadlineEnBox.height}px`);
  assert(tocHeadlineEnText.includes('CONTENTS'), `Expected TOC headline to include "CONTENTS", got "${tocHeadlineEnText}"`);
  assert(tocHeadlineEnBox.height >= 20 && tocHeadlineEnBox.height <= 36, `Expected TOC headline height between 20px and 36px (strictly 1 line in EN), got ${tocHeadlineEnBox.height}px`);
  console.log('✅ Live TOC Headline in EN is strictly 1 line with "CONTENTS"');

  // 6. Verify Categories in English on production
  const catItemsEn = await page.locator('#card-categories .card-category-list-item').evaluateAll(items =>
    items.map(el => ({
      text: el.innerText.replace(/\n/g, ' ').trim(),
      rect: el.getBoundingClientRect()
    }))
  );
  console.log('6. Live Categories items (EN):', catItemsEn.map(c => c.text));
  const firstCatEnText = catItemsEn[0]?.text || '';
  assert(firstCatEnText.startsWith('Examples'), `Expected first category in EN to be "Examples", got "${firstCatEnText}"`);
  
  // Verify sequential 2-column grid without gaps in English
  assert.equal(catItemsEn[0].rect.top, catItemsEn[1].rect.top, `Expected Item 0 (${catItemsEn[0].text}) and Item 1 (${catItemsEn[1].text}) to be on the same row!`);
  assert.equal(catItemsEn[2].rect.top, catItemsEn[3].rect.top, `Expected Item 2 (${catItemsEn[2].text}) and Item 3 (${catItemsEn[3].text}) to be on Row 2 side-by-side!`);
  console.log('✅ Live Categories in EN: sequential 2-column grid verified, NO empty holes!');

  // 7. Test ThemeDock #mobile-toc-button cycling depth on desktop
  console.log('Testing #mobile-toc-button depth cycling on live production...');
  const initialDepth = await page.locator('#card-toc').getAttribute('data-depth-filter');
  console.log(`Initial depth: ${initialDepth}`);
  
  await page.evaluate(() => {
    document.getElementById('mobile-toc-button')?.click();
  });
  await page.waitForTimeout(500);
  const nextDepth = await page.locator('#card-toc').getAttribute('data-depth-filter');
  console.log(`Depth after click: ${nextDepth}`);
  assert.notEqual(initialDepth, nextDepth, 'Expected #card-toc depth to change after clicking #mobile-toc-button');
  console.log('✅ Live #mobile-toc-button successfully cycles TOC depth on desktop');

  await browser.close();
  console.log('🌟 PRODUCTION LIVE PLAYWRIGHT VERIFICATION 100% PASSED!');
}

runLiveVerification().catch(err => {
  console.error('❌ Live verification failed:', err);
  process.exit(1);
});
