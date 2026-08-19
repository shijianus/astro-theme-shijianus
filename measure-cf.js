import puppeteer from 'puppeteer';

(async () => {
  const url = 'https://shijianus-blog.pages.dev/';
  console.log(`Testing CF deployment at ${url}`);
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const response = await page.goto(url, { waitUntil: 'networkidle0' });
  console.log(`Status code: ${response.status()}`);
  
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  // scroll down
  await page.evaluate(() => window.scrollTo(0, 1500));
  await new Promise(r => setTimeout(r, 1000));
  
  await browser.close();
  console.log('CF verification complete.');
})();
