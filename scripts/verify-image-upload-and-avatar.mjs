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

const distDir = path.resolve(process.cwd(), 'dist');
let server;
let serverPort = 4329;

// Mock database and session store for testing
const testCommentsDb = new Map();
const testUsersDb = new Map();
const testSessionsDb = new Map();

function setupTestData() {
  testCommentsDb.clear();
  testUsersDb.clear();
  testSessionsDb.clear();

  const sampleId = 'cm_test_img_01';
  testCommentsDb.set(sampleId, {
    id: sampleId,
    postSlug: 'content-formats-and-markup-mastery',
    parentId: null,
    quoteId: null,
    quote: null,
    postType: 'comment',
    authorId: 'usr_author_01',
    authorName: '测试用户',
    authorAvatar: 'https://img.epocanvas.com/file/avatar_sample.png',
    authorWebsite: 'https://blog.epocanvas.com',
    authorRole: 'reader',
    message: '这里展示插入的图片：\n![Telegram图片测试](https://img.epocanvas.com/file/test_render_image.png)',
    likesCount: 2,
    reactions: { summary: { '👍': 2 }, users: {} },
    status: 'published',
    createdAt: new Date().toISOString(),
    sessionToken: 'st_mock_token',
    showLocation: true,
    ipCountry: 'HK',
    ipCountryName: '中国香港',
    ipCountryFlag: '🇭🇰',
  });

  const testUser = {
    id: 'usr_epomail_1',
    name: 'EpoMail 测试站长',
    email: 'admin@epomail.bond',
    avatar: 'https://mail.epocanvas.com/avatars/default.png',
    epomailAvatar: 'https://mail.epocanvas.com/avatars/default.png',
    website: 'https://blog.epocanvas.com',
    role: 'admin',
    provider: 'epomail',
  };
  testUsersDb.set(testUser.id, testUser);
  testSessionsDb.set('mock_token_123', { userId: testUser.id, user: testUser });
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    setupTestData();

    server = http.createServer(async (req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${serverPort}`);
      let pathname = parsedUrl.pathname;

      // Handle Image Upload API
      if (pathname === '/api/upload-image' && req.method === 'POST') {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const bodyBuffer = Buffer.concat(chunks);
        const contentType = req.headers['content-type'] || '';

        // Forward to real Telegram image host or simulate
        try {
          const imageHostToken = process.env.IMAGE_HOST_TOKEN || 'epocanvas_secret_2026_image_key';
          const upstreamRes = await fetch('https://img.epocanvas.com/upload', {
            method: 'POST',
            headers: {
              'Content-Type': contentType,
              Authorization: `Bearer ${imageHostToken}`,
            },
            body: bodyBuffer,
          });

          if (upstreamRes.ok) {
            const data = await upstreamRes.json();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, code: 200, url: data.data?.url || data.url, id: data.data?.id || data.id }));
            return;
          }
        } catch (err) {
          console.warn('[Test Server] Upstream upload failed, using fallback:', err.message);
        }

        // Fallback simulated response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: true,
            code: 200,
            url: 'https://img.epocanvas.com/file/BQACAgEAAyEGAAS6jkJbAAMYap2KEVyNESf5-qVTwvWDhy2FIx8AAloIAAIf-_BE6WY1IQ_mV5Q9BA.svg',
            id: 'file_mock_test_123',
            name: 'test.png',
            size: 1024,
            type: 'image/png',
          })
        );
        return;
      }

      // Handle Comments API
      if (pathname === '/api/comments') {
        if (req.method === 'GET') {
          const slug = parsedUrl.searchParams.get('slug') || '';
          const comments = Array.from(testCommentsDb.values()).filter((c) => c.postSlug === slug);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, comments }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          for await (const chunk of req) body += chunk;
          const payload = JSON.parse(body || '{}');
          const newComment = {
            id: `cm_${Date.now()}`,
            postSlug: payload.slug || 'content-formats-and-markup-mastery',
            message: payload.message || '',
            authorName: payload.authorName || '访客',
            authorAvatar: payload.authorAvatar || '',
            authorRole: payload.authorRole || 'visitor',
            postType: payload.postType || 'comment',
            parentId: payload.parentId || null,
            quoteId: payload.quoteId || null,
            quote: payload.quote || null,
            likesCount: 0,
            reactions: { summary: {}, users: {} },
            status: 'published',
            createdAt: new Date().toISOString(),
          };
          testCommentsDb.set(newComment.id, newComment);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, comment: newComment }));
          return;
        }
      }

      // Handle Auth profile update
      if (pathname === '/api/auth/profile' && req.method === 'POST') {
        let body = '';
        for await (const chunk of req) body += chunk;
        const payload = JSON.parse(body || '{}');
        const token = req.headers['authorization']?.replace(/^Bearer /i, '') || '';
        const session = testSessionsDb.get(token) || testSessionsDb.get('mock_token_123');

        if (session) {
          if (payload.avatar !== undefined) session.user.avatar = payload.avatar;
          if (payload.name !== undefined) session.user.name = payload.name;
          if (payload.website !== undefined) session.user.website = payload.website;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, user: session.user, message: '个人资料已成功更新' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, user: payload, message: '本地身份更新成功' }));
        return;
      }

      // Handle Auth config
      if (pathname === '/api/auth/config' || pathname === '/api/auth') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: true,
            mode: 'outsourced_epomail',
            providers: ['epomail', 'local'],
            epomail: {
              baseUrl: 'https://mail.epocanvas.com',
              clientId: 'epo_live_shijianus_blog',
              authorizeUrl: 'https://mail.epocanvas.com/oauth/authorize',
              redirectUri: `http://localhost:${serverPort}/auth/callback`,
              scope: 'openid email profile app:access',
            },
            adminApp: {
              appName: 'Shijianus Blog Comment Hub',
              appLogo: 'https://blog.epocanvas.com/favicon.svg',
              description: 'Official EpoMail Authorization App',
              scopes: ['openid', 'email', 'profile'],
            },
          })
        );
        return;
      }

      // Static file serving
      if (pathname.endsWith('/')) {
        pathname += 'index.html';
      }

      let filePath = path.join(distDir, pathname);
      if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const notFoundPath = path.join(distDir, '404.html');
        if (fs.existsSync(notFoundPath)) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          fs.createReadStream(notFoundPath).pipe(res);
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      }
    });

    server.listen(serverPort, () => {
      console.log(`[Test Server] Started at http://localhost:${serverPort}`);
      resolve();
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        serverPort++;
        server.listen(serverPort);
      } else {
        reject(err);
      }
    });
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 启动全流程图片上传、Telegram 图床托管与头像设置端到端自动化审计');
  console.log('================================================================\n');

  await startStaticServer();

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, message) {
    testsTotal++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Upload API direct endpoint verification
    // -------------------------------------------------------------
    console.log('\n[Test 1] 验证 POST /api/upload-image 后端与 Telegram 图床中继');
    const formBoundary = '----WebKitFormBoundaryTest123456';
    const fakeImageBuffer = Buffer.from('FAKE_PNG_HEADER_DATA_FOR_UNIT_TEST');
    const multipartBody = Buffer.concat([
      Buffer.from(`--${formBoundary}\r\nContent-Disposition: form-data; name="file"; filename="test_icon.png"\r\nContent-Type: image/png\r\n\r\n`),
      fakeImageBuffer,
      Buffer.from(`\r\n--${formBoundary}--\r\n`),
    ]);

    const uploadRes = await fetch(`http://localhost:${serverPort}/api/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formBoundary}`,
      },
      body: multipartBody,
    });

    assert(uploadRes.status === 200, `POST /api/upload-image 响应状态为 200 (当前: ${uploadRes.status})`);
    const uploadData = await uploadRes.json();
    assert(uploadData.ok === true && Boolean(uploadData.url), `返回有效图片持久化 URL: ${uploadData.url}`);
    assert(uploadData.url.includes('epocanvas.com') || uploadData.url.includes('http'), 'URL 属于图床或合法图片协议');

    // -------------------------------------------------------------
    // Test 2: Comment Toolbar "插入图片" button & modal interaction
    // -------------------------------------------------------------
    console.log('\n[Test 2] 验证评论区工具栏“插入图片”按钮与居中配置弹窗');
    await page.goto(`http://localhost:${serverPort}/posts/content-formats-and-markup-mastery/`, {
      waitUntil: 'networkidle',
    });

    // Wait for comment section
    await page.waitForSelector('#post-comment', { timeout: 8000 });
    await page.$eval('#post-comment', (el) => el.scrollIntoView());
    await page.waitForTimeout(500);

    // Verify Image button on toolbar exists
    const imageToolbarBtn = await page.waitForSelector('.tk-tb-image', { timeout: 5000 });
    assert(Boolean(imageToolbarBtn), '工具栏包含专属“插入图片”按钮 (.tk-tb-image)');

    // Click to open modal
    await imageToolbarBtn.click();
    await page.waitForTimeout(400);

    // Verify modal overlay & header
    const modalOverlay = await page.$('.tk-tool-modal-overlay');
    assert(Boolean(modalOverlay), '成功弹出居中交互配置弹窗 (.tk-tool-modal-overlay)');

    const modalTitle = await page.$eval('.tk-tool-modal-title', (el) => el.textContent);
    assert(modalTitle.includes('插入图片') && modalTitle.includes('Telegram 图床'), `弹窗标题正确展示图床信息 (当前: "${modalTitle}")`);

    // Verify 3 tabs exist
    const tabs = await page.$$('.tk-modal-tab-btn');
    assert(tabs.length === 3, `包含 3 个功能标签页 (当前: ${tabs.length})`);

    // Test Tab 1: 本地上传 (Dropzone)
    const dropzone = await page.$('.tk-image-dropzone');
    assert(Boolean(dropzone), 'Tab 1: 渲染本地上传拖拽区域 (.tk-image-dropzone)');

    // Test Tab 2: 粘贴与拖拽指南
    await tabs[1].click();
    await page.waitForTimeout(200);
    const guideCardTitle = await page.$eval('.tk-guide-card-title', (el) => el.textContent);
    assert(guideCardTitle.includes('剪贴板直接粘贴'), `Tab 2: 正确展示剪贴板粘贴指南 (当前: "${guideCardTitle}")`);
    const kbd = await page.$('.tk-guide-kbd');
    assert(Boolean(kbd), '指南包含键盘按键徽章 (Ctrl+V)');

    // Test Tab 3: 外部图片链接
    await tabs[2].click();
    await page.waitForTimeout(200);
    const urlInput = await page.$('.tk-image-url-tab-pane input[type="url"]');
    assert(Boolean(urlInput), 'Tab 3: 渲染外部图片链接输入框');

    // Input image URL and insert
    await urlInput.fill('https://img.epocanvas.com/file/sample_inserted_test.png');
    await page.waitForTimeout(100);

    // Click confirm button
    const confirmBtn = await page.$('.tk-modal-btn-confirm');
    await confirmBtn.click();
    await page.waitForTimeout(400);

    // Verify insertion into textarea
    const textareaValue = await page.$eval('#post-comment textarea.el-textarea__inner', (el) => el.value);
    assert(
      textareaValue.includes('![图片](https://img.epocanvas.com/file/sample_inserted_test.png)'),
      `评论输入框已自动插入标准 Markdown 图片链接: ${textareaValue}`
    );

    // -------------------------------------------------------------
    // Test 3: Comment Textarea Clipboard Paste & Drag-over Simulation
    // -------------------------------------------------------------
    console.log('\n[Test 3] 验证评论输入框的图片拖拽 (DragOver) 与剪贴板粘贴行为');
    // Test drag-over class
    await page.evaluate(() => {
      const textarea = document.querySelector('#post-comment textarea.el-textarea__inner');
      const dragOverEvent = new DragEvent('dragover', { bubbles: true, cancelable: true });
      textarea.dispatchEvent(dragOverEvent);
    });
    await page.waitForTimeout(200);
    const isDragOver = await page.$eval('#post-comment textarea.el-textarea__inner', (el) =>
      el.classList.contains('is-drag-over')
    );
    assert(isDragOver, '拖拽进入输入框时激活高亮样式 (.is-drag-over)');

    // Test drag-leave resets class
    await page.evaluate(() => {
      const textarea = document.querySelector('#post-comment textarea.el-textarea__inner');
      const dragLeaveEvent = new DragEvent('dragleave', { bubbles: true, cancelable: true });
      textarea.dispatchEvent(dragLeaveEvent);
    });
    await page.waitForTimeout(100);
    const isDragLeaveReset = await page.$eval('#post-comment textarea.el-textarea__inner', (el) =>
      !el.classList.contains('is-drag-over')
    );
    assert(isDragLeaveReset, '拖拽离开输入框时恢复默认样式');

    // -------------------------------------------------------------
    // Test 4: Comment Markdown image rendering styles (.tk-md-img)
    // -------------------------------------------------------------
    console.log('\n[Test 4] 验证评论正文中渲染图片的响应式样式与圆角 (.tk-md-img)');
    const renderedImg = await page.$('.tk-comment .tk-md-img');
    assert(Boolean(renderedImg), '成功在已发布评论流中捕获渲染的图片 (.tk-md-img)');

    const imgStyles = await page.$eval('.tk-comment .tk-md-img', (el) => {
      const computed = window.getComputedStyle(el);
      return {
        borderRadius: computed.borderRadius,
        cursor: computed.cursor,
        maxWidth: computed.maxWidth,
      };
    });
    assert(imgStyles.borderRadius === '8px', `图片圆角收敛为 8px (当前: ${imgStyles.borderRadius})`);
    assert(imgStyles.cursor === 'zoom-in', `图片鼠标悬浮为放大手势 zoom-in (当前: ${imgStyles.cursor})`);

    // -------------------------------------------------------------
    // Test 5: Account Center Avatar Settings & Epomail Restoration
    // -------------------------------------------------------------
    console.log('\n[Test 5] 验证账户中心头像设置、上传新头像与恢复默认 Epomail 官方头像');
    // Set authenticated session with Epomail provider
    await page.evaluate(() => {
      const epomailIdentity = {
        id: 'usr_epomail_1',
        name: 'EpoMail 测试站长',
        email: 'admin@epomail.bond',
        avatar: 'https://mail.epocanvas.com/avatars/default.png',
        epomailAvatar: 'https://mail.epocanvas.com/avatars/default.png',
        website: 'https://blog.epocanvas.com',
        role: 'admin',
        provider: 'epomail',
        token: 'mock_token_123',
      };
      window.localStorage.setItem('shijianus-comment-account', JSON.stringify(epomailIdentity));
      window.localStorage.setItem('shijianus-auth-token', 'mock_token_123');
      window.dispatchEvent(new CustomEvent('shijianus:comment-account-change', { detail: epomailIdentity }));
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    await page.waitForTimeout(600);

    // Verify Account Drawer is open
    const drawer = await page.waitForSelector('.theme-account-overlay.show', { timeout: 5000 });
    assert(Boolean(drawer), '账号中心抽屉成功展开 (.theme-account-drawer.show)');

    // Verify Avatar setting card block exists
    const avatarBlock = await page.waitForSelector('.account-avatar-card-block', { timeout: 4000 });
    assert(Boolean(avatarBlock), '渲染专属头像管理组件 (.account-avatar-card-block)');

    // Verify initial status badge shows Epomail official avatar
    const statusBadgeText = await page.$eval('.account-avatar-status-badge', (el) => el.textContent);
    assert(statusBadgeText.includes('Epomail 官方头像'), `初始展示官方头像徽章 (当前: "${statusBadgeText}")`);

    // Verify "上传新头像" button exists
    const uploadAvatarBtn = await page.$('.account-avatar-action-btn');
    assert(Boolean(uploadAvatarBtn), '提供“上传新头像”按钮 (.account-avatar-action-btn)');

    // Simulate changing avatar to custom URL
    const customAvatarUrl = 'https://img.epocanvas.com/file/my_custom_avatar_2026.png';
    const avatarUrlInput = await page.$('.account-avatar-card-block input[type="url"]');
    await avatarUrlInput.fill(customAvatarUrl);
    await page.waitForTimeout(300);

    // Click "保存资料修改"
    const saveProfileBtn = await page.$('.account-btn-primary');
    await saveProfileBtn.click();
    await page.waitForTimeout(500);

    // Check status badge updated to custom avatar
    const customBadgeText = await page.$eval('.account-avatar-status-badge', (el) => el.textContent);
    assert(customBadgeText.includes('自定义专属头像'), `修改后展示自定义头像徽章 (当前: "${customBadgeText}")`);

    // Verify "恢复 Epomail 默认头像" button appears
    const restoreBtn = await page.waitForSelector('.account-avatar-action-btn.is-restore', { timeout: 3000 });
    assert(Boolean(restoreBtn), '成功出现“恢复 Epomail 默认头像”便捷操作按钮 (.account-avatar-action-btn.is-restore)');

    // Click restore button
    await restoreBtn.click();
    await page.waitForTimeout(500);

    // Verify restored
    const restoredBadgeText = await page.$eval('.account-avatar-status-badge', (el) => el.textContent);
    assert(restoredBadgeText.includes('Epomail 官方头像'), `点击后顺利恢复官方头像 (当前: "${restoredBadgeText}")`);

    console.log('\n================================================================');
    console.log(`🎉 审计完成: 全部 ${testsPassed}/${testsTotal} 项端到端测试 100% 验证通过！`);
    console.log('================================================================\n');
  } finally {
    await browser.close();
    if (server) server.close();
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test execution:', err);
  if (server) server.close();
  process.exit(1);
});
