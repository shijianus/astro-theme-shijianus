import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const flipWrapper = page.locator('#flip-wrapper');
  await flipWrapper.scrollIntoViewIfNeeded();

  // 1. 截取正面
  await flipWrapper.screenshot({ path: 'scratch/local_fresh_front_card.png' });
  console.log('Saved scratch/local_fresh_front_card.png');

  // 2. 悬停触发翻转并等待 0.85s 从容丝滑动画完成
  await flipWrapper.hover();
  await page.waitForTimeout(950);
  await flipWrapper.screenshot({ path: 'scratch/local_fresh_back_card.png' });
  console.log('Saved scratch/local_fresh_back_card.png');

  await browser.close();
})();
