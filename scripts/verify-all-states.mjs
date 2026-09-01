import { chromium } from 'playwright';
import fs from 'fs';

const screenshotDir = './scripts/audit_screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  });
  const page = await context.newPage();

  console.log('1. 打开文章页面...');
  await page.goto('http://localhost:4322/posts/anzhiyu-markdown-showcase/', { waitUntil: 'networkidle' });

  // 1. 版权卡片默认视图
  const copyrightEl = page.locator('.post-copyright').first();
  await copyrightEl.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  console.log('2. 截取版权卡片默认展示...');
  await copyrightEl.screenshot({ path: `${screenshotDir}/01-copyright-card-default.png` });

  // 2. 微信/手机二维码分享弹窗
  console.log('3. 截取二维码分享弹窗...');
  const qrBtn = page.locator('[data-share-platform="wechat"]').first();
  await qrBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${screenshotDir}/02-share-qrcode-modal.png` });

  // 关闭二维码弹窗
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 3. 赞赏支持弹窗（中国大陆区默认）
  console.log('4. 截取赞赏支持弹窗（中国大陆区）...');
  const rewardBtn = page.locator('.post-reward-button').first();
  await rewardBtn.click({ force: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${screenshotDir}/03-reward-modal-cn.png` });

  // 4. 切换到香港区
  console.log('5. 切换到中国香港区并截图...');
  await page.evaluate(() => {
    document.querySelector('#post-tools-panel-reward [data-reward-region-option="hk"]')?.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${screenshotDir}/04-reward-modal-hk.png` });

  // 5. 切换到英国/国际区
  console.log('6. 切换到英国/国际区并截图...');
  await page.evaluate(() => {
    document.querySelector('#post-tools-panel-reward [data-reward-region-option="uk"]')?.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${screenshotDir}/05-reward-modal-uk.png` });

  // 关闭打赏弹窗
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 6. 移动端视图
  console.log('7. 截取移动端视口 (375x812)...');
  await page.setViewportSize({ width: 375, height: 812 });
  await copyrightEl.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await copyrightEl.screenshot({ path: `${screenshotDir}/06-copyright-card-mobile.png` });

  console.log('✓ 全部 6 项视觉场景测试与截图抓取全部成功！');
  await browser.close();
}

run().catch((err) => {
  console.error('测试出错:', err);
  process.exit(1);
});
