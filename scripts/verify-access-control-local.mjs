import { chromium } from 'playwright';

async function testAccessControl() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to local http://127.0.0.1:4321/posts/access-control-lab/ ...');
  await page.goto('http://127.0.0.1:4321/posts/access-control-lab/', { waitUntil: 'domcontentloaded' });
  
  const isPanel = await page.$('.content-access-panel--server');
  console.log('Access panel present initially:', Boolean(isPanel));
  
  const initialVariants = await page.$$('.article-translation-variant');
  console.log('Initial variants count (should be 0):', initialVariants.length);
  
  // Submit password 12345
  await page.fill('input[name="post-password"]', '12345');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.click('.content-access-panel__form button[type="submit"]')
  ]);
  
  await page.waitForTimeout(600);
  
  const unlockedVariants = await page.$$eval('.article-translation-variant', (els) => els.map((el) => ({
    lang: el.getAttribute('data-lang'),
    visible: window.getComputedStyle(el).display !== 'none',
    len: el.innerText.trim().length,
  })));
  
  console.log('Unlocked variants count:', unlockedVariants.length);
  console.log('Unlocked variants details:', unlockedVariants);
  
  const buttons = await page.$$eval('.post-hero__lang-tag', (els) => els.map((el) => el.getAttribute('data-target-lang')));
  console.log('Unlocked lang buttons:', buttons);
  
  await browser.close();
}

testAccessControl().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
