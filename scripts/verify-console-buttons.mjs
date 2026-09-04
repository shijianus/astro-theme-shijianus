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

async function verifyAll() {
  const port = 4488;
  const distDir = path.resolve('./dist');
  const server = await createStaticServer(distDir, port);

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const viewports = [
      { name: '1080p', width: 1920, height: 1080 },
      { name: '1440x900', width: 1440, height: 900 },
      { name: '1366x768', width: 1366, height: 768 },
      { name: '1280x800', width: 1280, height: 800 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];

    let allPassed = true;

    for (const vp of viewports) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0' });

      // Wait for react hydration
      await page.waitForSelector('.nav-console-btn-shijianus, #console', { timeout: 5000 });
      await new Promise(r => setTimeout(r, 500));

      // Open console
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('shijianus:open-console'));
      });
      await new Promise(r => setTimeout(r, 600));

      const res = await page.evaluate((isMobile) => {
        const consoleEl = document.querySelector('#console');
        const cardGroup = document.querySelector('#console .console-card-group');
        const activityCard = document.querySelector('#console .console-card.activity');
        const buttonGroup = document.querySelector('#console .button-group');
        const btns = Array.from(document.querySelectorAll('#console .console-btn-item'));

        const groupRect = cardGroup ? cardGroup.getBoundingClientRect() : null;
        const actRect = activityCard ? activityCard.getBoundingClientRect() : null;
        const btnGroupRect = buttonGroup ? buttonGroup.getBoundingClientRect() : null;

        const isShow = consoleEl && consoleEl.classList.contains('show');
        const btnsCount = btns.length;
        const btnsClickable = btns.every(b => {
          const r = b.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && window.getComputedStyle(b).pointerEvents !== 'none';
        });

        let overlap = false;
        let gap = null;

        if (actRect && btnGroupRect && !isMobile) {
          overlap = (btnGroupRect.top < actRect.bottom);
          gap = btnGroupRect.top - actRect.bottom;
        }

        return {
          isShow,
          btnsCount,
          btnsClickable,
          overlap,
          gap,
          actBottom: actRect?.bottom,
          btnGroupTop: btnGroupRect?.top
        };
      }, vp.width <= 860);

      console.log(`[TEST ${vp.name} (${vp.width}x${vp.height})]`, res);

      if (!res.isShow || res.btnsCount !== 6 || !res.btnsClickable || res.overlap) {
        console.error(`FAILED on ${vp.name}!`);
        allPassed = false;
      } else {
        console.log(`PASSED on ${vp.name}: Gap = ${res.gap !== null ? res.gap.toFixed(1) + 'px' : 'mobile scroll'}`);
      }

      await page.screenshot({ path: `scratch/verify-console-${vp.name}.png` });

      // Test dark mode
      await page.evaluate(() => {
        const darkBtn = document.querySelector('#console .console-btn-item');
        if (darkBtn) darkBtn.click();
      });
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: `scratch/verify-console-${vp.name}-dark.png` });

      await page.close();
    }

    await browser.close();

    if (allPassed) {
      console.log('\n>>> ALL VIEWPORT CONSOLE BUTTON TESTS PASSED PERFECTLY! <<<');
    } else {
      throw new Error('Some viewport tests failed!');
    }
  } finally {
    server.close();
  }
}

verifyAll().catch(err => {
  console.error(err);
  process.exit(1);
});
