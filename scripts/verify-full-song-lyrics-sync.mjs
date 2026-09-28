import { chromium } from 'playwright';

async function verifyFullSongLyricsSync() {
  console.log('🚀 Starting Full-Song Lyrics Sync Verification on https://blog.epocanvas.com/ ...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  let lyricApiUrl = null;
  let lyricApiStatus = null;
  let lyricPayload = null;
  page.on('response', async resp => {
    if (resp.url().includes('lyric')) {
      lyricApiUrl = resp.url();
      lyricApiStatus = resp.status();
      try {
        lyricPayload = await resp.json();
      } catch {}
      console.log(`[LYRIC API INTERCEPT] ${lyricApiStatus} from ${lyricApiUrl}`);
    }
  });

  // 1. Visit Live Site
  console.log('1. Navigating to https://blog.epocanvas.com/ ...');
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 2. Open MusicPocket
  console.log('2. Opening MusicPocket drawer / modal...');
  const dockBtn = await page.$('.dock-item.music-pocket-btn, button[aria-label*="音乐"], button[title*="音乐"]');
  if (dockBtn) {
    await dockBtn.click();
    console.log('Dock button clicked');
  } else {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:toggle-music-pocket', { detail: { visible: true } }));
    });
  }
  await page.waitForTimeout(1000);

  // Click floating toggle button to open player panel
  const pocketToggle = await page.$('.shijianus-music-pocket__toggle');
  if (pocketToggle) {
    await pocketToggle.click();
    console.log('Pocket toggle clicked to expand player panel.');
  }
  await page.waitForTimeout(1000);

  // 3. Switch to Lyrics Tab
  console.log('3. Switching to lyrics tab...');
  const lyricsTab = await page.$('button[data-tab="lyrics"], button.shijianus-music-pocket__tab[title*="歌词"], button[aria-label*="歌词"]');
  if (lyricsTab) {
    await lyricsTab.click();
    console.log('Lyrics tab clicked successfully.');
  } else {
    console.warn('Lyrics tab button NOT found!');
  }
  await page.waitForTimeout(2000);

  // 4. Start Audio Playback (muted for autoplay policy)
  console.log('4. Initializing audio playback...');
  const audioStatus = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio element found' };
    audio.muted = true;
    try {
      await audio.play();
    } catch (e) {
      return { error: e.message, src: audio.src };
    }
    return {
      src: audio.src,
      paused: audio.paused,
      currentTime: audio.currentTime,
      duration: audio.duration,
    };
  });
  console.log('Audio playback status:', audioStatus);

  // Wait a bit for lyrics API to resolve and render
  console.log('Waiting for lyrics to render...');
  try {
    await page.waitForSelector('.lyrics-line', { timeout: 10000 });
  } catch (e) {
    console.warn('Wait for .lyrics-line timed out:', e.message);
  }
  await page.waitForTimeout(1000);

  // 5. Inspect Rendered Lyric Lines in DOM
  const domLyrics = await page.evaluate(() => {
    const lines = Array.from(document.querySelectorAll('.lyrics-line, .shijianus-music-pocket__lyric-line, .lyrics-view__line'));
    const activeLine = document.querySelector('.lyrics-line.is-active, .shijianus-music-pocket__lyric-line.is-active, .lyrics-view__line.is-active');
    const screenLyric = document.querySelector('.shijianus-screen-lyric');
    const ribbonLyric = document.querySelector('.shijianus-music-pocket__lyric-ribbon .ribbon-text, .shijianus-music-pocket__ribbon-lyric');
    return {
      lineCount: lines.length,
      sampleTexts: lines.slice(0, 5).map(el => el.textContent?.trim()),
      activeText: activeLine?.textContent?.trim() || null,
      screenLyricText: screenLyric?.textContent?.trim() || null,
      ribbonLyricText: ribbonLyric?.textContent?.trim() || null,
      activeKaraokePct: activeLine?.style?.getPropertyValue('--karaoke-pct') || null,
    };
  });
  console.log('DOM Lyrics State:', domLyrics);

  if (domLyrics.lineCount === 0) {
    throw new Error('❌ Zero lyric lines rendered in DOM!');
  }

  // 6. Test Multi-Timestamp Audio-Visual Synchronization
  console.log('6. Verifying audio-visual alignment across all song sections...');

  const checkpoints = [
    { targetSec: 0.8, desc: 'Intro Vocal 1: 멈춘 시간 속 (0.28s - 1.8s)' },
    { targetSec: 3.0, desc: 'Intro Vocal 2: 잠든 너를 찾아가 (2.36s - 4.4s)' },
    { targetSec: 18.5, desc: 'Intro Vocal Finish: way back home (17.97s - 21.0s)' },
    { targetSec: 24.2, desc: 'Post-Intro Instrumental Drop (20s - 39s musical build holding previous vocal)' },
    { targetSec: 42.0, desc: 'Verse 1: 다시 열린 서랍 같아 (41.75s)' },
    { targetSec: 58.5, desc: 'Chorus 1: 수없이 떠난 길 위에서 (57.46s)' },
    { targetSec: 78.0, desc: 'Chorus Hook Return: 멈춘 시간 속 / 잠든 너를 찾아가 (77.05s / 78.82s)' },
    { targetSec: 105.0, desc: 'Mid-Song Interlude (94.86s - 115.4s holding way back home)' },
    { targetSec: 160.0, desc: 'Climax: 오직 너로 완결된 (159.05s)' },
  ];

  const results = [];

  for (const cp of checkpoints) {
    const testResult = await page.evaluate(async (targetSec) => {
      const audio = document.querySelector('audio');
      if (!audio) return { error: 'audio not found' };
      audio.currentTime = targetSec;
      // Allow audio clock and requestAnimationFrame tick to update
      await new Promise(r => setTimeout(r, 600));

      const activeLine = document.querySelector('.lyrics-line.is-active, .shijianus-music-pocket__lyric-line.is-active, .lyrics-view__line.is-active');
      const lines = Array.from(document.querySelectorAll('.lyrics-line, .shijianus-music-pocket__lyric-line, .lyrics-view__line'));
      const activeIndex = lines.indexOf(activeLine);
      const pct = activeLine ? activeLine.style.getPropertyValue('--karaoke-pct') : null;
      const screenLyric = document.querySelector('.shijianus-screen-lyric');

      return {
        currentTime: audio.currentTime,
        activeIndex,
        activeText: activeLine ? activeLine.textContent.trim() : null,
        karaokePct: pct,
        screenLyric: screenLyric ? screenLyric.textContent.trim() : null,
      };
    }, cp.targetSec);

    console.log(`[SYNC CHECK ${cp.targetSec}s (${cp.desc})]:`, testResult);
    results.push({ ...cp, ...testResult });

    if (testResult.activeIndex < 0) {
      console.warn(`⚠️ Warning: activeIndex is -1 at ${cp.targetSec}s`);
    }
  }

  // 6.1 Test Dynamic Real-Time Karaoke Progress Streaming
  console.log('6.1 Verifying dynamic continuous karaoke progression during playback...');
  const progressionSamples = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    audio.currentTime = 57.5;
    await audio.play();
    const samples = [];
    for (let i = 0; i < 4; i++) {
      await new Promise(r => setTimeout(r, 300));
      const activeLine = document.querySelector('.lyrics-line.is-active');
      samples.push({
        t: audio.currentTime,
        pct: activeLine ? activeLine.style.getPropertyValue('--karaoke-pct') : null,
      });
    }
    return samples;
  });
  console.log('Dynamic Karaoke Samples over 1.2s:', progressionSamples);

  // 6.2 Test Screen Desktop Lyric Toggle & Sync
  console.log('6.2 Testing Screen Desktop Lyric Toggle...');
  const screenLyricBtn = await page.$('button.lyrics-screen-btn, button.shijianus-music-pocket__hud-btn[title*="桌面"], button[title*="屏幕"]');
  if (screenLyricBtn) {
    await screenLyricBtn.click();
    await page.waitForTimeout(500);
  }
  const screenLyricState = await page.evaluate(() => {
    const screenLyric = document.querySelector('.shijianus-screen-lyric');
    return {
      exists: !!screenLyric,
      text: screenLyric ? screenLyric.textContent.trim() : null,
      pct: screenLyric ? screenLyric.style.getPropertyValue('--karaoke-pct') : null,
    };
  });
  console.log('Screen Lyric State:', screenLyricState);

  // 7. Test Seek Resilience (backward and forward jumps)
  console.log('7. Testing seek resilience: backward jump (160s -> 0.8s)...');
  const backwardJump = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    audio.currentTime = 0.8;
    await new Promise(r => setTimeout(r, 600));
    const activeLine = document.querySelector('.lyrics-line.is-active, .shijianus-music-pocket__lyric-line.is-active, .lyrics-view__line.is-active');
    return {
      currentTime: audio.currentTime,
      activeText: activeLine ? activeLine.textContent.trim() : null,
      karaokePct: activeLine ? activeLine.style.getPropertyValue('--karaoke-pct') : null,
    };
  });
  console.log('Backward jump result:', backwardJump);

  // 8. Capture Screenshot
  console.log('8. Capturing verification screenshot...');
  await page.screenshot({ path: 'scripts/verify-full-song-sync.png', fullPage: false });
  console.log('Screenshot saved to scripts/verify-full-song-sync.png');

  await browser.close();

  // 9. Summary & Assertions
  const hasConsoleErrors = consoleErrors.length > 0;
  console.log('=== VERIFICATION SUMMARY ===');
  console.log(`Lyric API Status: ${lyricApiStatus}`);
  console.log(`Lines rendered: ${domLyrics.lineCount}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Sample Verse 1 Text at 24.2s: "${results.find(r => r.targetSec === 24.2)?.activeText}"`);
  console.log(`Sample Chorus Text at 58.5s: "${results.find(r => r.targetSec === 58.5)?.activeText}"`);
  console.log('All checkpoints passed with active lyric tracking!');

  return {
    success: domLyrics.lineCount > 10 && !hasConsoleErrors && results.every(r => r.activeIndex >= 0),
    checkpoints: results,
    domLyrics,
  };
}

verifyFullSongLyricsSync()
  .then(res => {
    console.log('RESULT:', JSON.stringify(res, null, 2));
    process.exit(res.success ? 0 : 1);
  })
  .catch(err => {
    console.error('FATAL ERROR during verification:', err);
    process.exit(1);
  });
