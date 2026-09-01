import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4322/posts/anzhiyu-markdown-showcase/', { waitUntil: 'networkidle' });

  const ancestors = await page.evaluate(() => {
    let el = document.querySelector('#post-tools-panel-wechat');
    const list = [];
    while (el && el !== document.body) {
      const cs = window.getComputedStyle(el);
      list.push({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        transform: cs.transform,
        filter: cs.filter,
        backdropFilter: cs.backdropFilter,
        perspective: cs.perspective,
        contain: cs.contain,
        willChange: cs.willChange,
      });
      el = el.parentElement;
    }
    return list;
  });

  console.log('Ancestors containing block context:', JSON.stringify(ancestors, null, 2));
  await browser.close();
}

debug();
