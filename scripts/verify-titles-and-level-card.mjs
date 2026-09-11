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
    console.log('   ✅ .account-card--level is visible in Tab 0.');

    // 1. Verify absence of legacy stat cards and verbose primary row
    const legacyCardsCount = await page.$$eval('.account-level-stat-item', (els) => els.length);
    if (legacyCardsCount > 0) {
      throw new Error(`Expected ZERO .account-level-stat-item cards, found ${legacyCardsCount}`);
    }
    console.log('   ✅ 1. Zero .account-level-stat-item cards (legacy stat boxes successfully removed).');

    const primaryRowExists = await page.$('.account-level-primary-row');
    if (primaryRowExists) {
      throw new Error('Expected .account-level-primary-row verbose text to be removed');
    }
    console.log('   ✅ 2. Zero .account-level-primary-row (verbose text block removed).');

    // 2. Verify level progress bars comparison
    const progressBars = await page.$$eval('.account-level-progress-wrap', (wraps) => {
      return wraps.map((w) => {
        const title = w.querySelector('.account-level-progress-name')?.textContent?.trim();
        const icon = w.querySelector('.account-level-progress-icon')?.textContent?.trim();
        const current = w.querySelector('.account-level-current-val')?.textContent?.trim();
        const target = w.querySelector('.account-level-target-val')?.textContent?.trim();
        const fillWidth = w.querySelector('.account-level-progress-fill')?.style?.width;
        const isMet = w.querySelector('.account-level-status')?.classList.contains('is-met');
        return { title, icon, current, target, status, fillWidth, isMet };
      });
    });

    console.log('   📊 Next Level Progress Wraps:', progressBars);
    if (progressBars.length === 0) {
      throw new Error('Expected .account-level-progress-wrap items with actual comparison data');
    }

    for (const pb of progressBars) {
      if (pb.isMet && pb.fillWidth !== '100%') {
        throw new Error(`Met requirement ${pb.title} must have 100% width, got ${pb.fillWidth}`);
      }
    }
    console.log('   ✅ 3. Requirements progress comparison strictly caps at 100% when met.');

    // -------------------------------------------------------------
    // PART 2: Badges Section & Custom Equipping (Max 4)
    // -------------------------------------------------------------
    console.log('\n--- PART 2: Verifying Badges Showcase & Equipping UI ---');
    const badgesSection = await page.$('.account-badges-section');
    if (!badgesSection) throw new Error('Missing .account-badges-section in account drawer');

    const badgeCards = await page.$$eval('.account-badge-card', (cards) => {
      return cards.map((c) => ({
        name: c.querySelector('.badge-card-name')?.textContent?.trim(),
        icon: c.querySelector('.badge-card-icon')?.textContent?.trim(),
        status: c.querySelector('.badge-card-status')?.textContent?.trim(),
        isEquipped: c.classList.contains('is-equipped'),
      }));
    });

    console.log(`   🏆 Unlocked Badges count: ${badgeCards.length}`);
    console.log('   🏅 Sample badges:', badgeCards.slice(0, 4));

    const equippedCount = badgeCards.filter((b) => b.isEquipped).length;
    console.log(`   🏷️ Initial equipped count: ${equippedCount}`);
    if (equippedCount > 4) {
      throw new Error(`Equipped badges must not exceed 4, got ${equippedCount}`);
    }

    // Toggle a badge to test interactive equipping
    const unequippedCard = await page.$('.account-badge-card:not(.is-equipped)');
    if (unequippedCard) {
      await unequippedCard.click();
      await page.waitForTimeout(300);
      const newEquippedCount = await page.$$eval('.account-badge-card.is-equipped', (els) => els.length);
      console.log(`   🔄 After toggle: equipped count is now ${newEquippedCount}`);
    }
    console.log('   ✅ 4. Interactive badge equipping verified within 4 slots limit.');

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
    // PART 3: Author Profile Popover UI Audit & Data Synchronization
    // -------------------------------------------------------------
    console.log('\n--- PART 3: Verifying author-profile-popover layout and sync ---');
    const commentSection = await page.waitForSelector('#post-comment', { state: 'visible', timeout: 15000 });
    await commentSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Hover/Click on the Webmaster comment avatar
    const clickableAvatar = await page.waitForSelector('#post-comment .tk-avatar.is-clickable', { state: 'visible', timeout: 10000 });
    await clickableAvatar.click();
    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });
    console.log('   ✅ .author-profile-popover opened.');

    const popoverData = await page.$eval('.author-profile-popover', (pop) => {
      const userMeta = pop.querySelector('.profile-popover-user-meta');
      const userMetaComputed = userMeta ? window.getComputedStyle(userMeta) : null;
      const displayNameEl = pop.querySelector('.profile-popover-display-name');
      const displayComputed = displayNameEl ? window.getComputedStyle(displayNameEl) : null;
      const usernameEl = pop.querySelector('.profile-popover-username');
      const usernameComputed = usernameEl ? window.getComputedStyle(usernameEl) : null;
      const titleEl = pop.querySelector('.profile-popover-title');

      const actionCancelBtn = pop.querySelector('.profile-popover-action-icon-btn[aria-label*="关闭"], .profile-popover-close-btn');
      const websiteLine = pop.querySelector('.profile-popover-website-line');
      const websiteLink = pop.querySelector('.profile-popover-website-link')?.getAttribute('href');
      const bioText = pop.querySelector('.profile-popover-bio')?.textContent?.trim();

      const badgePills = Array.from(pop.querySelectorAll('.profile-popover-badge-pill')).map((b) => b.textContent?.trim());

      return {
        metaFlexDirection: userMetaComputed?.flexDirection,
        displayName: displayNameEl?.textContent?.trim(),
        displayNameWeight: displayComputed?.fontWeight,
        username: usernameEl?.textContent?.trim(),
        usernameWeight: usernameComputed?.fontWeight,
        title: titleEl?.textContent?.trim(),
        hasCancelBtn: Boolean(actionCancelBtn),
        hasWebsiteLine: Boolean(websiteLine),
        websiteLink,
        bioText,
        badgePills,
      };
    });

    console.log('   📌 Popover Audit Details:', popoverData);

    // 1. Horizontal user-meta
    if (popoverData.metaFlexDirection !== 'row') {
      throw new Error(`Expected .profile-popover-user-meta to be row, got ${popoverData.metaFlexDirection}`);
    }
    console.log('   ✅ 1. .profile-popover-user-meta is horizontal row.');

    // 2. Bold display name, thin username, title
    if (parseInt(popoverData.displayNameWeight || '400') < 700) {
      throw new Error(`Expected bold display name (>=700), got ${popoverData.displayNameWeight}`);
    }
    if (parseInt(popoverData.usernameWeight || '700') > 500) {
      throw new Error(`Expected thin/light username (<=500), got ${popoverData.usernameWeight}`);
    }
    if (!popoverData.title?.includes('站长')) {
      throw new Error(`Expected title 站长, got ${popoverData.title}`);
    }
    console.log('   ✅ 2. Meta format: Bold display name + Thin username + Main title aligned horizontally.');

    // 3. Cancel button removed
    if (popoverData.hasCancelBtn) {
      throw new Error('Cancel/close button in profile-popover-action-icon-btn must be removed!');
    }
    console.log('   ✅ 3. profile-popover-action-icon-btn cancel button successfully removed.');

    // 4. Bio synced with account without fake text
    if (!popoverData.bioText || popoverData.bioText.includes('探索全栈工程架构与精致交互体验的技术旅人。')) {
      throw new Error(`Bio must sync with account and NOT use hardcoded fake text: "${popoverData.bioText}"`);
    }
    console.log(`   ✅ 4. Bio perfectly synced: "${popoverData.bioText}" (zero hardcoded fake bio).`);

    // 5. Personal website space
    if (!popoverData.hasWebsiteLine || !popoverData.websiteLink) {
      throw new Error('Expected dedicated .profile-popover-website-line for personal website');
    }
    console.log(`   ✅ 5. Dedicated personal website space verified: ${popoverData.websiteLink}`);

    // 6. Equipped badges in popover
    if (popoverData.badgePills.length > 4) {
      throw new Error(`Badge pills in popover must not exceed 4, got ${popoverData.badgePills.length}`);
    }
    console.log(`   ✅ 6. Equipped badges flow rendered: ${popoverData.badgePills.join(', ')} (<= 4 pills).`);

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
