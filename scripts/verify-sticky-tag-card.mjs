import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('scripts/screenshots/evidence');
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4321/ ...');
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

  // 1. Initial State Screenshot - top of page
  await page.screenshot({ path: path.join(outDir, '01_initial_state_top.png') });

  // Get dimensions of initial elements
  const initialData = await page.evaluate(() => {
    const card = document.querySelector('.card-feature-panel--overview');
    const recentPosts = document.querySelector('#recent-posts');
    const postsGrid = document.querySelector('#recent-posts .grid');
    const pagination = document.querySelector('#home-pagination');

    return {
      card: card ? {
        className: card.className,
        rect: card.getBoundingClientRect(),
        scrollHeight: card.scrollHeight,
        clientHeight: card.clientHeight
      } : null,
      recentPosts: recentPosts ? {
        rect: recentPosts.getBoundingClientRect()
      } : null,
      postsGrid: postsGrid ? {
        rect: postsGrid.getBoundingClientRect()
      } : null,
      pagination: pagination ? {
        rect: pagination.getBoundingClientRect(),
        marginTop: window.getComputedStyle(pagination).marginTop,
        gapAbove: postsGrid ? pagination.getBoundingClientRect().top - postsGrid.getBoundingClientRect().bottom : null
      } : null
    };
  });
  console.log('Initial measurements:', JSON.stringify(initialData, null, 2));

  // 2. Scroll to sticky activation point
  await page.evaluate(() => {
    const card = document.querySelector('.card-feature-panel--overview');
    if (card) {
      window.scrollTo({ top: card.offsetTop - 80, behavior: 'instant' });
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '02_initial_state_scrolled_sticking.png') });

  // 3. Scroll to bottom near pagination
  await page.evaluate(() => {
    const pagination = document.querySelector('#home-pagination');
    if (pagination) {
      window.scrollTo({ top: pagination.offsetTop - window.innerHeight + pagination.offsetHeight + 100, behavior: 'instant' });
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '03_initial_state_bottom_pagination.png') });

  await browser.close();
  console.log('Initial capture complete!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
