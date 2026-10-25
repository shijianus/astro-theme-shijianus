import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Abort heavy media files that block browser dom/network settlement
  await page.route('**/*.mp4', route => route.abort());
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const url = 'https://blog.epocanvas.com/?v=' + Date.now();
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#card-telegram', { timeout: 15000 });
  await page.waitForTimeout(2000);

  const cardTelegram = page.locator('#card-telegram');
  await cardTelegram.scrollIntoViewIfNeeded();

  // 1. 截取生产端正面初始帧 (验证 极度醒目 3D Telegram 纸飞机 + 纯净旋转星轨，0 杂星噪点)
  await cardTelegram.screenshot({ path: 'scratch/live_production_front_t0.png' });
  console.log('Saved scratch/live_production_front_t0.png');

  // 2. 等待 2.0 秒后截取第二帧 (验证天文星轨顺滑天体旋转视差)
  await page.waitForTimeout(2000);
  await cardTelegram.screenshot({ path: 'scratch/live_production_front_t15.png' });
  console.log('Saved scratch/live_production_front_t15.png');

  // 3. 悬停触发 3D 翻转并等待 1.2s 稳定
  await cardTelegram.hover();
  await page.waitForTimeout(1200);
  await cardTelegram.screenshot({ path: 'scratch/live_production_back.png' });
  console.log('Saved scratch/live_production_back.png');

  // 4. 页面全景截图
  await page.screenshot({ path: 'scratch/live_production_fullpage.png' });
  console.log('Saved scratch/live_production_fullpage.png');

  console.log('Console Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Console Errors:', consoleErrors);
  }

  await browser.close();
  console.log('Live production verification finished successfully.');
})();
