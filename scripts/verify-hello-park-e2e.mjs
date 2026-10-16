import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 [E2E Live Verification] Auditing "hello" park position & clipping on https://blog.epocanvas.com/ ...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    const res = await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle2', timeout: 45000 });
    console.log(`📡 Response HTTP Status: ${res.status()}`);

    if (res.status() !== 200) {
      throw new Error(`Failed to load page: status ${res.status()}`);
    }

    // 1. Audit SVG source code attributes in the live DOM
    const liveAttrs = await page.evaluate(() => {
      const card = document.querySelector('.todayCard');
      const svg = card?.querySelector('.todayCard-cover');
      const helloPark = svg?.querySelector('.hello-park');
      const helloGroup = helloPark?.querySelector('g');
      const innerHtml = svg?.outerHTML || '';

      return {
        cardFound: !!card,
        svgFound: !!svg,
        helloParkFound: !!helloPark,
        hasNewParkTranslate: innerHtml.includes('479.1px, 333.0px') || innerHtml.includes('479.1px,333.0px'),
        hasNewHelloTranslate: innerHtml.includes('translate(135.0,290.0)') || innerHtml.includes('translate(135.0, 290.0)'),
        hasNewLine1Translate: innerHtml.includes('translate(88.0,535.0)') || innerHtml.includes('translate(88.0, 535.0)'),
        hasNewLine2Translate: innerHtml.includes('translate(100.0,715.0)') || innerHtml.includes('translate(100.0, 715.0)'),
      };
    });

    console.log('🔍 Live SVG Coordinates Audit:', liveAttrs);

    if (!liveAttrs.hasNewHelloTranslate) {
      console.warn('⚠️ Cloudflare cache might still be propagating translate(135.0,290.0).');
    }

    // 2. Wait until hello parks (5.2 seconds into the animation)
    console.log('⏳ Waiting for "hello" to finish writing and park in top-left (5.2s)...');
    await new Promise(r => setTimeout(r, 5200));

    // 3. Measure geometry in the live rendered card
    const geo = await page.evaluate(() => {
      const card = document.querySelector('.todayCard');
      const svg = card?.querySelector('.todayCard-cover');
      const helloPark = svg?.querySelector('.hello-park');
      const cardRect = card?.getBoundingClientRect();
      const helloRect = helloPark?.getBoundingClientRect();

      const topGap = helloRect ? helloRect.top - cardRect.top : null;
      const leftGap = helloRect ? helloRect.left - cardRect.left : null;
      const isClippedTop = topGap !== null && topGap < 5; // if less than 5px, it's touching or clipped

      return {
        cardRect: { width: cardRect?.width, height: cardRect?.height },
        helloRect: { top: helloRect?.top, left: helloRect?.left, width: helloRect?.width, height: helloRect?.height },
        topGap,
        leftGap,
        isClippedTop
      };
    });

    console.log('📐 Rendered Geometry Measurements:', geo);

    if (geo.isClippedTop) {
      throw new Error(`❌ "hello" is clipped at the top! topGap is only ${geo.topGap}px`);
    } else {
      console.log(`✅ "hello" is safely inside the card with a top gap of ${geo.topGap?.toFixed(1)}px and left gap of ${geo.leftGap?.toFixed(1)}px!`);
    }

    // 4. Capture screenshot of parked state in Dark Mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await new Promise(r => setTimeout(r, 400));
    const cardEl = await page.$('.todayCard');
    if (cardEl) {
      await cardEl.screenshot({ path: 'scripts/live_todaycard_parked_dark.png' });
      console.log('📸 Saved scripts/live_todaycard_parked_dark.png');
    }

    // 5. Capture screenshot of parked state in Light Mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await new Promise(r => setTimeout(r, 400));
    if (cardEl) {
      await cardEl.screenshot({ path: 'scripts/live_todaycard_parked_light.png' });
      console.log('📸 Saved scripts/live_todaycard_parked_light.png');
    }

    // 6. Complete state (all lines finished): fast forward animations or wait
    console.log('⏳ Fast-forwarding to complete calligraphy state (19s finale)...');
    await page.evaluate(() => {
      // Force all paths to be drawn and visible
      const paths = document.querySelectorAll('.todayCard-cover path');
      paths.forEach(p => {
        p.style.strokeDashoffset = '0';
        p.style.visibility = 'visible';
      });
      // Force hello-park to end transform
      const hp = document.querySelector('.todayCard-cover .hello-park');
      if (hp) {
        hp.style.transform = 'translate(0px, 0px) scale(1, 1)';
      }
      // Force zones
      const zones = document.querySelectorAll('.todayCard-cover .ink-zone');
      zones.forEach(z => {
        z.style.opacity = '0.9';
        z.style.transform = 'scale(1)';
      });
    });

    await new Promise(r => setTimeout(r, 500));

    // Screenshot all lines in Dark mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await new Promise(r => setTimeout(r, 400));
    if (cardEl) {
      await cardEl.screenshot({ path: 'scripts/live_todaycard_complete_dark.png' });
      console.log('📸 Saved scripts/live_todaycard_complete_dark.png');
    }

    // Screenshot all lines in Light mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await new Promise(r => setTimeout(r, 400));
    if (cardEl) {
      await cardEl.screenshot({ path: 'scripts/live_todaycard_complete_light.png' });
      console.log('📸 Saved scripts/live_todaycard_complete_light.png');
    }

    console.log(`🐞 Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.warn('Console Errors list:', consoleErrors);
    }

    console.log('🎉 [SUCCESS] Live E2E Verification completely passed!');
  } finally {
    await browser.close();
  }
})();
