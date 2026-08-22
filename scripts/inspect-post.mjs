import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  
  // Test post page
  await page.goto('http://localhost:4321/posts/content-first-homepage/', { waitUntil: 'networkidle' });

  const postAnalysis = await page.evaluate(() => {
    const widgets = Array.from(document.querySelectorAll('#aside-content .card-widget, #post-toc-aside .card-widget, #post-secondary-aside .card-widget'));
    const promoWidget = document.querySelector('.promo-widget') || document.querySelector('#card-telegram');
    const flipContent = document.querySelector('#flip-content');
    const cardCategories = document.querySelector('.card-categories');

    const getBox = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        id: el.id,
        className: el.className,
        rect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          height: rect.height,
          width: rect.width
        },
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        display: style.display,
        position: style.position
      };
    };

    return {
      widgets: widgets.map(getBox),
      promoWidget: getBox(promoWidget),
      flipContent: getBox(flipContent),
      cardCategories: getBox(cardCategories),
      gapPromoToCategories: promoWidget && cardCategories ? (cardCategories.getBoundingClientRect().top - promoWidget.getBoundingClientRect().bottom) : null
    };
  });

  console.log("Post Analysis:", JSON.stringify(postAnalysis, null, 2));

  await page.screenshot({ path: 'scripts/post_layout.png', fullPage: false });
  await browser.close();
}

run().catch(console.error);
