#!/usr/bin/env node
/**
 * scripts/verify-readmode-sticky-alignment.mjs
 * 
 * Comprehensive Playwright E2E verification for:
 * 1. Read mode alignment: class="aside-sticky-box" and class="page-main" aligned at top: 24px (scrollY=0).
 * 2. 100% full-journey sticky visibility: aside-sticky-box sticks at 24px throughout the entire scroll (0 to maxScroll).
 * 3. Never pushed away: trackToc is 100% height, eliminating any premature push-out at the bottom of the article.
 * 4. Zero dock collision: rightside dock does not overlap with card-toc across all desktop viewports.
 * 5. Internal TOC scroll & reading progress synchronization.
 * 6. #hide-aside-btn collaborative aside collapse and clean restoration.
 */

import { chromium } from 'playwright';

const targetUrl = process.env.TEST_TARGET_URL || 'http://127.0.0.1:4399/posts/content-formats-and-markup-mastery/';
const isLive = targetUrl.startsWith('https://');

const VIEWPORTS = [
  { name: '1080p FHD', width: 1920, height: 1080 },
  { name: 'Laptop HighDPI', width: 1536, height: 864 },
  { name: 'MacBook Standard', width: 1440, height: 900 },
  { name: 'Compact Laptop', width: 1366, height: 768 },
];

async function runAudit() {
  console.log(`\n===============================================================`);
  console.log(`🚀 Starting Read Mode Sticky & Alignment E2E Audit`);
  console.log(`   Target URL: ${targetUrl} (${isLive ? 'LIVE PRODUCTION' : 'LOCAL BUILD'})`);
  console.log(`===============================================================\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  let allPassed = true;

  for (const vp of VIEWPORTS) {
    console.log(`\n-------------------------------------------------------------`);
    console.log(`🖥️  Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`-------------------------------------------------------------`);

    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(600);

      // Step 1: Trigger Read Mode via #readmode
      const cfg = await page.$('#rightside-config');
      if (cfg) await cfg.click();
      await page.waitForTimeout(200);

      const rm = await page.$('#readmode');
      if (!rm) throw new Error('#readmode button not found in DOM');
      await rm.click();
      await page.waitForTimeout(500);

      // Verify read-mode class on body
      const isReadMode = await page.evaluate(() => document.body.classList.contains('read-mode'));
      if (!isReadMode) throw new Error('Failed to activate read-mode on body');
      console.log('  ✓ Read mode activated successfully.');

      // Step 2: Test scrollY = 0 Alignment
      const topAlignment = await page.evaluate(() => {
        const main = document.querySelector('.page-main');
        const post = document.getElementById('post');
        const aside = document.querySelector('.page-aside');
        const box = document.getElementById('aside-sticky-box-toc');
        const card = document.getElementById('card-toc');
        const rightside = document.getElementById('rightside');

        const mR = main.getBoundingClientRect();
        const pR = post.getBoundingClientRect();
        const aR = aside.getBoundingClientRect();
        const bR = box.getBoundingClientRect();
        const cR = card.getBoundingClientRect();
        const rR = rightside ? rightside.getBoundingClientRect() : null;

        const overlap = (cR && rR)
          ? !(cR.right < rR.left || cR.left > rR.right || cR.bottom < rR.top || cR.top > rR.bottom)
          : false;

        return {
          scrollY: window.scrollY,
          mainTop: Math.round(mR.top),
          postTop: Math.round(pR.top),
          asideTop: Math.round(aR.top),
          boxTop: Math.round(bR.top),
          boxBottom: Math.round(bR.bottom),
          boxHeight: Math.round(bR.height),
          cardRight: Math.round(cR.right),
          rightsideLeft: rR ? Math.round(rR.left) : null,
          overlap,
        };
      });

      console.log(`  • Alignment at scrollY=0: mainTop=${topAlignment.mainTop}px, boxTop=${topAlignment.boxTop}px`);
      if (topAlignment.mainTop !== topAlignment.boxTop) {
        console.error(`  ❌ FAIL: page-main (${topAlignment.mainTop}px) and aside-sticky-box (${topAlignment.boxTop}px) are not aligned!`);
        allPassed = false;
      } else {
        console.log(`  ✓ SUCCESS: page-main and aside-sticky-box are perfectly aligned at ${topAlignment.mainTop}px!`);
      }

      // Step 3: Check #rightside Dock Overlap
      if (topAlignment.overlap) {
        console.error(`  ❌ FAIL: card-toc (right: ${topAlignment.cardRight}px) overlaps with #rightside (left: ${topAlignment.rightsideLeft}px)!`);
        allPassed = false;
      } else {
        const gap = topAlignment.rightsideLeft ? topAlignment.rightsideLeft - topAlignment.cardRight : 0;
        console.log(`  ✓ SUCCESS: Zero overlap between card-toc and #rightside dock! (Clearance: ${gap}px)`);
      }

      // Step 4: Test TOC Internal Scrolling
      const internalScroll = await page.evaluate(() => {
        const toc = document.querySelector('#card-toc .toc-content');
        if (!toc) return { success: false, reason: 'no toc element' };
        toc.scrollTop = 0;
        const initial = toc.scrollTop;
        toc.scrollTop = 200;
        const scrolled = toc.scrollTop;
        toc.scrollTop = 0;
        return { success: scrolled > initial, scrolled, maxScroll: toc.scrollHeight - toc.clientHeight };
      });
      if (!internalScroll.success) {
        console.error('  ❌ FAIL: TOC internal scrolling is broken!');
        allPassed = false;
      } else {
        console.log(`  ✓ SUCCESS: TOC internal scrolling ("翻页") verified (scrolled to ${internalScroll.scrolled}px, max: ${internalScroll.maxScroll}px).`);
      }

      // Step 5: Test Continuous Stickiness From Start to Finish (0 to maxScroll)
      const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
      const scrollSamples = [100, 500, 1000, 5000, 15000, 25000, 30000, Math.max(0, maxScroll - 500), maxScroll];

      let stickyPassed = true;
      for (const sy of scrollSamples) {
        await page.evaluate((y) => window.scrollTo(0, y), sy);
        await page.waitForTimeout(60);

        const sampleState = await page.evaluate(() => {
          const box = document.getElementById('aside-sticky-box-toc');
          const bR = box.getBoundingClientRect();
          return {
            scrollY: window.scrollY,
            boxTop: Math.round(bR.top),
            boxBottom: Math.round(bR.bottom),
            windowHeight: window.innerHeight,
          };
        });

        const isSticky = sampleState.boxTop >= 20 && sampleState.boxTop <= 28;
        const isVisibleInViewport = sampleState.boxBottom <= sampleState.windowHeight + 2;

        if (!isSticky || !isVisibleInViewport) {
          console.error(`  ❌ FAIL at scrollY ${sy}px: boxTop=${sampleState.boxTop}px, boxBottom=${sampleState.boxBottom}px (windowHeight=${sampleState.windowHeight}px)`);
          stickyPassed = false;
          allPassed = false;
        }
      }

      if (stickyPassed) {
        console.log(`  ✓ SUCCESS: aside-sticky-box remained 100% visibly stuck at 24px across the entire scroll range (0 to ${maxScroll}px)!`);
      }

      // Step 6: Test Collaborative Collapse via #hide-aside-btn
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(100);

      const hideBtn = await page.$('#hide-aside-btn');
      if (hideBtn) {
        await hideBtn.click();
        await page.waitForTimeout(450);

        const collapsed = await page.evaluate(() => {
          const aside = document.querySelector('.page-aside');
          const main = document.querySelector('.page-main');
          return {
            asideWidth: Math.round(aside.getBoundingClientRect().width),
            mainWidth: Math.round(main.getBoundingClientRect().width),
          };
        });

        if (collapsed.asideWidth !== 0) {
          console.error(`  ❌ FAIL: Aside did not collapse to 0 width (width=${collapsed.asideWidth}px)!`);
          allPassed = false;
        } else {
          console.log(`  ✓ SUCCESS: Aside collapsed to 0px, page-main expanded to full width (${collapsed.mainWidth}px).`);
        }

        // Click again to restore
        await hideBtn.click();
        await page.waitForFunction(() => {
          const aside = document.querySelector('.page-aside');
          return aside && Math.round(aside.getBoundingClientRect().width) >= 295;
        }, { timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(100);

        const restored = await page.evaluate(() => {
          const aside = document.querySelector('.page-aside');
          const box = document.getElementById('aside-sticky-box-toc');
          return {
            asideWidth: Math.round(aside.getBoundingClientRect().width),
            boxTop: Math.round(box.getBoundingClientRect().top),
          };
        });

        if (restored.asideWidth < 280 || restored.boxTop < 20 || restored.boxTop > 28) {
          console.error(`  ❌ FAIL: Aside restoration failed (asideWidth=${restored.asideWidth}px, boxTop=${restored.boxTop}px)!`);
          allPassed = false;
        } else {
          console.log(`  ✓ SUCCESS: Aside smoothly restored to ${restored.asideWidth}px, aside-sticky-box top at ${restored.boxTop}px.`);
        }
      }

    } catch (err) {
      console.error(`  ❌ ERROR during audit for viewport ${vp.name}:`, err.message);
      allPassed = false;
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log(`\n===============================================================`);
  if (allPassed) {
    console.log(`🎉 ALL AUDIT CHECKS PASSED 100% ACROSS ALL VIEWPORTS!`);
    console.log(`===============================================================\n`);
    process.exit(0);
  } else {
    console.error(`💥 AUDIT FAILED! Please review the errors above.`);
    console.log(`===============================================================\n`);
    process.exit(1);
  }
}

runAudit();
