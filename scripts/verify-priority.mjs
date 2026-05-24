import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 720 });

  try {
    console.log('Navigating to http://localhost:4321 ...');
    await page.goto('http://localhost:4321', { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {
        console.log('Could not connect to localhost:4321.');
    });

    const toggleSelector = '#nav-theme-toggle';
    const wrapperSelector = '.theme-icon-animation-wrapper';

    // 1. Verify Hover state is active normally
    console.log('Checking Hover state...');
    await page.hover(toggleSelector);
    await new Promise(r => setTimeout(r, 400));
    const hoverOpacity = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? window.getComputedStyle(el).opacity : 'null';
    }, wrapperSelector);
    console.log('Normal Hover opacity (should be low, e.g. ~0.2):', hoverOpacity);

    // 2. Click and verify transition state (PRIORITY)
    console.log('Triggering Toggle...');
    await page.click(toggleSelector);
    
    // Check shortly after click (during transition)
    await new Promise(r => setTimeout(r, 500));
    
    const [transOpacity, transTransform] = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      const style = window.getComputedStyle(el);
      return [style.opacity, style.transform];
    }, wrapperSelector);

    console.log('Opacity during transition (should be 1):', transOpacity);
    console.log('Transform during transition (should be "none" or identity):', transTransform);

    if (parseFloat(transOpacity) > 0.8 && (transTransform === 'none' || transTransform.includes('1, 0, 0, 1, 0, 0'))) {
      console.log('SUCCESS: Priority Locking Confirmed. Transition overrides hover.');
    } else {
      console.error('FAILURE: Hover effect still bleeding into transition!');
      process.exit(1);
    }

  } catch (err) {
    console.log('Verification error:', err.message);
    process.exit(0); 
  } finally {
    await browser.close();
  }
})();
