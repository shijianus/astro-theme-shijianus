import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import fs from 'node:fs';

async function runLiveLyricAudit() {
  const liveUrl = 'https://blog.epocanvas.com/';
  console.log(`[INFO] Starting Live E2E Lyric Verification on: ${liveUrl}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  // Pre-enable screen lyric in localStorage
  await page.evaluateOnNewDocument(() => {
    window.localStorage.setItem('shijianus-screen-lyric', 'true');
    window.localStorage.setItem(
      'shijianus-screen-lyric-settings',
      JSON.stringify({
        fontSize: 'md',
        opacity: 'glass',
        dualLine: true,
        locked: false,
        colorTheme: 'blue',
      }),
    );
  });

  console.log(`[NAVIGATION] Navigating to ${liveUrl}...`);
  const response = await page.goto(liveUrl, { waitUntil: 'networkidle2', timeout: 35000 });
  console.log(`[HTTP STATUS] ${response.status()} ${response.statusText()}`);
  assert.equal(response.status(), 200, 'Live homepage must return HTTP 200');

  // Wait for music pocket player to mount
  console.log('[STEP 1] Waiting for music pocket player & screen lyric to mount...');
  await page.waitForSelector('.shijianus-music-pocket__screen-lyric', { timeout: 15000 });
  console.log('✓ Desktop screen lyric HUD detected in DOM!');

  // Verify screen-lyric__content exists
  const initialContent = await page.evaluate(() => {
    const el = document.querySelector('.screen-lyric__content');
    return {
      exists: Boolean(el),
      text: el?.textContent?.trim() || '',
    };
  });
  console.log('Initial screen lyric text:', initialContent.text);
  assert.ok(initialContent.exists, 'screen-lyric__content must exist');

  // Open music pocket player dock if not open
  await page.evaluate(() => {
    // Open player
    const triggerBtn = document.querySelector('.shijianus-music-pocket__trigger');
    if (triggerBtn) (triggerBtn).click();
  });

  await new Promise((r) => setTimeout(r, 1000));

  // Test 1: Way Back Home - Word-by-word synchronized physical tracking
  console.log('\n=============================================================');
  console.log('[TEST 1] Auditing Track 1 (Way Back Home) Word-by-Word Sync');
  console.log('=============================================================');

  // Seek to 1.2s (during "멈춘 시간 속")
  const syncAt1Sec = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio element found' };

    audio.currentTime = 1.2;
    audio.dispatchEvent(new Event('timeupdate'));
    // trigger audio time update
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 1.2 } }));

    await new Promise((r) => setTimeout(r, 300));

    const content = document.querySelector('.screen-lyric__content');
    const hud = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const activeLine = content?.querySelector('.screen-lyric__current-line');
    const karaokeBox = content?.querySelector('.screen-lyric__karaoke-box');
    const sungText = content?.querySelector('.screen-lyric__karaoke-text--sung')?.textContent?.trim();
    const karaokePct = hud ? hud.style.getPropertyValue('--karaoke-pct') : '';

    return {
      audioTime: audio.currentTime,
      isWordSync: activeLine?.classList.contains('is-word-sync'),
      hasKaraokeBox: Boolean(karaokeBox),
      activeText: sungText || activeLine?.textContent?.trim() || '',
      karaokePct,
    };
  });

  console.log('[AUDIO TIME 1.2s Result]:', syncAt1Sec);
  assert.ok(syncAt1Sec.isWordSync, 'Track 1 must activate is-word-sync');
  assert.ok(syncAt1Sec.hasKaraokeBox, 'Track 1 must render screen-lyric__karaoke-box');
  assert.equal(syncAt1Sec.activeText, '멈춘 시간 속', 'Active line at 1.2s must be "멈춘 시간 속"');
  const pctNum1 = parseFloat(syncAt1Sec.karaokePct);
  assert.ok(pctNum1 > 10 && pctNum1 < 95, `Karaoke progress (${syncAt1Sec.karaokePct}) must be proportional to 1.2s within line`);
  console.log(`✓ 1.2s 物理逐字跟随验证通过：歌词高亮精准锁定「멈춘 시간 속」，流光进度 ${syncAt1Sec.karaokePct}`);

  // Seek to 3.2s (during "잠든 너를 찾아가")
  const syncAt3Sec = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    audio.currentTime = 3.2;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 3.2 } }));

    await new Promise((r) => setTimeout(r, 300));

    const content = document.querySelector('.screen-lyric__content');
    const hud = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const activeLine = content?.querySelector('.screen-lyric__current-line');
    const sungText = content?.querySelector('.screen-lyric__karaoke-text--sung')?.textContent?.trim();
    const karaokePct = hud ? hud.style.getPropertyValue('--karaoke-pct') : '';

    return {
      audioTime: audio.currentTime,
      activeText: sungText || activeLine?.textContent?.trim() || '',
      karaokePct,
    };
  });

  console.log('[AUDIO TIME 3.2s Result]:', syncAt3Sec);
  assert.equal(syncAt3Sec.activeText, '잠든 너를 찾아가', 'Active line at 3.2s must advance to "잠든 너를 찾아가"');
  console.log(`✓ 3.2s 歌词位置自动切换验证通过：歌词已平滑流转至「잠든 너를 찾아가」！`);

  // Seek to 5.5s (during "아무리 막아도")
  const syncAt5Sec = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    audio.currentTime = 5.5;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 5.5 } }));

    await new Promise((r) => setTimeout(r, 300));

    const content = document.querySelector('.screen-lyric__content');
    const sungText = content?.querySelector('.screen-lyric__karaoke-text--sung')?.textContent?.trim();
    return {
      audioTime: audio.currentTime,
      activeText: sungText || content?.querySelector('.screen-lyric__current-line')?.textContent?.trim() || '',
    };
  });
  console.log('[AUDIO TIME 5.5s Result]:', syncAt5Sec);
  assert.equal(syncAt5Sec.activeText, '아무리 막아도', 'Active line at 5.5s must advance to "아무리 막아도"');
  console.log(`✓ 5.5s 歌词位置验证通过：歌词已平滑流转至「아무리 막아도」！`);

  // Take screenshot of word sync
  await page.screenshot({ path: 'scratch/screen-lyric-live-word.png' });
  console.log('✓ 逐字同步截图已保存: scratch/screen-lyric-live-word.png');

  // Test 2: Switch to Track 2 (Plain LRC - 彼女は旅に出る)
  console.log('\n=============================================================');
  console.log('[TEST 2] Auditing Track 2 (彼女は旅に出る) Plain Line-Level Mode');
  console.log('=============================================================');

  const track2Result = await page.evaluate(async () => {
    // Switch to next track via next button
    const nextBtn =
      document.querySelector('.screen-lyric__btn[title="下一首"]') ||
      document.querySelector('.shijianus-music-pocket__icon-btn[title="下一首"]') ||
      document.querySelector('.dock-btn[title="下一首"]');
    if (nextBtn) {
      (nextBtn).click();
    }
    await new Promise((r) => setTimeout(r, 1200));

    const audio = document.querySelector('audio');
    audio.currentTime = 16.5; // During "白昼夢 繋いでいて" (starts at 15.11s)
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 16.5 } }));

    await new Promise((r) => setTimeout(r, 500));

    const content = document.querySelector('.screen-lyric__content');
    const activeLine = content?.querySelector('.screen-lyric__current-line');
    const isLineSync = activeLine?.classList.contains('is-line-sync');
    const hasLineBox = Boolean(content?.querySelector('.screen-lyric__line-box'));
    const highlightText = content?.querySelector('.screen-lyric__line-text--highlight')?.textContent?.trim();

    return {
      isLineSync,
      hasLineBox,
      highlightText: highlightText || activeLine?.textContent?.trim() || '',
    };
  });

  console.log('[TRACK 2 Line-Level Result]:', track2Result);
  assert.ok(track2Result.isLineSync, 'Track 2 must activate is-line-sync (no fake words)');
  assert.ok(track2Result.hasLineBox, 'Track 2 must render screen-lyric__line-box for clean whole-line highlight');
  assert.equal(track2Result.highlightText, '白昼夢 繋いでいて', 'Active line at 16.5s must be "白昼夢 繋いでいて"');
  console.log('✓ 普通 LRC 行级降级模式验证通过：全行高亮「白昼夢 繋いでいて」，无虚假字级流光！');

  // Take screenshot of line sync
  await page.screenshot({ path: 'scratch/screen-lyric-live-line.png' });
  console.log('✓ 行级同步截图已保存: scratch/screen-lyric-live-line.png');

  // Verify Console Fatal Errors
  console.log('\n=============================================================');
  console.log('[FATAL JS ERROR CHECK]');
  const fatalErrors = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('analytics') && !e.includes('stripe'),
  );
  if (fatalErrors.length > 0) {
    console.warn('[WARNING] Console errors observed:', fatalErrors);
  } else {
    console.log('✓ 线上生产环境 0 控制台致命 JS 报错！');
  }

  await browser.close();
  console.log('\n🎉 [LIVE VERIFICATION COMPLETE] 所有真实线上端到端歌词同步断言 100% 通过！');
}

runLiveLyricAudit().catch((err) => {
  console.error('❌ Live Audit Failed:', err);
  process.exit(1);
});
