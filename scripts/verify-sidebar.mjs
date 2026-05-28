import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  
  async function verifyPage(url, pageName) {
    console.log(`\n--- Verifying ${pageName}: ${url} ---`);
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    } catch (error) {
      console.error(`Failed to load ${pageName}.`, error);
      return;
    }

    // Verify Sidebar Widgets
    const tagsWidget = await page.$('.card-widget.card-tags');
    if (tagsWidget) {
      console.log('✅ card-tags is present.');
    }
    const archivesWidget = await page.$('.card-widget.card-archives');
    if (archivesWidget) {
      console.log('✅ card-archives is present.');
    }
    const webinfoWidget = await page.$('.card-widget.card-webinfo');
    if (webinfoWidget) {
      console.log('✅ card-webinfo is present.');
      const items = await page.$$eval('.card-webinfo .webinfo-item .item-count', els => els.map(el => el.textContent.trim()));
      console.log(`   Webinfo values: ${items.join(' | ')}`);
    }

    // Verify Sticky behavior
    const stickySelector = pageName === 'Home Page' ? '.sticky_layout--utility' : '.sticky_layout--recent';
    const stickyLayout = await page.$(stickySelector);
    if (stickyLayout) {
      const posValue = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        const style = window.getComputedStyle(el);
        return style.position;
      }, stickySelector);
      console.log(`   ${stickySelector} position: ${posValue}`);
    } else {
      console.log(`❌ ${stickySelector} is missing.`);
    }
  }

  await verifyPage('http://localhost:4321', 'Home Page');
  await verifyPage('http://localhost:4321/posts/hello-world/', 'Post Page');

  await browser.close();
  console.log('\nVerification completed.');
})();
