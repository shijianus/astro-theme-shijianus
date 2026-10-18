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
    console.log('Activity Days Count:', apiJson.activity?.length);
    if (!apiJson.ok || !apiJson.stats || !apiJson.activity) {
      throw new Error('API returned invalid JSON schema');
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
      const items = webinfoItems.map(item => ({
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
        count: webinfoItems.length,
        items,
        activeCurrentTier,
        densityCurrentTier,
      };
    });

    console.log('Standards Title:', standardsData.title);
    console.log('Has Sidebar:', standardsData.hasSidebar, '(Must be false for doc structure)');
    console.log('Doc Nav Pills:', standardsData.docNavPills);
    console.log(`Webinfo Items Count: ${standardsData.count}`);
    console.log('Active Tier:', standardsData.activeCurrentTier);
    console.log('Density Tier:', standardsData.densityCurrentTier);

    if (standardsData.hasSidebar) {
      throw new Error('Failure: Standards page must NOT have a sidebar (showAside={false})!');
    }
    if (standardsData.count < 6) {
      throw new Error(`Expected at least 6 webinfo-items on /standards/, got ${standardsData.count}`);
    }
    if (standardsData.docNavPills.length < 4) {
      throw new Error(`Expected at least 4 doc nav pills, got ${standardsData.docNavPills.length}`);
    }

    // 3. Verify Live Homepage & Console Heatmap
    console.log(`\n--- 3. Testing Heatmap in Console on Live Homepage ---`);
    await page.goto(`${PROD_URL}/`, { waitUntil: 'networkidle0' });

    // Open console modal
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:open-console')));
    await new Promise(r => setTimeout(r, 1200));

    const heatmapData = await page.evaluate(() => {
      const grid = document.querySelector('.console-activity-grid');
      const cells = grid ? Array.from(grid.querySelectorAll('.activity-cell:not(.hidden)')) : [];
      const nonZeroCells = cells.filter(c => !c.classList.contains('level-0'));
      return {
        totalCells: cells.length,
        activeCells: nonZeroCells.length,
        hasLevel4: cells.some(c => c.classList.contains('level-4')),
      };
    });

    console.log(`Live Heatmap Total Cells: ${heatmapData.totalCells}`);
    console.log(`Live Heatmap Active Cells: ${heatmapData.activeCells}`);
    if (heatmapData.totalCells < 350) {
      throw new Error(`Expected >= 350 cells in 52-week grid, got ${heatmapData.totalCells}`);
    }
    if (heatmapData.activeCells === 0) {
      throw new Error('Live heatmap has zero active cells!');
    }

    // 4. Test Tooltip Top Placement on Live Site
    console.log(`\n--- 4. Testing Tooltip Top Placement on Live Site ---`);
    const tooltipCheck = await page.evaluate(() => {
      const cell = document.querySelector('.console-activity-grid .activity-cell.level-4') ||
                   document.querySelector('.console-activity-grid .activity-cell:not(.level-0)');
      if (!cell) return null;
      const style = window.getComputedStyle(cell, '::before');
      return {
        bottom: style.bottom,
        top: style.top,
        zIndex: style.zIndex,
        dataTooltip: cell.getAttribute('data-tooltip'),
      };
    });
    console.log('Tooltip Check:', tooltipCheck);

    // 5. Click Active Cell & Verify Screen-Level Popover + Footer (No Truncation)
    console.log(`\n--- 5. Testing Cell Click, Screen-Level Popover & Footer ---`);
    const clickResult = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.console-activity-grid .activity-cell:not(.hidden)'));
      const activeCell = cells.find(c => c.classList.contains('level-4')) || cells.find(c => !c.classList.contains('level-0'));
      if (!activeCell) return null;
      const tooltip = activeCell.getAttribute('data-tooltip');
      activeCell.click();
      return { tooltip };
    });

    console.log('Clicked Cell Tooltip:', clickResult?.tooltip);
    await new Promise(r => setTimeout(r, 800));

    // Verify Screen-Level Popover
    const popoverData = await page.evaluate(() => {
      const popover = document.querySelector('.activity-screen-popover');
      if (!popover) return null;
      const isInsideWrapper = !!popover.closest('.heatmap-internal-wrapper');
      const isFixed = window.getComputedStyle(popover).position === 'fixed';
      const badge = popover.querySelector('.activity-count-badge')?.textContent?.trim();
      const items = Array.from(popover.querySelectorAll('.activity-screen-popover__list li')).map(li => ({
        title: li.textContent?.trim(),
        href: li.querySelector('a')?.getAttribute('href')
      }));

      return {
        exists: true,
        isInsideWrapper,
        isFixed,
        badge,
        postsCount: items.length,
      };
    });

    console.log('Live Screen Popover exists:', popoverData?.exists);
    console.log('Live Screen Popover inside wrapper:', popoverData?.isInsideWrapper, '(Must be false)');
    console.log('Live Screen Popover fixed:', popoverData?.isFixed);
    console.log('Live Screen Popover Badge:', popoverData?.badge);
    console.log(`Live Screen Popover Posts Count: ${popoverData?.postsCount}`);

    if (!popoverData || !popoverData.exists) {
      throw new Error('Failed: Expected .activity-screen-popover on live site on cell click!');
    }
    if (popoverData.isInsideWrapper) {
      throw new Error('Failed: .activity-screen-popover must NOT be inside .heatmap-internal-wrapper!');
    }

    const footerData = await page.evaluate(() => {
      const footer = document.querySelector('.activity-details-footer');
      const countBadge = footer?.querySelector('.activity-count-badge')?.textContent?.trim();
      const list = footer?.querySelector('.activity-details-list');
      const items = list ? Array.from(list.querySelectorAll('li')).map(li => ({
        title: li.textContent?.trim(),
        href: li.querySelector('a')?.getAttribute('href')
      })) : [];

      return {
        hasFooter: !!footer,
        countBadge,
        postsCount: items.length,
      };
    });

    console.log('Footer rendered:', footerData.hasFooter);
    console.log('Footer Count Badge:', footerData.countBadge);
    console.log(`Footer Rendered Posts Count: ${footerData.postsCount}`);

    if (footerData.postsCount === 0) {
      throw new Error('Clicked active day but 0 posts rendered in details footer!');
    }
    if (footerData.postsCount >= 4) {
      console.log(`✅ Success: All ${footerData.postsCount} posts rendered without 3-post truncation!`);
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
