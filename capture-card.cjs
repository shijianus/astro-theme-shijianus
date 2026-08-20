const { chromium } = require('playwright');

(async () => {
  const isAfter = process.argv.includes('--after');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log("Navigating to home page...");
  const response = await page.goto('http://localhost:4321/');
  if (!response || response.status() !== 200) {
    console.log("Failed to load page, make sure dev server is running on port 4321");
  }
  
  // wait for render
  await page.waitForTimeout(2000);
  
  const fileName = isAfter ? 'card-after.png' : 'card-before.png';
  const path = `/home/shijian/projects/shijianus-blog/${fileName}`;

  // take screenshot of the recent-posts area
  const recentPosts = await page.$('#recent-posts');
  if (recentPosts) {
    await recentPosts.screenshot({ path });
    console.log(`Screenshot saved to ${path}`);
  } else {
    // fallback to full page if element not found
    await page.screenshot({ path });
    console.log(`Element not found, full screenshot saved to ${path}`);
  }
  
  await browser.close();
})();
