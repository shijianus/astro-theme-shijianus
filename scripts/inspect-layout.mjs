import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

  // Evaluate bounding boxes and computed styles
  const analysis = await page.evaluate(() => {
    const randomHover = document.querySelector('#random-hover');
    const randomBanner = document.querySelector('#random-banner');
    const categoryGroup = document.querySelector('.categoryGroup');
    const categoryItems = Array.from(document.querySelectorAll('.categoryItem'));
    const lastCategoryItem = categoryItems[categoryItems.length - 1];

    const flipWrapper = document.querySelector('#flip-wrapper');
    const flipContent = document.querySelector('#flip-content');
    const promoWidget = document.querySelector('.promo-widget') || document.querySelector('#card-telegram');
    const cardCategories = document.querySelector('.card-categories');
    const cardAnnouncement = document.querySelector('.card-announcement');
    const cardAuthor = document.querySelector('.card-author') || document.querySelector('#aside-content .card-widget:first-child');
    const asideContent = document.querySelector('#aside-content');

    const getBox = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        id: el.id,
        className: el.className,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        position: style.position,
        boxSizing: style.boxSizing,
        display: style.display
      };
    };

    return {
      randomHover: getBox(randomHover),
      randomBanner: getBox(randomBanner),
      categoryGroup: getBox(categoryGroup),
      categoryItems: categoryItems.map(getBox),
      lastCategoryItem: getBox(lastCategoryItem),
      flipWrapper: getBox(flipWrapper),
      flipContent: getBox(flipContent),
      promoWidget: getBox(promoWidget),
      cardCategories: getBox(cardCategories),
      cardAnnouncement: getBox(cardAnnouncement),
      cardAuthor: getBox(cardAuthor),
      asideContent: getBox(asideContent),
      randomHoverVsLastCategoryItemRightDiff: randomHover && lastCategoryItem ? (randomHover.getBoundingClientRect().right - lastCategoryItem.getBoundingClientRect().right) : null,
      randomBannerVsLastCategoryItemRightDiff: randomBanner && lastCategoryItem ? (randomBanner.getBoundingClientRect().right - lastCategoryItem.getBoundingClientRect().right) : null,
      gapBannerToCategoryGroup: randomBanner && categoryGroup ? (categoryGroup.getBoundingClientRect().top - randomBanner.getBoundingClientRect().bottom) : null,
      gapHoverToCategoryGroup: randomHover && categoryGroup ? (categoryGroup.getBoundingClientRect().top - randomHover.getBoundingClientRect().bottom) : null,
      gapPromoToCategories: promoWidget && cardCategories ? (cardCategories.getBoundingClientRect().top - promoWidget.getBoundingClientRect().bottom) : null,
      gapFlipToCategories: flipContent && cardCategories ? (cardCategories.getBoundingClientRect().top - flipContent.getBoundingClientRect().bottom) : null
    };
  });

  console.log(JSON.stringify(analysis, null, 2));

  await page.screenshot({ path: 'scripts/current_layout.png', fullPage: false });

  await page.hover('#random-banner');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/hover_random_banner.png', fullPage: false });

  await browser.close();
}

run().catch(console.error);
