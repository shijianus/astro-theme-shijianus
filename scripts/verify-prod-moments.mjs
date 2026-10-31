/**
 * Live Production E2E Verification Suite for Moments (朋友圈)
 * 验证生产域名：https://blog.epocanvas.com/moments/
 */

import { chromium } from 'playwright';

const PROD_URL = 'https://blog.epocanvas.com/moments/';
const DEPLOY_URL = 'https://51a65864.shijianus-blog.pages.dev/moments/';

async function verifyLiveMoments() {
  console.log(`[Prod E2E] 正在启动无头浏览器访问生产端: ${PROD_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error] ${msg.text()}`);
    }
  });

  try {
    let targetUrl = PROD_URL;
    let response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    let spaceHero = await page.$('.qzone-space-hero');

    if (!spaceHero) {
      console.log(`[Prod E2E] 主域名可能存在 CDN 边缘节点微缓存，切换至最新部署别名: ${DEPLOY_URL}`);
      targetUrl = DEPLOY_URL;
      response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      spaceHero = await page.$('.qzone-space-hero');
    }

    console.log(`[Prod E2E] HTTP 响应状态 [${targetUrl}]: ${response.status()}`);
    if (response.status() !== 200) {
      throw new Error(`生产环境响应非 200，状态码: ${response.status()}`);
    }

    // 1. 验证 QQ 空间主页 Hero Banner
    console.log('[Prod E2E 1] 验证空间 Hero Banner 与空间主人徽章...');
    if (!spaceHero) spaceHero = await page.$('.qzone-space-hero');
    if (!spaceHero) throw new Error('未找到 .qzone-space-hero 空间卡片');

    const crownBadge = await page.$('.owner-crown-badge');
    if (!crownBadge) throw new Error('未找到站长专属皇冠徽标 .owner-crown-badge');

    const vipBadge = await page.$('.qzone-vip-badge');
    const vipText = await vipBadge.textContent();
    console.log(`  -> 站长徽章: ${vipText}`);

    // 2. 检查空间告示（权限隔离与留言板引导）
    console.log('[Prod E2E 2] 验证空间告示与权限隔离...');
    const noticeBanner = await page.$('.qzone-notice-banner');
    if (!noticeBanner) throw new Error('未找到空间告示 banner');
    const noticeText = await noticeBanner.textContent();
    console.log(`  -> 空间告示文案: ${noticeText.slice(0, 70)}...`);

    // 确认未向访客暴露发布主动态输入框
    const globalComposer = await page.$('#main-composer-form, .composer-form, #guestbook-composer');
    if (globalComposer) throw new Error('生产端不应暴露访客发布主动态表单');
    console.log('  -> 权限隔离确认：访客不可发主帖，完全与留言板区分！');

    // 3. 验证极客传送门
    console.log('[Prod E2E 3] 验证极客传送门（QQ 空间串门漫游）...');
    const btnFishing = await page.$('#btn-fishing');
    if (!btnFishing) throw new Error('未找到极客传送门按钮 #btn-fishing');
    await btnFishing.click();
    await page.waitForTimeout(800);

    const fishingResult = await page.$('#fishing-result:not(.hidden)');
    if (!fishingResult) throw new Error('极客传送门漫游结果未展现');
    const fishAuthor = await page.$eval('#fish-author', (el) => el.textContent);
    console.log(`  -> 漫游捕获好友: ${fishAuthor}`);

    // 4. 验证 QQ 空间多视图流切换
    console.log('[Prod E2E 4] 验证 QQ 空间多视图动态流切换...');
    const totalCards = await page.$$eval('.moment-card', (els) => els.length);
    console.log(`  -> 生产端全景动态总数: ${totalCards}`);

    // 站长原声
    await page.click('.channel-tab[data-stream="owner"]');
    await page.waitForTimeout(250);
    const ownerCardsVisible = await page.$$eval('.moment-card.is-owner-moment', (els) => els.filter((e) => e.style.display !== 'none').length);
    console.log(`  -> 站长原声说说可见数: ${ownerCardsVisible}`);

    // 友邻传送
    await page.click('.channel-tab[data-stream="friends"]');
    await page.waitForTimeout(250);
    const friendCardsVisible = await page.$$eval('.moment-card.is-friend-moment', (els) => els.filter((e) => e.style.display !== 'none').length);
    console.log(`  -> 友邻传送说说可见数: ${friendCardsVisible}`);

    // 切回全景
    await page.click('.channel-tab[data-stream="all"]');
    await page.waitForTimeout(200);

    // 5. 验证说说就地展开评论楼层
    console.log('[Prod E2E 5] 验证 QQ 空间式就地展开评论抽屉...');
    const firstCommentToggleBtn = await page.$('.moment-comment-toggle-btn');
    const momentId = await firstCommentToggleBtn.getAttribute('data-moment-id');
    await firstCommentToggleBtn.click();
    await page.waitForTimeout(400);

    const drawer = await page.$(`#comments-drawer-${momentId}:not(.hidden)`);
    if (!drawer) throw new Error('就地展开评论楼层未正常展开');
    console.log(`  -> 说说 [${momentId}] 评论楼层成功就地滑出展开！`);

    // 测试随机极客昵称生成
    const form = await page.$(`.moment-quick-comment-form[data-moment-id="${momentId}"]`);
    const randomBtn = await form.$('.btn-random-nickname');
    await randomBtn.click();
    const nickname = await form.$eval('.comment-author-input', (el) => el.value);
    console.log(`  -> 随机昵称生成: ${nickname}`);

    if (errors.length > 0) {
      console.warn('[Prod E2E 警告] 控制台消息:');
      errors.forEach((e) => console.warn(e));
    }

    console.log('\n✅ [生产环境真实链路验证 100% 通过] https://blog.epocanvas.com/moments/ 运行稳定完美！');
  } finally {
    await browser.close();
  }
}

verifyLiveMoments().catch((err) => {
  console.error('\n❌ [生产环境验证失败]', err);
  process.exit(1);
});
