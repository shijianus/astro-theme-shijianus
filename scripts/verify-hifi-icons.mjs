import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  const url = 'http://localhost:4322';
  console.log(`Navigating to ${url}...`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (error) {
    console.error('Failed to load page. Is the dev server running?', error);
    await browser.close();
    process.exit(1);
  }

  console.log('--- 验证 1: 防破坏验证 (Dashboard Icon) ---');
  const dashboardIcon = await page.$('.anzhiyu-dashboard-icon');
  if (dashboardIcon) {
    const topBarHeight = await page.evaluate(() => {
      const el = document.querySelector('.anzhiyu-dashboard-icon .top-bar');
      return window.getComputedStyle(el).height;
    });
    console.log(`Dashboard top-bar height: ${topBarHeight} (should NOT be 1.5px or 2px)`);
    if (parseFloat(topBarHeight) > 5) {
      console.log('✅ Dashboard icon remains thick.');
    } else {
      console.error('❌ Dashboard icon might have been thinned!');
    }
  } else {
    console.error('❌ Dashboard icon not found.');
  }

  console.log('--- 验证 2: 字重验证 (Stroke Width) ---');
  const strokeWidth = await page.evaluate(() => {
    const svg = document.querySelector('#search-button svg');
    return svg ? window.getComputedStyle(svg).strokeWidth : null;
  });
  console.log(`Search icon stroke-width: ${strokeWidth}`);
  if (parseFloat(strokeWidth) >= 2.8) {
    console.log('✅ Stroke width is successfully increased.');
  } else {
    console.error(`❌ Stroke width is too thin: ${strokeWidth}`);
  }

  console.log('--- 验证 3: 对齐验证 (Bounding Box) ---');
  const alignment = await page.evaluate(() => {
    const searchBtn = document.querySelector('#search-button');
    const dashboardBtn = document.querySelector('.anzhiyu-dashboard-icon');
    
    if (!searchBtn || !dashboardBtn) return null;
    
    const searchRect = searchBtn.getBoundingClientRect();
    const dashboardRect = dashboardBtn.getBoundingClientRect();
    
    return {
      search: { y: searchRect.y, height: searchRect.height, width: searchRect.width },
      dashboard: { y: dashboardRect.y, height: dashboardRect.height, width: dashboardRect.width }
    };
  });

  if (alignment) {
    console.log('Alignment Data:', alignment);
    const yDiff = Math.abs(alignment.search.y - alignment.dashboard.y);
    const heightDiff = Math.abs(alignment.search.height - alignment.dashboard.height);
    
    if (yDiff < 1 && heightDiff < 1 && Math.abs(alignment.search.height - 35) < 1) {
      console.log('✅ Alignment and dimensions are perfect (35px, same Y level).');
    } else {
      console.error('❌ Alignment or dimensions mismatch!');
    }
  } else {
    console.error('❌ Buttons not found for alignment check.');
  }

  await page.screenshot({ path: 'hifi-verification.png' });
  console.log('✅ Screenshot saved: hifi-verification.png');

  await browser.close();
})();
