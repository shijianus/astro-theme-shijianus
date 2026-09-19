#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4321';
const outputDir = path.resolve('scratch/screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log('===============================================================');
  console.log('🚀 Starting Home Last Page Adaptive Sticky Verification');
  console.log(`   Base URL: ${baseUrl}`);
  console.log('===============================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // -------------------------------------------------------------
    // Scenario 1: Verify Last Page (/page/3/)
    // -------------------------------------------------------------
    console.log('▶ [Scenario 1] Testing Last Page: /page/3/');
    await page.goto(`${baseUrl}/page/3/`, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1000);

    const scenario1Info = await page.evaluate(() => {
      const feed = document.getElementById('recent-posts');
      const stickyGroup = document.getElementById('home-posts-sticky-group');
      const grid = stickyGroup?.querySelector('.grid');
      const pagination = document.getElementById('home-pagination');
      const aside = document.getElementById('aside-content');
      const track = document.getElementById('aside-track-overview');
      const asideStickyBox = document.getElementById('aside-sticky-box-overview');
      const body = document.body;

      const feedPage = Number(feed?.dataset.feedPage || '0');
      const feedPages = Number(feed?.dataset.feedPages || '0');
      const isLastPage = feed?.dataset.isLastPage === 'true' || feedPage >= feedPages;

      const groupRect = stickyGroup?.getBoundingClientRect();
      const groupStyle = stickyGroup ? window.getComputedStyle(stickyGroup) : null;
      const asideStickyStyle = asideStickyBox ? window.getComputedStyle(asideStickyBox) : null;

      return {
        feedExists: Boolean(feed),
        stickyGroupExists: Boolean(stickyGroup),
        gridExists: Boolean(grid),
        paginationExists: Boolean(pagination),
        asideExists: Boolean(aside),
        isLastPage,
        feedPage,
        feedPages,
        bodyStickyMode: body.getAttribute('data-home-sticky'),
        leftGroupPosition: groupStyle?.position,
        leftGroupTop: groupStyle?.top,
        leftGroupHeight: stickyGroup?.offsetHeight,
        asideHeight: aside?.offsetHeight,
        rightAsidePosition: asideStickyStyle?.position,
        rightTrackHeight: track?.offsetHeight,
      };
    });

    console.log('  Scenario 1 DOM & Geometry:');
    console.log(`   - Feed Page: ${scenario1Info.feedPage} of ${scenario1Info.feedPages} (isLastPage: ${scenario1Info.isLastPage})`);
    console.log(`   - Left Sticky Group exists: ${scenario1Info.stickyGroupExists}`);
    console.log(`   - Left Content Height: ${scenario1Info.leftGroupHeight}px`);
    console.log(`   - Right Aside Height: ${scenario1Info.asideHeight}px`);
    console.log(`   - Body data-home-sticky: "${scenario1Info.bodyStickyMode}"`);
    console.log(`   - Left Group computed position: "${scenario1Info.leftGroupPosition}"`);
    console.log(`   - Left Group computed top: "${scenario1Info.leftGroupTop}"`);
    console.log(`   - Right Aside Sticky Box position: "${scenario1Info.rightAsidePosition}"`);

    if (!scenario1Info.stickyGroupExists || !scenario1Info.paginationExists || !scenario1Info.gridExists) {
      throw new Error('Required sticky group, grid, or pagination element missing on last page!');
    }

    if (scenario1Info.leftGroupHeight < scenario1Info.asideHeight - 60) {
      if (scenario1Info.bodyStickyMode !== 'left') {
        throw new Error(`Expected body data-home-sticky="left" when left (${scenario1Info.leftGroupHeight}px) < right (${scenario1Info.asideHeight}px), got "${scenario1Info.bodyStickyMode}"`);
      }
      if (scenario1Info.leftGroupPosition !== 'sticky') {
        throw new Error(`Expected left group position to be "sticky", got "${scenario1Info.leftGroupPosition}"`);
      }
      if (scenario1Info.rightAsidePosition === 'sticky') {
        throw new Error(`Expected right aside sticky box to NOT be sticky when left is sticky, got "${scenario1Info.rightAsidePosition}"`);
      }
      console.log('  ✅ Left group is successfully sticky, and right aside is successfully non-sticky!');
    } else {
      console.log('  ℹ Left content is not shorter than right aside, skipping left-sticky assertion.');
    }

    // Scroll test on last page
    const initialGeometry = await page.evaluate(() => {
      const stickyGroup = document.getElementById('home-posts-sticky-group');
      const groupRect = stickyGroup?.getBoundingClientRect();
      const style = stickyGroup ? window.getComputedStyle(stickyGroup) : null;
      const stickyTop = Number.parseFloat(style?.top || '74');
      return {
        initialTop: groupRect ? groupRect.top + window.scrollY : 0,
        stickyTop: Number.isFinite(stickyTop) ? stickyTop : 74,
      };
    });

    console.log(`  Initial Group Doc Top: ${initialGeometry.initialTop}px, Target Sticky Top: ${initialGeometry.stickyTop}px`);

    // Scroll to pass the sticky threshold
    const scrollTarget1 = Math.round(initialGeometry.initialTop - initialGeometry.stickyTop + 120);
    console.log(`  Scrolling past sticky threshold (scrollY = ${scrollTarget1})...`);
    await page.evaluate((target) => window.scrollTo(0, target), scrollTarget1);
    await page.waitForTimeout(500);

    const scrollMetrics1 = await page.evaluate(() => {
      const stickyGroup = document.getElementById('home-posts-sticky-group');
      const asideStickyBox = document.getElementById('aside-sticky-box-overview');
      const groupRect = stickyGroup?.getBoundingClientRect();
      const asideRect = asideStickyBox?.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        groupTop: Math.round(groupRect?.top || 0),
        groupBottom: Math.round(groupRect?.bottom || 0),
        asideTop: Math.round(asideRect?.top || 0),
      };
    });

    console.log(`   - ScrollY: ${scrollMetrics1.scrollY}`);
    console.log(`   - Left Group Viewport Top: ${scrollMetrics1.groupTop}px (expected target: ${initialGeometry.stickyTop}px)`);
    console.log(`   - Right Aside Box Viewport Top: ${scrollMetrics1.asideTop}px`);

    if (Math.abs(scrollMetrics1.groupTop - initialGeometry.stickyTop) > 3) {
      throw new Error(`Left sticky group top (${scrollMetrics1.groupTop}px) did not lock at sticky top (${initialGeometry.stickyTop}px)!`);
    }
    console.log('  ✅ Left sticky group correctly locked at sticky top threshold!');

    // Continue scrolling further to verify it continues to stick while right aside scrolls up
    const scrollTarget2 = scrollTarget1 + 250;
    console.log(`  Scrolling further down (scrollY = ${scrollTarget2})...`);
    await page.evaluate((target) => window.scrollTo(0, target), scrollTarget2);
    await page.waitForTimeout(500);

    const scrollMetrics2 = await page.evaluate(() => {
      const stickyGroup = document.getElementById('home-posts-sticky-group');
      const asideStickyBox = document.getElementById('aside-sticky-box-overview');
      const groupRect = stickyGroup?.getBoundingClientRect();
      const asideRect = asideStickyBox?.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        groupTop: Math.round(groupRect?.top || 0),
        asideTop: Math.round(asideRect?.top || 0),
      };
    });

    console.log(`   - Further ScrollY: ${scrollMetrics2.scrollY}`);
    console.log(`   - Left Group Viewport Top: ${scrollMetrics2.groupTop}px (should remain locked at ${initialGeometry.stickyTop}px)`);
    console.log(`   - Right Aside Box Viewport Top: ${scrollMetrics2.asideTop}px (should move up by ~250px)`);

    if (Math.abs(scrollMetrics2.groupTop - initialGeometry.stickyTop) > 3) {
      throw new Error(`Left sticky group top (${scrollMetrics2.groupTop}px) drifted from sticky top (${initialGeometry.stickyTop}px) during further scroll!`);
    }
    if (scrollMetrics1.asideTop - scrollMetrics2.asideTop < 200) {
      throw new Error(`Right aside did not scroll naturally with page! Expected ~250px delta, got ${scrollMetrics1.asideTop - scrollMetrics2.asideTop}px`);
    }
    console.log('  ✅ Left group stays sticky while right aside smoothly scrolls through its long content!');

    const shot1 = path.join(outputDir, '01_last_page_sticky_scroll.png');
    await page.screenshot({ path: shot1 });
    console.log(`  📸 Saved screenshot: ${shot1}`);

    // -------------------------------------------------------------
    // Scenario 2: Aside Collapsed Behavior
    // "特别的，如果在没有右侧边栏的情况下(即用户收起了右侧边栏)，则由于没有对比的侧边栏直接没有粘性卡片而直接按照应有的拼接"
    // -------------------------------------------------------------
    console.log('\n▶ [Scenario 2] Testing Sidebar Collapsed (No Sidebar Contrast)');
    await page.evaluate(() => {
      if (typeof window.syncAside === 'function') {
        window.syncAside('collapsed');
      } else {
        document.documentElement.dataset.aside = 'collapsed';
        window.dispatchEvent(new CustomEvent('shijianus:asidechange', { detail: 'collapsed' }));
      }
    });
    await page.waitForTimeout(600);

    const collapsedInfo = await page.evaluate(() => {
      const body = document.body;
      const stickyGroup = document.getElementById('home-posts-sticky-group');
      const groupStyle = stickyGroup ? window.getComputedStyle(stickyGroup) : null;
      const aside = document.querySelector<HTMLElement>('.page-aside');
      return {
        asideCollapsedAttr: document.documentElement.getAttribute('data-aside'),
        bodyStickyMode: body.getAttribute('data-home-sticky'),
        leftGroupPosition: groupStyle?.position,
        asideDisplay: aside ? window.getComputedStyle(aside).display : null,
      };
    });

    console.log('  Sidebar Collapsed Info:');
    console.log(`   - data-aside attribute: "${collapsedInfo.asideCollapsedAttr}"`);
    console.log(`   - Aside display: "${collapsedInfo.asideDisplay}"`);
    console.log(`   - Body data-home-sticky: "${collapsedInfo.bodyStickyMode}"`);
    console.log(`   - Left Group computed position: "${collapsedInfo.leftGroupPosition}"`);

    if (collapsedInfo.bodyStickyMode === 'left') {
      throw new Error('Expected data-home-sticky to be removed when sidebar is collapsed!');
    }
    if (collapsedInfo.leftGroupPosition !== 'static') {
      throw new Error(`Expected left group position to be "static" when sidebar is collapsed, got "${collapsedInfo.leftGroupPosition}"`);
    }
    console.log('  ✅ When sidebar is collapsed, left group correctly reverts to static natural flow (no sticky cards)!');

    const shot2 = path.join(outputDir, '02_last_page_aside_collapsed.png');
    await page.screenshot({ path: shot2 });
    console.log(`  📸 Saved screenshot: ${shot2}`);

    // Restore sidebar
    await page.evaluate(() => {
      if (typeof window.syncAside === 'function') {
        window.syncAside('expanded');
      } else {
        document.documentElement.dataset.aside = 'expanded';
        window.dispatchEvent(new CustomEvent('shijianus:asidechange', { detail: 'expanded' }));
      }
    });
    await page.waitForTimeout(600);

    // -------------------------------------------------------------
    // Scenario 3: Home Page 1 (Non-last page)
    // -------------------------------------------------------------
    console.log('\n▶ [Scenario 3] Testing Page 1 (/): Should NOT have left sticky');
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1000);

    const page1Info = await page.evaluate(() => {
      const feed = document.getElementById('recent-posts');
      const stickyGroup = document.getElementById('home-posts-sticky-group');
      const groupStyle = stickyGroup ? window.getComputedStyle(stickyGroup) : null;
      const asideStickyBox = document.getElementById('aside-sticky-box-overview');
      const asideStyle = asideStickyBox ? window.getComputedStyle(asideStickyBox) : null;
      const body = document.body;

      return {
        feedPage: feed?.dataset.feedPage,
        feedPages: feed?.dataset.feedPages,
        isLastPage: feed?.dataset.isLastPage,
        bodyStickyMode: body.getAttribute('data-home-sticky'),
        leftGroupPosition: groupStyle?.position,
        rightAsidePosition: asideStyle?.position,
      };
    });

    console.log('  Page 1 Info:');
    console.log(`   - Feed Page: ${page1Info.feedPage} / ${page1Info.feedPages} (isLastPage: ${page1Info.isLastPage})`);
    console.log(`   - Body data-home-sticky: "${page1Info.bodyStickyMode}"`);
    console.log(`   - Left Group computed position: "${page1Info.leftGroupPosition}"`);
    console.log(`   - Right Aside computed position: "${page1Info.rightAsidePosition}"`);

    if (page1Info.bodyStickyMode === 'left') {
      throw new Error('Page 1 must NEVER trigger left sticky mode!');
    }
    if (page1Info.leftGroupPosition !== 'static') {
      throw new Error(`Page 1 left group should be "static", got "${page1Info.leftGroupPosition}"`);
    }
    if (page1Info.rightAsidePosition !== 'sticky') {
      throw new Error(`Page 1 right aside should retain standard "sticky", got "${page1Info.rightAsidePosition}"`);
    }
    console.log('  ✅ Page 1 correctly preserves normal right aside sticky and leaves left group static!');

    const shot3 = path.join(outputDir, '03_home_page_1_default.png');
    await page.screenshot({ path: shot3 });
    console.log(`  📸 Saved screenshot: ${shot3}`);

    // -------------------------------------------------------------
    // Scenario 4: Mobile Viewport (375x812)
    // -------------------------------------------------------------
    console.log('\n▶ [Scenario 4] Testing Mobile Viewport: 375x812');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${baseUrl}/page/3/`, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1000);

    const mobileInfo = await page.evaluate(() => {
      const stickyGroup = document.getElementById('home-posts-sticky-group');
      const groupStyle = stickyGroup ? window.getComputedStyle(stickyGroup) : null;
      return {
        leftGroupPosition: groupStyle?.position,
      };
    });

    console.log(`   - Mobile Left Group computed position: "${mobileInfo.leftGroupPosition}"`);
    if (mobileInfo.leftGroupPosition !== 'static') {
      throw new Error(`On mobile, left group should be "static", got "${mobileInfo.leftGroupPosition}"`);
    }
    console.log('  ✅ Mobile viewport correctly uses natural static layout!');

    const shot4 = path.join(outputDir, '04_mobile_viewport.png');
    await page.screenshot({ path: shot4 });
    console.log(`  📸 Saved screenshot: ${shot4}`);

    console.log('\n===============================================================');
    console.log('🎉 ALL HOME LAST PAGE ADAPTIVE STICKY TESTS PASSED (4/4)!');
    console.log('===============================================================\n');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
