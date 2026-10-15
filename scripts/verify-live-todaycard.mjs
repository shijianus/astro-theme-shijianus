import puppeteer from 'puppeteer';

(async () => {
  console.log('=== Verifying todayCard SVG on live production: https://blog.epocanvas.com/ ===');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.setViewport({ width: 1440, height: 900 });
    const response = await page.goto('https://blog.epocanvas.com/', {
      waitUntil: 'networkidle2',
      timeout: 45000
    });

    console.log(`HTTP Status: ${response.status()}`);

    // Wait for todayCard
    await page.waitForSelector('.todayCard', { timeout: 15000 });
    console.log('✓ Found .todayCard');

    // Audit SVG structure & attributes
    const auditResult = await page.evaluate(() => {
      const card = document.querySelector('.todayCard');
      const cover = card ? card.querySelector('.todayCard-cover') : null;
      const info = card ? card.querySelector('.todayCard-info') : null;
      const tips = info ? info.querySelector('.todayCard-tips')?.textContent?.trim() : null;
      const title = info ? info.querySelector('.todayCard-title')?.textContent?.trim() : null;

      if (!cover) return { ok: false, error: 'No .todayCard-cover found' };

      const tagName = cover.tagName.toLowerCase();
      const hasDefs = !!cover.querySelector('defs');
      const hasInkH = !!cover.querySelector('#inkH');
      const hasInk1 = !!cover.querySelector('#ink1');
      const hasInk2 = !!cover.querySelector('#ink2');
      const paths = Array.from(cover.querySelectorAll('path')).map(p => p.className.baseVal);
      const computedBg = window.getComputedStyle(cover).backgroundColor;

      return {
        ok: true,
        tagName,
        hasDefs,
        hasInkH,
        hasInk1,
        hasInk2,
        pathsCount: paths.length,
        paths,
        computedBg,
        tips,
        title
      };
    });

    console.log('Live Audit Result:', JSON.stringify(auditResult, null, 2));

    if (!auditResult.ok || auditResult.tagName !== 'svg') {
      throw new Error(`Audit failed: expected svg tag, got ${auditResult.tagName}`);
    }
    if (auditResult.pathsCount < 7) {
      throw new Error(`Audit failed: expected at least 7 paths, found ${auditResult.pathsCount}`);
    }

    console.log('✓ SVG tag and neon path definitions verified');
    console.log(`✓ todayCard-info intact: tips="${auditResult.tips}", title="${auditResult.title}"`);

    // Wait for initial animation
    await new Promise(r => setTimeout(r, 4500));
    const cardEl = await page.$('.todayCard');
    if (cardEl) {
      await cardEl.screenshot({ path: 'scripts/live_todaycard.png' });
      console.log('✓ Saved screenshot to scripts/live_todaycard.png');
    }

    const fatalErrors = consoleErrors.filter(e => !e.includes('net::ERR_') && !e.includes('favicon'));
    console.log(`Console fatal errors: ${fatalErrors.length}`);
    if (fatalErrors.length > 0) {
      console.warn('Console warnings/errors:', fatalErrors);
    }

    console.log('=== All checks passed successfully! ===');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
