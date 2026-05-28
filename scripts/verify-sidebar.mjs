import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  const url = 'http://localhost:4321';
  console.log(`Navigating to ${url}...`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (error) {
    console.error('Failed to load page. Is the dev server running?', error);
    await browser.close();
    process.exit(1);
  }

  // 1. Verify statistics are dynamic and present
  const stats = await page.evaluate(() => {
    const featurePanel = document.querySelector('.card-feature-panel--overview');
    if (!featurePanel) return { error: 'Feature panel not found' };
    
    const highlightCards = Array.from(featurePanel.querySelectorAll('.webinfo-highlight-card'));
    return highlightCards.map(card => {
        const label = card.querySelector('span')?.innerText;
        const value = card.querySelector('strong')?.innerText;
        return { label, value };
    });
  });
  console.log('Stats from Sidebar:', stats);

  // 2. Verify Tags and Archives are present on home page
  const visibility = await page.evaluate(() => {
    return {
        tags: !!document.querySelector('.card-tags'),
        archives: !!document.querySelector('.card-archives'),
        featurePanel: !!document.querySelector('.card-feature-panel--overview')
    };
  });
  console.log('Widget Visibility on Home:', visibility);

  // 3. Verify Sticky behavior
  console.log('Scrolling down...');
  await page.evaluate(() => window.scrollBy(0, 1000));
  await new Promise(r => setTimeout(r, 1000));

  const stickyStatus = await page.evaluate(() => {
    const aside = document.querySelector('.page-aside__sticky');
    const featurePanel = document.querySelector('.card-feature-panel--overview');
    if (!aside || !featurePanel) return { error: 'Aside or Feature Panel not found' };
    
    const asideRect = aside.getBoundingClientRect();
    const stickyState = featurePanel.dataset.stickyState;
    return {
        asideTop: asideRect.top,
        stickyState: stickyState,
        isStickyActive: featurePanel.classList.contains('is-sticky-active')
    };
  });
  console.log('Sticky Status after scroll:', stickyStatus);

  await page.screenshot({ path: 'sidebar-verify.png', fullPage: true });
  console.log('✅ Screenshot saved: sidebar-verify.png');

  await browser.close();
})();
