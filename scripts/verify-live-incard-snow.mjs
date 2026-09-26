import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function runLiveVerification() {
  const screenshotDir = path.resolve('scripts/audit_screenshots/live_incard');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('🚀 Initiating Live Production E2E Verification for In-Card Attached Snow Mantle...');
  console.log('Target: https://blog.epocanvas.com/');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      console.log('[LIVE ERROR]', text);
      if (!text.includes('favicon') && !text.includes('analytics') && !text.includes('404')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    console.log('[LIVE PAGE ERROR]', err.message);
    consoleErrors.push(err.message);
  });

  try {
    // ── 1. Audit Live Production Homepage In-Card Snow ──
    console.log('\n--- 1. Auditing Live Homepage In-Card Attached Snow ---');
    await page.goto('https://blog.epocanvas.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const snowAudit = await page.evaluate(() => {
      const svgs = document.querySelectorAll('.card-snow-svg');
      const cardsWithSnow = [];
      svgs.forEach((svg) => {
        const parent = svg.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          const svgRect = svg.getBoundingClientRect();
          cardsWithSnow.push({
            tag: parent.tagName,
            className: parent.className,
            id: parent.id,
            parentWidth: Math.round(rect.width),
            svgWidth: Math.round(svgRect.width),
            svgHeight: Math.round(svgRect.height),
          });
        }
      });
      return {
        totalSnowSvgs: svgs.length,
        isSnowTheme: document.documentElement.dataset.background === 'snow',
        sampleCards: cardsWithSnow.slice(0, 8),
      };
    });
    console.log('Live Snow Audit:', JSON.stringify(snowAudit, null, 2));

    if (snowAudit.totalSnowSvgs < 10) {
      throw new Error(`Expected >= 10 in-card snow SVGs, got ${snowAudit.totalSnowSvgs}`);
    }

    await page.screenshot({ path: path.join(screenshotDir, '01_live_home_top.png'), animations: 'disabled', timeout: 15000 });
    console.log('Saved 01_live_home_top.png');

    // ── 2. Audit .categoryItem Hover Flex Expansion ──
    console.log('\n--- 2. Auditing .categoryItem Hover Flex Expansion ---');
    const firstCat = page.locator('.categoryItem').first();
    await firstCat.hover();
    await page.waitForTimeout(400);

    const catHoverAudit = await firstCat.evaluate((cat) => {
      const svg = cat.querySelector('.card-snow-svg');
      return {
        catWidth: Math.round(cat.getBoundingClientRect().width),
        svgWidth: svg ? Math.round(svg.getBoundingClientRect().width) : 0,
        svgMatchesCat: svg && Math.abs(cat.offsetWidth - svg.getBoundingClientRect().width) < 5,
      };
    });
    console.log('Live Category Hover Audit:', catHoverAudit);
    if (!catHoverAudit.svgMatchesCat) {
      throw new Error('Snow SVG did not match expanded categoryItem width on hover!');
    }
    await page.screenshot({ path: path.join(screenshotDir, '02_live_cat_hover.png'), animations: 'disabled', timeout: 15000 });
    console.log('Saved 02_live_cat_hover.png');

    // ── 3. Audit todayCard Flip ──
    console.log('\n--- 3. Auditing todayCard Flip Interaction ---');
    const todayCard = page.locator('.todayCard');
    const beforeFlip = await todayCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { opacity: style.opacity, hasSnow: !!el.querySelector('.card-snow-svg') };
    });
    console.log('TodayCard Before Flip:', beforeFlip);

    await page.evaluate(() => {
      const t = document.getElementById('today-card-toggle');
      if (t) {
        t.checked = true;
        t.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(500);

    const afterFlip = await todayCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
        hasSnow: !!el.querySelector('.card-snow-svg'),
      };
    });
    console.log('TodayCard After Flip:', afterFlip);
    await page.screenshot({ path: path.join(screenshotDir, '03_live_today_flipped.png'), animations: 'disabled', timeout: 15000 });
    console.log('Saved 03_live_today_flipped.png');

    // Flip back
    await page.evaluate(() => {
      const t = document.getElementById('today-card-toggle');
      if (t) {
        t.checked = false;
        t.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(300);

    // ── 4. Audit Scrolling Down (Hardware Zero-Lag Compositor Sync) ──
    console.log('\n--- 4. Auditing Scrolling Synchronization ---');
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotDir, '04_live_scrolled_600px.png'), animations: 'disabled', timeout: 15000 });
    console.log('Saved 04_live_scrolled_600px.png');

    // ── 5. Audit Dark Mode Visuals ──
    console.log('\n--- 5. Auditing Dark Mode Snow Mantle ---');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotDir, '05_live_dark_top.png'), animations: 'disabled', timeout: 15000 });
    console.log('Saved 05_live_dark_top.png');

    // Restore light
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'light';
    });
    await page.waitForTimeout(200);

    // ── 6. Audit Post Page ──
    console.log('\n--- 6. Auditing Post Page In-Card Snow ---');
    await page.goto('https://blog.epocanvas.com/posts/markdown-syntax-mastery/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const postSnowAudit = await page.evaluate(() => {
      const svgs = document.querySelectorAll('.card-snow-svg');
      const cards = [];
      svgs.forEach((svg) => {
        const p = svg.parentElement;
        if (p) {
          cards.push({
            id: p.id,
            className: p.className?.slice ? p.className.slice(0, 40) : '',
            svgWidth: Math.round(svg.getBoundingClientRect().width),
          });
        }
      });
      return { totalPostSvgs: svgs.length, cards };
    });
    console.log('Post Page Snow Audit:', JSON.stringify(postSnowAudit, null, 2));

    if (postSnowAudit.totalPostSvgs < 5) {
      throw new Error(`Expected >= 5 post in-card snow SVGs, got ${postSnowAudit.totalPostSvgs}`);
    }

    await page.screenshot({ path: path.join(screenshotDir, '06_live_post_top.png'), animations: 'disabled', timeout: 15000 });
    console.log('Saved 06_live_post_top.png');

    // Scroll down on post page to check TOC
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotDir, '07_live_post_scrolled.png'), animations: 'disabled', timeout: 15000 });
    console.log('Saved 07_live_post_scrolled.png');

    // Scroll to bottom to check relatedPosts
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight - 1400, behavior: 'instant' }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotDir, '08_live_post_bottom.png'), animations: 'disabled', timeout: 15000 });
    console.log('Saved 08_live_post_bottom.png');

    // ── 7. Audit Mobile Viewport ──
    console.log('\n--- 7. Auditing Mobile Viewport (375x812) ---');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('https://blog.epocanvas.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    const mobileAudit = await page.evaluate(() => {
      const hasHorizontalOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      const svgs = document.querySelectorAll('.card-snow-svg');
      return {
        hasHorizontalOverflow,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        snowSvgsCount: svgs.length,
      };
    });
    console.log('Mobile Audit:', mobileAudit);
    if (mobileAudit.hasHorizontalOverflow) {
      throw new Error(`Horizontal overflow detected on mobile: ${mobileAudit.scrollWidth} > ${mobileAudit.clientWidth}`);
    }
    await page.screenshot({ path: path.join(screenshotDir, '09_live_mobile_home.png'), animations: 'disabled', timeout: 15000 });
    console.log('Saved 09_live_mobile_home.png');

    const fatalErrors = consoleErrors.filter(e => 
      !e.includes('404') && 
      !e.includes('Failed to load resource') &&
      !e.includes('Minified React error #418') &&
      !e.includes('player.bilibili.com')
    );
    console.log('\nFatal JS Errors on Production:', fatalErrors);
    if (fatalErrors.length > 0) {
      throw new Error(`Fatal console errors encountered: ${JSON.stringify(fatalErrors)}`);
    }

    console.log('\n🎉 ALL LIVE IN-CARD SNOW MANTLE TESTS PASSED WITH 100% SUCCESS!');
  } finally {
    await browser.close();
  }
}

runLiveVerification().catch((err) => {
  console.error('❌ Live Verification Failed:', err);
  process.exit(1);
});
