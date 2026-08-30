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

  // 1. Capture initial state: Default single block ("默认情况下，一块地方只有1块") with pure icon toolbar buttons
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-01-initial-single-block.png' });
  console.log("Saved: mindmap-01-initial-single-block.png (Default single block & icon buttons)");

  // 2. Sensitive click test: Click the root node to expand primary branches
  console.log("Clicking root node with enhanced sensitive pointer...");
  await page.evaluate(() => {
    const node = document.querySelector('.mindmap-wrapper .markmap-node');
    if (node) {
      node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-02-expanded-branches.png' });
  console.log("Saved: mindmap-02-expanded-branches.png (Primary branches expanded)");

  // 3. Click "Expand All" icon button in toolbar
  console.log("Clicking Expand All icon button...");
  await page.click('.mindmap-btn--expand-all');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-03-expand-all.png' });
  console.log("Saved: mindmap-03-expand-all.png (Expand all levels)");

  // 4. Test Fullscreen Mode (positioned below the top navigation bar)
  console.log("Clicking Fullscreen button...");
  await page.click('.mindmap-btn--fullscreen');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-04-fullscreen-under-header.png' });
  console.log("Saved: mindmap-04-fullscreen-under-header.png (Fullscreen below header)");

  // 5. Test exiting Fullscreen via Escape key
  console.log("Pressing Escape key to exit fullscreen...");
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // 6. Click "Collapse to Single Block" icon button
  console.log("Clicking Collapse to Single Block icon button...");
  await page.click('.mindmap-btn--collapse-all');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-05-collapse-to-single-block.png' });
  console.log("Saved: mindmap-05-collapse-to-single-block.png (Reset to single block after Esc)");

  // 7. Test Dark Mode
  console.log("Testing Dark mode with all branches expanded...");
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.click('.mindmap-btn--expand-all');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-06-dark-mode-all.png' });
  console.log("Saved: mindmap-06-dark-mode-all.png (Dark mode all branches)");

  // 8. Test Dedicated Example post /posts/example-mindmap/
  console.log("Navigating to /posts/example-mindmap/...");
  await page.goto('http://127.0.0.1:4321/posts/example-mindmap/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const el = document.querySelector('.mindmap-wrapper');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-07-example-post.png' });
  console.log("Saved: mindmap-07-example-post.png");

  await browser.close();
  console.log("All screenshots captured successfully!");
})();
