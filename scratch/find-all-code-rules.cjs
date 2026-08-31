const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const code = document.querySelector('.code-block-shell pre code');
    const matched = [];
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || [];
        for (const rule of rules) {
          if (rule.style) {
            try {
              if (code.matches(rule.selectorText)) {
                matched.push({
                  selector: rule.selectorText,
                  color: rule.style.color,
                  css: rule.cssText
                });
              }
            } catch(e) {}
          }
        }
      } catch(e) {}
    }
    return matched;
  });
  console.log("ALL MATCHED RULES FOR CODE:", JSON.stringify(result, null, 2));
  await browser.close();
})();
