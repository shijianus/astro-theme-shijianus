const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log("Navigating...");
  const response = await page.goto('http://localhost:4321/posts/anzhiyu-markdown-showcase/');
  if (response.status() !== 200) {
    console.log("Failed to load page: ", response.status());
  }
  
  // wait for render
  await page.waitForTimeout(2000);
  
  // highlight the TOC card
  await page.evaluate(() => {
    const toc = document.getElementById('card-toc');
    if (toc) toc.style.outline = '4px solid green';
  });

  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/toc-screenshot.png' });
  console.log("Screenshot 1 saved to /home/shijian/projects/shijianus-blog/toc-screenshot.png");
  
  // scroll down and take another
  await page.evaluate(() => window.scrollBy(0, 1000));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/toc-screenshot-scrolled.png' });
  console.log("Screenshot 2 saved to /home/shijian/projects/shijianus-blog/toc-screenshot-scrolled.png");
  
  await browser.close();
})();
