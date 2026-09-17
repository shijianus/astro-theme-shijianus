import { chromium } from 'playwright';

async function verifyLive() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to live production site: https://blog.epocanvas.com/...');
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle', timeout: 45000 });

  // 1. Light Mode - Default State (todayCard visible)
  const tgHandle = await page.$('.topGroup');
  const swiperHandle = await page.$('.swiper_container_card');
  if (swiperHandle) {
    await swiperHandle.screenshot({ path: 'scripts/verify_live_default_light.png' });
    console.log('Saved scripts/verify_live_default_light.png');
  }

  // 2. Light Mode - Toggled State (recent-post-item visible)
  const toggleLabel = await page.$('label[for="today-card-toggle"]');
  if (!toggleLabel) {
    throw new Error('Could not find label[for="today-card-toggle"] on live site!');
  }

  console.log('Clicking toggle button to reveal card grid...');
  await toggleLabel.click();
  await page.waitForTimeout(600);

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: 'scripts/verify_live_toggled_light.png' });
    console.log('Saved scripts/verify_live_toggled_light.png');
  }

  const report = await page.evaluate(() => {
    const tg = document.querySelector('.topGroup');
    const b1 = document.querySelector('.topGroup__stack-back--one');
    const b2 = document.querySelector('.topGroup__stack-back--two');
    const items = Array.from(document.querySelectorAll('.topGroup .recent-post-item'));

    if (!tg || !b1 || !b2 || items.length === 0) {
      return { error: 'Missing DOM elements', tg: !!tg, b1: !!b1, b2: !!b2, itemsCount: items.length };
    }

    const tgRect = tg.getBoundingClientRect();
    const b1Rect = b1.getBoundingClientRect();
    const b2Rect = b2.getBoundingClientRect();

    const itemsData = items.map((el, idx) => {
      const r = el.getBoundingClientRect();
      // Allow 0.5px tolerance for subpixel antialiasing/rotation math
      const containedInB1 = (
        r.top >= b1Rect.top - 0.5 &&
        r.bottom <= b1Rect.bottom + 0.5 &&
        r.left >= b1Rect.left - 0.5 &&
        r.right <= b1Rect.right + 0.5
      );
      const containedInB2 = (
        r.top >= b2Rect.top - 0.5 &&
        r.bottom <= b2Rect.bottom + 0.5 &&
        r.left >= b2Rect.left - 0.5 &&
        r.right <= b2Rect.right + 0.5
      );
      return {
        index: idx,
        top: r.top - tgRect.top,
        left: r.left - tgRect.left,
        bottom: r.bottom - tgRect.top,
        right: r.right - tgRect.left,
        width: r.width,
        height: r.height,
        containedInB1,
        containedInB2,
        bottomDeltaB1: b1Rect.bottom - r.bottom,
        bottomDeltaB2: b2Rect.bottom - r.bottom
      };
    });

    return {
      tg: { width: tgRect.width, height: tgRect.height },
      b1: {
        top: b1Rect.top - tgRect.top,
        left: b1Rect.left - tgRect.left,
        bottom: b1Rect.bottom - tgRect.top,
        right: b1Rect.right - tgRect.left,
        width: b1Rect.width,
        height: b1Rect.height
      },
      b2: {
        top: b2Rect.top - tgRect.top,
        left: b2Rect.left - tgRect.left,
        bottom: b2Rect.bottom - tgRect.top,
        right: b2Rect.right - tgRect.left,
        width: b2Rect.width,
        height: b2Rect.height
      },
      items: itemsData,
      allContained: itemsData.every(it => it.containedInB1 && it.containedInB2)
    };
  });

  console.log('Production Live Audit Report:');
  console.log(JSON.stringify(report, null, 2));

  if (!report.allContained) {
    throw new Error(`FAIL on Live Production: Not all items are wrapped! Details: ${JSON.stringify(report.items)}`);
  }
  console.log('PASS: All recent-post-item cards are 100% wrapped and enclosed by stack-back on https://blog.epocanvas.com/!');

  // 3. Dark Mode Test
  console.log('Testing Dark Mode on live production site...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(400);

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: 'scripts/verify_live_toggled_dark.png' });
    console.log('Saved scripts/verify_live_toggled_dark.png');
  }

  // 4. Mobile responsive check (<1200px)
  console.log('Testing Tablet/Mobile view (<1200px)...');
  await page.setViewportSize({ width: 800, height: 900 });
  await page.waitForTimeout(400);
  const mobileTopGroup = await page.$('.topGroup');
  if (mobileTopGroup) {
    await mobileTopGroup.screenshot({ path: 'scripts/verify_live_mobile.png' });
    console.log('Saved scripts/verify_live_mobile.png');
  }

  await browser.close();
  console.log('Live Verification completely successful!');
}

verifyLive().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
