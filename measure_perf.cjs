const { chromium } = require('playwright');

async function testPage(browser, url) {
  const page = await browser.newPage();
  console.log(`\nTesting ${url} ...`);
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
  } catch(e) {
    console.error(`Could not reach ${url}: `, e.message);
    await page.close();
    return;
  }
  
  // Wait a bit for hydrated things
  await page.waitForTimeout(1000);

  // Inject script to measure FPS during scroll
  const metrics = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      let startTime = performance.now();
      let lastFrameTime = startTime;
      const frameTimes = [];
      
      const countFrames = (now) => {
        frames++;
        const delta = now - lastFrameTime;
        frameTimes.push(delta);
        lastFrameTime = now;
        if (performance.now() - startTime < 3000) {
          requestAnimationFrame(countFrames);
        } else {
          resolve({ frames, frameTimes, duration: performance.now() - startTime });
        }
      };
      
      requestAnimationFrame(countFrames);
      
      // simulate scroll
      let scrollY = 0;
      const scrollInterval = setInterval(() => {
        scrollY += 100;
        window.scrollTo(0, scrollY);
      }, 16);
      
      setTimeout(() => clearInterval(scrollInterval), 3000);
    });
  });

  const fps = Math.round((metrics.frames / metrics.duration) * 1000);
  
  // check long frames (> 16.6ms)
  const longFrames = metrics.frameTimes.filter(t => t > 18);
  const veryLongFrames = metrics.frameTimes.filter(t => t > 50);

  console.log(`Average FPS during 3s scroll: ${fps}`);
  console.log(`Dropped Frames (>18ms): ${longFrames.length} out of ${metrics.frames}`);
  console.log(`Jank Frames (>50ms): ${veryLongFrames.length} out of ${metrics.frames}`);
  
  await page.close();
}

(async () => {
  const browser = await chromium.launch();
  await testPage(browser, 'http://localhost:4321/');
  await testPage(browser, 'http://localhost:4321/posts/anzhiyu-markdown-showcase');
  await browser.close();
})();
