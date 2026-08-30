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
  try {
    await page.waitForSelector('.mindmap-wrapper', { timeout: 8000 });
  } catch (err) {
    console.error("Timeout waiting for .mindmap-wrapper!");
    const pres = await page.evaluate(() => Array.from(document.querySelectorAll('pre')).map(p => ({
      class: p.className,
      lang: p.dataset.language,
      text: p.textContent.slice(0, 40)
    })));
    console.log("Pres on page:", JSON.stringify(pres, null, 2));
    await browser.close();
    process.exit(1);
  }

  await page.evaluate(() => {
    const el = document.querySelector('.mindmap-wrapper');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(1000);

  // 1. Capture initial state: Default single block ("默认情况下，一块地方只有1块")
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-01-initial-single-block.png' });
  console.log("Saved: mindmap-01-initial-single-block.png (Default single block)");

  // 2. Click the root node to expand branches ("后续可以展开多向，像分支一样散开！")
  console.log("Clicking root node to expand primary branches...");
  await page.evaluate(() => {
    const node = document.querySelector('.mindmap-wrapper .markmap-node');
    if (node) {
      node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-02-expanded-branches.png' });
  console.log("Saved: mindmap-02-expanded-branches.png (Primary branches expanded)");

  // 3. Click "Expand All" in toolbar
  console.log("Clicking Expand All button...");
  await page.click('.mindmap-btn--expand-all');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-03-expand-all.png' });
  console.log("Saved: mindmap-03-expand-all.png (Expand all levels)");

  // 4. Click "Collapse to Single Block" in toolbar
  console.log("Clicking Collapse to Single Block button...");
  await page.click('.mindmap-btn--collapse-all');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-04-collapse-to-single-block.png' });
  console.log("Saved: mindmap-04-collapse-to-single-block.png (Reset to single block)");

  // 5. Test Dark Mode with all branches expanded
  console.log("Testing Dark mode...");
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.click('.mindmap-btn--expand-all');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-05-dark-mode-all.png' });
  console.log("Saved: mindmap-05-dark-mode-all.png (Dark mode all branches)");

  // 6. Test Dedicated Example post /posts/example-mindmap/
  console.log("Navigating to /posts/example-mindmap/...");
  await page.goto('http://127.0.0.1:4321/posts/example-mindmap/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const el = document.querySelector('.mindmap-wrapper');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-06-example-post.png' });
  console.log("Saved: mindmap-06-example-post.png");

  await browser.close();
  console.log("All screenshots captured successfully!");
})();
