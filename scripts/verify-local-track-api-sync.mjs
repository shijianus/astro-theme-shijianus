import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

async function main() {
  console.log('=============================================================');
  console.log('[STAGE 1] Production Gateway API Verification for Local Tracks');
  console.log('=============================================================');

  // 1. Verify blog gateway /api/music/lyric for local track: Way Back Home
  const wayBackUrl = 'https://blog.epocanvas.com/api/music/lyric?id=863046037&source=netease&title=Way+Back+Home&artist=SHAUN';
  console.log(`[API Test] Fetching: ${wayBackUrl}`);
  const wayBackRes = await fetch(wayBackUrl);
  assert.equal(wayBackRes.status, 200, 'Gateway API must return 200 for Way Back Home');
  const wayBackData = await wayBackRes.json();
  assert.equal(wayBackData.ok, true, 'API payload ok must be true');
  assert.ok(Array.isArray(wayBackData.lines) && wayBackData.lines.length >= 30, 'Must have at least 30 lines');
  console.log(`✓ Gateway API for "Way Back Home" passed: ${wayBackData.lines.length} lines, first vocal: [${wayBackData.lines[0]?.timeSec}s] "${wayBackData.lines[0]?.text}"`);

  // 2. Verify gateway for 彼女は旅に出る
  const kanojoUrl = 'https://blog.epocanvas.com/api/music/lyric?id=509106775&source=netease&title=%E5%BD%BC%E5%A5%B3%E3%81%AF%E6%97%85%E3%81%AB%E5%87%BA%E3%82%8B&artist=%E4%B8%89%E6%9C%88%E3%81%AE%E3%83%91%E3%83%B3%E3%82%BF%E3%82%B7%E3%82%A2';
  console.log(`\n[API Test] Fetching: ${kanojoUrl}`);
  const kanojoRes = await fetch(kanojoUrl);
  assert.equal(kanojoRes.status, 200, 'Gateway API must return 200 for 彼女は旅に出る');
  const kanojoData = await kanojoRes.json();
  assert.equal(kanojoData.ok, true, 'API payload ok must be true');
  console.log(`✓ Gateway API for "彼女は旅に出る" passed: ${kanojoData.lines.length} lines, first vocal: [${kanojoData.lines[0]?.timeSec}s] "${kanojoData.lines[0]?.text}"`);

  console.log('\n=============================================================');
  console.log('[STAGE 2] Live Browser E2E: Local Tracks Prioritizing API Sync');
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

  // Track API requests to confirm local tracks fetch API
  const apiRequests = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/music/lyric') || url.includes('/api/lyric')) {
      apiRequests.push(url);
    }
  });

  // Pre-enable screen lyric HUD
  await page.evaluateOnNewDocument(() => {
    window.localStorage.setItem('shijianus-screen-lyric', 'true');
    window.localStorage.setItem('shijianus-music-pocket-visible', 'true');
  });

  console.log(`[NAVIGATION] Visiting ${liveUrl}...`);
  const response = await page.goto(liveUrl, { waitUntil: 'networkidle2', timeout: 45000 });
  assert.equal(response.status(), 200, 'Live homepage must return HTTP 200');

  // Wait for HUD
  await page.waitForSelector('.shijianus-music-pocket__screen-lyric', { timeout: 15000 });
  await page.waitForSelector('.screen-lyric__content', { timeout: 15000 });
  console.log('✓ Desktop screen lyric HUD mounted!');

  // Open Player Dock Panel
  await page.evaluate(() => {
    const panel = document.querySelector('.shijianus-music-pocket__panel');
    if (!panel) {
      const toggle = document.querySelector('.shijianus-music-pocket__toggle');
      if (toggle) toggle.click();
    }
  });
  await page.waitForSelector('.shijianus-music-pocket__panel', { timeout: 10000 });

  // Switch to Queue tab to inspect built-in local tracks
  await page.evaluate(() => {
    const queueTabBtn = document.querySelector('button[data-tab="queue"]');
    if (queueTabBtn) queueTabBtn.click();
  });
  await page.waitForSelector('.shijianus-music-pocket__track-item', { timeout: 10000 });
  console.log('✓ Switched to Queue tab');

  // TEST 1: Play Way Back Home (Track 1 - Local Track)
  console.log('\n--- [TEST 1] Playing Local Track 1: Way Back Home ---');
  await page.evaluate(() => {
    const tracks = document.querySelectorAll('.shijianus-music-pocket__track-item .track-play-trigger');
    if (tracks[0]) tracks[0].click();
  });
  // Wait for async API fetch
  await new Promise((r) => setTimeout(r, 2000));

  // Check that an API request was dispatched for local track
  console.log(`Total lyric API requests captured: ${apiRequests.length}`);
  assert.ok(apiRequests.length > 0, 'Local track MUST trigger online lyric API request!');
  console.log(`✓ Local track triggered API request: ${apiRequests[apiRequests.length - 1]}`);

  // Test Way Back Home opening vocal at 1.0s (First vocal starts at 0.28s)
  const wayBackState = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio' };
    audio.currentTime = 1.0;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 1.0 } }));
    await new Promise((r) => setTimeout(r, 500));

    const content = document.querySelector('.screen-lyric__content');
    return {
      time: audio.currentTime,
      currentLine: content?.querySelector('.screen-lyric__current-line')?.textContent?.trim() || '',
      nextLine: content?.querySelector('.screen-lyric__next-line')?.textContent?.trim() || '',
      fullText: content?.textContent?.trim() || '',
    };
  });
  console.log('[Way Back Home at 1.0s]:', wayBackState);
  assert.ok(
    wayBackState.currentLine.includes('멈춘 시간 속') || wayBackState.fullText.includes('멈춘'),
    'Way Back Home must accurately sync opening line "멈춘 시간 속" via API system!',
  );
  console.log('✓ Way Back Home 首句歌词高精度跟随验证通过！');

  // TEST 2: Switch to Track 2 (彼女は旅に出る)
  console.log('\n--- [TEST 2] Playing Local Track 2: 彼女は旅に出る ---');
  await page.evaluate(() => {
    const tracks = document.querySelectorAll('.shijianus-music-pocket__track-item .track-play-trigger');
    if (tracks[1]) tracks[1].click();
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Verify gap retention at 36.0s (No "间奏", retains finished line with 100% highlight)
  const kanojoState = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio' };
    audio.currentTime = 36.0;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 36.0 } }));
    await new Promise((r) => setTimeout(r, 600));

    const hud = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const content = document.querySelector('.screen-lyric__content');
    const karaokeOverlay = content?.querySelector('.screen-lyric__karaoke-overlay');
    const karaokePct = karaokeOverlay?.style?.width || (hud ? window.getComputedStyle(hud).getPropertyValue('--karaoke-pct') : '');

    return {
      time: audio.currentTime,
      currentLine: content?.querySelector('.screen-lyric__current-line')?.textContent?.trim() || '',
      hasInterlude: (content?.textContent || '').includes('间奏'),
      karaokePct: karaokePct.trim(),
    };
  });
  console.log('[彼女は旅に出る at 36.0s]:', kanojoState);
  assert.equal(kanojoState.hasInterlude, false, 'Must NOT contain "间奏"');
  assert.ok(kanojoState.currentLine.includes('あたしの黒猫'), 'Must retain Line 4');
  assert.ok(kanojoState.karaokePct.includes('100'), 'Must retain 100% highlight during instrumental gap');
  console.log('✓ 彼女は旅に出る 高精跟随与停留在上一句验证通过！');

  console.log('\n=============================================================');
  console.log('[STAGE 3] Console Error Audit');
  console.log('=============================================================');
  const fatalErrors = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('ERR_BLOCKED_BY_CLIENT') && !e.includes('net::ERR_NAME_NOT_RESOLVED'),
  );
  assert.equal(fatalErrors.length, 0, `Must have 0 fatal JS console errors! Found: ${fatalErrors.join('; ')}`);
  console.log('✓ 控制台审计通过：0 致命 JS 报错！');

  await browser.close();
  console.log('\n=============================================================');
  console.log('🎉 LOCAL TRACKS API PRIORITIZATION VERIFIED SUCCESSFULLY! 🎉');
  console.log('=============================================================');
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
