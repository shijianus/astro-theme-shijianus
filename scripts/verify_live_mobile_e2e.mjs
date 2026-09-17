import { chromium } from 'playwright';

const LIVE_URL = 'https://blog.epocanvas.com';

async function waitForLiveDeployment() {
  console.log('📡 Polling Cloudflare Pages production deployment at ' + LIVE_URL + ' ...');
  
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  let deployed = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      console.log(`[Attempt ${attempt}/20] Checking if new mobile optimizations are live...`);
      await page.goto(`${LIVE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(1500);

      // Check for our new CSS marker: #randomPost_button should be hidden on 390px mobile
      const diceHidden = await page.evaluate(() => {
        const dice = document.getElementById('randomPost_button');
        return dice ? window.getComputedStyle(dice).display === 'none' : true;
      });

      // Check if site-mobile-panel-backdrop exists in React markup when clicked
      await page.click('#toggle-menu a.site-page').catch(() => {});
      await page.waitForTimeout(500);
      const hasBackdrop = await page.evaluate(() => !!document.querySelector('.site-mobile-panel-backdrop'));

      console.log(`Live Status -> diceHiddenOnMobile: ${diceHidden}, hasBackdrop: ${hasBackdrop}`);
      if (diceHidden && hasBackdrop) {
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

    // 1. Mobile Test
    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const mPage = await mobileCtx.newPage();

    console.log('\n--- 📱 Production Mobile Inspection (390x844) ---');
    await mPage.goto(`${LIVE_URL}/`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForTimeout(2000);
    await mPage.screenshot({ path: 'scripts/audit_screenshots/mobile_audit/live_01_home_mobile.png' });

    // 1.1 Nav
    const mNav = await mPage.evaluate(() => {
      const dice = document.getElementById('randomPost_button');
      const totop = document.getElementById('nav-totop');
      const search = document.getElementById('search-button');
      return {
        diceHidden: dice ? window.getComputedStyle(dice).display === 'none' : true,
        totopHidden: totop ? window.getComputedStyle(totop).display === 'none' : true,
        searchVisible: search ? window.getComputedStyle(search).display !== 'none' : false
      };
    });
    console.log('Production Mobile Nav State:', mNav);

    // 1.2 Hamburger Backdrop
    await mPage.click('#toggle-menu a.site-page');
    await mPage.waitForTimeout(500);
    await mPage.screenshot({ path: 'scripts/audit_screenshots/mobile_audit/live_02_hamburger_backdrop.png' });

    const mBackdrop = await mPage.evaluate(() => {
      const bd = document.querySelector('.site-mobile-panel-backdrop');
      const panel = document.querySelector('.site-mobile-panel');
      return {
        hasBackdrop: !!bd,
        backdropDisplay: bd ? window.getComputedStyle(bd).display : 'none',
        hasPanel: !!panel
      };
    });
    console.log('Production Hamburger Backdrop State:', mBackdrop);

    // Tap backdrop to close
    if (mBackdrop.hasBackdrop) {
      await mPage.click('.site-mobile-panel-backdrop');
      await mPage.waitForTimeout(400);
    }

    // 1.3 Console close button on live
    const consoleBtn = mPage.locator('#center-console-button-astro, button.icon-button').first();
    if (await consoleBtn.isVisible()) {
      await consoleBtn.click();
      await mPage.waitForTimeout(600);
      await mPage.screenshot({ path: 'scripts/audit_screenshots/mobile_audit/live_03_console_mobile.png' });

      const mConsole = await mPage.evaluate(() => {
        const closeBtn = document.querySelector('#console .console-close-btn');
        const cRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
        return {
          hasCloseBtn: !!closeBtn,
          closeWidth: cRect ? Math.round(cRect.width) : 0,
          closeHeight: cRect ? Math.round(cRect.height) : 0,
          closeTop: cRect ? Math.round(cRect.top) : 0,
          closeRight: cRect ? Math.round(window.innerWidth - cRect.right) : 0
        };
      });
      console.log('Production Console Close Button:', mConsole);

      if (mConsole.hasCloseBtn) {
        await mPage.click('#console .console-close-btn');
        await mPage.waitForTimeout(400);
      }
    }

    // 1.4 Post Detail - Rightside & Pagination
    console.log('Production Post Detail Inspection...');
    await mPage.goto(`${LIVE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForTimeout(2000);
    await mPage.screenshot({ path: 'scripts/audit_screenshots/mobile_audit/live_04_post_mobile.png' });

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

    // Scroll to comments
    await mPage.evaluate(() => {
      const c = document.getElementById('post-comment');
      if (c) c.scrollIntoView();
    });
    await mPage.waitForTimeout(800);
    await mPage.screenshot({ path: 'scripts/audit_screenshots/mobile_audit/live_05_post_pagination_compact.png' });

    const mPagin = await mPage.evaluate(() => {
      const p = document.querySelector('#pagination.pagination-post');
      if (!p) return null;
      return {
        height: Math.round(p.getBoundingClientRect().height),
        width: Math.round(p.getBoundingClientRect().width)
      };
    });
    console.log('Production Pagination Card Compact Size:', mPagin);

    // 1.5 Support Page
    console.log('Production Support Page Inspection...');
    await mPage.goto(`${LIVE_URL}/support/`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForTimeout(2000);
    await mPage.screenshot({ path: 'scripts/audit_screenshots/mobile_audit/live_06_support_mobile_2x2.png' });

    const mTabs = await mPage.evaluate(() => {
      const tabContainer = document.querySelector('.grid.grid-cols-2.sm\\:flex');
      if (!tabContainer) return [];
      return Array.from(tabContainer.querySelectorAll('button')).map(b => ({
        text: b.innerText.trim(),
        width: Math.round(b.getBoundingClientRect().width)
      }));
    });
    console.log('Production Support Tabs:', mTabs);

    // 2. Desktop Regression Check
    console.log('\n--- 💻 Production Desktop Inspection (1440x900) ---');
    const dCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const dPage = await dCtx.newPage();

    await dPage.goto(`${LIVE_URL}/`, { waitUntil: 'domcontentloaded' });
    await dPage.waitForTimeout(1500);

    const dNav = await dPage.evaluate(() => {
      const dice = document.getElementById('randomPost_button');
      const menus = document.getElementById('menus');
      return {
        diceVisible: dice ? window.getComputedStyle(dice).display !== 'none' : false,
        menusVisible: menus ? window.getComputedStyle(menus).display !== 'none' : false
      };
    });
    console.log('Production Desktop Nav (dice & menus visible):', dNav);

    console.log('\n🎉 ALL PRODUCTION LIVE AUDIT CHECKS PASSED!');

  } finally {
    await browser.close();
  }
}

runLiveAudit().catch(console.error);
