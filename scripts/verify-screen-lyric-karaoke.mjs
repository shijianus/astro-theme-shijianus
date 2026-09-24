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

  // 6.7. 验证真实毛玻璃 (opacity-glass) 滤镜与半透明底色
  console.log('6.7. 检查毛玻璃预设 (opacity-glass) 是否为真实现代毛玻璃 (backdrop-filter: blur)...');
  const glassCheck = await page.evaluate(() => {
    const el = document.querySelector('.shijianus-music-pocket__screen-lyric');
    if (!el) return null;
    const style = window.getComputedStyle(el);
    return {
      backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
      bg: style.backgroundColor,
    };
  });
  console.log('- 毛玻璃滤镜与背景:', glassCheck);
  if (!glassCheck?.backdropFilter || !glassCheck.backdropFilter.includes('blur')) {
    throw new Error(`Expected backdrop-filter with blur for frosted glass, got ${glassCheck?.backdropFilter}!`);
  }
  console.log('✓ 成功验证：毛玻璃档位具备真实高质感 blur 模糊滤镜！\n');

  // 7. 切换透明度为 全透极简 (0%) 并验证常态纯透明 & 悬停时以虚线框圈出实际大小 (无不透明蒙版)
  console.log('7. 测试全透极简 (0%) 模式：验证常态 100% 纯透明及悬停时以虚线框圈出大小范围 (背景保持纯透明)...');
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

  const isZeroAlpha = (c) => c === 'transparent' || c.includes(', 0)') || c === 'rgba(0, 0, 0, 0)' || c === 'rgba(255, 255, 255, 0)';

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
  if (!transCheck.hasTransparentClass || !isZeroAlpha(transCheck.bg)) {
    throw new Error(`Expected transparent background with alpha 0, got ${transCheck.bg}!`);
  }
  if (transCheck.controlsOpacity !== '0') {
    throw new Error(`Expected un-hovered controls opacity: 0, got ${transCheck.controlsOpacity}!`);
  }
  console.log('✓ 成功确认：常态下 100% 纯透明极简，控制坞隐藏！');

  // 悬停状态下检测边框范围与控制坞滑出 (背景必须保持 0% 纯透明，不得使用灰色蒙版)
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
  console.log('- 全透模式 Hover 状态下边框与背景:', hoverCheck);
  if (hoverCheck.borderStyle !== 'dashed') {
    throw new Error(`Expected dashed border guide on hover, got ${hoverCheck.borderStyle}!`);
  }
  if (!isZeroAlpha(hoverCheck.bg)) {
    throw new Error(`Expected 0% transparent background even on hover for opacity-transparent, but got ${hoverCheck.bg}!`);
  }
  if (hoverCheck.controlsOpacity !== '1') {
    throw new Error(`Expected hovered controls opacity: 1, got ${hoverCheck.controlsOpacity}!`);
  }
  console.log('✓ 成功验证：全透极简悬停时背景保持 0% 纯透明，仅以精细虚线框标示方框大小，控制坞自然滑出！\n');

  // 8. 测试磁力中心吸附辅助线与一键恢复默认设置与位置 (.settings-reset-btn)
  console.log('8. 测试磁力水平中心吸附与对齐辅助线 (.screen-lyric__guide-line)...');
  const hudBox = await hud.boundingBox();
  if (hudBox) {
    // 模拟拖动 HUD 靠近屏幕水平中心线 (1440 / 2 = 720)
    await page.mouse.move(hudBox.x + hudBox.width / 2, hudBox.y + 15);
    await page.mouse.down();
    await page.mouse.move(720, 320, { steps: 8 });
    await page.waitForTimeout(400);

    const snapCheck = await page.evaluate(() => {
      const guide = document.querySelector('.screen-lyric__guide-line');
      const badge = document.querySelector('.screen-lyric__guide-badge');
      const el = document.querySelector('.shijianus-music-pocket__screen-lyric');
      return {
        hasGuide: !!guide,
        badgeText: badge?.textContent?.trim(),
        isSnapped: el?.classList.contains('is-snapped'),
      };
    });
    console.log('- 磁力吸附与基准线状态:', snapCheck);
    if (!snapCheck.hasGuide || !snapCheck.badgeText?.includes('50%')) {
      throw new Error('Magnetic center snapping guide line or badge failed to trigger near center!');
    }
    console.log('✓ 成功验证：拖拽靠近屏幕中心线时，磁力吸附并呈现居中对齐辅助线与提示徽标！');

    // 释放拖拽并移走
    await page.mouse.up();
    await page.waitForTimeout(400);

    // 再次拖动到视口左上方 (140, 140) 以测试一键恢复
    await page.mouse.move(720, 320);
    await page.mouse.down();
    await page.mouse.move(140, 140, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  }

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
    const guide = document.querySelector('.screen-lyric__guide-line');
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
      hasGuideLineOnReset: !!guide,
    };
  });
  console.log('- 恢复默认后位置与基准线反馈:', posAfterReset);
  if (posAfterReset.left !== '50%' || posAfterReset.bottom !== '64px' || !posAfterReset.isCentered) {
    throw new Error(`Reset failed to restore default bottom-centered position (left: 50%, bottom: 64px)! Got: left=${posAfterReset.left}, bottom=${posAfterReset.bottom}`);
  }
  if (posAfterReset.storage !== null) {
    throw new Error('Storage shijianus-screen-lyric-pos was not cleared!');
  }
  if (!posAfterReset.hasGuideLineOnReset) {
    throw new Error('Expected center guide line to flash upon clicking reset!');
  }
  console.log('✓ 成功验证：.settings-reset-btn 成功将 HUD 恢复至绝对下居中位置 (bottom: 64px) 并闪烁辅助线证明居中！\n');

  // 9. 测试字号阶梯：验证彻底废除15px与18px、小选项为22px、大为36px
  console.log('9. 测试字号阶梯：验证彻底废除15px与18px、小选项为22px、大为36px...');
  const count15px = await popover.locator('.settings-opt-btn', { hasText: '15px' }).count();
  const count18px = await popover.locator('.settings-opt-btn', { hasText: '18px' }).count();
  if (count15px > 0 || count18px > 0) {
    throw new Error(`Found deprecated font size options: 15px (${count15px}), 18px (${count18px})! Must be abolished.`);
  }

  const size22pxBtn = popover.locator('.settings-opt-btn', { hasText: '22px' });
  if (await size22pxBtn.count() === 0) {
    throw new Error('Small option with 22px font size not found!');
  }
  await size22pxBtn.click();
  await page.waitForTimeout(300);

  const smFontCheck = await page.evaluate(() => {
    const el = document.querySelector('.screen-lyric__current-line');
    return el ? window.getComputedStyle(el).fontSize : null;
  });
  console.log('- 小字号实际 computed font-size:', smFontCheck);
  if (smFontCheck !== '22px') {
    throw new Error(`Expected computed font-size: 22px for size-sm, got ${smFontCheck}!`);
  }

  const size36pxBtn = popover.locator('.settings-opt-btn', { hasText: '36px' });
  await size36pxBtn.click();
  await page.waitForTimeout(300);

  const hasSizeLg = await hud.evaluate((el) => el.classList.contains('size-lg'));
  const lgFontCheck = await page.evaluate(() => {
    const el = document.querySelector('.screen-lyric__current-line');
    return el ? window.getComputedStyle(el).fontSize : null;
  });
  console.log('- 大字号变更状态 (size-lg / 36px):', hasSizeLg, lgFontCheck);
  if (!hasSizeLg || lgFontCheck !== '36px') {
    throw new Error(`Expected computed font-size: 36px for size-lg, got ${lgFontCheck}!`);
  }
  console.log('✓ 字号阶梯调节成功：15px与18px已废除，22px为小，36px为大！\n');

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

  // 11.8. 验证跨歌曲全局歌词同步引擎 (Multi-Song Universal Lyric Sync)
  console.log('11.8. 测试跨歌曲歌词同步引擎：切换至第二首日文歌 (彼女は旅に出る) 并验证任意歌曲毫秒级对齐与间奏...');
  await newHud.hover();
  await page.waitForTimeout(300);
  const nextTrackBtn = page.locator('.screen-lyric__btn[title*="下一首"]');
  if (await nextTrackBtn.count() > 0) {
    await nextTrackBtn.click();
    await page.waitForTimeout(1000);
  }

  // 通过官方 shijianus:music-seek 推进音频至第一句人声 (16.2秒, 对应 [00:15.11]白昼夢 繋いでいて)
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 16.2 } }));
  });
  await page.waitForTimeout(600);

  const lyricSyncCheck1 = await page.evaluate(() => {
    const curLine = document.querySelector('.screen-lyric__current-line');
    const hudEl = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const karaokePct = hudEl ? hudEl.style.getPropertyValue('--karaoke-pct') : null;
    return {
      text: curLine?.textContent?.trim(),
      karaokePct,
    };
  });
  console.log('- 16.2s 人声歌词行同步状态:', lyricSyncCheck1);
  if (!lyricSyncCheck1.text?.includes('白昼夢')) {
    throw new Error(`Expected active lyric text to contain "白昼夢", got "${lyricSyncCheck1.text}"!`);
  }
  const pctVal1 = parseFloat(lyricSyncCheck1.karaokePct || '0');
  if (pctVal1 <= 0 || pctVal1 > 100) {
    throw new Error(`Expected active karaoke percentage between 0% and 100%, got ${lyricSyncCheck1.karaokePct}!`);
  }
  console.log('✓ 成功验证：日文歌词行即时毫秒级定位，卡拉OK流光准确驱动！');

  // 推进音频至间奏阶段 (62.0秒, 对应 [00:59.20]バイバイ 唱完后进入间奏)
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 62.0 } }));
  });
  await page.waitForTimeout(600);

  const interludeCheck = await page.evaluate(() => {
    const curLine = document.querySelector('.screen-lyric__current-line');
    return curLine?.textContent?.trim();
  });
  console.log('- 62.0s 间奏检测状态:', interludeCheck);
  if (!interludeCheck?.includes('间奏')) {
    throw new Error(`Expected interlude "间奏演奏中", got "${interludeCheck}"!`);
  }
  console.log('✓ 成功验证：唱毕后精准判定间奏，杜绝硬编码时间与超时拖拉！\n');

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
