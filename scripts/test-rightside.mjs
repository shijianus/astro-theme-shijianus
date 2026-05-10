import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  const url = 'http://localhost:4321/posts/hello-world/';
  console.log(`Navigating to ${url}...`);

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (error) {
    console.error('Failed to load page', error);
    await browser.close();
    process.exit(1);
  }

  const rightside = await page.$('#rightside');
  if (rightside) {
    console.log('✅ #rightside is present on Post page.');
    const box = await rightside.boundingBox();
    console.log(`#rightside box before hover: ${JSON.stringify(box)}`);
  }

  await page.hover('#rightside');
  await new Promise(r => setTimeout(r, 400));
  const boxAfterHover = await rightside.boundingBox();
  console.log(`#rightside box after hover: ${JSON.stringify(boxAfterHover)}`);

  await page.click('#rightside-config');
  await new Promise(r => setTimeout(r, 400));

  const configHide = await page.$('#rightside-config-hide');
  if (configHide) {
    const hideClass = await page.evaluate(el => el.className, configHide);
    console.log(`#rightside-config-hide class after click: ${hideClass}`);
  }

  const tocBtn = await page.$('#rightside-config-hide #mobile-toc-button');
  if (tocBtn) console.log('✅ TOC button is present inside config-hide on post page.');
  else console.error('❌ TOC button is missing on post page.');

  const commentBtn = await page.$('#rightside-config-hide #to_comment');
  if (commentBtn) console.log('✅ Comment button is present inside config-hide on post page.');
  else console.error('❌ Comment button is missing on post page.');

  const bgBtn = await page.$('#rightside-config-hide #background-mode');
  if (bgBtn) {
    console.log('✅ Background toggle button (Gemini icon) is present.');
  }

  const asideBtn = await page.$('#rightside-config-hide #hide-aside-btn svg');
  if (asideBtn) console.log('✅ Aside toggle button with SVG icons is present.');

  const homeUrl = 'http://localhost:4321/';
  console.log(`\nNavigating to ${homeUrl}...`);
  await page.goto(homeUrl, { waitUntil: 'networkidle0', timeout: 30000 });
  
  const tocBtnHome = await page.$('#rightside-config-hide #mobile-toc-button');
  if (!tocBtnHome) console.log('✅ TOC button correctly missing from home page.');
  else console.error('❌ TOC button should not be on home page.');

  const commentBtnHome = await page.$('#rightside-config-hide #to_comment');
  if (!commentBtnHome) console.log('✅ Comment button correctly missing from home page.');
  else console.error('❌ Comment button should not be on home page.');

  await browser.close();
})();