const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log("Navigating to /posts/content-formats-and-markup-mastery/ ...");
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Standard Code Block Shell (Light Mode)
  await page.evaluate(() => {
    const el = document.querySelector('.code-block-shell');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/code-01-shell-light.png' });
  console.log("Saved: code-01-shell-light.png");

  // 2. Interactive Dropdown Switcher - React (Light Mode)
  await page.evaluate(() => {
    const el = document.querySelector('.article-dropdown-switcher');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/code-02-dropdown-react-light.png' });
  console.log("Saved: code-02-dropdown-react-light.png");

  // 3. Interactive Dropdown Switcher - Vue (Light Mode)
  await page.selectOption('.dropdown-switcher__select', 'vue-tab');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/code-03-dropdown-vue-light.png' });
  console.log("Saved: code-03-dropdown-vue-light.png");

  // 4. Interactive Tabs - pnpm & npm (Light Mode)
  await page.evaluate(() => {
    const el = document.querySelector('.article-tabs');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/code-04-tabs-light.png' });
  console.log("Saved: code-04-tabs-light.png");

  // 5. Dark Mode Switch
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  await page.waitForTimeout(600);

  // 6. Interactive Tabs (Dark Mode)
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/code-05-tabs-dark.png' });
  console.log("Saved: code-05-tabs-dark.png");

  // 7. Interactive Dropdown Switcher - React (Dark Mode)
  await page.selectOption('.dropdown-switcher__select', 'react-tab');
  await page.evaluate(() => {
    const el = document.querySelector('.article-dropdown-switcher');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/code-06-dropdown-react-dark.png' });
  console.log("Saved: code-06-dropdown-react-dark.png");

  // 8. Standard Code Block Shell (Dark Mode)
  await page.evaluate(() => {
    const el = document.querySelector('.code-block-shell');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/code-07-shell-dark.png' });
  console.log("Saved: code-07-shell-dark.png");

  // 9. Example-tabs page
  await page.goto('http://127.0.0.1:4321/posts/example-tabs/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
    const el = document.querySelector('.article-tabs');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/code-08-example-tabs-light.png' });
  console.log("Saved: code-08-example-tabs-light.png");

  await page.evaluate(() => {
    const el = document.querySelector('.article-dropdown-switcher');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/code-09-example-dropdown-light.png' });
  console.log("Saved: code-09-example-dropdown-light.png");

  await browser.close();
  console.log("All visual validation screenshots generated successfully!");
})();
