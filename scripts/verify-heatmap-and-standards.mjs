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

    // 1. Verify /standards/ page (Doc style, NO sidebar, with dual entry cards, proper section-title-wrap nesting)
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

      // Verify no broken section-title-wrap layout
      const brokenWraps = Array.from(document.querySelectorAll('.section-title-wrap')).filter(w => w.children.length > 2);

      return {
        title,
        hasSidebar,
        docNavPills,
        count: webinfoItems.length,
        activeLink,
        densityLink,
        splitCards,
        brokenWrapsCount: brokenWraps.length,
      };
    });

    console.log('Standards Title:', standardsCheck.title);
    console.log('Has Sidebar:', standardsCheck.hasSidebar, '(Must be false)');
    console.log('Webinfo items count:', standardsCheck.count);
    console.log('Active Link in dashboard:', standardsCheck.activeLink);
    console.log('Density Link in dashboard:', standardsCheck.densityLink);
    console.log('Split Article Entry Cards:', standardsCheck.splitCards);
    console.log('Broken section-title-wraps count:', standardsCheck.brokenWrapsCount);

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
    if (standardsCheck.brokenWrapsCount > 0) {
      throw new Error('Failure: Detected unclosed or broken .section-title-wrap nesting!');
    }

    // 2. Verify /standards/activity-level/ (Separate Post/Doc with Required Bottom Box)
    console.log('\n--- 2. Testing /standards/activity-level/ Separate Post & Bottom Box ---');
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
      const hasCopyrightBox = !!document.querySelector('.post-copyright');
      const hasCommentBox = !!document.querySelector('#post-comment');

      return {
        title,
        hasSidebar,
        docNavPills,
        currentTierTitle,
        crossLinkDensity,
        hasCopyrightBox,
        hasCommentBox,
      };
    });

    console.log('Activity Level Title:', actCheck.title);
    console.log('Has Sidebar:', actCheck.hasSidebar, '(Must be false)');
    console.log('Doc Nav Pills:', actCheck.docNavPills);
    console.log('Current Matched Tier:', actCheck.currentTierTitle);
    console.log('Cross Link to Density:', actCheck.crossLinkDensity);
    console.log('Has Article Copyright Box:', actCheck.hasCopyrightBox);
    console.log('Has Article Comment Box:', actCheck.hasCommentBox);

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
    if (!actCheck.hasCopyrightBox) {
      throw new Error('Failure: /standards/activity-level/ is missing the required article copyright bottom box (.post-copyright)!');
    }
    if (!actCheck.hasCommentBox) {
      throw new Error('Failure: /standards/activity-level/ is missing the required comment box (#post-comment)!');
    }

    // 3. Verify /standards/content-density/ (Separate Post/Doc with Bottom Box)
    console.log('\n--- 3. Testing /standards/content-density/ Separate Post & Bottom Box ---');
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
      const hasCopyrightBox = !!document.querySelector('.post-copyright');
      const hasCommentBox = !!document.querySelector('#post-comment');

      return {
        title,
        hasSidebar,
        docNavPills,
        currentTierTitle,
        crossLinkActivity,
        hasCopyrightBox,
        hasCommentBox,
      };
    });

    console.log('Content Density Title:', densCheck.title);
    console.log('Has Sidebar:', densCheck.hasSidebar, '(Must be false)');
    console.log('Doc Nav Pills:', densCheck.docNavPills);
    console.log('Current Matched Tier:', densCheck.currentTierTitle);
    console.log('Cross Link to Activity:', densCheck.crossLinkActivity);
    console.log('Has Density Copyright Box:', densCheck.hasCopyrightBox);
    console.log('Has Density Comment Box:', densCheck.hasCommentBox);

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
    if (!densCheck.hasCopyrightBox) {
      throw new Error('Failure: /standards/content-density/ is missing copyright bottom box (.post-copyright)!');
    }
    if (!densCheck.hasCommentBox) {
      throw new Error('Failure: /standards/content-density/ is missing comment box (#post-comment)!');
    }

    // 4. Verify Homepage Console links and Heatmap In-Place Pinned Tooltip (No Popover, No Outline)
    console.log('\n--- 4. Testing Homepage Console Links & Heatmap In-Place Pinned Tooltip ---');
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
    console.log('Clicking active cell in heatmap to pin native tooltip...');
    await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.console-activity-grid .activity-cell:not(.hidden)'));
      const activeCell = cells.find(c => c.classList.contains('level-4')) || cells.find(c => !c.classList.contains('level-0'));
      if (activeCell) activeCell.click();
    });
    await new Promise(r => setTimeout(r, 300));

    const pinCheck = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.console-activity-grid .activity-cell:not(.hidden)'));
      const pinnedCell = cells.find(c => c.classList.contains('is-pinned'));
      const popoverExists = !!document.querySelector('.activity-screen-popover');
      const backdropExists = !!document.querySelector('.activity-screen-popover-backdrop');

      let outlineStyle = '';
      if (pinnedCell) {
        outlineStyle = window.getComputedStyle(pinnedCell).outlineStyle;
      }

      return {
        isPinned: !!pinnedCell,
        tooltipAttr: pinnedCell?.getAttribute('data-tooltip'),
        outlineStyle,
        popoverExists,
        backdropExists,
      };
    });

    console.log('Cell is-pinned:', pinCheck.isPinned);
    console.log('Cell tooltip attribute:', pinCheck.tooltipAttr?.slice(0, 40) + '...');
    console.log('Cell outline style:', pinCheck.outlineStyle, '(Must be none, no highlighting)');
    console.log('Popover window exists:', pinCheck.popoverExists, '(Must be false)');
    console.log('Popover backdrop exists:', pinCheck.backdropExists, '(Must be false)');

    if (!pinCheck.isPinned) {
      throw new Error('Expected clicked cell to receive .is-pinned class!');
    }
    if (pinCheck.popoverExists) {
      throw new Error('Failure: .activity-screen-popover must NOT be created on cell click!');
    }
    if (pinCheck.backdropExists) {
      throw new Error('Failure: .activity-screen-popover-backdrop must NOT be created!');
    }
    if (pinCheck.outlineStyle !== 'none' && pinCheck.outlineStyle !== '') {
      throw new Error(`Failure: Cell must NOT have an outline border, got outlineStyle: ${pinCheck.outlineStyle}`);
    }

    // Click outside on console profile area to unpin
    console.log('Clicking outside to test auto-unpinning and dismissal...');
    await page.evaluate(() => {
      const profile = document.querySelector('.console-profile') || document.body;
      profile.click();
    });
    await new Promise(r => setTimeout(r, 300));

    const unpinCheck = await page.evaluate(() => {
      const pinned = document.querySelector('.console-activity-grid .activity-cell.is-pinned');
      return { stillPinned: !!pinned };
    });
    console.log('Cell still pinned after outside click:', unpinCheck.stillPinned, '(Must be false)');

    if (unpinCheck.stillPinned) {
      throw new Error('Failure: Tooltip should automatically unpin and disappear when clicking outside!');
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
