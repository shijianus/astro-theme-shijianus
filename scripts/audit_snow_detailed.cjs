const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  await page.route('**/*.mp4', r => r.abort());
  await page.route('**/*.webm', r => r.abort());

  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'commit' });
  await page.waitForTimeout(2000);

  const snowPathsDetailed = await page.evaluate(() => {
    const p = document.querySelector('.recent-post-item .card-snow-svg path');
    if (!p) return null;
    return p.getAttribute('d');
  });

  const footerHoverCheck = await page.evaluate(async () => {
    const footer = document.querySelector('.site-footer');
    if (!footer) return null;
    const style1 = getComputedStyle(footer);
    const t1 = style1.transform;
    const b1 = footer.getBoundingClientRect().top;
    
    // Simulate hover via class or just return transition properties to see if it's meant to move
    return {
      transition: style1.transition,
      transform: t1
    };
  });
  
  await page.hover('.site-footer').catch(() => {});
  await page.waitForTimeout(1000);
  
  const footerHoverAfter = await page.evaluate(() => {
    const footer = document.querySelector('.site-footer');
    if (!footer) return null;
    return {
      transform: getComputedStyle(footer).transform,
      rectTop: footer.getBoundingClientRect().top
    };
  });

  console.log(JSON.stringify({
    snowPathFull: snowPathsDetailed,
    footerHoverCheck,
    footerHoverAfter
  }, null, 2));

  await browser.close();
})();
