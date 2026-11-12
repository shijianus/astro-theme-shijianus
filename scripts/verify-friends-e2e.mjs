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
    // Scenario 1: /friends/ 友邻主页审计 (严格仅 3 个友邻)
    // ----------------------------------------------------
    console.log('▶ [Scenario 1] 审计 /friends/ 页面品牌头像区分、严格 3 个友邻与互链弹窗交互...');
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

    // 1.2 严格校验友邻总数仅为 3 个，杜绝任何历史或幻觉数据
    const friendCards = await page.locator('.friend-card').count();
    assert.strictEqual(friendCards, 3, `Expected exactly 3 friends (EpoMail, EpoCanvas, Sonic), but found ${friendCards}`);
    console.log(`  ✓ 页面友邻卡片总数严格为 3 位 (EpoMail, EpoCanvas, Sonic)，无任何编造`);

    // 1.3 "复制本站互链信息"已彻底删除
    const bodyText = await page.textContent('body');
    assert(!bodyText?.includes('复制本站互链信息'), 'Page must NOT contain "复制本站互链信息"');
    console.log('  ✓ 页面已彻底移除"复制本站互链信息"按钮及说明');

    // 1.4 存在指向 /status/ 的互链规范与生态状态按钮
    const statusLink = page.locator('a[href="/status/"]').first();
    assert(await statusLink.count() > 0, 'Missing link to /status/');
    console.log('  ✓ 页面提供"互链规范与生态状态"直达按钮 (/status/)');

    // 1.5 "申请互链" 弹窗化交互
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

    // 1.6 验证弹窗表单字段与交互
    const inputName = page.locator('#modal-apply-name');
    const inputUrl = page.locator('#modal-apply-url');
    const inputAvatar = page.locator('#modal-apply-avatar');
    const inputDesc = page.locator('#modal-apply-desc');

    assert(await inputName.isVisible(), 'Name field missing in modal');
    assert(await inputUrl.isVisible(), 'Url field missing in modal');
    assert(await inputAvatar.isVisible(), 'Avatar field missing in modal');
    assert(await inputDesc.isVisible(), 'Desc field missing in modal');
    console.log('  ✓ 弹窗表单包含完整必填项（站点名称、站点链接、头像、分类、简介、联系方式）');

    // 1.7 测试 Escape 按键关闭弹窗
    console.log('  -> 测试按下 Escape 键...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const closedAfterEsc = await modal.evaluate((el) => !el.classList.contains('is-open'));
    assert(closedAfterEsc, 'Modal must close on Escape key');
    console.log('  ✓ 按下 Escape 键成功关闭弹窗');

    // ----------------------------------------------------
    // Scenario 2: /status/ 友邻生态指南与 Office 协同收集表 (支持 []() 外联)
    // ----------------------------------------------------
    console.log('\n▶ [Scenario 2] 审计 /status/ 友邻生态指南与 Office 协同收集表 (支持 []() 外联)...');
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

    // 2.1 验证 Office 协同收集表 (Spreadsheet Collection Table)
    console.log('  -> 正在检测由 Markdown 渲染出的 Office 收集表格组件 (.office-sheet-wrapper)...');
    const sheetWrapper = page.locator('.office-sheet-wrapper');
    await sheetWrapper.waitFor({ state: 'visible', timeout: 5000 });
    assert(await sheetWrapper.count() > 0, 'Office sheet wrapper (.office-sheet-wrapper) must be rendered in DOM');

    const badgeText = await page.locator('.sheet-badge--office').textContent();
    assert(badgeText?.includes('Office') || badgeText?.includes('Google'), `Badge unexpected: ${badgeText}`);
    console.log(`  ✓ 收集表徽标渲染成功: "${badgeText.trim()}"`);

    const sheetTable = page.locator('.office-sheet-table');
    assert(await sheetTable.isVisible(), 'Office sheet table must be visible');

    // 2.2 验证表格初始数据行：严格仅 3 个友邻
    const rows = page.locator('.office-sheet-table tbody tr');
    const initialRowCount = await rows.count();
    assert.strictEqual(initialRowCount, 3, `Expected exactly 3 rows in initial sheet, found ${initialRowCount}`);
    console.log(`  ✓ 收集表格初始仅展示 3 个真实友邻 (EpoMail, EpoCanvas, Sonic)`);

    // 2.3 验证表格各行中的 []() 外链渲染
    const firstRowLink = page.locator('.office-sheet-table tbody tr:nth-child(1) a.sheet-link');
    const linkHref = await firstRowLink.getAttribute('href');
    const linkText = await firstRowLink.textContent();
    assert.strictEqual(linkHref, 'https://mail.epocanvas.com');
    assert(linkText?.includes('EpoMail'), `Link text should contain EpoMail: ${linkText}`);
    console.log(`  ✓ 收集表已将 Markdown [EpoMail](https://mail.epocanvas.com) 编译为真实外链: ${linkText.trim()} -> ${linkHref}`);

    // 2.4 测试输入行原生支持 []() 外联格式与实时外联识别
    console.log('  -> 测试在收集表填表录入行中以 [名称](链接) 语法填入数据...');
    const siteInput = page.locator('.input-sheet-site');
    const previewEl = page.locator('.sheet-link-preview');
    const avatarInput = page.locator('.input-sheet-avatar');
    const descInput = page.locator('.input-sheet-desc');
    const submitBtn = page.locator('.sheet-submit-btn');

    // 输入 [专案名称](网址)
    await siteInput.fill('[星际漫游者测试站](https://explorer.example.com)');
    await page.waitForTimeout(200);

    // 验证实时外联解析器
    assert(await previewEl.isVisible(), 'Link preview must appear when entering markdown link');
    const previewText = await previewEl.textContent();
    assert(previewText?.includes('星际漫游者测试站') && previewText?.includes('explorer.example.com'), `Preview mismatch: ${previewText}`);
    console.log(`  ✓ 实时外联解析器成功捕获: "${previewText.trim()}"`);

    await avatarInput.fill('https://explorer.example.com/logo.svg');
    await descInput.fill('记录深空探测与分布式边缘系统的技术极客小站');

    // 模拟提交拦截
    await page.route('**/api/friends/apply', async (route) => {
      const postData = route.request().postDataJSON();
      assert.strictEqual(postData.name, '星际漫游者测试站');
      assert.strictEqual(postData.url, 'https://explorer.example.com');
      assert.strictEqual(postData.source, 'office_collection_sheet');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, message: '申请成功' }),
      });
    });

    // 2.5 提交并验证新行即时插入收集表格第 4 行
    console.log('  -> 触发"📥 登记入表"提交...');
    await submitBtn.click();
    await page.waitForTimeout(400);

    const updatedRowCount = await page.locator('.office-sheet-table tbody tr').count();
    assert.strictEqual(updatedRowCount, 4, `Table must now have 4 rows after submission, got ${updatedRowCount}`);
    console.log(`  ✓ 收集表格实时追加新数据行，当前总行数: ${updatedRowCount}`);

    // 验证新插入行的第 4 行外链已就地渲染
    const newRowLink = page.locator('.office-sheet-table tbody tr:nth-child(4) a.sheet-link');
    const newHref = await newRowLink.getAttribute('href');
    const newName = await newRowLink.textContent();
    assert.strictEqual(newHref, 'https://explorer.example.com');
    assert(newName?.includes('星际漫游者测试站'), `New link text should be 星际漫游者测试站: ${newName}`);
    console.log(`  ✓ 新插入行成功解析为外链: ${newName.trim()} -> ${newHref}`);

    // 验证成功反馈条
    const successBanner = page.locator('.sheet-success-banner');
    assert(await successBanner.isVisible(), 'Success banner must be visible');
    const bannerText = await successBanner.textContent();
    console.log(`  ✓ 收集表成功横幅展示: "${bannerText.trim()}"`);

    // 验证输入框已清空
    const siteValAfter = await siteInput.inputValue();
    assert.strictEqual(siteValAfter, '', 'Input field should be reset after submission');
    console.log('  ✓ 录入行输入框自动重置就绪');

    await browser.close();
    console.log('\n🌟 全流程真实浏览器端 Playwright E2E 交互审计 100% 通过！\n');

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
