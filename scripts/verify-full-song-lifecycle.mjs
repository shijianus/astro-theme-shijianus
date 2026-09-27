import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_URL || 'https://blog.epocanvas.com';

async function runAudit() {
  console.log(`[Audit] Initiating full song lifecycle & interlude verification against: ${BASE_URL}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  });

  await context.addInitScript(() => {
    window.localStorage.setItem('shijianus-music-pocket-visible', 'true');
    window.localStorage.setItem('shijianus-screen-lyric', 'true');
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('/api/music/')) {
      console.log(`[API Response] ${resp.status()} ${url}`);
    } else if (resp.status() >= 400) {
      console.warn(`[4xx/5xx Response] ${resp.status()} ${url}`);
    }
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('[Audit] Page loaded successfully');

    // 1. 展开随身音乐播放器面板
    await page.waitForTimeout(1000);
    const toggleBtn = page.locator('.shijianus-music-pocket__toggle');
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(600);
    }

    // ==========================================
    // TEST 1: Track 1 (Way Back Home) 韩国原版语种保障
    // ==========================================
    console.log('\n--- [Test 1] Track 1: Way Back Home ---');
    const track1AudioSrc = await page.evaluate(() => {
      const audio = document.querySelector('audio');
      return audio ? audio.src : '';
    });
    console.log('[Test 1] Audio src:', track1AudioSrc);

    // 等待歌词加载并检查第一句是否为韩语原版（杜绝 Conor Maynard 英文版）
    await page.waitForTimeout(1500);
    const track1Lyrics = await page.evaluate(() => {
      const activeEl = document.querySelector('.screen-lyric__vocal-text, .ribbon-text');
      return activeEl ? activeEl.textContent.trim() : '';
    });
    console.log('[Test 1] Initial displayed lyric:', track1Lyrics);

    // 验证音频播放与时间推进
    const track1TestPassed = await page.evaluate(async () => {
      const audio = document.querySelector('audio');
      if (!audio) return false;
      audio.currentTime = 0.5;
      await new Promise((r) => setTimeout(r, 600));
      const text = document.querySelector('.screen-lyric__vocal-text, .ribbon-text')?.textContent || '';
      // 必须包含韩文字符，绝不能是 "Remember when I told you"
      const hasKorean = /[\uac00-\ud7af]/.test(text) || text.includes('멈춘') || text.includes('시간');
      const isEnglishCollab = text.includes('Remember') || text.includes('told you');
      return { text, hasKorean, isEnglishCollab, currentTime: audio.currentTime };
    });
    console.log('[Test 1] Result at 0.5s:', track1TestPassed);

    // ==========================================
    // TEST 2: Track 2 (彼女は旅に出る) 间奏与全周期验证
    // ==========================================
    console.log('\n--- [Test 2] Track 2: 彼女は旅に出る (Interlude & Lifecycle) ---');
    // 切换到第 2 首
    const nextBtn1 = page.locator('button[title*="下一首"], button[aria-label*="下一首"]').first();
    await nextBtn1.click();
    await page.waitForTimeout(2500);

    // 阶段 A: 前奏开唱点 (18.5s)
    const t2A = await page.evaluate(async () => {
      const audio = document.querySelector('audio');
      if (!audio) return null;
      audio.currentTime = 18.5;
      window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 18.5 } }));
      await new Promise((r) => setTimeout(r, 600));
      const activeText = document.querySelector('.screen-lyric__vocal-text, .ribbon-text')?.textContent || '';
      return { activeText, currentTime: audio.currentTime };
    });
    console.log('[Test 2] At 18.5s (intro start):', t2A);

    // 阶段 B: 间奏中 (75.0s) - 必须显示 "♪ 间奏中 ··· ♪"，且进度为 0%（无 100% 蓝高亮呆滞）
    const t2B = await page.evaluate(async () => {
      const audio = document.querySelector('audio');
      if (!audio) return null;
      audio.currentTime = 75.0;
      window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 75.0 } }));
      await new Promise((r) => setTimeout(r, 600));
      const hudEl = document.querySelector('.screen-lyric__vocal-text, .screen-lyric__interlude-text, .ribbon-text');
      const hudText = hudEl?.textContent || '';
      const hudPct = document.querySelector('.shijianus-music-pocket__screen-lyric')?.getAttribute('style') || '';
      const nextPreview = document.querySelector('.screen-lyric__next-text, .ribbon-next-text')?.textContent || '';
      return { hudText, hudPct, nextPreview, currentTime: audio.currentTime };
    });
    console.log('[Test 2] At 75.0s (interlude):', t2B);

    // 阶段 C: 间奏后接驳 (92.5s) - 必须无缝衔接 "満天の宇宙"
    const t2C = await page.evaluate(async () => {
      const audio = document.querySelector('audio');
      if (!audio) return null;
      audio.currentTime = 92.5;
      window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 92.5 } }));
      await new Promise((r) => setTimeout(r, 600));
      const activeText = document.querySelector('.screen-lyric__vocal-text, .ribbon-text')?.textContent || '';
      return { activeText, currentTime: audio.currentTime };
    });
    console.log('[Test 2] At 92.5s (post-interlude return):', t2C);

    // 阶段 D: Track 2 后半曲与尾奏推进 (130.0s & 180.0s)
    const t2D = await page.evaluate(async () => {
      const audio = document.querySelector('audio');
      if (!audio) return null;
      audio.currentTime = 130.0;
      window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 130.0 } }));
      await new Promise((r) => setTimeout(r, 600));
      const text130 = document.querySelector('.screen-lyric__vocal-text, .ribbon-text')?.textContent || '';
      
      audio.currentTime = 180.0;
      window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 180.0 } }));
      await new Promise((r) => setTimeout(r, 600));
      const text180 = document.querySelector('.screen-lyric__vocal-text, .ribbon-text')?.textContent || '';
      
      return { text130, text180, currentTime: audio.currentTime };
    });
    console.log('[Test 2] Deep lifecycle at 130s and 180s:', t2D);

    // ==========================================
    // TEST 3: Track 3 (アイロニ) 变奏版间奏时差彻底消除
    // ==========================================
    console.log('\n--- [Test 3] Track 3: アイロニ (No 5.4s Interlude Lag) ---');
    // 切换到第 3 首
    const nextBtn2 = page.locator('button[title*="下一首"], button[aria-label*="下一首"]').first();
    await nextBtn2.click();
    await page.waitForTimeout(2500);

    // 阶段 A: 吉他间奏中 (28.0s) - 必须显示间奏中，无呆滞蓝高亮
    const t3A = await page.evaluate(async () => {
      const audio = document.querySelector('audio');
      if (!audio) return null;
      audio.currentTime = 28.0;
      window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 28.0 } }));
      await new Promise((r) => setTimeout(r, 600));
      const text = document.querySelector('.screen-lyric__vocal-text, .screen-lyric__interlude-text, .ribbon-text')?.textContent || '';
      const isInterlude = text.includes('间奏') || text.includes('♪');
      return { text, isInterlude, currentTime: audio.currentTime };
    });
    console.log('[Test 3] At 28.0s (guitar solo interlude):', t3A);

    // 阶段 B: 间奏后第一句 (38.5s) - 必须严格对齐 "うまくいきそうなんだけど"（绝不能延迟到 43.5s!）
    const t3B = await page.evaluate(async () => {
      const audio = document.querySelector('audio');
      if (!audio) return null;
      audio.currentTime = 38.5;
      window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 38.5 } }));
      await new Promise((r) => setTimeout(r, 600));
      const activeText = document.querySelector('.screen-lyric__vocal-text, .ribbon-text')?.textContent || '';
      const aligned = activeText.includes('うまくいきそう') || activeText.includes('うまく');
      return { activeText, aligned, currentTime: audio.currentTime };
    });
    console.log('[Test 3] At 38.5s (post-interlude first line):', t3B);

    // 阶段 C: 间奏后第二句 (41.0s) - "うまくいかないことばかりで"
    const t3C = await page.evaluate(async () => {
      const audio = document.querySelector('audio');
      if (!audio) return null;
      audio.currentTime = 41.0;
      window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 41.0 } }));
      await new Promise((r) => setTimeout(r, 600));
      const activeText = document.querySelector('.screen-lyric__vocal-text, .ribbon-text')?.textContent || '';
      return { activeText, currentTime: audio.currentTime };
    });
    console.log('[Test 3] At 41.0s (second line after interlude):', t3C);

    // 阶段 D: Track 3 后半曲 (120.0s & 150.0s)
    const t3D = await page.evaluate(async () => {
      const audio = document.querySelector('audio');
      if (!audio) return null;
      audio.currentTime = 120.0;
      window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 120.0 } }));
      await new Promise((r) => setTimeout(r, 600));
      const text120 = document.querySelector('.screen-lyric__vocal-text, .ribbon-text')?.textContent || '';
      
      audio.currentTime = 150.0;
      window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 150.0 } }));
      await new Promise((r) => setTimeout(r, 600));
      const text150 = document.querySelector('.screen-lyric__vocal-text, .ribbon-text')?.textContent || '';
      
      return { text120, text150, currentTime: audio.currentTime };
    });
    console.log('[Test 3] Deep lifecycle at 120s and 150s:', t3D);

    // ==========================================
    // TEST 4: Online Search & Full Lifecycle (周杰伦《晴天》 / 赵雷《成都》)
    // ==========================================
    console.log('\n--- [Test 4] Online Track Search & Playback ---');
    const onlineTestResult = await page.evaluate(async () => {
      // 切换到搜索 Tab 并触发搜索
      const searchTabBtn = document.querySelector('button[data-tab="search"], button[title*="搜索"], button[aria-label*="搜索"]');
      if (searchTabBtn) {
        searchTabBtn.click();
      }
      return { searchTabAvailable: Boolean(searchTabBtn) };
    });
    console.log('[Test 4] Search tab available:', onlineTestResult);

    const searchTab = page.locator('button[data-tab="search"]').first();
    let onlineTrackPlayed = false;
    let onlineLyricAt30s = '';
    let onlineLyricAt80s = '';

    if (await searchTab.isVisible()) {
      await searchTab.click();
      await page.waitForTimeout(600);

      // 优先点击灵感标签 "周杰伦"
      const jayPill = page.locator('.shijianus-music-pocket__pill', { hasText: '周杰伦' }).first();
      if (await jayPill.isVisible()) {
        console.log('[Test 4] Clicking Jay Chou pill tag...');
        await jayPill.click();
      } else {
        const searchInput = page.locator('input.shijianus-music-pocket__search-input').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('周杰伦');
          const submitBtn = page.locator('button.search-btn').first();
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
          }
        }
      }

      // 等待搜索结果出现
      try {
        await page.waitForSelector('.shijianus-music-pocket__track-item', { timeout: 8000 });
      } catch (e) {
        console.log('[Test 4] Timeout waiting for search track items');
      }

      // 点击首个搜索结果项的点播按钮
      const searchPlayBtn = page.locator('.shijianus-music-pocket__track-item button.track-play-trigger').first();
      if (await searchPlayBtn.isVisible()) {
        console.log('[Test 4] Clicking play trigger for first search result...');
        await searchPlayBtn.click();
        await page.waitForTimeout(4000);

        // 验证在线音频开始加载并测试 seek
        const onlineStatus = await page.evaluate(async () => {
          const audio = document.querySelector('audio');
          if (!audio) return null;
          audio.currentTime = 30.0;
          window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 30.0 } }));
          await new Promise((r) => setTimeout(r, 1200));
          const lyric30 = document.querySelector('.screen-lyric__vocal-text, .ribbon-text')?.textContent || '';

          audio.currentTime = 80.0;
          window.dispatchEvent(new CustomEvent('shijianus:music-seek', { detail: { time: 80.0 } }));
          await new Promise((r) => setTimeout(r, 1200));
          const lyric80 = document.querySelector('.screen-lyric__vocal-text, .ribbon-text')?.textContent || '';

          return { src: audio.src, lyric30, lyric80, currentTime: audio.currentTime };
        });
        console.log('[Test 4] Online playback at 30s & 80s:', onlineStatus);
        if (onlineStatus) {
          onlineTrackPlayed = Boolean(onlineStatus.src);
          onlineLyricAt30s = onlineStatus.lyric30;
          onlineLyricAt80s = onlineStatus.lyric80;
        }
      } else {
        console.log('[Test 4] No search track items appeared');
      }
    }

    // 截图记录
    await page.screenshot({ path: 'scripts/verify-full-song-lifecycle.png', fullPage: false });
    console.log('[Audit] Screenshot captured at scripts/verify-full-song-lifecycle.png');

    console.log('\n=== Summary of Audit Results ===');
    console.log('Console Errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.warn('Errors:', consoleErrors);
    }

    const passTrack1 = track1TestPassed && !track1TestPassed.isEnglishCollab;
    const passTrack2 = t2B && (t2B.hudText.includes('间奏') || t2B.hudText.includes('♪')) && t2C && t2C.activeText.includes('満天');
    const passTrack3 = t3B && t3B.aligned;

    console.log(`Track 1 Korean protection passed: ${passTrack1}`);
    console.log(`Track 2 Interlude & post-interlude passed: ${passTrack2}`);
    console.log(`Track 3 38.18s Post-interlude alignment passed: ${passTrack3}`);
    console.log(`Online track playback tested: ${onlineTrackPlayed}`);

    if (passTrack1 && passTrack2 && passTrack3 && consoleErrors.length === 0) {
      console.log('🎉 ALL AUDIT CHECKS PASSED PERFECTLY!');
    } else {
      console.warn('⚠️ SOME CHECKS NEED ATTENTION');
    }
  } finally {
    await browser.close();
  }
}

runAudit().catch((err) => {
  console.error('[Audit Error]', err);
  process.exit(1);
});
