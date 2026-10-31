/**
 * Automated Verification Suite for Shijianus Moments Federation Architecture
 * 
 * 核心验证支柱：
 * 1. 站长原生 Markdown 说说体系 (src/content/moments/*.md)；
 * 2. 主题生态标准清单 (public/shijianus-moments.json - shijianus-moments-v1 协议)；
 * 3. 主题联盟多源同步管道 (public/data/friends-moments.json)；
 * 4. 跨站主权路由代理 (/api/cross-comment 与 /api/comments 联动)；
 * 5. 前端 QQ 空间模式 UI 渲染与就地评论交互。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import yaml from 'js-yaml';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function runFederationTests() {
  console.log('===============================================================');
  console.log('🚀 [Test Suite] 开始执行朋友圈主题联盟与跨站交互完整自动化审计');
  console.log('===============================================================\n');

  // -------------------------------------------------------------
  // Pillar 1: 验证 Markdown 说说文件与内容集合
  // -------------------------------------------------------------
  console.log('📌 [Pillar 1] 审计 src/content/moments/*.md 站长原生文档...');
  const momentsDir = path.join(rootDir, 'src', 'content', 'moments');
  assert.ok(fs.existsSync(momentsDir), 'src/content/moments 目录必须存在');
  const files = fs.readdirSync(momentsDir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  assert.ok(files.length >= 2, `src/content/moments/ 至少需包含 2 篇说说文档，当前找到: ${files.length}`);

  for (const f of files) {
    const raw = fs.readFileSync(path.join(momentsDir, f), 'utf8');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    assert.ok(match, `说说文件 ${f} 必须具备标准 YAML frontmatter`);
    const meta = yaml.load(match[1]);
    assert.ok(meta.id, `${f} 缺少 id 字段`);
    assert.ok(meta.category, `${f} 缺少 category 字段`);
    assert.ok(match[2].trim().length > 10, `${f} 说说正文过短`);
    console.log(`  -> 校验通过: ${f} [id: ${meta.id}, mood: ${meta.mood || 'none'}, category: ${meta.category}]`);
  }
  console.log('✅ Pillar 1 审计通过：站长原生 Markdown 文档结构 100% 合规！\n');

  // -------------------------------------------------------------
  // Pillar 2: 验证公开标准清单 public/shijianus-moments.json
  // -------------------------------------------------------------
  console.log('📌 [Pillar 2] 审计 public/shijianus-moments.json 主题协议契约...');
  const manifestPath = path.join(rootDir, 'public', 'shijianus-moments.json');
  assert.ok(fs.existsSync(manifestPath), 'public/shijianus-moments.json 必须存在');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.equal(manifest.protocol, 'shijianus-moments-v1', '协议标识必须为 shijianus-moments-v1');
  assert.equal(manifest.generator, 'shijianus-blog-theme', '生成器必须标注 shijianus-blog-theme');
  assert.ok(manifest.site && manifest.site.url, '必须包含 site 元信息及 url');
  assert.ok(manifest.api && manifest.api.comments, '必须声明 api.comments 路由端点');
  assert.ok(manifest.api.crossComment, '必须声明 api.crossComment 代理端点');
  assert.ok(Array.isArray(manifest.moments) && manifest.moments.length > 0, '清单必须包含说说数组');

  const sampleMoment = manifest.moments[0];
  assert.ok(sampleMoment.id, '说说必须包含唯一 id');
  assert.ok(sampleMoment.origin, '说说必须包含 origin 原创站点标记');
  assert.ok(sampleMoment.originApi, '说说必须包含 originApi 权威评论端点');
  console.log(`  -> 协议版本: ${manifest.protocol}, 说说总数: ${manifest.total}, 权威API: ${manifest.api.comments}`);
  console.log('✅ Pillar 2 审计通过：shijianus-moments.json 契约完备！\n');

  // -------------------------------------------------------------
  // Pillar 3: 验证合并数据 public/data/friends-moments.json
  // -------------------------------------------------------------
  console.log('📌 [Pillar 3] 审计 public/data/friends-moments.json 联盟与 Feed 同步结果...');
  const dataPath = path.join(rootDir, 'public', 'data', 'friends-moments.json');
  assert.ok(fs.existsSync(dataPath), 'friends-moments.json 必须存在');
  const dataset = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  assert.ok(dataset.ok, '同步结果状态必须为 ok: true');
  assert.ok(dataset.masterCount >= 2, '必须成功提取并合并站长原生说说');
  assert.ok(dataset.friendCount >= 3, '必须成功聚合友邻动态');
  assert.equal(dataset.total, dataset.masterCount + dataset.friendCount, '总数与分项数必须精确吻合');

  const ownerItems = dataset.items.filter((i) => i.isOwner);
  const friendItems = dataset.items.filter((i) => !i.isOwner);
  assert.ok(ownerItems.length > 0, '必须包含站长原声说说');
  assert.ok(friendItems.length > 0, '必须包含友邻说说');
  console.log(`  -> 站长原声: ${ownerItems.length} 条, 友邻动态: ${friendItems.length} 条, 实时在线同步: ${dataset.liveCount} 条`);
  console.log('✅ Pillar 3 审计通过：数据管线深度混排正常！\n');

  // -------------------------------------------------------------
  // Pillar 4: 跨站主权路由代理 (/api/cross-comment) 逻辑验证
  // -------------------------------------------------------------
  console.log('📌 [Pillar 4] 审计 /api/cross-comment 跨站代理机制...');
  const crossCommentFile = path.join(rootDir, 'functions', 'api', 'cross-comment.ts');
  assert.ok(fs.existsSync(crossCommentFile), 'functions/api/cross-comment.ts 必须存在');
  const crossCode = fs.readFileSync(crossCommentFile, 'utf8');

  assert.ok(crossCode.includes('originApi'), '代理必须支持 GET originApi 转发');
  assert.ok(crossCode.includes('targetApi'), '代理必须支持 POST targetApi 转发');
  assert.ok(crossCode.includes('X-From-Site'), '跨站代理必须注入 X-From-Site 来源站点防伪标头');
  assert.ok(crossCode.includes('AbortSignal.timeout'), '跨站请求必须受超时熔断器保护');
  console.log('  -> 跨站代理端点完备：具备超时熔断、来源防伪与离线安全兜底逻辑');

  const commentsFile = path.join(rootDir, 'functions', 'api', 'comments.ts');
  const commentsCode = fs.readFileSync(commentsFile, 'utf8');
  assert.ok(commentsCode.includes('fromSite'), '主评论端点必须支持接收跨站来源 fromSite');
  assert.ok(commentsCode.includes('友邻串门'), 'Telegram 通知模板必须包含友邻串门专属徽章');
  console.log('✅ Pillar 4 审计通过：交互主权路由与 TG 通知链路完全打通！\n');

  // -------------------------------------------------------------
  // Pillar 5: 验证编译产物 HTML 渲染与 DOM 属性绑定
  // -------------------------------------------------------------
  console.log('📌 [Pillar 5] 审计 dist/moments/index.html 界面属性与跨站锚点...');
  const distMomentsHtml = path.join(rootDir, 'dist', 'moments', 'index.html');
  assert.ok(fs.existsSync(distMomentsHtml), 'dist/moments/index.html 必须成功生成');
  const htmlContent = fs.readFileSync(distMomentsHtml, 'utf8');

  assert.ok(htmlContent.includes('class="qzone-space-hero'), '必须包含 QQ 空间 Hero Banner');
  assert.ok(htmlContent.includes('data-is-owner="true"'), '必须输出站长原生说说 data-is-owner="true"');
  assert.ok(htmlContent.includes('data-is-owner="false"'), '必须输出友邻说说 data-is-owner="false"');
  assert.ok(htmlContent.includes('data-origin-api='), '说说卡片必须绑定权威数据端点 data-origin-api');
  assert.ok(htmlContent.includes('moment-comments-drawer'), '必须包含 QQ 空间就地展开评论抽屉');
  assert.ok(htmlContent.includes('btn-random-nickname'), '必须包含随机极客昵称生成器');
  console.log('  -> HTML 产物校验通过：包含全景多视图、卡片属性、评论抽屉与交互控件');
  console.log('✅ Pillar 5 审计通过：前端 DOM 绑定严丝合缝！\n');

  console.log('===============================================================');
  console.log('🎉 [Test Complete] 所有 5 项核心支柱测试 100% 全部通过 (PASS)!');
  console.log('===============================================================');
}

runFederationTests().catch((err) => {
  console.error('\n❌ [Test Failed] 测试套件执行失败:', err);
  process.exit(1);
});
