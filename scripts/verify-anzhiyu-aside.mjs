import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const url = 'http://localhost:4322/archives/'; // Use archives page to see sidebar
  console.log(`Navigating to ${url}...`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (error) {
    console.error('Failed to load page. Is the dev server running?', error);
    await browser.close();
    process.exit(1);
  }

  // Verify Gradient Card
  console.log('Verifying Gradient Card Presence...');
  const gradientCard = await page.$('.anzhiyu-gradient-card');
  if (gradientCard) {
    console.log('✅ Gradient card (card-webinfo) is present.');
    const bgColor = await page.evaluate(el => window.getComputedStyle(el, '::before').backgroundImage, gradientCard);
    console.log(`Gradient background: ${bgColor}`);
    if (bgColor.includes('gradient')) {
      console.log('✅ Gradient style is applied to ::before.');
    } else {
      console.warn('⚠️ Gradient style might not be applied to ::before.');
    }
  } else {
    console.error('❌ Gradient card (card-webinfo) is missing.');
  }

  // Verify Stats Data
  console.log('Verifying Stats Data...');
  const statsValues = await page.$$eval('.highlight-item-value', els => els.map(el => el.textContent.trim()));
  console.log(`Stats values found: ${statsValues.join(', ')}`);
  if (statsValues.length >= 3) {
    console.log('✅ Found at least 3 stats (Runtime, Posts, Categories).');
    if (statsValues.every(v => v !== '')) {
      console.log('✅ All stats have non-empty values (Data driven check).');
    }
  } else {
    console.error('❌ Stats data missing or incomplete.');
  }

  // Verify Sticky Behavior
  console.log('Verifying Sticky Behavior...');
  const stickyLayout = await page.$('.sticky_layout');
  if (stickyLayout) {
    console.log('✅ Sticky layout container present.');
    
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 500));

    const position = await page.evaluate(el => window.getComputedStyle(el).position, stickyLayout);
    console.log(`Sticky layout position: ${position}`);
    if (position === 'sticky') {
      console.log('✅ Position is sticky.');
    } else {
      console.error('❌ Position is NOT sticky.');
    }
  } else {
    console.error('❌ Sticky layout container missing.');
  }

  await browser.close();
})();
