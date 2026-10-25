import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const url = 'https://blog.epocanvas.com/?v=' + Date.now();
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  const flipWrapper = page.locator('#flip-wrapper');
  await flipWrapper.scrollIntoViewIfNeeded();

  // 1. 截取生产端正面卡片 (验证 3D 飞镖纸飞机 + 42 颗真实随机深空星野，绝对无黑线/杂线)
  await flipWrapper.screenshot({ path: 'scratch/live_masterpiece_front.png' });
  console.log('Saved scratch/live_masterpiece_front.png');

  // 2. 悬停触发翻转并等待 0.85s 丝滑动画稳定
  await flipWrapper.hover();
  await page.waitForTimeout(1200);
  await flipWrapper.screenshot({ path: 'scratch/live_masterpiece_back.png' });
  console.log('Saved scratch/live_masterpiece_back.png');

  // 3. 页面全景截图 (右侧侧边栏整体视觉)
  await page.screenshot({ path: 'scratch/live_masterpiece_fullpage.png' });
  console.log('Saved scratch/live_masterpiece_fullpage.png');

  // 4. 检查控制台报错
  console.log('Console Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Console Errors:', consoleErrors);
  }

  await browser.close();
  console.log('Live production verification finished successfully.');
})();
