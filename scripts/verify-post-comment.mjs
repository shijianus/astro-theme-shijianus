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

function createStaticServer(distDir, port = 4322) {
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
            const action = payload.action || 'create';

            if (action === 'create') {
              const rawMessage = (payload.message || '').trim();
              const postType = payload.postType || 'comment';

              // Duplicate check
              const hasDup = Array.from(testCommentsDb.values()).some(
                (c) => c.authorRole === 'visitor' && c.message === rawMessage && c.status !== 'deleted'
              );
              if (hasDup) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: '请勿在1小时内重复发表完全相同的评论内容' }));
                return;
              }

              if (postType === 'boost' && rawMessage.length > 16) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: '⚡ Boost 动态内容不能超过 16 个字' }));
                return;
              }

              const id = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              const sessionToken = payload.sessionToken || `st_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
              const newComment = {
                id,
                postSlug: payload.slug,
                parentId: payload.parentId || null,
                quoteId: payload.quoteId || null,
                quote: payload.quote || null,
                postType,
                authorId: payload.authorId || `vis_${Date.now()}`,
                authorName: payload.authorName || '访客',
                authorAvatar: payload.authorAvatar || '',
                authorWebsite: payload.authorWebsite || '',
                authorRole: payload.authorRole || 'visitor',
                message: rawMessage,
                likesCount: 0,
                status: 'published',
                createdAt: new Date().toISOString(),
                sessionToken,
                showLocation: true,
                ipCountry: 'CN',
                ipCountryName: '中国',
                ipCountryFlag: '🇨🇳',
                ipLocation: '中国',
              };
              testCommentsDb.set(id, newComment);
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: true, comment: newComment, sessionToken }));
              return;
            }

            if (action === 'edit') {
              const item = testCommentsDb.get(payload.id);
              if (!item) {
                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: 'Not found' }));
                return;
              }
              item.message = payload.message;
              item.updatedAt = new Date().toISOString();
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: true, message: 'Updated' }));
              return;
            }

            if (action === 'delete') {
              const item = testCommentsDb.get(payload.id);
              if (item) item.status = 'deleted';
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: true, message: 'Deleted' }));
              return;
            }

            if (action === 'like') {
              const item = testCommentsDb.get(payload.id);
              if (item) item.likesCount = (item.likesCount || 0) + 1;
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: true, likesCount: item?.likesCount || 1 }));
              return;
            }
          });
          return;
        }
      }

      let filePath = path.join(distDir, reqPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath)) {
        filePath = path.join(distDir, '404.html');
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
    });

    server.listen(port, () => {
      console.log(`✅ Static Test Server listening at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function run() {
  const distDir = path.resolve('dist');
  const server = await createStaticServer(distDir, 4322);

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    console.log('🔍 Visiting /posts/readable-geek-interfaces/...');
    await page.goto('http://localhost:4322/posts/readable-geek-interfaces/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('📜 Scrolling to #post-comment...');
    await page.locator('#post-comment').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    // 1. Redundant elements removal check
    const redundantCheck = await page.evaluate(() => {
      const tips = document.querySelector('#post-comment .comment-tips');
      const identity = document.querySelector('#post-comment .tk-user-identity');
      const actionsStart = document.querySelector('#post-comment .tk-row-actions-start');
      return {
        hasTips: Boolean(tips),
        hasIdentity: Boolean(identity),
        hasActionsStart: Boolean(actionsStart),
      };
    });
    console.log('1. Redundant Elements Removal Check (all should be false):', JSON.stringify(redundantCheck, null, 2));
    if (redundantCheck.hasTips || redundantCheck.hasIdentity || redundantCheck.hasActionsStart) {
      throw new Error('Redundant tips, user-identity, or actions-start still found in DOM!');
    }

    // 2. Linuxdo Interaction Modes Tabs Check
    const modeTabsCheck = await page.evaluate(() => {
      const tabs = document.querySelectorAll('#post-comment .tk-mode-btn');
      return Array.from(tabs).map((t) => t.textContent.trim());
    });
    console.log('2. Linuxdo Mode Tabs:', modeTabsCheck);

    // 3. Post a Standard Comment
    console.log('3. Submitting Standard Comment...');
    await page.fill('#post-comment .el-textarea__inner', '这是一条标准的深度公开长评。');
    await page.click('#post-comment .tk-send');
    await page.waitForTimeout(600);

    // 4. Post a ⚡ Boost Comment (<= 16 chars)
    console.log('4. Submitting Linuxdo-style ⚡ Boost Comment...');
    await page.click('#post-comment .tk-mode-btn:has-text("Boost")');
    await page.waitForTimeout(300);
    await page.fill('#post-comment .el-textarea__inner', '⚡ 极客美学大赞！');
    await page.click('#post-comment .tk-send');
    await page.waitForTimeout(600);

    // 5. Post a Quick Emoji Reaction
    console.log('5. Submitting Linuxdo-style Emoji Reaction...');
    await page.click('#post-comment .tk-mode-btn:has-text("表情")');
    await page.waitForTimeout(300);
    await page.click('#post-comment .tk-quick-emoji-btn:has-text("🔥")');
    await page.waitForTimeout(600);

    // 6. Verify Comments List & Geo Flag Badges
    const streamCheck = await page.evaluate(() => {
      const items = document.querySelectorAll('#post-comment .tk-comment');
      const commentsData = Array.from(items).map((el) => ({
        nick: el.querySelector('.tk-nick')?.textContent?.trim(),
        badge: el.querySelector('.tk-badge')?.textContent?.trim(),
        geo: el.querySelector('.tk-geo-badge')?.textContent?.trim(),
        isBoost: Boolean(el.querySelector('.tk-boost-pill')),
        content: el.querySelector('.tk-content')?.textContent?.trim(),
      }));
      return commentsData;
    });
    console.log('6. Stream Items with Geo & Boost:', JSON.stringify(streamCheck, null, 2));
    if (streamCheck.length < 3) {
      throw new Error(`Expected at least 3 comments, got ${streamCheck.length}`);
    }
    const hasBoostPill = streamCheck.some((c) => c.isBoost);
    const hasGeoFlag = streamCheck.every((c) => Boolean(c.geo));
    if (!hasBoostPill || !hasGeoFlag) {
      throw new Error('Boost pill or Geo Flag badge missing on visitor comments!');
    }

    // 7. Test Duplicate Comment Prevention
    console.log('7. Testing Duplicate Comment Prevention for Visitors...');
    await page.click('#post-comment .tk-mode-btn:has-text("评论")');
    await page.waitForTimeout(300);
    await page.fill('#post-comment .el-textarea__inner', '这是一条标准的深度公开长评。'); // identical to item 1
    await page.click('#post-comment .tk-send');
    await page.waitForTimeout(600);

    const toastError = await page.evaluate(() => {
      const toast = document.querySelector('#post-comment .tk-global-toast.is-error');
      return toast?.textContent?.trim();
    });
    console.log('   -> Duplicate Rejection Toast:', toastError);
    if (!toastError || !toastError.includes('重复')) {
      throw new Error('Duplicate comment was not properly rejected!');
    }

    // 8. Test Quoted Reply
    console.log('8. Testing Quoted Reply Flow...');
    await page.locator('#post-comment .tk-action-quote').first().click();
    await page.waitForTimeout(400);

    const quotePreview = await page.evaluate(() => {
      const card = document.querySelector('#post-comment .tk-quote-preview-card');
      return card?.textContent?.trim();
    });
    console.log('   -> Quote Preview Card in Input:', quotePreview);
    if (!quotePreview) {
      throw new Error('Quote preview card did not appear!');
    }

    await page.fill('#post-comment .el-textarea__inner', '针对上面观点的补充讨论。');
    await page.click('#post-comment .tk-send');
    await page.waitForTimeout(600);

    const quotedCommentInStream = await page.evaluate(() => {
      const card = document.querySelector('#post-comment .tk-quote-display-card');
      return card?.textContent?.trim();
    });
    console.log('   -> Rendered Quoted Card in Stream:', quotedCommentInStream);
    if (!quotedCommentInStream) {
      throw new Error('Quoted card did not render in comment stream!');
    }

    // 9. Screenshots
    console.log('9. Taking Screenshots for Verification...');
    await page.evaluate(() => {
      const header = document.querySelector('#page-header');
      if (header) header.style.display = 'none';
      const pagination = document.querySelector('.pagination-post');
      if (pagination) pagination.style.display = 'none';
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.locator('#post-comment').screenshot({ path: 'scripts/post-comment-screenshot-mobile.png' });
    console.log('📸 Mobile Screenshot saved to scripts/post-comment-screenshot-mobile.png');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.locator('#post-comment').screenshot({ path: 'scripts/post-comment-screenshot-desktop.png' });
    console.log('📸 Desktop Screenshot saved to scripts/post-comment-screenshot-desktop.png');

    await browser.close();
    console.log('🎉 ALL ADVANCED INTERACTION & IP CHECKS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

run();
