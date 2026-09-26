import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import path from 'node:path';

async function main() {
  console.log('=============================================================');
  console.log('[STAGE 1] Testing Live Production Karaoke Stream Progression');
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
  const navRes = await page.goto(liveUrl, { waitUntil: 'networkidle2', timeout: 45000 });
  assert.equal(navRes.status(), 200, 'HTTP 200 OK required');

  // Wait for HUD
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

  console.log('\n--- [TEST A: Start of Line (18.95s) - Wiping Begins] ---');
  await page.evaluate(() => {
    const audio = document.querySelector('audio');
    if (audio) {
      audio.currentTime = 18.95;
      audio.play().catch(() => {});
    }
  });
  await new Promise((r) => setTimeout(r, 800));

  const startAudit = await page.evaluate(() => {
    const hud = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const vocalText = document.querySelector('.screen-lyric__vocal-text');
    if (!vocalText) return null;

    const cs = window.getComputedStyle(vocalText);
    const hudStyle = hud ? hud.getAttribute('style') || '' : '';
    const styleAttr = vocalText.getAttribute('style') || '';
    const isKaraokeStream = vocalText.classList.contains('is-karaoke-stream');
    const isSolidLineFocused = vocalText.classList.contains('is-line-focused');
    const match = styleAttr.match(/--karaoke-pct:\s*([\d.]+)%/) || hudStyle.match(/--karaoke-pct:\s*([\d.]+)%/);
    const pct = match ? parseFloat(match[1]) : null;

    return {
      text: vocalText.textContent?.trim(),
      pct,
      isKaraokeStream,
      isSolidLineFocused,
      styleAttr,
      hudStyle,
      bgClip: cs.webkitBackgroundClip || cs.backgroundClip,
      textFillColor: cs.webkitTextFillColor,
      textColor: cs.color,
    };
  });

  console.log('[Start of Line Audit]:', startAudit);
  assert.ok(startAudit, 'Vocal text element must exist');
  assert.equal(startAudit.isSolidLineFocused, false, 'Must NOT be is-line-focused (no solid all-blue!)');
  assert.equal(startAudit.isKaraokeStream, true, 'MUST be is-karaoke-stream');
  assert.equal(startAudit.bgClip, 'text', 'Must use -webkit-background-clip: text');
  assert.equal(startAudit.text, '優しいの 冷たいの', 'Must be Line 2 text');
  console.log(`✓ Start of line verified: text "${startAudit.text}" (pct: ${startAudit.pct}%) uses gradient text clipping!`);

  // Take screenshot of HUD at start
  const hudElement = await page.$('.shijianus-music-pocket__screen-lyric');
  if (hudElement) {
    await hudElement.screenshot({ path: 'scripts/hud-18s-start.png' });
    console.log('✓ Captured screenshot: scripts/hud-18s-start.png');
  }

  console.log('\n--- [TEST B: Middle of Line (20.4s) - Wiping in Progress] ---');
  await page.evaluate(() => {
    const audio = document.querySelector('audio');
    if (audio) {
      audio.currentTime = 20.4;
    }
  });
  await new Promise((r) => setTimeout(r, 800));

  const midAudit = await page.evaluate(() => {
    const vocalText = document.querySelector('.screen-lyric__vocal-text');
    const hud = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const styleAttr = vocalText?.getAttribute('style') || '';
    const hudStyle = hud?.getAttribute('style') || '';
    const match = styleAttr.match(/--karaoke-pct:\s*([\d.]+)%/) || hudStyle.match(/--karaoke-pct:\s*([\d.]+)%/);
    const pct = match ? parseFloat(match[1]) : null;

    return {
      text: vocalText?.textContent?.trim(),
      pct,
      styleAttr,
      hudStyle,
    };
  });

  console.log('[Mid of Line Audit]:', midAudit);
  assert.ok(midAudit.pct !== null, 'Must have --karaoke-pct defined');
  assert.ok(midAudit.pct > 25 && midAudit.pct < 75, `Pct should be midway (got ${midAudit.pct}%)`);
  console.log(`✓ Midway progress verified: --karaoke-pct is ${midAudit.pct}% (clean sweeping!)`);

  if (hudElement) {
    await hudElement.screenshot({ path: 'scripts/hud-19s-midway.png' });
    console.log('✓ Captured screenshot: scripts/hud-19s-midway.png');
  }

  console.log('\n--- [TEST C: End of Line (22.18s) - Wiping Completed & Held] ---');
  await page.evaluate(() => {
    const audio = document.querySelector('audio');
    if (audio) {
      audio.currentTime = 22.18;
    }
  });
  await new Promise((r) => setTimeout(r, 200));

  const endAudit = await page.evaluate(() => {
    const vocalText = document.querySelector('.screen-lyric__vocal-text');
    const hud = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const styleAttr = vocalText?.getAttribute('style') || '';
    const hudStyle = hud?.getAttribute('style') || '';
    const match = styleAttr.match(/--karaoke-pct:\s*([\d.]+)%/) || hudStyle.match(/--karaoke-pct:\s*([\d.]+)%/);
    const pct = match ? parseFloat(match[1]) : null;

    return {
      text: vocalText?.textContent?.trim(),
      pct,
    };
  });

  console.log('[End of Line Audit]:', endAudit);
  assert.ok(endAudit.pct !== null, 'Must have --karaoke-pct defined');
  assert.ok(endAudit.pct >= 85, `Pct should be >= 85% at end of line (got ${endAudit.pct}%)`);
  console.log(`✓ End of line verified: --karaoke-pct is ${endAudit.pct}%!`);

  if (hudElement) {
    await hudElement.screenshot({ path: 'scripts/hud-20s-end.png' });
    console.log('✓ Captured screenshot: scripts/hud-20s-end.png');
  }

  console.log('\n--- [TEST D: Lyrics Drawer is-karaoke Wiping Audit] ---');
  await page.evaluate(() => {
    const lyricTabBtn = document.querySelector('button[data-tab="lyrics"]');
    if (lyricTabBtn) lyricTabBtn.click();
  });
  await page.waitForSelector('.lyrics-line', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 800));

  const drawerAudit = await page.evaluate(() => {
    const activeLine = document.querySelector('.lyrics-line.is-active');
    const activeText = activeLine?.querySelector('.lyrics-line__text');
    const isKaraoke = activeText?.classList.contains('is-karaoke');
    const styleAttr = activeText?.getAttribute('style') || '';
    const cs = activeText ? window.getComputedStyle(activeText) : null;

    return {
      hasActiveLine: !!activeLine,
      isKaraoke,
      styleAttr,
      bgClip: cs?.webkitBackgroundClip || cs?.backgroundClip,
      textFillColor: cs?.webkitTextFillColor,
    };
  });

  console.log('[Drawer Karaoke Audit]:', drawerAudit);
  assert.ok(drawerAudit.hasActiveLine, 'Must have active line');
  assert.equal(drawerAudit.isKaraoke, true, 'Drawer active line MUST have is-karaoke class');
  assert.equal(drawerAudit.bgClip, 'text', 'Drawer text MUST use -webkit-background-clip: text');
  console.log('✓ Drawer active lyric line verified with dynamic karaoke wiping!');

  const panelElement = await page.$('.shijianus-music-pocket__panel');
  if (panelElement) {
    await panelElement.screenshot({ path: 'scripts/drawer-karaoke.png' });
    console.log('✓ Captured screenshot: scripts/drawer-karaoke.png');
  }

  console.log('\n--- [TEST E: 0 Fatal Console Errors] ---');
  const fatalErrors = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('Cloudflare') && !e.includes('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT')
  );
  assert.equal(fatalErrors.length, 0, `Must have 0 fatal console errors, found: ${fatalErrors.length}`);
  console.log('✓ 0 fatal console errors on live production site!');

  await browser.close();
  console.log('\n=============================================================');
  console.log('🎉 REAL KARAOKE STREAM SWEEPING VERIFIED 100% ON PRODUCTION!');
  console.log('=============================================================');
}

main().catch((err) => {
  console.error('❌ E2E Audit Failed:', err);
  process.exit(1);
});
