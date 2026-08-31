const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });

  const info = await page.evaluate(() => {
    const pre = document.querySelector('.code-block-shell pre');
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
      preMatchedRules: pre ? getMatchedRules(pre) : [],
      codeBlockShellMatchedRules: pre?.parentElement ? getMatchedRules(pre.parentElement) : [],
      inlineStyle: pre ? pre.getAttribute('style') : null
    };
  });

  console.log("PRE RULES:", JSON.stringify(info, null, 2));
  await browser.close();
})();
