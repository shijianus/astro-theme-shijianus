import { chromium } from 'playwright';
import assert from 'node:assert/strict';

async function runTest() {
  console.log('🚀 Starting Aside Title Icons & Category Icon Verification...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // 1. Check Post Page
  console.log('--- 1. Testing Post Page (/posts/readable-geek-interfaces/) ---');
  await page.goto('http://localhost:4321/posts/readable-geek-interfaces/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const postHeadlineIcons = await page.evaluate(() => {
    const results = {};
    // Recent posts
    const recentHl = document.querySelector('#card-recent-post .item-headline');
    if (recentHl) {
      const svg = recentHl.querySelector('svg');
      const textIcon = recentHl.querySelector('.aside-title-icon--text');
      const icon = svg || textIcon;
      const rect = icon ? icon.getBoundingClientRect() : null;
      results.recent = {
        tagName: icon?.tagName,
        hasTextIcon: !!textIcon,
        isSvg: !!svg,
        svgClass: svg?.getAttribute('class') || '',
        width: rect ? Math.round(rect.width) : 0,
        height: rect ? Math.round(rect.height) : 0,
      };
    }

    // Categories
    const catHl = document.querySelector('#card-categories .item-headline');
    if (catHl) {
      const svg = catHl.querySelector('svg');
      const rect = svg ? svg.getBoundingClientRect() : null;
      results.categories = {
        tagName: svg?.tagName,
        isSvg: !!svg,
        svgClass: svg?.getAttribute('class') || '',
        width: rect ? Math.round(rect.width) : 0,
        height: rect ? Math.round(rect.height) : 0,
      };
    }

    // TOC
    const tocHl = document.querySelector('#card-toc .item-headline');
    if (tocHl) {
      const svg = tocHl.querySelector('svg');
      const rect = svg ? svg.getBoundingClientRect() : null;
      results.toc = {
        tagName: svg?.tagName,
        isSvg: !!svg,
        svgClass: svg?.getAttribute('class') || '',
        width: rect ? Math.round(rect.width) : 0,
        height: rect ? Math.round(rect.height) : 0,
      };
    }

    return results;
  });

  console.log('Post Page Headlines Result:', postHeadlineIcons);

  // Assertions for Post Page
  assert.equal(postHeadlineIcons.recent.isSvg, true, 'Expected recent post icon to be an SVG element');
  assert.equal(postHeadlineIcons.recent.hasTextIcon, false, 'Expected recent post to NOT have .aside-title-icon--text');
  assert(postHeadlineIcons.recent.svgClass.includes('lucide-history'), 'Expected recent post icon to use lucide-history');
  assert.equal(postHeadlineIcons.recent.width, 18, `Expected recent post icon width 18, got ${postHeadlineIcons.recent.width}`);
  assert.equal(postHeadlineIcons.recent.height, 18, `Expected recent post icon height 18, got ${postHeadlineIcons.recent.height}`);

  assert.equal(postHeadlineIcons.categories.isSvg, true, 'Expected categories icon to be an SVG element');
  assert(postHeadlineIcons.categories.svgClass.includes('lucide-folder-open'), 'Expected categories icon to use lucide-folder-open');
  assert.equal(postHeadlineIcons.categories.width, 20, `Expected categories icon width 20, got ${postHeadlineIcons.categories.width}`);
  assert.equal(postHeadlineIcons.categories.height, 20, `Expected categories icon height 20, got ${postHeadlineIcons.categories.height}`);

  assert.equal(postHeadlineIcons.toc.isSvg, true, 'Expected TOC icon to be an SVG element');
  assert(postHeadlineIcons.toc.svgClass.includes('lucide-list-tree'), 'Expected TOC icon to use lucide-list-tree');
  assert.equal(postHeadlineIcons.toc.width, 18, `Expected TOC icon width 18, got ${postHeadlineIcons.toc.width}`);
  assert.equal(postHeadlineIcons.toc.height, 18, `Expected TOC icon height 18, got ${postHeadlineIcons.toc.height}`);

  console.log('✅ Post Page icon assertions passed!');

  // 2. Check Homepage
  console.log('--- 2. Testing Homepage (/) ---');
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const homeHeadlineIcons = await page.evaluate(() => {
    const results = {};
    const announcementHl = document.querySelector('.card-announcement .item-headline');
    if (announcementHl) {
      const svg = announcementHl.querySelector('svg');
      const rect = svg ? svg.getBoundingClientRect() : null;
      results.announcement = {
        isSvg: !!svg,
        width: rect ? Math.round(rect.width) : 0,
        height: rect ? Math.round(rect.height) : 0,
      };
    }

    const featureRecentHl = document.querySelector('.feature-panel-recent .item-headline');
    if (featureRecentHl) {
      const svg = featureRecentHl.querySelector('svg');
      const textIcon = featureRecentHl.querySelector('.aside-title-icon--text');
      const rect = svg ? svg.getBoundingClientRect() : null;
      results.featureRecent = {
        isSvg: !!svg,
        hasTextIcon: !!textIcon,
        svgClass: svg?.getAttribute('class') || '',
        width: rect ? Math.round(rect.width) : 0,
        height: rect ? Math.round(rect.height) : 0,
      };
    }
    return results;
  });

  console.log('Homepage Headlines Result:', homeHeadlineIcons);

  assert.equal(homeHeadlineIcons.featureRecent.isSvg, true, 'Expected homepage recent icon to be an SVG element');
  assert.equal(homeHeadlineIcons.featureRecent.hasTextIcon, false, 'Expected homepage recent to NOT have text icon');
  assert(homeHeadlineIcons.featureRecent.svgClass.includes('lucide-history'), 'Expected homepage recent icon to use lucide-history');
  assert.equal(homeHeadlineIcons.featureRecent.width, 18, `Expected homepage recent icon width 18, got ${homeHeadlineIcons.featureRecent.width}`);

  assert.equal(homeHeadlineIcons.announcement.isSvg, true, 'Expected homepage announcement icon to be an SVG element');
  assert.equal(homeHeadlineIcons.announcement.width, 18, `Expected homepage announcement icon width 18, got ${homeHeadlineIcons.announcement.width}`);

  console.log('✅ Homepage icon assertions passed!');

  // 3. Dark Mode Test
  console.log('--- 3. Testing Dark Mode ---');
  await page.goto('http://localhost:4321/posts/readable-geek-interfaces/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(300);

  const darkModeColors = await page.evaluate(() => {
    const recentSvg = document.querySelector('#card-recent-post .item-headline svg');
    const catSvg = document.querySelector('#card-categories .item-headline svg');
    const csRecent = recentSvg ? window.getComputedStyle(recentSvg) : null;
    const csCat = catSvg ? window.getComputedStyle(catSvg) : null;
    return {
      recentColor: csRecent?.color,
      catColor: csCat?.color,
    };
  });

  console.log('Dark mode colors:', darkModeColors);
  assert(darkModeColors.recentColor, 'Recent post icon has color in dark mode');
  assert(darkModeColors.catColor, 'Categories icon has color in dark mode');
  console.log('✅ Dark mode assertions passed!');

  // 4. Screenshots for visual verification
  await page.locator('#card-recent-post').screenshot({ path: 'scripts/verify-recent-post.png' });
  await page.locator('#card-categories').scrollIntoViewIfNeeded();
  await page.locator('#card-categories').screenshot({ path: 'scripts/verify-categories.png' });

  await browser.close();
  console.log('🎉 ALL PLAYWRIGHT ICON TESTS PASSED SUCCESSFULLY!');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
