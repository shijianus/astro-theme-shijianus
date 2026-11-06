import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4399;
const BASE_URL = `http://localhost:${PORT}`;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'scratch/music-pocket-evidence');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.flac': 'audio/flac',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];

    if (reqUrl === '/api/music/playlist') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({
        ok: true,
        count: 1,
        tracks: [
          {
            id: 'local-way-back-home',
            name: 'Way Back Home',
            artist: 'SHAUN (숀)',
            album: 'Take',
            source: 'local',
            coverUrl: '/media/audio/covers/way_back_home.jpg',
          },
        ],
      }));
      return;
    }

    let filePath = path.join(distDir, reqUrl);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      });
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

async function verifyMusicPocketClose() {
  console.log('========================================================================');
  console.log('🎵 Verifying Music Pocket Panel Close ("叉掉") Functionality');
  console.log('========================================================================\n');

  const server = await createStaticServer(DIST_DIR, PORT);
  console.log(`[1] Preview server running on: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.toString()));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log(`[2] Visiting: ${BASE_URL}`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Ensure pocket is visible
    console.log('[3] Checking pocket container...');
    const pocket = await page.$('.shijianus-music-pocket');
    if (!pocket) throw new Error('Music pocket container not found in DOM');

    // Make visible via event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:toggle-music-pocket', { detail: { visible: true } }));
    });
    await page.waitForTimeout(500);

    // Initial check: panel should NOT be open automatically
    let panelInitial = await page.$('.shijianus-music-pocket__panel');
    console.log(`  -> Initial panel present?: ${!!panelInitial}`);
    if (panelInitial) {
      console.warn('  ⚠️ Panel was present on initial load, checking if it can be closed...');
    }

    // Click toggle button to open panel
    console.log('[4] Clicking toggle disc to open panel...');
    const toggle = await page.$('.shijianus-music-pocket__toggle');
    if (!toggle) throw new Error('Toggle disc button not found');
    await toggle.click();
    await page.waitForTimeout(600);

    const panelOpen = await page.$('.shijianus-music-pocket__panel');
    if (!panelOpen) throw new Error('Panel failed to open upon toggle click!');
    console.log('  ✓ Panel opened successfully. Class:', await panelOpen.getAttribute('class'));

    // Capture screenshot of open panel
    const shotOpen = path.join(SCREENSHOT_DIR, '01-panel-opened.png');
    await page.screenshot({ path: shotOpen });
    console.log(`  -> Screenshot saved: ${shotOpen}`);

    // Click the close button (叉掉)
    console.log('[5] Clicking close button (.shijianus-music-pocket__hud-btn--close) to close panel...');
    const closeBtn = await page.$('.shijianus-music-pocket__hud-btn--close');
    if (!closeBtn) throw new Error('Close button not found in panel!');
    await closeBtn.click();
    await page.waitForTimeout(600);

    // Verify panel is gone
    let panelAfterClose = await page.$('.shijianus-music-pocket__panel');
    console.log(`  -> Panel in DOM after close click: ${!!panelAfterClose}`);
    if (panelAfterClose) {
      throw new Error('Panel is STILL in DOM after clicking close button! Close failed!');
    }
    console.log('  ✓ Panel successfully closed upon clicking close button!');

    // Wait 2 seconds to make sure it doesn\'t re-open itself
    console.log('[6] Waiting 2 seconds to ensure no re-open feedback loop...');
    await page.waitForTimeout(2000);
    panelAfterClose = await page.$('.shijianus-music-pocket__panel');
    if (panelAfterClose) {
      throw new Error('Panel re-opened itself after being closed! Self-sync loop detected!');
    }
    console.log('  ✓ Panel stayed closed! No spurious re-open loop.');

    // Capture screenshot of closed panel (vinyl disc still present)
    const shotClosed = path.join(SCREENSHOT_DIR, '02-panel-closed.png');
    await page.screenshot({ path: shotClosed });
    console.log(`  -> Screenshot saved: ${shotClosed}`);

    // Test ESC key closing
    console.log('[7] Testing Escape key closing...');
    await toggle.click();
    await page.waitForTimeout(600);
    if (!(await page.$('.shijianus-music-pocket__panel'))) {
      throw new Error('Panel failed to re-open on second toggle click!');
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    if (await page.$('.shijianus-music-pocket__panel')) {
      throw new Error('Panel failed to close on Escape key!');
    }
    console.log('  ✓ Panel closed via Escape key successfully!');

    console.log('\n========================================================================');
    console.log('🎉 ALL PANEL CLOSE VERIFICATION TESTS PASSED!');
    console.log('========================================================================\n');
  } finally {
    await browser.close();
    server.close();
  }
}

verifyMusicPocketClose().catch((err) => {
  console.error('\n❌ VERIFICATION ERROR:', err);
  process.exit(1);
});
