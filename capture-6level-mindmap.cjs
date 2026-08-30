const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  console.log("Navigating to example mindmap post...");
  await page.goto('http://127.0.0.1:4321/posts/example-mindmap/', { waitUntil: 'networkidle' });
  
  console.log("Waiting for .mindmap-wrapper...");
  await page.waitForSelector('.mindmap-wrapper', { timeout: 10000 });

  const wrappers = await page.$$('.mindmap-wrapper');
  console.log(`Found ${wrappers.length} mindmap instances on the page.`);

  // Scroll to first mindmap (6-Level Architecture)
  await page.evaluate(() => {
    const el = document.querySelectorAll('.mindmap-wrapper')[0];
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(600);

  // 1. Initial State (Collapsed Single Block showing meta: 6 层分支结构)
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-6level-01-initial.png' });
  console.log("Saved: mindmap-6level-01-initial.png");

  // 2. Click Expand All on First Mindmap to reveal all 6 levels
  console.log("Expanding all 6 levels on first mindmap...");
  const expandBtn1 = await page.$('.mindmap-wrapper:nth-of-type(1) .mindmap-btn--expand-all') || await page.$('.mindmap-btn--expand-all');
  if (expandBtn1) {
    await expandBtn1.click();
    await page.waitForTimeout(500);
  }

  // Click fit view on first mindmap
  const fitBtn1 = await page.$('.mindmap-wrapper:nth-of-type(1) .mindmap-btn--fit') || await page.$('.mindmap-btn--fit');
  if (fitBtn1) {
    await fitBtn1.click();
    await page.waitForTimeout(400);
  }

  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-6level-02-expanded-6levels.png' });
  console.log("Saved: mindmap-6level-02-expanded-6levels.png");

  // 3. Scroll to second mindmap (Infinite Nested List 9-Level Tree)
  if (wrappers.length > 1) {
    await page.evaluate(() => {
      const el = document.querySelectorAll('.mindmap-wrapper')[1];
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(600);

    const expandBtn2 = (await page.$$('.mindmap-btn--expand-all'))[1];
    if (expandBtn2) {
      await expandBtn2.click();
      await page.waitForTimeout(500);
    }
    const fitBtn2 = (await page.$$('.mindmap-btn--fit'))[1];
    if (fitBtn2) {
      await fitBtn2.click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-6level-03-infinite-nested-list.png' });
    console.log("Saved: mindmap-6level-03-infinite-nested-list.png");
  }

  // 4. Test Fullscreen Mode with 6-level mindmap
  await page.evaluate(() => {
    const el = document.querySelectorAll('.mindmap-wrapper')[0];
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(400);
  const fullscreenBtn = (await page.$$('.mindmap-btn--fullscreen'))[0];
  if (fullscreenBtn) {
    await fullscreenBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-6level-04-fullscreen-6levels.png' });
    console.log("Saved: mindmap-6level-04-fullscreen-6levels.png");
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 5. Dark Mode Screenshot
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-6level-05-darkmode-expanded.png' });
  console.log("Saved: mindmap-6level-05-darkmode-expanded.png");

  await browser.close();
  console.log("All 6-level test screenshots completed!");
})();
