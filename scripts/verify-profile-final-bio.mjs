import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  const url = 'http://localhost:4321';
  console.log(`Navigating to ${url}...`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (error) {
    console.error('Failed to load page.', error);
    await browser.close();
    process.exit(1);
  }

  console.log('Verifying Final Bio Polish...');
  
  await page.waitForSelector('.profile-card');
  await page.hover('.profile-card');
  await new Promise(r => setTimeout(r, 500));

  const boundsData = await page.evaluate(() => {
    const desc = document.querySelector('.author-info__description');
    const bottomGroup = document.querySelector('.author-info__bottom-group');
    const pTags = document.querySelectorAll('.author-info__description-text p');
    
    if (!desc || !bottomGroup) return { error: 'Elements not found' };

    const descRect = desc.getBoundingClientRect();
    const bgRect = bottomGroup.getBoundingClientRect();

    return {
      descBottom: descRect.bottom,
      bgTop: bgRect.top,
      gap: bgRect.top - descRect.bottom,
      paragraphs: pTags.length
    };
  });

  console.log(`Bounds Data: ${JSON.stringify(boundsData)}`);

  if (boundsData.error) {
    console.error('❌ Could not evaluate bounds!');
  } else if (boundsData.gap <= 0) {
    console.error(`❌ CRITICAL OVERLAP! Gap is ${boundsData.gap}px.`);
  } else {
    console.log(`✅ Safe! Description ends ${boundsData.gap}px above the bottom group.`);
  }

  if (boundsData.paragraphs === 2) {
     console.log(`✅ Bio has strictly 2 paragraphs.`);
  } else {
     console.warn(`⚠️ Bio has ${boundsData.paragraphs} paragraphs.`);
  }

  const profileCard = await page.$('.profile-card');
  await profileCard.screenshot({ path: 'profile-final-bio-check.png' });

  await browser.close();
  console.log('Verification complete.');
})();
