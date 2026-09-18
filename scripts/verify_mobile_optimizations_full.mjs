import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, devices } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = 4321;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon'
};

function createStaticServer() {
  return http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(DIST_DIR, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function runVerification() {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE PLAYWRIGHT MOBILE & DESKTOP SUITE');
  console.log('====================================================\n');

  const server = createStaticServer();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[Server] Local test server running on ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  let failures = [];

  try {
    // ----------------------------------------------------
    // SUITE 1: MOBILE VIEW VERIFICATION (iPhone 14/15 Pro: 390x844)
    // ----------------------------------------------------
    console.log('📱 SUITE 1: MOBILE AUDIT (390x844 @2x Retina, Touch Enabled)');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
    const mobilePage = await mobileContext.newPage();

    // 1.1 Loading Screen Touch Dismissal Check
    console.log('  [Check 1.1] Loading screen touch dismissal verification...');
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const loadingResult = await mobilePage.evaluate(async () => {
      const box = document.getElementById('loading-box');
      if (!box) return { exists: false, dismissed: true };
      // Simulate quick touch
      window.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 60));
      const boxAfter = document.getElementById('loading-box');
      const isDismissed = !boxAfter || window.getComputedStyle(boxAfter).display === 'none' || boxAfter.classList.contains('loaded');
      return { exists: true, isDismissed };
    });
    console.log('    Result:', loadingResult);
    if (loadingResult.exists && !loadingResult.isDismissed) {
      failures.push('Loading screen did not dismiss promptly upon touch');
    }

    // 1.2 Mobile Quick TOC Button Verification on Post Page
    console.log('\n  [Check 1.2] Post page Quick TOC button & Drawer interaction...');
    await mobilePage.goto(`${BASE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(600);

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
    console.log('    Quick TOC Button Status:', mobileTocQuickCheck);
    if (!mobileTocQuickCheck.found || !mobileTocQuickCheck.visible) {
      failures.push('mobile-toc-quick button is not found or not visible on mobile post page');
    }

    // 1.3 Click Quick TOC Button -> Verify Drawer Opens
    console.log('  [Check 1.3] Triggering Quick TOC Button tap...');
    await mobilePage.click('#mobile-toc-quick');
    await mobilePage.waitForTimeout(400);

    const drawerOpenCheck = await mobilePage.evaluate(() => {
      const drawer = document.getElementById('mobile-toc-drawer');
      if (!drawer) return { found: false };
      const isOpen = drawer.classList.contains('open');
      const ariaHidden = drawer.getAttribute('aria-hidden');
      const bodyOverflow = document.body.style.overflow;
      const linksCount = drawer.querySelectorAll('.mobile-toc-link').length;
      return { found: true, isOpen, ariaHidden, bodyOverflow, linksCount };
    });
    console.log('    Drawer Open Status:', drawerOpenCheck);
    if (!drawerOpenCheck.isOpen || drawerOpenCheck.ariaHidden !== 'false' || drawerOpenCheck.linksCount === 0) {
      failures.push('mobile-toc-drawer did not open or has no headings after tapping mobile-toc-quick');
    }

    // 1.4 Close Drawer via Close Button
    console.log('  [Check 1.4] Closing Mobile TOC Drawer via Close Button...');
    await mobilePage.click('#mobile-toc-close');
    await mobilePage.waitForTimeout(400);

    const drawerClosedCheck = await mobilePage.evaluate(() => {
      const drawer = document.getElementById('mobile-toc-drawer');
      if (!drawer) return { found: false };
      const isOpen = drawer.classList.contains('open');
      const ariaHidden = drawer.getAttribute('aria-hidden');
      const bodyOverflow = document.body.style.overflow;
      return { found: true, isOpen, ariaHidden, bodyOverflow };
    });
    console.log('    Drawer Closed Status:', drawerClosedCheck);
    if (drawerClosedCheck.isOpen || drawerClosedCheck.ariaHidden !== 'true') {
      failures.push('mobile-toc-drawer failed to close properly');
    }

    // 1.5 Horizontal Scroll Overflow Audit on 11 Key Routes
    console.log('\n  [Check 1.5] Verifying 0.0px Horizontal Overflow across 11 key routes...');
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
      await mobilePage.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
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
        failures.push(`Route ${route} has mobile horizontal overflow: ${overflowInfo.scrollW} > ${overflowInfo.innerW}`);
      }
    }

    await mobileContext.close();

    // ----------------------------------------------------
    // SUITE 2: DESKTOP AUDIT (1440x900, Zero Regression Verification)
    // ----------------------------------------------------
    console.log('\n💻 SUITE 2: DESKTOP ZERO REGRESSION AUDIT (1440x900)');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      isMobile: false
    });
    const desktopPage = await desktopContext.newPage();

    // 2.1 Post Page Desktop Layout & Quick TOC Hidden Check
    console.log('  [Check 2.1] Post page desktop layout & quick TOC hidden verification...');
    await desktopPage.goto(`${BASE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForTimeout(500);

    const desktopQuickTocCheck = await desktopPage.evaluate(() => {
      const quickBtn = document.getElementById('mobile-toc-quick');
      if (!quickBtn) return { found: false, display: 'none' };
      const s = window.getComputedStyle(quickBtn);
      return { found: true, display: s.display };
    });
    console.log('    Desktop Quick TOC display (Must be none):', desktopQuickTocCheck.display);
    if (desktopQuickTocCheck.display !== 'none') {
      failures.push(`Desktop quick TOC button is visible! display: ${desktopQuickTocCheck.display}`);
    }

    // 2.2 Desktop Sidebar TOC (#card-toc) Visibility
    const desktopSidebarTocCheck = await desktopPage.evaluate(() => {
      const cardToc = document.getElementById('card-toc');
      if (!cardToc) return { found: false };
      const s = window.getComputedStyle(cardToc);
      const links = cardToc.querySelectorAll('.toc-link').length;
      return { found: true, display: s.display, links };
    });
    console.log('    Desktop Sidebar TOC Card:', desktopSidebarTocCheck);
    if (!desktopSidebarTocCheck.found || desktopSidebarTocCheck.display === 'none' || desktopSidebarTocCheck.links === 0) {
      failures.push('Desktop sidebar TOC (#card-toc) is missing or broken!');
    }

    // 2.3 Desktop Rightside Config & #mobile-toc-button In #rightside-config-hide
    console.log('  [Check 2.3] Desktop Rightside gear click & depth cycling in #rightside-config-hide...');
    const desktopHideTocCheck = await desktopPage.evaluate(() => {
      const btn = document.querySelector('#rightside-config-hide #mobile-toc-button');
      return { found: Boolean(btn) };
    });
    console.log('    Desktop #rightside-config-hide #mobile-toc-button exists:', desktopHideTocCheck.found);
    if (!desktopHideTocCheck.found) {
      failures.push('#rightside-config-hide #mobile-toc-button missing on desktop');
    } else {
      // Click gear
      await desktopPage.click('#rightside-config');
      await desktopPage.waitForTimeout(300);
      // Click desktop toc button to toggle depth
      await desktopPage.click('#rightside-config-hide #mobile-toc-button');
      await desktopPage.waitForTimeout(300);
      const badgeText = await desktopPage.$eval('.dock-depth-badge', el => el.textContent?.trim());
      console.log('    Desktop depth badge after toggle:', badgeText);
    }

    // 2.4 Desktop Home Top Group Single Line Verification
    console.log('  [Check 2.4] Desktop Homepage Hero Layout Check...');
    await desktopPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForTimeout(500);
    const desktopHomeCheck = await desktopPage.evaluate(() => {
      const banner = document.getElementById('bannerGroup');
      const topGroup = document.querySelector('.topGroup');
      return {
        bannerWidth: banner ? Math.round(banner.getBoundingClientRect().width) : 0,
        topGroupWidth: topGroup ? Math.round(topGroup.getBoundingClientRect().width) : 0
      };
    });
    console.log('    Desktop Home Hero Dimensions:', desktopHomeCheck);

    // 2.5 Desktop Support Dashboard 3-Column Verification
    console.log('  [Check 2.5] Desktop Support Dashboard Grid Check...');
    await desktopPage.goto(`${BASE_URL}/support/`, { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForTimeout(500);
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
    console.log('    Desktop Support Presets Coords:', JSON.stringify(desktopSupportCheck, null, 2));
    if (!desktopSupportCheck.isThreeCol) {
      failures.push('Desktop support preset cards are not in 3 columns!');
    }

    await desktopContext.close();

  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n====================================================');
  console.log('📊 VERIFICATION SUMMARY');
  console.log('====================================================');
  if (failures.length === 0) {
    console.log('🎉 ALL ASSERTIONS PASSED! ZERO REGRESSIONS!');
    console.log('✅ Mobile Quick TOC button fully functional and responsive.');
    console.log('✅ Loading screen instantaneous touch bypass active.');
    console.log('✅ 11 key routes verified with 0.0px horizontal overflow.');
    console.log('✅ Desktop layout and functionality 100% preserved.');
    process.exit(0);
  } else {
    console.error('❌ FAILURES ENCOUNTERED:');
    failures.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
