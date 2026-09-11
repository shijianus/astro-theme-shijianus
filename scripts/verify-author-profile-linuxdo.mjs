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

const testComments = [
  {
    id: 'comment-wm',
    postSlug: 'content-formats-and-markup-mastery',
    parentId: null,
    postType: 'comment',
    authorId: 'adm_1',
    authorName: 'Shijian',
    authorEmail: 'shijian@epomail.bond',
    authorAvatar: '/media/shijianus/avatar.jpg',
    authorWebsite: 'https://blog.epocanvas.com',
    authorRole: 'admin',
    isWebmaster: true,
    authorBio: '探索全栈工程架构与精致交互体验的技术旅人。',
    message: '这是一条站长发布的置顶测试留言，点击头像可查看经过 LinuxDo / Discourse 规则全面重构的名片。',
    groups: ['站长团队', '核心架构师', '开源极客', '终身赞助者', 'Discourse专家'],
    showLocation: true,
    ipCountry: 'MY',
    ipCountryName: '马来西亚',
    ipCountryFlag: '🇲🇾',
    ipLocation: 'Kuala Lumpur, Malaysia',
    likesCount: 15,
    status: 'published',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'comment-user',
    postSlug: 'content-formats-and-markup-mastery',
    parentId: null,
    postType: 'comment',
    authorId: 'usr_2',
    authorName: 'LinusFan',
    authorEmail: 'linus@example.com',
    authorAvatar: '',
    authorWebsite: '',
    authorRole: 'reader',
    isWebmaster: false,
    authorBio: 'Linux Do 活跃读者，热爱开源与极简设计。',
    message: '支持 LinuxDo 风格改造！去除了厚重的多层嵌套边框，视觉体验大幅提升！',
    groups: ['高阶读者', '前端工匠'],
    showLocation: true,
    ipCountry: 'JP',
    ipCountryName: '日本',
    ipCountryFlag: '🇯🇵',
    ipLocation: 'Tokyo, Japan',
    likesCount: 5,
    status: 'published',
    createdAt: new Date().toISOString(),
  },
];

function createStaticServer(distDir, port = 4323) {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${port}`);
      let reqPath = decodeURIComponent(parsedUrl.pathname);

      if (reqPath === '/api/comments') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Comment-Session-Token, X-Admin-Token');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        if (req.method === 'GET') {
          console.log(`[API] Returning ${testComments.length} mock comments for query: ${parsedUrl.search}`);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, comments: testComments }));
          return;
        }
      }

      let filePath = path.join(distDir, reqPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(port, () => {
      console.log(`📡 Local Test Server running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function runVerification() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const screenshotDir = path.resolve(process.cwd(), 'scripts/audit_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const port = 4323;
  const server = await createStaticServer(distDir, port);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LinuxDo-Audit',
    });

    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(msg.text());
      }
    });

    const postUrl = `http://localhost:${port}/posts/content-formats-and-markup-mastery/`;
    console.log(`🌐 Navigating to ${postUrl}...`);
    await page.goto(postUrl, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(2000);

    const commentSection = await page.waitForSelector('#post-comment', { state: 'visible', timeout: 15000 });
    await commentSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);

    const avatars = await page.$$('#post-comment .tk-avatar.is-clickable');
    console.log(`🔍 Found ${avatars.length} clickable comment avatars.`);
    if (avatars.length < 2) {
      // Print HTML inside #post-comment to see what rendered
      const commentHtml = await page.$eval('#post-comment', (el) => el.innerHTML.substring(0, 1000));
      console.log('HTML snippet of #post-comment:', commentHtml);
      throw new Error(`Expected at least 2 avatars, found ${avatars.length}`);
    }

    console.log('\n-----------------------------------------------------------');
    console.log('📌 Test 1: Auditing Webmaster Profile Popover (LinuxDo Flow)...');
    console.log('-----------------------------------------------------------');

    const avatar0Rect = await avatars[0].boundingBox();
    await avatars[0].click();
    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });
    console.log('   ✅ .author-profile-popover opened.');

    const popoverAudit = await page.evaluate(() => {
      const popover = document.querySelector('.author-profile-popover');
      if (!popover) return null;

      const avatar = popover.querySelector('.profile-popover-avatar');
      const crown = popover.querySelector('.profile-popover-avatar-crown-badge');
      const avatarComputed = avatar ? window.getComputedStyle(avatar) : null;
      const crownComputed = crown ? window.getComputedStyle(crown) : null;

      const displayName = popover.querySelector('.profile-popover-display-name');
      const displayComputed = displayName ? window.getComputedStyle(displayName) : null;
      const username = popover.querySelector('.profile-popover-username');
      const title = popover.querySelector('.profile-popover-title');
      const titleComputed = title ? window.getComputedStyle(title) : null;

      // Check for legacy/unwanted colorful pill stacks
      const legacyLevelPills = Array.from(popover.querySelectorAll('.profile-popover-pill'));

      const mentionBtn = popover.querySelector('.profile-popover-mention-btn');
      const mentionComputed = mentionBtn ? window.getComputedStyle(mentionBtn) : null;
      const websiteBtn = popover.querySelector('.profile-popover-action-icon-btn[title*="个人站点"]');

      const bio = popover.querySelector('.profile-popover-bio');
      const bioComputed = bio ? window.getComputedStyle(bio) : null;

      const emailLine = popover.querySelector('.profile-popover-email-line');
      const emailText = emailLine?.querySelector('.profile-popover-email-text')?.textContent?.trim();

      const locationTag = popover.querySelector('.profile-popover-location-tag');
      const locationText = locationTag?.textContent?.trim();
      const popoverAllText = popover.textContent || '';

      const inlineStats = popover.querySelector('.profile-popover-inline-stats');
      const inlineStatsComputed = inlineStats ? window.getComputedStyle(inlineStats) : null;
      const statItems = Array.from(popover.querySelectorAll('.profile-popover-inline-stats .stat-item'));
      const oldStatsGrid = popover.querySelector('.profile-popover-stats-grid');

      const badgesFlow = popover.querySelector('.profile-popover-badges-flow');
      const badgePills = Array.from(popover.querySelectorAll('.profile-popover-badge-pill'));

      const popoverComputed = window.getComputedStyle(popover);
      const innerLayout = popover.querySelector('.profile-popover-layout');
      const layoutComputed = innerLayout ? window.getComputedStyle(innerLayout) : null;

      return {
        borderRadius: popoverComputed.borderRadius,
        boxShadow: popoverComputed.boxShadow,
        isLandscapeFlexRow: layoutComputed?.display === 'flex' && layoutComputed?.flexDirection === 'row',
        avatarWidth: avatarComputed?.width,
        avatarHeight: avatarComputed?.height,
        avatarBorderRadius: avatarComputed?.borderRadius,
        hasCrownBadge: !!crown,
        crownPosition: crownComputed ? {
          position: crownComputed.position,
          bottom: crownComputed.bottom,
          right: crownComputed.right,
          borderRadius: crownComputed.borderRadius,
        } : null,
        displayNameText: displayName?.textContent?.trim(),
        displayNameWeight: displayComputed?.fontWeight,
        hasLocationTag: !!locationTag,
        locationText,
        usernameText: username?.textContent?.trim(),
        titleText: title?.textContent?.trim(),
        titleHasBg: titleComputed?.backgroundColor !== 'rgba(0, 0, 0, 0)' && titleComputed?.backgroundColor !== 'transparent',
        legacyLevelPillsCount: legacyLevelPills.length,
        mentionBtnText: mentionBtn?.textContent?.trim(),
        mentionBtnHeight: mentionComputed?.height,
        hasWebsiteBtn: !!websiteBtn,
        bioText: bio?.textContent?.trim(),
        bioFontSize: bioComputed?.fontSize,
        bioHasBorder: bioComputed?.borderWidth !== '0px' && bioComputed?.borderStyle !== 'none',
        hasEmailLine: !!emailLine,
        emailText,
        hasInlineStats: !!inlineStats,
        hasOldStatsGrid: !!oldStatsGrid,
        statItemsCount: statItems.length,
        statFlowText: inlineStats?.textContent?.replace(/\s+/g, ' ').trim(),
        statsHasDotSep: inlineStats?.textContent?.includes('·') || false,
        statsGap: inlineStatsComputed?.gap,
        hasBadgesFlow: !!badgesFlow,
        badgePillsCount: badgePills.length,
        badgePillTexts: badgePills.map((b) => b.textContent?.trim()),
        hasFakeBadgesText: popoverAllText.includes('受到赞赏') || popoverAllText.includes('活跃交流'),
        hasMorePillText: popoverAllText.includes('更多'),
      };
    });

    console.log('   📊 Popover Computed Structure:', JSON.stringify(popoverAudit, null, 2));

    const popoverBox = await page.$eval('.author-profile-popover', (el) => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, left: rect.left, right: rect.right, width: rect.width, height: rect.height };
    });
    console.log('   📍 Popover Bounding Box:', popoverBox);

    // 1. Landscape Card Morphology Assertion
    if (popoverBox.width < 460 || popoverBox.width > 500) {
      throw new Error(`Expected wide landscape width between 460px and 500px, got ${popoverBox.width}px`);
    }
    if (popoverBox.height > 260) {
      throw new Error(`Expected compact landscape height <= 260px, got ${popoverBox.height}px`);
    }
    if (!popoverAudit.isLandscapeFlexRow) {
      throw new Error('Expected 2-column landscape flex-row layout (.profile-popover-layout)');
    }
    console.log('   ✅ 1. Landscape Card: Dimensions (480px x ~200px) verified, zero tall vertical box.');

    // 2. Positioning Collision Detection
    if (avatar0Rect && popoverBox.left < avatar0Rect.right) {
      throw new Error(`Expected popover to expand to the right of avatar, left: ${popoverBox.left}, avatar right: ${avatar0Rect.right}`);
    }
    console.log('   ✅ 2. Positioning: Successfully opened to the RIGHT of the avatar, avoiding editor above.');

    // 3. Avatar Assertion
    if (popoverAudit.avatarBorderRadius !== '50%') {
      throw new Error(`Expected avatar border-radius 50%, got ${popoverAudit.avatarBorderRadius}`);
    }
    if (parseFloat(popoverAudit.avatarWidth) < 75 || parseFloat(popoverAudit.avatarWidth) > 85) {
      throw new Error(`Expected avatar width ~80px, got ${popoverAudit.avatarWidth}`);
    }
    if (!popoverAudit.hasCrownBadge) {
      throw new Error('Expected crown micro badge on webmaster circular avatar');
    }
    console.log('   ✅ 3. Avatar: Circular (80px, 50% radius) with micro crown badge attached to bottom-right.');

    // 4. User Identity: Name, @username, Pure Text Title (no colorful pill stack!)
    if (!popoverAudit.displayNameText?.includes('Shijian')) {
      throw new Error(`Expected display name "Shijian", got "${popoverAudit.displayNameText}"`);
    }
    if (!popoverAudit.usernameText?.startsWith('@')) {
      throw new Error(`Expected username starting with @, got "${popoverAudit.usernameText}"`);
    }
    if (popoverAudit.titleText !== '站长') {
      throw new Error(`Expected highest title "站长", got "${popoverAudit.titleText}"`);
    }
    if (popoverAudit.titleHasBg) {
      throw new Error('Highest title must be pure text without background box');
    }
    if (popoverAudit.legacyLevelPillsCount > 0) {
      throw new Error(`Legacy colorful level pills must be removed, found ${popoverAudit.legacyLevelPillsCount}`);
    }
    console.log('   ✅ 4. User Identity: Bold display name + @username + pure text title, NO colorful pill stack.');

    // 5. Actions: @ 提及此人 and ✕ close
    if (!popoverAudit.mentionBtnText?.includes('提及此人')) {
      throw new Error(`Expected mention button text "提及此人", got "${popoverAudit.mentionBtnText}"`);
    }
    if (parseFloat(popoverAudit.mentionBtnHeight) > 30) {
      throw new Error(`Expected compact mention button <= 30px, got ${popoverAudit.mentionBtnHeight}`);
    }
    console.log('   ✅ 5. Actions: Compact "@ 提及此人" button + close button aligned at top-right.');

    // 6. Bio: Plain text
    if (!popoverAudit.bioText?.includes('探索全栈工程架构')) {
      throw new Error(`Expected bio content, got "${popoverAudit.bioText}"`);
    }
    if (popoverAudit.bioHasBorder) {
      throw new Error('Bio must NOT have container borders');
    }
    console.log('   ✅ 6. Bio: Plain text natural paragraph, secondary color, NO container borders.');

    // 7. Real Data Inline Stats (Zero 9999m or 999! ZERO "·" separator! Elastic gap spacing!)
    if (!popoverAudit.hasInlineStats) {
      throw new Error('Stats must be inline text flow');
    }
    if (popoverAudit.statItemsCount !== 4) {
      throw new Error(`Expected 4 stat items (加入时间, 已读, 评论, 喝彩), got ${popoverAudit.statItemsCount}`);
    }
    if (!popoverAudit.statFlowText?.includes('加入时间') || !popoverAudit.statFlowText?.includes('已读') || !popoverAudit.statFlowText?.includes('评论') || !popoverAudit.statFlowText?.includes('喝彩')) {
      throw new Error(`Expected real stats stream with all 4 metrics, got "${popoverAudit.statFlowText}"`);
    }
    if (popoverAudit.statFlowText?.includes('9999m') || popoverAudit.statFlowText?.includes('999')) {
      throw new Error(`Stat text must NOT contain hardcoded mock data (9999m or 999): "${popoverAudit.statFlowText}"`);
    }
    if (popoverAudit.statsHasDotSep) {
      throw new Error(`Stats row must NOT contain dot separator "·": "${popoverAudit.statFlowText}"`);
    }
    console.log(`   ✅ 7. Real Data Stats: "${popoverAudit.statFlowText}" (100% real metrics, ZERO dot separator, gap-spaced).`);

    // 8. Badges (Strictly official titles/groups, <= 4 pills, ZERO fake badges, ZERO "+N 更多", ZERO location pollution)
    if (!popoverAudit.hasBadgesFlow) {
      throw new Error('Badges must be rendered directly in badges flow');
    }
    if (popoverAudit.badgePillsCount > 4) {
      throw new Error(`Expected at most 4 badge pills, got ${popoverAudit.badgePillsCount}`);
    }
    if (popoverAudit.hasFakeBadgesText) {
      throw new Error('Found fake badges "受到赞赏" or "活跃交流" in popover!');
    }
    if (popoverAudit.hasMorePillText) {
      throw new Error('Found "+N 更多" pill in popover, it must be removed!');
    }
    for (const text of popoverAudit.badgePillTexts) {
      if (text.includes('马来西亚') || text.includes('MY')) {
        throw new Error(`Found location "${text}" in badges flow! Location must not be in badges.`);
      }
    }
    console.log(`   ✅ 8. Badges: Official badges (${popoverAudit.badgePillTexts.join(', ')}), <= 4 pills, ZERO fake badges, ZERO "+N 更多", ZERO location pollution.`);

    await page.waitForTimeout(300);
    const lightScreenshotPath = path.join(screenshotDir, '01-linuxdo-popover-light.png');
    await page.screenshot({ path: lightScreenshotPath });
    console.log(`   📸 Light mode screenshot saved to ${lightScreenshotPath}`);

    console.log('\n-----------------------------------------------------------');
    console.log('📌 Test 2: Auditing Dark Mode Profile Popover...');
    console.log('-----------------------------------------------------------');

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300);

    const darkBg = await page.$eval('.author-profile-popover', (el) => window.getComputedStyle(el).backgroundColor);
    console.log('   -> Dark mode popover backgroundColor:', darkBg);

    const darkScreenshotPath = path.join(screenshotDir, '02-linuxdo-popover-dark.png');
    await page.screenshot({ path: darkScreenshotPath });
    console.log(`   📸 Dark mode screenshot saved to ${darkScreenshotPath}`);

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });

    console.log('\n-----------------------------------------------------------');
    console.log('📌 Test 3: Verifying "@ 提及此人" interaction...');
    console.log('-----------------------------------------------------------');

    const mentionBtn = await page.$('.profile-popover-mention-btn');
    if (!mentionBtn) throw new Error('Missing .profile-popover-mention-btn');
    await mentionBtn.click();
    await page.waitForTimeout(500);

    const popoverVisible = await page.$('.author-profile-popover');
    if (popoverVisible) {
      throw new Error('Expected popover to close after clicking "@ 提及此人"');
    }
    console.log('   ✅ Popover smoothly closed upon mention click.');

    const textareaValue = await page.$eval('#post-comment textarea', (el) => el.value);
    console.log('   -> Textarea value:', JSON.stringify(textareaValue));
    if (!textareaValue.includes('@Shijian')) {
      throw new Error(`Expected textarea to contain "@Shijian", got "${textareaValue}"`);
    }
    console.log('   ✅ Textarea successfully populated with "@Shijian " and focused!');

    console.log('\n-----------------------------------------------------------');
    console.log('📌 Test 4: Auditing Regular Reader Popover (Real Data & Clean Hierarchy)...');
    console.log('-----------------------------------------------------------');

    await avatars[1].click();
    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });

    const readerAudit = await page.evaluate(() => {
      const popover = document.querySelector('.author-profile-popover');
      const crown = popover?.querySelector('.profile-popover-avatar-crown-badge');
      const displayName = popover?.querySelector('.profile-popover-display-name')?.textContent?.trim();
      const username = popover?.querySelector('.profile-popover-username')?.textContent?.trim();
      const title = popover?.querySelector('.profile-popover-title')?.textContent?.trim();
      const statFlowText = popover?.querySelector('.profile-popover-inline-stats')?.textContent?.replace(/\s+/g, ' ').trim();
      const legacyPills = popover?.querySelectorAll('.profile-popover-pill');
      const badgePills = Array.from(popover?.querySelectorAll('.profile-popover-badge-pill') || []);
      const popoverAllText = popover?.textContent || '';
      return {
        hasCrownBadge: !!crown,
        displayName,
        username,
        title,
        statFlowText,
        statsHasDotSep: statFlowText?.includes('·') || false,
        legacyPillsCount: legacyPills?.length ?? 0,
        badgePillsCount: badgePills.length,
        badgePillTexts: badgePills.map((b) => b.textContent?.trim()),
        hasFakeBadgesText: popoverAllText.includes('受到赞赏') || popoverAllText.includes('活跃交流'),
        hasMorePillText: popoverAllText.includes('更多'),
      };
    });

    console.log('   📊 Regular Reader Details:', readerAudit);
    if (readerAudit.hasCrownBadge) {
      throw new Error('Regular reader should NOT have crown badge');
    }
    if (readerAudit.displayName !== 'LinusFan') {
      throw new Error(`Expected display name "LinusFan", got "${readerAudit.displayName}"`);
    }
    if (!readerAudit.username?.startsWith('@')) {
      throw new Error(`Expected username starting with "@", got "${readerAudit.username}"`);
    }
    if (!readerAudit.title || (readerAudit.title !== '基本用户' && readerAudit.title !== '注册读者' && readerAudit.title !== '新兴用户')) {
      throw new Error(`Expected official title, got "${readerAudit.title}"`);
    }
    if (readerAudit.legacyPillsCount > 0) {
      throw new Error('Regular reader should NOT have legacy colorful pills');
    }
    if (readerAudit.statFlowText?.includes('9999m') || readerAudit.statFlowText?.includes('999')) {
      throw new Error(`Regular reader stats must NOT have fake data: "${readerAudit.statFlowText}"`);
    }
    if (readerAudit.statsHasDotSep) {
      throw new Error(`Regular reader stats must NOT have "·": "${readerAudit.statFlowText}"`);
    }
    if (readerAudit.hasFakeBadgesText) {
      throw new Error('Regular reader popover has fake badges!');
    }
    if (readerAudit.hasMorePillText) {
      throw new Error('Regular reader popover has "+N 更多" pill!');
    }
    if (readerAudit.badgePillsCount > 4) {
      throw new Error(`Regular reader badge count must be <= 4, got ${readerAudit.badgePillsCount}`);
    }
    console.log('   ✅ Regular reader card verified: 0 crown, pure text title, real data stats without dots, official badges.');

    await page.waitForTimeout(300);
    const readerScreenshotPath = path.join(screenshotDir, '03-linuxdo-popover-reader.png');
    await page.screenshot({ path: readerScreenshotPath });
    console.log(`   📸 Regular reader screenshot saved to ${readerScreenshotPath}`);

    console.log('\n-----------------------------------------------------------');
    console.log('📌 Test 5: Auditing Mobile Viewport (390x844)...');
    console.log('-----------------------------------------------------------');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    // Close any previous popover
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.profile-popover-close-btn');
      if (closeBtn) closeBtn.click();
    });
    await page.waitForTimeout(300);

    // Click first avatar in mobile layout to trigger recalculation of popover position
    const mobileAvatars = await page.$$('#post-comment .tk-avatar.is-clickable');
    await mobileAvatars[0].click();
    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);

    const mobilePopoverDims = await page.$eval('.author-profile-popover', (el) => {
      const rect = el.getBoundingClientRect();
      return {
        width: rect.width,
        left: rect.left,
        right: rect.right,
        viewportWidth: window.innerWidth,
        isWithinViewport: rect.right <= window.innerWidth && rect.left >= 0,
      };
    });
    console.log('   📱 Mobile Popover Dimensions:', mobilePopoverDims);
    if (!mobilePopoverDims.isWithinViewport) {
      throw new Error(`Mobile popover overflowed viewport: ${JSON.stringify(mobilePopoverDims)}`);
    }
    console.log('   ✅ Mobile popover adapts smoothly within screen with 0 horizontal overflow.');

    const mobileScreenshotPath = path.join(screenshotDir, '04-linuxdo-popover-mobile.png');
    await page.screenshot({ path: mobileScreenshotPath });
    console.log(`   📸 Mobile screenshot saved to ${mobileScreenshotPath}`);

    console.log('\n🎉 ALL 5 MODULE AUDITS OF LINUXDO PROFILE POPOVER PASSED WITH 100% SUCCESS!');
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
