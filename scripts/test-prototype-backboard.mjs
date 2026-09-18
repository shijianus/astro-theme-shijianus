import { chromium } from 'playwright';

async function testFullLifecycle() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle' });

  // 1. Inject styling
  await page.addStyleTag({
    content: `
      /* Align container right with profileCard */
      #home_top {
        padding-right: 4px !important;
      }
      .swiper_container_card {
        width: 1372px !important;
      }
      .topGroup {
        width: 644px !important;
        height: 348px !important;
        position: relative !important;
        padding: 6px !important;
        box-sizing: border-box !important;
        border-radius: 16px !important;
        background: var(--card-bg) !important;
        border: 1px solid var(--card-border) !important;
        box-shadow: var(--anzhiyu-shadow-border) !important;
      }

      /* Clean Backboard */
      .topGroup__backboard {
        position: absolute !important;
        inset: 0 !important;
        z-index: 1 !important;
        border-radius: 16px !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: flex-end !important;
        justify-content: flex-end !important;
        pointer-events: auto !important;
      }

      /* 6 cards inside topGroup */
      .topGroup .recent-post-item {
        position: relative !important;
        z-index: 2 !important;
        width: calc((100% - 12px) / 3) !important;
        height: calc((100% - 6px) / 2) !important;
        margin: 0 !important;
        border-radius: 10px !important;
      }

      .topGroup .recent-post-item .post_cover {
        height: 88px !important;
        min-height: 88px !important;
        max-height: 88px !important;
        flex: 0 0 88px !important;
      }

      .topGroup .recent-post-item .recent-post-info {
        padding: 6px 8px 4px 8px !important;
      }

      .topGroup .recent-post-item .article-title {
        font-size: 12.5px !important;
        line-height: 1.35 !important;
        max-height: 35px !important;
      }

      /* todayCard matches full topGroup */
      .topGroup .todayCard {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        border-radius: 16px !important;
        z-index: 5 !important;
        transition: opacity 0.3s ease, transform 0.3s ease !important;
      }

      .today-card-toggle:checked ~ .swiper_container_card .todayCard {
        opacity: 0 !important;
        pointer-events: none !important;
        transform: scale(0.96) !important;
      }
    `
  });

  // Inject the backboard DOM element if not present in live page yet
  await page.evaluate(() => {
    const tg = document.querySelector('.topGroup');
    if (tg && !tg.querySelector('.topGroup__backboard')) {
      const backboard = document.createElement('label');
      backboard.className = 'topGroup__backboard';
      backboard.setAttribute('for', 'today-card-toggle');
      backboard.setAttribute('title', '点击背板返回今日推荐');
      backboard.innerHTML = `
        <span style="position: absolute; bottom: 8px; right: 12px; font-size: 11px; opacity: 0.6; pointer-events: none;">
          点击背板返回推荐 ↺
        </span>
      `;
      tg.insertBefore(backboard, tg.firstChild);
    }
  });

  // State 1: Default
  const isChecked1 = await page.$eval('#today-card-toggle', el => el.checked);
  console.log('State 1 (Default): isChecked =', isChecked1);
  await page.screenshot({ path: 'scripts/verify_step1_default.png' });

  // State 2: Click banner button to flip
  const bannerBtn = await page.$('.banner-button[for="today-card-toggle"]');
  await bannerBtn.click();
  await page.waitForTimeout(300);

  const isChecked2 = await page.$eval('#today-card-toggle', el => el.checked);
  console.log('State 2 (Flipped to cards): isChecked =', isChecked2);
  await page.screenshot({ path: 'scripts/verify_step2_cards_revealed.png' });

  // State 3: Click backboard to flip back!
  // Click at the bottom right corner of topGroup (where backboard is accessible)
  const tgBox = await page.$eval('.topGroup', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width - 10, y: r.y + r.height - 4 };
  });

  console.log('Clicking backboard at:', tgBox);
  await page.mouse.click(tgBox.x, tgBox.y);
  await page.waitForTimeout(300);

  const isChecked3 = await page.$eval('#today-card-toggle', el => el.checked);
  console.log('State 3 (Flipped back to todayCard): isChecked =', isChecked3);
  await page.screenshot({ path: 'scripts/verify_step3_returned_todaycard.png' });

  if (isChecked3 !== false) {
    throw new Error('FAILED: Clicking backboard did not uncheck #today-card-toggle!');
  }

  console.log('SUCCESS! Full flip-forward and flip-back cycle verified!');
  await browser.close();
}

testFullLifecycle().catch(err => {
  console.error(err);
  process.exit(1);
});
