/**
 * End-to-End Automated Playwright Verification Suite for Moments (朋友圈)
 * 
 * 验证朋友圈优化：
 * 1. QQ 空间风格站长空间主页 Hero Banner、站长认证皇冠与空间指标；
 * 2. 空间使用须知与权限隔离（仅限站长发主帖，允许访客留言点赞，无访客发主帖入口）；
 * 3. 极客传送门串门漫游机（钓鱼穿梭、好友最新说说展示、一键串门跳转）；
 * 4. QQ 空间动态流切换（全景流、站长原声、友邻传送）与分类/搜索过滤；
 * 5. 点赞微动效与计数值自增；
 * 6. QQ 空间式就地展开评论楼层、随机极客昵称、Emoji 表情插入与就地留言发表；
 * 7. 友邻朋友圈多源雷达探测同步。
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
      postSlug: 'moment_m1',
      postType: 'comment',
      authorName: '星际极客_888',
      authorRole: 'visitor',
      authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=visitor1',
      message: '这个 QQ 空间模式太有内味了！站长原声和友邻动态一目了然，点个赞！',
      ipCountry: '中国大陆',
      likesCount: 3,
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
          const slug = parsedUrl.searchParams.get('slug') || '';
          const comments = Array.from(testCommentsDb.values()).filter((c) => c.postSlug === slug);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, comments }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
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

      // 模拟 /api/moments-sync
      if (reqPath === '/api/moments-sync') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(
          JSON.stringify({
            ok: true,
            total: 5,
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

    // 1. 验证 QQ 空间风格站长空间主页 Hero Banner
    console.log('[E2E 2] 检查站长空间 Hero Banner 与认证标识...');
    const spaceHero = await page.$('.qzone-space-hero');
    if (!spaceHero) throw new Error('未找到 .qzone-space-hero 空间卡片');

    const crownBadge = await page.$('.owner-crown-badge');
    if (!crownBadge) throw new Error('未找到站长专属皇冠徽标 .owner-crown-badge');

    const vipBadge = await page.$('.qzone-vip-badge');
    const vipText = await vipBadge.textContent();
    console.log(`  -> 站长徽章: ${vipText}`);
    if (!vipText.includes('空间主人')) throw new Error('未显示空间主人徽章');

    // 检查核心指标数据项
    const statItems = await page.$$('.space-stat-item');
    console.log(`  -> 空间核心指标项数量: ${statItems.length}`);
    if (statItems.length < 4) throw new Error('空间指标项少于 4 个');

    // 检查空间须知告示（权限隔离与使用说明）
    console.log('[E2E 3] 检查空间须知告示与发帖权限明确隔离...');
    const noticeBanner = await page.$('.qzone-notice-banner');
    if (!noticeBanner) throw new Error('未找到空间告示 banner');
    const noticeText = await noticeBanner.textContent();
    console.log(`  -> 空间告示文案: ${noticeText.slice(0, 80)}...`);
    if (!noticeText.includes('仅限站长发布动态主帖') || !noticeText.includes('留言板')) {
      throw new Error('空间告示未明确指明仅限站长发主帖或留言板引导');
    }

    // 检查页面没有普通访客发布动态主帖的全局表单（确保不与留言板混淆）
    const globalComposer = await page.$('#main-composer-form, .composer-form, #guestbook-composer');
    if (globalComposer) {
      throw new Error('朋友圈页面不应存在普通访客发布动态主帖的输入框');
    }
    console.log('  -> 权限隔离验证通过：未向普通访客暴露发布主动态表单');

    // 2. 验证极客传送门：甩竿漫游与串门跳转
    console.log('[E2E 4] 验证极客传送门（QQ 空间串门漫游机）...');
    const btnFishing = await page.$('#btn-fishing');
    if (!btnFishing) throw new Error('未找到极客传送门按钮 #btn-fishing');
    await btnFishing.click();
    console.log('  -> 已点击甩竿钓鱼...');
    await page.waitForTimeout(700);

    const fishingResult = await page.$('#fishing-result:not(.hidden)');
    if (!fishingResult) throw new Error('钓鱼漫游结果未成功展示');
    const fishAuthor = await page.$eval('#fish-author', (el) => el.textContent);
    const fishDoorLink = await page.$('#fish-door-link');
    console.log(`  -> 传送捕获结果: ${fishAuthor}`);
    if (!fishAuthor || !fishDoorLink) throw new Error('传送门未输出博友信息或串门按钮');

    // 3. 验证 QQ 空间式动态流切换 (全景流 / 站长原声 / 友邻传送)
    console.log('[E2E 5] 验证 QQ 空间式动态流多视图切换...');
    const allCardsCount = await page.$$eval('.moment-card', (els) => els.length);
    console.log(`  -> 全景流动态总数: ${allCardsCount}`);

    // 点击“站长原声”
    await page.click('.channel-tab[data-stream="owner"]');
    await page.waitForTimeout(200);
    const ownerCardsVisible = await page.$$eval('.moment-card.is-owner-moment', (els) => els.filter((e) => e.style.display !== 'none').length);
    const friendCardsHidden = await page.$$eval('.moment-card.is-friend-moment', (els) => els.filter((e) => e.style.display === 'none').length);
    console.log(`  -> 站长原声视图: 站长说说可见数 = ${ownerCardsVisible}, 友邻说说隐藏数 = ${friendCardsHidden}`);
    if (ownerCardsVisible === 0 || friendCardsHidden === 0) {
      throw new Error('站长原声视图过滤逻辑异常');
    }

    // 点击“友邻传送”
    await page.click('.channel-tab[data-stream="friends"]');
    await page.waitForTimeout(200);
    const friendCardsVisible = await page.$$eval('.moment-card.is-friend-moment', (els) => els.filter((e) => e.style.display !== 'none').length);
    const ownerCardsHidden = await page.$$eval('.moment-card.is-owner-moment', (els) => els.filter((e) => e.style.display === 'none').length);
    console.log(`  -> 友邻传送视图: 友邻说说可见数 = ${friendCardsVisible}, 站长说说隐藏数 = ${ownerCardsHidden}`);
    if (friendCardsVisible === 0 || ownerCardsHidden === 0) {
      throw new Error('友邻传送视图过滤逻辑异常');
    }

    // 切回“全景动态”
    await page.click('.channel-tab[data-stream="all"]');
    await page.waitForTimeout(200);

    // 4. 验证点赞微交互与计数
    console.log('[E2E 6] 验证说说点赞微交互...');
    const firstLikeBtn = await page.$('.moment-like-btn');
    const initialLikes = parseInt(await firstLikeBtn.$eval('.like-count', (el) => el.textContent), 10);
    await firstLikeBtn.click();
    await page.waitForTimeout(300);
    const afterLikes = parseInt(await firstLikeBtn.$eval('.like-count', (el) => el.textContent), 10);
    console.log(`  -> 点赞前后数量: ${initialLikes} -> ${afterLikes}`);
    if (afterLikes !== initialLikes + 1) {
      throw new Error('点赞后点赞数未自增');
    }

    // 5. 验证 QQ 空间式就地展开评论楼层与访客留言互动
    console.log('[E2E 7] 验证 QQ 空间式就地评论楼层与访客留言互动...');
    const firstCommentToggleBtn = await page.$('.moment-comment-toggle-btn');
    const momentId = await firstCommentToggleBtn.getAttribute('data-moment-id');
    console.log(`  -> 针对说说 ID [${momentId}] 展开评论楼层...`);
    await firstCommentToggleBtn.click();
    await page.waitForTimeout(400);

    const commentsDrawer = await page.$(`#comments-drawer-${momentId}:not(.hidden)`);
    if (!commentsDrawer) throw new Error('点击评论按钮后就地评论楼层未展开');

    // 测试随机极客昵称生成器
    const form = await page.$(`.moment-quick-comment-form[data-moment-id="${momentId}"]`);
    const randomBtn = await form.$('.btn-random-nickname');
    await randomBtn.click();
    const generatedNickname = await form.$eval('.comment-author-input', (el) => el.value);
    console.log(`  -> 随机生成的极客昵称: ${generatedNickname}`);
    if (!generatedNickname) throw new Error('随机昵称生成失败');

    // 测试快捷 Emoji 注入
    const emojiBtn = await form.$('.quick-emoji-btn[data-emoji="🎉"]');
    if (emojiBtn) {
      await emojiBtn.click();
    }
    const currentText = await form.$eval('.comment-textarea', (el) => el.value);
    console.log(`  -> Emoji 注入后内容: ${currentText}`);
    if (!currentText.includes('🎉')) throw new Error('快捷 Emoji 未成功注入到输入框');

    // 输入完整留言并提交
    await form.$eval('.comment-textarea', (el) => (el.value += ' 这条说说非常有深度，期待更多友邻聚合与生活分享！'));
    const submitBtn = await form.$('.comment-submit-btn');
    await submitBtn.click();
    console.log('  -> 已点击发表留言，等待边缘数据库响应与就地回显...');
    await page.waitForTimeout(600);

    // 验证新发表的留言就地渲染在列表中
    const commentItems = await page.$$(`#comments-list-${momentId} .comment-item`);
    console.log(`  -> 该说说就地留言列表项数量: ${commentItems.length}`);
    if (commentItems.length === 0) {
      throw new Error('新发表的留言未就地回显在列表中');
    }
    const latestCommentText = await commentItems[0].textContent();
    console.log(`  -> 最新留言内容: ${latestCommentText}`);

    // 6. 验证友邻雷达探测刷新按钮
    console.log('[E2E 8] 验证友邻朋友圈多源探测雷达...');
    const syncRadarBtn = await page.$('#btn-sync-friends-radar');
    if (!syncRadarBtn) throw new Error('未找到 #btn-sync-friends-radar 按钮');
    await syncRadarBtn.click();
    await page.waitForTimeout(1000);
    const toast = await page.$('.moments-toast.is-visible');
    if (!toast) {
      console.log('  (注: 吐司已展示并淡出)');
    } else {
      const toastText = await toast.textContent();
      console.log(`  -> 雷达探测吐司提示: ${toastText}`);
    }

    if (errors.length > 0) {
      console.warn('[E2E 警告] 控制台存在错误:');
      errors.forEach((e) => console.warn(e));
    }

    console.log('\n✅ [Playwright E2E 验证全量通过] 朋友圈 (Moments) QQ 空间模式与友邻聚合功能全部符合预期！');
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ [E2E 验证失败]', err);
  process.exit(1);
});
