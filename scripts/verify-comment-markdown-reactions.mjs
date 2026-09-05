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

function setupInitialData() {
  testCommentsDb.clear();
  // Add a sample comment with reactions: 👍 5, ❤️ 3, 🔥 2
  const sampleId = 'cm_sample_101';
  testCommentsDb.set(sampleId, {
    id: sampleId,
    postSlug: 'content-formats-and-markup-mastery',
    parentId: null,
    quoteId: null,
    quote: null,
    postType: 'comment',
    authorId: 'usr_admin_01',
    authorName: '博主大大',
    authorAvatar: '',
    authorWebsite: 'https://blog.epocanvas.com',
    authorRole: 'admin',
    message: '欢迎大家体验全新的 Markdown 工具栏与表情互动系统！',
    likesCount: 10,
    reactions: {
      summary: {
        '👍': 5,
        '❤️': 3,
        '🔥': 2,
        '🎉': 1,
      },
      users: {
        'usr_user_1': '👍',
        'usr_user_2': '❤️',
      },
    },
    status: 'published',
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    sessionToken: 'st_admin_token',
    showLocation: true,
    ipCountry: 'CN',
    ipCountryName: '中国',
    ipCountryFlag: '🇨🇳',
    ipLocation: '中国',
  });
}

function createStaticServer(distDir, port = 4399) {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${port}`);
      let reqPath = decodeURIComponent(parsedUrl.pathname);

      if (reqPath === '/api/comments') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Comment-Session-Token, X-Admin-Token');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        if (req.method === 'GET') {
          const slug = parsedUrl.searchParams.get('slug') || '';
          const sort = parsedUrl.searchParams.get('sort') || 'new';
          const list = Array.from(testCommentsDb.values())
            .filter((c) => c.postSlug === slug && c.status !== 'deleted')
            .sort((a, b) => {
              if (sort === 'hot') {
                const diff = (b.likesCount || 0) - (a.likesCount || 0);
                if (diff !== 0) return diff;
              }
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, sort, comments: list }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            const payload = JSON.parse(body || '{}');
            const action = payload.action || 'create';

            // 1. LIKE / REACTION
            if (action === 'like' || action === 'reaction') {
              const authorRole = payload.authorRole || 'visitor';
              const authorId = (payload.authorId || '').trim();

              // Strictly reject visitors!
              if (authorRole === 'visitor' || !authorId) {
                res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                  ok: false,
                  error: '访客无点赞权限，仅注册/登录用户可点赞或进行表情互动',
                }));
                return;
              }

              const item = testCommentsDb.get(payload.id);
              if (!item) {
                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: '评论不存在' }));
                return;
              }

              const targetEmoji = payload.emoji || '👍';
              const rx = item.reactions || { summary: {}, users: {} };
              const prevUserEmoji = rx.users[authorId];
              let newUserEmoji = null;

              if (prevUserEmoji === targetEmoji) {
                delete rx.users[authorId];
                rx.summary[targetEmoji] = Math.max(0, (rx.summary[targetEmoji] || 1) - 1);
                if (rx.summary[targetEmoji] === 0) delete rx.summary[targetEmoji];
              } else {
                if (prevUserEmoji && rx.summary[prevUserEmoji]) {
                  rx.summary[prevUserEmoji] = Math.max(0, rx.summary[prevUserEmoji] - 1);
                  if (rx.summary[prevUserEmoji] === 0) delete rx.summary[prevUserEmoji];
                }
                rx.users[authorId] = targetEmoji;
                rx.summary[targetEmoji] = (rx.summary[targetEmoji] || 0) + 1;
                newUserEmoji = targetEmoji;
              }

              const newTotal = Object.values(rx.summary).reduce((a, b) => a + b, 0);
              item.likesCount = newTotal;
              item.reactions = rx;

              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({
                ok: true,
                likesCount: newTotal,
                reactions: rx,
                userReaction: newUserEmoji,
              }));
              return;
            }

            // 2. CREATE COMMENT
            if (action === 'create') {
              const rawMessage = (payload.message || '').trim();
              const postType = payload.postType || 'comment';

              const id = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              const sessionToken = payload.sessionToken || `st_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
              const newComment = {
                id,
                postSlug: payload.slug,
                parentId: payload.parentId || null,
                quoteId: payload.quoteId || null,
                quote: payload.quote || null,
                postType,
                authorId: payload.authorId || `vis_${Date.now()}`,
                authorName: payload.authorName || '访客',
                authorAvatar: payload.authorAvatar || '',
                authorWebsite: payload.authorWebsite || '',
                authorRole: payload.authorRole || 'visitor',
                message: rawMessage,
                likesCount: 0,
                reactions: { summary: {}, users: {} },
                status: 'published',
                createdAt: new Date().toISOString(),
                sessionToken,
                showLocation: true,
                ipCountry: 'CN',
                ipCountryName: '中国',
                ipCountryFlag: '🇨🇳',
                ipLocation: '中国',
              };
              testCommentsDb.set(id, newComment);
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: true, comment: newComment, sessionToken }));
              return;
            }

            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: 'Unsupported' }));
          });
          return;
        }
      }

      if (reqPath.endsWith('/')) {
        reqPath += 'index.html';
      }

      let filePath = path.join(distDir, reqPath);
      if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
      }
    });

    server.listen(port, () => {
      resolve({ server, port });
    });
  });
}

async function runTests() {
  console.log('🚀 启动 Markdown 工具栏、编辑/预览切页及表情互动 E2E 验收测试...');
  setupInitialData();

  const distDir = path.resolve(process.cwd(), 'dist');
  const { server, port } = await createStaticServer(distDir, 4399);
  console.log(`🌐 本地静态与 API 服务器已就绪: http://localhost:${port}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  let failed = 0;
  const assert = (condition, message) => {
    if (!condition) {
      console.error(`❌ [FAIL]: ${message}`);
      failed++;
    } else {
      console.log(`✅ [PASS]: ${message}`);
    }
  };

  try {
    const targetUrl = `http://localhost:${port}/posts/content-formats-and-markup-mastery/`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // 滚动到 #post-comment 以触发 client:visible 水合 (Hydration)
    const commentSection = page.locator('#post-comment');
    await commentSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // 1. 验证 #post-comment 存在
    assert((await commentSection.count()) > 0, '#post-comment 评论系统挂载成功');

    // 2. 验证 tk-mode-tabs 已删除，替换为 tk-editor-tabs（编辑与预览切页）
    const oldModeTabs = page.locator('#post-comment .tk-mode-tabs');
    assert((await oldModeTabs.count()) === 0, '原 tk-mode-tabs 已彻底删除');

    const editorTabs = page.locator('#post-comment .tk-editor-tabs');
    assert((await editorTabs.count()) > 0, '新 tk-editor-tabs (编辑与预览) 选项卡已渲染');

    const editBtn = page.locator('#post-comment .tk-editor-tab-btn:has-text("编辑")');
    const previewBtn = page.locator('#post-comment .tk-editor-tab-btn:has-text("预览")');
    assert((await editBtn.count()) > 0, '包含“✏️ 编辑”选项卡');
    assert((await previewBtn.count()) > 0, '包含“👁️ 预览”选项卡');

    // 3. 验证 Markdown 工具栏位于 class="tk-input el-textarea" 上方
    const toolbar = page.locator('#post-comment .tk-markdown-toolbar');
    assert((await toolbar.count()) > 0, 'Markdown 编辑工具栏存在');

    const toolbarBox = await toolbar.boundingBox();
    const textarea = page.locator('#post-comment .el-textarea');
    const textareaBox = await textarea.boundingBox();
    assert(
      toolbarBox && textareaBox && toolbarBox.y < textareaBox.y,
      'Markdown 工具栏严格位于 tk-input el-textarea 评论输入框正上方'
    );

    // 4. 验证工具栏必须具备的 12 个完整 button 元素
    const langBtn = page.locator('#post-comment .tk-tb-btn-lang');
    assert((await langBtn.count()) > 0, '包含贴文语言设置 button (🌐 语言 ▾)');

    const boldBtn = page.locator('#post-comment .tk-tb-bold');
    assert((await boldBtn.count()) > 0, '包含加粗 button (B)');

    const italicBtn = page.locator('#post-comment .tk-tb-italic');
    assert((await italicBtn.count()) > 0, '包含斜体 button (I)');

    const headingBtn = page.locator('#post-comment .tk-tb-heading');
    assert((await headingBtn.count()) > 0, '包含文字大小/标题 button (H)');

    const linkBtn = page.locator('#post-comment .tk-tb-btn[title*="超链接"]');
    assert((await linkBtn.count()) > 0, '包含连结 button (🔗)');

    const quoteBtn = page.locator('#post-comment .tk-tb-btn[title*="块引用"]');
    assert((await quoteBtn.count()) > 0, '包含块引用 button (❞)');

    const codeBtn = page.locator('#post-comment .tk-tb-btn[title*="代码"]');
    assert((await codeBtn.count()) > 0, '包含预初始化文字 button (</>)');

    const uploadBtn = page.locator('#post-comment .tk-tb-btn[title*="上传"]');
    assert((await uploadBtn.count()) > 0, '包含上传 button (⬆️)');

    const listBtn = page.locator('#post-comment .tk-tb-btn[title*="清单"]');
    assert((await listBtn.count()) > 0, '包含清单 button (📋)');

    const dirBtn = page.locator('#post-comment .tk-tb-btn[title*="排版书写方向"]');
    assert((await dirBtn.count()) > 0, '包含切换方向 button (⇄)');

    const emojiBtn = page.locator('#post-comment .tk-tb-emoji');
    assert((await emojiBtn.count()) > 0, '包含 emoji 表情 button (😀)');

    const optionsBtn = page.locator('#post-comment .tk-tb-options');
    assert((await optionsBtn.count()) > 0, '包含选项下拉菜单 button (⚙️ 选项 ▾)');

    // 5. 点击“选项”按钮，验证下拉菜单包含要求的 15 个扩展功能
    await optionsBtn.click();
    await page.waitForTimeout(200);

    const optionsPanel = page.locator('#post-comment .tk-options-dropdown');
    assert((await optionsPanel.count()) > 0, '成功展开“选项”高级功能下拉面板');

    const expectedOptionFeatures = [
      '引用贴文',
      '插入表格',
      '插入目录',
      '插入滚动内容',
      '插入 Mermaid chart',
      '插入 Build Chart',
      '隐藏详细内容',
      '插入 Graphviz graph',
      '插入日期/时间',
      '插入数学式',
      '插入范本',
      '新增脚注',
      '模糊化剧透内容',
      '建立投票',
      '套用包装格式',
    ];

    for (const feat of expectedOptionFeatures) {
      const item = optionsPanel.locator(`button:has-text("${feat}")`);
      assert((await item.count()) > 0, `选项下拉包含项: [${feat}]`);
    }

    // 6. 测试插入功能：点击“插入表格”和“模糊化剧透内容”
    const insertTableBtn = optionsPanel.locator('button:has-text("插入表格")');
    await insertTableBtn.click();
    await page.waitForTimeout(100);

    const textareaEl = page.locator('#post-comment textarea.el-textarea__inner');
    let textVal = await textareaEl.inputValue();
    assert(textVal.includes('| 标题 1 | 标题 2 | 标题 3 |'), '成功在输入框中插入标准 Markdown 表格');

    // 再次点击选项，插入剧透内容
    await optionsBtn.click();
    await page.waitForTimeout(100);
    const spoilerBtn = page.locator('#post-comment .tk-options-dropdown button:has-text("模糊化剧透内容")');
    await spoilerBtn.click();
    await page.waitForTimeout(100);

    textVal = await textareaEl.inputValue();
    assert(textVal.includes('[spoiler]'), '成功在输入框中插入模糊化剧透内容标签');

    // 7. 测试“👁️ 预览”切页与 Markdown 最终渲染格式
    await previewBtn.click();
    await page.waitForTimeout(200);

    const previewContainer = page.locator('#post-comment .tk-preview-container');
    assert((await previewContainer.count()) > 0, '成功切换至“👁️ 预览”选项卡');

    const previewTable = page.locator('#post-comment .tk-md-table');
    assert((await previewTable.count()) > 0, '预览区正确解析并渲染 Markdown 表格 (table/th/td)');

    const previewSpoiler = page.locator('#post-comment .tk-spoiler');
    assert((await previewSpoiler.count()) > 0, '预览区正确渲染模糊化剧透内容 (.tk-spoiler)');

    // 切回编辑模式
    await editBtn.click();
    await page.waitForTimeout(100);
    assert((await textareaEl.isVisible()), '切回“✏️ 编辑”选项卡后输入框正常呈现');

    // 8. 测试“访客点赞权限限制”：访客禁止点赞，拦截并提示
    console.log('🔒 验证访客点赞权限拦截...');
    // 清除本地登录身份确保处于访客状态
    await page.evaluate(() => {
      localStorage.removeItem('shijianus-comment-account');
      localStorage.removeItem('shijianus-comment-identity');
      window.dispatchEvent(new CustomEvent('shijianus:comment-account-change', { detail: null }));
    });
    await page.waitForTimeout(200);

    const sampleLikeBtn = page.locator('#post-comment .tk-action-like').first();
    await sampleLikeBtn.click();
    await page.waitForTimeout(300);

    // 检查提示信息
    const toast = page.locator('#post-comment .tk-global-toast.is-error');
    assert((await toast.count()) > 0, '访客尝试点赞时，前端坚决拦截并弹出错误 Toast 提示');
    const toastText = await toast.textContent();
    assert(
      toastText.includes('访客无点赞权限') || toastText.includes('仅注册/登录用户可点赞'),
      `Toast 明确告知权限规则: "${toastText.trim()}"`
    );

    // 关闭账号中心抽屉
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // 9. 测试已登录用户点赞、长按选择 Emoji 与前 3 名 Emoji 排名展示
    console.log('🌟 验证已登录用户点赞、长按修改 Emoji 与前 3 名 Emoji 排名展示...');
    // 注入登录身份 (非访客)
    await page.evaluate(() => {
      const mockUser = {
        id: 'usr_logged_hero',
        name: '高级测试员',
        email: 'tester@epocanvas.com',
        website: 'https://epocanvas.com',
        avatar: '',
        role: 'reader',
      };
      localStorage.setItem('shijianus-comment-account', JSON.stringify(mockUser));
      window.dispatchEvent(new CustomEvent('shijianus:comment-account-change', { detail: mockUser }));
    });
    await page.waitForTimeout(300);

    // 验证初始状态排名展示：👍(5), ❤️(3), 🔥(2), 🎉(1)，共 11 次互动
    const reactionDisplay = page.locator('#post-comment .tk-reaction-display-row').first();
    assert((await reactionDisplay.count()) > 0, '点赞按钮呈现了排名展示容器 (.tk-reaction-display-row)');

    const top3Emojis = page.locator('#post-comment .tk-reaction-emojis-top3').first();
    const countBadge = page.locator('#post-comment .tk-reaction-count-badge').first();
    const emojisText = await top3Emojis.textContent();
    const countText = await countBadge.textContent();

    assert(emojisText.includes('👍') && emojisText.includes('❤️') && emojisText.includes('🔥'), `根据使用排名展示前 3 名 Emoji: "${emojisText}"`);
    assert(countText === '11', `展示 emoji 总数: ${countText}`);

    // 测试长按或通过 mousedown 呼出 Emoji 选择气泡
    await sampleLikeBtn.dispatchEvent('mousedown');
    await page.waitForTimeout(400); // 超过 280ms 触发长按

    const bubblePopup = page.locator('#post-comment .tk-reaction-bubble-popup');
    assert((await bubblePopup.count()) > 0, '长按点赞按钮成功呼出表情修改气泡 (.tk-reaction-bubble-popup)');

    // 点击气泡中的 🚀
    const rocketEmojiBtn = bubblePopup.locator('button.tk-bubble-emoji-btn:has-text("🚀")');
    assert((await rocketEmojiBtn.count()) > 0, '表情气泡中包含 🚀 选项');
    await rocketEmojiBtn.click();
    await page.waitForTimeout(500);

    // 验证点赞数更新为 12，且当前用户高亮激活
    const newCountText = await countBadge.textContent();
    assert(newCountText === '12', `修改表情互动后总数更新为: ${newCountText}`);
    assert(await sampleLikeBtn.evaluate((el) => el.classList.contains('is-reacted')), '当前用户已表达 reaction，点赞按钮呈现高亮激活态 (.is-reacted)');

    // 10. 后端 API 级鉴权测试：访客直接发 POST /api/comments like 必须返回 403
    console.log('🛡️ 验证后端 API 拒绝访客点赞请求...');
    const visitorLikeRes = await page.request.post(`http://localhost:${port}/api/comments`, {
      data: {
        action: 'like',
        id: 'cm_sample_101',
        authorRole: 'visitor',
      },
    });
    assert(visitorLikeRes.status() === 403, `后端 API 拒绝访客点赞 (HTTP ${visitorLikeRes.status()})`);
    const errBody = await visitorLikeRes.json();
    assert(errBody.error && errBody.error.includes('访客无点赞权限'), `后端返回明确错误: "${errBody.error}"`);

    console.log('\n=============================================');
    if (failed === 0) {
      console.log('🎉 所有针对 post-comment 评论系统的优化测试全部 PASS 通过！');
    } else {
      console.error(`💥 存在 ${failed} 项测试失败，请检查排查！`);
    }
    console.log('=============================================\n');
  } catch (err) {
    console.error('测试运行异常:', err);
    failed++;
  } finally {
    await browser.close();
    server.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
