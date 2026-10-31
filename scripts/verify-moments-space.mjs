/**
 * End-to-End Automated Playwright Verification Suite for Moments (朋友圈)
 * 
 * 验证朋友圈 QQ 空间沉浸式体验与页面内直接加载说说详情（去弹窗）：
 * 1. QQ 空间风格站长空间主页 Hero Banner、装扮壁纸、站长认证皇冠、SVIP 徽章、在线状态与指标；
 * 2. 空间子导航栏（说说动态、博客日志、交流板、友人帐）；
 * 3. 瀑布流去冗余：无极客传送门、无频道分类指示器、自动全量聚合真实博友动态（杜绝文档站友链）；
 * 4. 关键特性：详情界面必须是【页面内直接加载 (In-Page View)】，而非单独的模态弹窗！
 *    - DOM 中绝不存在 #moment-detail-modal；
 *    - 点击卡片或直达链接时，#moments-stream-view 隐藏，#moment-inpage-detail-view 在当前页面就地展示；
 *    - 页面内展示完整正文、多图九宫格画廊、反代直通车、点赞与就地发评；
 *    - 点击顶部或底部“← 返回全部动态”按钮平滑切回瀑布流；
 * 5. URL Hash 深度直达：支持访问 #moment-{id} 自动在页面内展示详情，清除 Hash 自动恢复列表；
 * 6. 点赞与发评全链路测试。
 */

import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 4331;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

// 内存测试评论数据库
const testCommentsDb = new Map([
  [
    'seed_1',
    {
      id: 'seed_1',
      postSlug: 'moment_m_20261031_01',
      postType: 'comment',
      authorName: '赛博旅人_666',
      authorRole: 'visitor',
      authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=visitor1',
      message: '这个 QQ 空间页面内详情展开太丝滑了！没有浮层弹窗打断阅读，真实博友圈爱了！',
      ipCountry: '中国大陆',
      likesCount: 5,
      status: 'published',
      createdAt: '2026-10-31T12:00:00Z',
    },
  ],
]);

function createServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
      let reqPath = decodeURIComponent(parsedUrl.pathname);

      // 模拟 /api/comments
      if (reqPath === '/api/comments') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        if (req.method === 'GET') {
          if (parsedUrl.searchParams.get('action') === 'moments_stats') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              ok: true,
              stats: {
                'm_20261031_01': { commentCount: 1, likesCount: 2 },
                'm_20261031_02': { commentCount: 0, likesCount: 1 },
                'm_20261030_03': { commentCount: 0, likesCount: 0 },
              },
            }));
            return;
          }

          const slug = parsedUrl.searchParams.get('slug') || '';
          const comments = Array.from(testCommentsDb.values()).filter((c) => c.postSlug === slug);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            ok: true,
            comments,
            likesCount: 2,
            likers: [
              { authorName: '赛博旅人', authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=cyber' },
              { authorName: '代码行者', authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=coder' },
            ],
          }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (data.action === 'moment_like') {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                  ok: true,
                  liked: true,
                  likesCount: 3,
                  likers: [
                    { authorName: data.authorName || '热心博友', authorAvatar: data.authorAvatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=liker' },
                    { authorName: '赛博旅人', authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=cyber' },
                  ],
                  message: '点赞已记录至数据库！❤️',
                }));
                return;
              }

              const newComment = {
                id: `cmt_${Date.now()}`,
                postSlug: data.slug,
                postType: data.post_type || 'comment',
                authorName: data.author_name || '极客访客',
                authorRole: 'visitor',
                authorAvatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(data.author_name)}`,
                message: data.message,
                ipCountry: '中国大陆',
                likesCount: 0,
                status: 'published',
                createdAt: new Date().toISOString(),
              };
              testCommentsDb.set(newComment.id, newComment);
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: true, comment: newComment }));
            } catch (e) {
              res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: false, error: 'Bad JSON' }));
            }
          });
          return;
        }
      }

      // 模拟 /api/cross-comment (反代接口)
      if (reqPath === '/api/cross-comment') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        if (req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(
            JSON.stringify({
              ok: true,
              federated: true,
              comments: [
                {
                  id: 'remote_az_1',
                  authorName: 'Hexo极客',
                  authorRole: 'visitor',
                  message: '色彩对比度算法优化非常赞！暗黑模式质感提升显著！',
                  timeAgo: '10分钟前',
                },
              ],
            })
          );
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            const data = JSON.parse(body || '{}');
            if (data.action === 'like') {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: true, federated: true, action: 'like', message: '跨站点赞已送达友邻！' }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: true, federated: true, message: '串门评论已成功直达友邻数据库！' }));
            }
          });
          return;
        }
      }

      // 模拟 /api/moments-sync
      if (reqPath === '/api/moments-sync') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(
          JSON.stringify({
            ok: true,
            total: 4,
            items: [{ id: 'mock_1', author: '安知鱼' }],
            notice: '友邻朋友圈动态同步成功',
          })
        );
        return;
      }

      // 静态文件服务
      if (reqPath.endsWith('/')) {
        reqPath += 'index.html';
      }

      let filePath = path.join(DIST_DIR, reqPath);
      if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    server.listen(PORT, () => {
      resolve(server);
    });
  });
}

async function runVerification() {
  console.log(`[E2E] 正在启动测试服务端口 ${PORT}...`);
  const server = await createServer();
  console.log(`[E2E] 测试服务器已就绪: http://localhost:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error] ${msg.text()}`);
    }
  });

  try {
    console.log('[E2E 1] 导航访问 /moments/ 朋友圈页面...');
    await page.goto(`http://localhost:${PORT}/moments/`, { waitUntil: 'networkidle' });

    // 1. 验证 QQ 空间风格站长空间主页 Hero Banner 与装扮
    console.log('[E2E 2] 检查站长空间 Hero Banner、装扮与个性状态...');
    const spaceHero = await page.$('.qzone-space-hero');
    if (!spaceHero) throw new Error('未找到 .qzone-space-hero 空间卡片');

    // 检查个性化封面大图
    const coverBgStyle = await page.$eval('.qzone-space-cover', (el) => el.getAttribute('style') || '');
    console.log(`  -> 空间封面大图样式: ${coverBgStyle}`);
    if (!coverBgStyle.includes('background-image')) {
      throw new Error('未正确渲染 QQ 空间个性化封面大图 background-image');
    }

    // 检查空间天气与装扮切换按钮已彻底移除 (杜绝无意义占位符)
    const weatherPill = await page.$('.space-weather-pill');
    if (weatherPill) throw new Error('不应再展示 .space-weather-pill 占位符');
    const btnToggleSkin = await page.$('#btn-toggle-skin, .space-skin-switcher-wrap');
    if (btnToggleSkin) throw new Error('不应再展示空间装扮切换按钮 #btn-toggle-skin');
    console.log('  -> 占位符清理断言通过: 天气药丸与装扮切换按钮已彻底移除');

    // 检查站长专属皇冠与 SVIP 空间主人徽章
    const crownBadge = await page.$('.owner-crown-badge');
    if (!crownBadge) throw new Error('未找到站长专属皇冠徽标 .owner-crown-badge');

    const vipBadge = await page.$('.qzone-vip-badge');
    const vipText = await vipBadge.textContent();
    console.log(`  -> 站长徽章: ${vipText}`);
    if (!vipText.includes('空间主人') || !vipText.includes('SVIP')) {
      throw new Error('未显示空间主人 · SVIP 徽章');
    }

    const levelBadge = await page.$('.qzone-level-badge');
    if (!levelBadge) throw new Error('未找到站长等级徽章 .qzone-level-badge');
    const levelText = await levelBadge.textContent();
    console.log(`  -> 站长空间等级: ${levelText}`);

    // 检查站长头像与在线状态
    const masterAvatarSrc = await page.$eval('.profile-avatar', (el) => el.getAttribute('src') || '');
    console.log(`  -> 站长头像同步状态: ${masterAvatarSrc}`);
    if (!masterAvatarSrc.includes('shijianus/avatar.jpg') && !masterAvatarSrc.includes('avatar')) {
      throw new Error('站长头像未同步实际状态');
    }

    const radarPill = await page.$eval('.qzone-radar-pill', (el) => el.textContent.trim());
    console.log(`  -> 在线状态: ${radarPill}`);
    if (!radarPill.includes('实时在线') || !radarPill.includes('专注重构中')) {
      throw new Error('未正确同步实际在线状态');
    }

    // 测试 Hero 与账号中心个人资料及状态实时双向同步
    console.log('[E2E 2.1] 测试 Hero 与账号中心个人资料及状态实时同步...');
    await page.evaluate(() => {
      localStorage.setItem('shijianus-comment-account', JSON.stringify({
        name: '测试站长·极客',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=newmaster',
        bio: '这是通过账号中心同步的新个人简介！',
        coverBg: '/media/shijianus/geek-cover.jpg',
      }));
      localStorage.setItem('shijianus-user-status', JSON.stringify({
        emoji: '🚀',
        text: '极客闭关测试中',
      }));
      window.dispatchEvent(new CustomEvent('shijianus:comment-account-change'));
      window.dispatchEvent(new CustomEvent('shijianus:user-status-change'));
    });
    await page.waitForTimeout(200);

    const updatedHeroName = await page.$eval('#qzone-hero-name', (el) => el.textContent.trim());
    const updatedHeroBio = await page.$eval('#qzone-hero-bio', (el) => el.textContent.trim());
    const updatedHeroStatus = await page.$eval('#qzone-hero-status', (el) => el.textContent.trim());
    console.log(`  -> 同步后Hero: 昵称="${updatedHeroName}", 简介="${updatedHeroBio}", 状态="${updatedHeroStatus}"`);
    if (updatedHeroName !== '测试站长·极客' || !updatedHeroStatus.includes('极客闭关测试中')) {
      throw new Error('Hero 未能与账号中心个人资料/状态完成实时同步');
    }

    // 检查 QQ 空间子导航栏
    console.log('[E2E 3] 检查 QQ 空间子导航栏 (已清除假足迹按钮与假计数器)...');
    const subnavLinks = await page.$$('.qzone-subnav-bar .subnav-item');
    console.log(`  -> 子导航项数量: ${subnavLinks.length}`);
    if (subnavLinks.length < 4) throw new Error('子导航项少于 4 个');
    const subnavTexts = await Promise.all(subnavLinks.map((el) => el.textContent()));
    console.log(`  -> 子导航文案: ${subnavTexts.map((s) => s.trim()).join(' | ')}`);

    // 检查假足迹按钮与假计数器已被彻底清除
    const fakeFootprintBtn = await page.$('#btn-quick-footprint, #qzone-footprint-counter');
    if (fakeFootprintBtn) throw new Error('不应再展示虚假足迹按钮与假计数器');
    console.log('  -> 假足迹按钮与假计数器清理验证通过');

    // 检查说说寄语展台与“说说动态 · 聚合时间流”无意义占位符已彻底移除
    console.log('[E2E 3.1] 检查说说寄语展台与无意义占位符清理...');
    const sayWidget = await page.$('.qzone-say-widget');
    if (sayWidget) throw new Error('不应再展示 .qzone-say-widget 占位符');
    const streamTitleWrap = await page.$('.stream-title-wrap');
    if (streamTitleWrap) throw new Error('不应再展示“说说动态 · 聚合时间流”占位符');
    console.log('  -> .qzone-say-widget 与 .stream-title-wrap 彻底移除断言通过');

    // 2. 验证去冗余（无传送门、无分类标签指示器）
    console.log('[E2E 4] 验证已移除极客传送门与频道分类标签...');
    const teleportCard = await page.$('.teleport-portal-card, #btn-fishing');
    if (teleportCard) throw new Error('不应再展示旧版极客传送门卡片');

    const channelTabs = await page.$('.stream-channel-tabs, .category-chips');
    if (channelTabs) throw new Error('不应再展示旧版频道或分类过滤指示器');
    console.log('  -> 冗余组件清理验证通过：传送门与动态分类说明已彻底移除');

    // 3. 验证说说瀑布流正常渲染且无文档站友链
    console.log('[E2E 5] 验证真实说说渲染与文档站友链剔除...');
    const authors = await page.$$eval('.moment-card', (cards) =>
      cards.map((c) => c.getAttribute('data-author'))
    );
    console.log(`  -> 当前瀑布流说说作者列表: ${authors.join(', ')}`);
    const hasAstro = authors.some((a) => a.includes('astro'));
    const hasCloudflare = authors.some((a) => a.includes('cloudflare'));
    if (hasAstro || hasCloudflare) {
      throw new Error('朋友圈中仍残留 Astro / Cloudflare 等非个人独立博客文档站！');
    }

    // 检查说说卡片底部的点赞头像流 (杜绝硬编码假头像)
    console.log('[E2E 5.1] 检查说说点赞头像流 (严禁硬编码 seed=geek 假头像)...');
    const fakeGeekAvatar = await page.$('.likes-avatar[src*="seed=geek"], .likes-avatar[src*="seed=cosmos"], .likes-avatar[src*="seed=voyager"]');
    if (fakeGeekAvatar) {
      throw new Error('严禁在说说卡片中硬编码展示 seed=geek/cosmos/voyager 假头像！');
    }
    console.log('  -> 硬编码假头像清除断言通过: 无 seed=geek/cosmos/voyager');

    // 点击点赞按钮，验证调用真实后端 API 并动态渲染点赞状态
    const firstLikeBtn = await page.$('.moment-like-btn');
    if (!firstLikeBtn) throw new Error('未找到说说点赞按钮');
    await firstLikeBtn.click();
    await page.waitForTimeout(300);
    const isLikedClass = await firstLikeBtn.evaluate((el) => el.classList.contains('is-liked'));
    console.log(`  -> 点击点赞后激活态: isLiked=${isLikedClass}`);
    if (!isLikedClass) throw new Error('点击点赞未能成功激活 .is-liked 状态');

    // 检查说说卡片底部的点赞头像流与就地展开评论头像同步
    console.log('[E2E 5.1] 检查说说点赞头像流与访客头像实时同步...');
    const firstLikesPreview = await page.$('.moment-likes-preview');
    if (!firstLikesPreview) throw new Error('未找到说说点赞头像流 .moment-likes-preview');
    const likesText = await firstLikesPreview.textContent();
    console.log(`  -> 说说赞流文案: ${likesText.trim()}`);

    // 点击第一条说说的“评论”展开抽屉，输入 QQ 邮箱测试头像实时计算
    const firstCommentToggle = await page.$('.moment-comment-toggle-btn');
    if (firstCommentToggle) {
      await firstCommentToggle.click();
      await page.waitForTimeout(200);
      const emailInput = await page.$('.moment-comments-drawer:not(.hidden) .comment-email-input');
      const avatarImg = await page.$('.moment-comments-drawer:not(.hidden) .comment-visitor-avatar-img');
      if (emailInput && avatarImg) {
        await emailInput.fill('123456@qq.com');
        await page.waitForTimeout(100);
        const updatedAvatarSrc = await avatarImg.getAttribute('src');
        console.log(`  -> 访客输入QQ邮箱后实时头像: ${updatedAvatarSrc}`);
        if (!updatedAvatarSrc.includes('qlogo.cn') || !updatedAvatarSrc.includes('123456')) {
          throw new Error('输入QQ邮箱后未能实时同步QQ真实头像');
        }
      }
    }

    // 4. 关键验证：详情界面直接加载到页面内 (In-Page View)，杜绝单独弹窗！
    console.log('[E2E 6] 关键验证：页面内加载说说详情 (去弹窗架构审计)...');
    
    // 断言 DOM 中绝不存在 #moment-detail-modal
    const oldModal = await page.$('#moment-detail-modal');
    if (oldModal) {
      throw new Error('【严重不符】页面中仍残留 #moment-detail-modal 弹窗 DOM！必须是页面内加载，杜绝弹窗！');
    }
    console.log('  -> 弹窗完全移除断言通过：DOM 中不存在 #moment-detail-modal');

    // 检查主舞台与页面内容器
    const mainStage = await page.$('#moments-main-stage');
    const streamView = await page.$('#moments-stream-view');
    const inpageDetail = await page.$('#moment-inpage-detail-view');
    if (!mainStage || !streamView || !inpageDetail) {
      throw new Error('未找到主舞台 #moments-main-stage 或其子视图容器');
    }

    // 初始状态：瀑布流可见，详情容器 .hidden
    const isStreamInitVisible = await streamView.isVisible();
    const isInpageInitHidden = await inpageDetail.evaluate((el) => el.classList.contains('hidden'));
    console.log(`  -> 初始状态: streamVisible=${isStreamInitVisible}, inpageDetailHidden=${isInpageInitHidden}`);
    if (!isStreamInitVisible || !isInpageInitHidden) {
      throw new Error('初始状态不匹配：应展示瀑布流并隐藏内嵌详情');
    }

    // 点击第一条说说的“查看详情”按钮
    console.log('[E2E 7] 点击说说查看详情，验证页面内无缝展开...');
    const firstDetailBtn = await page.$('.moment-detail-open-btn');
    if (!firstDetailBtn) throw new Error('未找到 .moment-detail-open-btn 按钮');
    await firstDetailBtn.click();
    await page.waitForTimeout(300);

    // 检查视图切换：瀑布流被隐藏，页面内详情可见
    const isStreamNowHidden = await streamView.evaluate((el) => el.classList.contains('hidden'));
    const isInpageNowVisible = await inpageDetail.isVisible();
    console.log(`  -> 点击详情后状态: streamHidden=${isStreamNowHidden}, inpageDetailVisible=${isInpageNowVisible}`);
    if (!isStreamNowHidden || !isInpageNowVisible) {
      throw new Error('点击详情后未能正确在页面内展示详情容器');
    }

    // 检查页面内详情的具体字段渲染
    const inpageTitle = await page.$eval('#inpage-title', (el) => el.textContent.trim());
    const inpageAuthor = await page.$eval('#inpage-author-name', (el) => el.textContent.trim());
    const inpageContent = await page.$eval('#inpage-content', (el) => el.textContent.trim());
    console.log(`  -> 页面内详情: 标题="[${inpageTitle.slice(0, 30)}...]", 作者=${inpageAuthor}`);
    if (!inpageTitle || !inpageAuthor || !inpageContent) {
      throw new Error('页面内详情标题、作者或正文内容未填充');
    }

    // 检查 URL hash 自动同步
    const currentHash = await page.evaluate(() => window.location.hash);
    console.log(`  -> 当前 URL Hash: ${currentHash}`);
    if (!currentHash.startsWith('#moment-')) {
      throw new Error('打开说说详情时未能自动同步 #moment-{id} Hash');
    }

    // 验证大图画廊沉浸式预览 (Lightbox, 杜绝外部跳转)
    const inpagePhotos = await page.$$('.inpage-photo-item');
    if (inpagePhotos.length > 0) {
      console.log(`  -> 发现 ${inpagePhotos.length} 张大图，验证点击画廊沉浸式浏览...`);
      await inpagePhotos[0].click();
      await page.waitForTimeout(200);
      const isLightboxVisible = await page.$eval('#qzone-photo-lightbox', (el) => !el.classList.contains('hidden'));
      const lightboxImgSrc = await page.$eval('#lightbox-img', (el) => el.getAttribute('src'));
      console.log(`  -> 画廊模态状态: visible=${isLightboxVisible}, 图片源=${lightboxImgSrc ? '有效' : '空'}`);
      if (!isLightboxVisible || !lightboxImgSrc) {
        throw new Error('点击图片未能激活就地画廊模态预览');
      }
      const btnCloseLightbox = await page.$('#btn-lightbox-close');
      if (btnCloseLightbox) {
        await btnCloseLightbox.click();
        await page.waitForTimeout(200);
        const isLightboxClosed = await page.$eval('#qzone-photo-lightbox', (el) => el.classList.contains('hidden'));
        if (!isLightboxClosed) throw new Error('点击关闭按钮未能关闭画廊模态');
      }
    }

    // 5. 验证页面内详情的返回按钮（切回瀑布流）
    console.log('[E2E 8] 验证顶部返回按钮恢复瀑布流...');
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

    // 6. 验证直接通过 URL Hash (#moment-...) 访问自动进入页面内详情模式
    console.log('[E2E 9] 验证直接通过 URL Hash 访问在页面内加载详情...');
    await page.goto(`http://localhost:${PORT}/moments/#moment-m_20261031_01`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const isStreamHashHidden = await streamView.evaluate((el) => el.classList.contains('hidden'));
    const isInpageHashVisible = await inpageDetail.isVisible();
    const hashTitle = await page.$eval('#inpage-title', (el) => el.textContent.trim());
    console.log(`  -> Hash 直达状态: inpageVisible=${isInpageHashVisible}, 标题="[${hashTitle.slice(0, 30)}...]"`);
    if (!isStreamHashHidden || !isInpageHashVisible || !hashTitle) {
      throw new Error('URL Hash 直达未能自动在页面内加载说说详情');
    }

    // 7. 验证页面内发表留言与互动
    console.log('[E2E 10] 验证页面内详情评论表单提交...');
    const inpageForm = await page.$('#inpage-quick-comment-form');
    if (!inpageForm) throw new Error('未找到页面内评论表单 #inpage-quick-comment-form');

    const authorInput = await inpageForm.$('.comment-author-input');
    const textarea = await inpageForm.$('.comment-textarea');
    const submitBtn = await inpageForm.$('.comment-submit-btn');

    await authorInput.fill('空间老友_999');
    await textarea.fill('页面内直接加载说说详情太棒了！不用弹窗也不用跳转！');
    await submitBtn.click();
    await page.waitForTimeout(600);

    // 检查吐司提示
    const toastText = await page.$eval('#moments-toast', (el) => el.textContent.trim());
    console.log(`  -> 发评吐司反馈: ${toastText}`);
    if (!toastText.includes('留言') && !toastText.includes('成功') && !toastText.includes('分享')) {
      throw new Error('发评后未出现友好吐司提示');
    }

    // 8. 验证底部返回按钮
    console.log('[E2E 11] 验证底部返回按钮恢复瀑布流...');
    const btnBackBottom = await page.$('#btn-inpage-back-bottom');
    if (!btnBackBottom) throw new Error('未找到底部返回按钮 #btn-inpage-back-bottom');
    await btnBackBottom.click();
    await page.waitForTimeout(300);

    const isStreamRestoredBottom = await streamView.isVisible();
    console.log(`  -> 底部返回后瀑布流状态: streamVisible=${isStreamRestoredBottom}`);
    if (!isStreamRestoredBottom) {
      throw new Error('点击底部返回按钮后未成功恢复瀑布流');
    }

    // 9. 验证搜索功能
    console.log('[E2E 12] 验证关键词搜索说说...');
    const searchInput = await page.$('#moments-search-input');
    if (searchInput) {
      await searchInput.fill('架构');
      await page.waitForTimeout(200);
      const visibleAfterSearch = await page.$$eval('.moment-card', (els) =>
        els.filter((e) => e.style.display !== 'none').length
      );
      console.log(`  -> 搜索“架构”后可见说说数量: ${visibleAfterSearch}`);
      if (visibleAfterSearch === 0) throw new Error('搜索说说无匹配结果');
      await searchInput.fill('');
      await page.waitForTimeout(200);
    }

    // 10. 检查控制台异常
    if (errors.length > 0) {
      console.warn('[E2E Warning] 捕获到以下控制台报错:', errors);
      const fatalErrors = errors.filter(
        (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('Failed to load resource') && !e.includes('net::')
      );
      if (fatalErrors.length > 0) {
        throw new Error(`存在严重控制台报错: ${fatalErrors.join('; ')}`);
      }
    }

    console.log('\n============================================================');
    console.log('🎉 恭喜！朋友圈 QQ 空间沉浸式体验与页面内加载说说详情 E2E 测试全量通过！');
    console.log('============================================================\n');
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ E2E 测试失败:', err);
  process.exit(1);
});
