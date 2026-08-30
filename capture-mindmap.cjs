const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  console.log("Navigating to content formats master guide...");
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });
  
  console.log("Waiting for .mindmap-wrapper...");
  await page.waitForSelector('.mindmap-wrapper', { timeout: 10000 });

  await page.evaluate(() => {
    const el = document.querySelector('.mindmap-wrapper');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(1000);

  // 1. Initial State: Pure distinct icon buttons + single block
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-01-initial-single-block.png' });
  console.log("Saved: mindmap-01-initial-single-block.png");

  // 2. Click "Expand All" and capture Toast popup live!
  console.log("Clicking Expand All icon button & capturing Toast Popup...");
  await page.click('.mindmap-btn--expand-all');
  await page.waitForTimeout(300); // Capture while toast is actively showing
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-02-toast-notification.png' });
  console.log("Saved: mindmap-02-toast-notification.png (Toast popup active)");

  // 3. Click "Fit View" (🎯 Target icon) and capture Toast
  console.log("Clicking Fit View (Target icon)...");
  await page.click('.mindmap-btn--fit');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-03-toast-fit-view.png' });
  console.log("Saved: mindmap-03-toast-fit-view.png");

  // 4. Click "Fullscreen" (Expanding arrows) below header
  console.log("Clicking Fullscreen button...");
  await page.click('.mindmap-btn--fullscreen');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-04-fullscreen-under-header.png' });
  console.log("Saved: mindmap-04-fullscreen-under-header.png (Fullscreen under header with toast)");

  // 5. Press Esc to exit fullscreen
  console.log("Pressing Esc key to exit fullscreen...");
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  // 6. Click "Collapse to Single Block"
  console.log("Clicking Collapse to Single Block button...");
  await page.click('.mindmap-btn--collapse-all');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-05-collapse-to-single-block.png' });
  console.log("Saved: mindmap-05-collapse-to-single-block.png (Reset single block with toast)");

  // 7. Test Dark Mode
  console.log("Testing Dark mode...");
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.click('.mindmap-btn--expand-all');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-06-dark-mode-all.png' });
  console.log("Saved: mindmap-06-dark-mode-all.png");

  await browser.close();
  console.log("All screenshots captured successfully!");
})();
