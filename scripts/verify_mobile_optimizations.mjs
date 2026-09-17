import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function runVerification() {
  console.log('🚀 Starting Local Static Server for Mobile & Desktop Regression Verification...');

  const server = spawn('python3', ['-m', 'http.server', '4329', '-d', 'dist'], {
    cwd: '/home/shijian/projects/shijianus-blog',
    stdio: 'ignore'
  });

  await new Promise(r => setTimeout(r, 1200));

  const BASE_URL = 'http://127.0.0.1:4329';
  console.log('Server running at ' + BASE_URL);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // ==========================================
    // 1. MOBILE SUITE (390 x 844)
    // ==========================================
    console.log('\n--- 📱 1. Testing Mobile Viewport (390x844) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const page = await mobileContext.newPage();

    // 1.1 Home Page Nav Streamlining
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const mobileNavInfo = await page.evaluate(() => {
      const dice = document.getElementById('randomPost_button');
      const totop = document.getElementById('nav-totop');
      const search = document.getElementById('search-button');
      const themeToggle = document.getElementById('nav-theme-toggle');
      const menu = document.getElementById('toggle-menu');

      return {
        diceHidden: dice ? window.getComputedStyle(dice).display === 'none' : true,
        totopHidden: totop ? window.getComputedStyle(totop).display === 'none' : true,
        searchVisible: search ? window.getComputedStyle(search).display !== 'none' : false,
        themeVisible: themeToggle ? window.getComputedStyle(themeToggle).display !== 'none' : false,
        menuVisible: menu ? window.getComputedStyle(menu).display !== 'none' : false
      };
    });
    console.log('Mobile Nav Streamlining:', mobileNavInfo);
    if (!mobileNavInfo.diceHidden || !mobileNavInfo.totopHidden) {
      throw new Error('Dice or Totop not hidden on mobile!');
    }

    // 1.2 Hamburger Menu & Backdrop
    console.log('Testing Mobile Hamburger Panel & Backdrop...');
    const menuBtn = page.locator('#toggle-menu a.site-page');
    await menuBtn.click();
    await page.waitForTimeout(400);

    const backdropInfo = await page.evaluate(() => {
      const bd = document.querySelector('.site-mobile-panel-backdrop');
      const panel = document.querySelector('.site-mobile-panel');
      return {
        hasBackdrop: !!bd,
        backdropVisible: bd ? window.getComputedStyle(bd).display !== 'none' : false,
        hasPanel: !!panel,
        panelVisible: panel ? window.getComputedStyle(panel).display !== 'none' : false
      };
    });
    console.log('Backdrop Info:', backdropInfo);
    if (!backdropInfo.hasBackdrop || !backdropInfo.hasPanel) {
      throw new Error('Mobile backdrop or panel failed to render!');
    }

    // Click backdrop to close
    await page.click('.site-mobile-panel-backdrop');
    await page.waitForTimeout(400);
    const closed = await page.evaluate(() => !document.querySelector('.site-mobile-panel'));
    console.log('Panel closed after tapping backdrop:', closed);
    if (!closed) throw new Error('Panel did not close when tapping backdrop!');

    // 1.3 Console Close Button on Mobile
    console.log('Testing Mobile Console Modal & Close Button...');
    const consoleBtn = page.locator('#center-console-button-astro, button.icon-button').first();
    if (await consoleBtn.isVisible()) {
      await consoleBtn.click();
      await page.waitForTimeout(600);

      const consoleTest = await page.evaluate(() => {
        const closeBtn = document.querySelector('#console .console-close-btn');
        const cardGroup = document.querySelector('#console .console-card-group');
        const cStyle = closeBtn ? window.getComputedStyle(closeBtn) : null;
        const gStyle = cardGroup ? window.getComputedStyle(cardGroup) : null;
        const cRect = closeBtn ? closeBtn.getBoundingClientRect() : null;

        return {
          hasCloseBtn: !!closeBtn,
          closeWidth: cRect ? Math.round(cRect.width) : 0,
          closeHeight: cRect ? Math.round(cRect.height) : 0,
          closeTop: cRect ? Math.round(cRect.top) : 0,
          closeRight: cRect ? Math.round(window.innerWidth - cRect.right) : 0,
          isSingleColumn: gStyle ? gStyle.gridTemplateColumns.split(' ').length === 1 : false
        };
      });
      console.log('Mobile Console metrics:', consoleTest);
      if (!consoleTest.hasCloseBtn || consoleTest.closeWidth < 35 || consoleTest.closeHeight < 35) {
        throw new Error('Console mobile close button not adequately sized!');
      }

      // Click close button
      await page.click('#console .console-close-btn');
      await page.waitForTimeout(400);
    }

    // 1.4 Post Detail - Rightside & Pagination Post
    console.log('Testing Article Post Detail #rightside & #pagination.pagination-post...');
    await page.goto(`${BASE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const rightsideMobile = await page.evaluate(() => {
      const getBtn = (id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { id, width: Math.round(r.width), height: Math.round(r.height), display: window.getComputedStyle(el).display };
      };
      const configHide = document.getElementById('rightside-config-hide');
      return {
        configHideHidden: configHide ? window.getComputedStyle(configHide).display === 'none' : true,
        btns: [
          getBtn('rightside-config'),
          getBtn('darkmode'),
          getBtn('hide-rightside-btn')
        ]
      };
    });
    console.log('Mobile Rightside Info:', rightsideMobile);
    for (const b of rightsideMobile.btns) {
      if (b && b.display !== 'none' && (b.width < 32 || b.height < 32)) {
        throw new Error(`Rightside button ${b.id} is collapsed to ${b.width}x${b.height}!`);
      }
    }

    // Scroll to comments to trigger pagination-post
    await page.evaluate(() => {
      const comment = document.getElementById('post-comment');
      if (comment) comment.scrollIntoView();
    });
    await page.waitForTimeout(800);

    const paginationMobile = await page.evaluate(() => {
      const p = document.querySelector('#pagination.pagination-post');
      if (!p) return null;
      const r = p.getBoundingClientRect();
      return {
        height: Math.round(r.height),
        width: Math.round(r.width),
        bottom: window.getComputedStyle(p).bottom
      };
    });
    console.log('Mobile Pagination Card Size:', paginationMobile);
    if (paginationMobile && paginationMobile.height > 75) {
      throw new Error(`Pagination post height is still too large on mobile: ${paginationMobile.height}px!`);
    }

    // 1.5 Support Page 2x2 Payment Channels
    console.log('Testing Support Page 2x2 Payment Channels on Mobile...');
    await page.goto(`${BASE_URL}/support/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const supportTabs = await page.evaluate(() => {
      const tabContainer = document.querySelector('.grid.grid-cols-2.sm\\:flex');
      if (!tabContainer) return [];
      const btns = Array.from(tabContainer.querySelectorAll('button'));
      return btns.map(b => {
        const r = b.getBoundingClientRect();
        return { text: b.innerText.trim(), width: Math.round(r.width), height: Math.round(r.height) };
      });
    });
    console.log('Support Mobile Tabs Sizes:', supportTabs);
    if (supportTabs.length === 4) {
      for (const t of supportTabs) {
        if (t.width < 100) {
          throw new Error(`Support tab ${t.text} width is too small (${t.width}px)! Expected >=100px for 2x2 grid.`);
        }
      }
    } else {
      throw new Error(`Expected 4 support tabs, found ${supportTabs.length}`);
    }

    // ==========================================
    // 2. DESKTOP REGRESSION SUITE (1440 x 900)
    // ==========================================
    console.log('\n--- 💻 2. Testing Desktop Viewport (1440x900) Regression Free ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const dPage = await desktopContext.newPage();

    await dPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await dPage.waitForTimeout(1500);

    const desktopNav = await dPage.evaluate(() => {
      const dice = document.getElementById('randomPost_button');
      const search = document.getElementById('search-button');
      const menus = document.getElementById('menus');
      const mobileToggle = document.getElementById('toggle-menu');

      return {
        diceVisible: dice ? window.getComputedStyle(dice).display !== 'none' : false,
        searchVisible: search ? window.getComputedStyle(search).display !== 'none' : false,
        menusVisible: menus ? window.getComputedStyle(menus).display !== 'none' : false,
        mobileToggleHidden: mobileToggle ? window.getComputedStyle(mobileToggle).display === 'none' : true
      };
    });
    console.log('Desktop Nav State:', desktopNav);
    if (!desktopNav.diceVisible || !desktopNav.menusVisible || !desktopNav.mobileToggleHidden) {
      throw new Error('Desktop nav was altered or broken by mobile changes!');
    }

    // Check Support page on desktop (flex row)
    await dPage.goto(`${BASE_URL}/support/`, { waitUntil: 'domcontentloaded' });
    await dPage.waitForTimeout(1500);

    const desktopSupportTabs = await dPage.evaluate(() => {
      const tabContainer = document.querySelector('.grid.grid-cols-2.sm\\:flex');
      if (!tabContainer) return { count: 0, allSameRow: false, yCoords: [] };
      const btns = Array.from(tabContainer.querySelectorAll('button'));
      const yCoords = btns.map(b => Math.round(b.getBoundingClientRect().top));
      const allSameRow = yCoords.every(y => Math.abs(y - yCoords[0]) < 4);
      return { count: btns.length, allSameRow, yCoords };
    });
    console.log('Desktop Support Tabs State:', desktopSupportTabs);
    if (!desktopSupportTabs.allSameRow || desktopSupportTabs.count !== 4) {
      throw new Error('Desktop support tabs should stay on a single row (flex)!');
    }

    console.log('\n🎉 ALL MOBILE OPTIMIZATIONS & DESKTOP REGRESSION TESTS PASSED 100%!');

  } finally {
    await browser.close();
    server.kill();
  }
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
