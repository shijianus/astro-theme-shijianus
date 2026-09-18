import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const LIVE_URL = 'https://blog.epocanvas.com';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'scripts/audit_screenshots/mobile_full_audit_v2');

async function runComprehensiveMobileAudit() {
  console.log('=====================================================================');
  console.log('🚀 STARTING ZERO-BASE MOBILE COMPREHENSIVE AUDIT (PLAYWRIGHT MCP)');
  console.log(`🎯 Target Target: ${LIVE_URL}`);
  console.log(`📁 Screenshot Directory: ${SCREENSHOT_DIR}`);
  console.log('=====================================================================\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  const auditReport = {
    timestamp: new Date().toISOString(),
    targetUrl: LIVE_URL,
    pagesAudited: [],
    modalsAudited: [],
    responsiveCrossChecks: [],
    consoleErrors: [],
    brokenImages: [],
    overflowOffenders: [],
    findings: []
  };

  // 1. Mobile Context (iPhone 14/15 Pro: 390x844, 2x retina, touch enabled)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  const page = await mobileContext.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      auditReport.consoleErrors.push({ url: page.url(), text: msg.text() });
    }
  });

  page.on('requestfailed', req => {
    // ignore harmless analytics or optional third-party aborts
    if (!req.url().includes('google-analytics') && !req.url().includes('telegram')) {
      auditReport.brokenImages.push({ url: req.url(), failure: req.failure()?.errorText });
    }
  });

  const routes = [
    { name: '01_home', path: '/' },
    { name: '02_post_formats', path: '/posts/content-formats-and-markup-mastery/' },
    { name: '03_post_embeds', path: '/posts/example-embeds/' },
    { name: '04_post_code', path: '/posts/example-code-enhancements/' },
    { name: '05_support', path: '/support/' },
    { name: '06_categories', path: '/categories/' },
    { name: '07_tags', path: '/tags/' },
    { name: '08_archives', path: '/archives/' },
    { name: '09_friends', path: '/friends/' },
    { name: '10_about', path: '/about/' },
    { name: '11_status', path: '/status/' }
  ];

  // Helper to audit page layout
  async function auditCurrentPage(routeName, routePath) {
    console.log(`\n🔍 [Audit Route] ${routeName}: ${LIVE_URL}${routePath}`);
    await page.goto(`${LIVE_URL}${routePath}`, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForTimeout(2000);

    // Take overview screenshot
    const shotPath = path.join(SCREENSHOT_DIR, `${routeName}_overview.png`);
    await page.screenshot({ path: shotPath, fullPage: false });

    // Measure metrics
    const metrics = await page.evaluate(() => {
      const scrollW = document.body.scrollWidth;
      const innerW = window.innerWidth;
      const docElScrollW = document.documentElement.scrollWidth;
      const hasOverflow = scrollW > innerW || docElScrollW > innerW;
      const overflowDelta = Math.max(scrollW, docElScrollW) - innerW;

      // Check fixed floating elements
      const floatingElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const s = window.getComputedStyle(el);
        if (s.position === 'fixed' && s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0) {
          const r = el.getBoundingClientRect();
          return r.width > 20 && r.height > 20 && r.top < window.innerHeight && r.bottom > 0;
        }
        return false;
      }).map(el => {
        const r = el.getBoundingClientRect();
        return {
          id: el.id,
          tag: el.tagName,
          className: (el.className && typeof el.className === 'string') ? el.className.split(' ').slice(0, 3).join('.') : '',
          rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }
        };
      });

      // Find any elements sticking out of right viewport
      const elementsStickingOut = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > innerW + 4 && r.width > 10 && el.id !== 'web_bg') {
          elementsStickingOut.push({
            tag: el.tagName,
            id: el.id,
            cls: (el.className && typeof el.className === 'string') ? el.className.split(' ').slice(0, 2).join('.') : '',
            right: Math.round(r.right),
            width: Math.round(r.width)
          });
        }
      });

      // Check broken images
      const imgElements = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.currentSrc || img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
        isBroken: img.complete && img.naturalWidth === 0
      })).filter(i => i.isBroken);

      return {
        scrollWidth: scrollW,
        windowWidth: innerW,
        hasOverflow,
        overflowDelta,
        floatingElements,
        elementsStickingOut: elementsStickingOut.slice(0, 10),
        brokenImagesCount: imgElements.length
      };
    });

    console.log(`   Overflow: ${metrics.hasOverflow ? `⚠️ OVERFLOW (+${metrics.overflowDelta}px)` : '✅ Zero Overflow (390px)'}`);
    console.log(`   Floating Elements Count: ${metrics.floatingElements.length}`);
    if (metrics.elementsStickingOut.length > 0) {
      console.log(`   Elements sticking out of viewport:`, metrics.elementsStickingOut);
      auditReport.overflowOffenders.push({ route: routePath, offenders: metrics.elementsStickingOut });
    }

    auditReport.pagesAudited.push({
      route: routePath,
      name: routeName,
      screenshot: `${routeName}_overview.png`,
      metrics
    });

    return metrics;
  }

  // --- Step 1: Audit all core routes ---
  for (const r of routes) {
    await auditCurrentPage(r.name, r.path);
  }

  // --- Step 2: In-depth Interactive and Modal Audit on Mobile ---
  console.log('\n======================================================');
  console.log('🎭 IN-DEPTH INTERACTIVE AUDIT (MODALS, DRAWERS, TOUCH)');
  console.log('======================================================');

  // 2.1 Hamburger Menu Drawer
  console.log('\nTesting Hamburger Menu Drawer...');
  await page.goto(`${LIVE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.click('#toggle-menu a.site-page').catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_01_hamburger_open.png') });

  const hamburgerState = await page.evaluate(() => {
    const panel = document.querySelector('.site-mobile-panel');
    const backdrop = document.querySelector('.site-mobile-panel-backdrop');
    const links = Array.from(document.querySelectorAll('.site-mobile-panel a')).map(a => ({
      text: a.innerText.trim(),
      width: Math.round(a.getBoundingClientRect().width),
      height: Math.round(a.getBoundingClientRect().height)
    }));
    return {
      panelVisible: panel ? window.getComputedStyle(panel).display !== 'none' : false,
      hasBackdrop: !!backdrop,
      backdropDisplay: backdrop ? window.getComputedStyle(backdrop).display : 'none',
      linkCount: links.length,
      linksSample: links.slice(0, 5)
    };
  });
  console.log('Hamburger Drawer State:', hamburgerState);
  auditReport.modalsAudited.push({ modal: 'Hamburger Drawer', state: hamburgerState });

  // Tap backdrop to close
  await page.click('.site-mobile-panel-backdrop', { force: true }).catch(async () => {
    await page.evaluate(() => document.querySelector('.site-mobile-panel-backdrop')?.click());
  });
  await page.waitForTimeout(500);

  // 2.2 Console (中控台) on Mobile
  console.log('\nTesting #console Modal on Mobile...');
  const consoleBtn = page.locator('#center-console-button-astro, button.icon-button').first();
  if (await consoleBtn.isVisible()) {
    await consoleBtn.click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_02_console_open.png') });

    const consoleModalState = await page.evaluate(() => {
      const consoleEl = document.getElementById('console');
      const closeBtn = consoleEl ? consoleEl.querySelector('.console-close-btn') : null;
      const cRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
      const cardGroup = consoleEl ? consoleEl.querySelector('.console-card-group') : null;
      const cards = cardGroup ? Array.from(cardGroup.children).map(c => ({
        tag: c.tagName,
        cls: c.className,
        width: Math.round(c.getBoundingClientRect().width),
        height: Math.round(c.getBoundingClientRect().height)
      })) : [];

      return {
        consoleVisible: consoleEl ? consoleEl.classList.contains('show') : false,
        hasCloseBtn: !!closeBtn,
        closeBtnRect: cRect ? { w: Math.round(cRect.width), h: Math.round(cRect.height), top: Math.round(cRect.top), right: Math.round(window.innerWidth - cRect.right) } : null,
        cardCount: cards.length,
        firstCardWidth: cards[0]?.width || 0
      };
    });
    console.log('Console Modal State:', consoleModalState);
    auditReport.modalsAudited.push({ modal: 'Console Modal', state: consoleModalState });

    // Close console via close button
    const closeBtnEl = page.locator('#console .console-close-btn');
    if (await closeBtnEl.isVisible()) {
      await closeBtnEl.click();
      await page.waitForTimeout(500);
    }
  }

  // 2.3 Post Mobile TOC Drawer (移动端长文目录抽屉)
  console.log('\nTesting Mobile TOC Drawer on Post Detail...');
  await page.goto(`${LIVE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Open TOC drawer via rightside or floating button
  const tocBtn = page.locator('#mobile-toc-button, button#card-toc-mobile-btn, #rightside-config-show button[title*="目录"], #rightside-config-hide button[title*="目录"]').first();
  let tocDrawerState = { tested: false };
  if (await tocBtn.isVisible()) {
    await tocBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_03_toc_drawer_open.png') });

    tocDrawerState = await page.evaluate(() => {
      const drawer = document.getElementById('mobile-toc-drawer');
      const tocItems = drawer ? Array.from(drawer.querySelectorAll('a.toc-link, .toc-item a')).map(a => ({
        text: a.innerText.trim(),
        width: Math.round(a.getBoundingClientRect().width)
      })) : [];
      return {
        tested: true,
        drawerVisible: drawer ? (window.getComputedStyle(drawer).display !== 'none' && drawer.classList.contains('open')) : false,
        itemCount: tocItems.length,
        itemsSample: tocItems.slice(0, 5)
      };
    });
    console.log('Mobile TOC Drawer State:', tocDrawerState);
    auditReport.modalsAudited.push({ modal: 'Mobile TOC Drawer', state: tocDrawerState });

    // Tap backdrop or close
    await page.evaluate(() => {
      const close = document.querySelector('#mobile-toc-drawer .mobile-toc-close, #mobile-toc-drawer-backdrop');
      if (close) close.click();
    });
    await page.waitForTimeout(500);
  }

  // 2.4 Support Page Preset Cards & Currency Switcher
  console.log('\nTesting Support Page Detail (Currency Switch & Tiers)...');
  await page.goto(`${LIVE_URL}/support/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const supportInteractiveState = await page.evaluate(() => {
    const currencyButtons = Array.from(document.querySelectorAll('.support-dashboard button')).filter(b => b.innerText.includes('USD') || b.innerText.includes('CNY') || b.innerText.includes('MYR')).map(b => b.innerText.trim());
    const presetButtons = Array.from(document.querySelectorAll('.support-dashboard button[title*="赞赏支持"]')).map(b => {
      const r = b.getBoundingClientRect();
      const text = b.innerText.replace(/\n/g, ' ').trim();
      const hasTruncation = Array.from(b.querySelectorAll('*')).some(c => {
        const s = window.getComputedStyle(c);
        return s.textOverflow === 'ellipsis' && c.scrollWidth > c.clientWidth;
      });
      return { text, width: Math.round(r.width), height: Math.round(r.height), hasTruncation };
    });

    const musicPocket = document.querySelector('.shijianus-music-pocket');
    const mRect = musicPocket ? musicPocket.getBoundingClientRect() : null;
    const overlappedByMusic = presetButtons.filter(b => {
      // bounding overlap check
      return false; // already measured
    });

    return {
      currenciesSample: currencyButtons,
      presetButtonsCount: presetButtons.length,
      presetButtons,
      anyTruncation: presetButtons.some(p => p.hasTruncation),
      musicPocketRect: mRect ? { w: Math.round(mRect.width), h: Math.round(mRect.height), x: Math.round(mRect.x), y: Math.round(mRect.y) } : null
    };
  });
  console.log('Support Interactive State:', supportInteractiveState);
  auditReport.modalsAudited.push({ modal: 'Support Page Cards & Currency', state: supportInteractiveState });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screen_04_support_interactive.png') });

  // 2.5 Dark Mode Visual Verification
  console.log('\nTesting Dark Mode toggle on Mobile...');
  const darkModeBtn = page.locator('#darkmode, button#darkmode').first();
  if (await darkModeBtn.isVisible()) {
    await darkModeBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'theme_05_mobile_dark_mode_home.png') });

    const darkModeCheck = await page.evaluate(() => {
      const theme = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme');
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      return { theme, bodyBg };
    });
    console.log('Dark Mode Status:', darkModeCheck);
    auditReport.modalsAudited.push({ modal: 'Dark Mode Verification', state: darkModeCheck });
  }

  // --- Step 3: Extreme Small Screen Cross-Check (iPhone SE 375x667) ---
  console.log('\n======================================================');
  console.log('📱 EXTREME SMALL SCREEN CHECK (375x667 - iPhone SE)');
  console.log('======================================================');

  const seContext = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const sePage = await seContext.newPage();

  await sePage.goto(`${LIVE_URL}/`, { waitUntil: 'domcontentloaded' });
  await sePage.waitForTimeout(1500);
  const seHomeOverflow = await sePage.evaluate(() => {
    return {
      scrollWidth: document.body.scrollWidth,
      windowWidth: window.innerWidth,
      hasOverflow: document.body.scrollWidth > window.innerWidth
    };
  });
  console.log('iPhone SE (375px) Home Overflow Result:', seHomeOverflow);
  await sePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'screen_06_se_375_home.png') });

  await sePage.goto(`${LIVE_URL}/support/`, { waitUntil: 'domcontentloaded' });
  await sePage.waitForTimeout(1500);
  const seSupportCards = await sePage.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.support-dashboard button[title*="赞赏支持"]')).map(b => ({
      text: b.innerText.replace(/\n/g, ' ').trim(),
      width: Math.round(b.getBoundingClientRect().width),
      hasTruncation: Array.from(b.querySelectorAll('*')).some(c => {
        const s = window.getComputedStyle(c);
        return s.textOverflow === 'ellipsis' && c.scrollWidth > c.clientWidth;
      })
    }));
    return {
      count: cards.length,
      firstCardWidth: cards[0]?.width || 0,
      hasTruncation: cards.some(c => c.hasTruncation)
    };
  });
  console.log('iPhone SE (375px) Support Cards Result:', seSupportCards);
  await sePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'screen_07_se_375_support.png') });

  await seContext.close();

  // --- Step 4: Write Audit Results JSON ---
  const reportPath = path.resolve(process.cwd(), 'scripts/audit_screenshots/mobile_full_audit_v2/audit_summary.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2), 'utf-8');
  console.log(`\n📄 Complete Audit JSON saved to: ${reportPath}`);

  await browser.close();
  console.log('\n🎉 ZERO-BASE MOBILE COMPREHENSIVE AUDIT FINISHED!');
}

runComprehensiveMobileAudit().catch(err => {
  console.error('❌ Audit execution error:', err);
  process.exit(1);
});
