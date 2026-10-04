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

  // 1. Audit post card and inner content container
  const postCardData = await page.evaluate(() => {
    // Specifically locate the PostCard element containing class="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5"
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
  assert.match(postCardData.inner.bg, /rgba\(255,\s*255,\s*255,\s*0\.7\d*\)/, 'Post card inner container MUST explicitly have 0.70 frosted glass background');
  assert.match(postCardData.inner.backdropFilter, /blur\(16px\)/, 'Post card inner container MUST explicitly have blur(16px) frosted glass backdrop filter');

  // 2. Audit sidebar overview sticky card (class="card-widget card-feature-panel card-feature-panel--overview card-tag-cloud-panel is-sticky-active") and .aside-sticky-box
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
  if (sidebarData.tagItem) {
    assert.match(sidebarData.tagItem.backdropFilter, /blur\(6px\)/, 'Tag cloud items in aside-sticky-box must have blur(6px) frosted glass');
  }

  // 3. Audit footer (#footer-wrap and .footer-main-shell)
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

  // 4. Audit scrolled navigation (#nav)
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
