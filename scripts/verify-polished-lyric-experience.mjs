import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

async function main() {
  console.log('=============================================================');
  console.log('[STAGE 1] Testing Production Endpoints & Gateways');
  console.log('=============================================================');

  // 1. Production API gateway test
  const testUrl = 'https://blog.epocanvas.com/api/music/lyric?title=%E6%99%B4%E5%A4%A9&artist=%E5%91%A8%E6%9D%B0%E4%BC%A6';
  console.log(`[API Test] Fetching: ${testUrl}`);
  const res = await fetch(testUrl);
  assert.equal(res.status, 200, 'Production lyric API must return 200 OK');
  const data = await res.json();
  assert.equal(data.ok, true, 'Lyric payload ok must be true');
  assert.ok(Array.isArray(data.lines) && data.lines.length >= 20, 'Must have at least 20 lines');
  console.log(`✓ Production Lyric Gateway returned ${data.lines.length} lines, syncType: ${data.syncType || 'line'}`);

  console.log('\n=============================================================');
  console.log('[STAGE 2] Live Browser E2E: Single-DOM HUD, Apple Music Line Focus, & Scroll Protection');
  console.log('=============================================================');

  const liveUrl = 'https://blog.epocanvas.com/';
  console.log(`[Puppeteer] Launching browser to visit: ${liveUrl}`);

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

  // Enable screen lyric HUD in localStorage before loading
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

  console.log(`[Navigation] Loading ${liveUrl}...`);
  const navResponse = await page.goto(liveUrl, { waitUntil: 'networkidle2', timeout: 45000 });
  assert.equal(navResponse.status(), 200, 'Live page must return 200 OK');

  // Wait for HUD
  await page.waitForSelector('.shijianus-music-pocket__screen-lyric', { timeout: 15000 });
  await page.waitForSelector('.screen-lyric__content', { timeout: 15000 });
  console.log('✓ Desktop Screen Lyric HUD mounted successfully!');

  // Open Player Dock Panel
  await page.evaluate(() => {
    const panel = document.querySelector('.shijianus-music-pocket__panel');
    if (!panel) {
      const toggle = document.querySelector('.shijianus-music-pocket__toggle');
      if (toggle) toggle.click();
    }
  });
  await page.waitForSelector('.shijianus-music-pocket__panel', { timeout: 10000 });

  // Switch to Queue tab to access playlist
  await page.evaluate(() => {
    const queueTabBtn = document.querySelector('button[data-tab="queue"]');
    if (queueTabBtn) queueTabBtn.click();
  });
  await page.waitForSelector('.shijianus-music-pocket__track-item', { timeout: 10000 });
  console.log('✓ Player playlist tab opened');

  console.log('\n--- [TEST 1] Single-DOM Architecture Audit (No Duplication / No Blurry Overlay) ---');
  // Play Track 2 (彼女は旅に出る)
  await page.evaluate(() => {
    const tracks = document.querySelectorAll('.shijianus-music-pocket__track-item .track-play-trigger');
    if (tracks.length > 1) {
      tracks[1].click();
    }
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Fast forward into vocal section (e.g. 18s)
  await page.evaluate(() => {
    const audio = document.querySelector('audio');
    if (audio) {
      audio.currentTime = 18;
      audio.play().catch(() => {});
    }
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Inspect HUD DOM structure
  const hudAudit = await page.evaluate(() => {
    const currentLine = document.querySelector('.screen-lyric__current-line');
    if (!currentLine) return null;

    const vocalText = currentLine.querySelector('.screen-lyric__vocal-text');
    const oldOverlay = currentLine.querySelector('.screen-lyric__karaoke-overlay');
    const oldBase = currentLine.querySelector('.screen-lyric__karaoke-text--base');
    const textContent = currentLine.textContent?.trim() || '';

    // Check computed styles
    let isLineFocused = false;
    let isKaraokeStream = false;
    let backgroundClip = '';
    let textShadow = '';

    if (vocalText) {
      isLineFocused = vocalText.classList.contains('is-line-focused');
      isKaraokeStream = vocalText.classList.contains('is-karaoke-stream');
      const cs = window.getComputedStyle(vocalText);
      backgroundClip = cs.webkitBackgroundClip || cs.backgroundClip || '';
      textShadow = cs.textShadow || '';
    }

    return {
      hasCurrentLine: true,
      hasVocalText: !!vocalText,
      hasOldOverlay: !!oldOverlay,
      hasOldBase: !!oldBase,
      textContent,
      isLineFocused,
      isKaraokeStream,
      backgroundClip,
      textShadow,
      classNames: vocalText ? vocalText.className : '',
    };
  });

  console.log('[HUD Audit Result]:', hudAudit);
  assert.ok(hudAudit.hasCurrentLine, 'Current line must exist');
  assert.ok(hudAudit.hasVocalText, 'Single-DOM .screen-lyric__vocal-text must exist');
  assert.equal(hudAudit.hasOldOverlay, false, 'Old .screen-lyric__karaoke-overlay must be completely eliminated');
  assert.equal(hudAudit.hasOldBase, false, 'Old .screen-lyric__karaoke-text--base must be completely eliminated');
  assert.ok(hudAudit.textContent.length > 0, 'HUD must display text');
  // Confirm no duplicate text
  assert.ok(!hudAudit.textContent.includes(hudAudit.textContent.slice(0, 5) + hudAudit.textContent.slice(0, 5)), 'Text must NOT be duplicated or repeated!');
  console.log(`✓ Single-DOM verification passed! Displayed line: "${hudAudit.textContent}"`);
  console.log(`✓ Mode: ${hudAudit.isKaraokeStream ? 'Karaoke Stream (-webkit-background-clip)' : 'Apple Music Line Focused'}`);

  console.log('\n--- [TEST 2] Lyrics Drawer Scroll Protection Audit ---');
  // Switch to Lyrics tab in dock
  await page.evaluate(() => {
    const lyricTabBtn = document.querySelector('button[data-tab="lyrics"]');
    if (lyricTabBtn) lyricTabBtn.click();
  });
  await page.waitForSelector('.lyrics-line', { timeout: 10000 });
  console.log('✓ Switched to Lyrics drawer view');

  // Trigger manual scroll on .lyrics-view__scroll-container
  const scrollTestResult = await page.evaluate(async () => {
    const container = document.querySelector('.lyrics-view__scroll-container');
    if (!container) return { ok: false, reason: 'No container' };

    // Record initial scrollTop
    const initialScroll = container.scrollTop;

    // Simulate user scroll to position 300
    container.scrollTop = 300;
    container.dispatchEvent(new Event('scroll'));

    // Wait 1.5 seconds (within 3.5s protection window) while audio is playing
    await new Promise((r) => setTimeout(r, 1500));

    const duringScroll = container.scrollTop;

    return {
      ok: true,
      initialScroll,
      targetScroll: 300,
      duringScroll,
      isProtected: Math.abs(duringScroll - 300) < 50, // Should not have jumped back to top
    };
  });

  console.log('[Scroll Protection Test Result]:', scrollTestResult);
  assert.ok(scrollTestResult.ok, 'Scroll test executed');
  assert.ok(scrollTestResult.isProtected, 'Scroll protection must prevent auto-yank during user scroll');
  console.log('✓ Lyric drawer user scroll protection verified! User position maintained during active reading.');

  console.log('\n--- [TEST 3] Console Errors Audit ---');
  const fatalErrors = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('Cloudflare') && !e.includes('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT')
  );
  if (fatalErrors.length > 0) {
    console.warn('[Console Warnings/Errors]:', fatalErrors);
  }
  assert.equal(fatalErrors.length, 0, `Must have 0 fatal console errors, found: ${fatalErrors.length}`);
  console.log('✓ 0 fatal console errors on live production site!');

  await browser.close();
  console.log('\n=============================================================');
  console.log('🎉 ALL LIVE PRODUCTION AUDITS PASSED SUCCESSFULLY!');
  console.log('=============================================================');
}

main().catch((err) => {
  console.error('❌ E2E Audit Failed:', err);
  process.exit(1);
});
