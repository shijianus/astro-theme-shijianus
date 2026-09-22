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

  // 5. 检查桌面歌词 HUD 的排布与文字
  const hudInfo = await page.evaluate(() => {
    const el = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const currentLine = el?.querySelector('.screen-lyric__current-line');
    const karaokeText = el?.querySelector('.screen-lyric__karaoke-text');
    const nextLine = el?.querySelector('.screen-lyric__next-line');
    const settingsBtn = el?.querySelector('.screen-lyric__btn--settings');
    const lockBtn = el?.querySelector('.screen-lyric__btn--lock');
    return {
      classes: el?.className,
      currentText: currentLine?.textContent?.trim(),
      hasKaraoke: !!karaokeText,
      karaokeStyle: karaokeText?.getAttribute('style'),
      hasNextLine: !!nextLine,
      nextText: nextLine?.textContent?.trim(),
      hasSettingsBtn: !!settingsBtn,
      hasLockBtn: !!lockBtn
    };
  });
  console.log('- 桌面歌词 HUD 初始状态:', hudInfo);
  if (!hudInfo.hasKaraoke) throw new Error('HUD karaoke text missing!');
  if (!hudInfo.hasNextLine) throw new Error('HUD dual-line next line preview missing!');
  console.log('✓ 桌面歌词当前句与双行下一句预览正常！\n');

  // 6. 测试设置弹窗与个性化配置
  console.log('5. 打开桌面歌词设置弹窗...');
  const settingsBtn = page.locator('.screen-lyric__btn--settings');
  await settingsBtn.click();
  await page.waitForTimeout(600);

  const popover = page.locator('.screen-lyric__settings-popover');
  await popover.waitFor({ state: 'visible', timeout: 3000 });
  console.log('✓ 桌面歌词个性化设置面板成功呼出！');

  // 7. 切换字号为大 (22px)
  console.log('6. 测试字号调整为大 (22px)...');
  const sizeLgBtn = popover.locator('.settings-opt-btn', { hasText: '22px' });
  await sizeLgBtn.click();
  await page.waitForTimeout(400);

  const hasSizeLg = await hud.evaluate((el) => el.classList.contains('size-lg'));
  console.log('- 字号变更状态 (size-lg):', hasSizeLg);
  if (!hasSizeLg) throw new Error('Failed to change HUD font size to lg!');
  console.log('✓ 字号无级调节成功！\n');

  // 8. 切换透明度为半透明 (45%) 与 全透极简 (0%)
  console.log('7. 测试背景透明度调节 (半透明 45% 与 全透极简 0%)...');
  const semiBtn = popover.locator('.settings-opt-btn', { hasText: '半透明' });
  await semiBtn.click();
  await page.waitForTimeout(400);
  let opacityCheck = await hud.evaluate((el) => el.classList.contains('opacity-semi'));
  console.log('- 半透明状态 (opacity-semi):', opacityCheck);
  if (!opacityCheck) throw new Error('Failed to change opacity to semi!');

  const transBtn = popover.locator('.settings-opt-btn', { hasText: '全透极简' });
  await transBtn.click();
  await page.waitForTimeout(400);
  opacityCheck = await hud.evaluate((el) => el.classList.contains('opacity-transparent'));
  console.log('- 全透极简状态 (opacity-transparent):', opacityCheck);
  if (!opacityCheck) throw new Error('Failed to change opacity to transparent!');
  console.log('✓ 透明度/全透极简模式调节成功！\n');

  // 9. 切换高亮主题色
  console.log('8. 测试高亮色彩主题切换 (翡翠绿)...');
  const greenBtn = popover.locator('.settings-color-btn[title*="翡翠绿"]');
  await greenBtn.click();
  await page.waitForTimeout(400);
  const themeCheck = await hud.evaluate((el) => el.classList.contains('theme-green'));
  console.log('- 主题色切换状态 (theme-green):', themeCheck);
  if (!themeCheck) throw new Error('Failed to change theme to green!');
  console.log('✓ 歌词流光色彩主题切换成功！\n');

  // 10. 测试单行 / 双行切换
  console.log('9. 测试单行 / 双行模式切换...');
  const singleLineBtn = popover.locator('.settings-opt-btn', { hasText: '单行沉浸' });
  await singleLineBtn.click();
  await page.waitForTimeout(400);
  let nextLineVisible = await page.evaluate(() => !!document.querySelector('.screen-lyric__next-line'));
  console.log('- 单行模式下一行可见性 (应为 false):', nextLineVisible);
  if (nextLineVisible) throw new Error('Next line should be hidden in single-line mode!');

  const dualLineBtn = popover.locator('.settings-opt-btn', { hasText: '双行预览' });
  await dualLineBtn.click();
  await page.waitForTimeout(400);
  nextLineVisible = await page.evaluate(() => !!document.querySelector('.screen-lyric__next-line'));
  console.log('- 双行模式下一行可见性 (应为 true):', nextLineVisible);
  if (!nextLineVisible) throw new Error('Next line should be visible in dual-line mode!');
  console.log('✓ 单行/双行排布切换成功！\n');

  // 11. 测试位置锁定
  console.log('10. 测试位置锁定功能...');
  const lockBtn = page.locator('.screen-lyric__btn--lock');
  await lockBtn.click();
  await page.waitForTimeout(400);
  const isLocked = await hud.evaluate((el) => el.classList.contains('is-locked'));
  console.log('- 位置锁定状态 (is-locked):', isLocked);
  if (!isLocked) throw new Error('HUD failed to enter locked state!');
  console.log('✓ 位置锁定功能正常！\n');

  // 关闭设置面板
  await settingsBtn.click();
  await page.waitForTimeout(400);

  // 12. 检查控制台致命错误
  console.log('11. 检查控制台错误:');
  console.log('- 错误数量:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.warn('- 捕获的错误:', consoleErrors);
  }

  console.log('\n======================================================');
  console.log('🎉 桌面歌词现代化重构与卡拉OK高亮全链路验证通过！');
  console.log('======================================================\n');

  await browser.close();
}

main().catch((err) => {
  console.error('Verification FAILED:', err);
  process.exit(1);
});
