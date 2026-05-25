import puppeteer from 'puppeteer';

(async () => {
  const url = process.argv[2] || 'http://localhost:4321';
  const filename = process.argv[3] || 'screenshot.png';

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log(`Navigating to ${url}...`);

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({ path: filename, fullPage: false });
    console.log(`✅ Screenshot saved to ${filename}`);
  } catch (error) {
    console.error('Failed to load page or take screenshot:', error);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
})();
