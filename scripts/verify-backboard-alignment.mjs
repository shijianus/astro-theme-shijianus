import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const evidenceDir = '/root/.gemini/antigravity-cli/brain/813b32b2-c249-4a1a-947c-75723a0450e5/evidence';
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

async function verifyBackboard() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  
  console.log('Navigating to http://localhost:4321/...');
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

  // 1. Initial State Measurement
  const swiperHandle = await page.$('.swiper_container_card');
  const tgHandle = await page.$('.topGroup');

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: path.join(evidenceDir, 'backboard_01_default_light.png') });
    console.log('Saved backboard_01_default_light.png');
  }

  // Check initial alignment
  const initialMetrics = await page.evaluate(() => {
    const banner = document.querySelector('#bannerGroup').getBoundingClientRect();
    const tg = document.querySelector('.topGroup').getBoundingClientRect();
    const profile = document.querySelector('.card-widget.card-info').getBoundingClientRect();
    const toggle = document.querySelector('#today-card-toggle');
    const backboard = document.querySelector('.topGroup__backboard');
    const header = document.querySelector('.topGroup__header');
    const returnBadge = document.querySelector('#topGroup-backboard-badge');

    return {
      isChecked: toggle ? toggle.checked : null,
      bannerHeight: Math.round(banner.height),
      tgHeight: Math.round(tg.height),
      bannerTop: Math.round(banner.top),
      tgTop: Math.round(tg.top),
      bannerBottom: Math.round(banner.bottom),
      tgBottom: Math.round(tg.bottom),
      profileRight: Math.round(profile.right),
      tgRight: Math.round(tg.right),
      topDiff: Math.abs(Math.round(banner.top) - Math.round(tg.top)),
      bottomDiff: Math.abs(Math.round(banner.bottom) - Math.round(tg.bottom)),
      rightDiff: Math.abs(Math.round(profile.right) - Math.round(tg.right)),
      hasBackboard: Boolean(backboard),
      hasHeader: Boolean(header),
      hasReturnBadge: Boolean(returnBadge)
    };
  });

  console.log('Initial Alignment Metrics:', JSON.stringify(initialMetrics, null, 2));

  if (!initialMetrics.hasBackboard) {
    throw new Error('FAIL: .topGroup__backboard element was not found in DOM!');
  }
  if (!initialMetrics.hasHeader || !initialMetrics.hasReturnBadge) {
    throw new Error('FAIL: .topGroup__header or #topGroup-backboard-badge was not found in DOM!');
  }
  if (initialMetrics.topDiff > 1 || initialMetrics.bottomDiff > 1) {
    throw new Error(`FAIL: Vertical alignment mismatch with bannerGroup! topDiff=${initialMetrics.topDiff}, bottomDiff=${initialMetrics.bottomDiff}`);
  }
  if (initialMetrics.rightDiff > 1) {
    throw new Error(`FAIL: Right edge alignment mismatch with profileCard! rightDiff=${initialMetrics.rightDiff}, tgRight=${initialMetrics.tgRight}, profileRight=${initialMetrics.profileRight}`);
  }

  // 2. Flip forward to reveal 6 cards
  const bannerBtn = await page.$('.banner-button[for="today-card-toggle"]');
  if (!bannerBtn) {
    throw new Error('FAIL: .banner-button[for="today-card-toggle"] not found!');
  }
  await bannerBtn.click();
  await page.waitForTimeout(400);

  const isCheckedFlipped = await page.$eval('#today-card-toggle', el => el.checked);
  if (!isCheckedFlipped) {
    throw new Error('FAIL: Clicking banner-button did not check #today-card-toggle!');
  }

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: path.join(evidenceDir, 'backboard_02_cards_toggled_light.png') });
    console.log('Saved backboard_02_cards_toggled_light.png');
  }
  if (tgHandle) {
    await tgHandle.screenshot({ path: path.join(evidenceDir, 'backboard_03_topgroup_cards_light.png') });
    console.log('Saved backboard_03_topgroup_cards_light.png');
  }

  // 3. Verify cards and header layout: zero overlap, zero text cut off
  const layoutAudit = await page.evaluate(() => {
    const header = document.querySelector('.topGroup__header').getBoundingClientRect();
    const returnBadge = document.querySelector('#topGroup-backboard-badge').getBoundingClientRect();
    const cards = Array.from(document.querySelectorAll('.topGroup .recent-post-item'));

    const cardAudits = cards.map((c, i) => {
      const cr = c.getBoundingClientRect();
      const title = c.querySelector('.article-title');
      const tr = title.getBoundingClientRect();
      const titleStyle = window.getComputedStyle(title);

      return {
        index: i,
        cardHeight: cr.height,
        cardWidth: cr.width,
        isBelowHeader: cr.top >= header.bottom - 1, // Card top must be below header
        isTitleInside: tr.bottom <= cr.bottom,
        isClamped: titleStyle.webkitLineClamp === '2',
        titleText: title.innerText.trim()
      };
    });

    return {
      headerVisible: header.height > 0 && returnBadge.width > 0,
      allCardsBelowHeader: cardAudits.every(c => c.isBelowHeader),
      allTitlesInside: cardAudits.every(c => c.isTitleInside),
      cardAudits
    };
  });

  console.log('Layout Audit:', JSON.stringify(layoutAudit, null, 2));
  if (!layoutAudit.headerVisible) {
    throw new Error('FAIL: .topGroup__header is not visible in toggled state!');
  }
  if (!layoutAudit.allCardsBelowHeader) {
    throw new Error('FAIL: Some cards overlap with the header bar!');
  }
  if (!layoutAudit.allTitlesInside) {
    throw new Error('FAIL: Some card titles overflow or are cut off!');
  }

  // 4. Test Return via clicking the Return Badge
  console.log('Clicking return badge (#topGroup-backboard-badge)...');
  await page.click('#topGroup-backboard-badge');
  await page.waitForTimeout(400);

  const isCheckedAfterBadgeClick = await page.$eval('#today-card-toggle', el => el.checked);
  console.log('State after return badge click: isChecked =', isCheckedAfterBadgeClick);
  if (isCheckedAfterBadgeClick !== false) {
    throw new Error('FAIL: Clicking #topGroup-backboard-badge did not rollback #today-card-toggle!');
  }

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: path.join(evidenceDir, 'backboard_04_returned_todaycard.png') });
    console.log('Saved backboard_04_returned_todaycard.png');
  }

  // 5. Re-open and test Return via clicking the Backboard background
  await bannerBtn.click();
  await page.waitForTimeout(300);
  const isCheckedReopen1 = await page.$eval('#today-card-toggle', el => el.checked);
  if (!isCheckedReopen1) throw new Error('FAIL: Re-opening failed!');

  console.log('Clicking backboard (#topGroup-backboard) at exposed header region...');
  await page.click('#topGroup-backboard', { position: { x: 30, y: 15 } });
  await page.waitForTimeout(400);

  const isCheckedAfterBackboardClick = await page.$eval('#today-card-toggle', el => el.checked);
  console.log('State after backboard click: isChecked =', isCheckedAfterBackboardClick);
  if (isCheckedAfterBackboardClick !== false) {
    throw new Error('FAIL: Clicking #topGroup-backboard did not rollback #today-card-toggle!');
  }

  // 6. Re-open and test Return via ESC key
  await bannerBtn.click();
  await page.waitForTimeout(300);
  const isCheckedReopen2 = await page.$eval('#today-card-toggle', el => el.checked);
  if (!isCheckedReopen2) throw new Error('FAIL: Re-opening for ESC failed!');

  console.log('Pressing Escape key...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  const isCheckedAfterEsc = await page.$eval('#today-card-toggle', el => el.checked);
  console.log('State after Escape key: isChecked =', isCheckedAfterEsc);
  if (isCheckedAfterEsc !== false) {
    throw new Error('FAIL: Pressing Escape did not rollback #today-card-toggle!');
  }

  // 7. Test Dark Mode styling
  await bannerBtn.click();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: path.join(evidenceDir, 'backboard_05_cards_toggled_dark.png') });
    console.log('Saved backboard_05_cards_toggled_dark.png');
  }
  if (tgHandle) {
    await tgHandle.screenshot({ path: path.join(evidenceDir, 'backboard_06_topgroup_cards_dark.png') });
    console.log('Saved backboard_06_topgroup_cards_dark.png');
  }

  console.log('\n>>> ALL BACKBOARD & ALIGNMENT & ROLLBACK TESTS PASSED PERFECTLY! <<<');
  await browser.close();
}

verifyBackboard().catch(err => {
  console.error(err);
  process.exit(1);
});
