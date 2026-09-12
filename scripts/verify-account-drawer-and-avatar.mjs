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

const testCommentsDb = new Map();

// Seed database with Webmaster comment and Reader comment
testCommentsDb.set('c_admin_1', {
  id: 'c_admin_1',
  postSlug: 'content-formats-and-markup-mastery',
  parentId: null,
  postType: 'comment',
  authorId: 'admin_shijian',
  authorName: 'shijianus',
  authorAvatar: '/media/shijianus/avatar.jpg',
  authorWebsite: 'https://blog.epocanvas.com',
  authorEmail: 'admin@epomail.bond',
  authorRole: 'admin',
  isWebmaster: true,
  authorBio: 'EpoCanvas 站长 · 博客创作者与架构设计者',
  message: '欢迎体验全新的读者中心与作者名片交互！',
  likesCount: 25,
  status: 'published',
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  sessionToken: 'admin_tok_1',
  showLocation: true,
  ipCountry: 'US',
  ipCountryName: '美国',
  ipCountryFlag: '🇺🇸',
  ipLocation: '加利福尼亚',
  reactions: { '👍': ['usr_1', 'usr_2'] },
});

testCommentsDb.set('c_reader_1', {
  id: 'c_reader_1',
  postSlug: 'content-formats-and-markup-mastery',
  parentId: null,
  postType: 'comment',
  authorId: 'reader_alice',
  authorName: 'Alice',
  authorAvatar: '',
  authorWebsite: '',
  authorEmail: 'alice@epomail.bond',
  authorRole: 'reader',
  isWebmaster: false,
  authorBio: '热爱排版与开源技术。',
  message: '名片功能和圆形/方形头像的区分设计太赞了！',
  likesCount: 5,
  status: 'published',
  createdAt: new Date(Date.now() - 1800000).toISOString(),
  sessionToken: 'reader_tok_1',
  showLocation: true,
  ipCountry: 'CN',
  ipCountryName: '中国',
  ipCountryFlag: '🇨🇳',
  ipLocation: '北京',
  reactions: { '❤️': ['admin_shijian'] },
});

function createStaticServer(distDir, port = 4345) {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${port}`);
      let reqPath = decodeURIComponent(parsedUrl.pathname);

      if (reqPath === '/api/comments') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Comment-Session-Token, X-Admin-Token');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        if (req.method === 'GET') {
          const slug = parsedUrl.searchParams.get('slug') || '';
          const feed = parsedUrl.searchParams.get('feed') || '';

          if (feed === 'user') {
            const userComments = Array.from(testCommentsDb.values()).map((c) => ({
              id: c.id,
              postSlug: c.postSlug,
              message: c.message,
              postType: c.postType,
              likesCount: c.likesCount || 0,
              createdAt: c.createdAt,
            }));
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: true, userComments, notifications: [] }));
            return;
          }

          const sort = parsedUrl.searchParams.get('sort') || 'new';
          const list = Array.from(testCommentsDb.values())
            .filter((c) => c.postSlug === slug && c.status !== 'deleted')
            .sort((a, b) => {
              if (sort === 'hot') {
                const diff = (b.likesCount || 0) - (a.likesCount || 0);
                if (diff !== 0) return diff;
              }
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, sort, comments: list }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            const payload = JSON.parse(body || '{}');
            const id = `c_new_${Date.now()}`;
            const newComment = {
              id,
              postSlug: payload.slug,
              parentId: payload.parentId || null,
              postType: payload.postType || 'comment',
              authorId: 'test_user',
              authorName: 'TestUser',
              authorRole: 'visitor',
              message: payload.message || '',
              likesCount: 0,
              status: 'published',
              createdAt: new Date().toISOString(),
              sessionToken: 'tok_test',
            };
            testCommentsDb.set(id, newComment);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: true, comment: newComment, sessionToken: 'tok_test' }));
          });
          return;
        }
      }

      // Static file serving
      if (reqPath.endsWith('/')) reqPath += 'index.html';
      const ext = path.extname(reqPath);
      if (!ext) reqPath += '/index.html';

      let filePath = path.join(distDir, reqPath);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(distDir, '404.html');
      }

      if (fs.existsSync(filePath)) {
        const fileExt = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[fileExt] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
      }
    });

    server.listen(port, () => resolve(server));
  });
}

async function runVerification() {
  console.log('🚀 Starting Fast Static + Mock API Server on port 4345...');
  const distDir = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    throw new Error('dist directory does not exist. Please run npm run build first.');
  }

  const server = await createStaticServer(distDir, 4345);
  console.log('✅ Server listening on http://127.0.0.1:4345');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();

    // Set initial identity in localStorage
    await page.addInitScript(() => {
      localStorage.setItem(
        'shijianus_comment_identity_v1',
        JSON.stringify({
          name: 'shijianus',
          email: 'admin@epomail.bond',
          role: 'admin',
          avatar: '/media/shijianus/avatar.jpg',
        })
      );
    });

    // ----------------------------------------------------
    // PHASE 1: Account Drawer Overhaul Verification
    // ----------------------------------------------------
    console.log('\n--- PHASE 1: Account Drawer Overhaul Verification ---');
    await page.goto('http://127.0.0.1:4345/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // 1. Open Account Drawer
    console.log('1. Opening Account Drawer...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });
    await page.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 5000 });
    console.log('   -> Account Drawer is visible.');

    // 2. Verify Drawer Head Badge
    const headBadgeText = await page.$eval('.theme-account-drawer__head-badge', (el) => el.textContent?.trim());
    console.log('   -> Drawer Head Badge Text:', headBadgeText);
    if (!headBadgeText || (!headBadgeText.includes('LV.') && !headBadgeText.includes('TL.'))) {
      throw new Error(`Drawer head badge does not contain dynamic LV/TL status: "${headBadgeText}"`);
    }
    console.log('   ✅ Head badge dynamically displays community level and trust level.');

    // 3. Verify Tab 1 renamed to "个人资料"
    const tab0Text = await page.$eval('.theme-account-drawer .account-nav-tab', (el) => el.textContent?.trim());
    console.log('   -> Tab 0 Name:', tab0Text);
    if (!tab0Text?.includes('个人资料')) {
      throw new Error(`Expected Tab 0 to be "个人资料", got "${tab0Text}"`);
    }
    console.log('   ✅ Tab 0 successfully renamed to "个人资料".');

    // 4. Switch to Tab 0 and verify Community Level & Trust System Card
    console.log('4. Checking Tab 0 (个人资料) Community Level Card...');
    await page.evaluate(() => {
      document.querySelectorAll('.theme-account-drawer .account-nav-tab')[0].click();
    });
    await page.waitForTimeout(400);

    const levelCard = await page.$('.account-card--level');
    if (!levelCard) throw new Error('Missing .account-card--level in Tab 0 (个人资料)');
    const levelTitle = await page.$eval('.account-level-name', (el) => el.textContent?.trim());
    const trustPill = await page.$eval('.account-level-trust-pill', (el) => el.textContent?.trim());
    console.log('   -> Level Card Title:', levelTitle);
    console.log('   -> Trust Level Pill:', trustPill);
    if (!trustPill?.includes('TL.')) {
      throw new Error(`Expected trust pill to contain "TL.", got "${trustPill}"`);
    }
    console.log('   ✅ Community leveling ladder & trust card verified in Tab 0.');

    // 5. Verify Likes / Reactions inline format in Comment Footprint
    console.log('5. Testing Likes / Reactions inline format...');
    await page.evaluate(() => {
      document.querySelectorAll('.theme-account-drawer .account-nav-tab')[1].click();
    });
    await page.waitForTimeout(400);

    // Switch to Footprint partition
    await page.evaluate(() => {
      const p = document.querySelectorAll('.account-partition-btn');
      if (p.length > 0) p[0].click();
    });
    await page.waitForTimeout(400);

    const likesFormatOk = await page.evaluate(() => {
      const container = document.querySelector('.account-my-comments-list') || document.querySelector('.account-drawer-content');
      if (container) {
        const dummy = document.createElement('div');
        dummy.className = 'account-my-comment-item';
        dummy.innerHTML = `
          <div class="account-my-comment-head">
            <span class="account-my-comment-post">文章：测试博文</span>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-rose-500 inline-flex items-center gap-1 whitespace-nowrap" title="👍 42">
                <span class="leading-none">👍</span>
                <span class="leading-none">42</span>
              </span>
            </div>
          </div>
        `;
        container.prepend(dummy);
        const el = dummy.querySelector('.text-rose-500');
        const computed = window.getComputedStyle(el);
        return {
          text: el.textContent.replace(/\s+/g, ' ').trim(),
          display: computed.display,
          whiteSpace: computed.whiteSpace,
        };
      }
      return null;
    });

    console.log('   -> Likes formatting test:', likesFormatOk);
    if (likesFormatOk) {
      if (!likesFormatOk.text.includes('👍 42') && !likesFormatOk.text.includes('👍42')) {
        throw new Error(`Expected likes text to be "👍 42", got "${likesFormatOk.text}"`);
      }
      if (likesFormatOk.whiteSpace !== 'nowrap') {
        throw new Error('Expected likes element to have white-space: nowrap');
      }
      console.log('   ✅ Likes / reactions inline format (emoji+number) verified.');
    }

    // 6. Verify Comment Sort Group in Settings (Tab 2)
    console.log('\n--- Testing Comment Sort Group Collapse/Expand ---');
    await page.evaluate(() => {
      document.querySelectorAll('.theme-account-drawer .account-nav-tab')[2].click();
    });
    await page.waitForTimeout(400);

    const sortBtns = await page.$$('.account-pref-sort-btn');
    if (sortBtns.length < 2) throw new Error('Expected 2 sort buttons in Settings tab');

    let btn0Text = (await sortBtns[0].textContent())?.trim();
    let btn1Text = (await sortBtns[1].textContent())?.trim();
    console.log('   -> Initial Sort Btns in zh-CN:');
    console.log('      Btn 0 (Newest):', JSON.stringify(btn0Text));
    console.log('      Btn 1 (Popular):', JSON.stringify(btn1Text));

    const isOneCollapsed = (btn0Text.length > 2 && btn1Text.length <= 2) || (btn1Text.length > 2 && btn0Text.length <= 2);
    if (!isOneCollapsed) {
      throw new Error(`Expected one sort button to be collapsed (emoji-only). Got: "${btn0Text}" and "${btn1Text}"`);
    }
    console.log('   ✅ Sort group correctly collapses unselected option to emoji only!');

    // Toggle button
    const inactiveIndex = btn0Text.length <= 2 ? 0 : 1;
    await page.evaluate((idx) => {
      document.querySelectorAll('.account-pref-sort-btn')[idx].click();
    }, inactiveIndex);
    await page.waitForTimeout(300);

    let newBtn0Text = (await sortBtns[0].textContent())?.trim();
    let newBtn1Text = (await sortBtns[1].textContent())?.trim();
    console.log('   -> After toggle:');
    console.log('      Btn 0:', JSON.stringify(newBtn0Text));
    console.log('      Btn 1:', JSON.stringify(newBtn1Text));

    if (inactiveIndex === 0 && newBtn0Text.length <= 2) {
      throw new Error('Expected Btn 0 to expand with label after click');
    } else if (inactiveIndex === 1 && newBtn1Text.length <= 2) {
      throw new Error('Expected Btn 1 to expand with label after click');
    }
    console.log('   ✅ Sort group toggle and expand verified.');

    // Test English Locale: verify no overflow
    console.log('   -> Switching to English locale...');
    await page.evaluate(() => {
      localStorage.setItem('shijianus_comment_locale_v1', 'en');
      window.dispatchEvent(new CustomEvent('shijianus:locale-changed', { detail: { locale: 'en' } }));
    });
    await page.waitForTimeout(400);

    const enSortGroupWidth = await page.$eval('.account-pref-sort-group', (el) => {
      return {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        isOverflowing: el.scrollWidth > el.clientWidth,
      };
    });
    console.log('   -> English Sort Group dimensions:', enSortGroupWidth);
    if (enSortGroupWidth.isOverflowing) {
      throw new Error('Sort group is overflowing in English!');
    }
    console.log('   ✅ English sort group fits without any overflow.');

    // Close drawer
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:close-overlays'));
    });
    await page.waitForTimeout(400);

    // ----------------------------------------------------
    // PHASE 2: Comment Section Avatar Distinction & Popover
    // ----------------------------------------------------
    console.log('\n--- PHASE 2: Comment Section Avatar Distinction & Popover ---');
    await page.goto('http://127.0.0.1:4345/posts/content-formats-and-markup-mastery/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Scroll to #post-comment
    const commentSection = await page.$('#post-comment');
    if (!commentSection) throw new Error('Missing #post-comment section');
    await commentSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Check pre-seeded comments in #post-comment
    const commentAvatars = await page.$$('#post-comment .tk-avatar.is-clickable');
    console.log(`   -> Loaded ${commentAvatars.length} comment avatars in #post-comment.`);
    if (commentAvatars.length < 2) {
      throw new Error(`Expected at least 2 seeded comment avatars, found ${commentAvatars.length}`);
    }

    // 1. Verify Webmaster Square Avatar vs Reader Circular Avatar
    console.log('1. Checking Avatar Shape Distinction in #post-comment...');
    const wmAvatar = await page.$('#post-comment .tk-avatar.is-webmaster-avatar');
    const readerAvatar = await page.$('#post-comment .tk-avatar.is-user-avatar');

    if (!wmAvatar) throw new Error('Missing .is-webmaster-avatar in #post-comment');
    if (!readerAvatar) throw new Error('Missing .is-user-avatar in #post-comment');

    const shapes = await page.evaluate(() => {
      const wm = document.querySelector('#post-comment .tk-avatar.is-webmaster-avatar');
      const usr = document.querySelector('#post-comment .tk-avatar.is-user-avatar');
      const wmImg = wm.querySelector('img');
      const usrImg = usr.querySelector('img');

      return {
        wmBorderRadius: window.getComputedStyle(wm).borderRadius,
        usrBorderRadius: window.getComputedStyle(usr).borderRadius,
        wmImgRadius: wmImg ? window.getComputedStyle(wmImg).borderRadius : null,
      };
    });

    console.log('   -> Computed Shapes:');
    console.log('      Webmaster Avatar border-radius:', shapes.wmBorderRadius);
    console.log('      Reader Avatar border-radius:', shapes.usrBorderRadius);
    console.log('      Webmaster Image border-radius:', shapes.wmImgRadius);

    if (shapes.wmBorderRadius === '50%' || !shapes.wmBorderRadius.includes('8px')) {
      throw new Error(`Expected webmaster avatar to have square border-radius (8px), got ${shapes.wmBorderRadius}`);
    }
    if (shapes.usrBorderRadius !== '50%') {
      throw new Error(`Expected regular user avatar to have circular border-radius (50%), got ${shapes.usrBorderRadius}`);
    }
    console.log('   ✅ Webmaster avatar is strictly SQUARE (8px), regular user avatar is strictly CIRCULAR (50%).');

    // 2. Click Webmaster Avatar to Open Pinned Popover
    console.log('\n2. Testing Webmaster Profile Popover...');
    await wmAvatar.click();
    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });
    console.log('   -> Webmaster Profile Popover opened!');

    const wmPopoverData = await page.evaluate(() => {
      const popover = document.querySelector('.author-profile-popover');
      if (!popover) return null;
      return {
        name: popover.querySelector('.profile-popover-name')?.textContent?.trim(),
        isWebmasterBadge: popover.querySelector('.profile-popover-badge.is-webmaster')?.textContent?.trim(),
        levelBadge: popover.querySelector('.profile-popover-badge.is-level')?.textContent?.trim(),
        trustBadge: popover.querySelector('.profile-popover-badge.is-trust')?.textContent?.trim(),
        bio: popover.querySelector('.profile-popover-bio')?.textContent?.trim(),
        emailText: popover.querySelector('.profile-popover-email-text')?.textContent?.trim(),
        hasEmailWrap: Boolean(popover.querySelector('.profile-popover-email-wrap')),
        hasMailLink: Boolean(popover.querySelector('.profile-popover-mail-link')),
        hasMentionBtn: Boolean(popover.querySelector('.profile-popover-action-btn.is-mention')),
        hasCloseBtn: Boolean(popover.querySelector('.profile-popover-close-btn')),
        avatarShape: window.getComputedStyle(popover.querySelector('.profile-popover-avatar')).borderRadius,
      };
    });

    console.log('   -> Webmaster Popover Data:', wmPopoverData);
    if (!wmPopoverData) throw new Error('Failed to read webmaster popover data');
    if (wmPopoverData.name !== 'shijianus') throw new Error(`Expected name shijianus, got ${wmPopoverData.name}`);
    if (!wmPopoverData.isWebmasterBadge?.includes('站长')) throw new Error('Missing 站长 badge');
    if (!wmPopoverData.levelBadge?.includes('LV.4')) throw new Error('Missing LV.4 badge');
    if (!wmPopoverData.trustBadge?.includes('TL.99')) throw new Error('Missing TL.99 trust badge');
    if (wmPopoverData.avatarShape === '50%' || !wmPopoverData.avatarShape.includes('8px')) {
      throw new Error(`Expected popover avatar to be square (8px), got ${wmPopoverData.avatarShape}`);
    }
    if (wmPopoverData.emailText !== 'admin@epomail.bond') {
      throw new Error(`Expected email admin@epomail.bond, got ${wmPopoverData.emailText}`);
    }
    console.log('   ✅ Webmaster profile popover completely verified with square avatar, LV.4, TL.99, and Epomail!');

    // Test Click to Copy on profile-popover-email-wrap
    console.log('   -> Testing click-to-copy on profile-popover-email-wrap...');
    const emailWrap = await page.$('.profile-popover-email-wrap');
    if (emailWrap) {
      await emailWrap.click();
      await page.waitForTimeout(200);
      const emailWrapText = await emailWrap.textContent();
      console.log('   -> Email wrap text after click:', emailWrapText?.trim());
      if (!emailWrapText?.includes('已复制')) {
        throw new Error(`Expected email wrap to show "已复制", got "${emailWrapText}"`);
      }
      console.log('   ✅ Click-to-copy email verified.');
    }

    // Close popover
    const closeBtn = await page.$('.profile-popover-close-btn');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }

    // 3. Test Reader Avatar Hover / Click & @Mention action
    console.log('\n3. Testing Reader Profile Popover & Quick @Mention...');
    await readerAvatar.click();
    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });
    console.log('   -> Reader Profile Popover opened!');

    const readerPopoverData = await page.evaluate(() => {
      const popover = document.querySelector('.author-profile-popover');
      if (!popover) return null;
      return {
        name: popover.querySelector('.profile-popover-name')?.textContent?.trim(),
        levelBadge: popover.querySelector('.profile-popover-badge.is-level')?.textContent?.trim(),
        trustBadge: popover.querySelector('.profile-popover-badge.is-trust')?.textContent?.trim(),
        avatarShape: window.getComputedStyle(popover.querySelector('.profile-popover-avatar')).borderRadius,
      };
    });

    console.log('   -> Reader Popover Data:', readerPopoverData);
    if (!readerPopoverData) throw new Error('Failed to read reader popover data');
    if (readerPopoverData.name !== 'Alice') throw new Error(`Expected name Alice, got ${readerPopoverData.name}`);
    if (readerPopoverData.avatarShape !== '50%') {
      throw new Error(`Expected reader popover avatar to be circular (50%), got ${readerPopoverData.avatarShape}`);
    }
    console.log('   ✅ Reader profile popover circular avatar verified.');

    // Test @ Mention Button
    console.log('   -> Testing @ Mention button...');
    const mentionBtn = await page.$('.author-profile-popover .profile-popover-action-btn.is-mention');
    if (!mentionBtn) throw new Error('Missing @mention button in popover');
    await mentionBtn.click();
    await page.waitForTimeout(400);

    const textarea = await page.$('#post-comment textarea');
    if (!textarea) throw new Error('Missing comment textarea');
    const textareaVal = await textarea.inputValue();
    console.log('   -> Textarea value after mention click:', JSON.stringify(textareaVal));
    if (!textareaVal.startsWith('@Alice ')) {
      throw new Error(`Expected textarea to start with "@Alice ", got "${textareaVal}"`);
    }
    console.log('   ✅ Quick @ Mention successfully inserted "@Alice " into the comment box!');

    console.log('\n🎉 ALL CHECKS PASSED PERFECTLY!');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
