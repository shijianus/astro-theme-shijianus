const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const page = await context.newPage();

  console.log("Navigating to /posts/content-formats-and-markup-mastery/ ...");
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const report = await page.evaluate(() => {
    const results = {
      light: {},
      dark: {}
    };

    const inspectElement = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const comp = window.getComputedStyle(el);
      const spans = Array.from(el.querySelectorAll('span')).map(s => {
        const c = window.getComputedStyle(s);
        return {
          text: s.textContent.slice(0, 30),
          color: c.color,
          styleAttr: s.getAttribute('style') || '',
          class: s.className
        };
      });
      return {
        tag: el.tagName,
        class: el.className,
        color: comp.color,
        background: comp.backgroundColor,
        spanCount: spans.length,
        spansSample: spans.slice(0, 10),
        innerHTML: el.innerHTML.slice(0, 300)
      };
    };

    results.light = {
      codeBlockShellPre: inspectElement('.code-block-shell pre'),
      codeBlockShellFirstSpan: inspectElement('.code-block-shell pre code span'),
      tabsPre: inspectElement('.article-tabs__panel pre'),
      tabsCode: inspectElement('.article-tabs__panel pre code'),
      dropdownPre: inspectElement('.article-dropdown-panel pre'),
      dropdownCode: inspectElement('.article-dropdown-panel pre code'),
    };

    document.documentElement.dataset.theme = 'dark';

    results.dark = {
      codeBlockShellPre: inspectElement('.code-block-shell pre'),
      codeBlockShellFirstSpan: inspectElement('.code-block-shell pre code span'),
      tabsPre: inspectElement('.article-tabs__panel pre'),
      tabsCode: inspectElement('.article-tabs__panel pre code'),
      dropdownPre: inspectElement('.article-dropdown-panel pre'),
      dropdownCode: inspectElement('.article-dropdown-panel pre code'),
    };

    return results;
  });

  console.log("=== INSPECT REPORT ===");
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
})();
