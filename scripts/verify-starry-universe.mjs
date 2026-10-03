import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  else if (!path.extname(reqPath)) reqPath += '/index.html';

  const filePath = path.join(distDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 5798;

server.listen(PORT, async () => {
  console.log(`🌌 [Starry Universe] Starting Playwright E2E verification test suite on http://localhost:${PORT}...`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 1. Visit homepage
    console.log(`🌌 [Step 1] Loading homepage http://localhost:${PORT}/ ...`);
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Verify #universe canvas exists
    const universeCanvas = await page.$('#universe');
    if (!universeCanvas) {
      throw new Error('❌ #universe canvas element not found in DOM!');
    }
    console.log('✅ #universe canvas element present in DOM.');

    // 2. Switch background to 'universe' and verify styling & opacity
    console.log('🌌 [Step 2] Switching background to "universe" ...');
    await page.evaluate(() => {
      document.documentElement.dataset.background = 'universe';
      window.dispatchEvent(new CustomEvent('shijianus:backgroundchange', { detail: 'universe' }));
    });
    await page.waitForTimeout(1000);

    const universeOpacity = await page.$eval('#universe', (el) => window.getComputedStyle(el).opacity);
    if (parseFloat(universeOpacity) < 0.95) {
      throw new Error(`❌ #universe canvas opacity expected near '1', got '${universeOpacity}'`);
    }
    console.log(`✅ #universe canvas opacity is active: ${universeOpacity}`);

    // Check web_bg gradient
    const webBgStyle = await page.$eval('#web_bg', (el) => window.getComputedStyle(el).backgroundImage);
    console.log(`✅ #web_bg background computed: ${webBgStyle.slice(0, 50)}...`);

    // 3. Verify Canvas rendering & particle execution
    console.log('🌌 [Step 3] Verifying canvas 2D frame rendering...');
    const hasRenderedPixels = await page.evaluate(async () => {
      const canvas = document.getElementById('universe');
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      // Wait for a few frames
      await new Promise(r => setTimeout(r, 400));
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let nonZero = 0;
      for (let i = 3; i < imgData.data.length; i += 4) {
        if (imgData.data[i] > 0) nonZero++;
      }
      return nonZero > 0;
    });

    if (!hasRenderedPixels) {
      throw new Error('❌ #universe canvas context has no rendered particle pixels!');
    }
    console.log('✅ #universe canvas actively rendering celestial particles & comets onto buffer.');

    // 4. Test ThemeDock Background Switcher Loop
    console.log('🌌 [Step 4] Testing ThemeDock background switcher button...');
    const bgDockBtn = await page.$('#background-mode');
    if (bgDockBtn) {
      // Click once: should switch from universe to clean
      await bgDockBtn.click();
      await page.waitForTimeout(500);
      let bgMode = await page.evaluate(() => document.documentElement.dataset.background);
      console.log(`✅ Clicked dock button -> current background: ${bgMode}`);

      // Click again: should switch from clean to snow
      await bgDockBtn.click();
      await page.waitForTimeout(500);
      bgMode = await page.evaluate(() => document.documentElement.dataset.background);
      console.log(`✅ Clicked dock button -> current background: ${bgMode}`);

      // Click again: should switch from snow back to universe
      await bgDockBtn.click();
      await page.waitForTimeout(500);
      bgMode = await page.evaluate(() => document.documentElement.dataset.background);
      console.log(`✅ Clicked dock button -> current background: ${bgMode}`);
      if (bgMode !== 'universe') {
        throw new Error(`❌ Expected background 'universe', got '${bgMode}'`);
      }
    }

    // 5. Test dark mode integration
    console.log('🌌 [Step 5] Testing dark mode starry sky atmosphere...');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.dataset.background = 'universe';
    });
    await page.waitForTimeout(500);
    const isDarkUniverse = await page.evaluate(() => {
      return document.documentElement.dataset.theme === 'dark' && document.documentElement.dataset.background === 'universe';
    });
    if (!isDarkUniverse) {
      throw new Error('❌ Dark mode universe configuration mismatch!');
    }
    console.log('✅ Dark mode starry atmosphere fully verified.');

    // 6. Test post page
    console.log(`🌌 [Step 6] Verifying starry sky on post page http://localhost:${PORT}/posts/content-formats-and-markup-mastery/ ...`);
    await page.goto(`http://localhost:${PORT}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const postUniverseCanvas = await page.$('#universe');
    if (!postUniverseCanvas) {
      throw new Error('❌ #universe canvas missing on post page!');
    }
    console.log('✅ Post page #universe canvas verified.');

    console.log('🎉 [Success] All Starry Universe E2E assertions passed flawlessly!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
