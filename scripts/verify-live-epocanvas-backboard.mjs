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
    await swiperHandle.screenshot({ path: path.join(evidenceDir, 'live_backboard_01_default_light.png') });
    console.log('Saved live_backboard_01_default_light.png');
  }

  // 1. Live Alignment Measurement
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
      hasHeader: Boolean(header),
      hasReturnBadge: Boolean(returnBadge)
    };
  });

  console.log('Live Production Alignment Metrics:', JSON.stringify(liveMetrics, null, 2));

  if (!liveMetrics.hasBackboard || !liveMetrics.hasHeader || !liveMetrics.hasReturnBadge) {
    throw new Error('FAIL: Backboard, header, or return badge missing in live DOM!');
  }
  if (liveMetrics.topDiff > 1 || liveMetrics.bottomDiff > 1) {
    throw new Error(`FAIL: Vertical alignment mismatch! topDiff=${liveMetrics.topDiff}, bottomDiff=${liveMetrics.bottomDiff}`);
  }
  if (liveMetrics.rightDiff > 1) {
    throw new Error(`FAIL: Right edge alignment mismatch! rightDiff=${liveMetrics.rightDiff}, tgRight=${liveMetrics.tgRight}, profileRight=${liveMetrics.profileRight}`);
  }

  // 2. Click banner button to flip open deck
  const bannerBtn = await page.$('.banner-button[for="today-card-toggle"]');
  if (!bannerBtn) {
    throw new Error('FAIL: .banner-button[for="today-card-toggle"] not found!');
  }
  await bannerBtn.click();
  await page.waitForTimeout(500);

  const isCheckedFlipped = await page.$eval('#today-card-toggle', el => el.checked);
  if (!isCheckedFlipped) {
    throw new Error('FAIL: Banner button click did not toggle #today-card-toggle on production!');
  }

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: path.join(evidenceDir, 'live_backboard_02_cards_toggled_light.png') });
    console.log('Saved live_backboard_02_cards_toggled_light.png');
  }
  if (tgHandle) {
    await tgHandle.screenshot({ path: path.join(evidenceDir, 'live_backboard_03_topgroup_cards_light.png') });
    console.log('Saved live_backboard_03_topgroup_cards_light.png');
  }

  // 3. Verify Layout Audit on live production
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
        isBelowHeader: cr.top >= header.bottom - 1,
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

  console.log('Live Production Layout Audit:', JSON.stringify(layoutAudit, null, 2));
  if (!layoutAudit.headerVisible || !layoutAudit.allCardsBelowHeader || !layoutAudit.allTitlesInside) {
    throw new Error('FAIL: Live layout audit failed!');
  }

  // 4. Test Return via Return Badge
  console.log('Live test: Clicking return badge (#topGroup-backboard-badge)...');
  await page.click('#topGroup-backboard-badge');
  await page.waitForTimeout(400);

  const isCheckedAfterBadgeClick = await page.$eval('#today-card-toggle', el => el.checked);
  console.log('Live state after return badge click: isChecked =', isCheckedAfterBadgeClick);
  if (isCheckedAfterBadgeClick !== false) {
    throw new Error('FAIL: Clicking return badge did not rollback on production!');
  }

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: path.join(evidenceDir, 'live_backboard_04_returned_todaycard.png') });
    console.log('Saved live_backboard_04_returned_todaycard.png');
  }

  // 5. Test Return via Backboard Click
  await bannerBtn.click();
  await page.waitForTimeout(300);
  console.log('Live test: Clicking backboard (#topGroup-backboard)...');
  await page.click('#topGroup-backboard', { position: { x: 30, y: 15 } });
  await page.waitForTimeout(400);

  const isCheckedAfterBackboardClick = await page.$eval('#today-card-toggle', el => el.checked);
  console.log('Live state after backboard click: isChecked =', isCheckedAfterBackboardClick);
  if (isCheckedAfterBackboardClick !== false) {
    throw new Error('FAIL: Clicking backboard did not rollback on production!');
  }

  // 6. Test Return via ESC key
  await bannerBtn.click();
  await page.waitForTimeout(300);
  console.log('Live test: Pressing Escape key...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  const isCheckedAfterEsc = await page.$eval('#today-card-toggle', el => el.checked);
  console.log('Live state after Escape: isChecked =', isCheckedAfterEsc);
  if (isCheckedAfterEsc !== false) {
    throw new Error('FAIL: Escape key did not rollback on production!');
  }

  // 7. Dark Mode Test
  await bannerBtn.click();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: path.join(evidenceDir, 'live_backboard_05_cards_toggled_dark.png') });
    console.log('Saved live_backboard_05_cards_toggled_dark.png');
  }
  if (tgHandle) {
    await tgHandle.screenshot({ path: path.join(evidenceDir, 'live_backboard_06_topgroup_cards_dark.png') });
    console.log('Saved live_backboard_06_topgroup_cards_dark.png');
  }

  // 8. Mobile Viewport Test (390 x 844)
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await mobilePage.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);

  const mobileTg = await mobilePage.$('.topGroup');
  if (mobileTg) {
    await mobileTg.screenshot({ path: path.join(evidenceDir, 'live_backboard_07_mobile.png') });
    console.log('Saved live_backboard_07_mobile.png');
  }
  await mobilePage.close();

  console.log('\n============================================================');
  console.log('>>> PRODUCTION (https://blog.epocanvas.com/) E2E VERIFIED! <<<');
  console.log('============================================================\n');

  await browser.close();
}

verifyLive().catch(err => {
  console.error(err);
  process.exit(1);
});
