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

    // 4. 验证工具栏必须具备的矢量 SVG button 元素并已彻底清除超链接与上传功能
    const langBtn = page.locator('#post-comment .tk-tb-btn-lang');
    assert((await langBtn.count()) > 0 && (await langBtn.locator('svg').count()) > 0, '包含贴文语言设置 button (使用矢量 SVG 图标)');

    const boldBtn = page.locator('#post-comment .tk-tb-bold');
    assert((await boldBtn.count()) > 0 && (await boldBtn.locator('svg').count()) > 0, '包含加粗 button (使用矢量 SVG 图标)');

    const italicBtn = page.locator('#post-comment .tk-tb-italic');
    assert((await italicBtn.count()) > 0 && (await italicBtn.locator('svg').count()) > 0, '包含斜体 button (使用矢量 SVG 图标)');

    const headingBtn = page.locator('#post-comment .tk-tb-heading');
    assert((await headingBtn.count()) > 0 && (await headingBtn.locator('svg').count()) > 0, '包含文字大小/标题 button (使用矢量 SVG 图标)');

    const quoteBtn = page.locator('#post-comment .tk-tb-btn-quote');
    assert((await quoteBtn.count()) > 0 && (await quoteBtn.locator('svg').count()) > 0, '包含块引用 button (使用矢量 SVG 图标)');

    const codeBtn = page.locator('#post-comment .tk-tb-btn-code');
    assert((await codeBtn.count()) > 0 && (await codeBtn.locator('svg').count()) > 0, '包含预初始化文字 button (使用矢量 SVG 图标)');

    const listBtn = page.locator('#post-comment .tk-tb-btn-list');
    assert((await listBtn.count()) > 0 && (await listBtn.locator('svg').count()) > 0, '包含清单 button (使用矢量 SVG 图标)');

    const dirBtn = page.locator('#post-comment .tk-tb-btn-direction');
    assert((await dirBtn.count()) > 0 && (await dirBtn.locator('svg').count()) > 0, '包含切换方向 button (使用矢量 SVG 图标)');

    const emojiBtn = page.locator('#post-comment .tk-tb-emoji');
    assert((await emojiBtn.count()) > 0 && (await emojiBtn.locator('svg').count()) > 0, '包含 emoji 表情 button (使用矢量 SVG 图标)');

    const optionsBtn = page.locator('#post-comment .tk-tb-options');
    assert((await optionsBtn.count()) > 0 && (await optionsBtn.locator('svg').count()) > 0, '包含选项下拉菜单 button (使用矢量 SVG 图标)');

    // 验证严格删除超链接与上传服务 (db 纯文本轻量安全管理)
    const linkBtn = page.locator('#post-comment .tk-tb-btn[title*="超链接"], #post-comment .tk-tb-btn[title*="连结"]');
    assert((await linkBtn.count()) === 0, '为防外链风险，工具栏已彻底删除连结/超链接 button');

    const uploadBtn = page.locator('#post-comment .tk-tb-btn[title*="上传"]');
    assert((await uploadBtn.count()) === 0, '为保障纯文本轻量存储，工具栏已彻底删除上传 button');

    // 5. 点击“选项”按钮，验证下拉菜单包含要求的 15 个扩展功能且全部具备专属 SVG 图标
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
      const svgInItem = await item.locator('svg.tk-dropdown-svg').count();
      assert(svgInItem > 0, `选项 [${feat}] 拥有规范的矢量 SVG 图标`);
    }

    // 6. 测试复杂功能的 UI 弹窗编辑能力 (表格 UI 弹窗与投票 UI 弹窗)
    const textareaEl = page.locator('#post-comment textarea.el-textarea__inner');

    // (1) 测试插入表格 UI 弹窗
    const insertTableBtn = optionsPanel.locator('button:has-text("插入表格")');
    await insertTableBtn.click();
    await page.waitForTimeout(200);

    const tableModal = page.locator('.tk-tool-modal');
    assert((await tableModal.count()) > 0, '点击“插入表格”成功呼出数据表格可视化配置弹窗');
    const tableTitle = await tableModal.locator('.tk-tool-modal-title').textContent();
    assert(tableTitle.includes('插入数据表格'), '弹窗标题正确展示为“插入数据表格”');

    const confirmTableBtn = tableModal.locator('.tk-modal-btn-confirm');
    await confirmTableBtn.click();
    await page.waitForTimeout(200);

    let textVal = await textareaEl.inputValue();
    assert(textVal.includes('| 标题 1 | 标题 2 | 标题 3 |'), '通过弹窗成功在输入框中插入标准 Markdown 表格');

    // (2) 测试建立投票 UI 弹窗
    await optionsBtn.click();
    await page.waitForTimeout(150);
    const pollBtn = page.locator('#post-comment .tk-options-dropdown button:has-text("建立投票")');
    await pollBtn.click();
    await page.waitForTimeout(200);

    const pollModal = page.locator('.tk-tool-modal');
    assert((await pollModal.count()) > 0, '点击“建立投票”成功呼出投票可视化配置弹窗');
    await pollModal.locator('input.tk-modal-input').first().fill('你觉得新版评论系统好用吗？');
    await pollModal.locator('.tk-modal-btn-confirm').click();
    await page.waitForTimeout(200);

    textVal = await textareaEl.inputValue();
    assert(textVal.includes('[poll type=regular]') && textVal.includes('你觉得新版评论系统好用吗？'), '通过弹窗成功插入包含自定义主题的投票组件');

    // (3) 测试模糊化剧透内容 UI 弹窗
    await optionsBtn.click();
    await page.waitForTimeout(150);
    const spoilerBtn = page.locator('#post-comment .tk-options-dropdown button:has-text("模糊化剧透内容")');
    await spoilerBtn.click();
    await page.waitForTimeout(200);

    const spoilerModal = page.locator('.tk-tool-modal');
    assert((await spoilerModal.count()) > 0, '点击“模糊化剧透内容”成功呼出剧透打码弹窗');
    await spoilerModal.locator('textarea.tk-modal-textarea').fill('这是关键剧情剧透');
    await spoilerModal.locator('.tk-modal-btn-confirm').click();
    await page.waitForTimeout(200);

    textVal = await textareaEl.inputValue();
    assert(textVal.includes('[spoiler]这是关键剧情剧透[/spoiler]'), '通过弹窗成功插入打码剧透标签');

    // (A) 验证彻底删除 class="tk-mode-bar-right"
    assert((await page.locator('#post-comment .tk-mode-bar-right').count()) === 0, '已彻底删除无用的 tk-mode-bar-right 提示内容');

    // (B) 验证彻底移除 ⚙️ 图标
    const visitorHeaderLink = page.locator('#post-comment .comment-randomInfo a').first();
    const visitorHeaderText = (await visitorHeaderLink.textContent()) || '';
    assert(!visitorHeaderText.includes('⚙️'), '已彻底清除访客身份中的 ⚙️ 图标');

    // (C) 验证语言与选项按钮采用纯图标+指示箭头，去除生硬的“语言”与“选项”文字
    const langBtnText = (await page.locator('#post-comment .tk-tb-btn-lang').textContent()).trim();
    assert(!langBtnText.includes('语言'), '语言按钮采用纯图标+下拉指示，去除了“语言”文本');
    const optBtnText = (await page.locator('#post-comment .tk-tb-options').textContent()).trim();
    assert(!optBtnText.includes('选项'), '选项按钮采用纯图标+下拉指示，去除了“选项”文本');

    // (D) 验证下拉菜单每项均配有专业注释文本解释 (.tk-dropdown-desc)
    await optionsBtn.click();
    await page.waitForTimeout(200);
    const descCount = await page.locator('#post-comment .tk-options-dropdown .tk-dropdown-desc').count();
    assert(descCount >= 15, '选项下拉菜单中的 15 个功能全部配有清晰的注释文本解释 (.tk-dropdown-desc)');

    // (E) 测试插入目录 (TOC) UI 弹窗与发布规则展示
    const tocBtn = page.locator('#post-comment .tk-options-dropdown button:has-text("插入目录")');
    await tocBtn.click();
    await page.waitForTimeout(200);

    const tocModal = page.locator('.tk-tool-modal');
    assert((await tocModal.count()) > 0, '点击“插入目录”成功呼出居中 UI 弹窗');
    assert((await tocModal.locator('.tk-modal-rule-banner').count()) > 0, '目录弹窗顶部清晰展示 [TOC] 语法规则说明横幅');
    assert((await page.evaluate(() => document.body.style.overflow)) === 'hidden', '弹窗激活时严格锁定 body 滚动，彻底杜绝滑块滑动问题');
    await tocModal.locator('.tk-modal-btn-confirm').click();
    await page.waitForTimeout(200);
    textVal = await textareaEl.inputValue();
    assert(textVal.includes('[TOC]'), '通过目录 UI 弹窗成功将 [TOC] 导航标签与结构注入输入框');

    // (F) 测试插入 Mermaid 图表 UI 弹窗与发布规则展示
    await optionsBtn.click();
    await page.waitForTimeout(200);
    const mermaidBtn = page.locator('#post-comment .tk-options-dropdown button:has-text("插入 Mermaid chart")');
    await mermaidBtn.click();
    await page.waitForTimeout(200);

    const mermaidModal = page.locator('.tk-tool-modal');
    assert((await mermaidModal.count()) > 0, '点击“插入 Mermaid chart”成功呼出居中 UI 弹窗');
    assert((await mermaidModal.locator('.tk-modal-rule-banner').count()) > 0, 'Mermaid 弹窗清晰展示图表类型与发布规则说明');
    // 切换为甘特图
    await mermaidModal.locator('button:has-text("甘特图")').click();
    await page.waitForTimeout(150);
    await mermaidModal.locator('.tk-modal-btn-confirm').click();
    await page.waitForTimeout(200);
    textVal = await textareaEl.inputValue();
    assert(textVal.includes('```mermaid') && textVal.includes('gantt'), '通过 Mermaid UI 弹窗成功插入甘特图代码块');

    // (4) 测试博文框选右键引用联动机制 (shijianus:quote-post-text)
    // 重置输入框确保字数不溢出 COMMENT_LIMIT (500)
    await textareaEl.fill('');
    await page.waitForTimeout(100);

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('shijianus:quote-post-text', {
          detail: {
            text: '这是从文章正文中框选引用的高光论述。',
            url: window.location.pathname,
            title: '测试博文篇章',
          },
        })
      );
    });
    await page.waitForTimeout(300);
    textVal = await textareaEl.inputValue();
    assert(
      textVal.includes('> 引用自《测试博文篇章》：') &&
      textVal.includes('这是从文章正文中框选引用的高光论述。'),
      '正文右键“引用至评论区”成功跨组件联动将引文注入评论编辑区'
    );

    // 7. 测试“👁️ 预览”切页与 Markdown 最终渲染格式
    // 插入包含表格和剧透的内容供预览测试
    await textareaEl.fill('| 列 1 | 列 2 |\n| --- | --- |\n| 数据 1 | 数据 2 |\n\n[spoiler]这是关键剧情剧透[/spoiler]');
    await page.waitForTimeout(150);

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
    await sampleLikeBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
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

    // 10. 验证 class="tk-actions-group" 操作按钮纯 SVG 矢量图标化且默认不展示文字
    console.log('🎨 验证 tk-actions-group 纯 SVG 图标与 Tooltip 规范...');
    const firstCommentActions = page.locator('#post-comment .tk-comment .tk-actions-group').first();

    const replyBtn = firstCommentActions.locator('.tk-action-reply');
    assert((await replyBtn.locator('svg.tk-action-svg').count()) > 0, '评论回复按钮采用 SVG 矢量图标');
    assert((await replyBtn.textContent()).trim() === '', '评论回复按钮默认不展示中文文本');
    assert((await replyBtn.getAttribute('title')).includes('回复'), '评论回复按钮提供清晰的 title tooltip');

    const boostBtn = firstCommentActions.locator('.tk-action-boost');
    assert((await boostBtn.locator('svg.tk-action-svg').count()) > 0, 'Boost 按钮采用 SVG 矢量图标');
    assert((await boostBtn.textContent()).trim() === '', 'Boost 按钮默认不展示中文文本');
    assert((await boostBtn.getAttribute('title')).includes('Boost'), 'Boost 按钮提供清晰的 title tooltip');

    const quoteBtnItem = firstCommentActions.locator('.tk-action-quote');
    assert((await quoteBtnItem.locator('svg.tk-action-svg').count()) > 0, '引用按钮采用 SVG 矢量图标');
    assert((await quoteBtnItem.textContent()).trim() === '', '引用按钮默认不展示中文文本');
    assert((await quoteBtnItem.getAttribute('title')).includes('引用'), '引用按钮提供清晰的 title tooltip');

    // 11. 验证全局通知与 blog 主导航 (#nav) 上方的 #global-activity-bar 深度集成
    console.log('🔔 验证评论提示信息与博客顶部主导航通知系统 (#nav #global-activity-bar) 打通...');
    const topActivityBar = page.locator('#global-activity-bar');
    assert((await topActivityBar.count()) > 0, '顶部全局通知条 #global-activity-bar 存在于页面结构中');

    // 12. 后端 API 级鉴权测试：访客直接发 POST /api/comments like 必须返回 403
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
