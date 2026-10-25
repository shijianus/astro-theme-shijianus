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
  await page.waitForTimeout(2000);

  const flipWrapper = page.locator('#flip-wrapper');
  await flipWrapper.scrollIntoViewIfNeeded();

  // 1. 截取生产端正面卡片第一帧 (验证官方标准 3D Telegram 纸飞机 + 纯净星轨，无突兀流星)
  await flipWrapper.screenshot({ path: 'scratch/live_pure_star_front_1.png' });
  console.log('Saved scratch/live_pure_star_front_1.png');

  // 2. 等待动画推进 1.5 秒后截取第二帧 (验证同心星流流动、十字星芒多相呼吸与飞机微浮动)
  await page.waitForTimeout(1500);
  await flipWrapper.screenshot({ path: 'scratch/live_pure_star_front_2.png' });
  console.log('Saved scratch/live_pure_star_front_2.png');

  // 3. 悬停触发翻转并等待 0.85s 从容动画稳定
  await flipWrapper.hover();
  await page.waitForTimeout(1000);
  await flipWrapper.screenshot({ path: 'scratch/live_pure_star_back.png' });
  console.log('Saved scratch/live_pure_star_back.png');

  // 4. 页面全景截图
  await page.screenshot({ path: 'scratch/live_pure_star_page.png' });
  console.log('Saved scratch/live_pure_star_page.png');

  // 5. 检查控制台报错
  console.log('Console Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Console Errors:', consoleErrors);
  }

  await browser.close();
  console.log('Live pure star verification finished successfully.');
})();
