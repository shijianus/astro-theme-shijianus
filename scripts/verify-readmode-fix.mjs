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

async function verifyReadModeFix() {
  const port = 4377;
  const distDir = path.resolve('./dist');
  const server = await createStaticServer(distDir, port);

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const viewports = [
      { name: 'Desktop (1440x900)', width: 1440, height: 900 },
      { name: 'Standard (1280x800)', width: 1280, height: 800 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile (375x667)', width: 375, height: 667 }
    ];

    for (const vp of viewports) {
      console.log(`\n======================================================`);
      console.log(`Auditing Read Mode Button in Viewport: ${vp.name}`);
      console.log(`======================================================`);

      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:${port}/posts/hello-world/`, { waitUntil: 'networkidle2' });

      // Check button existence and title
      const readmodeTitle = await page.evaluate(() => {
        const btn = document.querySelector('#rightside-config-hide #readmode');
        return btn ? btn.getAttribute('title') : null;
      });
      console.log(`Read Mode button found with title: "${readmodeTitle}"`);
      if (!readmodeTitle || !readmodeTitle.includes('阅读模式')) {
        throw new Error(`Expected Read Mode button with title containing "阅读模式", got: ${readmodeTitle}`);
      }

      // Open rightside config hide panel
      await page.click('#rightside-config');
      await new Promise(r => setTimeout(r, 400));

      const hideMetrics = await page.evaluate(() => {
        const hide = document.querySelector('#rightside-config-hide');
        const style = window.getComputedStyle(hide);
        return {
          hasShow: hide.classList.contains('show'),
          overflow: style.overflow,
          maxHeight: style.maxHeight,
          pointerEvents: style.pointerEvents
        };
      });

      console.log('Expanded #rightside-config-hide metrics:', hideMetrics);
      if (!hideMetrics.hasShow) {
        throw new Error('#rightside-config-hide failed to get .show class');
      }
      if (hideMetrics.overflow !== 'visible') {
        throw new Error(`Expected overflow to be "visible", got: ${hideMetrics.overflow}`);
      }
      if (hideMetrics.pointerEvents !== 'auto') {
        throw new Error(`Expected pointerEvents to be "auto", got: ${hideMetrics.pointerEvents}`);
      }

      // Hover over #readmode and check that it's NOT truncated
      await page.hover('#readmode');
      await new Promise(r => setTimeout(r, 250));

      const hoverMetrics = await page.evaluate(() => {
        const hide = document.querySelector('#rightside-config-hide');
        const readmode = document.querySelector('#readmode');
        const hr = hide.getBoundingClientRect();
        const rr = readmode.getBoundingClientRect();
        const rStyle = window.getComputedStyle(readmode);
        return {
          readmodeTop: rr.top,
          hideTop: hr.top,
          diffTop: rr.top - hr.top,
          transform: rStyle.transform,
          zIndex: rStyle.zIndex,
          boxShadow: rStyle.boxShadow
        };
      });

      console.log('Hover metrics on #readmode:', hoverMetrics);
      if (hoverMetrics.diffTop < 0) {
        throw new Error(`Button truncated! readmode.top is above hide.top by ${Math.abs(hoverMetrics.diffTop)}px`);
      }
      if (hoverMetrics.transform === 'none') {
        throw new Error('Expected hover transform on #readmode');
      }

      // Click to toggle read mode
      await page.click('#readmode');
      await new Promise(r => setTimeout(r, 400));

      const activeMetrics = await page.evaluate(() => {
        const readmode = document.querySelector('#readmode');
        const rStyle = window.getComputedStyle(readmode);
        return {
          isReadModeData: document.documentElement.dataset.readmode === 'true',
          hasActiveClass: readmode.classList.contains('is-active'),
          boxShadow: rStyle.boxShadow
        };
      });

      console.log('Active Read Mode metrics:', activeMetrics);
      if (!activeMetrics.isReadModeData || !activeMetrics.hasActiveClass) {
        throw new Error('Failed to enter Read Mode or activate #readmode button');
      }

      // Check hover while active
      await page.hover('#readmode');
      await new Promise(r => setTimeout(r, 250));

      const activeHoverMetrics = await page.evaluate(() => {
        const hide = document.querySelector('#rightside-config-hide');
        const readmode = document.querySelector('#readmode');
        const hr = hide.getBoundingClientRect();
        const rr = readmode.getBoundingClientRect();
        return {
          diffTop: rr.top - hr.top
        };
      });

      console.log('Active hover diffTop:', activeHoverMetrics.diffTop);
      if (activeHoverMetrics.diffTop < 0) {
        throw new Error(`Active button truncated on hover! diffTop: ${activeHoverMetrics.diffTop}`);
      }

      // Dark Mode test
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await new Promise(r => setTimeout(r, 200));

      const darkModeMetrics = await page.evaluate(() => {
        const readmode = document.querySelector('#readmode');
        const hide = document.querySelector('#rightside-config-hide');
        const hr = hide.getBoundingClientRect();
        const rr = readmode.getBoundingClientRect();
        return {
          diffTop: rr.top - hr.top,
          color: window.getComputedStyle(readmode).color
        };
      });

      console.log('Dark mode metrics:', darkModeMetrics);
      if (darkModeMetrics.diffTop < 0) {
        throw new Error('Dark mode button truncated!');
      }

      console.log(`✅ Viewport ${vp.name} PASSED 100%!`);
      await page.close();
    }

    console.log('\n======================================================');
    console.log('🎉 ALL TESTS PASSED! Read Mode Button truncation fixed perfectly!');
    console.log('======================================================\n');

    await browser.close();
  } finally {
    server.close();
  }
}

verifyReadModeFix().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
