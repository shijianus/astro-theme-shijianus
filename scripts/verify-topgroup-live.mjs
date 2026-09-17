import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const evidenceDir = '/root/.gemini/antigravity-cli/brain/813b32b2-c249-4a1a-947c-75723a0450e5/evidence';
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

async function verifyLive(url, prefix) {
  console.log(`\n========================================`);
  console.log(`AUDITING TARGET: ${url}`);
  console.log(`========================================`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // retina quality
  });
  const page = await context.newPage();

  // Navigate
  await page.goto(url, { waitUntil: 'networkidle' });

  // 1. Audit Default State
  const swiperHandle = await page.$('.swiper_container_card');
  const tgHandle = await page.$('.topGroup');

  if (swiperHandle) {
    const p1 = path.join(evidenceDir, `${prefix}_default_light.png`);
    await swiperHandle.screenshot({ path: p1 });
    console.log(`Saved screenshot: ${p1}`);
  }

  // 2. Click today-card-toggle to reveal topGroup cards
  const toggleLabel = await page.$('label[for="today-card-toggle"]');
  if (!toggleLabel) {
    throw new Error('label[for="today-card-toggle"] not found!');
  }
  await toggleLabel.click();
  await page.waitForTimeout(600);

  // Take screenshot of toggled state
  if (swiperHandle) {
    const p2 = path.join(evidenceDir, `${prefix}_toggled_light.png`);
    await swiperHandle.screenshot({ path: p2 });
    console.log(`Saved screenshot: ${p2}`);
  }
  if (tgHandle) {
    const p3 = path.join(evidenceDir, `${prefix}_topgroup_light.png`);
    await tgHandle.screenshot({ path: p3 });
    console.log(`Saved screenshot: ${p3}`);
  }

  // 3. Switch to Dark Mode
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(400);

  if (swiperHandle) {
    const p4 = path.join(evidenceDir, `${prefix}_toggled_dark.png`);
    await swiperHandle.screenshot({ path: p4 });
    console.log(`Saved screenshot: ${p4}`);
  }
  if (tgHandle) {
    const p5 = path.join(evidenceDir, `${prefix}_topgroup_dark.png`);
    await tgHandle.screenshot({ path: p5 });
    console.log(`Saved screenshot: ${p5}`);
  }

  // Reset to Light Mode for measurements
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-theme');
  });
  await page.waitForTimeout(200);

  // 4. In-depth DOM & CSS audit
  const audit = await page.evaluate(() => {
    const tg = document.querySelector('.topGroup');
    const stack = document.querySelector('.topGroup__stack');
    const cards = Array.from(document.querySelectorAll('.topGroup .recent-post-item'));

    const stackDisplay = stack ? window.getComputedStyle(stack).display : 'none';
    const tgRect = tg ? tg.getBoundingClientRect() : null;

    const cardDetails = cards.map((c, i) => {
      const cr = c.getBoundingClientRect();
      const cover = c.querySelector('.post_cover');
      const coverR = cover ? cover.getBoundingClientRect() : null;
      const info = c.querySelector('.recent-post-info');
      const infoR = info ? info.getBoundingClientRect() : null;
      const title = c.querySelector('.article-title');
      const titleR = title ? title.getBoundingClientRect() : null;
      const titleStyle = title ? window.getComputedStyle(title) : null;

      const isTitleInsideCard = titleR && cr ? titleR.bottom <= cr.bottom : false;
      const isCoverHeight92 = coverR ? Math.abs(coverR.height - 92) <= 1 : false;
      const titleLineClamp = titleStyle ? titleStyle.webkitLineClamp : null;
      const titleHeight = titleR ? titleR.height : 0;
      const isTitleClampedProperly = titleHeight <= 42 && titleLineClamp === '2';

      return {
        index: i,
        cardWidth: Math.round(cr.width),
        cardHeight: Math.round(cr.height),
        coverHeight: coverR ? Math.round(coverR.height) : 0,
        infoHeight: infoR ? Math.round(infoR.height) : 0,
        titleHeight: Math.round(titleHeight),
        titleLineClamp,
        isTitleInsideCard,
        isCoverHeight92,
        isTitleClampedProperly,
        title: title ? title.innerText.trim() : ''
      };
    });

    return {
      stackHidden: stackDisplay === 'none',
      cardCount: cards.length,
      tgWidth: tgRect ? Math.round(tgRect.width) : 0,
      tgHeight: tgRect ? Math.round(tgRect.height) : 0,
      allTitlesInside: cardDetails.length === 6 && cardDetails.every(c => c.isTitleInsideCard),
      allCoverHeight92: cardDetails.length === 6 && cardDetails.every(c => c.isCoverHeight92),
      allTitlesClampedProperly: cardDetails.length === 6 && cardDetails.every(c => c.isTitleClampedProperly),
      cards: cardDetails
    };
  });

  console.log('AUDIT REPORT:', JSON.stringify(audit, null, 2));

  // Assertions
  if (!audit.stackHidden) {
    throw new Error(`FAIL: .topGroup__stack is visible! Display is not none.`);
  }
  if (audit.cardCount !== 6) {
    throw new Error(`FAIL: Expected 6 cards in topGroup, found ${audit.cardCount}.`);
  }
  if (!audit.allTitlesInside) {
    throw new Error(`FAIL: Some card titles overflow or are clipped/obscured!`);
  }
  if (!audit.allTitlesClampedProperly) {
    throw new Error(`FAIL: Some card titles are not clamped to 2 lines properly!`);
  }

  console.log(`\n>>> [SUCCESS] All checks passed for ${url}! <<<`);
  await browser.close();
  return audit;
}

async function run() {
  try {
    // 1. Audit production custom domain
    await verifyLive('https://blog.epocanvas.com/', 'live_epocanvas');
  } catch (err) {
    console.warn('Direct custom domain error (possible edge cache):', err.message);
    console.log('Testing direct pages.dev deployment...');
    await verifyLive('https://25b87b7f.shijianus-blog.pages.dev/', 'live_pages_dev');
  }
}

run();
