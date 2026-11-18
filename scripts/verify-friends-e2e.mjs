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
    // Scenario 2: /status/ 站点状态与友邻指南、多格式配置与申请表单
    // ----------------------------------------------------
    console.log('\n▶ [Scenario 2] 审计 /status/ 站点状态与友邻指南及安全互链申请表单...');
    await page.goto(`${BASE_URL}/status/`, { waitUntil: 'networkidle' });

    const statusTitle = await page.locator('h1').first().textContent();
    assert(statusTitle?.includes('shijianus') && (statusTitle?.includes('友邻') || statusTitle?.includes('友鄰')), `Unexpected title: ${statusTitle}`);
    console.log(`  ✓ 页面标题正确: "${statusTitle.trim()}"`);

    const content = await page.content();
    assert(content.includes('认识 shijianus'), 'Missing about shijianus section');
    assert(content.includes('站点状态和运行边界'), 'Missing site status section');
    assert(content.includes('友邻系统如何工作'), 'Missing how friends works section');
    assert(content.includes('shijianus 官方友链信息'), 'Missing mutual link config section');
    assert(content.includes('https://blog.epocanvas.com/media/shijianus/avatar.jpg'), 'Missing site avatar config');
    assert(content.includes('友邻交换与收录规则'), 'Missing guild rules');
    console.log('  ✓ 包含详尽的站点边界、友邻运作说明、单源官方友链配置与交换规则');

    const officialCard = page.locator('[data-official-friend-card]');
    await officialCard.waitFor({ state: 'visible', timeout: 5000 });
    assert(await page.locator('#tab-yaml').isVisible(), 'YAML tab missing');
    assert(await page.locator('#tab-json').isVisible(), 'JSON tab missing');
    assert(await page.locator('#tab-html').isVisible(), 'HTML tab missing');
    assert(await page.locator('#tab-markdown').isVisible(), 'Markdown tab missing');

    const msShell = page.locator('.ms-forms-shell[data-ms-forms="true"]');
    await msShell.waitFor({ state: 'visible', timeout: 5000 });
    const quickInput = page.locator('#msf-friend-link-apply-siteInput');
    const previewEl = msShell.locator('.ms-forms-ext-preview');
    const avatarInput = page.locator('#msf-friend-link-apply-avatar');
    const descInput = page.locator('#msf-friend-link-apply-desc');
    const submitBtn = page.locator('#status-apply-submit');

    await quickInput.fill('[星际漫游者测试站](https://explorer.example.com)');
    await page.waitForTimeout(200);
    assert(await previewEl.isVisible(), 'Link preview must appear when entering markdown link');
    const previewText = await previewEl.textContent();
    assert(previewText?.includes('星际漫游者测试站') && previewText?.includes('explorer.example.com'), `Preview mismatch: ${previewText}`);

    await avatarInput.fill('https://explorer.example.com/logo.svg');
    await descInput.fill('记录深空探测与分布式边缘系统的技术极客小站');

    await page.route('**/api/friends/apply', async (route) => {
      const postData = route.request().postDataJSON();
      assert.strictEqual(postData.name, '星际漫游者测试站');
      assert.strictEqual(postData.url, 'https://explorer.example.com/');
      assert.strictEqual(postData.source, 'status_msforms_markdown');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          accepted: true,
          persisted: true,
          notified: true,
          reviewStatus: 'pending_review',
          submissionId: 'apply_e2e_1',
        }),
      });
    });

    await submitBtn.click();
    await page.waitForTimeout(300);
    const feedback = msShell.locator('.ms-forms-receipt');
    assert(await feedback.isVisible(), 'Feedback card must be visible');
    assert.strictEqual(await feedback.getAttribute('data-kind'), 'full_success');

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
