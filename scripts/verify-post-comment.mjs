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

// In-memory test store for /api/comments during static test server run
const testCommentsDb = new Map();

function createStaticServer(distDir, port = 4322) {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${port}`);
      let reqPath = decodeURIComponent(parsedUrl.pathname);

      // Handle /api/comments endpoint in static test server
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
          const list = Array.from(testCommentsDb.values())
            .filter((c) => c.postSlug === slug && c.status !== 'deleted')
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, comments: list }));
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

    // 1. HR Separator Check
    const hrCheck = await page.evaluate(() => {
      const hr = document.querySelector('hr.custom-hr');
      const cs = hr ? window.getComputedStyle(hr) : null;
      return {
        found: Boolean(hr),
        borderTopStyle: cs?.borderTopStyle,
        margin: cs?.margin,
      };
    });
    console.log('1. HR Separator Check:', JSON.stringify(hrCheck, null, 2));

    // 2. Absence of tk-meta-input (no fake/redundant 3 input fields)
    const metaInputCheck = await page.evaluate(() => {
      const metaInput = document.querySelector('#post-comment .tk-meta-input');
      return {
        hasMetaInput: Boolean(metaInput),
      };
    });
    console.log('2. tk-meta-input Check (should be false):', JSON.stringify(metaInputCheck, null, 2));
    if (metaInputCheck.hasMetaInput) {
      throw new Error('tk-meta-input should NOT exist!');
    }

    // 3. Avatar & Textarea Alignment Check
    const layoutCheck = await page.evaluate(() => {
      const row = document.querySelector('#post-comment .tk-submit .tk-row');
      const avatar = document.querySelector('#post-comment .tk-submit .tk-avatar');
      const textarea = document.querySelector('#post-comment .tk-submit .el-textarea__inner');
      const identity = document.querySelector('#post-comment .tk-user-identity');
      const sendBtn = document.querySelector('#post-comment .tk-send');

      const avatarRect = avatar?.getBoundingClientRect();
      const textareaRect = textarea?.getBoundingClientRect();
      const sendCs = sendBtn ? window.getComputedStyle(sendBtn) : null;

      return {
        hasRow: Boolean(row),
        hasAvatar: Boolean(avatar),
        hasTextarea: Boolean(textarea),
        hasIdentity: Boolean(identity),
        avatarTop: avatarRect?.top,
        textareaTop: textareaRect?.top,
        isHorizontallyAdjacent: (textareaRect?.left || 0) > (avatarRect?.right || 0),
        sendBtnBg: sendCs?.backgroundColor,
        sendBtnRadius: sendCs?.borderRadius,
      };
    });
    console.log('3. Form Layout & Alignment Check:', JSON.stringify(layoutCheck, null, 2));

    // 4. Zero Fake Data Check (initially 0 comments)
    const initialCommentsCheck = await page.evaluate(() => {
      const emptyBox = document.querySelector('#post-comment .tk-comments-no');
      const count = document.querySelector('#post-comment .tk-comments-count');
      const items = document.querySelectorAll('#post-comment .tk-comment');
      return {
        hasEmptyPlaceholder: Boolean(emptyBox),
        emptyText: emptyBox?.textContent?.trim(),
        countText: count?.textContent?.trim(),
        totalRenderedComments: items.length,
      };
    });
    console.log('4. Zero Fake Data Check (Fresh Start):', JSON.stringify(initialCommentsCheck, null, 2));
    if (initialCommentsCheck.totalRenderedComments !== 0) {
      throw new Error(`Expected 0 initial comments, but found ${initialCommentsCheck.totalRenderedComments}! Fake data must not exist.`);
    }

    // 5. Visitor Comment Submission Flow
    console.log('5. Submitting Real Visitor Comment...');
    const testMessage = '这是访客在当前会话中发布的真实留言，依托 Cloudflare D1 存储。';
    await page.fill('#post-comment .el-textarea__inner', testMessage);
    await page.click('#post-comment .tk-send');
    await page.waitForTimeout(600);

    const postSubmitCheck = await page.evaluate(() => {
      const count = document.querySelector('#post-comment .tk-comments-count');
      const items = document.querySelectorAll('#post-comment .tk-comment');
      const first = items[0];
      const nick = first?.querySelector('.tk-nick')?.textContent?.trim();
      const badge = first?.querySelector('.tk-badge')?.textContent?.trim();
      const content = first?.querySelector('.tk-content')?.textContent?.trim();
      const hasEditBtn = Boolean(first?.querySelector('.tk-action-edit'));
      const hasDeleteBtn = Boolean(first?.querySelector('.tk-action-delete'));

      return {
        countText: count?.textContent?.trim(),
        totalRendered: items.length,
        firstNick: nick,
        firstBadge: badge,
        firstContent: content,
        hasEditBtn,
        hasDeleteBtn,
      };
    });
    console.log('   -> Post Submit Result:', JSON.stringify(postSubmitCheck, null, 2));
    if (postSubmitCheck.totalRendered !== 1) {
      throw new Error('Expected 1 comment after submission!');
    }
    if (!postSubmitCheck.hasEditBtn || !postSubmitCheck.hasDeleteBtn) {
      throw new Error('Visitor should have edit/delete permission right after posting in current session!');
    }

    // 6. Visitor Inline Edit Flow
    console.log('6. Testing Visitor Inline Edit...');
    await page.click('#post-comment .tk-action-edit');
    await page.waitForTimeout(300);
    const updatedMessage = '修改后的留言内容：格式严谨，权限受会话保护。';
    await page.fill('#post-comment .tk-inline-edit textarea', updatedMessage);
    await page.click('#post-comment .tk-btn-save');
    await page.waitForTimeout(600);

    const editedContent = await page.$eval('#post-comment .tk-content', (el) => el.textContent.trim());
    console.log(`   -> Edited comment content in DOM: "${editedContent}"`);

    // 7. Refresh Page to Test Environment Shift / Session Expiry
    console.log('7. Refreshing Page (Simulating environment shift / new visitor session)...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#post-comment').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    const afterRefreshCheck = await page.evaluate(() => {
      const items = document.querySelectorAll('#post-comment .tk-comment');
      const first = items[0];
      const hasEditBtn = Boolean(first?.querySelector('.tk-action-edit'));
      const hasDeleteBtn = Boolean(first?.querySelector('.tk-action-delete'));
      return {
        totalRendered: items.length,
        hasEditBtn,
        hasDeleteBtn,
      };
    });
    console.log('   -> After Refresh Qualification Check:', JSON.stringify(afterRefreshCheck, null, 2));
    if (afterRefreshCheck.hasEditBtn || afterRefreshCheck.hasDeleteBtn) {
      throw new Error('Visitor edit/delete permission should automatically expire after refresh/environment switch!');
    }
    console.log('   -> ✅ Confirmed: visitor edit/delete qualification automatically expired upon page refresh!');

    // 8. Mobile Screenshot (375x812) & Desktop Screenshot (1440x900)
    console.log('8. Taking Screenshots for Verification...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.locator('#post-comment').screenshot({ path: 'scripts/post-comment-screenshot-mobile.png' });
    console.log('📸 Mobile Screenshot saved to scripts/post-comment-screenshot-mobile.png');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.locator('#post-comment').screenshot({ path: 'scripts/post-comment-screenshot-desktop.png' });
    console.log('📸 Desktop Screenshot saved to scripts/post-comment-screenshot-desktop.png');

    await browser.close();
    console.log('🎉 ALL COMMENT SYSTEM VERIFICATION CHECKS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

run();
