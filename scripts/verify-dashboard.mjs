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

  const selector = '.anzhiyu-dashboard-icon';
  console.log(`Evaluating default state...`);
  
  const getStyles = async () => {
    return await page.evaluate((sel) => {
      const icon = document.querySelector(sel);
      if (!icon) return null;
      const topBar = icon.querySelector('.top-bar');
      const botLeft = icon.querySelector('.bottom-left-dot');
      const botRight = icon.querySelector('.bottom-right-bar');
      
      const getS = (el) => {
        const s = window.getComputedStyle(el);
        return { width: s.width, height: s.height, transform: s.transform };
      };
      
      return {
        topBar: getS(topBar),
        botLeft: getS(botLeft),
        botRight: getS(botRight)
      };
    }, selector);
  };

  const defaultState = await getStyles();
  console.log('Default State:', defaultState);

  console.log(`Hovering over ${selector}...`);
  const element = await page.$(selector);
  if (element) {
    await element.hover();
    await new Promise(r => setTimeout(r, 1000)); // Wait for transition
    
    const hoverState = await getStyles();
    console.log('Hover State:', hoverState);
    
    // Check if any rotate is in transform
    const hasRotate = Object.values(hoverState).some(s => s.transform.includes('matrix') && !s.transform.includes('matrix(1, 0, 0, 1'));
    if (hasRotate) {
      console.error('❌ Rotation detected in hover state!');
    } else {
      console.log('✅ No rotation detected in hover state.');
    }
    
    // Check that lengths changed (e.g. topBar got shorter, botRight got taller)
    if (parseFloat(hoverState.botRight.height) > parseFloat(defaultState.botRight.height)) {
      console.log('✅ botRight height stretched properly.');
    } else {
      console.error('❌ botRight height did NOT stretch properly.', hoverState.botRight.height, defaultState.botRight.height);
    }

  } else {
    console.error(`❌ Selector ${selector} not found.`);
  }

  await browser.close();
})();
