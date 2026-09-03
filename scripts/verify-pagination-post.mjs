import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';

function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.webp': 'image/webp'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(distDir, reqUrl);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function runTests() {
  const port = 4334;
  const distDir = path.resolve('/home/shijian/projects/shijianus-blog/dist');
  console.log(`Starting static server on port ${port}...`);
  const server = await createStaticServer(distDir, port);

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to /posts/hello-world/...');
    await page.goto(`http://localhost:${port}/posts/hello-world/`, { waitUntil: 'networkidle2' });

    // Verify elements exist
    const comment = await page.$('#post-comment');
    const pagination = await page.$('#pagination.pagination-post');
    if (!comment || !pagination) throw new Error('Missing #post-comment or #pagination');

    // Requirement 2: Check that .next-post-arrow does NOT exist
    const arrow = await page.$('#pagination .next-post-arrow');
    console.log(`Requirement 2 - Arrow icon present: ${Boolean(arrow)} (Expected: false)`);
    if (arrow) throw new Error('Arrow icon .next-post-arrow should NOT exist');

    // Requirement 2: Check that pagination-info exists
    const paginationInfo = await page.$('#pagination .pagination-info');
    console.log(`Requirement 2 - Pagination info present: ${Boolean(paginationInfo)} (Expected: true)`);
    if (!paginationInfo) throw new Error('Pagination info element should exist');

    // Initial state: top of page (scrollY = 0)
    let isVisible = await page.evaluate(() => document.querySelector('#pagination.pagination-post').classList.contains('is-visible'));
    console.log(`Scroll=0, is-visible: ${isVisible} (Expected: false)`);
    if (isVisible) throw new Error('Should NOT be visible at top of page');

    // Calculate metrics
    const metrics = await page.evaluate(() => {
      const c = document.getElementById('post-comment');
      const n = document.getElementById('nav');
      return {
        commentTop: c.getBoundingClientRect().top + window.scrollY,
        commentBottom: c.getBoundingClientRect().bottom + window.scrollY,
        navBottom: n ? n.getBoundingClientRect().bottom : 60
      };
    });

    // 1. Scroll 200px before #post-comment meets #nav
    await page.evaluate((top) => window.scrollTo(0, top), metrics.commentTop - metrics.navBottom - 200);
    await new Promise(r => setTimeout(r, 100));
    isVisible = await page.evaluate(() => document.querySelector('#pagination.pagination-post').classList.contains('is-visible'));
    console.log(`Requirement 1 - Before reaching #nav, is-visible: ${isVisible} (Expected: false)`);
    if (isVisible) throw new Error('Should NOT be visible before #post-comment reaches #nav');

    // 2. Scroll to when #post-comment meets #nav
    await page.evaluate((top) => window.scrollTo(0, top), metrics.commentTop - metrics.navBottom + 20);
    await new Promise(r => setTimeout(r, 100));
    isVisible = await page.evaluate(() => document.querySelector('#pagination.pagination-post').classList.contains('is-visible'));
    console.log(`Requirement 1 - When #post-comment meets #nav, is-visible: ${isVisible} (Expected: true)`);
    if (!isVisible) throw new Error('SHOULD be visible when #post-comment meets #nav');

    // Requirement 2: Check placement in bottom right corner
    const box = await pagination.boundingBox();
    console.log(`Requirement 2 - Placement check: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    if (!box || box.x < 700 || box.y < 500) {
      throw new Error('Pagination is not positioned in bottom right corner');
    }

    // 3. Scroll back UP (above #nav) - should hide
    await page.evaluate((top) => window.scrollTo(0, top), metrics.commentTop - metrics.navBottom - 200);
    await new Promise(r => setTimeout(r, 100));
    isVisible = await page.evaluate(() => document.querySelector('#pagination.pagination-post').classList.contains('is-visible'));
    console.log(`Requirement 1/3 - Scrolled back UP (below nav / out of view downwards), is-visible: ${isVisible} (Expected: false)`);
    if (isVisible) throw new Error('Should hide when scrolling back UP');

    // 4. Scroll DOWN again to #post-comment - should reappear
    await page.evaluate((top) => window.scrollTo(0, top), metrics.commentTop - metrics.navBottom + 20);
    await new Promise(r => setTimeout(r, 100));
    isVisible = await page.evaluate(() => document.querySelector('#pagination.pagination-post').classList.contains('is-visible'));
    console.log(`Requirement 1 - Scrolled DOWN again to #post-comment, is-visible: ${isVisible} (Expected: true)`);
    if (!isVisible) throw new Error('Should reappear when scrolling back DOWN to #post-comment');

    // 5. Requirement 4: Click close button
    console.log('Requirement 4 - Clicking .pagination-close...');
    await page.click('#pagination .pagination-close');
    await new Promise(r => setTimeout(r, 100));
    isVisible = await page.evaluate(() => document.querySelector('#pagination.pagination-post').classList.contains('is-visible'));
    const isDismissed = await page.evaluate(() => document.querySelector('#pagination.pagination-post').dataset.dismissed === 'true');
    console.log(`Requirement 4 - After close clicked: is-visible=${isVisible}, isDismissed=${isDismissed} (Expected: false, true)`);
    if (isVisible || !isDismissed) throw new Error('Should be dismissed and hidden after clicking close');

    // Scroll up and down while dismissed: should remain hidden
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 100));
    await page.evaluate((top) => window.scrollTo(0, top), metrics.commentTop - metrics.navBottom + 20);
    await new Promise(r => setTimeout(r, 100));
    isVisible = await page.evaluate(() => document.querySelector('#pagination.pagination-post').classList.contains('is-visible'));
    console.log(`Requirement 4 - Scrolled while dismissed, is-visible: ${isVisible} (Expected: false)`);
    if (isVisible) throw new Error('Should NOT reappear after dismissed');

    // 6. Refresh page: should reappear when scrolled to comments
    console.log('Requirement 4 - Refreshing page (F5 / reload)...');
    await page.reload({ waitUntil: 'networkidle2' });
    await page.evaluate((top) => window.scrollTo(0, top), metrics.commentTop - metrics.navBottom + 20);
    await new Promise(r => setTimeout(r, 100));
    isVisible = await page.evaluate(() => document.querySelector('#pagination.pagination-post').classList.contains('is-visible'));
    console.log(`Requirement 4 - After page reload and scrolling to comments, is-visible: ${isVisible} (Expected: true)`);
    if (!isVisible) throw new Error('Should reappear after page reload!');

    // 7. Requirement 2: Verify link navigation by clicking pagination-info
    console.log('Requirement 2 - Clicking pagination-info to verify navigation...');
    const href = await page.evaluate(() => document.querySelector('#pagination .next-post').getAttribute('href'));
    console.log(`Target href: ${href}`);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#pagination .pagination-info')
    ]);
    const currentUrl = page.url();
    console.log(`Navigated to: ${currentUrl}`);
    if (!currentUrl.includes(href)) {
      throw new Error(`Expected navigation to ${href}, got ${currentUrl}`);
    }

    console.log('\n======================================================');
    console.log('✅ ALL 4 USER REQUIREMENTS VERIFIED & PASSED PERFECTLY!');
    console.log('======================================================\n');
    await browser.close();
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
