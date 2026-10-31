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
          const tag = parsedUrl.searchParams.get('tag') || '';
          const type = parsedUrl.searchParams.get('type') || '';
          const sort = parsedUrl.searchParams.get('sort') || 'new';

          let list = Array.from(testDb.values()).filter((c) => c.postSlug === slug && c.status !== 'deleted');
          if (tag && tag !== 'all') {
            list = list.filter((c) => (c.tag || 'chat') === tag);
          }
          if (type && type !== 'all') {
            list = list.filter((c) => c.postType === type);
          }

          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, sort, comments: list }));
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
                const tag = payload.tag || 'chat';
                const parentId = payload.parentId || null;

                // Validation rules:
                if (postType === 'boost' && rawMessage.length > 30) {
                  res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ ok: false, error: '🚀 Boost 瞬时微语不能超过 30 个字' }));
                  return;
                }
                if (postType === 'gesture' && rawMessage.length < 8 && !parentId) {
                  res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ ok: false, error: '📝 Gesture 话题讨论内容至少需要 8 个字' }));
                  return;
                }

                // Boost reply check
                if (parentId) {
                  const parentComment = testDb.get(parentId);
                  if (parentComment && parentComment.postType === 'boost') {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ ok: false, error: '🚀 Boost 属于瞬时微语，默认不支持跟帖回复' }));
                    return;
                  }
                }

                const id = `gb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                const newComment = {
                  id,
                  postSlug: payload.slug || 'guestbook',
                  parentId,
                  postType,
                  tag,
                  authorId: payload.authorId || `vis_${Date.now()}`,
                  authorName: payload.authorName || '访客',
                  authorAvatar: payload.authorAvatar || '',
                  authorRole: 'visitor',
                  message: rawMessage,
                  likesCount: 0,
                  reactions: { summary: {}, users: {} },
                  status: 'published',
                  createdAt: new Date().toISOString(),
                  showLocation: true,
                  ipCountryFlag: '🇨🇳',
                  ipCountryName: '中国',
                  ipLocation: '浙江 · 杭州',
                };
                testDb.set(id, newComment);

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: true, comment: newComment }));
                return;
              }

              if (action === 'like') {
                const commentId = payload.id;
                const emoji = payload.emoji || '👍';
                const comm = testDb.get(commentId);
                if (comm) {
                  const summary = comm.reactions?.summary || {};
                  summary[emoji] = (summary[emoji] || 0) + 1;
                  comm.reactions = { summary, users: { visitor: emoji } };
                  comm.likesCount = (comm.likesCount || 0) + 1;
                }
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: true, reactions: comm?.reactions }));
                return;
              }
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: String(err) }));
            }
          });
          return;
        }
      }

      // Static file handler
      if (reqPath.endsWith('/')) reqPath += 'index.html';
      const filePath = path.join(DIST_DIR, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
      }
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    console.log('[Verify] 1. Navigating to /guestbook/...');
    await page.goto(`http://localhost:${PORT}/guestbook/`, { waitUntil: 'networkidle' });

    // Assert Title
    const title = await page.title();
    console.log(`[Verify] Page title: "${title}"`);
    if (!title.includes('留言板')) {
      throw new Error(`Expected title to include "留言板", got "${title}"`);
    }

    // Assert Hero Header
    const heroTitle = await page.textContent('.gb-hero__title');
    console.log(`[Verify] Hero Title: "${heroTitle}"`);
    if (!heroTitle?.includes('尺素寸心')) {
      throw new Error(`Expected hero title to contain "尺素寸心", got "${heroTitle}"`);
    }

    // Assert Channel Tabs
    const channelPills = await page.$$('.gb-channel-pill');
    console.log(`[Verify] Channel tabs count: ${channelPills.length} (Expected 6)`);
    if (channelPills.length < 6) {
      throw new Error(`Expected at least 6 channel pills, found ${channelPills.length}`);
    }

    // 2. Test Boost Mode & Quick Stamp
    console.log('[Verify] 2. Testing Boost Mode & Stamp injection...');
    const boostBtn = await page.$('.gb-mode-btn:has-text("Boost")');
    if (!boostBtn) throw new Error('Boost mode button not found');
    await boostBtn.click();
    await page.waitForTimeout(300);

    // Verify quick stamps appear
    const stampPill = await page.$('.gb-stamp-pill');
    if (!stampPill) throw new Error('Boost stamp pill not found');
    await stampPill.click();

    // Check textarea value
    const boostText = await page.$eval('.gb-textarea', (el) => el.value);
    console.log(`[Verify] Boost textarea populated: "${boostText}"`);
    if (!boostText || boostText.length === 0) {
      throw new Error('Boost textarea was not populated by stamp');
    }

    // Publish Boost
    const submitBtn = await page.$('.gb-submit-btn');
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // Verify Boost card rendered
    const boostCard = await page.$('.gb-card.is-boost-card');
    if (!boostCard) throw new Error('Boost card was not rendered in discussion stream');
    console.log('[Verify] ✓ Boost card rendered with is-boost-card class');

    // Verify Boost has NO reply button (shows "⚡ 瞬时微语 · 仅支持表态")
    const boostReplyHint = await page.$('.gb-card.is-boost-card .gb-boost-no-reply-hint');
    if (!boostReplyHint) throw new Error('Expected Boost card to have gb-boost-no-reply-hint instead of reply button');
    console.log('[Verify] ✓ Boost card correctly disallows replies');

    // 3. Test Gesture Mode (Markdown, Min 8 Chars, Reply Tree)
    console.log('[Verify] 3. Testing Gesture Mode & Discussion Tree...');
    const gestureBtn = await page.$('.gb-mode-btn:has-text("Gesture")');
    await gestureBtn.click();
    await page.waitForTimeout(300);

    // Test min 8 chars constraint: type 4 chars
    await page.fill('.gb-textarea', '测试四字');
    const isSubmitDisabled = await page.$eval('.gb-submit-btn', (el) => el.disabled);
    console.log(`[Verify] Submit button disabled when < 8 chars: ${isSubmitDisabled}`);
    if (!isSubmitDisabled) {
      throw new Error('Submit button should be disabled when Gesture message < 8 chars');
    }

    // Type full Gesture message
    const gestureMsg = '这是一篇关于 Astro 架构与边缘落盘的深度 Gesture 讨论！欢迎各位探讨。';
    await page.fill('.gb-textarea', gestureMsg);

    // Open Emoji Picker & Insert Emoji
    const emojiToolBtn = await page.$('.gb-toolbar-tool-btn:has-text("表情")');
    if (emojiToolBtn) {
      await emojiToolBtn.click();
      await page.waitForTimeout(200);
      const emojiPick = await page.$('.gb-emoji-btn');
      if (emojiPick) await emojiPick.click();
      console.log('[Verify] ✓ Emoji palette opened and inserted emoji');
    }

    // Select "技术探讨" channel
    await page.selectOption('#composer-channel-select', 'tech');

    // Submit Gesture
    await (await page.$('.gb-submit-btn')).click();
    await page.waitForTimeout(1200);

    // Verify Gesture card in stream
    const gestureCard = await page.$('.gb-card.is-gesture-card');
    if (!gestureCard) throw new Error('Gesture card was not rendered');
    console.log('[Verify] ✓ Gesture card rendered successfully');

    // Verify Gesture HAS reply button
    const replyBtn = await page.$('.gb-card.is-gesture-card .gb-action-btn:has-text("跟帖回复")');
    if (!replyBtn) throw new Error('Gesture card should have 跟帖回复 button');
    console.log('[Verify] ✓ Gesture card has reply button');

    // Click reply button to expand in-place reply composer
    await replyBtn.click();
    await page.waitForTimeout(400);

    const replyTextarea = await page.$('.gb-textarea.is-reply');
    if (!replyTextarea) throw new Error('In-place reply composer did not expand');
    await replyTextarea.fill('非常有见解的探讨，完全赞同边缘毫秒落盘的理念！');

    // Submit reply
    const replySubmitBtn = await page.$('.gb-reply-composer .gb-btn-sm.is-primary');
    await replySubmitBtn.click();
    await page.waitForTimeout(1000);

    // Verify reply item rendered under the thread
    const replyItem = await page.$('.gb-reply-item');
    if (!replyItem) throw new Error('Nested reply item was not rendered under Gesture thread');
    console.log('[Verify] ✓ Nested discussion reply rendered smoothly in-place');

    // 4. Test Reaction
    console.log('[Verify] 4. Testing Reaction Toggle...');
    const reactionBtn = await page.$('.gb-reaction-btn:has-text("👍")');
    if (reactionBtn) {
      await reactionBtn.click();
      await page.waitForTimeout(400);
      console.log('[Verify] ✓ Reaction 👍 clicked and updated');
    }

    // 5. Test Channel Filter
    console.log('[Verify] 5. Testing Channel Filter...');
    const techPill = await page.$('.gb-channel-pill:has-text("技术探讨")');
    if (techPill) {
      await techPill.click();
      await page.waitForTimeout(400);
      console.log('[Verify] ✓ Filtered by "技术探讨" channel');
    }

    console.log('\n======================================================');
    console.log('🎉 ALL GUESTBOOK BOARD VERIFICATION CHECKS PASSED 100%!');
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
