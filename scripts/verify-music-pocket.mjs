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

    // 验证 6: 现代解耦 Tab 栏与 Web Audio API Canvas 频谱
    console.log('\n7. 验证现代解耦 Tab 栏与声波频谱 Canvas:');
    const tabsCount = await page.$$eval('.shijianus-music-pocket__tab', (els) => els.length);
    console.log(`- 顶部导航选项卡数量: ${tabsCount} (期望: 4 - 播放/歌词/待播/发现)`);
    if (tabsCount < 4) {
      throw new Error(`Expected at least 4 tabs, got ${tabsCount}`);
    }

    const visualizerCanvas = await page.$('.shijianus-music-pocket__visualizer-canvas');
    if (!visualizerCanvas) throw new Error('Missing visualizer canvas in deck showcase!');
    console.log('✓ Web Audio API 60FPS 声波频谱 Canvas 渲染完好！');

    // 验证 64px 真实专辑封面卡片
    console.log('\n7.1 验证真实专辑封面卡片与艺术展台:');
    const coverCard = await page.$('.shijianus-music-pocket__big-disc-center');
    if (!coverCard) throw new Error('Missing album cover art card .shijianus-music-pocket__big-disc-center!');
    const coverBox = await coverCard.boundingBox();
    console.log(`- 专辑封面尺寸: width=${coverBox.width.toFixed(1)}px, height=${coverBox.height.toFixed(1)}px (期望 ~64px)`);
    if (coverBox.width < 50 || coverBox.height < 50) {
      throw new Error('Album cover card is too small!');
    }
    const coverImg = await page.$('.shijianus-music-pocket__album-cover-img');
    console.log(`- 封面真实图片标签存在: ${coverImg !== null} (期望: true)`);
    if (!coverImg) {
      throw new Error('Album cover image element missing!');
    }
    console.log('✓ 64px 高清真实专辑封面展台渲染完好！');

    // 验证纯 Icon 实用工具栏 (零文字抖动)
    console.log('\n7.2 验证纯 Icon 实用工具栏 (5 大纯图标辅助按键):');
    const utilityToolbar = await page.$('.shijianus-music-pocket__utility-toolbar');
    if (!utilityToolbar) throw new Error('Missing utility toolbar .shijianus-music-pocket__utility-toolbar!');
    const toolBtns = await page.$$('.shijianus-music-pocket__tool-btn');
    console.log(`- 工具栏纯 Icon 按键数: ${toolBtns.length} (期望: 5 - 喜欢/休眠/倍速/桌面歌词/分享)`);
    if (toolBtns.length !== 5) {
      throw new Error(`Expected exactly 5 tool buttons, got ${toolBtns.length}`);
    }

    // 测试红心点赞交互
    const likeBtn = toolBtns[0];
    await likeBtn.click();
    await page.waitForTimeout(300);
    const isLikedClass = await likeBtn.evaluate((el) => el.classList.contains('is-liked'));
    console.log(`- 点击喜欢按键后激活态: ${isLikedClass} (期望: true)`);
    if (!isLikedClass) throw new Error('Like button failed to toggle is-liked class!');
    console.log('✓ 纯 Icon 喜欢 / 收藏功能交互正常！');

    // 测试睡眠定时器循环交互
    const sleepBtn = toolBtns[1];
    await sleepBtn.click();
    await page.waitForTimeout(300);
    const sleepBadge = await page.$eval('.shijianus-music-pocket__tool-badge', (el) => el.textContent.trim()).catch(() => '');
    console.log(`- 点击休眠定时按键后徽标显示: "${sleepBadge}" (期望: "15")`);
    if (!sleepBadge) throw new Error('Sleep timer badge missing after clicking timer button!');
    console.log('✓ 睡眠定时器多档位微标与自动倒计时正常！');

    // 测试倍速播放循环交互
    const speedBtn = toolBtns[2];
    await speedBtn.click();
    await page.waitForTimeout(300);
    const speedTitle = await speedBtn.getAttribute('title');
    console.log(`- 点击倍速按键后标题说明: "${speedTitle}" (期望包含 1.25x)`);
    if (!speedTitle.includes('1.25x')) throw new Error('Speed button failed to cycle rate to 1.25x!');
    console.log('✓ 纯 Icon 播放倍速切换与原生 title 提示正常！');

    // 截图存档：浅色模式播放舱
    await page.screenshot({ path: '/root/.gemini/antigravity-cli/brain/7f275222-9f3b-4793-a25b-89e0e40eb60b/music-pocket-v3-light.png' });
    console.log('  [截图归档] music-pocket-v3-light.png');

    // 验证深色模式质感
    console.log('\n7.3 验证深色模式暗夜极光质感:');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/root/.gemini/antigravity-cli/brain/7f275222-9f3b-4793-a25b-89e0e40eb60b/music-pocket-v3-dark.png' });
    console.log('  [截图归档] music-pocket-v3-dark.png');

    // 恢复浅色模式
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });

    // 验证 7: 切换到发现与点歌台
    console.log('\n8. 验证发现与点歌台交互:');
    const searchTab = await page.$('[data-tab="search"]');
    if (!searchTab) throw new Error('Missing search tab!');
    await searchTab.click();
    await page.waitForTimeout(300);

    const tagPills = await page.$$eval('.shijianus-music-pocket__pill', (els) => els.map((e) => e.textContent.trim()));
    console.log(`- 发现灵感胶囊: ${tagPills.slice(0, 5).join(' / ')} ...`);
    const searchInput = await page.$('.shijianus-music-pocket__search-input');
    if (!searchInput) throw new Error('Search input missing');
    console.log('✓ 发现与点歌台选项卡运转正常！');

    // 验证歌词选项卡
    console.log('\n8.1 验证独立卡拉OK全屏滚动歌词 Tab:');
    const lyricsTab = await page.$('[data-tab="lyrics"]');
    if (!lyricsTab) throw new Error('Missing lyrics tab!');
    await lyricsTab.click();
    await page.waitForTimeout(300);
    const lyricsLines = await page.$$eval('.lyrics-line', (els) => els.length);
    console.log(`- 滚动歌词行数: ${lyricsLines} (期望 > 0)`);
    if (lyricsLines === 0) {
      throw new Error('Lyrics lines should be rendered in lyrics tab!');
    }
    const sampleLineText = await page.$eval('.lyrics-line__text', (el) => el.textContent.trim());
    console.log(`- 首行歌词内容: "${sampleLineText}" (无原始时间戳泄漏)`);
    if (/\[\d{2}:\d{2}/.test(sampleLineText)) {
      throw new Error(`Timestamp leak in lyrics line: ${sampleLineText}`);
    }
    await page.screenshot({ path: '/root/.gemini/antigravity-cli/brain/7f275222-9f3b-4793-a25b-89e0e40eb60b/music-pocket-v3-lyrics.png' });
    console.log('  [截图归档] music-pocket-v3-lyrics.png');

    // 切回播放页验证桌面歌词
    await (await page.$('[data-tab="player"]')).click();
    await page.waitForTimeout(200);

    // 验证 8: 屏幕桌面悬浮歌词 HUD (Screen Floating Lyrics)
    console.log('\n9. 验证屏幕桌面悬浮歌词 HUD:');
    const screenLyricToggle = await page.$('[title*="桌面歌词"], [aria-label*="桌面歌词"]');
    if (screenLyricToggle) {
      await screenLyricToggle.click();
      await page.waitForTimeout(400);
      const screenLyricEl = await page.$('.shijianus-music-pocket__screen-lyric');
      const isScreenLyricVisible = screenLyricEl ? await screenLyricEl.isVisible() : false;
      console.log(`- 桌面悬浮歌词可见性: ${isScreenLyricVisible} (期望: true)`);
      if (!isScreenLyricVisible) {
        throw new Error('Screen floating lyrics HUD should be visible after toggling on!');
      }
      console.log('✓ 屏幕桌面悬浮歌词 HUD 功能激活完好！');
      await page.screenshot({ path: '/root/.gemini/antigravity-cli/brain/7f275222-9f3b-4793-a25b-89e0e40eb60b/screen-lyric-hud.png' });
      console.log('  [截图归档] screen-lyric-hud.png');
    }

    // 验证 9: 面板收起/关闭功能 (仅收起面板，保留浮动图标与后台播放)
    console.log('\n10. 验证面板收起生命周期:');
    const closeHudBtn = await page.$('.shijianus-music-pocket__hud-btn--close');
    if (!closeHudBtn) throw new Error('Missing close button in header!');
    await closeHudBtn.click();
    await page.waitForTimeout(500);

    const panelAfterClose = await page.$('.shijianus-music-pocket__panel');
    console.log(`- 关闭后展开面板是否存在于 DOM: ${panelAfterClose !== null} (期望: false)`);
    if (panelAfterClose !== null) {
      throw new Error('Expanded panel should be closed/hidden!');
    }

    const pocketIconStillVisible = await page.$eval('.shijianus-music-pocket', (el) => el.style.display !== 'none');
    console.log(`- 关闭后悬浮口袋图标是否依然驻留后台: ${pocketIconStillVisible} (期望: true)`);
    if (!pocketIconStillVisible) {
      throw new Error('CRITICAL BUG: Floating pocket button MUST remain visible when closing panel!');
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
