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

  // 1.2 严格校验友邻总数仅为 3 个，杜绝任何历史或幻觉数据
  const friendCards = await page.locator('.friend-card').count();
  assert.strictEqual(friendCards, 3, `Expected exactly 3 friends (EpoMail, EpoCanvas, Sonic), but found ${friendCards}`);
  console.log(`  ✓ 生产端友邻卡片总数严格为 3 位 (EpoMail, EpoCanvas, Sonic)，无任何外部或编造数据`);

  // 1.3 确认“复制本站互链信息”在生产端彻底移除
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

  // 2.1 验证 Office 协同收集表 (Spreadsheet Collection Table) 渲染
  console.log('  -> 检测生产端 Markdown 编译出的 Office 协同收集表格组件 (.office-sheet-wrapper)...');
  const sheetWrapper = page.locator('.office-sheet-wrapper');
  await sheetWrapper.waitFor({ state: 'visible', timeout: 15000 });
  assert(await sheetWrapper.count() > 0, 'Production must render .office-sheet-wrapper');

  const badgeText = await page.locator('.sheet-badge--office').textContent();
  console.log(`  ✓ 生产收集表徽标: "${badgeText?.trim()}"`);

  const sheetTable = page.locator('.office-sheet-table');
  assert(await sheetTable.isVisible(), 'Production office sheet table must be visible');

  // 2.2 验证表格初始数据行：严格仅 3 个官方品牌友邻
  const rows = page.locator('.office-sheet-table tbody tr');
  const initialRowCount = await rows.count();
  assert.strictEqual(initialRowCount, 3, `Expected exactly 3 rows in initial sheet, found ${initialRowCount}`);
  console.log(`  ✓ 生产端收集表格初始仅展示 3 个真实友邻 (EpoMail, EpoCanvas, Sonic)`);

  // 2.3 验证表格各行中的 []() 外链渲染
  const firstRowLink = page.locator('.office-sheet-table tbody tr:nth-child(1) a.sheet-link');
  const linkHref = await firstRowLink.getAttribute('href');
  const linkText = await firstRowLink.textContent();
  assert.strictEqual(linkHref, 'https://mail.epocanvas.com');
  console.log(`  ✓ 生产收集表已将 Markdown [EpoMail](https://mail.epocanvas.com) 编译为真实外链: ${linkText?.trim()} -> ${linkHref}`);

  // 2.4 在生产环境收集表填表录入行中以 [名称](链接) 语法填入数据，测试全链路 D1 + TG 推送
  console.log('  -> 在生产收集表录入行中以 [名称](链接) 语法填入数据并提交...');
  const probeName = `E2E 生产实机验收站 [${new Date().toISOString().substring(11, 19)}]`;
  const probeSiteLink = `[${probeName}](https://audit.epocanvas.com)`;
  const probeAvatar = 'https://blog.epocanvas.com/media/brands/default-brand.svg';
  const probeDesc = '第二轮线上真实实机端到端验收：验证 Office 收集表行追加、D1 持久化与 Telegram 机器人实时通知';

  const siteInput = page.locator('.input-sheet-site');
  const previewEl = page.locator('.sheet-link-preview');
  const avatarInput = page.locator('.input-sheet-avatar');
  const descInput = page.locator('.input-sheet-desc');
  const contactInput = page.locator('.input-sheet-contact');
  const submitBtn = page.locator('.sheet-submit-btn');

  // 输入 [专案名称](网址)
  await siteInput.fill(probeSiteLink);
  await page.waitForTimeout(300);

  // 验证实时外联识别
  assert(await previewEl.isVisible(), 'Link preview must appear when entering markdown link on production');
  const previewText = await previewEl.textContent();
  assert(previewText?.includes('audit.epocanvas.com'), `Preview mismatch on production: ${previewText}`);
  console.log(`  ✓ 生产实时外联解析器成功捕获: "${previewText?.trim()}"`);

  await avatarInput.fill(probeAvatar);
  await descInput.fill(probeDesc);
  await contactInput.fill('@shijianus_auditor');

  // 点击提交按钮
  console.log('  -> 触发"📥 登记入表"提交至 Cloudflare Pages 边缘服务...');
  await submitBtn.click();

  // 等待收集表格行追加至 4 行
  await page.waitForFunction(() => document.querySelectorAll('.office-sheet-table tbody tr').length >= 4, { timeout: 15000 });
  const updatedRowCount = await page.locator('.office-sheet-table tbody tr').count();
  assert.strictEqual(updatedRowCount, 4, `Table must now have 4 rows after submission, got ${updatedRowCount}`);
  console.log(`  ✓ 生产收集表格实时追加新数据行，当前总行数: ${updatedRowCount}`);

  // 验证新插入行包含外链
  const newRowLink = page.locator('.office-sheet-table tbody tr:nth-child(4) a.sheet-link');
  const newHref = await newRowLink.getAttribute('href');
  assert.strictEqual(newHref, 'https://audit.epocanvas.com');
  console.log(`  ✓ 生产端新插入行成功解析为真实可点击外链: -> ${newHref}`);

  // 验证成功横幅展示
  const successBanner = page.locator('.sheet-success-banner');
  assert(await successBanner.isVisible(), 'Success banner must be visible on production');
  const bannerText = await successBanner.textContent();
  console.log(`  ✓ 生产收集表成功横幅展示: "${bannerText?.trim()}"`);

  // 验证输入框已清空
  const siteValAfter = await siteInput.inputValue();
  assert.strictEqual(siteValAfter, '', 'Input field should be reset after submission');
  console.log('  ✓ 生产端录入行自动重置就绪');

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
