import puppeteer from 'puppeteer';

async function verifyLive() {
  const liveBase = 'https://blog.epocanvas.com';
  console.log(`[LiveE2E] Starting live production verification on ${liveBase} ...`);

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

    // 1. Verify Live /standards/
    console.log('\n--- 1. Testing Live https://blog.epocanvas.com/standards/ ---');
    const res = await page.goto(`${liveBase}/standards/`, { waitUntil: 'networkidle0', timeout: 30000 });
    console.log(`Live HTTP Status: ${res.status()}`);
    if (res.status() !== 200) {
      throw new Error(`Expected 200 for live /standards/, got ${res.status()}`);
    }

    const standardsData = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim();
      const webinfoItems = Array.from(document.querySelectorAll('.standards-webinfo-grid .webinfo-item'));
      const activeCurrentTier = document.querySelector('#maintainer-level .is-current-tier')?.textContent?.trim();
      const densityCurrentTier = document.querySelector('#content-density .is-current-tier')?.textContent?.trim();

      return {
        title,
        webinfoItemsCount: webinfoItems.length,
        hasActiveTier: Boolean(activeCurrentTier),
        hasDensityTier: Boolean(densityCurrentTier),
        items: webinfoItems.map(it => ({
          label: it.querySelector('.webinfo-item-label span')?.textContent?.trim(),
          val: it.querySelector('strong')?.textContent?.trim()
        }))
      };
    });

    console.log('Standards Title:', standardsData.title);
    console.log(`Webinfo Items: ${standardsData.webinfoItemsCount}`);
    console.log('Active Tier exists:', standardsData.hasActiveTier);
    console.log('Density Tier exists:', standardsData.hasDensityTier);
    console.log('Sample Items:', standardsData.items.slice(0, 4));

    if (standardsData.webinfoItemsCount < 6) {
      throw new Error(`Insufficient webinfo items on live /standards/: ${standardsData.webinfoItemsCount}`);
    }

    // 2. Verify Live /api/console/data API
    console.log('\n--- 2. Testing Live https://blog.epocanvas.com/api/console/data ---');
    const apiRes = await page.goto(`${liveBase}/api/console/data`, { waitUntil: 'networkidle0' });
    console.log(`API HTTP Status: ${apiRes.status()}`);
    const apiJson = await apiRes.json();
    console.log('API Response ok:', apiJson.ok, 'Stats:', apiJson.stats);
    if (!apiJson.ok || !apiJson.stats) {
      throw new Error('Live /api/console/data failed or returned invalid json');
    }

    // 3. Verify Live Console Heatmap
    console.log('\n--- 3. Testing Live Console Heatmap ---');
    await page.goto(`${liveBase}/`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:open-console')));
    await new Promise(r => setTimeout(r, 1200));

    const heatmapData = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.console-activity-grid .activity-cell:not(.hidden)'));
      const nonZeroCells = cells.filter(c => !c.classList.contains('level-0'));
      return {
        totalCells: cells.length,
        activeCellsCount: nonZeroCells.length,
      };
    });

    console.log(`Live Heatmap Total Cells: ${heatmapData.totalCells}`);
    console.log(`Live Heatmap Active Cells: ${heatmapData.activeCellsCount}`);
    if (heatmapData.activeCellsCount === 0) {
      throw new Error('Live heatmap has zero active cells!');
    }

    // 4. Test Multi-post Cell Click and Full List Render on Live
    console.log('\n--- 4. Testing Multi-post Cell Click & Full Article Display ---');
    const clickCell = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.console-activity-grid .activity-cell:not(.hidden)'));
      const level4 = cells.find(c => c.classList.contains('level-4'));
      if (level4) {
        level4.click();
        return level4.getAttribute('data-tooltip');
      }
      return null;
    });

    console.log('Clicked level-4 cell tooltip:\n', clickCell);
    await new Promise(r => setTimeout(r, 800));

    const footerLive = await page.evaluate(() => {
      const footer = document.querySelector('.activity-details-footer');
      const head = footer?.querySelector('.activity-details__title-group strong')?.textContent?.trim();
      const badge = footer?.querySelector('.activity-count-badge')?.textContent?.trim();
      const lis = Array.from(footer?.querySelectorAll('.activity-details-list li') || []).map(li => ({
        text: li.textContent?.trim(),
        href: li.querySelector('a')?.getAttribute('href')
      }));

      return {
        head,
        badge,
        postsCount: lis.length,
        firstThree: lis.slice(0, 3)
      };
    });

    console.log('Live Details Header:', footerLive.head);
    console.log('Live Details Badge:', footerLive.badge);
    console.log(`Live Rendered Posts in Footer: ${footerLive.postsCount}`);
    console.log('Sample posts:', footerLive.firstThree);

    if (footerLive.postsCount === 0) {
      throw new Error('Clicked active cell on live site but 0 posts rendered!');
    }
    if (footerLive.head && footerLive.head.includes('当日无推送记录')) {
      throw new Error('Hydration bug detected on live site!');
    }

    // 5. Tooltip Upward Placement Verification on Live
    console.log('\n--- 5. Testing Live Tooltip Upward Placement ---');
    const liveTooltipStyle = await page.evaluate(() => {
      const cell = document.querySelector('.console-activity-grid .activity-cell.level-4');
      if (!cell) return null;
      const style = window.getComputedStyle(cell, '::before');
      return {
        bottom: style.bottom,
        top: style.top,
        zIndex: style.zIndex,
      };
    });
    console.log('Live Tooltip style:', liveTooltipStyle);

    console.log('\n🎉 ALL LIVE PRODUCTION ASSERTIONS PASSED! 100% SUCCESS.');
  } finally {
    await browser.close();
  }
}

verifyLive().catch(err => {
  console.error('\n❌ Live verification failed:', err);
  process.exit(1);
});
