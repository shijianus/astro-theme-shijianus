import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('scratch/transparency-audit');
fs.mkdirSync(outDir, { recursive: true });

const targetUrl = process.env.TEST_URL || 'https://blog.epocanvas.com/';
console.log(`Starting transparency verification on: ${targetUrl}`);

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

  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Audit post card and inner content container (User Choice A1: Anzhiyu alignment)
  const postCardData = await page.evaluate(() => {
    const allCards = Array.from(document.querySelectorAll('.recent-post-item'));
    const targetCard = allCards.find(c => c.querySelector('[class*="justify-between"]') || c.querySelector('.p-3')) || allCards[0];
    const innerContent = targetCard ? targetCard.querySelector('[class*="justify-between"]') || targetCard.querySelector('.p-3') : null;

    const cardStyle = targetCard ? window.getComputedStyle(targetCard) : null;
    const innerStyle = innerContent ? window.getComputedStyle(innerContent) : null;

    return {
      card: cardStyle ? {
        className: targetCard.className,
        bg: cardStyle.backgroundColor,
        backdropFilter: cardStyle.backdropFilter,
        boxShadow: cardStyle.boxShadow,
        borderRadius: cardStyle.borderRadius
      } : null,
      inner: innerStyle ? {
        className: innerContent.className,
        bg: innerStyle.backgroundColor,
        backdropFilter: innerStyle.backdropFilter
      } : null
    };
  });

  console.log('Post Card Data:', JSON.stringify(postCardData, null, 2));
  assert.ok(postCardData.card, 'Recent post item must exist');
  assert.ok(postCardData.inner, 'Post card inner container must exist');
  assert.match(postCardData.card.bg, /rgba\(255,\s*255,\s*255,\s*0\.7\d*\)/, 'Card background must be 0.70 translucent white in gray mode');
  assert.match(postCardData.card.backdropFilter, /blur\(16px\)/, 'Card must have blur(16px) backdrop filter');
  assert.equal(postCardData.inner.bg, 'rgba(0, 0, 0, 0)', 'Post card inner container MUST be transparent (User Choice A1: eliminate 91% double-stacking)');

  // 2. Audit #random-banner (User Choice A2: clean mask and solid gradient, enable standard frosted glass)
  const randomBannerData = await page.evaluate(() => {
    const el = document.querySelector('#random-banner');
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    const before = window.getComputedStyle(el, '::before');
    return {
      bg: cs.backgroundColor,
      backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
      boxShadow: cs.boxShadow,
      beforeDisplay: before.display,
      beforeContent: before.content
    };
  });

  console.log('Random Banner Data:', JSON.stringify(randomBannerData, null, 2));
  assert.ok(randomBannerData, '#random-banner must exist');
  assert.match(randomBannerData.bg, /rgba\(255,\s*255,\s*255,\s*0\.7\d*\)/, '#random-banner must have 0.70 translucent white in gray mode');
  assert.match(randomBannerData.backdropFilter, /blur\(16px\)/, '#random-banner must have blur(16px) backdrop filter');
  assert.ok(randomBannerData.beforeDisplay === 'none' || randomBannerData.beforeContent === 'none', '#random-banner::before opaque mask MUST be eliminated');

  // 3. Audit sidebar overview sticky card (class="card-widget card-feature-panel card-feature-panel--overview card-tag-cloud-panel is-sticky-active") and .aside-sticky-box (User Choice A3)
  const sidebarData = await page.evaluate(() => {
    const stickyBox = document.querySelector('.aside-sticky-box');
    const el = document.querySelector('.card-feature-panel--overview') || document.querySelector('#card-tag-cloud-overview');
    const tagItem = stickyBox ? stickyBox.querySelector('.tag-cloud-item') : null;

    const sbStyle = stickyBox ? window.getComputedStyle(stickyBox) : null;
    const s = el ? window.getComputedStyle(el) : null;
    const beforeS = el ? window.getComputedStyle(el, '::before') : null;
    const tagStyle = tagItem ? window.getComputedStyle(tagItem) : null;

    return {
      stickyBox: sbStyle ? {
        bg: sbStyle.backgroundColor,
        border: sbStyle.borderWidth,
        boxShadow: sbStyle.boxShadow
      } : null,
      card: s ? {
        className: el.className,
        bg: s.backgroundColor,
        backdropFilter: s.backdropFilter,
        boxShadow: s.boxShadow,
        beforeContent: beforeS.content,
        beforeDisplay: beforeS.display
      } : null,
      tagItem: tagStyle ? {
        bg: tagStyle.backgroundColor,
        backdropFilter: tagStyle.backdropFilter
      } : null
    };
  });

  console.log('Sidebar Overview Sticky Card Data:', JSON.stringify(sidebarData, null, 2));
  assert.ok(sidebarData.card, 'Sidebar overview card must exist');
  assert.match(sidebarData.card.bg, /rgba\(255,\s*255,\s*255,\s*0\.7\d*\)/, 'Overview card must inherit translucent 0.70 frosted glass');
  assert.doesNotMatch(sidebarData.card.bg, /rgba\(87,\s*189,\s*106/, 'Overview card MUST NOT have green opaque gradient');
  assert.match(sidebarData.card.backdropFilter, /blur\(16px\)/, 'Overview card must have blur(16px) backdrop filter');
  assert.equal(sidebarData.stickyBox.bg, 'rgba(0, 0, 0, 0)', '.aside-sticky-box MUST be transparent with no blocking solid background');

  // 4. Audit home pagination (class="theme-card home-pagination") (User Choice A4: Anzhiyu native transparent pagination)
  const paginationData = await page.evaluate(() => {
    const nav = document.querySelector('#home-pagination') || document.querySelector('.home-pagination');
    if (!nav) return null;
    const navStyle = window.getComputedStyle(nav);
    const num = nav.querySelector('.home-pagination__num:not(.is-current)');
    const badge = nav.querySelector('.home-pagination__badge');
    const numStyle = num ? window.getComputedStyle(num) : null;
    const badgeStyle = badge ? window.getComputedStyle(badge) : null;

    return {
      navBg: navStyle.backgroundColor,
      navBorder: navStyle.borderWidth,
      navBoxShadow: navStyle.boxShadow,
      numBg: numStyle ? numStyle.backgroundColor : null,
      numBackdropFilter: numStyle ? (numStyle.backdropFilter || numStyle.webkitBackdropFilter) : null,
      badgeBg: badgeStyle ? badgeStyle.backgroundColor : null,
      badgeBackdropFilter: badgeStyle ? (badgeStyle.backdropFilter || badgeStyle.webkitBackdropFilter) : null
    };
  });

  console.log('Home Pagination Data:', JSON.stringify(paginationData, null, 2));
  assert.ok(paginationData, '#home-pagination must exist');
  assert.equal(paginationData.navBg, 'rgba(0, 0, 0, 0)', 'Pagination container MUST be transparent (User Choice A4: replicate Anzhiyu native)');
  assert.equal(paginationData.navBorder, '0px', 'Pagination container MUST have no border');
  assert.equal(paginationData.navBoxShadow, 'none', 'Pagination container MUST have no box-shadow');
  if (paginationData.numBg) {
    assert.match(paginationData.numBg, /rgba\(255,\s*255,\s*255,\s*0\.7\d*\)/, 'Pagination buttons must have frosted glass card-bg');
    assert.match(paginationData.numBackdropFilter, /blur\(16px\)/, 'Pagination buttons must have blur(16px) frosted glass');
  }

  // 5. Audit footer (#footer-wrap and .footer-main-shell)
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
      shellBg: shellStyle ? shellStyle.backgroundColor : null,
      shellBorder: shellStyle ? shellStyle.borderWidth : null,
      shellBoxShadow: shellStyle ? shellStyle.boxShadow : null
    };
  });

  console.log('Footer Data:', JSON.stringify(footerData, null, 2));
  assert.ok(footerData.footerBg, 'Footer background gradient must exist');
  assert.equal(footerData.footerWrapBg, 'rgba(0, 0, 0, 0)', '#footer-wrap MUST be transparent');
  assert.equal(footerData.shellBg, 'rgba(0, 0, 0, 0)', '.footer-main-shell MUST be transparent with no opaque gradient');
  assert.equal(footerData.shellBorder, '0px', '.footer-main-shell MUST have 0px border (no box frame)');
  assert.equal(footerData.shellBoxShadow, 'none', '.footer-main-shell MUST have no box shadow');

  // 6. Audit scrolled navigation (#nav)
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(1000);

  const navData = await page.evaluate(() => {
    const nav = document.querySelector('#nav');
    const s = nav ? window.getComputedStyle(nav) : null;
    return {
      bg: s ? s.backgroundColor : null,
      backdropFilter: s ? s.backdropFilter : null
    };
  });

  console.log('Scrolled Navigation Data:', JSON.stringify(navData, null, 2));
  assert.match(navData.backdropFilter, /blur\(20px\)/, '#nav MUST have blur(20px) frosted glass on scroll');

  // 5. Take screenshots of verified sections
  await page.screenshot({ path: path.join(outDir, 'live-scrolled.png') });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'live-hero.png') });

  console.log('\nAll transparency parity assertions passed successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
