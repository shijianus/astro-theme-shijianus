import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.route('**/*.mp4', r => r.abort());
  await page.route('**/*.webm', r => r.abort());
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'commit' });
  await page.waitForSelector('.card-snow-svg', { state: 'attached' });
  await page.waitForTimeout(2000);

  const feedCard = await page.$('#recent-posts .recent-post-item');
  if (feedCard) {
    await feedCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const preTransform = await feedCard.evaluate(el => {
      const svg = el.querySelector(':scope > .card-snow-svg');
      return svg ? window.getComputedStyle(svg).transform : 'no-svg';
    });
    console.log('Pre-hover transform:', preTransform);

    // Hover center of card
    const box = await feedCard.boundingBox();
    console.log('Card box:', box);
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    }
    await page.waitForTimeout(400);

    const duringTransform = await feedCard.evaluate(el => {
      const svg = el.querySelector(':scope > .card-snow-svg');
      return svg ? window.getComputedStyle(svg).transform : 'no-svg';
    });
    console.log('During-hover transform:', duringTransform);

    // Also check matched CSS rule for svg
    const matched = await feedCard.evaluate(el => {
      const svg = el.querySelector(':scope > .card-snow-svg');
      if (!svg) return 'no-svg';
      const styles = window.getComputedStyle(svg);
      return {
        transform: styles.transform,
        transition: styles.transition,
        isHovered: el.matches(':hover')
      };
    });
    console.log('Matched state:', matched);
  }

  await browser.close();
}

main().catch(console.error);
