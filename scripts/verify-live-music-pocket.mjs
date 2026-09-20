import { chromium } from 'playwright';

const TARGET_URL = process.env.TARGET_URL || 'https://a0d1437c.shijianus-blog.pages.dev';

async function main() {
  console.log(`--- 开始对生产环境进行真实链路 Playwright 端到端审计 ---`);
  console.log(`目标生产 URL: ${TARGET_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Antigravity-Live-Audit',
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log(`\n1. 导航访问生产环境: ${TARGET_URL}`);
    const response = await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 45000 });
    console.log(`- HTTP 状态码: ${response.status()}`);
    if (response.status() !== 200) {
      throw new Error(`Expected HTTP 200, got ${response.status()}`);
    }

    // 验证 1: 生产环境初始加载时严格默认隐藏
    console.log('\n2. 验证生产环境默认隐藏规则:');
    const pocketEl = await page.$('.shijianus-music-pocket');
    if (!pocketEl) {
      throw new Error('Element .shijianus-music-pocket not found in DOM!');
    }
    const isVisibleInitial = await pocketEl.isVisible();
    console.log(`- 生产端页面初始加载时音乐随身听可见性: ${isVisibleInitial} (期望: false - 默认隐藏)`);
    if (isVisibleInitial) {
      throw new Error('Music pocket MUST be hidden by default on production!');
    }
    console.log('✓ 生产环境默认隐藏验证通过！');

    // 验证 2: #rightside-config-show 中管理按键存在
    console.log('\n3. 验证生产端 #rightside-config-show 中管理按键:');
    const toggleBtn = await page.$('#toggle-music-pocket');
    if (!toggleBtn) {
      throw new Error('Toggle button #toggle-music-pocket not found in rightside dock!');
    }
    const btnTitle = await toggleBtn.getAttribute('title');
    console.log(`- 管理按钮 title: "${btnTitle}"`);
    console.log('✓ #rightside-config-show 管理按钮存在并配置完好！');

    // 验证 3: 点击管理按键唤出随身听
    console.log('\n4. 点击管理按键激活随身音乐口袋:');
    await toggleBtn.click();
    await page.waitForTimeout(600);
    const isVisibleAfterClick = await pocketEl.isVisible();
    console.log(`- 点击后音乐随身听可见性: ${isVisibleAfterClick} (期望: true)`);
    if (!isVisibleAfterClick) {
      throw new Error('Music pocket failed to become visible after clicking dock toggle button!');
    }
    console.log('✓ 生产端管理按钮成功唤出音乐口袋！');

    // 验证 4: 拖拽 (Draggable Button) 交互
    console.log('\n5. 验证生产端拖拽 (Draggable Button) 交互:');
    const toggleDisc = await page.$('.shijianus-music-pocket__toggle');
    if (!toggleDisc) {
      throw new Error('Toggle button .shijianus-music-pocket__toggle not found!');
    }
    const initialBox = await toggleDisc.boundingBox();
    console.log(`- 初始坐标: x=${initialBox.x.toFixed(1)}, y=${initialBox.y.toFixed(1)}`);

    // 模拟真实指针拖动
    await page.mouse.move(initialBox.x + 20, initialBox.y + 20);
    await page.mouse.down();
    await page.mouse.move(initialBox.x + 140, initialBox.y - 100, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(400);

    const movedBox = await toggleDisc.boundingBox();
    console.log(`- 拖拽后坐标: x=${movedBox.x.toFixed(1)}, y=${movedBox.y.toFixed(1)}`);
    const dist = Math.hypot(movedBox.x - initialBox.x, movedBox.y - initialBox.y);
    console.log(`- 实际位移距离: ${dist.toFixed(1)}px (期望 > 40px)`);
    if (dist < 40) {
      throw new Error(`Drag movement too small (${dist}px)!`);
    }

    let panel = await page.$('.shijianus-music-pocket__panel');
    console.log(`- 拖拽后面板是否意外展开: ${panel !== null} (期望: false，防误触生效)`);
    if (panel !== null) {
      throw new Error('Panel should NOT open simply by dragging!');
    }
    console.log('✓ 生产端拖拽位移正常且成功阻断点击展开误触！');

    // 验证 5: 点击展开特色面板
    console.log('\n6. 验证生产端点击展开特色面板 (.shijianus-music-pocket__panel):');
    await toggleDisc.click();
    await page.waitForTimeout(600);

    panel = await page.$('.shijianus-music-pocket__panel');
    if (!panel || !(await panel.isVisible())) {
      throw new Error('Panel failed to open upon clicking trigger button!');
    }
    console.log('✓ 生产端特色面板成功展开！');
    await page.screenshot({ path: 'scratch/live-music-pocket-panel-cyber-vintage.png' });
    console.log('  [截图存档] scratch/live-music-pocket-panel-cyber-vintage.png');

    // 验证 6: 验证 Cyber-Vintage HUD 顶栏与 16-Band 霓虹声波频谱柱
    console.log('\n7. 验证生产端特色 HUD 顶栏与 16-Band 霓虹声波频谱柱:');
    const hudLabel = await page.$eval('.shijianus-music-pocket__hud-head .hud-label', (el) => el.textContent.trim()).catch(() => '');
    const hudBadge = await page.$eval('.shijianus-music-pocket__hud-head .hud-badge', (el) => el.textContent.trim()).catch(() => '');
    console.log(`- HUD 声学标识: "${hudLabel}", 码率徽标: "${hudBadge}"`);

    const spectrumBarsCount = await page.$$eval('.shijianus-music-pocket__visualizer .spectrum-bar', (els) => els.length);
    console.log(`- 16-Band 频谱柱数量: ${spectrumBarsCount} (期望: 16)`);
    if (spectrumBarsCount !== 16) {
      throw new Error(`Expected 16 spectrum bars, found ${spectrumBarsCount}`);
    }

    const bigDisc = await page.$('.shijianus-music-pocket__big-disc');
    if (!bigDisc) throw new Error('Missing big vinyl disc in deck showcase!');
    console.log('✓ 生产端黑胶唱机与 16-Band 霓虹频谱柱渲染完好！');

    // 验证 7: 验证探索雷达与待播队列标签页切换
    console.log('\n8. 验证探索雷达与点歌交互:');
    const searchTab = await page.$('.shijianus-music-pocket__tab:nth-child(2)');
    if (searchTab) {
      await searchTab.click();
      await page.waitForTimeout(400);
      const tagPills = await page.$$eval('.shijianus-music-pocket__tag-pill', (els) => els.map((e) => e.textContent.trim()));
      console.log(`- 探索灵感胶囊: ${tagPills.slice(0, 5).join(' / ')} ...`);
      if (tagPills.length === 0) {
        throw new Error('No exploration pills rendered in explore tab!');
      }
      console.log('✓ 探索与点歌台选项卡运转正常！');
    }

    // 验证 8: 关闭/隐藏功能与右侧控制栏同步
    console.log('\n9. 验证完全隐藏功能与右侧控制栏同步:');
    const closeHudBtn = await page.$('.shijianus-music-pocket__hud-btn--close');
    if (closeHudBtn) {
      await closeHudBtn.click();
      await page.waitForTimeout(500);
    }
    const pocketPostHide = await page.$('.shijianus-music-pocket');
    const isVisiblePostHide = pocketPostHide ? await pocketPostHide.isVisible() : false;
    console.log(`- 关闭后随身音乐口袋可见性: ${isVisiblePostHide} (期望: false)`);
    if (isVisiblePostHide) {
      throw new Error('Music Pocket should be hidden after closing from HUD button!');
    }
    console.log('✓ 随身音乐口袋完全隐藏逻辑验证通过！');

    console.log('\n=============================================');
    console.log('🎉 生产环境真实链路端到端 Playwright 审计 100% 全绿通过！');
    console.log('=============================================');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('\n❌ 生产环境真实链路审计失败:', err);
  process.exit(1);
});
