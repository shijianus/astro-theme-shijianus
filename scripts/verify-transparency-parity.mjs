import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const targetUrl = process.env.TEST_URL || '';
const distDir = path.resolve('dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

async function runAudit(baseUrl) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log(`[Audit] Navigating to ${baseUrl}...`);
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const auditData = await page.evaluate(() => {
      const getStyles = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return { sel, exists: false };
        const cs = window.getComputedStyle(el);
        return {
          sel,
          exists: true,
          tagName: el.tagName,
          className: el.className,
          bg: cs.backgroundColor,
          bgImg: cs.backgroundImage,
          filter: cs.backdropFilter || cs.webkitBackdropFilter,
          border: cs.border,
          boxShadow: cs.boxShadow
        };
      };

      return {
        footerWrap: getStyles('#footer-wrap'),
        stickyOverview: getStyles('.card-feature-panel--overview'),
        postCardInner: getStyles('.recent-post-item > div:last-child, .recent-post-info'),
        homePagination: getStyles('.home-pagination'),
        randomBanner: getStyles('#random-banner'),
        tagCloudItem: getStyles('.card-tag-cloud-panel .tag-cloud-item'),
        categoryChip: getStyles('.card-tag-cloud-panel .category-chip'),
        webinfoItem: getStyles('.card-tag-cloud-panel .webinfo-item')
      };
    });

    console.log('\n================ LIGHT MODE TRANSPARENCY AUDIT ================');
    console.log(JSON.stringify(auditData, null, 2));

    // Assertions
    const isTransparent = (val) => val === 'rgba(0, 0, 0, 0)' || val === 'transparent';
    const isNoFilter = (val) => !val || val === 'none';
    const isNoShadow = (val) => !val || val === 'none';

    // 1. Footer Wrap Baseline
    if (!isTransparent(auditData.footerWrap.bg)) throw new Error('Footer wrap background is not transparent');
    if (!isNoFilter(auditData.footerWrap.filter)) throw new Error('Footer wrap has unexpected filter');

    // 2. Sticky Overview Parity
    if (!isTransparent(auditData.stickyOverview.bg)) throw new Error('Sticky overview background is not transparent');
    if (!isNoFilter(auditData.stickyOverview.filter)) throw new Error('Sticky overview has unexpected backdrop-filter');
    if (!isNoShadow(auditData.stickyOverview.boxShadow)) throw new Error('Sticky overview has unexpected box-shadow');

    // 3. Post Card Inner Parity
    if (!isTransparent(auditData.postCardInner.bg)) throw new Error('Post card inner background is not transparent');
    if (!isNoFilter(auditData.postCardInner.filter)) throw new Error('Post card inner has unexpected backdrop-filter');

    // 4. Home Pagination Parity
    if (!isTransparent(auditData.homePagination.bg)) throw new Error('Home pagination background is not transparent');
    if (!isNoFilter(auditData.homePagination.filter)) throw new Error('Home pagination has unexpected backdrop-filter');
    if (!isNoShadow(auditData.homePagination.boxShadow)) throw new Error('Home pagination has unexpected box-shadow');

    // 5. Random Banner Parity
    if (!isTransparent(auditData.randomBanner.bg)) throw new Error('Random banner background is not transparent');
    if (!isNoFilter(auditData.randomBanner.filter)) throw new Error('Random banner has unexpected backdrop-filter');
    if (!isNoShadow(auditData.randomBanner.boxShadow)) throw new Error('Random banner has unexpected box-shadow');

    // 6. Sub-elements Parity
    if (!isTransparent(auditData.tagCloudItem.bg)) throw new Error('Tag cloud item background is not transparent');
    if (!isTransparent(auditData.categoryChip.bg)) throw new Error('Category chip background is not transparent');
    if (!isTransparent(auditData.webinfoItem.bg)) throw new Error('Webinfo item background is not transparent');

    console.log('✅ Light mode transparency parity: ALL 4 TARGETS + SUB-ELEMENTS MATCH #footer-wrap MATERIAL!');

    // Dark Mode Verification
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    const darkAudit = await page.evaluate(() => {
      const getStyles = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return { sel, exists: false };
        const cs = window.getComputedStyle(el);
        return {
          sel,
          exists: true,
          bg: cs.backgroundColor,
          filter: cs.backdropFilter || cs.webkitBackdropFilter,
          boxShadow: cs.boxShadow
        };
      };
      return {
        stickyOverview: getStyles('.card-feature-panel--overview'),
        postCardInner: getStyles('.recent-post-item > div:last-child, .recent-post-info'),
        homePagination: getStyles('.home-pagination'),
        randomBanner: getStyles('#random-banner')
      };
    });

    console.log('\n================ DARK MODE TRANSPARENCY AUDIT ================');
    console.log(JSON.stringify(darkAudit, null, 2));

    if (!isTransparent(darkAudit.stickyOverview.bg)) throw new Error('Dark mode sticky overview not transparent');
    if (!isTransparent(darkAudit.postCardInner.bg)) throw new Error('Dark mode post card inner not transparent');
    if (!isTransparent(darkAudit.homePagination.bg)) throw new Error('Dark mode home pagination not transparent');
    if (!isTransparent(darkAudit.randomBanner.bg)) throw new Error('Dark mode random banner not transparent');

    console.log('✅ Dark mode transparency parity: ALL TARGETS PASS!');
    return true;
  } finally {
    await browser.close();
  }
}

async function main() {
  if (targetUrl) {
    await runAudit(targetUrl);
    process.exit(0);
  }

  const server = http.createServer((req, res) => {
    let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(4390, async () => {
    try {
      await runAudit('http://localhost:4390/');
      console.log('\n🎉 ALL TRANSPARENCY VERIFICATION TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    } catch (err) {
      console.error('\n❌ Transparency Verification Failed:', err);
      process.exit(1);
    } finally {
      server.close();
    }
  });
}

main();
