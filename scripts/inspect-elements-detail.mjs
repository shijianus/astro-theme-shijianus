import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const allCards = Array.from(document.querySelectorAll('.recent-post-item'));
    const card = allCards.find(c => c.querySelector('[class*="justify-between"]'));
    const inner = card ? card.querySelector('[class*="justify-between"]') : null;

    const stickyBox = document.querySelector('.aside-sticky-box');
    const overviewCard = document.querySelector('.card-feature-panel--overview');

    function getSummary(el) {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        class: el.className,
        id: el.id,
        bg: s.backgroundColor,
        bgImg: s.backgroundImage,
        backdropFilter: s.backdropFilter,
        opacity: s.opacity,
        boxShadow: s.boxShadow,
        border: s.border
      };
    }

    // Check all non-transparent children inside inner
    const innerChildrenWithBg = inner ? Array.from(inner.querySelectorAll('*')).map(c => {
      const s = window.getComputedStyle(c);
      return {
        tag: c.tagName,
        class: c.className,
        bg: s.backgroundColor
      };
    }).filter(c => c.bg !== 'rgba(0, 0, 0, 0)' && !c.bg.includes('rgba(255, 255, 255, 0)')) : [];

    // Check all children inside stickyBox
    const stickyChildren = stickyBox ? Array.from(stickyBox.children).map(c => getSummary(c)) : [];

    return {
      card: getSummary(card),
      inner: getSummary(inner),
      innerChildrenWithBg,
      stickyBox: getSummary(stickyBox),
      overviewCard: getSummary(overviewCard),
      stickyChildren
    };
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main();
