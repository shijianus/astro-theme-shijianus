import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import http from 'http';

const PORT = 4333;
const BASE_URL = `http://localhost:${PORT}/posts/content-formats-and-markup-mastery/`;
const OUTPUT_DIR = './scratch/i18n-inspection-after';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(distDir, reqUrl);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise(resolve => server.listen(port, () => resolve(server)));
}

const VIEWPORTS = [
  { name: 'iPhone 12/13/14 (390x844)', width: 390, height: 844, slug: 'mobile' },
  { name: 'iPhone SE (375x667)', width: 375, height: 667, slug: 'mobileSmall' }
];

const LOCALES = ['zh-CN', 'en', 'de', 'es', 'fr', 'zh-Hant'];

async function runAudit() {
  console.log('🚀 Starting Comprehensive Mobile i18n & Latin Layout Audit...');
  const distDir = path.resolve('./dist');
  const server = await createStaticServer(distDir, PORT);
  console.log(`✅ Static server running on port ${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const issues = [];
  const summaryTable = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n======================================================`);
      console.log(` AUDITING VIEWPORT: ${vp.name}`);
      console.log(`======================================================`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
      });
      const page = await context.newPage();

      // Listen for unhandled console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('ERR_')) {
          console.error(`[Browser Console Error]: ${msg.text()}`);
        }
      });

      console.log(`Navigating to test post on ${vp.name}...`);
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000);

      for (const lang of LOCALES) {
        console.log(`\n--- [${vp.name}] Testing Locale: "${lang}" ---`);

        // Apply locale switch via official runtime API
        await page.evaluate((targetLocale) => {
          if (window.__SHIJIANUS_LOCALE_RUNTIME__ && typeof window.__SHIJIANUS_LOCALE_RUNTIME__.applyLocaleVariant === 'function') {
            window.__SHIJIANUS_LOCALE_RUNTIME__.applyLocaleVariant(targetLocale, { manual: true });
          } else {
            document.documentElement.dataset.localeVariant = targetLocale;
            document.documentElement.lang = targetLocale;
            window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: targetLocale }));
            localStorage.setItem('shijianus-locale-variant', targetLocale);
          }
        }, lang);
        await page.waitForTimeout(400);

        // Check 1: Horizontal scroll overflow
        const pageOverflow = await page.evaluate(() => {
          const sw = document.documentElement.scrollWidth;
          const cw = document.documentElement.clientWidth;
          return { sw, cw, hasOverflow: sw > cw + 1 };
        });
        if (pageOverflow.hasOverflow) {
          issues.push(`[${vp.name}][${lang}] Horizontal overflow: scrollWidth=${pageOverflow.sw} > clientWidth=${pageOverflow.cw}`);
        }

        // Scroll to comment section
        await page.evaluate(() => {
          const c = document.getElementById('post-comment');
          if (c) c.scrollIntoView({ behavior: 'instant' });
        });
        await page.waitForTimeout(300);

        // Check 2: Comment Title and Sort Buttons Alignment
        const commentBarStatus = await page.evaluate(() => {
          const countEl = document.querySelector('#post-comment .tk-comments-count');
          const sortGroup = document.querySelector('#post-comment .tk-sort-group');
          if (!countEl || !sortGroup) return null;
          const countRect = countEl.getBoundingClientRect();
          const sortRect = sortGroup.getBoundingClientRect();
          
          const isCountMultiLine = countRect.height > 40;
          const isVerticallyMisaligned = Math.abs(countRect.top - sortRect.top) > 10;

          return {
            countText: countEl.textContent.trim(),
            countHeight: countRect.height,
            isCountMultiLine,
            isVerticallyMisaligned,
            fontSize: window.getComputedStyle(countEl).fontSize
          };
        });

        console.log(`[${vp.name}][${lang}] Comments Title: "${commentBarStatus?.countText}" | Height: ${commentBarStatus?.countHeight.toFixed(1)}px | MultiLine: ${commentBarStatus?.isCountMultiLine} | Misaligned: ${commentBarStatus?.isVerticallyMisaligned}`);
        if (commentBarStatus?.isCountMultiLine) {
          issues.push(`[${vp.name}][${lang}] Comments count title is wrapped into multiple lines: height=${commentBarStatus.countHeight.toFixed(1)}px`);
        }
        if (commentBarStatus?.isVerticallyMisaligned) {
          issues.push(`[${vp.name}][${lang}] Comments count title and sort group are misaligned vertically`);
        }

        // Check 3: Header RandomInfo (Login / Privacy)
        const headerInfoStatus = await page.evaluate(() => {
          const randomInfo = document.querySelector('#post-comment .comment-randomInfo');
          if (!randomInfo) return null;
          const r = randomInfo.getBoundingClientRect();
          return {
            text: randomInfo.textContent.trim().replace(/\s+/g, ' '),
            height: r.height,
            width: r.width
          };
        });
        console.log(`[${vp.name}][${lang}] Header RandomInfo: "${headerInfoStatus?.text}" | Height: ${headerInfoStatus?.height.toFixed(1)}px`);

        // Check 4: Image Modal Tabs, Footers & Overflow
        let modalData = null;
        try {
          const imgBtn = page.locator('.tk-tb-image').first();
          if (await imgBtn.count() > 0) {
            await imgBtn.scrollIntoViewIfNeeded();
            await imgBtn.click();
            await page.waitForSelector('.tk-tool-modal', { state: 'visible', timeout: 5000 });
            await page.waitForTimeout(200);

            modalData = await page.evaluate(() => {
              const modal = document.querySelector('.tk-tool-modal');
              if (!modal) return null;
              const modalRect = modal.getBoundingClientRect();
              const tabBtns = Array.from(modal.querySelectorAll('.tk-modal-tab-btn')).map(el => {
                const r = el.getBoundingClientRect();
                return {
                  text: el.textContent.trim(),
                  width: r.width,
                  height: r.height,
                  top: r.top
                };
              });

              const heights = tabBtns.map(t => t.height);
              const maxHeight = Math.max(...heights);
              const minHeight = Math.min(...heights);
              const tabsHeightDiscrepancy = (maxHeight - minHeight) > 3;
              const tabsWrapped = tabBtns.length > 1 && Math.abs(tabBtns[0].top - tabBtns[tabBtns.length - 1].top) > 5;

              const confirmBtn = modal.querySelector('.tk-modal-btn-confirm');
              const cancelBtn = modal.querySelector('.tk-modal-btn-cancel');
              const footerBtns = [confirmBtn, cancelBtn].filter(Boolean).map(el => {
                const r = el.getBoundingClientRect();
                return { text: el.textContent.trim(), top: r.top, height: r.height };
              });
              const footerWrapped = footerBtns.length > 1 && Math.abs(footerBtns[0].top - footerBtns[1].top) > 5;
              const modalOverflowBottom = modalRect.bottom > window.innerHeight;

              return {
                modalRect: { bottom: modalRect.bottom, height: modalRect.height },
                windowHeight: window.innerHeight,
                tabsHeightDiscrepancy,
                maxHeight,
                minHeight,
                tabsWrapped,
                footerWrapped,
                modalOverflowBottom,
                tabTexts: tabBtns.map(t => t.text)
              };
            });

            console.log(`[${vp.name}][${lang}] Image Modal Tabs: HeightDiff=${(modalData?.maxHeight - modalData?.minHeight).toFixed(1)}px | TabsWrapped: ${modalData?.tabsWrapped} | FooterWrapped: ${modalData?.footerWrapped} | OverflowBottom: ${modalData?.modalOverflowBottom}`);

            // Take screenshot of modal
            await page.screenshot({ path: path.join(OUTPUT_DIR, `${vp.slug}-${lang}-image-modal.png`) });

            if (modalData?.tabsHeightDiscrepancy) {
              issues.push(`[${vp.name}][${lang}] Image modal tabs height discrepancy: diff=${(modalData.maxHeight - modalData.minHeight).toFixed(1)}px`);
            }
            if (modalData?.tabsWrapped) {
              issues.push(`[${vp.name}][${lang}] Image modal tabs wrapped into multiple rows`);
            }
            if (modalData?.footerWrapped) {
              issues.push(`[${vp.name}][${lang}] Image modal footer buttons wrapped`);
            }
            if (modalData?.modalOverflowBottom) {
              issues.push(`[${vp.name}][${lang}] Image modal bottom overflows viewport: ${modalData.modalRect.bottom} > ${modalData.windowHeight}`);
            }

            const cancelLocator = page.locator('.tk-modal-btn-cancel, .tk-modal-close-btn').first();
            if (await cancelLocator.count() > 0) {
              await cancelLocator.click();
            }
            await page.waitForTimeout(200);
          }
        } catch (err) {
          console.warn(`[${vp.name}][${lang}] Modal inspection warning: ${err.message}`);
        }

        // Take screenshot of comment section after modal is closed
        try {
          await page.locator('#post-comment').screenshot({ path: path.join(OUTPUT_DIR, `${vp.slug}-${lang}-comment-section.png`) });
        } catch {}

        summaryTable.push({
          viewport: vp.name,
          locale: lang,
          titleText: commentBarStatus?.countText,
          titleHeight: commentBarStatus?.countHeight.toFixed(1) + 'px',
          tabsHeightDiff: modalData ? (modalData.maxHeight - modalData.minHeight).toFixed(1) + 'px' : 'N/A',
          tabsWrapped: modalData ? modalData.tabsWrapped : false,
          overflowBottom: modalData ? modalData.modalOverflowBottom : false,
          pageOverflow: pageOverflow.hasOverflow
        });
      }

      await context.close();
    }
  } finally {
    await browser.close();
    if (server) {
      await new Promise(resolve => server.close(resolve));
      console.log('🛑 Static server stopped.');
    }
  }

  console.log(`\n======================================================`);
  console.log(` AUDIT SUMMARY TABLE`);
  console.log(`======================================================`);
  console.table(summaryTable);

  console.log(`\n======================================================`);
  console.log(` AUDIT RESULT: ${issues.length} ISSUES FOUND`);
  console.log(`======================================================`);
  issues.forEach((iss, i) => console.log(`${i + 1}. ${iss}`));
  if (issues.length === 0) {
    console.log('\n🎉 [PASS] ALL MOBILE LAYOUT ASSERTIONS 100% PASSED ACROSS ALL LOCALES!');
  } else {
    throw new Error(`Audit failed with ${issues.length} issues!`);
  }
}

runAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
