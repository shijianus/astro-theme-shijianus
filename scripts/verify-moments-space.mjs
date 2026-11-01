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

      // 模拟 /api/geo-profile, /api/auth/config, /api/music/*
      if (reqPath === '/api/geo-profile') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, country: 'CN', region: 'Beijing', city: 'Beijing', ip: '127.0.0.1' }));
        return;
      }
      if (reqPath === '/api/auth/config') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, enabled: false }));
        return;
      }
      if (reqPath.startsWith('/api/music/')) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, list: [], lyric: '' }));
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

    // 检查站长专属皇冠，确认多余的 .qzone-vip-badge 已彻底删除
    const crownBadge = await page.$('.owner-crown-badge');
    if (!crownBadge) throw new Error('未找到站长专属皇冠徽标 .owner-crown-badge');

    const vipBadge = await page.$('.qzone-vip-badge');
    if (vipBadge) {
      throw new Error('按照规范，.qzone-vip-badge 等多余说明徽章必须删除！');
    }
    console.log('  -> 徽章精简验证通过: .qzone-vip-badge 已彻底移除');

    const levelBadge = await page.$('.qzone-level-badge');
    if (!levelBadge) throw new Error('未找到站长等级徽章 .qzone-level-badge');
    const levelText = await levelBadge.textContent();
    console.log(`  -> 站长空间等级: ${levelText}`);

    // 检查站长头像与统一在线状态 (必须同步为“☕ 喝咖啡中”，杜绝写死“专注”)
    const masterAvatarSrc = await page.$eval('.profile-avatar', (el) => el.getAttribute('src') || '');
    console.log(`  -> 站长头像同步状态: ${masterAvatarSrc}`);
    if (!masterAvatarSrc.includes('shijianus/avatar.jpg') && !masterAvatarSrc.includes('avatar')) {
      throw new Error('站长头像未同步实际状态');
    }

    const radarPill = await page.$eval('.qzone-radar-pill', (el) => el.textContent.trim());
    console.log(`  -> 在线状态: ${radarPill}`);
    if (!radarPill.includes('☕') || !radarPill.includes('喝咖啡中')) {
      throw new Error(`在线状态未统一同步为“☕ 喝咖啡中”，当前为: "${radarPill}"`);
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

    // 检查二级子导航栏已彻底移除 (消除站中站导航割裂，回归统一顶栏 #nav)
    console.log('[E2E 3] 验证二级子导航已移除 (消除站中站割裂)...');
    const subnavBar = await page.$('.qzone-subnav-bar');
    if (subnavBar) throw new Error('禁止再出现站中站的割裂情况，.qzone-subnav-bar 必须彻底移除！');
    console.log('  -> 二级子导航清理验证通过: 全站导航归拢至统一顶栏 #nav');

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

    // 检查说说卡片底部的点赞头像流
    console.log('[E2E 5.1] 检查说说点赞头像流与数据展示...');
    const firstLikesPreview = await page.$('.moment-likes-preview');
    if (!firstLikesPreview) throw new Error('未找到说说点赞头像流 .moment-likes-preview');
    const likesText = await firstLikesPreview.textContent();
    console.log(`  -> 说说赞流文案: ${likesText.trim()}`);

    // 点击“评论”直达页面内详情与头像输入计算
    console.log('[E2E 5.1.1] 验证点击“评论”按钮直达页面内详情...');
    const firstCommentToggle = await page.$('.moment-comment-toggle-btn');
    if (!firstCommentToggle) throw new Error('未找到说说评论按钮');
    await firstCommentToggle.click();
    await page.waitForTimeout(300);
    const isInpageViaComment = await page.$eval('#moment-inpage-detail-view', (el) => !el.classList.contains('hidden'));
    if (!isInpageViaComment) throw new Error('点击评论按钮未能直达页面内详情');

    const emailInput = await page.$('#inpage-email-input');
    if (emailInput) {
      await emailInput.fill('123456@qq.com');
      await page.waitForTimeout(100);
    }
    // 返回瀑布流
    await page.click('#btn-inpage-back');
    await page.waitForTimeout(300);

    // 验证 Epomail 账户标准严格打通与免重复输入
    console.log('[E2E 5.1.2] 验证全站 Epomail 账户体系严格打通...');
    await page.evaluate(() => {
      localStorage.setItem('shijianus-comment-account', JSON.stringify({
        id: 'epo_u_test123',
        name: 'Epomail测试读者',
        email: 'reader@epocanvas.com',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=epomail_user',
        role: 'reader',
        provider: 'epomail',
        token: 'test_epomail_session_token',
      }));
      window.dispatchEvent(new CustomEvent('shijianus:comment-account-change'));
    });
    // 打开第一条说说的详情
    const testCard = await page.$('.moment-card');
    await testCard.click();
    await page.waitForTimeout(300);

    const isAccountActiveBarVisible = await page.$eval('#inpage-account-active-bar', (el) => !el.classList.contains('hidden'));
    const isVisitorFieldsHidden = await page.$eval('#inpage-visitor-fields', (el) => el.classList.contains('hidden'));
    const epomailUserName = await page.$eval('#inpage-account-name', (el) => el.textContent.trim());
    const epomailBadge = await page.$eval('#inpage-account-badge', (el) => el.textContent.trim());
    console.log(`  -> Epomail 登录状态: activeBar=${isAccountActiveBarVisible}, visitorHidden=${isVisitorFieldsHidden}, 用户名=${epomailUserName}, 徽标=${epomailBadge}`);
    if (!isAccountActiveBarVisible || !isVisitorFieldsHidden || !epomailBadge.includes('Epomail')) {
      throw new Error('Epomail 账户登录后未能自动同步至发评表单');
    }

    // 恢复访客状态供后续测试
    await page.evaluate(() => {
      localStorage.removeItem('shijianus-comment-account');
      window.dispatchEvent(new CustomEvent('shijianus:comment-account-change'));
    });
    await page.click('#btn-inpage-back');
    await page.waitForTimeout(300);

    // 4. 头像形状与卡片规范：站长方框(全站唯一)，友邻及Hero保持圆框；尺寸严格一致
    console.log('[E2E 5.2] 验证头像形状规范与卡片尺寸严格一致...');
    const ownerAvatarRadius = await page.$eval(
      '.moment-card.is-owner-moment .author-avatar-wrap .moment-avatar',
      (el) => window.getComputedStyle(el).borderRadius
    );
    console.log(`  -> 站长说说头像圆角: ${ownerAvatarRadius} (方框圆角)`);
    if (ownerAvatarRadius === '50%' || ownerAvatarRadius === '9999px') {
      throw new Error(`站长说说头像必须为唯一的方框，不能为圆框: ${ownerAvatarRadius}`);
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
    console.log(`  -> 卡片宽度比对: 站长卡片=${ownerCardWidth}px, 友邻卡片=${friendCardWidth}px`);
    if (Math.abs(ownerCardWidth - friendCardWidth) > 2) {
      throw new Error(`友邻与站长卡片宽度尺寸不一致: ${ownerCardWidth} vs ${friendCardWidth}`);
    }

    // 检查 moments-stream-header 与 footer-detail-group 已彻底删除
    const streamHeader = await page.$('.moments-stream-header');
    if (streamHeader) {
      throw new Error('按照规范，.moments-stream-header 卡片必须彻底删除！');
    }
    const footerDetailGroup = await page.$('.footer-detail-group');
    if (footerDetailGroup) {
      throw new Error('按照规范，.footer-detail-group 及其查看详情按钮必须彻底删除！');
    }
    console.log('  -> 冗余卡片与底栏按钮删除验证通过: .moments-stream-header 与 .footer-detail-group 已彻底移除');

    // 检查“查看全文”专门按钮
    const expandBtnText = await page.$eval('.btn-toggle-expand', (el) => el.textContent.trim());
    console.log(`  -> 正文气泡直达按钮文案: "${expandBtnText}"`);
    if (!expandBtnText.includes('查看全文')) {
      throw new Error(`按钮文案必须为“查看全文”，当前为: "${expandBtnText}"`);
    }

    // 5. 关键验证：详情界面直接加载到页面内 (In-Page View)，杜绝单独弹窗！
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

    // 点击第一条说说的整卡（整卡任意区域直达详情）
    console.log('[E2E 7] 测试整卡点击任意区域直达页面内详情...');
    const firstCard = await page.$('.moment-card');
    if (!firstCard) throw new Error('未找到 .moment-card');
    await firstCard.click();
    await page.waitForTimeout(300);

    // 检查视图切换：瀑布流被隐藏，页面内详情可见
    const isStreamNowHidden = await streamView.evaluate((el) => el.classList.contains('hidden'));
    const isInpageNowVisible = await inpageDetail.isVisible();
    console.log(`  -> 点击详情后状态: streamHidden=${isStreamNowHidden}, inpageDetailVisible=${isInpageNowVisible}`);
    if (!isStreamNowHidden || !isInpageNowVisible) {
      throw new Error('点击整卡后未能正确在页面内展示详情容器');
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

    // 6. 验证页面内详情的返回按钮（切回瀑布流）
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

    // 7. 测试点击“查看全文”专门按钮也能直达详情
    console.log('[E2E 8.1] 测试点击“查看全文 ➔”专门按钮直达详情...');
    const btnViewFull = await page.$('.btn-toggle-expand');
    if (btnViewFull) {
      await btnViewFull.click();
      await page.waitForTimeout(300);
      const isVisibleViaBtn = await inpageDetail.isVisible();
      if (!isVisibleViaBtn) throw new Error('点击“查看全文”专门按钮未能进入详情');
      console.log('  -> 点击“查看全文 ➔”进入详情验证成功');
      await page.click('#btn-inpage-back');
      await page.waitForTimeout(300);
    }

    // 8. 验证直接通过 URL Hash (#moment-...) 访问自动进入页面内详情模式
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

    // 9. 验证顶栏搜索功能联动 (杜绝页面内冗余输入框)
    console.log('[E2E 12] 验证顶栏搜索功能与说说联动...');
    const localSearchInput = await page.$('#moments-search-input');
    if (localSearchInput) {
      throw new Error('页面内不应存在独立 #moments-search-input 输入框，应统一集成至顶栏搜索！');
    }

    // 触发顶栏搜索广播
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:moments-filter', { detail: { query: '架构' } }));
    });
    await page.waitForTimeout(200);
    const visibleAfterSearch = await page.$$eval('.moment-card', (els) =>
      els.filter((e) => e.style.display !== 'none').length
    );
    console.log(`  -> 搜索“架构”后过滤可见说说数量: ${visibleAfterSearch}`);
    if (visibleAfterSearch === 0) throw new Error('搜索说说未能成功过滤结果');

    // 恢复全量展示
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:moments-filter', { detail: { query: '' } }));
    });
    await page.waitForTimeout(200);
    const visibleAll = await page.$$eval('.moment-card', (els) =>
      els.filter((e) => e.style.display !== 'none').length
    );
    console.log(`  -> 清除搜索后恢复全部说说数量: ${visibleAll}`);
    if (visibleAll < 3) throw new Error('清除搜索后未能恢复全量说说');

    // 10. 验证最小信息密度与只展示结果 (无说教/无底层过程阐述/无开发黑话)
    console.log('[E2E 13] 验证最小信息密度与只展示结果 (无说教/无底层过程阐述)...');
    const pageHtml = await page.content();
    if (pageHtml.includes('(QQ空间模式)')) throw new Error('页面仍残留“(QQ空间模式)”开发黑话');
    if (pageHtml.includes('跨站直通车')) throw new Error('页面仍残留“跨站直通车”过程阐述');
    if (pageHtml.includes('正在连接边缘数据库')) throw new Error('页面仍残留“正在连接边缘数据库”底层过程阐述');
    if (pageHtml.includes('记录生活与友谊的每一个脚印')) throw new Error('页面仍残留假大空口号标语');
    if (pageHtml.includes('在设计过程中，我们特别注重')) throw new Error('页面仍残留开发过程与设计说教文案');
    if (pageHtml.includes('默认遵循 QQ 空间规范')) throw new Error('页面仍残留对用户的规范解释文案');
    if (pageHtml.includes('全部通过边缘反代保持在本站')) throw new Error('页面仍残留反代底层实现阐述');
    console.log('  -> 最小信息密度断言通过: 无开发术语、无过程阐述、无废话标语');

    // 11. 检查控制台异常
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
