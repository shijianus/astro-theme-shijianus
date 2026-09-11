import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { chromium } from 'playwright';

const distDir = path.resolve(process.cwd(), 'dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  else if (!path.extname(reqPath)) reqPath += '/index.html';

  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, '404.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 4398;

server.listen(PORT, async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

    await page.goto(`http://localhost:${PORT}/posts/markdown-syntax-mastery/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#card-toc');

    // Scroll to populate reading progress percentage
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);

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
            centerY: hRect ? hRect.top + hRect.height / 2 : null,
          },
          iconCenterY: iRect ? iRect.top + iRect.height / 2 : null,
          titleCenterY: tRect ? tRect.top + tRect.height / 2 : null,
          countCenterY: cRect ? cRect.top + cRect.height / 2 : null,
          percentageCenterY: pRect ? pRect.top + pRect.height / 2 : null,
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

      console.log(`[${mode}] Checking TOC headline alignment:`, data);

      assert.strictEqual(data.headline.display, 'flex', 'headline display must be flex');
      assert.strictEqual(data.headline.alignItems, 'center', 'headline alignItems must be center');
      assert.strictEqual(data.headline.justifyContent, 'space-between', 'headline justifyContent must be space-between');
      assert.strictEqual(data.hasLeftGroup, true, 'must have .item-headline__left container');
      assert.strictEqual(data.percentageFloat, 'none', 'percentage float must be none');
      assert.strictEqual(data.percentageFontStyle, 'normal', 'percentage fontStyle must be normal');
      assert.strictEqual(data.percentageMarginTop, '0px', 'percentage marginTop must be 0px');
      assert.strictEqual(data.countMarginLeft, '0px', 'count marginLeft must be 0px');

      // Verify horizontal baseline / centerY alignment across all 4 elements
      const tolerance = 1.0; // within 1px
      const baseCenter = data.headline.centerY;
      assert.ok(Math.abs(data.iconCenterY - baseCenter) <= tolerance, `Icon centerY (${data.iconCenterY}) misaligned with headline (${baseCenter})`);
      assert.ok(Math.abs(data.titleCenterY - baseCenter) <= tolerance, `Title centerY (${data.titleCenterY}) misaligned with headline (${baseCenter})`);
      assert.ok(Math.abs(data.countCenterY - baseCenter) <= tolerance, `Count centerY (${data.countCenterY}) misaligned with headline (${baseCenter})`);
      assert.ok(Math.abs(data.percentageCenterY - baseCenter) <= tolerance, `Percentage centerY (${data.percentageCenterY}) misaligned with headline (${baseCenter})`);
    };

    // Check light mode
    await checkHeadline('Light Mode');

    // Switch to dark mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(300);

    // Check dark mode
    await checkHeadline('Dark Mode');

    console.log('✅ ALL TOC HEADLINE ALIGNMENT CHECKS PASSED!');
    await browser.close();
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
});
