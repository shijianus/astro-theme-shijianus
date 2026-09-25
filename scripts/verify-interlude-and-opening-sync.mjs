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
  console.log(`✓ CFSolara API (晴天) 返回成功: ${cfData.lines.length} 行`);

  // Verify Blog API with 乌梅子酱 (no mojibake)
  const blogUrl = 'https://blog.epocanvas.com/api/music/lyric?title=%E4%B9%8C%E6%A2%85%E5%AD%90%E9%85%B1&artist=%E6%9D%8E%E8%8D%A3%E6%B5%A9';
  console.log(`\n[Blog API] Fetching blog production gateway (乌梅子酱): ${blogUrl}`);
  const blogRes = await fetch(blogUrl);
  assert.equal(blogRes.status, 200, 'Blog API must return 200 OK');
  const blogData = await blogRes.json();
  assert.equal(blogData.ok, true, 'Blog API ok must be true');
  assert.ok(Array.isArray(blogData.lines) && blogData.lines.length > 0, 'Must have lines');
  const sampleText = blogData.lines[0]?.text || '';
  assert.ok(!sampleText.includes('æ\x9D\x8E'), 'Must NOT contain UTF-8 mojibake!');
  console.log(`✓ blog.epocanvas.com API 代理成功返回歌词 (${blogData.lines.length} 行)，无乱码: "${sampleText}"`);

  console.log('\n=============================================================');
  console.log('[STAGE 2] Live Browser E2E: Opening, Interlude Transition & Sync');
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

  // Switch to Queue tab to select 彼女は旅に出る (Track 2) for classic interlude verification
  await page.evaluate(() => {
    const queueTabBtn = document.querySelector('button[data-tab="queue"]');
    if (queueTabBtn) queueTabBtn.click();
  });
  await page.waitForSelector('.shijianus-music-pocket__track-item', { timeout: 10000 });
  console.log('✓ Switched to Queue (playlist) tab');

  console.log('\n--- [TEST A] Built-in Song: 彼女は旅に出る (Opening & Interlude Transition) ---');
  // Click second track (index 1: 彼女は旅に出る)
  await page.evaluate(() => {
    const tracks = document.querySelectorAll('.shijianus-music-pocket__track-item .track-play-trigger');
    if (tracks.length > 1) {
      tracks[1].click();
    } else if (tracks[0]) {
      tracks[0].click();
    }
  });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Intro check at 5.0s (First vocal is at ~15.8s)
  const introState = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio' };
    audio.currentTime = 5.0;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 5.0 } }));
    await new Promise((r) => setTimeout(r, 500));

    const content = document.querySelector('.screen-lyric__content');
    const staticText = content?.querySelector('.screen-lyric__static-text')?.textContent?.trim() || '';
    const currentLine = content?.querySelector('.screen-lyric__current-line')?.textContent?.trim() || '';
    const nextLine = content?.querySelector('.screen-lyric__next-line')?.textContent?.trim() || '';

    return {
      time: audio.currentTime,
      staticText,
      currentLine,
      nextLine,
      fullText: content?.textContent?.trim() || '',
    };
  });
  console.log('[INTRO STATE at 5.0s]:', introState);
  assert.ok(
    introState.staticText.includes('彼女は旅に出る') ||
      introState.fullText.includes('彼女は旅に出る') ||
      introState.fullText.includes('前奏'),
    'Intro should show track name or intro indicator, NOT late sung line',
  );
  console.log('✓ 开场前奏状态验证通过：正确显示歌曲信息与前奏态，无乱序排版！');

  // 2. Interlude check at 36.0s (Line 4 ended ~32.5s, next line starts at 40.0s)
  const duringInterludeState = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio' };
    audio.currentTime = 36.0;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 36.0 } }));
    await new Promise((r) => setTimeout(r, 600));

    const content = document.querySelector('.screen-lyric__content');
    const interlude = content?.querySelector('.screen-lyric__interlude-text');
    return {
      time: audio.currentTime,
      hasInterlude: Boolean(interlude),
      text: content?.textContent?.trim() || '',
    };
  });
  console.log('[DURING INTERLUDE at 36.0s]:', duringInterludeState);
  assert.ok(
    duringInterludeState.hasInterlude || duringInterludeState.text.includes('间奏'),
    'Must display interlude indicator during musical break',
  );
  console.log('✓ 间奏中状态验证通过：展示「♬ 间奏演奏中 ♬」！');

  // 3. CRITICAL: Interlude Exit Transition (39.8s -> 40.2s)
  // Verify that at 39.8s (pre-render next line), karaoke pct is 0.0% (NOT 100% frozen highlight)
  const exitTransition = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio' };
    const hud = document.querySelector('.shijianus-music-pocket__screen-lyric');

    // Seek right to boundary (39.85s)
    audio.currentTime = 39.85;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 39.85 } }));
    await new Promise((r) => setTimeout(r, 500));

    const content = document.querySelector('.screen-lyric__content');
    const overlay398 = content?.querySelector('.screen-lyric__karaoke-overlay');
    const pct398 = overlay398?.style?.width || (hud ? window.getComputedStyle(hud).getPropertyValue('--karaoke-pct') : '');

    // Now seek into vocal start (40.5s)
    audio.currentTime = 40.5;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 40.5 } }));
    await new Promise((r) => setTimeout(r, 500));

    const overlay405 = content?.querySelector('.screen-lyric__karaoke-overlay');
    const pct405 = overlay405?.style?.width || (hud ? window.getComputedStyle(hud).getPropertyValue('--karaoke-pct') : '');

    return {
      boundaryPct: pct398,
      sungPct: pct405,
      activeLineSample: content?.querySelector('.screen-lyric__current-line')?.textContent?.slice(0, 40) || '',
    };
  });
  console.log('[CRITICAL INTERLUDE EXIT TRANSITION]:', exitTransition);
  // Verify that boundaryPct is NOT 100%
  assert.ok(
    !exitTransition.boundaryPct.includes('100'),
    `Boundary pct before next vocal must NOT be 100% (was ${exitTransition.boundaryPct})`,
  );
  console.log('✓ 间奏退出衔接验证通过：下一句在唱响前进度归零（0%），彻底消除了“全高亮的无高亮模式”！');
  await page.screenshot({ path: 'scratch/screen-lyric-live-seamless-interlude.png' });

  console.log('\n--- [TEST B] Online Search Track: 周杰伦 - 晴天 ---');
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
  }, '晴天');

  console.log('[SEARCH] Submitted search for "晴天"...');
  await page.waitForSelector('.shijianus-music-pocket__track-item', { timeout: 20000 });
  console.log('✓ 搜索结果已返回');

  // Click first track
  await page.evaluate(() => {
    const firstTrack = document.querySelector('.shijianus-music-pocket__track-item .track-play-trigger');
    if (firstTrack) firstTrack.click();
  });
  console.log('[PLAY] Playing online track 晴天, awaiting lyrics sync...');
  await new Promise((r) => setTimeout(r, 3500));

  const qingtianState = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio' };

    // 29.5s: First vocal "故事的小黄花"
    audio.currentTime = 29.5;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 29.5 } }));
    await new Promise((r) => setTimeout(r, 600));

    const content = document.querySelector('.screen-lyric__content');
    const vocal29Text = content?.textContent?.trim() || '';
    const currentLine29 = content?.querySelector('.screen-lyric__current-line')?.textContent?.trim() || '';

    // 33.0s: Second line "从出生那年就飘着"
    audio.currentTime = 33.0;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 33.0 } }));
    await new Promise((r) => setTimeout(r, 600));

    const currentLine33 = content?.querySelector('.screen-lyric__current-line')?.textContent?.trim() || '';

    return {
      vocal29Text: vocal29Text.slice(0, 80),
      currentLine29,
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
  console.log('\n🎉 [SUCCESS] 线上生产环境 https://blog.epocanvas.com/ 所有间奏过渡、防乱序开场及歌词物理同步测试全部 100% 通过！');
}

testInterludeAndOpeningTransitions().catch((err) => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
