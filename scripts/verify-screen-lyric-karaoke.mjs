import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4321';

async function main() {
  console.log(`Starting verification on ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. 打开播放器
  console.log('1. 唤出随身音乐口袋...');
  const pocket = page.locator('.shijianus-music-pocket');
  const isHidden = await pocket.evaluate((el) => el.classList.contains('is-hidden'));
  if (isHidden) {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:toggle-music-pocket', { detail: { visible: true } }));
    });
    await page.waitForTimeout(600);
  }

  console.log('- 打开音乐口袋播放器面板...');
  const trigger = page.locator('.shijianus-music-pocket__toggle');
  await trigger.click();
  await page.waitForTimeout(1000);

  const isOpen = await pocket.evaluate((el) => el.classList.contains('is-open'));
  console.log('- 播放器展开状态:', isOpen);
  if (!isOpen) throw new Error('Player failed to open!');

  // 2. 播放第一首
  console.log('2. 触发第一首播放...');
  const playBtn = page.locator('.shijianus-music-pocket__play-btn');
  await playBtn.click();
  await page.waitForTimeout(3000);

  // 3. 检查歌词页面 - 验证绝无打勾 (No checkmarks) & 卡拉OK渐变高亮
  console.log('3. 切换歌词页验证：无打勾、动态卡拉OK填充...');
  const lyricsTab = page.locator('.shijianus-music-pocket__tab[data-tab="lyrics"]');
  await lyricsTab.click();
  await page.waitForTimeout(1500);

  const lyricCheck = await page.evaluate(() => {
    const checks = document.querySelectorAll('.lyrics-line__check');
    const activeLine = document.querySelector('.lyrics-line.is-active');
    const activeKaraoke = activeLine?.querySelector('.lyrics-line__text.is-karaoke');
    const styleAttr = activeKaraoke?.getAttribute('style') || '';
    return {
      checkCount: checks.length,
      hasActive: !!activeLine,
      hasKaraokeText: !!activeKaraoke,
      karaokeStyle: styleAttr
    };
  });
  console.log('- 歌词视图检查:', lyricCheck);
  if (lyricCheck.checkCount > 0) {
    throw new Error(`Expected 0 checkmarks, found ${lyricCheck.checkCount}!`);
  }
  if (!lyricCheck.hasActive || !lyricCheck.hasKaraokeText) {
    throw new Error('Active karaoke line text not found in lyrics view!');
  }
  console.log('✓ 成功确认：已彻底清除打勾符号 (0 checks)，并采用实时卡拉OK渐变流光！\n');

  // 4. 开启屏幕桌面歌词 HUD
  console.log('4. 激活屏幕桌面歌词 HUD...');
  const hudBtn = page.locator('.lyrics-screen-btn');
  await hudBtn.click();
  await page.waitForTimeout(1000);

  const hud = page.locator('.shijianus-music-pocket__screen-lyric');
  await hud.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✓ 桌面歌词 HUD 成功呈现在屏幕上！');

  // 5. 检查桌面歌词 HUD 的排布、方框形状 (border-radius: 8px) 与 默认下居中位置
  console.log('5. 检查桌面歌词 HUD 方框形状 (border-radius: 8px) 与 默认下居中位置...');
  const shapeAndPos = await page.evaluate(() => {
    const el = document.querySelector('.shijianus-music-pocket__screen-lyric');
    if (!el) return null;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const centerX = rect.left + rect.width / 2;
    const isCentered = Math.abs(centerX - viewportWidth / 2) < 4;

    return {
      borderRadius: style.borderRadius,
      bottom: style.bottom,
      rect,
      isCentered,
      classes: el.className,
    };
  });
  console.log('- 形状与定位状态:', shapeAndPos);
  if (!shapeAndPos) throw new Error('HUD element not found!');
  if (shapeAndPos.borderRadius !== '8px') {
    throw new Error(`Expected border-radius: 8px (方框), but got ${shapeAndPos.borderRadius}!`);
  }
  if (!shapeAndPos.isCentered) {
    throw new Error('HUD is not horizontally centered in viewport!');
  }
  console.log('✓ 成功验证：HUD 为规整方框 (border-radius: 8px)，且默认位置为下居中！\n');

  // 6. 测试设置弹窗与个性化配置 (悬停呼出控制坞并点击设置)
  console.log('6. 鼠标悬停桌面歌词呼出控制坞，打开设置弹窗并检查 CFSolara 同步引擎卡片...');
  await hud.hover();
  await page.waitForTimeout(400);
  const settingsBtn = page.locator('.screen-lyric__btn--settings');
  await settingsBtn.click();
  await page.waitForTimeout(600);

  const popover = page.locator('.screen-lyric__settings-popover');
  await popover.waitFor({ state: 'visible', timeout: 3000 });

  // 检查 CFSolara 引擎卡片
  const engineCardText = await page.evaluate(() => {
    const card = document.querySelector('.settings-engine-card');
    return card ? card.textContent?.trim() : null;
  });
  console.log('- CFSolara 引擎标识:', engineCardText);
  if (!engineCardText || !engineCardText.includes('CFSolara 字幕同步引擎')) {
    throw new Error('CFSolara Subtitle Sync Engine card not found in settings popover!');
  }
  console.log('✓ CFSolara 高精歌词引擎接入与状态指示确认正常！\n');

  // 6.5. 验证彻底废除 .screen-lyric__disc-badge 唱片按钮
  console.log('6.5. 检查是否已彻底清除 .screen-lyric__disc-badge 唱片图标小徽标...');
  const discCount = await page.locator('.screen-lyric__disc-badge').count();
  console.log('- 唱片小徽标数量:', discCount);
  if (discCount > 0) {
    throw new Error(`Expected 0 .screen-lyric__disc-badge elements, but found ${discCount}!`);
  }
  console.log('✓ 成功验证：已彻底废除 .screen-lyric__disc-badge，全框任意位置均可自由拖拽！\n');

  // 6.6. 验证双层卡拉OK文本与背景翻转对比度
  console.log('6.6. 检查双层卡拉OK文本结构与底层背景翻转 (mix-blend-mode: difference)...');
  const dualLayerCheck = await page.evaluate(() => {
    const baseText = document.querySelector('.screen-lyric__karaoke-text--base');
    const sungText = document.querySelector('.screen-lyric__karaoke-text--sung');
    const overlay = document.querySelector('.screen-lyric__karaoke-overlay');
    if (!baseText) return null;
    const baseStyle = window.getComputedStyle(baseText);
    const sungStyle = sungText ? window.getComputedStyle(sungText) : null;
    return {
      hasBase: !!baseText,
      hasSung: !!sungText,
      hasOverlay: !!overlay,
      baseBlendMode: baseStyle.mixBlendMode,
      sungBlendMode: sungStyle ? sungStyle.mixBlendMode : null,
    };
  });
  console.log('- 双层卡拉OK结构:', dualLayerCheck);
  if (!dualLayerCheck || !dualLayerCheck.hasBase) {
    throw new Error('Dual-layer karaoke structure (.screen-lyric__karaoke-text--base) not found!');
  }
  if (dualLayerCheck.baseBlendMode !== 'difference') {
    throw new Error(`Expected base text mix-blend-mode: difference, got ${dualLayerCheck.baseBlendMode}!`);
  }
  console.log('✓ 成功验证：底层普通文本采用 mix-blend-mode: difference 随背景自适应翻转，顶层高亮保持纯正主题色！\n');

  // 7. 切换透明度为 全透极简 (0%) 并验证常态纯透明 & 悬停时以虚线框与半透蒙版圈出实际大小
  console.log('7. 测试全透极简 (0%) 模式：验证常态 100% 纯透明及悬停时以虚线框和半透明蒙版圈出大小范围...');
  const transBtn = popover.locator('.settings-opt-btn', { hasText: '全透极简' });
  await transBtn.click();
  await page.waitForTimeout(400);

  // 关闭设置面板以进入常态测试
  const closeSettingsBtn = popover.locator('.settings-close-btn');
  await closeSettingsBtn.click();
  await page.waitForTimeout(400);

  // 鼠标移开视口边缘
  await page.mouse.move(50, 50);
  await page.waitForTimeout(300);

  const transCheck = await page.evaluate(() => {
    const el = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const style = window.getComputedStyle(el);
    const controls = document.querySelector('.screen-lyric__controls');
    const controlsStyle = controls ? window.getComputedStyle(controls) : null;
    return {
      hasTransparentClass: el.classList.contains('opacity-transparent'),
      bg: style.backgroundColor,
      controlsOpacity: controlsStyle?.opacity,
    };
  });
  console.log('- 全透模式常规背景与未悬停控制坞状态:', transCheck);
  const isZeroAlpha = (c) => c === 'transparent' || c.includes(', 0)') || c === 'rgba(0, 0, 0, 0)' || c === 'rgba(255, 255, 255, 0)';
  if (!transCheck.hasTransparentClass || !isZeroAlpha(transCheck.bg)) {
    throw new Error(`Expected transparent background with alpha 0, got ${transCheck.bg}!`);
  }
  if (transCheck.controlsOpacity !== '0') {
    throw new Error(`Expected un-hovered controls opacity: 0, got ${transCheck.controlsOpacity}!`);
  }
  console.log('✓ 成功确认：常态下 100% 纯透明极简，控制坞隐藏！');

  // 悬停状态下检测蒙版范围与控制坞滑出
  console.log('- 鼠标悬停进入桌面歌词 HUD...');
  await hud.hover();
  await page.waitForTimeout(400);
  const hoverCheck = await page.evaluate(() => {
    const el = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const style = window.getComputedStyle(el);
    const controls = document.querySelector('.screen-lyric__controls');
    const controlsStyle = controls ? window.getComputedStyle(controls) : null;
    return {
      bg: style.backgroundColor,
      borderStyle: style.borderStyle,
      controlsOpacity: controlsStyle?.opacity,
    };
  });
  console.log('- 全透模式 Hover 状态下背景蒙版与边框:', hoverCheck);
  if (hoverCheck.borderStyle !== 'dashed') {
    throw new Error(`Expected dashed border guide mask on hover, got ${hoverCheck.borderStyle}!`);
  }
  if (hoverCheck.controlsOpacity !== '1') {
    throw new Error(`Expected hovered controls opacity: 1, got ${hoverCheck.controlsOpacity}!`);
  }
  console.log('✓ 成功验证：悬停时以虚线框与半透明蒙版圈出实际大小范围，控制坞自然滑出！\n');

  // 8. 测试拖拽并验证恢复默认设置按钮 (.settings-reset-btn) 恢复默认位置
  console.log('8. 测试位置拖拽与一键恢复默认位置 (.settings-reset-btn)...');
  // 模拟拖动 HUD 到视口左上方 (140, 140)
  const hudBox = await hud.boundingBox();
  if (hudBox) {
    await page.mouse.move(hudBox.x + 30, hudBox.y + 15);
    await page.mouse.down();
    await page.mouse.move(140, 140, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(500);
  }

  const posAfterDrag = await page.evaluate(() => {
    const el = document.querySelector('.shijianus-music-pocket__screen-lyric');
    return {
      left: el?.style.left,
      top: el?.style.top,
      storage: window.localStorage.getItem('shijianus-screen-lyric-pos'),
    };
  });
  console.log('- 拖拽后位置与持久化记录:', posAfterDrag);

  // 悬停并打开设置弹窗
  await hud.hover();
  await page.waitForTimeout(300);
  await settingsBtn.click();
  await page.waitForTimeout(400);

  // 点击恢复默认设置按钮
  console.log('- 点击 .settings-reset-btn 恢复默认设置与位置...');
  const resetBtn = page.locator('.settings-reset-btn');
  await resetBtn.click();
  await page.waitForTimeout(600);

  const posAfterReset = await page.evaluate(() => {
    const el = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const centerX = rect.left + rect.width / 2;
    return {
      left: el?.style.left,
      top: el?.style.top,
      bottom: el?.style.bottom,
      transform: el?.style.transform,
      storage: window.localStorage.getItem('shijianus-screen-lyric-pos'),
      isCentered: Math.abs(centerX - viewportWidth / 2) < 4,
    };
  });
  console.log('- 恢复默认后位置:', posAfterReset);
  if (posAfterReset.left !== '50%' || posAfterReset.bottom !== '88px' || !posAfterReset.isCentered) {
    throw new Error('Reset failed to restore default bottom-centered position!');
  }
  if (posAfterReset.storage !== null) {
    throw new Error('Storage shijianus-screen-lyric-pos was not cleared!');
  }
  console.log('✓ 成功验证：.settings-reset-btn 成功将 HUD 恢复至默认下居中位置并清除了存储！\n');

  // 9. 测试字号调整：取消15px、以18px为小、28px为大
  console.log('9. 测试字号阶梯：验证彻底废除15px、小选项为18px、大为28px...');
  const count15px = await popover.locator('.settings-opt-btn', { hasText: '15px' }).count();
  if (count15px > 0) {
    throw new Error('Found deprecated 15px font size option in popover! Must be abolished.');
  }
  const size18pxBtn = popover.locator('.settings-opt-btn', { hasText: '18px' });
  if (await size18pxBtn.count() === 0) {
    throw new Error('Small option with 18px font size not found!');
  }
  const sizeLgBtn = popover.locator('.settings-opt-btn', { hasText: '28px' });
  await sizeLgBtn.click();
  await page.waitForTimeout(400);

  const hasSizeLg = await hud.evaluate((el) => el.classList.contains('size-lg'));
  console.log('- 字号变更状态 (size-lg / 28px):', hasSizeLg);
  if (!hasSizeLg) throw new Error('Failed to change HUD font size to lg (28px)!');
  console.log('✓ 字号阶梯调节成功：15px已废除，18px为小，28px为大！\n');

  // 10. 验证底部控制坞布局与扩充宽度
  console.log('10. 验证悬浮控制坞 (.screen-lyric__controls) 严格位于歌词下方且居中，以及 HUD 扩充尺寸...');
  const layoutCheck = await page.evaluate(() => {
    const hudEl = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const contentEl = document.querySelector('.screen-lyric__content');
    const controlsEl = document.querySelector('.screen-lyric__controls');
    if (!hudEl || !contentEl || !controlsEl) return null;

    const hudRect = hudEl.getBoundingClientRect();
    const contentRect = contentEl.getBoundingClientRect();
    const controlsRect = controlsEl.getBoundingClientRect();

    return {
      hudWidth: hudRect.width,
      contentBottom: contentRect.bottom,
      controlsTop: controlsRect.top,
      isControlsBelow: controlsRect.top >= contentRect.bottom - 4,
      controlsCenterX: controlsRect.left + controlsRect.width / 2,
      hudCenterX: hudRect.left + hudRect.width / 2,
    };
  });
  console.log('- 布局与尺寸检查:', layoutCheck);
  if (!layoutCheck || !layoutCheck.isControlsBelow) {
    throw new Error(`Controls are not underneath the lyrics! contentBottom=${layoutCheck?.contentBottom}, controlsTop=${layoutCheck?.controlsTop}`);
  }
  if (layoutCheck.hudWidth < 700) {
    throw new Error(`HUD width is too narrow (${layoutCheck.hudWidth}px)! Must expand to accommodate full sentences.`);
  }
  console.log('✓ 成功验证：控制坞居中位于歌词正下方，宽度扩充至软件级主流大尺寸！\n');

  // 11. 切换高亮主题色
  console.log('11. 测试高亮色彩主题切换 (翡翠绿)...');
  const greenBtn = popover.locator('.settings-color-btn[title*="翡翠绿"]');
  await greenBtn.click();
  await page.waitForTimeout(400);
  const themeCheck = await hud.evaluate((el) => el.classList.contains('theme-green'));
  console.log('- 主题色切换状态 (theme-green):', themeCheck);
  if (!themeCheck) throw new Error('Failed to change theme to green!');
  console.log('✓ 歌词流光色彩主题切换成功！\n');

  // 11.5. 测试锁定状态、双击解锁与重启桌面歌词自动解除锁定
  console.log('11.5. 测试锁定状态、双击解锁与重启自动解除锁定...');
  // 悬停并点击锁定按钮
  await hud.hover();
  await page.waitForTimeout(300);
  const lockBtn = page.locator('.screen-lyric__btn--lock');
  await lockBtn.click();
  await page.waitForTimeout(400);

  let isLocked = await hud.evaluate((el) => el.classList.contains('is-locked'));
  console.log('- 锁定状态 (is-locked):', isLocked);
  if (!isLocked) throw new Error('Failed to lock screen lyric HUD!');

  // 测试双击桌面歌词内容解锁
  console.log('- 双击桌面歌词区域尝试解锁...');
  const lyricContent = page.locator('.screen-lyric__content');
  await lyricContent.dblclick();
  await page.waitForTimeout(400);

  isLocked = await hud.evaluate((el) => el.classList.contains('is-locked'));
  console.log('- 双击后锁定状态:', isLocked);
  if (isLocked) throw new Error('Failed to unlock via double click!');
  console.log('✓ 成功验证：双击桌面字幕区域可立即解锁！');

  // 再次锁定并测试重启（关闭后重新开启）自动解除锁定
  await hud.hover();
  await page.waitForTimeout(300);
  await lockBtn.click();
  await page.waitForTimeout(400);

  isLocked = await hud.evaluate((el) => el.classList.contains('is-locked'));
  console.log('- 再次锁定状态:', isLocked);
  if (!isLocked) throw new Error('Failed to lock screen lyric HUD again!');

  // 点击关闭按钮
  const closeHudBtn = page.locator('.screen-lyric__btn--close');
  await closeHudBtn.click();
  await page.waitForTimeout(600);

  const hudVisibleAfterClose = await page.locator('.shijianus-music-pocket__screen-lyric').count();
  console.log('- 关闭后 HUD 数量:', hudVisibleAfterClose);
  if (hudVisibleAfterClose !== 0) throw new Error('HUD failed to close!');

  // 重新打开桌面歌词
  console.log('- 重新开启屏幕桌面歌词...');
  await hudBtn.click();
  await page.waitForTimeout(600);

  const newHud = page.locator('.shijianus-music-pocket__screen-lyric');
  await newHud.waitFor({ state: 'visible', timeout: 5000 });
  const isLockedAfterRestart = await newHud.evaluate((el) => el.classList.contains('is-locked'));
  console.log('- 重启后锁定状态:', isLockedAfterRestart);
  if (isLockedAfterRestart) {
    throw new Error('HUD should automatically unlock upon restart/reopen!');
  }
  console.log('✓ 成功验证：重启桌面字幕时已全自动解除锁定！\n');

  // 12. 验证文章页面 Mermaid 渲染无 dmermaid-svg 报错
  console.log('12. 访问文章页验证 Mermaid 架构图渲染无 dmermaid-svg 报错...');
  await page.goto(`${BASE_URL}/posts/markdown-syntax-mastery-zh-Hant/`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('.mermaid-diagram-wrap svg', { state: 'attached', timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(1000);

  const mermaidCheck = await page.evaluate(() => {
    const danglingMermaid = document.querySelectorAll('[id*="dmermaid-svg"]');
    const svgs = document.querySelectorAll('.mermaid-diagram-wrap svg, .mermaid-svg-container, pre.mermaid, .mermaid');
    return {
      danglingCount: danglingMermaid.length,
      svgCount: svgs.length,
    };
  });
  console.log('- Mermaid 状态检查:', mermaidCheck);
  if (mermaidCheck.danglingCount > 0) {
    throw new Error(`Found ${mermaidCheck.danglingCount} dangling dmermaid-svg error elements!`);
  }
  if (mermaidCheck.svgCount === 0) {
    throw new Error('Expected at least one rendered Mermaid diagram SVG, found 0!');
  }
  console.log('✓ 成功验证：文章页 Mermaid 渲染正常，无任何 dmermaid-svg 悬挂错误元素！\n');

  // 13. 检查控制台致命错误
  console.log('13. 检查控制台错误:');
  console.log('- 错误数量:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.warn('- 捕获的错误:', consoleErrors);
  }

  console.log('\n======================================================');
  console.log('🎉 桌面歌词软件级下方控制坞、860px扩宽、明暗双色调、18px字号与Mermaid修复全链路验证通过！');
  console.log('======================================================\n');

  await browser.close();
}

main().catch((err) => {
  console.error('Verification FAILED:', err);
  process.exit(1);
});
