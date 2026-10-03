const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('Failed to load resource')) {
      errors.push(msg.text());
    }
  });

  await page.route('**/*.mp4', r => r.abort());
  await page.route('**/*.webm', r => r.abort());

  console.log('Navigating to home page...');
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'commit' });

  await page.waitForFunction(() => {
    const loadingBox = document.querySelector('#loading-box');
    return !loadingBox || getComputedStyle(loadingBox).display === 'none' || getComputedStyle(loadingBox).opacity === '0';
  }, { timeout: 15000 }).catch(() => {});

  await page.evaluate(() => window.scrollBy(0, 150));
  
  console.log('Waiting for snow svgs...');
  await page.waitForSelector('.card-snow-svg', { timeout: 15000 }).catch(() => console.log('No .card-snow-svg found.'));
  await page.waitForTimeout(2000);

  const snowPaths = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('.recent-post-item .card-snow-svg path'));
    return svgs.map(p => {
      const d = p.getAttribute('d');
      const w = p.ownerSVGElement.viewBox.baseVal.width;
      return { d: d.substring(0, 150) + '...', width: w };
    });
  });

  const gaps = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.recent-post-item'));
    if (cards.length < 2) return null;
    let minGap = Infinity;
    for (let i = 0; i < cards.length - 1; i++) {
        const rect1 = cards[i].getBoundingClientRect();
        const rect2 = cards[i+1].getBoundingClientRect();
        // check if they are on the same row
        if (Math.abs(rect1.top - rect2.top) < 20) {
            const gap = Math.abs(rect2.left - rect1.right);
            if (gap < minGap) minGap = gap;
        }
    }
    return minGap === Infinity ? null : minGap;
  });

  const footerBefore = await page.evaluate(() => {
    const footer = document.querySelector('.site-footer');
    return footer ? getComputedStyle(footer).transform : null;
  });
  
  const footerRectBefore = await page.evaluate(() => {
    const footer = document.querySelector('.site-footer');
    return footer ? footer.getBoundingClientRect().top : null;
  });

  await page.hover('.site-footer').catch(() => {});
  await page.waitForTimeout(500);
  
  const footerAfter = await page.evaluate(() => {
    const footer = document.querySelector('.site-footer');
    return footer ? getComputedStyle(footer).transform : null;
  });
  const footerRectAfter = await page.evaluate(() => {
    const footer = document.querySelector('.site-footer');
    return footer ? footer.getBoundingClientRect().top : null;
  });

  console.log(JSON.stringify({
    errors,
    snowPaths,
    minGap: gaps,
    footerHoverStatic: footerBefore === footerAfter && Math.abs((footerRectBefore||0) - (footerRectAfter||0)) < 1
  }, null, 2));

  await browser.close();
})();
