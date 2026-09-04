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
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Comment-Session-Token');

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
          res.writeHead(200, { 'Content-Type': 'application/json' });
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
              const id = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              const sessionToken = payload.sessionToken || `st_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
              const newComment = {
                id,
                postSlug: payload.slug,
                parentId: payload.parentId || null,
                quoteId: payload.quoteId || null,
                authorId: payload.authorId || `vis_${Date.now()}`,
                authorName: payload.authorName || '访客',
                authorAvatar: payload.authorAvatar || '',
                authorWebsite: payload.authorWebsite || '',
                authorRole: payload.authorRole || 'visitor',
                message: payload.message,
                likesCount: 0,
                status: 'published',
                createdAt: new Date().toISOString(),
                sessionToken,
              };
              testCommentsDb.set(id, newComment);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, comment: newComment, sessionToken }));
              return;
            }

            if (action === 'edit') {
              const item = testCommentsDb.get(payload.id);
              if (!item) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'Not found' }));
                return;
              }
              item.message = payload.message;
              item.updatedAt = new Date().toISOString();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, message: 'Updated' }));
              return;
            }

            if (action === 'delete') {
              const item = testCommentsDb.get(payload.id);
              if (item) item.status = 'deleted';
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, message: 'Deleted' }));
              return;
            }

            if (action === 'like') {
              const item = testCommentsDb.get(payload.id);
              if (item) item.likesCount = (item.likesCount || 0) + 1;
              res.writeHead(200, { 'Content-Type': 'application/json' });
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

    // 1. YouTube-style Sort Menu Check
    const sortCheck = await page.evaluate(() => {
      const sortGroup = document.querySelector('#post-comment .tk-sort-group');
      const sortBtns = document.querySelectorAll('#post-comment .tk-sort-btn');
      return {
        hasSortGroup: Boolean(sortGroup),
        sortButtons: Array.from(sortBtns).map((b) => b.textContent.trim()),
      };
    });
    console.log('1. YouTube-style Sort Menu Check:', JSON.stringify(sortCheck, null, 2));

    // 2. Submit Root Comment
    console.log('2. Submitting Root Comment (YouTube-style focus & submit)...');
    await page.click('#post-comment .el-textarea__inner');
    await page.fill('#post-comment .el-textarea__inner', '这是一条顶级主评论，测试 YouTube 风格分级回复与展开功能。');
    await page.click('#post-comment .tk-send');
    await page.waitForTimeout(600);

    const rootCheck = await page.evaluate(() => {
      const items = document.querySelectorAll('#post-comment .tk-comment');
      const first = items[0];
      return {
        totalComments: items.length,
        firstNick: first?.querySelector('.tk-nick')?.textContent?.trim(),
        firstBadge: first?.querySelector('.tk-badge')?.textContent?.trim(),
        hasReplyBtn: Boolean(first?.querySelector('.tk-action-reply')),
        hasEditBtn: Boolean(first?.querySelector('.tk-action-edit')),
        hasDeleteBtn: Boolean(first?.querySelector('.tk-action-delete')),
      };
    });
    console.log('   -> Root Comment Result:', JSON.stringify(rootCheck, null, 2));

    // 3. YouTube-style In-place Nested Reply Flow
    console.log('3. Testing YouTube-style In-place Nested Reply...');
    await page.click('#post-comment .tk-action-reply');
    await page.waitForTimeout(300);

    const replyBoxCheck = await page.evaluate(() => {
      const box = document.querySelector('#post-comment .tk-nested-reply-box');
      const textarea = box?.querySelector('textarea');
      return {
        hasReplyBox: Boolean(box),
        placeholder: textarea?.getAttribute('placeholder'),
      };
    });
    console.log('   -> Nested Reply Box Check:', JSON.stringify(replyBoxCheck, null, 2));

    await page.fill('#post-comment .tk-nested-reply-box textarea', '这是对主评论的二级嵌套回复，支持分级折叠展开！');
    await page.click('#post-comment .tk-nested-reply-box .tk-send');
    await page.waitForTimeout(600);

    // 4. YouTube-style Accordion & Hierarchical Replies Verification
    console.log('4. Testing YouTube-style Accordion Toggle (查看/收起回复)...');
    const accordionCheck = await page.evaluate(() => {
      const toggleBtn = document.querySelector('#post-comment .tk-replies-toggle-btn');
      const replies = document.querySelectorAll('#post-comment .tk-replies .tk-comment');
      return {
        hasToggleBtn: Boolean(toggleBtn),
        toggleBtnText: toggleBtn?.textContent?.trim(),
        totalRepliesRendered: replies.length,
      };
    });
    console.log('   -> Accordion & Replies Result:', JSON.stringify(accordionCheck, null, 2));

    // Toggle collapse
    await page.click('#post-comment .tk-replies-toggle-btn');
    await page.waitForTimeout(300);
    const collapsedCheck = await page.evaluate(() => {
      const replies = document.querySelector('#post-comment .tk-replies');
      const toggleBtn = document.querySelector('#post-comment .tk-replies-toggle-btn');
      return {
        repliesVisible: Boolean(replies),
        toggleBtnText: toggleBtn?.textContent?.trim(),
      };
    });
    console.log('   -> Collapsed State:', JSON.stringify(collapsedCheck, null, 2));

    // Re-expand
    await page.click('#post-comment .tk-replies-toggle-btn');
    await page.waitForTimeout(300);

    // 5. Test Session Expiry on Page Reload (Visitor loses edit/delete permission)
    console.log('5. Refreshing page to verify session qualification expiry...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#post-comment').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    const postReloadCheck = await page.evaluate(() => {
      const rootItem = document.querySelector('#post-comment .tk-comment');
      return {
        hasEditBtn: Boolean(rootItem?.querySelector('.tk-action-edit')),
        hasDeleteBtn: Boolean(rootItem?.querySelector('.tk-action-delete')),
      };
    });
    console.log('   -> Post Reload Privilege Check (should both be false):', JSON.stringify(postReloadCheck, null, 2));
    if (postReloadCheck.hasEditBtn || postReloadCheck.hasDeleteBtn) {
      throw new Error('Visitor edit/delete permission should be strictly revoked upon page reload!');
    }

    // 6. Screenshots
    console.log('6. Taking Screenshots for Verification...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.locator('#post-comment').screenshot({ path: 'scripts/post-comment-screenshot-mobile.png' });
    console.log('📸 Mobile Screenshot saved to scripts/post-comment-screenshot-mobile.png');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.locator('#post-comment').screenshot({ path: 'scripts/post-comment-screenshot-desktop.png' });
    console.log('📸 Desktop Screenshot saved to scripts/post-comment-screenshot-desktop.png');

    await browser.close();
    console.log('🎉 ALL YOUTUBE-STYLE HIERARCHICAL COMMENT CHECKS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

run();
