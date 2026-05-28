import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  const url = 'http://localhost:4321/posts/anzhiyu-markdown-showcase/';
  console.log(`Navigating to ${url}...`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (error) {
    console.error('Failed to load page. Is the dev server running?', error);
    await browser.close();
    process.exit(1);
  }

  // 1. Verify TOC is present
  const tocExists = await page.evaluate(() => !!document.getElementById('card-toc'));
  console.log('TOC card exists:', tocExists);

  // 2. Verify Sticky behavior for TOC
  console.log('Scrolling down...');
  await page.evaluate(() => window.scrollBy(0, 2000));
  await new Promise(r => setTimeout(r, 1000));

  const stickyStatus = await page.evaluate(() => {
    const tocCard = document.getElementById('card-toc');
    if (!tocCard) return { error: 'TOC Card not found' };
    
    const rect = tocCard.getBoundingClientRect();
    const stickyState = tocCard.closest('.sticky_layout').dataset.stickyState;
    return {
        top: rect.top,
        stickyState: stickyState
    };
  });
  console.log('TOC Sticky Status after scroll:', stickyStatus);

  await page.screenshot({ path: 'post-sidebar-verify.png', fullPage: true });
  console.log('✅ Screenshot saved: post-sidebar-verify.png');

  await browser.close();
})();
