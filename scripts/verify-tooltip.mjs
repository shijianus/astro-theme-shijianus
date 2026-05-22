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

  console.log(`Hovering over ${selector}...`);
  const element = await page.$(selector);
  if (element) {
    await element.hover();
    await new Promise(r => setTimeout(r, 1000)); // Wait for transition
    
    // Check tooltip styles via pseudo-element
    const styles = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const computed = window.getComputedStyle(el, '::after');
      return {
        content: computed.content,
        background: computed.backgroundColor,
        fontSize: computed.fontSize,
        padding: computed.padding,
        opacity: computed.opacity,
        visibility: computed.visibility,
        transform: computed.transform,
        backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
        borderRadius: computed.borderRadius
      };
    }, selector);
    
    console.log('Tooltip Pseudo-Styles:', styles);

    if (styles.content && styles.content.includes('中控台') && parseFloat(styles.opacity) > 0.8) {
       console.log('✅ Tooltip verified');
    } else {
       console.log('❌ Tooltip not showing properly', styles);
    }
  } else {
    console.error(`❌ Selector ${selector} not found.`);
  }

  await browser.close();
})();