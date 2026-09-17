import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/');
  console.log('Title:', await page.title());
  const toggle = await page.$('.today-card-toggle');
  console.log('Has today-card-toggle:', !!toggle);
  const label = await page.$('label[for="today-card-toggle"]');
  console.log('Has label:', !!label);
  const tg = await page.$('.topGroup');
  console.log('Has topGroup:', !!tg);
  const cards = await page.$$('.topGroup .recent-post-item');
  console.log('Cards count:', cards.length);
  await browser.close();
}

run().catch(console.error);
