const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  console.log("Navigating to content-formats-and-markup-mastery...");
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });
  
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('h4')).find(h => h.textContent && h.textContent.includes('Markdown 编写规范与语法参考'));
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(600);

  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/mindmap-guide-section-updated.png' });
  console.log("Saved: mindmap-guide-section-updated.png");

  await browser.close();
})();
