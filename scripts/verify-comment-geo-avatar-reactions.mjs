import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

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

const testCommentsDb = new Map();

// Prepopulate test comments covering TW, HK, US and edited status
testCommentsDb.set('cm_tw_1', {
  id: 'cm_tw_1',
  postSlug: 'content-formats-and-markup-mastery',
  parentId: null,
  quoteId: null,
  quote: null,
  postType: 'comment',
  authorId: 'user_tw',
  authorName: '台湾开发者',
  authorAvatar: '',
  authorWebsite: '',
  authorRole: 'reader',
  message: '来自台北的问候，博客体验很棒！',
  likesCount: 2,
  reactions: { summary: { '👍': 1, '❤️': 1 }, users: { 'user_tw': '❤️' } },
  status: 'published',
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  updatedAt: new Date(Date.now() - 1800000).toISOString(), // edited
  showLocation: true,
  ipCountry: 'TW',
  ipCountryName: '台湾',
  ipCountryFlag: '🇹🇼',
  ipLocation: '台湾',
  ip: '172.16.20.1',
});

testCommentsDb.set('cm_hk_1', {
  id: 'cm_hk_1',
  postSlug: 'content-formats-and-markup-mastery',
  parentId: null,
  quoteId: null,
  quote: null,
  postType: 'comment',
  authorId: 'user_hk',
  authorName: '香港友人',
  authorAvatar: '',
  authorWebsite: '',
  authorRole: 'reader',
  message: '你好，文章写得非常精彩！',
  likesCount: 1,
  reactions: { summary: { '🔥': 1 }, users: { 'user_hk': '🔥' } },
  status: 'published',
  createdAt: new Date(Date.now() - 7200000).toISOString(),
  updatedAt: new Date(Date.now() - 7200000).toISOString(),
  showLocation: true,
  ipCountry: 'HK',
  ipCountryName: '香港',
  ipCountryFlag: '🇭🇰',
  ipLocation: '香港',
  ip: '203.145.90.5',
});

testCommentsDb.set('cm_hidden_loc', {
  id: 'cm_hidden_loc',
  postSlug: 'content-formats-and-markup-mastery',
  parentId: null,
  quoteId: null,
  quote: null,
  postType: 'comment',
  authorId: 'user_privacy',
  authorName: '注重隐私的极客',
  authorAvatar: '',
  authorWebsite: '',
  authorRole: 'reader',
  message: '我关闭了国家和地区展示。',
  likesCount: 0,
  reactions: { summary: {}, users: {} },
  status: 'published',
  createdAt: new Date(Date.now() - 500000).toISOString(),
  updatedAt: new Date(Date.now() - 500000).toISOString(),
  showLocation: false,
  ipCountry: 'US',
  ipCountryName: '美国',
  ipCountryFlag: '🇺🇸',
  ipLocation: '美国',
  ip: '198.51.100.42',
});

function createStaticServer(distDir, port = 4323) {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${port}`);
      let reqPath = decodeURIComponent(parsedUrl.pathname);

      if (reqPath === '/api/comments') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Comment-Session-Token, X-Admin-Token, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        const authHeader = req.headers['authorization'] || '';
        const adminHeader = req.headers['x-admin-token'] || '';
        const sessionHeader = req.headers['x-comment-session-token'] || '';
        const isAdmin = authHeader.includes('admin') || adminHeader === 'mock_admin' || sessionHeader === 'mock_admin';

        if (req.method === 'GET') {
          const slug = parsedUrl.searchParams.get('slug') || '';
          const list = Array.from(testCommentsDb.values())
            .filter((c) => c.postSlug === slug && c.status !== 'deleted')
            .map((c) => {
              const canShow = c.showLocation !== false;
              return {
                ...c,
                ipCountry: canShow || isAdmin ? c.ipCountry : null,
                ipCountryFlag: canShow || isAdmin ? c.ipCountryFlag : null,
                ipCountryName: canShow || isAdmin ? c.ipCountryName : null,
                ipLocation: canShow || isAdmin ? c.ipLocation : null,
                ip: isAdmin ? c.ip : undefined,
              };
            });
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, comments: list }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            const payload = JSON.parse(body || '{}');
            const action = payload.action || 'create';

            if (action === 'like') {
              const comment = testCommentsDb.get(payload.id);
              if (comment) {
                const currentReaction = payload.emoji || '👍';
                comment.likesCount += 1;
                comment.reactions = comment.reactions || { summary: {}, users: {} };
                comment.reactions.summary[currentReaction] = (comment.reactions.summary[currentReaction] || 0) + 1;
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: true, likesCount: comment.likesCount, reactions: comment.reactions }));
                return;
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: true }));
          });
          return;
        }
      }

      // Serve static files from dist
      if (reqPath.endsWith('/')) {
        reqPath += 'index.html';
      }
      let filePath = path.join(distDir, reqPath);
      if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(port, () => {
      resolve({ server, port });
    });
  });
}

async function runTests() {
  console.log('🚀 启动端到端测试服务 (Port: 4323)...');
  const distDir = path.resolve(process.cwd(), 'dist');
  const { server, port } = await createStaticServer(distDir, 4323);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  const testUrl = `http://localhost:${port}/posts/content-formats-and-markup-mastery/`;

  try {
    console.log(`🌐 访问测试页面: ${testUrl}`);
    await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Scroll to comments area
    const commentSection = page.locator('#post-comment');
    await commentSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    console.log('\n--- 验证 1: 发言头像与实际头像同步链路 ---');
    // 1. Check visitor avatar initially
    const inputAvatar = page.locator('#post-comment .tk-row .tk-avatar.theme-account-drawer__summary-avatar').first();
    await inputAvatar.waitFor({ state: 'visible', timeout: 5000 });
    const hasVisitorIcon = await inputAvatar.locator('.tk-avatar-visitor-icon').count();
    console.log(`✓ 访客初始发言头像展示访客图标: ${hasVisitorIcon > 0}`);
    if (hasVisitorIcon === 0) throw new Error('访客初始发言头像未显示访客图标');

    // 2. Simulate user login with custom avatar
    console.log('模拟用户在账户中心更新自定义头像...');
    await page.evaluate(() => {
      const customAccount = {
        id: 'user_test_avatar',
        name: '极客测试官',
        email: 'tester@epocanvas.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        role: 'reader',
        provider: 'local',
        showLocation: true,
      };
      window.localStorage.setItem('shijianus-comment-account', JSON.stringify(customAccount));
      window.dispatchEvent(new CustomEvent('shijianus:comment-account-change', { detail: customAccount }));
    });
    await page.waitForTimeout(500);

    // Verify avatar synchronized in input box
    const syncedImgSrc = await inputAvatar.locator('img').getAttribute('src');
    console.log(`✓ 发言头像成功同步为实际自定义头像: ${syncedImgSrc}`);
    if (!syncedImgSrc || !syncedImgSrc.includes('unsplash.com')) {
      throw new Error('发言头像未能与自定义头像同步');
    }

    // 3. Switch to admin identity and verify fallback to site author avatar
    console.log('模拟切换为博主 (admin) 身份...');
    await page.evaluate(() => {
      const adminAccount = {
        id: 'shijianus_admin',
        name: 'shijianus',
        email: 'hello@shijian.us',
        avatar: '', // unset, should fallback to /media/shijianus/avatar.jpg
        role: 'admin',
        provider: 'local',
        token: 'mock_admin',
        showLocation: true,
      };
      window.localStorage.setItem('shijianus-comment-account', JSON.stringify(adminAccount));
      window.dispatchEvent(new CustomEvent('shijianus:comment-account-change', { detail: adminAccount }));
    });
    await page.waitForTimeout(500);

    const adminAvatarSrc = await inputAvatar.locator('img').getAttribute('src');
    console.log(`✓ 博主发言头像自动回退并同步为博主真实官方头像: ${adminAvatarSrc}`);
    if (adminAvatarSrc !== '/media/shijianus/avatar.jpg') {
      throw new Error(`博主头像回退异常: ${adminAvatarSrc}`);
    }

    console.log('\n--- 验证 2: 点赞留下 emoji 长按切换选框与停留时机 ---');
    // Find the first reaction button in comment stream
    const firstReactionBtn = page.locator('#post-comment .tk-action-btn.tk-action-like').first();
    const reactionWrapper = page.locator('#post-comment .tk-reaction-interactive-wrapper').first();

    // Trigger long press (>260ms)
    console.log('在点赞按钮上按下并保持 320ms (模拟长按)...');
    const box = await firstReactionBtn.boundingBox();
    if (!box) throw new Error('未找到点赞按钮坐标');

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(320); // Hold to trigger popup
    await page.mouse.up();          // Release finger/mouse
    await page.waitForTimeout(300); // Wait after release

    // Verify popup is STILL visible and did NOT disappear prematurely
    const popup = reactionWrapper.locator('.tk-reaction-bubble-popup');
    const isPopupVisibleAfterRelease = await popup.isVisible();
    console.log(`✓ 长按松手后表情选框保持稳定展开 (未闪退): ${isPopupVisibleAfterRelease}`);
    if (!isPopupVisibleAfterRelease) {
      throw new Error('长按选框在松手后立即闪退！未能给用户留出操作时间');
    }

    // Click an emoji inside the popup tray (e.g. ❤️ or 🚀)
    const emojiOption = popup.locator('.tk-bubble-emoji-btn').nth(1); // second emoji
    const selectedEmoji = (await emojiOption.textContent())?.trim();
    console.log(`点击选框内的 emoji: ${selectedEmoji}`);
    await emojiOption.click();
    await page.waitForTimeout(500);

    // Verify popup automatically closes after emoji selection
    const isPopupClosedAfterSelect = !(await popup.isVisible());
    console.log(`✓ 完成更换 emoji 后表情选框自动关闭: ${isPopupClosedAfterSelect}`);
    if (!isPopupClosedAfterSelect) {
      throw new Error('更换 emoji 后选框未能自动关闭');
    }

    // Verify outside click closes popup
    console.log('测试再次长按呼出，点击外部区域是否正常关闭...');
    const freshBox = await firstReactionBtn.boundingBox();
    if (!freshBox) throw new Error('未获取到点赞按钮最新坐标');
    await page.mouse.move(freshBox.x + freshBox.width / 2, freshBox.y + freshBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(350);
    await page.mouse.up();
    await page.waitForTimeout(300);
    const afterUpVisible = await popup.isVisible();
    if (!afterUpVisible) throw new Error('二次长按呼出失败');

    // Click outside
    await page.mouse.click(freshBox.x - 60, freshBox.y - 60);
    await page.waitForTimeout(400);
    const isClosedAfterOutside = !(await popup.isVisible());
    console.log(`✓ 点击选框外部区域正常关闭选框: ${isClosedAfterOutside}`);
    if (!isClosedAfterOutside) throw new Error('点击外部区域选框未关闭');

    console.log('\n--- 验证 3: tk-geo-badge 国旗、代码、注释与 i18n 规范 ---');
    // Examine TW badge
    const twComment = page.locator('#comment-cm_tw_1');
    const twBadge = twComment.locator('.tk-geo-badge');
    await twBadge.waitFor({ state: 'visible', timeout: 5000 });
    const twFlag = await twBadge.locator('.tk-geo-flag').textContent();
    const twCode = await twBadge.locator('.tk-geo-code').textContent();
    const twName = await twBadge.locator('.tk-geo-name').textContent();
    console.log(`✓ 台湾地理标识: 国旗=[${twFlag}], 代码=[${twCode}], 注释=[${twName}]`);
    if (twFlag !== '🇹🇼' || twCode !== 'TW' || !twName?.includes('台湾')) {
      throw new Error(`台湾地理标识不合规: Flag=${twFlag}, Code=${twCode}, Name=${twName}`);
    }

    // Examine HK badge
    const hkComment = page.locator('#comment-cm_hk_1');
    const hkBadge = hkComment.locator('.tk-geo-badge');
    const hkFlag = await hkBadge.locator('.tk-geo-flag').textContent();
    const hkCode = await hkBadge.locator('.tk-geo-code').textContent();
    const hkName = await hkBadge.locator('.tk-geo-name').textContent();
    const hkFullText = await hkBadge.textContent();
    console.log(`✓ 香港地理标识: 国旗=[${hkFlag}], 代码=[${hkCode}], 注释=[${hkName}]`);
    if (hkFlag !== '🇭🇰' || hkCode !== 'HK' || !hkName?.includes('香港')) {
      throw new Error(`香港地理标识不合规: Flag=${hkFlag}, Code=${hkCode}, Name=${hkName}`);
    }
    if (hkFullText?.includes('China') || hkFullText?.includes('中国香港')) {
      throw new Error(`香港地理标识包含违规 China/PRC 文本: ${hkFullText}`);
    }

    console.log('\n--- 验证 4: tk-edited-mark "已编辑" 视觉不重合 ---');
    const editedMark = twComment.locator('.tk-edited-mark');
    await editedMark.waitFor({ state: 'visible', timeout: 5000 });
    const bracketCount = await editedMark.locator('.tk-edited-bracket').count();
    const editedTextCount = await editedMark.locator('.tk-edited-text').count();
    const editedStyles = await editedMark.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      const textEl = el.querySelector('.tk-edited-text');
      const textComputed = textEl ? window.getComputedStyle(textEl) : null;
      return {
        letterSpacing: computed.letterSpacing,
        fontStyle: computed.fontStyle,
        marginRight: textComputed?.marginRight,
      };
    });
    console.log(`✓ 已编辑结构拆解为独立 bracket 与 text: bracketCount=${bracketCount}, textCount=${editedTextCount}`);
    console.log(`✓ 已编辑字符样式: letterSpacing=${editedStyles.letterSpacing}, textMarginRight=${editedStyles.marginRight}`);
    if (bracketCount < 2 || editedTextCount !== 1) {
      throw new Error('tk-edited-mark 未采用拆分结构以消除字符重合');
    }

    console.log('\n--- 验证 5: 用户隐私开关与博主专属 IP 展示 ---');
    // When viewed by admin, check if raw IP is visible
    const adminIpBadge = twComment.locator('.tk-geo-badge .tk-admin-ip-tag');
    const hasAdminIp = (await adminIpBadge.count()) > 0;
    const adminIpText = hasAdminIp ? await adminIpBadge.textContent() : '';
    console.log(`✓ 博主视角下可在国家旗帜旁边查阅真实IP: [${adminIpText}]`);
    if (!hasAdminIp || !adminIpText?.includes('172.16.20.1')) {
      throw new Error(`博主特权未能查阅到真实IP: ${adminIpText}`);
    }

    // Check hidden location user: as admin, still visible with IP
    const hiddenComment = page.locator('#comment-cm_hidden_loc');
    const hiddenGeoBadge = hiddenComment.locator('.tk-geo-badge');
    const isVisibleToAdmin = await hiddenGeoBadge.isVisible();
    console.log(`✓ 隐藏地理位置的用户在博主审计视角下仍可见旗帜与IP: ${isVisibleToAdmin}`);
    if (!isVisibleToAdmin) throw new Error('隐藏地理位置的用户在博主视角下未能审计');

    // Switch to normal visitor/reader and reload to verify raw IP is NOT exposed to public
    console.log('切换为普通读者身份，验证普通人无法查阅 IP，且隐私用户隐藏旗帜...');
    await page.evaluate(() => {
      window.localStorage.removeItem('shijianus-comment-account');
      window.dispatchEvent(new CustomEvent('shijianus:comment-account-change', { detail: null }));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const commentSectionAgain = page.locator('#post-comment');
    await commentSectionAgain.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    const publicTwComment = page.locator('#comment-cm_tw_1');
    const publicAdminIpCount = await publicTwComment.locator('.tk-admin-ip-tag').count();
    console.log(`✓ 普通人视角下真实 IP 数量为 0 (严格保密): ${publicAdminIpCount === 0}`);
    if (publicAdminIpCount !== 0) throw new Error('普通读者视角意外泄露了真实 IP！');

    const publicHiddenComment = page.locator('#comment-cm_hidden_loc');
    const publicHiddenBadgeCount = await publicHiddenComment.locator('.tk-geo-badge').count();
    console.log(`✓ 隐私用户的地理旗帜对普通公众完全隐藏: ${publicHiddenBadgeCount === 0}`);
    if (publicHiddenBadgeCount !== 0) throw new Error('隐私用户的地理旗帜未能对公众隐藏！');

    // Check account center location toggle presence
    console.log('\n--- 验证账户中心 (ThemeOverlays) 地理位置旗帜隐私开关 ---');
    const drawerToggleTrigger = page.locator('#post-comment .tk-avatar.theme-account-drawer__summary-avatar').first();
    await drawerToggleTrigger.click();
    await page.waitForTimeout(600);

    const accountDrawer = page.locator('.theme-account-drawer');
    const isDrawerOpen = await accountDrawer.isVisible();
    console.log(`✓ 点击发言头像成功呼出账户中心抽屉: ${isDrawerOpen}`);
    if (!isDrawerOpen) throw new Error('点击发言头像未能唤起账户中心');

    // Switch to settings tab in account drawer
    const settingsTab = page.locator('.account-nav-tab').filter({ hasText: '设置' }).or(page.locator('.account-nav-tab').nth(2));
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await page.waitForTimeout(400);
    }

    const privacyToggle = page.locator('.account-toggle-field');
    const hasPrivacyToggle = await privacyToggle.isVisible();
    console.log(`✓ 账户中心包含"展示我的国家/地区旗帜与位置"开关: ${hasPrivacyToggle}`);
    if (!hasPrivacyToggle) throw new Error('账户中心未找到地理位置隐私开关');

    console.log('\n🎉 所有 5 项核心问题端到端自动化测试全部 100% 验证通过！');
  } finally {
    await browser.close();
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ 测试失败:', err);
  process.exit(1);
});
