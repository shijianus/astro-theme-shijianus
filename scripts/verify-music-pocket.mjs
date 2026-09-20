import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 4323;
const BASE_URL = `http://localhost:${PORT}`;
const DIST_DIR = path.resolve('dist');

function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.flac': 'audio/flac',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];

    // 针对 /api/music/playlist 模拟接口
    if (reqUrl === '/api/music/playlist') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        count: 3,
        tracks: [
          {
            id: 'local-way-back-home',
            name: 'Way Back Home',
            artist: 'SHAUN (숀)',
            album: 'Take',
            source: 'local',
            coverUrl: '/media/audio/covers/way_back_home.jpg'
          },
          {
            id: 'local-kanojo',
            name: '彼女は旅に出る',
            artist: '三月のパンタシア',
            album: 'ガールズブルー・ハッピーエンド',
            source: 'local',
            coverUrl: '/media/audio/covers/kanojo_wa_tabi_ni_deru.jpg'
          }
        ]
      }));
      return;
    }

    let filePath = path.join(distDir, reqUrl);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function main() {
  console.log('--- 启动本地静态预览服务验证音乐随身听组件 ---');
  const server = await createStaticServer(DIST_DIR, PORT);
  console.log(`预览服务运行于: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    console.log(`\n1. 访问首页: ${BASE_URL}`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // 验证 1: 默认隐藏判定 (用户核心要求：默认隐藏)
    console.log('\n2. 验证默认隐藏规则:');
    const pocketDefault = await page.$('.shijianus-music-pocket');
    const isVisibleDefault = pocketDefault ? await pocketDefault.isVisible() : false;
    console.log(`- 页面初始加载时音乐随身听可见性: ${isVisibleDefault} (期望: false - 默认隐藏)`);
    if (isVisibleDefault) {
      throw new Error('Music Pocket should be hidden by default!');
    }
    console.log('✓ 默认隐藏验证通过！');

    // 验证 2: #rightside-config-show 中是否存在管理按钮
    console.log('\n3. 验证 #rightside-config-show 中管理按键:');
    const toggleBtn = await page.$('#rightside-config-show #toggle-music-pocket');
    if (!toggleBtn) {
      throw new Error('Missing #toggle-music-pocket button in #rightside-config-show!');
    }
    const btnTitle = await toggleBtn.getAttribute('title');
    console.log(`- 管理按钮 title: "${btnTitle}"`);
    console.log('✓ #rightside-config-show 管理按钮存在并配置完好！');

    // 验证 3: 点击管理按键切换显示
    console.log('\n4. 点击管理按键激活随身音乐口袋:');
    await toggleBtn.click();
    await page.waitForTimeout(600);

    const pocketActivated = await page.$('.shijianus-music-pocket');
    const isVisibleAfterToggle = pocketActivated ? await pocketActivated.isVisible() : false;
    console.log(`- 点击后音乐随身听可见性: ${isVisibleAfterToggle} (期望: true)`);
    if (!isVisibleAfterToggle) {
      throw new Error('Music Pocket should be visible after clicking rightside toggle button!');
    }
    console.log('✓ 管理按钮成功唤出音乐口袋！');

    // 验证 4: 可拖动 (Draggable) 交互验证
    console.log('\n5. 验证拖拽 (Draggable Button) 交互:');
    const toggleDisc = await page.$('.shijianus-music-pocket__toggle');
    if (!toggleDisc) throw new Error('Toggle disc element not found');

    const initialBox = await toggleDisc.boundingBox();
    console.log(`- 初始坐标: x=${initialBox.x.toFixed(1)}, y=${initialBox.y.toFixed(1)}`);

    // 执行真实指针拖动 (移动 120px)
    await page.mouse.move(initialBox.x + 20, initialBox.y + 20);
    await page.mouse.down();
    await page.mouse.move(initialBox.x + 140, initialBox.y - 100, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(400);

    const draggedBox = await toggleDisc.boundingBox();
    console.log(`- 拖拽后坐标: x=${draggedBox.x.toFixed(1)}, y=${draggedBox.y.toFixed(1)}`);
    const movedDistance = Math.hypot(draggedBox.x - initialBox.x, draggedBox.y - initialBox.y);
    console.log(`- 实际位移距离: ${movedDistance.toFixed(1)}px (期望 > 40px)`);
    if (movedDistance < 40) {
      throw new Error('Draggable button failed to move!');
    }

    // 确认拖动结束时防误触机制：面板依然保持收起，未被误触展开
    let panel = await page.$('.shijianus-music-pocket__panel');
    console.log(`- 拖拽后面板是否意外展开: ${panel !== null} (期望: false，防误触生效)`);
    if (panel !== null) {
      throw new Error('Drag action accidentally triggered panel expansion!');
    }
    console.log('✓ 拖拽位移正常且成功阻断点击展开误触！');

    // 验证 5: 真实点击展开特色面板
    console.log('\n6. 验证点击展开特色面板 (.shijianus-music-pocket__panel):');
    await toggleDisc.click();
    await page.waitForTimeout(500);

    panel = await page.$('.shijianus-music-pocket__panel');
    if (!panel || !(await panel.isVisible())) {
      throw new Error('Music pocket panel did not open on click!');
    }
    console.log('✓ 面板成功展开！');

    // 验证 6: Cyber-Vintage HUD 顶栏与 16-Band 频谱柱特色元素
    console.log('\n7. 验证特色 HUD 顶栏与声波频谱柱:');
    const hudLabel = await page.$eval('.shijianus-music-pocket__hud-head .hud-label', (el) => el.textContent);
    const hudBadge = await page.$eval('.shijianus-music-pocket__hud-head .hud-badge', (el) => el.textContent);
    console.log(`- HUD 标识: ${hudLabel}, 码率徽标: ${hudBadge}`);

    const spectrumBarsCount = await page.$$eval('.shijianus-music-pocket__visualizer .spectrum-bar', (els) => els.length);
    console.log(`- 16-Band 频谱柱数量: ${spectrumBarsCount} (期望: 16)`);
    if (spectrumBarsCount !== 16) {
      throw new Error(`Expected 16 spectrum bars, got ${spectrumBarsCount}`);
    }

    // 验证黑胶唱片
    const bigDisc = await page.$('.shijianus-music-pocket__big-disc');
    if (!bigDisc) throw new Error('Missing big vinyl disc in deck showcase!');
    console.log('✓ 黑胶唱机与 16-Band 霓虹频谱柱渲染完好！');

    // 验证 7: 切换到探索与点歌台
    console.log('\n8. 验证探索与点歌台交互:');
    const searchTab = await page.$('.shijianus-music-pocket__tab:nth-child(2)');
    await searchTab.click();
    await page.waitForTimeout(300);

    const tagPills = await page.$$eval('.shijianus-music-pocket__tag-pill', (els) => els.map((e) => e.textContent.trim()));
    console.log(`- 探索灵感胶囊: ${tagPills.slice(0, 5).join(' / ')} ...`);
    const searchInput = await page.$('.shijianus-music-pocket__input');
    if (!searchInput) throw new Error('Search input missing');
    console.log('✓ 探索与点歌台选项卡运转正常！');

    // 验证 8: 关闭/隐藏功能
    console.log('\n9. 验证完全隐藏功能与右侧栏同步:');
    const closeHudBtn = await page.$('.shijianus-music-pocket__hud-btn--close');
    await closeHudBtn.click();
    await page.waitForTimeout(500);

    const pocketPostHide = await page.$('.shijianus-music-pocket');
    const isVisiblePostHide = pocketPostHide ? await pocketPostHide.isVisible() : false;
    console.log(`- 关闭后随身音乐口袋可见性: ${isVisiblePostHide} (期望: false)`);
    if (isVisiblePostHide) {
      throw new Error('Music Pocket should be hidden after closing from HUD button!');
    }

    console.log('\n🎉 所有端到端 Playwright 测试全部通过！');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('测试失败:', err);
  process.exit(1);
});
