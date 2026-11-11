import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PORT = 4395;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function createStaticServer(baseDir) {
  return http.createServer((req, res) => {
    try {
      const parsedUrl = new URL(req.url, BASE_URL);
      let pathname = decodeURIComponent(parsedUrl.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';

      let filePath = path.join(baseDir, pathname);

      if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath)) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(`404 Not Found: ${pathname}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(`500 Server Error: ${err.message}`);
    }
  });
}

async function run() {
  console.log('🚀 [Test Suite] 开始验证：页脚 footer-group 友链与各栏目 4 项对齐审计...');

  const server = createStaticServer(DIST_DIR);
  await new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });
  console.log(`📡 [Server] 本地静态服务启动于 ${BASE_URL}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });

    console.log(`🌐 [Step 1] 打开页面 ${BASE_URL}/ 并等待页脚加载...`);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const footerShell = await page.waitForSelector('.footer-main-shell', { timeout: 15000 });
    assert.ok(footerShell, '必须存在 .footer-main-shell 容器');

    const footerGrid = await page.waitForSelector('#site-footer-grid', { timeout: 15000 });
    assert.ok(footerGrid, '必须存在 #site-footer-grid 栅格容器');

    const customTextEl = await page.waitForSelector('.footer_custom_text', { timeout: 15000 });
    assert.ok(customTextEl, '必须存在 .footer_custom_text 宣言说明');
    const customTextContent = (await customTextEl.textContent())?.trim();
    console.log(`💬 [Step 1.5] 提取到页脚创新宣言文本: "${customTextContent}"`);
    assert.strictEqual(
      customTextContent,
      '以时代为画布，深潜细脉，广构通衢。在算法与速朽的喧嚣之外，把每一次构建都沉淀为自由生长的思想秩序。',
      '页脚宣言文本必须完全匹配新版创新文本'
    );
    console.log('  ✅ 页脚自定义创新宣言文本验证通过！');

    // 提取所有 footer-group 数据
    const groupsData = await page.evaluate(() => {
      const groups = Array.from(document.querySelectorAll('#site-footer-grid .footer-group'));
      return groups.map((g, idx) => {
        const title = g.querySelector('.footer-title')?.textContent?.trim() || '';
        const items = Array.from(g.querySelectorAll('.footer-links .footer-item')).map((a) => {
          const rect = a.getBoundingClientRect();
          return {
            label: a.textContent?.trim() || '',
            href: a.getAttribute('href') || '',
            title: a.getAttribute('title') || '',
            target: a.getAttribute('target') || null,
            rel: a.getAttribute('rel') || null,
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height,
          };
        });
        const groupRect = g.getBoundingClientRect();
        return {
          idx,
          title,
          count: items.length,
          items,
          rect: {
            top: groupRect.top,
            bottom: groupRect.bottom,
            height: groupRect.height,
            width: groupRect.width,
            left: groupRect.left,
            right: groupRect.right,
          },
        };
      });
    });

    console.log(`\n📊 [Step 2] 提取到 ${groupsData.length} 个页脚分组：`);
    groupsData.forEach((g) => {
      console.log(`  - 分组 [${g.title}] (${g.count}项): ${g.items.map((i) => i.label).join(' | ')}`);
    });

    // 断言 1: 总分组数必须为 5 (服务, 主题, 导航, 协议, 友链)
    assert.strictEqual(groupsData.length, 5, `页脚分组总数必须为 5，当前为 ${groupsData.length}`);

    // 断言 2: 每个分组的条目数必须严格为 4！实现“整体都变成4个进行对齐”
    for (const g of groupsData) {
      assert.strictEqual(
        g.count,
        4,
        `分组 [${g.title}] 的条目数必须严格为 4！实际为 ${g.count}（包含: ${g.items.map((i) => i.label).join(', ')}）`
      );
      console.log(`  ✅ [${g.title}] 严格包含 4 项，验证通过`);
    }

    // 断言 3: 友链分组内容严格符合用户要求: Epomail、Sonic、ECCP、EpoCanva
    const friendGroup = groupsData.find((g) => g.title === '友链');
    assert.ok(friendGroup, '必须存在 "友链" 分组');
    const friendLabels = friendGroup.items.map((i) => i.label);
    const expectedFriendLabels = ['Epomail', 'Sonic', 'ECCP', 'EpoCanva'];
    assert.deepStrictEqual(
      friendLabels,
      expectedFriendLabels,
      `友链分组必须精确展示为 [Epomail, Sonic, ECCP, EpoCanva]，实际为 [${friendLabels.join(', ')}]`
    );
    console.log('  ✅ 友链分组精确匹配 [Epomail, Sonic, ECCP, EpoCanva]');

    // 检查友链的 external 属性和外链配置
    const epomailItem = friendGroup.items.find((i) => i.label === 'Epomail');
    assert.strictEqual(epomailItem.href, 'https://mail.epocanvas.com', 'Epomail URL 正确指向 https://mail.epocanvas.com');
    assert.strictEqual(epomailItem.target, '_blank', 'Epomail 具有 target="_blank"');
    assert.strictEqual(epomailItem.rel, 'noreferrer', 'Epomail 具有 rel="noreferrer"');

    const sonicItem = friendGroup.items.find((i) => i.label === 'Sonic');
    assert.ok(sonicItem.href.includes('sonic.epocanvas.com'), 'Sonic URL 正确');
    assert.strictEqual(sonicItem.target, '_blank', 'Sonic 具有 target="_blank"');

    const eccpItem = friendGroup.items.find((i) => i.label === 'ECCP');
    assert.ok(eccpItem.href.includes('github.com/EpoCanvas-com/ECCP'), 'ECCP URL 正确');
    assert.strictEqual(eccpItem.target, '_blank', 'ECCP 具有 target="_blank"');

    const epoCanvaItem = friendGroup.items.find((i) => i.label === 'EpoCanva');
    assert.ok(epoCanvaItem.href.includes('epocanvas.com'), 'EpoCanva URL 正确');
    assert.strictEqual(epoCanvaItem.target, '_blank', 'EpoCanva 具有 target="_blank"');
    console.log('  ✅ 友链 4 项外链与在新窗口打开属性配置无误');

    // 断言 4: 检查服务、主题、导航、协议的内容
    const serviceGroup = groupsData.find((g) => g.title === '服务');
    assert.ok(serviceGroup, '必须存在 "服务" 分组');
    assert.deepStrictEqual(
      serviceGroup.items.map((i) => i.label),
      ['朋友圈', '留言板', '实验田', '赞赏支持'],
      '服务分组包含 4 大核心服务功能'
    );
    console.log('  ✅ 服务分组包含 [朋友圈, 留言板, 实验田, 赞赏支持]');

    const themeGroup = groupsData.find((g) => g.title === '主题');
    assert.ok(themeGroup, '必须存在 "主题" 分组');
    assert.deepStrictEqual(
      themeGroup.items.map((i) => i.label),
      ['关于本站', '专案路线', '工程标准', '版本规范'],
      '主题分组包含 4 大架构文档与规范'
    );
    console.log('  ✅ 主题分组包含 [关于本站, 专案路线, 工程标准, 版本规范]');

    const navGroup = groupsData.find((g) => g.title === '导航');
    assert.ok(navGroup, '必须存在 "导航" 分组');
    assert.deepStrictEqual(
      navGroup.items.map((i) => i.label),
      ['全站首页', '文章归档', '全部分类', '标签索引'],
      '导航分组包含 4 大核心文章与页面导航'
    );
    console.log('  ✅ 导航分组包含 [全站首页, 文章归档, 全部分类, 标签索引]');

    const policyGroup = groupsData.find((g) => g.title === '协议');
    assert.ok(policyGroup, '必须存在 "协议" 分组');
    assert.deepStrictEqual(
      policyGroup.items.map((i) => i.label),
      ['隐私说明', '使用条款', '版权说明', '社群政策'],
      '协议分组包含 4 大社区合规政策'
    );
    console.log('  ✅ 协议分组包含 [隐私说明, 使用条款, 版权说明, 社群政策]');

    // 断言 5: 几何与基线对齐度量 (Desktop 1440x900)
    console.log('\n📐 [Step 3] 审计桌面端 5 栏基线与几何对齐...');
    const heights = groupsData.map((g) => g.rect.height);
    const maxHeight = Math.max(...heights);
    const minHeight = Math.min(...heights);
    const heightDiff = maxHeight - minHeight;
    console.log(`  -> 各列高度分布: ${heights.map((h) => `${h.toFixed(1)}px`).join(', ')} (最大差异: ${heightDiff.toFixed(2)}px)`);
    assert.ok(heightDiff <= 2, `5 列高度必须完全一致（允许 <= 2px 亚像素误差），实际差异 ${heightDiff}px`);

    // 检查第 4 项 (最底下一项) 的底端坐标 Y
    const bottomYs = groupsData.map((g) => g.items[3].bottom);
    const maxBottom = Math.max(...bottomYs);
    const minBottom = Math.min(...bottomYs);
    const bottomDiff = maxBottom - minBottom;
    console.log(`  -> 最底部第 4 项 Bottom Y: ${bottomYs.map((y) => `${y.toFixed(1)}px`).join(', ')} (底端差异: ${bottomDiff.toFixed(2)}px)`);
    assert.ok(bottomDiff <= 2, `最底部第 4 项基线必须完美平齐（允许 <= 2px 亚像素误差），实际差异 ${bottomDiff}px`);
    console.log('  ✅ 桌面端 5 栏底部基线绝对平齐！');

    // 滚动至页脚并截图
    await page.evaluate(() => {
      document.querySelector('#footer')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    const screenshotDir = path.join(ROOT_DIR, 'scripts/audit_screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

    await page.screenshot({
      path: path.join(screenshotDir, 'footer_alignment_desktop.png'),
      fullPage: false,
    });
    console.log('  📸 桌面端页脚截图已落盘: scripts/audit_screenshots/footer_alignment_desktop.png');

    // 断言 6: 平板视口 (820x1180) 响应式审计
    console.log('\n📱 [Step 4] 审计平板视口 (820x1180)...');
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(300);
    const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(tabletOverflow <= 0, `平板视口不可产生水平横向溢出，实际溢出: ${tabletOverflow}px`);
    await page.screenshot({
      path: path.join(screenshotDir, 'footer_alignment_tablet.png'),
    });
    console.log('  📸 平板端页脚截图已落盘: scripts/audit_screenshots/footer_alignment_tablet.png');

    // 断言 7: 移动端视口 (390x844) 响应式审计
    console.log('\n📱 [Step 5] 审计移动端视口 (390x844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(mobileOverflow <= 0, `移动端视口不可产生水平横向溢出，实际溢出: ${mobileOverflow}px`);
    await page.screenshot({
      path: path.join(screenshotDir, 'footer_alignment_mobile.png'),
    });
    console.log('  📸 移动端页脚截图已落盘: scripts/audit_screenshots/footer_alignment_mobile.png');

    console.log('\n🎉 [Success] 页脚分组重构与 4 项绝对对齐验证 100% 全部通过！');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});
