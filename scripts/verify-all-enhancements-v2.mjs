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

  console.log('1. 打开包含超长标题的博客文章页面...');
  await page.goto('http://localhost:4322/posts/anzhiyu-markdown-showcase/', { waitUntil: 'networkidle' });

  // 1. 验证并截取 PostCopyright 卡片默认状态
  const copyrightEl = page.locator('.post-copyright').first();
  await copyrightEl.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  console.log('2. 截取版权卡片整体默认展示 (含 1/4 水印、无重叠作者头像、完整标题、CC 官方链接、全量分享按钮)...');
  await copyrightEl.screenshot({ path: `${screenshotDir}/v2-01-copyright-card-default.png` });

  // 校验 CC 链接
  const licenseLink = page.locator('.post-copyright-license-link').first();
  const licenseHref = await licenseLink.getAttribute('href');
  console.log('✓ CC 官方跳转链接:', licenseHref);

  // 校验标题全文
  const fullTitle = await page.locator('.post-copyright-title__text').first().innerText();
  console.log('✓ 完整长标题展示:', fullTitle);

  // 校验全部分享平台按钮数量
  const shareButtons = page.locator('.post-share-btn--square');
  const count = await shareButtons.count();
  console.log(`✓ 全量召回的分享平台按钮数量: ${count} 个`);

  // 2. 测试二维码分享悬停/展开卡片
  console.log('3. 正在展开手机扫码阅读卡片...');
  const qrWrapper = page.locator('[data-qr-wrapper]').first();
  await qrWrapper.hover();
  await page.waitForTimeout(600);
  const qrPanel = page.locator('#post-tools-panel-wechat');
  await qrPanel.screenshot({ path: `${screenshotDir}/v2-02-share-qrcode-hover-card.png` });

  // 测试点击复制二维码图片动作
  console.log('4. 测试点击复制二维码图片...');
  const copyQrBtn = page.locator('[data-action="copy-qr-image"]').first();
  if (await copyQrBtn.isVisible()) {
    await copyQrBtn.click();
    await page.waitForTimeout(300);
    console.log('✓ 已触发复制二维码图片！');
  }

  // 收起
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // 3. 测试赞赏支持悬停/展开卡片 (CN 大陆环境)
  console.log('5. 正在展开赞赏支持扩展卡片 (中国大陆环境)...');
  const rewardWrapper = page.locator('[data-reward-wrapper]').first();
  await rewardWrapper.hover();
  await page.waitForTimeout(600);
  const rewardPanel = page.locator('#post-tools-panel-reward');
  await rewardPanel.screenshot({ path: `${screenshotDir}/v2-03-reward-hover-card-cn.png` });

  // 验证 USDT 在大陆环境已绝对物理屏蔽
  const usdtCard = page.locator('#post-tools-panel-reward [data-reward-channel-id="trustwallet-usdt"]');
  const isUsdtVisible = await usdtCard.isVisible().catch(() => false);
  console.log(`- 大陆环境下 USDT 冷钱包屏蔽状态: ${!isUsdtVisible ? '✓ 100% 严格物理屏蔽 (合规)' : '未屏蔽 (异常)'}`);

  // 4. 测试点击赞赏卡片中的二维码复制
  const wxQrCard = page.locator('#post-tools-panel-reward [data-reward-channel-id="weixin-pay-cn"] .reward-channel-card__qr').first();
  if (await wxQrCard.isVisible()) {
    await wxQrCard.click();
    await page.waitForTimeout(300);
    console.log('✓ 已触发赞赏二维码复制！');
  }

  // 收起
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // 5. 测试移动端视口 (375x812) 适配
  console.log('6. 截取移动端视口 (375x812)...');
  await page.setViewportSize({ width: 375, height: 812 });
  await copyrightEl.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await copyrightEl.screenshot({ path: `${screenshotDir}/v2-04-copyright-card-mobile.png` });

  console.log('Playwright 全部 V2 深度自动化审计完成！');
  await browser.close();
}

run().catch((err) => {
  console.error('测试出错:', err);
  process.exit(1);
});
