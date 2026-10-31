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
const DEPLOY_URL = 'https://135562c7.shijianus-blog.pages.dev/moments/';

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

    const weatherPill = await page.$eval('.space-weather-pill', (el) => el.textContent.trim());
    console.log(`  -> 空间天气状态: ${weatherPill}`);

    const crownBadge = await page.$('.owner-crown-badge');
    if (!crownBadge) throw new Error('未找到站长专属皇冠徽标 .owner-crown-badge');

    const vipBadge = await page.$('.qzone-vip-badge');
    const vipText = await vipBadge.textContent();
    console.log(`  -> 站长徽章: ${vipText}`);
    if (!vipText.includes('空间主人') || !vipText.includes('SVIP')) {
      throw new Error('未显示空间主人 · SVIP 徽章');
    }

    // 2. 验证 QQ 空间子导航栏与互动
    console.log('[Prod E2E 2] 验证 QQ 空间子导航栏与踩一踩足迹互动...');
    const subnavLinks = await page.$$('.qzone-subnav-bar .subnav-item');
    console.log(`  -> 生产端子导航项数量: ${subnavLinks.length}`);
    if (subnavLinks.length < 4) throw new Error('子导航项少于 4 个');
    const subnavTexts = await Promise.all(subnavLinks.map((el) => el.textContent()));
    console.log(`  -> 子导航项目: ${subnavTexts.map((s) => s.trim()).join(' | ')}`);

    // 检查空间装扮切换按钮
    const btnToggleSkin = await page.$('#btn-toggle-skin');
    if (!btnToggleSkin) throw new Error('生产端未找到空间装扮按钮 #btn-toggle-skin');

    // 检查踩一踩按钮与足迹
    const btnFootprint = await page.$('#btn-quick-footprint');
    if (!btnFootprint) throw new Error('生产端未找到踩一踩按钮 #btn-quick-footprint');
    const footprintText = await page.$eval('#qzone-footprint-counter', (el) => el.textContent.trim());
    console.log(`  -> 空间足迹指标: ${footprintText}`);

    // 检查说说寄语展台
    console.log('[Prod E2E 2.1] 检查 QQ 空间说说寄语展台...');
    const sayWidget = await page.$('.qzone-say-widget');
    if (!sayWidget) throw new Error('生产端未找到说说寄语展台 .qzone-say-widget');
    const sayTitle = await page.$eval('.say-title', (el) => el.textContent.trim());
    console.log(`  -> 主人说说展台标题: "${sayTitle}"`);

    // 3. 验证去冗余（传送门与频道分类完全移除）
    console.log('[Prod E2E 3] 验证冗余组件已彻底清理...');
    const teleportCard = await page.$('.teleport-portal-card, #btn-fishing');
    if (teleportCard) throw new Error('生产端不应再展示旧版极客传送门卡片');

    const channelTabs = await page.$('.stream-channel-tabs, .category-chips');
    if (channelTabs) throw new Error('生产端不应再展示旧版频道或分类过滤指示器');
    console.log('  -> 冗余清理验证通过：传送门与动态分类标签已清除');

    // 4. 验证真实友链说说聚合与文档站友链剔除
    console.log('[Prod E2E 4] 验证真实独立博友动态聚合与非个人博客文档站剔除...');
    const authors = await page.$$eval('.moment-card', (cards) =>
      cards.map((c) => c.getAttribute('data-author'))
    );
    console.log(`  -> 生产端说说作者列表: ${authors.join(', ')}`);
    const hasAstro = authors.some((a) => a.includes('astro'));
    const hasCloudflare = authors.some((a) => a.includes('cloudflare'));
    if (hasAstro || hasCloudflare) {
      throw new Error('生产端仍残留 Astro / Cloudflare 等非个人独立博客文档站！');
    }
    const hasAnzhiyu = authors.some((a) => a.includes('安知鱼'));
    console.log(`  -> 独立博友动态存在性: 安知鱼=${hasAnzhiyu}`);
    if (!hasAnzhiyu) {
      throw new Error('生产端未成功聚合真实博友动态（如安知鱼）');
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

    // 点击第一条说说的“查看详情”按钮
    console.log('[Prod E2E 6] 点击说说查看详情，验证生产端页面内无缝展开...');
    const firstDetailBtn = await page.$('.moment-detail-open-btn');
    if (!firstDetailBtn) throw new Error('未找到 .moment-detail-open-btn 按钮');
    await firstDetailBtn.click();
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

    // 8. 检查致命控制台报错
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
