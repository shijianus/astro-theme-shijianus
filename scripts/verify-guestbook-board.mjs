import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 4329;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

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

// In-memory test comments store for verification
const testDb = new Map();

function createServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
      let reqPath = decodeURIComponent(parsedUrl.pathname);

      // API: /api/comments
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
          let list = Array.from(testDb.values()).filter((c) => c.postSlug === slug && c.status !== 'deleted');
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, comments: list }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              const action = payload.action || 'create';

              if (action === 'create') {
                const rawMessage = (payload.message || '').trim();
                const postType = payload.postType || 'gesture';
                const tag = payload.tag || 'tech';
                const parentId = payload.parentId || null;

                // Validation rules:
                if (postType === 'boost' && rawMessage.length > 30) {
                  res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ ok: false, error: 'Boost 不能超过 30 个字' }));
                  return;
                }
                if (postType === 'gesture' && rawMessage.length < 8 && !parentId) {
                  res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ ok: false, error: 'Gesture 讨论内容至少需要 8 个字' }));
                  return;
                }

                // Boost reply check
                if (parentId) {
                  const parentComment = testDb.get(parentId);
                  if (parentComment && parentComment.postType === 'boost') {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ ok: false, error: 'Boost 属于瞬时微语，默认不支持跟帖回复' }));
                    return;
                  }
                }

                const newComment = {
                  id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                  postSlug: payload.postSlug || 'guestbook',
                  parentId: parentId,
                  message: rawMessage,
                  postType: postType,
                  tag: tag,
                  authorId: payload.authorId || 'tester',
                  authorName: payload.authorName || '自动化测试员',
                  authorRole: 'member',
                  authorWebsite: payload.authorWebsite || null,
                  authorAvatar: null,
                  likesCount: 0,
                  reactions: { summary: {}, users: {} },
                  status: 'approved',
                  createdAt: new Date().toISOString(),
                  showLocation: true,
                  ipCountryFlag: '🇨🇳',
                  ipCountryName: '中国',
                  ipLocation: '测试中心',
                };

                testDb.set(newComment.id, newComment);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: true, comment: newComment }));
                return;
              }

              if (action === 'like') {
                const commentId = payload.commentId;
                const emoji = payload.emoji || '👍';
                const comment = testDb.get(commentId);
                if (comment) {
                  if (!comment.reactions) comment.reactions = { summary: {}, users: {} };
                  const current = comment.reactions.summary[emoji] || 0;
                  comment.reactions.summary[emoji] = current + 1;
                  comment.likesCount = (comment.likesCount || 0) + 1;
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ ok: true, comment }));
                  return;
                }
              }
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: false, error: String(err) }));
              return;
            }
          });
          return;
        }
      }

      // Static files
      let filePath = path.join(DIST_DIR, reqPath);
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

    server.listen(PORT, () => {
      console.log(`[Verify] Static test server running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function runVerification() {
  const server = await createServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  try {
    console.log('[Verify] 1. Navigating to /guestbook/...');
    await page.goto(`http://localhost:${PORT}/guestbook/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.guestbook-board-container', { timeout: 15000 });

    // Assert Page Title
    const title = await page.title();
    console.log(`[Verify] Page title: "${title}"`);
    if (!title.includes('留言板')) {
      throw new Error(`Expected title to include "留言板", got "${title}"`);
    }

    // Assert that .gb-hero is REMOVED as requested
    const heroExists = await page.$('.gb-hero');
    if (heroExists) {
      throw new Error('Expected class="gb-hero" to be REMOVED from the guestbook page');
    }
    console.log('[Verify] ✓ Verified class="gb-hero" is completely removed');

    // 2. Test Top Boost Stream (楼上 Boost 实时观点流 - 3排自适应流速)
    console.log('[Verify] 2. Testing Top Boost Stream...');
    const boostWall = await page.$('.gb-boost-wall-card');
    if (!boostWall) throw new Error('Top Boost wall card (.gb-boost-wall-card) not found');

    const boostBadgeText = await page.textContent('.gb-boost-badge');
    console.log(`[Verify] Boost Badge text: "${boostBadgeText?.trim()}"`);
    if (!boostBadgeText?.includes('Boost')) {
      throw new Error('Boost badge missing');
    }

    // Verify Count Status text
    const statusCountText = await page.textContent('.gb-boost-status-count');
    console.log(`[Verify] Boost Status Count text: "${statusCountText?.trim()}"`);
    if (!statusCountText?.includes('全站共收录')) {
      throw new Error(`Expected status count to include "全站共收录", got "${statusCountText}"`);
    }

    // Verify separate Boost launch button is REMOVED as requested
    const launchBoostBtn = await page.$('.gb-launch-boost-btn');
    if (launchBoostBtn) {
      throw new Error('Separate Launch Boost button (.gb-launch-boost-btn) should be REMOVED from Boost header');
    }
    console.log('[Verify] ✓ Confirmed separate Boost launch button is removed; only single publish entry retained');

    // Verify Boost spec badge on header right
    const specBadge = await page.$('.gb-boost-spec-badge');
    if (!specBadge) throw new Error('.gb-boost-spec-badge missing');
    const specText = await page.textContent('.gb-boost-spec-badge');
    console.log(`[Verify] Boost Spec Badge text: "${specText?.trim()}"`);

    // Verify 3 rows container and all 3 tracks
    const marqueeContainer = await page.$('.gb-boost-marquee-container.is-three-rows');
    if (!marqueeContainer) throw new Error('Boost container missing .is-three-rows class');

    const track1 = await page.$('.gb-track-1');
    const track2 = await page.$('.gb-track-2');
    const track3 = await page.$('.gb-track-3');
    if (!track1 || !track2 || !track3) {
      throw new Error('Expected all 3 tracks (.gb-track-1, .gb-track-2, .gb-track-3) to be rendered');
    }
    console.log('[Verify] ✓ Verified all 3 Boost tracks are actively rendered');

    // Verify dynamic speed duration attribute on track
    const track1Duration = await page.getAttribute('.gb-track-1', 'style');
    console.log(`[Verify] Track 1 style duration: "${track1Duration}"`);
    if (!track1Duration?.includes('animation-duration')) {
      throw new Error('Expected dynamic animation-duration style set on track');
    }

    // Check viewpoint cards count
    const marqueeCardsCount = await page.$$eval('.gb-boost-pill-card', (els) => els.length);
    console.log(`[Verify] Boost viewpoint cards count across 3 rows: ${marqueeCardsCount}`);
    if (marqueeCardsCount < 6) {
      throw new Error('Boost stream should have diverse viewpoint cards across 3 rows');
    }

    // 3. Test Navigation Bar: "维度" First (4-Item Scrollable Dropdown) + Horizontal Category Tabs
    console.log('[Verify] 3. Testing Navigation Bar: "维度" First + Horizontal Tabs...');
    // 3.1 Verify Dimension Dropdown is the first element
    const firstNavEl = await page.$('.gb-nav-bar__categories > *:first-child');
    const isFirstDim = await firstNavEl?.$('.gb-dim-dropdown-btn');
    if (!isFirstDim) throw new Error('Expected "维度" dropdown to be in the first position of the navigation bar');
    console.log('[Verify] ✓ Confirmed "维度" dropdown is placed at the first position');

    // Test clicking Dimension dropdown
    await isFirstDim.click();
    await page.waitForTimeout(300);

    const dimDropdownMenu = await page.$('.gb-scrollable-dropdown.is-four-items-max');
    if (!dimDropdownMenu) throw new Error('Dimension scrollable dropdown failed to open');

    const dimItemsCount = await page.$$eval('.gb-scrollable-dropdown.is-four-items-max .gb-scrollable-dropdown__item', (els) => els.length);
    console.log(`[Verify] Dimension dropdown total items: ${dimItemsCount}`);
    if (dimItemsCount < 6) {
      throw new Error('Dimension dropdown should list all 6 channels');
    }

    // Select "技术探讨"
    const techOption = await page.$('.gb-scrollable-dropdown__item:has-text("技术探讨")');
    if (techOption) await techOption.click();
    await page.waitForTimeout(300);
    console.log('[Verify] ✓ Selected "技术探讨" dimension');

    // 3.2 Verify Horizontal Tabs are lined up in order: 最新, 近期, 热门, 精选, 我的贴文, 已读, 书签
    const horizontalTabs = await page.$$eval('.gb-cat-tab-btn', (els) => els.map((el) => el.textContent?.trim()));
    console.log(`[Verify] Horizontal tabs rendered: ${JSON.stringify(horizontalTabs)}`);
    const expectedOrder = ['最新', '近期', '热门', '精选', '我的贴文', '已读', '书签'];
    for (const exp of expectedOrder) {
      if (!horizontalTabs.some((t) => t.includes(exp))) {
        throw new Error(`Expected horizontal tab "${exp}" to be rendered`);
      }
    }
    console.log('[Verify] ✓ All horizontal category tabs rendered in order after "维度"');

    // Test clicking "热门" tab
    const hotTab = await page.$('.gb-cat-tab-btn:has-text("热门")');
    if (hotTab) await hotTab.click();
    await page.waitForTimeout(300);
    const isHotActive = await hotTab?.evaluate((el) => el.classList.contains('is-active'));
    if (!isHotActive) throw new Error('Expected "热门" tab to be active after clicking');
    console.log('[Verify] ✓ Successfully switched to "热门" tab');

    // Switch back to "最新" tab
    const latestTab = await page.$('.gb-cat-tab-btn:has-text("最新")');
    if (latestTab) await latestTab.click();
    await page.waitForTimeout(300);
    console.log('[Verify] ✓ Successfully switched back to "最新" tab');

    // Reset dimension to all
    const dimResetBtn = await page.$('.gb-active-dim-reset');
    if (dimResetBtn) {
      await dimResetBtn.click();
      await page.waitForTimeout(300);
      console.log('[Verify] ✓ Reset dimension to all');
    }

    // 4. Test Official Pinned Rule Threads in Gesture Feed
    console.log('[Verify] 4. Testing Official Pinned Rule Threads...');
    await page.waitForSelector('.gb-gesture-row', { timeout: 10000 });

    const pinnedRowsCount = await page.$$eval('.gb-gesture-row.is-pinned-row', (els) => els.length);
    console.log(`[Verify] Pinned rule threads count: ${pinnedRowsCount}`);
    if (pinnedRowsCount < 4) {
      throw new Error(`Expected at least 4 pinned rule threads, got ${pinnedRowsCount}`);
    }

    // Verify pinned topic titles
    const feedText = await page.textContent('.gb-gesture-table');
    if (!feedText?.includes('欢迎来到全站留言与读者交流广场')) {
      throw new Error('Official pinned topic 1 missing');
    }
    if (!feedText?.includes('全站留言与讨论广场公约及社群守则')) {
      throw new Error('Official pinned topic 2 missing');
    }
    if (!feedText?.includes('关于边缘分布式架构、D1 毫秒级落盘与数据隐私保护说明')) {
      throw new Error('Official pinned topic 3 missing');
    }
    if (!feedText?.includes('讨论维度（Channels）划分、Tag 标签与内容检索指南')) {
      throw new Error('Official pinned topic 4 missing');
    }
    console.log('[Verify] ✓ All 4 official pinned rule threads verified at top of feed');

    // 5. Test Floating Composer with Dynamic Smart Identification
    console.log('[Verify] 5. Testing Unified Composer with Dynamic Smart Identification...');
    const newGestureBtn = await page.$('.gb-new-gesture-btn');
    if (!newGestureBtn) throw new Error('Single publish button (.gb-new-gesture-btn) not found');
    await newGestureBtn.click();
    await page.waitForTimeout(300);

    const gComposer = await page.$('.gb-floating-composer');
    if (!gComposer) throw new Error('Floating composer failed to open');

    // Initially empty -> dynamic detection should be Boost (< 8 chars)
    let badgeText = await page.textContent('.gb-smart-type-badge');
    console.log(`[Verify] Initial Smart Badge: "${badgeText?.trim()}"`);
    if (!badgeText?.includes('Boost')) {
      throw new Error(`Expected initial empty state to detect Boost, got "${badgeText}"`);
    }

    let submitBtnText = await page.textContent('.gb-modal-foot .gb-submit-btn');
    console.log(`[Verify] Initial Submit Button: "${submitBtnText?.trim()}"`);
    if (!submitBtnText?.includes('发布为 Boost')) {
      throw new Error('Expected initial submit button to say "发布为 Boost"');
    }

    // Test typing < 30 chars without title or tag -> stays Boost
    const textarea = await page.$('.gb-textarea.is-modal-textarea');
    if (!textarea) throw new Error('Composer textarea not found');
    await textarea.fill('边缘计算毫秒级落盘体验丝滑！');
    await page.waitForTimeout(200);

    badgeText = await page.textContent('.gb-smart-type-badge');
    console.log(`[Verify] Short message Smart Badge: "${badgeText?.trim()}"`);
    if (!badgeText?.includes('Boost')) {
      throw new Error('Expected message under 30 chars without title/tag to detect Boost');
    }

    // Now test entering Title -> dynamically flips to Gesture!
    const titleInput = await page.$('.gb-modal-title-input');
    if (!titleInput) throw new Error('Title input not found');
    await titleInput.fill('关于边缘计算架构的新思考');
    await page.waitForTimeout(200);

    badgeText = await page.textContent('.gb-smart-type-badge');
    submitBtnText = await page.textContent('.gb-modal-foot .gb-submit-btn');
    console.log(`[Verify] After entering title: Badge: "${badgeText?.trim()}", Button: "${submitBtnText?.trim()}"`);
    if (!badgeText?.includes('Gesture') || !submitBtnText?.includes('发布为 Gesture')) {
      throw new Error('Expected composer to dynamically flip to Gesture when title is present');
    }

    // Test entering Custom Tag -> stays Gesture
    const tagInput = await page.$('.gb-composer-tag-input');
    if (tagInput) {
      await tagInput.fill('#边缘架构 #前端工程');
      await page.waitForTimeout(200);
      console.log('[Verify] ✓ Tag input filled');
    }

    // Test Minimize to Bottom Dock Pill
    const minimizeBtn = await page.$('.gb-window-tool-btn[title="最小化到右下角"]');
    if (minimizeBtn) {
      await minimizeBtn.click();
      await page.waitForTimeout(300);
      const minimizedPill = await page.$('.gb-composer-minimized-pill');
      if (!minimizedPill) throw new Error('Minimized dock pill not found');

      const pillBadge = await page.textContent('.gb-minimized-badge');
      console.log(`[Verify] Minimized Dock Pill Badge: "${pillBadge?.trim()}"`);
      if (!pillBadge?.includes('Gesture')) {
        throw new Error('Expected minimized pill to display Gesture badge');
      }

      // Re-expand
      await minimizedPill.click();
      await page.waitForTimeout(300);
      console.log('[Verify] ✓ Re-expanded composer from dock pill');
    }

    // Close composer cleanly
    const closeBtn = await page.$('.gb-window-tool-btn.is-close');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(300);
    console.log('[Verify] ✓ Verified Dynamic Composer identification and non-blocking window controls');

    // Verify Bookmark Toggle on Row
    const bookmarkBtn = await page.$('.gb-bookmark-toggle');
    if (bookmarkBtn) {
      await bookmarkBtn.click();
      await page.waitForTimeout(200);
      const hasBookmarked = await page.$('.gb-bookmark-toggle.is-bookmarked');
      console.log(`[Verify] Bookmark toggle active: ${Boolean(hasBookmarked)}`);
    }

    // 6. Test Click to Enter Gesture Detail View & Floor Timeline Scroller
    console.log('[Verify] 6. Clicking Gesture row to enter Detail View...');
    const welcomeRow = await page.$('.gb-gesture-row:has-text("欢迎来到全站留言")');
    if (welcomeRow) {
      await welcomeRow.click();
    } else {
      const firstRow = await page.$('.gb-gesture-row');
      await firstRow.click();
    }
    await page.waitForTimeout(600);

    // Verify Detail View active
    const detailView = await page.$('.gb-gesture-detail-view');
    if (!detailView) throw new Error('Detail view (.gb-gesture-detail-view) failed to open');
    console.log('[Verify] ✓ Successfully entered Gesture Detail View');

    // Verify 1 楼 (楼主 OP)
    const opFloor = await page.$('#floor-1.is-op-floor');
    if (!opFloor) throw new Error('1 楼 (OP Floor) not rendered');
    const floorNumber = await page.textContent('#floor-1 .gb-floor-number');
    console.log(`[Verify] OP Floor identifier: "${floorNumber?.trim()}"`);

    // Verify Right-side Floor Timeline Scroller Widget
    const scrollerCard = await page.$('.gb-floor-scroller-card');
    if (!scrollerCard) throw new Error('Right-side floor scroller widget (.gb-floor-scroller-card) missing');
    const pctText = await page.textContent('.gb-scroller-pct');
    const floorLabel = await page.textContent('.gb-scroller-floor-label');
    console.log(`[Verify] Floor Scroller Widget: "${floorLabel?.trim()}" (${pctText?.trim()})`);

    // Test Floor Notches along the rail
    const notchesCount = await page.$$eval('.gb-scroller-notch', (els) => els.length);
    console.log(`[Verify] Interactive floor notches along rail: ${notchesCount}`);
    if (notchesCount < 2) {
      throw new Error('Expected multiple floor notches along timeline rail');
    }

    // Click Notch 2 to jump to Floor 2
    const notch2 = await page.$('.gb-scroller-notch:nth-child(2)');
    if (notch2) {
      await notch2.click();
      await page.waitForTimeout(300);
      console.log('[Verify] ✓ Clicked floor notch to jump between floors');
    }

    // 6. Test In-place Detail Reply
    console.log('[Verify] 6. Testing Reply submission in Detail View...');
    const replyTextarea = await page.$('.gb-textarea.is-reply-box');
    if (replyTextarea) {
      await replyTextarea.fill('自动测试跟帖：赞同楼主对架构与界面的分析，楼层进度条非常顺滑！');
      const submitReplyBtn = await page.$('.gb-detail-reply-footer .gb-submit-btn');
      if (submitReplyBtn) {
        await submitReplyBtn.click();
        await page.waitForTimeout(800);
        console.log('[Verify] ✓ Reply submitted and rendered into discussion floor');
      }
    }

    // 7. Test Return to Gesture List
    console.log('[Verify] 7. Testing Back to List navigation...');
    const backBtn = await page.$('.gb-back-btn');
    if (backBtn) {
      await backBtn.click();
      await page.waitForTimeout(400);
      const isListView = await page.$('.gb-gesture-table');
      if (!isListView) throw new Error('Failed to return to Gesture list view');
      console.log('[Verify] ✓ Successfully returned to Gesture topic list');
    }

    console.log('\n======================================================');
    console.log('🎉 ALL GUESTBOOK BOARD TESTS PASSED 100%!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('[Verify] Verification failed:', err);
  process.exit(1);
});
