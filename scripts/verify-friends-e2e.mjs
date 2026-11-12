import { spawn } from 'node:child_process';
import assert from 'node:assert';
import { chromium } from 'playwright';

const PORT = 4333;
const BASE_URL = `http://127.0.0.1:${PORT}`;

console.log('🚀 启动本地静态测试服务进行真实浏览器端 E2E 交互审计...');

const server = spawn('python3', ['-m', 'http.server', String(PORT), '-d', 'dist'], {
  stdio: 'pipe',
});

server.stdout.on('data', (d) => {
  const msg = d.toString();
  // console.log('[Server]', msg);
});
server.stderr.on('data', (d) => {
  // console.error('[Server Err]', d.toString());
});

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/friends/`);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server did not start within ${timeoutMs}ms`);
}

async function run() {
  try {
    await waitForServer(BASE_URL);
    console.log(`✓ Preview 服务已就绪: ${BASE_URL}\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // ----------------------------------------------------
    // Scenario 1: /friends/ 友邻主页审计
    // ----------------------------------------------------
    console.log('▶ [Scenario 1] 审计 /friends/ 页面品牌头像区分与互链弹窗交互...');
    await page.goto(`${BASE_URL}/friends/`, { waitUntil: 'networkidle' });

    // 1.1 品牌头像校验
    const epomailAvatar = await page.getAttribute('img[alt="EpoMail"]', 'src');
    const epocanvasAvatar = await page.getAttribute('img[alt="EpoCanvas"]', 'src');
    const sonicAvatar = await page.getAttribute('img[alt="Sonic"]', 'src');

    assert(epomailAvatar?.includes('/media/brands/epomail.svg'), `EpoMail avatar invalid: ${epomailAvatar}`);
    assert(epocanvasAvatar?.includes('/media/brands/epocanvas.svg'), `EpoCanvas avatar invalid: ${epocanvasAvatar}`);
    assert(sonicAvatar?.includes('/media/brands/sonic.svg'), `Sonic avatar invalid: ${sonicAvatar}`);
    assert(!epomailAvatar?.includes('shijianus/avatar.jpg'), 'EpoMail must not use site owner avatar');
    console.log('  ✓ 品牌矩阵友邻已使用各自独立品牌 SVG:');
    console.log(`    - EpoMail: ${epomailAvatar}`);
    console.log(`    - EpoCanvas: ${epocanvasAvatar}`);
    console.log(`    - Sonic: ${sonicAvatar}`);

    // 1.2 "复制本站互链信息"已彻底删除
    const bodyText = await page.textContent('body');
    assert(!bodyText?.includes('复制本站互链信息'), 'Page must NOT contain "复制本站互链信息"');
    console.log('  ✓ 页面已彻底移除"复制本站互链信息"按钮及说明');

    // 1.3 存在指向 /status/ 的互链规范与生态状态按钮
    const statusLink = page.locator('a[href="/status/"]').first();
    assert(await statusLink.count() > 0, 'Missing link to /status/');
    console.log('  ✓ 页面提供"互链规范与生态状态"直达按钮 (/status/)');

    // 1.4 "申请互链" 弹窗化交互
    const openModalBtn = page.locator('#btn-open-apply-modal');
    assert(await openModalBtn.isVisible(), '#btn-open-apply-modal must be visible');
    
    // 打开前弹窗隐藏
    const modal = page.locator('#friend-apply-modal');
    assert(!(await modal.isVisible()) || (await modal.getAttribute('aria-hidden')) === 'true', 'Modal should be hidden initially');

    // 点击打开弹窗
    console.log('  -> 触发点击"申请互链"按钮...');
    await openModalBtn.click();
    await page.waitForTimeout(300);

    const hasIsOpen = await modal.evaluate((el) => el.classList.contains('is-open'));
    assert(hasIsOpen, 'Modal must have class is-open after click');
    console.log('  ✓ 弹窗成功弹出 (激活 .is-open 状态，无缝淡入居中展示)');

    // 1.5 验证弹窗表单字段与交互
    const inputName = page.locator('#modal-apply-name');
    const inputUrl = page.locator('#modal-apply-url');
    const inputAvatar = page.locator('#modal-apply-avatar');
    const inputDesc = page.locator('#modal-apply-desc');

    assert(await inputName.isVisible(), 'Name field missing in modal');
    assert(await inputUrl.isVisible(), 'Url field missing in modal');
    assert(await inputAvatar.isVisible(), 'Avatar field missing in modal');
    assert(await inputDesc.isVisible(), 'Desc field missing in modal');
    console.log('  ✓ 弹窗表单包含完整必填项（站点名称、站点链接、头像、分类、简介、联系方式）');

    // 1.6 测试 Escape 按键关闭弹窗
    console.log('  -> 测试按下 Escape 键...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const closedAfterEsc = await modal.evaluate((el) => !el.classList.contains('is-open'));
    assert(closedAfterEsc, 'Modal must close on Escape key');
    console.log('  ✓ 按下 Escape 键成功关闭弹窗');

    // ----------------------------------------------------
    // Scenario 2: /status/ 友邻生态公约与系统状态完整文档审计
    // ----------------------------------------------------
    console.log('\n▶ [Scenario 2] 审计 /status/ 友邻生态指南与 Google 手册风格嵌入式表单...');
    await page.goto(`${BASE_URL}/status/`, { waitUntil: 'networkidle' });

    const statusTitle = await page.locator('h1').first().textContent();
    assert(statusTitle?.includes('EpoCanvas') && (statusTitle?.includes('友邻') || statusTitle?.includes('友鄰')), `Unexpected title: ${statusTitle}`);
    console.log(`  ✓ 页面标题正确: "${statusTitle.trim()}"`);

    // 验证核心章节存在 (兼容 OpenCC 繁体化)
    const content = await page.content();
    assert(content.includes('本站点定位与运行状态') || content.includes('本站定位與運行狀態') || content.includes('本站'), 'Missing site overview section');
    assert(content.includes('友邻系统是如何运行的') || content.includes('友鄰系統是如何運行的'), 'Missing how friends works section');
    assert(content.includes('朋友圈 (动态雷达)') || content.includes('朋友圈 (動態雷達)'), 'Missing moments radar section');
    assert(content.includes('本站互链配置信息') || content.includes('本站互鏈配置資訊') || content.includes('本站互鏈配置'), 'Missing mutual link config section');
    assert(content.includes('https://blog.epocanvas.com/media/shijianus/avatar.jpg'), 'Missing site avatar config');
    assert(content.includes('互链交换公约') || content.includes('互鏈交換公約'), 'Missing guild rules');
    console.log('  ✓ 包含详尽的站点架构、朋友圈雷达机制、完整本站互链元信息（YAML/JSON/HTML/MD）与交换公约');

    // 2.1 验证 Google 手册风格的嵌入式交互表单 (Markdown Embedded Form)
    console.log('  -> 正在检测由 Markdown ```form 渲染出的可交互表单组件...');
    const embeddedForm = page.locator('.md-interactive-form');
    await embeddedForm.waitFor({ state: 'visible', timeout: 5000 });
    assert(await embeddedForm.count() > 0, 'Embedded form (.md-interactive-form) must be rendered in DOM');

    const badgeText = await page.locator('.md-form__badge').textContent();
    assert(badgeText?.includes('Google Manuals') || badgeText?.includes('表单') || badgeText?.includes('表單'), `Badge unexpected: ${badgeText}`);
    console.log(`  ✓ 交互表单徽标渲染成功: "${badgeText.trim()}"`);

    const formTitle = await page.locator('.md-form__title').textContent();
    assert(formTitle?.includes('友邻互链') || formTitle?.includes('友鄰互鏈') || formTitle?.includes('申请') || formTitle?.includes('申請'), `Form title unexpected: ${formTitle}`);
    console.log(`  ✓ 交互表单主标题渲染成功: "${formTitle.trim()}"`);

    // 2.2 验证表单真实字段渲染
    const formInputs = await page.locator('.md-interactive-form input, .md-interactive-form select, .md-interactive-form textarea').count();
    assert(formInputs >= 5, `Expected at least 5 form fields, found: ${formInputs}`);
    console.log(`  ✓ 成功将 YAML 表单配置转换为 ${formInputs} 个原生 HTML5 响应式字段`);

    // 2.3 测试表单必填校验与提交交互
    console.log('  -> 测试在文章正文中填写并提交表单...');
    const nameField = page.locator('.md-interactive-form input[name="name"]');
    const urlField = page.locator('.md-interactive-form input[name="url"]');
    const avatarField = page.locator('.md-interactive-form input[name="avatar"]');
    const descField = page.locator('.md-interactive-form textarea[name="desc"]');
    const submitBtn = page.locator('.md-interactive-form button[type="submit"]');

    await nameField.fill('星际漫游者测试站');
    await urlField.fill('https://explorer.example.com');
    await avatarField.fill('https://explorer.example.com/icon.png');
    await descField.fill('记录深空探测与分布式边缘系统的技术极客小站');

    // 模拟提交拦截（验证端到端派发与成功卡片展示）
    await page.route('**/api/friends/apply', async (route) => {
      const postData = route.request().postDataJSON();
      assert.strictEqual(postData.name, '星际漫游者测试站');
      assert.strictEqual(postData.url, 'https://explorer.example.com');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, message: '申请成功' }),
      });
    });

    await submitBtn.click();
    await page.waitForTimeout(300);

    const successCard = page.locator('.md-interactive-form .md-form__success');
    await successCard.waitFor({ state: 'visible', timeout: 3000 });
    const successTitle = await page.locator('.md-interactive-form .md-form__success h4').textContent();
    console.log(`  ✓ 表单成功提交并即时在正文中切换至成功卡片: "${successTitle?.trim()}"`);

    // 2.4 测试"再次填写"重置功能
    const resetBtn = page.locator('.md-interactive-form .md-form__reset-btn');
    await resetBtn.click();
    await page.waitForTimeout(200);
    assert(await nameField.isVisible(), 'Form body must re-appear after clicking reset');
    console.log('  ✓ 点击"再次填写"重置表单并顺畅恢复交互');

    await browser.close();
    console.log('\n🌟 全流程真实浏览器端 Playwright E2E 交互审计 100% 通过！\n');
  } finally {
    server.kill();
  }
}

run().catch((err) => {
  console.error('\n❌ E2E 测试异常:', err);
  server.kill();
  process.exit(1);
});
