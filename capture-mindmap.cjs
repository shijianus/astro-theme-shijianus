const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const page = await context.newPage();

  console.log("Navigating to content formats master guide...");
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Scroll to Mindmap section
  console.log("Locating Mindmap wrapper...");
  const mindmapWrapper = await page.$('.mindmap-wrapper');
  if (!mindmapWrapper) {
    console.error("ERROR: .mindmap-wrapper not found!");
    const html = await page.content();
    console.log("Page snippet:", html.slice(0, 1000));
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

  // 2. Click the root node circle or node to expand branches
  console.log("Clicking root node circle to expand branches...");
  const circle = await page.$('.mindmap-wrapper .markmap-circle');
  if (circle) {
    await circle.click();
    await page.waitForTimeout(800);
  } else {
    // Alternatively click node
    const node = await page.$('.mindmap-wrapper .markmap-node');
    if (node) await node.click();
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-02-expanded-branches.png' });
  console.log("Saved: mindmap-02-expanded-branches.png (Expanded branches)");

  // 3. Click "Expand All" in toolbar
  console.log("Clicking Expand All button...");
  const expandAllBtn = await page.$('.mindmap-btn--expand-all');
  if (expandAllBtn) {
    await expandAllBtn.click();
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-03-expand-all.png' });
  console.log("Saved: mindmap-03-expand-all.png (Expand all levels)");

  // 4. Click "Collapse to Single Block" in toolbar
  console.log("Clicking Collapse to Single Block button...");
  const collapseAllBtn = await page.$('.mindmap-btn--collapse-all');
  if (collapseAllBtn) {
    await collapseAllBtn.click();
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-04-collapse-to-single-block.png' });
  console.log("Saved: mindmap-04-collapse-to-single-block.png (Reset to single block)");

  // 5. Test Dark Mode
  console.log("Testing Dark mode...");
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  if (expandAllBtn) {
    await expandAllBtn.click();
    await page.waitForTimeout(800);
  }
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
