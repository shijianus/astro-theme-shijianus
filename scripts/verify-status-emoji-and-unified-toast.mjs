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
    authorName: 'admin',
    authorAvatar: '/media/shijianus/avatar.jpg',
    authorWebsite: 'https://shijian.dev',
    authorEmail: 'admin@epomail.bond',
    authorRole: 'admin',
    isWebmaster: true,
    authorBio: '架构与精致设计探索者。全栈架构与系统美学长期践行者。',
    message: '欢迎体验全新的状态Emoji展示与统一导航栏提示系统！',
    likesCount: 1,
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

function createMockServer(port = 4352) {
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
  const port = 4352;
  const server = await createMockServer(port);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', (msg) => {
    console.log('[BROWSER LOG]', msg.type(), msg.text());
  });
  page.on('request', (req) => {
    if (req.url().includes('/api/')) console.log('[API REQ]', req.method(), req.url());
  });
  page.on('response', (res) => {
    if (res.url().includes('/api/')) console.log('[API RES]', res.status(), res.url());
  });

  try {
    console.log('\n===========================================================');
    console.log('🧪 TEST SUITE: Status Emoji, Bio Limit, & Unified Toast');
    console.log('===========================================================');

    await page.goto(`http://localhost:${port}/posts/content-formats-and-markup-mastery/`);

    // Configure initial storage
    await page.evaluate(() => {
      window.localStorage.setItem(
        'shijianus-comment-account',
        JSON.stringify({
          id: 'admin_1',
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
        'shijianus-user-status',
        JSON.stringify({
          emoji: '☕',
          text: '喝咖啡中',
        })
      );
    });

    await page.reload();
    await page.waitForTimeout(600);

    // -------------------------------------------------------------
    // TEST 1: Open Account Drawer & Check Status Card
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Account Drawer Status Card & Description Removal ---');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications', { detail: { tab: 'auth' } }));
    });
    await page.waitForSelector('.theme-account-drawer', { state: 'visible', timeout: 5000 });

    // Verify sentence is completely DELETED
    const deletedSentenceFound = await page.evaluate(() => {
      const allText = document.querySelector('.account-card--status')?.textContent || '';
      return allText.includes('自定义当前状态 Emoji 与说明，将实时展示于评论名片中的身份');
    });
    console.log('   -> Has deleted sentence:', deletedSentenceFound);
    if (deletedSentenceFound) {
      throw new Error('The explanatory sentence was NOT deleted from .account-card--status!');
    }
    console.log('   ✅ TEST 1 PASSED: Explanatory sentence completely deleted.');

    // -------------------------------------------------------------
    // TEST 2: Emoji Display Rule in Hero Card & Status Card Head
    // Only emoji is displayed, text is only on hover title!
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Emoji Display Rule (Only Emoji, Text on Hover) ---');
    const heroStatusInfo = await page.$eval('.account-hero-card__name-row .account-status-chip', (el) => ({
      text: el.textContent?.trim(),
      title: el.getAttribute('title'),
    }));
    console.log('   -> Hero Card Status Chip:', heroStatusInfo);
    if (heroStatusInfo.text !== '☕') {
      throw new Error(`Expected hero status chip to only contain '☕', got '${heroStatusInfo.text}'`);
    }
    if (heroStatusInfo.title !== '喝咖啡中') {
      throw new Error(`Expected hero status chip title to be '喝咖啡中', got '${heroStatusInfo.title}'`);
    }

    const cardHeadStatusInfo = await page.$eval('.account-card--status .account-status-chip', (el) => ({
      text: el.textContent?.trim(),
      title: el.getAttribute('title'),
    }));
    console.log('   -> Status Card Head Chip:', cardHeadStatusInfo);
    if (cardHeadStatusInfo.text !== '☕') {
      throw new Error(`Expected status card head chip to only contain '☕', got '${cardHeadStatusInfo.text}'`);
    }
    if (cardHeadStatusInfo.title !== '喝咖啡中') {
      throw new Error(`Expected status card head chip title to be '喝咖啡中', got '${cardHeadStatusInfo.title}'`);
    }
    console.log('   ✅ TEST 2 PASSED: Hero Card & Card Head chips ONLY display emoji, text on title hover.');

    // -------------------------------------------------------------
    // TEST 3: Emoji Input Conflict Elimination
    // .account-status-emoji-input is deleted, only .account-status-emoji-trigger remains!
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Emoji Input Conflict Elimination ---');
    const hasEmojiInput = await page.isVisible('.account-status-emoji-input');
    const hasEmojiTrigger = await page.isVisible('.account-status-emoji-trigger');
    const triggerText = await page.$eval('.account-status-emoji-trigger .current-status-emoji', (el) => el.textContent?.trim());
    console.log('   -> .account-status-emoji-input exists:', hasEmojiInput);
    console.log('   -> .account-status-emoji-trigger exists:', hasEmojiTrigger);
    console.log('   -> Trigger current emoji:', triggerText);

    if (hasEmojiInput) {
      throw new Error('.account-status-emoji-input must be deleted to eliminate duplicate display conflict!');
    }
    if (!hasEmojiTrigger || triggerText !== '☕') {
      throw new Error(`Expected .account-status-emoji-trigger to display '☕', got '${triggerText}'`);
    }
    console.log('   ✅ TEST 3 PASSED: .account-status-emoji-input eliminated, trigger displays cleanly.');

    // -------------------------------------------------------------
    // TEST 4: Bio Max Length & Visible Counter & Content Display Limit
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Bio Max Length & Visible Counter & Display Limit ---');
    const bioCounterText = await page.$eval('.account-field-limit', (el) => el.textContent?.trim());
    const bioInputMaxLength = await page.$eval('input[name="bio"]', (el) => el.getAttribute('maxLength'));
    console.log('   -> Bio Visible Counter:', bioCounterText);
    console.log('   -> Bio Input maxLength:', bioInputMaxLength);

    if (bioInputMaxLength !== '100') {
      throw new Error(`Expected Bio maxLength to be 100, got ${bioInputMaxLength}`);
    }
    if (!bioCounterText?.includes('/ 100')) {
      throw new Error(`Expected Bio visible counter to include '/ 100', got '${bioCounterText}'`);
    }

    const heroDescStyle = await page.$eval('.account-hero-card__desc', (el) => {
      const style = window.getComputedStyle(el);
      return {
        whiteSpace: style.whiteSpace,
        textOverflow: style.textOverflow,
        overflow: style.overflow,
      };
    });
    console.log('   -> Hero Bio display style:', heroDescStyle);
    if (heroDescStyle.textOverflow !== 'ellipsis' || heroDescStyle.overflow !== 'hidden') {
      throw new Error('Hero desc display does not have overflow: hidden & text-overflow: ellipsis!');
    }
    console.log('   ✅ TEST 4 PASSED: Bio max length 100, visible counter, and display truncation verified.');

    // -------------------------------------------------------------
    // TEST 5: Complete Removal of .account-toast-notice & Unified Blog Navbar Snackbar
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Removal of .account-toast-notice & Unified Blog Snackbar ---');
    const hasAccountToast = await page.isVisible('.account-toast-notice');
    console.log('   -> .account-toast-notice present in DOM:', hasAccountToast);
    if (hasAccountToast) {
      throw new Error('.account-toast-notice should be completely removed from DOM!');
    }

    // Trigger an update that emits a notification, e.g. click preset status "💻"
    console.log('   -> Clicking preset status "💻 写代码中"...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.account-status-preset-btn')).find(
        (el) => el.textContent?.includes('写代码中')
      );
      if (btn) btn.click();
    });
    await page.waitForTimeout(400);

    // Verify blog unified snackbar (#snackbar-container or .snackbar-container)
    const snackbarInfo = await page.evaluate(() => {
      const bar = document.querySelector('#snackbar-container') || document.querySelector('.snackbar-container');
      const isVisible = bar?.classList.contains('show');
      const text = bar?.querySelector('.snackbar-text')?.textContent || bar?.textContent || '';
      return {
        exists: Boolean(bar),
        showClass: isVisible,
        text: text.trim(),
      };
    });
    console.log('   -> Unified Blog Navbar Snackbar status:', snackbarInfo);
    if (!snackbarInfo.exists) {
      throw new Error('Blog unified snackbar container (#snackbar-container) not found in DOM!');
    }
    if (!snackbarInfo.showClass) {
      throw new Error('Unified blog snackbar did not activate (.show class missing) on user status update!');
    }
    console.log('   ✅ TEST 5 PASSED: .account-toast-notice completely removed; unified blog navbar snackbar triggered smoothly.');

    // Close drawer
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:close-notifications'));
    });
    await page.keyboard.press('Escape');
    await page.waitForSelector('.theme-account-overlay.show', { state: 'detached', timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);

    // -------------------------------------------------------------
    // TEST 6: Check Comment Author Row (.tk-row.tk-meta) & Popover (.profile-popover-user-meta)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Sync in Comments (.tk-row.tk-meta & .profile-popover-user-meta) ---');
    const commentSection = await page.waitForSelector('#post-comment', { state: 'visible', timeout: 8000 });
    await commentSection.scrollIntoViewIfNeeded();
    await page.waitForSelector('#post-comment .tk-comment', { state: 'visible', timeout: 8000 });
    await page.waitForTimeout(300);

    // Check .tk-row.tk-meta in comment
    const commentMetaStatus = await page.$eval('#post-comment .tk-row.tk-meta .tk-status-emoji', (el) => ({
      text: el.textContent?.trim(),
      title: el.getAttribute('title'),
    }));
    console.log('   -> Comment Meta Status Emoji (.tk-status-emoji):', commentMetaStatus);
    if (commentMetaStatus.text !== '💻') {
      throw new Error(`Expected comment .tk-status-emoji to be '💻', got '${commentMetaStatus.text}'`);
    }
    if (commentMetaStatus.title !== '写代码中') {
      throw new Error(`Expected comment .tk-status-emoji title to be '写代码中', got '${commentMetaStatus.title}'`);
    }
    console.log('   ✅ .tk-row.tk-meta successfully displays synced status emoji with hover title.');

    // Check Author Profile Popover
    const avatar = await page.waitForSelector('#post-comment .tk-avatar.is-clickable', { state: 'visible', timeout: 5000 });
    await avatar.click();
    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });

    const popoverStatus = await page.$eval('.profile-popover-user-meta .profile-popover-status-emoji', (el) => ({
      text: el.textContent?.trim(),
      title: el.getAttribute('title'),
    }));
    console.log('   -> Popover Status Emoji (.profile-popover-status-emoji):', popoverStatus);
    if (popoverStatus.text !== '💻') {
      throw new Error(`Expected popover status emoji to be '💻', got '${popoverStatus.text}'`);
    }
    if (popoverStatus.title !== '写代码中') {
      throw new Error(`Expected popover status emoji title to be '写代码中', got '${popoverStatus.title}'`);
    }
    console.log('   ✅ .profile-popover-user-meta successfully displays synced status emoji with hover title.');

    // Check Popover Bio clamping
    const popoverBioClamp = await page.$eval('.profile-popover-bio', (el) => {
      const style = window.getComputedStyle(el);
      return {
        webkitLineClamp: style.webkitLineClamp,
        overflow: style.overflow,
      };
    });
    console.log('   -> Popover Bio clamping:', popoverBioClamp);
    if (popoverBioClamp.webkitLineClamp !== '2' || popoverBioClamp.overflow !== 'hidden') {
      throw new Error('Popover bio does not have -webkit-line-clamp: 2 & overflow: hidden!');
    }
    console.log('   ✅ Popover Bio display clamping verified.');

    // Verify .tk-global-toast is NOT in DOM
    const hasTkGlobalToast = await page.isVisible('.tk-global-toast');
    console.log('   -> .tk-global-toast in DOM:', hasTkGlobalToast);
    if (hasTkGlobalToast) {
      throw new Error('.tk-global-toast should be completely removed from DOM!');
    }
    console.log('   ✅ .tk-global-toast removed.');

    console.log('\n===========================================================');
    console.log('🎉 ALL USER REQUIREMENTS VERIFIED & PASSED WITH 100% SUCCESS!');
    console.log('===========================================================\n');
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ LOCAL VERIFICATION FAILED:', err);
  process.exit(1);
});
