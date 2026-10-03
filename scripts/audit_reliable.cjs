const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  await page.route('**/*.mp4', r => r.abort());
  await page.route('**/*.webm', r => r.abort());

  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'commit' });
  
  await page.waitForFunction(() => {
    const loadingBox = document.querySelector('#loading-box');
    return !loadingBox || getComputedStyle(loadingBox).display === 'none' || getComputedStyle(loadingBox).opacity === '0';
  }, { timeout: 15000 }).catch(() => {});

  await page.evaluate(() => window.scrollBy(0, 150));
  await page.waitForSelector('.card-snow-svg', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const snowPath = await page.evaluate(() => {
    const svgs = document.querySelectorAll('.recent-post-item .card-snow-svg path');
    if (!svgs || svgs.length === 0) return null;
    const paths = Array.from(svgs).map(p => p.getAttribute('d'));
    return paths[0];
  });
  
  const gaps = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.recent-post-item'));
    if (cards.length < 2) return null;
    let minGap = Infinity;
    for (let i = 0; i < cards.length - 1; i++) {
        const rect1 = cards[i].getBoundingClientRect();
        const rect2 = cards[i+1].getBoundingClientRect();
        if (Math.abs(rect1.top - rect2.top) < 20) {
            const gap = Math.abs(rect2.left - rect1.right);
            if (gap < minGap) minGap = gap;
        }
    }
    return minGap === Infinity ? null : minGap;
  });

  const footerHoverTest = await page.evaluate(async () => {
    const footer = document.querySelector('.site-footer');
    if (!footer) return null;
    
    const beforeTransform = getComputedStyle(footer).transform;
    const beforeRect = footer.getBoundingClientRect().top;
    return { beforeTransform, beforeRect };
  });

  await page.hover('.site-footer').catch(() => {});
  await page.waitForTimeout(1000);
  
  const footerHoverAfter = await page.evaluate(() => {
    const footer = document.querySelector('.site-footer');
    if (!footer) return null;
    return {
      afterTransform: getComputedStyle(footer).transform,
      afterRect: footer.getBoundingClientRect().top
    };
  });

  const report = {
    snowPath: snowPath ? snowPath.substring(0, 200) + '...' : null,
    snowPathFull: snowPath,
    minGap: gaps,
    footerHoverBefore: footerHoverTest,
    footerHoverAfter: footerHoverAfter
  };

  fs.writeFileSync('audit_report.json', JSON.stringify(report, null, 2));
  console.log('Done.');
  await browser.close();
})();
