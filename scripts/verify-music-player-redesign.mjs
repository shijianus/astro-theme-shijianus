#!/usr/bin/env node
/**
 * One-click regression suite for the redesigned music player.
 *
 * Run from the repository root:
 *   node scripts/verify-music-player-redesign.mjs
 *
 * By default it starts an isolated Astro dev server on a free port. Set
 * BASE_URL=http://127.0.0.1:4325 to reuse an existing server instead.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const EXTERNAL_BASE = process.env.BASE_URL?.replace(/\/$/, '');
const LAUNCH_TIMEOUT = 90000;

let serverProcess = null;
let serverLogs = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pass(name) {
  console.log(`PASS  ${name}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getFreePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const address = probe.address();
  const port = typeof address === 'object' && address ? address.port : 4325;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

async function waitForServer(url, timeout = LAUNCH_TIMEOUT) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.ok || response.status === 304) return;
    } catch {}
    if (serverProcess?.exitCode !== null) {
      throw new Error(`Astro dev exited before becoming ready:\n${serverLogs.slice(-40).join('')}`);
    }
    await sleep(500);
  }
  throw new Error(`Astro dev did not become ready at ${url}:\n${serverLogs.slice(-40).join('')}`);
}

function stopServer() {
  if (!serverProcess) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(serverProcess.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    serverProcess.kill('SIGTERM');
  }
  serverProcess = null;
}

async function ensureServer() {
  if (EXTERNAL_BASE) return EXTERNAL_BASE;

  const port = await getFreePort();
  const astroBin = path.join(ROOT, 'node_modules', 'astro', 'bin', 'astro.mjs');
  serverProcess = spawn(
    process.execPath,
    [astroBin, 'dev', '--host', '127.0.0.1', '--port', String(port)],
    {
      cwd: ROOT,
      env: { ...process.env, MUSIC_PLAYER_VARIANT: 'redesign' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    },
  );

  const capture = (chunk) => {
    serverLogs.push(String(chunk));
    if (serverLogs.length > 80) serverLogs = serverLogs.slice(-80);
  };
  serverProcess.stdout?.on('data', capture);
  serverProcess.stderr?.on('data', capture);

  const base = `http://127.0.0.1:${port}`;
  await waitForServer(`${base}/__music-demo`);
  // Prewarm the real layout so the first browser navigation is not charged
  // with Astro's on-demand page compilation under test load.
  await waitForServer(`${base}/`);
  return base;
}

function isKnownBrowserNoise(text) {
  return (
    text.includes('same key') ||
    text.includes('hydrated but some attributes') ||
    text.includes('Failed to load resource') ||
    text.includes('net::ERR_') ||
    text.includes('MediaElementAudioSourceNode')
  );
}

async function withPage(browser, base, { viewport, path: pagePath, clock = false, setup }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  const noise = [];
  page.on('console', (message) => {
    if (message.type() === 'error') noise.push(message.text());
  });
  page.on('pageerror', (error) => noise.push(`PAGEERROR: ${error.message}`));

  if (setup) await setup(page);
  if (clock) await page.clock.install();
  await page.goto(`${base}${pagePath}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="mp-root"]', { state: 'visible', timeout: 25000 });
  await page.waitForTimeout(500);

  return {
    page,
    noise,
    async close() {
      await context.close();
    },
  };
}

async function openPanel(page) {
  const open = await page.getByTestId('mp-panel').getAttribute('data-open');
  if (open !== 'true') {
    await page.getByTestId('mp-bubble').click();
    await page.getByTestId('mp-panel').waitFor({ state: 'visible' });
    await page.waitForTimeout(320);
  }
}

async function audioState(page) {
  return page.evaluate(() => {
    const audio = document.querySelector('[data-testid="mp-audio"]');
    return {
      exists: Boolean(audio),
      paused: audio?.paused ?? true,
      currentTime: audio?.currentTime ?? 0,
      duration: audio?.duration ?? 0,
      rate: audio?.playbackRate ?? 0,
      volume: audio?.volume ?? 0,
      muted: audio?.muted ?? false,
      src: audio?.currentSrc || audio?.getAttribute('src') || '',
    };
  });
}

async function waitForPlaying(page, timeout = 15000) {
  await page.waitForFunction(
    () => {
      const audio = document.querySelector('[data-testid="mp-audio"]');
      return Boolean(audio && !audio.paused && audio.currentTime > 0.15);
    },
    null,
    { timeout },
  );
}

async function setRange(page, testId, value) {
  const input =
    testId === 'mp-waveform'
      ? page.locator('[data-testid="mp-waveform"] input[type="range"]')
      : page.getByTestId(testId);
  await input.evaluate((element, nextValue) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(element, String(nextValue));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function currentTrackTitle(page) {
  return (await page.locator('.mp-track__title .mp-marquee__text').first().textContent())?.trim() || '';
}

async function setLoopMode(page, mode) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if ((await page.getByTestId('mp-loop').getAttribute('data-loop-mode')) === mode) return;
    await page.getByTestId('mp-loop').click();
    await page.waitForTimeout(100);
  }
  throw new Error(`Unable to switch loop mode to ${mode}`);
}

async function testDemoShell(browser, base) {
  const session = await withPage(browser, base, {
    viewport: { width: 1440, height: 900 },
    path: '/__music-demo',
  });
  const { page, noise } = session;

  try {
    assert((await page.locator('[data-testid="mp-root"]').count()) === 1, 'Expected exactly one player root');
    assert((await page.locator('.shijianus-music-pocket').count()) === 0, 'Legacy player must not mount with redesign');
    assert((await page.locator('[data-testid="mp-audio"]').count()) === 1, 'Expected exactly one player audio element');
    assert((await page.locator('audio').count()) === 1, 'Demo should contain exactly one audio element');
    assert((await page.locator('[role="tab"][data-testid^="mp-tab-"]').count()) === 4, 'Expected four player tabs');
    assert((await page.getByTestId('mp-panel').getAttribute('data-open')) === 'true', 'Demo should start expanded');
    assert((await page.getByTestId('mp-bubble').getAttribute('aria-expanded')) === 'true', 'Bubble aria-expanded must be true');
    assert((await audioState(page)).paused === true, 'Audio must not autoplay');
    await openPanel(page);
  } finally {
    await session.close();
  }
  const unexpected = noise.filter((item) => !isKnownBrowserNoise(item));
  assert(unexpected.length === 0, `Unexpected demo console/page errors: ${unexpected.join(' | ')}`);
  pass('demo shell, single audio element and no legacy player');
}

async function testKeyboardAndCollapse(browser, base) {
  const session = await withPage(browser, base, {
    viewport: { width: 1440, height: 900 },
    path: '/__music-demo',
  });
  const { page } = session;
  try {
    await page.getByTestId('mp-tab-player').focus();
    await page.keyboard.press('ArrowRight');
    assert((await page.getByTestId('mp-tab-lyrics').getAttribute('aria-selected')) === 'true', 'ArrowRight should select lyrics');
    assert((await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))) === 'mp-tab-lyrics', 'ArrowRight should focus lyrics tab');
    await page.keyboard.press('End');
    assert((await page.getByTestId('mp-tab-discover').getAttribute('aria-selected')) === 'true', 'End should select discover');
    await page.keyboard.press('Home');
    assert((await page.getByTestId('mp-tab-player').getAttribute('aria-selected')) === 'true', 'Home should select player');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    assert((await page.getByTestId('mp-panel').getAttribute('data-open')) === 'false', 'Escape should collapse panel');
    assert((await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))) === 'mp-bubble', 'Escape should focus the bubble');

    await page.getByTestId('mp-bubble').click();
    await page.waitForTimeout(350);
    assert((await page.getByTestId('mp-panel').getAttribute('data-open')) === 'true', 'Bubble should reopen panel');
    assert((await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))) === 'mp-panel', 'Opening should focus the panel');
    pass('tabs keyboard navigation, Escape and focus return');
  } finally {
    await session.close();
  }
}

async function testPlaybackControls(browser, base) {
  const session = await withPage(browser, base, {
    viewport: { width: 1440, height: 900 },
    path: '/__music-demo',
  });
  const { page, noise } = session;

  try {
    await page.getByTestId('mp-play').click();
    await waitForPlaying(page);
    const playing = await audioState(page);
    assert(playing.paused === false, 'Audio should be playing');
    assert(playing.currentTime > 0.15, 'Audio currentTime should advance');
    assert((await page.getByTestId('mp-waveform').getAttribute('data-spectrum-active')) === 'true', 'Spectrum should be active while playing');

    await page.getByTestId('mp-speed').click();
    await page.waitForTimeout(250);
    assert(Math.abs((await audioState(page)).rate - 1.25) < 0.001, 'Speed button should set playbackRate to 1.25');

    await setRange(page, 'mp-waveform', 40);
    await page.waitForTimeout(350);
    assert((await audioState(page)).currentTime > 35, 'Waveform seek should update audio.currentTime');

    await page.getByTestId('mp-next').click();
    await page.waitForTimeout(1000);
    const next = await audioState(page);
    assert(next.paused === false, 'Next track should keep playing');
    assert(Math.abs(next.rate - 1.25) < 0.001, 'Playback rate should survive track changes');
    const nextTitle = await currentTrackTitle(page);
    assert(nextTitle.includes('彼女'), `Next track should switch title, got ${nextTitle}`);

    await page.getByTestId('mp-prev').click();
    await page.waitForTimeout(900);
    assert((await currentTrackTitle(page)).includes('Way Back Home'), 'Previous track should return to first track');

    await setRange(page, 'mp-volume', 0.42);
    await page.waitForTimeout(250);
    assert(Math.abs((await audioState(page)).volume - 0.42) < 0.02, 'Volume slider should change audio.volume');
    await page.locator('.mp-volume .mp-control-btn').click();
    await page.waitForTimeout(150);
    assert((await audioState(page)).muted === true, 'Mute button should set audio.muted');
    await page.locator('.mp-volume .mp-control-btn').click();
    await page.waitForTimeout(150);
    assert((await audioState(page)).muted === false, 'Unmute button should clear audio.muted');

    await page.getByTestId('mp-collapse').click();
    await page.waitForTimeout(350);
    assert((await audioState(page)).paused === false, 'Collapsing must not stop audio');
    assert((await page.getByTestId('mp-waveform').getAttribute('data-spectrum-active')) === 'false', 'Spectrum must stop when collapsed');
    await page.getByTestId('mp-bubble').click();
    await page.waitForTimeout(350);
    assert((await page.getByTestId('mp-waveform').getAttribute('data-spectrum-active')) === 'true', 'Spectrum should resume when reopened');

    await page.getByTestId('mp-play').click();
    await page.waitForTimeout(250);
    assert((await audioState(page)).paused === true, 'Play button should pause');
    assert((await page.getByTestId('mp-waveform').getAttribute('data-spectrum-active')) === 'false', 'Spectrum must stop when paused');
    pass('real audio play, pause, seek, speed, volume, mute and spectrum gating');
  } finally {
    await session.close();
  }

  const unexpected = noise.filter((item) => !isKnownBrowserNoise(item));
  assert(unexpected.length === 0, `Unexpected playback errors: ${unexpected.join(' | ')}`);
}

async function testSpectrumFallback(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  try {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'AudioContext', {
        configurable: true,
        value: class BlockedAudioContext {
          constructor() {
            throw new Error('AudioContext blocked for fallback test');
          }
        },
      });
      Object.defineProperty(window, 'webkitAudioContext', {
        configurable: true,
        value: undefined,
      });
    });
    await page.goto(`${base}/__music-demo`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="mp-panel"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.getByTestId('mp-play').click();
    await waitForPlaying(page);
    const state = await audioState(page);
    assert(state.paused === false, 'Audio must still play when AudioContext is unavailable');
    assert((await page.getByTestId('mp-waveform').getAttribute('data-spectrum-active')) === 'false', 'Spectrum must fall back to static waveform');
    pass('static waveform fallback when AudioContext fails');
  } finally {
    await context.close();
  }
}

async function testThemeAndLocaleWhilePlaying(browser, base) {
  const session = await withPage(browser, base, {
    viewport: { width: 1440, height: 900 },
    path: '/__music-demo',
  });
  const { page } = session;
  try {
    await page.getByTestId('mp-play').click();
    await waitForPlaying(page);
    const before = await audioState(page);

    await page.locator('[data-demo-theme="dark"]').click();
    await page.locator('[data-demo-locale="en"]').click();
    await page.waitForTimeout(900);
    const after = await audioState(page);
    assert(after.paused === false, 'Theme/locale changes must not pause audio');
    assert(after.currentTime > before.currentTime, 'Audio should continue advancing through theme/locale changes');
    assert((await page.getByTestId('mp-tab-player').textContent())?.includes('Play'), 'Locale switch should update player labels');
    pass('theme and locale switches keep audio uninterrupted');
  } finally {
    await session.close();
  }
}

async function testLocales(browser, base) {
  const session = await withPage(browser, base, {
    viewport: { width: 1440, height: 900 },
    path: '/__music-demo',
  });
  const { page } = session;
  try {
    for (const locale of ['en', 'fr', 'es', 'de']) {
      await page.locator(`[data-demo-locale="${locale}"]`).click();
      await page.waitForTimeout(180);
      const ui = await page.evaluate(() => ({
        tabs: Array.from(document.querySelectorAll('[data-testid="mp-panel"] [role="tab"]')).map((tab) => tab.textContent || ''),
        more: document.querySelector('[data-testid="mp-more"]')?.getAttribute('aria-label') || '',
        source: document.querySelector('.mp-source')?.textContent || '',
      }));
      const cjk = /[㐀-鿿]/;
      assert(!ui.tabs.some((tab) => cjk.test(tab)), `${locale}: tabs still contain CJK`);
      assert(!cjk.test(ui.more), `${locale}: more label still contains CJK`);
      assert(!cjk.test(ui.source), `${locale}: source label still contains CJK`);
    }

    await page.locator('[data-demo-locale="zh-Hant"]').click();
    await page.waitForTimeout(180);
    assert((await page.getByTestId('mp-tab-lyrics').textContent())?.includes('歌詞'), 'zh-Hant lyrics label should be traditional');
    assert((await page.getByTestId('mp-tab-discover').textContent())?.includes('發現'), 'zh-Hant discover label should be traditional');
    pass('six-locale player UI labels');
  } finally {
    await session.close();
  }
}

async function testLoopModes(browser, base) {
  for (const mode of ['off', 'single', 'list']) {
    const session = await withPage(browser, base, {
      viewport: { width: 1440, height: 900 },
      path: '/__music-demo',
    });
    const { page } = session;
    try {
      await page.getByTestId('mp-play').click();
      await waitForPlaying(page);
      await page.getByTestId('mp-next').click();
      await page.waitForTimeout(800);
      await page.getByTestId('mp-next').click();
      await page.waitForTimeout(1000);
      await setLoopMode(page, mode);
      const titleBefore = await currentTrackTitle(page);

      const duration = (await audioState(page)).duration;
      assert(duration > 2, 'Loop test needs a loaded audio duration');
      await setRange(page, 'mp-waveform', Math.max(0, duration - 0.4));
      await page.waitForTimeout(1600);

      if (mode === 'off') {
        assert((await audioState(page)).paused === true, 'off must stop at the end of the queue');
        assert((await page.getByTestId('mp-notice').innerText()).includes('播放已结束'), 'off end should show a visible notice');
      } else if (mode === 'single') {
        const state = await audioState(page);
        assert(state.paused === false, 'single must replay the current track');
        assert((await currentTrackTitle(page)) === titleBefore, 'single must keep the same track');
      } else {
        const state = await audioState(page);
        assert(state.paused === false, 'list must continue playing');
        assert((await currentTrackTitle(page)) !== titleBefore, 'list must wrap to the next track');
      }
      pass(`loop mode ${mode}`);
    } finally {
      await session.close();
    }
  }
}

async function testTimer(browser, base) {
  const session = await withPage(browser, base, {
    viewport: { width: 1440, height: 900 },
    path: '/__music-demo',
    clock: true,
  });
  const { page } = session;
  try {
    await page.getByTestId('mp-play').click();
    await waitForPlaying(page);

    await page.getByTestId('mp-more').click();
    await page.getByRole('menuitemradio', { name: '15分钟后自动暂停' }).click();
    await page.waitForTimeout(150);
    await page.getByTestId('mp-more').click();
    const menuLabel = await page.getByTestId('mp-more-menu').innerText();
    assert(menuLabel.includes('15:00'), `Timer menu should show remaining time, got: ${menuLabel}`);

    await page.getByRole('menuitemradio', { name: '定时休眠已关闭' }).click();
    await page.waitForTimeout(150);
    await page.clock.fastForward(15 * 60 * 1000);
    await page.waitForTimeout(150);
    assert((await audioState(page)).paused === false, 'Cancelling the timer must keep playback running');

    await page.getByTestId('mp-more').click();
    await page.getByRole('menuitemradio', { name: '15分钟后自动暂停' }).click();
    await page.waitForTimeout(100);
    await page.clock.fastForward(15 * 60 * 1000);
    await page.waitForTimeout(250);
    assert((await audioState(page)).paused === true, 'Timer expiry must pause audio');
    assert((await page.getByTestId('mp-notice').innerText()).includes('定时休眠已到达'), 'Timer expiry should show a visible notice');
    pass('sleep timer countdown, remaining label, cancel and expiry');
  } finally {
    await session.close();
  }
}

async function testRefreshRestore(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  try {
    await page.goto(`${base}/__music-demo`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="mp-panel"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.getByTestId('mp-play').click();
    await waitForPlaying(page);
    await page.getByTestId('mp-next').click();
    await page.waitForTimeout(900);
    await setRange(page, 'mp-volume', 0.37);
    await page.waitForTimeout(250);
    const titleBefore = await currentTrackTitle(page);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="mp-panel"]', { state: 'visible' });
    await page.waitForTimeout(900);
    const after = await audioState(page);
    assert(after.paused === true, 'Refresh must not autoplay');
    assert(Math.abs(after.volume - 0.37) < 0.02, 'Refresh must restore volume');
    assert((await currentTrackTitle(page)) === titleBefore, 'Refresh must restore the current track');
    pass('refresh restores track and volume without autoplay');
  } finally {
    await context.close();
  }
}

async function testErrorState(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  try {
    await page.route('**/WayBackHome.flac', (route) => route.abort());
    await page.goto(`${base}/__music-demo`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="mp-panel"]', { state: 'visible' });
    await page.waitForTimeout(400);
    await page.getByTestId('mp-play').click();
    await page.waitForTimeout(1200);
    const state = await audioState(page);
    const notice = await page.getByTestId('mp-notice').innerText();
    assert(state.paused === true, 'Failed audio must not appear playing');
    assert(notice.includes('播放失败') || notice.includes('音频加载遇到问题'), `Expected visible playback error, got: ${notice}`);
    pass('playback failure surfaces a visible translated notice');
  } finally {
    await context.close();
  }
}

async function testAutoplayBlocked(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  try {
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = function blockedPlay() {
        return Promise.reject(new DOMException('Autoplay blocked for test', 'NotAllowedError'));
      };
    });
    await page.goto(`${base}/__music-demo`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="mp-panel"]', { state: 'visible' });
    await page.waitForTimeout(400);
    await page.getByTestId('mp-play').click();
    await page.waitForTimeout(600);
    const notice = await page.getByTestId('mp-notice').innerText();
    assert((await audioState(page)).paused === true, 'Blocked autoplay must not appear playing');
    assert(notice.includes('浏览器阻止了自动播放'), `Expected autoplay-blocked notice, got: ${notice}`);
    pass('autoplay restriction surfaces a visible translated notice');
  } finally {
    await context.close();
  }
}

async function testEmptyQueue(browser, base) {
  const session = await withPage(browser, base, {
    viewport: { width: 1440, height: 900 },
    path: '/__music-demo',
  });
  const { page } = session;
  try {
    await page.getByTestId('mp-tab-queue').click();
    let guard = 0;
    while ((await page.getByTestId('mp-queue-item').count()) > 0 && guard < 6) {
      await page.getByTestId('mp-queue-item').first().locator('.mp-row-action').click();
      await page.waitForTimeout(250);
      guard += 1;
    }
    assert((await page.getByTestId('mp-queue-item').count()) === 0, 'Queue should be empty');
    assert((await page.getByTestId('mp-play').isDisabled()) === true, 'Play should be disabled with an empty queue');
    assert((await page.locator('.mp-queue-view .mp-empty').innerText()).includes('当前播放队列为空'), 'Empty queue state should be visible');
    pass('empty queue state and disabled transport');
  } finally {
    await session.close();
  }
}

async function testPlaylistFallback(browser, base) {
  const session = await withPage(browser, base, {
    viewport: { width: 1440, height: 900 },
    path: '/',
  });
  const { page } = session;
  try {
    await openPanel(page);
    await page.waitForFunction(
      () => document.querySelector('[data-testid="mp-notice"]')?.innerText.includes('播放列表加载失败'),
      null,
      { timeout: 5000 },
    );
    assert((await page.getByTestId('mp-tab-queue').textContent())?.includes('(3)'), 'Fallback queue should remain available');
    await page.getByTestId('mp-play').click();
    await waitForPlaying(page);
    pass('playlist failure uses local fallback with visible notice');
  } finally {
    await session.close();
  }
}

async function testRealHome(browser, base) {
  const mockTracks = [
    {
      id: 'local-way-back-home',
      name: 'API Way Back Home',
      artist: 'API SHAUN',
      album: 'API Album',
      source: 'local',
      coverUrl: '/media/audio/covers/way_back_home.jpg',
      urlId: '/media/audio/WayBackHome.flac',
    },
    {
      id: 'api-second',
      name: 'API Second',
      artist: 'API Artist',
      source: 'local',
      coverUrl: '/media/audio/covers/kanojo_wa_tabi_ni_deru.jpg',
      urlId: '/media/audio/彼女は旅に出る.mp3',
    },
  ];

  const session = await withPage(browser, base, {
    viewport: { width: 1440, height: 900 },
    path: '/',
    setup: async (page) => {
      await page.route('**/api/music/playlist', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, tracks: mockTracks }),
        }),
      );
    },
  });
  const { page, noise } = session;

  try {
    assert((await page.locator('.shijianus-music-pocket').count()) === 0, 'Legacy player must be absent in redesign');
    assert((await page.locator('[data-testid="mp-audio"]').count()) === 1, 'Real page should have one player audio');
    await page.waitForFunction(
      () => document.querySelector('[data-testid="mp-tab-queue"]')?.textContent?.includes('(2)'),
      null,
      { timeout: 5000 },
    );

    await page.locator('#rightside').hover();
    await page.locator('#toggle-music-pocket').click();
    await page.waitForTimeout(400);
    assert((await page.getByTestId('mp-panel').getAttribute('data-open')) === 'true', 'Dock button should open the panel');

    await page.getByTestId('mp-play').click();
    await waitForPlaying(page);
    const state = await audioState(page);
    assert(state.paused === false, 'Real page audio should play');
    assert(state.currentTime > 0.1, 'Real page audio should advance');
    pass('real page: API queue, dock toggle and audible playback');
  } finally {
    await session.close();
  }

  const unexpected = noise.filter((item) => !isKnownBrowserNoise(item));
  assert(unexpected.length === 0, `Unexpected real-page errors: ${unexpected.join(' | ')}`);
}

async function testDockSafeAreaAndMobile(browser, base) {
  const desktop = await withPage(browser, base, {
    viewport: { width: 1440, height: 900 },
    path: '/',
    setup: async (page) => {
      await page.route('**/api/music/playlist', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, tracks: [] }),
        }),
      );
    },
  });
  try {
    const bubble = await desktop.page.getByTestId('mp-bubble').boundingBox();
    const dock = await desktop.page.locator('#rightside').boundingBox();
    assert(bubble && dock, 'Bubble and dock should be measurable');
    await desktop.page.mouse.move(bubble.x + 24, bubble.y + 24);
    await desktop.page.mouse.down();
    await desktop.page.mouse.move(1400, 620, { steps: 18 });
    await desktop.page.mouse.up();
    await desktop.page.waitForTimeout(350);
    const result = await desktop.page.evaluate(() => {
      const bubbleRect = document.querySelector('[data-testid="mp-bubble"]')?.getBoundingClientRect();
      const dockRect = document.querySelector('#rightside')?.getBoundingClientRect();
      return {
        overlap:
          bubbleRect && dockRect
            ? !(bubbleRect.right <= dockRect.left || bubbleRect.left >= dockRect.right || bubbleRect.bottom <= dockRect.top || bubbleRect.top >= dockRect.bottom)
            : null,
      };
    });
    assert(result.overlap === false, 'Dragged launcher must not overlap the right dock');
    pass('desktop dock safe area');
  } finally {
    await desktop.close();
  }

  const mobile = await withPage(browser, base, {
    viewport: { width: 375, height: 812 },
    path: '/',
    setup: async (page) => {
      await page.route('**/api/music/playlist', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, tracks: [] }),
        }),
      );
    },
  });
  try {
    await openPanel(mobile.page);
    const layout = await mobile.page.evaluate(() => {
      const panel = document.querySelector('[data-testid="mp-panel"]')?.getBoundingClientRect();
      const dock = document.querySelector('#rightside');
      return {
        panel: panel?.toJSON(),
        viewport: { width: window.innerWidth, height: window.innerHeight },
        dockVisibility: dock ? getComputedStyle(dock).visibility : null,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    assert(layout.panel && Math.abs(layout.panel.width - layout.viewport.width) < 2, 'Mobile panel must be full width');
    assert(layout.panel && Math.abs(layout.panel.bottom - layout.viewport.height) < 2, 'Mobile panel must sit at the viewport bottom');
    assert(layout.dockVisibility === 'hidden', 'Right dock must yield while the mobile panel is open');
    assert(layout.overflow === false, 'Mobile player must not cause horizontal overflow');
    pass('mobile bottom sheet and dock yielding');
  } finally {
    await mobile.close();
  }
}

async function main() {
  const base = await ensureServer();
  console.log(`Music player redesign suite running against ${base}`);
  const browser = await chromium.launch({ headless: true });

  try {
    await testDemoShell(browser, base);
    await testKeyboardAndCollapse(browser, base);
    await testPlaybackControls(browser, base);
    await testSpectrumFallback(browser, base);
    await testThemeAndLocaleWhilePlaying(browser, base);
    await testLocales(browser, base);
    await testLoopModes(browser, base);
    await testTimer(browser, base);
    await testRefreshRestore(browser, base);
    await testErrorState(browser, base);
    await testAutoplayBlocked(browser, base);
    await testEmptyQueue(browser, base);
    await testPlaylistFallback(browser, base);
    await testRealHome(browser, base);
    await testDockSafeAreaAndMobile(browser, base);
    console.log('ALL PASS');
  } finally {
    await browser.close();
  }
}

main()
  .catch((error) => {
    console.error(`FAIL: ${error?.stack || error?.message || error}`);
    if (serverLogs.length) console.error(`--- Astro dev log tail ---
${serverLogs.slice(-30).join('')}`);
    process.exitCode = 1;
  })
  .finally(() => {
    stopServer();
  });
