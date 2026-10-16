import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting Live E2E Verification for https://blog.epocanvas.com/ ...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  const response = await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle2' });
  console.log(`📡 Response Status: ${response.status()}`);

  if (response.status() !== 200) {
    console.error(`❌ HTTP Error: status ${response.status()}`);
    await browser.close();
    process.exit(1);
  }

  // Check 1: Card existence and SVG attributes
  const cardData = await page.evaluate(() => {
    const card = document.querySelector('.topGroup .todayCard');
    const svg = document.querySelector('.topGroup svg.todayCard-cover');
    const defs = svg?.querySelector('defs')?.innerHTML || '';
    const info = document.querySelector('.topGroup .todayCard-info');
    const title = document.querySelector('.topGroup .todayCard-title');
    const tips = document.querySelector('.topGroup .todayCard-tips');

    return {
      cardFound: !!card,
      svgFound: !!svg,
      aspectRatio: svg?.getAttribute('preserveAspectRatio'),
      hasSilkBaseDark: defs.includes('silkBaseDark'),
      hasSilkBaseLight: defs.includes('silkBaseLight'),
      hasInkZones: defs.includes('zoneCoral') && defs.includes('zoneCyan'),
      titleText: title?.textContent?.trim(),
      tipsText: tips?.textContent?.trim()
    };
  });

  console.log('🔍 Card Data Audit:', cardData);

  if (!cardData.cardFound || !cardData.svgFound) {
    console.error('❌ .todayCard or svg.todayCard-cover not found!');
    await browser.close();
    process.exit(1);
  }

  if (cardData.aspectRatio !== 'xMidYMid slice') {
    console.error(`❌ SVG preserveAspectRatio is ${cardData.aspectRatio}, expected xMidYMid slice`);
    await browser.close();
    process.exit(1);
  }

  if (!cardData.hasSilkBaseDark || !cardData.hasSilkBaseLight) {
    console.warn('⚠️ SVG may still be caching an older deployment, waiting or inspecting...');
  }

  // Check 2: Light Mode Audit
  console.log('🌞 Auditing Light Mode...');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await new Promise(r => setTimeout(r, 600));

  const lightStyles = await page.evaluate(() => {
    const info = document.querySelector('.topGroup .todayCard-info');
    const title = document.querySelector('.topGroup .todayCard-title');
    const btn = document.querySelector('.topGroup .banner-button');
    return {
      infoBg: window.getComputedStyle(info).background,
      titleColor: window.getComputedStyle(title).color,
      btnColor: window.getComputedStyle(btn).color,
      btnBg: window.getComputedStyle(btn).backgroundColor,
    };
  });
  console.log('Light Mode Styles:', lightStyles);

  const heroLight = await page.$('#home_top');
  if (heroLight) {
    await heroLight.screenshot({ path: 'scripts/live_prod_hero_light.png' });
    console.log('📸 Saved scripts/live_prod_hero_light.png');
  }
  const cardLight = await page.$('.topGroup .todayCard');
  if (cardLight) {
    await cardLight.screenshot({ path: 'scripts/live_prod_card_light.png' });
    console.log('📸 Saved scripts/live_prod_card_light.png');
  }

  // Check 3: Dark Mode Audit
  console.log('🌙 Auditing Dark Mode...');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await new Promise(r => setTimeout(r, 600));

  const darkStyles = await page.evaluate(() => {
    const info = document.querySelector('.topGroup .todayCard-info');
    const title = document.querySelector('.topGroup .todayCard-title');
    const btn = document.querySelector('.topGroup .banner-button');
    return {
      infoBg: window.getComputedStyle(info).background,
      titleColor: window.getComputedStyle(title).color,
      btnColor: window.getComputedStyle(btn).color,
    };
  });
  console.log('Dark Mode Styles:', darkStyles);

  const heroDark = await page.$('#home_top');
  if (heroDark) {
    await heroDark.screenshot({ path: 'scripts/live_prod_hero_dark.png' });
    console.log('📸 Saved scripts/live_prod_hero_dark.png');
  }
  const cardDark = await page.$('.topGroup .todayCard');
  if (cardDark) {
    await cardDark.screenshot({ path: 'scripts/live_prod_card_dark.png' });
    console.log('📸 Saved scripts/live_prod_card_dark.png');
  }

  console.log(`🐞 Console Errors Count: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.warn('Console error messages:', consoleErrors);
  }

  await browser.close();
  console.log('✅ Live E2E Audit Script Finished.');
})();
