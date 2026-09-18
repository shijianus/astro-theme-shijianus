#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const liveBaseUrl = process.env.TEST_TARGET_URL || 'https://blog.epocanvas.com';
const outputDir = path.resolve('scratch/screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function verifyLive() {
  console.log(`\n===============================================================`);
  console.log(`🚀 Starting LIVE Production Sticky Card & Alignment Verification`);
  console.log(`   Production URL: ${liveBaseUrl}`);
  console.log(`===============================================================\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });

  try {
    let verified = false;
    let cardInfo = null;

    // Retry loop for CDN edge cache propagation
    for (let attempt = 1; attempt <= 10; attempt++) {
      console.log(`\n--- Attempt ${attempt}: Visiting ${liveBaseUrl} ---`);
      const testUrl = liveBaseUrl;
      await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 35000 });
      await page.waitForTimeout(1500);

      cardInfo = await page.evaluate(() => {
        const card = document.querySelector('.card-tag-cloud-panel');
        const track = document.getElementById('aside-track-overview');
        const stickyBox = document.getElementById('aside-sticky-box-overview');
        const tags = card ? card.querySelectorAll('.tag-cloud-item') : [];
        const categoryChips = card ? card.querySelectorAll('.category-chip') : [];
        const webinfoItems = card ? card.querySelectorAll('.webinfo-item') : [];
        const pagination = document.getElementById('home-pagination');
        const recentPosts = document.getElementById('recent-posts');
        
        return {
          cardExists: Boolean(card),
          cardClasses: card?.className,
          trackExists: Boolean(track),
          stickyBoxExists: Boolean(stickyBox),
          tagCount: tags.length,
          categoryChipsCount: categoryChips.length,
          webinfoItemsCount: webinfoItems.length,
          paginationExists: Boolean(pagination),
          recentPostsExists: Boolean(recentPosts),
          cardHeight: card?.offsetHeight,
          cardWidth: card?.offsetWidth,
          trackHeight: track?.offsetHeight,
        };
      });

      console.log(`   - card-tag-cloud-panel: ${cardInfo.cardExists}`);
      console.log(`   - aside-sticky-box-overview: ${cardInfo.stickyBoxExists}`);
      console.log(`   - tags rendered: ${cardInfo.tagCount}`);
      console.log(`   - category chips: ${cardInfo.categoryChipsCount}`);
      console.log(`   - webinfo items: ${cardInfo.webinfoItemsCount}`);

      if (cardInfo.cardExists && cardInfo.stickyBoxExists && cardInfo.tagCount <= 24 && cardInfo.categoryChipsCount > 0 && cardInfo.webinfoItemsCount > 0) {
        verified = true;
        console.log(`✅ CDN edge has updated to latest version on attempt ${attempt}!`);
        break;
      }

      console.log(`⏳ Stale CDN cache detected on attempt ${attempt} (tags=${cardInfo.tagCount}, categories=${cardInfo.categoryChipsCount}). Waiting 5s...`);
      await page.waitForTimeout(5000);
    }

    if (!verified) {
      throw new Error(`Live production site has not propagated within retry window!`);
    }

    // Capture initial top screenshot
    const topScreenshot = path.join(outputDir, '01_live_home_top.png');
    await page.screenshot({ path: topScreenshot });
    console.log(`📸 Saved live top screenshot: ${topScreenshot}`);

    // Capture card closeup
    const cardElement = await page.$('.card-tag-cloud-panel');
    if (cardElement) {
      const cardScreenshot = path.join(outputDir, '02_live_tag_card_closeup.png');
      await cardElement.screenshot({ path: cardScreenshot });
      console.log(`📸 Saved live tag card closeup: ${cardScreenshot}`);
    }

    // Scroll to mid-feed: test sticky pinning
    console.log(`\n🔄 Scrolling to mid-feed (scrollY = 600)...`);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(600);

    const midScrollInfo = await page.evaluate(() => {
      const card = document.querySelector('.card-tag-cloud-panel');
      const stickyBox = document.getElementById('aside-sticky-box-overview');
      const cardRect = card?.getBoundingClientRect();
      const boxRect = stickyBox?.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        cardTop: cardRect?.top,
        boxTop: boxRect?.top,
        stickyState: card?.getAttribute('data-sticky-state'),
      };
    });

    console.log(`   - scrollY: ${midScrollInfo.scrollY}px`);
    console.log(`   - stickyBox top: ${midScrollInfo.boxTop}px`);
    console.log(`   - card top: ${midScrollInfo.cardTop}px`);
    console.log(`   - card sticky state: ${midScrollInfo.stickyState}`);

    const stickyScreenshot = path.join(outputDir, '03_live_home_sticky_active.png');
    await page.screenshot({ path: stickyScreenshot });
    console.log(`📸 Saved live sticky active screenshot: ${stickyScreenshot}`);

    // Scroll to bottom: test termination aligned with #home-pagination
    console.log(`\n🔄 Scrolling to bottom near #home-pagination...`);
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(800);

    const bottomScrollInfo = await page.evaluate(() => {
      const boundary = document.getElementById('home-pagination') || document.getElementById('recent-posts');
      const card = document.querySelector('.card-tag-cloud-panel');
      const stickyBox = document.getElementById('aside-sticky-box-overview');
      const track = document.getElementById('aside-track-overview');
      const boundaryRect = boundary?.getBoundingClientRect();
      const cardRect = card?.getBoundingClientRect();
      const boxRect = stickyBox?.getBoundingClientRect();
      const trackRect = track?.getBoundingClientRect();

      return {
        scrollY: window.scrollY,
        boundaryBottom: boundaryRect?.bottom,
        cardBottom: cardRect?.bottom,
        boxBottom: boxRect?.bottom,
        trackBottom: trackRect?.bottom,
        diffBottom: Math.abs((cardRect?.bottom ?? 0) - (boundaryRect?.bottom ?? 0)),
        trackDiffBottom: Math.abs((trackRect?.bottom ?? 0) - (boundaryRect?.bottom ?? 0)),
      };
    });

    console.log(`   - scrollY: ${bottomScrollInfo.scrollY}px`);
    console.log(`   - boundary bottom: ${bottomScrollInfo.boundaryBottom}px`);
    console.log(`   - card bottom: ${bottomScrollInfo.cardBottom}px`);
    console.log(`   - box bottom: ${bottomScrollInfo.boxBottom}px`);
    console.log(`   - track bottom: ${bottomScrollInfo.trackBottom}px`);
    console.log(`   - Bottom alignment difference: ${bottomScrollInfo.diffBottom}px`);
    console.log(`   - Track alignment difference: ${bottomScrollInfo.trackDiffBottom}px`);

    // Capture bottom aligned screenshot
    const bottomScreenshot = path.join(outputDir, '04_live_home_bottom_aligned.png');
    await page.screenshot({ path: bottomScreenshot });
    console.log(`📸 Saved live bottom aligned screenshot: ${bottomScreenshot}`);

    // Capture pagination closeup
    const paginationEl = await page.$('#home-pagination');
    if (paginationEl) {
      const paginationScreenshot = path.join(outputDir, '05_live_home_pagination_closeup.png');
      await paginationEl.screenshot({ path: paginationScreenshot });
      console.log(`📸 Saved live pagination closeup: ${paginationScreenshot}`);
    }

    if (bottomScrollInfo.diffBottom > 2) {
      throw new Error(`Alignment difference ${bottomScrollInfo.diffBottom}px exceeds 2px threshold!`);
    }

    console.log(`\n🎉 ALL LIVE PRODUCTION AUDITS PASSED WITH FLYING COLORS!\n`);
  } finally {
    await browser.close();
  }
}

verifyLive().catch((err) => {
  console.error('❌ Live verification error:', err);
  process.exit(1);
});
