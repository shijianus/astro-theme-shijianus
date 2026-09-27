import { chromium } from 'playwright';

async function audit() {
  console.log('=== STARTING PLAYWRIGHT LIVE AUDIT OF BLOG.EPOCANVAS.COM ===');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const consoleLogs = [];
  const consoleErrors = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  // Intercept and monitor /api/music/lyric network responses
  const lyricApiResponses = [];
  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('/api/music/lyric') || url.includes('/api/lyric')) {
      try {
        const json = await resp.json();
        lyricApiResponses.push({ url, status: resp.status(), data: json });
      } catch (e) {
        lyricApiResponses.push({ url, status: resp.status(), error: e.message });
      }
    }
  });

  // Pre-seed local storage so music player and screen lyric HUD can be inspected
  await page.addInitScript(() => {
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
      })
    );
  });

  console.log('Navigating to https://blog.epocanvas.com/ ...');
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle', timeout: 60000 });

  console.log('Page loaded. Checking HUD & Player elements...');
  await page.waitForSelector('.shijianus-music-pocket__screen-lyric', { timeout: 15000 });

  // Open Player Dock Panel
  await page.evaluate(() => {
    const panel = document.querySelector('.shijianus-music-pocket__panel');
    if (!panel) {
      const toggle = document.querySelector('.shijianus-music-pocket__toggle');
      if (toggle) toggle.click();
    }
  });
  await page.waitForSelector('.shijianus-music-pocket__panel', { timeout: 10000 });
  console.log('✓ Player dock panel opened.');

  // Switch to queue tab to select track 2
  console.log('Switching to queue tab...');
  await page.click('button[data-tab="queue"]');
  await page.waitForSelector('.shijianus-music-pocket__track-item', { timeout: 10000 });

  const trackItems = await page.$$('.shijianus-music-pocket__track-item');
  console.log(`Found ${trackItems.length} track items in queue.`);

  let track2Title = '';
  if (trackItems.length >= 2) {
    track2Title = await trackItems[1].$eval('.track-title', (el) => el.textContent.trim()).catch(() => '');
    console.log(`Track 2 title: "${track2Title}"`);
    const trigger = await trackItems[1].$('.track-play-trigger');
    if (trigger) {
      console.log('Triggering Track 2 play...');
      await trigger.click();
    } else {
      await trackItems[1].click();
    }
  }

  // Wait for lyric API response for track 2
  console.log('Waiting for track 2 lyric API call...');
  await page.waitForTimeout(3000);

  // Switch to lyrics tab in drawer
  console.log('Switching to lyrics tab in drawer...');
  await page.click('button[data-tab="lyrics"]');
  await page.waitForSelector('.lyrics-line', { timeout: 10000 });
  console.log('✓ Lyrics view rendered in drawer.');

  // Inspect DOM in the lyrics drawer
  const drawerDomAudit = await page.evaluate(() => {
    const drawer = document.querySelector('.shijianus-music-pocket__view--lyrics');
    if (!drawer) return { error: 'No .shijianus-music-pocket__view--lyrics found' };

    const lines = Array.from(drawer.querySelectorAll('.lyrics-line'));
    const lyricsWordElements = Array.from(drawer.querySelectorAll('.lyrics-word'));
    const pocketLyricWordElements = Array.from(drawer.querySelectorAll('.music-pocket__lyric-word'));
    const allSpans = Array.from(drawer.querySelectorAll('span'));
    const classesFound = Array.from(new Set(Array.from(drawer.querySelectorAll('*')).flatMap(el => Array.from(el.classList))));

    const lineDetails = lines.slice(0, 5).map((l, i) => {
      const time = l.querySelector('.lyrics-line__time')?.textContent?.trim() || '';
      const text = l.querySelector('.lyrics-line__text')?.textContent?.trim() || '';
      const textEl = l.querySelector('.lyrics-line__text');
      const innerSpans = textEl ? Array.from(textEl.querySelectorAll('span')).map(s => ({ class: s.className, text: s.textContent })) : [];
      const hasWordClass = l.querySelectorAll('.lyrics-word, .music-pocket__lyric-word, span[data-word]').length;
      return { index: i, time, text, innerSpans, hasWordClass };
    });

    return {
      totalLines: lines.length,
      lyricsWordCount: lyricsWordElements.length,
      pocketLyricWordCount: pocketLyricWordElements.length,
      classesInDrawer: classesFound,
      firstFiveLines: lineDetails,
    };
  });

  console.log('Drawer DOM Audit Result:', JSON.stringify(drawerDomAudit, null, 2));

  // Inspect Screen Lyric HUD DOM
  const hudDomAudit = await page.evaluate(() => {
    const hud = document.querySelector('.shijianus-music-pocket__screen-lyric');
    if (!hud) return { error: 'No HUD found' };

    const vocalText = hud.querySelector('.screen-lyric__vocal-text');
    const lyricsWordElements = hud.querySelectorAll('.lyrics-word');
    const pocketLyricWordElements = hud.querySelectorAll('.music-pocket__lyric-word');
    const classesFound = Array.from(new Set(Array.from(hud.querySelectorAll('*')).flatMap(el => Array.from(el.classList))));

    return {
      hudClass: hud.className,
      hudStyle: hud.getAttribute('style'),
      vocalTextClass: vocalText?.className,
      vocalTextContent: vocalText?.textContent?.trim(),
      lyricsWordCount: lyricsWordElements.length,
      pocketLyricWordCount: pocketLyricWordElements.length,
      classesInHUD: classesFound,
    };
  });

  console.log('HUD DOM Audit Result:', JSON.stringify(hudDomAudit, null, 2));

  // Play audio to 19.5s and check karaoke sweeping
  console.log('Seeking to 19.5s (during "優しいの 冷たいの")...');
  await page.evaluate(() => {
    const audio = document.querySelector('audio');
    if (audio) {
      audio.currentTime = 19.5;
      audio.play().catch(() => {});
    }
  });

  await page.waitForTimeout(600);

  const playbackAudit = await page.evaluate(() => {
    const hud = document.querySelector('.shijianus-music-pocket__screen-lyric');
    const vocalText = document.querySelector('.screen-lyric__vocal-text');
    const activeDrawerLine = document.querySelector('.lyrics-line.is-active');
    const activeDrawerText = activeDrawerLine?.querySelector('.lyrics-line__text');

    const hudStyle = hud?.getAttribute('style') || '';
    const vocalStyle = vocalText?.getAttribute('style') || '';
    const drawerStyle = activeDrawerText?.getAttribute('style') || '';

    const hudPctMatch = hudStyle.match(/--karaoke-pct:\s*([\d.]+)%/) || vocalStyle.match(/--karaoke-pct:\s*([\d.]+)%/);
    const drawerPctMatch = drawerStyle.match(/--karaoke-pct:\s*([\d.]+)%/);

    const activeLineHtml = activeDrawerLine ? activeDrawerLine.outerHTML : '';

    return {
      hudCurrentText: vocalText?.textContent?.trim(),
      hudKaraokePct: hudPctMatch ? parseFloat(hudPctMatch[1]) : null,
      drawerCurrentText: activeDrawerText?.textContent?.trim(),
      drawerKaraokePct: drawerPctMatch ? parseFloat(drawerPctMatch[1]) : null,
      drawerIsKaraokeClass: activeDrawerText?.classList.contains('is-karaoke'),
      activeLineHtmlSnippet: activeLineHtml.slice(0, 300),
    };
  });

  console.log('Playback Audit at 19.5s:', JSON.stringify(playbackAudit, null, 2));

  console.log('\n--- Intercepted Lyric API Responses ---');
  console.log(`Total lyric API calls captured: ${lyricApiResponses.length}`);
  for (const resp of lyricApiResponses) {
    console.log(`URL: ${resp.url}`);
    console.log(`Status: ${resp.status}`);
    if (resp.data) {
      console.log(`ok: ${resp.data.ok}, syncType: ${resp.data.syncType}, source: ${resp.data.source}`);
      console.log(`lineCount: ${resp.data.lines?.length}`);
      if (resp.data.lines && resp.data.lines.length > 1) {
        console.log('Sample Line 2:', JSON.stringify(resp.data.lines[1], null, 2));
      }
    }
  }

  console.log('\n--- Console Error Audit ---');
  const fatalErrors = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('Cloudflare') && !e.includes('ERR_BLOCKED_BY_CLIENT')
  );
  console.log(`Fatal console errors count: ${fatalErrors.length}`);
  if (fatalErrors.length > 0) {
    console.log('Errors:', fatalErrors);
  }

  await browser.close();
  console.log('=== AUDIT FINISHED ===');
}

audit().catch((e) => {
  console.error('Audit failed:', e);
  process.exit(1);
});
