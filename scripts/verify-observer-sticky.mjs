import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const OUT = join(process.cwd(), 'screenshots');
mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:4321';
const VIEWPORT = { width: 1440, height: 900 };

async function screenshot(page, name) {
  const dest = join(OUT, `${name}.png`);
  await page.screenshot({ path: dest, fullPage: false });
  console.log(`Saved screenshot: ${dest}`);
  return dest;
}

async function getMetrics(page) {
  return page.evaluate(() => {
    const toc = document.getElementById('card-toc');
    const copyright = document.querySelector('.post-copyright-block');
    const layout = document.getElementById('post-sticky-layout');
    const supportBox = document.getElementById('aside-sticky-box-support');
    const pageMain = document.querySelector('.page-main');

    const rect = (el) => el ? el.getBoundingClientRect() : null;
    const tocR = rect(toc);
    const copyR = rect(copyright);
    const layoutR = rect(layout);
    const supR = rect(supportBox);
    const mainR = rect(pageMain);

    return {
      scrollY: Math.round(window.scrollY),
      toc_bottom: tocR ? Math.round(tocR.bottom) : null,
      toc_height: toc ? toc.offsetHeight : null,
      copyright_top: copyR ? Math.round(copyR.top) : null,
      layout_top: layoutR ? Math.round(layoutR.top) : null,
      layout_transform: layout ? layout.style.transform : null,
      support_top: supR ? Math.round(supR.top) : null,
      page_main_bottom: mainR ? Math.round(mainR.bottom) : null,
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();

  // ==========================================
  // 1. SHORT TOC: /posts/hello-world/
  // ==========================================
  console.log('\n--- Auditing Short TOC (/posts/hello-world/) ---');
  await page.goto(`${BASE}/posts/hello-world/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1.1 Top
  window_scroll(page, 0);
  await page.waitForTimeout(400);
  console.log('Short TOC - Top:', await getMetrics(page));
  await screenshot(page, 'short-01-top');

  // 1.2 Reading state (e.g. scroll 800px): TOC + Support cards sticking together
  await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'instant' }));
  await page.waitForTimeout(400);
  console.log('Short TOC - Reading (800px):', await getMetrics(page));
  await screenshot(page, 'short-02-reading-sticky');

  // 1.3 Trigger point: Scroll until copyright top approaches TOC bottom
  await page.evaluate(() => {
    const copy = document.querySelector('.post-copyright-block');
    if (copy) {
      const topOffset = 74;
      const toc = document.getElementById('card-toc');
      const tocH = toc ? toc.offsetHeight : 180;
      // Target scroll so copyright.top is exactly around toc.bottom
      const copyDocTop = copy.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: copyDocTop - (topOffset + tocH) - 100, behavior: 'instant' });
    }
  });
  await page.waitForTimeout(400);
  console.log('Short TOC - Approaching Copyright:', await getMetrics(page));
  await screenshot(page, 'short-03-approaching-copyright');

  // 1.4 Exact Alignment point
  await page.evaluate(() => {
    const copy = document.querySelector('.post-copyright-block');
    if (copy) {
      const topOffset = 74;
      const toc = document.getElementById('card-toc');
      const tocH = toc ? toc.offsetHeight : 180;
      const copyDocTop = copy.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: copyDocTop - (topOffset + tocH), behavior: 'instant' });
    }
  });
  await page.waitForTimeout(400);
  console.log('Short TOC - Exact Copyright Alignment:', await getMetrics(page));
  await screenshot(page, 'short-04-exact-copyright-trigger');

  // 1.5 Past copyright (support sticky at top)
  await page.evaluate(() => {
    const copy = document.querySelector('.post-copyright-block');
    if (copy) {
      const copyDocTop = copy.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: copyDocTop + 200, behavior: 'instant' });
    }
  });
  await page.waitForTimeout(400);
  console.log('Short TOC - Past Copyright:', await getMetrics(page));
  await screenshot(page, 'short-05-past-copyright');

  // 1.6 Bottom of page
  await page.evaluate(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: maxScroll * 0.95, behavior: 'instant' });
  });
  await page.waitForTimeout(400);
  console.log('Short TOC - Bottom:', await getMetrics(page));
  await screenshot(page, 'short-06-bottom');

  // ==========================================
  // 2. LONG TOC: /posts/markdown-scan-showcase/
  // ==========================================
  console.log('\n--- Auditing Long TOC (/posts/markdown-scan-showcase/) ---');
  await page.goto(`${BASE}/posts/markdown-scan-showcase/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 2.1 Top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(400);
  console.log('Long TOC - Top:', await getMetrics(page));
  await screenshot(page, 'long-01-top');

  // 2.2 Reading middle (e.g. 5000px)
  await page.evaluate(() => window.scrollTo({ top: 5000, behavior: 'instant' }));
  await page.waitForTimeout(400);
  console.log('Long TOC - Reading (5000px):', await getMetrics(page));
  await screenshot(page, 'long-02-reading-middle');

  // 2.3 Approaching Copyright
  await page.evaluate(() => {
    const copy = document.querySelector('.post-copyright-block');
    if (copy) {
      const topOffset = 74;
      const toc = document.getElementById('card-toc');
      const tocH = toc ? toc.offsetHeight : 750;
      const copyDocTop = copy.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: copyDocTop - (topOffset + tocH) - 150, behavior: 'instant' });
    }
  });
  await page.waitForTimeout(400);
  console.log('Long TOC - Approaching Copyright:', await getMetrics(page));
  await screenshot(page, 'long-03-approaching-copyright');

  // 2.4 Exact Copyright Alignment
  await page.evaluate(() => {
    const copy = document.querySelector('.post-copyright-block');
    if (copy) {
      const topOffset = 74;
      const toc = document.getElementById('card-toc');
      const tocH = toc ? toc.offsetHeight : 750;
      const copyDocTop = copy.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: copyDocTop - (topOffset + tocH), behavior: 'instant' });
    }
  });
  await page.waitForTimeout(400);
  console.log('Long TOC - Exact Copyright Alignment:', await getMetrics(page));
  await screenshot(page, 'long-04-exact-copyright-trigger');

  // 2.5 Past Copyright (support cards sticky at top)
  await page.evaluate(() => {
    const copy = document.querySelector('.post-copyright-block');
    if (copy) {
      const copyDocTop = copy.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: copyDocTop + 300, behavior: 'instant' });
    }
  });
  await page.waitForTimeout(400);
  console.log('Long TOC - Past Copyright:', await getMetrics(page));
  await screenshot(page, 'long-05-past-copyright');

  // 2.6 Bottom of page
  await page.evaluate(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: maxScroll * 0.95, behavior: 'instant' });
  });
  await page.waitForTimeout(400);
  console.log('Long TOC - Bottom:', await getMetrics(page));
  await screenshot(page, 'long-06-bottom');

  await browser.close();
  console.log('\nAll screenshots completed!');
})();

function window_scroll(page, y) {
  return page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
}
