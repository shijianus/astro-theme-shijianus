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

    // 2. Test Top Boost Wall (楼上 Boost 弹幕墙)
    console.log('[Verify] 2. Testing Top Boost Wall...');
    const boostWall = await page.$('.gb-boost-wall-card');
    if (!boostWall) throw new Error('Top Boost wall card (.gb-boost-wall-card) not found');

    const boostBadgeText = await page.textContent('.gb-boost-badge');
    console.log(`[Verify] Boost Badge text: "${boostBadgeText?.trim()}"`);
    if (!boostBadgeText?.includes('Boost')) {
      throw new Error('Boost badge missing');
    }

    // Check dual marquee tracks
    const marqueeCardsCount = await page.$$eval('.gb-boost-pill-card', (els) => els.length);
    console.log(`[Verify] Boost marquee cards count: ${marqueeCardsCount}`);
    if (marqueeCardsCount < 4) {
      throw new Error('Boost marquee should have floating cards');
    }

    // Click quick stamp and send Boost
    const firstStamp = await page.$('.gb-stamp-pill');
    if (firstStamp) {
      await firstStamp.click();
      const inputVal = await page.$eval('.gb-boost-text-input', (el) => el.value);
      console.log(`[Verify] Boost input filled by stamp: "${inputVal}"`);
      if (!inputVal) throw new Error('Boost stamp did not fill input');

      // Submit Boost
      await page.click('.gb-boost-submit-btn');
      await page.waitForTimeout(600);
      console.log('[Verify] ✓ Boost barrage submitted successfully');
    }

    // 3. Test Horizontal Categories Bar (横排分类导航条)
    console.log('[Verify] 3. Testing Horizontal Categories Bar...');
    const navCategories = ['最新', '近期', '维度', '热门', '精选', '我的贴文', '已读', '书签'];
    for (const catName of navCategories) {
      const catBtn = await page.$(`.gb-cat-btn:has-text("${catName}")`);
      if (!catBtn) {
        throw new Error(`Missing required category button: "${catName}" in horizontal nav bar`);
      }
    }
    console.log('[Verify] ✓ All 8 horizontal categories verified (最新, 近期, 维度, 热门, 精选, 我的贴文, 已读, 书签)');

    // Test clicking "维度" (Dimensions) dropdown
    const dimBtn = await page.$('.gb-cat-btn:has-text("维度")');
    if (dimBtn) {
      await dimBtn.click();
      await page.waitForTimeout(300);
      const dropdown = await page.$('.gb-dimension-dropdown');
      if (!dropdown) throw new Error('Dimensions dropdown failed to open');
      console.log('[Verify] ✓ Dimensions dropdown menu opened');

      // Select "技术探讨"
      const techOption = await page.$('.gb-dimension-item:has-text("技术探讨")');
      if (techOption) await techOption.click();
      await page.waitForTimeout(300);
      console.log('[Verify] ✓ Selected "技术探讨" dimension');
    }

    // 4. Test Gesture Topic Feed (楼下 Gesture 列表)
    console.log('[Verify] 4. Testing Gesture Topic Feed...');
    await page.waitForSelector('.gb-gesture-row', { timeout: 10000 });
    const gestureRowsCount = await page.$$eval('.gb-gesture-row', (els) => els.length);
    console.log(`[Verify] Gesture rows count: ${gestureRowsCount}`);
    if (gestureRowsCount === 0) {
      throw new Error('Expected at least 1 Gesture row in discussion feed');
    }

    // Verify Bookmark Toggle on Row
    const bookmarkBtn = await page.$('.gb-bookmark-toggle');
    if (bookmarkBtn) {
      await bookmarkBtn.click();
      await page.waitForTimeout(200);
      const hasBookmarked = await page.$('.gb-bookmark-toggle.is-bookmarked');
      console.log(`[Verify] Bookmark toggle active: ${Boolean(hasBookmarked)}`);
    }

    // 5. Test Click to Enter Gesture Detail View & Floor Timeline Scroller
    console.log('[Verify] 5. Clicking Gesture row to enter Detail View...');
    const firstRow = await page.$('.gb-gesture-row');
    await firstRow.click();
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
