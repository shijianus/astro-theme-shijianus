const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });

  const info = await page.evaluate(() => {
    const line = document.querySelector('.code-block-shell pre code .line');
    const getMatchedRules = (el) => {
      const rules = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText && el.matches(rule.selectorText)) {
              rules.push({ selector: rule.selectorText, cssText: rule.cssText });
            }
          }
        } catch(e) {}
      }
      return rules;
    };
    return {
      lineMatchedRules: line ? getMatchedRules(line) : [],
      lineComputedColor: line ? window.getComputedStyle(line).color : null,
      parentPreColor: line ? window.getComputedStyle(line.parentElement).color : null
    };
  });

  console.log("LINE RULES:", JSON.stringify(info, null, 2));
  await browser.close();
})();
