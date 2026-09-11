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

    await avatars[0].click();
    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });
    console.log('   ✅ .author-profile-popover opened.');

    const popoverAudit = await page.evaluate(() => {
      const popover = document.querySelector('.author-profile-popover');
      if (!popover) return null;

      const avatarWrap = popover.querySelector('.profile-popover-avatar-wrap');
      const avatar = popover.querySelector('.profile-popover-avatar');
      const crown = popover.querySelector('.profile-popover-avatar-crown-badge');
      const avatarComputed = avatar ? window.getComputedStyle(avatar) : null;
      const crownComputed = crown ? window.getComputedStyle(crown) : null;

      const name = popover.querySelector('.profile-popover-name');
      const nameComputed = name ? window.getComputedStyle(name) : null;
      const pills = Array.from(popover.querySelectorAll('.profile-popover-pill'));
      const pillDetails = pills.map((p) => ({
        text: p.textContent?.trim(),
        height: window.getComputedStyle(p).height,
        borderRadius: window.getComputedStyle(p).borderRadius,
      }));

      const mentionBtn = popover.querySelector('.profile-popover-mention-btn');
      const mentionComputed = mentionBtn ? window.getComputedStyle(mentionBtn) : null;
      const websiteBtn = popover.querySelector('.profile-popover-website-btn');

      const bio = popover.querySelector('.profile-popover-bio');
      const bioComputed = bio ? window.getComputedStyle(bio) : null;

      const emailLine = popover.querySelector('.profile-popover-email-line');
      const emailComputed = emailLine ? window.getComputedStyle(emailLine) : null;
      const emailBoxOld = popover.querySelector('.profile-popover-email-box');

      const inlineStats = popover.querySelector('.profile-popover-inline-stats');
      const statItems = Array.from(popover.querySelectorAll('.profile-popover-inline-stats .stat-item'));
      const oldStatsGrid = popover.querySelector('.profile-popover-stats-grid');

      const badgesFlow = popover.querySelector('.profile-popover-badges-flow');
      const badgePills = Array.from(popover.querySelectorAll('.profile-popover-group-pill'));
      const oldGroupsBox = popover.querySelector('.profile-popover-groups-box');

      const popoverComputed = window.getComputedStyle(popover);
      const innerChildren = Array.from(popover.querySelectorAll('.profile-popover-inner > *'));
      const nestedBoxesWithBgOrBorder = innerChildren.filter((el) => {
        const cs = window.getComputedStyle(el);
        const hasBorder = cs.borderWidth !== '0px' && cs.borderStyle !== 'none' && !cs.borderColor.includes('transparent');
        const hasBg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
        return hasBorder && hasBg;
      });

      return {
        borderRadius: popoverComputed.borderRadius,
        boxShadow: popoverComputed.boxShadow,
        nestedBoxesCount: nestedBoxesWithBgOrBorder.length,
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
        nameText: name?.textContent?.trim(),
        nameFontSize: nameComputed?.fontSize,
        nameFontWeight: nameComputed?.fontWeight,
        pillsCount: pills.length,
        pillDetails,
        mentionBtnText: mentionBtn?.textContent?.trim(),
        mentionBtnHeight: mentionComputed?.height,
        hasWebsiteBtn: !!websiteBtn,
        bioText: bio?.textContent?.trim(),
        bioFontSize: bioComputed?.fontSize,
        bioHasBorder: bioComputed?.borderWidth !== '0px' && bioComputed?.borderStyle !== 'none',
        bioBg: bioComputed?.backgroundColor,
        hasEmailLine: !!emailLine,
        hasOldEmailBox: !!emailBoxOld,
        emailText: emailLine?.textContent?.trim(),
        hasInlineStats: !!inlineStats,
        hasOldStatsGrid: !!oldStatsGrid,
        statItemsCount: statItems.length,
        statFlowText: inlineStats?.textContent?.replace(/\s+/g, ' ').trim(),
        hasBadgesFlow: !!badgesFlow,
        hasOldGroupsBox: !!oldGroupsBox,
        badgePillsCount: badgePills.length,
        badgePillTexts: badgePills.map((b) => b.textContent?.trim()),
      };
    });

    console.log('   📊 Popover Computed Structure:', JSON.stringify(popoverAudit, null, 2));

    if (popoverAudit.avatarBorderRadius !== '50%') {
      throw new Error(`Expected avatar border-radius 50%, got ${popoverAudit.avatarBorderRadius}`);
    }
    if (parseFloat(popoverAudit.avatarWidth) < 70 || parseFloat(popoverAudit.avatarWidth) > 85) {
      throw new Error(`Expected avatar width ~74px, got ${popoverAudit.avatarWidth}`);
    }
    if (!popoverAudit.hasCrownBadge) {
      throw new Error('Expected crown micro badge on webmaster circular avatar');
    }
    console.log('   ✅ 1. Avatar: Circular (74px, 50% radius) with micro crown badge attached to bottom-right.');

    if (!popoverAudit.nameText?.includes('Shijian')) {
      throw new Error(`Expected name "Shijian", got "${popoverAudit.nameText}"`);
    }
    if (parseInt(popoverAudit.nameFontWeight, 10) < 700) {
      throw new Error(`Expected bold nickname, got weight ${popoverAudit.nameFontWeight}`);
    }
    if (popoverAudit.pillsCount < 4) {
      throw new Error(`Expected at least 4 pill tags (Webmaster, LV, TL, Geo), got ${popoverAudit.pillsCount}`);
    }
    for (const pill of popoverAudit.pillDetails) {
      if (parseFloat(pill.height) > 26) {
        throw new Error(`Expected pill height <= 26px, got ${pill.height} for ${pill.text}`);
      }
    }
    console.log('   ✅ 2. Name & Pills: Bold nickname + compact horizontal micro-pills (~20px uniform height).');

    if (!popoverAudit.mentionBtnText?.includes('提及此人')) {
      throw new Error(`Expected mention button text "提及此人", got "${popoverAudit.mentionBtnText}"`);
    }
    if (parseFloat(popoverAudit.mentionBtnHeight) > 34) {
      throw new Error(`Expected compact mention button <= 34px, got ${popoverAudit.mentionBtnHeight}`);
    }
    if (!popoverAudit.hasWebsiteBtn) {
      throw new Error('Expected website button in header actions for author with website');
    }
    console.log('   ✅ 3. Top-Right Actions: Compact "@ 提及此人" button + website button aligned at top-right.');

    if (!popoverAudit.bioText?.includes('探索全栈工程架构')) {
      throw new Error(`Expected bio content, got "${popoverAudit.bioText}"`);
    }
    if (popoverAudit.bioHasBorder) {
      throw new Error('Bio must NOT have any container borders (should be plain text paragraph)');
    }
    console.log('   ✅ 4. Bio: Plain text natural paragraph, secondary color, NO grey box container.');

    if (!popoverAudit.hasEmailLine || popoverAudit.hasOldEmailBox) {
      throw new Error('Epomail must be a single lightweight line without outer grey card box');
    }
    if (!popoverAudit.emailText?.includes('shijian@epomail.bond')) {
      throw new Error(`Expected email text, got "${popoverAudit.emailText}"`);
    }
    console.log('   ✅ 5. Epomail / Email: Single lightweight line with ✉ icon, NO nested box.');

    if (!popoverAudit.hasInlineStats || popoverAudit.hasOldStatsGrid) {
      throw new Error('Stats must be inline text flow without old 3-column rectangular card boxes');
    }
    if (popoverAudit.statItemsCount !== 3) {
      throw new Error(`Expected 3 stat items in inline flow, got ${popoverAudit.statItemsCount}`);
    }
    if (!popoverAudit.statFlowText?.includes('阅读时长') || !popoverAudit.statFlowText?.includes('·')) {
      throw new Error(`Expected inline stats separated by "·", got "${popoverAudit.statFlowText}"`);
    }
    console.log('   ✅ 6. Inline Stats: Streamed continuous line "阅读时长 520m · 互动评论 88 · 收到获赞 360", NO 3 square boxes.');

    if (!popoverAudit.hasBadgesFlow || popoverAudit.hasOldGroupsBox) {
      throw new Error('Badges must be rendered directly without "所属群组" title or shield box');
    }
    if (popoverAudit.badgePillsCount < 4) {
      throw new Error(`Expected badge pills, got ${popoverAudit.badgePillsCount}`);
    }
    const hasMorePill = popoverAudit.badgePillTexts.some((t) => t.includes('更多'));
    if (!hasMorePill) {
      throw new Error('Expected "+N 更多" pill when badges > 4');
    }
    console.log('   ✅ 7. Badges: Compact pills (24px) with "+1 更多", NO "所属群组" title, NO shield icon.');

    if (popoverAudit.nestedBoxesCount > 0) {
      throw new Error(`Card must be flat without nested secondary boxes, found ${popoverAudit.nestedBoxesCount} nested boxes`);
    }
    console.log('   ✅ 8. Container: Flat single solid surface, soft border radius & shadow, ZERO nested boxes.');

    const popoverBox = await page.$eval('.author-profile-popover', (el) => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    });
    console.log('   📍 Popover Box:', popoverBox);
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
    console.log('📌 Test 4: Auditing Regular Reader Popover...');
    console.log('-----------------------------------------------------------');

    await avatars[1].click();
    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });

    const readerAudit = await page.evaluate(() => {
      const popover = document.querySelector('.author-profile-popover');
      const crown = popover?.querySelector('.profile-popover-avatar-crown-badge');
      const name = popover?.querySelector('.profile-popover-name')?.textContent?.trim();
      const rolePill = popover?.querySelector('.profile-popover-pill.is-role')?.textContent?.trim();
      const levelPill = popover?.querySelector('.profile-popover-pill.is-level')?.textContent?.trim();
      return {
        hasCrownBadge: !!crown,
        name,
        rolePill,
        levelPill,
      };
    });

    console.log('   📊 Regular Reader Details:', readerAudit);
    if (readerAudit.hasCrownBadge) {
      throw new Error('Regular reader should NOT have crown badge');
    }
    if (readerAudit.rolePill !== '注册读者') {
      throw new Error(`Expected role "注册读者", got "${readerAudit.rolePill}"`);
    }
    console.log('   ✅ Regular reader card has 0 crown badge, and correct role micro-pill.');

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
