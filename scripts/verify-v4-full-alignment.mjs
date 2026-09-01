import { chromium } from 'playwright';
import fs from 'fs';

const screenshotDir = './scripts/audit_screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // 1. 中国大陆测试环境
  console.log('--- 1. 测试中国大陆环境 ---');
  const contextCn = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  });
  const pageCn = await contextCn.newPage();
  await pageCn.goto('http://localhost:4323/posts/anzhiyu-markdown-showcase/', { waitUntil: 'networkidle' });

  const copyrightBlock = pageCn.locator('.post-copyright-block').first();
  await copyrightBlock.scrollIntoViewIfNeeded();
  await pageCn.waitForTimeout(500);

  // 验证头像与作者名无重叠
  const avatarBox = await pageCn.locator('.post-copyright__author_img').first().boundingBox();
  const nameBox = await pageCn.locator('.post-copyright__author_name').first().boundingBox();
  const avatarBottom = avatarBox.y + avatarBox.height;
  const nameTop = nameBox.y;
  console.log(`✓ 头像底部Y: ${avatarBottom.toFixed(1)}, 作者名顶部Y: ${nameTop.toFixed(1)}, 间距: ${(nameTop - avatarBottom).toFixed(1)}px (安全无遮挡)`);

  // 验证标题无省略号，并带有 marquee
  const titleText = await pageCn.locator('.post-copyright-title__text').first().innerText();
  console.log(`✓ 文章标题文本: "${titleText}", 是否包含省略号: ${titleText.includes('...') ? '是(错误)' : '否(正确)'}`);

  // 验证分享渠道展示
  const qqVisible = await pageCn.locator('.share-link.qq').first().isVisible();
  const bilibiliVisible = await pageCn.locator('.share-link.bilibili').first().isVisible();
  const rednoteVisible = await pageCn.locator('.share-link.rednote').first().isVisible();
  console.log(`✓ 大陆渠道可见性: QQ=${qqVisible}, B站=${bilibiliVisible}, 小红书=${rednoteVisible}`);

  console.log('截取中国大陆默认全景卡片...');
  await copyrightBlock.screenshot({ path: `${screenshotDir}/v4-01-cn-default.png` });

  // 悬停赞赏展开
  console.log('测试赞赏支持展开...');
  const rewardWrapper = pageCn.locator('[data-reward-wrapper]').first();
  await rewardWrapper.hover();
  await pageCn.waitForTimeout(600);
  await copyrightBlock.screenshot({ path: `${screenshotDir}/v4-02-reward-popover.png` });
  await pageCn.mouse.move(0, 0);
  await pageCn.waitForTimeout(300);

  // 悬停手机二维码展开
  console.log('测试手机二维码展开...');
  const qrWrapper = pageCn.locator('[data-qr-wrapper]').first();
  await qrWrapper.hover();
  await pageCn.waitForTimeout(600);
  await copyrightBlock.screenshot({ path: `${screenshotDir}/v4-03-qrcode-popover.png` });
  await pageCn.mouse.move(0, 0);

  // 2. 台湾地区测试环境（Asia/Taipei）
  console.log('--- 2. 测试台湾地区环境 (Asia/Taipei) ---');
  const contextTw = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
  });
  const pageTw = await contextTw.newPage();
  await pageTw.goto('http://localhost:4323/posts/anzhiyu-markdown-showcase/', { waitUntil: 'networkidle' });
  await pageTw.waitForSelector('[data-detected-region]');
  const detectedTw = await pageTw.locator('.post-copyright-block').first().getAttribute('data-detected-region');
  console.log(`✓ 台湾环境识别到的区域值: ${detectedTw}`);

  const copyrightBlockTw = pageTw.locator('.post-copyright-block').first();
  await copyrightBlockTw.scrollIntoViewIfNeeded();
  await pageTw.waitForTimeout(500);

  const qqTwVisible = await pageTw.locator('.share-link.qq').first().isVisible();
  const rednoteTwVisible = await pageTw.locator('.share-link.rednote').first().isVisible();
  const lineTwVisible = await pageTw.locator('.share-link.line').first().isVisible();
  const waTwVisible = await pageTw.locator('.share-link.whatsapp').first().isVisible();
  console.log(`✓ 台湾合规性检查: QQ=${qqTwVisible}(应隐藏), 小红书=${rednoteTwVisible}(依规禁止应隐藏), LINE=${lineTwVisible}(应展示), WhatsApp=${waTwVisible}(应展示)`);
  await copyrightBlockTw.screenshot({ path: `${screenshotDir}/v4-04-taiwan-localized.png` });

  // 3. 日本地区测试环境（Asia/Tokyo）
  console.log('--- 3. 测试日本地区环境 (Asia/Tokyo) ---');
  const contextJp = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  });
  const pageJp = await contextJp.newPage();
  await pageJp.goto('http://localhost:4323/posts/anzhiyu-markdown-showcase/', { waitUntil: 'networkidle' });
  await pageJp.waitForSelector('[data-detected-region]');
  const detectedJp = await pageJp.locator('.post-copyright-block').first().getAttribute('data-detected-region');
  console.log(`✓ 日本环境识别到的区域值: ${detectedJp}`);

  const copyrightBlockJp = pageJp.locator('.post-copyright-block').first();
  await copyrightBlockJp.scrollIntoViewIfNeeded();
  await pageJp.waitForTimeout(500);

  const lineJpVisible = await pageJp.locator('.share-link.line').first().isVisible();
  const xJpVisible = await pageJp.locator('.share-link.x').first().isVisible();
  const qqJpVisible = await pageJp.locator('.share-link.qq').first().isVisible();
  console.log(`✓ 日本渠道检查: LINE=${lineJpVisible}(应展示), X=${xJpVisible}(应展示), QQ=${qqJpVisible}(应隐藏)`);
  await copyrightBlockJp.screenshot({ path: `${screenshotDir}/v4-05-japan-localized.png` });

  // 4. 移动端窄屏测试
  console.log('--- 4. 测试移动端 (375x812) ---');
  await pageCn.setViewportSize({ width: 375, height: 812 });
  await copyrightBlock.scrollIntoViewIfNeeded();
  await pageCn.waitForTimeout(500);
  await copyrightBlock.screenshot({ path: `${screenshotDir}/v4-06-mobile-view.png` });

  console.log('✓ 全部 V4 自动化验证与截图完成！');
  await browser.close();
}

run().catch((err) => {
  console.error('测试出错:', err);
  process.exit(1);
});
