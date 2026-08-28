const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  console.log("Navigating to markdown mastery showcase...");
  await page.goto('http://127.0.0.1:4321/posts/markdown-syntax-mastery/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Math formulas view
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/markdown-preview-math.png' });
  console.log("Saved: markdown-preview-math.png");

  // 2. Scroll to Mermaid & Admonitions
  await page.evaluate(() => {
    const el = document.getElementById('二图表与绘图代码块diagrams-as-code') || document.querySelector('.mermaid-diagram-wrap');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/markdown-preview-diagrams.png' });
  console.log("Saved: markdown-preview-diagrams.png");

  // 3. Scroll to Admonitions & Code Blocks
  await page.evaluate(() => {
    const el = document.getElementById('三告示框与提示块admonition--callout') || document.querySelector('.admonition');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/markdown-preview-callouts.png' });
  console.log("Saved: markdown-preview-callouts.png");

  // 4. Scroll to Tables & Task Lists
  await page.evaluate(() => {
    const el = document.getElementById('五任务列表与表格全能增强task-lists--tables') || document.querySelector('.article-table-wrap');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/markdown-preview-tables.png' });
  console.log("Saved: markdown-preview-tables.png");

  // 5. Scroll to Encrypted Section & Trigger Password Modal
  await page.evaluate(() => {
    const el = document.getElementById('六特异功能加密内容与密码弹窗解锁encryption--password-modal') || document.querySelector('.article-encrypted-box');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/markdown-preview-encryption.png' });
  console.log("Saved: markdown-preview-encryption.png");

  // Click password unlock button to show modal
  await page.click('.encrypted-box__btn');
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/markdown-preview-password-modal.png' });
  console.log("Saved: markdown-preview-password-modal.png");

  // Type correct password and submit
  await page.fill('.encrypted-modal__input', 'shijianus2026');
  await page.click('.encrypted-modal__submit');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/markdown-preview-unlocked.png' });
  console.log("Saved: markdown-preview-unlocked.png");

  // 6. Scroll to Blur, Mosaic, Tabs, Embeds
  await page.evaluate(() => {
    const el = document.getElementById('七特异功能高斯模糊马赛克与剧透隐藏blur-mosaic--spoilers') || document.querySelector('.blur-text');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/markdown-preview-special.png' });
  console.log("Saved: markdown-preview-special.png");

  // 7. Dark Mode Test
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/markdown-preview-darkmode.png' });
  console.log("Saved: markdown-preview-darkmode.png");

  await browser.close();
  console.log("All visual validation screenshots captured successfully!");
})();
