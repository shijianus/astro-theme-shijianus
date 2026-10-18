import puppeteer from 'puppeteer';

const PROD_URL = 'https://blog.epocanvas.com';

async function verifyLive() {
  console.log(`\n========================================`);
  console.log(`🔍 STARTING PRODUCTION LIVE VERIFICATION`);
  console.log(`Target: ${PROD_URL}`);
  console.log(`========================================\n`);

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
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.error(`[Browser Error]:`, msg.text());
      }
    });
    page.on('pageerror', err => {
      errors.push(err.message);
      console.error(`[Page Error]:`, err.message);
    });

    // 1. Verify /api/console/data directly
    console.log(`\n--- 1. Testing GET ${PROD_URL}/api/console/data ---`);
    const apiRes = await page.goto(`${PROD_URL}/api/console/data`, { waitUntil: 'networkidle0' });
    console.log(`HTTP Status: ${apiRes.status()}`);
    if (apiRes.status() !== 200) {
      const text = await page.evaluate(() => document.body.innerText);
      throw new Error(`Expected HTTP 200 for /api/console/data, got ${apiRes.status()}. Body: ${text.slice(0, 300)}`);
    }
    const apiJson = JSON.parse(await page.evaluate(() => document.body.innerText));
    console.log('API JSON Result: ok =', apiJson.ok, ', stats =', apiJson.stats);
    console.log('Active Tier:', apiJson.stats?.activeLevel, '-> href:', apiJson.stats?.activeHref);
    console.log('Density Tier:', apiJson.stats?.densityLevel, '-> href:', apiJson.stats?.densityHref);
    console.log('Standards Config embedded:', !!apiJson.standardsConfig);

    if (!apiJson.ok || !apiJson.stats || !apiJson.activity) {
      throw new Error('API returned invalid JSON schema');
    }
    if (apiJson.stats?.activeHref !== '/standards/activity-level/') {
      throw new Error(`Expected activeHref === '/standards/activity-level/', got ${apiJson.stats?.activeHref}`);
    }
    if (apiJson.stats?.densityHref !== '/standards/content-density/') {
      throw new Error(`Expected densityHref === '/standards/content-density/', got ${apiJson.stats?.densityHref}`);
    }

    // 2. Verify /standards/
    console.log(`\n--- 2. Testing ${PROD_URL}/standards/ ---`);
    const standardsRes = await page.goto(`${PROD_URL}/standards/`, { waitUntil: 'networkidle0' });
    console.log(`HTTP Status: ${standardsRes.status()}`);
    if (standardsRes.status() !== 200) {
      throw new Error(`Expected HTTP 200 for /standards/, got ${standardsRes.status()}`);
    }

    const standardsData = await page.evaluate(() => {
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

    console.log('Standards Title:', standardsData.title);
    console.log('Has Sidebar:', standardsData.hasSidebar, '(Must be false for doc structure)');
    console.log('Doc Nav Pills:', standardsData.docNavPills);
    console.log(`Webinfo Items Count: ${standardsData.count}`);
    console.log('Active Link in dashboard:', standardsData.activeLink);
    console.log('Density Link in dashboard:', standardsData.densityLink);
    console.log('Split Cards:', standardsData.splitCards);
    console.log('Broken section-title-wraps count:', standardsData.brokenWrapsCount);

    if (standardsData.hasSidebar) {
      throw new Error('Failure: Standards page must NOT have a sidebar (showAside={false})!');
    }
    if (standardsData.count < 6) {
      throw new Error(`Expected at least 6 webinfo-items on /standards/, got ${standardsData.count}`);
    }
    if (!standardsData.activeLink?.includes('activity-level')) {
      throw new Error('Active webinfo item must link to /standards/activity-level/!');
    }
    if (!standardsData.densityLink?.includes('content-density')) {
      throw new Error('Density webinfo item must link to /standards/content-density/!');
    }
    if (standardsData.splitCards.length < 2) {
      throw new Error(`Expected 2 split article entry cards on /standards/, got ${standardsData.splitCards.length}`);
    }
    if (standardsData.brokenWrapsCount > 0) {
      throw new Error('Failure: Detected broken .section-title-wrap on live /standards/!');
    }

    // 3. Verify /standards/activity-level/ (Separate Post & Required Bottom Box)
    console.log(`\n--- 3. Testing ${PROD_URL}/standards/activity-level/ & Bottom Box ---`);
    const actRes = await page.goto(`${PROD_URL}/standards/activity-level/`, { waitUntil: 'networkidle0' });
    console.log(`HTTP Status: ${actRes.status()}`);
    if (actRes.status() !== 200) {
      throw new Error(`Expected HTTP 200 for /standards/activity-level/, got ${actRes.status()}`);
    }
    const actData = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim();
      const hasSidebar = !!document.querySelector('.page-aside');
      const docNavPills = Array.from(document.querySelectorAll('.standards-doc-nav .doc-nav-pill')).map(p => p.textContent?.trim());
      const currentTierRow = document.querySelector('tr.is-current-tier');
      const currentTierTitle = currentTierRow?.querySelector('td:nth-child(2)')?.textContent?.trim();
      const crossLinkDensity = document.querySelector('a[href*="content-density"]')?.getAttribute('href');
      const hasCopyrightBox = !!document.querySelector('.post-copyright');
      const hasCommentBox = !!document.querySelector('#post-comment');
      return { title, hasSidebar, docNavPills, currentTierTitle, crossLinkDensity, hasCopyrightBox, hasCommentBox };
    });
    console.log('Activity Title:', actData.title);
    console.log('Activity Has Sidebar:', actData.hasSidebar, '(Must be false)');
    console.log('Activity Matched Tier:', actData.currentTierTitle);
    console.log('Cross Link to Density:', actData.crossLinkDensity);
    console.log('Has Copyright Bottom Box:', actData.hasCopyrightBox);
    console.log('Has Comment Bottom Box:', actData.hasCommentBox);

    if (actData.hasSidebar) throw new Error('/standards/activity-level/ must NOT have a sidebar!');
    if (!actData.currentTierTitle) throw new Error('Missing is-current-tier row on /standards/activity-level/!');
    if (!actData.crossLinkDensity?.includes('content-density')) throw new Error('Missing cross-link to content-density!');
    if (!actData.hasCopyrightBox) throw new Error('Missing copyright bottom box on /standards/activity-level/!');
    if (!actData.hasCommentBox) throw new Error('Missing comment box on /standards/activity-level/!');

    // 4. Verify /standards/content-density/ (Separate Post & Required Bottom Box)
    console.log(`\n--- 4. Testing ${PROD_URL}/standards/content-density/ & Bottom Box ---`);
    const densRes = await page.goto(`${PROD_URL}/standards/content-density/`, { waitUntil: 'networkidle0' });
    console.log(`HTTP Status: ${densRes.status()}`);
    if (densRes.status() !== 200) {
      throw new Error(`Expected HTTP 200 for /standards/content-density/, got ${densRes.status()}`);
    }
    const densData = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim();
      const hasSidebar = !!document.querySelector('.page-aside');
      const docNavPills = Array.from(document.querySelectorAll('.standards-doc-nav .doc-nav-pill')).map(p => p.textContent?.trim());
      const currentTierRow = document.querySelector('tr.is-current-tier');
      const currentTierTitle = currentTierRow?.querySelector('td:nth-child(2)')?.textContent?.trim();
      const crossLinkActivity = document.querySelector('a[href*="activity-level"]')?.getAttribute('href');
      const hasCopyrightBox = !!document.querySelector('.post-copyright');
      const hasCommentBox = !!document.querySelector('#post-comment');
      return { title, hasSidebar, docNavPills, currentTierTitle, crossLinkActivity, hasCopyrightBox, hasCommentBox };
    });
    console.log('Density Title:', densData.title);
    console.log('Density Has Sidebar:', densData.hasSidebar, '(Must be false)');
    console.log('Density Matched Tier:', densData.currentTierTitle);
    console.log('Cross Link to Activity:', densData.crossLinkActivity);
    console.log('Has Copyright Bottom Box:', densData.hasCopyrightBox);
    console.log('Has Comment Bottom Box:', densData.hasCommentBox);

    if (densData.hasSidebar) throw new Error('/standards/content-density/ must NOT have a sidebar!');
    if (!densData.currentTierTitle) throw new Error('Missing is-current-tier row on /standards/content-density/!');
    if (!densData.crossLinkActivity?.includes('activity-level')) throw new Error('Missing cross-link to activity-level!');
    if (!densData.hasCopyrightBox) throw new Error('Missing copyright bottom box on /standards/content-density/!');
    if (!densData.hasCommentBox) throw new Error('Missing comment box on /standards/content-density/!');

    // 5. Verify Live Homepage & Console Heatmap In-Place Pinned Tooltip
    console.log(`\n--- 5. Testing Heatmap in Console on Live Homepage ---`);
    await page.goto(`${PROD_URL}/`, { waitUntil: 'networkidle0' });

    // Open console modal
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:open-console')));
    await new Promise(r => setTimeout(r, 1200));

    // Verify console webinfo links
    const consoleLinks = await page.evaluate(() => {
      const activeLink = document.querySelector('#console a[href*="activity-level"]')?.getAttribute('href');
      const densityLink = document.querySelector('#console a[href*="content-density"]')?.getAttribute('href');
      return { activeLink, densityLink };
    });
    console.log('Live Console Active Link:', consoleLinks.activeLink);
    console.log('Live Console Density Link:', consoleLinks.densityLink);
    if (!consoleLinks.activeLink?.includes('activity-level')) {
      throw new Error('Live console active item must link to /standards/activity-level/!');
    }
    if (!consoleLinks.densityLink?.includes('content-density')) {
      throw new Error('Live console density item must link to /standards/content-density/!');
    }

    // Click Active Cell & Verify In-Place Tooltip Pinning (No Popover, No Outline)
    console.log('Clicking active cell in live heatmap to pin native tooltip...');
    await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.console-activity-grid .activity-cell:not(.hidden)'));
      const activeCell = cells.find(c => c.classList.contains('level-4')) || cells.find(c => !c.classList.contains('level-0'));
      if (activeCell) activeCell.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const pinData = await page.evaluate(() => {
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

    console.log('Live Cell is-pinned:', pinData.isPinned);
    console.log('Live Cell outline style:', pinData.outlineStyle, '(Must be none)');
    console.log('Live Popover exists:', pinData.popoverExists, '(Must be false)');
    console.log('Live Backdrop exists:', pinData.backdropExists, '(Must be false)');

    if (!pinData.isPinned) {
      throw new Error('Failed: Expected clicked cell to receive .is-pinned class!');
    }
    if (pinData.popoverExists) {
      throw new Error('Failed: .activity-screen-popover must NOT exist on cell click!');
    }
    if (pinData.backdropExists) {
      throw new Error('Failed: .activity-screen-popover-backdrop must NOT exist!');
    }
    if (pinData.outlineStyle !== 'none' && pinData.outlineStyle !== '') {
      throw new Error(`Failed: Cell must NOT have an outline border, got: ${pinData.outlineStyle}`);
    }

    // Click outside on console profile area to unpin
    console.log('Clicking outside to test auto-unpinning on live site...');
    await page.evaluate(() => {
      const profile = document.querySelector('.console-profile') || document.body;
      profile.click();
    });
    await new Promise(r => setTimeout(r, 300));

    const liveUnpin = await page.evaluate(() => {
      const pinned = document.querySelector('.console-activity-grid .activity-cell.is-pinned');
      return { stillPinned: !!pinned };
    });
    console.log('Live Cell still pinned after outside click:', liveUnpin.stillPinned, '(Must be false)');

    if (liveUnpin.stillPinned) {
      throw new Error('Failed: Tooltip should automatically unpin when clicking outside on live site!');
    }

    if (errors.length > 0) {
      throw new Error(`Encountered ${errors.length} browser errors during live testing:\n${errors.join('\n')}`);
    }

    console.log(`\n========================================`);
    console.log(`🎉 LIVE PRODUCTION VERIFICATION 100% PASSED!`);
    console.log(`========================================\n`);
  } finally {
    await browser.close();
  }
}

verifyLive().catch(err => {
  console.error('\n❌ Live verification failed:', err);
  process.exit(1);
});
