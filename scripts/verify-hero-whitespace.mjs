import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath.endsWith('/')) {
      reqPath += 'index.html';
    } else if (!path.extname(reqPath)) {
      if (fs.existsSync(path.join(distDir, reqPath, 'index.html'))) {
        reqPath += '/index.html';
      } else if (fs.existsSync(path.join(distDir, reqPath + '.html'))) {
        reqPath += '.html';
      }
    }

    const filePath = path.join(distDir, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  const PORT = 4399;
  const distDir = path.resolve(process.cwd(), 'dist');
  const server = await createStaticServer(distDir, PORT);
  console.log(`Static server running on http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const testUrls = [
    '/standards/activity-level/',
    '/standards/content-density/',
  ];

  const screenshotsDir = path.resolve(process.cwd(), 'dist-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  for (const urlPath of testUrls) {
    const fullUrl = `http://127.0.0.1:${PORT}${urlPath}`;
    console.log(`\nTesting ${fullUrl}...`);
    await page.goto(fullUrl, { waitUntil: 'networkidle' });

    // Desktop Light
    const safeName = urlPath.replace(/\//g, '_');
    const screenshotPath = path.join(screenshotsDir, `desktop_light${safeName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot: ${screenshotPath}`);

    // Desktop Dark
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(300);
    const darkScreenshotPath = path.join(screenshotsDir, `desktop_dark${safeName}.png`);
    await page.screenshot({ path: darkScreenshotPath, fullPage: false });
    console.log(`Saved screenshot: ${darkScreenshotPath}`);

    // Reset to light
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.dataset.theme = 'light';
    });

    // Mobile Viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const mobileMetrics = await page.evaluate(() => {
      const specHeader = document.querySelector('.standards-spec-header');
      const title = document.querySelector('.standards-spec-header .post-hero__title');
      const nav = document.querySelector('#nav');
      const pageMain = document.querySelector('.page-main');
      return {
        heroHeight: specHeader ? specHeader.getBoundingClientRect().height : 0,
        titleTop: title ? title.getBoundingClientRect().top : 0,
        navBottom: nav ? nav.getBoundingClientRect().bottom : 0,
        pageMainTop: pageMain ? pageMain.getBoundingClientRect().top : 0,
      };
    });
    console.log(`Mobile metrics for ${urlPath}:`, JSON.stringify(mobileMetrics, null, 2));

    const mobileScreenshotPath = path.join(screenshotsDir, `mobile_light${safeName}.png`);
    await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
    console.log(`Saved mobile screenshot: ${mobileScreenshotPath}`);

    // Mobile Dark
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(300);
    const mobileDarkScreenshotPath = path.join(screenshotsDir, `mobile_dark${safeName}.png`);
    await page.screenshot({ path: mobileDarkScreenshotPath, fullPage: false });
    console.log(`Saved mobile dark screenshot: ${mobileDarkScreenshotPath}`);

    // Reset viewport
    await page.setViewportSize({ width: 1440, height: 900 });
  }

  await browser.close();
  server.close();
  console.log('\nAudit complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
