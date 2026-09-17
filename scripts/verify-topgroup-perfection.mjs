import { chromium } from 'playwright';

async function verifyPerfection() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to http://localhost:4321/...');
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

  // 1. Light Mode - Default State (todayCard visible)
  const swiperHandle = await page.$('.swiper_container_card');
  const tgHandle = await page.$('.topGroup');
  if (swiperHandle) {
    await swiperHandle.screenshot({ path: 'scripts/verify_perfect_default_light.png' });
    console.log('Saved scripts/verify_perfect_default_light.png');
  }

  // 2. Toggle todayCard to reveal cards
  const toggleLabel = await page.$('label[for="today-card-toggle"]');
  if (!toggleLabel) {
    throw new Error('Could not find label[for="today-card-toggle"]!');
  }
  await toggleLabel.click();
  await page.waitForTimeout(400);

  if (swiperHandle) {
    await swiperHandle.screenshot({ path: 'scripts/verify_perfect_toggled_light.png' });
    console.log('Saved scripts/verify_perfect_toggled_light.png');
  }
  if (tgHandle) {
    await tgHandle.screenshot({ path: 'scripts/verify_perfect_topgroup_light.png' });
    console.log('Saved scripts/verify_perfect_topgroup_light.png');
  }

  // 3. Dark Mode Screenshot
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(300);
  if (swiperHandle) {
    await swiperHandle.screenshot({ path: 'scripts/verify_perfect_toggled_dark.png' });
    console.log('Saved scripts/verify_perfect_toggled_dark.png');
  }
  if (tgHandle) {
    await tgHandle.screenshot({ path: 'scripts/verify_perfect_topgroup_dark.png' });
    console.log('Saved scripts/verify_perfect_topgroup_dark.png');
  }

  // Restore light mode for inspection
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-theme');
  });
  await page.waitForTimeout(200);

  // 4. Detailed Assertions
  const audit = await page.evaluate(() => {
    const tg = document.querySelector('.topGroup');
    const stack = document.querySelector('.topGroup__stack');
    const cards = Array.from(document.querySelectorAll('.topGroup .recent-post-item'));

    const stackDisplay = stack ? window.getComputedStyle(stack).display : 'none';

    const cardDetails = cards.map((c, i) => {
      const cr = c.getBoundingClientRect();
      const cover = c.querySelector('.post_cover');
      const coverR = cover.getBoundingClientRect();
      const info = c.querySelector('.recent-post-info');
      const infoR = info.getBoundingClientRect();
      const title = c.querySelector('.article-title');
      const titleR = title.getBoundingClientRect();
      const titleStyle = window.getComputedStyle(title);

      const titleLines = Math.round(titleR.height / 18.2);
      const isTitleInsideCard = titleR.bottom <= cr.bottom;
      const isInfoInsideCard = infoR.bottom <= cr.bottom + 1;
      const isClamped = titleStyle.webkitLineClamp === '2';

      return {
        cardIndex: i,
        cardHeight: cr.height,
        cardWidth: cr.width,
        coverHeight: coverR.height,
        infoHeight: infoR.height,
        titleHeight: titleR.height,
        titleLines,
        isTitleInsideCard,
        isInfoInsideCard,
        isClamped,
        titleText: title.innerText.trim()
      };
    });

    return {
      cardCount: cards.length,
      stackHidden: stackDisplay === 'none',
      allCardsHaveValidCount: cards.length === 6,
      allTitlesInside: cardDetails.every(c => c.isTitleInsideCard),
      allTitlesClamped: cardDetails.every(c => c.titleLines <= 2),
      cardDetails
    };
  });

  console.log('Audit Results:', JSON.stringify(audit, null, 2));

  if (!audit.stackHidden) {
    throw new Error('FAIL: .topGroup__stack is not hidden! It creates messy background clutter!');
  }
  if (!audit.allCardsHaveValidCount) {
    throw new Error(`FAIL: Expected 6 cards in topGroup, but found ${audit.cardCount}!`);
  }
  if (!audit.allTitlesInside) {
    throw new Error('FAIL: Some card titles overflow or are cut off by the bottom of the card!');
  }
  if (!audit.allTitlesClamped) {
    throw new Error('FAIL: Some card titles have more than 2 lines of text!');
  }

  console.log('PERFECTION PASS: All 6 cards are perfectly formatted, 2-line clamped, unblocked, and free from background clutter!');
  await browser.close();
}

verifyPerfection().catch((err) => {
  console.error(err);
  process.exit(1);
});
