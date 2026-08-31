const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    let el = document.querySelector('.code-block-shell pre code');
    const chain = [];
    while (el && el !== document.documentElement) {
      chain.push({
        tag: el.tagName,
        class: el.className,
        styleAttr: el.getAttribute('style'),
        color: window.getComputedStyle(el).color
      });
      el = el.parentElement;
    }
    return chain;
  });
  console.log("ANCESTOR CHAIN:", result);
  await browser.close();
})();
