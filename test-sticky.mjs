import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 800 });
  await page.goto('http://localhost:4321');
  await page.waitForSelector('.page-aside');

  const rule = await page.evaluate(() => {
    const layout = document.querySelector('#content-inner.layout');
    const matchedRules = window.getMatchedCSSRules ? window.getMatchedCSSRules(layout) : [];
    let alignItemsRule = '';
    // Fallback if getMatchedCSSRules is not available, we can just get stylesheets
    // But since puppeteer uses Chrome, we can query it via CSS OM or just get the inline style
    return window.getComputedStyle(layout).alignItems;
  });
  console.log('Rule:', rule);
  await browser.close();
})();
