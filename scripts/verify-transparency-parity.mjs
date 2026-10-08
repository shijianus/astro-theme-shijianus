import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('scratch/anzhiyu-palette-audit');
fs.mkdirSync(outDir, { recursive: true });

const targetUrl = process.env.TEST_URL || 'http://127.0.0.1:4321/';
console.log(`================================================================`);
console.log(`Starting Anzhiyu Palette & Region Division Verification on: ${targetUrl}`);
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

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Helper check functions
  const isTranslucentNotColorless = (val) => {
    if (!val || val === 'transparent' || val === 'rgba(0, 0, 0, 0)') return false;
    // Check that it contains rgba with alpha < 1, or is colored
    if (val.startsWith('rgba(')) {
      const match = val.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
      if (match) {
        const alpha = parseFloat(match[1]);
        // Strict assertion for "有色透明": must have visible tint (> 0.15) but must be genuinely transparent (<= 0.70)
        return alpha >= 0.15 && alpha <= 0.70;
      }
    }
    return val.startsWith('rgba(') || val.startsWith('rgb(');
  };
  const hasFilter = (val) => Boolean(val && val !== 'none');
  const hasBorder = (val) => val === '1px' || (parseFloat(val) >= 1);

  // 1. Audit #footer-wrap and #footer baseline (MUST REMAIN INTACT & UNTOUCHED)
  console.log('[*] 1. Auditing #footer and #footer-wrap (Baseline Pristine State)...');
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
  assert.equal(footerData.shellBg, 'rgba(0, 0, 0, 0)', '.footer-main-shell MUST be transparent');
  assert.equal(footerData.shellBorder, '0px', '.footer-main-shell MUST have 0px border');
  console.log('[✅ PASS] #footer and #footer-wrap intact and untouched.\n');

  // 2. Audit #random-banner & #random-hover: Translucent color template & hover plate
  console.log('[*] 2. Auditing #random-banner & #random-hover color block templates...');
  const randomBannerInitial = await page.evaluate(() => {
    const el = document.querySelector('#random-banner');
    const hoverEl = document.querySelector('#random-hover');
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    const hcs = hoverEl ? window.getComputedStyle(hoverEl) : null;

    return {
      bg: cs.backgroundColor,
      backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
      border: cs.borderWidth,
      borderRadius: cs.borderRadius,
      hoverOpacity: hcs ? hcs.opacity : null,
      hoverBg: hcs ? hcs.backgroundImage : null
    };
  });

  console.log('Random Banner (Initial):', JSON.stringify(randomBannerInitial, null, 2));
  assert.ok(randomBannerInitial, '#random-banner must exist');
  assert.ok(isTranslucentNotColorless(randomBannerInitial.bg), '#random-banner MUST have translucent card background (NOT rgba(0, 0, 0, 0))');
  assert.ok(hasFilter(randomBannerInitial.backdropFilter), '#random-banner MUST have frosted glass backdropFilter');
  assert.ok(hasBorder(randomBannerInitial.border), '#random-banner MUST have border for region demarcation');
  assert.equal(randomBannerInitial.hoverOpacity, '0', '#random-hover must be hidden (opacity: 0) before hover');

  // Hover #random-banner and check #random-hover
  console.log('Hovering #random-banner...');
  await page.hover('#random-banner');
  await page.waitForTimeout(400);

  const randomBannerHovered = await page.evaluate(() => {
    const hoverEl = document.querySelector('#random-hover');
    if (!hoverEl) return null;
    const cs = window.getComputedStyle(hoverEl);
    return {
      opacity: cs.opacity,
      bg: cs.backgroundImage || cs.backgroundColor,
      filter: cs.backdropFilter || cs.webkitBackdropFilter,
      color: cs.color
    };
  });

  console.log('Random Hover (Active):', JSON.stringify(randomBannerHovered, null, 2));
  assert.ok(randomBannerHovered, '#random-hover must exist');
  assert.ok(parseFloat(randomBannerHovered.opacity) >= 0.9, `#random-hover MUST have opacity >= 0.9 on hover (got ${randomBannerHovered.opacity})`);
  assert.ok(randomBannerHovered.bg.includes('gradient'), '#random-hover MUST have theme gradient background on hover');
  console.log('[✅ PASS] #random-banner and #random-hover color block templates verified.\n');

  // Move mouse away
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);

  // 3. Audit .aside-sticky-box & Sticky Overview Card
  console.log('[*] 3. Auditing .aside-sticky-box and sticky overview card widgets...');
  const stickyData = await page.evaluate(() => {
    const stickyBox = document.getElementById('aside-sticky-box-overview') || document.querySelector('.aside-sticky-box');
    const el = stickyBox || document.querySelector('.card-feature-panel--overview') || document.querySelector('#card-tag-cloud-overview');
    const tagItem = stickyBox ? stickyBox.querySelector('.tag-cloud-item') : null;
    const chipItem = stickyBox ? stickyBox.querySelector('.category-chip') : null;
    const webinfoItem = stickyBox ? stickyBox.querySelector('.webinfo-item') : null;

    const s = el ? window.getComputedStyle(el) : null;
    const tagStyle = tagItem ? window.getComputedStyle(tagItem) : null;
    const chipStyle = chipItem ? window.getComputedStyle(chipItem) : null;
    const webinfoStyle = webinfoItem ? window.getComputedStyle(webinfoItem) : null;

    return {
      card: s ? {
        bg: s.backgroundColor,
        backdropFilter: s.backdropFilter || s.webkitBackdropFilter,
        boxShadow: s.boxShadow,
        border: s.borderWidth,
        borderRadius: s.borderRadius
      } : null,
      tagBg: tagStyle ? tagStyle.backgroundColor : null,
      tagBorder: tagStyle ? tagStyle.borderWidth : null,
      chipBg: chipStyle ? chipStyle.backgroundColor : null,
      chipBorder: chipStyle ? chipStyle.borderWidth : null,
      webinfoBg: webinfoStyle ? webinfoStyle.backgroundColor : null,
      webinfoBorder: webinfoStyle ? webinfoStyle.borderWidth : null
    };
  });

  console.log('Sticky Overview Card Data:', JSON.stringify(stickyData, null, 2));
  assert.ok(stickyData.card, 'Sticky overview card must exist');
  assert.ok(isTranslucentNotColorless(stickyData.card.bg), 'Sticky card MUST have translucent card background (NOT rgba(0, 0, 0, 0))');
  assert.ok(hasFilter(stickyData.card.backdropFilter), 'Sticky card MUST have frosted backdropFilter');
  assert.ok(hasBorder(stickyData.card.border), 'Sticky card MUST have 1px border for region demarcation');
  if (stickyData.tagBg) assert.ok(isTranslucentNotColorless(stickyData.tagBg), 'Tag item must have sub-color block background');
  if (stickyData.chipBg) assert.ok(isTranslucentNotColorless(stickyData.chipBg), 'Category chip must have sub-color block background');
  if (stickyData.webinfoBg) assert.ok(isTranslucentNotColorless(stickyData.webinfoBg), 'Webinfo item must have sub-color block background');
  console.log('[✅ PASS] .aside-sticky-box and sub-elements color blocks verified.\n');

  // 4. Audit #home-pagination: Card template with numbers and controls
  console.log('[*] 4. Auditing #home-pagination color block template...');
  const paginationData = await page.evaluate(() => {
    const nav = document.querySelector('#home-pagination') || document.querySelector('.home-pagination');
    if (!nav) return null;
    const navStyle = window.getComputedStyle(nav);
    const badge = nav.querySelector('.home-pagination__badge');
    const num = nav.querySelector('.home-pagination__num');
    const currentNum = nav.querySelector('.home-pagination__num.is-current');

    const bStyle = badge ? window.getComputedStyle(badge) : null;
    const nStyle = num ? window.getComputedStyle(num) : null;
    const cStyle = currentNum ? window.getComputedStyle(currentNum) : null;

    return {
      navBg: navStyle.backgroundColor,
      navFilter: navStyle.backdropFilter || navStyle.webkitBackdropFilter,
      navBorder: navStyle.borderWidth,
      navBorderRadius: navStyle.borderRadius,
      badgeBg: bStyle ? bStyle.backgroundColor : null,
      numBg: nStyle ? nStyle.backgroundColor : null,
      currentNumBg: cStyle ? cStyle.backgroundColor : null
    };
  });

  console.log('Home Pagination Data:', JSON.stringify(paginationData, null, 2));
  assert.ok(paginationData, '#home-pagination must exist');
  assert.ok(isTranslucentNotColorless(paginationData.navBg), '#home-pagination MUST have translucent card background (NOT rgba(0, 0, 0, 0))');
  assert.ok(hasFilter(paginationData.navFilter), '#home-pagination MUST have frosted backdropFilter');
  assert.ok(hasBorder(paginationData.navBorder), '#home-pagination MUST have 1px border for region demarcation');
  console.log('[✅ PASS] #home-pagination color block template verified.\n');

  // 5. Audit #category-bar: Translucent Frosted Category Bar
  console.log('[*] 5. Auditing #category-bar...');
  const categoryBarData = await page.evaluate(() => {
    const el = document.querySelector('#category-bar') || document.querySelector('.category-bar');
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    return {
      bg: cs.backgroundColor,
      filter: cs.backdropFilter || cs.webkitBackdropFilter,
      border: cs.borderWidth
    };
  });

  if (categoryBarData) {
    console.log('Category Bar Data:', JSON.stringify(categoryBarData, null, 2));
    assert.ok(isTranslucentNotColorless(categoryBarData.bg), '#category-bar MUST have translucent background');
    assert.ok(hasFilter(categoryBarData.filter), '#category-bar MUST have frosted filter');
    assert.ok(hasBorder(categoryBarData.border), '#category-bar MUST have 1px border');
    console.log('[✅ PASS] #category-bar verified.\n');
  }

  // 6. Audit Post Card Inner Content (Zero nested double-box frame)
  console.log('[*] 6. Auditing post card inner content (Clean single card, zero double nesting)...');
  const postCardData = await page.evaluate(() => {
    const allCards = Array.from(document.querySelectorAll('.recent-post-item'));
    const targetCard = allCards.find(c => c.querySelector('[class*="justify-between"]') || c.querySelector('.p-3')) || allCards[0];
    const innerContent = targetCard ? targetCard.querySelector('[class*="justify-between"]') || targetCard.querySelector('.p-3') : null;
    const cardStyle = targetCard ? window.getComputedStyle(targetCard) : null;
    const innerStyle = innerContent ? window.getComputedStyle(innerContent) : null;

    return {
      cardBg: cardStyle ? cardStyle.backgroundColor : null,
      cardBorder: cardStyle ? cardStyle.borderWidth : null,
      innerBg: innerStyle ? innerStyle.backgroundColor : null,
      innerBorderTop: innerStyle ? innerStyle.borderTopWidth : null
    };
  });

  console.log('Post Card Data:', JSON.stringify(postCardData, null, 2));
  assert.ok(isTranslucentNotColorless(postCardData.cardBg), 'Parent post card MUST have translucent card background');
  assert.equal(postCardData.innerBg, 'rgba(0, 0, 0, 0)', 'Inner post content container MUST be seamless transparent to avoid double card');
  console.log('[✅ PASS] Post card inner container seamless and clean.\n');

  // 7. Audit Dark Mode
  console.log('[*] 7. Auditing Dark Mode Palette...');
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
        border: cs.borderWidth
      };
    };

    return {
      footerWrap: getStyles('#footer-wrap'),
      randomBanner: getStyles('#random-banner'),
      stickyOverview: getStyles('#aside-sticky-box-overview, .card-feature-panel--overview, #card-tag-cloud-overview'),
      homePagination: getStyles('#home-pagination')
    };
  });

  console.log('Dark Mode Audit Data:', JSON.stringify(darkAudit, null, 2));
  assert.equal(darkAudit.footerWrap.bg, 'rgba(0, 0, 0, 0)', 'Dark mode: #footer-wrap remains transparent');
  assert.ok(isTranslucentNotColorless(darkAudit.randomBanner.bg), 'Dark mode: #random-banner has translucent dark background');
  assert.ok(hasBorder(darkAudit.randomBanner.border), 'Dark mode: #random-banner has border');
  assert.ok(isTranslucentNotColorless(darkAudit.stickyOverview.bg), 'Dark mode: Sticky overview has translucent dark background');
  assert.ok(hasBorder(darkAudit.stickyOverview.border), 'Dark mode: Sticky overview has border');
  assert.ok(isTranslucentNotColorless(darkAudit.homePagination.bg), 'Dark mode: Home pagination has translucent dark background');
  assert.ok(hasBorder(darkAudit.homePagination.border), 'Dark mode: Home pagination has border');
  console.log('[✅ PASS] Dark mode palette verified.\n');

  // Screenshots
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await page.screenshot({ path: path.join(outDir, 'light-verified.png') });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.screenshot({ path: path.join(outDir, 'dark-verified.png') });

  console.log('================================================================');
  console.log('🎉 ALL ANZHIYU PALETTE REGIONAL DIVISION ASSERTIONS PASSED (100%)!');
  console.log('================================================================');
  await browser.close();
}

run().catch(err => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
