import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  console.log('Navigating to https://blog.anheyu.com/ ...');
  try {
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    });
    await page.goto('https://blog.anheyu.com/', { waitUntil: 'commit', timeout: 120000 });
    console.log('Committed, waiting for DOM content loaded...');
    await page.waitForLoadState('domcontentloaded', { timeout: 120000 });
    console.log('DOM content loaded! Waiting for network idle or timeout...');
    await page.waitForTimeout(5000);

    // Ensure scratch directory exists
    if (!fs.existsSync('scratch')) {
      fs.mkdirSync('scratch', { recursive: true });
    }

    // Check pagination
    const paginationSelector = '[class*="paginationNav"], [class*="Pagination"], #pagination, nav.pagination';
    const paginationEl = await page.$(paginationSelector);
    if (paginationEl) {
      const cls = await paginationEl.evaluate(el => el.className);
      console.log('Found pagination element class:', cls);
      const html = await paginationEl.evaluate(el => el.outerHTML);
      console.log('Pagination HTML:\n', html.slice(0, 800));
      const styles = await paginationEl.evaluate(el => {
        const cs = window.getComputedStyle(el);
        return {
          height: cs.height,
          padding: cs.padding,
          margin: cs.margin,
          background: cs.backgroundColor || cs.background,
          display: cs.display,
          justifyContent: cs.justifyContent,
          alignItems: cs.alignItems,
          borderRadius: cs.borderRadius,
          border: cs.border,
          boxShadow: cs.boxShadow
        };
      });
      console.log('Pagination styles:', JSON.stringify(styles, null, 2));

      // Also inspect child buttons
      const childInfo = await paginationEl.evaluate(el => {
        return Array.from(el.querySelectorAll('a, button, span, div')).slice(0, 10).map(c => {
          const cs = window.getComputedStyle(c);
          return {
            tag: c.tagName,
            class: c.className,
            text: c.innerText.trim(),
            width: cs.width,
            height: cs.height,
            lineHeight: cs.lineHeight,
            borderRadius: cs.borderRadius,
            background: cs.backgroundColor,
            color: cs.color,
            border: cs.border,
            margin: cs.margin,
            padding: cs.padding
          };
        });
      });
      console.log('Child items:', JSON.stringify(childInfo, null, 2));

      await paginationEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'scratch/anzhiyu_pagination.png' });
      console.log('Saved scratch/anzhiyu_pagination.png');
    } else {
      console.log('Pagination element not found by selector.');
    }

    // Scroll around to see sticky aside
    const asideCards = await page.$$eval('#aside-content > div, aside > div, .aside-content > div', els => els.map(e => ({
      class: e.className,
      id: e.id,
      position: window.getComputedStyle(e).position,
      top: window.getComputedStyle(e).top,
      height: window.getComputedStyle(e).height
    })));
    console.log('Aside cards found:', JSON.stringify(asideCards, null, 2));

    await page.screenshot({ path: 'scratch/anzhiyu_full.png', fullPage: false });
    console.log('Saved scratch/anzhiyu_full.png');
  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    await browser.close();
  }
}

main();
