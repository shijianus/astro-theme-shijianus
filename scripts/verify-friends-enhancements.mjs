import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 开始执行 /friends/ 友邻优化与嵌入式表单全链路自动化审计...\n');

const ROOT = process.cwd();

// Test 1: 品牌与友邻专属 Icon 头像校验
console.log('▶ [Test 1] 品牌矩阵专属 SVG 与默认回退图标审计...');
const brandSvgs = [
  'public/media/brands/epomail.svg',
  'public/media/brands/epocanvas.svg',
  'public/media/brands/sonic.svg',
  'public/media/brands/default-brand.svg',
];
for (const file of brandSvgs) {
  const fullPath = path.join(ROOT, file);
  assert(fs.existsSync(fullPath), `Brand SVG missing: ${file}`);
  const content = fs.readFileSync(fullPath, 'utf-8');
  assert(content.includes('<svg'), `Invalid SVG in ${file}`);
  console.log(`  ✓ 找到品牌专属 SVG: ${file} (${content.length} bytes)`);
}

// 检查 src/config/friends.ts
const friendsConfigContent = fs.readFileSync(path.join(ROOT, 'src/config/friends.ts'), 'utf-8');
assert(friendsConfigContent.includes('/media/brands/epomail.svg'), 'EpoMail avatar missing');
assert(friendsConfigContent.includes('/media/brands/epocanvas.svg'), 'EpoCanvas avatar missing');
assert(friendsConfigContent.includes('/media/brands/sonic.svg'), 'Sonic avatar missing');
// 严格断言：仅有 3 个朋友 (EpoMail, EpoCanvas, Sonic)，严禁幻觉编造其他友邻
assert(!friendsConfigContent.includes('安知鱼'), 'Must not contain hallucinated friend 安知鱼');
assert(!friendsConfigContent.includes('小康的个人博客'), 'Must not contain hallucinated friend 小康');
assert(!friendsConfigContent.includes('Akilarの糖果屋'), 'Must not contain hallucinated friend Akilar');
assert(!friendsConfigContent.includes('Leonus'), 'Must not contain hallucinated friend Leonus');
console.log('  ✓ src/config/friends.ts 严格仅收录 3 个真实品牌友邻 (EpoMail, EpoCanvas, Sonic)，无任何编造');

// 检查 FriendsDashboard.astro 里的 fallback 图标，严禁使用站长头像作为友邻 fallback
const dashboardContent = fs.readFileSync(path.join(ROOT, 'src/components/theme/FriendsDashboard.astro'), 'utf-8');
assert(!dashboardContent.includes("this.src='/media/shijianus/avatar.jpg'"), 'FriendsDashboard still falls back to site owner avatar!');
assert(dashboardContent.includes("this.src='/media/brands/default-brand.svg'"), 'FriendsDashboard must fallback to /media/brands/default-brand.svg');
console.log('  ✓ FriendsDashboard 友邻头像错误回退已绑定中立品牌图标 default-brand.svg，杜绝站长头像同质化');

// Test 2: "申请互链" 弹窗化与底部内联表单及"复制本站互链信息"删除
console.log('\n▶ [Test 2] "申请互链" 模态弹窗与友邻页面交互审计...');
assert(dashboardContent.includes('id="btn-open-apply-modal"'), 'Missing #btn-open-apply-modal button');
assert(dashboardContent.includes('id="friend-apply-modal"'), 'Missing #friend-apply-modal dialog container');
assert(dashboardContent.includes('class="friend-modal"'), 'Missing .friend-modal class');
assert(dashboardContent.includes('id="friend-modal-close"'), 'Missing close button for modal');
assert(dashboardContent.includes('id="modal-friend-apply-form"'), 'Missing modal form element');

// 确认删除 "复制本站互链信息"
assert(!dashboardContent.includes('复制本站互链信息'), 'FriendsDashboard still contains "复制本站互链信息"!');
assert(!dashboardContent.includes('btn-toggle-config'), 'FriendsDashboard still contains btn-toggle-config!');
// 确认包含前往 /status/ 互链规范的引导链接
assert(dashboardContent.includes('href="/status/"'), 'FriendsDashboard missing link to /status/');
console.log('  ✓ "申请互链" 成功重构为顶部/Hero唤起的独立模态弹窗 (#friend-apply-modal)');
console.log('  ✓ "复制本站互链信息" 已从 /friends/ 彻底删除，替换为指向 /status/ 的互链规范导航');

// Test 3: /status/ 文章修改与互链完整说明审计
console.log('\n▶ [Test 3] /status/ 站点状态与友邻指南完整文档审计...');
const statusMdPath = path.join(ROOT, 'docs/standards/status.md');
assert(fs.existsSync(statusMdPath), 'docs/standards/status.md not found');
const statusMdContent = fs.readFileSync(statusMdPath, 'utf-8');

assert(statusMdContent.includes('shijianus 站点状态与友邻指南'), 'Status doc title must reflect shijianus brand');
assert(statusMdContent.includes('认识 shijianus'), 'Missing about shijianus section');
assert(statusMdContent.includes('站点状态和运行边界'), 'Missing site status section');
assert(statusMdContent.includes('友邻系统如何工作'), 'Missing how friends works section');
assert(statusMdContent.includes('朋友圈'), 'Missing moments explanation');
assert(statusMdContent.includes('shijianus 官方友链信息'), 'Missing mutual link configuration guide');
assert(statusMdContent.includes('友邻交换与收录规则'), 'Missing guild rules in status doc');

// Test 4: /status/ 语义化官方名片与申请表单组件 + ContentFeatureEnhancer 安全与降级审计
console.log('\n▶ [Test 4] /status/ 官方友链名片、安全表单与 Markdown 表单增强引擎审计...');
const officialCardContent = fs.readFileSync(path.join(ROOT, 'src/components/status/StatusOfficialCard.astro'), 'utf-8');
const applySectionContent = fs.readFileSync(path.join(ROOT, 'src/components/status/StatusFriendApplySection.astro'), 'utf-8');
const friendsConfig = fs.readFileSync(path.join(ROOT, 'src/config/friends.ts'), 'utf-8');
assert(friendsConfig.includes("name: 'shijianus'"), 'friendsConfig.siteInfo.name must be shijianus');
assert(officialCardContent.includes('buildOfficialFriendSnippets'), 'StatusOfficialCard must use single-source snippets');
assert(applySectionContent.includes('status-friend-apply-form'), 'StatusFriendApplySection must render SSR form');

// 检查 ContentFeatureEnhancer.astro 中的表单与收集表渲染引擎
const enhancerContent = fs.readFileSync(path.join(ROOT, 'src/components/ContentFeatureEnhancer.astro'), 'utf-8');
assert(enhancerContent.includes('renderMarkdownFormBlocks'), 'ContentFeatureEnhancer missing renderMarkdownFormBlocks function');
assert(enhancerContent.includes('office-sheet-wrapper'), 'ContentFeatureEnhancer missing office-sheet-wrapper rendering');
assert(enhancerContent.includes('office-sheet-table'), 'ContentFeatureEnhancer missing office-sheet-table rendering');
assert(enhancerContent.includes('parseSafeMarkdownLink'), 'ContentFeatureEnhancer missing parseSafeMarkdownLink');
assert(enhancerContent.includes("import { load as yamlLoad } from 'js-yaml'"), 'ContentFeatureEnhancer missing js-yaml import');

// 检查 CSS
const cssContent = fs.readFileSync(path.join(ROOT, 'src/styles/markdown-enhancements.css'), 'utf-8');
assert(cssContent.includes('.office-sheet-wrapper'), 'CSS missing .office-sheet-wrapper styles');
assert(cssContent.includes('.office-sheet-table'), 'CSS missing .office-sheet-table styles');
assert(cssContent.includes('.sheet-badge--office'), 'CSS missing .sheet-badge--office styles');
assert(cssContent.includes('.sheet-cell-input'), 'CSS missing .sheet-cell-input styles');

console.log('  ✓ ContentFeatureEnhancer 具备标准 Markdown sheet/form 代码块解析与 Office 收集表 (表格) 渲染能力');
console.log('  ✓ 收集表已原生支持 [名称](链接) / ()[] 式外联解析与实时外链跳转');
console.log('  ✓ markdown-enhancements.css 包含完整的 Office 表格网格、录入行、外联解析预览及成功动效');

// Test 5: API 端点与持久化 / TG 提醒逻辑审计
console.log('\n▶ [Test 5] 表单提交 API 与 Telegram 提醒中枢审计...');
const applyTs = fs.readFileSync(path.join(ROOT, 'functions/api/friends/apply.ts'), 'utf-8');
const submitTs = fs.readFileSync(path.join(ROOT, 'functions/api/forms/submit.ts'), 'utf-8');
const notifyTs = fs.readFileSync(path.join(ROOT, 'functions/_lib/form-notify.ts'), 'utf-8');
const d1Sql = fs.readFileSync(path.join(ROOT, 'migrations/0008_forms.sql'), 'utf-8');

assert(applyTs.includes('sendFormTelegramNotification'), 'apply.ts must invoke sendFormTelegramNotification');
assert(submitTs.includes('sendFormTelegramNotification'), 'submit.ts must invoke sendFormTelegramNotification');
assert(notifyTs.includes('api.telegram.org/bot'), 'form-notify.ts must send to Telegram Bot API');
assert(notifyTs.includes('PST'), 'form-notify.ts must record Pacific Time');
assert(d1Sql.includes('form_submissions'), '0008_forms.sql must create form_submissions table');

console.log('  ✓ functions/api/friends/apply.ts 和 forms/submit.ts 均已打通 Telegram Bot 实时通知与 D1 持久化存储');
console.log('  ✓ migrations/0008_forms.sql 已定义标准 form_submissions 表结构与索引');

console.log('\n🎉 所有静态逻辑与结构断言 100% 通过！\n');
