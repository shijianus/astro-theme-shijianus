import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/mobile_audit';
const BASE_URL = 'https://blog.epocanvas.com';

async function run() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  console.log('--- 1. Post Detail Page Inspection ---');
  await page.goto(`${BASE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  // Take screenshot of hero
  await page.screenshot({ path: path.join(outDir, 'fast_01_post_hero.png') });

  // 1.1 Inspect #rightside
  const rightsideInfo = await page.evaluate(() => {
    const rs = document.getElementById('rightside');
    const getBtn = (id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      return { id, width: Math.round(r.width), height: Math.round(r.height), display: s.display, flex: s.flex };
    };
    return {
      container: rs ? {
        bottom: window.getComputedStyle(rs).bottom,
        right: window.getComputedStyle(rs).right,
        height: rs.offsetHeight,
        display: window.getComputedStyle(rs).display
      } : null,
      buttons: [
        getBtn('readmode'),
        getBtn('mobile-toc-button'),
        getBtn('to_comment'),
        getBtn('translate'),
        getBtn('rightside-config'),
        getBtn('darkmode'),
        getBtn('hide-rightside-btn'),
        getBtn('go-up')
      ]
    };
  });
  console.log('Rightside Breakdown:', JSON.stringify(rightsideInfo, null, 2));

  // 1.2 Test Mobile TOC click
  const tocBtn = page.locator('#mobile-toc-button');
  if (await tocBtn.isVisible()) {
    await tocBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, 'fast_02_toc_clicked.png') });
    const tocState = await page.evaluate(() => {
      const card = document.getElementById('card-toc');
      return {
        cardDisplay: card ? window.getComputedStyle(card).display : 'none',
        cardRect: card ? card.getBoundingClientRect() : null
      };
    });
    console.log('TOC state after click:', tocState);
  }

  // 1.3 Test Reward Modal
  const rewardBtn = page.locator('.post-reward button.reward-button').first();
  if (await rewardBtn.isVisible()) {
    await rewardBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await rewardBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, 'fast_03_reward_modal.png') });
    
    // Switch to Stripe tab in modal if available
    const stripeTab = page.locator('.reward-modal button:has-text("Stripe"), .reward-modal [data-reward-tab="stripe"]').first();
    if (await stripeTab.isVisible()) {
      await stripeTab.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(outDir, 'fast_04_reward_stripe.png') });
    }
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);
  }

  // 1.4 Test Comments area and Pagination floating card
  await page.evaluate(() => {
    const comment = document.getElementById('post-comment');
    if (comment) comment.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'fast_05_comment_and_floating_next.png') });

  const paginInfo = await page.evaluate(() => {
    const pagin = document.querySelector('#pagination.pagination-post');
    const rs = document.getElementById('rightside');
    const pRect = pagin ? pagin.getBoundingClientRect() : null;
    const rRect = rs ? rs.getBoundingClientRect() : null;
    let overlap = false;
    if (pRect && rRect && pagin && window.getComputedStyle(pagin).display !== 'none' && window.getComputedStyle(pagin).visibility !== 'hidden') {
      overlap = !(pRect.bottom < rRect.top || pRect.top > rRect.bottom || pRect.right < rRect.left || pRect.left > rRect.right);
    }
    return {
      paginVisible: pagin ? window.getComputedStyle(pagin).visibility !== 'hidden' && window.getComputedStyle(pagin).opacity !== '0' : false,
      paginRect: pRect,
      rightsideRect: rRect,
      isOverlap: overlap
    };
  });
  console.log('Pagination card info at comments:', JSON.stringify(paginInfo, null, 2));

  // --- 2. Support Page Inspection ---
  console.log('\n--- 2. Support Page (/support/) Inspection ---');
  await page.goto(`${BASE_URL}/support/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(outDir, 'fast_06_support_page.png') });

  // Scroll down to presets and payment
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, 'fast_07_support_presets.png') });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, 'fast_08_support_bottom.png') });

  // --- 3. About Page Inspection ---
  console.log('\n--- 3. About Page (/about/) Inspection ---');
  await page.goto(`${BASE_URL}/about/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, 'fast_09_about_page.png') });

  await page.evaluate(() => window.scrollBy(0, 700));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, 'fast_10_about_skills_and_badges.png') });

  await browser.close();
  console.log('✅ fast cases audit completed successfully!');
}

run().catch(console.error);
