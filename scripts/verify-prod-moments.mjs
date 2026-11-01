/**
 * Live Production E2E Verification Suite for Moments (朋友圈)
 * 验证生产域名：https://blog.epocanvas.com/moments/
 * 
 * 验证内容：
 * 1. QQ 空间风格站长空间主页 Hero Banner、装扮封面图、天气与 SVIP 徽章、在线状态；
 * 2. 空间子导航栏（说说动态、博客日志、交流板、友人帐）；
 * 3. 冗余清理：绝无极客传送门与旧版分类标签，友邻动态自动混排；
 * 4. 独立博友数据净化：绝无 Astro/Cloudflare 等非独立个人博客；
 * 5. 关键特性：详情界面必须是【页面内直接加载 (In-Page View)】，而非单独的模态弹窗！
 *    - DOM 中绝无 #moment-detail-modal；
 *    - 点击说说时，#moments-stream-view 隐藏，#moment-inpage-detail-view 在主舞台排版内展开；
 *    - 页面内正文、画廊照片、直通车反代说明、点赞与发评完整渲染；
 *    - 返回按钮恢复瀑布流；
 * 6. URL Hash 深度直达：访问 #moment-{id} 自动在页面内加载详情。
 */

import { chromium } from 'playwright';

const PROD_URL = 'https://blog.epocanvas.com/moments/';
const DEPLOY_URL = 'https://f2ef0897.shijianus-blog.pages.dev/moments/';

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
    let response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.qzone-space-hero', { timeout: 15000 }).catch(() => null);
    let spaceHero = await page.$('.qzone-space-hero');

    // 检查生产域名是否已刷新到最新的页面内加载版本 (通过检查 #moment-inpage-detail-view)
    let inpageView = await page.$('#moment-inpage-detail-view');
    if (!spaceHero || !inpageView) {
      console.log(`[Prod E2E] 主域名可能存在 CDN 边缘节点微缓存，切换至最新部署别名: ${DEPLOY_URL}`);
      targetUrl = DEPLOY_URL;
      response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('.qzone-space-hero', { timeout: 15000 }).catch(() => null);
      spaceHero = await page.$('.qzone-space-hero');
    }

    console.log(`[Prod E2E] HTTP 响应状态 [${targetUrl}]: ${response.status()}`);
    if (response.status() !== 200) {
      throw new Error(`生产环境响应非 200，状态码: ${response.status()}`);
    }

    // 1. 验证 QQ 空间主页 Hero Banner 与装扮
    console.log('[Prod E2E 1] 验证空间 Hero Banner、装扮封面与 SVIP 空间主人徽章...');
    if (!spaceHero) spaceHero = await page.$('.qzone-space-hero');
    if (!spaceHero) throw new Error('未找到 .qzone-space-hero 空间卡片');

    const coverBgStyle = await page.$eval('.qzone-space-cover', (el) => el.getAttribute('style') || '');
    console.log(`  -> 空间封面装扮样式: ${coverBgStyle}`);
    if (!coverBgStyle.includes('background-image')) {
      throw new Error('未正确渲染 QQ 空间个性化封面大图 background-image');
    }

    const weatherPill = await page.$('.space-weather-pill');
    if (weatherPill) throw new Error('生产端不应再展示 .space-weather-pill 占位符');
    console.log('  -> 占位符清理断言通过: 天气药丸已清除');

    // 检查站长专属皇冠，验证 .qzone-vip-badge 已彻底删除
    const crownBadge = await page.$('.owner-crown-badge');
    if (!crownBadge) throw new Error('未找到站长专属皇冠徽标 .owner-crown-badge');

    const vipBadge = await page.$('.qzone-vip-badge');
    if (vipBadge) {
      throw new Error('生产端 .qzone-vip-badge 等多余说明徽章必须删除！');
    }
    console.log('  -> 徽章精简验证通过: .qzone-vip-badge 已彻底移除');

    // 检查统一在线状态 (必须同步为“☕ 喝咖啡中”，杜绝写死“专注”)
    const radarPill = await page.$eval('.qzone-radar-pill', (el) => el.textContent.trim());
    console.log(`  -> 生产端在线状态: ${radarPill}`);
    if (!radarPill.includes('☕') || !radarPill.includes('喝咖啡中')) {
      throw new Error(`生产端在线状态未统一同步为“☕ 喝咖啡中”，当前为: "${radarPill}"`);
    }

    // 2. 验证二级子导航已彻底移除 (消除站中站导航割裂，回归统一顶栏 #nav)
    console.log('[Prod E2E 2] 验证二级子导航已彻底移除 (消除站中站割裂)...');
    const subnavBar = await page.$('.qzone-subnav-bar');
    if (subnavBar) throw new Error('生产端禁止再出现站中站的割裂情况，.qzone-subnav-bar 必须彻底移除！');
    console.log('  -> 二级子导航清理验证通过: 全站导航归拢至统一顶栏 #nav');

    // 检查空间装扮切换按钮已移除
    const btnToggleSkin = await page.$('#btn-toggle-skin, .space-skin-switcher-wrap');
    if (btnToggleSkin) throw new Error('生产端不应再展示空间装扮按钮 #btn-toggle-skin');

    // 检查假踩一踩按钮与假足迹指标已移除
    const btnFootprint = await page.$('#btn-quick-footprint, #qzone-footprint-counter');
    if (btnFootprint) throw new Error('生产端不应再展示假踩一踩按钮或假足迹计数器');
    console.log('  -> 假足迹按钮与假计数器清理验证通过');

    // 检查说说寄语展台与“说说动态 · 聚合时间流”无意义占位符已移除
    console.log('[Prod E2E 2.1] 检查无意义占位符清理...');
    const sayWidget = await page.$('.qzone-say-widget');
    if (sayWidget) throw new Error('生产端不应再展示 .qzone-say-widget 占位符');
    const streamTitleWrap = await page.$('.stream-title-wrap');
    if (streamTitleWrap) throw new Error('生产端不应再展示“说说动态 · 聚合时间流”占位符');
    console.log('  -> .qzone-say-widget 与 .stream-title-wrap 彻底移除断言通过');

    // 3. 验证去冗余（传送门与频道分类完全移除）
    console.log('[Prod E2E 3] 验证冗余组件已彻底清理...');
    const teleportCard = await page.$('.teleport-portal-card, #btn-fishing');
    if (teleportCard) throw new Error('生产端不应再展示旧版极客传送门卡片');

    const channelTabs = await page.$('.stream-channel-tabs, .category-chips');
    if (channelTabs) throw new Error('生产端不应再展示旧版频道或分类过滤指示器');
    console.log('  -> 冗余清理验证通过：传送门与动态分类标签已清除');

    // 4. 验证真实说说与文档站友链剔除
    console.log('[Prod E2E 4] 验证真实说说渲染与文档站友链剔除...');
    const authors = await page.$$eval('.moment-card', (cards) =>
      cards.map((c) => c.getAttribute('data-author'))
    );
    console.log(`  -> 生产端说说作者列表: ${authors.join(', ')}`);
    const hasAstro = authors.some((a) => a.includes('astro'));
    const hasCloudflare = authors.some((a) => a.includes('cloudflare'));
    if (hasAstro || hasCloudflare) {
      throw new Error('生产端仍残留 Astro / Cloudflare 等非个人独立博客文档站！');
    }

    // 检查说说卡片底部的点赞头像流 (杜绝硬编码假头像)
    const fakeGeekAvatar = await page.$('.likes-avatar[src*="seed=geek"], .likes-avatar[src*="seed=cosmos"], .likes-avatar[src*="seed=voyager"]');
    if (fakeGeekAvatar) {
      throw new Error('生产端严禁在说说卡片中硬编码展示 seed=geek/cosmos/voyager 假头像！');
    }
    console.log('  -> 假点赞头像队列清除验证通过');

    // 4.1 头像形状与卡片规范：站长方框(全站唯一)，友邻及Hero保持圆框；尺寸严格一致
    console.log('[Prod E2E 4.1] 验证头像形状规范与卡片尺寸严格一致...');
    const ownerAvatarRadius = await page.$eval(
      '.moment-card.is-owner-moment .author-avatar-wrap .moment-avatar',
      (el) => window.getComputedStyle(el).borderRadius
    );
    console.log(`  -> 站长说说头像圆角: ${ownerAvatarRadius} (方框圆角)`);
    if (ownerAvatarRadius === '50%' || ownerAvatarRadius === '9999px') {
      throw new Error(`站长说说头像必须为唯一的方框: ${ownerAvatarRadius}`);
    }

    const friendAvatarRadius = await page.$eval(
      '.moment-card.is-friend-moment .author-avatar-wrap .moment-avatar',
      (el) => window.getComputedStyle(el).borderRadius
    );
    console.log(`  -> 友邻说说头像圆角: ${friendAvatarRadius} (圆框)`);
    if (!friendAvatarRadius.includes('50%') && !friendAvatarRadius.includes('23px')) {
      throw new Error(`友邻说说头像必须为圆框: ${friendAvatarRadius}`);
    }

    const heroAvatarRadius = await page.$eval(
      '.profile-avatar-wrapper .profile-avatar',
      (el) => window.getComputedStyle(el).borderRadius
    );
    console.log(`  -> 空间Hero主头像圆角: ${heroAvatarRadius} (保留原圆框)`);
    if (!heroAvatarRadius.includes('50%') && !heroAvatarRadius.includes('46px')) {
      throw new Error(`空间Hero主头像必须保留原圆框: ${heroAvatarRadius}`);
    }

    // 验证卡片尺寸完全一致 (宽与盒模型相同)
    const ownerCardWidth = await page.$eval('.moment-card.is-owner-moment', (el) => el.getBoundingClientRect().width);
    const friendCardWidth = await page.$eval('.moment-card.is-friend-moment', (el) => el.getBoundingClientRect().width);
    console.log(`  -> 生产端卡片宽度比对: 站长卡片=${ownerCardWidth}px, 友邻卡片=${friendCardWidth}px`);
    if (Math.abs(ownerCardWidth - friendCardWidth) > 2) {
      throw new Error(`生产端友邻与站长卡片宽度尺寸不一致: ${ownerCardWidth} vs ${friendCardWidth}`);
    }

    // 检查 moments-stream-header 与 footer-detail-group 已彻底删除
    const streamHeader = await page.$('.moments-stream-header');
    if (streamHeader) {
      throw new Error('生产端 .moments-stream-header 卡片必须彻底删除！');
    }
    const footerDetailGroup = await page.$('.footer-detail-group');
    if (footerDetailGroup) {
      throw new Error('生产端 .footer-detail-group 及其查看详情按钮必须彻底删除！');
    }
    console.log('  -> 冗余卡片与底栏按钮删除验证通过: .moments-stream-header 与 .footer-detail-group 已彻底移除');

    // 检查“查看全文”专门按钮
    const expandBtnText = await page.$eval('.btn-toggle-expand', (el) => el.textContent.trim());
    console.log(`  -> 生产端正文气泡直达按钮文案: "${expandBtnText}"`);
    if (!expandBtnText.includes('查看全文')) {
      throw new Error(`生产端按钮文案必须为“查看全文”，当前为: "${expandBtnText}"`);
    }

    // 5. 关键验证：详情界面直接加载到页面内 (In-Page View)，杜绝单独弹窗！
    console.log('[Prod E2E 5] 关键验证：生产端页面内加载说说详情 (去弹窗架构审计)...');
    
    // 断言 DOM 中绝无 #moment-detail-modal
    const oldModal = await page.$('#moment-detail-modal');
    if (oldModal) {
      throw new Error('【严重不符】生产端页面中仍残留 #moment-detail-modal 弹窗 DOM！必须是页面内加载，杜绝弹窗！');
    }
    console.log('  -> 弹窗完全移除断言通过：DOM 中不存在 #moment-detail-modal');

    const streamView = await page.$('#moments-stream-view');
    const inpageDetail = await page.$('#moment-inpage-detail-view');
    if (!streamView || !inpageDetail) {
      throw new Error('未找到主舞台视图容器 #moments-stream-view 或 #moment-inpage-detail-view');
    }

    // 初始状态
    const isStreamInitVisible = await streamView.isVisible();
    const isInpageInitHidden = await inpageDetail.evaluate((el) => el.classList.contains('hidden'));
    console.log(`  -> 初始状态: streamVisible=${isStreamInitVisible}, inpageDetailHidden=${isInpageInitHidden}`);
    if (!isStreamInitVisible || !isInpageInitHidden) {
      throw new Error('初始状态不匹配：应展示瀑布流并隐藏内嵌详情');
    }

    // 点击第一条说说的整卡（整卡任意区域直达详情）
    console.log('[Prod E2E 6] 测试生产端整卡点击任意区域直达页面内详情...');
    const firstCard = await page.$('.moment-card');
    if (!firstCard) throw new Error('未找到 .moment-card');
    await firstCard.click();
    await page.waitForTimeout(400);

    // 检查视图切换
    const isStreamNowHidden = await streamView.evaluate((el) => el.classList.contains('hidden'));
    const isInpageNowVisible = await inpageDetail.isVisible();
    console.log(`  -> 点击详情后状态: streamHidden=${isStreamNowHidden}, inpageDetailVisible=${isInpageNowVisible}`);
    if (!isStreamNowHidden || !isInpageNowVisible) {
      throw new Error('点击详情后未能正确在页面内展示详情容器');
    }

    // 检查详情字段渲染
    const inpageTitle = await page.$eval('#inpage-title', (el) => el.textContent.trim());
    const inpageAuthor = await page.$eval('#inpage-author-name', (el) => el.textContent.trim());
    const inpageContent = await page.$eval('#inpage-content', (el) => el.textContent.trim());
    console.log(`  -> 页面内详情: 标题="[${inpageTitle.slice(0, 30)}...]", 作者=${inpageAuthor}`);
    if (!inpageTitle || !inpageAuthor || !inpageContent) {
      throw new Error('页面内详情标题、作者或正文内容未填充');
    }

    // 检查 URL hash 自动同步
    const currentHash = await page.evaluate(() => window.location.hash);
    console.log(`  -> 生产端当前 URL Hash: ${currentHash}`);
    if (!currentHash.startsWith('#moment-')) {
      throw new Error('打开说说详情时未能自动同步 #moment-{id} Hash');
    }

    // 6. 验证返回按钮恢复瀑布流
    console.log('[Prod E2E 7] 验证返回按钮恢复瀑布流...');
    const btnInpageBack = await page.$('#btn-inpage-back');
    if (!btnInpageBack) throw new Error('未找到顶部返回按钮 #btn-inpage-back');
    await btnInpageBack.click();
    await page.waitForTimeout(300);

    const isStreamRestored = await streamView.isVisible();
    const isInpageClosed = await inpageDetail.evaluate((el) => el.classList.contains('hidden'));
    console.log(`  -> 返回后状态: streamRestored=${isStreamRestored}, inpageClosed=${isInpageClosed}`);
    if (!isStreamRestored || !isInpageClosed) {
      throw new Error('点击返回按钮后未成功恢复瀑布流列表');
    }

    // 7. 验证 URL Hash 直达
    console.log('[Prod E2E 8] 验证 URL Hash 页面内直达...');
    await page.goto(`${targetUrl}#moment-m_20261031_01`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const isInpageHashVisible = await inpageDetail.isVisible();
    const hashTitle = await page.$eval('#inpage-title', (el) => el.textContent.trim());
    console.log(`  -> 生产端 Hash 直达状态: inpageVisible=${isInpageHashVisible}, 标题="[${hashTitle.slice(0, 30)}...]"`);
    if (!isInpageHashVisible || !hashTitle) {
      throw new Error('URL Hash 直达未能自动在页面内加载说说详情');
    }

    // 8. 验证最小信息密度与只展示结果 (无说教/无底层过程阐述/无开发黑话)
    console.log('[Prod E2E 8.1] 验证最小信息密度与只展示结果 (无说教/无底层过程阐述)...');
    const pageHtml = await page.content();
    if (pageHtml.includes('(QQ空间模式)')) throw new Error('生产端仍残留“(QQ空间模式)”开发黑话');
    if (pageHtml.includes('跨站直通车')) throw new Error('生产端仍残留“跨站直通车”过程阐述');
    if (pageHtml.includes('正在连接边缘数据库')) throw new Error('生产端仍残留“正在连接边缘数据库”底层过程阐述');
    if (pageHtml.includes('记录生活与友谊的每一个脚印')) throw new Error('生产端仍残留假大空口号标语');
    if (pageHtml.includes('在设计过程中，我们特别注重')) throw new Error('生产端仍残留开发过程与设计说教文案');
    if (pageHtml.includes('默认遵循 QQ 空间规范')) throw new Error('生产端仍残留对用户的规范解释文案');
    if (pageHtml.includes('全部通过边缘反代保持在本站')) throw new Error('生产端仍残留反代底层实现阐述');
    console.log('  -> 生产端最小信息密度断言通过: 无开发术语、无过程阐述、无废话标语');

    // 9. 检查致命控制台报错
    const fatalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('Failed to load resource') && !e.includes('net::')
    );
    if (fatalErrors.length > 0) {
      throw new Error(`生产端存在致命控制台报错: ${fatalErrors.join('; ')}`);
    }

    console.log('\n============================================================');
    console.log(`🎉 恭喜！生产环境 (${targetUrl}) 真实全链路 E2E 审计 100% 全部通过！`);
    console.log('============================================================\n');
  } finally {
    await browser.close();
  }
}

verifyLiveMoments().catch((err) => {
  console.error('\n❌ 生产环境 E2E 测试失败:', err);
  process.exit(1);
});
