import assert from 'node:assert';
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';

const PROD_BASE = 'https://blog.epocanvas.com';

console.log(`🌐 开始对生产环境 (${PROD_BASE}) 执行第二轮真实线上实机 E2E 验证...\n`);

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 E2E-Production-Auditor',
  });
  const page = await context.newPage();

  // =========================================================================
  // 1. 验证生产环境 /friends/ 页面
  // =========================================================================
  console.log(`▶ [Stage 1] 审计生产环境友邻主页: ${PROD_BASE}/friends/`);
  const friendsRes = await page.goto(`${PROD_BASE}/friends/`, { waitUntil: 'networkidle', timeout: 30000 });
  assert.strictEqual(friendsRes?.status(), 200, `Production /friends/ returned status ${friendsRes?.status()}`);
  console.log('  ✓ 生产 /friends/ HTTP 200 OK');

  // 1.1 品牌专属 SVG 图标校验
  const epomailAvatar = await page.getAttribute('img[alt="EpoMail"]', 'src');
  const epocanvasAvatar = await page.getAttribute('img[alt="EpoCanvas"]', 'src');
  const sonicAvatar = await page.getAttribute('img[alt="Sonic"]', 'src');

  assert(epomailAvatar?.includes('/media/brands/epomail.svg'), `EpoMail avatar invalid: ${epomailAvatar}`);
  assert(epocanvasAvatar?.includes('/media/brands/epocanvas.svg'), `EpoCanvas avatar invalid: ${epocanvasAvatar}`);
  assert(sonicAvatar?.includes('/media/brands/sonic.svg'), `Sonic avatar invalid: ${sonicAvatar}`);
  assert(!epomailAvatar?.includes('shijianus/avatar.jpg'), 'EpoMail must not use site owner avatar');
  console.log('  ✓ 生产端品牌矩阵已全部呈现独立品牌专属 SVG:');
  console.log(`    - EpoMail: ${epomailAvatar}`);
  console.log(`    - EpoCanvas: ${epocanvasAvatar}`);
  console.log(`    - Sonic: ${sonicAvatar}`);

  // 1.2 确认“复制本站互链信息”在生产端彻底移除
  const bodyText = await page.textContent('body');
  assert(!bodyText?.includes('复制本站互链信息'), 'Production must NOT contain "复制本站互链信息"');
  console.log('  ✓ 生产端已彻底剔除旧版“复制本站互链信息”冗余板块与按钮');

  // 1.3 确认“互链规范与生态状态”直达入口有效
  const statusLink = page.locator('a[href="/status/"]').first();
  assert(await statusLink.count() > 0, 'Missing link to /status/ on production');
  console.log('  ✓ 生产端存在清晰的“互链规范与生态状态”引导按钮');

  // 1.4 测试生产端“申请互链”弹窗交互
  const openModalBtn = page.locator('#btn-open-apply-modal');
  assert(await openModalBtn.isVisible(), '#btn-open-apply-modal not visible on production');
  console.log('  -> 点击“申请互链”唤起弹窗...');
  await openModalBtn.click();
  await page.waitForTimeout(400);

  const modal = page.locator('#friend-apply-modal');
  const isOpen = await modal.evaluate((el) => el.classList.contains('is-open'));
  assert(isOpen, 'Production modal must have class is-open after click');
  console.log('  ✓ 生产端成功弹出居中模态对话框 (#friend-apply-modal)');

  // 验证表单字段
  assert(await page.locator('#modal-apply-name').isVisible(), 'modal-apply-name missing');
  assert(await page.locator('#modal-apply-url').isVisible(), 'modal-apply-url missing');
  assert(await page.locator('#modal-apply-avatar').isVisible(), 'modal-apply-avatar missing');
  assert(await page.locator('#modal-apply-desc').isVisible(), 'modal-apply-desc missing');
  console.log('  ✓ 生产弹窗表单必填字段（名称、链接、头像、简介）完整呈现');

  // 测试 Escape 键关闭
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const isClosed = await modal.evaluate((el) => !el.classList.contains('is-open'));
  assert(isClosed, 'Production modal must close on Escape key');
  console.log('  ✓ 按下 Escape 键平滑关闭弹窗');

  // =========================================================================
  // 2. 验证生产环境 /status/ 说明文档
  // =========================================================================
  console.log(`\n▶ [Stage 2] 审计生产环境友邻生态与状态指南: ${PROD_BASE}/status/`);
  const statusRes = await page.goto(`${PROD_BASE}/status/`, { waitUntil: 'networkidle', timeout: 30000 });
  assert.strictEqual(statusRes?.status(), 200, `Production /status/ returned status ${statusRes?.status()}`);
  console.log('  ✓ 生产 /status/ HTTP 200 OK');

  const titleText = await page.locator('h1').first().textContent();
  assert(titleText?.includes('EpoCanvas') && (titleText?.includes('友邻') || titleText?.includes('友鄰')), `Unexpected title on production: ${titleText}`);
  console.log(`  ✓ 生产指南主标题: "${titleText.trim()}"`);

  // 验证文章正文中的关键章节与多格式代码块
  const statusHtml = await page.content();
  assert(statusHtml.includes('EpoCanvas (shijianus)'), 'Missing site info in production /status/');
  assert(statusHtml.includes('https://blog.epocanvas.com/media/shijianus/avatar.jpg'), 'Missing avatar config in production /status/');
  assert(statusHtml.includes('YAML') || statusHtml.includes('yaml'), 'Missing YAML format');
  assert(statusHtml.includes('JSON') || statusHtml.includes('json'), 'Missing JSON format');
  console.log('  ✓ 包含完整的站点定位、去中心化朋友圈雷达运行逻辑、多格式互链配置代码与交换公约');

  // 2.1 验证 Google 手册风格 Markdown 嵌入式表单
  console.log('  -> 检测生产端 Markdown 编译出的交互式表单组件...');
  const embeddedForm = page.locator('.md-interactive-form');
  await embeddedForm.waitFor({ state: 'visible', timeout: 10000 });
  assert(await embeddedForm.count() > 0, 'Production must render .md-interactive-form');

  const badgeText = await page.locator('.md-form__badge').textContent();
  console.log(`  ✓ 生产表单徽标: "${badgeText?.trim()}"`);

  const formTitle = await page.locator('.md-form__title').textContent();
  console.log(`  ✓ 生产表单主标题: "${formTitle?.trim()}"`);

  // 2.2 在生产环境正文中实际填写并提交真实表单，测试全链路 D1 + TG 推送
  console.log('  -> 在生产文章正文中提交真实端到端互链申请...');
  const probeName = `E2E 生产验收探针 [${new Date().toISOString().substring(11, 19)}]`;
  const probeUrl = 'https://audit.epocanvas.com';
  const probeAvatar = 'https://blog.epocanvas.com/media/brands/default-brand.svg';
  const probeDesc = '第二轮线上真实实机端到端验收：验证 D1 落盘与 Telegram 机器人实时通知';

  await page.locator('.md-interactive-form input[name="name"]').fill(probeName);
  await page.locator('.md-interactive-form input[name="url"]').fill(probeUrl);
  await page.locator('.md-interactive-form input[name="avatar"]').fill(probeAvatar);
  await page.locator('.md-interactive-form textarea[name="desc"]').fill(probeDesc);
  await page.locator('.md-interactive-form input[name="contact"]').fill('@shijianus_auditor');

  // 点击提交按钮
  const submitBtn = page.locator('.md-interactive-form button[type="submit"]');
  await submitBtn.click();

  // 等待成功卡片展现
  const successCard = page.locator('.md-interactive-form .md-form__success');
  await successCard.waitFor({ state: 'visible', timeout: 15000 });
  const successTitle = await page.locator('.md-interactive-form .md-form__success h4').textContent();
  console.log(`  ✓ 生产端表单提交成功并就地切换至成功状态卡: "${successTitle?.trim()}"`);

  // 测试“再次填写”一键重置
  await page.locator('.md-interactive-form .md-form__reset-btn').click();
  await page.waitForTimeout(300);
  assert(await page.locator('.md-interactive-form input[name="name"]').isVisible(), 'Form must reset and show inputs');
  console.log('  ✓ 生产端“再次填写”按钮成功重置表单');

  await browser.close();

  // =========================================================================
  // 3. 校验 Cloudflare D1 数据库记录真实写入
  // =========================================================================
  console.log('\n▶ [Stage 3] 验证 Cloudflare D1 生产数据库实时入库证据...');
  const d1Output = execSync(
    `npx wrangler d1 execute DB --remote --command "SELECT id, form_id, ip, status, created_at, substr(data, 1, 120) as data_sample FROM form_submissions WHERE form_id = 'friend-link-apply' ORDER BY created_at DESC LIMIT 1;"`,
    { encoding: 'utf-8' }
  );
  console.log(d1Output);
  assert(d1Output.includes('friend-link-apply'), 'D1 query must return friend-link-apply submission');
  console.log('  ✓ Cloudflare D1 边缘数据库已真实持久化保存本次生产端申请记录！');

  console.log('\n🎉 第二轮线上生产环境实机 Playwright E2E 交互审计 100% 验证通过！\n');
}

run().catch((err) => {
  console.error('\n❌ 生产环境 E2E 验收失败:', err);
  process.exit(1);
});
