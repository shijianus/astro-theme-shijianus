import { chromium } from 'playwright';

const LIVE_URL = 'https://blog.epocanvas.com';

async function waitForLiveDeployment() {
  console.log('📡 Polling Cloudflare Pages production deployment at ' + LIVE_URL + ' ...');
  
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  let deployed = false;
  for (let attempt = 1; attempt <= 25; attempt++) {
    try {
      console.log(`[Attempt ${attempt}/25] Checking if new mobile optimizations are live...`);
      await page.goto(`${LIVE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(1500);

      // Check if zero horizontal overflow is live
      const status = await page.evaluate(() => {
        const swiper = document.querySelector('.swiper_container_card');
        const s = swiper ? window.getComputedStyle(swiper) : null;
        const music = document.querySelector('.shijianus-music-pocket__toggle');
        const m = music ? window.getComputedStyle(music) : null;
        return {
          noOverflow: document.body.scrollWidth <= window.innerWidth,
          swiperColumn: s ? s.flexDirection === 'column' : false,
          musicCompact: m ? parseInt(m.width, 10) <= 42 : false
        };
      });

      console.log(`Live Status -> noOverflow: ${status.noOverflow}, swiperColumn: ${status.swiperColumn}, musicCompact: ${status.musicCompact}`);
      if (status.noOverflow && status.swiperColumn && status.musicCompact) {
        console.log('🎉 Cloudflare Pages new deployment is LIVE!');
        deployed = true;
        break;
      }
    } catch (e) {
      console.log('Error during check, waiting:', e.message);
    }
    await new Promise(r => setTimeout(r, 10000));
  }

  await browser.close();
  return deployed;
}

async function runLiveAudit() {
  const isLive = await waitForLiveDeployment();
  if (!isLive) {
    console.log('⚠️ Cloudflare Pages deployment took longer than expected. Proceeding with live check...');
  }

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  try {
    console.log('\n======================================================');
    console.log('🎭 RUNNING PRODUCTION E2E AUDIT (https://blog.epocanvas.com)');
    console.log('======================================================');

    // 1. Mobile Test (390x844)
    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const mPage = await mobileCtx.newPage();

    console.log('\n--- 📱 Production Mobile Inspection (390x844) ---');
    await mPage.goto(`${LIVE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await mPage.waitForTimeout(1500);
    await mPage.screenshot({ path: 'scripts/audit_screenshots/mobile_audit/live_01_home_mobile.png' });

    // 1.1 Home Overflow & Components
    const mHome = await mPage.evaluate(() => {
      const scrollW = document.body.scrollWidth;
      const innerW = window.innerWidth;
      const dice = document.getElementById('randomPost_button');
      const swiper = document.querySelector('.swiper_container_card');
      const music = document.querySelector('.shijianus-music-pocket__toggle');
      return {
        scrollWidth: scrollW,
        innerWidth: innerW,
        hasOverflow: scrollW > innerW,
        diceHidden: dice ? window.getComputedStyle(dice).display === 'none' : true,
        swiperWidth: swiper ? Math.round(swiper.getBoundingClientRect().width) : 0,
        musicWidth: music ? Math.round(music.getBoundingClientRect().width) : 0
      };
    });
    console.log('Production Mobile Home State:', mHome);
    if (mHome.hasOverflow) {
      throw new Error(`Production Mobile Home still has horizontal overflow: scrollWidth ${mHome.scrollWidth} > innerWidth ${mHome.innerWidth}`);
    }
    if (mHome.swiperWidth > 390) {
      throw new Error(`Production swiper width ${mHome.swiperWidth} exceeds 390px!`);
    }

    // 1.2 Hamburger Backdrop
    await mPage.click('#toggle-menu a.site-page');
    await mPage.waitForTimeout(500);
    await mPage.screenshot({ path: 'scripts/audit_screenshots/mobile_audit/live_02_hamburger_backdrop.png' });

    const mBackdrop = await mPage.evaluate(() => {
      const bd = document.querySelector('.site-mobile-panel-backdrop');
      return {
        hasBackdrop: !!bd,
        backdropDisplay: bd ? window.getComputedStyle(bd).display : 'none'
      };
    });
    console.log('Production Hamburger Backdrop State:', mBackdrop);

    // Tap backdrop to close
    if (mBackdrop.hasBackdrop) {
      await mPage.click('.site-mobile-panel-backdrop', { force: true }).catch(async () => {
        await mPage.evaluate(() => document.querySelector('.site-mobile-panel-backdrop')?.click());
      });
      await mPage.waitForTimeout(400);
    }

    // 1.3 Post Detail & Pagination
    console.log('\nProduction Post Detail Inspection...');
    await mPage.goto(`${LIVE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'networkidle', timeout: 30000 });
    await mPage.waitForTimeout(1500);

    const mRightside = await mPage.evaluate(() => {
      const getBtn = (id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { id, width: Math.round(r.width), height: Math.round(r.height) };
      };
      return [
        getBtn('rightside-config'),
        getBtn('darkmode'),
        getBtn('hide-rightside-btn')
      ];
    });
    console.log('Production Mobile Rightside Buttons:', mRightside);

    // 1.4 Support Page Check (2 Cols & Music Disc non-blocking)
    console.log('\nProduction Support Page Inspection...');
    await mPage.goto(`${LIVE_URL}/support/`, { waitUntil: 'networkidle', timeout: 30000 });
    await mPage.waitForTimeout(1500);
    await mPage.screenshot({ path: 'scripts/audit_screenshots/mobile_audit/live_06_support_mobile_2x2.png' });

    const mSupport = await mPage.evaluate(() => {
      const presets = Array.from(document.querySelectorAll('.support-dashboard button[title*="赞赏支持"]')).map(b => {
        const r = b.getBoundingClientRect();
        const truncated = Array.from(b.querySelectorAll('*')).filter(c => {
          const s = window.getComputedStyle(c);
          return s.textOverflow === 'ellipsis' && c.scrollWidth > c.clientWidth;
        }).map(c => c.innerText);
        return { text: b.innerText.replace(/\n/g, ' '), width: Math.round(r.width), truncated };
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
    console.log('Production Mobile Support State:', mSupport);
    if (mSupport.truncatedItems.length > 0) {
      throw new Error(`Production preset cards still have truncated text: ${JSON.stringify(mSupport.truncatedItems)}`);
    }
    if (mSupport.overlappedByMusic > 0) {
      throw new Error(`Production music pocket overlaps ${mSupport.overlappedByMusic} preset cards!`);
    }

    // 2. Desktop Regression Check (1440x900)
    console.log('\n--- 💻 Production Desktop Inspection (1440x900) ---');
    const dCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const dPage = await dCtx.newPage();

    await dPage.goto(`${LIVE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await dPage.waitForTimeout(1500);

    const dHome = await dPage.evaluate(() => {
      const dice = document.getElementById('randomPost_button');
      const menus = document.getElementById('menus');
      const swiper = document.querySelector('.swiper_container_card');
      const s = window.getComputedStyle(swiper);
      const music = document.querySelector('.shijianus-music-pocket__toggle');
      return {
        diceVisible: dice ? window.getComputedStyle(dice).display !== 'none' : false,
        menusVisible: menus ? window.getComputedStyle(menus).display !== 'none' : false,
        swiperFlexFlow: s.flexFlow,
        swiperHeight: Math.round(swiper.getBoundingClientRect().height),
        musicWidth: music ? Math.round(music.getBoundingClientRect().width) : 0
      };
    });
    console.log('Production Desktop Home State:', dHome);
    if (!dHome.swiperFlexFlow.includes('row') || dHome.swiperHeight !== 348) {
      throw new Error(`Desktop regression detected on swiper: ${JSON.stringify(dHome)}`);
    }
    if (dHome.musicWidth < 60) {
      throw new Error(`Desktop regression detected on music toggle: ${dHome.musicWidth}px`);
    }

    console.log('\n🎉 ALL PRODUCTION LIVE AUDIT CHECKS PASSED!');

  } finally {
    await browser.close();
  }
}

runLiveAudit().catch((err) => {
  console.error('❌ Live Audit failed:', err);
  process.exit(1);
});
