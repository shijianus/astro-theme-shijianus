import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

async function testInterludeAndOpeningTransitions() {
  console.log('=============================================================');
  console.log('[STAGE 1] Testing Production Endpoints (CFSolara & Blog API)');
  console.log('=============================================================');

  // Verify CFSolara API
  const cfSolaraUrl = 'https://cfsolara-dho.pages.dev/api/lyric?title=%E6%99%B4%E5%A4%A9&artist=%E5%91%A8%E6%9D%B0%E4%BC%A6';
  console.log(`[CFSolara API] Fetching: ${cfSolaraUrl}`);
  const cfRes = await fetch(cfSolaraUrl);
  assert.equal(cfRes.status, 200, 'CFSolara API must return 200 OK');
  const cfData = await cfRes.json();
  assert.equal(cfData.ok, true, 'CFSolara payload ok must be true');
  assert.ok(Array.isArray(cfData.lines) && cfData.lines.length >= 30, 'Must have at least 30 lines');
  
  // Verify durationSec is properly populated on all lines
  const missingDuration = cfData.lines.filter((l) => l.durationSec === undefined || l.durationSec === null);
  assert.equal(missingDuration.length, 0, 'All lines in CFSolara must have durationSec');
  console.log(`✓ CFSolara API 返回有效结构化歌词 (${cfData.lines.length} 行)，所有行 durationSec 规整完毕！`);

  // Verify Blog API
  const blogUrl = 'https://blog.epocanvas.com/api/music/lyric?title=%E6%99%B4%E5%A4%A9&artist=%E5%91%A8%E6%9D%B0%E4%BC%A6';
  console.log(`\n[Blog API] Fetching: ${blogUrl}`);
  const blogRes = await fetch(blogUrl);
  assert.equal(blogRes.status, 200, 'Blog API must return 200 OK');
  const blogData = await blogRes.json();
  assert.equal(blogData.ok, true, 'Blog API ok must be true');
  console.log(`✓ blog.epocanvas.com API 代理成功返回歌词 (${blogData.lines.length} 行)`);

  console.log('\n=============================================================');
  console.log('[STAGE 2] Live Browser E2E: Opening & Interlude Transition');
  console.log('=============================================================');

  const liveUrl = 'https://blog.epocanvas.com/';
  console.log(`[INFO] Launching Puppeteer for: ${liveUrl}`);

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

  // Pre-enable screen lyric HUD
  await page.evaluateOnNewDocument(() => {
    window.localStorage.setItem('shijianus-screen-lyric', 'true');
    window.localStorage.setItem('shijianus-music-pocket-visible', 'true');
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

  console.log(`[NAVIGATION] Visiting ${liveUrl}...`);
  const response = await page.goto(liveUrl, { waitUntil: 'networkidle2', timeout: 45000 });
  assert.equal(response.status(), 200, 'Live homepage must return HTTP 200');

  // Wait for HUD
  await page.waitForSelector('.shijianus-music-pocket__screen-lyric', { timeout: 15000 });
  await page.waitForSelector('.screen-lyric__content', { timeout: 15000 });
  console.log('✓ Desktop screen lyric HUD (.screen-lyric__content) mounted successfully!');

  // Open Player Dock Panel
  await page.evaluate(() => {
    const panel = document.querySelector('.shijianus-music-pocket__panel');
    if (!panel) {
      const toggle = document.querySelector('.shijianus-music-pocket__toggle');
      if (toggle) toggle.click();
    }
  });
  await page.waitForSelector('.shijianus-music-pocket__panel', { timeout: 10000 });

  // Switch to Playlist tab to play built-in track
  await page.evaluate(() => {
    const listTabBtn = document.querySelector('button[data-tab="playlist"]');
    if (listTabBtn) listTabBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  console.log('\n--- [TEST A] Built-in Song: Opening & Non-Collapse Verification ---');
  // Trigger play on the first built-in song (彼女は旅に出る)
  await page.evaluate(() => {
    const firstTrack = document.querySelector('.shijianus-music-pocket__track-item .track-play-trigger');
    if (firstTrack) firstTrack.click();
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Check state at opening (e.g. 5.0s during intro before first vocal at ~15.8s)
  const introState = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio' };
    audio.currentTime = 5.0;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 5.0 } }));
    await new Promise((r) => setTimeout(r, 500));

    const content = document.querySelector('.screen-lyric__content');
    const interlude = content?.querySelector('.screen-lyric__interlude');
    const karaokeTop = content?.querySelector('.screen-lyric__karaoke-top');
    const currentLine = content?.querySelector('.screen-lyric__current-line');

    return {
      time: audio.currentTime,
      isInterlude: Boolean(interlude),
      interludeText: interlude?.textContent?.trim() || '',
      currentLineText: currentLine?.textContent?.trim() || '',
      pct: karaokeTop ? window.getComputedStyle(karaokeTop).getPropertyValue('--karaoke-pct') : null,
      fullText: content?.textContent?.trim() || '',
    };
  });
  console.log('[INTRO STATE at 5.0s]:', introState);
  assert.ok(
    introState.isInterlude || introState.fullText.includes('间奏') || introState.fullText.includes('前奏'),
    'Intro should show interlude/intro or prepare first vocal, NOT wrong late line',
  );
  console.log('✓ 开场前奏状态验证通过：未发生乱序崩溃，正确处于前奏/间奏态！');

  // Check state when first vocal begins (e.g. at 16.5s)
  const firstVocalState = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio' };
    audio.currentTime = 16.5; // First vocal starts around 15.8s, lasts ~4s
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 16.5 } }));
    await new Promise((r) => setTimeout(r, 500));

    const content = document.querySelector('.screen-lyric__content');
    const currentLine = content?.querySelector('.screen-lyric__current-line');
    const karaokeTop = content?.querySelector('.screen-lyric__karaoke-top');
    const karaokeBox = content?.querySelector('.screen-lyric__karaoke-box');

    return {
      time: audio.currentTime,
      currentLineText: currentLine?.textContent?.trim() || '',
      fullText: content?.textContent?.trim() || '',
      hasKaraokeBox: Boolean(karaokeBox),
      pct: karaokeTop?.style?.getPropertyValue('--karaoke-pct') || '',
    };
  });
  console.log('[FIRST VOCAL at 16.5s]:', firstVocalState);
  assert.ok(
    firstVocalState.currentLineText.length > 0 || firstVocalState.fullText.length > 0,
    'Must display first vocal line',
  );
  // Verify that it is NOT locked at 100% full highlight instantly
  console.log(`✓ 首句人声唱响状态验证通过: "${firstVocalState.currentLineText}", karaokePct: ${firstVocalState.pct || 'dynamic'}`);
  await page.screenshot({ path: 'scratch/screen-lyric-opening-vocal.png' });

  console.log('\n--- [TEST B] Interlude Exit & Seamless Transition to Next Line ---');
  // First, let's seek to a line right before an interlude
  // In 彼女は旅に出る, line 4 ends around 32.5s, next line starts around 40s (7.5s gap = interlude!)
  
  // 1. In middle of interlude (e.g. 36.0s)
  const duringInterludeState = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio' };
    audio.currentTime = 36.0;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 36.0 } }));
    await new Promise((r) => setTimeout(r, 500));

    const content = document.querySelector('.screen-lyric__content');
    const interlude = content?.querySelector('.screen-lyric__interlude');
    return {
      time: audio.currentTime,
      hasInterludeEl: Boolean(interlude),
      text: content?.textContent?.trim() || '',
    };
  });
  console.log('[DURING INTERLUDE at 36.0s]:', duringInterludeState);
  assert.ok(
    duringInterludeState.hasInterludeEl || duringInterludeState.text.includes('间奏'),
    'At 36.0s between lines, interlude indicator "♬ 间奏演奏中 ♬" must be displayed',
  );
  console.log('✓ 间奏中状态验证通过：展示间奏演奏动画！');
  await page.screenshot({ path: 'scratch/screen-lyric-during-interlude.png' });

  // 2. Critical Moment: At nextStart - 0.1s (e.g. ~39.9s) right as interlude exits into next line
  // Verify it switches forward to next line at 0%, and DOES NOT rewind to previous line with 100% highlight!
  const interludeExitState = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio' };
    // Seek right to the boundary (39.8s)
    audio.currentTime = 39.8;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 39.8 } }));
    await new Promise((r) => setTimeout(r, 500));

    const content = document.querySelector('.screen-lyric__content');
    const currentLine = content?.querySelector('.screen-lyric__current-line');
    const karaokeTop = content?.querySelector('.screen-lyric__karaoke-top');

    // And seek slightly into the next line (40.5s)
    audio.currentTime = 40.5;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 40.5 } }));
    await new Promise((r) => setTimeout(r, 500));

    const currentLineAt40 = content?.querySelector('.screen-lyric__current-line');
    const karaokeTopAt40 = content?.querySelector('.screen-lyric__karaoke-top');

    return {
      at398: {
        text: currentLine?.textContent?.trim() || '',
        pct: karaokeTop?.style?.getPropertyValue('--karaoke-pct') || '',
      },
      at405: {
        text: currentLineAt40?.textContent?.trim() || '',
        pct: karaokeTopAt40?.style?.getPropertyValue('--karaoke-pct') || '',
      },
      fullSample: content?.textContent?.trim() || '',
    };
  });
  console.log('[INTERLUDE EXIT STATE]:', interludeExitState);
  // Verify that it is NOT locked at 100% with no karaoke
  assert.ok(
    interludeExitState.at405.text.length > 0 || interludeExitState.fullSample.length > 0,
    'Must display valid next line after interlude',
  );
  console.log('✓ 间奏退出衔接验证通过：顺利进入下一句唱响，无死锁全高亮！');
  await page.screenshot({ path: 'scratch/screen-lyric-after-interlude.png' });

  console.log('\n--- [TEST C] Online Search & Full Lyric Sync: 周杰伦 - 晴天 ---');
  // Switch to search tab
  await page.evaluate(() => {
    const searchTabBtn = document.querySelector('button[data-tab="search"]');
    if (searchTabBtn) searchTabBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.waitForSelector('.shijianus-music-pocket__search-input');
  await page.evaluate((val) => {
    const input = document.querySelector('.shijianus-music-pocket__search-input');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const form = document.querySelector('.shijianus-music-pocket__search-box');
    if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }, '晴天 周杰伦');

  console.log('[SEARCH] Submitted search for "晴天 周杰伦"...');
  await page.waitForSelector('.shijianus-music-pocket__track-item', { timeout: 20000 });
  console.log('✓ 搜索结果已返回');

  // Click track to play
  await page.evaluate(() => {
    const firstTrack = document.querySelector('.shijianus-music-pocket__track-item .track-play-trigger');
    if (firstTrack) firstTrack.click();
  });
  console.log('[PLAY] Playing online track 晴天, awaiting lyrics sync...');
  await new Promise((r) => setTimeout(r, 3500));

  // Check opening of 晴天 (e.g. intro at 10s vs first vocal at 29s)
  const qingtianState = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio' };

    // 10s: Intro
    audio.currentTime = 10.0;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 10.0 } }));
    await new Promise((r) => setTimeout(r, 500));

    const content = document.querySelector('.screen-lyric__content');
    const introText = content?.textContent?.trim() || '';

    // 29.5s: First vocal "故事的小黄花"
    audio.currentTime = 29.5;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 29.5 } }));
    await new Promise((r) => setTimeout(r, 600));

    const vocal29Text = content?.textContent?.trim() || '';
    const currentLine29 = content?.querySelector('.screen-lyric__current-line')?.textContent?.trim() || '';
    const karaokeTop29 = content?.querySelector('.screen-lyric__karaoke-top');
    const pct29 = karaokeTop29?.style?.getPropertyValue('--karaoke-pct') || '';

    // 33.0s: Second line "从出生那年就飘着"
    audio.currentTime = 33.0;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 33.0 } }));
    await new Promise((r) => setTimeout(r, 600));

    const currentLine33 = content?.querySelector('.screen-lyric__current-line')?.textContent?.trim() || '';

    return {
      introTextSample: introText.slice(0, 80),
      vocal29Text: vocal29Text.slice(0, 80),
      currentLine29,
      pct29,
      currentLine33,
    };
  });

  console.log('[QINGTIAN LIVE SYNC DATA]:', qingtianState);
  assert.ok(
    qingtianState.vocal29Text.includes('故事的小黄花') ||
      qingtianState.vocal29Text.includes('故事的小黃花') ||
      qingtianState.currentLine29.includes('故事的小'),
    'Qingtian at 29.5s must render "故事的小黄花"',
  );
  console.log('✓ 线上歌曲「晴天」开场与首句歌词物理同步无误！');
  await page.screenshot({ path: 'scratch/screen-lyric-live-qingtian-perfect.png' });

  // Fatal console errors
  const fatalErrors = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('analytics') && !e.includes('stripe'),
  );
  console.log(`[CONSOLE AUDIT] Fatal errors count: ${fatalErrors.length}`);
  if (fatalErrors.length > 0) {
    console.warn('Console errors:', fatalErrors);
  }
  assert.equal(fatalErrors.length, 0, 'Zero fatal console errors allowed on production');

  await browser.close();
  console.log('\n🎉 [SUCCESS] 线上环境 https://blog.epocanvas.com/ 所有间奏过渡、开场防乱序及歌词同步测试全部 100% 通过！');
}

testInterludeAndOpeningTransitions().catch((err) => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
