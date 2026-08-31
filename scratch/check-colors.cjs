const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const pre = document.querySelector('.code-block-shell pre');
    const line = pre.querySelector('.line');
    const span = line.querySelector('span');
    return {
      pre_color: window.getComputedStyle(pre).color,
      pre_bg: window.getComputedStyle(pre).backgroundColor,
      line_color: window.getComputedStyle(line).color,
      span_color: span ? window.getComputedStyle(span).color : null,
      span_style: span ? span.getAttribute('style') : null
    };
  });
  console.log("RESULT:", result);
  await browser.close();
})();
