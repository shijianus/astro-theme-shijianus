const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const line = document.querySelector('.code-block-shell pre code .line');
    const getProperties = (el) => {
      const computed = window.getComputedStyle(el);
      const applied = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.style && rule.style.color && el.matches(rule.selectorText)) {
              applied.push({
                selector: rule.selectorText,
                color: rule.style.color
              });
            }
          }
        } catch(e) {}
      }
      return applied;
    };
    return getProperties(line);
  });
  console.log("MATCHED COLOR RULES FOR .LINE:", result);
  await browser.close();
})();
