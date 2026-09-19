import { chromium } from 'playwright';

async function main() {
  console.log('🌐 Testing live production site https://blog.epocanvas.com ...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  try {
    const res = await page.goto('https://blog.epocanvas.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    console.log(`📡 Response status: ${res.status()}`);
    await page.waitForTimeout(3000);

    const musicPocket = await page.$('.shijianus-music-pocket');
    console.log(`🎵 .shijianus-music-pocket in DOM: ${Boolean(musicPocket)}`);

    const toggleBtn = await page.$('.shijianus-music-pocket__toggle');
    console.log(`🔘 Toggle button present: ${Boolean(toggleBtn)}`);

    if (toggleBtn) {
      const disc = await page.$('.shijianus-music-pocket__toggle-disc');
      const tonearm = await page.$('.shijianus-music-pocket__tonearm');
      console.log(`💿 Vinyl disc: ${Boolean(disc)}, Tonearm: ${Boolean(tonearm)}`);

      // Open panel
      await toggleBtn.click();
      await page.waitForTimeout(1000);

      const panel = await page.$('.shijianus-music-pocket__panel');
      console.log(`📦 Player panel opened: ${Boolean(panel)}`);

      if (panel) {
        const tabs = await page.$$('.shijianus-music-pocket__tab');
        console.log(`📑 Player tabs count: ${tabs.length}`);
      }
    }

    console.log(`⚠️ Console errors count: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.log('Live audit message:', e.message);
});
