import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const evidenceDir = '/root/.gemini/antigravity-cli/brain/813b32b2-c249-4a1a-947c-75723a0450e5/evidence';
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

async function verifyLive() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  console.log('Navigating to live production site: https://blog.epocanvas.com/ ...');
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);

  const swiperHandle = await page.$('.swiper_container_card');
  const tgHandle = await page.$('.topGroup');

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: path.join(evidenceDir, 'live_backboard_streamlined_01_default_light.png') });
    console.log('Saved live_backboard_streamlined_01_default_light.png');
  }

  // 1. Live Alignment Measurement & Absence of Redundant Header/Badge
  const liveMetrics = await page.evaluate(() => {
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
      noRedundantHeader: !Boolean(header),
      noRedundantBadge: !Boolean(returnBadge),
      backboardTitle: backboard ? backboard.getAttribute('title') : null
    };
  });

  console.log('Live Production Alignment Metrics:', JSON.stringify(liveMetrics, null, 2));

  if (!liveMetrics.hasBackboard) {
    throw new Error('FAIL: Backboard missing in live production DOM!');
  }
  if (!liveMetrics.noRedundantHeader) {
    throw new Error('FAIL: Redundant .topGroup__header still exists on live production!');
  }
  if (!liveMetrics.noRedundantBadge) {
    throw new Error('FAIL: Redundant #topGroup-backboard-badge still exists on live production!');
  }
  if (liveMetrics.backboardTitle) {
    throw new Error(`FAIL: Backboard still has title="${liveMetrics.backboardTitle}" on live production!`);
  }
  if (liveMetrics.topDiff > 1 || liveMetrics.bottomDiff > 1) {
    throw new Error(`FAIL: Vertical alignment mismatch on live production! topDiff=${liveMetrics.topDiff}, bottomDiff=${liveMetrics.bottomDiff}`);
  }
  if (liveMetrics.rightDiff > 1) {
    throw new Error(`FAIL: Right edge alignment mismatch on live production! rightDiff=${liveMetrics.rightDiff}, tgRight=${liveMetrics.tgRight}, profileRight=${liveMetrics.profileRight}`);
  }

  // 2. Click banner button to flip open deck
  const bannerBtn = await page.$('.banner-button[for="today-card-toggle"]');
  if (!bannerBtn) {
    throw new Error('FAIL: .banner-button[for="today-card-toggle"] not found on live production!');
  }
  await bannerBtn.click();
  await page.waitForTimeout(500);

  const isCheckedFlipped = await page.$eval('#today-card-toggle', el => el.checked);
  if (!isCheckedFlipped) {
    throw new Error('FAIL: Banner button click did not toggle #today-card-toggle on live production!');
  }

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: path.join(evidenceDir, 'live_backboard_streamlined_02_cards_toggled_light.png') });
    console.log('Saved live_backboard_streamlined_02_cards_toggled_light.png');
  }
  if (tgHandle) {
    await tgHandle.screenshot({ path: path.join(evidenceDir, 'live_backboard_streamlined_03_topgroup_cards_light.png') });
    console.log('Saved live_backboard_streamlined_03_topgroup_cards_light.png');
  }

  // 3. Verify Layout Audit on live production: zero overlap, zero text cut off, clean balanced grid
  const layoutAudit = await page.evaluate(() => {
    const tg = document.querySelector('.topGroup').getBoundingClientRect();
    const cards = Array.from(document.querySelectorAll('.topGroup .recent-post-item'));

    const cardAudits = cards.map((c, i) => {
      const cr = c.getBoundingClientRect();
      const title = c.querySelector('.article-title');
      const tr = title.getBoundingClientRect();
      const titleStyle = window.getComputedStyle(title);

      return {
        index: i,
        cardHeight: Math.round(cr.height),
        cardWidth: Math.round(cr.width),
        isInsideTopGroup: cr.top >= tg.top && cr.bottom <= tg.bottom && cr.left >= tg.left && cr.right <= tg.right,
        isTitleInside: tr.bottom <= cr.bottom,
        isClamped: titleStyle.webkitLineClamp === '2',
        titleText: title.innerText.trim()
      };
    });

    return {
      cardCount: cards.length,
      allCardsInside: cardAudits.every(c => c.isInsideTopGroup),
      allTitlesInside: cardAudits.every(c => c.isTitleInside),
      cardAudits
    };
  });

  console.log('Live Production Layout Audit:', JSON.stringify(layoutAudit, null, 2));

  if (layoutAudit.cardCount !== 6) {
    throw new Error(`FAIL: Expected 6 cards on live production, found ${layoutAudit.cardCount}!`);
  }
  if (!layoutAudit.allCardsInside) {
    throw new Error('FAIL: Some cards overflow topGroup container on live production!');
  }
  if (!layoutAudit.allTitlesInside) {
    throw new Error('FAIL: Some card titles overflow or are cut off on live production!');
  }

  // 4. Test Return via clicking exposed backboard padding
  console.log('Testing rollback via clicking exposed backboard padding on live production...');
  await page.click('#topGroup-backboard', { position: { x: 30, y: 4 } });
  await page.waitForTimeout(500);

  const isCheckedAfterBackboardClick = await page.$eval('#today-card-toggle', el => el.checked);
  console.log('State after live backboard click: isChecked =', isCheckedAfterBackboardClick);
  if (isCheckedAfterBackboardClick !== false) {
    throw new Error('FAIL: Direct click on live #topGroup-backboard did not rollback #today-card-toggle!');
  }

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: path.join(evidenceDir, 'live_backboard_streamlined_04_returned_todaycard.png') });
    console.log('Saved live_backboard_streamlined_04_returned_todaycard.png');
  }

  // 5. Re-open and test ESC key rollback on live production
  await bannerBtn.click();
  await page.waitForTimeout(400);
  console.log('Testing rollback via Escape key on live production...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  const isCheckedAfterEsc = await page.$eval('#today-card-toggle', el => el.checked);
  console.log('State after live Escape key: isChecked =', isCheckedAfterEsc);
  if (isCheckedAfterEsc !== false) {
    throw new Error('FAIL: Pressing Escape on live production did not rollback #today-card-toggle!');
  }

  // 6. Test Dark Mode on live production
  await bannerBtn.click();
  await page.waitForTimeout(400);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(400);

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: path.join(evidenceDir, 'live_backboard_streamlined_05_cards_toggled_dark.png') });
    console.log('Saved live_backboard_streamlined_05_cards_toggled_dark.png');
  }
  if (tgHandle) {
    await tgHandle.screenshot({ path: path.join(evidenceDir, 'live_backboard_streamlined_06_topgroup_cards_dark.png') });
    console.log('Saved live_backboard_streamlined_06_topgroup_cards_dark.png');
  }

  // 7. Mobile Viewport Check (390x844)
  console.log('Testing mobile layout on live production...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const mobileHero = await page.$('#home_top');
  if (mobileHero) {
    await mobileHero.screenshot({ path: path.join(evidenceDir, 'live_backboard_streamlined_07_mobile.png') });
    console.log('Saved live_backboard_streamlined_07_mobile.png');
  }

  console.log('\n>>> ALL LIVE PRODUCTION STREAMLINED BACKBOARD & ALIGNMENT TESTS PASSED 100%! <<<');
  await browser.close();
}

verifyLive().catch(err => {
  console.error(err);
  process.exit(1);
});
