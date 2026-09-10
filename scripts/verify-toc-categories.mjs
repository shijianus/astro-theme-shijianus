import { chromium } from 'playwright';
import assert from 'node:assert/strict';

async function runVerification() {
  console.log('🚀 Starting TOC & Category i18n & Layout Verification...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const targetUrl = 'http://127.0.0.1:4321/posts/markdown-syntax-mastery/';
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Verify .toc-depth-btn is completely removed from #card-toc
  const tocDepthBtnCount = await page.locator('#toc-depth-btn').count();
  console.log(`1. #toc-depth-btn count: ${tocDepthBtnCount} (expected 0)`);
  assert.equal(tocDepthBtnCount, 0, 'Expected #toc-depth-btn to be removed from DOM');

  // Verify #mobile-toc-button exists in ThemeDock
  const mobileTocBtn = page.locator('#mobile-toc-button');
  await assert.doesNotReject(async () => {
    await mobileTocBtn.waitFor({ state: 'attached', timeout: 3000 });
  }, 'Expected #mobile-toc-button to exist in ThemeDock');
  console.log('✅ #mobile-toc-button exists in quick dock');

  // 2. Verify TOC Headline in Chinese (single line guarantee)
  const tocHeadlineZhBox = await page.locator('#card-toc .item-headline').boundingBox();
  const tocHeadlineZhText = await page.locator('#card-toc .item-headline').innerText();
  console.log(`2. TOC Headline (ZH): "${tocHeadlineZhText.replace(/\n/g, ' ')}" | Height: ${tocHeadlineZhBox.height}px`);
  assert(tocHeadlineZhText.includes('文章目录'), 'Expected TOC headline to include "文章目录" in ZH');
  assert(tocHeadlineZhBox.height <= 36, `Expected TOC headline height <= 36px (single line), got ${tocHeadlineZhBox.height}px`);
  console.log('✅ TOC Headline in ZH is strictly 1 line');

  // 3. Verify Categories in Chinese
  const catItemsZh = await page.locator('#card-categories .card-category-list-item').evaluateAll(items =>
    items.map(el => ({
      text: el.innerText.replace(/\n/g, ' ').trim(),
      rect: el.getBoundingClientRect()
    }))
  );
  console.log('3. Categories items (ZH):', catItemsZh.map(c => c.text));
  const firstCatText = catItemsZh[0]?.text || '';
  assert(firstCatText.startsWith('示例'), `Expected first category to be "示例", got "${firstCatText}"`);
  assert(!firstCatText.includes('Examples'), `Expected "Examples" to NOT appear in Chinese category card, got "${firstCatText}"`);
  
  // Verify sequential 2-column grid in ZH:
  // Item 0 and Item 1 must have the exact same top (Row 1)
  assert.equal(catItemsZh[0].rect.top, catItemsZh[1].rect.top, 'Expected Item 0 and Item 1 to be on Row 1 side-by-side');
  // Item 2 and Item 3 must have the exact same top (Row 2)
  assert.equal(catItemsZh[2].rect.top, catItemsZh[3].rect.top, 'Expected Item 2 and Item 3 to be on Row 2 side-by-side');
  console.log('✅ Categories items in ZH sequential 2-column grid verified');

  // 4. Switch to English locale
  console.log('Switching to English locale...');
  await page.evaluate(() => {
    window.__SHIJIANUS_LOCALE_RUNTIME__?.applyLocaleVariant('en');
  });
  await page.waitForTimeout(1000);

  // 5. Verify TOC Headline in English (single line guarantee with "CONTENTS")
  const tocHeadlineEnBox = await page.locator('#card-toc .item-headline').boundingBox();
  const tocHeadlineEnText = await page.locator('#card-toc .item-headline').innerText();
  console.log(`5. TOC Headline (EN): "${tocHeadlineEnText.replace(/\n/g, ' ')}" | Height: ${tocHeadlineEnBox.height}px`);
  assert(tocHeadlineEnText.includes('CONTENTS'), `Expected TOC headline to include "CONTENTS", got "${tocHeadlineEnText}"`);
  assert(tocHeadlineEnBox.height <= 36, `Expected TOC headline height <= 36px (strictly 1 line in EN), got ${tocHeadlineEnBox.height}px`);
  console.log('✅ TOC Headline in EN is strictly 1 line with "CONTENTS"');

  // 6. Verify Categories in English
  const catItemsEn = await page.locator('#card-categories .card-category-list-item').evaluateAll(items =>
    items.map(el => ({
      text: el.innerText.replace(/\n/g, ' ').trim(),
      rect: el.getBoundingClientRect()
    }))
  );
  console.log('6. Categories items (EN):', catItemsEn.map(c => c.text));
  const firstCatEnText = catItemsEn[0]?.text || '';
  assert(firstCatEnText.startsWith('Examples'), `Expected first category in EN to be "Examples", got "${firstCatEnText}"`);
  
  // CRITICAL CHECK: Row 1 right side must NOT be empty in English!
  // Item 0 (Examples) and Item 1 (Frontend) must be side-by-side on Row 1!
  assert.equal(catItemsEn[0].rect.top, catItemsEn[1].rect.top, `Expected Item 0 (${catItemsEn[0].text}) and Item 1 (${catItemsEn[1].text}) to be on the same row!`);
  assert.equal(catItemsEn[2].rect.top, catItemsEn[3].rect.top, `Expected Item 2 (${catItemsEn[2].text}) and Item 3 (${catItemsEn[3].text}) to be on Row 2 side-by-side!`);
  console.log('✅ Categories items in EN sequential 2-column grid verified: Row 1 right is filled, no empty gaps!');

  // 7. Verify ThemeDock #mobile-toc-button cycling depth on desktop
  console.log('Testing #mobile-toc-button depth cycling on desktop...');
  const initialDepth = await page.locator('#card-toc').getAttribute('data-depth-filter');
  console.log(`Initial depth: ${initialDepth}`);
  
  await page.evaluate(() => {
    document.getElementById('mobile-toc-button')?.click();
  });
  await page.waitForTimeout(500);
  const nextDepth = await page.locator('#card-toc').getAttribute('data-depth-filter');
  console.log(`Depth after click: ${nextDepth}`);
  assert.notEqual(initialDepth, nextDepth, 'Expected #card-toc depth to change after clicking #mobile-toc-button');
  console.log('✅ #mobile-toc-button successfully cycles TOC depth on desktop');

  // 8. Verify Callout Alert titles on content formats page
  console.log('Navigating to content formats page to check callouts...');
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const alertTitlesZh = await page.locator('.admonition-title, .markdown-alert-title').allInnerTexts();
  console.log('Sample alert titles (ZH):', alertTitlesZh.slice(0, 5));
  for (const title of alertTitlesZh) {
    if (title.includes('注意') || title.includes('提示') || title.includes('示例')) {
      assert(!title.includes('(Note)') && !title.includes('(Tip)') && !title.includes('(Example)'),
        `Expected alert title "${title}" to not contain redundant English parentheticals in ZH`);
    }
  }
  console.log('✅ Callout alert titles in ZH are clean Chinese');

  await browser.close();
  console.log('🎉 ALL PLAYWRIGHT VERIFICATIONS PASSED PERFECTLY!');
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
