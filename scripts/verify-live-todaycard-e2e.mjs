import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  const liveUrl = 'https://blog.epocanvas.com/';
  console.log(`Auditing live production URL: ${liveUrl}`);
  const resp = await page.goto(liveUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  console.log(`HTTP Status: ${resp.status()}`);

  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

  // 1. Check Light Mode
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await new Promise(r => setTimeout(r, 600));

  const lightState = await page.evaluate(() => {
    const card = document.querySelector('.todayCard');
    const svg = document.querySelector('svg.todayCard-cover');
    const bg = document.querySelector('.svg-bg');
    const w1 = document.querySelector('.w1');
    const w2 = document.querySelector('.w2');
    const w3 = document.querySelector('.w3');
    const bgComputed = bg ? window.getComputedStyle(bg).fill : null;
    return {
      cardPresent: !!card,
      svgPresent: !!svg,
      w1Present: !!w1,
      w2Present: !!w2,
      w3Present: !!w3,
      w2D: w2 ? w2.getAttribute('d') : null,
      bgFill: bgComputed
    };
  });
  console.log('Live Light State:', lightState);

  let cardEl = await page.$('.todayCard');
  if (cardEl) {
    await cardEl.screenshot({ path: 'scripts/live_todayCard_light.png' });
    console.log('Saved scripts/live_todayCard_light.png');
  }

  // 2. Check Dark Mode
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await new Promise(r => setTimeout(r, 600));

  const darkState = await page.evaluate(() => {
    const bg = document.querySelector('.svg-bg');
    const w1 = document.querySelector('.w1');
    const w2 = document.querySelector('.w2');
    return {
      bgFill: bg ? window.getComputedStyle(bg).fill : null,
      w1Vis: w1 ? window.getComputedStyle(w1).visibility : null,
      w2Vis: w2 ? window.getComputedStyle(w2).visibility : null,
    };
  });
  console.log('Live Dark State:', darkState);

  cardEl = await page.$('.todayCard');
  if (cardEl) {
    await cardEl.screenshot({ path: 'scripts/live_todayCard_dark.png' });
    console.log('Saved scripts/live_todayCard_dark.png');
  }

  console.log('Console Errors Count:', errors.length);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }

  await browser.close();

  // Assertions
  if (!lightState.cardPresent || !lightState.svgPresent || !lightState.w2Present || !lightState.w3Present) {
    throw new Error('Elements missing on live production!');
  }
  if (darkState.w2Vis !== 'visible') {
    throw new Error('w2 (to) is not visible in dark mode!');
  }
  console.log('ALL LIVE AUDIT ASSERTIONS PASSED!');
})();
