import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

async function main() {
  console.log('=============================================================');
  console.log('[STAGE 1] Testing Production Endpoints (CFSolara & Blog API)');
  console.log('=============================================================');

  // 1. Verify CFSolara API
  const cfSolaraUrl = 'https://cfsolara-dho.pages.dev/api/lyric?title=%E6%99%B4%E5%A4%A9&artist=%E5%91%A8%E6%9D%B0%E4%BC%A6';
  console.log(`[CFSolara API] Fetching: ${cfSolaraUrl}`);
  const cfRes = await fetch(cfSolaraUrl);
  assert.equal(cfRes.status, 200, 'CFSolara API must return 200 OK');
  const cfData = await cfRes.json();
  assert.equal(cfData.ok, true, 'CFSolara payload ok must be true');
  assert.ok(Array.isArray(cfData.lines) && cfData.lines.length >= 30, 'Must have at least 30 lines');
  console.log(`✓ CFSolara API (晴天) 返回成功: ${cfData.lines.length} 行, isPureMusic: ${cfData.isPureMusic}`);

  // 2. Verify Blog API with 乌梅子酱
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
  console.log('[STAGE 2] Live Browser E2E: No Interlude, Line Retention, Pure Music');
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

  // Switch to Queue tab to select 彼女は旅に出る (Track 2)
  await page.evaluate(() => {
    const queueTabBtn = document.querySelector('button[data-tab="queue"]');
    if (queueTabBtn) queueTabBtn.click();
  });
  await page.waitForSelector('.shijianus-music-pocket__track-item', { timeout: 10000 });
  console.log('✓ Switched to Queue (playlist) tab');

  console.log('\n--- [TEST A] Built-in Song: 彼女は旅に出る (Verification of NO interlude & line retention) ---');
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
      introState.fullText.includes('彼女は旅に出る'),
    'Intro should show track name, not interlude',
  );
  assert.ok(
    !introState.fullText.includes('间奏'),
    'Intro must NOT contain any "间奏" display',
  );
  console.log('✓ 前奏验证通过：显示歌曲信息，完全无多余间奏字符！');

  // 2. CRITICAL: Test between lines during instrumental gap (35.0s ~ 37.0s)
  // Line 4 ended at ~32.5s, next line starts at 40.0s.
  // Requirement: MUST NOT show "间奏", MUST retain Line 4 with 100% highlight!
  const retentionState = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio' };
    audio.currentTime = 36.0;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 36.0 } }));
    await new Promise((r) => setTimeout(r, 600));

    const hud = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const content = document.querySelector('.screen-lyric__content');
    const interludeElem = content?.querySelector('.screen-lyric__interlude-text');
    const currentLineElem = content?.querySelector('.screen-lyric__current-line');
    const karaokeOverlay = content?.querySelector('.screen-lyric__karaoke-overlay');
    const karaokePct = karaokeOverlay?.style?.width || (hud ? window.getComputedStyle(hud).getPropertyValue('--karaoke-pct') : '');

    return {
      time: audio.currentTime,
      hasInterludeElement: Boolean(interludeElem),
      hasInterludeText: (content?.textContent || '').includes('间奏'),
      activeText: currentLineElem?.textContent?.trim() || '',
      karaokePct: karaokePct.trim(),
    };
  });
  console.log('[RETENTION STATE at 36.0s (during gap before 40.0s)]:', retentionState);
  assert.equal(
    retentionState.hasInterludeElement,
    false,
    'Must NOT have .screen-lyric__interlude-text element!',
  );
  assert.equal(
    retentionState.hasInterludeText,
    false,
    'Must NOT contain "间奏" text anywhere in HUD!',
  );
  assert.ok(
    retentionState.activeText.length > 0,
    'Active line must be retained during the gap!',
  );
  assert.ok(
    retentionState.karaokePct.includes('100'),
    `Karaoke percentage must stay at 100% (was: ${retentionState.karaokePct})`,
  );
  console.log('✓ 关键验证通过：长间隙期间彻底消除「间奏中」，且稳定停留在上一句保持 100% 高亮！');

  // 3. Test seamless entrance into next line at 40.5s
  const nextLineState = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio' };
    audio.currentTime = 40.5;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 40.5 } }));
    await new Promise((r) => setTimeout(r, 600));

    const hud = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const content = document.querySelector('.screen-lyric__content');
    const currentLineElem = content?.querySelector('.screen-lyric__current-line');
    const karaokeOverlay = content?.querySelector('.screen-lyric__karaoke-overlay');
    const karaokePct = karaokeOverlay?.style?.width || (hud ? window.getComputedStyle(hud).getPropertyValue('--karaoke-pct') : '');

    return {
      time: audio.currentTime,
      activeText: currentLineElem?.textContent?.trim() || '',
      karaokePct: karaokePct.trim(),
    };
  });
  console.log('[NEXT LINE STATE at 40.5s]:', nextLineState);
  assert.notEqual(
    nextLineState.activeText,
    retentionState.activeText,
    'Active line must advance to the next line at 40.5s',
  );
  console.log('✓ 下一句无缝切入验证通过：下一句按时进场，自然平滑！');

  console.log('\n--- [TEST B] Pure Music (纯音乐，请欣赏) UI & Real Search Verification ---');
  // 1. Switch to search tab
  await page.evaluate(() => {
    const searchTabBtn = document.querySelector('button[data-tab="search"]');
    if (searchTabBtn) searchTabBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // 2. Click "赛博纯音" tag pill
  console.log('[PURE MUSIC] Clicking "赛博纯音" tag pill...');
  await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll('.shijianus-music-pocket__pill'));
    const purePill = pills.find((p) => p.textContent.includes('纯音'));
    if (purePill) purePill.click();
  });

  // Wait for search results to appear
  await page.waitForSelector('.shijianus-music-pocket__track-item', { timeout: 15000 });
  console.log('✓ Pure music search results loaded successfully!');

  // Click the first search result to play
  await page.evaluate(() => {
    const playTrigger = document.querySelector('.shijianus-music-pocket__track-item .track-play-trigger');
    if (playTrigger) playTrigger.click();
  });
  await new Promise((r) => setTimeout(r, 2500));

  // Verify pure music indicator in HUD or Drawer
  const pureMusicCheck = await page.evaluate(async () => {
    const hudContent = document.querySelector('.screen-lyric__content');
    const pureMusicElem = hudContent?.querySelector('.screen-lyric__pure-music-text');
    const currentLine = hudContent?.querySelector('.screen-lyric__current-line')?.textContent?.trim() || '';

    // Switch to lyrics tab
    const lyricsTabBtn = document.querySelector('button[data-tab="lyrics"]');
    if (lyricsTabBtn) lyricsTabBtn.click();
    await new Promise((r) => setTimeout(r, 500));

    const drawerContainer = document.querySelector('.lyrics-view__scroll-container');
    const emptyStateTitle = drawerContainer?.querySelector('.lyrics-empty-state__title')?.textContent?.trim() || '';

    return {
      hudHasPureMusicElem: Boolean(pureMusicElem),
      hudPureMusicText: pureMusicElem?.textContent?.trim() || '',
      currentLine,
      hudFullText: hudContent?.textContent?.trim() || '',
      emptyStateTitle,
      bodyHasPureMusic: document.body.innerHTML.includes('纯音乐，请欣赏'),
    };
  });
  console.log('[PURE MUSIC CHECK RESULT]:', pureMusicCheck);
  assert.ok(
    pureMusicCheck.bodyHasPureMusic || pureMusicCheck.hudHasPureMusicElem || pureMusicCheck.emptyStateTitle.includes('纯音乐'),
    'Must display pure music indicator "纯音乐，请欣赏" when instrumental track is played!',
  );
  console.log('✓ 纯音乐专属展示与无间奏验证通过！');

  console.log('\n=============================================================');
  console.log('[STAGE 3] Console Error Audit');
  console.log('=============================================================');
  console.log(`Console error count: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.warn('Console errors caught:', consoleErrors);
  }
  const fatalErrors = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('ERR_BLOCKED_BY_CLIENT') && !e.includes('Failed to load resource: net::ERR_NAME_NOT_RESOLVED'),
  );
  assert.equal(fatalErrors.length, 0, `Must have 0 fatal JS console errors! Found: ${fatalErrors.join('; ')}`);
  console.log('✓ 控制台审计通过：0 致命 JS 报错！');

  await browser.close();
  console.log('\n=============================================================');
  console.log('🎉 ALL LIVE PRODUCTION VERIFICATIONS PASSED SUCCESSFULLY! 🎉');
  console.log('=============================================================');
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
