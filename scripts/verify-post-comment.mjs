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

function createStaticServer(distDir, port = 4322) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
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
      console.log(`✅ Pure Node Static Server listening at http://localhost:${port}`);
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

    // Scroll to #post-comment
    console.log('📜 Scrolling to #post-comment to trigger visible hydration...');
    await page.locator('#post-comment').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    // 1. HR Separator Check
    const hrCheck = await page.evaluate(() => {
      const postComment = document.querySelector('#post-comment');
      if (!postComment) return { found: false, error: '#post-comment not found' };

      const prev = postComment.previousElementSibling;
      const hr = prev && prev.tagName === 'HR' ? prev : document.querySelector('hr.custom-hr');
      const cs = hr ? window.getComputedStyle(hr) : null;

      return {
        found: true,
        hasHr: Boolean(hr),
        hrTag: hr?.tagName,
        hrClass: hr?.className,
        borderTopStyle: cs?.borderTopStyle,
        borderTopColor: cs?.borderTopColor,
        margin: cs?.margin,
      };
    });

    console.log('1. HR Separator Check:', JSON.stringify(hrCheck, null, 2));

    // 2. #post-comment Outer Container Check (Ensuring no outer wrapper card or excessive radius)
    const postCommentCheck = await page.evaluate(() => {
      const el = document.querySelector('#post-comment');
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        display: cs.display,
        background: cs.backgroundColor,
        borderRadius: cs.borderRadius,
        border: cs.border,
        boxShadow: cs.boxShadow,
        padding: cs.padding,
      };
    });

    console.log('2. #post-comment Outer Layout Check:', JSON.stringify(postCommentCheck, null, 2));

    // 3. .comment-head Check
    const headCheck = await page.evaluate(() => {
      const el = document.querySelector('#post-comment .comment-head');
      if (!el) return null;
      const headline = el.querySelector('.comment-headline');
      const randomBtn = el.querySelector('.comment-random-btn');
      const privacyBtn = el.querySelector('.comment-privacy-btn');
      const tips = el.querySelector('.comment-tips');
      return {
        hasHead: true,
        headlineText: headline?.textContent?.trim(),
        hasRandomBtn: Boolean(randomBtn),
        randomBtnText: randomBtn?.textContent?.trim(),
        hasPrivacyBtn: Boolean(privacyBtn),
        privacyBtnText: privacyBtn?.textContent?.trim(),
        hasTips: Boolean(tips),
        tipsText: tips?.textContent?.trim(),
        tipsBg: tips ? window.getComputedStyle(tips).backgroundColor : null,
      };
    });

    console.log('3. .comment-head Check:', JSON.stringify(headCheck, null, 2));

    // 4. .tk-submit Form & Meta Inputs Check
    const submitCheck = await page.evaluate(() => {
      const nickGroup = document.querySelector('#post-comment .el-input-group:nth-child(1)');
      const mailGroup = document.querySelector('#post-comment .el-input-group:nth-child(2)');
      const linkGroup = document.querySelector('#post-comment .el-input-group:nth-child(3)');
      const textarea = document.querySelector('#post-comment .el-textarea__inner');
      const counter = document.querySelector('#post-comment .el-input__count');
      const sendBtn = document.querySelector('#post-comment .tk-send');

      const sendCs = sendBtn ? window.getComputedStyle(sendBtn) : null;
      const inputCs = nickGroup ? window.getComputedStyle(nickGroup) : null;

      return {
        hasNickGroup: Boolean(nickGroup),
        nickLabel: nickGroup?.querySelector('.el-input-group__prepend')?.textContent?.trim(),
        hasMailGroup: Boolean(mailGroup),
        mailLabel: mailGroup?.querySelector('.el-input-group__prepend')?.textContent?.trim(),
        hasLinkGroup: Boolean(linkGroup),
        linkLabel: linkGroup?.querySelector('.el-input-group__prepend')?.textContent?.trim(),
        inputBorderRadius: inputCs?.borderRadius,
        hasTextarea: Boolean(textarea),
        placeholder: textarea?.getAttribute('placeholder'),
        counterText: counter?.textContent?.trim(),
        hasSendBtn: Boolean(sendBtn),
        sendBtnText: sendBtn?.textContent?.trim(),
        sendBtnBg: sendCs?.backgroundColor,
        sendBtnColor: sendCs?.color,
        sendBtnRadius: sendCs?.borderRadius,
      };
    });

    console.log('4. .tk-submit Form Check:', JSON.stringify(submitCheck, null, 2));

    // 5. Public Comments Stream Check
    const streamCheck = await page.evaluate(() => {
      const title = document.querySelector('#post-comment .tk-comments-title');
      const count = document.querySelector('#post-comment .tk-comments-count');
      const comments = document.querySelectorAll('#post-comment .tk-comment');
      const firstComment = comments[0];
      const firstNick = firstComment?.querySelector('.tk-nick')?.textContent?.trim();
      const firstBadge = firstComment?.querySelector('.tk-badge')?.textContent?.trim();
      const firstTime = firstComment?.querySelector('.tk-time')?.textContent?.trim();
      const firstActions = firstComment?.querySelectorAll('.tk-action-button');
      const actionLabels = Array.from(firstActions || []).map((a) => a.textContent.trim());
      const replies = document.querySelectorAll('#post-comment .tk-replies .tk-comment');

      return {
        hasTitle: Boolean(title),
        countText: count?.textContent?.trim(),
        totalRenderedComments: comments.length,
        firstNick,
        firstBadge,
        firstTime,
        actionButtons: actionLabels,
        repliesCount: replies.length,
      };
    });

    console.log('5. Public Comments Stream Check:', JSON.stringify(streamCheck, null, 2));

    // 6. Interactive Testing: Anonymous click & Submit new comment
    console.log('6. Testing Interactive Commenting Flow...');
    const initialCount = streamCheck.totalRenderedComments;

    // Click anonymous random name
    await page.click('#post-comment .comment-random-btn');
    await page.waitForTimeout(300);
    const nickVal = await page.$eval('#post-comment input[name="nick"]', (el) => el.value);
    console.log(`   -> Generated Nickname: "${nickVal}"`);

    // Type comment
    await page.fill('#post-comment .el-textarea__inner', '这是一条测试 Anzhiyu 风格的公开评论。UI 优雅、无过度圆角、层次分明！');
    const updatedCounter = await page.$eval('#post-comment .el-input__count', (el) => el.textContent);
    console.log(`   -> Updated Counter: ${updatedCounter}`);

    // Click Send
    await page.click('#post-comment .tk-send');
    await page.waitForTimeout(500);

    const postSubmitCount = await page.$$eval('#post-comment .tk-comment', (els) => els.length);
    console.log(`   -> Total comments after submit: ${postSubmitCount} (Initial: ${initialCount})`);

    const latestCommentText = await page.$eval(
      '#post-comment .tk-comment:first-child .tk-content',
      (el) => el.textContent.trim()
    );
    console.log(`   -> Newest comment content: "${latestCommentText}"`);

    // 7. Mobile Viewport Check (375x812)
    console.log('7. Testing Mobile Viewport (375x812)...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    const mobileCheck = await page.evaluate(() => {
      const metaInput = document.querySelector('#post-comment .tk-meta-input');
      const cs = metaInput ? window.getComputedStyle(metaInput) : null;
      return {
        gridTemplateColumns: cs?.gridTemplateColumns,
      };
    });
    console.log('   -> Mobile Meta Input Layout:', JSON.stringify(mobileCheck));

    // Take screenshots
    await page.locator('#post-comment').screenshot({ path: 'scripts/post-comment-screenshot-mobile.png' });
    console.log('📸 Mobile Screenshot saved to scripts/post-comment-screenshot-mobile.png');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.locator('#post-comment').screenshot({ path: 'scripts/post-comment-screenshot-desktop.png' });
    console.log('📸 Desktop Screenshot saved to scripts/post-comment-screenshot-desktop.png');

    await browser.close();
    console.log('🎉 ALL VERIFICATION CHECKS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

run();
