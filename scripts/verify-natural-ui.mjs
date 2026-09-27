import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  console.log('Navigating to live production site...');
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle' });

  // Natural UI interaction: Click dock toggle or music pocket button
  const dockBtn = await page.$('#toggle-music-pocket, .shijianus-music-pocket__toggle');
  if (dockBtn) {
    console.log('Clicking dock button...');
    await dockBtn.click();
    await page.waitForTimeout(1000);
  }

  // Switch to queue
  const queueBtn = await page.$('button[data-tab="queue"]');
  if (queueBtn) {
    console.log('Clicking queue tab...');
    await queueBtn.click();
    await page.waitForTimeout(1000);
  }

  // Click track 2
  const triggers = await page.$$('.track-play-trigger');
  if (triggers.length > 1) {
    console.log('Clicking track 2 trigger...');
    await triggers[1].click();
    await page.waitForTimeout(2000);
  }

  // Switch to lyrics
  const lyricsBtn = await page.$('button[data-tab="lyrics"]');
  if (lyricsBtn) {
    console.log('Clicking lyrics tab...');
    await lyricsBtn.click();
    await page.waitForTimeout(1000);
  }

  console.log('Errors caught during natural UI flow:', errors);
  await browser.close();
}

main().catch(console.error);
