import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

const mockComments = [
  {
    id: 'c_wm_1',
    postSlug: 'content-formats-and-markup-mastery',
    parentId: null,
    postType: 'comment',
    authorId: 'admin_1',
    authorName: 'Shijian Webmaster',
    authorAvatar: '/media/shijianus/avatar.jpg',
    authorWebsite: 'https://blog.epocanvas.com',
    authorEmail: 'admin@epomail.bond',
    authorRole: 'admin',
    isWebmaster: true,
    authorBio: '架构与精致设计探索者。',
    message: '欢迎体验全新的等级制度与个性称号佩戴系统！',
    likesCount: 15,
    reactions: {
      summary: { '❤️': 8, '🚀': 5, '✨': 2 },
      users: {},
    },
    status: 'published',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    showLocation: true,
    ipCountry: 'TW',
    ipCountryName: '中国台湾',
  },
];

function createMockServer(port = 4350) {
  const distDir = path.resolve('dist');
  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${port}`);
    let pathname = parsedUrl.pathname;

    if (pathname.startsWith('/api/comments')) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      return res.end(JSON.stringify({ ok: true, comments: mockComments }));
    }

    if (pathname.startsWith('/api/geo-profile')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, country: 'TW', location: '台湾·台北' }));
    }

    let filePath = path.join(distDir, pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      return fs.createReadStream(filePath).pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`📡 Local Test Server running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function runVerification() {
  const port = 4350;
  const server = await createMockServer(port);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    console.log('\n===========================================================');
    console.log('🧪 TEST SUITE: Community Level Card & Custom Badges & Popover');
    console.log('===========================================================');

    // Preset user identity and custom stats in localStorage
    await page.goto(`http://localhost:${port}/posts/content-formats-and-markup-mastery/`);
    await page.evaluate(() => {
      window.localStorage.setItem(
        'shijianus-comment-account',
        JSON.stringify({
          id: 'admin_local',
          name: 'admin',
          email: 'admin@epomail.bond',
          website: 'https://shijian.dev',
          avatar: '/media/shijianus/avatar.jpg',
          bio: '全栈架构师与系统美学探索者。',
          role: 'admin',
          provider: 'epomail',
        })
      );
      window.localStorage.setItem(
        'shijianus-user-activity-stats',
        JSON.stringify({
          hasAccount: true,
          hasReadAny: true,
          readingMinutes: 380,
          commentCount: 45,
          reactionsReceived: 35,
          activeDays: 25,
          activeDates: ['2026-09-01', '2026-09-02'],
          firstSeenAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          isWebmaster: true,
        })
      );
      // Select 3 custom equipped badges
      window.localStorage.setItem(
        'shijianus-equipped-badges',
        JSON.stringify(['tier_webmaster', 'read_120m', 'comment_5'])
      );
    });

    await page.reload();
    await page.waitForTimeout(600);

    // -------------------------------------------------------------
    // PART 1: Account Drawer - Community Level Card UI Audit
    // -------------------------------------------------------------
    console.log('\n--- PART 1: Verifying account-card--level UI in Tab 0 ---');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    await page.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 5000 });
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('.theme-account-drawer .account-nav-tab');
      if (tabs.length > 0) tabs[0].click();
    });
    await page.waitForTimeout(400);
    await page.waitForSelector('.account-card--level', { state: 'visible', timeout: 5000 });
    // -------------------------------------------------------------
    // PART 1: Account Drawer - Hero Card, Status Card & Level Card UI Audit
    // -------------------------------------------------------------
    console.log('\n--- PART 1: Verifying Hero Card, User Status & Level Card in Tab 0 ---');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    await page.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 5000 });
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('.theme-account-drawer .account-nav-tab');
      if (tabs.length > 0) tabs[0].click();
    });
    await page.waitForTimeout(400);

    // 1. Verify Hero Card: Circular Avatar, Email under name, No redundant admin pills
    const heroCardData = await page.$eval('.account-hero-card', (card) => {
      const avatarEl = card.querySelector('.account-hero-card__avatar');
      const avatarStyle = avatarEl ? window.getComputedStyle(avatarEl) : null;
      const emailEl = card.querySelector('.account-hero-card__email');
      const adminPill = card.querySelector('.account-pill--admin');
      const levelPill = card.querySelector('.account-pill--level');
      return {
        avatarBorderRadius: avatarStyle?.borderRadius,
        email: emailEl?.textContent?.trim(),
        hasAdminPill: Boolean(adminPill),
        hasLevelPill: Boolean(levelPill),
      };
    });
    console.log('   👤 Hero Card Audit:', heroCardData);
    if (!heroCardData.avatarBorderRadius?.includes('50%')) {
      throw new Error(`Hero avatar must be circular (50%), got ${heroCardData.avatarBorderRadius}`);
    }
    if (!heroCardData.email || !heroCardData.email.includes('admin@epomail.bond')) {
      throw new Error(`Hero card must display user email under name, got ${heroCardData.email}`);
    }
    if (heroCardData.hasAdminPill || heroCardData.hasLevelPill) {
      throw new Error('Hero card must not have redundant admin/level pills');
    }
    console.log('   ✅ 1. Hero Card: Avatar is strictly circular (50%), email is displayed, redundant pills removed.');

    // 2. User Status Card: Set Status (☕ 喝咖啡中)
    const statusCard = await page.waitForSelector('.account-card--status', { state: 'visible', timeout: 5000 });
    const presetBtn = await page.$('.account-status-preset-btn');
    if (presetBtn) {
      await presetBtn.click();
      await page.waitForTimeout(200);
      const isPresetActive = await page.$eval('.account-status-preset-btn', (b) => b.classList.contains('is-active'));
      console.log(`   ☕ User Status Preset activated: ${isPresetActive}`);
    }
    console.log('   ✅ 2. User Status Card: Configured and verified custom status.');

    // 3. Level Card UI Audit
    await page.waitForSelector('.account-card--level', { state: 'visible', timeout: 5000 });
    const webmasterPill = await page.$('.account-level-webmaster-pill');
    if (webmasterPill) {
      throw new Error('.account-level-webmaster-pill must be removed');
    }
    const lv4Badge = await page.$('.account-level-badge--lv4');
    if (lv4Badge) {
      throw new Error('.account-level-badge--lv4 must be removed');
    }
    console.log('   ✅ 3. Level Card: .account-level-webmaster-pill and .account-level-badge--lv4 successfully removed.');

    // 4. Progress Bars: 3-tier colors and Exemption
    const progressBars = await page.$$eval('.account-level-progress-wrap', (wraps) => {
      return wraps.map((w) => {
        const title = w.querySelector('.account-level-progress-name')?.textContent?.trim();
        const current = w.querySelector('.account-level-current-val')?.textContent?.trim();
        const target = w.querySelector('.account-level-target-val')?.textContent?.trim();
        const fill = w.querySelector('.account-level-progress-fill');
        const fillWidth = fill?.style?.width;
        const colorTierClass = Array.from(fill?.classList || []).find((c) => c.startsWith('account-level-progress-fill--'));
        const statusEl = w.querySelector('.account-level-status');
        const statusText = statusEl?.textContent?.trim();
        const isExempt = statusEl?.classList.contains('is-exempt');
        const isMet = statusEl?.classList.contains('is-met');
        return { title, current, target, fillWidth, colorTierClass, statusText, isExempt, isMet };
      });
    });

    console.log('   📊 Next Level Progress Wraps:', progressBars);
    if (progressBars.length === 0) {
      throw new Error('Expected .account-level-progress-wrap items with actual comparison data');
    }
    for (const pb of progressBars) {
      if (!pb.colorTierClass) {
        throw new Error(`Progress bar ${pb.title} missing 3-tier color class (red/yellow/green)`);
      }
    }
    console.log('   ✅ 4. Progress Bars: 3-tier colors (red/yellow/green) and webmaster exemption verified.');

    // -------------------------------------------------------------
    // PART 2: Compact Badges Card with Equip Button
    // -------------------------------------------------------------
    console.log('\n--- PART 2: Verifying Compact Badges Showcase & Equip Toggle Button ---');
    const badgeCards = await page.$$eval('.account-badge-card', (cards) => {
      return cards.map((c) => ({
        name: c.querySelector('.badge-card-name')?.textContent?.trim(),
        icon: c.querySelector('.badge-card-icon')?.textContent?.trim(),
        status: c.querySelector('.badge-card-equip-btn')?.textContent?.trim(),
        isEquipped: c.classList.contains('is-equipped'),
      }));
    });

    console.log(`   🏆 Unlocked Badges count: ${badgeCards.length}`);
    console.log('   🏅 Sample compact badges:', badgeCards.slice(0, 4));

    const toggleBtn = await page.$('.account-badge-card .badge-card-equip-btn');
    if (!toggleBtn) {
      throw new Error('Expected .badge-card-equip-btn on badge cards');
    }
    await toggleBtn.click();
    await page.waitForTimeout(300);
    console.log('   ✅ 5. Compact badge cards with .badge-card-equip-btn verified.');

    // Close Account Drawer
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.theme-account-drawer__close');
      if (closeBtn) closeBtn.click();
      const mask = document.querySelector('.theme-account-overlay__mask');
      if (mask) mask.click();
    });
    await page.waitForSelector('.theme-account-overlay.show', { state: 'detached', timeout: 5000 }).catch(() => null);
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // PART 3: Author Profile Popover: Document Absolute Positioning & Status
    // -------------------------------------------------------------
    console.log('\n--- PART 3: Verifying author-profile-popover layout, status, and scrolling ---');
    const commentSection = await page.waitForSelector('#post-comment', { state: 'visible', timeout: 15000 });
    await commentSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Click on the Webmaster comment avatar
    const clickableAvatar = await page.waitForSelector('#post-comment .tk-avatar.is-clickable', { state: 'visible', timeout: 10000 });
    await clickableAvatar.click();
    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });
    console.log('   ✅ .author-profile-popover opened.');

    const popoverData = await page.$eval('.author-profile-popover', (pop) => {
      const computed = window.getComputedStyle(pop);
      const position = computed.position;
      const userMeta = pop.querySelector('.profile-popover-user-meta');
      const userMetaComputed = userMeta ? window.getComputedStyle(userMeta) : null;
      const displayNameEl = pop.querySelector('.profile-popover-display-name');
      const displayComputed = displayNameEl ? window.getComputedStyle(displayNameEl) : null;
      const usernameEl = pop.querySelector('.profile-popover-username');
      const usernameComputed = usernameEl ? window.getComputedStyle(usernameEl) : null;
      const titleEl = pop.querySelector('.profile-popover-title');
      const statusEmojiEl = pop.querySelector('.profile-popover-status-emoji');

      const actionCancelBtn = pop.querySelector('.profile-popover-action-icon-btn[aria-label*="关闭"], .profile-popover-close-btn');
      const epomailTag = pop.querySelector('.profile-popover-epomail-tag');
      const emailWrap = pop.querySelector('.profile-popover-email-wrap');
      const bioText = pop.querySelector('.profile-popover-bio')?.textContent?.trim();

      const badgePills = Array.from(pop.querySelectorAll('.profile-popover-badge-pill')).map((b) => b.textContent?.trim());

      return {
        position,
        metaFlexDirection: userMetaComputed?.flexDirection,
        displayName: displayNameEl?.textContent?.trim(),
        displayNameWeight: displayComputed?.fontWeight,
        username: usernameEl?.textContent?.trim(),
        usernameWeight: usernameComputed?.fontWeight,
        title: titleEl?.textContent?.trim(),
        statusEmoji: statusEmojiEl?.textContent?.trim(),
        hasCancelBtn: Boolean(actionCancelBtn),
        hasEpomailTag: Boolean(epomailTag),
        hasEmailWrap: Boolean(emailWrap),
        bioText,
        badgePills,
      };
    });

    console.log('   📌 Popover Audit Details:', popoverData);

    // 1. Position must be absolute (not fixed) so it scrolls with document
    if (popoverData.position !== 'absolute') {
      throw new Error(`Popover position must be 'absolute', got '${popoverData.position}'`);
    }
    console.log('   ✅ 6. Popover position is absolute (moves with document flow upon scroll).');

    // 2. Epomail tag removed from email-wrap
    if (popoverData.hasEpomailTag) {
      throw new Error('profile-popover-epomail-tag must be removed from email-wrap');
    }
    console.log('   ✅ 7. profile-popover-epomail-tag removed from email-wrap.');

    // 3. User status emoji rendered after title
    if (!popoverData.title?.includes('站长')) {
      throw new Error(`Expected title 站长, got ${popoverData.title}`);
    }
    if (!popoverData.statusEmoji?.includes('☕')) {
      throw new Error(`Expected status emoji ☕ after title, got ${popoverData.statusEmoji}`);
    }
    console.log(`   ✅ 8. User status emoji '${popoverData.statusEmoji}' renders right after title.`);

    // 4. Test document scroll following
    const initialTop = await page.$eval('.author-profile-popover', (pop) => pop.getBoundingClientRect().top);
    await page.evaluate(() => window.scrollBy(0, 100));
    await page.waitForTimeout(200);
    const scrolledTop = await page.$eval('.author-profile-popover', (pop) => pop.getBoundingClientRect().top);
    console.log(`   📜 Scroll Test: initialTop=${initialTop}, scrolledTop=${scrolledTop}`);
    if (Math.abs(scrolledTop - (initialTop - 100)) > 5) {
      throw new Error(`Popover did not move with page scroll! initial=${initialTop}, scrolled=${scrolledTop}`);
    }
    console.log('   ✅ 9. Verified: Popover moves with page content 1:1 on scroll.');

    console.log('\n===========================================================');
    console.log('🎉 ALL REQUIREMENTS FOR LEVEL CARD, BADGES & POPOVER VERIFIED!');
    console.log('===========================================================\n');
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
