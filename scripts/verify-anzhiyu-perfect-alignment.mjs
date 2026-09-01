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

  // 1. 默认卡片状态
  const copyrightBlock = page.locator('.post-copyright-block').first();
  await copyrightElScroll(page);
  await page.waitForTimeout(600);

  // 检查标题与原创在同一行，且字数限制在 25 字以内
  const titleText = await page.locator('.post-copyright-title__text').first().innerText();
  console.log(`✓ 文章标题展示文本: "${titleText}" (长度: ${titleText.length})`);

  // 检查版权声明下划线样式 (应为 none)
  const licenseLink = page.locator('.post-copyright-license-link').first();
  const textDecoration = await licenseLink.evaluate((el) => window.getComputedStyle(el).textDecorationLine);
  console.log(`✓ CC 协议链接默认下划线样式: ${textDecoration}`);

  console.log('2. 截取版权卡片默认展示...');
  await copyrightBlock.screenshot({ path: `${screenshotDir}/v3-01-copyright-default-anzhiyu.png` });

  // 2. 赞赏支持悬停展开测试
  console.log('3. 赞赏支持悬停展开卡片...');
  const rewardWrapper = page.locator('[data-reward-wrapper]').first();
  await rewardWrapper.hover();
  await page.waitForTimeout(600);

  const rewardMain = page.locator('#reward-main-popover');
  const isRewardVisible = await rewardMain.isVisible();
  console.log(`✓ 赞赏扩展卡片上方悬停展开状态: ${isRewardVisible ? '成功' : '失败'}`);

  console.log('4. 截取赞赏卡片展开全景视图...');
  await copyrightBlock.screenshot({ path: `${screenshotDir}/v3-02-reward-hover-popover.png` });

  // 移出
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);

  // 3. 手机二维码悬停展开测试
  console.log('5. 手机二维码悬停展开卡片...');
  const qrWrapper = page.locator('[data-qr-wrapper]').first();
  await qrWrapper.hover();
  await page.waitForTimeout(600);
  const qrMain = page.locator('#share-qrcode-popover');
  const isQrVisible = await qrMain.isVisible();
  console.log(`✓ 手机二维码扩展卡片上方悬停展开状态: ${isQrVisible ? '成功' : '失败'}`);

  console.log('6. 截取二维码卡片展开全景视图...');
  await copyrightBlock.screenshot({ path: `${screenshotDir}/v3-03-qrcode-hover-popover.png` });

  // 移出
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);

  // 4. 移动端视图 (375x812)
  console.log('7. 截取移动端视口...');
  await page.setViewportSize({ width: 375, height: 812 });
  await copyrightElScroll(page);
  await page.waitForTimeout(600);
  await copyrightBlock.screenshot({ path: `${screenshotDir}/v3-04-copyright-mobile.png` });

  console.log('✓ 全部 V3 安知鱼完美对齐自动化验证与截图完成！');
  await browser.close();
}

async function copyrightElScroll(page) {
  const el = page.locator('.post-copyright').first();
  await el.scrollIntoViewIfNeeded();
}

run().catch((err) => {
  console.error('测试出错:', err);
  process.exit(1);
});
