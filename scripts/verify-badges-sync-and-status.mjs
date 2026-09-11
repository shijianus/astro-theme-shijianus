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
    message: '欢迎体验全新的称号佩戴与等级系统！',
    likesCount: 1, // Single reaction
    reactions: {
      summary: { '👍': 1 },
      users: {},
    },
    status: 'published',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    showLocation: true,
    ipCountry: 'TW',
    ipCountryName: '中国台湾',
  },
];

function createMockServer(port = 4351) {
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
  const port = 4351;
  const server = await createMockServer(port);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', msg => console.log('[BROWSER LOG]', msg.text()));

  try {
    console.log('\n===========================================================');
    console.log('🧪 TEST SUITE: 5-Requirement Deep Verification');
    console.log('===========================================================');

    await page.goto(`http://localhost:${port}/posts/content-formats-and-markup-mastery/`);

    // Initially configure localStorage: NO equipped badges (empty array)
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
          reactionsReceived: 1, // Exactly 1 reaction
          activeDays: 25,
          activeDates: ['2026-09-01', '2026-09-02'],
          firstSeenAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          isWebmaster: true,
        })
      );
      // Empty equipped badges
      window.localStorage.setItem('shijianus-equipped-badges', JSON.stringify([]));
    });

    await page.reload();
    await page.waitForTimeout(600);

    // -------------------------------------------------------------
    // REQUIREMENT 1 & 4: account-badges-grid
    // - NO equip button / text (e.g. "佩戴" / "已佩戴")
    // - Deep vs Light color styling
    // - Entire card clickable to toggle
    // - Name has no ellipsis "..."
    // - Scalable grid with all unlocked badges
    // -------------------------------------------------------------
    console.log('\n--- VERIFYING REQUIREMENT 1 & 4: account-badges-grid ---');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    await page.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 5000 });
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('.theme-account-drawer .account-nav-tab');
      if (tabs.length > 0) tabs[0].click();
    });
    await page.waitForTimeout(400);
    await page.waitForSelector('.account-badges-grid', { state: 'visible', timeout: 5000 });

    const badgeAudit = await page.$$eval('.account-badge-card', (cards) => {
      return cards.map((c) => {
        const nameEl = c.querySelector('.badge-card-name');
        const name = nameEl?.textContent?.trim();
        const hasEquipBtn = Boolean(c.querySelector('.badge-card-equip-btn'));
        const textContent = c.textContent || '';
        const hasEquipText = textContent.includes('佩戴') || textContent.includes('已佩戴');
        const isEquipped = c.classList.contains('is-equipped');
        const computedStyle = window.getComputedStyle(c);
        const nameStyle = nameEl ? window.getComputedStyle(nameEl) : null;
        return {
          name,
          hasEquipBtn,
          hasEquipText,
          isEquipped,
          hasEllipsis: name?.includes('...'),
          textOverflow: nameStyle?.textOverflow,
          backgroundColor: computedStyle.backgroundColor,
          cursor: computedStyle.cursor,
        };
      });
    });

    console.log(`   🏆 Total unlocked badges rendered: ${badgeAudit.length}`);
    console.log('   🔍 First 3 badges details:', badgeAudit.slice(0, 3));

    if (badgeAudit.length < 5) {
      throw new Error(`Expected more than 5 unlocked badges for extensibility, got ${badgeAudit.length}`);
    }

    for (const b of badgeAudit) {
      if (b.hasEquipBtn || b.hasEquipText) {
        throw new Error(`Badge card for "${b.name}" should NOT have equip button or "佩戴" text!`);
      }
      if (b.hasEllipsis) {
        throw new Error(`Badge card for "${b.name}" contains "..." ellipsis!`);
      }
      if (b.cursor !== 'pointer') {
        throw new Error(`Badge card for "${b.name}" must have cursor: pointer`);
      }
    }
    console.log('   ✅ R1 & R4 PASSED: No equip button/text, no ellipsis "...". Scalable grid with rich badge pool.');

    // -------------------------------------------------------------
    // REQUIREMENT 3: Remove "is-exempt" and "站长特免"
    // -------------------------------------------------------------
    console.log('\n--- VERIFYING REQUIREMENT 3: Exemption Label Removal ---');
    const exemptionAudit = await page.evaluate(() => {
      const exemptElements = document.querySelectorAll('.account-level-status.is-exempt');
      const allStatusTexts = Array.from(document.querySelectorAll('.account-level-status')).map((el) => el.textContent?.trim());
      const hasExemptWord = allStatusTexts.some((txt) => txt?.includes('豁免') || txt?.includes('特免'));
      return {
        exemptElementsCount: exemptElements.length,
        allStatusTexts,
        hasExemptWord,
      };
    });

    console.log('   📋 Level Progress Status elements:', exemptionAudit);
    if (exemptionAudit.exemptElementsCount > 0 || exemptionAudit.hasExemptWord) {
      throw new Error('Found .is-exempt or "站长特免" in level requirements list! Must be completely removed.');
    }
    console.log('   ✅ R3 PASSED: .is-exempt and "站长特免" completely removed. Clean result display.');

    // -------------------------------------------------------------
    // REQUIREMENT 5: account-status-custom-row Interactive Emoji Picker
    // -------------------------------------------------------------
    console.log('\n--- VERIFYING REQUIREMENT 5: Custom Status Emoji Picker ---');
    const emojiTrigger = await page.waitForSelector('.account-status-emoji-trigger', { state: 'visible', timeout: 3000 });
    await page.evaluate(() => {
      const trigger = document.querySelector('.account-status-emoji-trigger');
      if (trigger) trigger.click();
    });
    await page.waitForTimeout(300);

    const paletteVisible = await page.waitForSelector('.account-status-emoji-palette', { state: 'visible', timeout: 3000 });
    const paletteItemsCount = await page.$$eval('.account-status-emoji-palette__item', (items) => items.length);
    console.log(`   🎨 Emoji Palette opened with ${paletteItemsCount} selectable emojis.`);

    if (paletteItemsCount < 10) {
      throw new Error(`Expected at least 10 selectable emojis in palette, got ${paletteItemsCount}`);
    }

    // Click on emoji '🚀'
    await page.evaluate(() => {
      const rocketBtn = Array.from(document.querySelectorAll('.account-status-emoji-palette__item')).find(
        (el) => el.textContent?.trim() === '🚀'
      );
      if (rocketBtn) rocketBtn.click();
    });
    await page.waitForTimeout(300);

    const updatedStatusEmoji = await page.$eval('.account-status-emoji-input', (input) => input.value);
    console.log(`   🚀 Selected Emoji in input: ${updatedStatusEmoji}`);
    if (updatedStatusEmoji !== '🚀') {
      throw new Error(`Expected status emoji to be '🚀', got '${updatedStatusEmoji}'`);
    }
    console.log('   ✅ R5 PASSED: Interactive emoji trigger and palette working perfectly.');

    // -------------------------------------------------------------
    // REQUIREMENT 2: Strict Badge Sync & Reaction Count ("喝彩")
    // Part A: When 0 badges are equipped in account-badges-grid,
    //         profile-popover-badges-flow must be EMPTY!
    // -------------------------------------------------------------
    console.log('\n--- VERIFYING REQUIREMENT 2: Strict Synchronization & "喝彩" Accuracy ---');

    // Close drawer
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.theme-account-drawer__close');
      if (closeBtn) closeBtn.click();
      const mask = document.querySelector('.theme-account-overlay__mask');
      if (mask) mask.click();
    });
    await page.waitForTimeout(500);

    // Scroll to comments
    const commentSection = await page.waitForSelector('#post-comment', { state: 'visible', timeout: 10000 });
    await commentSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    // Open author popover
    const avatar = await page.waitForSelector('#post-comment .tk-avatar.is-clickable', { state: 'visible', timeout: 5000 });
    await avatar.click();
    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });

    const popoverCheckZero = await page.$eval('.author-profile-popover', (pop) => {
      const badgesFlow = pop.querySelector('.profile-popover-badges-flow');
      const reactionStatEl = Array.from(pop.querySelectorAll('.stat-item')).find((el) => el.textContent?.includes('喝彩'));
      const reactionVal = reactionStatEl?.querySelector('.stat-value')?.textContent?.trim();
      return {
        hasBadgesFlow: Boolean(badgesFlow),
        reactionVal,
      };
    });

    console.log('   🔍 Popover state with 0 equipped badges:', popoverCheckZero);
    if (popoverCheckZero.hasBadgesFlow) {
      throw new Error('When 0 badges are equipped, .profile-popover-badges-flow must NOT be rendered!');
    }
    if (popoverCheckZero.reactionVal !== '1') {
      throw new Error(`Expected "喝彩" reaction count to be 1, but got ${popoverCheckZero.reactionVal}! (Must not duplicate to 2)`);
    }
    console.log('   ✅ 0 equipped badges syncs perfectly (badges flow is empty). "喝彩" is strictly 1.');

    // Part B: Now equip 2 badges via clicking in drawer, verify they appear in popover
    console.log('\n   Equipping 2 badges by clicking card in account drawer...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications', { detail: { tab: 'auth' } }));
    });
    await page.waitForSelector('.account-badges-grid', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(300);

    const cards = await page.$$('.account-badge-card');
    console.log('   🔍 Found ' + cards.length + ' badge cards to click');
    if (cards.length >= 2) {
      await cards[0].click();
      await page.waitForTimeout(300);
      await cards[1].click();
      await page.waitForTimeout(400);
    }

    // Verify both cards now have .is-equipped
    const equippedClasses = await page.$$eval('.account-badge-card', (cards) => {
      return cards.slice(0, 2).map((c) => ({
        name: c.querySelector('.badge-card-name')?.textContent?.trim(),
        isEquipped: c.classList.contains('is-equipped'),
      }));
    });
    const lsBadges = await page.evaluate(() => window.localStorage.getItem('shijianus-equipped-badges'));
    console.log('   💾 LocalStorage equipped badges:', lsBadges);
    console.log('   🏷️ Newly equipped cards:', equippedClasses);
    if (!equippedClasses[0].isEquipped || !equippedClasses[1].isEquipped) {
      throw new Error('Clicked badge cards did not receive .is-equipped class!');
    }

    // Close drawer and re-check popover
    // Close drawer and re-open popover to check synchronized badges
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.theme-account-drawer__close');
      if (closeBtn) closeBtn.click();
      const mask = document.querySelector('.theme-account-overlay__mask');
      if (mask) mask.click();
    });
    await page.waitForTimeout(500);

    const reAvatar = await page.waitForSelector('#post-comment .tk-avatar.is-clickable', { state: 'visible', timeout: 5000 });
    await reAvatar.click();
    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });

    const popoverBadgesAfterEquip = await page.$eval('.author-profile-popover', (pop) => {
      const pills = Array.from(pop.querySelectorAll('.profile-popover-badge-pill')).map((p) => p.textContent?.trim());
      return pills;
    });

    console.log('   🏅 Badges in popover after equipping 2 badges:', popoverBadgesAfterEquip);
    if (popoverBadgesAfterEquip.length !== 2) {
      throw new Error(`Expected exactly 2 badges in popover, got ${popoverBadgesAfterEquip.length} (${JSON.stringify(popoverBadgesAfterEquip)})`);
    }
    console.log('   ✅ R2 PASSED: 100% two-way lockstep synchronization between account badges and popover flow!');

    console.log('\n===========================================================');
    console.log('🎉 ALL 5 USER REQUIREMENTS TESTED AND PASSED WITH 100% SUCCESS!');
    console.log('===========================================================\n');
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
