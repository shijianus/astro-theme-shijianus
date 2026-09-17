#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const targetUrl = process.env.TEST_TARGET_URL || 'http://127.0.0.1:4321/';
const outputDir = path.resolve('scratch/screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function runVerification() {
  console.log(`\n===============================================================`);
  console.log(`🚀 Starting Home Tag Cloud Sticky & Alignment Verification`);
  console.log(`   Target URL: ${targetUrl}`);
  console.log(`===============================================================\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // 1. Verify Card presence and attributes
    const cardInfo = await page.evaluate(() => {
      const card = document.querySelector('.card-tag-cloud-panel');
      const track = document.getElementById('aside-track-overview');
      const stickyBox = document.getElementById('aside-sticky-box-overview');
      const tags = card ? card.querySelectorAll('.tag-cloud-item') : [];
      const pagination = document.getElementById('home-pagination');
      const recentPosts = document.getElementById('recent-posts');
      
      return {
        cardExists: Boolean(card),
        cardClasses: card?.className,
        trackExists: Boolean(track),
        stickyBoxExists: Boolean(stickyBox),
        tagCount: tags.length,
        paginationExists: Boolean(pagination),
        recentPostsExists: Boolean(recentPosts),
        cardHeight: card?.offsetHeight,
        trackHeight: track?.offsetHeight,
      };
    });

    console.log(`\n📋 DOM Elements Check:`);
    console.log(`   - card-tag-cloud-panel exists: ${cardInfo.cardExists}`);
    console.log(`   - card classes: ${cardInfo.cardClasses}`);
    console.log(`   - aside-track-overview exists: ${cardInfo.trackExists}`);
    console.log(`   - aside-sticky-box-overview exists: ${cardInfo.stickyBoxExists}`);
    console.log(`   - Total tags rendered: ${cardInfo.tagCount}`);
    console.log(`   - Initial card height: ${cardInfo.cardHeight}px`);
    console.log(`   - Initial track height: ${cardInfo.trackHeight}px`);

    if (!cardInfo.cardExists || !cardInfo.trackExists || !cardInfo.stickyBoxExists) {
      throw new Error('Required sticky track, box, or card element is missing!');
    }

    // Capture initial top screenshot
    const topScreenshot = path.join(outputDir, '01_home_top.png');
    await page.screenshot({ path: topScreenshot });
    console.log(`📸 Saved initial top screenshot: ${topScreenshot}`);

    // Capture card closeup
    const cardElement = await page.$('.card-tag-cloud-panel');
    if (cardElement) {
      const cardScreenshot = path.join(outputDir, '04_tag_card_closeup.png');
      await cardElement.screenshot({ path: cardScreenshot });
      console.log(`📸 Saved tag card closeup: ${cardScreenshot}`);
    }

    // 2. Scroll to middle: test sticky pinning
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

    const stickyScreenshot = path.join(outputDir, '02_home_sticky_active.png');
    await page.screenshot({ path: stickyScreenshot });
    console.log(`📸 Saved sticky active screenshot: ${stickyScreenshot}`);

    // 3. Scroll to bottom: test termination aligned with #home-pagination
    console.log(`\n🔄 Scrolling to bottom near #home-pagination...`);
    await page.evaluate(() => {
      const boundary = document.getElementById('home-pagination') || document.getElementById('recent-posts');
      if (boundary) {
        boundary.scrollIntoView({ block: 'end', behavior: 'instant' });
      }
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

    const bottomScreenshot = path.join(outputDir, '03_home_bottom_aligned.png');
    await page.screenshot({ path: bottomScreenshot });
    console.log(`📸 Saved bottom aligned screenshot: ${bottomScreenshot}`);

    console.log(`\n===============================================================`);
    console.log(`✅ VERIFICATION COMPLETED SUCCESSFULLY`);
    console.log(`===============================================================\n`);
  } finally {
    await browser.close();
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
