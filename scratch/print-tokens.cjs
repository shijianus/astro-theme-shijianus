const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });

  const getDetails = async () => {
    return await page.evaluate(() => {
      const getSpans = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return [];
        return Array.from(el.querySelectorAll('span')).map(s => ({
          text: s.textContent.trim(),
          class: s.className,
          color: window.getComputedStyle(s).color
        })).filter(x => x.text.length > 0 && x.text !== '复制');
      };
      return {
        shikiSample: getSpans('.code-block-shell pre code').slice(0, 6),
        tabsSample: getSpans('.article-tabs__panel.is-active pre code'),
        dropdownSample: getSpans('.article-dropdown-panel.is-active pre code').slice(0, 10),
      };
    });
  };

  console.log("=== LIGHT MODE TOKENS ===");
  console.log(JSON.stringify(await getDetails(), null, 2));

  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await page.waitForTimeout(300);

  console.log("=== DARK MODE TOKENS ===");
  console.log(JSON.stringify(await getDetails(), null, 2));

  await browser.close();
})();
