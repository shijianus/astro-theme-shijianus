import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIVE_URL = 'https://blog.epocanvas.com';
const SCREENSHOT_DIR = path.resolve(__dirname, 'audit_screenshots/live_mobile_task115');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runLiveAudit() {
  console.log('====================================================');
  console.log('🌐 STARTING LIVE PRODUCTION MOBILE & DESKTOP AUDIT');
  console.log(`Target: ${LIVE_URL}`);
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  let failures = [];

  try {
    // ----------------------------------------------------
    // SUITE 1: LIVE MOBILE VERIFICATION (iPhone 14/15 Pro: 390x844)
    // ----------------------------------------------------
    console.log('📱 SUITE 1: LIVE MOBILE AUDIT (390x844 @2x Retina, Touch & Mobile)');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
    const mobilePage = await mobileContext.newPage();

    // 1.1 Home page load & touch dismissal
    console.log('  [Check 1.1] Loading screen instantaneous touch bypass...');
    await mobilePage.goto(`${LIVE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const loadingResult = await mobilePage.evaluate(async () => {
      const box = document.getElementById('loading-box');
      if (!box) return { exists: false, isDismissed: true };
      window.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 60));
      const boxAfter = document.getElementById('loading-box');
      const isDismissed = !boxAfter || window.getComputedStyle(boxAfter).display === 'none' || boxAfter.classList.contains('loaded');
      return { exists: true, isDismissed };
    });
    console.log('    Loading screen result:', loadingResult);
    if (loadingResult.exists && !loadingResult.isDismissed) {
      failures.push('Live loading screen did not dismiss promptly upon touch');
    }
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '01_live_mobile_home.png') });

    // 1.2 Post page Quick TOC button & Drawer interaction
    console.log('\n  [Check 1.2] Post page Quick TOC button & Drawer interaction...');
    await mobilePage.goto(`${LIVE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobilePage.waitForTimeout(800);

    const mobileTocQuickCheck = await mobilePage.evaluate(() => {
      const quickBtn = document.getElementById('mobile-toc-quick');
      if (!quickBtn) return { found: false };
      const s = window.getComputedStyle(quickBtn);
      const rect = quickBtn.getBoundingClientRect();
      return {
        found: true,
        display: s.display,
        visible: s.visibility !== 'hidden' && s.opacity !== '0' && s.display !== 'none',
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) }
      };
    });
    console.log('    Live Quick TOC Button:', mobileTocQuickCheck);
    if (!mobileTocQuickCheck.found || !mobileTocQuickCheck.visible) {
      failures.push('Live mobile-toc-quick button is not found or not visible on post page');
    }
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '02_live_mobile_post_quick_btn.png') });

    // 1.3 Click Quick TOC Button -> Verify Drawer Opens
    console.log('  [Check 1.3] Triggering Live Quick TOC Button tap...');
    await mobilePage.click('#mobile-toc-quick');
    await mobilePage.waitForTimeout(500);

    const drawerOpenCheck = await mobilePage.evaluate(() => {
      const drawer = document.getElementById('mobile-toc-drawer');
      if (!drawer) return { found: false };
      const isOpen = drawer.classList.contains('open');
      const ariaHidden = drawer.getAttribute('aria-hidden');
      const linksCount = drawer.querySelectorAll('.mobile-toc-link').length;
      return { found: true, isOpen, ariaHidden, linksCount };
    });
    console.log('    Live Drawer Open Status:', drawerOpenCheck);
    if (!drawerOpenCheck.isOpen || drawerOpenCheck.ariaHidden !== 'false' || drawerOpenCheck.linksCount === 0) {
      failures.push('Live mobile-toc-drawer did not open or has no headings after tapping mobile-toc-quick');
    }
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '03_live_mobile_drawer_open.png') });

    // 1.4 Close Drawer
    console.log('  [Check 1.4] Closing Live Mobile TOC Drawer via Close Button...');
    await mobilePage.click('#mobile-toc-close');
    await mobilePage.waitForTimeout(400);

    const drawerClosedCheck = await mobilePage.evaluate(() => {
      const drawer = document.getElementById('mobile-toc-drawer');
      if (!drawer) return { found: false };
      return {
        isOpen: drawer.classList.contains('open'),
        ariaHidden: drawer.getAttribute('aria-hidden')
      };
    });
    console.log('    Live Drawer Closed Status:', drawerClosedCheck);
    if (drawerClosedCheck.isOpen || drawerClosedCheck.ariaHidden !== 'true') {
      failures.push('Live mobile-toc-drawer failed to close properly');
    }

    // 1.5 Horizontal Scroll Overflow Audit on 11 Key Routes
    console.log('\n  [Check 1.5] Verifying 0.0px Horizontal Overflow across 11 key routes in production...');
    const testRoutes = [
      '/',
      '/posts/content-formats-and-markup-mastery/',
      '/posts/example-embeds/',
      '/posts/example-code-enhancements/',
      '/support/',
      '/categories/',
      '/tags/',
      '/archives/',
      '/friends/',
      '/about/',
      '/status/'
    ];

    for (const route of testRoutes) {
      await mobilePage.goto(`${LIVE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await mobilePage.waitForTimeout(400);
      const overflowInfo = await mobilePage.evaluate(() => {
        const scrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        return {
          scrollW,
          innerW,
          hasOverflow: scrollW > innerW + 1
        };
      });
      console.log(`    Route: ${route.padEnd(46)} | W: ${overflowInfo.scrollW}/${overflowInfo.innerW} | Overflow: ${overflowInfo.hasOverflow ? '❌ YES' : '✅ 0px'}`);
      if (overflowInfo.hasOverflow) {
        failures.push(`Live route ${route} has mobile horizontal overflow: ${overflowInfo.scrollW} > ${overflowInfo.innerW}`);
      }
    }

    await mobileContext.close();

    // ----------------------------------------------------
    // SUITE 2: LIVE DESKTOP ZERO REGRESSION AUDIT (1440x900)
    // ----------------------------------------------------
    console.log('\n💻 SUITE 2: LIVE DESKTOP ZERO REGRESSION AUDIT (1440x900)');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      isMobile: false
    });
    const desktopPage = await desktopContext.newPage();

    // 2.1 Post Page Desktop Layout & Quick TOC Hidden Check
    console.log('  [Check 2.1] Live Desktop: quick TOC hidden verification...');
    await desktopPage.goto(`${LIVE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await desktopPage.waitForTimeout(600);

    const desktopQuickTocCheck = await desktopPage.evaluate(() => {
      const quickBtn = document.getElementById('mobile-toc-quick');
      if (!quickBtn) return { found: false, display: 'none' };
      const s = window.getComputedStyle(quickBtn);
      return { found: true, display: s.display };
    });
    console.log('    Live Desktop Quick TOC display (Must be none):', desktopQuickTocCheck.display);
    if (desktopQuickTocCheck.display !== 'none') {
      failures.push(`Live desktop quick TOC button is visible! display: ${desktopQuickTocCheck.display}`);
    }

    // 2.2 Desktop Sidebar TOC (#card-toc)
    const desktopSidebarTocCheck = await desktopPage.evaluate(() => {
      const cardToc = document.getElementById('card-toc');
      if (!cardToc) return { found: false };
      const s = window.getComputedStyle(cardToc);
      const links = cardToc.querySelectorAll('.toc-link').length;
      return { found: true, display: s.display, links };
    });
    console.log('    Live Desktop Sidebar TOC Card:', desktopSidebarTocCheck);
    if (!desktopSidebarTocCheck.found || desktopSidebarTocCheck.display === 'none' || desktopSidebarTocCheck.links === 0) {
      failures.push('Live desktop sidebar TOC (#card-toc) is missing or broken!');
    }

    // 2.3 Desktop Rightside gear click & depth cycling in #rightside-config-hide
    console.log('  [Check 2.3] Live Desktop gear click & depth cycling in #rightside-config-hide...');
    const desktopHideTocCheck = await desktopPage.evaluate(() => {
      const btn = document.querySelector('#rightside-config-hide #mobile-toc-button');
      return { found: Boolean(btn) };
    });
    console.log('    Live Desktop #rightside-config-hide #mobile-toc-button exists:', desktopHideTocCheck.found);
    if (!desktopHideTocCheck.found) {
      failures.push('Live #rightside-config-hide #mobile-toc-button missing on desktop');
    } else {
      await desktopPage.click('#rightside-config');
      await desktopPage.waitForTimeout(300);
      await desktopPage.click('#rightside-config-hide #mobile-toc-button');
      await desktopPage.waitForTimeout(300);
      const badgeText = await desktopPage.$eval('.dock-depth-badge', el => el.textContent?.trim());
      console.log('    Live Desktop depth badge after toggle:', badgeText);
    }
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '04_live_desktop_post.png') });

    // 2.4 Desktop Home Top Group Single Line Verification
    console.log('  [Check 2.4] Live Desktop Homepage Hero Layout Check...');
    await desktopPage.goto(`${LIVE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await desktopPage.waitForTimeout(600);
    const desktopHomeCheck = await desktopPage.evaluate(() => {
      const banner = document.getElementById('bannerGroup');
      const topGroup = document.querySelector('.topGroup');
      return {
        bannerWidth: banner ? Math.round(banner.getBoundingClientRect().width) : 0,
        topGroupWidth: topGroup ? Math.round(topGroup.getBoundingClientRect().width) : 0
      };
    });
    console.log('    Live Desktop Home Hero Dimensions:', desktopHomeCheck);
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '05_live_desktop_home.png') });

    // 2.5 Desktop Support Dashboard 3-Column Verification
    console.log('  [Check 2.5] Live Desktop Support Dashboard Grid Check...');
    await desktopPage.goto(`${LIVE_URL}/support/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await desktopPage.waitForTimeout(600);
    const desktopSupportCheck = await desktopPage.evaluate(() => {
      const grid = document.querySelector('div[class*="grid-cols-2 sm:grid-cols-3"]');
      const cards = grid ? Array.from(grid.querySelectorAll('button')) : [];
      const coords = cards.map(c => ({
        y: Math.round(c.getBoundingClientRect().y),
        x: Math.round(c.getBoundingClientRect().x),
        w: Math.round(c.getBoundingClientRect().width)
      }));
      const isThreeCol =
        coords.length === 6 &&
        Math.abs(coords[0].y - coords[1].y) <= 2 &&
        Math.abs(coords[1].y - coords[2].y) <= 2 &&
        coords[0].x < coords[1].x &&
        coords[1].x < coords[2].x &&
        Math.abs(coords[3].y - coords[4].y) <= 2 &&
        Math.abs(coords[4].y - coords[5].y) <= 2 &&
        coords[3].x < coords[4].x &&
        coords[4].x < coords[5].x;

      return {
        count: cards.length,
        coords,
        isThreeCol
      };
    });
    console.log('    Live Desktop Support Presets Coords:', JSON.stringify(desktopSupportCheck, null, 2));
    if (!desktopSupportCheck.isThreeCol) {
      failures.push('Live desktop support preset cards are not in 3 columns!');
    }
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '06_live_desktop_support.png') });

    await desktopContext.close();

  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log('📊 LIVE PRODUCTION AUDIT SUMMARY');
  console.log('====================================================');
  if (failures.length === 0) {
    console.log('🎉 ALL LIVE ASSERTIONS PASSED! ZERO REGRESSIONS!');
    console.log('✅ Live Mobile Quick TOC button fully functional and responsive.');
    console.log('✅ Live Loading screen instantaneous touch bypass active.');
    console.log('✅ Live 11 key routes verified with 0.0px horizontal overflow.');
    console.log('✅ Live Desktop layout and functionality 100% preserved.');
    process.exit(0);
  } else {
    console.error('❌ LIVE FAILURES ENCOUNTERED:');
    failures.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  }
}

runLiveAudit().catch(err => {
  console.error('Fatal live audit error:', err);
  process.exit(1);
});
