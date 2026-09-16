import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4321/...');
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

  // 1. Light Mode - Default State (todayCard visible)
  const tgHandle = await page.$('.topGroup');
  const swiperHandle = await page.$('.swiper_container_card');
  if (swiperHandle) {
    await swiperHandle.screenshot({ path: 'scripts/verify_local_default_light.png' });
    console.log('Saved scripts/verify_local_default_light.png');
  }

  // 2. Light Mode - Toggled State (recent-post-item visible)
  const toggleLabel = await page.$('label[for="today-card-toggle"]');
  if (toggleLabel) {
    await toggleLabel.click();
    await page.waitForTimeout(400);

    if (swiperHandle) {
      await swiperHandle.screenshot({ path: 'scripts/verify_local_toggled_light.png' });
      console.log('Saved scripts/verify_local_toggled_light.png');
    }

    const report = await page.evaluate(() => {
      const tg = document.querySelector('.topGroup');
      const b1 = document.querySelector('.topGroup__stack-back--one');
      const b2 = document.querySelector('.topGroup__stack-back--two');
      const items = Array.from(document.querySelectorAll('.topGroup .recent-post-item'));

      const tgRect = tg.getBoundingClientRect();
      const b1Rect = b1.getBoundingClientRect();
      const b2Rect = b2.getBoundingClientRect();

      const itemsData = items.map((el, idx) => {
        const r = el.getBoundingClientRect();
        const containedInB1 = (
          r.top >= b1Rect.top &&
          r.bottom <= b1Rect.bottom &&
          r.left >= b1Rect.left &&
          r.right <= b1Rect.right
        );
        const containedInB2 = (
          r.top >= b2Rect.top &&
          r.bottom <= b2Rect.bottom &&
          r.left >= b2Rect.left &&
          r.right <= b2Rect.right
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

    console.log('Local Audit Report:', JSON.stringify(report, null, 2));

    if (!report.allContained) {
      throw new Error(`FAIL: Not all recent-post-item elements are wrapped in stack-back! Details: ${JSON.stringify(report.items)}`);
    }
    console.log('PASS: All recent-post-item elements are 100% wrapped and contained in topGroup__stack-back!');
  }

  // 3. Dark Mode Test
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(300);
  if (swiperHandle) {
    await swiperHandle.screenshot({ path: 'scripts/verify_local_toggled_dark.png' });
    console.log('Saved scripts/verify_local_toggled_dark.png');
  }

  await browser.close();
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
