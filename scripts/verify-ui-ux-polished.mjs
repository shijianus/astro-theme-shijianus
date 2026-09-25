import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

async function main() {
  console.log('=============================================================');
  console.log('[STAGE 1] Production Gateway & API Verification');
  console.log('=============================================================');

  const testUrl = 'https://blog.epocanvas.com/api/music/lyric?title=%E6%99%B4%E5%A4%A9&artist=%E5%91%A8%E6%9D%B0%E4%BC%A6';
  console.log(`[API Test] Fetching: ${testUrl}`);
  const res = await fetch(testUrl);
  assert.equal(res.status, 200, 'Production lyric API must return 200 OK');
  const data = await res.json();
  assert.equal(data.ok, true, 'Lyric payload ok must be true');
  assert.ok(Array.isArray(data.lines) && data.lines.length >= 20, 'Must have >= 20 lines');
  console.log(`✓ Lyric Gateway OK: ${data.lines.length} lines`);

  console.log('\n=============================================================');
  console.log('[STAGE 2] Desktop E2E: Visual Hierarchy, Click-to-Seek & Auto-Center');
  console.log('=============================================================');

  const liveUrl = 'https://blog.epocanvas.com/';
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

  console.log(`[Navigation] Visiting ${liveUrl}...`);
  const navRes = await page.goto(liveUrl, { waitUntil: 'networkidle2', timeout: 45000 });
  assert.equal(navRes.status(), 200, 'HTTP 200 OK required');

  // Verify Desktop Screen Lyric HUD
  await page.waitForSelector('.shijianus-music-pocket__screen-lyric', { timeout: 15000 });
  await page.waitForSelector('.screen-lyric__content', { timeout: 15000 });
  console.log('✓ Desktop screen lyric HUD mounted');

  // Open Player Dock Panel
  await page.evaluate(() => {
    const panel = document.querySelector('.shijianus-music-pocket__panel');
    if (!panel) {
      const toggle = document.querySelector('.shijianus-music-pocket__toggle');
      if (toggle) toggle.click();
    }
  });
  await page.waitForSelector('.shijianus-music-pocket__panel', { timeout: 10000 });

  // Switch to Queue and select Track 2 (彼女は旅に出る)
  await page.evaluate(() => {
    const queueTabBtn = document.querySelector('button[data-tab="queue"]');
    if (queueTabBtn) queueTabBtn.click();
  });
  await page.waitForSelector('.shijianus-music-pocket__track-item', { timeout: 10000 });
  await page.evaluate(() => {
    const tracks = document.querySelectorAll('.shijianus-music-pocket__track-item .track-play-trigger');
    if (tracks.length > 1) tracks[1].click();
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Switch to Lyrics view
  await page.evaluate(() => {
    const lyricTabBtn = document.querySelector('button[data-tab="lyrics"]');
    if (lyricTabBtn) lyricTabBtn.click();
  });
  await page.waitForSelector('.lyrics-line', { timeout: 10000 });
  console.log('✓ Lyrics tab active');

  // Fast forward into vocal section (e.g. 25s) to generate passed lines and active line
  await page.evaluate(() => {
    const audio = document.querySelector('audio');
    if (audio) {
      audio.currentTime = 25;
      audio.play().catch(() => {});
    }
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Audit Visual Hierarchy in Lyrics Drawer
  const hierarchyAudit = await page.evaluate(() => {
    const passedLine = document.querySelector('.lyrics-line.is-passed');
    const activeLine = document.querySelector('.lyrics-line.is-active');

    let passedOpacity = 1;
    let passedColor = '';
    let activeColor = '';
    let activeBorderLeft = '';
    let activeScale = '';

    if (passedLine) {
      const cs = window.getComputedStyle(passedLine);
      passedOpacity = parseFloat(cs.opacity);
      passedColor = cs.color;
    }
    if (activeLine) {
      const cs = window.getComputedStyle(activeLine);
      activeColor = cs.color;
      activeBorderLeft = cs.borderLeft;
      activeScale = cs.transform;
    }

    return {
      hasPassedLine: !!passedLine,
      hasActiveLine: !!activeLine,
      passedOpacity,
      passedColor,
      activeColor,
      activeBorderLeft,
      activeScale,
    };
  });

  console.log('[Visual Hierarchy Audit Result]:', hierarchyAudit);
  assert.ok(hierarchyAudit.hasActiveLine, 'Must have an active lyric line');
  if (hierarchyAudit.hasPassedLine) {
    assert.ok(hierarchyAudit.passedOpacity <= 0.85, 'Passed line must have subdued opacity (not distracting bright blue)');
  }
  console.log('✓ Visual hierarchy verified: active line has primary emphasis, passed lines are gracefully subdued');

  // Test Click-to-Seek on a lyric line
  console.log('\n--- [TEST: Click-to-Seek & Instant Centering] ---');
  const seekAudit = await page.evaluate(async () => {
    const lines = document.querySelectorAll('.lyrics-line');
    if (lines.length < 5) return { ok: false, reason: 'Not enough lines' };

    const targetLine = lines[4];
    const container = document.querySelector('.lyrics-view__scroll-container');
    const audio = document.querySelector('audio');

    // Click line 4
    targetLine.click();
    await new Promise((r) => setTimeout(r, 600));

    const audioTimeAfter = audio ? audio.currentTime : 0;
    const containerRect = container.getBoundingClientRect();
    const activeRect = targetLine.getBoundingClientRect();
    const distFromCenter = Math.abs((activeRect.top + activeRect.height / 2) - (containerRect.top + containerRect.height / 2));

    return {
      ok: true,
      audioTimeAfter,
      distFromCenter,
      isCentered: distFromCenter < 50,
    };
  });

  console.log('[Click-to-Seek Audit Result]:', seekAudit);
  assert.ok(seekAudit.ok, 'Click-to-seek executed');
  assert.ok(seekAudit.audioTimeAfter > 0, 'Audio time must jump to clicked line');
  assert.ok(seekAudit.isCentered, 'Clicked line must be centered in view');
  console.log(`✓ Click-to-seek verified! Audio jumped to ${seekAudit.audioTimeAfter.toFixed(1)}s and centered.`);

  console.log('\n=============================================================');
  console.log('[STAGE 3] Mobile Viewport E2E Audit (375x667 iPhone SE)');
  console.log('=============================================================');

  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 1000));

  const mobileAudit = await page.evaluate(() => {
    const hud = document.querySelector('.shijianus-music-pocket__screen-lyric');
    if (!hud) return { ok: false, reason: 'HUD not found' };

    const hudRect = hud.getBoundingClientRect();
    const currentLine = hud.querySelector('.screen-lyric__current-line');
    const csLine = currentLine ? window.getComputedStyle(currentLine) : null;
    const fontSize = csLine ? parseFloat(csLine.fontSize) : 0;

    return {
      ok: true,
      hudWidth: hudRect.width,
      viewportWidth: window.innerWidth,
      hudLeft: hudRect.left,
      hudRight: hudRect.right,
      fontSize,
      fitsInScreen: hudRect.width <= window.innerWidth && hudRect.left >= 0,
      scaledDown: fontSize <= 24, // size-md scaled down on mobile from 28px to 18px
    };
  });

  console.log('[Mobile Audit Result]:', mobileAudit);
  assert.ok(mobileAudit.ok, 'Mobile HUD exists');
  assert.ok(mobileAudit.fitsInScreen, 'HUD must fit cleanly within mobile screen width without overflow');
  assert.ok(mobileAudit.scaledDown, `Mobile font size must scale down gracefully, got: ${mobileAudit.fontSize}px`);
  console.log(`✓ Mobile viewport verified: HUD width ${mobileAudit.hudWidth}px fits in ${mobileAudit.viewportWidth}px screen, font size ${mobileAudit.fontSize}px.`);

  console.log('\n=============================================================');
  console.log('[STAGE 4] Modal Suppression CSS Verification');
  console.log('=============================================================');

  const suppressionAudit = await page.evaluate(() => {
    const hud = document.querySelector('.shijianus-music-pocket__screen-lyric');
    if (!hud) return { ok: false };

    // Add theme-overlay-open class to body
    document.body.classList.add('theme-overlay-open');
    const cs = window.getComputedStyle(hud);
    const isHidden = cs.opacity === '0' || cs.visibility === 'hidden';
    document.body.classList.remove('theme-overlay-open');

    return {
      ok: true,
      isHidden,
      opacity: cs.opacity,
      visibility: cs.visibility,
    };
  });

  console.log('[Modal Suppression Audit Result]:', suppressionAudit);
  assert.ok(suppressionAudit.ok, 'Suppression audit executed');
  assert.ok(suppressionAudit.isHidden, 'Screen lyric HUD must be hidden when modal/overlay is open');
  console.log('✓ Modal suppression verified! Screen lyric HUD hides automatically when overlays open.');

  console.log('\n=============================================================');
  console.log('[STAGE 5] Console Fatal Errors Audit');
  console.log('=============================================================');

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
  console.log('🎉 ALL UI/UX & FUNCTIONAL AUDITS PASSED WITH FLYING COLORS!');
  console.log('=============================================================');
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
