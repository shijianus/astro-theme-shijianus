import assert from 'node:assert';
import { chromium } from 'playwright';

const targetUrl = process.env.TEST_URL || 'https://blog.epocanvas.com/posts/markdown-syntax-mastery/';
console.log('Testing live URL:', targetUrl);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForSelector('#card-toc', { timeout: 15000 });

    // Scroll to populate reading progress percentage
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(1000);

    const checkHeadline = async (mode) => {
      const data = await page.evaluate(() => {
        const headline = document.querySelector('#card-toc .item-headline');
        const leftGroup = document.querySelector('#card-toc .item-headline__left');
        const icon = document.querySelector('#card-toc .aside-title-icon');
        const title = document.querySelector('#card-toc .item-headline__left span:not(.toc-count)') || document.querySelector('#card-toc .item-headline > span:first-of-type');
        const count = document.querySelector('#card-toc .toc-count');
        const percentage = document.querySelector('#card-toc .toc-percentage');

        const rect = (el) => el ? el.getBoundingClientRect() : null;
        const style = (el) => el ? window.getComputedStyle(el) : null;

        const pRect = rect(percentage);
        const cRect = rect(count);
        const iRect = rect(icon);
        const tRect = rect(title);
        const hRect = rect(headline);

        const pStyle = style(percentage);
        const cStyle = style(count);
        const hStyle = style(headline);

        return {
          headline: {
            display: hStyle?.display,
            alignItems: hStyle?.alignItems,
            justifyContent: hStyle?.justifyContent,
            centerY: hRect ? Math.round((hRect.top + hRect.height / 2) * 10) / 10 : null,
          },
          iconCenterY: iRect ? Math.round((iRect.top + iRect.height / 2) * 10) / 10 : null,
          titleCenterY: tRect ? Math.round((tRect.top + tRect.height / 2) * 10) / 10 : null,
          countCenterY: cRect ? Math.round((cRect.top + cRect.height / 2) * 10) / 10 : null,
          percentageCenterY: pRect ? Math.round((pRect.top + pRect.height / 2) * 10) / 10 : null,
          countMarginLeft: cStyle?.marginLeft,
          percentageMarginTop: pStyle?.marginTop,
          percentageFloat: pStyle?.float,
          percentageFontStyle: pStyle?.fontStyle,
          percentageText: percentage?.textContent?.trim(),
          countText: count?.textContent?.trim(),
          titleText: title?.textContent?.trim(),
          hasLeftGroup: !!leftGroup,
        };
      });

      console.log(`[LIVE ${mode}] Data:`, JSON.stringify(data, null, 2));

      assert.strictEqual(data.headline.display, 'flex');
      assert.strictEqual(data.headline.alignItems, 'center');
      assert.strictEqual(data.headline.justifyContent, 'space-between');
      assert.strictEqual(data.hasLeftGroup, true);
      assert.strictEqual(data.percentageFloat, 'none');
      assert.strictEqual(data.percentageFontStyle, 'normal');
      assert.strictEqual(data.percentageMarginTop, '0px');
      assert.strictEqual(data.countMarginLeft, '0px');

      const tolerance = 1.0;
      const baseCenter = data.headline.centerY;
      assert.ok(Math.abs(data.iconCenterY - baseCenter) <= tolerance, `Icon centerY ${data.iconCenterY} != ${baseCenter}`);
      assert.ok(Math.abs(data.titleCenterY - baseCenter) <= tolerance, `Title centerY ${data.titleCenterY} != ${baseCenter}`);
      assert.ok(Math.abs(data.countCenterY - baseCenter) <= tolerance, `Count centerY ${data.countCenterY} != ${baseCenter}`);
      assert.ok(Math.abs(data.percentageCenterY - baseCenter) <= tolerance, `Percentage centerY ${data.percentageCenterY} != ${baseCenter}`);
    };

    await checkHeadline('Light Mode');

    // Take screenshot of live #card-toc
    const cardToc = await page.$('#card-toc');
    if (cardToc) {
      await cardToc.screenshot({ path: 'scripts/audit_screenshots/live-card-toc-verified.png' });
      console.log('Saved screenshot to scripts/audit_screenshots/live-card-toc-verified.png');
    }

    // Switch to dark mode on live
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(400);
    await checkHeadline('Dark Mode');

    if (cardToc) {
      await cardToc.screenshot({ path: 'scripts/audit_screenshots/live-card-toc-dark.png' });
      console.log('Saved dark screenshot to scripts/audit_screenshots/live-card-toc-dark.png');
    }

    console.log('🎉 LIVE PRODUCTION VERIFICATION 100% PASSED!');
  } catch (err) {
    console.error('Error during live verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
