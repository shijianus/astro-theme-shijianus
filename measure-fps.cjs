const { chromium } = require('playwright');

async function measureFPS(mode) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/');
  await page.waitForTimeout(2000);

  await page.evaluate((m) => {
    localStorage.setItem('theme', m);
    document.documentElement.dataset.theme = m;
    window.dispatchEvent(new Event('resize'));
  }, mode);
  
  await page.waitForTimeout(1000);

  // Measure FPS
  const fps = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      let start = performance.now();
      function tick() {
        frames++;
        if (performance.now() - start < 5000) {
          requestAnimationFrame(tick);
        } else {
          resolve(frames / 5);
        }
      }
      requestAnimationFrame(tick);
    });
  });

  console.log(`[${mode} mode] Average FPS: ${fps.toFixed(2)}`);
  await browser.close();
}

(async () => {
  await measureFPS('light');
  await measureFPS('dark');
})();
