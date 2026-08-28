const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const page = await context.newPage();

  console.log("Navigating to content formats master guide...");
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Overview & SSG Matrix
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-01-overview.png' });
  console.log("Saved: format-01-overview.png");

  // 2. Post Formats (Aside, Status, Quote)
  await page.evaluate(() => {
    const el = document.getElementById('四wordpress-风格文章形态post-formats-全量实装与视觉呈现') || document.querySelector('.article-aside');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-02-post-formats.png' });
  console.log("Saved: format-02-post-formats.png");

  // 3. Gallery & Polaroid & Video & Audio
  await page.evaluate(() => {
    const el = document.querySelector('.article-gallery');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-03-gallery-media.png' });
  console.log("Saved: format-03-gallery-media.png");

  // 4. Bookmark Card & Chat Dialogue
  await page.evaluate(() => {
    const el = document.querySelector('.article-bookmark');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-04-chat-bookmark.png' });
  console.log("Saved: format-04-chat-bookmark.png");

  // 5. Interactive Dropdown Switcher (Switching frameworks live!)
  await page.evaluate(() => {
    const el = document.getElementById('五特殊的下拉框格式与动态交互组件dropdown-selectors--interactive-formats') || document.querySelector('.article-dropdown-switcher');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-05-dropdown-react.png' });
  console.log("Saved: format-05-dropdown-react.png");

  // Select Vue in dropdown
  await page.selectOption('.dropdown-switcher__select', 'vue-tab');
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-06-dropdown-vue.png' });
  console.log("Saved: format-06-dropdown-vue.png");

  // 6. Accordions, Tabs, Multi-Column
  await page.evaluate(() => {
    const el = document.getElementById('六手风琴折叠选项卡与多栏排版collapsibles-tabs--columns') || document.querySelector('.article-accordion-group');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-07-accordions-columns.png' });
  console.log("Saved: format-07-accordions-columns.png");

  // 7. Admonitions (13 types) & Math & Mermaid
  await page.evaluate(() => {
    const el = document.getElementById('七13-种语义告示框admonitions--github-alerts') || document.querySelector('.admonition');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-08-admonitions.png' });
  console.log("Saved: format-08-admonitions.png");

  // 8. Mermaid Diagrams
  await page.evaluate(() => {
    const el = document.getElementById('八学术数学公式katex与图表mermaid-11') || document.querySelector('.mermaid-diagram-wrap');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-09-math-diagrams.png' });
  console.log("Saved: format-09-math-diagrams.png");

  // 9. Encryption password modal dialog trigger
  await page.evaluate(() => {
    const el = document.getElementById('九安全隐私模糊马赛克与剧透隐藏特异功能') || document.querySelector('.article-encrypted-box');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(800);
  await page.click('.encrypted-box__btn');
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-10-encrypted-modal.png' });
  console.log("Saved: format-10-encrypted-modal.png");

  // Type password and unlock
  await page.fill('.encrypted-modal__input', 'shijianus2026');
  await page.click('.encrypted-modal__submit');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-11-unlocked-state.png' });
  console.log("Saved: format-11-unlocked-state.png");

  // 10. Timeline & Steps & Badges
  await page.evaluate(() => {
    const el = document.getElementById('十时间轴步骤条定义列表与数据表格') || document.querySelector('.article-timeline');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-12-timeline-badges.png' });
  console.log("Saved: format-12-timeline-badges.png");

  // 11. Dark mode test
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-13-dark-mode.png' });
  console.log("Saved: format-13-dark-mode.png");

  // 12. Mobile Responsive View (375px)
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
    window.scrollTo(0, 800);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/shijian/projects/shijianus-blog/format-14-mobile-responsive.png' });
  console.log("Saved: format-14-mobile-responsive.png");

  await browser.close();
  console.log("All visual validation screenshots completed!");
})();
