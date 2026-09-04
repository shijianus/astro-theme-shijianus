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
    '.svg': 'image/svg+xml'
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
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise(resolve => server.listen(port, () => resolve(server)));
}

async function runComprehensiveTests() {
  const port = 4345;
  const distDir = path.resolve('/home/shijian/projects/shijianus-blog/dist');
  const server = await createStaticServer(distDir, port);

  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

    const viewports = [
      { name: 'Desktop Large (1440x900)', width: 1440, height: 900 },
      { name: 'Desktop Standard (1280x800)', width: 1280, height: 800 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile (375x667)', width: 375, height: 667 }
    ];

    for (const vp of viewports) {
      console.log(`\n======================================================`);
      console.log(`Auditing Viewport: ${vp.name}`);
      console.log(`======================================================`);

      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:${port}/posts/hello-world/`, { waitUntil: 'networkidle2' });

      // 1. Scroll to trigger pagination-post
      const metrics = await page.evaluate(() => {
        const c = document.getElementById('post-comment');
        const n = document.getElementById('nav');
        return {
          commentTop: c ? c.getBoundingClientRect().top + window.scrollY : 0,
          navBottom: n ? n.getBoundingClientRect().bottom : 60
        };
      });

      await page.evaluate((top) => window.scrollTo(0, top), metrics.commentTop - metrics.navBottom + 50);
      await new Promise(r => setTimeout(r, 200));

      const audit = await page.evaluate(() => {
        const rightside = document.querySelector('#rightside');
        const configShow = document.querySelector('#rightside-config-show');
        const pagination = document.querySelector('#pagination.pagination-post');
        const configBtn = document.querySelector('#rightside-config');
        const goUpBtn = document.querySelector('#go-up');
        const percentEl = document.querySelector('#percent');

        const getRect = el => el ? JSON.parse(JSON.stringify(el.getBoundingClientRect())) : null;
        const getStyle = el => el ? window.getComputedStyle(el) : null;

        const pRect = getRect(pagination);
        const rRect = getRect(rightside);
        const csRect = getRect(configShow);
        const btnStyle = getStyle(configBtn);
        const pStyle = getStyle(percentEl);

        // Check if there is collision / overlap
        let overlap = false;
        let verticalGap = null;
        if (pRect && csRect) {
          overlap = !(
            csRect.right < pRect.left ||
            csRect.left > pRect.right ||
            csRect.bottom < pRect.top ||
            csRect.top > pRect.bottom
          );
          verticalGap = pRect.top - csRect.bottom;
        }

        return {
          overlap,
          verticalGap,
          pRect,
          csRect,
          configBtnBg: btnStyle ? btnStyle.backgroundColor : null,
          configBtnColor: btnStyle ? btnStyle.color : null,
          configBtnBorderRadius: btnStyle ? btnStyle.borderRadius : null,
          percentColor: pStyle ? pStyle.color : null,
          paginationVisible: pagination ? pagination.classList.contains('is-visible') : false
        };
      });

      console.log(`Pagination is-visible: ${audit.paginationVisible}`);
      console.log(`Rightside & Pagination Overlap: ${audit.overlap} (Expected: false)`);
      console.log(`Vertical Gap between Config-Show bottom and Pagination top: ${audit.verticalGap.toFixed(1)}px (Expected: > 0)`);
      console.log(`Button Background: ${audit.configBtnBg} (Expected: rgb(66, 90, 239))`);
      console.log(`Button Text/Icon Color: ${audit.configBtnColor} (Expected: rgb(255, 255, 255))`);
      console.log(`Percent Color: ${audit.percentColor} (Expected: rgb(255, 255, 255))`);

      if (audit.overlap) {
        throw new Error(`Overlap detected on ${vp.name}!`);
      }
      if (audit.verticalGap < 0) {
        throw new Error(`Config-Show is below or overlapping Pagination top on ${vp.name}!`);
      }
      if (audit.configBtnBg !== 'rgb(66, 90, 239)') {
        throw new Error(`Button background is not blue! Got: ${audit.configBtnBg}`);
      }
      if (audit.configBtnColor !== 'rgb(255, 255, 255)') {
        throw new Error(`Button icon color is not white! Got: ${audit.configBtnColor}`);
      }

      // Test dark mode
      console.log(`Testing Dark Mode colors...`);
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await new Promise(r => setTimeout(r, 100));

      const darkAudit = await page.evaluate(() => {
        const configBtn = document.querySelector('#rightside-config');
        const btnStyle = window.getComputedStyle(configBtn);
        return {
          bg: btnStyle.backgroundColor,
          color: btnStyle.color
        };
      });

      console.log(`Dark mode button bg: ${darkAudit.bg}, color: ${darkAudit.color}`);
      if (darkAudit.bg !== 'rgb(66, 90, 239)' || darkAudit.color !== 'rgb(255, 255, 255)') {
        throw new Error(`Dark mode color check failed!`);
      }

      // Test clicking #rightside-config
      console.log('Testing #rightside-config toggle...');
      await page.click('#rightside-config');
      await new Promise(r => setTimeout(r, 200));
      const configHideShow = await page.evaluate(() => {
        const el = document.querySelector('#rightside-config-hide');
        return el ? el.classList.contains('show') : false;
      });
      console.log(`After click, #rightside-config-hide is expanded: ${configHideShow} (Expected: true)`);
      if (!configHideShow) throw new Error('#rightside-config-hide did not expand');

      await page.close();
    }

    console.log('\n======================================================');
    console.log('✅ ALL VIEWPORT & INTERACTION TESTS PASSED 100% PERFECTLY!');
    console.log('======================================================\n');

    await browser.close();
  } finally {
    server.close();
  }
}

runComprehensiveTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
