import { chromium } from 'playwright';

async function check() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle' });
  
  const toggle = await page.$('label[for="today-card-toggle"]');
  if (toggle) await toggle.click();
  await page.waitForTimeout(600);

  const cardInfo = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.topGroup .recent-post-item'));
    return cards.map((c, i) => {
      const cr = c.getBoundingClientRect();
      const cover = c.querySelector('.post_cover');
      const coverR = cover ? cover.getBoundingClientRect() : null;
      const info = c.querySelector('.recent-post-info');
      const infoR = info ? info.getBoundingClientRect() : null;
      const title = c.querySelector('.article-title');
      const titleR = title ? title.getBoundingClientRect() : null;
      const computed = window.getComputedStyle(c);
      const coverComputed = cover ? window.getComputedStyle(cover) : null;
      const infoComputed = info ? window.getComputedStyle(info) : null;
      const titleComputed = title ? window.getComputedStyle(title) : null;

      return {
        i,
        card: { height: cr.height, width: cr.width, overflow: computed.overflow },
        cover: coverR ? { height: coverR.height, computedHeight: coverComputed.height } : null,
        info: infoR ? { height: infoR.height, computedHeight: infoComputed.height, padding: infoComputed.padding } : null,
        title: titleR ? {
          height: titleR.height,
          scrollHeight: title.scrollHeight,
          clientHeight: title.clientHeight,
          text: title.innerText,
          fontSize: titleComputed.fontSize,
          lineHeight: titleComputed.lineHeight,
          webkitLineClamp: titleComputed.webkitLineClamp
        } : null
      };
    });
  });

  console.log('Card details:', JSON.stringify(cardInfo, null, 2));

  // Take a close up screenshot of the first card and all cards
  const firstCard = await page.$('.topGroup .recent-post-item');
  if (firstCard) {
    await firstCard.screenshot({ path: 'scripts/card_first_closeup.png' });
  }
  const topGroup = await page.$('.topGroup');
  if (topGroup) {
    await topGroup.screenshot({ path: 'scripts/topgroup_closeup.png' });
  }

  await browser.close();
}

check().catch(console.error);
