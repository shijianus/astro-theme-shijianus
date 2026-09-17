import { chromium } from 'playwright';

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to https://blog.epocanvas.com/...');
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle', timeout: 30000 });

  const data = await page.evaluate(() => {
    const topGroup = document.querySelector('.topGroup');
    const stack = document.querySelector('.topGroup__stack');
    const backOne = document.querySelector('.topGroup__stack-back--one');
    const backTwo = document.querySelector('.topGroup__stack-back--two');
    const items = Array.from(document.querySelectorAll('.topGroup .recent-post-item'));
    const todayCard = document.querySelector('.topGroup .todayCard');

    const getMetrics = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
        width: rect.width,
        height: rect.height,
        opacity: style.opacity,
        display: style.display,
        visibility: style.visibility,
        transform: style.transform,
        zIndex: style.zIndex
      };
    };

    return {
      topGroup: getMetrics(topGroup),
      stack: getMetrics(stack),
      backOne: getMetrics(backOne),
      backTwo: getMetrics(backTwo),
      todayCard: getMetrics(todayCard),
      items: items.map((it, idx) => ({ idx, ...getMetrics(it) }))
    };
  });

  console.log('Metrics on live site:');
  console.log(JSON.stringify(data, null, 2));

  // Take screenshot of topGroup in default state
  const topGroupHandle = await page.$('.topGroup');
  if (topGroupHandle) {
    await topGroupHandle.screenshot({ path: 'scripts/topGroup_default_live.png' });
    console.log('Saved scripts/topGroup_default_live.png');
  }

  // Toggle todayCard to reveal stack
  const toggleLabel = await page.$('label[for="today-card-toggle"]');
  if (toggleLabel) {
    await toggleLabel.click();
    await page.waitForTimeout(500);

    const toggledData = await page.evaluate(() => {
      const topGroup = document.querySelector('.topGroup');
      const backOne = document.querySelector('.topGroup__stack-back--one');
      const backTwo = document.querySelector('.topGroup__stack-back--two');
      const items = Array.from(document.querySelectorAll('.topGroup .recent-post-item'));
      const getMetrics = (el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right,
          width: rect.width,
          height: rect.height
        };
      };
      return {
        topGroup: getMetrics(topGroup),
        backOne: getMetrics(backOne),
        backTwo: getMetrics(backTwo),
        items: items.map((it, idx) => ({ idx, ...getMetrics(it) }))
      };
    });

    console.log('Metrics after toggle:');
    console.log(JSON.stringify(toggledData, null, 2));

    if (topGroupHandle) {
      await topGroupHandle.screenshot({ path: 'scripts/topGroup_toggled_live.png' });
      console.log('Saved scripts/topGroup_toggled_live.png');
    }
  }

  await browser.close();
}

inspect().catch((err) => {
  console.error(err);
  process.exit(1);
});
