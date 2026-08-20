const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  console.log('Navigating to post...');
  await page.goto('http://localhost:4322/posts/anzhiyu-markdown-showcase', { waitUntil: 'networkidle0' });
  
  console.log('Waiting for TOC...');
  await page.waitForSelector('#card-toc');

  console.log('Taking screenshot of initial TOC state...');
  const tocElement = await page.$('#post-toc-aside');
  if (tocElement) {
    await tocElement.screenshot({ path: 'verification-screenshots/toc-initial.png' });
  } else {
    console.log('#post-toc-aside not found');
  }

  console.log('Scrolling down page...');
  await page.evaluate(() => {
    window.scrollBy(0, 1500);
  });
  
  // Wait for sticky observer and TOC active state to update
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Taking screenshot of scrolled TOC state...');
  if (tocElement) {
    await tocElement.screenshot({ path: 'verification-screenshots/toc-scrolled.png' });
  }
  
  await browser.close();
  console.log('Done!');
})();
