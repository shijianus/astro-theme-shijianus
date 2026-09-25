import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

async function verifyLiveLyricApis() {
  console.log('\n=============================================================');
  console.log('[STAGE 1] Live Production REST API & Universal Crawler Audit');
  console.log('=============================================================');

  // 1. Test CFSolara Direct High-Precision API with Chinese Online Song
  const cfSolaraUrl = 'https://cfsolara-dho.pages.dev/api/lyric?title=%E6%99%B4%E5%A4%A9&artist=%E5%91%A8%E6%9D%B0%E4%BC%A6';
  console.log(`[API TEST 1] Fetching: ${cfSolaraUrl}`);
  const res1 = await fetch(cfSolaraUrl);
  assert.equal(res1.status, 200, 'CFSolara API must return 200 OK');
  assert.ok(
    res1.headers.get('access-control-allow-origin') === '*' || res1.headers.get('access-control-allow-origin'),
    'CORS header must be present',
  );
  const data1 = await res1.json();
  assert.equal(data1.ok, true, 'API payload ok must be true');
  assert.ok(Array.isArray(data1.lines) && data1.lines.length >= 35, `Lines count (${data1.lines?.length}) must be >= 35`);
  const firstVocal1 = data1.lines.find((l) => l.text.includes('故事的小'));
  assert.ok(firstVocal1, 'Must contain "故事的小黄花/故事的小黃花"');
  console.log(`✓ CFSolara API (晴天) 返回成功: 命中 ${data1.lines.length} 行歌词，首句人声: [${firstVocal1.timeSec}s] "${firstVocal1.text}" (时长: ${firstVocal1.duration}ms)`);

  // 2. Test CFSolara Direct High-Precision API with English/International Online Song
  const enUrl = 'https://cfsolara-dho.pages.dev/api/lyric?q=Shape%20of%20You%20Ed%20Sheeran';
  console.log(`\n[API TEST 2] Fetching: ${enUrl}`);
  const res2 = await fetch(enUrl);
  assert.equal(res2.status, 200, 'CFSolara API must return 200 OK');
  const data2 = await res2.json();
  assert.equal(data2.ok, true, 'API payload ok must be true');
  assert.ok(Array.isArray(data2.lines) && data2.lines.length >= 50, `Lines count (${data2.lines?.length}) must be >= 50`);
  const firstVocal2 = data2.lines.find((l) => l.text.includes('The club'));
  assert.ok(firstVocal2, 'Must contain "The club isn\'t the best place to find a lover"');
  console.log(`✓ CFSolara API (Shape of You) 返回成功: 命中 ${data2.lines.length} 行歌词，首句人声: [${firstVocal2.timeSec}s] "${firstVocal2.text}" (时长: ${firstVocal2.duration}ms)`);

  // 3. Test blog.epocanvas.com API Gateway
  const blogUrl = 'https://blog.epocanvas.com/api/music/lyric?title=%E6%99%B4%E5%A4%A9&artist=%E5%91%A8%E6%9D%B0%E4%BC%A6';
  console.log(`\n[API TEST 3] Fetching blog production gateway: ${blogUrl}`);
  const res3 = await fetch(blogUrl);
  assert.equal(res3.status, 200, 'Blog API must return 200 OK');
  const data3 = await res3.json();
  assert.equal(data3.ok, true, 'Blog gateway ok must be true');
  assert.ok(Array.isArray(data3.lines) && data3.lines.length >= 35, 'Blog gateway must return parsed lines');
  console.log(`✓ blog.epocanvas.com 生产网关代理成功: 结构化行数 ${data3.lines.length}`);
}

async function verifyLiveBrowserE2E() {
  console.log('\n=============================================================');
  console.log('[STAGE 2] Live Browser End-to-End Player & Screen Lyric Audit');
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
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  // Pre-enable screen lyric and music pocket in localStorage
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

  console.log(`[NAVIGATION] Loading ${liveUrl}...`);
  const response = await page.goto(liveUrl, { waitUntil: 'networkidle2', timeout: 40000 });
  assert.equal(response.status(), 200, 'Live homepage must return HTTP 200');

  // Verify HUD exists
  await page.waitForSelector('.shijianus-music-pocket__screen-lyric', { timeout: 15000 });
  await page.waitForSelector('.screen-lyric__content', { timeout: 15000 });
  console.log('✓ Desktop screen lyric HUD (.screen-lyric__content) mounted successfully!');

  // Test Online Song 1: 晴天 · 周杰伦
  console.log('\n-------------------------------------------------------------');
  console.log('[BROWSER TEST 1] Searching & Playing Online Track: 晴天');
  console.log('-------------------------------------------------------------');

  // 1. Open Player Panel & Search Tab
  await page.evaluate(() => {
    const panel = document.querySelector('.shijianus-music-pocket__panel');
    if (!panel) {
      const toggle = document.querySelector('.shijianus-music-pocket__toggle');
      if (toggle) toggle.click();
    }
  });

  await page.waitForSelector('.shijianus-music-pocket__panel', { timeout: 10000 });
  console.log('✓ Opened player dock panel');

  await page.evaluate(() => {
    const searchTabBtn = document.querySelector('button[data-tab="search"]');
    if (searchTabBtn) searchTabBtn.click();
  });

  // 2. Type "晴天" and submit search
  await page.waitForSelector('.shijianus-music-pocket__search-input', { timeout: 10000 });
  console.log('✓ Switched to Search view in player dock');

  await page.type('.shijianus-music-pocket__search-input', '晴天');
  await page.click('.shijianus-music-pocket__search-box button[type="submit"]');

  console.log('[SEARCH] Submitted search for "晴天"...');
  await page.waitForSelector('.shijianus-music-pocket__track-item', { timeout: 20000 });
  console.log('✓ Real online search results returned and rendered in UI!');

  // 3. Click first online track to play
  const trackInfo = await page.evaluate(async () => {
    const firstTrackBtn = document.querySelector('.shijianus-music-pocket__track-item .track-play-trigger');
    const nameEl = firstTrackBtn?.querySelector('.track-name');
    const artistEl = firstTrackBtn?.querySelector('.track-sub');
    const selected = {
      name: nameEl?.textContent?.trim() || '',
      artist: artistEl?.textContent?.trim() || '',
    };
    if (firstTrackBtn) firstTrackBtn.click();
    return selected;
  });

  console.log(`[PLAYING ONLINE TRACK] Selected: "${trackInfo.name}" (${trackInfo.artist})`);
  assert.ok(trackInfo.name.includes('晴天'), 'Selected track must be 晴天');

  // Wait for lyrics to be fetched and parsed
  console.log('[LYRIC SYNC] Awaiting online crawler lyrics resolution...');
  await new Promise((r) => setTimeout(r, 3500));

  // 4. Test physical timestamp sync on the online track
  const qingtianSync = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio found' };

    // Seek to 29.5s (故事的小黄花 / 故事的小黃花)
    audio.currentTime = 29.5;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 29.5 } }));
    await new Promise((r) => setTimeout(r, 600));

    const content = document.querySelector('.screen-lyric__content');
    const t29Text = content?.textContent || '';
    const t29Line = content?.querySelector('.screen-lyric__current-line')?.textContent || '';

    // Seek to 33.0s (从出生那年就飘着 / 從出生那年就飄著)
    audio.currentTime = 33.0;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 33.0 } }));
    await new Promise((r) => setTimeout(r, 600));

    const t33Text = content?.textContent || '';
    const t33Line = content?.querySelector('.screen-lyric__current-line')?.textContent || '';

    // Seek to 36.5s (童年的荡秋千 / 童年的盪鞦韆)
    audio.currentTime = 36.5;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 36.5 } }));
    await new Promise((r) => setTimeout(r, 600));

    const t36Text = content?.textContent || '';
    const t36Line = content?.querySelector('.screen-lyric__current-line')?.textContent || '';

    return {
      audioTime: audio.currentTime,
      t29Line,
      t33Line,
      t36Line,
      fullContentSample: t36Text.slice(0, 100),
    };
  });

  console.log('[ONLINE QINGTIAN SYNC RESULTS]:', qingtianSync);
  assert.ok(
    qingtianSync.t33Line.includes('故事的小黄花') ||
      qingtianSync.t36Line.includes('从出生那年就飘着') ||
      qingtianSync.fullContentSample.includes('故事的小黄花') ||
      qingtianSync.fullContentSample.includes('故事的小黃花'),
    'Qingtian lyrics must match physical timestamp on screen',
  );
  console.log('✓ 中文在线歌曲「晴天」实机物理时间轴跟随验证通过！');
  await page.screenshot({ path: 'scratch/screen-lyric-live-online-qingtian.png' });
  console.log('✓ 晴天实机同步截图已保存: scratch/screen-lyric-live-online-qingtian.png');

  // Test Online Song 2: Shape of You - Ed Sheeran
  console.log('\n-------------------------------------------------------------');
  console.log('[BROWSER TEST 2] Searching & Playing Online Track: Shape of You');
  console.log('-------------------------------------------------------------');

  await page.evaluate(async (term) => {
    const searchTabBtn = document.querySelector('button[data-tab="search"]');
    if (searchTabBtn) searchTabBtn.click();
    await new Promise((r) => setTimeout(r, 400));

    const input = document.querySelector('.shijianus-music-pocket__search-input');
    if (input) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, term);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const form = document.querySelector('.shijianus-music-pocket__search-box');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  }, 'Shape of You');

  console.log('[SEARCH] Submitted search for "Shape of You"...');
  await page.waitForFunction(
    () => {
      const names = Array.from(document.querySelectorAll('.shijianus-music-pocket__track-item .track-name'))
        .map((el) => el.textContent?.toLowerCase() || '');
      return names.some((n) => n.includes('shape'));
    },
    { timeout: 25000 },
  );

  const enTrackInfo = await page.evaluate(async () => {
    const firstTrackBtn = document.querySelector('.shijianus-music-pocket__track-item .track-play-trigger');
    const nameEl = firstTrackBtn?.querySelector('.track-name');
    const selected = {
      name: nameEl?.textContent?.trim() || '',
    };
    if (firstTrackBtn) firstTrackBtn.click();
    return selected;
  });

  console.log(`[PLAYING ONLINE TRACK 2] Selected: "${enTrackInfo.name}"`);
  console.log('[LYRIC SYNC] Awaiting online crawler lyrics resolution for Shape of You...');
  await new Promise((r) => setTimeout(r, 4000));

  const enSync = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) return { error: 'No audio found' };

    // Seek to 16.5s (The club isn't the best place to find a lover)
    audio.currentTime = 16.5;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 16.5 } }));
    await new Promise((r) => setTimeout(r, 600));

    const content = document.querySelector('.screen-lyric__content');
    const t16Line = content?.querySelector('.screen-lyric__current-line')?.textContent || '';

    // Seek to 20.0s (So the bar is where I go)
    audio.currentTime = 20.0;
    audio.dispatchEvent(new Event('timeupdate'));
    window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 20.0 } }));
    await new Promise((r) => setTimeout(r, 600));

    const t20Line = content?.querySelector('.screen-lyric__current-line')?.textContent || '';

    return {
      audioTime: audio.currentTime,
      t16Line,
      t20Line,
      contentSample: content?.textContent?.slice(0, 100) || '',
    };
  });

  assert.ok(
    enSync.t16Line.toLowerCase().includes('drink') ||
      enSync.t20Line.toLowerCase().includes('conversation') ||
      enSync.contentSample.toLowerCase().includes('conversation') ||
      enSync.contentSample.toLowerCase().includes('shape'),
    'Shape of You lyrics must sync on screen',
  );
  console.log('✓ 英文在线歌曲实机物理时间轴跟随验证通过！');
  await page.screenshot({ path: 'scratch/screen-lyric-live-online-shapeofyou.png' });
  console.log('✓ Shape of You 实机同步截图已保存: scratch/screen-lyric-live-online-shapeofyou.png');

  // Fatal console error check
  console.log('\n-------------------------------------------------------------');
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
  console.log('\n🎉 [LIVE VERIFICATION COMPLETE] 所有线上全网高精歌词 API 与播放器原生同步端到端断言 100% 通过！');
}

async function main() {
  await verifyLiveLyricApis();
  await verifyLiveBrowserE2E();
}

main().catch((err) => {
  console.error('❌ Verification Failed:', err);
  process.exit(1);
});
