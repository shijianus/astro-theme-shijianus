import { chromium } from 'playwright';
import { spawn } from 'child_process';

let previewProcess = null;

async function startLocalServer() {
  console.log('🚀 Starting local static dist server on port 4399...');
  previewProcess = spawn('node', ['scripts/serve-dist.mjs'], {
    stdio: 'pipe'
  });
  await new Promise(r => setTimeout(r, 1000));
}

function stopLocalServer() {
  if (previewProcess) {
    console.log('🛑 Stopping local server...');
    previewProcess.kill();
  }
}

async function runVerification() {
  await startLocalServer();

  const browser = await chromium.launch();
  try {
    console.log('\n======================================================');
    console.log('📱 1. MOBILE VERIFICATION (390x844 - iPhone 14/15 Pro)');
    console.log('======================================================');

    const mPage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });

    // 1.1 Home Page Overflow & Layout Check
    console.log('Checking Mobile Home Page (/)...');
    await mPage.goto('http://localhost:4399/', { waitUntil: 'networkidle', timeout: 25000 });
    await mPage.waitForTimeout(1000);

    const mHome = await mPage.evaluate(() => {
      const scrollW = document.body.scrollWidth;
      const innerW = window.innerWidth;
      const notice = document.querySelector('.home-top-notice');
      const swiper = document.querySelector('.swiper_container_card');
      const music = document.querySelector('.shijianus-music-pocket__toggle');

      return {
        scrollWidth: scrollW,
        innerWidth: innerW,
        hasOverflow: scrollW > innerW,
        noticeWidth: notice ? Math.round(notice.getBoundingClientRect().width) : 0,
        swiperWidth: swiper ? Math.round(swiper.getBoundingClientRect().width) : 0,
        musicToggleWidth: music ? Math.round(music.getBoundingClientRect().width) : 0,
        musicToggleHeight: music ? Math.round(music.getBoundingClientRect().height) : 0
      };
    });

    console.log('Mobile Home Results:', mHome);
    if (mHome.hasOverflow) {
      throw new Error(`Mobile home has horizontal overflow: scrollWidth ${mHome.scrollWidth} > innerWidth ${mHome.innerWidth}`);
    }
    if (mHome.noticeWidth > 390) {
      throw new Error(`Notice width ${mHome.noticeWidth} exceeds 390px viewport!`);
    }
    if (mHome.swiperWidth > 390) {
      throw new Error(`Swiper width ${mHome.swiperWidth} exceeds 390px viewport!`);
    }
    if (mHome.musicToggleWidth > 42) {
      throw new Error(`Music toggle width ${mHome.musicToggleWidth} is not compacted on mobile!`);
    }

    await mPage.screenshot({ path: 'scripts/audit_screenshots/mobile_audit/verified_01_home_mobile.png' });

    // 1.2 Support Page Check
    console.log('\nChecking Mobile Support Page (/support/)...');
    await mPage.goto('http://localhost:4399/support/', { waitUntil: 'networkidle', timeout: 25000 });
    await mPage.waitForTimeout(1000);

    const mSupport = await mPage.evaluate(() => {
      const presets = Array.from(document.querySelectorAll('.support-dashboard button[title*="赞赏支持"]')).map(b => {
        const r = b.getBoundingClientRect();
        const truncated = Array.from(b.querySelectorAll('*')).filter(c => {
          const s = window.getComputedStyle(c);
          return s.textOverflow === 'ellipsis' && c.scrollWidth > c.clientWidth;
        }).map(c => c.innerText);
        return {
          text: b.innerText.replace(/\n/g, ' '),
          width: Math.round(r.width),
          truncated
        };
      });

      const music = document.querySelector('.shijianus-music-pocket');
      const mRect = music ? music.getBoundingClientRect() : null;
      let overlappedCount = 0;
      document.querySelectorAll('.support-dashboard button[title*="赞赏支持"]').forEach(b => {
        const br = b.getBoundingClientRect();
        if (mRect && !(br.right < mRect.left || br.left > mRect.right || br.bottom < mRect.top || br.top > mRect.bottom)) {
          overlappedCount++;
        }
      });

      return {
        presetCount: presets.length,
        firstPresetWidth: presets[0]?.width || 0,
        truncatedItems: presets.filter(p => p.truncated.length > 0).map(p => ({ text: p.text, truncated: p.truncated })),
        overlappedByMusic: overlappedCount
      };
    });

    console.log('Mobile Support Results:', mSupport);
    if (mSupport.firstPresetWidth < 120) {
      throw new Error(`Preset cards too narrow: ${mSupport.firstPresetWidth}px (should be ~140px in 2 cols)`);
    }
    if (mSupport.truncatedItems.length > 0) {
      throw new Error(`Some preset cards still have truncated text: ${JSON.stringify(mSupport.truncatedItems)}`);
    }
    if (mSupport.overlappedByMusic > 0) {
      throw new Error(`Music pocket still overlaps ${mSupport.overlappedByMusic} preset cards!`);
    }

    await mPage.screenshot({ path: 'scripts/audit_screenshots/mobile_audit/verified_02_support_mobile.png' });

    console.log('\n======================================================');
    console.log('💻 2. DESKTOP REGRESSION CHECK (1440x900)');
    console.log('======================================================');

    const dPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // 2.1 Desktop Home
    await dPage.goto('http://localhost:4399/', { waitUntil: 'networkidle', timeout: 25000 });
    await dPage.waitForTimeout(1000);

    const dHome = await dPage.evaluate(() => {
      const swiper = document.querySelector('.swiper_container_card');
      const s = window.getComputedStyle(swiper);
      const music = document.querySelector('.shijianus-music-pocket__toggle');
      return {
        swiperDisplay: s.display,
        swiperFlexFlow: s.flexFlow,
        swiperHeight: Math.round(swiper.getBoundingClientRect().height),
        musicWidth: music ? Math.round(music.getBoundingClientRect().width) : 0
      };
    });
    console.log('Desktop Home Results:', dHome);
    if (!dHome.swiperFlexFlow.includes('row')) {
      throw new Error(`Desktop swiper flex-flow is not row! Regression detected: ${dHome.swiperFlexFlow}`);
    }
    if (dHome.swiperHeight !== 348) {
      throw new Error(`Desktop swiper height is not 348px! Regression detected: ${dHome.swiperHeight}`);
    }
    if (dHome.musicWidth < 60) {
      throw new Error(`Desktop music toggle width shrunk to ${dHome.musicWidth}! Should remain 66px.`);
    }

    // 2.2 Desktop Support
    await dPage.goto('http://localhost:4399/support/', { waitUntil: 'networkidle', timeout: 25000 });
    await dPage.waitForTimeout(1000);

    const dSupport = await dPage.evaluate(() => {
      const grid = document.querySelector('.support-dashboard .grid.grid-cols-2.sm\\:grid-cols-3');
      const cards = document.querySelectorAll('.support-dashboard button[title*="赞赏支持"]');
      return {
        hasGrid: !!grid,
        cardCount: cards.length,
        firstCardWidth: cards[0] ? Math.round(cards[0].getBoundingClientRect().width) : 0
      };
    });
    console.log('Desktop Support Results:', dSupport);
    if (!dSupport.hasGrid) {
      throw new Error('Desktop support grid not found with sm:grid-cols-3!');
    }

    console.log('\n🎉 ALL MOBILE OPTIMIZATIONS AND DESKTOP ZERO REGRESSION CHECKS PASSED!');

  } finally {
    await browser.close();
    stopLocalServer();
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  stopLocalServer();
  process.exit(1);
});
