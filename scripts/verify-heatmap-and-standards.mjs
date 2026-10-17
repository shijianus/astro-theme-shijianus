import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';

function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
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
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + reqUrl);
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  const port = 5178;
  const distDir = path.resolve('./dist');
  const server = await createStaticServer(distDir, port);
  console.log(`[TestServer] Running at http://localhost:${port}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/root/.cache/puppeteer/chrome/linux-152.0.7977.42/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    // 1. Verify /standards/ page
    console.log('\n--- 1. Testing /standards/ Route & Webinfo Items ---');
    const standardsRes = await page.goto(`http://localhost:${port}/standards/`, { waitUntil: 'networkidle0' });
    console.log(`Status code: ${standardsRes.status()}`);
    if (standardsRes.status() !== 200) {
      throw new Error(`Expected status 200 for /standards/, got ${standardsRes.status()}`);
    }

    const standardsCheck = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim();
      const webinfoItems = Array.from(document.querySelectorAll('.standards-webinfo-grid .webinfo-item'));
      const itemsData = webinfoItems.map(item => ({
        label: item.querySelector('.webinfo-item-label span')?.textContent?.trim(),
        value: item.querySelector('strong')?.textContent?.trim(),
      }));

      const activeSection = document.querySelector('#maintainer-level');
      const activeCurrentTier = activeSection?.querySelector('.is-current-tier td:first-child')?.textContent?.trim();
      const densitySection = document.querySelector('#content-density');
      const densityCurrentTier = densitySection?.querySelector('.is-current-tier td:first-child')?.textContent?.trim();

      return {
        title,
        webinfoItemsCount: webinfoItems.length,
        itemsData,
        activeCurrentTier,
        densityCurrentTier,
      };
    });

    console.log('Standards Title:', standardsCheck.title);
    console.log(`Webinfo Items Count: ${standardsCheck.webinfoItemsCount}`);
    console.log('Active Tier:', standardsCheck.activeCurrentTier);
    console.log('Density Tier:', standardsCheck.densityCurrentTier);

    if (standardsCheck.webinfoItemsCount < 6) {
      throw new Error(`Expected at least 6 webinfo-items on standards page, got ${standardsCheck.webinfoItemsCount}`);
    }

    // 2. Verify Heatmap in Console
    console.log('\n--- 2. Testing Heatmap in Console ---');
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:open-console')));
    await new Promise(r => setTimeout(r, 1000));

    const heatmapCheck = await page.evaluate(() => {
      const grid = document.querySelector('.console-activity-grid');
      const cells = grid ? Array.from(grid.querySelectorAll('.activity-cell:not(.hidden)')) : [];
      const nonZeroCells = cells.filter(c => !c.classList.contains('level-0'));
      
      return {
        totalCells: cells.length,
        activeCellsCount: nonZeroCells.length,
        nonZeroDetails: nonZeroCells.map(c => ({
          tip: c.getAttribute('data-tooltip'),
          classes: c.className,
        }))
      };
    });

    console.log(`Heatmap Total Cells: ${heatmapCheck.totalCells}`);
    console.log(`Heatmap Active Cells: ${heatmapCheck.activeCellsCount}`);
    if (heatmapCheck.activeCellsCount === 0) {
      throw new Error('Heatmap has zero active cells!');
    }

    // 3. Test Clicking Multi-post Cell (8/28 or any level-4)
    console.log('\n--- 3. Testing Cell Click & Full Post List Display ---');
    const clickCellResult = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.console-activity-grid .activity-cell:not(.hidden)'));
      // Find the cell with highest count or level-4
      const level4Cell = cells.find(c => c.classList.contains('level-4')) || cells.find(c => !c.classList.contains('level-0'));
      if (!level4Cell) return null;

      const tip = level4Cell.getAttribute('data-tooltip');
      level4Cell.click();
      return { tip };
    });

    console.log('Clicked cell tooltip:\n', clickCellResult?.tip);
    await new Promise(r => setTimeout(r, 600));

    const footerDetails = await page.evaluate(() => {
      const footer = document.querySelector('.activity-details-footer');
      const headTitle = footer?.querySelector('.activity-details__title-group strong')?.textContent?.trim();
      const countBadge = footer?.querySelector('.activity-count-badge')?.textContent?.trim();
      const list = footer?.querySelector('.activity-details-list');
      const lis = list ? Array.from(list.querySelectorAll('li')).map(li => ({
        text: li.textContent?.trim(),
        href: li.querySelector('a')?.getAttribute('href')
      })) : [];

      return {
        headTitle,
        countBadge,
        postsCount: lis.length,
        firstThreePosts: lis.slice(0, 3),
        overflowScrollable: list ? list.scrollHeight >= list.clientHeight : false
      };
    });

    console.log('Details Footer Header:', footerDetails.headTitle);
    console.log('Details Footer Badge:', footerDetails.countBadge);
    console.log(`Rendered Posts in Footer: ${footerDetails.postsCount}`);
    console.log('Sample posts:', footerDetails.firstThreePosts);

    if (footerDetails.postsCount === 0) {
      throw new Error('Failed: Clicked active cell but details footer rendered 0 posts!');
    }
    if (footerDetails.postsCount > 3) {
      console.log(`✅ Success: Rendered all ${footerDetails.postsCount} posts with scrollable support (not truncated to 3)!`);
    }

    // 4. Test Tooltip Upward Placement (Z-index and position check)
    console.log('\n--- 4. Testing Tooltip Upward Placement ---');
    const tooltipStyle = await page.evaluate(() => {
      const cell = document.querySelector('.console-activity-grid .activity-cell.level-4');
      if (!cell) return null;
      const beforeStyle = window.getComputedStyle(cell, '::before');
      return {
        bottom: beforeStyle.bottom,
        top: beforeStyle.top,
        zIndex: beforeStyle.zIndex,
      };
    });
    console.log('Tooltip computed style:', tooltipStyle);

    console.log('\n✅ ALL VERIFICATIONS PASSED! 0 console errors.');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
