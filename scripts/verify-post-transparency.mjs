import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('scratch/post-transparency-audit');
fs.mkdirSync(outDir, { recursive: true });

const targetUrl = process.env.TEST_URL || 'http://127.0.0.1:4399/';
const postPath = 'posts/content-formats-and-markup-mastery/';
const postUrl = new URL(postPath, targetUrl).href;

console.log(`================================================================`);
console.log(`Starting Post Page Transparency Audit on: ${postUrl}`);
console.log(`================================================================\n`);

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[Browser Console Error]`, msg.text());
  });

  await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  const isTranslucent = (val) => {
    if (!val || val === 'transparent' || val === 'rgba(0, 0, 0, 0)') return false;
    if (val.startsWith('rgba(')) {
      const match = val.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
      if (match) {
        const alpha = parseFloat(match[1]);
        return alpha >= 0.05 && alpha <= 0.70;
      }
    }
    return val.startsWith('rgba(');
  };
  const hasBorder = (val) => val === '1px' || (parseFloat(val) >= 1);

  // 1. Audit class="page-main" on post page (Light mode)
  console.log('[*] 1. Auditing class="page-main" and inner #post on post page (Light Mode)...');
  const pageMainData = await page.evaluate(() => {
    const pm = document.querySelector('.page-main');
    const post = document.querySelector('#post');
    const csPm = pm ? window.getComputedStyle(pm) : null;
    const csPost = post ? window.getComputedStyle(post) : null;
    return {
      pmBg: csPm?.backgroundColor,
      pmFilter: csPm?.backdropFilter || csPm?.webkitBackdropFilter,
      pmBorder: csPm?.borderWidth,
      postBg: csPost?.backgroundColor,
      postFilter: csPost?.backdropFilter || csPost?.webkitBackdropFilter,
      postBorder: csPost?.borderWidth
    };
  });
  console.log('Page Main Data (Light):', JSON.stringify(pageMainData, null, 2));
  assert.ok(isTranslucent(pageMainData.pmBg), 'class="page-main" MUST have translucent background');
  assert.equal(pageMainData.pmFilter, 'none', 'class="page-main" MUST have zero blur (none) for starry background visibility');
  assert.ok(hasBorder(pageMainData.pmBorder), 'class="page-main" MUST have 1px border');
  assert.equal(pageMainData.postBg, 'rgba(0, 0, 0, 0)', 'Inner #post MUST be transparent to avoid double card');
  assert.equal(pageMainData.postFilter, 'none', 'Inner #post MUST have zero blur');
  assert.equal(pageMainData.postBorder, '0px', 'Inner #post MUST have 0px border to prevent card nesting');
  console.log('[✅ PASS] class="page-main" translucent and clean.\n');

  // 2. Audit class="aside-sticky-box" on post page (Light mode)
  console.log('[*] 2. Auditing class="aside-sticky-box" on post page (Light Mode)...');
  const stickyData = await page.evaluate(() => {
    const firstSticky = document.querySelector('.aside-sticky-box');
    const tocBox = document.querySelector('#aside-sticky-box-toc');
    const recentBox = document.querySelector('#aside-sticky-box-recent');
    const getStyle = (el) => {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        filter: s.backdropFilter || s.webkitBackdropFilter,
        border: s.borderWidth
      };
    };
    return {
      firstSticky: getStyle(firstSticky),
      tocBox: getStyle(tocBox),
      recentBox: getStyle(recentBox)
    };
  });
  console.log('Sticky Boxes Data (Light):', JSON.stringify(stickyData, null, 2));
  assert.ok(isTranslucent(stickyData.firstSticky.bg), 'First .aside-sticky-box MUST have translucent background');
  assert.equal(stickyData.firstSticky.filter, 'none', 'First .aside-sticky-box MUST have zero blur');
  assert.ok(hasBorder(stickyData.firstSticky.border), 'First .aside-sticky-box MUST have 1px border');
  assert.ok(isTranslucent(stickyData.recentBox.bg), '#aside-sticky-box-recent MUST have translucent background');
  assert.equal(stickyData.recentBox.filter, 'none', '#aside-sticky-box-recent MUST have zero blur');
  assert.ok(hasBorder(stickyData.recentBox.border), '#aside-sticky-box-recent MUST have 1px border');
  console.log('[✅ PASS] class="aside-sticky-box" translucent and zero-blur.\n');

  // 3. Audit class="card-widget card-categories" on post page (Light mode)
  console.log('[*] 3. Auditing class="card-widget card-categories" on post page (Light Mode)...');
  const catData = await page.evaluate(() => {
    const el = document.querySelector('.card-widget.card-categories');
    if (!el) return null;
    const s = window.getComputedStyle(el);
    return {
      bg: s.backgroundColor,
      filter: s.backdropFilter || s.webkitBackdropFilter,
      border: s.borderWidth,
      borderRadius: s.borderRadius
    };
  });
  console.log('Card Categories Data (Light):', JSON.stringify(catData, null, 2));
  assert.ok(catData, '.card-widget.card-categories must exist');
  assert.ok(isTranslucent(catData.bg), '.card-widget.card-categories MUST have translucent background');
  assert.equal(catData.filter, 'none', '.card-widget.card-categories MUST have zero blur');
  assert.ok(hasBorder(catData.border), '.card-widget.card-categories MUST have 1px border');
  console.log('[✅ PASS] class="card-widget card-categories" translucent and zero-blur.\n');

  // 4. Audit Dark Mode
  console.log('[*] 4. Auditing Dark Mode on post page...');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(500);

  const darkData = await page.evaluate(() => {
    const getS = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        filter: s.backdropFilter || s.webkitBackdropFilter,
        border: s.borderWidth
      };
    };
    return {
      pm: getS('.page-main'),
      firstSticky: getS('.aside-sticky-box'),
      recentBox: getS('#aside-sticky-box-recent'),
      categories: getS('.card-widget.card-categories')
    };
  });
  console.log('Dark Mode Data:', JSON.stringify(darkData, null, 2));
  assert.ok(isTranslucent(darkData.pm.bg), 'Dark mode: .page-main MUST have translucent dark background');
  assert.equal(darkData.pm.filter, 'none', 'Dark mode: .page-main MUST have zero blur');
  assert.ok(hasBorder(darkData.pm.border), 'Dark mode: .page-main MUST have 1px border');

  assert.ok(isTranslucent(darkData.firstSticky.bg), 'Dark mode: .aside-sticky-box MUST have translucent dark background');
  assert.equal(darkData.firstSticky.filter, 'none', 'Dark mode: .aside-sticky-box MUST have zero blur');
  assert.ok(hasBorder(darkData.firstSticky.border), 'Dark mode: .aside-sticky-box MUST have 1px border');

  assert.ok(isTranslucent(darkData.categories.bg), 'Dark mode: .card-widget.card-categories MUST have translucent dark background');
  assert.equal(darkData.categories.filter, 'none', 'Dark mode: .card-widget.card-categories MUST have zero blur');
  assert.ok(hasBorder(darkData.categories.border), 'Dark mode: .card-widget.card-categories MUST have 1px border');
  console.log('[✅ PASS] Dark Mode on post page verified.\n');

  // Screenshots
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await page.screenshot({ path: path.join(outDir, 'post-light-verified.png') });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.screenshot({ path: path.join(outDir, 'post-dark-verified.png') });

  await browser.close();
  console.log(`================================================================`);
  console.log(`🎉 ALL POST PAGE TRANSPARENCY AUDIT ASSERTIONS PASSED (100%)!`);
  console.log(`================================================================`);
}

run().catch(err => {
  console.error('\n❌ Post page verification failed:', err);
  process.exit(1);
});
