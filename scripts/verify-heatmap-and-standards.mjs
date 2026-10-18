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

    // 0. Verify console-metrics.json data structure & standardsConfig
    console.log('\n--- 0. Testing Metrics Data & Embedded standardsConfig ---');
    const apiRes = await page.goto(`http://localhost:${port}/api/console/data`, { waitUntil: 'networkidle0' });
    if (apiRes.status() !== 200) {
      throw new Error(`Failed to load /api/console/data, status: ${apiRes.status()}`);
    }
    const apiJson = JSON.parse(await page.evaluate(() => document.body.innerText));
    console.log('API JSON ok:', apiJson.ok);
    console.log('Active Tier:', apiJson.stats?.activeLevel, apiJson.stats?.activeTitle, '-> href:', apiJson.stats?.activeHref);
    console.log('Density Tier:', apiJson.stats?.densityLevel, apiJson.stats?.densityTitle, '-> href:', apiJson.stats?.densityHref);
    console.log('Standards Config embedded:', !!apiJson.standardsConfig);

    if (apiJson.stats?.activeHref !== '/standards/activity-level/') {
      throw new Error(`Expected activeHref === '/standards/activity-level/', got ${apiJson.stats?.activeHref}`);
    }
    if (apiJson.stats?.densityHref !== '/standards/content-density/') {
      throw new Error(`Expected densityHref === '/standards/content-density/', got ${apiJson.stats?.densityHref}`);
    }
    if (!apiJson.standardsConfig?.activityLevels || !apiJson.standardsConfig?.contentDensityLevels) {
      throw new Error('Missing standardsConfig or levels in metrics payload!');
    }

    // 1. Verify /standards/ page (Doc style, NO sidebar, with dual entry cards)
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
      
      const activeLink = document.querySelector('.standards-webinfo-grid a[href*="activity-level"]')?.getAttribute('href');
      const densityLink = document.querySelector('.standards-webinfo-grid a[href*="content-density"]')?.getAttribute('href');

      const splitCards = Array.from(document.querySelectorAll('.doc-split-entry-card')).map(card => ({
        badge: card.querySelector('.doc-split-badge')?.textContent?.trim(),
        title: card.querySelector('.doc-split-title')?.textContent?.trim(),
        href: card.querySelector('.doc-split-btn')?.getAttribute('href'),
      }));

      return {
        title,
        hasSidebar,
        docNavPills,
        count: webinfoItems.length,
        activeLink,
        densityLink,
        splitCards,
      };
    });

    console.log('Standards Title:', standardsCheck.title);
    console.log('Has Sidebar:', standardsCheck.hasSidebar, '(Must be false)');
    console.log('Webinfo items count:', standardsCheck.count);
    console.log('Active Link in dashboard:', standardsCheck.activeLink);
    console.log('Density Link in dashboard:', standardsCheck.densityLink);
    console.log('Split Article Entry Cards:', standardsCheck.splitCards);

    if (standardsCheck.hasSidebar) {
      throw new Error('Failure: Standards page must NOT have a sidebar (showAside={false})!');
    }
    if (standardsCheck.count < 6) {
      throw new Error(`Expected at least 6 webinfo-items on /standards/, got ${standardsCheck.count}`);
    }
    if (!standardsCheck.activeLink?.includes('activity-level')) {
      throw new Error('Active webinfo item must link to /standards/activity-level/!');
    }
    if (!standardsCheck.densityLink?.includes('content-density')) {
      throw new Error('Density webinfo item must link to /standards/content-density/!');
    }
    if (standardsCheck.splitCards.length < 2) {
      throw new Error(`Expected at least 2 split entry cards on /standards/, got ${standardsCheck.splitCards.length}`);
    }

    // 2. Verify /standards/activity-level/ (Separate Post/Doc)
    console.log('\n--- 2. Testing /standards/activity-level/ Separate Post ---');
    const actRes = await page.goto(`http://localhost:${port}/standards/activity-level/`, { waitUntil: 'networkidle0' });
    console.log(`Status code: ${actRes.status()}`);
    if (actRes.status() !== 200) {
      throw new Error(`Expected status 200 for /standards/activity-level/, got ${actRes.status()}`);
    }

    const actCheck = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim();
      const hasSidebar = !!document.querySelector('.page-aside');
      const docNavPills = Array.from(document.querySelectorAll('.standards-doc-nav .doc-nav-pill')).map(p => p.textContent?.trim());
      const currentTierRow = document.querySelector('tr.is-current-tier');
      const currentTierTitle = currentTierRow?.querySelector('td:nth-child(2)')?.textContent?.trim();
      const crossLinkDensity = document.querySelector('a[href*="content-density"]')?.getAttribute('href');

      return {
        title,
        hasSidebar,
        docNavPills,
        currentTierTitle,
        crossLinkDensity,
      };
    });

    console.log('Activity Level Title:', actCheck.title);
    console.log('Has Sidebar:', actCheck.hasSidebar, '(Must be false)');
    console.log('Doc Nav Pills:', actCheck.docNavPills);
    console.log('Current Matched Tier:', actCheck.currentTierTitle);
    console.log('Cross Link to Density:', actCheck.crossLinkDensity);

    if (actCheck.hasSidebar) {
      throw new Error('Failure: /standards/activity-level/ must NOT have a sidebar!');
    }
    if (!actCheck.title?.includes('活跃等级')) {
      throw new Error(`Unexpected title for /standards/activity-level/: ${actCheck.title}`);
    }
    if (!actCheck.currentTierTitle) {
      throw new Error('Expected a currently matched tier row (tr.is-current-tier)!');
    }
    if (!actCheck.crossLinkDensity?.includes('content-density')) {
      throw new Error('Missing cross-link to content-density on activity-level page!');
    }

    // 3. Verify /standards/content-density/ (Separate Post/Doc)
    console.log('\n--- 3. Testing /standards/content-density/ Separate Post ---');
    const densRes = await page.goto(`http://localhost:${port}/standards/content-density/`, { waitUntil: 'networkidle0' });
    console.log(`Status code: ${densRes.status()}`);
    if (densRes.status() !== 200) {
      throw new Error(`Expected status 200 for /standards/content-density/, got ${densRes.status()}`);
    }

    const densCheck = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim();
      const hasSidebar = !!document.querySelector('.page-aside');
      const docNavPills = Array.from(document.querySelectorAll('.standards-doc-nav .doc-nav-pill')).map(p => p.textContent?.trim());
      const currentTierRow = document.querySelector('tr.is-current-tier');
      const currentTierTitle = currentTierRow?.querySelector('td:nth-child(2)')?.textContent?.trim();
      const crossLinkActivity = document.querySelector('a[href*="activity-level"]')?.getAttribute('href');

      return {
        title,
        hasSidebar,
        docNavPills,
        currentTierTitle,
        crossLinkActivity,
      };
    });

    console.log('Content Density Title:', densCheck.title);
    console.log('Has Sidebar:', densCheck.hasSidebar, '(Must be false)');
    console.log('Doc Nav Pills:', densCheck.docNavPills);
    console.log('Current Matched Tier:', densCheck.currentTierTitle);
    console.log('Cross Link to Activity:', densCheck.crossLinkActivity);

    if (densCheck.hasSidebar) {
      throw new Error('Failure: /standards/content-density/ must NOT have a sidebar!');
    }
    if (!densCheck.title?.includes('内容密度')) {
      throw new Error(`Unexpected title for /standards/content-density/: ${densCheck.title}`);
    }
    if (!densCheck.currentTierTitle) {
      throw new Error('Expected a currently matched tier row (tr.is-current-tier)!');
    }
    if (!densCheck.crossLinkActivity?.includes('activity-level')) {
      throw new Error('Missing cross-link to activity-level on content-density page!');
    }

    // 4. Verify Homepage Console links and Heatmap Unconstrained Popover
    console.log('\n--- 4. Testing Homepage Console Links & Heatmap Popover ---');
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle0' });

    // Open console modal
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:open-console')));
    await new Promise(r => setTimeout(r, 600));

    // Verify console webinfo links
    const consoleLinks = await page.evaluate(() => {
      const activeLink = document.querySelector('#console a[href*="activity-level"]')?.getAttribute('href');
      const densityLink = document.querySelector('#console a[href*="content-density"]')?.getAttribute('href');
      return { activeLink, densityLink };
    });
    console.log('Console Active Link:', consoleLinks.activeLink);
    console.log('Console Density Link:', consoleLinks.densityLink);
    if (!consoleLinks.activeLink?.includes('activity-level')) {
      throw new Error('Console activeLevel item must link to /standards/activity-level/!');
    }
    if (!consoleLinks.densityLink?.includes('content-density')) {
      throw new Error('Console density item must link to /standards/content-density/!');
    }

    // Click active cell in heatmap (2026/8/28 with 13 posts)
    console.log('Clicking active cell in heatmap...');
    await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.console-activity-grid .activity-cell:not(.hidden)'));
      const activeCell = cells.find(c => c.classList.contains('level-4')) || cells.find(c => !c.classList.contains('level-0'));
      if (activeCell) activeCell.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const popoverCheck = await page.evaluate(() => {
      const popover = document.querySelector('.activity-screen-popover');
      if (!popover) return null;
      const isInsideWrapper = !!popover.closest('.heatmap-internal-wrapper');
      const isFixed = window.getComputedStyle(popover).position === 'fixed';
      const items = Array.from(popover.querySelectorAll('.activity-screen-popover__list li')).map(li => li.textContent?.trim());
      return {
        exists: true,
        isInsideWrapper,
        isFixed,
        postsCount: items.length,
      };
    });

    console.log('Popover exists:', popoverCheck?.exists);
    console.log('Popover inside wrapper:', popoverCheck?.isInsideWrapper, '(Must be false)');
    console.log('Popover is fixed:', popoverCheck?.isFixed);
    console.log(`Popover posts count: ${popoverCheck?.postsCount}`);

    if (!popoverCheck || !popoverCheck.exists) {
      throw new Error('Expected .activity-screen-popover on cell click!');
    }
    if (popoverCheck.isInsideWrapper) {
      throw new Error('Popover must NOT be inside .heatmap-internal-wrapper!');
    }
    if (popoverCheck.postsCount < 4) {
      throw new Error(`Expected full list of posts without truncation, got ${popoverCheck.postsCount}`);
    }

    if (errors.length > 0) {
      throw new Error(`Encountered browser errors during verification:\n${errors.join('\n')}`);
    }

    console.log('\n========================================');
    console.log('🎉 LOCAL COMPREHENSIVE VERIFICATION PASSED 100%!');
    console.log('========================================\n');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
