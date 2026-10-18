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

    // Handle mock API for local static server
    if (reqUrl.startsWith('/api/console/data')) {
      const metricsPath = path.resolve(distDir, 'data/console-metrics.json');
      if (fs.existsSync(metricsPath)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        fs.createReadStream(metricsPath).pipe(res);
        return;
      }
    }

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
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', err => errors.push(err.message));

    // 1. Verify /standards/ page (Doc style, NO sidebar)
    console.log('\n--- 1. Testing /standards/ Route & Document Structure ---');
    const standardsRes = await page.goto(`http://localhost:${port}/standards/`, { waitUntil: 'networkidle0' });
    console.log(`Status code: ${standardsRes.status()}`);
    if (standardsRes.status() !== 200) {
      throw new Error(`Expected status 200 for /standards/, got ${standardsRes.status()}`);
    }

    const standardsCheck = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim();
      const hasSidebar = !!document.querySelector('.page-aside');
      const docNavPills = Array.from(document.querySelectorAll('.standards-doc-nav .doc-nav-pill')).map(p => p.textContent?.trim());
      const webinfoItems = Array.from(document.querySelectorAll('.standards-webinfo-grid .webinfo-item'));
      const itemsData = webinfoItems.map(item => ({
        label: item.querySelector('.webinfo-item-label span')?.textContent?.trim(),
        value: item.querySelector('strong')?.textContent?.trim(),
      }));

      const activeSection = document.querySelector('#section-active-level');
      const activeCurrentTier = activeSection?.querySelector('.is-current-tier td:nth-child(2)')?.textContent?.trim();
      const densitySection = document.querySelector('#section-content-density');
      const densityCurrentTier = densitySection?.querySelector('.is-current-tier td:nth-child(2)')?.textContent?.trim();

      return {
        title,
        hasSidebar,
        docNavPills,
        webinfoItemsCount: webinfoItems.length,
        itemsData,
        activeCurrentTier,
        densityCurrentTier,
      };
    });

    console.log('Standards Title:', standardsCheck.title);
    console.log('Has Sidebar:', standardsCheck.hasSidebar, '(Must be false for doc structure)');
    console.log('Doc Nav Pills:', standardsCheck.docNavPills);
    console.log(`Webinfo Items Count: ${standardsCheck.webinfoItemsCount}`);
    console.log('Active Tier:', standardsCheck.activeCurrentTier);
    console.log('Density Tier:', standardsCheck.densityCurrentTier);

    if (standardsCheck.hasSidebar) {
      throw new Error('Failure: Standards page must NOT have a sidebar (showAside={false})!');
    }
    if (standardsCheck.webinfoItemsCount < 6) {
      throw new Error(`Expected at least 6 webinfo-items on standards page, got ${standardsCheck.webinfoItemsCount}`);
    }
    if (standardsCheck.docNavPills.length < 4) {
      throw new Error(`Expected at least 4 doc navigation pills, got ${standardsCheck.docNavPills.length}`);
    }

    // 2. Verify Heatmap in Console
    console.log('\n--- 2. Testing Heatmap in Console & Date Synchronization ---');
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
      };
    });

    console.log(`Heatmap Total Cells: ${heatmapCheck.totalCells}`);
    console.log(`Heatmap Active Cells: ${heatmapCheck.activeCellsCount}`);
    if (heatmapCheck.totalCells < 350) {
      throw new Error(`Expected at least 350 cells in 52-week grid, got ${heatmapCheck.totalCells}`);
    }
    if (heatmapCheck.activeCellsCount === 0) {
      throw new Error('Heatmap has zero active cells!');
    }

    // 3. Test Clicking Multi-post Cell (8/28 or any level-4) -> Screen-Level Popover + Footer
    console.log('\n--- 3. Testing Cell Click, Screen-Level Popover & Footer ---');
    const clickCellResult = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.console-activity-grid .activity-cell:not(.hidden)'));
      const level4Cell = cells.find(c => c.classList.contains('level-4')) || cells.find(c => !c.classList.contains('level-0'));
      if (!level4Cell) return null;

      const tip = level4Cell.getAttribute('data-tooltip');
      level4Cell.click();
      return { tip };
    });

    console.log('Clicked cell tooltip:\n', clickCellResult?.tip);
    await new Promise(r => setTimeout(r, 600));

    // Verify Screen-Level Popover (outside heatmap-internal-wrapper)
    const popoverCheck = await page.evaluate(() => {
      const popover = document.querySelector('.activity-screen-popover');
      if (!popover) return null;
      const isInsideWrapper = !!popover.closest('.heatmap-internal-wrapper');
      const isFixed = window.getComputedStyle(popover).position === 'fixed';
      const title = popover.querySelector('.activity-screen-popover__title strong')?.textContent?.trim();
      const badge = popover.querySelector('.activity-count-badge')?.textContent?.trim();
      const listItems = Array.from(popover.querySelectorAll('.activity-screen-popover__list li')).map(li => ({
        text: li.textContent?.trim(),
        href: li.querySelector('a')?.getAttribute('href')
      }));

      return {
        exists: true,
        isInsideWrapper,
        isFixed,
        title,
        badge,
        postsCount: listItems.length,
        firstThree: listItems.slice(0, 3)
      };
    });

    console.log('\nScreen-Level Popover Check:');
    console.log('Popover Exists:', popoverCheck?.exists);
    console.log('Is Inside heatmap-internal-wrapper:', popoverCheck?.isInsideWrapper, '(Must be false - completely unconstrained)');
    console.log('Position is fixed:', popoverCheck?.isFixed);
    console.log('Popover Badge:', popoverCheck?.badge);
    console.log(`Rendered Posts in Popover: ${popoverCheck?.postsCount}`);

    if (!popoverCheck || !popoverCheck.exists) {
      throw new Error('Failed: Expected .activity-screen-popover to render on cell click!');
    }
    if (popoverCheck.isInsideWrapper) {
      throw new Error('Failed: .activity-screen-popover must NOT be inside .heatmap-internal-wrapper!');
    }
    if (popoverCheck.postsCount === 0) {
      throw new Error('Failed: Popover rendered 0 posts!');
    }

    // Verify Details Footer below heatmap
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
      };
    });

    console.log('\nDetails Footer Check:');
    console.log('Details Footer Badge:', footerDetails.countBadge);
    console.log(`Rendered Posts in Footer: ${footerDetails.postsCount}`);

    if (footerDetails.postsCount === 0) {
      throw new Error('Failed: Details footer rendered 0 posts!');
    }

    if (errors.length > 0) {
      throw new Error(`Encountered ${errors.length} browser console errors:\n${errors.join('\n')}`);
    }

    console.log('\n✅ ALL LOCAL VERIFICATIONS PASSED! 0 console errors.');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
