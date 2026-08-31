const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4321/posts/example-tabs/', { waitUntil: 'networkidle' });

  const getTabTokens = async () => {
    return await page.evaluate(() => {
      const pnl = document.querySelector('.article-tabs__panel.is-active pre code');
      if (!pnl) return [];
      return Array.from(pnl.querySelectorAll('span')).map(s => ({
        text: s.textContent.trim(),
        class: s.className,
        color: window.getComputedStyle(s).color
      })).filter(x => x.text.length > 0 && x.text !== '复制');
    });
  };

  const tabs = await page.$$('.article-tabs__button');
  for (let i = 0; i < tabs.length; i++) {
    await tabs[i].click();
    await page.waitForTimeout(200);
    const tabName = await tabs[i].textContent();
    console.log(`TAB [${tabName.trim()}]:`, await getTabTokens());
  }

  await browser.close();
})();
