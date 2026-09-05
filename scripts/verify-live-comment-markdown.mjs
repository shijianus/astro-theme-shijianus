import { chromium } from 'playwright';

async function runLiveVerification() {
  console.log('🌐 开始 Cloudflare Pages 线上生产环境 (https://blog.epocanvas.com) 真实链路验证...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  let failed = 0;
  const assert = (condition, message) => {
    if (!condition) {
      console.error(`❌ [LIVE FAIL]: ${message}`);
      failed++;
    } else {
      console.log(`✅ [LIVE PASS]: ${message}`);
    }
  };

  try {
    const livePostUrl = 'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/';
    console.log(`📡 访问线上真实页面: ${livePostUrl}`);
    await page.goto(livePostUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 滚动到评论区触发水合
    const commentEl = page.locator('#post-comment');
    await commentEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);

    // 1. 评论区结构验证
    assert((await commentEl.count()) > 0, '线上生产环境 #post-comment 评论系统挂载成功');

    // 2. 验证 tk-mode-tabs 已经移除，替换为 tk-editor-tabs
    const oldModeTabs = page.locator('#post-comment .tk-mode-tabs');
    assert((await oldModeTabs.count()) === 0, '线上旧版 tk-mode-tabs 已彻底消除');

    const editorTabs = page.locator('#post-comment .tk-editor-tabs');
    assert((await editorTabs.count()) > 0, '线上新版 tk-editor-tabs (编辑与预览) 选项卡已渲染');

    const editBtn = page.locator('#post-comment .tk-editor-tab-btn:has-text("编辑")');
    const previewBtn = page.locator('#post-comment .tk-editor-tab-btn:has-text("预览")');
    assert((await editBtn.count()) > 0, '线上包含“✏️ 编辑”选项卡');
    assert((await previewBtn.count()) > 0, '线上包含“👁️ 预览”选项卡');

    // 3. 验证 Markdown 工具栏位于评论输入框上方
    const toolbar = page.locator('#post-comment .tk-markdown-toolbar');
    assert((await toolbar.count()) > 0, '线上 Markdown 编辑工具栏已渲染');

    const toolbarBox = await toolbar.boundingBox();
    const textarea = page.locator('#post-comment .el-textarea');
    const textareaBox = await textarea.boundingBox();
    assert(
      toolbarBox && textareaBox && toolbarBox.y < textareaBox.y,
      '线上 Markdown 工具栏严格位于评论输入框上方'
    );

    // 4. 验证完整 12 项工具栏 Buttons
    assert((await page.locator('#post-comment .tk-tb-btn-lang').count()) > 0, '线上包含贴文语言设置 (🌐 语言 ▾)');
    assert((await page.locator('#post-comment .tk-tb-bold').count()) > 0, '线上包含加粗 (B)');
    assert((await page.locator('#post-comment .tk-tb-italic').count()) > 0, '线上包含斜体 (I)');
    assert((await page.locator('#post-comment .tk-tb-heading').count()) > 0, '线上包含文字大小 (H)');
    assert((await page.locator('#post-comment .tk-tb-btn[title*="超链接"]').count()) > 0, '线上包含连结 (🔗)');
    assert((await page.locator('#post-comment .tk-tb-btn[title*="块引用"]').count()) > 0, '线上包含块引用 (❞)');
    assert((await page.locator('#post-comment .tk-tb-btn[title*="代码"]').count()) > 0, '线上包含代码 (</>)');
    assert((await page.locator('#post-comment .tk-tb-btn[title*="上传"]').count()) > 0, '线上包含上传 (⬆️)');
    assert((await page.locator('#post-comment .tk-tb-btn[title*="清单"]').count()) > 0, '线上包含清单 (📋)');
    assert((await page.locator('#post-comment .tk-tb-btn[title*="排版书写方向"]').count()) > 0, '线上包含切换方向 (⇄)');
    assert((await page.locator('#post-comment .tk-tb-emoji').count()) > 0, '线上包含 emoji 表情 (😀)');
    assert((await page.locator('#post-comment .tk-tb-options').count()) > 0, '线上包含选项下拉菜单 (⚙️ 选项 ▾)');

    // 5. 点击选项展开面板
    const optionsBtn = page.locator('#post-comment .tk-tb-options');
    await optionsBtn.click();
    await page.waitForTimeout(300);

    const optionsPanel = page.locator('#post-comment .tk-options-dropdown');
    assert((await optionsPanel.count()) > 0, '线上成功展开高级功能选项下拉面板');

    // 6. 测试插入表格与预览模式
    const insertTableBtn = optionsPanel.locator('button:has-text("插入表格")');
    await insertTableBtn.click();
    await page.waitForTimeout(200);

    const textareaEl = page.locator('#post-comment textarea.el-textarea__inner');
    const val = await textareaEl.inputValue();
    assert(val.includes('| 标题 1 | 标题 2 | 标题 3 |'), '线上成功在输入框中插入 Markdown 表格');

    await previewBtn.click();
    await page.waitForTimeout(300);

    const previewTable = page.locator('#post-comment .tk-md-table');
    assert((await previewTable.count()) > 0, '线上预览模式成功渲染格式化 HTML 表格');

    // 7. 测试线上生产 API 鉴权拦截访客点赞
    console.log('🛡️ 验证线上真实生产 API 拒绝访客点赞请求...');
    const liveApiRes = await page.request.post('https://blog.epocanvas.com/api/comments', {
      data: {
        action: 'like',
        id: 'cm_test_probe_id',
        authorRole: 'visitor',
      },
    });
    assert(liveApiRes.status() === 403, `线上 API 严格拒绝访客点赞 (HTTP ${liveApiRes.status()})`);
    const liveBody = await liveApiRes.json();
    assert(liveBody.error && liveBody.error.includes('访客无点赞权限'), `线上 API 错误提示符合规范: "${liveBody.error}"`);

    console.log('\n=============================================');
    if (failed === 0) {
      console.log('🎉 生产环境 (Cloudflare Pages) 全链路 E2E 验证 100% 通过！');
    } else {
      console.error(`💥 生产环境存在 ${failed} 项未通过！`);
    }
    console.log('=============================================\n');
  } catch (err) {
    console.error('线上真实环境验证遇到异常:', err);
    failed++;
  } finally {
    await browser.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveVerification();
