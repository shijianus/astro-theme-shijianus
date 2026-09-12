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
    id: 'comment-webmaster-test',
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
    message: '测试作者名片布局重构：删除站点icon按钮，网址与邮箱上移补充空缺，bio保持不动。',
    groups: ['站长团队', '核心架构师'],
    showLocation: true,
    ipCountry: 'MY',
    ipCountryName: '马来西亚',
    ipCountryFlag: '🇲🇾',
    ipLocation: 'Kuala Lumpur, Malaysia',
    likesCount: 16,
    status: 'published',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

function createStaticServer(distDir, port = 4329) {
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
      console.log(`📡 Test server running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function runVerification() {
  console.log('🚀 Starting Verification for Author Profile Popover Refactoring...\n');

  const distDir = path.resolve('dist');
  const port = 4330;
  const server = await createStaticServer(distDir, port);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  const page = await context.newPage();

  try {
    const targetUrl = `http://localhost:${port}/posts/content-formats-and-markup-mastery/`;
    console.log(`Navigating to: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Scroll to comments
    await page.waitForSelector('#post-comment', { state: 'attached', timeout: 8000 });
    await page.evaluate(() => {
      document.querySelector('#post-comment')?.scrollIntoView({ behavior: 'instant' });
    });

    // Wait for comment list to render
    await page.waitForSelector('.tk-comment', { timeout: 8000 });
    console.log('✓ Comment rendered successfully');

    // Click author avatar to open pinned popover
    const avatar = await page.$('.tk-comment .tk-avatar');
    if (!avatar) throw new Error('Could not find comment avatar');
    await avatar.click();

    await page.waitForSelector('.author-profile-popover', { state: 'visible', timeout: 5000 });
    console.log('✓ Popover opened successfully');

    // Audit 1: Verify target class includes is-pinned and is-webmaster-card
    const popoverClasses = await page.$eval('.author-profile-popover', (el) => el.className);
    console.log('   -> Popover className:', popoverClasses);
    if (!popoverClasses.includes('is-pinned')) {
      throw new Error(`Expected popover to have 'is-pinned', got: ${popoverClasses}`);
    }
    if (!popoverClasses.includes('is-webmaster-card')) {
      throw new Error(`Expected popover to have 'is-webmaster-card', got: ${popoverClasses}`);
    }
    console.log('   ✅ 1. Target verified: class="author-profile-popover is-pinned is-webmaster-card"');

    // Audit 2: Verify .profile-popover-action-icon-btn is DELETED
    const actionIconBtnCount = await page.$$eval('.profile-popover-action-icon-btn', (els) => els.length);
    console.log('   -> .profile-popover-action-icon-btn count in DOM:', actionIconBtnCount);
    if (actionIconBtnCount !== 0) {
      throw new Error(`Expected 0 .profile-popover-action-icon-btn elements, found: ${actionIconBtnCount}`);
    }
    console.log('   ✅ 2. class="profile-popover-action-icon-btn" button is completely deleted.');

    // Audit 3: Verify bio element stays in place (.profile-popover-bio)
    const bioInfo = await page.evaluate(() => {
      const bioEl = document.querySelector('.profile-popover-bio');
      const topEl = document.querySelector('.profile-popover-top');
      const statsEl = document.querySelector('.profile-popover-inline-stats');

      const bioRect = bioEl?.getBoundingClientRect();
      const topRect = topEl?.getBoundingClientRect();
      const statsRect = statsEl?.getBoundingClientRect();

      return {
        exists: Boolean(bioEl),
        text: bioEl?.textContent?.trim(),
        isBelowTop: Boolean(bioRect && topRect && bioRect.top >= topRect.bottom - 2),
        isAboveStats: Boolean(bioRect && statsRect && bioRect.bottom <= statsRect.top + 2),
        topBottom: topRect?.bottom,
        bioTop: bioRect?.top,
        bioBottom: bioRect?.bottom,
        statsTop: statsRect?.top,
      };
    });
    console.log('   -> Bio placement info:', bioInfo);
    if (!bioInfo.exists) throw new Error('.profile-popover-bio not found');
    if (!bioInfo.isBelowTop) throw new Error('Expected .profile-popover-bio to be placed below .profile-popover-top');
    if (!bioInfo.isAboveStats) throw new Error('Expected .profile-popover-bio to be placed above .profile-popover-inline-stats');
    console.log('   ✅ 3. class="profile-popover-bio" remains in its proper position below .profile-popover-top.');

    // Audit 4: Verify .profile-popover-website-line and .profile-popover-email-wrap moved UP into .profile-popover-top
    const subMetaPlacement = await page.evaluate(() => {
      const topEl = document.querySelector('.profile-popover-top');
      const headerInfoEl = document.querySelector('.profile-popover-header-info');
      const subMetaEl = document.querySelector('.profile-popover-sub-meta');
      const websiteLine = document.querySelector('.profile-popover-website-line');
      const emailWrap = document.querySelector('.profile-popover-email-wrap');
      const actionsEl = document.querySelector('.profile-popover-actions.is-vertical');
      const bioEl = document.querySelector('.profile-popover-bio');

      const subMetaRect = subMetaEl?.getBoundingClientRect();
      const websiteRect = websiteLine?.getBoundingClientRect();
      const emailWrapRect = emailWrap?.getBoundingClientRect();
      const actionsRect = actionsEl?.getBoundingClientRect();
      const bioRect = bioEl?.getBoundingClientRect();

      return {
        hasHeaderInfo: Boolean(headerInfoEl),
        hasSubMeta: Boolean(subMetaEl),
        hasWebsiteLine: Boolean(websiteLine),
        hasEmailWrap: Boolean(emailWrap),
        isInsideTop: Boolean(subMetaEl && topEl && topEl.contains(subMetaEl)),
        isAboveBio: Boolean(subMetaRect && bioRect && subMetaRect.bottom <= bioRect.top + 2),
        websiteRight: websiteRect?.right,
        actionsLeft: actionsRect?.left,
        websiteInsideBounds: Boolean(websiteRect && actionsRect && websiteRect.right <= actionsRect.left + 2),
      };
    });
    console.log('   -> Sub-meta placement info:', subMetaPlacement);
    if (!subMetaPlacement.hasHeaderInfo) throw new Error('.profile-popover-header-info not found');
    if (!subMetaPlacement.hasSubMeta) throw new Error('.profile-popover-sub-meta not found');
    if (!subMetaPlacement.hasWebsiteLine) throw new Error('.profile-popover-website-line not found');
    if (!subMetaPlacement.hasEmailWrap) throw new Error('.profile-popover-email-wrap not found');
    if (!subMetaPlacement.isInsideTop) throw new Error('.profile-popover-sub-meta should be inside .profile-popover-top');
    if (!subMetaPlacement.isAboveBio) throw new Error('.profile-popover-sub-meta must be above .profile-popover-bio');
    if (!subMetaPlacement.websiteInsideBounds) {
      throw new Error(`Website line exceeded boundary: websiteRight=${subMetaPlacement.websiteRight}, actionsLeft=${subMetaPlacement.actionsLeft}`);
    }
    console.log('   ✅ 4. .profile-popover-website-line and .profile-popover-email-wrap moved UP into .profile-popover-top alongside actions.');

    // Audit 5: Collision Avoidance & Ellipsis Truncation Verification
    // Test with extra long website URL dynamically
    const truncationAudit = await page.evaluate(() => {
      const linkEl = document.querySelector('.profile-popover-website-link');
      const actionsEl = document.querySelector('.profile-popover-actions.is-vertical');
      if (!linkEl || !actionsEl) return null;

      const originalHref = linkEl.href;
      const originalText = linkEl.textContent;

      // Inject extra long URL
      linkEl.textContent = 'very-long-custom-subdomain-portfolio-and-engineering-showcase.epocanvas.com/projects/detail';

      const linkRect = linkEl.getBoundingClientRect();
      const actionsRect = actionsEl.getBoundingClientRect();
      const computed = window.getComputedStyle(linkEl);

      const overlap = linkRect.right > actionsRect.left;
      const hasEllipsis = computed.textOverflow === 'ellipsis';
      const hasOverflowHidden = computed.overflow === 'hidden';
      const hasNoWrap = computed.whiteSpace === 'nowrap';

      // Restore
      linkEl.textContent = originalText;

      return {
        linkRight: linkRect.right,
        actionsLeft: actionsRect.left,
        gap: actionsRect.left - linkRect.right,
        overlap,
        hasEllipsis,
        hasOverflowHidden,
        hasNoWrap,
      };
    });
    console.log('   -> Truncation & Collision Audit:', truncationAudit);
    if (!truncationAudit) throw new Error('Failed to run truncation audit');
    if (truncationAudit.overlap) {
      throw new Error(`Long URL collided with actions: linkRight=${truncationAudit.linkRight}, actionsLeft=${truncationAudit.actionsLeft}`);
    }
    if (!truncationAudit.hasEllipsis || !truncationAudit.hasOverflowHidden || !truncationAudit.hasNoWrap) {
      throw new Error('Expected CSS text-overflow: ellipsis, overflow: hidden, and white-space: nowrap');
    }
    console.log('   ✅ 5. Long website URL is safely truncated with "..." ellipsis, strictly avoiding .profile-popover-actions.');

    // Capture normal state screenshot
    const screenshotDir = path.resolve('scripts/audit_screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    const normalScreenshotPath = path.join(screenshotDir, 'refactored-popover-card-normal.png');
    const popoverEl = await page.$('.author-profile-popover');
    if (popoverEl) {
      await popoverEl.screenshot({ path: normalScreenshotPath });
      console.log(`   📸 Saved normal state screenshot to: ${normalScreenshotPath}`);
    }

    // Audit 6: Verify click-to-copy still works
    console.log('   -> Testing click on .profile-popover-email-wrap...');
    const emailWrap = await page.$('.profile-popover-email-wrap');
    await emailWrap.click();
    await page.waitForTimeout(200);

    const postClickState = await page.evaluate(() => {
      const wrap = document.querySelector('.profile-popover-email-wrap');
      const badge = wrap?.querySelector('.profile-popover-copied-badge')?.textContent?.trim();
      return {
        isCopiedClass: wrap?.classList.contains('is-copied'),
        badge,
      };
    });
    console.log('   -> Post-click wrap state:', postClickState);
    if (!postClickState.isCopiedClass || postClickState.badge !== '已复制') {
      throw new Error('Expected .profile-popover-email-wrap to show is-copied class and "已复制" badge');
    }
    console.log('   ✅ 6. Email wrap click-to-copy works with "已复制" badge and copy animation.');

    // Audit 7: Capture high-resolution screenshot in copied state
    const screenshotPath = path.join(screenshotDir, 'refactored-popover-card.png');
    if (popoverEl) {
      await popoverEl.screenshot({ path: screenshotPath });
      console.log(`   📸 Saved copied state screenshot to: ${screenshotPath}`);
    }

    console.log('\n🎉 ALL 7 VERIFICATION CRITERIA PASSED FLAWLESSLY!\n');
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
