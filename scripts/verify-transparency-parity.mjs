import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('scratch/transparency-audit');
fs.mkdirSync(outDir, { recursive: true });

const targetUrl = process.env.TEST_URL || 'http://127.0.0.1:4321/';
console.log(`Starting transparency parity verification on: ${targetUrl}`);

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

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Helper check functions
  const isTransparent = (val) => val === 'rgba(0, 0, 0, 0)' || val === 'transparent';
  const isNoFilter = (val) => !val || val === 'none';
  const isNoShadow = (val) => !val || val === 'none';

  // 1. Audit #footer-wrap and #footer baseline (MUST REMAIN INTACT & UNTOUCHED)
  const footerData = await page.evaluate(() => {
    const footer = document.querySelector('#footer');
    const footerWrap = document.querySelector('#footer-wrap');
    const shell = document.querySelector('.footer-main-shell');

    const fStyle = footer ? window.getComputedStyle(footer) : null;
    const wrapStyle = footerWrap ? window.getComputedStyle(footerWrap) : null;
    const shellStyle = shell ? window.getComputedStyle(shell) : null;

    return {
      footerBg: fStyle ? fStyle.backgroundImage : null,
      footerWrapBg: wrapStyle ? wrapStyle.backgroundColor : null,
      footerWrapFilter: wrapStyle ? (wrapStyle.backdropFilter || wrapStyle.webkitBackdropFilter) : null,
      footerWrapShadow: wrapStyle ? wrapStyle.boxShadow : null,
      footerWrapBorder: wrapStyle ? wrapStyle.borderWidth : null,
      shellBg: shellStyle ? shellStyle.backgroundColor : null,
      shellFilter: shellStyle ? (shellStyle.backdropFilter || shellStyle.webkitBackdropFilter) : null,
      shellBorder: shellStyle ? shellStyle.borderWidth : null,
      shellBoxShadow: shellStyle ? shellStyle.boxShadow : null
    };
  });

  console.log('Footer Data:', JSON.stringify(footerData, null, 2));
  assert.ok(footerData.footerBg, 'Footer background gradient must exist');
  assert.ok(footerData.footerBg.includes('gradient'), 'Footer background must be a gradient');
  assert.equal(footerData.footerWrapBg, 'rgba(0, 0, 0, 0)', '#footer-wrap MUST be transparent');
  assert.ok(isNoFilter(footerData.footerWrapFilter), '#footer-wrap MUST have no backdrop filter');
  assert.ok(isNoShadow(footerData.footerWrapShadow), '#footer-wrap MUST have no box shadow');
  assert.equal(footerData.shellBg, 'rgba(0, 0, 0, 0)', '.footer-main-shell MUST be transparent with no opaque gradient');
  assert.equal(footerData.shellBorder, '0px', '.footer-main-shell MUST have 0px border (no box frame)');
  assert.equal(footerData.shellBoxShadow, 'none', '.footer-main-shell MUST have no box shadow');

  // 2. Audit Target 1: Sticky Overview Card (class="card-widget card-feature-panel card-feature-panel--overview card-tag-cloud-panel is-sticky-active")
  const sidebarData = await page.evaluate(() => {
    const stickyBox = document.querySelector('.aside-sticky-box');
    const el = document.querySelector('.card-feature-panel--overview') || document.querySelector('#card-tag-cloud-overview');
    const tagItem = stickyBox ? stickyBox.querySelector('.tag-cloud-item') : null;
    const chipItem = stickyBox ? stickyBox.querySelector('.category-chip') : null;
    const webinfoItem = stickyBox ? stickyBox.querySelector('.webinfo-item') : null;

    const sbStyle = stickyBox ? window.getComputedStyle(stickyBox) : null;
    const s = el ? window.getComputedStyle(el) : null;
    const tagStyle = tagItem ? window.getComputedStyle(tagItem) : null;
    const chipStyle = chipItem ? window.getComputedStyle(chipItem) : null;
    const webinfoStyle = webinfoItem ? window.getComputedStyle(webinfoItem) : null;

    return {
      stickyBox: sbStyle ? {
        bg: sbStyle.backgroundColor,
        border: sbStyle.borderWidth,
        boxShadow: sbStyle.boxShadow
      } : null,
      card: s ? {
        className: el.className,
        bg: s.backgroundColor,
        backdropFilter: s.backdropFilter || s.webkitBackdropFilter,
        boxShadow: s.boxShadow,
        border: s.borderWidth
      } : null,
      tagBg: tagStyle ? tagStyle.backgroundColor : null,
      chipBg: chipStyle ? chipStyle.backgroundColor : null,
      webinfoBg: webinfoStyle ? webinfoStyle.backgroundColor : null
    };
  });

  console.log('Sidebar Overview Card Data:', JSON.stringify(sidebarData, null, 2));
  assert.ok(sidebarData.card, 'Overview card must exist');
  assert.equal(sidebarData.card.bg, 'rgba(0, 0, 0, 0)', 'Overview card MUST match #footer-wrap transparent material (rgba(0, 0, 0, 0))');
  assert.ok(isNoFilter(sidebarData.card.backdropFilter), 'Overview card MUST have no backdrop filter');
  assert.ok(isNoShadow(sidebarData.card.boxShadow), 'Overview card MUST have no box shadow');
  assert.equal(sidebarData.card.border, '0px', 'Overview card MUST have 0px border');
  assert.equal(sidebarData.stickyBox.bg, 'rgba(0, 0, 0, 0)', '.aside-sticky-box MUST be transparent');
  if (sidebarData.tagBg) assert.equal(sidebarData.tagBg, 'rgba(0, 0, 0, 0)', 'Tag items must be transparent');
  if (sidebarData.chipBg) assert.equal(sidebarData.chipBg, 'rgba(0, 0, 0, 0)', 'Category chips must be transparent');
  if (sidebarData.webinfoBg) assert.equal(sidebarData.webinfoBg, 'rgba(0, 0, 0, 0)', 'Webinfo items must be transparent');

  // 3. Audit Target 2: Post Card Content Container (class="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5")
  const postCardData = await page.evaluate(() => {
    const allCards = Array.from(document.querySelectorAll('.recent-post-item'));
    const targetCard = allCards.find(c => c.querySelector('[class*="justify-between"]') || c.querySelector('.p-3')) || allCards[0];
    const innerContent = targetCard ? targetCard.querySelector('[class*="justify-between"]') || targetCard.querySelector('.p-3') : null;

    const innerStyle = innerContent ? window.getComputedStyle(innerContent) : null;

    return {
      inner: innerStyle ? {
        className: innerContent.className,
        bg: innerStyle.backgroundColor,
        backdropFilter: innerStyle.backdropFilter || innerStyle.webkitBackdropFilter,
        boxShadow: innerStyle.boxShadow,
        borderTopWidth: innerStyle.borderTopWidth,
        borderTopStyle: innerStyle.borderTopStyle
      } : null
    };
  });

  console.log('Post Card Inner Data:', JSON.stringify(postCardData, null, 2));
  assert.ok(postCardData.inner, 'Post card inner container must exist');
  assert.equal(postCardData.inner.bg, 'rgba(0, 0, 0, 0)', 'Post card inner container MUST match #footer-wrap transparent material');
  assert.ok(isNoFilter(postCardData.inner.backdropFilter), 'Post card inner container MUST have no backdrop filter');
  assert.ok(isNoShadow(postCardData.inner.boxShadow), 'Post card inner container MUST have no box shadow');
  assert.ok(postCardData.inner.borderTopWidth === '0px' || postCardData.inner.borderTopStyle === 'none', 'Post card inner container MUST have no border-top divider');

  // 4. Audit Target 3: Home Pagination (class="theme-card home-pagination")
  const paginationData = await page.evaluate(() => {
    const nav = document.querySelector('#home-pagination') || document.querySelector('.home-pagination');
    if (!nav) return null;
    const navStyle = window.getComputedStyle(nav);

    return {
      navBg: navStyle.backgroundColor,
      navFilter: navStyle.backdropFilter || navStyle.webkitBackdropFilter,
      navBorder: navStyle.borderWidth,
      navBoxShadow: navStyle.boxShadow
    };
  });

  console.log('Home Pagination Data:', JSON.stringify(paginationData, null, 2));
  assert.ok(paginationData, '#home-pagination must exist');
  assert.equal(paginationData.navBg, 'rgba(0, 0, 0, 0)', 'Pagination container MUST match #footer-wrap transparent material');
  assert.ok(isNoFilter(paginationData.navFilter), 'Pagination container MUST have no backdrop filter');
  assert.equal(paginationData.navBorder, '0px', 'Pagination container MUST have 0px border');
  assert.ok(isNoShadow(paginationData.navBoxShadow), 'Pagination container MUST have no box shadow');

  // 5. Audit Target 4: #random-banner
  const randomBannerData = await page.evaluate(() => {
    const el = document.querySelector('#random-banner');
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    const before = window.getComputedStyle(el, '::before');
    return {
      bg: cs.backgroundColor,
      backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
      boxShadow: cs.boxShadow,
      border: cs.borderWidth,
      beforeDisplay: before.display,
      beforeContent: before.content
    };
  });

  console.log('Random Banner Data:', JSON.stringify(randomBannerData, null, 2));
  assert.ok(randomBannerData, '#random-banner must exist');
  assert.equal(randomBannerData.bg, 'rgba(0, 0, 0, 0)', '#random-banner MUST match #footer-wrap transparent material (rgba(0, 0, 0, 0))');
  assert.ok(isNoFilter(randomBannerData.backdropFilter), '#random-banner MUST have no backdrop filter');
  assert.ok(isNoShadow(randomBannerData.boxShadow), '#random-banner MUST have no box shadow');
  assert.ok(randomBannerData.beforeDisplay === 'none' || randomBannerData.beforeContent === 'none', '#random-banner::before opaque mask MUST be eliminated');

  // 6. Audit in Dark Mode
  console.log('\n--- Switching to Dark Mode ---');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(500);

  const darkAudit = await page.evaluate(() => {
    const getStyles = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        filter: cs.backdropFilter || cs.webkitBackdropFilter,
        shadow: cs.boxShadow
      };
    };

    return {
      footerWrap: getStyles('#footer-wrap'),
      stickyOverview: getStyles('.card-feature-panel--overview'),
      postCardInner: getStyles('.recent-post-item > div:last-child, .recent-post-info'),
      homePagination: getStyles('#home-pagination'),
      randomBanner: getStyles('#random-banner')
    };
  });

  console.log('Dark Mode Audit Data:', JSON.stringify(darkAudit, null, 2));
  assert.equal(darkAudit.footerWrap.bg, 'rgba(0, 0, 0, 0)', 'Dark mode: #footer-wrap must be transparent');
  assert.equal(darkAudit.stickyOverview.bg, 'rgba(0, 0, 0, 0)', 'Dark mode: Sticky overview must be transparent');
  assert.ok(isNoFilter(darkAudit.stickyOverview.filter), 'Dark mode: Sticky overview must have no filter');
  assert.equal(darkAudit.postCardInner.bg, 'rgba(0, 0, 0, 0)', 'Dark mode: Post card inner must be transparent');
  assert.equal(darkAudit.homePagination.bg, 'rgba(0, 0, 0, 0)', 'Dark mode: Home pagination must be transparent');
  assert.equal(darkAudit.randomBanner.bg, 'rgba(0, 0, 0, 0)', 'Dark mode: Random banner must be transparent');
  assert.ok(isNoFilter(darkAudit.randomBanner.filter), 'Dark mode: Random banner must have no filter');

  // Screenshots
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await page.screenshot({ path: path.join(outDir, 'light-verified.png') });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.screenshot({ path: path.join(outDir, 'dark-verified.png') });

  console.log('\n🎉 ALL TRANSPARENCY PARITY ASSERTIONS PASSED SUCCESSFULLY!');
  await browser.close();
}

run().catch(err => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
