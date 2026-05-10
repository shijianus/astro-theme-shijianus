import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Wait for the local dev server or preview server to be up
  // Assuming running on http://localhost:4321
  const url = 'http://localhost:4321';
  console.log(`Navigating to ${url}...`);

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (error) {
    console.error('Failed to load page. Is the dev server running?', error);
    await browser.close();
    process.exit(1);
  }

  // 1. Verify random-banner and categoryGroup layout
  console.log('Verifying Top Banner Layout...');
  const bannerGroup = await page.$('#bannerGroup');
  const randomBanner = await page.$('#random-banner');
  const categoryGroup = await page.$('.categoryGroup');
  
  if (bannerGroup && randomBanner && categoryGroup) {
    const bannerBox = await randomBanner.boundingBox();
    const categoryBox = await categoryGroup.boundingBox();
    
    if (bannerBox && categoryBox) {
      if (bannerBox.y < categoryBox.y) {
        console.log('✅ random-banner is above categoryGroup (top-bottom structure maintained).');
      } else {
        console.error('❌ Layout error: random-banner is not above categoryGroup.');
      }
    }
  } else {
    console.error('❌ Could not find banner elements.');
  }

  // 2. Verify Telegram Card Flip
  console.log('Verifying Telegram Flip Card...');
  const tgCard = await page.$('.card-telegram');
  const tgFlip = await page.$('#flip-content');
  if (tgCard && tgFlip) {
    console.log('✅ Telegram flip card is present.');
  } else {
    console.error('❌ Telegram flip card is missing or incorrect structure.');
  }

  // 3. Verify Music Pocket
  console.log('Verifying Music Player...');
  const musicPocket = await page.$('#nav-music');
  if (musicPocket) {
    const box = await musicPocket.boundingBox();
    if (box && box.x < 100) {
      console.log('✅ Music player is positioned on the left.');
    } else {
      console.error('❌ Music player is NOT on the left or box missing.');
    }
  } else {
    console.error('❌ Music player is missing.');
  }

  // 4. Verify AI Summary 
  console.log('Verifying AI Summary...');
  const aiSummary = await page.$('.shijianus-ai-summary');
  if (aiSummary) {
    console.log('✅ AI Summary panel is present.');
  } else {
    console.error('❌ AI Summary panel is missing.');
  }

  await browser.close();
})();
