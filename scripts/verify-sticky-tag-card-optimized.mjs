import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('scripts/screenshots/evidence_optimized');
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  let baseUrl = 'http://127.0.0.1:4322/';
  try {
    const res = await fetch('http://127.0.0.1:4321/');
    if (res.ok) baseUrl = 'http://127.0.0.1:4321/';
  } catch (e) {}

  console.log(`Navigating to ${baseUrl} ...`);
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // 1. Check initial page measurements
  const data = await page.evaluate(() => {
    const card = document.querySelector('.card-feature-panel--overview');
    const postsGrid = document.querySelector('#recent-posts .grid');
    const pagination = document.querySelector('#home-pagination');
    const postItems = postsGrid ? postsGrid.querySelectorAll('.recent-post-item') : [];
    const tagItems = card ? card.querySelectorAll('.card-tag-cloud a') : [];

    const postsGridRect = postsGrid ? postsGrid.getBoundingClientRect() : null;
    const paginationRect = pagination ? pagination.getBoundingClientRect() : null;
    const cardRect = card ? card.getBoundingClientRect() : null;

    const gapBetweenGridAndPagination = (postsGridRect && paginationRect)
      ? paginationRect.top - postsGridRect.bottom
      : null;

    return {
      card: card ? {
        className: card.className,
        width: cardRect.width,
        height: cardRect.height,
        tagCount: tagItems.length,
        styleComputed: {
          maxHeight: window.getComputedStyle(card).maxHeight,
          minHeight: window.getComputedStyle(card).minHeight,
          position: window.getComputedStyle(card).position,
          backgroundColor: window.getComputedStyle(card).backgroundColor
        }
      } : null,
      postCardsInGrid: postItems.length,
      gapBetweenGridAndPagination,
      paginationMarginTop: pagination ? window.getComputedStyle(pagination).marginTop : null
    };
  });

  console.log('Optimized Measurements:', JSON.stringify(data, null, 2));

  // 1. Top Screenshot
  await page.screenshot({ path: path.join(outDir, '01_optimized_top_view.png') });

  // 2. Scroll to sticky activation (middle)
  console.log('Scrolling to sticky active position...');
  await page.evaluate(() => {
    window.scrollTo({ top: 1250, behavior: 'instant' });
  });
  await page.waitForTimeout(600);

  const stickyMidData = await page.evaluate(() => {
    const card = document.querySelector('.card-feature-panel--overview');
    const rect = card ? card.getBoundingClientRect() : null;
    return {
      scrollY: window.scrollY,
      cardTop: rect ? rect.top : null,
      cardBottom: rect ? rect.bottom : null,
      stickyState: card ? card.getAttribute('data-sticky-state') : null,
      className: card ? card.className : null,
      transform: card ? card.style.transform : null
    };
  });
  console.log('Sticky Mid Data:', JSON.stringify(stickyMidData, null, 2));
  await page.screenshot({ path: path.join(outDir, '02_optimized_sticky_middle.png') });

  // 3. Scroll to bottom pagination alignment
  console.log('Scrolling to bottom pagination alignment...');
  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
  });
  await page.waitForTimeout(600);

  const bottomData = await page.evaluate(() => {
    const card = document.querySelector('.card-feature-panel--overview');
    const pagination = document.querySelector('#home-pagination');
    const cardRect = card ? card.getBoundingClientRect() : null;
    const pagRect = pagination ? pagination.getBoundingClientRect() : null;
    return {
      cardBottom: cardRect ? cardRect.bottom : null,
      paginationBottom: pagRect ? pagRect.bottom : null,
      bottomDiff: (cardRect && pagRect) ? Math.abs(cardRect.bottom - pagRect.bottom) : null,
      stickyState: card ? card.getAttribute('data-sticky-state') : null,
      transform: card ? card.style.transform : null
    };
  });
  console.log('Bottom Alignment Data:', JSON.stringify(bottomData, null, 2));
  await page.screenshot({ path: path.join(outDir, '03_optimized_bottom_alignment.png') });

  // 4. Closeup of the Tag Card
  const cardElement = await page.$('.card-feature-panel--overview');
  if (cardElement) {
    await cardElement.screenshot({ path: path.join(outDir, '04_optimized_tag_card_closeup.png') });
  }

  // 5. Closeup of the Grid & Pagination gap
  const recentPostsElement = await page.$('#recent-posts');
  if (recentPostsElement) {
    await page.evaluate(() => {
      const pagination = document.querySelector('#home-pagination');
      if (pagination) {
        pagination.scrollIntoView({ block: 'center' });
      }
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '05_optimized_pagination_gap_closeup.png') });
  }

  await browser.close();
  console.log('Verification run successfully complete!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
